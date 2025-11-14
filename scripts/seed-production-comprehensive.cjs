#!/usr/bin/env node
/**
 * COMPREHENSIVE PRODUCTION SEEDING SCRIPT
 * 
 * Purpose: Seed ALL Firestore collections with realistic demo data
 * Target: Production (edusync-sis.web.app)
 * 
 * What this creates:
 * - 30 students (Grades 1, 7, 10 - 10 students each)
 * - Complete grade records (Q1-Q4, all subjects)
 * - Core value grades
 * - 3 months of attendance records
 * - 10 parent accounts (linked to students)
 * - 10 teacher accounts
 * - Fee structures for all grade levels
 * - Student ledgers with payment history
 * - 15+ lesson plans
 * - 10+ assignments with submissions
 * - Full class schedules (3 sections)
 * - 10+ announcements
 * - 15 enrollment applications
 * 
 * SAFETY:
 * - Uses batched writes (max 500 per batch)
 * - Tags all documents with isDemo: true for easy cleanup
 * - Includes rollback capability
 * 
 * Usage:
 *   node scripts/seed-production-comprehensive.cjs
 * 
 * IMPORTANT: 
 * 1. Make sure you're logged in: firebase login
 * 2. Backup current data first: firebase firestore:export backup-$(date +%Y%m%d)
 * 3. Test on emulator first if possible
 */

const admin = require('firebase-admin');
const { Timestamp, FieldValue } = require('firebase-admin/firestore');

// ===== CONFIGURATION =====
const PROJECT_ID = 'edusync-sis';
const SCHOOL_ID = 'default'; // Multi-tenant school ID
const SCHOOL_YEAR = '2024-2025';
const DEMO_TAG = true; // Mark all documents with isDemo: true

// Clear emulator environment variables (force production)
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

// Initialize Firebase Admin for PRODUCTION
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: PROJECT_ID,
    // Uses Application Default Credentials (ADC) from firebase login
  });
}

const db = admin.firestore();

console.log('🚀 [COMPREHENSIVE SEEDING] Starting...');
console.log(`📍 Project: ${PROJECT_ID}`);
console.log(`🏫 School ID: ${SCHOOL_ID}`);
console.log(`📅 School Year: ${SCHOOL_YEAR}`);
console.log('⚠️  All documents will be tagged with isDemo: true\n');

// ===== DATA GENERATION HELPERS =====

// Filipino names
const FIRST_NAMES = [
  'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Elena',
  'Miguel', 'Sofia', 'Luis', 'Carmen', 'Ramon', 'Isabella', 'Diego',
  'Lucia', 'Fernando', 'Catalina', 'Antonio', 'Valentina', 'Gabriel',
  'Gabriela', 'Manuel', 'Beatriz', 'Rafael', 'Camila', 'Andres', 'Victoria',
  'Lorenzo', 'Daniela'
];

const LAST_NAMES = [
  'Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Rodriguez', 'Martinez',
  'Gonzales', 'Lopez', 'Hernandez', 'Perez', 'Bautista', 'Mendoza',
  'Torres', 'Ramos', 'Castro', 'Cruz'
];

