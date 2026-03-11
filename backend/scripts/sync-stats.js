const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  const usersSnap = await db.collection('users').get();
  
  let totalOfficers = usersSnap.docs.length;
  let approved = 0;
  let pending = 0;
  let totalCredits = 0;
  
  usersSnap.docs.forEach(d => {
    const u = d.data();
    if (u.status === 'approved' || !u.status) approved++;
    if (u.status === 'pending') pending++;
    if (u.status === 'rejected') pending++; // user wants revoked users in pending tab to increase
    totalCredits += (u.credits || 0);
  });
  
  console.log({ totalOfficers, approved, pending, totalCredits });
  await db.collection('metadata').doc('dashboardStats').set({
    totalOfficers, approved, pending, totalCredits
  }, {merge: true});
  console.log("Synced!");
}
run();
