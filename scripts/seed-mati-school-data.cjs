/**
 * Seed Students and Teachers for Mati City Division Schools
 * 
 * This script populates all 72 schools in the Division of City of Mati with:
 * - Teachers (5-15 per school depending on size)
 * - Sections (1-6 sections per grade level)
 * - Students (20-40 per section)
 * 
 * Usage:
 *   node scripts/seed-mati-school-data.cjs
 * 
 * Environment Variables:
 *   - VITE_SUPABASE_URL or SUPABASE_URL: Supabase project URL
 *   - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 */

const { createClient } = require('@supabase/supabase-js');

// =====================================================
// CONFIGURATION
// =====================================================

const SCHOOL_YEAR = '2024-2025';
const BATCH_SIZE = 100; // Insert in batches for performance

// Filipino names for realistic data
const FIRST_NAMES_MALE = [
  'Juan', 'Pedro', 'Jose', 'Carlos', 'Miguel', 'Antonio', 'Francisco', 'Manuel',
  'Ricardo', 'Eduardo', 'Roberto', 'Fernando', 'Daniel', 'Rafael', 'Alejandro',
  'Gabriel', 'Luis', 'Marco', 'Paolo', 'Andres', 'Vincent', 'Christian', 'Mark',
  'John', 'Michael', 'James', 'Ryan', 'Kevin', 'Bryan', 'Jayson', 'Renz', 'Kyle'
];

const FIRST_NAMES_FEMALE = [
  'Maria', 'Ana', 'Rosa', 'Carmen', 'Teresa', 'Elena', 'Sofia', 'Isabella',
  'Gabriela', 'Patricia', 'Elizabeth', 'Jennifer', 'Michelle', 'Nicole', 'Angela',
  'Christine', 'Katherine', 'Samantha', 'Victoria', 'Jasmine', 'Alexa', 'Bianca',
  'Camille', 'Diana', 'Faith', 'Grace', 'Hannah', 'Iris', 'Julia', 'Kyla', 'Lea'
];

const LAST_NAMES = [
  'Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia', 'Mendoza', 'Torres', 'Flores',
  'Rivera', 'Gonzales', 'Ramos', 'Diaz', 'Lopez', 'Martinez', 'Rodriguez', 'Hernandez',
  'Aquino', 'Castillo', 'Fernandez', 'Morales', 'Navarro', 'Dela Cruz', 'Dela Rosa',
  'Villanueva', 'Pascual', 'Mercado', 'Salazar', 'Valdez', 'Aguilar', 'Romero',
  'Santiago', 'Domingo', 'Castro', 'Gutierrez', 'Jimenez', 'Perez', 'Padilla', 'Soriano'
];

const MIDDLE_NAMES = [
  'Aguilar', 'Basa', 'Cabrera', 'Delos Santos', 'Espino', 'Francisco', 'Galang',
  'Hernando', 'Ilagan', 'Jacinto', 'Kapunan', 'Lagman', 'Maceda', 'Natividad',
  'Ocampo', 'Pangilinan', 'Quiambao', 'Rosales', 'Salonga', 'Tanedo', 'Ungson'
];

const SECTION_NAMES = [
  'Sampaguita', 'Rosal', 'Gumamela', 'Dahlia', 'Orchid', 'Sunflower',
  'Rose', 'Jasmine', 'Lily', 'Tulip', 'Daisy', 'Carnation',
  'Emerald', 'Ruby', 'Sapphire', 'Diamond', 'Pearl', 'Jade',
  'Einstein', 'Newton', 'Galileo', 'Curie', 'Darwin', 'Pasteur',
  'Rizal', 'Bonifacio', 'Luna', 'Mabini', 'Del Pilar', 'Jacinto'
];

const SPECIALIZATIONS = [
  'English', 'Filipino', 'Mathematics', 'Science', 'Araling Panlipunan',
  'MAPEH', 'TLE', 'Values Education', 'Mother Tongue', 'EPP',
  'General Education', 'Special Education', 'Early Childhood Education'
];

const TEACHER_ROLES = ['teacher', 'admin']; // Valid roles: admin, teacher, student, parent

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateLRN(schoolIdNumber, gradeLevel, index) {
  // LRN format: 12 digits exactly
  // Format: YYYYSSSSNNNN (Year + School ID + Sequence)
  // Use school_id_number directly (6 digits) + sequence (6 digits)
  const schoolPart = schoolIdNumber.toString().padStart(6, '0');
  const sequence = (index + 1).toString().padStart(6, '0');
  return (schoolPart + sequence).substring(0, 12);
}

function generateEmployeeNumber(schoolIndex, teacherIndex) {
  return `EMP-${schoolIndex.toString().padStart(3, '0')}-${teacherIndex.toString().padStart(3, '0')}`;
}

function generateEmail(firstName, lastName, domain) {
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const randomNum = randomInt(1, 999);
  return `${cleanFirst}.${cleanLast}${randomNum}@${domain}`;
}

