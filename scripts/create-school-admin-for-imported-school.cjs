/**
 * Create School Admin for SF1-Imported Schools
 * 
 * This script creates a Firebase Auth user and links them to a school
 * that was imported via SF1 Import (which only creates PostgreSQL records).
 * 
 * Usage:
 *   node scripts/create-school-admin-for-imported-school.cjs
 * 
 * Prerequisites:
 *   - Firebase CLI logged in: firebase login
 *   - Environment variables set in .env.local or exported
 */

const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'edusync-sis'
  });
}

const auth = admin.auth();

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://zjuxulhxxeeupcskkcok.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('   Set it with: $env:SUPABASE_SERVICE_ROLE_KEY="your-key"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('\n🏫 CREATE SCHOOL ADMIN FOR SF1-IMPORTED SCHOOL\n');
  console.log('This creates a Firebase Auth admin user for a school that was imported via SF1.\n');

  // Step 1: List schools imported via SF1
  console.log('📋 Fetching SF1-imported schools...\n');
  
  const { data: schools, error: schoolsError } = await supabase
    .from('schools')
    .select('id, name, school_id_number, division, region')
    .is('deleted_at', null)
    .order('name');

  if (schoolsError) {
    console.error('❌ Error fetching schools:', schoolsError.message);
    rl.close();
    return;
  }

  if (!schools || schools.length === 0) {
    console.log('❌ No schools found in the database.');
    rl.close();
    return;
  }

  // Display schools
  console.log('Available Schools:\n');
  schools.forEach((school, index) => {
    console.log(`  ${index + 1}. ${school.name}`);
    console.log(`     ID: ${school.id}`);
    console.log(`     DepEd ID: ${school.school_id_number || 'N/A'}`);
    console.log(`     Division: ${school.division || 'N/A'}`);
    console.log('');
  });

  // Select school
  const schoolIndex = parseInt(await question('Enter school number: ')) - 1;
  
  if (schoolIndex < 0 || schoolIndex >= schools.length) {
    console.log('❌ Invalid selection');
    rl.close();
    return;
  }

  const selectedSchool = schools[schoolIndex];
  console.log(`\n✅ Selected: ${selectedSchool.name}\n`);

  // Check if school already has an admin
  const { data: existingAdmins } = await supabase
    .from('teachers')
    .select('id, name, email, firebase_uid')
    .eq('school_id', selectedSchool.id)
    .or('role.eq.admin,position.ilike.%administrator%')
    .is('deleted_at', null);

  if (existingAdmins && existingAdmins.length > 0) {
    console.log('⚠️  This school already has potential admin(s):');
    existingAdmins.forEach(a => {
      console.log(`   - ${a.name} (${a.email})`);
      console.log(`     Firebase UID: ${a.firebase_uid || '❌ No Firebase account'}`);
    });
    
    const proceed = await question('\nCreate another admin? (yes/no): ');
    if (proceed.toLowerCase() !== 'yes') {
      console.log('Cancelled.');
      rl.close();
      return;
    }
  }

  // Get admin details
  console.log('\n📝 Enter School Admin Details:\n');
  const adminName = await question('Admin Full Name: ');
  const adminEmail = await question('Admin Email: ');
  const adminPassword = await question('Admin Password (min 6 chars): ');

  if (adminPassword.length < 6) {
    console.log('❌ Password must be at least 6 characters');
    rl.close();
    return;
  }

  // Confirm
  console.log('\n📋 Summary:');
  console.log(`   School: ${selectedSchool.name}`);
  console.log(`   School ID: ${selectedSchool.id}`);
  console.log(`   Admin Name: ${adminName}`);
  console.log(`   Admin Email: ${adminEmail}`);
  console.log(`   Password: ${'*'.repeat(adminPassword.length)}`);

  const confirm = await question('\nProceed? (yes/no): ');
  if (confirm.toLowerCase() !== 'yes') {
    console.log('Cancelled.');
    rl.close();
    return;
  }

  try {
    console.log('\n🚀 Creating admin account...\n');

    // Step 1: Create Firebase Auth user
    console.log('Step 1: Creating Firebase Auth user...');
    let firebaseUser;
    try {
      firebaseUser = await auth.createUser({
        email: adminEmail.toLowerCase(),
        password: adminPassword,
        emailVerified: true,
        displayName: adminName
      });
      console.log(`   ✅ Created: ${firebaseUser.uid}`);
    } catch (authError) {
      if (authError.code === 'auth/email-already-exists') {
        console.log('   ⚠️  Email exists, fetching existing user...');
        firebaseUser = await auth.getUserByEmail(adminEmail.toLowerCase());
        console.log(`   ✅ Using existing: ${firebaseUser.uid}`);
      } else {
        throw authError;
      }
    }

    // Step 2: Set custom claims
    console.log('Step 2: Setting custom claims (role: admin)...');
    await auth.setCustomUserClaims(firebaseUser.uid, {
      role: 'admin',
      schoolId: selectedSchool.id
    });
    console.log('   ✅ Custom claims set');

    // Step 3: Create/update teacher record in PostgreSQL
    console.log('Step 3: Creating teacher record in PostgreSQL...');
    
    // Check if teacher record already exists
    const { data: existingTeacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('email', adminEmail.toLowerCase())
      .eq('school_id', selectedSchool.id)
      .single();

    if (existingTeacher) {
      // Update existing
      const { error: updateError } = await supabase
        .from('teachers')
        .update({
          firebase_uid: firebaseUser.uid,
          role: 'admin',
          position: 'school_administrator',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTeacher.id);

      if (updateError) throw updateError;
      console.log('   ✅ Updated existing teacher record');
    } else {
      // Create new
      const nameParts = adminName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || adminName;

      const { error: insertError } = await supabase
        .from('teachers')
        .insert({
          school_id: selectedSchool.id,
          firebase_uid: firebaseUser.uid,
          name: adminName,
          first_name: firstName,
          last_name: lastName,
          email: adminEmail.toLowerCase(),
          role: 'admin',
          position: 'school_administrator',
          status: 'active'
        });

      if (insertError) throw insertError;
      console.log('   ✅ Created teacher record');
    }

    // Success!
    console.log('\n' + '='.repeat(60));
    console.log('✅ SCHOOL ADMIN CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📊 Login Details:');
    console.log(`   URL: https://edusync.ph`);
    console.log(`   Tab: Staff`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`\n   School: ${selectedSchool.name}`);
    console.log(`   Firebase UID: ${firebaseUser.uid}`);
    console.log('\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  }

  rl.close();
}

main().catch(console.error);
