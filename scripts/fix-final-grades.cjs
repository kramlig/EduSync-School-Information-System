#!/usr/bin/env node

/**
 * Fix Missing Final Grades Script
 * 
 * This script calculates and stores the finalGrade and remarks fields
 * for all grade records that are missing them but have quarterly grades.
 * 
 * Usage:
 *   node scripts/fix-final-grades.cjs
 * 
 * What it does:
 * 1. Fetches all grades from Firestore
 * 2. Identifies grades with Q1-Q4 data but missing finalGrade
 * 3. Calculates finalGrade as average of quarterly grades
 * 4. Calculates remarks (Passed if ≥75, Failed otherwise)
 * 5. Updates the database in batches
 */

const admin = require('firebase-admin');
const serviceAccount = require('../edusync-sis-firebase-adminsdk.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Calculate final grade from quarterly grades
 * Handles both simple grades (numbers) and composite grades (objects with sub-subjects)
 */
function calculateFinalGrade(grade) {
  const quarters = ['q1', 'q2', 'q3', 'q4'];
  const values = [];
  
  for (const q of quarters) {
    const v = grade[q];
    
    if (typeof v === 'number') {
      // Simple grade (direct number)
      values.push(v);
    } else if (v && typeof v === 'object') {
      // Composite grade (e.g., MAPEH with Music, Arts, PE, Health)
      const nums = Object.values(v).filter(n => typeof n === 'number');
      if (nums.length > 0) {
        const avg = Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
        values.push(avg);
      }
    }
  }
  
  if (values.length === 0) return null;
  
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * Calculate remarks based on final grade
 */
function calculateRemarks(finalGrade) {
  if (finalGrade === null || finalGrade === undefined) return null;
  return finalGrade >= 75 ? 'Passed' : 'Failed';
}

/**
 * Main function to fix missing final grades
 */
async function fixFinalGrades() {
  console.log('🔍 Fetching all grades from Firestore...\n');
  
  const gradesSnapshot = await db.collection('grades').get();
  
  console.log(`📊 Total grades in database: ${gradesSnapshot.size}\n`);
  
  let toUpdate = 0;
  let alreadyHasFinal = 0;
  let noQuarterlyGrades = 0;
  let updated = 0;
  let errors = 0;
  
  const updates = [];
  
  // Analyze all grades
  gradesSnapshot.docs.forEach(doc => {
    const grade = doc.data();
    
    // Check if finalGrade already exists
    if (grade.finalGrade !== undefined && grade.finalGrade !== null) {
      alreadyHasFinal++;
      return;
    }
    
    // Calculate final grade
    const finalGrade = calculateFinalGrade(grade);
    
    if (finalGrade === null) {
      noQuarterlyGrades++;
      return;
    }
    
    // This grade needs updating
    toUpdate++;
    const remarks = calculateRemarks(finalGrade);
    
    updates.push({
      ref: doc.ref,
      studentId: grade.studentId,
      learningAreaId: grade.learningAreaId,
      finalGrade,
      remarks,
      quarters: {
        q1: grade.q1,
        q2: grade.q2,
        q3: grade.q3,
        q4: grade.q4
      }
    });
  });
  
  console.log('📈 Analysis Results:');
  console.log(`   ✅ Grades with finalGrade: ${alreadyHasFinal}`);
  console.log(`   ❌ Grades missing finalGrade but have quarterly data: ${toUpdate}`);
  console.log(`   ⚠️  Grades with no quarterly data: ${noQuarterlyGrades}`);
  console.log('');
  
  if (toUpdate === 0) {
    console.log('✨ All grades already have finalGrade calculated!');
    process.exit(0);
  }
  
  console.log(`🔧 Updating ${toUpdate} grades in batches of 500...\n`);
  
  // Update in batches (Firestore limit is 500 per batch)
  const batchSize = 500;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = db.batch();
    const batchUpdates = updates.slice(i, i + batchSize);
    
    batchUpdates.forEach(({ ref, finalGrade, remarks }) => {
      batch.update(ref, {
        finalGrade,
        remarks,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    try {
      await batch.commit();
      updated += batchUpdates.length;
      console.log(`   ✅ Updated batch ${Math.floor(i / batchSize) + 1}: ${batchUpdates.length} grades (Total: ${updated}/${toUpdate})`);
    } catch (error) {
      console.error(`   ❌ Error updating batch ${Math.floor(i / batchSize) + 1}:`, error);
      errors += batchUpdates.length;
    }
  }
  
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('📊 Final Results:');
  console.log(`   ✅ Successfully updated: ${updated} grades`);
  if (errors > 0) {
    console.log(`   ❌ Failed: ${errors} grades`);
  }
  console.log('═══════════════════════════════════════');
  console.log('');
  
  // Show sample of what was updated
  if (updates.length > 0) {
    console.log('📝 Sample of updated grades (first 5):');
    updates.slice(0, 5).forEach(({ studentId, learningAreaId, finalGrade, remarks, quarters }, index) => {
      console.log(`\n   ${index + 1}. Student: ${studentId.slice(0, 12)}... | Subject: ${learningAreaId.slice(0, 15)}...`);
      console.log(`      Quarters: Q1=${quarters.q1 ?? '-'}, Q2=${quarters.q2 ?? '-'}, Q3=${quarters.q3 ?? '-'}, Q4=${quarters.q4 ?? '-'}`);
      console.log(`      → Final Grade: ${finalGrade} | Remarks: ${remarks}`);
    });
    console.log('');
  }
  
  console.log('✅ Done! All missing final grades have been calculated and stored.');
  process.exit(0);
}

// Run the script
fixFinalGrades().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
