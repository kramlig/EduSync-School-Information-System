#!/usr/bin/env node

/**
 * Update User Role Script
 * - Updates an existing Auth user's custom claims
 * - Updates the userRoles audit collection
 * - DOES NOT create Firestore teacher/admin profiles (use create-teacher-profile.cjs for that)
 *
 * Usage:
 *   node scripts/admin/update-user-role.cjs --email=kramlig.dotillos@gmail.com --role=teacher
 */

const admin = require('firebase-admin');

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

  if (!args.email || !args.role) {
    console.error('Usage: node update-user-role.cjs --email=EMAIL --role=ROLE');
    console.error('Valid roles: admin, teacher, parent, principal, registrar');
    process.exit(1);
  }

  const validRoles = ['admin', 'teacher', 'parent', 'principal', 'registrar'];
  if (!validRoles.includes(args.role)) {
    console.error(`Invalid role: ${args.role}`);
    console.error(`Valid roles: ${validRoles.join(', ')}`);
    process.exit(1);
  }

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

  const auth = admin.auth();
  const db = admin.firestore();

  try {
    // 1. Get user
    const userRecord = await auth.getUserByEmail(args.email);
    console.log(`✓ Found user: ${args.email} (uid=${userRecord.uid})`);

    // 2. Get current claims
    const currentClaims = userRecord.customClaims || {};
    console.log(`  Current role: ${currentClaims.role || 'none'}`);

    // 3. Update custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      ...currentClaims,
      role: args.role,
      schoolId: currentClaims.schoolId || 'default'
    });
    console.log(`✓ Updated role to: ${args.role}`);

    // 4. Update audit trail
    await db.collection('userRoles').doc(userRecord.uid).set({
      userId: userRecord.uid,
      email: args.email,
      displayName: userRecord.displayName || args.email,
      role: args.role,
      previousRole: currentClaims.role || 'none',
      assignedBy: 'update-user-role-script',
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      method: 'manual-update'
    }, { merge: true });
    console.log(`✓ Updated audit trail`);

    console.log(`\n✅ Role updated successfully!`);
    console.log(`   User must log out and log back in for changes to take effect.`);
    
    if (args.role === 'teacher') {
      console.log(`\n⚠️  Next step: Create teacher profile in Firestore:`);
      console.log(`   node scripts/admin/create-teacher-profile.cjs --email=${args.email} --firstName=FIRST --lastName=LAST --section=SECTION_ID`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

main();
