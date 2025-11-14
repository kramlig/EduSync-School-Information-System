const admin = require('firebase-admin');

// Disable emulator
delete process.env.FIRESTORE_EMULATOR_HOST;

admin.initializeApp({
    projectId: 'edusync-sis'
});

const db = admin.firestore();

async function fixSchedules() {
    try {
        console.log('🔧 Fixing schedules with missing scope and title...\n');
        
        const snapshot = await db.collection('classSchedules').get();
        const batch = db.batch();
        let fixCount = 0;
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            
            // Skip if already has scope and title
            if (data.scope && data.title) continue;
            
            const updates = {};
            
            // Add scope if missing
            if (!data.scope) {
                updates.scope = 'section'; // All old schedules are section-specific
            }
            
            // Add title if missing (derive from learningAreaId)
            if (!data.title && data.learningAreaId) {
                // We'll need to look up the learning area name
                // For now, just use the learningAreaId
                updates.title = data.learningAreaId.replace('la_', '').replace(/_/g, ' ');
                // Capitalize first letter
                updates.title = updates.title.charAt(0).toUpperCase() + updates.title.slice(1);
            }
            
            // Add type if missing
            if (!data.type) {
                updates.type = 'academic'; // All old schedules are academic
            }
            
            if (Object.keys(updates).length > 0) {
                batch.update(doc.ref, updates);
                fixCount++;
                
                if (fixCount === 1) {
                    console.log('Sample update:');
                    console.log(`  ${doc.id}`);
                    console.log(`  Updates:`, updates);
                }
            }
        }
        
        console.log(`\n📝 Updating ${fixCount} schedules...`);
        await batch.commit();
        console.log('✅ All schedules fixed!');
        
        // Verify
        const verifySnapshot = await db.collection('classSchedules').get();
        const withScope = verifySnapshot.docs.filter(d => d.data().scope).length;
        const withTitle = verifySnapshot.docs.filter(d => d.data().title).length;
        
        console.log(`\n✅ Verification:`);
        console.log(`  Total schedules: ${verifySnapshot.docs.length}`);
        console.log(`  With scope: ${withScope}`);
        console.log(`  With title: ${withTitle}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixSchedules();
