// backend/routes/admin.js
import { Hono } from 'hono'
import { getAdmin } from '../firebase/admin.js'

const router = new Hono()

// ── Health / status ───────────────────────────────────────────────────────────
router.get('/status', (c) => {
  return c.json({
    service: 'traxelon-admin-backend',
    version: '1.4.0 (Cloudflare Native)',
    ts: new Date().toISOString(),
  })
})

// ── GET /api/admin/users ──────────────────────────────────────────────────────
router.get('/users', async (c) => {
  try {
    const admin = getAdmin(c.env)
    const db = admin.firestore()
    
    // Simplification: Fetch all for agora, slice for paging.
    // Real REST pagination uses StructuredQuery but this is faster for small collections.
    const snap = await db.collection('users').get()
    const data = snap.docs.map(d => ({ uid: d.id, ...d.data() }))
    
    data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    return c.json(data.slice(0, 50)) 
  } catch (err) {
    console.error('[admin/users]', err.message)
    return c.json({ error: err.message }, 500)
  }
})

// ── GET /api/admin/links ──────────────────────────────────────────────────────
// Helper: normalise a single capture object coming from Firestore REST
function normaliseCapture(cap) {
  if (!cap || typeof cap !== 'object') return cap
  // Normalise timestamp: prefer capturedAt, fall back to time (ms epoch)
  let capturedAt = cap.capturedAt
  if (!capturedAt && cap.time) {
    // time may be stored as ms integer — convert to ISO string
    const ms = typeof cap.time === 'number' ? cap.time : parseInt(cap.time, 10)
    if (!isNaN(ms)) capturedAt = new Date(ms).toISOString()
  }
  return { ...cap, capturedAt }
}

router.get('/links', async (c) => {
  try {
    const admin = getAdmin(c.env)
    const db = admin.firestore()
    
    const snap = await db.collection('trackingLinks').get()
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    
    data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    const paged = data.slice(0, 50)

    // Enrich with creator info
    const uids = [...new Set(paged.map(l => l.uid).filter(Boolean))]
    const userMap = {}
    if (uids.length > 0) {
      await Promise.all(
        uids.map(async uid => {
          try {
            const u = await db.collection('users').doc(uid).get()
            const userData = u.data()
            userMap[uid] = { 
                creatorName: userData.displayName || userData.email || uid, 
                creatorEmail: userData.email || '' 
            }
          } catch (_) {}
        })
      )
    }

    const enriched = await Promise.all(paged.map(async l => {
      const linkId = l.id
      const creatorInfo = (l.uid && userMap[l.uid]) ? userMap[l.uid] : {}
      
      // 1. Prioritize array field 'captures' from document data
      let captures = Array.isArray(l.captures) ? l.captures.map(normaliseCapture) : []
      
      // 2. Fallback: Fetch captures sub-collection if array is empty
      if (captures.length === 0) {
        try {
          const capsSnap = await db.collection('trackingLinks').doc(linkId).collection('captures').get()
          const subCaps = capsSnap.docs.map(d => normaliseCapture({ id: d.id, ...d.data() }))
          captures = [...captures, ...subCaps]
        } catch (err) {
          console.warn(`[admin/links] Failed to fetch captures sub-collection for ${linkId}:`, err.message)
        }
      }

      captures.sort((a, b) => {
        const dateA = new Date(a.capturedAt || 0).getTime()
        const dateB = new Date(b.capturedAt || 0).getTime()
        return dateB - dateA
      })

      const actualCount = Math.max(parseInt(l.captureCount, 10) || 0, captures.length)

      return {
        ...l,
        token: l.token || linkId,
        ...creatorInfo,
        captures,
        captureCount: actualCount
      }
    }))

    return c.json(enriched)
  } catch (err) {
    console.error('[admin/links]', err.message)
    return c.json({ error: err.message }, 500)
  }
})

// ── GET /api/admin/links/:id/captures  (on-demand per-link fetch) ─────────────
router.get('/links/:id/captures', async (c) => {
  try {
    const linkId = c.req.param('id')
    const admin = getAdmin(c.env)
    const db = admin.firestore()

    console.log(`[GET /captures] Fetching for ID: ${linkId}`)
    const docSnap = await db.collection('trackingLinks').doc(linkId).get()
    
    if (!docSnap.exists) {
      console.warn(`[GET /captures] Link not found in DB: ${linkId}`)
      return c.json({ captures: [], captureCount: 0, error: 'Document not found' }, 404)
    }

    const docData = docSnap.data()

    let captures = Array.isArray(docData.captures) ? docData.captures.map(normaliseCapture) : []

    // Also merge any sub-collection captures
    try {
      const capsSnap = await db.collection('trackingLinks').doc(linkId).collection('captures').get()
      const subCaps = capsSnap.docs.map(d => normaliseCapture({ id: d.id, ...d.data() }))
      // Merge, avoiding duplicates by id
      const existingIds = new Set(captures.map(c => c.id).filter(Boolean))
      subCaps.forEach(sc => { if (!existingIds.has(sc.id)) captures.push(sc) })
    } catch (err) {
      console.warn(`[GET /captures] Error fetching sub-collection for ${linkId}:`, err.message)
    }

    captures.sort((a, b) => {
      const dateA = new Date(a.capturedAt || 0).getTime()
      const dateB = new Date(b.capturedAt || 0).getTime()
      return dateB - dateA
    })

    return c.json({ captures, captureCount: captures.length })
  } catch (err) {
    console.error('[admin/links/:id/captures]', err.message)
    return c.json({ error: err.message }, 500)
  }
})

