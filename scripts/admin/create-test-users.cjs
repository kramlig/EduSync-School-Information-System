#!/usr/bin/env node

/**
 * Create Test Users Script
 * - Creates admin, teacher, and parent accounts in the target Firebase project
 * - Sets custom claims (role) so they work with the app RBAC
 *
 * Usage:
 *   Set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON with proper permissions
 *   node scripts/admin/create-test-users.cjs --project=edusync-sis
 *
 * Notes:
 * - When run against the Firebase emulator Auth (with env vars pointing at it), this will create
 *   users in the emulator.
 * - For production, ensure the service account has `iam.serviceAccounts.actAs` and Firebase Admin
 *   privileges.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    const [k, v] = arg.split('=');
    args[k.replace(/^--/, '')] = v || true;
  });
  return args;
}

async function main() {
  const args = parseArgs();

  try {
    if (!admin.apps.length) {
      // Prefer application default credentials or GOOGLE_APPLICATION_CREDENTIALS
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
  } catch (e) {
    console.error('Failed to initialize Firebase Admin SDK. Make sure GOOGLE_APPLICATION_CREDENTIALS is set or you are using the emulator.');
    console.error(e.message || e);
    process.exit(1);
  }

  const users = [
    {
      email: 'admin-test@edusync.local',
      password: 'Test1234!',
      displayName: 'System Admin',
      role: 'admin'
    },
    {
      email: 'teacher-test@edusync.local',
      password: 'Test1234!',
      displayName: 'Test Teacher',
      role: 'teacher'
    },
    {
      email: 'parent-test@gmail.com',
      password: 'Test1234!',
      displayName: 'Test Parent',
      role: 'parent'
    }
  ];

  const auth = admin.auth();
  const created = [];

  for (const u of users) {
    try {
      // Try to find existing user by email
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(u.email);
        console.log(`User already exists: ${u.email} (uid=${userRecord.uid})`);
      } catch (err) {
        // Not found -> create
        userRecord = await auth.createUser({
          email: u.email,
          password: u.password,
          displayName: u.displayName,
          emailVerified: true,
          disabled: false
        });
        console.log(`Created user: ${u.email} (uid=${userRecord.uid})`);
      }

      // Set custom claims for role
      await auth.setCustomUserClaims(userRecord.uid, { role: u.role, schoolId: 'default' });
      console.log(`Set role=${u.role} for ${u.email}`);

      // Add an audit doc in Firestore (non-destructive)
      try {
        const db = admin.firestore();
        await db.collection('userRoles').doc(userRecord.uid).set({
          userId: userRecord.uid,
          email: u.email,
          displayName: u.displayName,
          role: u.role,
          assignedBy: 'create-test-users-script',
          assignedAt: admin.firestore.FieldValue.serverTimestamp(),
          method: 'test-seed'
        }, { merge: true });
        console.log(`Wrote audit trail for ${u.email}`);
      } catch (dbErr) {
        console.warn('Failed to write audit trail (Firestore may be unreachable in emulator or credentials missing):', dbErr.message || dbErr);
      }

      created.push({ email: u.email, uid: userRecord.uid, role: u.role });
    } catch (err) {
      console.error(`Failed to create or update user ${u.email}:`, err.message || err);
    }
  }

  console.log('\nSummary:');
  created.forEach(c => console.log(` - ${c.email} (uid=${c.uid}) role=${c.role}`));
  console.log('\nDone.');
  process.exit(0);
}

main();
