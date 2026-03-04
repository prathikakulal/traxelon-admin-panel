// backend/server.js
require('dotenv').config()

const express = require('express')
const cors    = require('cors')
const adminRoutes = require('./routes/admin')

const app  = express()
const PORT = process.env.PORT || 5000

// ── Middleware ────────────────────────────────────────────
app.use(express.json())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

// ── Routes ───────────────────────────────────────────────
app.use('/api/admin', adminRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'traxelon-admin-backend', ts: new Date().toISOString() })
})

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Traxelon Admin Backend running on http://localhost:${PORT}`)
  console.log(`    Health: http://localhost:${PORT}/api/health\n`)
})

module.exports = app
