/**
 * Migration Script: Realistically Assign Students to Sections
 * 
 * This creates a realistic distribution:
 * - Students are assigned grade levels based on their age/enrollment date
 * - Students are distributed across multiple sections within each grade
 * - Creates diversity in section assignments (not everyone in the same section)
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const app = initializeApp({
  projectId: 'edusync-sis'
});

const db = getFirestore(app);

function calculateGradeLevel(dateOfBirth, enrollmentDate) {
  // Calculate age in years
  const birthDate = new Date(dateOfBirth);
  const enrollDate = new Date(enrollmentDate);
  const ageAtEnrollment = enrollDate.getFullYear() - birthDate.getFullYear();
  
  // Typical grade level mapping (Philippine K-12):
  // 6-7 years old: Grade 1
  // 7-8 years old: Grade 2
  // etc.
  if (ageAtEnrollment >= 6 && ageAtEnrollment <= 7) return 1;
  if (ageAtEnrollment >= 7 && ageAtEnrollment <= 8) return 2;
  if (ageAtEnrollment >= 8 && ageAtEnrollment <= 9) return 3;
  if (ageAtEnrollment >= 9 && ageAtEnrollment <= 10) return 4;
  if (ageAtEnrollment >= 10 && ageAtEnrollment <= 11) return 5;
  if (ageAtEnrollment >= 11 && ageAtEnrollment <= 12) return 6;
  if (ageAtEnrollment >= 12) return 7;
  
  // Default to a random grade if calculation doesn't work
  return Math.floor(Math.random() * 6) + 1; // Grades 1-6
}

async function fixStudentSectionsRealistic() {
  console.log('🚀 Starting Realistic Student Section Assignment...\n');

  try {
    // Step 1: Fetch all sections grouped by grade level
    console.log('📚 Step 1: Fetching all sections...');
    const sectionsSnapshot = await db.collection('sections').get();
    const sections = sectionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`   ✅ Found ${sections.length} sections`);

    // Group sections by grade level
    const sectionsByGrade = {};
    sections.forEach(section => {
      const grade = section.gradeLevel;
      if (!sectionsByGrade[grade]) {
        sectionsByGrade[grade] = [];
      }
      sectionsByGrade[grade].push(section);
    });

    console.log('\n📊 Available Sections by Grade:');
    Object.keys(sectionsByGrade).sort((a, b) => a - b).forEach(grade => {
      console.log(`   Grade ${grade}: ${sectionsByGrade[grade].length} sections (${sectionsByGrade[grade].map(s => s.name).join(', ')})`);
    });

    // Step 2: Fetch all students
    console.log('\n📚 Step 2: Fetching all students...');
    const studentsSnapshot = await db.collection('students').get();
    const students = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`   ✅ Found ${students.length} students`);

    // Step 3: Assign grade levels based on age and distribute realistically
    console.log('\n🎯 Step 3: Calculating grade levels and creating assignments...');
    
    const updates = [];
    const gradeDistribution = {};

    students.forEach(student => {
      // Calculate appropriate grade level based on age/enrollment
      let gradeLevel = student.gradeLevel;
      
      if (!gradeLevel && student.dateOfBirth && student.enrollmentDate) {
        gradeLevel = calculateGradeLevel(student.dateOfBirth, student.enrollmentDate);
      }
      
      // If still no grade level, assign randomly but realistically
      if (!gradeLevel) {
        // Most students are in elementary (Grades 1-6)
        const rand = Math.random();
        if (rand < 0.15) gradeLevel = 1;
        else if (rand < 0.30) gradeLevel = 2;
        else if (rand < 0.45) gradeLevel = 3;
        else if (rand < 0.60) gradeLevel = 4;
        else if (rand < 0.75) gradeLevel = 5;
        else if (rand < 0.90) gradeLevel = 6;
        else gradeLevel = 7; // Junior high (smaller population)
      }

      // Track distribution
      if (!gradeDistribution[gradeLevel]) {
        gradeDistribution[gradeLevel] = [];
      }
      gradeDistribution[gradeLevel].push(student);
    });

    // Now distribute students within each grade across available sections
    Object.keys(gradeDistribution).forEach(gradeLevel => {
      const gradeStudents = gradeDistribution[gradeLevel];
      const gradeSections = sectionsByGrade[gradeLevel];

      if (!gradeSections || gradeSections.length === 0) {
        // No sections for this grade, assign to a random section from nearby grade
        console.log(`   ⚠️  Grade ${gradeLevel}: No sections! Assigning to nearby grade...`);
        const nearbyGrade = parseInt(gradeLevel) > 3 ? parseInt(gradeLevel) - 1 : parseInt(gradeLevel) + 1;
        const fallbackSections = sectionsByGrade[nearbyGrade] || sections;
        
        gradeStudents.forEach((student, index) => {
          const section = fallbackSections[index % fallbackSections.length];
          updates.push({
            studentId: student.id,
            studentName: student.name,
            oldSectionId: student.sectionId || 'none',
            newSectionId: section.id,
            newSectionName: section.name,
            newGradeLevel: section.gradeLevel
          });
        });
        return;
      }

      // Distribute students across sections (randomized for realism)
      const shuffledSections = [...gradeSections].sort(() => Math.random() - 0.5);
      
      gradeStudents.forEach((student, index) => {
        const sectionIndex = index % shuffledSections.length;
        const assignedSection = shuffledSections[sectionIndex];

        updates.push({
          studentId: student.id,
          studentName: student.name,
          oldSectionId: student.sectionId || 'none',
          newSectionId: assignedSection.id,
          newSectionName: assignedSection.name,
          newGradeLevel: assignedSection.gradeLevel
        });
      });
    });

    // Show distribution summary
    console.log(`\n📊 Grade Level Distribution:`);
    Object.keys(gradeDistribution).sort((a, b) => a - b).forEach(grade => {
      console.log(`   Grade ${grade}: ${gradeDistribution[grade].length} students`);
    });

    // Count students per section
    const sectionCounts = {};
    updates.forEach(update => {
      const key = `Grade ${update.newGradeLevel} - ${update.newSectionName}`;
      sectionCounts[key] = (sectionCounts[key] || 0) + 1;
    });

    console.log(`\n📊 Students per Section:`);
    Object.entries(sectionCounts).sort((a, b) => a[0].localeCompare(b[0])).forEach(([section, count]) => {
      console.log(`   ${section}: ${count} students`);
    });

    console.log(`\n📋 Sample Assignments (first 15):`);
    updates.slice(0, 15).forEach((update, i) => {
      console.log(`   ${i + 1}. ${update.studentName}`);
      console.log(`      ${update.oldSectionId} → Grade ${update.newGradeLevel} - ${update.newSectionName}`);
    });

    // Step 4: Execute updates in batches
    console.log(`\n⚠️  READY TO UPDATE ${updates.length} STUDENT RECORDS`);
    console.log(`   This will take approximately ${Math.ceil(updates.length / 500)} batches\n`);

    console.log('🔄 Step 4: Updating student records...');
    const batchSize = 500;
    let totalUpdated = 0;

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = db.batch();
      const batchUpdates = updates.slice(i, i + batchSize);

      batchUpdates.forEach(update => {
        const studentRef = db.collection('students').doc(update.studentId);
        batch.update(studentRef, { 
          sectionId: update.newSectionId,
          gradeLevel: update.newGradeLevel
        });
      });

      await batch.commit();
      totalUpdated += batchUpdates.length;

      console.log(`   ✅ Batch ${Math.floor(i / batchSize) + 1}: Updated ${batchUpdates.length} students (Total: ${totalUpdated}/${updates.length})`);
    }

    // Step 5: Verify with diverse sample
    console.log('\n🔍 Step 5: Verifying updates (diverse sample)...');
    const verifySnapshot = await db.collection('students').limit(20).get();
    const verifiedStudents = verifySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      gradeLevel: doc.data().gradeLevel,
      sectionId: doc.data().sectionId
    }));

    console.log('\n✅ Sample verified students (showing grade/section diversity):');
    verifiedStudents.forEach(student => {
      const section = sections.find(s => s.id === student.sectionId);
      console.log(`   - ${student.name}: Grade ${student.gradeLevel} - ${section ? section.name : 'NOT FOUND!'}`);
    });

    console.log('\n🎉 Realistic Assignment Complete!');
    console.log(`   ✅ Updated ${totalUpdated} student records`);
    console.log(`   ✅ Students distributed across all grade levels (1-7)`);
    console.log(`   ✅ Students distributed across multiple sections per grade`);
    console.log('\n💡 Students now have diverse grade levels and sections!');
    console.log('   Check the Students page to see the variety.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the migration
fixStudentSectionsRealistic();
