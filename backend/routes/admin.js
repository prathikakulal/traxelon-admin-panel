// backend/routes/admin.js
// Admin API routes — served via Firebase Admin SDK (bypasses Firestore security rules)

const express       = require('express')
const { getAdmin }  = require('../firebase/admin')

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
// Returns all documents in the `users` collection (capped to prevent quota exhaustion)
router.get('/users', async (_req, res) => {
  try {
    const db   = getAdmin().firestore()
    // Added limit to prevent accidental massive reads if the userbase grows
    const snap = await db.collection('users').orderBy('createdAt', 'desc').limit(200).get()
    const data = snap.docs.map(d => ({ uid: d.id, ...d.data() }))
    res.json(data)
  } catch (err) {
    console.error('[admin/users]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/admin/links ──────────────────────────────────────────────────────
// Returns all documents in the `trackingLinks` collection
router.get('/links', async (_req, res) => {
  try {
    const db   = getAdmin().firestore()
    const snap = await db.collection('trackingLinks').orderBy('createdAt', 'desc').limit(200).get()
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    res.json(data)
  } catch (err) {
    console.error('[admin/links]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/admin/activity ───────────────────────────────────────────────────
// Returns aggregated login/logout sessions from all users
router.get('/activity', async (_req, res) => {
  try {
    const db = getAdmin().firestore()
    
    // 1. Fetch all users to have a lookup map for display properties
    const usersSnap = await db.collection('users').get()
    const usersMap = {}
    usersSnap.docs.forEach(d => {
      usersMap[d.id] = d.data()
    })

    const allEvents = []

    // 2. Fetch the "sessions" subcollection for each user concurrently
    const sessionPromises = usersSnap.docs.map(userDoc =>
      db.collection('users').doc(userDoc.id).collection('sessions').get()
    )
    const sessionSnaps = await Promise.all(sessionPromises)

    // 3. Transform sessions into distinct login/logout events
    sessionSnaps.forEach((sessionSnap, index) => {
      const uid = usersSnap.docs[index].id
      const user = usersMap[uid]
      
      sessionSnap.docs.forEach(sessionDoc => {
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
            timestamp: session.loginAt.toDate ? session.loginAt.toDate().toISOString() : new Date(session.loginAt).toISOString(),
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
            ip: session.ip || '—',
            device: session.device || '',
          })
        }
      })
    })

    // 4. Sort aggregated events by timestamp DESC
    allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    res.json(allEvents.slice(0, 200)) // Return top 200 recent events
  } catch (err) {
    console.error('[admin/activity]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
// Returns aggregate counts (used by Overview)
router.get('/stats', async (_req, res) => {
  try {
    const db = getAdmin().firestore()
    
    // 🔥 OPTIMIZATION: Instead of downloading every single document just to count them
    // (which costs 1 read per document), we use Firebase's Count operator which costs 
    // only 1 read per 1000 documents!
    
    const [totalUsersSnap, totalLinksSnap, approvedSnap, pendingSnap] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('trackingLinks').count().get(),
      db.collection('users').where('status', '==', 'approved').count().get(),
      db.collection('users').where('status', '==', 'pending').count().get()
    ])

    // For sums (credits, captures), we still need the docs, but we'll cap them to recent active ones
    // to prevent unlimited unbounded reads.
    const [usersRecentSnap, linksRecentSnap] = await Promise.all([
      db.collection('users').orderBy('createdAt', 'desc').limit(200).get(),
      db.collection('trackingLinks').orderBy('createdAt', 'desc').limit(200).get()
    ])

    const credits   = usersRecentSnap.docs.reduce((s, d) => s + (d.data().credits || 0), 0)
    const captures  = linksRecentSnap.docs.reduce((s, d) => s + (d.data().captures?.length || 0), 0)

    res.json({
      totalOfficers: totalUsersSnap.data().count,
      approved:      approvedSnap.data().count,
      pending:       pendingSnap.data().count,
      totalCredits:  credits,
      totalLinks:    totalLinksSnap.data().count,
      totalCaptures: captures,
    })
  } catch (err) {
    console.error('[admin/stats]', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
