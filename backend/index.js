// backend/index.js
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import adminRoutes from './routes/admin.js'
import { verifyIdToken, getAdmin } from './firebase/admin.js'

const app = new Hono()

// ── Global Middleware ────────────────────────────────────────────────────────
app.use('*', cors({
  origin: '*', // Adjust to your frontend domain in production
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
}))

// ── Authentication Middleware ────────────────────────────────────────────────
app.use('/api/admin/*', async (c, next) => {
  // 1. Skip auth for status endpoint (optional)
  if (c.req.path === '/api/admin/status') return await next()

  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or invalid token' }, 401)
  }

  const token = authHeader.split(' ')[1]
  const projectId = c.env.FIREBASE_PROJECT_ID || 'traxelon-final'

  try {
    const payload = await verifyIdToken(token, projectId)
    
    // 2. Extra Security: Verify if user is an Admin in Firestore
    const adminRef = getAdmin(c.env)
    const userSnap = await adminRef.firestore().collection('users').doc(payload.sub).get()
    const userData = userSnap.data()

    if (!userData || !userData.isAdmin) {
      console.warn(`Unauthorized access attempt by ${payload.email}`)
      return c.json({ error: 'Forbidden: Admin access required' }, 403)
    }

    // Pass the user info to the next handler
    c.set('user', { uid: payload.sub, email: payload.email })
    await next()
  } catch (err) {
    console.error('Auth Error:', err.message)
    return c.json({ error: 'Unauthorized: ' + err.message }, 401)
  }
})

// ── Routes ───────────────────────────────────────────────────────────────────
app.route('/api/admin', adminRoutes)

app.get('/', (c) => c.text('Traxelon Admin Backend — Cloudflare Workers'))

export default app
