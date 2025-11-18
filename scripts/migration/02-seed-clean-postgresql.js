/**
 * Seed Clean PostgreSQL Database
 * 
 * This script populates Supabase with clean, properly structured data
 * replacing the buggy Firestore data that had 8 integrity issues.
 * 
 * What it creates:
 * - 1 school (your actual school)
 * - 5 teachers (clean roles, no corruption)
 * - 6 sections (Grade 1-3, 2 sections each)
 * - 9 learning areas (ONE MAPEH with components, not 5 duplicates)
 * - 4 DepEd core values
 * - Ready for student enrollment
 * 
 * Usage:
 *   node scripts/migration/02-seed-clean-postgresql.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

console.log('🚀 Starting PostgreSQL Seeding...\n');
console.log('📍 Supabase URL:', supabaseUrl);
console.log('🗄️  Database: PostgreSQL (not Firestore)\n');

// ==========================================
// SEED DATA DEFINITIONS
// ==========================================

const SCHOOL_DATA = {
  name: 'Dolores Elementary School',
  school_id_number: 'DepEd-123456',
  division: 'Batangas',
  region: 'Region IV-A (CALABARZON)',
  address: 'Dolores, Batangas',
  contact_email: 'dolores.es@deped.gov.ph',
  contact_phone: '+63-123-456-7890',
  principal_name: 'Principal Name',
  current_school_year: '2024-2025',
  settings: {
    features: {
      enrollment: { enabled: true },
      grading: { enabled: true },
      attendance: { enabled: true },
      reports: { enabled: true },
      financial: { enabled: false }
    },
    grading: {
      passingGrade: 75,
      quarters: 4
    }
  }
};

const TEACHERS_DATA = [
  {
    name: 'Ms. Maria Santos',
    employee_number: 'T-001',
    specialization: 'General Education',
    department: 'Elementary',
    email: 'maria.santos@school.edu.ph',
    role: 'teacher'
  },
  {
    name: 'Mr. Juan Dela Cruz',
    employee_number: 'T-002',
    specialization: 'Mathematics',
    department: 'Elementary',
    email: 'juan.delacruz@school.edu.ph',
    role: 'teacher'
  },
  {
    name: 'Ms. Ana Reyes',
    employee_number: 'T-003',
    specialization: 'English',
    department: 'Elementary',
    email: 'ana.reyes@school.edu.ph',
    role: 'teacher'
  },
  {
    name: 'Mr. Pedro Garcia',
    employee_number: 'T-004',
    specialization: 'Science',
    department: 'Elementary',
    email: 'pedro.garcia@school.edu.ph',
    role: 'teacher'
  },
  {
    name: 'Ms. Rosa Martinez',
    employee_number: 'T-005',
    specialization: 'Filipino',
    department: 'Elementary',
    email: 'rosa.martinez@school.edu.ph',
    role: 'teacher'
  }
];

const SECTIONS_DATA = [
  { name: 'St. Peter', grade_level: 1, school_year: '2024-2025', room_number: 'Room 101', capacity: 40 },
  { name: 'St. Paul', grade_level: 1, school_year: '2024-2025', room_number: 'Room 102', capacity: 40 },
  { name: 'St. John', grade_level: 2, school_year: '2024-2025', room_number: 'Room 201', capacity: 40 },
  { name: 'St. Mark', grade_level: 2, school_year: '2024-2025', room_number: 'Room 202', capacity: 40 },
  { name: 'St. Luke', grade_level: 3, school_year: '2024-2025', room_number: 'Room 301', capacity: 40 },
  { name: 'St. Matthew', grade_level: 3, school_year: '2024-2025', room_number: 'Room 302', capacity: 40 }
];

// DepEd Standard Learning Areas (NO DUPLICATES!)
const LEARNING_AREAS_DATA = [
  {
    code: 'MTB',
    name: 'Mother Tongue',
    description: 'Mother Tongue-Based Multilingual Education',
    grade_levels: [1, 2, 3],
    is_composite: false,
    display_order: 1
  },
  {
    code: 'FIL',
    name: 'Filipino',
    description: 'Wika at Pagbasa',
    grade_levels: [1, 2, 3, 4, 5, 6],
    is_composite: false,
    display_order: 2
  },
  {
    code: 'ENG',
    name: 'English',
    description: 'Language and Reading',
    grade_levels: [1, 2, 3, 4, 5, 6],
    is_composite: false,
    display_order: 3
  },
  {
    code: 'MATH',
    name: 'Mathematics',
    description: 'Numbers, Patterns, Geometry',
    grade_levels: [1, 2, 3, 4, 5, 6],
    is_composite: false,
    display_order: 4
  },
  {
    code: 'SCI',
    name: 'Science',
    description: 'Araling Panlipunan at Science',
    grade_levels: [3, 4, 5, 6],
    is_composite: false,
    display_order: 5
  },
  {
    code: 'AP',
    name: 'Araling Panlipunan',
    description: 'Social Studies / Heograpiya, Kasaysayan, Sibika',
    grade_levels: [1, 2, 3, 4, 5, 6],
    is_composite: false,
    display_order: 6
  },
  {
    code: 'EPP',
    name: 'Edukasyon sa Pagpapakatao (EPP/TLE)',
    description: 'Values Education and Livelihood',
    grade_levels: [4, 5, 6],
    is_composite: false,
    display_order: 7
  },
  {
    code: 'MAPEH',
    name: 'MAPEH',
    description: 'Music, Arts, Physical Education, Health',
    grade_levels: [1, 2, 3, 4, 5, 6],
    is_composite: true,
    components: ['Music', 'Arts', 'Physical Education', 'Health'],
    display_order: 8
  },
  {
    code: 'EDUK_PAGPAPAKATAO',
    name: 'Edukasyon sa Pagpapakatao',
    description: 'Values Education',
    grade_levels: [1, 2, 3],
    is_composite: false,
    display_order: 9
  }
];

// DepEd Core Values
const CORE_VALUES_DATA = [
  {
    code: 'MAKA_DIYOS',
    name: 'Maka-Diyos',
    description: 'Demonstrates spirituality and faith',
    display_order: 1
  },
  {
    code: 'MAKATAO',
    name: 'Makatao',
    description: 'Demonstrates care and respect for others',
    display_order: 2
  },
  {
    code: 'MAKAKALIKASAN',
    name: 'Makakalikasan',
    description: 'Demonstrates care for the environment',
    display_order: 3
  },
  {
    code: 'MAKABANSA',
    name: 'Makabansa',
    description: 'Demonstrates love of country',
    display_order: 4
  }
];

// ==========================================
// SEEDING FUNCTIONS
// ==========================================

async function seedSchool() {
  console.log('📚 Seeding School...');
  
  const { data, error } = await supabase
    .from('schools')
    .insert([SCHOOL_DATA])
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error seeding school:', error);
    console.error('Details:', JSON.stringify(error, null, 2));
    throw error;
  }
  
  console.log('✅ School created:', data.name);
  console.log('   ID:', data.id);
  console.log('   School Year:', data.current_school_year);
  return data;
}

async function seedTeachers(schoolId) {
  console.log('\n👨‍🏫 Seeding Teachers...');
  
  // First, create user accounts for teachers
  const userPromises = TEACHERS_DATA.map(async (teacher) => {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        school_id: schoolId,
        firebase_uid: `teacher_${teacher.employee_number}`, // Temporary until Firebase Auth setup
        email: teacher.email,
        role: 'teacher',
        name: teacher.name,
        is_active: true
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  });
  
  const users = await Promise.all(userPromises);
  console.log(`✅ Created ${users.length} teacher user accounts`);
  
  // Then create teacher profiles
  const teacherPromises = TEACHERS_DATA.map(async (teacher, index) => {
    const { data, error } = await supabase
      .from('teachers')
      .insert([{
        school_id: schoolId,
        user_id: users[index].id,
        name: teacher.name,
        employee_number: teacher.employee_number,
        specialization: teacher.specialization,
        department: teacher.department
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  });
  
  const teachers = await Promise.all(teacherPromises);
  console.log(`✅ Created ${teachers.length} teacher profiles`);
  teachers.forEach(t => console.log(`   - ${t.name} (${t.employee_number})`));
  
  return teachers;
}

async function seedSections(schoolId, teachers) {
  console.log('\n🏫 Seeding Sections...');
  
  const sectionPromises = SECTIONS_DATA.map(async (section, index) => {
    const { data, error } = await supabase
      .from('sections')
      .insert([{
        school_id: schoolId,
        name: section.name,
        grade_level: section.grade_level,
        school_year: section.school_year,
        adviser_id: teachers[index % teachers.length].id, // Rotate teachers as advisers
        room_number: section.room_number,
        capacity: section.capacity
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  });
  
  const sections = await Promise.all(sectionPromises);
  console.log(`✅ Created ${sections.length} sections`);
  sections.forEach(s => console.log(`   - Grade ${s.grade_level} - ${s.name} (${s.room_number})`));
  
  return sections;
}

async function seedLearningAreas(schoolId) {
  console.log('\n📖 Seeding Learning Areas...');
  
  const learningAreaPromises = LEARNING_AREAS_DATA.map(async (la) => {
    const { data, error } = await supabase
      .from('learning_areas')
      .insert([{
        school_id: schoolId,
        code: la.code,
        name: la.name,
        description: la.description,
        grade_levels: la.grade_levels,
        is_composite: la.is_composite,
        components: la.components || null,
        display_order: la.display_order,
        is_active: true
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  });
  
  const learningAreas = await Promise.all(learningAreaPromises);
  console.log(`✅ Created ${learningAreas.length} learning areas (NO DUPLICATES!)`);
  learningAreas.forEach(la => {
    const composite = la.is_composite ? ' [COMPOSITE]' : '';
    console.log(`   ${la.display_order}. ${la.name} (${la.code})${composite}`);
  });
  
  return learningAreas;
}

async function seedCoreValues(schoolId) {
  console.log('\n⭐ Seeding DepEd Core Values...');
  
  const coreValuePromises = CORE_VALUES_DATA.map(async (cv) => {
    const { data, error } = await supabase
      .from('core_values')
      .insert([{
        school_id: schoolId,
        code: cv.code,
        name: cv.name,
        description: cv.description,
        display_order: cv.display_order
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  });
  
  const coreValues = await Promise.all(coreValuePromises);
  console.log(`✅ Created ${coreValues.length} core values`);
  coreValues.forEach(cv => console.log(`   ${cv.display_order}. ${cv.name}`));
  
  return coreValues;
}

// ==========================================
// MAIN EXECUTION
// ==========================================

async function main() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🌱 FRESH START: Seeding Clean PostgreSQL Database');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('This will create:');
    console.log('  ✓ 1 school (Dolores Elementary School)');
    console.log('  ✓ 5 teachers (clean roles, no Firestore bugs)');
    console.log('  ✓ 6 sections (Grade 1-3)');
    console.log('  ✓ 9 learning areas (ONE MAPEH, not 5!)');
    console.log('  ✓ 4 DepEd core values');
    console.log('  ✓ Ready for student enrollment\n');
    console.log('───────────────────────────────────────────────────────\n');
    
    // Seed in order (respecting foreign key dependencies)
    const school = await seedSchool();
    const teachers = await seedTeachers(school.id);
    const sections = await seedSections(school.id, teachers);
    const learningAreas = await seedLearningAreas(school.id);
    const coreValues = await seedCoreValues(school.id);
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ SEEDING COMPLETE!');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('📊 Summary:');
    console.log(`   Schools: 1`);
    console.log(`   Teachers: ${teachers.length}`);
    console.log(`   Sections: ${sections.length}`);
    console.log(`   Learning Areas: ${learningAreas.length} (including 1 MAPEH composite)`);
    console.log(`   Core Values: ${coreValues.length}`);
    console.log(`   Students: 0 (ready for enrollment)\n`);
    
    console.log('🎯 Next Steps:');
    console.log('   1. Verify data in Supabase dashboard');
    console.log('   2. Start migrating React code to use Supabase');
    console.log('   3. Test enrollment with sample students');
    console.log('   4. Begin grade entry testing\n');
    
    console.log('🔗 Supabase Dashboard:');
    console.log(`   ${supabaseUrl.replace('/rest/v1', '')}\n`);
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
