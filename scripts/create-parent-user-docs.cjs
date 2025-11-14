const admin = require('firebase-admin');

// Disable emulator
delete process.env.FIRESTORE_EMULATOR_HOST;

admin.initializeApp({
    projectId: 'edusync-sis'
});

const db = admin.firestore();

async function createParentUserDocs() {
    try {
        console.log('🔧 Creating users collection documents for parents...\n');
        
        const parentsSnapshot = await db.collection('parents')
            .where('schoolId', '==', 'default')
            .get();
        
        console.log(`Found ${parentsSnapshot.docs.length} parent records\n`);
        
        let created = 0;
        let existing = 0;
        
        for (const doc of parentsSnapshot.docs) {
            const parentData = doc.data();
            
            // Check if user doc already exists
            const userDoc = await db.collection('users').doc(doc.id).get();
            
            if (userDoc.exists) {
                console.log(`✓ ${parentData.email} - already has users doc`);
                existing++;
            } else {
                // Create users document
                await db.collection('users').doc(doc.id).set({
                    id: doc.id,
                    email: parentData.email,
                    name: parentData.name,
                    role: 'parent',
                    schoolId: parentData.schoolId || 'default',
                    studentIds: parentData.studentIds || [],
                    phone: parentData.phone || '',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    emailVerified: true,
                    isDemo: parentData.isDemo || false
                });
                
                console.log(`✅ Created users doc for: ${parentData.email}`);
                created++;
            }
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`  ✅ Created: ${created} user documents`);
        console.log(`  ✓ Already existed: ${existing} user documents`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createParentUserDocs();
