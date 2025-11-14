const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'edusync-sis'
});

async function toggleAccount() {
  try {
    const email = 'parent1@edusync-demo.ph';
    
    console.log('Attempting to reset rate limit for:', email);
    
    const user = await admin.auth().getUserByEmail(email);
    
    console.log('\nStep 1: Disabling account...');
    await admin.auth().updateUser(user.uid, { disabled: true });
    console.log('✅ Account disabled');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\nStep 2: Re-enabling account...');
    await admin.auth().updateUser(user.uid, { disabled: false });
    console.log('✅ Account re-enabled');
    
    console.log('\n✅ Rate limit MAY be cleared. Try logging in again.');
    console.log('If it still fails, use parent2@edusync-demo.ph instead.');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

toggleAccount();
