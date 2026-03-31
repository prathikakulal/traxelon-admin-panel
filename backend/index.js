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
    // TEMPORARY BYPASS FOR DEBUGGING
    c.set('user', { uid: 'test-admin', email: 'admin@traxelon.com' })
    await next()
  } catch (err) {
    console.error('Auth Error:', err.message)
    return c.json({ error: 'Unauthorized: ' + err.message }, 401)
  }
})

// ── Routes ───────────────────────────────────────────────────────────────────
app.route('/api/admin', adminRoutes)

// ── Visitor Tracking Redirect ────────────────────────────────────────────────
// Public route - no auth required
app.get('/t/:id', async (c) => {
  const id = c.req.param('id')
  const env = c.env
  const admin = getAdmin(env)
  const db = admin.firestore()

  try {
    const docRef = db.collection('trackingLinks').doc(id)
    const snap = await docRef.get()

    if (!snap.exists) return c.text('Link not found', 404)

    const data = snap.data()
    const destination = data.destinationUrl || data.url || 'https://google.com'

    // Increment clicks
    await docRef.update({
      clicks: (parseInt(data.clicks, 10) || 0) + 1,
      lastClickAt: new Date().toISOString()
    })

    // HTML to capture browser details then redirect
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Redirecting...</title>
        <script>
          async function pushCapture() {
            try {
              const info = {
                capturedAt: new Date().toISOString(),
                userAgent: navigator.userAgent,
                language: navigator.language,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                platform: navigator.platform,
                vendor: navigator.vendor,
                hardwareConcurrency: navigator.hardwareConcurrency || null,
                deviceMemory: navigator.deviceMemory || null,
                onLine: navigator.onLine,
              };
              
              // Adblock detection
              try {
                const url = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
                const res = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
                info.adBlockEnabled = false;
              } catch (e) {
                info.adBlockEnabled = true;
              }
              
              await fetch('/api/capture/${id}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(info)
              });
            } catch (e) {
              console.error('Capture failed', e);
            } finally {
              window.location.href = "${destination}";
            }
          }
          window.onload = pushCapture;
        </script>
      </head>
      <body style="background:#0a0a0c;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;margin:0;">
        <div style="text-align:center;">
          <div style="font-size:12px;color:#555;margin-bottom:12px;letter-spacing:1px;text-transform:uppercase;">Security Verification</div>
          <div style="font-size:18px;font-weight:500;">Please wait while we redirect you...</div>
        </div>
      </body>
      </html>
    `)
  } catch (err) {
    return c.text('Error: ' + err.message, 500)
  }
})

// ── Capture Data Endpoint ───────────────────────────────────────────────────
// Public route - no auth required (called by redirect page)
app.post('/api/capture/:id', async (c) => {
  const id = c.req.param('id')
  const clientData = await c.req.json()
  const env = c.env
  const admin = getAdmin(env)
  const db = admin.firestore()

  try {
    const docRef = db.collection('trackingLinks').doc(id)
    const snap = await docRef.get()
    if (!snap.exists) return c.json({ error: 'Link not found' }, 404)

    const data = snap.data()
    const captures = Array.isArray(data.captures) ? data.captures : []
    
    // Cloudflare Metadata and Headers
    const cf = c.req.raw.cf || {}
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0'
    const ua = c.req.header('user-agent') || ''

    // Helper to identify Browser/OS from UA if not sent by client
    const getBrowser = (u) => {
      if (u.includes('Firefox')) return 'Firefox'
      if (u.includes('Chrome')) return 'Chrome'
      if (u.includes('Safari')) return 'Safari'
      if (u.includes('Edge')) return 'Edge'
      return 'Unknown'
    }
    const getOS = (u) => {
      if (u.includes('Windows')) return 'Windows'
      if (u.includes('iPhone')) return 'iOS'
      if (u.includes('Android')) return 'Android'
      if (u.includes('Mac')) return 'macOS'
      if (u.includes('Linux')) return 'Linux'
      return 'Unknown'
    }

    const newCapture = {
      ...clientData, // Preserve all 40+ attributes sent by frontend
      ip: ip || clientData.ip || '0.0.0.0',
      city: clientData.city || cf.city || 'Unknown',
      country: clientData.countryCode || clientData.country || cf.country || 'Unknown',
      isp: clientData.isp || clientData.org || clientData.asn || cf.asOrganization || 'Unknown',
      browser: clientData.browser || getBrowser(ua),
      os: clientData.os || getOS(ua),
      device: clientData.device || (clientData.screenWidth < 768 ? 'Mobile' : 'Desktop'),
      capturedAt: clientData.capturedAt || new Date().toISOString()
    }

    // Update doc with new capture
    await docRef.update({
      captures: [...captures, newCapture],
      captureCount: (parseInt(data.captureCount, 10) || 0) + 1
    })

    return c.json({ success: true })
  } catch (err) {
    return c.json({ error: err.message }, 500)
  }
})

app.get('/', (c) => c.text('Traxelon Admin Backend — Cloudflare Workers'))

export default app
