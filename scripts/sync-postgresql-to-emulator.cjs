#!/usr/bin/env node
/**
 * Sync PostgreSQL users to Firebase Auth Emulator
 * 
 * This script creates Firebase Auth accounts and Firestore user documents
 * for all teachers, students, and parents that exist in PostgreSQL.
 * 
 * This allows testing with emulator using actual migrated data.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Configure for emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9100';

console.log('🔄 Syncing PostgreSQL users to Firebase Emulator...\n');

// Initialize Firebase Admin
admin.initializeApp({ projectId: 'edusync-local' });
const auth = admin.auth();
const db = admin.firestore();

// Default password for all test accounts
const DEFAULT_PASSWORD = 'TestPass123!';

// Load PostgreSQL users
const usersFile = path.join(__dirname, '..', 'postgresql-users.json');
if (!fs.existsSync(usersFile)) {
  console.error('❌ postgresql-users.json not found!');
  console.error('Run this first: node -e "..." to generate the file');
  process.exit(1);
}

const postgresqlUsers = JSON.parse(fs.readFileSync(usersFile, 'utf8'));

async function createFirebaseUser(email, displayName, role, schoolId, userId) {
  try {
    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      // Update existing user with correct displayName from PostgreSQL
      await auth.updateUser(userRecord.uid, {
        displayName: displayName,
        emailVerified: true
      });
      console.log(`  ✅ Updated auth: ${email} → ${displayName}`);
    } catch (error) {
      // User doesn't exist, create it
      userRecord = await auth.createUser({
        email: email,
        password: DEFAULT_PASSWORD,
        displayName: displayName,
        emailVerified: true
      });
      console.log(`  ✅ Created auth: ${email}`);
    }

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      role: role,
      schools: [schoolId]
    });

    // Create/update Firestore user document
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      name: displayName, // CRITICAL: Header uses .name, not .displayName
      displayName: displayName,
      role: role,
      schoolId: schoolId,
      postgresqlId: userId, // Link to PostgreSQL ID
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return userRecord.uid;
  } catch (error) {
    console.error(`  ❌ Error creating ${email}:`, error.message);
    return null;
  }
}

async function syncUsers() {
  console.log('📊 Summary:');
  console.log(`  Teachers: ${postgresqlUsers.teachers.length}`);
  console.log(`  Students: ${postgresqlUsers.students.length}`);
  console.log(`  Parents: ${postgresqlUsers.parents.length}`);
  console.log(`  Total: ${postgresqlUsers.teachers.length + postgresqlUsers.students.length + postgresqlUsers.parents.length}\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  // Sync Teachers
  console.log('👨‍🏫 Syncing Teachers...');
  for (const teacher of postgresqlUsers.teachers) {
    if (!teacher.email || teacher.email.includes('null')) {
      skipped++;
      continue;
    }
    const uid = await createFirebaseUser(
      teacher.email,
      teacher.name,
      'teacher',
      teacher.school_id || 'default',
      teacher.id
    );
    if (uid) created++;
    else errors++;
  }

  // Sync Students
  console.log('\n👨‍🎓 Syncing Students...');
  for (const student of postgresqlUsers.students) {
    if (!student.email || student.email.includes('null')) {
      skipped++;
      continue;
    }
    const displayName = `${student.first_name} ${student.last_name}`.trim();
    const uid = await createFirebaseUser(
      student.email,
      displayName,
      'student',
      student.school_id || 'default',
      student.id
    );
    if (uid) created++;
    else errors++;
  }

  // Sync Parents
  console.log('\n👨‍👩‍👧‍👦 Syncing Parents...');
  for (const parent of postgresqlUsers.parents) {
    if (!parent.email || parent.email.includes('null')) {
      skipped++;
      continue;
    }
    const uid = await createFirebaseUser(
      parent.email,
      parent.name,
      'parent',
      parent.school_id || 'default',
      parent.id
    );
    if (uid) created++;
    else errors++;
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ Sync Complete!');
  console.log('═'.repeat(60));
  console.log(`  Created/Updated: ${created}`);
  console.log(`  Skipped (no email): ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log('\n📝 Login Credentials:');
  console.log('  Email: Any teacher/student/parent email from PostgreSQL');
  console.log(`  Password: ${DEFAULT_PASSWORD}`);
  console.log('\nExample logins:');
  if (postgresqlUsers.teachers.length > 0) {
    const teacher = postgresqlUsers.teachers.find(t => t.email && !t.email.includes('null'));
    if (teacher) {
      console.log(`  Teacher: ${teacher.email} / ${DEFAULT_PASSWORD}`);
    }
  }
  if (postgresqlUsers.students.length > 0) {
    const student = postgresqlUsers.students.find(s => s.email && !s.email.includes('null'));
    if (student) {
      console.log(`  Student: ${student.email} / ${DEFAULT_PASSWORD}`);
    }
  }
  if (postgresqlUsers.parents.length > 0) {
    const parent = postgresqlUsers.parents.find(p => p.email && !p.email.includes('null'));
    if (parent) {
      console.log(`  Parent: ${parent.email} / ${DEFAULT_PASSWORD}`);
    }
  }
  console.log('═'.repeat(60));
}

syncUsers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
