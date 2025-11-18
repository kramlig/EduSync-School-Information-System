#!/usr/bin/env node

/**
 * Firestore Backup Script
 * 
 * Exports all Firestore collections to JSON files for migration to PostgreSQL.
 * This script creates a complete backup of the current Firestore database.
 * 
 * Usage:
 *   node scripts/migration/01-export-firestore.cjs --project edusync-sis
 *   node scripts/migration/01-export-firestore.cjs --project edusync-staging --useEmulator=true
 * 
 * Output:
 *   backups/YYYY-MM-DD/schools.json
 *   backups/YYYY-MM-DD/students.json
 *   backups/YYYY-MM-DD/teachers.json
 *   ... (all collections)
 *   backups/YYYY-MM-DD/export-summary.txt
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value || true;
  return acc;
}, {});

const PROJECT_ID = args.project || 'edusync-sis';
const USE_EMULATOR = args.useEmulator === 'true';

console.log('\n🔥 Firestore Export Script');
console.log('=' .repeat(70));
console.log(`Project: ${PROJECT_ID}`);
console.log(`Emulator: ${USE_EMULATOR ? 'YES' : 'NO'}`);
console.log('=' .repeat(70) + '\n');

// Initialize Firebase Admin
const serviceAccount = require(`../../firebase-${PROJECT_ID}-service-account.json`);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: PROJECT_ID
});

if (USE_EMULATOR) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  console.log('📡 Connected to Firestore Emulator\n');
}

const db = admin.firestore();

// Collections to export
const COLLECTIONS = [
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

// Create backup directory
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const BACKUP_DIR = path.join(__dirname, '../../backups', today);

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`✅ Created backup directory: ${BACKUP_DIR}\n`);
}

/**
 * Convert Firestore Timestamp to ISO string
 */
function serializeTimestamp(value) {
  if (value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  return value;
}

/**
 * Recursively serialize Firestore document data
 */
function serializeDocData(data) {
  if (Array.isArray(data)) {
    return data.map(serializeDocData);
  }
  
  if (data && typeof data === 'object') {
    const serialized = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeDocData(serializeTimestamp(value));
    }
    return serialized;
  }
  
  return data;
}

/**
 * Export a single collection to JSON
 */
