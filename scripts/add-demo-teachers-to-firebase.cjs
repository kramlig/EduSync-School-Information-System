/**
 * Add Demo Teachers to Firebase Auth
 * 
 * This script creates Firebase Auth accounts for the demo teachers
 * that were seeded in the PostgreSQL database.
 * 
 * Run: node scripts/add-demo-teachers-to-firebase.cjs
 * 
 * For Production: Use with GOOGLE_APPLICATION_CREDENTIALS env var
 * For Emulator: Set FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Configuration
const USE_EMULATOR = process.env.FIREBASE_AUTH_EMULATOR_HOST || false;
const DEFAULT_PASSWORD = 'teacher123';

// Demo teachers from SF7 seeding (synced with PostgreSQL)
const DEMO_TEACHERS = [
  {
    email: 'maria.santos@school.edu',
    displayName: 'Maria P. Santos',
    role: 'teacher',
    subject: 'Mathematics',
    position: 'Teacher II'
  },
  {
    email: 'juan.delacruz@school.edu',
    displayName: 'Juan M. Dela Cruz',
    role: 'teacher',
    subject: 'Science',
    position: 'Teacher I'
  },
  {
    email: 'ana.reyes@school.edu',
    displayName: 'Ana L. Reyes',
    role: 'teacher',
    subject: 'English',
    position: 'Teacher III'
  },
  {
    email: 'pedro.garcia@school.edu',
    displayName: 'Pedro R. Garcia',
    role: 'teacher',
    subject: 'Filipino',
    position: 'Teacher I'
  },
  {
    email: 'rosa.mendoza@school.edu',
    displayName: 'Rosa T. Mendoza',
    role: 'teacher',
    subject: 'TLE',
    position: 'Master Teacher'
  },
  {
    email: 'carlos.villanueva@school.edu',
    displayName: 'Carlos A. Villanueva',
    role: 'teacher',
    subject: 'MAPEH',
    position: 'Teacher I'
  },
  {
    email: 'elena.fernandez@school.edu',
    displayName: 'Elena S. Fernandez',
    role: 'teacher',
    subject: 'Araling Panlipunan',
    position: 'Teacher II'
  },
  {
    email: 'miguel.aquino@school.edu',
    displayName: 'Miguel C. Aquino',
    role: 'teacher',
    subject: 'Values Education',
    position: 'Teacher I'
  }
];

async function main() {
  console.log('🚀 Adding Demo Teachers to Firebase Auth\n');
  
  // Check if running against emulator
  if (USE_EMULATOR) {
    console.log(`📡 Using Firebase Auth Emulator: ${USE_EMULATOR}`);
    process.env.FIREBASE_AUTH_EMULATOR_HOST = USE_EMULATOR;
  } else {
    console.log('🔥 Using Production Firebase (requires GOOGLE_APPLICATION_CREDENTIALS)');
  }
  
  // Initialize Firebase Admin
  try {
    if (USE_EMULATOR) {
      initializeApp({
        projectId: 'edusync-sis'
      });
    } else {
      // For production, expects GOOGLE_APPLICATION_CREDENTIALS env var
      initializeApp();
    }
    console.log('✅ Firebase Admin initialized\n');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
  }
  
  const auth = getAuth();
  
  console.log('📝 Creating teacher accounts...\n');
  console.log('═'.repeat(70));
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const teacher of DEMO_TEACHERS) {
    try {
      // Check if user already exists
      try {
        const existingUser = await auth.getUserByEmail(teacher.email);
        console.log(`⏭️  SKIPPED: ${teacher.email} (already exists: ${existingUser.uid})`);
        skipped++;
        continue;
      } catch (e) {
        // User doesn't exist, create them
      }
      
      // Create the user
      const userRecord = await auth.createUser({
        email: teacher.email,
        password: DEFAULT_PASSWORD,
        displayName: teacher.displayName,
        emailVerified: true,
        disabled: false
      });
      
      // Set custom claims
      await auth.setCustomUserClaims(userRecord.uid, {
        role: teacher.role,
        subject: teacher.subject
      });
      
      console.log(`✅ CREATED: ${teacher.email}`);
      console.log(`   UID: ${userRecord.uid}`);
      console.log(`   Name: ${teacher.displayName}`);
      console.log(`   Subject: ${teacher.subject} (${teacher.position})`);
      console.log('');
      
      created++;
    } catch (error) {
      console.error(`❌ ERROR: ${teacher.email} - ${error.message}`);
      errors++;
    }
  }
  
  console.log('═'.repeat(70));
  console.log('\n📊 Summary:');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📧 Password: ${DEFAULT_PASSWORD}`);
  
  console.log('\n🔑 Demo Teacher Login Credentials:\n');
  console.log('┌─────────────────────────────────────┬──────────────────────┬─────────────┐');
  console.log('│ Email                               │ Subject              │ Password    │');
  console.log('├─────────────────────────────────────┼──────────────────────┼─────────────┤');
  DEMO_TEACHERS.forEach(t => {
    const email = t.email.padEnd(35);
    const subject = t.subject.padEnd(20);
    console.log(`│ ${email} │ ${subject} │ ${DEFAULT_PASSWORD}  │`);
  });
  console.log('└─────────────────────────────────────┴──────────────────────┴─────────────┘');
  
  console.log('\n✨ Done! Teachers can now log in to the app.\n');
  
  // Print next steps
  console.log('📋 Next Steps:');
  console.log('   1. Run the SF7 seeding SQL to add teacher data to PostgreSQL');
  console.log('   2. Login with any of the teacher accounts above');
  console.log('   3. Navigate to different modules to test data sync');
  console.log('');
}

main().catch(console.error);
