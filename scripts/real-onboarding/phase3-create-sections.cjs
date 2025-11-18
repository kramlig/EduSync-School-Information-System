/**
 * REAL SCHOOL ONBOARDING - PHASE 3
 * Create sections (what admin will do through UI)
 * 
 * This simulates admin creating sections for the school year.
 * Realistic setup: Multiple grade levels, multiple sections per grade
 * 
 * Date: November 17, 2025
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Initialize Firebase Admin with Application Default Credentials
const projectId = 'edusync-sis';

// CRITICAL: Ensure we connect to PRODUCTION, not emulator
delete process.env.FIRESTORE_EMULATOR_HOST;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: projectId
  });
}

const db = getFirestore();

// Realistic section structure for ELEMENTARY (Grades 1-6)
const SECTION_TEMPLATES = [
  { gradeLevel: 1, sectionName: 'St. Francis', track: 'Regular' },
  { gradeLevel: 2, sectionName: 'St. John', track: 'Regular' },
  { gradeLevel: 3, sectionName: 'St. Peter', track: 'Regular' },
  { gradeLevel: 4, sectionName: 'St. Paul', track: 'Regular' },
  { gradeLevel: 5, sectionName: 'St. Luke', track: 'Regular' },
  { gradeLevel: 6, sectionName: 'St. Mark', track: 'Regular' }
];

async function createSection(schoolId, sectionData) {
  const { gradeLevel, sectionName, track } = sectionData;
  const displayName = `Grade ${gradeLevel} - ${sectionName}`;
  
  console.log(`   Creating: ${displayName}...`);
  
  try {
    const sectionRef = db.collection('sections').doc();
    await sectionRef.set({
      schoolId: schoolId,
      gradeLevel: gradeLevel,
      name: sectionName, // CRITICAL: Required for Students page display
      sectionName: sectionName,
      displayName: displayName,
      track: track,
      schoolYear: '2024-2025',
      students: [], // Will be populated in Phase 5
      teachers: [], // Will be assigned in Phase 4
      capacity: 40,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`   ✅ Created: ${displayName} (${sectionRef.id})\n`);
    
    return {
      id: sectionRef.id,
      gradeLevel: gradeLevel,
      sectionName: sectionName,
      displayName: displayName
    };
    
  } catch (error) {
    console.error(`   ❌ Error creating ${displayName}:`, error.message);
    throw error;
  }
}

async function createSections() {
  console.log('\n📚 PHASE 3: CREATE SECTIONS\n');
  console.log('This simulates admin creating sections for the school year.\n');
  
  // Auto-detect school
  console.log('🔍 Auto-detecting school...');
  const schoolsSnap = await db.collection('schools').limit(2).get();
  
  if (schoolsSnap.empty) {
    console.log('❌ No schools found! Run Phase 1 first.');
    rl.close();
    return;
  }
  
  if (schoolsSnap.size > 1) {
    console.log('⚠️  Multiple schools found. Please specify:');
    schoolsSnap.forEach((doc, i) => {
      console.log(`   ${i+1}. ${doc.id} - ${doc.data().name}`);
    });
    const choice = await question('\nEnter school number: ');
    const schoolDoc = schoolsSnap.docs[parseInt(choice) - 1];
    var schoolId = schoolDoc.id;
    var schoolData = schoolDoc.data();
  } else {
    const schoolDoc = schoolsSnap.docs[0];
    var schoolId = schoolDoc.id;
    var schoolData = schoolDoc.data();
  }
  
  console.log(`✅ Using school: ${schoolData.name} (${schoolId})\n`);
  
  console.log(`📋 Will create ${SECTION_TEMPLATES.length} sections:`);
  SECTION_TEMPLATES.forEach((s, i) => {
    console.log(`   ${i+1}. Grade ${s.gradeLevel} - ${s.name}`);
  });
  
  console.log('\n🚀 Creating sections...');
  
  const createdSections = [];
  
  for (const template of SECTION_TEMPLATES) {
    try {
      const section = await createSection(schoolId, template);
      createdSections.push(section);
    } catch (error) {
      console.error(`Failed to create section, continuing...`);
    }
  }
  
  // Summary
  console.log('='.repeat(60));
  console.log('✅ PHASE 3 COMPLETE: Sections Created Successfully!');
  console.log('='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   School: ${schoolData.name}`);
  console.log(`   Sections Created: ${createdSections.length}\n`);
  
  const gradeGroups = {};
  createdSections.forEach(s => {
    if (!gradeGroups[s.gradeLevel]) gradeGroups[s.gradeLevel] = [];
    gradeGroups[s.gradeLevel].push(s.sectionName);
  });
  
  Object.keys(gradeGroups).sort().forEach(grade => {
    console.log(`   Grade ${grade}: ${gradeGroups[grade].join(', ')}`);
  });
  
  console.log('\n📝 Next Steps:');
  console.log('   Run Phase 4: Assign teachers to sections');
  console.log('   Command: node scripts/real-onboarding/phase4-assign-teachers.cjs');
  console.log('\n');
  
  rl.close();
}

createSections().catch(console.error);
