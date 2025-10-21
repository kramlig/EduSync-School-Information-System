const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'edusync-sis' });

admin.firestore().collection('learningAreas')
    .get()
    .then(snap => {
        console.log('\n📚 LEARNING AREAS BY LEVEL:\n');
        
        const elementary = [];
        const juniorHigh = [];
        const seniorHigh = [];
        
        snap.docs.forEach(doc => {
            const d = doc.data();
            const item = {
                name: d.name,
                id: doc.id,
                gradeLevel: d.gradeLevel,
                gradeLevels: d.gradeLevels
            };
            
            // Check which level this belongs to
            if (d.gradeLevels && Array.isArray(d.gradeLevels)) {
                const max = Math.max(...d.gradeLevels);
                if (max <= 6) elementary.push(item);
                else if (max <= 10) juniorHigh.push(item);
                else seniorHigh.push(item);
            } else if (d.gradeLevel) {
                if (d.gradeLevel <= 6) elementary.push(item);
                else if (d.gradeLevel <= 10) juniorHigh.push(item);
                else seniorHigh.push(item);
            }
        });
        
        console.log('📚 ELEMENTARY (Grades 1-6):');
        elementary.forEach(la => {
            const grades = la.gradeLevels ? la.gradeLevels.join(', ') : la.gradeLevel;
            console.log(`  ✓ ${la.name.padEnd(40)} (Grades ${grades})`);
        });
        console.log(`  Total: ${elementary.length}\n`);
        
        console.log('🎓 JUNIOR HIGH (Grades 7-10):');
        juniorHigh.forEach(la => {
            const grades = la.gradeLevels ? la.gradeLevels.join(', ') : la.gradeLevel;
            console.log(`  ✓ ${la.name.padEnd(40)} (Grades ${grades})`);
        });
        console.log(`  Total: ${juniorHigh.length}\n`);
        
        console.log('🏆 SENIOR HIGH (Grades 11-12):');
        seniorHigh.slice(0, 10).forEach(la => {
            const grades = la.gradeLevels ? la.gradeLevels.join(', ') : la.gradeLevel;
            console.log(`  ✓ ${la.name.padEnd(40)} (Grades ${grades})`);
        });
        console.log(`  ... and ${seniorHigh.length - 10} more`);
        console.log(`  Total: ${seniorHigh.length}\n`);
        
        process.exit(0);
    });