function generateBirthDate(gradeLevel) {
  // Calculate birth year based on grade level
  const currentYear = 2024;
  const baseAge = gradeLevel + 5; // Grade 1 = ~6 years old
  const birthYear = currentYear - baseAge - randomInt(0, 1);
  const birthMonth = randomInt(1, 12);
  const birthDay = randomInt(1, 28);
  return `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;
}

function generateTeacherBirthDate() {
  const currentYear = 2024;
  const age = randomInt(25, 55);
  const birthYear = currentYear - age;
  const birthMonth = randomInt(1, 12);
  const birthDay = randomInt(1, 28);
  return `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;
}

function isHighSchool(schoolName) {
  return schoolName.toLowerCase().includes('high school') || 
         schoolName.toLowerCase().includes('integrated school') ||
         schoolName.toLowerCase().includes('science high');
}

function getGradeLevels(schoolName) {
  if (isHighSchool(schoolName)) {
    // High schools: Grades 7-12
    if (schoolName.toLowerCase().includes('integrated')) {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // K-12
    }
    return [7, 8, 9, 10, 11, 12];
  }
  // Elementary: Grades 1-6
  return [1, 2, 3, 4, 5, 6];
}

// =====================================================
// MAIN SEEDING FUNCTIONS
// =====================================================

async function seedSchoolData(supabase, school, schoolIndex) {
  console.log(`\n📚 Seeding: ${school.name}`);
  
  const gradeLevels = getGradeLevels(school.name);
  const isHS = isHighSchool(school.name);
  
  // Determine school size
  const teacherCount = isHS ? randomInt(15, 25) : randomInt(8, 15);
  const sectionsPerGrade = isHS ? randomInt(2, 4) : randomInt(1, 3);
  const studentsPerSection = randomInt(25, 40);
  
  // ========================================
  // STEP 1: Create Users for Teachers
  // ========================================
  const teacherUsers = [];
  for (let i = 0; i < teacherCount; i++) {
    const gender = Math.random() > 0.3 ? 'Female' : 'Male'; // 70% female teachers
    const firstName = gender === 'Male' ? randomChoice(FIRST_NAMES_MALE) : randomChoice(FIRST_NAMES_FEMALE);
    const lastName = randomChoice(LAST_NAMES);
    const middleName = randomChoice(MIDDLE_NAMES);
    const role = i === 0 ? 'admin' : 'teacher'; // Only admin and teacher roles
    
    teacherUsers.push({
      school_id: school.id,
      firebase_uid: `mati_teacher_${school.school_id_number}_${i}`,
      email: generateEmail(firstName, lastName, 'deped.gov.ph'),
      name: `${firstName} ${middleName.charAt(0)}. ${lastName}`,
      role: role,
      is_active: true
    });
  }
  
  // Insert users in batch
  const { data: insertedUsers, error: usersError } = await supabase
    .from('users')
    .upsert(teacherUsers, { onConflict: 'firebase_uid', ignoreDuplicates: true })
    .select('id, name, email, role');
  
  if (usersError) {
    console.error(`   ❌ Error creating users:`, usersError.message);
    return { teachers: 0, sections: 0, students: 0 };
  }
  
  console.log(`   ✅ Created ${insertedUsers?.length || 0} teacher users`);
  
  // ========================================
  // STEP 2: Create Teachers
  // ========================================
  const teachers = [];
  for (let i = 0; i < (insertedUsers?.length || 0); i++) {
    const user = insertedUsers[i];
    teachers.push({
      school_id: school.id,
      user_id: user.id,
      name: user.name,
      employee_number: generateEmployeeNumber(schoolIndex, i),
      specialization: randomChoice(SPECIALIZATIONS),
      department: isHS ? (i % 2 === 0 ? 'Junior High School' : 'Senior High School') : 'Elementary'
    });
  }
  
  const { data: insertedTeachers, error: teachersError } = await supabase
    .from('teachers')
    .upsert(teachers, { onConflict: 'school_id,user_id', ignoreDuplicates: true })
    .select('id, name');
  
  if (teachersError) {
    console.error(`   ❌ Error creating teachers:`, teachersError.message);
    return { teachers: 0, sections: 0, students: 0 };
  }
  
  console.log(`   ✅ Created ${insertedTeachers?.length || 0} teachers`);
  
  // ========================================
  // STEP 3: Create Sections
  // ========================================
  const sections = [];
  let sectionNameIndex = 0;
  
  for (const gradeLevel of gradeLevels) {
    const numSections = sectionsPerGrade;
    for (let s = 0; s < numSections; s++) {
      const adviserId = insertedTeachers && insertedTeachers.length > 0 
        ? insertedTeachers[sectionNameIndex % insertedTeachers.length].id 
        : null;
      
      sections.push({
        school_id: school.id,
        name: SECTION_NAMES[sectionNameIndex % SECTION_NAMES.length],
        grade_level: gradeLevel,
        school_year: SCHOOL_YEAR,
        adviser_id: adviserId,
        room_number: `Room ${gradeLevel}${String.fromCharCode(65 + s)}`,
        capacity: 45
      });
      sectionNameIndex++;
    }
  }
  
  const { data: insertedSections, error: sectionsError } = await supabase
    .from('sections')
    .upsert(sections, { onConflict: 'school_id,grade_level,name,school_year', ignoreDuplicates: true })
    .select('id, name, grade_level');
  
  if (sectionsError) {
    console.error(`   ❌ Error creating sections:`, sectionsError.message);
    return { teachers: insertedTeachers?.length || 0, sections: 0, students: 0 };
  }
  
  console.log(`   ✅ Created ${insertedSections?.length || 0} sections`);
  
  // ========================================
  // STEP 4: Create Students
  // ========================================
  const students = [];
  let studentIndex = 0;
  
  for (const section of (insertedSections || [])) {
    const numStudents = studentsPerSection;
    for (let i = 0; i < numStudents; i++) {
      const gender = Math.random() > 0.5 ? 'Male' : 'Female';
      const firstName = gender === 'Male' ? randomChoice(FIRST_NAMES_MALE) : randomChoice(FIRST_NAMES_FEMALE);
      const lastName = randomChoice(LAST_NAMES);
      const middleName = randomChoice(MIDDLE_NAMES);
      
      students.push({
        school_id: school.id,
        lrn: generateLRN(parseInt(school.school_id_number), section.grade_level, studentIndex),
        name: `${lastName}, ${firstName} ${middleName.charAt(0)}.`,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        gender: gender,
        date_of_birth: generateBirthDate(section.grade_level),
        section_id: section.id,
        grade_level: section.grade_level,
        enrollment_status: 'enrolled',
        address: `Brgy. ${randomChoice(['Poblacion', 'Sainz', 'Matiao', 'Dahican', 'Badas', 'Bobon', 'Dawan'])}, Mati City, Davao Oriental`,
        contact_number: `09${randomInt(10, 99)}${randomInt(100, 999)}${randomInt(1000, 9999)}`
      });
      studentIndex++;
    }
  }
  
  // Insert students in batches
  let insertedStudentsCount = 0;
  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const batch = students.slice(i, i + BATCH_SIZE);
    const { data: insertedBatch, error: studentsError } = await supabase
      .from('students')
      .upsert(batch, { onConflict: 'lrn', ignoreDuplicates: true })
      .select('id');
    
    if (studentsError) {
      console.error(`   ❌ Error creating students batch:`, studentsError.message);
    } else {
      insertedStudentsCount += insertedBatch?.length || 0;
    }
  }
  
  console.log(`   ✅ Created ${insertedStudentsCount} students`);
  
  return {
    teachers: insertedTeachers?.length || 0,
    sections: insertedSections?.length || 0,
    students: insertedStudentsCount
  };
}

