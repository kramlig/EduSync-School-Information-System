const admin = require('firebase-admin');

// Disable emulator
delete process.env.FIRESTORE_EMULATOR_HOST;

admin.initializeApp({
    projectId: 'edusync-sis'
});

const db = admin.firestore();

async function listAdminUsers() {
    try {
        console.log('🔍 Finding admin users in Firestore...\n');
        
        const usersSnapshot = await db.collection('users')
            .where('role', '==', 'admin')
            .get();
        
        console.log(`📊 Found ${usersSnapshot.docs.length} admin users:\n`);
        
        for (const doc of usersSnapshot.docs) {
            const data = doc.data();
            console.log(`Email: ${data.email}`);
            console.log(`  UID: ${doc.id}`);
            console.log(`  schoolId: ${data.schoolId || '(not set)'}`);
            console.log(`  name: ${data.name}`);
            console.log('');
        }
        
        // Also check all users with schoolId='default'
        console.log('\n🔍 All users with schoolId="default":\n');
        const defaultUsersSnapshot = await db.collection('users')
            .where('schoolId', '==', 'default')
            .limit(5)
            .get();
        
        for (const doc of defaultUsersSnapshot.docs) {
            const data = doc.data();
            console.log(`${data.role}: ${data.email} (${data.name})`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

listAdminUsers();
