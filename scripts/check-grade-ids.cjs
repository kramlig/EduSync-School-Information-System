#!/usr/bin/env node
/**
 * Check grade IDs in Firestore - looking for inconsistent ID formats
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query: firestoreQuery, where, limit } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDaf1Uswbm4NWffPToe6HQhfJRxpuv8HDs",
  authDomain: "edusync-sis.firebaseapp.com",
  projectId: "edusync-sis",
  storageBucket: "edusync-sis.firebasestorage.app",
  messagingSenderId: "667887536401",
  appId: "1:667887536401:web:eb6e54d83ec4178a0b64b0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkGradeIds() {
  console.log('\n🔍 Checking grade IDs in Firestore...\n');
  console.log('─'.repeat(80));
  
  try {
    const q = firestoreQuery(collection(db, 'grades'), limit(50));
    const snapshot = await getDocs(q);
    
    console.log(`Total grades checked: ${snapshot.size}\n`);
    
    const idFormats = {
      'g_': [],
      'grade_': [],
      'other': []
    };
    
    snapshot.forEach(doc => {
      const id = doc.id;
      const data = doc.data();
      
      if (id.startsWith('g_')) {
        idFormats['g_'].push({ id, studentId: data.studentId, learningAreaId: data.learningAreaId });
      } else if (id.startsWith('grade_')) {
        idFormats['grade_'].push({ id, studentId: data.studentId, learningAreaId: data.learningAreaId });
      } else {
        idFormats['other'].push({ id, studentId: data.studentId, learningAreaId: data.learningAreaId });
      }
    });
    
    console.log('📊 ID Format Distribution:\n');
    console.log(`✅ Format "g_*": ${idFormats['g_'].length} grades`);
    console.log(`⚠️  Format "grade_*": ${idFormats['grade_'].length} grades`);
    console.log(`❓ Other formats: ${idFormats['other'].length} grades\n`);
    
    if (idFormats['grade_'].length > 0) {
      console.log('⚠️  FOUND INCONSISTENT IDs with "grade_" prefix:');
      idFormats['grade_'].slice(0, 5).forEach(g => {
        console.log(`  - ${g.id}`);
      });
      console.log();
    }
    
    // Check a specific student's grades
    const testStudentId = 's_elem_0003';
    console.log(`\n🎯 Checking grades for student: ${testStudentId}`);
    console.log('─'.repeat(80));
    
    const studentQ = firestoreQuery(
      collection(db, 'grades'),
      where('studentId', '==', testStudentId)
    );
    const studentGrades = await getDocs(studentQ);
    
    console.log(`Found ${studentGrades.size} grades for this student:\n`);
    
    studentGrades.forEach(doc => {
      const data = doc.data();
      console.log(`  ${doc.id}:`);
      console.log(`    Q1: ${data.q1 || '-'}`);
      console.log(`    Q2: ${data.q2 || '-'}`);
      console.log(`    Q3: ${data.q3 || '-'}`);
      console.log(`    Q4: ${data.q4 || '-'}`);
      console.log();
    });
    
    console.log('─'.repeat(80));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkGradeIds();
