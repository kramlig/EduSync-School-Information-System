const admin = require('firebase-admin');
delete process.env.FIRESTORE_EMULATOR_HOST;
admin.initializeApp({projectId: 'edusync-sis'});

admin.auth().listUsers(1000).then(result => {
  const withEmail = result.users.filter(u => u.email);
  console.log('Firebase Auth users WITH email:');
  console.log('='.repeat(60));
  withEmail.forEach(u => {
    console.log(`- ${u.email}`);
  });
  console.log(`\nTotal: ${withEmail.length} users with email`);
  console.log(`Total: ${result.users.length} users overall`);
  process.exit(0);
});
