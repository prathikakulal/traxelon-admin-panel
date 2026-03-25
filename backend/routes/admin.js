// backend/routes/admin.js
import { Hono } from 'hono'
import { getAdmin } from '../firebase/admin.js'
import { AggregateField } from 'firebase-admin/firestore'

const router = new Hono()

// ── Health / status ───────────────────────────────────────────────────────────
router.get('/status', (c) => {
  return c.json({
    service: 'traxelon-admin-backend',
    version: '1.0.0',
    ts: new Date().toISOString(),
  })
})

// ── GET /api/admin/users ──────────────────────────────────────────────────────
router.get('/users', async (c) => {
  try {
    const cursor = c.req.query('cursor')
    const db = getAdmin().firestore()
    let query = db.collection('users').orderBy('createdAt', 'desc').limit(20)

    if (cursor) {
      const snap = await db.collection('users').doc(cursor).get()
      if (snap.exists) query = query.startAfter(snap)
    }

    const snap = await query.get()
    const data = snap.docs.map(d => ({ uid: d.id, ...d.data() }))
    return c.json(data)
  } catch (err) {
    console.error('[admin/users]', err.message)
    return c.json({ error: err.message }, 500)
  }
})

// ── GET /api/admin/links ──────────────────────────────────────────────────────
router.get('/links', async (c) => {
  try {
    const cursor = c.req.query('cursor')
    const db = getAdmin().firestore()
    let query = db.collection('trackingLinks').orderBy('createdAt', 'desc').limit(20)

    if (cursor) {
      const snap = await db.collection('trackingLinks').doc(cursor).get()
      if (snap.exists) query = query.startAfter(snap)
    }

    const snap = await query.get()
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    const uids = [...new Set(data.map(l => l.uid).filter(Boolean))]
    const userMap = {}
    if (uids.length > 0) {
      await Promise.all(
        uids.map(async uid => {
          try {
            const uSnap = await db.collection('users').doc(uid).get()
            if (uSnap.exists) {
              const u = uSnap.data()
              userMap[uid] = { creatorName: u.displayName || u.email || uid, creatorEmail: u.email || '' }
            }
          } catch (_) { }
        })
      )
    }

    const enriched = await Promise.all(
      data.map(async (l) => {
        let captures = Array.isArray(l.captures) ? [...l.captures] : []
        try {
          const capturesSnap = await db
            .collection('trackingLinks')
            .doc(l.id)
            .collection('captures')
            .orderBy('capturedAt', 'desc')
            .get()
          const subCaptures = capturesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
          captures = [...captures, ...subCaptures]
        } catch (_) { }

        captures.sort((a, b) => new Date(b.capturedAt || 0).getTime() - new Date(a.capturedAt || 0).getTime())

        return {
          ...l,
          captures,
          ...(l.uid && userMap[l.uid] ? userMap[l.uid] : {}),
        }
      })
    )

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
    const adminApp = getAdmin()
    const db = adminApp.firestore()

    try {
      await adminApp.auth().deleteUser(uid)
    } catch (e) {
      if (e.code !== 'auth/user-not-found') throw e
    }

    const sessionsSnap = await db.collection('users').doc(uid).collection('sessions').get()
    const batch = db.batch()
    sessionsSnap.docs.forEach(doc => {
      batch.delete(doc.ref)
    })

    batch.delete(db.collection('users').doc(uid))

    const statsRef = db.collection('metadata').doc('dashboardStats')
    const userSnap = await db.collection('users').doc(uid).get()
    if (userSnap.exists) {
      const userData = userSnap.data()
      const FieldValue = adminApp.firestore.FieldValue
      const statUpdate = { totalOfficers: FieldValue.increment(-1) }
      if (userData.status === 'approved') statUpdate.approved = FieldValue.increment(-1)
      if (userData.status === 'pending') statUpdate.pending = FieldValue.increment(-1)
      batch.update(statsRef, statUpdate)
    }

    await batch.commit()
    return c.json({ success: true, message: 'Officer and credentials permanently deleted' })
  } catch (err) {
    console.error('[admin/deleteUser]', err.message)
    return c.json({ error: err.message }, 500)
  }
})