// =====================================================
// MAIN EXECUTION
// =====================================================

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  🏫 Seeding Mati City Division Schools with Data          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  // Initialize Supabase client
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables!');
    console.log('   Required:');
    console.log('     $env:VITE_SUPABASE_URL="https://your-project.supabase.co"');
    console.log('     $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Get Mati City Division
  console.log('📍 Finding Division of City of Mati...');
  const { data: division, error: divisionError } = await supabase
    .from('divisions')
    .select('id, name')
    .eq('code', 'DIV-MATI-CITY')
    .single();
  
  if (divisionError || !division) {
    console.error('❌ Division of City of Mati not found!');
    console.log('   Please run the Mati division seed first.');
    process.exit(1);
  }
  
  console.log(`✅ Found: ${division.name}`);
  
  // Get all schools in Mati division
  console.log('\n📋 Fetching schools in Mati City division...');
  const { data: schools, error: schoolsError } = await supabase
    .from('schools')
    .select('id, name, school_id_number, district_id')
    .eq('division_id', division.id)
    .is('deleted_at', null)
    .order('name');
  
  if (schoolsError || !schools || schools.length === 0) {
    console.error('❌ No schools found in Mati City division!');
    process.exit(1);
  }
  
  console.log(`✅ Found ${schools.length} schools to seed\n`);
  
  // Track totals
  let totalTeachers = 0;
  let totalSections = 0;
  let totalStudents = 0;
  let successfulSchools = 0;
  
  // Seed each school
  for (let i = 0; i < schools.length; i++) {
    const school = schools[i];
    try {
      const result = await seedSchoolData(supabase, school, i + 1);
      totalTeachers += result.teachers;
      totalSections += result.sections;
      totalStudents += result.students;
      if (result.teachers > 0 || result.sections > 0 || result.students > 0) {
        successfulSchools++;
      }
    } catch (err) {
      console.error(`   ❌ Error seeding ${school.name}:`, err.message);
    }
    
    // Progress indicator
    const progress = Math.round(((i + 1) / schools.length) * 100);
    process.stdout.write(`\r📊 Progress: ${progress}% (${i + 1}/${schools.length} schools)`);
  }
  
  // Summary
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('📊 SEEDING COMPLETE - SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`   🏫 Schools Seeded:  ${successfulSchools}/${schools.length}`);
  console.log(`   👨‍🏫 Teachers Created: ${totalTeachers.toLocaleString()}`);
  console.log(`   📚 Sections Created: ${totalSections.toLocaleString()}`);
  console.log(`   👨‍🎓 Students Created: ${totalStudents.toLocaleString()}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
