// backend/routes/admin.js
//
// Admin API routes.
// All privileged Firebase operations can be moved here
// from the frontend once you want server-side enforcement.

const express = require('express')
// const { verifyToken } = require('../middleware/auth')   // ← uncomment to protect routes

const router = express.Router()

// ── Health / status ───────────────────────────────────────────────────────────
router.get('/status', (_req, res) => {
    res.json({
        service: 'traxelon-admin-backend',
        version: '1.0.0',
        ts: new Date().toISOString(),
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// Example: fetch all stats via Firebase Admin SDK
// Uncomment and wire up once you want server-side data fetching.
//
// const admin = require('../firebase/admin')
//
// router.get('/stats', verifyToken, async (_req, res) => {
//   try {
//     const db = admin.firestore()
//     const [usersSnap, linksSnap] = await Promise.all([
//       db.collection('users').get(),
//       db.collection('trackingLinks').get(),
//     ])
//     res.json({
//       officers: usersSnap.size,
//       links:    linksSnap.size,
//     })
//   } catch (err) {
//     res.status(500).json({ error: err.message })
//   }
// })
// ─────────────────────────────────────────────────────────────────────────────

module.exports = router
