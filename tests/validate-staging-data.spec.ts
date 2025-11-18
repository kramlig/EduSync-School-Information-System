/**
 * Validate Staging Data Structure
 * 
 * This test validates that the staging Firestore database has all required
 * data and relationships needed for the grading system to function.
 * 
 * CRITICAL DATA REQUIREMENTS:
 * 1. School document exists with proper settings
 * 2. Students exist and are assigned to sections
 * 3. Teachers exist with role assignments
 * 4. Sections exist with adviser assignments
 * 5. Learning areas exist for grade-level curriculum
 * 6. **GRADES collection** - Academic grades for students (THIS IS MISSING!)
 * 7. Core value grades exist for student behavior tracking
 * 8. Parent-child relationships exist
 * 
 * Expected to REVEAL:
 * - Missing 'grades' collection (only coreValueGrades seeded)
 * - Missing parent-child links (empty studentIds arrays)
 * - Missing teacher-section assignments
 */

import { test, expect } from '@playwright/test';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, limit } from 'firebase/firestore';

const STAGING_CONFIG = {
  apiKey: "AIzaSyBg8mRcqbMm-BIkKEwWFLOLpYGzjjDYuqQ",
  authDomain: "edusync-staging.firebaseapp.com",
  projectId: "edusync-staging",
  storageBucket: "edusync-staging.firebasestorage.app",
  messagingSenderId: "324695059913",
  appId: "1:324695059913:web:f4ac99f25e7f6e99f1e4b3"
};

