// backend/firebase/admin.js
//
// Firebase Admin SDK — lazy singleton.
// Call getAdmin() when you need the admin instance.
// This avoids crashing on startup if credentials aren't configured yet.

const admin = require('firebase-admin')

function getAdmin() {
    if (admin.apps.length) return admin

    let credential

    if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
        // Option A: base64-encoded JSON string (handy for cloud env vars)
        const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8')
        credential = admin.credential.cert(JSON.parse(json))
    } else if (
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH &&
        require('fs').existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    ) {
        // Option B: path to the downloaded JSON file (only if the file actually exists)
        const serviceAccount = require(require('path').resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH))
        credential = admin.credential.cert(serviceAccount)
    } else {
        // Option C: Application Default Credentials (works on GCP / Cloud Run)
        credential = admin.credential.applicationDefault()
    }

    admin.initializeApp({
        credential,
        projectId: process.env.FIREBASE_PROJECT_ID,
    })

    return admin
}

module.exports = { getAdmin }
