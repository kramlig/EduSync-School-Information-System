/**
 * Check Form 137 Records Structure
 * 
 * Verifies if Form 137 records use the new cumulative structure
 */

// Force production mode - disable emulator
delete process.env.FIRESTORE_EMULATOR_HOST;
process.env.FIRESTORE_EMULATOR_HOST = '';

const admin = require('firebase-admin');

// Initialize with production credentials
admin.initializeApp({
  projectId: 'edusync-sis',
});

console.log('✅ Firebase Admin initialized (production: edusync-sis)');
console.log('');

const db = admin.firestore();

async function checkForm137Records() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Form 137 Structure Check                                ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    // Get all Form 137 records
    const snapshot = await db.collection('academicHistory').get();
    
    console.log(`📊 Total Form 137 Records: ${snapshot.size}`);
    console.log('');
    
    if (snapshot.empty) {
      console.log('ℹ️  No Form 137 records found in database');
      console.log('   This is expected if this is a fresh deployment');
      console.log('');
      return;
    }
    
    let newStructureCount = 0;
    let oldStructureCount = 0;
    const oldStructureRecords = [];
    const newStructureRecords = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      if (data.schoolYears && Array.isArray(data.schoolYears)) {
        // New cumulative structure
        newStructureCount++;
        newStructureRecords.push({
          id: doc.id,
          student: data.studentName,
          years: data.schoolYears.length
        });
      } else {
        // Old per-year structure
        oldStructureCount++;
        oldStructureRecords.push({
          id: doc.id,
          student: data.studentName,
          schoolYear: data.schoolYear,
          hasSubjects: !!data.subjects
        });
      }
    });
    
    console.log('📈 Structure Analysis:');
    console.log(`   ✅ New Cumulative Structure: ${newStructureCount} record(s)`);
    console.log(`   ⚠️  Old Per-Year Structure: ${oldStructureCount} record(s)`);
    console.log('');
    
    if (newStructureCount > 0) {
      console.log('✅ NEW STRUCTURE RECORDS (Cumulative):');
      console.log('─'.repeat(60));
      newStructureRecords.forEach(record => {
        console.log(`   • ${record.student}`);
        console.log(`     ID: ${record.id}`);
        console.log(`     Years Recorded: ${record.years}`);
        console.log('');
      });
    }
    
    if (oldStructureCount > 0) {
      console.log('⚠️  OLD STRUCTURE RECORDS (Per-Year):');
      console.log('─'.repeat(60));
      console.log('   These records need to be migrated or regenerated:');
      console.log('');
      oldStructureRecords.forEach(record => {
        console.log(`   • ${record.student} - ${record.schoolYear}`);
        console.log(`     ID: ${record.id}`);
        console.log(`     Has subjects: ${record.hasSubjects ? 'Yes' : 'No'}`);
        console.log('');
      });
      
      console.log('');
      console.log('💡 RECOMMENDATION:');
      console.log('   Option 1: Delete old records and regenerate using Dashboard');
      console.log('   Option 2: Run migration script (if available)');
      console.log('');
    }
    
    if (newStructureCount > 0 && oldStructureCount === 0) {
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║   ✅ ALL RECORDS USE NEW CUMULATIVE STRUCTURE!           ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error checking Form 137 records:', error.message);
    console.error(error);
  }
}

async function checkStudentsWithoutForm137() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Students Without Form 137                               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    // Get all students
    const studentsSnap = await db.collection('students').limit(10).get();
    const form137Snap = await db.collection('academicHistory').get();
    
    const studentIds = new Set(studentsSnap.docs.map(doc => doc.id));
    const form137StudentIds = new Set();
    
    form137Snap.forEach(doc => {
      form137StudentIds.add(doc.data().studentId);
    });
    
    const studentsWithout = [];
    studentsSnap.forEach(doc => {
      if (!form137StudentIds.has(doc.id)) {
        studentsWithout.push({
          id: doc.id,
          name: doc.data().name,
          gradeLevel: doc.data().gradeLevel
        });
      }
    });
    
    console.log(`📊 Checked ${studentsSnap.size} students (sample)`);
    console.log(`   Students WITH Form 137: ${studentIds.size - studentsWithout.length}`);
    console.log(`   Students WITHOUT Form 137: ${studentsWithout.length}`);
    console.log('');
    
    if (studentsWithout.length > 0) {
      console.log('Students without Form 137 (ready for auto-generation):');
      studentsWithout.slice(0, 5).forEach(student => {
        console.log(`   • ${student.name} - Grade ${student.gradeLevel}`);
      });
      if (studentsWithout.length > 5) {
        console.log(`   ... and ${studentsWithout.length - 5} more`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  await checkForm137Records();
  await checkStudentsWithoutForm137();
  
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Check Complete                                          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