// ── GET /api/admin/activity ───────────────────────────────────────────────────
router.get('/activity', async (c) => {
  try {
    const cursor = c.req.query('cursor')
    const db = getAdmin().firestore()

    let usersQuery = db.collection('users').orderBy('lastSeen', 'desc').limit(10)

    if (cursor) {
      usersQuery = usersQuery.startAfter(new Date(cursor))
    }

    const recentUsersSnap = await usersQuery.get()
    const allEvents = []

    const sessionPromises = recentUsersSnap.docs.map(async (uDoc) => {
      const user = uDoc.data()
      const uid = uDoc.id

      const sessionSnaps = await db.collection('users')
        .doc(uid)
        .collection('sessions')
        .orderBy('loginAt', 'desc')
        .limit(5)
        .get()

      sessionSnaps.docs.forEach(sessionDoc => {
        const session = sessionDoc.data()
        const sessionId = sessionDoc.id

        if (session.loginAt) {
          allEvents.push({
            id: `${sessionId}-login`,
            type: 'login',
            uid,
            displayName: user?.displayName || 'Unknown Officer',
            email: user?.email || '',
            timestamp: session.loginAt.toDate ? session.loginAt.toDate().toISOString() : new Date(session.loginAt).toISOString(),
            cursor: user.lastSeen?.toDate ? user.lastSeen.toDate().toISOString() : new Date(user.lastSeen).toISOString(),
            ip: session.ip || '—',
            device: session.device || '',
          })
        }

        if (session.logoutAt) {
          allEvents.push({
            id: `${sessionId}-logout`,
            type: 'logout',
            uid,
            displayName: user?.displayName || 'Unknown Officer',
            email: user?.email || '',
            timestamp: session.logoutAt.toDate ? session.logoutAt.toDate().toISOString() : new Date(session.logoutAt).toISOString(),
            cursor: user.lastSeen?.toDate ? user.lastSeen.toDate().toISOString() : new Date(user.lastSeen).toISOString(),
            ip: session.ip || '—',
            device: session.device || '',
          })
        }
      })
    })

    await Promise.all(sessionPromises)
    allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return c.json(allEvents.slice(0, 20))
  } catch (err) {
    console.error('[admin/activity]', err.message)
    return c.json({ error: err.message }, 500)
  }
})

// ── DELETE /api/admin/activity/:uid/:sessionId/:type ──────────────────────────
router.delete('/activity/:uid/:sessionId/:type', async (c) => {
  try {
    const uid = c.req.param('uid')
    const sessionId = c.req.param('sessionId')
    const type = c.req.param('type')
    const admin = getAdmin()
    const db = admin.firestore()

    const sessionRef = db.collection('users').doc(uid).collection('sessions').doc(sessionId)

    if (type === 'login') {
      await sessionRef.update({ loginAt: admin.firestore.FieldValue.delete() })
    } else if (type === 'logout') {
      await sessionRef.update({ logoutAt: admin.firestore.FieldValue.delete() })
    }

    const snap = await sessionRef.get()
    if (snap.exists) {
      const data = snap.data()
      if (!data.loginAt && !data.logoutAt) {
        await sessionRef.delete()
      }
    }

    return c.json({ success: true })
  } catch (err) {
    console.error(`[admin/activity delete] ${c.req.param('sessionId')}`, err.message)
    return c.json({ error: err.message }, 500)
  }
})

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get('/stats', async (c) => {
  try {
    const db = getAdmin().firestore()

    const [
      allUsersSnap,
      adminSnap,
      pendingSnap,
      rejectedSnap,
      linksSnap,
      creditsSnap,
      cachedSnap,
    ] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('users').where('isAdmin', '==', true).count().get(),
      db.collection('users').where('status', '==', 'pending').count().get(),
      db.collection('users').where('status', '==', 'rejected').count().get(),
      db.collection('trackingLinks').count().get(),
      db.collection('users').aggregate({ total: AggregateField.sum('credits') }).get(),
      db.collection('metadata').doc('dashboardStats').get(),
    ])

    const totalOfficers = allUsersSnap.data().count - adminSnap.data().count
    const pending = pendingSnap.data().count + rejectedSnap.data().count
    const approved = Math.max(0, totalOfficers - pending)
    const totalCredits = creditsSnap.data().total || 0
    const totalLinks = linksSnap.data().count
    const totalCaptures = cachedSnap.exists ? (cachedSnap.data().totalCaptures || 0) : 0

    const stats = { totalOfficers, approved, pending, totalCredits, totalLinks, totalCaptures }

    db.collection('metadata').doc('dashboardStats').set(stats, { merge: true }).catch(() => { })

    return c.json(stats)
  } catch (err) {
    console.error('[admin/stats]', err.message)
    return c.json({ error: err.message }, 500)
  }
})

export default router