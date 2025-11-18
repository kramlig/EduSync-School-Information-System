#!/usr/bin/env node
/**
 * 🌟 COMPREHENSIVE PRODUCTION-LIKE EMULATOR SEED SCRIPT
 * 
 * This script creates a COMPLETE, REALISTIC dataset for the emulator that mirrors
 * what you would see in a real production environment.
 * 
 * WHAT THIS CREATES:
 * ==================
 * 
 * 🏫 MULTI-SCHOOL SETUP (3 schools):
 *    - Default School (legacy compatibility)
 *    - School-001: Sampaguita Elementary School 
 *    - School-002: Mabuhay High School
 * 
 * 👥 USER ACCOUNTS:
 *    - SuperAdmin (access to all schools)
 *    - School Admins (one per school)
 *    - Teachers (10-15 per school)
 *    - Students (50-100 per school)
 *    - Parents (linked to students)
 * 
 * 📚 ACADEMIC DATA (for each school):
 *    - School years (2023-2024, 2024-2025)
 *    - Learning areas (Math, Science, English, Filipino, etc.)
 *    - Core values (Respect, Responsibility, etc.)
 *    - Sections (Kindergarten through Grade 12)
 * 
 * 📊 RICH OPERATIONAL DATA:
 *    - Grades (multiple quarters, all subjects)
 *    - Attendance records (90% present, 5% late, 5% absent)
 *    - Assignments (submitted, graded, pending)
 *    - Lesson plans (completed and upcoming)
 *    - Announcements (school-wide and class-specific)
 *    - Enrollment applications
 * 
 * 💰 FINANCIAL DATA (if enabled):
 *    - Fee structures (tuition, miscellaneous)
 *    - Payment records
 *    - Billing statements
 * 
 * USAGE:
 * ======
 *   node scripts/seed-comprehensive.cjs
 *   
 * This automatically:
 *   1. Detects emulator (port 8086)
 *   2. Clears existing data
 *   3. Seeds all collections
 *   4. Prints login credentials
 *   
 * EXECUTION TIME: ~30-60 seconds
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { LEARNING_AREAS } = require('./learning-areas-production.cjs');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, cur) => {
  const [k, v] = cur.split('=');
  if (k.startsWith('--')) acc[k.substring(2)] = v || true;
  else acc[k] = v || true;
  return acc;
}, {});

const useEmulator = String(args.useEmulator || 'true').toLowerCase() === 'true' || !!process.env.FIRESTORE_EMULATOR_HOST;
const projectId = args.projectId || 'edusync-local';

// Set emulator environment variables
if (useEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9100';
}

console.log('');
console.log('═'.repeat(80));
console.log('🌟 COMPREHENSIVE PRODUCTION-LIKE SEED SCRIPT');
console.log('═'.repeat(80));
console.log(`Project ID: ${projectId}`);
console.log(`Emulator: ${useEmulator ? '✅ YES' : '❌ NO'}`);
console.log(`Firestore: ${process.env.FIRESTORE_EMULATOR_HOST || 'Production'}`);
console.log(`Auth: ${process.env.FIREBASE_AUTH_EMULATOR_HOST || 'Production'}`);
console.log('═'.repeat(80));
console.log('');

// Initialize Firebase
const app = initializeApp({ projectId });
const db = getFirestore(app);
const auth = getAuth(app);

// Helper functions
function randomId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const filipinoFirstNames = ['Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Elena', 'Miguel', 'Sofia', 'Luis', 'Carmen', 'Ricardo', 'Isabel', 'Fernando'];
const filipinoLastNames = ['Santos', 'Reyes', 'Cruz', 'Garcia', 'Mendoza', 'Torres', 'Flores', 'Rivera', 'Castillo', 'Ramos', 'Gonzales', 'Bautista', 'Villanueva', 'Aquino'];

// School configurations
const SCHOOLS = [
  {
    id: 'default',
    code: 'DEFAULT',
    name: 'Default School',
    shortName: 'Default',
    address: '789 Legacy Rd, Makati, Metro Manila',
    principalName: 'Principal Administrator',
    numTeachers: 8,
    numSections: 6,
    numStudentsPerSection: 8
  },
  {
    id: 'school-001',
    code: 'SES-001',
    name: 'Sampaguita Elementary School',
    shortName: 'SES',
    address: '123 Education Ave, Manila, Metro Manila',
    principalName: 'Dr. Antonio Santos',
    numTeachers: 12,
    numSections: 8,
    numStudentsPerSection: 12
  },
  {
    id: 'school-002',
    code: 'MHS-002',
    name: 'Mabuhay High School',
    shortName: 'MHS',
    address: '456 Learning St, Quezon City, Metro Manila',
    principalName: 'Dr. Maria Reyes',
    numTeachers: 10,
    numSections: 6,
    numStudentsPerSection: 15
  }
];

// Learning areas now imported from learning-areas-production.cjs (45 subjects)
// Matches production format with category, trackRequired, department, numeric gradeLevel
// Original LEARNING_AREAS definition removed - see learning-areas-production.cjs
/* REMOVED - Now using production-format learning areas
const LEARNING_AREAS_OLD = [
  // === KINDERGARTEN ===
  { 
    code: 'KINDER', 
    name: 'Kindergarten Curriculum', 
    icon: '🎨',
    gradeLevel: ['Kindergarten']
  },
  
  // === ELEMENTARY (Grades 1-6) ===
  { 
    code: 'MTB-MLE', 
    name: 'Mother Tongue-Based Multilingual Education', 
    icon: '🗣️',
    gradeLevel: ['Grade 1', 'Grade 2', 'Grade 3']
  },
  { 
    code: 'FIL', 
    name: 'Filipino', 
    icon: '🇵🇭',
    gradeLevel: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
  },
  { 
    code: 'ENG', 
    name: 'English', 
    icon: '📖',
    gradeLevel: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
  },
  { 
    code: 'MATH', 
    name: 'Mathematics', 
    icon: '➕',
    gradeLevel: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
  },
  { 
    code: 'SCI', 
    name: 'Science', 
    icon: '�',
    gradeLevel: ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']
  },
  { 
    code: 'AP', 
    name: 'Araling Panlipunan (AP)', 
    icon: '🌏',
    gradeLevel: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']
  },
  { 
    code: 'EPP', 
    name: 'Edukasyong Pantahanan at Pangkabuhayan (EPP)', 
    icon: '🏠',
    gradeLevel: ['Grade 4', 'Grade 5', 'Grade 6']
  },
  { 
    code: 'MAPEH', 
    name: 'Music, Arts, Physical Education, and Health (MAPEH)', 
    icon: '🎵',
    gradeLevel: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
    isComposite: true,
    components: ['Music', 'Arts', 'Physical Education', 'Health']
  },
  { 
    code: 'ESP', 
    name: 'Edukasyon sa Pagpapakatao (EsP)', 
    icon: '❤️',
    gradeLevel: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']
  },
  
  // === JUNIOR HIGH SCHOOL (Grades 7-10) ===
  { 
    code: 'SCI-7', 
    name: 'Science (Grade 7)', 
    icon: '🔬',
    gradeLevel: ['Grade 7']
  },
  { 
    code: 'SCI-8', 
    name: 'Science (Grade 8)', 
    icon: '🔬',
    gradeLevel: ['Grade 8']
  },
  { 
    code: 'SCI-9', 
    name: 'Science (Grade 9)', 
    icon: '🔬',
    gradeLevel: ['Grade 9']
  },
  { 
    code: 'SCI-10', 
    name: 'Science (Grade 10)', 
    icon: '🔬',
    gradeLevel: ['Grade 10']
  },
  { 
    code: 'AP-JHS', 
    name: 'Araling Panlipunan (JHS)', 
    icon: '🌏',
    gradeLevel: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
  },
  { 
    code: 'TLE', 
    name: 'Technology and Livelihood Education (TLE)', 
    icon: '🔧',
    gradeLevel: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
  },
  { 
    code: 'MUSIC-JHS', 
    name: 'Music (JHS)', 
    icon: '🎵',
    gradeLevel: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
  },
  { 
    code: 'ARTS-JHS', 
    name: 'Arts (JHS)', 
    icon: '🎨',
    gradeLevel: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
  },
  { 
    code: 'PE-JHS', 
    name: 'Physical Education (JHS)', 
    icon: '⚽',
    gradeLevel: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
  },
  { 
    code: 'HEALTH-JHS', 
    name: 'Health (JHS)', 
    icon: '🏥',
    gradeLevel: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
  },
  { 
    code: 'ESP-JHS', 
    name: 'Edukasyon sa Pagpapakatao (JHS)', 
    icon: '❤️',
    gradeLevel: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
  },
  
  // === SENIOR HIGH SCHOOL Core (Grades 11-12) ===
  { 
    code: 'ORAL-COMM', 
    name: 'Oral Communication', 
    icon: '🗣️',
    gradeLevel: ['Grade 11']
  },
  { 
    code: 'READING-WRITING', 
    name: 'Reading and Writing', 
    icon: '📝',
    gradeLevel: ['Grade 11']
  },
  { 
    code: 'KOMUNIKASYON', 
    name: 'Komunikasyon at Pananaliksik', 
    icon: '🇵🇭',
    gradeLevel: ['Grade 11']
  },
  { 
    code: 'PAGBASA', 
    name: 'Pagbasa at Pagsusuri', 
    icon: '📖',
    gradeLevel: ['Grade 11']
  },
  { 
    code: 'GEN-MATH', 
    name: 'General Mathematics', 
    icon: '➕',
    gradeLevel: ['Grade 11']
  },
  { 
    code: 'STATISTICS', 
    name: 'Statistics and Probability', 
    icon: '📊',
    gradeLevel: ['Grade 11']
  },
  { 
    code: 'EARTH-SCI', 
    name: 'Earth and Life Science', 
    icon: '�',
    gradeLevel: ['Grade 11']
  },
  { 
    code: 'PHYSICAL-SCI', 
    name: 'Physical Science', 
    icon: '⚛️',
    gradeLevel: ['Grade 11']
  },
  { 
    code: 'PERSONAL-DEV', 
    name: 'Personal Development', 
    icon: '🌟',
    gradeLevel: ['Grade 11']
  },
  { 
    code: 'EARTH-LIFE', 
    name: 'Earth and Life Science', 
    icon: '🌱',
    gradeLevel: ['Grade 11']
  },
  { 
    code: 'PE-SHS', 
    name: 'Physical Education and Health (SHS)', 
    icon: '🏃',
    gradeLevel: ['Grade 11', 'Grade 12']
  },
  
  // === SENIOR HIGH - Applied Subjects ===
  { 
    code: 'EMPOWERMENT-TECH', 
    name: 'Empowerment Technologies', 
    icon: '💻',
    gradeLevel: ['Grade 11']
  },
  { 
    code: 'ENTREPRENEURSHIP', 
    name: 'Entrepreneurship', 
    icon: '💼',
    gradeLevel: ['Grade 12']
  },
  { 
    code: 'INQUIRIES', 
    name: 'Inquiries, Investigations and Immersion', 
    icon: '🔍',
    gradeLevel: ['Grade 12']
  },
  
  // === SENIOR HIGH - Specialized (Common Tracks) ===
  { 
    code: 'PRE-CAL', 
    name: 'Pre-Calculus', 
    icon: '📐',
    gradeLevel: ['Grade 11']
  },
  { 
    code: 'BASIC-CAL', 
    name: 'Basic Calculus', 
    icon: '∫',
    gradeLevel: ['Grade 12']
  },
  { 
    code: 'BIOLOGY', 
    name: 'General Biology', 
    icon: '🧬',
    gradeLevel: ['Grade 11', 'Grade 12']
  },
  { 
    code: 'CHEMISTRY', 
    name: 'General Chemistry', 
    icon: '⚗️',
    gradeLevel: ['Grade 11', 'Grade 12']
  },
  { 
    code: 'PHYSICS', 
    name: 'General Physics', 
    icon: '🔭',
    gradeLevel: ['Grade 11', 'Grade 12']
  },
  { 
    code: 'PHILIPPINE-ARTS', 
    name: 'Contemporary Philippine Arts', 
    icon: '🎭',
    gradeLevel: ['Grade 11']
  },
  { 
    code: 'MEDIA-INFO-LIT', 
    name: 'Media and Information Literacy', 
    icon: '�',
    gradeLevel: ['Grade 11']
  },
  { 
    code: 'UNDERSTANDING-CULTURE', 
    name: 'Understanding Culture, Society and Politics', 
    icon: '🌐',
    gradeLevel: ['Grade 11']
  },
  { 
    code: 'PHILIPPINE-POLITICS', 
    name: 'Philippine Politics and Governance', 
    icon: '🏛️',
    gradeLevel: ['Grade 12']
  },
  { 
    code: 'DISASTER-READINESS', 
    name: 'Disaster Readiness and Risk Reduction', 
    icon: '🚨',
    gradeLevel: ['Grade 11']
  }
]; // OLD ARRAY ENDED - Now using production-format from learning-areas-production.cjs
*/

