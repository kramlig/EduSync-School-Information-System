#!/usr/bin/env node
/**
 * Validate Staging Firestore Data Structure
 * 
 * This script uses Firebase Admin SDK to directly validate the staging database
 * and identify why the grading system is failing to load.
 * 
 * CRITICAL FINDINGS EXPECTED:
 * 1. NO academic 'grades' collection (only coreValueGrades seeded)
 * 2. Parents have empty studentIds arrays (no child links)
 * 3. Missing learning areas for subjects
 * 
 * Usage:
 *   node scripts/validate-staging-data.cjs
 */

const args = process.argv.slice(2).reduce((acc, cur) => {
  const [k,v] = cur.split('=');
  if (k.startsWith('--')) acc[k.substring(2)] = v || true; else acc[k] = v || true;
  return acc;
}, {});

const projectId = args.projectId || 'edusync-staging';

async function run() {
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  // Connect to staging (not emulator)
  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const db = getFirestore();
  
  console.log(`\n🔍 VALIDATING STAGING DATA STRUCTURE (${projectId})`);
  console.log('═'.repeat(80));
  
  // Track critical issues
  const criticalIssues = [];
  const warnings = [];
  
  // 1. Check Schools
  console.log('\n1️⃣  SCHOOLS COLLECTION');
  console.log('─'.repeat(80));
  const schoolsSnapshot = await db.collection('schools').get();
  console.log(`   📊 Count: ${schoolsSnapshot.size}`);
  
  if (schoolsSnapshot.size === 0) {
    criticalIssues.push('NO schools in database');
  } else {
    schoolsSnapshot.docs.slice(0, 3).forEach(doc => {
      const data = doc.data();
      console.log(`   ✅ ${data.name} (${doc.id})`);
      console.log(`      School Year: ${data.currentSchoolYear}`);
      console.log(`      Type: ${data.schoolType}, Level: ${data.schoolLevel}`);
    });
  }
  
  // 2. Check Students
  console.log('\n2️⃣  STUDENTS COLLECTION');
  console.log('─'.repeat(80));
  const studentsSnapshot = await db.collection('students').limit(1000).get();
  console.log(`   📊 Count: ${studentsSnapshot.size}`);
  
  if (studentsSnapshot.size === 0) {
    criticalIssues.push('NO students in database');
  } else {
    let withSections = 0;
    let withoutSections = 0;
    
    studentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.sectionId) withSections++;
      else withoutSections++;
    });
    
    console.log(`   ✅ Students WITH sections: ${withSections}`);
    console.log(`   ⚠️  Students WITHOUT sections: ${withoutSections}`);
    
    // Sample students
    console.log(`\n   Sample students:`);
    studentsSnapshot.docs.slice(0, 3).forEach(doc => {
      const data = doc.data();
      console.log(`     - ${data.name} (LRN: ${data.lrn || 'N/A'})`);
      console.log(`       Section: ${data.sectionId || 'NONE'}, School: ${data.schoolId || 'NONE'}`);
    });
  }
  
  // 3. Check Teachers
  console.log('\n3️⃣  TEACHERS COLLECTION');
  console.log('─'.repeat(80));
  const teachersSnapshot = await db.collection('teachers').get();
  console.log(`   📊 Count: ${teachersSnapshot.size}`);
  
  if (teachersSnapshot.size === 0) {
    criticalIssues.push('NO teachers in database');
  } else {
    const roleCount = new Map();
    teachersSnapshot.docs.forEach(doc => {
      const role = doc.data().role || 'unknown';
      roleCount.set(role, (roleCount.get(role) || 0) + 1);
    });
    
    console.log(`\n   By role:`);
    roleCount.forEach((count, role) => {
      console.log(`     ${role}: ${count}`);
    });
  }
  
  // 4. Check Sections
  console.log('\n4️⃣  SECTIONS COLLECTION');
  console.log('─'.repeat(80));
  const sectionsSnapshot = await db.collection('sections').get();
  console.log(`   📊 Count: ${sectionsSnapshot.size}`);
  
  if (sectionsSnapshot.size === 0) {
    criticalIssues.push('NO sections in database');
  } else {
    const byGrade = new Map();
    let withAdvisers = 0;
    
    sectionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.adviserId) withAdvisers++;
      byGrade.set(data.gradeLevel, (byGrade.get(data.gradeLevel) || 0) + 1);
    });
    
    console.log(`   ✅ Sections WITH advisers: ${withAdvisers}/${sectionsSnapshot.size}`);
    console.log(`\n   By grade level:`);
    Array.from(byGrade.entries()).sort((a, b) => a[0] - b[0]).forEach(([grade, count]) => {
      console.log(`     Grade ${grade}: ${count} sections`);
    });
  }
  
  // 5. Check Learning Areas
  console.log('\n5️⃣  LEARNING AREAS COLLECTION');
  console.log('─'.repeat(80));
  const learningAreasSnapshot = await db.collection('learningAreas').get();
  console.log(`   📊 Count: ${learningAreasSnapshot.size}`);
  
  if (learningAreasSnapshot.size === 0) {
    criticalIssues.push('NO learning areas (subjects) in database');
    console.log(`   🔴 CRITICAL: Without learning areas, grading system CANNOT work!`);
  } else {
    console.log(`\n   Available subjects:`);
    learningAreasSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`     - ${data.name} (Grade ${data.gradeLevel || 'All'}, ID: ${doc.id})`);
    });
  }
  
  // 6. Check ACADEMIC GRADES (THE CRITICAL ONE!)
  console.log('\n6️⃣  GRADES COLLECTION (ACADEMIC GRADES) 🔴 CRITICAL');
  console.log('─'.repeat(80));
  const gradesSnapshot = await db.collection('grades').limit(100).get();
  console.log(`   📊 Count: ${gradesSnapshot.size}`);
  
  if (gradesSnapshot.size === 0) {
    criticalIssues.push('NO ACADEMIC GRADES in database - grading system CANNOT work!');
    console.log(`   🔴 CRITICAL ISSUE: NO academic grades found!`);
    console.log(`   ❌ This is why the grading pages show "Loading..." forever!`);
    console.log(`   ❌ Teachers cannot enter grades, students cannot view grades!`);
    console.log(`\n   📝 Expected data structure:`);
    console.log(`      - studentId: reference to student`);
    console.log(`      - learningAreaId: reference to subject`);
    console.log(`      - q1, q2, q3, q4: quarterly numeric grades`);
    console.log(`      - finalGrade: calculated average`);
    console.log(`      - remarks: "Passed" or "Failed"`);
    console.log(`\n   🛠️  FIX: Run grade seeding script:`);
    console.log(`      node scripts/seed-academic-grades.cjs --useEmulator=false --projectId=edusync-staging`);
  } else {
    console.log(`   ✅ Academic grades EXIST!`);
    console.log(`\n   Sample grades:`);
    gradesSnapshot.docs.slice(0, 3).forEach(doc => {
      const data = doc.data();
      console.log(`     Grade ID: ${doc.id}`);
      console.log(`       Student: ${data.studentId}, Subject: ${data.learningAreaId}`);
      console.log(`       Q1: ${data.q1 || '-'}, Q2: ${data.q2 || '-'}, Q3: ${data.q3 || '-'}, Q4: ${data.q4 || '-'}`);
      console.log(`       Final: ${data.finalGrade || '-'}, Remarks: ${data.remarks || '-'}`);
      console.log();
    });
  }
  
  // 7. Check Core Value Grades (for comparison)
  console.log('\n7️⃣  CORE VALUE GRADES COLLECTION (BEHAVIOR, NOT ACADEMICS)');
  console.log('─'.repeat(80));
  const coreValueGradesSnapshot = await db.collection('coreValueGrades').limit(10).get();
  console.log(`   📊 Count: ${coreValueGradesSnapshot.size}`);
  console.log(`   ℹ️  Core value grades track behavior (Makadiyos, Makatao, etc.)`);
  console.log(`   ℹ️  These are SEPARATE from academic grades (Math, English, etc.)`);
  
  // 8. Check Parents
  console.log('\n8️⃣  PARENTS COLLECTION');
  console.log('─'.repeat(80));
  const parentsSnapshot = await db.collection('parents').limit(100).get();
  console.log(`   📊 Count: ${parentsSnapshot.size}`);
  
  if (parentsSnapshot.size === 0) {
    warnings.push('NO parents in database - parent portal will not work');
  } else {
    let withChildren = 0;
    let withoutChildren = 0;
    let totalChildLinks = 0;
    
    parentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.studentIds && data.studentIds.length > 0) {
        withChildren++;
        totalChildLinks += data.studentIds.length;
      } else {
        withoutChildren++;
      }
    });
    
    console.log(`   ✅ Parents WITH children: ${withChildren}`);
    console.log(`   ⚠️  Parents WITHOUT children: ${withoutChildren}`);
    console.log(`   📊 Total parent-child links: ${totalChildLinks}`);
    
    if (withChildren === 0) {
      criticalIssues.push('NO parent-child relationships - parent portal will show "Failed to Load Application Data"');
      console.log(`   🔴 CRITICAL: NO parent-child links!`);
      console.log(`   ❌ This is why parent portal shows "Failed to Load Application Data"!`);
    } else {
      console.log(`\n   Sample parents with children:`);
      parentsSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.studentIds && data.studentIds.length > 0;
      }).slice(0, 3).forEach(doc => {
        const data = doc.data();
        console.log(`     - ${data.name} (${data.email})`);
        console.log(`       Children: ${data.studentIds.length} (IDs: ${data.studentIds.slice(0, 2).join(', ')}${data.studentIds.length > 2 ? '...' : ''})`);
      });
    }
  }
  
  // 9. Check Class Schedules
  console.log('\n9️⃣  CLASS SCHEDULES COLLECTION');
  console.log('─'.repeat(80));
  const schedulesSnapshot = await db.collection('classSchedules').limit(100).get();
  console.log(`   📊 Count: ${schedulesSnapshot.size}`);
  
  if (schedulesSnapshot.size === 0) {
    warnings.push('NO class schedules - teacher-subject assignments missing');
  } else {
    const teacherSectionPairs = new Set();
    schedulesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      teacherSectionPairs.add(`${data.teacherId}_${data.sectionId}`);
    });
    console.log(`   ✅ Unique teacher-section assignments: ${teacherSectionPairs.size}`);
  }
  
  // SUMMARY
  console.log('\n' + '═'.repeat(80));
  console.log('📋 VALIDATION SUMMARY');
  console.log('═'.repeat(80));
  
  console.log('\n✅ DATA COUNTS:');
  console.log(`   Schools: ${schoolsSnapshot.size}`);
  console.log(`   Students: ${studentsSnapshot.size}`);
  console.log(`   Teachers: ${teachersSnapshot.size}`);
  console.log(`   Sections: ${sectionsSnapshot.size}`);
  console.log(`   Learning Areas: ${learningAreasSnapshot.size}`);
  console.log(`   📊 ACADEMIC GRADES: ${gradesSnapshot.size} ⭐ CRITICAL`);
  console.log(`   Core Value Grades: ${coreValueGradesSnapshot.size}`);
  console.log(`   Parents: ${parentsSnapshot.size}`);
  console.log(`   Class Schedules: ${schedulesSnapshot.size}`);
  
  if (criticalIssues.length > 0) {
    console.log('\n🔴 CRITICAL ISSUES:');
    criticalIssues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach((warning, i) => {
      console.log(`   ${i + 1}. ${warning}`);
    });
  }
  
  if (criticalIssues.length === 0 && warnings.length === 0) {
    console.log('\n✅ ALL CHECKS PASSED! Data structure looks good.');
  } else {
    console.log('\n🛠️  RECOMMENDED ACTIONS:');
    
    if (gradesSnapshot.size === 0) {
      console.log(`\n   1. URGENT: Seed academic grades`);
      console.log(`      node scripts/seed-academic-grades.cjs --useEmulator=false --projectId=edusync-staging`);
    }
    
    if (learningAreasSnapshot.size === 0) {
      console.log(`\n   2. URGENT: Seed learning areas (subjects)`);
      console.log(`      Without subjects, grading system cannot function`);
    }
    
    if (parentsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.studentIds && data.studentIds.length > 0;
    }).length === 0) {
      console.log(`\n   3. Fix parent-child relationships`);
      console.log(`      Update seed-sample.cjs to properly link parents to students`);
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n');
}

run().catch(e => {
  console.error('\n❌ VALIDATION FAILED:', e && e.stack ? e.stack : e);
  process.exit(1);
});
