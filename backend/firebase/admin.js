// backend/firebase/admin.js
import admin from 'firebase-admin'
import { existsSync } from 'fs'

// Polyfill for internal libraries that might need it
if (typeof globalThis.Buffer === 'undefined') {
    import('node:buffer').then(({ Buffer }) => {
        globalThis.Buffer = Buffer;
    });
}

export function getAdmin() {
    if (admin.apps.length) return admin

    let credential

    if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
        try {
            let json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8')
            const firstBrace = json.indexOf('{')
            const lastBrace = json.lastIndexOf('}')
            if (firstBrace !== -1 && lastBrace !== -1) {
                json = json.substring(firstBrace, lastBrace + 1)
            }
            credential = admin.credential.cert(JSON.parse(json))
        } catch (err) {
            console.warn('⚠️ Warning: Failed to parse FIREBASE_SERVICE_ACCOUNT_B64 string as JSON.')
        }
    } 
    
    if (!credential) {
        try {
            credential = admin.credential.applicationDefault()
        } catch (err) {
            console.error("Critical: Could not initialize Firebase credentials.")
        }
    }

    if (!admin.apps.length) {
        admin.initializeApp({
            credential,
            projectId: process.env.FIREBASE_PROJECT_ID ? process.env.FIREBASE_PROJECT_ID.trim() : undefined,
        })
    }

    return admin
}
