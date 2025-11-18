/**
 * Check section data and student distribution
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = 'edusync-sis';
delete process.env.FIRESTORE_EMULATOR_HOST;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: projectId
  });
}

const db = getFirestore();

async function checkSections() {
  console.log('\n🔍 CHECKING SECTIONS AND STUDENTS\n');
  
  const sectionsSnap = await db.collection('sections').get();
  
  console.log(`📚 Total Sections: ${sectionsSnap.size}\n`);
  
  for (const doc of sectionsSnap.docs) {
    const section = doc.data();
    console.log(`Section ID: ${doc.id}`);
    console.log(`  Display Name: ${section.displayName || 'MISSING'}`);
    console.log(`  Name: ${section.name || 'MISSING'}`);
    console.log(`  Section Name: ${section.sectionName || 'MISSING'}`);
    console.log(`  Grade Level: ${section.gradeLevel}`);
    console.log(`  Students: ${section.students?.length || 0}`);
    console.log('');
  }
  
  // Check how many students per section
  const studentsSnap = await db.collection('students').get();
  const studentsBySectionId = new Map();
  
  studentsSnap.forEach(doc => {
    const student = doc.data();
    const sectionId = student.sectionId;
    if (!studentsBySectionId.has(sectionId)) {
      studentsBySectionId.set(sectionId, []);
    }
    studentsBySectionId.get(sectionId).push({
      name: student.name,
      sectionId: sectionId
    });
  });
  
  console.log('\n📊 Students per Section (from students collection):');
  studentsBySectionId.forEach((students, sectionId) => {
    const section = sectionsSnap.docs.find(d => d.id === sectionId);
    const sectionName = section ? section.data().displayName : 'UNKNOWN';
    console.log(`  ${sectionName} (${sectionId}): ${students.length} students`);
  });
  
  console.log('\n');
}

checkSections().catch(console.error);
