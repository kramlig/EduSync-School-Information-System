/**
 * Setup Custom Claims for User Roles
 * 
 * This script assigns role-based custom claims to Firebase Auth users.
 * Required for Firestore security rules to work properly.
 * 
 * Usage:
 *   node scripts/setup-custom-claims.cjs --email=admin@school.com --role=admin
 *   node scripts/setup-custom-claims.cjs --uid=abc123 --role=teacher
 *   node scripts/setup-custom-claims.cjs --batch=users.json
 * 
 * Roles: admin, principal, registrar, teacher, parent
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value;
  return acc;
}, {});

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || args.serviceAccount;

if (!serviceAccountPath) {
  console.error('❌ Error: Service account credentials not found.');
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS environment variable or use --serviceAccount flag');
  console.error('Example: node scripts/setup-custom-claims.cjs --serviceAccount=./serviceAccountKey.json --email=admin@school.com --role=admin');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = require(path.resolve(serviceAccountPath));
} catch (error) {
  console.error('❌ Error loading service account:', error.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const validRoles = ['admin', 'principal', 'registrar', 'teacher', 'parent'];

/**
 * Set custom claims for a single user
 */
async function setUserRole(identifier, role, schoolId = 'school-001') {
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`);
  }

  let user;

  // Find user by email or UID
  if (identifier.includes('@')) {
    user = await admin.auth().getUserByEmail(identifier);
    console.log(`✅ Found user by email: ${identifier}`);
  } else {
    user = await admin.auth().getUser(identifier);
    console.log(`✅ Found user by UID: ${identifier}`);
  }

  // Set custom claims
  await admin.auth().setCustomUserClaims(user.uid, {
    role: role,
    schoolId: schoolId
  });

  console.log(`✅ Successfully set role "${role}" for user: ${user.email || user.uid}`);
  console.log(`   UID: ${user.uid}`);
  console.log(`   School ID: ${schoolId}`);

  return user;
}

/**
 * Process batch of users from JSON file
 */
async function processBatch(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  console.log(`\n📦 Processing batch of ${data.length} users...\n`);

  const results = {
    success: [],
    failed: []
  };

  for (const userConfig of data) {
    try {
      const identifier = userConfig.email || userConfig.uid;
      const role = userConfig.role;
      const schoolId = userConfig.schoolId || 'school-001';

      await setUserRole(identifier, role, schoolId);
      results.success.push({ identifier, role });
    } catch (error) {
      console.error(`❌ Failed to set role for ${userConfig.email || userConfig.uid}:`, error.message);
      results.failed.push({ identifier: userConfig.email || userConfig.uid, error: error.message });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Success: ${results.success.length}/${data.length}`);
  console.log(`❌ Failed: ${results.failed.length}/${data.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Users:');
    results.failed.forEach(f => console.log(`   - ${f.identifier}: ${f.error}`));
  }

  return results;
}

/**
 * List all users with their custom claims
 */
async function listUsers() {
  console.log('\n📋 Listing all users and their roles...\n');

  const listUsersResult = await admin.auth().listUsers();
  
  const usersWithRoles = listUsersResult.users.map(user => ({
    uid: user.uid,
    email: user.email,
    role: user.customClaims?.role || 'NO ROLE SET',
    schoolId: user.customClaims?.schoolId || 'NO SCHOOL SET'
  }));

  console.table(usersWithRoles);
  
  return usersWithRoles;
}

/**
 * Create example batch file
 */
function createExampleBatch() {
  const exampleData = [
    {
      email: 'admin@school.com',
      role: 'admin',
      schoolId: 'school-001'
    },
    {
      email: 'principal@school.com',
      role: 'principal',
      schoolId: 'school-001'
    },
    {
      email: 'registrar@school.com',
      role: 'registrar',
      schoolId: 'school-001'
    },
    {
      email: 'teacher1@school.com',
      role: 'teacher',
      schoolId: 'school-001'
    },
    {
      email: 'parent1@school.com',
      role: 'parent',
      schoolId: 'school-001'
    }
  ];

  const outputPath = path.join(__dirname, 'example-users-batch.json');
  fs.writeFileSync(outputPath, JSON.stringify(exampleData, null, 2));
  
  console.log(`✅ Created example batch file: ${outputPath}`);
  console.log('\nEdit this file with your actual users, then run:');
  console.log(`node scripts/setup-custom-claims.cjs --batch=${outputPath}`);
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🔐 Firebase Custom Claims Setup Tool');
    console.log('='.repeat(60));

    // Command: Create example batch file
    if (args.createExample) {
      createExampleBatch();
      process.exit(0);
    }

    // Command: List all users
    if (args.list) {
      await listUsers();
      process.exit(0);
    }

    // Command: Process batch file
    if (args.batch) {
      await processBatch(args.batch);
      process.exit(0);
    }

    // Command: Set single user role
    if ((args.email || args.uid) && args.role) {
      const identifier = args.email || args.uid;
      const schoolId = args.schoolId || 'school-001';
      await setUserRole(identifier, args.role, schoolId);
      process.exit(0);
    }

    // No valid command provided
    console.log('\n❌ No valid command provided.\n');
    console.log('Usage:');
    console.log('  Single user:   node scripts/setup-custom-claims.cjs --email=user@school.com --role=admin');
    console.log('  By UID:        node scripts/setup-custom-claims.cjs --uid=abc123 --role=teacher');
    console.log('  Batch:         node scripts/setup-custom-claims.cjs --batch=users.json');
    console.log('  List users:    node scripts/setup-custom-claims.cjs --list');
    console.log('  Create example: node scripts/setup-custom-claims.cjs --createExample');
    console.log('\nValid roles: ' + validRoles.join(', '));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { setUserRole, processBatch, listUsers };
