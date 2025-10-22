/**
 * Add Missing MAPEH Elementary Subject to Production Firebase
 * 
 * Current Issue: Only MAPEH JHS exists (la_mapeh_jhs for Grades 7-10)
 * Missing: MAPEH Elementary (for Grades 1-6)
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin for PRODUCTION
admin.initializeApp({
    projectId: 'edusync-sis'
});

const db = admin.firestore();

async function addMAPEHElementary() {
    console.log('\n📚 Adding MAPEH Elementary to Production Firestore...\n');
    
    try {
        // Check if it already exists
        const existing = await db.collection('learningAreas').doc('la_mapeh_elem').get();
        
        if (existing.exists) {
            console.log('⚠️  MAPEH Elementary already exists!');
            console.log('Current data:', existing.data());
            process.exit(0);
        }
        
        // Add MAPEH Elementary
        const mapehElem = {
            id: 'la_mapeh_elem',
            name: 'MAPEH',
            credits: 4,
            isComposite: true,
            subSubjects: ['Music', 'Arts', 'PE', 'Health'],
            category: 'specialized',
            gradeLevel: [1, 2, 3, 4, 5, 6],
            department: 'Arts & Sports',
            kToTwelveCode: 'MAPEH-ELEM',
            isActive: true,
            order: 7,
            description: 'Music, Arts, Physical Education, Health for Elementary',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('learningAreas').doc('la_mapeh_elem').set(mapehElem);
        
        console.log('✅ MAPEH Elementary added successfully!');
        console.log('\nSubject Details:');
        console.log('  Name: MAPEH');
        console.log('  Grades: 1-6');
        console.log('  Category: specialized');
        console.log('  Composite: Music, Arts, PE, Health');
        console.log('  Code: MAPEH-ELEM');
        
        console.log('\n🎉 Done! Refresh your Learning Areas page to see it.');
        
    } catch (error) {
        console.error('❌ Error adding MAPEH Elementary:', error);
    }
    
    process.exit(0);
}

// Run the function
addMAPEHElementary();
