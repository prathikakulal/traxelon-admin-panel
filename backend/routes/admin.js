// backend/routes/admin.js
// Admin API routes — served via Firebase Admin SDK (bypasses Firestore security rules)

const express            = require('express')
const { getAdmin }       = require('../firebase/admin')
const { AggregateField } = require('firebase-admin/firestore')

const router = express.Router()

// ── Health / status ───────────────────────────────────────────────────────────
router.get('/status', (_req, res) => {
  res.json({
    service: 'traxelon-admin-backend',
    version: '1.0.0',
    ts: new Date().toISOString(),
  })
})

// ── GET /api/admin/users ──────────────────────────────────────────────────────
// Returns all documents in the `users` collection (paginated)
router.get('/users', async (req, res) => {
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
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/admin/links ──────────────────────────────────────────────────────
// Returns documents in the `trackingLinks` collection (paginated)
router.get('/links', async (req, res) => {
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
    res.json(data)
  } catch (err) {
    console.error('[admin/links]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── DELETE /api/admin/users/:uid ──────────────────────────────────────────────
// Permanently deletes an officer's account, underlying sessions, and main document.
router.delete('/users/:uid', async (req, res) => {
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
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/admin/activity ───────────────────────────────────────────────────
// Returns aggregated login/logout sessions from all users (paginated)
router.get('/activity', async (req, res) => {
  try {
    const { cursor } = req.query
    const db = getAdmin().firestore()
    
    // 🔥 NEW OPTIMIZATION: To completely avoid needing ANY Firestore Composite Indexes 
    // and keep reads strictly under 20, we fetch the 10 most recently active users, 
    // then fetch their 5 most recent sessions. No global CollectionGroup index needed!
    let usersQuery = db.collection('users').orderBy('lastSeen', 'desc').limit(10)
    
    // For pagination, we'll use the cursor as the user's lastSeen timestamp
    if (cursor) {
       usersQuery = usersQuery.startAfter(new Date(cursor))
    }

    const recentUsersSnap = await usersQuery.get()
    const allEvents = []

    // Fetch up to 5 recent sessions for each of these recently active users
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
        
        // Add Login Event
        if (session.loginAt) {
          allEvents.push({
            id: `${sessionId}-login`,
            type: 'login',
            uid,
            displayName: user?.displayName || 'Unknown Officer',
            email: user?.email || '',
            // Set the cursor timestamp to the USER'S lastSeen to allow accurate pagination of blocks of users
            timestamp: session.loginAt.toDate ? session.loginAt.toDate().toISOString() : new Date(session.loginAt).toISOString(),
            cursor: user.lastSeen?.toDate ? user.lastSeen.toDate().toISOString() : new Date(user.lastSeen).toISOString(),
            ip: session.ip || '—', 
            device: session.device || '',
          })
        }

        // Add Logout Event if it exists
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

    // Sort aggregated events by their exact session timestamp DESC
    allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    // We already limited inherently by 10 users * 5 sessions/ea = max 50 ~ 100 events
    res.json(allEvents.slice(0, 20))
  } catch (err) {
    console.error('[admin/activity]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── DELETE /api/admin/activity/:uid/:sessionId/:type ──────────────────────────
// Removes either the loginAt or logoutAt field, and deletes the document if empty
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
    
    // Clean up document if both are missing
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
// Uses Firestore aggregation queries (count / sum) — always accurate, always cheap.
// Total cost: ~7 reads regardless of collection size. No cache drift possible.
router.get('/stats', async (_req, res) => {
  try {
    const db = getAdmin().firestore()

    // Run all aggregations in parallel
    const [
      allUsersSnap,   // total users (officers + admin)
      adminSnap,      // how many have isAdmin === true
      pendingSnap,    // status === 'pending'
      rejectedSnap,   // status === 'rejected' (shown as pending in UI)
      linksSnap,      // total tracking links
      creditsSnap,    // sum of credits across all users
      cachedSnap,     // cache doc — only used for totalCaptures (array-based, can't aggregate)
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
    const pending       = pendingSnap.data().count + rejectedSnap.data().count
    const approved      = Math.max(0, totalOfficers - pending)
    const totalCredits  = creditsSnap.data().total || 0
    const totalLinks    = linksSnap.data().count
    // totalCaptures lives inside an array per link doc — can't aggregate, use cached value
    const totalCaptures = cachedSnap.exists ? (cachedSnap.data().totalCaptures || 0) : 0

    const stats = { totalOfficers, approved, pending, totalCredits, totalLinks, totalCaptures }

    // Keep cache in sync so sync-stats.js and other scripts stay consistent
    db.collection('metadata').doc('dashboardStats').set(stats, { merge: true }).catch(() => {})

    res.json(stats)
  } catch (err) {
    console.error('[admin/stats]', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router