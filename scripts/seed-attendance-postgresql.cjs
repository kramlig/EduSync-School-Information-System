#!/usr/bin/env node
/**
 * Seed Attendance Records in PostgreSQL
 * 
 * Creates realistic attendance records for all students in the system
 * - School year: 2023-2024 (June 2023 - March 2024)
 * - 90-95% attendance rate (realistic)
 * - Random absences and late arrivals
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zjuxulhxxeeupcskkcok.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdXh1bGh4eGVldXBjc2trY29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzExNDAsImV4cCI6MjA3OTAwNzE0MH0.rwRzqcxVIjPZ0-qmOvEzFkpeEoIRfnyYCWVRP9m1hX0';

const supabase = createClient(supabaseUrl, supabaseKey);

// School days per month (June 2023 - March 2024)
const SCHOOL_DAYS = {
  '2023-06': 20,
  '2023-07': 22,
  '2023-08': 23,
  '2023-09': 21,
  '2023-10': 22,
  '2023-11': 21,
  '2023-12': 15, // Shorter due to Christmas break
  '2024-01': 20,
  '2024-02': 21,
  '2024-03': 20
};

// Random attendance status generator (90-95% attendance)
function getRandomStatus() {
  const rand = Math.random();
  if (rand < 0.90) return 'Present';
  if (rand < 0.95) return 'Late';
  if (rand < 0.98) return 'Excused';
  return 'Absent';
}

async function seedAttendance() {
  console.log('🌱 Starting attendance seeding...\n');

  try {
    // 1. Fetch all students
    console.log('📚 Fetching students...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, first_name, last_name, section_id, school_id')
      .is('deleted_at', null);

    if (studentsError) {
      throw new Error(`Failed to fetch students: ${studentsError.message}`);
    }

    console.log(`✅ Found ${students.length} students\n`);

    if (students.length === 0) {
      console.log('⚠️  No students found. Please seed students first.');
      return;
    }

    // Determine the school_id to use
    // Priority: 1. From first student, 2. "default" for emulator
    const schoolId = students[0].school_id || 'default';
    console.log(`📍 Using school_id: ${schoolId}\n`);

    // 2. Clear existing attendance records (optional - comment out to keep existing)
    console.log('🧹 Clearing existing attendance records...');
    const { error: deleteError } = await supabase
      .from('attendance_records')
      .delete()
      .or(`school_id.eq.${schoolId},school_id.eq.default`); // Clear both default and real UUID

    if (deleteError) {
      console.warn('Warning: Could not clear existing records:', deleteError.message);
    } else {
      console.log('✅ Cleared existing attendance records\n');
    }

    // 3. Generate attendance records for each student
    console.log('📝 Generating attendance records...');
    let totalRecords = 0;
    const batchSize = 500; // Insert in batches to avoid timeout
    let batch = [];

    for (const student of students) {
      // Generate attendance for each month
      for (const [monthKey, days] of Object.entries(SCHOOL_DAYS)) {
        const [year, month] = monthKey.split('-');
        
        for (let day = 1; day <= days; day++) {
          const date = `${year}-${month}-${String(day).padStart(2, '0')}`;
          const status = getRandomStatus();

          batch.push({
            school_id: schoolId, // Use the determined schoolId
            student_id: student.id,
            section_id: student.section_id,
            date: date,
            status: status,
            remarks: status === 'Excused' ? 'Medical appointment' : null
          });

          totalRecords++;

          // Insert batch when it reaches batchSize
          if (batch.length >= batchSize) {
            const { error: insertError } = await supabase
              .from('attendance_records')
              .insert(batch);

            if (insertError) {
              console.error(`❌ Error inserting batch: ${insertError.message}`);
            } else {
              console.log(`✅ Inserted ${batch.length} records (Total: ${totalRecords})`);
            }

            batch = []; // Reset batch
          }
        }
      }
    }

    // Insert remaining records
    if (batch.length > 0) {
      const { error: insertError } = await supabase
        .from('attendance_records')
        .insert(batch);

      if (insertError) {
        console.error(`❌ Error inserting final batch: ${insertError.message}`);
      } else {
        console.log(`✅ Inserted ${batch.length} records (Total: ${totalRecords})`);
      }
    }

    console.log(`\n🎉 Successfully seeded ${totalRecords} attendance records for ${students.length} students!`);

    // 4. Verify attendance statistics
    console.log('\n📊 Attendance Statistics:');
    const { data: stats } = await supabase
      .from('attendance_records')
      .select('status');

    if (stats) {
      const statusCounts = stats.reduce((acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
      }, {});

      console.log(`   Present: ${statusCounts.Present || 0}`);
      console.log(`   Late: ${statusCounts.Late || 0}`);
      console.log(`   Absent: ${statusCounts.Absent || 0}`);
      console.log(`   Excused: ${statusCounts.Excused || 0}`);
      console.log(`   Total: ${stats.length}`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Helper function to get default school ID
async function getDefaultSchoolId() {
  const { data: schools } = await supabase
    .from('schools')
    .select('id')
    .limit(1);

  return schools && schools.length > 0 ? schools[0].id : null;
}

// Run the seeding
seedAttendance()
  .then(() => {
    console.log('\n✅ Attendance seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