// ── DELETE /api/admin/users/:uid ──────────────────────────────────────────────
router.delete('/users/:uid', async (c) => {
  try {
    const uid = c.req.param('uid')
    const admin = getAdmin(c.env)
    
    // 1. Auth delete
    await admin.auth().deleteUser(uid)

    // 2. Firestore delete
    await admin.firestore().collection('users').doc(uid).delete()
    
    return c.json({ success: true, message: 'Officer and credentials permanently deleted' })
  } catch (err) {
    console.error('[admin/deleteUser]', err.message)
    return c.json({ error: err.message }, 500)
  }
})

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get('/stats', async (c) => {
  try {
    const admin = getAdmin(c.env)
    const db = admin.firestore()

    const usersSnap = await db.collection('users').get()
    const linksSnap = await db.collection('trackingLinks').get()
    
    const users = usersSnap.docs.map(d => d.data())
    const totalOfficers = users.filter(u => !u.isAdmin).length
    const pending = users.filter(u => u.status === 'pending').length
    const approved = Math.max(0, totalOfficers - pending)
    
    const totalCredits = users.reduce((acc, u) => acc + (parseInt(u.credits, 10) || 0), 0)
    const totalLinks = linksSnap.docs.length
    
    // Calculate total captures across all links
    const totalCaptures = linksSnap.docs.reduce((acc, d) => {
      const data = d.data()
      const countFromField = parseInt(data.captureCount, 10) || 0
      const countFromArray = Array.isArray(data.captures) ? data.captures.length : 0
      return acc + Math.max(countFromField, countFromArray)
    }, 0)
    
    const stats = { totalOfficers, approved, pending, totalCredits, totalLinks, totalCaptures }
    return c.json(stats)
  } catch (err) {
    console.error('[admin/stats]', err.message)
    return c.json({ error: err.message }, 500)
  }
})

// ── GET /api/admin/activity ──────────────────────────────────────────────────
router.get('/activity', async (c) => {
  try {
    const admin = getAdmin(c.env)
    const db = admin.firestore()
    
    // 1. Get all users to find their sub-collections
    const usersSnap = await db.collection('users').get()
    const users = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() }))
    
    // 2. Fetch sessions from each user's sub-collection
    let allEntries = []
    await Promise.all(users.map(async u => {
      try {
        const sessionsSnap = await db.collection('users').doc(u.uid).collection('sessions').get()
        sessionsSnap.docs.forEach(d => {
            const s = d.data()
            const base = {
              uid: u.uid,
              email: u.email || '',
              displayName: u.displayName || u.email || 'Officer',
              ip: s.ip || '—',
              device: s.device || ''
            }

            // A session might be a single "log" entry with a type,
            // or a session document that we need to split into login/logout events.
            // Based on DB observation, type is often "login" but document contains logoutAt.
            
            // 1. Create Login Entry
            allEntries.push({ 
                ...base, 
                id: `${d.id}-login`, 
                type: 'login', 
                timestamp: s.timestamp || s.loginAt || s.createdAt 
            })

            // 2. Create Logout Entry (if details exist)
            if (s.logoutAt || s.logoutTimestamp || s.isLoggedOut || s.isOnline === false) {
                allEntries.push({ 
                    ...base, 
                    id: `${d.id}-logout`, 
                    type: 'logout', 
                    timestamp: s.logoutAt || s.logoutTimestamp || s.lastSeen 
                })
            }
        })
      } catch (err) {
        console.warn(`Failed to fetch sessions for user ${u.uid}:`, err.message)
      }
    }))
    
    // 3. Sort by timestamp descending
    allEntries.sort((a, b) => {
      const getMs = (t) => {
          if (!t) return 0
          if (t.seconds !== undefined) return t.seconds * 1000
          if (t instanceof Date) return t.getTime()
          const d = new Date(t)
          return isNaN(d.getTime()) ? 0 : d.getTime()
      }
      return getMs(b.timestamp) - getMs(a.timestamp)
    })
    
    return c.json(allEntries.slice(0, 100))
  } catch (err) {
    console.error('[admin/activity]', err.message)
    return c.json({ error: err.message }, 500)
  }
})

// ── DELETE /api/admin/activity/:uid/:sid/:type ───────────────────────────────
router.delete('/activity/:uid/:sid/:type', async (c) => {
  try {
    const { uid, sid, type } = c.req.param()
    const admin = getAdmin(c.env)
    const db = admin.firestore()
    
    // Pattern for sub-collection deletion: users/{uid}/sessions/{sid}
    // We also try older patterns just in case
    const paths = [
      `users/${uid}/sessions/${sid}`,
      `users/${uid}/sessions/${sid}-${type}`,
      `activityLogs/${sid}`,
      `activityLogs/${sid}-${type}`
    ]
    
    await Promise.all(paths.map(async p => {
      const parts = p.split('/')
      if (parts.length === 3) {
        await db.collection(parts[0]).doc(parts[1]).collection(parts[2]).doc(parts[3] || '').delete().catch(() => {})
      } else {
        await db.collection(parts[0]).doc(parts[1]).delete().catch(() => {})
      }
    }))

    // Handled specific users/{uid}/sessions/{sid}
    await db.collection('users').doc(uid).collection('sessions').doc(sid).delete().catch(() => {})
    
    return c.json({ success: true })
  } catch (err) {
    console.error('[admin/deleteActivity]', err.message)
    return c.json({ error: err.message }, 500)
  }
})

export default router