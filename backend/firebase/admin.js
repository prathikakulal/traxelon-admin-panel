// backend/firebase/admin.js
//
// Firebase Admin SDK — lazy singleton.
// Call getAdmin() when you need the admin instance.
// This avoids crashing on startup if credentials aren't configured yet.

const admin = require('firebase-admin')

function getAdmin() {
    if (admin.apps.length) return admin

    let credential

    // if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    //     // Option A: base64-encoded JSON string (handy for cloud env vars)
    //     const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8')
    //     credential = admin.credential.cert(JSON.parse(json))
    // }
    if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
        try {
            let json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8')
            
            // Strip out invisible BOM, trailing null characters, or extra whitespace
            // by finding the first '{' and the last '}'
            const firstBrace = json.indexOf('{')
            const lastBrace = json.lastIndexOf('}')
            if (firstBrace !== -1 && lastBrace !== -1) {
                json = json.substring(firstBrace, lastBrace + 1)
            }

            credential = admin.credential.cert(JSON.parse(json))
        } catch (err) {
            console.warn('⚠️ Warning: Failed to parse FIREBASE_SERVICE_ACCOUNT_B64 string as JSON. Falling back to next credential method...')
        }
    } 
    
    if (!credential && process.env.FIREBASE_SERVICE_ACCOUNT_PATH && require('fs').existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
        // Option B: path to the downloaded JSON file (only if the file actually exists)
        const serviceAccount = require(require('path').resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH))
        credential = admin.credential.cert(serviceAccount)
    } 
    
    if (!credential) {
        // Option C: Application Default Credentials (works on GCP / Cloud Run)
        try {
            credential = admin.credential.applicationDefault()
        } catch (err) {
            console.error("Critical: Could not initialize Firebase credentials.")
        }
    }

    admin.initializeApp({
        credential,
        projectId: process.env.FIREBASE_PROJECT_ID ? process.env.FIREBASE_PROJECT_ID.trim() : undefined,
    })

    return admin
}

module.exports = { getAdmin }