async function exportCollection(collectionName) {
  console.log(`📦 Exporting collection: ${collectionName}...`);
  
  try {
    const snapshot = await db.collection(collectionName).get();
    
    const documents = [];
    snapshot.forEach(doc => {
      const data = serializeDocData(doc.data());
      documents.push({
        id: doc.id,
        ...data
      });
    });
    
    const filePath = path.join(BACKUP_DIR, `${collectionName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), 'utf8');
    
    const fileSize = fs.statSync(filePath).size;
    const fileSizeKB = (fileSize / 1024).toFixed(2);
    
    console.log(`   ✅ Exported ${documents.length} documents (${fileSizeKB} KB)`);
    
    return {
      collection: collectionName,
      count: documents.length,
      sizeKB: parseFloat(fileSizeKB),
      status: 'success'
    };
    
  } catch (error) {
    console.error(`   ❌ Error exporting ${collectionName}:`, error.message);
    return {
      collection: collectionName,
      count: 0,
      sizeKB: 0,
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Check for data quality issues
 */
async function checkDataQuality() {
  console.log('\n🔍 Checking Data Quality...\n');
  
  const issues = [];
  
  // Check 1: Orphaned student.sectionId references
  console.log('   1. Checking for orphaned student.sectionId...');
  const studentsSnapshot = await db.collection('students').get();
  const sectionsSnapshot = await db.collection('sections').get();
  const sectionIds = new Set(sectionsSnapshot.docs.map(doc => doc.id));
  
  let orphanedSections = 0;
  studentsSnapshot.forEach(doc => {
    const student = doc.data();
    if (student.sectionId && !sectionIds.has(student.sectionId)) {
      orphanedSections++;
      issues.push({
        type: 'ORPHANED_SECTION_ID',
        collection: 'students',
        documentId: doc.id,
        field: 'sectionId',
        value: student.sectionId
      });
    }
  });
  console.log(`      ${orphanedSections === 0 ? '✅' : '⚠️'} Found ${orphanedSections} orphaned section references`);
  
  // Check 2: Duplicate MAPEH learning areas
  console.log('   2. Checking for duplicate MAPEH subjects...');
  const learningAreasSnapshot = await db.collection('learningAreas').get();
  const mapehRelated = ['la_mus', 'la_art', 'la_pe', 'la_hlt', 'la_mapeh'];
  const foundMapeh = learningAreasSnapshot.docs.filter(doc => 
    mapehRelated.includes(doc.id) || 
    ['Music', 'Arts', 'Physical Education', 'Health', 'MAPEH'].includes(doc.data().name)
  );
  
  if (foundMapeh.length > 1) {
    console.log(`      ⚠️ Found ${foundMapeh.length} MAPEH-related subjects (should be 1)`);
    foundMapeh.forEach(doc => {
      issues.push({
        type: 'DUPLICATE_MAPEH',
        collection: 'learningAreas',
        documentId: doc.id,
        name: doc.data().name
      });
    });
  } else {
    console.log(`      ✅ MAPEH subjects OK`);
  }
  
  // Check 3: Missing schoolId fields
  console.log('   3. Checking for missing schoolId fields...');
  const gradesSnapshot = await db.collection('grades').limit(100).get();
  let missingSchoolId = 0;
  
  gradesSnapshot.forEach(doc => {
    const grade = doc.data();
    if (!grade.schoolId) {
      missingSchoolId++;
      issues.push({
        type: 'MISSING_SCHOOL_ID',
        collection: 'grades',
        documentId: doc.id
      });
    }
  });
  console.log(`      ${missingSchoolId === 0 ? '✅' : '⚠️'} Found ${missingSchoolId} grades missing schoolId`);
  
  // Check 4: Orphaned grades (no student)
  console.log('   4. Checking for orphaned grades...');
  const studentIds = new Set(studentsSnapshot.docs.map(doc => doc.id));
  let orphanedGrades = 0;
  
  gradesSnapshot.forEach(doc => {
    const grade = doc.data();
    if (grade.studentId && !studentIds.has(grade.studentId)) {
      orphanedGrades++;
      issues.push({
        type: 'ORPHANED_GRADE',
        collection: 'grades',
        documentId: doc.id,
        studentId: grade.studentId
      });
    }
  });
  console.log(`      ${orphanedGrades === 0 ? '✅' : '⚠️'} Found ${orphanedGrades} orphaned grades\n`);
  
  return issues;
}

/**
 * Main export function
 */
async function main() {
  const startTime = Date.now();
  const results = [];
  
  console.log('🚀 Starting Firestore export...\n');
  
  // Export all collections
  for (const collection of COLLECTIONS) {
    const result = await exportCollection(collection);
    results.push(result);
  }
  
  console.log('\n');
  
  // Check data quality
  const issues = await checkDataQuality();
  
  // Generate summary
  const totalDocs = results.reduce((sum, r) => sum + r.count, 0);
  const totalSizeKB = results.reduce((sum, r) => sum + r.sizeKB, 0);
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'error').length;
  
  console.log('📊 Export Summary');
  console.log('=' .repeat(70));
  console.log(`Total Collections: ${COLLECTIONS.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total Documents: ${totalDocs}`);
  console.log(`Total Size: ${totalSizeKB.toFixed(2)} KB (${(totalSizeKB / 1024).toFixed(2)} MB)`);
  console.log(`Data Quality Issues: ${issues.length}`);
  console.log('=' .repeat(70) + '\n');
  
  // Write summary to file
  const summaryPath = path.join(BACKUP_DIR, 'export-summary.txt');
  const summaryContent = `
EduSync Firestore Export Summary
================================
Date: ${new Date().toISOString()}
Project: ${PROJECT_ID}
Emulator: ${USE_EMULATOR}

Collections Exported
--------------------
${results.map(r => `${r.collection.padEnd(25)} ${r.count.toString().padStart(6)} docs  ${r.sizeKB.toFixed(2).padStart(10)} KB  ${r.status}`).join('\n')}

Totals
------
Total Collections: ${COLLECTIONS.length}
Successful: ${successful}
Failed: ${failed}
Total Documents: ${totalDocs}
Total Size: ${totalSizeKB.toFixed(2)} KB (${(totalSizeKB / 1024).toFixed(2)} MB)

Data Quality Issues (${issues.length})
-------------------
${issues.length === 0 ? 'No issues found! ✅' : issues.map(i => `- ${i.type}: ${i.collection}/${i.documentId}${i.field ? ` (${i.field})` : ''}`).join('\n')}

Export Time: ${((Date.now() - startTime) / 1000).toFixed(2)} seconds
`;
  
  fs.writeFileSync(summaryPath, summaryContent, 'utf8');
  console.log(`📄 Summary written to: ${summaryPath}\n`);
  
  // Save data quality issues to JSON
  if (issues.length > 0) {
    const issuesPath = path.join(BACKUP_DIR, 'data-quality-issues.json');
    fs.writeFileSync(issuesPath, JSON.stringify(issues, null, 2), 'utf8');
    console.log(`⚠️  Data quality issues saved to: ${issuesPath}\n`);
  }
  
  // Final status
  if (failed === 0 && issues.length === 0) {
    console.log('✅ Export completed successfully with no issues!\n');
    process.exit(0);
  } else if (failed > 0) {
    console.log('❌ Export completed with errors. Check summary for details.\n');
    process.exit(1);
  } else {
    console.log('⚠️  Export completed but data quality issues found. Review before migration.\n');
    process.exit(0);
  }
}

// Run the export
main().catch(error => {
  console.error('\n❌ Fatal error during export:', error);
  process.exit(1);
});
