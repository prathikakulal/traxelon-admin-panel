// backend/server.js
import { Buffer } from 'node:buffer'
import process from 'node:process'

globalThis.Buffer = Buffer
globalThis.process = process

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import adminRoutes from './routes/admin.js'

const app = new Hono()

// ── Middleware ────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://traxelon-admin.vercel.app',
  'http://localhost:5173'
]

app.use('*', cors({
  origin: (origin) => {
    if (ALLOWED_ORIGINS.includes(origin)) return origin
    return ALLOWED_ORIGINS[0]
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// ── Routes ───────────────────────────────────────────────
app.get('/', (c) => c.text('Traxelon Admin API is running!'))
app.route('/api/admin', adminRoutes)

// 404 fallback
app.all('*', (c) => {
  return c.json({ error: 'Route not found' }, 404)
})

// ── Export for Cloudflare Workers ─────────────────────────
export default app

// ── Local Dev (Optional) ──────────────────────────────────
if (typeof process !== 'undefined' && process.env.PHASE === 'development') {
    // npx wrangler dev
}
