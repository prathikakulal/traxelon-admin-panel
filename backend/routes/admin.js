// backend/routes/admin.js
import { Hono } from 'hono'
import { getAdmin } from '../firebase/admin.js'

const router = new Hono()

// ── Health / status ───────────────────────────────────────────────────────────
router.get('/status', (c) => {
  return c.json({
    service: 'traxelon-admin-backend',
    version: '1.3.0 (Worker REST)',
    ts: new Date().toISOString(),
  })
})

// ── GET /api/admin/users ──────────────────────────────────────────────────────
router.get('/users', async (c) => {
  try {
    const admin = getAdmin(c.env)
    const db = admin.firestore()
    
    // Using simple get for now, or StructuredQuery if needed
    const snap = await db.collection('users').get()
    const data = snap.docs.map(d => d.data())
    
    // Basic sorting if not done by REST
    data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    
    return c.json(data.slice(0, 20))
  } catch (err) {
    console.error('[admin/users]', err.message)
    return c.json({ error: err.message }, 500)
  }
})

// ── GET /api/admin/links ──────────────────────────────────────────────────────
router.get('/links', async (c) => {
  try {
    const admin = getAdmin(c.env)
    const db = admin.firestore()
    
    const snap = await db.collection('trackingLinks').get()
    const data = snap.docs.map(d => d.data())
    
    data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    const paged = data.slice(0, 20)

    // Enrich with creator info
    const uids = [...new Set(paged.map(l => l.uid).filter(Boolean))]
    const userMap = {}
    if (uids.length > 0) {
      await Promise.all(
        uids.map(async uid => {
          try {
            const u = await db.collection('users').doc(uid).get()
            const userData = u.fields ? { 
                displayName: u.fields.displayName?.stringValue, 
                email: u.fields.email?.stringValue 
            } : {}
            userMap[uid] = { 
                creatorName: userData.displayName || userData.email || uid, 
                creatorEmail: userData.email || '' 
            }
          } catch (_) {}
        })
      )
    }

    const enriched = paged.map(l => ({
      ...l,
      ...(l.uid && userMap[l.uid] ? userMap[l.uid] : {}),
    }))

    return c.json(enriched)
  } catch (err) {
    console.error('[admin/links]', err.message)
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

    // 2. Firestore delete (Simplified batch/cleanup for REST)
    await admin.firestore().collection('users').doc(uid).delete()
    
    return c.json({ success: true, message: 'Officer and credentials permanently deleted' })
  } catch (err) {
    console.error('[admin/deleteUser]', err.message)
    return c.json({ error: err.message }, 500)
  }
})

// ── GET /api/admin/activity ───────────────────────────────────────────────────
router.get('/activity', async (c) => {
  try {
    const admin = getAdmin(c.env)
    const db = admin.firestore()

    // Simplified: Fetch recent users and their sessions
    const usersSnap = await db.collection('users').get()
    const users = usersSnap.docs.map(d => d.data())
    users.sort((a, b) => new Date(b.lastSeen || 0).getTime() - new Date(a.lastSeen || 0).getTime())
    
    const allEvents = []
    const recentUsers = users.slice(0, 10)

    for (const user of recentUsers) {
      try {
        const sessionsData = await db.collection('users').doc(user.id).collection('sessions').get()
        const sessions = (sessionsData.documents || []).map(d => {
            const fields = d.fields || {}
            return {
                id: d.name.split('/').pop(),
                loginAt: fields.loginAt?.timestampValue || fields.loginAt?.stringValue,
                logoutAt: fields.logoutAt?.timestampValue || fields.logoutAt?.stringValue,
                ip: fields.ip?.stringValue || '—',
                device: fields.device?.stringValue || ''
            }
        })

        sessions.forEach(s => {
          if (s.loginAt) {
            allEvents.push({
              id: `${s.id}-login`,
              type: 'login',
              uid: user.id,
              displayName: user.displayName || 'Unknown Officer',
              email: user.email || '',
              timestamp: s.loginAt,
              ip: s.ip,
              device: s.device,
            })
          }
          if (s.logoutAt) {
            allEvents.push({
              id: `${s.id}-logout`,
              type: 'logout',
              uid: user.id,
              displayName: user.displayName || 'Unknown Officer',
              email: user.email || '',
              timestamp: s.logoutAt,
              ip: s.ip,
              device: s.device,
            })
          }
        })
      } catch (_) {}
    }

    allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return c.json(allEvents.slice(0, 20))
  } catch (err) {
    console.error('[admin/activity]', err.message)
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
    const adminCount = users.length - totalOfficers
    const pending = users.filter(u => u.status === 'pending' || u.status === 'rejected').length
    const approved = Math.max(0, totalOfficers - pending)
    
    const totalCredits = users.reduce((acc, u) => acc + (parseInt(u.credits, 10) || 0), 0)
    const totalLinks = (linksSnap.docs || []).length
    
    // For captures, we'd need a subcollection query or a counter doc
    const stats = { totalOfficers, approved, pending, totalCredits, totalLinks, totalCaptures: 0 }
    return c.json(stats)
  } catch (err) {
    console.error('[admin/stats]', err.message)
    return c.json({ error: err.message }, 500)
  }
})

export default router