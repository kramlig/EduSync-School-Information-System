const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Connect to emulators on port 8086
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9100';

const app = initializeApp({ projectId: 'edusync-local' });
const db = getFirestore();
const auth = getAuth();

// Helper function to pick random item from array
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper function to generate weekdays for a date range
function getWeekdaysInMonth(year, month) {
  const date = new Date(year, month, 1);
  const weekdays = [];
  
  while (date.getMonth() === month) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday-Friday
      // Use local date string to avoid timezone issues
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      weekdays.push(dateStr);
    }
    date.setDate(date.getDate() + 1);
  }
  
  return weekdays;
}

// Helper function to generate all school days in school year
function getSchoolYearDates(startYear) {
  const schoolDays = [];
  
  // August - December (first semester)
  for (let month = 7; month <= 11; month++) { // Aug=7, Dec=11
    schoolDays.push(...getWeekdaysInMonth(startYear, month));
  }
  
  // January - May (second semester)
  for (let month = 0; month <= 4; month++) { // Jan=0, May=4
    schoolDays.push(...getWeekdaysInMonth(startYear + 1, month));
  }
  
  return schoolDays;
}

async function clearAllData() {
  console.log('🧹 Clearing existing data...');
  
  const collections = [
    // Core collections
    'users',
    'students',
    'teachers', 
    'parents',
    'sections',
    'learningAreas',
    'grades',
    'coreValues',
    'coreValueGrades',
    'attendance', // Legacy - will be removed
    'attendanceRecords',
    'substituteAssignments',
    'classSchedules',
    'assignments',
    'studentAssignmentGrades',
    'lessonPlans',
    'announcements',
    'schoolYears',
    // Financial module collections (match production)
    'feeStructures',
    'receipts',
    'billingStatements',
    'studentLedgers',
    'paymentProofs',
    // Enrollment portal collections
    'enrollmentApplications',
    // System collections
    'notifications',
    'validationResults'
  ];
  
  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    if (!snapshot.empty) {
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`   ✓ Cleared ${snapshot.size} documents from ${collectionName}`);
    }
  }
}

