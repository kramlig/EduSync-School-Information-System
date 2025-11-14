const admin = require('firebase-admin');

// Disable emulator
delete process.env.FIRESTORE_EMULATOR_HOST;

admin.initializeApp({
    projectId: 'edusync-sis'
});

const db = admin.firestore();

async function analyzeSchedules() {
    try {
        console.log('🔍 Analyzing all schedules...\n');
        
        const snapshot = await db.collection('classSchedules').get();
        
        const withScope = [];
        const withoutScope = [];
        const withTitle = [];
        const withoutTitle = [];
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.scope) withScope.push(doc.id);
            else withoutScope.push(doc.id);
            
            if (data.title) withTitle.push(doc.id);
            else withoutTitle.push(doc.id);
        });
        
        console.log(`📊 Total schedules: ${snapshot.docs.length}`);
        console.log(`✅ With scope: ${withScope.length}`);
        console.log(`❌ Missing scope: ${withoutScope.length}`);
        console.log(`✅ With title: ${withTitle.length}`);
        console.log(`❌ Missing title: ${withoutTitle.length}`);
        
        // Sample bad schedule
        if (withoutScope.length > 0) {
            const badDoc = snapshot.docs.find(d => d.id === withoutScope[0]);
            console.log('\n📋 Sample BAD schedule:');
            console.log(JSON.stringify(badDoc.data(), null, 2));
        }
        
        // Sample good schedule
        if (withScope.length > 0) {
            const goodDoc = snapshot.docs.find(d => d.id === withScope[0]);
            console.log('\n✅ Sample GOOD schedule:');
            console.log(JSON.stringify(goodDoc.data(), null, 2));
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

analyzeSchedules();
