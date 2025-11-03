const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';

try { 
  admin.app(); 
} catch(e) { 
  admin.initializeApp({ projectId: 'edusync-local' }); 
}

const db = admin.firestore();

async function checkParents() {
  console.log('🔍 Checking parent accounts in emulator...\n');
  
  const snap = await db.collection('parents').get();
  
  console.log(`📊 Total parents: ${snap.size}\n`);
  
  if (snap.empty) {
    console.log('❌ No parent accounts found!');
    console.log('\n💡 Run: node scripts/fix-parent-data.cjs');
  } else {
    snap.forEach(doc => {
      const data = doc.data();
      console.log('✅ Parent found:');
      console.log(`   ID: ${doc.id}`);
      console.log(`   Name: ${data.name}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   Password: ${data.password}`);
      console.log(`   Student IDs: ${data.studentIds?.join(', ') || 'none'}`);
      console.log(`   Phone: ${data.phone}`);
      console.log('');
    });
  }
  
  process.exit(0);
}

checkParents().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
