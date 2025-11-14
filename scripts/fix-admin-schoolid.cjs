const admin = require('firebase-admin');

// Disable emulator
delete process.env.FIRESTORE_EMULATOR_HOST;

admin.initializeApp({
    projectId: 'edusync-sis'
});

const db = admin.firestore();

async function fixAdminSchoolId() {
    try {
        console.log('🔧 Updating admin user to have schoolId="default"...\n');
        
        // Update admin@school.edu
        await db.collection('users').doc('admin-user').update({
            schoolId: 'default'
        });
        
        console.log('✅ Updated admin@school.edu with schoolId="default"');
        
        // Verify
        const doc = await db.collection('users').doc('admin-user').get();
        console.log('\nVerified user document:');
        console.log(JSON.stringify(doc.data(), null, 2));
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixAdminSchoolId();
