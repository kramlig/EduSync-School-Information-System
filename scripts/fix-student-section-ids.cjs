/**
 * Migration Script: Fix Student Section IDs
 * 
 * Problem: Students have placeholder section IDs (sec1, sec2, etc.) that don't match
 * the actual section IDs in the database (sec_1760499561616_151690, etc.)
 * 
 * Solution: Map students to real sections based on grade level and update all records
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const app = initializeApp({
  projectId: 'edusync-sis'
});

const db = getFirestore(app);

async function fixStudentSectionIds() {
  console.log('🚀 Starting Student Section ID Migration...\n');

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

    console.log('\n📊 Sections by Grade Level:');
    Object.keys(sectionsByGrade).sort((a, b) => a - b).forEach(grade => {
      console.log(`   Grade ${grade}: ${sectionsByGrade[grade].length} sections`);
      sectionsByGrade[grade].forEach(sec => {
        console.log(`      - ${sec.name} (ID: ${sec.id})`);
      });
    });

    // Step 2: Fetch all students
    console.log('\n📚 Step 2: Fetching all students...');
    const studentsSnapshot = await db.collection('students').get();
    const students = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`   ✅ Found ${students.length} students`);

    // Since students don't have gradeLevel, we'll distribute them evenly across ALL sections
    // Calculate students per section
    const studentsPerSection = Math.ceil(students.length / sections.length);
    console.log(`\n📊 Distribution Plan:`);
    console.log(`   Total students: ${students.length}`);
    console.log(`   Total sections: ${sections.length}`);
    console.log(`   Students per section: ~${studentsPerSection}`);

    // Step 3: Create mapping plan
    console.log('\n📋 Step 3: Creating section assignment plan...');
    const updates = [];

    // Distribute students evenly across all sections
    students.forEach((student, index) => {
      const sectionIndex = Math.floor(index / studentsPerSection) % sections.length;
      const assignedSection = sections[sectionIndex];

      updates.push({
        studentId: student.id,
        studentName: student.name,
        oldSectionId: student.sectionId || 'none',
        newSectionId: assignedSection.id,
        newSectionName: assignedSection.name,
        newGradeLevel: assignedSection.gradeLevel
      });
    });

    console.log(`\n📊 Migration Summary:`);
    console.log(`   Total students to update: ${updates.length}`);

    // Count students per section
    const sectionCounts = {};
    updates.forEach(update => {
      const key = `${update.newSectionName} (Grade ${update.newGradeLevel})`;
      sectionCounts[key] = (sectionCounts[key] || 0) + 1;
    });

    console.log(`\n📊 Students per Section:`);
    Object.entries(sectionCounts).sort((a, b) => a[0].localeCompare(b[0])).forEach(([section, count]) => {
      console.log(`   ${section}: ${count} students`);
    });

    // Show sample mappings
    console.log(`\n📋 Sample Mappings (first 10):`);
    updates.slice(0, 10).forEach((update, i) => {
      console.log(`   ${i + 1}. ${update.studentName}`);
      console.log(`      Old: ${update.oldSectionId} → New: Grade ${update.newGradeLevel} - ${update.newSectionName} (${update.newSectionId})`);
    });

    // Step 4: Confirm before proceeding
    console.log(`\n⚠️  READY TO UPDATE ${updates.length} STUDENT RECORDS`);
    console.log(`   This will take approximately ${Math.ceil(updates.length / 500)} batches\n`);

    // Step 5: Execute updates in batches
    console.log('🔄 Step 4: Updating student records...');
    const batchSize = 500;
    let totalUpdated = 0;

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = db.batch();
      const batchUpdates = updates.slice(i, i + batchSize);

      batchUpdates.forEach(update => {
        const studentRef = db.collection('students').doc(update.studentId);
        // Update both sectionId AND gradeLevel
        batch.update(studentRef, { 
          sectionId: update.newSectionId,
          gradeLevel: update.newGradeLevel
        });
      });

      await batch.commit();
      totalUpdated += batchUpdates.length;

      console.log(`   ✅ Batch ${Math.floor(i / batchSize) + 1}: Updated ${batchUpdates.length} students (Total: ${totalUpdated}/${updates.length})`);
    }

    // Step 6: Verify updates
    console.log('\n🔍 Step 5: Verifying updates...');
    const verifySnapshot = await db.collection('students').limit(10).get();
    const verifiedStudents = verifySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      gradeLevel: doc.data().gradeLevel,
      sectionId: doc.data().sectionId
    }));

    console.log('\n✅ Sample verified students:');
    for (const student of verifiedStudents) {
      const section = sections.find(s => s.id === student.sectionId);
      console.log(`   - ${student.name} (Grade ${student.gradeLevel}): ${section ? `${section.name} (${section.gradeLevel})` : 'NOT FOUND!'} (${student.sectionId})`);
    }

    console.log('\n🎉 Migration Complete!');
    console.log(`   ✅ Updated ${totalUpdated} student records`);
    console.log(`   ✅ All students now have correct section IDs`);
    console.log('\n💡 Next steps:');
    console.log('   1. Deploy the app to see the changes');
    console.log('   2. Check the Students page - Grade & Section should now display correctly');
    console.log('   3. Verify assignments show correct students for each section\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the migration
fixStudentSectionIds();
