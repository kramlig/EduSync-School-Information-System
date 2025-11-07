#!/usr/bin/env node

/**
 * Audit User Roles Script
 * 
 * Checks all users in Firebase Auth and reports:
 * - Users WITH custom claims (roles)
 * - Users WITHOUT custom claims (need assignment)
 * - Role distribution statistics
 * 
 * Usage:
 *   node scripts/admin/audit-user-roles.cjs
 *   node scripts/admin/audit-user-roles.cjs --project=edusync-sis
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
  
  // Initialize Firebase Admin
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
    }
  } catch (error) {
    console.error('❌ Error: Failed to initialize Firebase Admin');
    console.error('Make sure GOOGLE_APPLICATION_CREDENTIALS is set');
    console.error(error.message);
    process.exit(1);
  }

  const auth = admin.auth();

  console.log('🔍 Auditing user roles...\n');

  const stats = {
    total: 0,
    withRoles: 0,
    withoutRoles: 0,
    byRole: {
      admin: 0,
      principal: 0,
      registrar: 0,
      teacher: 0,
      parent: 0
    }
  };

  const usersWithoutRoles = [];

  try {
    // List all users
    let nextPageToken;
    do {
      const listUsersResult = await auth.listUsers(1000, nextPageToken);
      
      listUsersResult.users.forEach((user) => {
        stats.total++;
        
        const claims = user.customClaims || {};
        const role = claims.role;

        if (role) {
          stats.withRoles++;
          if (stats.byRole.hasOwnProperty(role)) {
            stats.byRole[role]++;
          }
        } else {
          stats.withoutRoles++;
          usersWithoutRoles.push({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '(no name)',
            createdAt: user.metadata.creationTime
          });
        }
      });

      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    // Print results
    console.log('📊 AUDIT RESULTS');
    console.log('═'.repeat(60));
    console.log('');
    console.log(`Total Users:              ${stats.total}`);
    console.log(`Users WITH roles:         ${stats.withRoles} (${((stats.withRoles / stats.total) * 100).toFixed(1)}%)`);
    console.log(`Users WITHOUT roles:      ${stats.withoutRoles} (${((stats.withoutRoles / stats.total) * 100).toFixed(1)}%)`);
    console.log('');
    console.log('ROLE DISTRIBUTION:');
    console.log('─'.repeat(60));
    console.log(`  Admin:                  ${stats.byRole.admin}`);
    console.log(`  Principal:              ${stats.byRole.principal}`);
    console.log(`  Registrar:              ${stats.byRole.registrar}`);
    console.log(`  Teacher:                ${stats.byRole.teacher}`);
    console.log(`  Parent:                 ${stats.byRole.parent}`);
    console.log('');

    if (usersWithoutRoles.length > 0) {
      console.log('⚠️  USERS WITHOUT ROLES:');
      console.log('─'.repeat(60));
      usersWithoutRoles.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   ID: ${user.uid}`);
        console.log(`   Name: ${user.displayName}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
      console.log('💡 To assign roles, use:');
      console.log('   node scripts/admin/assign-role.cjs --userId=<uid> --role=<role>');
      console.log('   node scripts/admin/bulk-assign-roles.cjs');
      console.log('');
    } else {
      console.log('✅ All users have roles assigned!');
      console.log('');
    }

    // Check if transition mode can be removed
    if (stats.withoutRoles === 0) {
      console.log('🎉 READY TO REMOVE TRANSITION MODE');
      console.log('═'.repeat(60));
      console.log('All users have roles assigned. You can now:');
      console.log('1. Remove || isLegacyUser() from firestore.rules');
      console.log('2. Deploy strict RBAC rules');
      console.log('3. Improve security and performance');
      console.log('');
    } else {
      console.log('⏳ NOT READY FOR TRANSITION MODE REMOVAL');
      console.log('═'.repeat(60));
      console.log(`${stats.withoutRoles} user(s) still need role assignment.`);
      console.log('Complete role assignments before removing transition mode.');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
