const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'edusync-sis'
});

async function unlockAccount() {
  try {
    const email = 'parent1@edusync-demo.ph';
    
    console.log(`Checking account status for: ${email}`);
    
    // Get the user
    const user = await admin.auth().getUserByEmail(email);
    
    console.log('\n=== CURRENT STATUS ===');
    console.log('UID:', user.uid);
    console.log('Email:', user.email);
    console.log('Disabled:', user.disabled);
    console.log('Email Verified:', user.emailVerified);
    
    // If disabled, enable it
    if (user.disabled) {
      console.log('\n❌ Account is disabled. Enabling...');
      await admin.auth().updateUser(user.uid, { disabled: false });
      console.log('✅ Account enabled successfully');
    } else {
      console.log('\n✅ Account is already enabled');
    }
    
    // The too-many-requests error is temporary and controlled by Firebase Auth
    // It cannot be cleared programmatically - you must wait or:
    console.log('\n📋 IMPORTANT NOTES:');
    console.log('1. The "too-many-requests" error is a temporary rate limit');
    console.log('2. It will automatically expire in 1-2 hours');
    console.log('3. To bypass this for testing, you can:');
    console.log('   a) Try a different email (parent2@edusync-demo.ph)');
    console.log('   b) Wait for the rate limit to expire');
    console.log('   c) Use Firebase Console to reset the password');
    console.log('   d) Disable/Enable the account in Firebase Console');
    
    // Try to delete and recreate (only if really needed - will lose data!)
    console.log('\n⚠️  RESET OPTION (DESTRUCTIVE):');
    console.log('To completely reset this account:');
    console.log('1. Delete the account: firebase auth:delete ' + user.uid);
    console.log('2. Re-run the account creation script');
    console.log('Note: This will break existing data relationships!');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

unlockAccount();
