#!/usr/bin/env node

/**
 * Manual Role Assignment Script
 * 
 * Usage:
 *   node scripts/admin/assign-role.cjs --userId=abc123 --role=teacher
 *   node scripts/admin/assign-role.cjs --email=user@example.com --role=admin
 * 
 * Requires:
 *   - Firebase Admin SDK credentials
 *   - Admin privileges
 */

const admin = require('firebase-admin');
const path = require('path');

// Parse command line arguments
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    const [key, value] = arg.split('=');
    args[key.replace('--', '')] = value;
  });
  return args;
}

async function main() {
  const args = parseArgs();
  
  // Validate arguments
  if ((!args.userId && !args.email) || !args.role) {
    console.error('❌ Error: Missing required arguments');
    console.log('\nUsage:');
    console.log('  node scripts/admin/assign-role.cjs --userId=abc123 --role=teacher');
    console.log('  node scripts/admin/assign-role.cjs --email=user@example.com --role=admin');
    console.log('\nValid roles: admin, principal, registrar, teacher, parent');
    process.exit(1);
  }

  const { userId, email, role } = args;
  const validRoles = ['admin', 'principal', 'registrar', 'teacher', 'parent'];

  if (!validRoles.includes(role)) {
    console.error(`❌ Error: Invalid role "${role}"`);
    console.log(`Valid roles: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  // Initialize Firebase Admin
  const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                         path.join(__dirname, '..', '..', 'serviceAccountKey.json');

  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
    }
  } catch (error) {
    console.error('❌ Error: Failed to initialize Firebase Admin');
    console.error('Make sure GOOGLE_APPLICATION_CREDENTIALS is set or serviceAccountKey.json exists');
    console.error(error.message);
    process.exit(1);
  }

  const auth = admin.auth();
  const db = admin.firestore();

  try {
    // Get user by userId or email
    let user;
    if (userId) {
      console.log(`🔍 Looking up user by ID: ${userId}...`);
      user = await auth.getUser(userId);
    } else {
      console.log(`🔍 Looking up user by email: ${email}...`);
      user = await auth.getUserByEmail(email);
    }

    console.log(`✅ Found user: ${user.email} (${user.uid})`);

    // Get current claims
    const currentClaims = user.customClaims || {};
    const currentRole = currentClaims.role || 'none';

    if (currentRole === role) {
      console.log(`ℹ️  User already has role: ${role}`);
      return;
    }

    console.log(`📝 Current role: ${currentRole}`);
    console.log(`📝 New role: ${role}`);
    console.log('');

    // Set custom claims
    await auth.setCustomUserClaims(user.uid, {
      role: role,
      schoolId: currentClaims.schoolId || 'default',
      assignedAt: Date.now(),
      assignedBy: 'manual-script'
    });

    console.log(`✅ Custom claims updated successfully`);

    // Create/update audit trail
    await db.collection('userRoles').doc(user.uid).set({
      userId: user.uid,
      email: user.email,
      displayName: user.displayName || null,
      role: role,
      schoolId: currentClaims.schoolId || 'default',
      assignedBy: 'manual-script',
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      method: 'manual-script',
      previousRole: currentRole,
      scriptExecutedBy: process.env.USER || process.env.USERNAME || 'unknown'
    }, { merge: true });

    console.log(`✅ Audit trail updated`);
    console.log('');
    console.log('🎉 Role assignment completed successfully!');
    console.log(`   User: ${user.email}`);
    console.log(`   Role: ${currentRole} → ${role}`);
    console.log('');
    console.log('⚠️  Note: User must log out and log back in for changes to take effect');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