test.describe('Staging Data Validation', () => {
  let db: any;
  
  test.beforeAll(() => {
    const app = initializeApp(STAGING_CONFIG, 'staging-validation');
    db = getFirestore(app);
  });

  test('1. School document exists with proper structure', async () => {
    console.log('\n🏫 TEST: Validate school document structure');
    
    const schoolsSnapshot = await getDocs(collection(db, 'schools'));
    console.log(`   📊 Schools in database: ${schoolsSnapshot.size}`);
    
    expect(schoolsSnapshot.size).toBeGreaterThan(0);
    
    const schoolDoc = schoolsSnapshot.docs[0];
    const schoolData = schoolDoc.data();
    
    console.log(`   ✅ School: ${schoolData.name} (ID: ${schoolDoc.id})`);
    console.log(`   📍 Location: ${schoolData.division}, ${schoolData.region}`);
    console.log(`   📅 School Year: ${schoolData.currentSchoolYear}`);
    
    // Validate required fields
    expect(schoolData.id).toBeDefined();
    expect(schoolData.name).toBeDefined();
    expect(schoolData.currentSchoolYear).toBeDefined();
    
    // Check settings
    if (schoolData.settings) {
      console.log(`   ⚙️  Financial enabled: ${schoolData.settings.financialConfig?.enabled}`);
      console.log(`   ⚙️  Enrollment requires application: ${schoolData.settings.enrollmentConfig?.requiresApplication}`);
    }
  });

  test('2. Students exist and have section assignments', async () => {
    console.log('\n👨‍🎓 TEST: Validate student data and section assignments');
    
    const studentsSnapshot = await getDocs(query(collection(db, 'students'), limit(50)));
    console.log(`   📊 Students in database: ${studentsSnapshot.size}`);
    
    expect(studentsSnapshot.size).toBeGreaterThan(0);
    
    let withSections = 0;
    let withoutSections = 0;
    const sampleStudents = [];
    
    for (const doc of studentsSnapshot.docs.slice(0, 10)) {
      const student = doc.data();
      if (student.sectionId) {
        withSections++;
        sampleStudents.push({ 
          id: doc.id, 
          name: student.name, 
          sectionId: student.sectionId,
          lrn: student.lrn
        });
      } else {
        withoutSections++;
      }
    }
    
    console.log(`   ✅ Students WITH sections: ${withSections}/${studentsSnapshot.size}`);
    console.log(`   ⚠️  Students WITHOUT sections: ${withoutSections}/${studentsSnapshot.size}`);
    
    if (sampleStudents.length > 0) {
      console.log(`\n   Sample students:`);
      sampleStudents.slice(0, 3).forEach(s => {
        console.log(`     - ${s.name} (${s.lrn}) → Section: ${s.sectionId}`);
      });
    }
    
    expect(withSections).toBeGreaterThan(0);
  });

  test('3. Sections exist with adviser assignments', async () => {
    console.log('\n🏛️ TEST: Validate section data and advisers');
    
    const sectionsSnapshot = await getDocs(collection(db, 'sections'));
    console.log(`   📊 Sections in database: ${sectionsSnapshot.size}`);
    
    expect(sectionsSnapshot.size).toBeGreaterThan(0);
    
    const sections = sectionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const withAdvisers = sections.filter(s => s.adviserId);
    console.log(`   ✅ Sections WITH advisers: ${withAdvisers.length}/${sections.length}`);
    
    // Group by grade level
    const byGradeLevel = new Map<number, number>();
    sections.forEach(s => {
      const count = byGradeLevel.get(s.gradeLevel) || 0;
      byGradeLevel.set(s.gradeLevel, count + 1);
    });
    
    console.log(`\n   Sections by grade level:`);
    Array.from(byGradeLevel.entries())
      .sort((a, b) => a[0] - b[0])
      .forEach(([grade, count]) => {
        console.log(`     Grade ${grade}: ${count} sections`);
      });
    
    console.log(`\n   Sample sections:`);
    sections.slice(0, 3).forEach(s => {
      console.log(`     - Grade ${s.gradeLevel}-${s.name} (Adviser: ${s.adviserId || 'NONE'})`);
    });
  });

  test('4. Teachers exist with role assignments', async () => {
    console.log('\n👩‍🏫 TEST: Validate teacher data and roles');
    
    const teachersSnapshot = await getDocs(collection(db, 'teachers'));
    console.log(`   📊 Teachers in database: ${teachersSnapshot.size}`);
    
    expect(teachersSnapshot.size).toBeGreaterThan(0);
    
    const teachers = teachersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const roleCount = new Map<string, number>();
    teachers.forEach(t => {
      const count = roleCount.get(t.role || 'unknown') || 0;
      roleCount.set(t.role || 'unknown', count + 1);
    });
    
    console.log(`\n   Teachers by role:`);
    roleCount.forEach((count, role) => {
      console.log(`     ${role}: ${count}`);
    });
    
    console.log(`\n   Sample teachers:`);
    teachers.slice(0, 3).forEach(t => {
      console.log(`     - ${t.name} (${t.email}) - Role: ${t.role}`);
    });
  });

  test('5. Learning areas exist for curriculum', async () => {
    console.log('\n📚 TEST: Validate learning areas');
    
    const learningAreasSnapshot = await getDocs(collection(db, 'learningAreas'));
    console.log(`   📊 Learning areas in database: ${learningAreasSnapshot.size}`);
    
    const learningAreas = learningAreasSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (learningAreas.length > 0) {
      console.log(`\n   Available learning areas:`);
      learningAreas.forEach(la => {
        console.log(`     - ${la.name} (Grade ${la.gradeLevel || 'All'})`);
      });
    } else {
      console.log(`   ⚠️  NO learning areas found - grading system will not work!`);
    }
  });

  test('6. 🔴 CRITICAL: Academic grades collection exists', async () => {
    console.log('\n📊 TEST: Validate ACADEMIC GRADES (NOT core value grades)');
    console.log('   This is the CRITICAL collection for the grading system!');
    
    // Check for 'grades' collection (academic grades)
    const gradesSnapshot = await getDocs(query(collection(db, 'grades'), limit(50)));
    console.log(`\n   📊 ACADEMIC GRADES in 'grades' collection: ${gradesSnapshot.size}`);
    
    if (gradesSnapshot.size === 0) {
      console.log(`   🔴 CRITICAL ISSUE: NO academic grades found!`);
      console.log(`   ❌ The grading system CANNOT work without this data!`);
      console.log(`   ℹ️  Core value grades are separate - they track behavior, not academic performance.`);
      console.log(`\n   📝 What should exist:`);
      console.log(`     - studentId: reference to student`);
      console.log(`     - learningAreaId: reference to subject`);
      console.log(`     - q1, q2, q3, q4: quarterly grades (numbers)`);
      console.log(`     - finalGrade: computed average`);
      console.log(`     - remarks: "Passed" or "Failed"`);
    } else {
      const sampleGrades = [];
      for (const doc of gradesSnapshot.docs.slice(0, 5)) {
        const grade = doc.data();
        sampleGrades.push({
          id: doc.id,
          studentId: grade.studentId,
          learningAreaId: grade.learningAreaId,
          q1: grade.q1,
          q2: grade.q2,
          q3: grade.q3,
          q4: grade.q4,
          finalGrade: grade.finalGrade,
          remarks: grade.remarks
        });
      }
      
      console.log(`   ✅ Academic grades EXIST`);
      console.log(`\n   Sample grades:`);
      sampleGrades.forEach(g => {
        console.log(`     - Student: ${g.studentId}, Subject: ${g.learningAreaId}`);
        console.log(`       Q1: ${g.q1 || '-'}, Q2: ${g.q2 || '-'}, Q3: ${g.q3 || '-'}, Q4: ${g.q4 || '-'}`);
        console.log(`       Final: ${g.finalGrade || '-'}, Remarks: ${g.remarks || '-'}`);
      });
    }
    
    // For comparison, check core value grades
    const coreValueGradesSnapshot = await getDocs(query(collection(db, 'coreValueGrades'), limit(10)));
    console.log(`\n   ℹ️  Core value grades (behavior tracking): ${coreValueGradesSnapshot.size}`);
    console.log(`   ℹ️  These are SEPARATE from academic grades (used for values education)`);
    
    // FAIL test if no academic grades found
    expect(gradesSnapshot.size, 'CRITICAL: Academic grades collection is EMPTY! Grading system cannot function.').toBeGreaterThan(0);
  });

  test('7. Parent-child relationships exist', async () => {
    console.log('\n👨‍👩‍👧 TEST: Validate parent-child relationships');
    
    const parentsSnapshot = await getDocs(query(collection(db, 'parents'), limit(50)));
    console.log(`   📊 Parents in database: ${parentsSnapshot.size}`);
    
    if (parentsSnapshot.size === 0) {
      console.log(`   ⚠️  No parents found - parent portal will not work`);
      return;
    }
    
    let withChildren = 0;
    let withoutChildren = 0;
    let totalChildLinks = 0;
    
    const sampleParents = [];
    for (const doc of parentsSnapshot.docs) {
      const parent = doc.data();
      if (parent.studentIds && parent.studentIds.length > 0) {
        withChildren++;
        totalChildLinks += parent.studentIds.length;
        if (sampleParents.length < 5) {
          sampleParents.push({
            id: doc.id,
            name: parent.name,
            email: parent.email,
            children: parent.studentIds.length
          });
        }
      } else {
        withoutChildren++;
      }
    }
    
    console.log(`   ✅ Parents WITH children: ${withChildren}/${parentsSnapshot.size}`);
    console.log(`   ⚠️  Parents WITHOUT children: ${withoutChildren}/${parentsSnapshot.size}`);
    console.log(`   📊 Total parent-child links: ${totalChildLinks}`);
    
    if (sampleParents.length > 0) {
      console.log(`\n   Sample parents with children:`);
      sampleParents.forEach(p => {
        console.log(`     - ${p.name} (${p.email}) → ${p.children} child(ren)`);
      });
    }
    
    if (withChildren === 0) {
      console.log(`\n   🔴 CRITICAL: NO parent-child relationships!`);
      console.log(`   ❌ Parent portal "Failed to Load Application Data" error is caused by this!`);
    }
  });

  test('8. Class schedules link teachers to sections', async () => {
    console.log('\n📅 TEST: Validate class schedules (teacher-section-subject assignments)');
    
    const schedulesSnapshot = await getDocs(query(collection(db, 'classSchedules'), limit(50)));
    console.log(`   📊 Class schedules in database: ${schedulesSnapshot.size}`);
    
    if (schedulesSnapshot.size === 0) {
      console.log(`   ⚠️  No class schedules - teachers may not be assigned to sections/subjects`);
      return;
    }
    
    const schedules = schedulesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Count unique teacher-section pairs
    const teacherSectionPairs = new Set(
      schedules.map(s => `${s.teacherId}_${s.sectionId}`)
    );
    
    console.log(`   ✅ Unique teacher-section assignments: ${teacherSectionPairs.size}`);
    
    console.log(`\n   Sample class schedules:`);
    schedules.slice(0, 5).forEach(s => {
      console.log(`     - ${s.title || s.learningAreaId} (${s.dayOfWeek}, ${s.startTime}-${s.endTime})`);
      console.log(`       Teacher: ${s.teacherId}, Section: ${s.sectionId}`);
    });
  });

  test('9. Summary: Data completeness report', async () => {
    console.log('\n📋 SUMMARY: Staging Database Completeness Report');
    console.log('═'.repeat(70));
    
    const collections = [
      'schools',
      'students',
      'teachers',
      'parents',
      'sections',
      'learningAreas',
      'grades',
      'coreValueGrades',
      'coreValues',
      'classSchedules',
      'attendanceRecords',
      'assignments'
    ];
    
    const counts: Record<string, number> = {};
    
    for (const collectionName of collections) {
      const snapshot = await getDocs(query(collection(db, collectionName), limit(1000)));
      counts[collectionName] = snapshot.size;
    }
    
    console.log('\n Collection                 │ Count    │ Status');
    console.log('─'.repeat(70));
    
    const criticalCollections = ['schools', 'students', 'teachers', 'sections', 'grades'];
    
    Object.entries(counts).forEach(([name, count]) => {
      const isCritical = criticalCollections.includes(name);
      const status = count === 0 ? '🔴 MISSING' : count < 10 ? '⚠️  LOW' : '✅ OK';
      const padding = ' '.repeat(26 - name.length);
      const countPadding = ' '.repeat(8 - count.toString().length);
      
      console.log(`${isCritical ? '⭐' : ' '} ${name}${padding}│ ${count}${countPadding}│ ${status}`);
    });
    
    console.log('─'.repeat(70));
    console.log('⭐ = Critical for grading system to function');
    
    // Check for critical missing data
    const missingCritical = criticalCollections.filter(c => counts[c] === 0);
    
    if (missingCritical.length > 0) {
      console.log(`\n🔴 CRITICAL ISSUES FOUND:`);
      missingCritical.forEach(c => {
        console.log(`   ❌ ${c} collection is EMPTY`);
      });
      console.log(`\n   These collections MUST have data for the system to work!`);
      
      if (missingCritical.includes('grades')) {
        console.log(`\n   📝 To fix missing grades:`);
        console.log(`      1. Run: node scripts/seed-academic-grades.cjs --useEmulator=false --projectId=edusync-staging`);
        console.log(`      2. Or add grade seeding to scripts/seed-sample.cjs`);
      }
    } else {
      console.log(`\n✅ All critical collections have data!`);
    }
    
    console.log('\n═'.repeat(70));
  });
});
