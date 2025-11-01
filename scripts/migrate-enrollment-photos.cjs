/**
 * Data Migration Script: Transfer Enrollment Photos to Student Profiles
 * 
 * Purpose: One-time migration to transfer photos from approved enrollment applications
 * to their corresponding student records.
 * 
 * Use Case: When a feature is added after students have already been approved,
 * this script updates existing records without needing to re-approve.
 * 
 * Safety: Dry-run mode by default, explicit confirmation required for actual updates.
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin for emulator (no credentials needed)
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8086';

admin.initializeApp({
  projectId: 'edusync-local'
});

const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function migrateEnrollmentPhotos(dryRun = true) {
  console.log('\n=== ENROLLMENT PHOTO MIGRATION ===\n');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (no changes)' : '✍️  LIVE (will update database)'}\n`);

  try {
    // Get all approved applications with photos
    const applicationsSnapshot = await db.collection('enrollmentApplications')
      .where('status', '==', 'approved')
      .get();

    if (applicationsSnapshot.empty) {
      console.log('✓ No approved applications found.');
      return { updated: 0, skipped: 0, errors: 0 };
    }

    console.log(`Found ${applicationsSnapshot.size} approved application(s)\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const appDoc of applicationsSnapshot.docs) {
      const application = appDoc.data();
      const appId = appDoc.id;
      const appNumber = application.applicationNumber || appId.substring(0, 8);
      const studentName = `${application.studentInfo?.firstName || ''} ${application.studentInfo?.lastName || ''}`.trim();

      console.log(`\n📋 Processing: ${appNumber} - ${studentName}`);

      // Check if application has a photo
      const photoDocument = application.documents?.photoId;
      if (!photoDocument?.fileURL) {
        console.log('   ⏭️  Skipped: No photo in application');
        skipped++;
        continue;
      }

      console.log(`   📸 Photo found: ${photoDocument.fileURL.substring(0, 60)}...`);

      // Check if student was created from this application
      const enrolledStudentId = application.enrolledStudentId;
      if (!enrolledStudentId) {
        console.log('   ⚠️  Warning: No enrolledStudentId - student not created yet');
        skipped++;
        continue;
      }

      // Get student record
      const studentDoc = await db.collection('students').doc(enrolledStudentId).get();
      if (!studentDoc.exists) {
        console.log(`   ❌ Error: Student ${enrolledStudentId} not found`);
        errors++;
        continue;
      }

      const student = studentDoc.data();

      // Check if student already has a photo
      if (student.photoURL) {
        console.log('   ✓ Skipped: Student already has a photo');
        skipped++;
        continue;
      }

      // Perform update
      if (dryRun) {
        console.log('   🔍 DRY RUN: Would update student with:');
        console.log(`      - photoURL: ${photoDocument.fileURL}`);
        console.log(`      - photoUploadedAt: ${photoDocument.uploadedAt}`);
        console.log(`      - source: enrollment application ${appNumber}`);
      } else {
        await db.collection('students').doc(enrolledStudentId).update({
          photoURL: photoDocument.fileURL,
          photoUploadedAt: photoDocument.uploadedAt,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('   ✅ Updated: Photo transferred successfully');
      }

      updated++;
    }

    console.log('\n=== MIGRATION SUMMARY ===');
    console.log(`✅ ${dryRun ? 'Would update' : 'Updated'}: ${updated} student(s)`);
    console.log(`⏭️  Skipped: ${skipped} student(s)`);
    console.log(`❌ Errors: ${errors} student(s)`);

    return { updated, skipped, errors };

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

async function main() {
  try {
    // Step 1: Dry run
    console.log('\n🔍 Step 1: Running DRY RUN to preview changes...');
    const dryRunResults = await migrateEnrollmentPhotos(true);

    if (dryRunResults.updated === 0) {
      console.log('\n✓ No updates needed. Migration complete.');
      process.exit(0);
    }

    // Step 2: Ask for confirmation
    console.log('\n⚠️  WARNING: This will modify the database!');
    const answer = await question(`\nDo you want to apply these ${dryRunResults.updated} update(s)? (yes/no): `);

    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Migration cancelled by user.');
      process.exit(0);
    }

    // Step 3: Live run
    console.log('\n✍️  Step 2: Running LIVE migration...');
    const liveResults = await migrateEnrollmentPhotos(false);

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Refresh the Students page to see updated photos');
    console.log('2. Verify photos appear in student profiles');
    console.log('3. Check student list (table/grid view)');

  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Run the migration
main();
