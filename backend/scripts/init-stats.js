// backend/scripts/init-stats.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const admin = require('firebase-admin')
const path = require('path')

const serviceAccountPath = path.resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'serviceAccountKey.json')
const serviceAccount = require(serviceAccountPath)

if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}

const db = admin.firestore()

async function initStats() {
    console.log('🔍 Calculating initial totals from database collections...')

    const [totalUsersSnap, totalLinksSnap, approvedSnap, pendingSnap] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('trackingLinks').count().get(),
      db.collection('users').where('status', '==', 'approved').count().get(),
      db.collection('users').where('status', '==', 'rejected').count().get()
    ])

    // Capped to recent 1000 to prevent infinite reads just for seeding, 
    // but in a fresh database this safely gets all of them.
    const [usersRecentSnap, linksRecentSnap] = await Promise.all([
      db.collection('users').orderBy('createdAt', 'desc').limit(1000).get(),
      db.collection('trackingLinks').orderBy('createdAt', 'desc').limit(1000).get()
    ])

    const credits   = usersRecentSnap.docs.reduce((s, d) => s + (d.data().credits || 0), 0)
    const captures  = linksRecentSnap.docs.reduce((s, d) => s + (d.data().captures?.length || 0), 0)

    const statsData = {
      totalOfficers: totalUsersSnap.data().count,
      approved:      approvedSnap.data().count,
      pending:       pendingSnap.data().count,
      totalCredits:  credits,
      totalLinks:    totalLinksSnap.data().count,
      totalCaptures: captures,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }

    console.log('📊 Calculated Stats:', statsData)

    await db.collection('metadata').doc('dashboardStats').set(statsData, { merge: true })

    console.log('✅ Successfully initialized metadata/dashboardStats document.')
}

initStats().then(() => process.exit(0)).catch(e => {
    console.error('Fatal error:', e)
    process.exit(1)
})
