#!/usr/bin/env node

/**
 * Create Teacher Profile Script
 * - Creates a teacher document in Firestore for an existing Auth user
 * - Allows assigning the teacher as an adviser to a section
 *
 * Usage:
 *   node scripts/admin/create-teacher-profile.cjs \
 *     --email=teacher-test@edusync.local \
 *     --firstName=Test \
 *     --lastName=Teacher \
 *     --employeeNumber=T-2024-001 \
 *     --section=grade1-section1 (optional)
 *
 * Notes:
 * - Requires Firebase Admin SDK initialization
 * - Will create a document in the `teachers` collection
 * - Optionally updates a section's adviserId
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

  if (!args.email || !args.firstName || !args.lastName) {
    console.error('Usage: node create-teacher-profile.cjs --email=EMAIL --firstName=FIRST --lastName=LAST [--employeeNumber=EMP] [--section=SECTION_ID]');
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

  const db = admin.firestore();
  const auth = admin.auth();

  try {
    // 1. Verify the Auth user exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(args.email);
      console.log(`✓ Found Auth user: ${args.email} (uid=${userRecord.uid})`);
    } catch (err) {
      console.error(`✗ Auth user not found: ${args.email}`);
      console.error('  Create the Auth user first using create-test-users.cjs or Firebase Console');
      process.exit(1);
    }

    // 2. Check if teacher profile already exists
    const teachersSnapshot = await db.collection('teachers')
      .where('email', '==', args.email)
      .limit(1)
      .get();

    let teacherId;
    if (!teachersSnapshot.empty) {
      teacherId = teachersSnapshot.docs[0].id;
      console.log(`✓ Teacher profile already exists (id=${teacherId})`);
    } else {
      // 3. Create teacher profile
      const teacherData = {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        name: `${args.firstName} ${args.lastName}`,
        employeeNumber: args.employeeNumber || `T-${Date.now()}`,
        status: 'active',
        role: 'teacher',
        uid: userRecord.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const teacherRef = await db.collection('teachers').add(teacherData);
      teacherId = teacherRef.id;
      console.log(`✓ Created teacher profile (id=${teacherId})`);
    }

    // 4. Optionally assign as section adviser
    if (args.section) {
      const sectionRef = db.collection('sections').doc(args.section);
      const sectionDoc = await sectionRef.get();
      
      if (!sectionDoc.exists) {
        console.warn(`✗ Section not found: ${args.section}`);
      } else {
        await sectionRef.update({
          adviserId: teacherId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✓ Assigned as adviser to section: ${args.section}`);
      }
    }

    console.log('\n✓ Teacher profile setup complete!');
    console.log(`  Email: ${args.email}`);
    console.log(`  Teacher ID: ${teacherId}`);
    if (args.section) {
      console.log(`  Assigned to section: ${args.section}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

main();
