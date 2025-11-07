#!/usr/bin/env node

/**
 * List Sections Script
 * - Shows all sections in the system with their IDs, names, and current advisers
 *
 * Usage:
 *   node scripts/admin/list-sections.cjs
 */

const admin = require('firebase-admin');

async function main() {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
  } catch (e) {
    console.error('Failed to initialize Firebase Admin SDK:', e.message || e);
    process.exit(1);
  }

  const db = admin.firestore();

  try {
    console.log('📚 Fetching sections...\n');
    
    const sectionsSnapshot = await db.collection('sections').orderBy('gradeLevel').get();
    
    if (sectionsSnapshot.empty) {
      console.log('No sections found.');
      process.exit(0);
    }

    console.log(`Found ${sectionsSnapshot.size} sections:\n`);
    console.log('ID'.padEnd(25) + 'Name'.padEnd(30) + 'Grade'.padEnd(10) + 'Adviser ID');
    console.log('─'.repeat(90));

    for (const doc of sectionsSnapshot.docs) {
      const section = doc.data();
      const id = doc.id;
      const name = section.name || 'Unnamed';
      const grade = `Grade ${section.gradeLevel || '?'}`;
      const adviserId = section.adviserId || 'None';
      
      console.log(
        id.padEnd(25) +
        name.padEnd(30) +
        grade.padEnd(10) +
        adviserId
      );
    }
    
    console.log('\n✓ Done');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

main();
