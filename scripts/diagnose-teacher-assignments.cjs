#!/usr/bin/env node
/**
 * Diagnostic: Check Teacher Assignments
 * 
 * This script checks if teacher assignments are properly configured in Firestore
 * Run: node scripts/diagnose-teacher-assignments.cjs
 */

const admin = require('firebase-admin');

// Connect to emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9100';

const app = admin.initializeApp({ projectId: 'edusync-local' });
const db = admin.firestore();

async function diagnose() {
  try {
    console.log('🔍 Checking Teacher Assignments...\n');
    
    // Get Ana Reyes (teacher-004)
    const teacherDoc = await db.collection('teachers').doc('teacher-004').get();
    
    if (!teacherDoc.exists) {
      console.log('❌ Teacher teacher-004 (Ana Reyes) not found!');
      process.exit(1);
    }
    
    const teacherData = teacherDoc.data();
    console.log('👨‍🏫 Teacher: Ana Reyes (teacher-004)');
    console.log(`   Email: ${teacherData.email}`);
    console.log(`   Specialization: ${teacherData.specialization}`);
    console.log(`   Assignments:`);
    
    if (!teacherData.assignments || teacherData.assignments.length === 0) {
      console.log('   ❌ NO ASSIGNMENTS FOUND!');
      console.log('   Fix: Re-run seed script: npm run emu:seed:admin');
      process.exit(1);
    }
    
    teacherData.assignments.forEach((assignment, index) => {
      console.log(`   ${index + 1}. Grade ${assignment.gradeLevel} - ${assignment.learningAreaName} (${assignment.learningAreaId})`);
      console.log(`      Type: ${typeof assignment.gradeLevel}`);
    });
    
    // Check sections for Grade 1
    console.log('\n📚 Checking Grade 1 Sections:');
    const sectionsSnapshot = await db.collection('sections')
      .where('gradeLevel', '==', 1)
      .get();
    
    if (sectionsSnapshot.empty) {
      console.log('   ❌ No Grade 1 sections found!');
    } else {
      sectionsSnapshot.forEach(doc => {
        const section = doc.data();
        console.log(`   • ${section.name} (${section.id})`);
        console.log(`     gradeLevel: ${section.gradeLevel} (${typeof section.gradeLevel})`);
        console.log(`     adviserId: ${section.adviserId}`);
      });
    }
    
    // Check learning areas
    console.log('\n📖 Checking Learning Areas:');
    const learningAreasSnapshot = await db.collection('learningAreas').get();
    
    const filipinoArea = learningAreasSnapshot.docs.find(doc => doc.id === 'la_filipino');
    if (!filipinoArea) {
      console.log('   ❌ Filipino learning area (la_filipino) not found!');
    } else {
      const data = filipinoArea.data();
      console.log(`   ✓ Filipino (la_filipino): ${data.name}`);
    }
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Teacher assignments: ${teacherData.assignments.length}`);
    console.log(`   Grade 1 sections: ${sectionsSnapshot.size}`);
    console.log(`   Total learning areas: ${learningAreasSnapshot.size}`);
    
    // Check for mismatches
    console.log('\n🔍 Checking for type mismatches:');
    const assignmentGradeLevels = teacherData.assignments.map(a => a.gradeLevel);
    const sectionGradeLevels = sectionsSnapshot.docs.map(d => d.data().gradeLevel);
    
    console.log(`   Assignment grade levels: ${JSON.stringify(assignmentGradeLevels)}`);
    console.log(`   Section grade levels: ${JSON.stringify(sectionGradeLevels)}`);
    
    const hasMatch = assignmentGradeLevels.some(ag => 
      sectionGradeLevels.some(sg => sg === ag)
    );
    
    if (hasMatch) {
      console.log('   ✅ Grade levels match!');
    } else {
      console.log('   ❌ Grade level mismatch detected!');
      console.log('   This will prevent learning areas from showing in UI.');
    }
    
    console.log('\n✅ Diagnostic complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnose();
