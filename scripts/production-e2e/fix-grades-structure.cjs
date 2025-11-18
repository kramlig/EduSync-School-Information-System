#!/usr/bin/env node
/**
 * FIX GRADES DATA STRUCTURE
 * 
 * Problem: Phase 6 created TWO different grade structures:
 * 1. Separate quarterly documents (quarter: 1, 2, 3, 4) - WRONG, empty
 * 2. Final document (q1, q2, q3, q4 fields) - CORRECT, has data
 * 
 * Solution:
 * 1. Delete all quarterly documents (quarter: 1, 2, 3, 4)
 * 2. Keep only final documents (quarter: 'final')
 * 3. Rename 'quarter' field to match correct structure
 * 
 * Correct Structure (types.ts):
 * {
 *   id: "studentId_learningAreaId",
 *   studentId: "...",
 *   learningAreaId: "...",
 *   q1: number,
 *   q2: number,
 *   q3: number,
 *   q4: number,
 *   finalGrade: number
 * }
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = 'edusync-sis';
const SCHOOL_ID = 'demo-e2e-testing';

async function fixGradesStructure() {
  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const db = getFirestore();

  console.log('\n🔧 FIX GRADES DATA STRUCTURE');
  console.log('═'.repeat(80));
  console.log(`📍 Project: ${projectId} (PRODUCTION)`);
  console.log(`🎯 School: ${SCHOOL_ID}`);
  console.log('═'.repeat(80));

  try {
    // Step 1: Get all grades
    console.log('\n1️⃣  Analyzing grades...');
    const gradesSnap = await db.collection('grades')
      .where('schoolId', '==', SCHOOL_ID)
      .get();
    
    console.log(`   Total grades found: ${gradesSnap.size}`);
    
    let quarterlyDocs = 0;
    let finalDocs = 0;
    let toDelete = [];
    let toUpdate = [];
    
    gradesSnap.forEach(doc => {
      const data = doc.data();
      
      // Quarterly documents (WRONG - to delete)
      if (typeof data.quarter === 'number') {
        quarterlyDocs++;
        toDelete.push(doc.id);
      }
      // Final documents (CORRECT - to keep and fix)
      else if (data.quarter === 'final') {
        finalDocs++;
        toUpdate.push({
          id: doc.id,
          data: data
        });
      }
    });
    
    console.log(`   Quarterly docs (DELETE): ${quarterlyDocs}`);
    console.log(`   Final docs (KEEP): ${finalDocs}`);
    
    // Step 2: Delete quarterly documents
    if (toDelete.length > 0) {
      console.log(`\n2️⃣  Deleting ${toDelete.length} quarterly documents...`);
      
      let batch = db.batch();
      let count = 0;
      
      for (const docId of toDelete) {
        batch.delete(db.collection('grades').doc(docId));
        count++;
        
        if (count >= 500) {
          await batch.commit();
          console.log(`   💾 Deleted batch of ${count} documents`);
          batch = db.batch();
          count = 0;
        }
      }
      
      if (count > 0) {
        await batch.commit();
        console.log(`   💾 Deleted final batch of ${count} documents`);
      }
      
      console.log(`   ✅ Deleted ${toDelete.length} quarterly documents`);
    }
    
    // Step 3: Fix final documents structure
    console.log(`\n3️⃣  Fixing ${toUpdate.length} grade documents...`);
    
    let batch = db.batch();
    let count = 0;
    let fixed = 0;
    
    for (const item of toUpdate) {
      // Remove '_final' suffix from ID and 'quarter' field
      const newId = item.id.replace('_final', '');
      const newData = { ...item.data };
      
      // Remove 'quarter' field (not in types.ts interface)
      delete newData.quarter;
      
      // Ensure finalGrade field exists
      if (!newData.finalGrade && newData.q1 && newData.q2 && newData.q3 && newData.q4) {
        newData.finalGrade = Math.round((newData.q1 + newData.q2 + newData.q3 + newData.q4) / 4);
      }
      
      // Update ID field to match document ID
      newData.id = newId;
      
      // If ID changed, delete old and create new
      if (newId !== item.id) {
        batch.delete(db.collection('grades').doc(item.id));
        batch.set(db.collection('grades').doc(newId), newData);
      } else {
        // Just update in place
        batch.set(db.collection('grades').doc(newId), newData);
      }
      
      count++;
      fixed++;
      
      if (count >= 250) { // Lower batch size for deletes + sets
        await batch.commit();
        console.log(`   💾 Fixed batch of ${count} documents (${fixed}/${toUpdate.length})`);
        batch = db.batch();
        count = 0;
      }
    }
    
    if (count > 0) {
      await batch.commit();
      console.log(`   💾 Fixed final batch of ${count} documents`);
    }
    
    console.log(`   ✅ Fixed ${fixed} grade documents`);
    
    // Step 4: Verify
    console.log('\n4️⃣  Verifying...');
    const verifySnap = await db.collection('grades')
      .where('schoolId', '==', SCHOOL_ID)
      .limit(5)
      .get();
    
    console.log('   Sample grades:');
    verifySnap.forEach(doc => {
      const g = doc.data();
      console.log(`   - ${doc.id}: q1=${g.q1}, q2=${g.q2}, q3=${g.q3}, q4=${g.q4}, final=${g.finalGrade}`);
    });
    
    const finalCount = await db.collection('grades')
      .where('schoolId', '==', SCHOOL_ID)
      .count()
      .get();
    
    console.log('\n' + '═'.repeat(80));
    console.log('✅ GRADES STRUCTURE FIXED!');
    console.log('═'.repeat(80));
    console.log(`🗑️  Deleted: ${toDelete.length} quarterly documents`);
    console.log(`🔧 Fixed: ${fixed} grade documents`);
    console.log(`📊 Final count: ${finalCount.data().count} grades`);
    console.log('═'.repeat(80) + '\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  }
}

fixGradesStructure()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
