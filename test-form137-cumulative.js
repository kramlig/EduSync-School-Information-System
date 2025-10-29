/**
 * Test Script for Form 137 Cumulative Design
 * 
 * This script tests the new cumulative Form 137 implementation:
 * 1. Checks existing Form 137 records
 * 2. Tests generator with new structure
 * 3. Verifies data structure matches new types
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { generateForm137FromSystemData } from './services/form137Generator.ts';
import { Form137Service } from './services/formsService.ts';

// Initialize Firebase (using production config)
const firebaseConfig = {
  apiKey: "AIzaSyCX5dGa9z3RMuwmzxXlBHvGVOgQFrSlAxg",
  authDomain: "edusync-sis.firebaseapp.com",
  projectId: "edusync-sis",
  storageBucket: "edusync-sis.firebasestorage.app",
  messagingSenderId: "663924220635",
  appId: "1:663924220635:web:2a8d93db29e0cec3c08f93",
  measurementId: "G-G22LWSMSD6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔥 Connected to Firestore (edusync-sis)');
console.log('');

async function testForm137Structure() {
  console.log('📊 TEST 1: Check Existing Form 137 Records');
  console.log('='.repeat(60));
  
  try {
    // Get all Form 137 records
    const records = await Form137Service.getAll();
    
    console.log(`✓ Found ${records.length} Form 137 record(s)`);
    console.log('');
    
    if (records.length > 0) {
      records.forEach((record, index) => {
        console.log(`Record ${index + 1}:`);
        console.log(`  Student: ${record.studentName} (${record.studentId})`);
        console.log(`  LRN: ${record.lrn || 'N/A'}`);
        console.log(`  Current School: ${record.currentSchoolName || 'N/A'}`);
        console.log(`  School Years Recorded: ${record.schoolYears?.length || 0}`);
        
        if (record.schoolYears && record.schoolYears.length > 0) {
          console.log('  Years:');
          record.schoolYears.forEach(year => {
            console.log(`    - ${year.schoolYear}: Grade ${year.gradeLevel}, ${year.section}`);
            console.log(`      Average: ${year.generalAverage}, Status: ${year.promotionStatus}`);
            console.log(`      Grades: ${year.grades?.length || 0} subjects`);
          });
        } else {
          console.log('  ⚠️  OLD STRUCTURE DETECTED - No schoolYears array!');
          console.log(`  Has schoolYear property: ${record.schoolYear || 'N/A'}`);
          console.log(`  Has subjects property: ${record.subjects ? 'Yes' : 'No'}`);
        }
        console.log('');
      });
    } else {
      console.log('ℹ️  No Form 137 records found in database');
      console.log('');
    }
  } catch (error) {
    console.error('❌ Error fetching Form 137 records:', error.message);
    console.log('');
  }
}

async function testGenerator() {
  console.log('🔧 TEST 2: Test Form 137 Generator');
  console.log('='.repeat(60));
  
  try {
    // Get a student to test with
    const studentsSnap = await getDocs(query(collection(db, 'students'), limit(1)));
    
    if (studentsSnap.empty) {
      console.log('⚠️  No students found in database');
      console.log('');
      return;
    }
    
    const student = { id: studentsSnap.docs[0].id, ...studentsSnap.docs[0].data() };
    console.log(`Testing with student: ${student.name} (${student.id})`);
    console.log('');
    
    // Test generator
    const result = await generateForm137FromSystemData({
      studentId: student.id,
      schoolYear: '2024-2025'
    });
    
    console.log(`✓ Generator returned: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    
    if (result.success) {
      console.log(`  Is Update (adding year): ${result.isUpdate ? 'YES' : 'NO'}`);
      
      if (result.isUpdate) {
        console.log('  Mode: Adding year to existing Form 137');
        console.log(`  Existing record has: ${result.existingRecord?.schoolYears?.length || 0} years`);
        console.log('  New year data:');
        console.log(`    School Year: ${result.schoolYearData?.schoolYear}`);
        console.log(`    Grade Level: ${result.schoolYearData?.gradeLevel}`);
        console.log(`    Section: ${result.schoolYearData?.section}`);
        console.log(`    General Average: ${result.schoolYearData?.generalAverage}`);
        console.log(`    Grades: ${result.schoolYearData?.grades?.length || 0} subjects`);
      } else {
        console.log('  Mode: Creating new Form 137 with first year');
        console.log(`  Student: ${result.data?.studentName}`);
        console.log(`  LRN: ${result.data?.lrn || 'N/A'}`);
        console.log(`  School Years: ${result.data?.schoolYears?.length || 0}`);
        if (result.data?.schoolYears?.[0]) {
          const firstYear = result.data.schoolYears[0];
          console.log('  First Year:');
          console.log(`    School Year: ${firstYear.schoolYear}`);
          console.log(`    Grade Level: ${firstYear.gradeLevel}`);
          console.log(`    Section: ${firstYear.section}`);
          console.log(`    General Average: ${firstYear.generalAverage}`);
          console.log(`    Grades: ${firstYear.grades?.length || 0} subjects`);
        }
      }
      
      if (result.warnings && result.warnings.length > 0) {
        console.log('  Warnings:');
        result.warnings.forEach(w => console.log(`    - ${w}`));
      }
    } else {
      console.log(`  Error: ${result.error}`);
    }
    console.log('');
  } catch (error) {
    console.error('❌ Error testing generator:', error.message);
    console.log('');
  }
}

async function testDataStructure() {
  console.log('🔍 TEST 3: Verify Data Structure');
  console.log('='.repeat(60));
  
  try {
    const records = await Form137Service.getAll();
    
    if (records.length === 0) {
      console.log('ℹ️  No records to verify');
      console.log('');
      return;
    }
    
    let newStructureCount = 0;
    let oldStructureCount = 0;
    
    records.forEach(record => {
      if (record.schoolYears && Array.isArray(record.schoolYears)) {
        newStructureCount++;
        
        // Verify each year has required fields
        record.schoolYears.forEach((year, idx) => {
          const hasRequired = year.schoolYear && 
                             year.gradeLevel !== undefined && 
                             year.section && 
                             year.grades && 
                             year.generalAverage !== undefined;
          
          if (!hasRequired) {
            console.log(`⚠️  Year ${idx + 1} in ${record.studentName}'s record is missing required fields`);
          }
          
          // Check if using finalGrade (not finalRating)
          if (year.grades && year.grades.length > 0) {
            const firstGrade = year.grades[0];
            if ('finalRating' in firstGrade) {
              console.log(`⚠️  Year ${year.schoolYear} uses OLD 'finalRating' property`);
            }
            if (!('finalGrade' in firstGrade)) {
              console.log(`⚠️  Year ${year.schoolYear} missing 'finalGrade' property`);
            }
          }
        });
      } else {
        oldStructureCount++;
      }
    });
    
    console.log(`✓ New Structure (cumulative): ${newStructureCount} record(s)`);
    console.log(`✓ Old Structure (per-year): ${oldStructureCount} record(s)`);
    
    if (oldStructureCount > 0) {
      console.log('');
      console.log('⚠️  WARNING: Old structure records detected!');
      console.log('   These should be migrated to the new cumulative structure.');
    } else if (newStructureCount > 0) {
      console.log('');
      console.log('✅ All records use the new cumulative structure!');
    }
    console.log('');
  } catch (error) {
    console.error('❌ Error verifying structure:', error.message);
    console.log('');
  }
}

async function runAllTests() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Form 137 Cumulative Design - Test Suite                ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  await testForm137Structure();
  await testGenerator();
  await testDataStructure();
  
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Test Suite Complete                                     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  process.exit(0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