// Core values
const CORE_VALUES = [
  { 
    code: 'MAKABANSA', 
    name: 'MAKABANSA', 
    icon: '🇵🇭',
    behaviors: [
      'Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen',
      'Demonstrates appropriate behavior in carrying out activities in the school, community, and country'
    ]
  },
  { 
    code: 'MAKADIYOS', 
    name: 'MAKADIYOS', 
    icon: '🙏',
    behaviors: [
      'Expresses one\'s spiritual beliefs while respecting the spiritual beliefs of others',
      'Shows adherence to ethical principles by upholding truth'
    ]
  },
  { 
    code: 'MAKAKALIKASAN', 
    name: 'MAKAKALIKASAN', 
    icon: '🌿',
    behaviors: [
      'Cares for the environment and utilizes resources wisely, judiciously, and economically'
    ]
  },
  { 
    code: 'MAKATAO', 
    name: 'MAKATAO', 
    icon: '❤️',
    behaviors: [
      'Is sensitive to individual, social, and cultural differences',
      'Demonstrates contributions toward solidarity'
    ]
  }
];

// Grade levels
const GRADE_LEVELS = [
  'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
];

// Main seed function
async function seedComprehensive() {
  try {
    // Step 1: Clear existing data
    await clearExistingData();
    
    // Step 2: Create schools
    await createSchools();
    
    // Step 3: Create school years
    const schoolYearId = await createSchoolYears();
    
    // Step 4: Create users and academic structure for each school
    // NOTE: Learning areas and core values are created PER SCHOOL for multi-tenancy
    const allCredentials = [];
    
    for (const school of SCHOOLS) {
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📚 Processing ${school.name} (${school.id})`);
      console.log('─'.repeat(80));
      
      const credentials = await seedSchool(school, schoolYearId);
      allCredentials.push(...credentials);
    }
    
    // Step 5: Create super admin
    const superAdminCreds = await createSuperAdmin();
    allCredentials.push(superAdminCreds);
    
    // Step 7: Print summary
    printSummary(allCredentials);
    
    console.log('\n✅ COMPREHENSIVE SEED COMPLETE!\n');
    
  } catch (error) {
    console.error('\n❌ SEED FAILED:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Clear existing data
async function clearExistingData() {
  console.log('🧹 Clearing existing data...\n');
  
  const collections = [
    'schools', 'teachers', 'students', 'parents', 'sections',
    'learningAreas', 'coreValues', 'schoolYears', 'grades',
    'attendanceRecords', 'assignments', 'lessonPlans', 'announcements',
    'enrollmentApplications', 'feeStructures', 'payments'
  ];
  
  let clearedCount = 0;
  
  for (const collectionName of collections) {
    try {
      const snapshot = await db.collection(collectionName).get();
      if (snapshot.empty) continue;
      
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      
      console.log(`   ✓ Cleared ${snapshot.size} documents from ${collectionName}`);
      clearedCount++;
    } catch (err) {
      // Silent fail - emulator might not be running or collection doesn't exist yet
    }
  }
  
  // Clear Auth users
  try {
    const listUsersResult = await auth.listUsers();
    if (listUsersResult.users.length > 0) {
      for (const user of listUsersResult.users) {
        await auth.deleteUser(user.uid);
      }
      console.log(`   ✓ Cleared ${listUsersResult.users.length} auth users`);
    }
  } catch (err) {
    // Silent fail - auth emulator might not be running
  }
  
  if (clearedCount === 0) {
    console.log('   ℹ️  No existing data to clear (fresh emulator)');
  }
  
  console.log('');
}

// Create schools
async function createSchools() {
  console.log('🏫 Creating schools...\n');
  
  for (const school of SCHOOLS) {
    await db.collection('schools').doc(school.id).set({
      name: school.name,
      code: school.code,
      shortName: school.shortName,
      address: school.address,
      principalName: school.principalName,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      isActive: true
    });
    
    console.log(`   ✓ Created ${school.name}`);
  }
  
  console.log('');
}

// Create school years
async function createSchoolYears() {
  console.log('📅 Creating school years...\n');
  
  const currentYear = await db.collection('schoolYears').add({
    name: '2024-2025',
    startDate: Timestamp.fromDate(new Date('2024-06-01')),
    endDate: Timestamp.fromDate(new Date('2025-03-31')),
    isCurrent: true,
    createdAt: FieldValue.serverTimestamp()
  });
  
  await db.collection('schoolYears').add({
    name: '2023-2024',
    startDate: Timestamp.fromDate(new Date('2023-06-01')),
    endDate: Timestamp.fromDate(new Date('2024-03-31')),
    isCurrent: false,
    createdAt: FieldValue.serverTimestamp()
  });
  
  console.log('   ✓ Created 2024-2025 (current)');
  console.log('   ✓ Created 2023-2024 (past)');
  console.log('');
  
  return currentYear.id;
}

// Create learning areas (per school for multi-tenancy)
async function createLearningAreasForSchool(schoolId) {
  const ids = [];
  for (const area of LEARNING_AREAS) {
    const learningAreaData = {
      schoolId,  // Multi-tenant: each school has its own learning areas
      code: area.code,
      name: area.name,
      icon: area.icon,
      gradeLevel: area.gradeLevel,  // Numeric array: [7, 8, 9, 10]
      category: area.category,  // 'core', 'specialized', 'elective', 'tle'
      department: area.department,  // 'Language', 'STEM', 'Business', etc.
      credits: area.credits,
      isActive: area.isActive,
      order: area.order,
      createdAt: FieldValue.serverTimestamp()
    };
    
    // Add optional fields if they exist
    if (area.trackRequired) {
      learningAreaData.trackRequired = area.trackRequired;  // ['STEM'], ['ABM'], etc.
    }
    if (area.semesterBased) {
      learningAreaData.semesterBased = area.semesterBased;
    }
    if (area.semester) {
      learningAreaData.semester = area.semester;  // 1 or 2
    }
    
    const ref = await db.collection('learningAreas').add(learningAreaData);
    ids.push(ref.id);
  }
  return ids;
}

// Create core values (per school for multi-tenancy)
async function createCoreValuesForSchool(schoolId) {
  const ids = [];
  for (const value of CORE_VALUES) {
    const ref = await db.collection('coreValues').add({
      schoolId,  // Multi-tenant: each school has its own core values
      code: value.code,
      name: value.name,
      icon: value.icon,
      behaviors: value.behaviors,
      isActive: true,
      createdAt: FieldValue.serverTimestamp()
    });
    ids.push(ref.id);
  }
  return ids;
}

// Seed individual school
async function seedSchool(school, schoolYearId) {
  const credentials = [];
  
  // Create school admin
  const adminCreds = await createSchoolAdmin(school);
  credentials.push(adminCreds);
  
  // Create learning areas and core values for THIS SCHOOL (multi-tenancy)
  console.log(`   📚 Creating learning areas...`);
  const learningAreaIds = await createLearningAreasForSchool(school.id);
  console.log(`      ✓ Created ${learningAreaIds.length} learning areas`);
  
  console.log(`   ⭐ Creating core values...`);
  const coreValueIds = await createCoreValuesForSchool(school.id);
  console.log(`      ✓ Created ${coreValueIds.length} core values`);
  
  // Create sections
  const sections = await createSections(school, schoolYearId);
  
  // Create teachers
  const teachers = await createTeachers(school, sections);
  credentials.push(...teachers.map(t => ({
    email: t.email,
    password: 'TestPass123!',
    role: 'Teacher',
    school: school.name
  })));
  
  // Create students and parents
  const students = await createStudents(school, sections);
  const parents = await createParents(school, students);
  credentials.push(...parents.map(p => ({
    email: p.email,
    password: 'TestPass123!',
    role: 'Parent',
    school: school.name,
    children: p.childNames.join(', ')
  })));
  
  // Create rich data
  await createGrades(school, students, learningAreaIds);
  await createCoreValueGrades(school, students, coreValueIds);
  await createAttendance(school, students, sections);
  await createAssignments(school, teachers, sections);
  await createLessonPlans(school, teachers);
  await createAnnouncements(school, teachers, sections);
  
  return credentials;
}

// Create school admin
async function createSchoolAdmin(school) {
  const email = `${school.id}-admin@test.com`;
  const password = 'TestPass123!';
  
  // Try to create in Auth (optional - may fail if auth emulator not ready)
  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${school.name} Admin`
    });
    
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'admin',
      schools: [school.id]
    });
    
    console.log(`   ✓ Created admin in Auth: ${email}`);
  } catch (err) {
    console.log(`   ⚠️  Skipped Auth creation (emulator may not be ready yet)`);
  }
  
  // Always create Firestore document (this is what matters for login)
  const teacherRef = await db.collection('teachers').add({
    schoolId: school.id,
    email,
    firstName: school.shortName,
    lastName: 'Admin',
    name: `${school.shortName} Admin`,  // Added combined name field
    role: 'admin',
    isActive: true,
    createdAt: FieldValue.serverTimestamp()
  });
  
  console.log(`   ✓ Created admin in Firestore: ${email}`);
  
  // Create corresponding users collection entry (required for new login flow)
  try {
    const authUser = await auth.getUserByEmail(email);
    await db.collection('users').doc(authUser.uid).set({
      email,
      role: 'admin',
      schoolId: school.id,
      name: `${school.shortName} Admin`,
      createdAt: FieldValue.serverTimestamp()
    });
    console.log(`   ✓ Created admin in users collection: ${email}`);
  } catch (err) {
    console.log(`   ⚠️  Skipped users collection (Auth user not found)`);
  }
  
  return { email, password, role: 'Admin', school: school.name };
}

