const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'edusync-sis' });
}

const db = admin.firestore();

async function deleteOldSchedules() {
  const teacherUids = [
    '0zmqWQf0esd4wGyrMgptFFvujw33', // Maria Cruz
    'I8efnMqx0yeKVS7TePEbexZFUiF3', // Juan Santos
    'to6WvvMmc3ekfSK0cX5ub7DDAVo1'  // Ana Reyes
  ];

  for (const uid of teacherUids) {
    // Delete schedules with teacherUid
    const snap = await db.collection('classSchedules')
      .where('teacherUid', '==', uid)
      .get();
    
    console.log(`Deleting ${snap.size} schedules with teacherUid=${uid}`);
    
    if (snap.size > 0) {
      const batch = db.batch();
      snap.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
  }

  console.log('✅ Old schedules deleted');
  process.exit(0);
}

deleteOldSchedules().catch(console.error);