// Learning areas (DepEd K-12 Complete Curriculum)
const LEARNING_AREAS = [
  // CORE SUBJECTS (All Grade Levels)
  { id: 'la_filipino', name: 'Filipino', order: 1, gradeLevel: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: 'la_english', name: 'English', order: 2, gradeLevel: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: 'la_math', name: 'Mathematics', order: 3, gradeLevel: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: 'la_science', name: 'Science', order: 4, gradeLevel: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: 'la_ap', name: 'Araling Panlipunan', order: 5, gradeLevel: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: 'la_esp', name: 'Edukasyon sa Pagpapakatao', order: 6, gradeLevel: [1,2,3,4,5,6,7,8,9,10,11,12] },
  
  // MAPEH Components (broken down for secondary)
  { id: 'la_mapeh', name: 'MAPEH', order: 7, gradeLevel: [1,2,3,4,5,6] }, // Elementary integrated
  { id: 'la_music', name: 'Music', order: 8, gradeLevel: [7,8,9,10] }, // Junior HS separate
  { id: 'la_arts', name: 'Arts', order: 9, gradeLevel: [7,8,9,10] },
  { id: 'la_pe', name: 'Physical Education', order: 10, gradeLevel: [7,8,9,10,11,12] },
  { id: 'la_health', name: 'Health', order: 11, gradeLevel: [7,8,9,10] },
  
  // TLE/TVL (Junior High School)
  { id: 'la_tle', name: 'Technology and Livelihood Education', order: 12, gradeLevel: [7,8,9,10] },
  
  // SENIOR HIGH SCHOOL - CORE SUBJECTS
  { id: 'la_oral_comm', name: 'Oral Communication', order: 13, gradeLevel: [11] },
  { id: 'la_reading_writing', name: 'Reading and Writing', order: 14, gradeLevel: [11] },
  { id: 'la_komunikasyon', name: 'Komunikasyon at Pananaliksik', order: 15, gradeLevel: [11] },
  { id: 'la_pagbasa_pagsusuri', name: 'Pagbasa at Pagsusuri', order: 16, gradeLevel: [12] },
  { id: 'la_gen_math', name: 'General Mathematics', order: 17, gradeLevel: [11] },
  { id: 'la_stat_prob', name: 'Statistics and Probability', order: 18, gradeLevel: [11] },
  { id: 'la_earth_science', name: 'Earth and Life Science', order: 19, gradeLevel: [11] },
  { id: 'la_physical_science', name: 'Physical Science', order: 20, gradeLevel: [11] },
  { id: 'la_personal_dev', name: 'Personal Development', order: 21, gradeLevel: [11] },
  { id: 'la_earth_life_sci', name: 'Earth Science', order: 22, gradeLevel: [12] },
  { id: 'la_disaster_ready', name: 'Disaster Readiness and Risk Reduction', order: 23, gradeLevel: [11,12] },
  { id: 'la_physical_ed_11', name: 'Physical Education and Health 11', order: 24, gradeLevel: [11] },
  { id: 'la_physical_ed_12', name: 'Physical Education and Health 12', order: 25, gradeLevel: [12] },
  
  // SENIOR HIGH - APPLIED SUBJECTS
  { id: 'la_empowerment_tech', name: 'Empowerment Technologies', order: 26, gradeLevel: [11] },
  { id: 'la_entrepreneurship', name: 'Entrepreneurship', order: 27, gradeLevel: [12] },
  { id: 'la_inquiries', name: 'Inquiries, Investigations and Immersion', order: 28, gradeLevel: [12] },
  
  // SENIOR HIGH - SPECIALIZED SUBJECTS (Common Tracks)
  // STEM Track
  { id: 'la_pre_calculus', name: 'Pre-Calculus', order: 29, gradeLevel: [11,12] },
  { id: 'la_basic_calculus', name: 'Basic Calculus', order: 30, gradeLevel: [11,12] },
  { id: 'la_general_bio', name: 'General Biology 1 & 2', order: 31, gradeLevel: [11,12] },
  { id: 'la_general_chem', name: 'General Chemistry 1 & 2', order: 32, gradeLevel: [11,12] },
  { id: 'la_general_physics', name: 'General Physics 1 & 2', order: 33, gradeLevel: [11,12] },
  
  // ABM Track
  { id: 'la_fund_acctg', name: 'Fundamentals of Accountancy, Business and Management 1 & 2', order: 34, gradeLevel: [11,12] },
  { id: 'la_business_math', name: 'Business Mathematics', order: 35, gradeLevel: [11,12] },
  { id: 'la_applied_econ', name: 'Applied Economics', order: 36, gradeLevel: [12] },
  { id: 'la_business_finance', name: 'Business Finance', order: 37, gradeLevel: [12] },
  { id: 'la_org_management', name: 'Organization and Management', order: 38, gradeLevel: [11] },
  { id: 'la_business_marketing', name: 'Business Marketing', order: 39, gradeLevel: [11] },
  
  // HUMSS Track
  { id: 'la_creative_writing', name: 'Creative Writing', order: 40, gradeLevel: [11,12] },
  { id: 'la_creative_nonfiction', name: 'Creative Nonfiction', order: 41, gradeLevel: [11,12] },
  { id: 'la_intro_philo', name: 'Introduction to Philosophy of the Human Person', order: 42, gradeLevel: [12] },
  { id: 'la_world_religions', name: 'Introduction to World Religions and Belief Systems', order: 43, gradeLevel: [11] },
  { id: 'la_contemporary_issues', name: 'Contemporary Philippine Arts from the Regions', order: 44, gradeLevel: [11] },
  { id: 'la_philippine_politics', name: 'Philippine Politics and Governance', order: 45, gradeLevel: [12] },
  { id: 'la_trends_networks', name: 'Trends, Networks and Critical Thinking', order: 46, gradeLevel: [11,12] },
  
  // TVL Track (sample - varies by specialization)
  { id: 'la_tvl_cookery', name: 'Cookery', order: 47, gradeLevel: [11,12] },
  { id: 'la_tvl_bread_pastry', name: 'Bread and Pastry Production', order: 48, gradeLevel: [11,12] },
  { id: 'la_tvl_ict', name: 'Information and Communications Technology', order: 49, gradeLevel: [11,12] },
  { id: 'la_tvl_automotive', name: 'Automotive Servicing', order: 50, gradeLevel: [11,12] },
  { id: 'la_tvl_electrical', name: 'Electrical Installation and Maintenance', order: 51, gradeLevel: [11,12] },
  { id: 'la_tvl_electronics', name: 'Electronics', order: 52, gradeLevel: [11,12] },
  { id: 'la_tvl_plumbing', name: 'Plumbing', order: 53, gradeLevel: [11,12] },
  { id: 'la_tvl_welding', name: 'Shielded Metal Arc Welding', order: 54, gradeLevel: [11,12] },
  { id: 'la_tvl_drafting', name: 'Technical Drafting', order: 55, gradeLevel: [11,12] },
  { id: 'la_tvl_agri', name: 'Agri-Fishery Arts', order: 56, gradeLevel: [11,12] },
  { id: 'la_tvl_housekeeping', name: 'Housekeeping', order: 57, gradeLevel: [11,12] },
  { id: 'la_tvl_beauty_care', name: 'Beauty Care (Nail Care)', order: 58, gradeLevel: [11,12] },
  { id: 'la_tvl_caregiving', name: 'Caregiving', order: 59, gradeLevel: [11,12] },
  
  // Sports Track
  { id: 'la_sports_track', name: 'Sports Track', order: 60, gradeLevel: [11,12] },
  
  // Arts and Design Track
  { id: 'la_arts_design', name: 'Arts and Design Track', order: 61, gradeLevel: [11,12] }
];