// Create sections
async function createSections(school, schoolYearId) {
  console.log(`   📝 Creating ${school.numSections} sections...`);
  
  const sections = [];
  const gradeLevels = GRADE_LEVELS.slice(0, school.numSections);
  
  for (const gradeLevel of gradeLevels) {
    const ref = await db.collection('sections').add({
      schoolId: school.id,
      name: `${gradeLevel} - Section A`,
      gradeLevel,
      schoolYearId,
      capacity: school.numStudentsPerSection,
      isActive: true,
      createdAt: FieldValue.serverTimestamp()
    });
    
    sections.push({ id: ref.id, gradeLevel, name: `${gradeLevel} - Section A` });
  }
  
  console.log(`      ✓ Created ${sections.length} sections`);
  return sections;
}

// Create teachers
async function createTeachers(school, sections) {
  console.log(`   👨‍🏫 Creating ${school.numTeachers} teachers...`);
  
  const teachers = [];
  let authCreated = 0;
  
  for (let i = 0; i < school.numTeachers; i++) {
    const firstName = pick(filipinoFirstNames);
    const lastName = pick(filipinoLastNames);
    const email = `${school.id}-teacher${i + 1}@test.com`;
    const password = 'TestPass123!';
    
    // Create in Auth
    try {
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`
      });
      
      await auth.setCustomUserClaims(userRecord.uid, {
        role: 'teacher',
        schools: [school.id]
      });
      
      // Create users collection entry (required for new login flow)
      await db.collection('users').doc(userRecord.uid).set({
        email,
        role: 'teacher',
        schoolId: school.id,
        name: `${firstName} ${lastName}`,
        createdAt: FieldValue.serverTimestamp()
      });
      
      authCreated++;
    } catch (err) {
      // Silent fail for auth
    }
    
    const ref = await db.collection('teachers').add({
      schoolId: school.id,
      email,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,  // Added combined name field
      assignedSection: i < sections.length ? sections[i].id : null,
      role: 'teacher',
      isActive: true,
      createdAt: FieldValue.serverTimestamp()
    });
    
    teachers.push({ id: ref.id, email, firstName, lastName });
  }
  
  console.log(`      ✓ Created ${teachers.length} teachers in Firestore`);
  console.log(`      ✓ Created ${authCreated} teachers in Auth`);
  return teachers;
}

// Create students (BATCHED for speed)
async function createStudents(school, sections) {
  console.log(`   👦 Creating students...`);
  
  const students = [];
  let totalStudents = 0;
  let authCreated = 0;
  
  const studentsCollection = db.collection('students');
  const password = 'TestPass123!';
  
  let batch = db.batch();
  let batchCount = 0;
  const BATCH_SIZE = 500;
  
  for (const section of sections) {
    for (let i = 0; i < school.numStudentsPerSection; i++) {
      const firstName = pick(filipinoFirstNames);
      const lastName = pick(filipinoLastNames);
      const lrn = `LRN${school.id}${section.gradeLevel.replace(/\s/g, '')}${String(i + 1).padStart(3, '0')}`;
      const email = `${school.id}-student-${lrn}@test.com`;  // Added email for students
      
      const ref = studentsCollection.doc();
      batch.set(ref, {
        schoolId: school.id,
        sectionId: section.id,
        lrn,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,  // Added combined name field
        email,  // Added email field
        gradeLevel: section.gradeLevel,
        isActive: true,
        createdAt: FieldValue.serverTimestamp()
      });
      
      // Only create Auth accounts for first 5 students (demo login accounts)
      if (authCreated < 5) {
        try {
          const userRecord = await auth.createUser({
            email,
            password,
            displayName: `${firstName} ${lastName}`
          });
          
          await auth.setCustomUserClaims(userRecord.uid, {
            role: 'student',
            schools: [school.id]
          });
          
          // Create users collection entry (required for new login flow)
          await db.collection('users').doc(userRecord.uid).set({
            email,
            role: 'student',
            schoolId: school.id,
            name: `${firstName} ${lastName}`,
            createdAt: FieldValue.serverTimestamp()
          });
          
          authCreated++;
        } catch (err) {
          // Silent fail - continue without Auth account
        }
      }
      
      students.push({
        id: ref.id,
        firstName,
        lastName,
        sectionId: section.id,
        gradeLevel: section.gradeLevel
      });
      totalStudents++;
      batchCount++;
      
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }
  }
  
  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
  }
  
  console.log(`      ✓ Created ${totalStudents} students in Firestore (batched)`);
  console.log(`      ✓ Created ${authCreated} demo student login accounts (first 5 students only)`);
  return students;
}

// Create parents (BATCHED for speed)
async function createParents(school, students) {
  console.log(`   👨‍👩‍👧‍👦 Creating parents...`);
  
  const parents = [];
  const createdParentEmails = new Set();
  let authCreated = 0;
  
  const parentsCollection = db.collection('parents');
  let batch = db.batch();
  let batchCount = 0;
  const BATCH_SIZE = 500;
  
  for (let i = 0; i < students.length; i += 2) {
    const student1 = students[i];
    const student2 = students[i + 1];
    
    const email = `${school.id}-parent${Math.floor(i / 2) + 1}@test.com`;
    const password = 'TestPass123!';
    const lastName = student1.lastName;
    const childIds = student2 ? [student1.id, student2.id] : [student1.id];
    const childNames = student2 ? [student1.firstName, student2.firstName] : [student1.firstName];
    
    if (createdParentEmails.has(email)) continue;
    createdParentEmails.add(email);
    
    // Create in Auth
    try {
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: `Parent of ${lastName}`
      });
      
      await auth.setCustomUserClaims(userRecord.uid, {
        role: 'parent',
        schools: [school.id]
      });
      
      // Create users collection entry (required for new login flow)
      await db.collection('users').doc(userRecord.uid).set({
        email,
        role: 'parent',
        schoolId: school.id,
        name: `Parent ${lastName}`,
        createdAt: FieldValue.serverTimestamp()
      });
      
      authCreated++;
    } catch (err) {
      // Silent fail
    }
    
    const ref = parentsCollection.doc();
    batch.set(ref, {
      schoolId: school.id,
      email,
      firstName: 'Parent',
      lastName,
      name: `Parent ${lastName}`,
      studentIds: childIds,  // Changed from childrenIds to studentIds
      isActive: true,
      createdAt: FieldValue.serverTimestamp()
    });
    
    parents.push({ email, childNames });
    batchCount++;
    
    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }
  
  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
  }
  
  console.log(`      ✓ Created ${parents.length} parents in Firestore (batched)`);
  console.log(`      ✓ Created ${authCreated} parents in Auth`);
  return parents;
}

// Create grades (CORRECT FORMAT - matches Grade interface)
async function createGrades(school, students, learningAreaIds) {
  console.log(`   📊 Creating grades...`);
  
  const gradesCollection = db.collection('grades');
  let batch = db.batch();
  let batchCount = 0;
  const BATCH_SIZE = 500;
  
  // Create grades for ALL students (not just first 50) so every section has data
  for (const student of students) {
    // Only first 4 learning areas to keep it reasonable
    for (const learningAreaId of learningAreaIds.slice(0, 4)) {
      // Create ONE grade document per student/subject with q1, q2 properties
      const q1 = 70 + Math.floor(Math.random() * 30);
      const q2 = 70 + Math.floor(Math.random() * 30);
      const finalGrade = Math.round((q1 + q2) / 2);
      
      const ref = gradesCollection.doc();
      batch.set(ref, {
        schoolId: school.id,
        studentId: student.id,
        learningAreaId,
        q1,  // Quarter 1 grade
        q2,  // Quarter 2 grade
        // q3 and q4 are optional (not yet graded)
        finalGrade,
        remarks: finalGrade >= 75 ? 'Passed' : 'Failed'
      });
      
      batchCount++;
      
      // Commit batch when it reaches 500 operations
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }
  }
  
  // Commit remaining batch
  if (batchCount > 0) {
    await batch.commit();
  }
  
  const totalGrades = students.length * Math.min(4, learningAreaIds.length);
  console.log(`      ✓ Created ${totalGrades} grade records for ${students.length} students (batched)`);
}

// Create core value grades
async function createCoreValueGrades(school, students, coreValueIds) {
  console.log(`   ⭐ Creating core value grades...`);
  
  const markings = ['AO', 'SO', 'RO', 'NO'];
  const coreValueGradesCollection = db.collection('coreValueGrades');
  let batch = db.batch();
  let batchCount = 0;
  const BATCH_SIZE = 500;
  
  // Create core value grades for all students
  for (const student of students) {
    // Iterate through core values with their index to get behaviors
    for (let i = 0; i < coreValueIds.length; i++) {
      const coreValueId = coreValueIds[i];
      const coreValueDef = CORE_VALUES[i]; // Get the definition to access behaviors
      
      // Build q1 and q2 grades using actual behavior text as keys
      const q1Behaviors = {};
      const q2Behaviors = {};
      
      coreValueDef.behaviors.forEach(behaviorText => {
        q1Behaviors[behaviorText] = markings[Math.floor(Math.random() * 3)]; // Mostly good grades
        q2Behaviors[behaviorText] = markings[Math.floor(Math.random() * 3)];
      });
      
      const ref = coreValueGradesCollection.doc();
      batch.set(ref, {
        schoolId: school.id,
        studentId: student.id,
        coreValueId,
        q1: q1Behaviors,
        q2: q2Behaviors
        // q3 and q4 are optional (not yet graded)
      });
      
      batchCount++;
      
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }
  }
  
  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
  }
  
  const totalGrades = students.length * coreValueIds.length;
  console.log(`      ✓ Created ${totalGrades} core value grade records for ${students.length} students (batched)`);
}

// Create attendance (PROPER FORMAT - dailyStatus object)
async function createAttendance(school, students, sections) {
  console.log(`   📅 Creating attendance records...`);
  
  const statuses = ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'L', 'A'];
  
  const startDate = new Date('2024-08-01');
  const endDate = new Date('2024-11-10');
  const dates = [];
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      dates.push(new Date(d));
    }
  }
  
  const attendanceCollection = db.collection('attendanceRecords');
  const batch = db.batch();
  
  // Create ONE record per student with dailyStatus object
  for (const student of students.slice(0, 50)) {
    const dailyStatus = {};
    
    // Create 20 days of attendance
    for (const date of dates.slice(0, 20)) {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      dailyStatus[dateStr] = pick(statuses);
    }
    
    const ref = attendanceCollection.doc();
    batch.set(ref, {
      schoolId: school.id,
      studentId: student.id,
      dailyStatus  // Object with date keys and status values
    });
  }
  
  await batch.commit();
  
  console.log(`      ✓ Created attendance records for ${Math.min(50, students.length)} students (batched)`);
}

// Create assignments (BATCHED for speed)
async function createAssignments(school, teachers, sections) {
  console.log(`   📝 Creating assignments...`);
  
  let assignmentCount = 0;
  const titles = ['Math Quiz 1', 'Science Project', 'English Essay', 'History Report', 'Filipino Sanaysay'];
  
  const assignmentsCollection = db.collection('assignments');
  const batch = db.batch();
  
  for (const teacher of teachers.slice(0, 3)) {
    for (const title of titles) {
      const ref = assignmentsCollection.doc();
      batch.set(ref, {
        schoolId: school.id,
        teacherId: teacher.id,
        title,
        description: `Complete the ${title} by the due date`,
        dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        createdAt: FieldValue.serverTimestamp()
      });
      
      assignmentCount++;
    }
  }
  
  await batch.commit();
  console.log(`      ✓ Created ${assignmentCount} assignments (batched)`);
}

// Create lesson plans (BATCHED for speed)
async function createLessonPlans(school, teachers) {
  console.log(`   📖 Creating lesson plans...`);
  
  let planCount = 0;
  const topics = ['Introduction to Algebra', 'Cell Biology', 'Philippine History', 'Grammar Basics', 'Environmental Science'];
  
  const lessonPlansCollection = db.collection('lessonPlans');
  const batch = db.batch();
  
  for (const teacher of teachers.slice(0, 3)) {
    for (const topic of topics) {
      const ref = lessonPlansCollection.doc();
      batch.set(ref, {
        schoolId: school.id,
        teacherId: teacher.id,
        title: topic,
        objectives: [`Understand ${topic}`, `Apply ${topic} concepts`],
        activities: ['Lecture', 'Group work', 'Assessment'],
        createdAt: FieldValue.serverTimestamp()
      });
      
      planCount++;
    }
  }
  
  await batch.commit();
  console.log(`      ✓ Created ${planCount} lesson plans (batched)`);
}

// Create announcements (BATCHED for speed)
async function createAnnouncements(school, teachers, sections) {
  console.log(`   📢 Creating announcements...`);
  
  let announcementCount = 0;
  const announcements = [
    'Parent-Teacher Conference Next Week',
    'School Foundation Day Celebration',
    'Reminder: Submit Requirements',
    'Midterm Exam Schedule',
    'Holiday Break Announcement'
  ];
  
  const announcementsCollection = db.collection('announcements');
  const batch = db.batch();
  
  for (const message of announcements) {
    const ref = announcementsCollection.doc();
    batch.set(ref, {
      schoolId: school.id,
      title: message,
      content: `This is an important announcement about: ${message}`,
      targetAudience: 'all',
      createdAt: FieldValue.serverTimestamp()
    });
    
    announcementCount++;
  }
  
  await batch.commit();
  console.log(`      ✓ Created ${announcementCount} announcements (batched)`);
}

// Create super admin
async function createSuperAdmin() {
  console.log('\n👑 Creating SuperAdmin...\n');
  
  const email = 'superadmin@test.com';
  const password = 'TestPass123!';
  
  // Try to create in Auth (optional)
  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: 'Super Admin'
    });
    
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'superadmin',
      schools: SCHOOLS.map(s => s.id)
    });
    
    // Create users collection entry (required for new login flow)
    await db.collection('users').doc(userRecord.uid).set({
      email,
      role: 'superadmin',
      schoolId: 'default',
      name: 'Super Admin',
      createdAt: FieldValue.serverTimestamp()
    });
    
    console.log(`   ✓ Created ${email} in Auth`);
  } catch (err) {
    console.log('   ⚠️  Skipped Auth creation (emulator may not be ready yet)');
  }
  
  // Create in Firestore
  await db.collection('teachers').add({
    schoolId: 'default',
    email,
    firstName: 'Super',
    lastName: 'Admin',
    name: 'Super Admin',  // Added combined name field
    role: 'superadmin',
    isSuperAdmin: true,  // CRITICAL: Required for SchoolContext to recognize super admin
    schools: SCHOOLS.map(s => s.id),  // Array of all school IDs super admin can access
    isActive: true,
    createdAt: FieldValue.serverTimestamp()
  });
  
  console.log(`   ✓ Created ${email} in Firestore`);
  
  return { email, password, role: 'SuperAdmin', school: 'All Schools' };
}

// Print summary
function printSummary(credentials) {
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('🎉 SEEDING COMPLETE - LOGIN CREDENTIALS');
  console.log('═'.repeat(80));
  console.log('');
  console.log('🌐 Application URL: http://127.0.0.1:5173');
  console.log('🔧 Emulator UI: http://127.0.0.1:4000');
  console.log('');
  console.log('─'.repeat(80));
  console.log('');
  
  // Group by school
  const bySchool = {};
  credentials.forEach(cred => {
    if (!bySchool[cred.school]) bySchool[cred.school] = [];
    bySchool[cred.school].push(cred);
  });
  
  for (const [school, creds] of Object.entries(bySchool)) {
    console.log(`📚 ${school}`);
    console.log('─'.repeat(80));
    
    creds.forEach(cred => {
      console.log(`   ${cred.role.padEnd(12)} | ${cred.email.padEnd(35)} | ${cred.password}`);
      if (cred.children) {
        console.log(`   ${''.padEnd(12)} | Children: ${cred.children}`);
      }
    });
    
    console.log('');
  }
  
  console.log('═'.repeat(80));
  console.log('');
  console.log('💡 TIP: Use Incognito mode or clear browser cache for fresh login!');
  console.log('');
}

// Run the seed
seedComprehensive();
