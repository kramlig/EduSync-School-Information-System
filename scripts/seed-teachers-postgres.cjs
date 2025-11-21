/**
 * Seed Teachers to PostgreSQL (Supabase)
 * Adds 8 teachers to match Firestore emulator seed data
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local.prod') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local.prod');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'present' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedTeachers() {
  console.log('🌱 Seeding teachers to PostgreSQL...\n');

  try {
    // First, check what columns exist in teachers table
    console.log('Checking teachers table schema...');
    const { data: sampleTeacher } = await supabase
      .from('teachers')
      .select('*')
      .limit(1)
      .single();
    
    if (sampleTeacher) {
      console.log('Sample teacher columns:', Object.keys(sampleTeacher));
    }
    
    // Get school_id (default school)
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select('id, name')
      .limit(1)
      .single();

    if (schoolError) {
      console.error('❌ Error fetching school:', schoolError);
      process.exit(1);
    }

    const schoolId = schools.id;
    console.log(`✓ Using school: ${schools.name} (${schoolId})\n`);

    // Teachers data (matching Firestore emulator seed)
    const teachers = [
      { name: 'Ana Bautista', email: 'default-teacher1@test.com', contact_number: '09171234567', role: 'teacher' },
      { name: 'Maria Santos', email: 'default-teacher2@test.com', contact_number: '09171234568', role: 'teacher' },
      { name: 'Juan Dela Cruz', email: 'default-teacher3@test.com', contact_number: '09171234569', role: 'teacher' },
      { name: 'Pedro Garcia', email: 'default-teacher4@test.com', contact_number: '09171234570', role: 'teacher' },
      { name: 'Rosa Martinez', email: 'default-teacher5@test.com', contact_number: '09171234571', role: 'teacher' },
      { name: 'Carlos Lopez', email: 'default-teacher6@test.com', contact_number: '09171234572', role: 'teacher' },
      { name: 'Sofia Reyes', email: 'default-teacher7@test.com', contact_number: '09171234573', role: 'teacher' },
      { name: 'Miguel Torres', email: 'default-teacher8@test.com', contact_number: '09171234574', role: 'teacher' }
    ];

    // Insert teachers one by one (to handle conflicts gracefully)
    let inserted = 0;
    let skipped = 0;

    for (const teacher of teachers) {
      const { data, error } = await supabase
        .from('teachers')
        .insert({
          school_id: schoolId,
          name: teacher.name,
          email: teacher.email,
          contact_number: teacher.contact_number,
          role: teacher.role,
          assignments: [],
          employee_number: teacher.email.split('@')[0].replace('default-teacher', 'T-00'),
          specialization: 'General Education',
          department: 'Academic',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`⊘ Skipped ${teacher.name} (already exists)`);
          skipped++;
        } else {
          console.error(`❌ Error inserting ${teacher.name}:`, error.message);
        }
      } else {
        console.log(`✓ Inserted ${teacher.name}`);
        inserted++;
      }
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`   Inserted: ${inserted}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${teachers.length}`);

  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedTeachers();