async function seedCompleteData() {
  try {
    console.log('🌱 Starting complete database seed...\n');

    // Step 1: Clear existing data
    await clearAllData();

    // Step 2: Create admin user in Auth and Teachers collection
    console.log('\n👤 Creating admin user...');
    
    // Try to create in Firebase Auth (optional, may fail in emulator)
    try {
      try {
        await auth.deleteUser('admin123');
      } catch (e) {
        // User doesn't exist, that's fine
      }
      
      await auth.createUser({
        uid: 'admin123',
        email: 'admin@edusync.local',
        password: 'admin123',
        displayName: 'System Admin'
      });
      
      // Set custom claims for admin
      try {
        await auth.setCustomUserClaims('admin123', {
          role: 'admin',
          schoolId: 'default'
        });
        console.log('✅ Created admin in Firebase Auth with role claims');
      } catch (claimsErr) {
        console.log('✅ Created admin in Firebase Auth');
        console.log('⚠️  Could not set custom claims:', claimsErr.message);
      }
    } catch (err) {
      console.log('⚠️  Auth emulator not available (this is OK):', err.message);
    }
    
    // CRITICAL: Create in Firestore collections (MUST succeed)
    try {
      // Create in teachers collection
      await db.collection('teachers').doc('admin123').set({
        id: 'admin123',
        email: 'admin@edusync.local',
        firstName: 'System',
        lastName: 'Admin',
        name: 'System Admin',
        role: 'admin',
        status: 'active',
        specialization: 'Administration',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Create in users collection (required for authentication)
      await db.collection('users').doc('admin123').set({
        id: 'admin123',
        email: 'admin@edusync.local',
        name: 'System Admin',
        role: 'admin',
        createdAt: new Date(),
        mock: false
      });
      
      console.log('✅ Admin user created in Firestore');
      console.log('   📧 Email: admin@edusync.local');
      console.log('   🔑 Password: admin123');
    } catch (err) {
      console.error('❌ CRITICAL: Failed to create admin in Firestore:', err.message);
      throw err; // This is critical, must fail if Firestore creation fails
    }

    // Step 3: Create school year
    console.log('\n📅 Creating school year 2023-2024...');
    const schoolYear = '2023-2024';
    await db.collection('schoolYears').doc(schoolYear).set({
      year: schoolYear,
      startDate: new Date('2023-08-01'),
      endDate: new Date('2024-05-31'),
      currentQuarter: 'Q2',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ School year created');

    // Step 5: Create learning areas (Elementary, Junior High, Senior High)
    console.log('\n📚 Creating learning areas...');
    const learningAreas = [
      // ELEMENTARY (Grades 1-6)
      { id: 'la-elem-math', name: 'Mathematics', code: 'MATH', gradeLevel: [1, 2, 3, 4, 5, 6] },
      { id: 'la-elem-english', name: 'English', code: 'ENG', gradeLevel: [1, 2, 3, 4, 5, 6] },
      { id: 'la-elem-science', name: 'Science', code: 'SCI', gradeLevel: [3, 4, 5, 6] },
      { id: 'la-elem-filipino', name: 'Filipino', code: 'FIL', gradeLevel: [1, 2, 3, 4, 5, 6] },
      { id: 'la-elem-ap', name: 'Araling Panlipunan', code: 'AP', gradeLevel: [1, 2, 3, 4, 5, 6] },
      { id: 'la-elem-mapeh', name: 'MAPEH', code: 'MAPEH', gradeLevel: [1, 2, 3, 4, 5, 6] },
      { id: 'la-elem-edp', name: 'Edukasyon sa Pagpapakatao', code: 'EDP', gradeLevel: [1, 2, 3, 4, 5, 6] },
      { id: 'la-elem-mt', name: 'Mother Tongue', code: 'MTB', gradeLevel: [1, 2, 3] },
      
      // JUNIOR HIGH (Grades 7-10)
      { id: 'la-jhs-math', name: 'Mathematics', code: 'MATH', gradeLevel: [7, 8, 9, 10] },
      { id: 'la-jhs-english', name: 'English', code: 'ENG', gradeLevel: [7, 8, 9, 10] },
      { id: 'la-jhs-science', name: 'Science', code: 'SCI', gradeLevel: [7, 8, 9, 10] },
      { id: 'la-jhs-filipino', name: 'Filipino', code: 'FIL', gradeLevel: [7, 8, 9, 10] },
      { id: 'la-jhs-ap', name: 'Araling Panlipunan', code: 'AP', gradeLevel: [7, 8, 9, 10] },
      { id: 'la-jhs-tle', name: 'TLE', code: 'TLE', gradeLevel: [7, 8, 9, 10] },
      { id: 'la-jhs-mapeh', name: 'MAPEH', code: 'MAPEH', gradeLevel: [7, 8, 9, 10] },
      { id: 'la-jhs-values', name: 'Values Education', code: 'VALUES', gradeLevel: [7, 8, 9, 10] },
      
      // SENIOR HIGH - CORE (Grades 11-12, all tracks)
      { id: 'la-shs-oral-comm', name: 'Oral Communication', code: 'ORAL-COMM', gradeLevel: [11] },
      { id: 'la-shs-gen-math', name: 'General Mathematics', code: 'GEN-MATH', gradeLevel: [11] },
      { id: 'la-shs-earth-sci', name: 'Earth and Life Science', code: 'EARTH-SCI', gradeLevel: [11] },
      { id: 'la-shs-pe', name: 'Physical Education and Health', code: 'PE', gradeLevel: [11, 12] },
      { id: 'la-shs-personal-dev', name: 'Personal Development', code: 'PD', gradeLevel: [11] },
      
      // SENIOR HIGH - STEM TRACK
      { id: 'la-shs-stem-calculus', name: 'Basic Calculus', code: 'CALCULUS', gradeLevel: [11, 12], trackRequired: ['STEM'] },
      { id: 'la-shs-stem-chem', name: 'General Chemistry', code: 'CHEM', gradeLevel: [11, 12], trackRequired: ['STEM'] },
      { id: 'la-shs-stem-physics', name: 'General Physics', code: 'PHYS', gradeLevel: [11, 12], trackRequired: ['STEM'] },
      { id: 'la-shs-stem-bio', name: 'General Biology', code: 'BIO', gradeLevel: [11, 12], trackRequired: ['STEM'] },
      
      // SENIOR HIGH - ABM TRACK
      { id: 'la-shs-abm-fund', name: 'Fundamentals of Accountancy', code: 'FUND-ACC', gradeLevel: [11, 12], trackRequired: ['ABM'] },
      { id: 'la-shs-abm-business', name: 'Business Math', code: 'BUS-MATH', gradeLevel: [11], trackRequired: ['ABM'] },
      { id: 'la-shs-abm-econ', name: 'Applied Economics', code: 'ECON', gradeLevel: [12], trackRequired: ['ABM'] },
      { id: 'la-shs-abm-org', name: 'Organization and Management', code: 'ORG-MGT', gradeLevel: [11], trackRequired: ['ABM'] },
      
      // SENIOR HIGH - HUMSS TRACK
      { id: 'la-shs-humss-creative', name: 'Creative Writing', code: 'CREATIVE-W', gradeLevel: [11], trackRequired: ['HUMSS'] },
      { id: 'la-shs-humss-philo', name: 'Introduction to Philosophy', code: 'PHILO', gradeLevel: [12], trackRequired: ['HUMSS'] },
      { id: 'la-shs-humss-world', name: 'World Religions', code: 'WORLD-REL', gradeLevel: [11], trackRequired: ['HUMSS'] },
      { id: 'la-shs-humss-trends', name: 'Trends in Politics and Governance', code: 'TRENDS', gradeLevel: [12], trackRequired: ['HUMSS'] }
    ];

    for (const la of learningAreas) {
      await db.collection('learningAreas').doc(la.id).set({
        ...la,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    console.log(`✅ Created ${learningAreas.length} learning areas`);

    // Step 6: Create core values
    console.log('\n⭐ Creating core values...');
    const coreValues = [
      { id: 'cv-maka-diyos', name: 'Maka-Diyos', description: 'Faith in God', order: 1 },
      { id: 'cv-maka-tao', name: 'Maka-tao', description: 'Respect for humanity', order: 2 },
      { id: 'cv-makakalikasan', name: 'Makakalikasan', description: 'Care for environment', order: 3 },
      { id: 'cv-makabansa', name: 'Makabansa', description: 'Love of country', order: 4 }
    ];

    for (const cv of coreValues) {
      await db.collection('coreValues').doc(cv.id).set({
        ...cv,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    console.log(`✅ Created ${coreValues.length} core values`);

    // Step 6.5: Create realistic teacher accounts
    console.log('\n👨‍🏫 Creating teacher accounts...');
    const teacherData = [
      { id: 'teacher-001', firstName: 'Roberto', lastName: 'Santos', email: 'roberto.santos@edusync.local', specialization: 'Mathematics', gradeLevel: 6, gradeLevels: [5, 6, 7] },
      { id: 'teacher-002', firstName: 'Maria', lastName: 'Garcia', email: 'maria.garcia@edusync.local', specialization: 'Science', gradeLevel: 7, gradeLevels: [6, 7, 8] },
      { id: 'teacher-003', firstName: 'Juan', lastName: 'Cruz', email: 'juan.cruz@edusync.local', specialization: 'English', gradeLevel: 8, gradeLevels: [7, 8, 9] },
      { id: 'teacher-004', firstName: 'Ana', lastName: 'Reyes', email: 'ana.reyes@edusync.local', specialization: 'Filipino', gradeLevel: 1, gradeLevels: ['K', 1, 2, 3] },
      { id: 'teacher-005', firstName: 'Carlos', lastName: 'Lopez', email: 'carlos.lopez@edusync.local', specialization: 'Araling Panlipunan', gradeLevel: 10, gradeLevels: [9, 10, 11] },
      { id: 'teacher-006', firstName: 'Sofia', lastName: 'Mendoza', email: 'sofia.mendoza@edusync.local', specialization: 'MAPEH', gradeLevel: 11, gradeLevels: [10, 11, 12] },
      { id: 'teacher-007', firstName: 'Miguel', lastName: 'Torres', email: 'miguel.torres@edusync.local', specialization: 'TLE', gradeLevel: 12, gradeLevels: [11, 12] },
      { id: 'teacher-008', firstName: 'Isabella', lastName: 'Flores', email: 'isabella.flores@edusync.local', specialization: 'Values Education', gradeLevel: 2, gradeLevels: [1, 2, 3, 4] }
    ];

    for (const teacher of teacherData) {
      // Create in Auth
      try {
        await auth.createUser({
          uid: teacher.id,
          email: teacher.email,
          password: 'teacher123',
          displayName: `${teacher.firstName} ${teacher.lastName}`
        });
        await auth.setCustomUserClaims(teacher.id, { role: 'teacher', schoolId: 'default' });
      } catch (err) {
        console.log(`   ⚠️  Could not create Auth user for ${teacher.email}: ${err.message}`);
      }

      // Map specialization to learning area ID (matches actual IDs in database)
      // Elementary teachers teach grades K-6, so use elementary learning areas
      const specializationToLearningArea = {
        'Mathematics': 'la-elem-math',
        'Science': 'la-elem-science',
        'English': 'la-elem-english',
        'Filipino': 'la-elem-filipino',
        'Araling Panlipunan': 'la-elem-ap',
        'MAPEH': 'la-elem-mapeh',
        'TLE': 'la-jhs-tle',  // TLE is Junior High
        'Values Education': 'la-elem-edp'  // Edukasyon sa Pagpapakatao
      };

      const learningAreaId = specializationToLearningArea[teacher.specialization];

      // Create teaching assignments (teach their specialization across all assigned grade levels)
      // Use explicitly defined gradeLevels from teacher data (includes K for kindergarten teachers)
      const teachingAssignments = [];
      const assignedGrades = teacher.gradeLevels || [teacher.gradeLevel]; // Fallback to single grade
      
      // Add teaching assignments for each grade level
      for (const gradeLevel of assignedGrades) {
        if (learningAreaId) {
          teachingAssignments.push({
            gradeLevel: gradeLevel,
            learningAreaId: learningAreaId,
            learningAreaName: teacher.specialization,
            sectionIds: [] // Will be populated when sections are assigned
          });
        }
      }

      // Create in Firestore
      await db.collection('teachers').doc(teacher.id).set({
        id: teacher.id,
        email: teacher.email,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        name: `${teacher.firstName} ${teacher.lastName}`,
        role: 'teacher',
        status: 'active',
        specialization: teacher.specialization,
        employeeNumber: `T-2024-${teacher.id.split('-')[1]}`,
        contactNumber: `+639${Math.floor(Math.random() * 900000000 + 100000000)}`,
        assignments: teachingAssignments, // ADDED: Teaching assignments
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Mirror to users collection
      await db.collection('users').doc(teacher.id).set({
        id: teacher.id,
        email: teacher.email,
        name: `${teacher.firstName} ${teacher.lastName}`,
        role: 'teacher',
        createdAt: new Date()
      });
    }
    console.log(`✅ Created ${teacherData.length} teacher accounts with role='teacher'`);

    // Step 7: Create sections (K-12 full coverage)
    console.log('\n🏫 Creating sections (K-12)...');
    const sectionNames = ['Diamond', 'Ruby', 'Emerald', 'Sapphire', 'Pearl', 'Jade', 'Topaz', 'Opal', 'Amber', 'Garnet'];
    const sections = [];
    
    // K-12 grade levels
    const gradeLevels = [
      { value: 'K', label: 'Kindergarten' },
      { value: 1, label: 'Grade 1' },
      { value: 2, label: 'Grade 2' },
      { value: 3, label: 'Grade 3' },
      { value: 4, label: 'Grade 4' },
      { value: 5, label: 'Grade 5' },
      { value: 6, label: 'Grade 6' },
      { value: 7, label: 'Grade 7' },
      { value: 8, label: 'Grade 8' },
      { value: 9, label: 'Grade 9' },
      { value: 10, label: 'Grade 10' },
      { value: 11, label: 'Grade 11' },
      { value: 12, label: 'Grade 12' }
    ];

    let sectionCount = 0;
    for (const gradeLevel of gradeLevels) {
      // Create 2 sections per grade level
      for (let i = 0; i < 2; i++) {
        sectionCount++;
        const sectionName = sectionNames[i % sectionNames.length];
        const sectionId = `section-${gradeLevel.value}-${sectionName.toLowerCase()}`;
        
        // Assign a teacher as adviser (round-robin through teachers)
        const teacherIndex = sectionCount % teacherData.length;
        const adviserId = teacherData[teacherIndex].id;
        
        const section = {
          id: sectionId,
          name: sectionName,
          gradeLevel: gradeLevel.value,
          adviserId: adviserId,
          schoolYear: schoolYear,
          capacity: 40,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        sections.push(section);
        await db.collection('sections').doc(sectionId).set(section);
      }
      console.log(`   ✓ Created 2 sections for ${gradeLevel.label}`);
    }
    console.log(`✅ Created ${sections.length} sections across K-12`);

    // Step 8: Create students (diverse, realistic data)
    console.log('\n👨‍🎓 Creating students...');
    const maleFirstNames = ['Juan', 'Jose', 'Pedro', 'Carlos', 'Miguel', 'Luis', 'Antonio', 'Rafael', 'Gabriel', 'Diego', 'Andres', 'Marco', 'Paulo', 'Javier', 'Ricardo'];
    const femaleFirstNames = ['Maria', 'Ana', 'Rosa', 'Sofia', 'Isabella', 'Carmen', 'Elena', 'Luisa', 'Patricia', 'Angela', 'Teresa', 'Gabriela', 'Valentina', 'Beatriz', 'Monica'];
    const lastNames = ['Santos', 'Garcia', 'Lopez', 'Rodriguez', 'Flores', 'Martinez', 'Hernandez', 'Torres', 'Reyes', 'Cruz', 'Ramos', 'Gonzales', 'Fernandez', 'Villanueva', 'Bautista', 'Mendoza', 'Aquino', 'Del Rosario', 'Santiago', 'Mercado'];
    
    const students = [];
    let studentCount = 0;

    for (const section of sections) {
      const batch = db.batch();
      const studentsPerSection = section.gradeLevel === 'K' ? 20 : 25; // Smaller class for Kinder
      
      for (let i = 0; i < studentsPerSection; i++) {
        studentCount++;
        const studentId = `student-${studentCount.toString().padStart(4, '0')}`;
        const isMale = i % 2 === 0;
        const firstName = isMale 
          ? maleFirstNames[i % maleFirstNames.length] 
          : femaleFirstNames[i % femaleFirstNames.length];
        const lastName = lastNames[(i + studentCount) % lastNames.length];
        const middleName = lastNames[(i + studentCount + 5) % lastNames.length].charAt(0) + '.';
        const fullName = `${firstName} ${middleName} ${lastName}`;
        
        // Age-appropriate birth year based on grade level
        let birthYear = 2010;
        if (section.gradeLevel === 'K') birthYear = 2019;
        else if (typeof section.gradeLevel === 'number') {
          birthYear = 2024 - section.gradeLevel - 5; // Approximate age
        }
        
        const studentData = {
          id: studentId,
          name: fullName,
          firstName: firstName,
          lastName: lastName,
          middleName: middleName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${studentCount}@student.edusync.local`,
          lrn: `${120000000000 + studentCount}`, // Realistic LRN format (12 digits)
          sectionId: section.id,
          gradeLevel: section.gradeLevel,
          enrollmentDate: new Date('2023-08-15').toISOString(),
          dateOfBirth: `${birthYear}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
          sex: isMale ? 'Male' : 'Female',
          status: 'active',
          address: `${Math.floor(Math.random() * 999) + 1} ${pick(['Rizal', 'Bonifacio', 'Mabini', 'Luna', 'Aguinaldo'])} St., ${pick(['Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig'])}`,
          contactNumber: `+639${Math.floor(Math.random() * 900000000 + 100000000)}`,
          guardianName: `${pick([...maleFirstNames, ...femaleFirstNames])} ${lastName}`,
          guardianContact: `+639${Math.floor(Math.random() * 900000000 + 100000000)}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        students.push(studentData);
        batch.set(db.collection('students').doc(studentId), studentData);
      }
      
      await batch.commit();
      console.log(`   ✓ Created ${studentsPerSection} students for ${section.name} (Grade ${section.gradeLevel})`);
    }
    console.log(`✅ Total students created: ${students.length}`);

    // Step 8.5: Create parent account for testing
    console.log('\n👨‍👩‍👧‍👦 Creating test parent account...');
    
    // Find Juan Garcia student (first student from first section)
    const juanGarciaStudent = students.find(s => 
      s.firstName === 'Juan' && s.lastName === 'Garcia'
    ) || students[0]; // Fallback to first student if Juan Garcia not found
    
    // Create parent user in Firebase Auth with custom claims
    try {
      await auth.createUser({
        uid: 'parent-0001',
        email: 'juan.garcia@test.com',
        password: 'parent123',
        displayName: `${juanGarciaStudent.firstName} ${juanGarciaStudent.lastName}`,
      });
      
      // Set custom claims for parent
      await auth.setCustomUserClaims('parent-0001', {
        role: 'parent',
        schoolId: 'default'
      });
      
      console.log('✅ Created parent in Firebase Auth with role claims');
    } catch (error) {
      console.error('⚠️ Failed to create parent Auth user:', error.message);
    }
    
    const parentRef = db.collection('parents').doc();
    await parentRef.set({
      name: `${juanGarciaStudent.firstName} ${juanGarciaStudent.lastName}`,
      email: 'juan.garcia@test.com',
      password: 'parent123',
      studentIds: [juanGarciaStudent.id],
      phone: '09171234567',
      emailVerified: false,
      registrationDate: new Date().toISOString(),
      notificationPreferences: {
        emailEnabled: true,
        smsEnabled: false,
        absenceAlerts: true,
        gradeAlerts: true,
        announcementAlerts: true
      }
    });
    
    // Link parent to student
    await db.collection('students').doc(juanGarciaStudent.id).update({
      parentId: parentRef.id
    });
    
    console.log(`✅ Created parent account: juan.garcia@test.com`);
    console.log(`   Linked to student: ${juanGarciaStudent.firstName} ${juanGarciaStudent.lastName} (${juanGarciaStudent.id})`);

    // Step 9: Create attendance records for October 2025
    console.log('\n📋 Creating attendance records for October 2025...');
    const octWeekdays = getWeekdaysInMonth(2025, 9); // October 2025
    console.log(`   Found ${octWeekdays.length} school days in October 2025`);
    console.log(`   First day: ${octWeekdays[0]}, Last day: ${octWeekdays[octWeekdays.length - 1]}`);

    const attendanceBatch = db.batch();
    
    for (const student of students) {
      const dailyStatus = {};
      
      octWeekdays.forEach(dateStr => {
        const rand = Math.random();
        if (rand < 0.85) dailyStatus[dateStr] = 'P'; // 85% Present
        else if (rand < 0.90) dailyStatus[dateStr] = 'A'; // 5% Absent
        else if (rand < 0.95) dailyStatus[dateStr] = 'L'; // 5% Late
        else dailyStatus[dateStr] = 'E'; // 5% Excused
      });
      
      // IMPORTANT: Use 'attendanceRecords' collection, not 'attendance'
      attendanceBatch.set(db.collection('attendanceRecords').doc(student.id), {
        studentId: student.id,
        schoolYear: schoolYear,
        dailyStatus: dailyStatus,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    await attendanceBatch.commit();
    console.log(`✅ Created attendance for ${students.length} students`);

    // Step 10: Create grades for Q1 and Q2
    console.log('\n📊 Creating grades for Q1 and Q2...');
    
    let gradesCreated = 0;
    let gradesBatch = db.batch();
    let batchSize = 0;
    const MAX_BATCH_SIZE = 500; // Firestore batch limit

    for (const student of students) {
      for (const la of learningAreas) {
        const gradeId = `${student.id}-${la.id}`;
        
        // Generate realistic grades for Q1 and Q2
        const q1Grade = Math.floor(Math.random() * 26) + 75;
        const q2Grade = Math.floor(Math.random() * 26) + 75;
        
        // Calculate final grade (average of available quarters)
        const finalGrade = Math.round((q1Grade + q2Grade) / 2);
        
        gradesBatch.set(db.collection('grades').doc(gradeId), {
          id: gradeId,
          studentId: student.id,
          learningAreaId: la.id,
          q1: q1Grade,
          q2: q2Grade,
          finalGrade: finalGrade,
          remarks: finalGrade >= 75 ? 'Passed' : 'Failed'
        });
        
        gradesCreated++;
        batchSize++;
        
        // Commit batch when it reaches limit
        if (batchSize >= MAX_BATCH_SIZE) {
          await gradesBatch.commit();
          gradesBatch = db.batch();
          batchSize = 0;
        }
      }
    }
    
    // Commit remaining grades
    if (batchSize > 0) {
      await gradesBatch.commit();
    }
    
    console.log(`✅ Created ${gradesCreated} grade entries`);

    // Step 11: Create announcements
    console.log('\n📢 Creating announcements...');
    const announcements = [
      {
        title: 'School Opening Announcement',
        content: 'Welcome back to school year 2023-2024! Classes will begin on August 29, 2023.',
        target: 'all',
        date: '2023-08-15',
        priority: 'high',
        isActive: true
      },
      {
        title: 'Parent-Teacher Conference',
        content: 'Parent-Teacher Conference for Q2 will be held on November 15, 2023. Please mark your calendars.',
        target: 'parents',
        date: '2023-11-01',
        priority: 'medium',
        isActive: true
      },
      {
        title: 'Sports Fest 2024',
        content: 'The annual Sports Fest will be held on February 14-16, 2024. All students are encouraged to participate!',
        target: 'students',
        date: '2024-01-15',
        priority: 'medium',
        isActive: true
      }
    ];

    const announcementsBatch = db.batch();
    for (const announcement of announcements) {
      const ref = db.collection('announcements').doc();
      announcementsBatch.set(ref, {
        ...announcement,
        authorId: 'admin123',
        authorName: 'System Admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    await announcementsBatch.commit();
    console.log(`✅ Created ${announcements.length} announcements`);

    // ==========================================
    // FINANCIAL MODULE COLLECTIONS
    // ==========================================
    console.log('\n💰 Creating financial module structure...');

    // Fee Structures (empty for now, admin will configure)
    console.log('   📋 Fee Structures: Ready (admin configurable)');

    // Student Ledgers (initialize empty for each student)
    const ledgersBatch = db.batch();
    let ledgerCount = 0;
    for (const student of students) {
      const ledgerRef = db.collection('studentLedgers').doc(student.id);
      ledgersBatch.set(ledgerRef, {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        sectionId: student.sectionId,
        balance: 0,
        totalFees: 0,
        totalPaid: 0,
        transactions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      ledgerCount++;
    }
    await ledgersBatch.commit();
    console.log(`   ✅ Student Ledgers: ${ledgerCount} initialized`);

    // Receipts, Billing Statements, Payment Proofs (empty - created at runtime)
    console.log('   📋 Receipts: Ready (created on payment)');
    console.log('   📋 Billing Statements: Ready (created on billing)');
    console.log('   📋 Payment Proofs: Ready (created by parents)');

    // ==========================================
    // ENROLLMENT PORTAL COLLECTIONS
    // ==========================================
    console.log('\n📝 Creating enrollment portal structure...');
    console.log('   📋 Enrollment Applications: Ready (created by applicants)');

    // ==========================================
    // SYSTEM COLLECTIONS
    // ==========================================
    console.log('\n🔔 Creating system collections...');
    console.log('   📋 Notifications: Ready (created by system events)');
    console.log('   📋 Validation Results: Ready (created by validation wizard)');

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('✨ DATABASE SEEDING COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📊 Core Data Summary:');
    console.log(`   • School Years: 1`);
    console.log(`   • Teachers: ${teacherData.length + 1} (including admin)`);
    console.log(`   • Parents: 1 (test account)`);
    console.log(`   • Sections: ${sections.length} (K-12, 2 per grade)`);
    console.log(`   • Students: ${students.length}`);
    console.log(`   • Learning Areas: ${learningAreas.length}`);
    console.log(`   • Core Values: ${coreValues.length}`);
    console.log(`   • Attendance Records: ${students.length} students × ${octWeekdays.length} days`);
    console.log(`   • Grade Entries: ${gradesCreated}`);
    console.log(`   • Announcements: ${announcements.length}`);
    
    console.log('\n💰 Financial Module:');
    console.log(`   • Student Ledgers: ${ledgerCount} initialized`);
    console.log(`   • Fee Structures: Ready (admin configurable)`);
    console.log(`   • Receipts, Billing, Payment Proofs: Ready (runtime)`);
    
    console.log('\n📝 Additional Features:');
    console.log(`   • Enrollment Applications: Ready (runtime)`);
    console.log(`   • Notifications: Ready (runtime)`);
    console.log(`   • Validation Results: Ready (runtime)`);
    
    console.log('\n🔐 Admin Login:');
    console.log('   Email: admin@edusync.local');
    console.log('   Password: admin123');
    
    console.log('\n👨‍👩‍👧 Parent Portal Login:');
    console.log('   Email: juan.garcia@test.com');
    console.log('   Password: parent123');
    
    console.log('\n🌐 Access the application:');
    console.log('   URL: http://localhost:5173 or http://localhost:5174');
    console.log('   Navigate to: School Forms → SF2 Dashboard');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

seedCompleteData();
