// backend/routes/admin.js
// Admin API routes — served via Firebase Admin SDK (bypasses Firestore security rules)

const express = require('express')
const { getAdmin } = require('../firebase/admin')
const { AggregateField } = require('firebase-admin/firestore')

const router = express.Router()

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
    const { cursor } = req.query
    const db = getAdmin().firestore()
    let query = db.collection('users').orderBy('createdAt', 'desc').limit(20)

    if (cursor) {
      const snap = await db.collection('users').doc(cursor).get()
      if (snap.exists) query = query.startAfter(snap)
    }

    const snap = await query.get()
    const data = snap.docs.map(d => ({ uid: d.id, ...d.data() }))
    res.json(data)
  } catch (err) {
    console.error('[admin/users]', err.message)
    return c.json({ error: err.message }, 500)
  }
})

// ── GET /api/admin/links ──────────────────────────────────────────────────────
router.get('/links', async (c) => {
  try {
    const { cursor } = req.query
    const db = getAdmin().firestore()
    let query = db.collection('trackingLinks').orderBy('createdAt', 'desc').limit(20)

    if (cursor) {
      const snap = await db.collection('trackingLinks').doc(cursor).get()
      if (snap.exists) query = query.startAfter(snap)
    }

    const snap = await query.get()
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    // Enrich with creator info: collect unique UIDs, batch-fetch users
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

    // ── Fetch captures subcollection for each link ──
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
        } catch (_) {
          // If no captures subcollection exists, just proceed with array field captures
        }

        // Sort combined captures by capturedAt desc
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
    const { uid } = req.params
    const adminApp = getAdmin()
    const db = adminApp.firestore()

    // 1. Delete user from Firebase Authentication
    try {
      await adminApp.auth().deleteUser(uid)
    } catch (e) {
      // If user doesn't exist in Auth, we can still proceed to clean up Firestore
      if (e.code !== 'auth/user-not-found') throw e
    }

    // 2. Delete all documents in the user's `sessions` subcollection
    const sessionsSnap = await db.collection('users').doc(uid).collection('sessions').get()
    const batch = db.batch()
    sessionsSnap.docs.forEach(doc => {
      batch.delete(doc.ref)
    })

    // 3. Delete the main `users` document
    batch.delete(db.collection('users').doc(uid))

    // 4. Update the global stats
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
    res.json({ success: true, message: 'Officer and credentials permanently deleted' })

  } catch (err) {
    console.error('[admin/deleteUser]', err.message)
    return c.json({ error: err.message }, 500)
  }
})

// ── GET /api/admin/activity ───────────────────────────────────────────────────
router.get('/activity', async (c) => {
  try {
    const { cursor } = req.query
    const db = getAdmin().firestore()

    // Simplified: Fetch recent users and their sessions
    const usersSnap = await db.collection('users').get()
    const users = usersSnap.docs.map(d => d.data())
    users.sort((a, b) => new Date(b.lastSeen || 0).getTime() - new Date(a.lastSeen || 0).getTime())
    
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

    res.json(allEvents.slice(0, 20))
  } catch (err) {
    console.error('[admin/activity]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── DELETE /api/admin/activity/:uid/:sessionId/:type ──────────────────────────
router.delete('/activity/:uid/:sessionId/:type', async (req, res) => {
  try {
    const { uid, sessionId, type } = req.params
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

    res.json({ success: true })
  } catch (err) {
    console.error(`[admin/activity delete] ${req.params.sessionId}`, err.message)
    res.status(500).json({ error: err.message })
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
    const totalCredits = creditsSnap.data().total || 0
    const totalLinks = linksSnap.data().count
    const totalCaptures = cachedSnap.exists ? (cachedSnap.data().totalCaptures || 0) : 0

    const stats = { totalOfficers, approved, pending, totalCredits, totalLinks, totalCaptures }

    db.collection('metadata').doc('dashboardStats').set(stats, { merge: true }).catch(() => { })

    res.json(stats)
  } catch (err) {
    console.error('[admin/stats]', err.message)
    return c.json({ error: err.message }, 500)
  }
})

export default router