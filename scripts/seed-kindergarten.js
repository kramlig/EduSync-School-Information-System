/**
 * Seed Kindergarten Data for SF5-K Testing
 * Creates a Kindergarten section with 15 students and proficiency records
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedKindergartenData() {
  console.log('🌱 Starting Kindergarten data seeding...\n');

  try {
    // Get first school
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select('id, name')
      .limit(1);

    if (schoolError) throw schoolError;
    if (!schools || schools.length === 0) {
      throw new Error('No school found. Please seed school data first.');
    }

    const schoolId = schools[0].id;
    console.log(`✅ Using school: ${schools[0].name}`);
    console.log(`   School ID: ${schoolId}\n`);

    // Check if Kindergarten section already exists
    const { data: existingSections } = await supabase
      .from('sections')
      .select('id, name')
      .eq('school_id', schoolId)
      .eq('grade_level', 0)
      .eq('school_year', '2024-2025');

    let section;
    if (existingSections && existingSections.length > 0) {
      section = existingSections[0];
      console.log(`ℹ️  Found existing Kindergarten section: ${section.name}`);
      console.log(`   Section ID: ${section.id}\n`);
    } else {
      // Create Kindergarten section
      const { data: newSection, error: sectionError } = await supabase
        .from('sections')
        .insert({
          school_id: schoolId,
          name: 'Kinder - Sampaguita',
          grade_level: 0,
          capacity: 25,
          school_year: '2024-2025'
        })
        .select()
        .single();

      if (sectionError) throw sectionError;
      section = newSection;
      console.log(`✅ Created section: ${section.name}`);
      console.log(`   Section ID: ${section.id}\n`);
    }
    // Student names
    const firstNames = ['Sofia', 'Miguel', 'Isabella', 'Gabriel', 'Mia', 'Lucas', 'Emma', 'Noah', 'Olivia', 'Liam', 'Ava', 'Ethan', 'Chloe', 'Mason', 'Zoe'];
    const middleNames = ['Santos', 'Reyes', 'Cruz', 'Garcia', 'Lopez'];
    const lastNames = ['Dela Cruz', 'Rivera', 'Ramos', 'Torres', 'Gonzales', 'Flores', 'Mendoza', 'Castro', 'Aquino', 'Fernandez'];

    const students = [];
    const proficiencyLevels = ['developing', 'emerging', 'advancing'];

    // Create 15 Kindergarten students
    for (let i = 0; i < 15; i++) {
      const lrn = `10${String(i + 1).padStart(10, '0')}`;
      const gender = i % 2 === 0 ? 'Male' : 'Female';
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 5);
      birthDate.setMonth(birthDate.getMonth() - i);

      const student = {
        school_id: schoolId,
        section_id: section.id,
        lrn,
        name: `${firstNames[i]} ${middleNames[i % middleNames.length]} ${lastNames[i % lastNames.length]}`,
        first_name: firstNames[i],
        middle_name: middleNames[i % middleNames.length],
        last_name: lastNames[i % lastNames.length],
        gender,
        date_of_birth: birthDate.toISOString().split('T')[0],
        grade_level: 0,
        enrollment_status: 'enrolled'
      };

      students.push(student);
    }

    // Insert students
    const { data: insertedStudents, error: studentError } = await supabase
      .from('students')
      .insert(students)
      .select('id, first_name, last_name');

    if (studentError) {
      // Check if students already exist
      if (studentError.code === '23505') {
        console.log('ℹ️  Students already exist, fetching existing records...\n');
        const { data: existingStudents } = await supabase
          .from('students')
          .select('id, first_name, last_name')
          .eq('section_id', section.id);
        
        if (!existingStudents || existingStudents.length === 0) {
          throw new Error('No students found in section');
        }
        
        console.log(`✅ Found ${existingStudents.length} existing Kindergarten students\n`);
        
        // Use existing students for promotion records
        const { data: existingRecords } = await supabase
          .from('promotion_records')
          .select('id')
          .eq('section_id', section.id)
          .eq('school_year', '2024-2025');
        
        if (existingRecords && existingRecords.length > 0) {
          console.log(`ℹ️  ${existingRecords.length} SF5-K records already exist`);
          console.log('\n═══════════════════════════════════════════════════');
          console.log('✨ Kindergarten Data Already Seeded!');
          console.log('═══════════════════════════════════════════════════');
          console.log(`📚 Section: ${section.name}`);
          console.log(`👶 Students: ${existingStudents.length} kindergartners`);
          console.log(`📊 Records: ${existingRecords.length} proficiency assessments`);
          console.log(`🔗 Navigate to: /reports/sf5k`);
          console.log('═══════════════════════════════════════════════════\n');
          return;
        }
        
        // Create records for existing students
        const promotionRecords = existingStudents.map((student, index) => ({
          school_id: schoolId,
          student_id: student.id,
          section_id: section.id,
          school_year: '2024-2025',
          grading_period: 'final',
          current_grade_level: 0,
          promotion_status: 'promoted',
          next_grade_level: 1,
          socio_emotional_dev: proficiencyLevels[Math.floor(Math.random() * proficiencyLevels.length)],
          physical_motor_dev: proficiencyLevels[Math.floor(Math.random() * proficiencyLevels.length)],
          cognitive_dev: proficiencyLevels[Math.floor(Math.random() * proficiencyLevels.length)],
          language_literacy_dev: proficiencyLevels[Math.floor(Math.random() * proficiencyLevels.length)]
        }));

        const { data: insertedRecords, error: recordError } = await supabase
          .from('promotion_records')
          .insert(promotionRecords)
          .select('id');

        if (recordError) throw recordError;
        
        console.log(`✅ Created ${insertedRecords.length} SF5-K proficiency records\n`);
        console.log('═══════════════════════════════════════════════════');
        console.log('✨ Kindergarten Data Seeding Completed Successfully!');
        console.log('═══════════════════════════════════════════════════');
        console.log(`📚 Section: ${section.name}`);
        console.log(`👶 Students: ${existingStudents.length} kindergartners`);
        console.log(`📊 Records: ${insertedRecords.length} proficiency assessments`);
        console.log(`🔗 Navigate to: /reports/sf5k`);
        console.log('═══════════════════════════════════════════════════\n');
        return;
      }
      throw studentError;
    }
    console.log(`✅ Created ${insertedStudents.length} Kindergarten students\n`);

    // Create SF5-K proficiency records
    const promotionRecords = insertedStudents.map((student, index) => ({
      school_id: schoolId,
      student_id: student.id,
      section_id: section.id,
      school_year: '2024-2025',
      grading_period: 'final',
      current_grade_level: 0,
      promotion_status: 'promoted',
      next_grade_level: 1,
      // Random proficiency levels for 4 developmental domains
      socio_emotional_dev: proficiencyLevels[Math.floor(Math.random() * proficiencyLevels.length)],
      physical_motor_dev: proficiencyLevels[Math.floor(Math.random() * proficiencyLevels.length)],
      cognitive_dev: proficiencyLevels[Math.floor(Math.random() * proficiencyLevels.length)],
      language_literacy_dev: proficiencyLevels[Math.floor(Math.random() * proficiencyLevels.length)]
    }));

    const { data: insertedRecords, error: recordError } = await supabase
      .from('promotion_records')
      .insert(promotionRecords)
      .select('id');

    if (recordError) throw recordError;
    console.log(`✅ Created ${insertedRecords.length} SF5-K proficiency records\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════');
    console.log('✨ Kindergarten Data Seeding Completed Successfully!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📚 Section: ${section.name}`);
    console.log(`👶 Students: ${insertedStudents.length} kindergartners`);
    console.log(`📊 Records: ${insertedRecords.length} proficiency assessments`);
    console.log(`🔗 Navigate to: /reports/sf5k`);
    console.log('═══════════════════════════════════════════════════\n');

    // Display sample students
    console.log('Sample Students:');
    insertedStudents.slice(0, 5).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.first_name} ${s.last_name}`);
    });

  } catch (error) {
    console.error('\n❌ Error seeding Kindergarten data:');
    console.error(error);
    process.exit(1);
  }
}

seedKindergartenData();
