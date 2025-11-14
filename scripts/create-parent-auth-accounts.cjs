const admin = require('firebase-admin');

// Disable emulator
delete process.env.FIRESTORE_EMULATOR_HOST;

admin.initializeApp({
    projectId: 'edusync-sis'
});

const auth = admin.auth();
const db = admin.firestore();

async function createParentAuthAccounts() {
    try {
        console.log('🔧 Creating Firebase Auth accounts for parents...\n');
        
        const parentsSnapshot = await db.collection('parents')
            .where('schoolId', '==', 'default')
            .get();
        
        console.log(`Found ${parentsSnapshot.docs.length} parent records in Firestore\n`);
        
        let created = 0;
        let existing = 0;
        
        for (const doc of parentsSnapshot.docs) {
            const parentData = doc.data();
            const email = parentData.email;
            
            if (!email) {
                console.log(`⏭️ Skipping ${doc.id} - no email`);
                continue;
            }
            
            try {
                // Check if auth account already exists
                await auth.getUserByEmail(email);
                console.log(`✓ ${email} - already has auth account`);
                existing++;
            } catch (error) {
                if (error.code === 'auth/user-not-found') {
                    // Create auth account
                    const userRecord = await auth.createUser({
                        uid: doc.id, // Use same ID as Firestore doc
                        email: email,
                        password: 'parent123', // Default password
                        emailVerified: true,
                        displayName: parentData.name
                    });
                    
                    // Set custom claims
                    await auth.setCustomUserClaims(userRecord.uid, {
                        role: 'parent',
                        schoolId: parentData.schoolId || 'default'
                    });
                    
                    console.log(`✅ Created auth account for: ${email}`);
                    created++;
                } else {
                    console.log(`❌ Error for ${email}:`, error.message);
                }
            }
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`  ✅ Created: ${created} accounts`);
        console.log(`  ✓ Already existed: ${existing} accounts`);
        console.log(`\n🔑 Default password for all parents: parent123`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createParentAuthAccounts();
