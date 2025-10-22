/**
 * Clean and Reseed Grades
 * 
 * This script:
 * 1. Deletes ALL existing grade records (both g_* and grade_* formats)
 * 2. Reseeds with fresh grade data using correct grade_ prefix
 * 3. Generates realistic sample grades for all students
 * 
 * NOTE: Uses Firebase Admin SDK for elevated permissions
 */

const admin = require('firebase-admin');

// Ensure we're connecting to PRODUCTION (not emulator)
delete process.env.FIRESTORE_EMULATOR_HOST;

// Initialize Admin SDK with default credentials
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'edusync-sis'
  });
}

const db = admin.firestore();

// Generate random grade between 75-100
function generateGrade() {
  return Math.floor(Math.random() * 26) + 75; // 75-100
}

async function deleteAllGrades() {
  console.log('\n🗑️  STEP 1: Deleting all existing grades...');
  
  const gradesRef = db.collection('grades');
  const snapshot = await gradesRef.get();
  
  console.log(`📊 Found ${snapshot.size} grade records to delete`);
  
  if (snapshot.size === 0) {
    console.log('✅ No grades to delete');
    return;
  }
  
  // Delete in batches of 500 (Firestore limit)
  const batchSize = 500;
  let deletedCount = 0;
  
  for (let i = 0; i < snapshot.docs.length; i += batchSize) {
    const batch = db.batch();
    const batchDocs = snapshot.docs.slice(i, i + batchSize);
    
    batchDocs.forEach(docSnapshot => {
      batch.delete(docSnapshot.ref);
    });
    
    await batch.commit();
    deletedCount += batchDocs.length;
    console.log(`   Deleted ${deletedCount}/${snapshot.size} grades...`);
  }
  
  console.log(`✅ Deleted all ${deletedCount} grade records`);
}

async function reseedGrades() {
  console.log('\n🌱 STEP 2: Reseeding grades with correct format...');
  
  // Fetch students
  const studentsSnapshot = await db.collection('students').get();
  const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(`📚 Found ${students.length} students`);
  
  // Fetch learning areas
  const learningAreasSnapshot = await db.collection('learningAreas').get();
  const learningAreas = learningAreasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(`📖 Found ${learningAreas.length} learning areas`);
  
  // Generate grades
  const grades = [];
  const quarters = ['q1', 'q2', 'q3', 'q4'];
  
  for (const student of students) {
    // Filter learning areas by student's grade level
    const studentLearningAreas = learningAreas.filter(la => {
      if (student.gradeLevel === 0 || student.gradeLevel === 'kindergarten') {
        return la.id.includes('_kinder');
      } else if (student.gradeLevel >= 1 && student.gradeLevel <= 6) {
        return la.id.includes('_elem');
      } else if (student.gradeLevel >= 7 && student.gradeLevel <= 10) {
        return la.id.includes('_jhs');
      } else if (student.gradeLevel >= 11 && student.gradeLevel <= 12) {
        return la.id.includes('_shs');
      }
      return false;
    });
    
    for (const learningArea of studentLearningAreas) {
      // Use CORRECT format: grade_ prefix
      const gradeId = `grade_${student.id}_${learningArea.id}`;
      
      const gradeData = {
        id: gradeId,
        studentId: student.id,
        learningAreaId: learningArea.id,
        q1: generateGrade(),
        q2: generateGrade(),
        q3: generateGrade(),
        q4: generateGrade(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system'
      };
      
      grades.push(gradeData);
    }
  }
  
  console.log(`📝 Generated ${grades.length} grade records`);
  
  // Write in batches of 500
  const batchSize = 500;
  let writtenCount = 0;
  
  for (let i = 0; i < grades.length; i += batchSize) {
    const batch = db.batch();
    const batchGrades = grades.slice(i, i + batchSize);
    
    batchGrades.forEach(grade => {
      const gradeRef = db.collection('grades').doc(grade.id);
      batch.set(gradeRef, grade);
    });
    
    await batch.commit();
    writtenCount += batchGrades.length;
    console.log(`   Written ${writtenCount}/${grades.length} grades...`);
  }
  
  console.log(`✅ Successfully seeded ${writtenCount} grade records`);
  
  // Show sample
  console.log('\n📋 Sample grade records:');
  grades.slice(0, 5).forEach(grade => {
    console.log(`   ${grade.id}: Q1=${grade.q1}, Q2=${grade.q2}, Q3=${grade.q3}, Q4=${grade.q4}`);
  });
}

async function verifyGrades() {
  console.log('\n🔍 STEP 3: Verifying grade data...');
  
  const gradesSnapshot = await db.collection('grades').get();
  console.log(`📊 Total grades in database: ${gradesSnapshot.size}`);
  
  // Check ID formats
  let gradePrefix = 0;
  let gPrefix = 0;
  let other = 0;
  
  gradesSnapshot.docs.forEach(doc => {
    if (doc.id.startsWith('grade_')) {
      gradePrefix++;
    } else if (doc.id.startsWith('g_')) {
      gPrefix++;
    } else {
      other++;
    }
  });
  
  console.log('📋 ID Format Distribution:');
  console.log(`   ✅ grade_* format: ${gradePrefix}`);
  console.log(`   ⚠️  g_* format: ${gPrefix}`);
  console.log(`   ⚠️  other format: ${other}`);
  
  if (gPrefix > 0 || other > 0) {
    console.log('\n⚠️  WARNING: Found grades with incorrect ID format!');
  } else {
    console.log('\n✅ All grades use correct grade_ prefix format!');
  }
}

async function main() {
  console.log('🚀 Starting grade cleanup and reseed process...\n');
  console.log('⚠️  WARNING: This will DELETE ALL existing grade data!');
  console.log('📦 Project: edusync-sis (PRODUCTION)');
  console.log('\nStarting in 3 seconds...');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    await deleteAllGrades();
    await reseedGrades();
    await verifyGrades();
    
    console.log('\n✅ SUCCESS! Grade database cleaned and reseeded.');
    console.log('🎯 All grades now use the correct grade_ prefix format.');
    console.log('\n🔄 Please refresh your browser to see the changes.');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  }
}

main();
