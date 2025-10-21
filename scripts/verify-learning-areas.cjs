const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'edusync-sis' });

admin.firestore().collection('learningAreas')
    .orderBy('name')
    .get()
    .then(snap => {
        console.log('\n📚 ALL LEARNING AREAS:\n');
        
        const byLevel = {
            'Elementary (1-3)': [],
            'Elementary (4-6)': [],
            'Junior High (7-10)': [],
            'Senior High (11-12)': []
        };
        
        snap.docs.forEach(doc => {
            const d = doc.data();
            const grades = d.gradeLevels || [d.gradeLevel];
            const maxGrade = Math.max(...grades);
            const minGrade = Math.min(...grades);
            
            if (maxGrade <= 3) byLevel['Elementary (1-3)'].push(d.name);
            else if (maxGrade <= 6) byLevel['Elementary (4-6)'].push(d.name);
            else if (maxGrade <= 10) byLevel['Junior High (7-10)'].push(d.name);
            else byLevel['Senior High (11-12)'].push(d.name);
        });
        
        Object.entries(byLevel).forEach(([level, areas]) => {
            if (areas.length > 0) {
                console.log(`${level}:`);
                areas.forEach(name => console.log(`  ✓ ${name}`));
                console.log('');
            }
        });
        
        console.log(`Total: ${snap.size} learning areas\n`);
        process.exit(0);
    });