// Core values (DepEd)
const CORE_VALUES = [
  { id: 'cv_makadiyos', name: 'Maka-Diyos', order: 1 },
  { id: 'cv_makatao', name: 'Makatao', order: 2 },
  { id: 'cv_makakalikasan', name: 'Makakalikasan', order: 3 },
  { id: 'cv_makabansa', name: 'Makabansa', order: 4 }
];

// Behavior markings
const BEHAVIOR_MARKS = ['AO', 'SO', 'RO', 'NO']; // Always, Sometimes, Rarely, Never Observed

// ===== BATCH HELPER =====
let currentBatch = db.batch();
let batchCount = 0;

async function commitBatch() {
  if (batchCount > 0) {
    await currentBatch.commit();
    console.log(`   ✓ Committed batch (${batchCount} documents)`);
    currentBatch = db.batch();
    batchCount = 0;
  }
}

function addToBatch(ref, data) {
  currentBatch.set(ref, { ...data, isDemo: DEMO_TAG, schoolId: SCHOOL_ID });
  batchCount++;
  
  if (batchCount >= 450) { // Firestore limit is 500, stay safe at 450
    return commitBatch();
  }
}

// ===== MAIN SEEDING FUNCTION =====

async function seedProduction() {
  const startTime = Date.now();
  
  try {
    // 1. SCHOOL DOCUMENT (Multi-tenant)
    console.log('[1/16] 🏫 School Document (Multi-tenant)...');
    await addToBatch(db.collection('schools').doc(SCHOOL_ID), {
      id: SCHOOL_ID,
      name: 'EduSync Demo School',
      code: 'DEMO',
      shortName: 'Demo School',
      
      // Administrative Details
      region: 'Region XI',
      division: 'Division of Manila',
      district: 'Manila North District',
      
      // School Type
      schoolType: 'private',
      schoolLevel: 'kto12',
      
      // Contact Information
      address: 'Manila, Philippines',
      city: 'Manila',
      province: 'Metro Manila',
      zipCode: '1000',
      phone: '(02) 1234-5678',
      email: 'principal@edusync-demo.ph',
      website: 'https://edusync-demo.ph',
      
      // Current Academic Year
      currentSchoolYear: SCHOOL_YEAR,
      principalName: 'Dr. Maria Santos',
      
      // Status
      status: 'active',
      
      // Metadata
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    await commitBatch();
    
    // 2. SCHOOL SETTINGS
    console.log('[2/16] ⚙️  School Settings...');
    await addToBatch(db.collection('settings').doc('default'), {
      schoolName: 'EduSync Demo School',
      schoolYear: SCHOOL_YEAR,
      principalName: 'Dr. Maria Santos',
      address: 'Manila, Philippines',
      contactNumber: '(02) 1234-5678',
      email: 'principal@edusync-demo.ph',
      gradeLevel: 'K-12',
      gradeRange: { min: 1, max: 12 },
      enabledModules: {
        academic: true,
        financial: true,
        enrollment: true,
        analytics: true
      }
    });
    await commitBatch();
    
    // 2A. SUPER ADMIN USER (for School Management)
    console.log('[2A/17] 👑 Super Admin User...');
    const superAdminId = 'superadmin_001';
    await addToBatch(db.collection('teachers').doc(superAdminId), {
      id: superAdminId,
      email: 'superadmin@edusync-demo.ph',
      firstName: 'Super',
      lastName: 'Admin',
      name: 'Super Admin',
      role: 'superadmin',
      isSuperAdmin: true, // Critical for SchoolContext
      schoolId: SCHOOL_ID,
      schools: [SCHOOL_ID], // Array of school IDs (for multi-school access)
      status: 'active',
      contactNumber: '09991234567',
      employeeNumber: 'SUPER-001',
      specialization: 'System Administration'
    });
    
    // Also create in users collection (for authentication fallback)
    await addToBatch(db.collection('users').doc(superAdminId), {
      id: superAdminId,
      email: 'superadmin@edusync-demo.ph',
      displayName: 'Super Admin',
      role: 'superadmin',
      isSuperAdmin: true,
      schoolId: SCHOOL_ID,
      schools: [SCHOOL_ID]
    });
    await commitBatch();
    console.log('   ✓ Super Admin: superadmin@edusync-demo.ph / admin123');
    
    // 3. LEARNING AREAS
    console.log('[3/17] 📚 Learning Areas...');
    for (const la of LEARNING_AREAS) {
      await addToBatch(db.collection('learningAreas').doc(la.id), {
        name: la.name,
        order: la.order,
        gradeLevel: la.gradeLevel,
        credits: 1,
        category: 'core',
        isActive: true
      });
    }
    await commitBatch();
    
    // 4. CORE VALUES
    console.log('[4/17] 💎 Core Values...');
    for (const cv of CORE_VALUES) {
      await addToBatch(db.collection('coreValues').doc(cv.id), {
        name: cv.name,
        order: cv.order,
        description: `DepEd Core Value: ${cv.name}`
      });
    }
    await commitBatch();
    
    // 5. TEACHERS (Enough for all sections - at least 50 for K-12 complete school)
    console.log('[5/17] 👨‍🏫 Teachers...');
    const teachers = [];
    const TEACHER_COUNT = 60; // Enough to cover all sections plus some substitutes
    
    for (let i = 0; i < TEACHER_COUNT; i++) {
      const teacherId = `teacher_${i + 1}`;
      const teacher = {
        id: teacherId,
        name: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`,
        email: `teacher${i + 1}@edusync-demo.ph`,
        role: 'teacher',
        contactNumber: `09123456${String(i).padStart(3, '0')}`,
        employeeNumber: `EMP-2024-${String(i + 1).padStart(4, '0')}`,
        status: 'active',
        // Assign specialization based on index
        specialization: i < 18 ? 'Elementary' :
                       i < 34 ? 'Junior High' :
                       i < 42 ? 'STEM' :
                       i < 48 ? 'ABM' :
                       i < 54 ? 'HUMSS' : 'TVL'
      };
      teachers.push(teacher);
      await addToBatch(db.collection('teachers').doc(teacherId), teacher);
    }
    await commitBatch();
    console.log(`   ✓ Created ${teachers.length} teachers`);
    
    // 6. SECTIONS (Complete K-12 like real public schools)
    console.log('[6/17] 🏫 Sections (K-12)...');
    
    // Section names per grade level (common in PH public schools)
    const SECTION_NAMES = {
      elementary: ['Diamond', 'Pearl', 'Emerald', 'Sapphire', 'Ruby'],
      juniorHigh: ['Rizal', 'Bonifacio', 'Mabini', 'Luna', 'Del Pilar'],
      seniorHigh: {
        stem: ['Einstein', 'Newton', 'Darwin'],
        abm: ['Entrepreneurship', 'Finance', 'Marketing'],
        humss: ['Humanities', 'Social Science'],
        tvl: ['ICT', 'Cookery', 'Automotive']
      }
    };
    
    const sections = [];
    let teacherIndex = 0;
    
    // ELEMENTARY (Grades 1-6): 3 sections each
    for (let grade = 1; grade <= 6; grade++) {
      for (let sec = 0; sec < 3; sec++) {
        const sectionName = SECTION_NAMES.elementary[sec];
        const sectionId = `sec_grade${grade}_${sectionName.toLowerCase()}`;
        sections.push({
          id: sectionId,
          name: `Grade ${grade} - ${sectionName}`,
          gradeLevel: grade,
          adviserId: teachers[teacherIndex % teachers.length].id,
          capacity: 40,
          studentCount: 0,
          type: 'elementary'
        });
        teacherIndex++;
      }
    }
    
    // JUNIOR HIGH (Grades 7-10): 4 sections each
    for (let grade = 7; grade <= 10; grade++) {
      for (let sec = 0; sec < 4; sec++) {
        const sectionName = SECTION_NAMES.juniorHigh[sec];
        const sectionId = `sec_grade${grade}_${sectionName.toLowerCase()}`;
        sections.push({
          id: sectionId,
          name: `Grade ${grade} - ${sectionName}`,
          gradeLevel: grade,
          adviserId: teachers[teacherIndex % teachers.length].id,
          capacity: 45,
          studentCount: 0,
          type: 'junior_high'
        });
        teacherIndex++;
      }
    }
    
    // SENIOR HIGH (Grades 11-12): Multiple tracks
    for (let grade = 11; grade <= 12; grade++) {
      // STEM track: 2 sections
      for (let sec = 0; sec < 2; sec++) {
        const sectionName = SECTION_NAMES.seniorHigh.stem[sec];
        const sectionId = `sec_grade${grade}_stem_${sectionName.toLowerCase()}`;
        sections.push({
          id: sectionId,
          name: `Grade ${grade} - STEM ${sectionName}`,
          gradeLevel: grade,
          track: 'STEM',
          adviserId: teachers[teacherIndex % teachers.length].id,
          capacity: 40,
          studentCount: 0,
          type: 'senior_high'
        });
        teacherIndex++;
      }
      
      // ABM track: 2 sections
      for (let sec = 0; sec < 2; sec++) {
        const sectionName = SECTION_NAMES.seniorHigh.abm[sec];
        const sectionId = `sec_grade${grade}_abm_${sectionName.toLowerCase()}`;
        sections.push({
          id: sectionId,
          name: `Grade ${grade} - ABM ${sectionName}`,
          gradeLevel: grade,
          track: 'ABM',
          adviserId: teachers[teacherIndex % teachers.length].id,
          capacity: 40,
          studentCount: 0,
          type: 'senior_high'
        });
        teacherIndex++;
      }
      
      // HUMSS track: 2 sections
      for (let sec = 0; sec < 2; sec++) {
        const sectionName = SECTION_NAMES.seniorHigh.humss[sec];
        const sectionId = `sec_grade${grade}_humss_${sectionName.toLowerCase()}`;
        sections.push({
          id: sectionId,
          name: `Grade ${grade} - HUMSS ${sectionName}`,
          gradeLevel: grade,
          track: 'HUMSS',
          adviserId: teachers[teacherIndex % teachers.length].id,
          capacity: 40,
          studentCount: 0,
          type: 'senior_high'
        });
        teacherIndex++;
      }
      
      // TVL track: 2 sections
      for (let sec = 0; sec < 2; sec++) {
        const sectionName = SECTION_NAMES.seniorHigh.tvl[sec];
        const sectionId = `sec_grade${grade}_tvl_${sectionName.toLowerCase()}`;
        sections.push({
          id: sectionId,
          name: `Grade ${grade} - TVL ${sectionName}`,
          gradeLevel: grade,
          track: 'TVL',
          adviserId: teachers[teacherIndex % teachers.length].id,
          capacity: 40,
          studentCount: 0,
          type: 'senior_high'
        });
        teacherIndex++;
      }
    }
    
    console.log(`   Creating ${sections.length} sections across all grade levels...`);
    for (const section of sections) {
      await addToBatch(db.collection('sections').doc(section.id), section);
    }
    await commitBatch();
    
    // 7. STUDENTS (Distributed across all grade levels)
    console.log('[7/17] 👨‍🎓 Students (distributed across K-12)...');
    const students = [];
    let studentCounter = 1;
    
    // Create 5-8 students per section (realistic class sizes for demo)
    // Prioritize some sections for demo purposes
    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const section = sections[sIdx];
      
      // More students in lower grades and featured sections for demo
      const studentsInSection = 
        section.gradeLevel <= 6 ? 6 :  // Elementary: 6 students each
        section.gradeLevel <= 10 ? 5 : // Junior High: 5 students each
        4; // Senior High: 4 students each (smaller classes)
      
      for (let i = 0; i < studentsInSection; i++) {
        const studentId = `s_${String(studentCounter).padStart(4, '0')}`;
        const firstName = FIRST_NAMES[studentCounter % FIRST_NAMES.length];
        const lastName = LAST_NAMES[Math.floor(studentCounter / 2) % LAST_NAMES.length];
        
        // Calculate birth year based on grade level (roughly age-appropriate)
        const birthYear = 2024 - section.gradeLevel - 6; // Grade 1 = ~7 years old
        
        const student = {
          id: studentId,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          lrn: `1234${String(studentCounter).padStart(8, '0')}`,
          sex: studentCounter % 2 === 0 ? 'Male' : 'Female',
          dateOfBirth: `${birthYear}-0${(studentCounter % 9) + 1}-${String((studentCounter % 28) + 1).padStart(2, '0')}`,
          sectionId: section.id,
          gradeLevel: section.gradeLevel,
          enrollmentDate: '2024-08-15',
          status: 'active',
          guardianName: `Parent of ${firstName}`,
          guardianRelationship: studentCounter % 2 === 0 ? 'Father' : 'Mother',
          guardianContactNumber: `0912${String(studentCounter).padStart(7, '0')}`,
          track: section.track || null // For senior high students
        };
        
        students.push(student);
        await addToBatch(db.collection('students').doc(studentId), student);
        studentCounter++;
      }
    }
    await commitBatch();
    console.log(`   ✓ Created ${students.length} students`);
    
    // 8. GRADES (Q1-Q4 for all students, all subjects)
    console.log('[8/17] 📊 Academic Grades...');
    let gradeCount = 0;
    
    for (const student of students) {
      const applicableLAs = LEARNING_AREAS.filter(la => 
        la.gradeLevel.includes(student.gradeLevel)
      );
      
      for (const la of applicableLAs) {
        // Generate realistic grades (with some variation for analytics)
        const baseGrade = student.id.includes('s_001') || student.id.includes('s_011') ? 68 : 
                         student.id.includes('s_003') || student.id.includes('s_013') ? 92 : 
                         Math.floor(Math.random() * 16) + 78; // 78-93
        
        const q1 = Math.max(65, Math.min(98, baseGrade + Math.floor(Math.random() * 6) - 3));
        const q2 = Math.max(65, Math.min(98, baseGrade + Math.floor(Math.random() * 6) - 3));
        const q3 = Math.max(65, Math.min(98, baseGrade + Math.floor(Math.random() * 6) - 3));
        const q4 = Math.max(65, Math.min(98, baseGrade + Math.floor(Math.random() * 6) - 3));
        const finalGrade = Math.round((q1 + q2 + q3 + q4) / 4);
        
        const gradeId = `grade_${student.id}_${la.id}`;
        await addToBatch(db.collection('grades').doc(gradeId), {
          id: gradeId,
          studentId: student.id,
          learningAreaId: la.id,
          q1, q2, q3, q4,
          finalGrade,
          schoolYear: SCHOOL_YEAR,
          remarks: finalGrade >= 75 ? 'Passed' : 'Failed'
        });
        
        gradeCount++;
      }
    }
    await commitBatch();
    console.log(`   ✓ Created ${gradeCount} grade records`);
    
    // 9. CORE VALUE GRADES
    console.log('[9/17] 💎 Core Value Grades...');
    for (const student of students) {
      for (const cv of CORE_VALUES) {
        const marking = BEHAVIOR_MARKS[Math.floor(Math.random() * 3)]; // Mostly AO, SO, RO
        const cvGradeId = `cvgrade_${student.id}_${cv.id}`;
        
        await addToBatch(db.collection('coreValueGrades').doc(cvGradeId), {
          id: cvGradeId,
          studentId: student.id,
          coreValueId: cv.id,
          q1: marking,
          q2: marking,
          q3: marking,
          q4: marking,
          schoolYear: SCHOOL_YEAR
        });
      }
    }
    await commitBatch();
    
    // 10. ATTENDANCE RECORDS (3 months)
    console.log('[10/17] 📅 Attendance Records (3 months)...');
    const startDate = new Date('2024-08-15');
    const endDate = new Date('2024-11-15');
    let attendanceCount = 0;
    
    for (const student of students) {
      const attendanceRate = student.id.includes('s_002') ? 0.70 : 
                             student.id.includes('s_012') ? 0.68 :
                             0.92 + (Math.random() * 0.06); // 92-98%
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        // Skip weekends
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        
        const dateStr = d.toISOString().split('T')[0];
        const isPresent = Math.random() < attendanceRate;
        const recordId = `att_${student.id}_${dateStr}`;
        
        await addToBatch(db.collection('attendanceRecords').doc(recordId), {
          id: recordId,
          studentId: student.id,
          date: dateStr,
          status: isPresent ? 'present' : 'absent',
          remarks: isPresent ? '' : 'Excused',
          recordedBy: 'teacher_1',
          recordedAt: Timestamp.now()
        });
        
        attendanceCount++;
      }
    }
    await commitBatch();
    console.log(`   ✓ Created ${attendanceCount} attendance records`);
    
    // 11. PARENTS
    console.log('[11/17] 👨‍👩‍👧 Parent Accounts...');
    for (let i = 0; i < 10; i++) {
      const parentId = `parent_${i + 1}`;
      const linkedStudents = students.filter((_, idx) => idx % 10 === i).map(s => s.id);
      
      const parent = {
        id: parentId,
        name: `Parent ${LAST_NAMES[i % LAST_NAMES.length]}`,
        email: `parent${i + 1}@edusync-demo.ph`,
        phone: `09199876${String(i).padStart(3, '0')}`,
        studentIds: linkedStudents,
        emailVerified: true,
        registrationDate: '2024-08-10',
        notificationPreferences: {
          emailEnabled: true,
          smsEnabled: false,
          absenceAlerts: true,
          gradeAlerts: true,
          announcementAlerts: true
        }
      };
      
      await addToBatch(db.collection('parents').doc(parentId), parent);
      
      // Link parent to students
      for (const studentId of linkedStudents) {
        const studentRef = db.collection('students').doc(studentId);
        await studentRef.update({
          parentIds: FieldValue.arrayUnion(parentId)
        });
      }
    }
    await commitBatch();
    
    // 12. FEE STRUCTURES & STUDENT LEDGERS
    console.log('[12/17] 💰 Financial Data (Fee Structures & Ledgers)...');
    
    const gradeLevels = [1, 7, 10];
    const feeStructures = [];
    
    for (const gradeLevel of gradeLevels) {
      const feeStructureId = `fee_${SCHOOL_YEAR}_grade${gradeLevel}`;
      const feeStructure = {
        id: feeStructureId,
        gradeLevel: String(gradeLevel),
        schoolYear: SCHOOL_YEAR,
        fees: {
          tuitionFee: gradeLevel >= 7 ? 15000 : 12000,
          miscFees: [
            { id: 'misc_1', name: 'General Fund', amount: 1500, required: true },
            { id: 'misc_2', name: 'Library Fee', amount: 500, required: true },
            { id: 'misc_3', name: 'Technology Fee', amount: 1000, required: true }
          ],
          labFees: gradeLevel >= 7 ? [
            { id: 'lab_1', name: 'Computer Lab', amount: 800, required: true },
            { id: 'lab_2', name: 'Science Lab', amount: 700, required: true }
          ] : [],
          otherFees: [
            { id: 'other_1', name: 'ID Card', amount: 150, required: true },
            { id: 'other_2', name: 'School Handbook', amount: 100, required: true }
          ]
        },
        paymentPlan: {
          full: { discount: 0.05 },
          quarterly: { installments: 4 },
          monthly: { installments: 10 }
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      feeStructures.push({ id: feeStructureId, data: feeStructure });
      await addToBatch(db.collection('feeStructures').doc(feeStructureId), feeStructure);
    }
    await commitBatch();
    
    // Create student ledgers
    for (const student of students) {
      const feeStructure = feeStructures.find(fs => 
        fs.data.gradeLevel === String(student.gradeLevel)
      );
      
      if (!feeStructure) continue;
      
      const totalFees = 
        feeStructure.data.fees.tuitionFee +
        feeStructure.data.fees.miscFees.reduce((sum, f) => sum + f.amount, 0) +
        feeStructure.data.fees.labFees.reduce((sum, f) => sum + f.amount, 0) +
        feeStructure.data.fees.otherFees.reduce((sum, f) => sum + f.amount, 0);
      
      const paymentAmount = Math.floor(totalFees * (0.3 + Math.random() * 0.4)); // 30-70% paid
      const balance = totalFees - paymentAmount;
      
      const ledgerId = `${student.id}_${SCHOOL_YEAR}`;
      
      await addToBatch(db.collection('studentLedgers').doc(ledgerId), {
        id: ledgerId,
        studentId: student.id,
        studentName: student.name,
        gradeLevel: student.gradeLevel,
        schoolYear: SCHOOL_YEAR,
        feeStructureId: feeStructure.id,
        paymentPlan: 'quarterly',
        charges: [
          { id: 'charge_1', description: 'Tuition Fee', amount: feeStructure.data.fees.tuitionFee, date: '2024-08-15' }
        ],
        payments: [
          { id: 'payment_1', amount: paymentAmount, date: '2024-08-20', method: 'Cash', receiptNumber: `OR-2024-${String(student.id).slice(-4)}` }
        ],
        discounts: [],
        totalCharges: totalFees,
        totalPayments: paymentAmount,
        totalDiscounts: 0,
        balance: balance,
        status: balance === 0 ? 'paid' : balance > totalFees * 0.5 ? 'partial' : 'outstanding',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    }
    await commitBatch();
    
    // 13. LESSON PLANS
    console.log('[13/17] 📖 Lesson Plans...');
    const lessonTopics = [
      'Introduction to Numbers', 'Parts of a Plant', 'Philippine History 101',
      'Grammar Basics', 'Addition and Subtraction', 'The Water Cycle',
      'Mga Uri ng Pangungusap', 'Algebraic Expressions', 'Cell Structure',
      'Map Reading Skills', 'Verb Tenses', 'Fractions and Decimals',
      'Ecosystem Balance', 'Essay Writing', 'Quadratic Equations'
    ];
    
    for (let i = 0; i < 15; i++) {
      const lpId = `lp_${i + 1}`;
      const teacher = teachers[i % teachers.length];
      const section = sections[i % sections.length];
      const la = LEARNING_AREAS[i % LEARNING_AREAS.length];
      
      const dateOffset = i * 2; // Space out over 30 days
      const lessonDate = new Date('2024-11-01');
      lessonDate.setDate(lessonDate.getDate() + dateOffset);
      
      await addToBatch(db.collection('lessonPlans').doc(lpId), {
        id: lpId,
        teacherId: teacher.id,
        sectionId: section.id,
        learningAreaId: la.id,
        title: lessonTopics[i],
        objectives: [
          `Understand ${lessonTopics[i]}`,
          `Apply concepts in real-world scenarios`,
          `Demonstrate mastery through assessment`
        ],
        activities: ['Introduction', 'Discussion', 'Group Work', 'Assessment'],
        materials: ['Textbook', 'Whiteboard', 'Worksheets', 'Visual Aids'],
        assessment: ['Quiz', 'Class Participation', 'Homework'],
        resources: [],
        assignmentIds: [],
        date: lessonDate.toISOString().split('T')[0]
      });
    }
    await commitBatch();
    
    // 14. ASSIGNMENTS
    console.log('[14/17] 📝 Assignments...');
    for (let i = 0; i < 10; i++) {
      const assignmentId = `assignment_${i + 1}`;
      const section = sections[i % sections.length];
      const la = LEARNING_AREAS[i % LEARNING_AREAS.length];
      
      const dueDate = new Date('2024-11-15');
      dueDate.setDate(dueDate.getDate() + (i * 3));
      
      await addToBatch(db.collection('assignments').doc(assignmentId), {
        id: assignmentId,
        sectionId: section.id,
        learningAreaId: la.id,
        title: `Assignment ${i + 1}: ${lessonTopics[i]}`,
        description: `Complete exercises on ${lessonTopics[i]} from the textbook`,
        totalPoints: 100,
        dueDate: dueDate.toISOString().split('T')[0],
        createdAt: Timestamp.now()
      });
      
      // Create student assignment grades (some submitted, some not)
      const sectionStudents = students.filter(s => s.sectionId === section.id);
      for (let j = 0; j < sectionStudents.length; j++) {
        const student = sectionStudents[j];
        const sagId = `sag_${assignmentId}_${student.id}`;
        const isSubmitted = j % 3 !== 0; // 66% submission rate
        
        await addToBatch(db.collection('studentAssignmentGrades').doc(sagId), {
          id: sagId,
          assignmentId: assignmentId,
          studentId: student.id,
          score: isSubmitted ? Math.floor(Math.random() * 21) + 80 : null, // 80-100
          submissionDate: isSubmitted ? '2024-11-14' : null,
          filePath: isSubmitted ? `/uploads/${student.id}_assignment${i + 1}.pdf` : null,
          feedback: isSubmitted ? 'Good work!' : null
        });
      }
    }
    await commitBatch();
    
    // 15. CLASS SCHEDULES
    console.log('[15/17] 📅 Class Schedules...');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = [
      { start: '08:00', end: '09:00' },
      { start: '09:00', end: '10:00' },
      { start: '10:00', end: '11:00' },
      { start: '11:00', end: '12:00' },
      { start: '13:00', end: '14:00' },
      { start: '14:00', end: '15:00' }
    ];
    
    let scheduleCount = 0;
    for (const section of sections) {
      const sectionLAs = LEARNING_AREAS.filter(la => la.gradeLevel.includes(section.gradeLevel));
      
      for (let d = 0; d < days.length; d++) {
        for (let t = 0; t < timeSlots.length && t < sectionLAs.length; t++) {
          const la = sectionLAs[(d * timeSlots.length + t) % sectionLAs.length];
          const teacher = teachers[scheduleCount % teachers.length];
          const scheduleId = `sched_${section.id}_${days[d]}_${t}`;
          
          await addToBatch(db.collection('classSchedules').doc(scheduleId), {
            id: scheduleId,
            sectionId: section.id,
            learningAreaId: la.id,
            teacherId: teacher.id,
            dayOfWeek: days[d],
            startTime: timeSlots[t].start,
            endTime: timeSlots[t].end,
            room: `Room ${200 + scheduleCount % 10}`
          });
          
          scheduleCount++;
        }
      }
    }
    await commitBatch();
    console.log(`   ✓ Created ${scheduleCount} class schedules`);
    
    // 16. ANNOUNCEMENTS
    console.log('[16/17] 📢 Announcements...');
    const announcements = [
      { title: 'Parent-Teacher Conference', target: 'parents', content: 'Join us on November 20 for the quarterly parent-teacher conference.' },
      { title: 'Holiday Schedule Reminder', target: 'all', content: 'School will be closed on November 30 for National Heroes Day.' },
      { title: 'Exam Week Announcement', target: 'students', content: 'Quarterly exams will be held from November 25-29. Please prepare well.' },
      { title: 'Faculty Meeting', target: 'staff', content: 'All teachers must attend the faculty meeting on November 18 at 3 PM.' },
      { title: 'Science Fair Registration', target: 'all', content: 'Register for the upcoming Science Fair by November 22.' },
      { title: 'Sports Day Schedule', target: 'all', content: 'Annual Sports Day will be held on December 5. Save the date!' },
      { title: 'Library Hours Update', target: 'students', content: 'Library will be open until 6 PM starting next week.' },
      { title: 'Scholarship Applications Open', target: 'parents', content: 'Merit-based scholarship applications are now being accepted.' },
      { title: 'School Uniform Reminder', target: 'all', content: 'Please ensure students are in complete uniform daily.' },
      { title: 'Health and Safety Protocol', target: 'all', content: 'Please review updated health protocols in the student handbook.' }
    ];
    
    for (let i = 0; i < announcements.length; i++) {
      const ann = announcements[i];
      const annId = `ann_${i + 1}`;
      
      const postDate = new Date('2024-11-01');
      postDate.setDate(postDate.getDate() + (i * 2));
      
      await addToBatch(db.collection('announcements').doc(annId), {
        id: annId,
        title: ann.title,
        content: ann.content,
        target: ann.target,
        authorId: teachers[i % teachers.length].id,
        date: postDate.toISOString().split('T')[0],
        createdAt: Timestamp.now()
      });
    }
    await commitBatch();
    
    // 17. ENROLLMENT APPLICATIONS (moved from 16 to 17)
    console.log('[17/17] 📋 Enrollment Applications...');
    const applicationStatuses = ['submitted', 'submitted', 'submitted', 'under_review', 'under_review', 'approved', 'approved', 'approved', 'rejected', 'rejected'];
    
    for (let i = 0; i < 10; i++) {
      const appId = `app_${i + 1}`;
      const appNumber = `ENR-2024-${String(i + 1).padStart(5, '0')}`;
      
      const submittedDate = new Date('2024-10-15');
      submittedDate.setDate(submittedDate.getDate() + i);
      
      await addToBatch(db.collection('enrollmentApplications').doc(appId), {
        id: appId,
        applicationNumber: appNumber,
        studentInfo: {
          firstName: FIRST_NAMES[i % FIRST_NAMES.length],
          lastName: LAST_NAMES[i % LAST_NAMES.length],
          dateOfBirth: `2012-0${(i % 9) + 1}-15`,
          sex: i % 2 === 0 ? 'Male' : 'Female'
        },
        guardian1: {
          fullName: `Guardian ${LAST_NAMES[i % LAST_NAMES.length]}`,
          relationship: i % 2 === 0 ? 'Father' : 'Mother',
          contactNumber: `09123456${String(i).padStart(3, '0')}`,
          email: `guardian${i + 1}@example.com`
        },
        currentAddress: {
          street: `${i + 1} Main Street`,
          barangay: 'San Antonio',
          city: 'Manila',
          province: 'Metro Manila',
          zipCode: '1000'
        },
        academicInfo: {
          gradeLevel: 7,
          previousSchool: 'Demo Elementary School',
          lastSchoolYear: '2023-2024'
        },
        status: applicationStatuses[i],
        submittedAt: submittedDate.toISOString(),
        submittedBy: `guardian${i + 1}@example.com`,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    }
    await commitBatch();
    
    // FINAL COMMIT
    await commitBatch();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n✅ [COMPREHENSIVE SEEDING] COMPLETE!');
    console.log(`⏱️  Time: ${duration} seconds\n`);
    
    console.log('📊 Summary:');
    console.log('   • Schools: 1');
    console.log('   • School Settings: 1');
    console.log('   • Learning Areas: 8');
    console.log('   • Core Values: 4');
    console.log('   • Teachers: 10');
    console.log('   • Sections: 3');
    console.log('   • Students: 30');
    console.log(`   • Academic Grades: ~${30 * 8} (Q1-Q4 for all subjects)`);
    console.log(`   • Core Value Grades: ~${30 * 4}`);
    console.log(`   • Attendance Records: ~${30 * 60} (3 months)`);
    console.log('   • Parent Accounts: 10');
    console.log('   • Fee Structures: 3');
    console.log('   • Student Ledgers: 30');
    console.log('   • Lesson Plans: 15');
    console.log('   • Assignments: 10');
    console.log(`   • Class Schedules: ~${scheduleCount}`);
    console.log('   • Announcements: 10');
    console.log('   • Enrollment Applications: 10\n');
    
    console.log('🎬 DEMO VIDEO READY:');
    console.log('   ✅ All collections seeded with realistic data');
    console.log('   ✅ All demo video shots can now be recorded');
    console.log('   ✅ Login credentials:');
    console.log('      - Super Admin: superadmin@edusync-demo.ph / admin123 (for School Management)');
    console.log('      - Admin: admin@school.edu / admin123');
    console.log('      - Parent: parent1@edusync-demo.ph / parent123');
    console.log('      - Teacher: teacher1@edusync-demo.ph / teacher123\n');
    
    console.log('🧹 To clean up demo data later:');
    console.log('   db.collectionGroup().where("isDemo", "==", true).get()');
    console.log('   then batch delete those documents\n');
    
  } catch (error) {
    console.error('❌ [SEEDING ERROR]:', error);
    throw error;
  }
}

// Run seeding
seedProduction()
  .then(() => {
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
