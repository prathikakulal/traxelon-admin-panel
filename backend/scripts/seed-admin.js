// backend/scripts/seed-admin.js
// Run once: node scripts/seed-admin.js
// Sets isAdmin:true in Firestore for your admin email.

import { join, resolve } from 'path'
import { fileURLToPath } from 'url'
import admin from 'firebase-admin'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..')

const serviceAccountPath = resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'serviceAccountKey.json')
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })

const db = admin.firestore()
const auth = admin.auth()

const ADMIN_EMAIL = process.argv[2]

if (!ADMIN_EMAIL) {
    console.error('❌  Please provide an email address.')
    console.error('    Usage: node scripts/seed-admin.js <admin_email@example.com> [password]')
    process.exit(1)
}
const ADMIN_PASSWORD = process.argv[3]


async function seedAdmin() {
    console.log(`\n🔍  Looking up Firebase Auth user for: ${ADMIN_EMAIL}`)

    let userRecord
    try {
        userRecord = await auth.getUserByEmail(ADMIN_EMAIL)
        console.log(`✅  Found user UID: ${userRecord.uid}`)
    } catch (e) {
        if (e.code === 'auth/user-not-found' && ADMIN_PASSWORD) {
            console.log(`⚠️  User not found. Creating user with provided password...`)
            userRecord = await auth.createUser({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                emailVerified: true
            })
            console.log(`✅  Created user UID: ${userRecord.uid}`)
        } else {
            console.error(`❌  User not found in Firebase Auth for email "${ADMIN_EMAIL}"`)
            console.error('    → Make sure you created the user in the Firebase Console first, or provide a password as the second argument.')
            process.exit(1)
        }
    }

    const uid = userRecord.uid
    
    // Force update password if provided
    if (ADMIN_PASSWORD) {
        console.log(`🔑  Updating password for user...`)
        await auth.updateUser(uid, { password: ADMIN_PASSWORD })
        console.log(`✅  Password updated.`)
    }

    const userRef = db.collection('users').doc(uid)
    const snap = await userRef.get()

    if (snap.exists) {
        console.log('📄  Existing Firestore doc:', snap.data())
        await userRef.update({ isAdmin: true })
        console.log('✅  Updated isAdmin: true')
    } else {
        await userRef.set({
            email: ADMIN_EMAIL,
            isAdmin: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
        console.log('✅  Created new Firestore doc with isAdmin: true')
    }

    console.log('\n🎉  Done! You can now log in to the Admin panel.\n')
    process.exit(0)
}

seedAdmin().catch(e => {
    console.error('Fatal error:', e)
    process.exit(1)
})
