// backend/middleware/auth.js
//
// Token verification middleware.
// Verifies a Firebase ID token passed in the Authorization header:
//   Authorization: Bearer <firebase-id-token>
//
// Usage:
//   const { verifyToken } = require('../middleware/auth')
//   router.get('/protected', verifyToken, handler)

const { getAdmin } = require('../firebase/admin')

async function verifyToken(req, res, next) {
    const header = req.headers.authorization || ''
    if (!header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' })
    }

    const token = header.split('Bearer ')[1]
    try {
        const decoded = await getAdmin().auth().verifyIdToken(token)
        req.user = decoded
        next()
    } catch (err) {
        return res.status(401).json({ error: 'Token verification failed', detail: err.message })
    }
}

module.exports = { verifyToken }
