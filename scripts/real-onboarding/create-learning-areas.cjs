/**
 * Create Learning Areas for Elementary School (Grades 1-6)
 * Based on DepEd curriculum
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

// Elementary DepEd Curriculum (Grades 1-6)
const ELEMENTARY_LEARNING_AREAS = [
  { name: 'Mother Tongue', code: 'MTB', order: 1, gradeLevel: [1, 2, 3] },
  { name: 'Filipino', code: 'FIL', order: 2, gradeLevel: [1, 2, 3, 4, 5, 6] },
  { name: 'English', code: 'ENG', order: 3, gradeLevel: [1, 2, 3, 4, 5, 6] },
  { name: 'Mathematics', code: 'MATH', order: 4, gradeLevel: [1, 2, 3, 4, 5, 6] },
  { name: 'Science', code: 'SCI', order: 5, gradeLevel: [1, 2, 3, 4, 5, 6] },
  { name: 'Araling Panlipunan', code: 'AP', order: 6, gradeLevel: [1, 2, 3, 4, 5, 6] },
  { name: 'Edukasyon sa Pagpapakatao', code: 'ESP', order: 7, gradeLevel: [1, 2, 3, 4, 5, 6] },
  { 
    name: 'MAPEH', 
    code: 'MAPEH', 
    order: 8, 
    gradeLevel: [1, 2, 3, 4, 5, 6],
    isComposite: true,
    components: ['Music', 'Arts', 'Physical Education', 'Health']
  },
  { name: 'Technology and Livelihood Education', code: 'TLE', order: 9, gradeLevel: [4, 5, 6] }
];

async function createLearningAreas() {
  console.log('\n📚 CREATING LEARNING AREAS\n');
  
  const schoolsSnap = await db.collection('schools').limit(1).get();
  if (schoolsSnap.empty) {
    console.log('❌ No school found!');
    return;
  }
  
  const schoolDoc = schoolsSnap.docs[0];
  const schoolId = schoolDoc.id;
  const schoolData = schoolDoc.data();
  
  console.log(`📍 School: ${schoolData.name} (${schoolId})\n`);
  
  const batch = db.batch();
  let created = 0;
  
  for (const la of ELEMENTARY_LEARNING_AREAS) {
    const laId = `la_${la.code.toLowerCase()}`;
    const laRef = db.collection('learningAreas').doc(laId);
    
    const learningArea = {
      id: laId,
      schoolId: schoolId,
      name: la.name,
      code: la.code,
      gradeLevel: la.gradeLevel,
      order: la.order,
      isActive: true,
      credits: 1,
      isComposite: la.isComposite || false,
      components: la.components || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    batch.set(laRef, learningArea);
    
    console.log(`✅ ${la.name} (${la.code}) - Grades ${la.gradeLevel.join(', ')}`);
    created++;
  }
  
  await batch.commit();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ LEARNING AREAS CREATED!');
  console.log('='.repeat(60));
  console.log(`\n📊 Total: ${created} learning areas`);
  console.log('\n📝 Next Steps:');
  console.log('   1. Login as teacher (e.g., maria.santos@teacher.local / Teacher123!)');
  console.log('   2. Navigate to Grades & Reports → Grade Entry');
  console.log('   3. Select a section and enter grades');
  console.log('   4. Test grade calculations (WW×0.3 + PT×0.5 + QA×0.2)\n');
}

createLearningAreas().catch(console.error);
