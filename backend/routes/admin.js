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
    
    const stats = { totalOfficers, approved, pending, totalCredits, totalLinks, totalCaptures: 0 }
    return c.json(stats)
  } catch (err) {
    console.error('[admin/stats]', err.message)
    return c.json({ error: err.message }, 500)
  }
})

export default router