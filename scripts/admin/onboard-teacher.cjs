#!/usr/bin/env node

/**
 * Comprehensive Teacher Onboarding Script
 * 
 * This script handles the COMPLETE onboarding of a teacher:
 * 1. Creates/updates Auth user with custom claims (role: teacher)
 * 2. Creates/updates teacher profile in Firestore
 * 3. Assigns teacher as adviser to a section (or creates a new section)
 * 4. Updates userRoles audit trail
 * 
 * This is the SINGLE source of truth for teacher onboarding.
 * 
 * Usage:
 *   # For emulator
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/admin/onboard-teacher.cjs \
 *     --email=kramlig.dotillos@gmail.com \
 *     --firstName=Mark \
 *     --lastName=Dotillos \
 *     --gradeLevel=6 \
 *     --sectionName=Diamond \
 *     --employeeNumber=T-2024-001 \
 *     --password=Test1234!
 * 
 *   # For production
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceaccount.json \
 *   node scripts/admin/onboard-teacher.cjs \
 *     --email=teacher@school.edu \
 *     --firstName=John \
 *     --lastName=Doe \
 *     --gradeLevel=7 \
 *     --sectionName=Ruby \
 *     --password=SecurePass123!
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

  // Validate required args
  if (!args.email || !args.firstName || !args.lastName) {
    console.error('❌ Missing required arguments');
    console.error('\nUsage:');
    console.error('  node onboard-teacher.cjs --email=EMAIL --firstName=FIRST --lastName=LAST [OPTIONS]');
    console.error('\nRequired:');
    console.error('  --email=EMAIL           Teacher email address');
    console.error('  --firstName=FIRST       First name');
    console.error('  --lastName=LAST         Last name');
    console.error('\nOptional:');
    console.error('  --gradeLevel=N          Grade level to advise (1-12)');
    console.error('  --sectionName=NAME      Section name (e.g., Diamond, Ruby)');
    console.error('  --sectionId=ID          Existing section ID to assign to');
    console.error('  --employeeNumber=NUM    Employee/ID number');
    console.error('  --password=PASS         Password for new Auth user (default: Test1234!)');
    console.error('  --learningArea=AREA     Primary learning area (e.g., Mathematics, Science)');
    console.error('  --contactNumber=NUM     Contact number');
    process.exit(1);
  }

  // Initialize Firebase Admin
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
  } catch (e) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', e.message || e);
    console.error('\nFor emulator: set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080');
    console.error('For production: set GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceaccount.json');
    process.exit(1);
  }

  const auth = admin.auth();
  const db = admin.firestore();

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         COMPREHENSIVE TEACHER ONBOARDING SYSTEM                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const email = args.email;
  const firstName = args.firstName;
  const lastName = args.lastName;
  const fullName = `${firstName} ${lastName}`;
  const password = args.password || 'Test1234!';
  const employeeNumber = args.employeeNumber || `T-${Date.now()}`;
  const gradeLevel = args.gradeLevel ? parseInt(args.gradeLevel) : null;
  const sectionName = args.sectionName || null;
  const sectionId = args.sectionId || null;
  const learningArea = args.learningArea || null;
  const contactNumber = args.contactNumber || '';

  let userRecord;
  let teacherId;
  let assignedSectionId;

  try {
    // ============================================================
    // STEP 1: Auth User Setup (with custom claims)
    // ============================================================
    console.log('📋 STEP 1: Auth User Setup');
    console.log('────────────────────────────────────────────────────────────────');

    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`✓ Auth user exists (uid=${userRecord.uid})`);
      
      // Update custom claims
      await auth.setCustomUserClaims(userRecord.uid, {
        role: 'teacher',
        schoolId: 'default'
      });
      console.log(`✓ Updated custom claims: role=teacher`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        // Create new Auth user
        userRecord = await auth.createUser({
          email: email,
          password: password,
          displayName: fullName,
          emailVerified: true,
          disabled: false
        });
        console.log(`✓ Created Auth user (uid=${userRecord.uid})`);
        
        // Set custom claims
        await auth.setCustomUserClaims(userRecord.uid, {
          role: 'teacher',
          schoolId: 'default'
        });
        console.log(`✓ Set custom claims: role=teacher`);
      } else {
        throw err;
      }
    }

    // ============================================================
    // STEP 2: Firestore Teacher Profile
    // ============================================================
    console.log('\n📋 STEP 2: Firestore Teacher Profile');
    console.log('────────────────────────────────────────────────────────────────');

    // Check if teacher profile exists
    const teachersSnapshot = await db.collection('teachers')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!teachersSnapshot.empty) {
      teacherId = teachersSnapshot.docs[0].id;
      console.log(`✓ Teacher profile exists (id=${teacherId})`);
      
      // Update existing profile
      await db.collection('teachers').doc(teacherId).update({
        firstName,
        lastName,
        name: fullName,
        employeeNumber,
        learningArea: learningArea || admin.firestore.FieldValue.delete(),
        contactNumber: contactNumber || admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✓ Updated teacher profile`);
    } else {
      // Create new teacher profile
      const teacherData = {
        email,
        firstName,
        lastName,
        name: fullName,
        employeeNumber,
        status: 'active',
        role: 'teacher',
        uid: userRecord.uid,
        learningArea: learningArea || null,
        contactNumber: contactNumber || '',
        assignments: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const teacherRef = await db.collection('teachers').add(teacherData);
      teacherId = teacherRef.id;
      console.log(`✓ Created teacher profile (id=${teacherId})`);
    }

    // Also mirror to users collection for UI consistency
    await db.collection('users').doc(teacherId).set({
      email,
      name: fullName,
      role: 'teacher',
      uid: userRecord.uid,
    }, { merge: true });
    console.log(`✓ Mirrored to users collection`);

    // ============================================================
    // STEP 3: Section Assignment
    // ============================================================
    console.log('\n📋 STEP 3: Section Assignment');
    console.log('────────────────────────────────────────────────────────────────');

    if (sectionId) {
      // Assign to existing section by ID
      const sectionRef = db.collection('sections').doc(sectionId);
      const sectionDoc = await sectionRef.get();
      
      if (!sectionDoc.exists) {
        console.warn(`⚠️  Section not found: ${sectionId}`);
        console.log(`   Teacher created but not assigned to any section`);
      } else {
        await sectionRef.update({
          adviserId: teacherId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        assignedSectionId = sectionId;
        const section = sectionDoc.data();
        console.log(`✓ Assigned as adviser to section: ${section.name} (Grade ${section.gradeLevel})`);
      }
    } else if (gradeLevel && sectionName) {
      // Find or create section by grade level and name
      const sectionsSnapshot = await db.collection('sections')
        .where('gradeLevel', '==', gradeLevel)
        .where('name', '==', sectionName)
        .limit(1)
        .get();

      if (!sectionsSnapshot.empty) {
        // Section exists - update adviserId
        assignedSectionId = sectionsSnapshot.docs[0].id;
        await db.collection('sections').doc(assignedSectionId).update({
          adviserId: teacherId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✓ Assigned as adviser to existing section: ${sectionName} (Grade ${gradeLevel})`);
      } else {
        // Create new section
        const newSection = {
          name: sectionName,
          gradeLevel: gradeLevel,
          adviserId: teacherId,
          schoolYear: '2023-2024',
          status: 'active',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const sectionRef = await db.collection('sections').add(newSection);
        assignedSectionId = sectionRef.id;
        console.log(`✓ Created new section: ${sectionName} (Grade ${gradeLevel})`);
        console.log(`✓ Assigned as adviser to new section`);
      }
    } else {
      console.log(`⚠️  No section assignment specified`);
      console.log(`   Teacher created but not assigned to any section`);
      console.log(`   Use --sectionId, or --gradeLevel + --sectionName to assign`);
    }

    // ============================================================
    // STEP 4: Audit Trail
    // ============================================================
    console.log('\n📋 STEP 4: Audit Trail');
    console.log('────────────────────────────────────────────────────────────────');

    await db.collection('userRoles').doc(userRecord.uid).set({
      userId: userRecord.uid,
      email: email,
      displayName: fullName,
      role: 'teacher',
      assignedBy: 'onboard-teacher-script',
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      method: 'comprehensive-onboarding',
      teacherId: teacherId,
      sectionId: assignedSectionId || null,
    }, { merge: true });
    console.log(`✓ Created audit trail in userRoles collection`);

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    ONBOARDING COMPLETE                         ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log(`✅ Teacher: ${fullName} (${email})`);
    console.log(`   Auth UID: ${userRecord.uid}`);
    console.log(`   Teacher ID: ${teacherId}`);
    console.log(`   Employee #: ${employeeNumber}`);
    if (assignedSectionId) {
      console.log(`   Section: ${sectionName || assignedSectionId} (Grade ${gradeLevel})`);
    } else {
      console.log(`   Section: Not assigned`);
    }
    console.log(`\n✓ Custom claims set (role: teacher)`);
    console.log(`✓ Teacher profile created in Firestore`);
    if (assignedSectionId) {
      console.log(`✓ Assigned as section adviser`);
    }
    console.log(`✓ Audit trail created`);
    console.log('\n📝 Next Steps:');
    console.log(`   1. Teacher should log out and log back in to refresh claims`);
    console.log(`   2. Teacher can now access Form 138 for their students`);
    if (!assignedSectionId) {
      console.log(`   3. Assign to a section using:`);
      console.log(`      node scripts/admin/onboard-teacher.cjs \\`);
      console.log(`        --email=${email} \\`);
      console.log(`        --firstName=${firstName} \\`);
      console.log(`        --lastName=${lastName} \\`);
      console.log(`        --gradeLevel=6 \\`);
      console.log(`        --sectionName=Diamond`);
    }
    console.log('');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error during onboarding:', err.message || err);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

main();
