#!/usr/bin/env node
/**
 * PRESENTATION-READY SEED SCRIPT
 * 
 * Seeds a complete, realistic dataset covering ALL 16 collections for demo/presentation:
 * 1. teachers (5 staff)
 * 2. parents (10 parents)
 * 3. sections (3 sections)
 * 4. students (50 students with realistic Filipino names)
 * 5. learningAreas (K-12 curriculum-aligned subjects)
 * 6. grades (complete grade records for all students)
 * 7. coreValues (4 DepEd core values)
 * 8. coreValueGrades (behavior ratings for all students)
 * 9. attendanceRecords (attendance data for current month)
 * 10. substituteAssignments (teacher substitutions)
 * 11. classSchedules (complete class schedules)
 * 12. assignments (homework/projects)
 * 13. studentAssignmentGrades (assignment grades)
 * 14. lessonPlans (sample lesson plans)
 * 15. announcements (school announcements)
 * 16. settings (school configuration)
 * 17. monthlySchoolDaysConfig (attendance configuration)
 */

const args = process.argv.slice(2).reduce((acc, cur) => {
  const [k,v] = cur.split('=');
  if (k.startsWith('--')) acc[k.substring(2)] = v || true; else acc[k] = v || true;
  return acc;
}, {});

const useEmulator = String(args.useEmulator || '').toLowerCase() === 'true' || !!process.env.FIRESTORE_EMULATOR_HOST;
const projectId = args.projectId || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'edusync-local';
const emuHostArg = args.emuHost || args.emulatorHost || null;
const emuPortArg = args.emuPort || args.emulatorPort || null;

function pick(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function id(prefix) { return `${prefix}_${Date.now()}_${Math.floor(Math.random()*1e6)}`; }
function chunk(arr, size) {
  const out = [];
  for (let i=0;i<arr.length;i+=size) out.push(arr.slice(i, i+size));
  return out;
}

// Filipino names for realism
const filipinoFirstNames = ['Miguel','Sofia','Luis','Maria','Jose','Ana','Carlos','Rosa','Diego','Elena','Juan','Carmen','Pedro','Isabel','Rafael','Teresa','Antonio','Lucia','Fernando','Beatriz','Gabriel','Patricia','Ricardo','Catalina','Alejandro'];
const filipinoLastNames = ['Santos','Reyes','Cruz','Garcia','Ramos','Flores','Mendoza','Torres','Rivera','Gonzales','Villanueva','De Leon','Aquino','Bautista','Castillo','Fernandez','Martinez','Valdez','Santiago','Mercado'];

async function run() {
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const net = await import('node:net');

  // Setup emulator
  if (useEmulator) {
    if (emuHostArg || emuPortArg) {
      const hostPart = emuHostArg && !emuHostArg.includes(':') ? emuHostArg : (emuHostArg || '127.0.0.1');
      const portPart = emuPortArg || (emuHostArg && emuHostArg.includes(':') ? emuHostArg.split(':')[1] : '8086');
      process.env.FIRESTORE_EMULATOR_HOST = `${hostPart.replace(/^https?:\/\//, '')}:${portPart}`;
    } else if (!process.env.FIRESTORE_EMULATOR_HOST) {
      process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';
    }

    // Preflight check
    const [host, portStr] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
    const port = parseInt(portStr, 10) || 8086;
    await new Promise((resolve, reject) => {
      const socket = new net.Socket();
      const onError = (err) => { try { socket.destroy(); } catch {} reject(new Error(`Cannot connect to Firestore emulator at ${host}:${port}`)); };
      socket.setTimeout(2000, () => onError(new Error('timeout')));
      socket.on('error', onError);
      socket.connect(port, host, () => { socket.end(); resolve(); });
    }).catch(err => {
      console.error(`[Presentation Seed] ❌ Firestore emulator not reachable: ${err.message}`);
      console.error(`Start it with: npm run dev:emu`);
      process.exit(2);
    });
    
    initializeApp({ projectId });
    console.log(`[Presentation Seed] 🔥 Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
  } else {
    initializeApp({ projectId });
    console.log('[Presentation Seed] Using Firestore project (non-emulator).');
  }

  const db = getFirestore();
  let batch = db.batch();
  let batchCount = 0;

  const commitBatch = async () => {
    if (batchCount > 0) {
      await batch.commit();
      batch = db.batch(); // Create new batch after committing
      batchCount = 0;
    }
  };

  console.log('\n[Presentation Seed] 🎯 Starting comprehensive data seeding for presentation...\n');

  // ===== CLEANUP: Delete all existing data first =====
  console.log('[0/17] 🧹 Cleaning up old data...');
  const collectionsToClean = [
    'students', 'teachers', 'parents', 'sections', 'learningAreas', 
    'grades', 'coreValues', 'coreValueGrades', 'attendanceRecords',
    'substituteAssignments', 'classSchedules', 'assignments', 
    'studentAssignmentGrades', 'lessonPlans', 'announcements', 'users'
  ];
  
  for (const collectionName of collectionsToClean) {
    const snapshot = await db.collection(collectionName).get();
    if (snapshot.size > 0) {
      console.log(`   Deleting ${snapshot.size} docs from ${collectionName}...`);
      
      // Batch deletes in chunks of 500 (Firestore limit)
      const docsToDelete = snapshot.docs;
      for (let i = 0; i < docsToDelete.length; i += 500) {
        const batchDocs = docsToDelete.slice(i, i + 500);
        const deleteBatch = db.batch();
        batchDocs.forEach(doc => deleteBatch.delete(doc.ref));
        await deleteBatch.commit();
      }
    }
  }
  console.log('   ✅ Cleanup complete!\n');

  // ===== 1. SETTINGS =====
  console.log('[1/17] ⚙️  Settings...');
  const settingsDoc = {
    schoolName: 'ENRIQUE ORENCIA ELEMENTARY SCHOOL',
    schoolYear: '2025-2026',
    currentQuarter: 2,
    gradingSystem: 'transmuted',
    enableOfflineMode: true,
    enableNotifications: true,
    features: {
      enrollment: true,
      gradebook: true,
      attendance: true,
      deped_forms: true,
      analytics: true,
      lesson_plans: true,
      assignments: true,
      announcements: true,
    }
  };
  batch.set(db.collection('settings').doc('school_settings'), settingsDoc);
  batchCount++;

  // ===== 2. MONTHLY SCHOOL DAYS CONFIG =====
  console.log('[2/17] 📅 Monthly School Days Config...');
  const monthlyConfig = {
    '2025-08': 20,
    '2025-09': 22,
    '2025-10': 21,
    '2025-11': 20,
    '2025-12': 15,
    '2026-01': 21,
    '2026-02': 20,
    '2026-03': 22,
    '2026-04': 20,
    '2026-05': 19,
  };
  batch.set(db.collection('monthlySchoolDaysConfig').doc('config'), monthlyConfig);
  batchCount++;

  // ===== 3. TEACHERS =====
  console.log('[3/17] 👨‍🏫 Teachers (5 staff members)...');
  const teacherDocs = [
    { id: 'teacher_admin', name: 'System Admin', email: 'admin@school.edu', role: 'admin', assignments: [] },
    { id: 'teacher_principal', name: 'Maria Santos', email: 'principal@school.edu', role: 'principal', assignments: [] },
    { id: 'teacher_1', name: 'Juan Dela Cruz', email: 'juan.delacruz@school.edu', role: 'teacher', assignments: [] },
    { id: 'teacher_2', name: 'Rosa Garcia', email: 'rosa.garcia@school.edu', role: 'teacher', assignments: [] },
    { id: 'teacher_3', name: 'Pedro Reyes', email: 'pedro.reyes@school.edu', role: 'teacher', assignments: [] },
  ];
  
  for (const t of teacherDocs) {
    batch.set(db.collection('teachers').doc(t.id), t);
    batch.set(db.collection('users').doc(t.id), t); // Mirror for login
    batchCount += 2;
  }

  // ===== 4. SECTIONS =====
  console.log('[4/17] 🏫 Sections (3 classes)...');
  const sectionDocs = [
    { id: 'section_g1a', gradeLevel: 1, name: 'Acacia', adviserId: 'teacher_1' },
    { id: 'section_g2a', gradeLevel: 2, name: 'Mahogany', adviserId: 'teacher_2' },
    { id: 'section_g3a', gradeLevel: 3, name: 'Narra', adviserId: 'teacher_3' },
  ];
  
  for (const s of sectionDocs) {
    batch.set(db.collection('sections').doc(s.id), s);
    batchCount++;
  }

  await commitBatch();

  // ===== 5. STUDENTS =====
  console.log('[5/17] 👨‍🎓 Students (50 students with Filipino names)...');
  const studentDocs = [];
  let lrnCounter = 100000000000;
  
  for (let i = 0; i < 50; i++) {
    const firstName = pick(filipinoFirstNames);
    const lastName = pick(filipinoLastNames);
    const name = `${firstName} ${lastName}`;
    const section = sectionDocs[i % 3];
    const year = 2015 + Math.floor(Math.random() * 5);
    const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
    const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
    
    studentDocs.push({
      id: `student_${i + 1}`,
      name,
      lrn: String(lrnCounter++),
      sectionId: section.id,
      enrollmentDate: '2025-08-15',
      dateOfBirth: `${year}-${month}-${day}`,
      sex: i % 2 === 0 ? 'Male' : 'Female',
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@students.edu`,
    });
  }
  
  for (const group of chunk(studentDocs, 400)) {
    const b = db.batch();
    for (const s of group) b.set(db.collection('students').doc(s.id), s);
    await b.commit();
  }

  // ===== 6. PARENTS =====
  console.log('[6/17] 👪 Parents (10 parents)...');
  const parentDocs = [];
  for (let i = 0; i < 10; i++) {
    const name = `${pick(filipinoFirstNames)} ${pick(filipinoLastNames)}`;
    const studentIds = [
      studentDocs[i * 5].id,
      studentDocs[i * 5 + 1].id,
    ].filter(id => id);
    
    parentDocs.push({
      id: `parent_${i + 1}`,
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '')}@parent.com`,
      studentIds,
    });
  }
  
  for (const p of parentDocs) {
    batch.set(db.collection('parents').doc(p.id), p);
    batchCount++;
  }

  await commitBatch();

  // ===== 7. LEARNING AREAS =====
  console.log('[7/17] 📚 Learning Areas (K-12 curriculum)...');
  const learningAreaDocs = [
    { id: 'la_filipino', name: 'Filipino', code: 'FIL', order: 1, type: 'core' },
    { id: 'la_english', name: 'English', code: 'ENG', order: 2, type: 'core' },
    { id: 'la_math', name: 'Mathematics', code: 'MATH', order: 3, type: 'core' },
    { id: 'la_science', name: 'Science', code: 'SCI', order: 4, type: 'core' },
    { id: 'la_ap', name: 'Araling Panlipunan', code: 'AP', order: 5, type: 'core' },
    { id: 'la_epp', name: 'EPP/TLE', code: 'EPP', order: 6, type: 'applied' },
    { id: 'la_mapeh', name: 'MAPEH', code: 'MAPEH', order: 7, type: 'applied' },
  ];
  
  for (const la of learningAreaDocs) {
    batch.set(db.collection('learningAreas').doc(la.id), la);
    batchCount++;
  }

  await commitBatch();

  // ===== 8. CLASS SCHEDULES =====
  console.log('[8/17] 🗓️  Class Schedules...');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const classSchedules = [];
  
  for (const section of sectionDocs) {
    for (const la of learningAreaDocs) {
      const teacher = teacherDocs[2 + (learningAreaDocs.indexOf(la) % 3)];
      classSchedules.push({
        id: id('sched'),
        title: `${la.name} - G${section.gradeLevel}${section.name}`,
        type: 'academic',
        dayOfWeek: pick(days),
        startTime: '08:00',
        endTime: '09:00',
        scope: 'section',
        sectionId: section.id,
        learningAreaId: la.id,
        teacherId: teacher.id,
        gradeLevel: section.gradeLevel,
      });
    }
  }
  
  for (const group of chunk(classSchedules, 400)) {
    const b = db.batch();
    for (const c of group) b.set(db.collection('classSchedules').doc(c.id), c);
    await b.commit();
  }

  // ===== 9. GRADES =====
  console.log('[9/17] 📊 Grades (complete grade records)...');
  const gradeDocs = [];
  
  for (const student of studentDocs) {
    for (const la of learningAreaDocs) {
      // Generate realistic grades (75-98 range, bell curve)
      const generateGrade = () => {
        const base = 75 + Math.floor(Math.random() * 24);
        const variance = Math.floor((Math.random() - 0.5) * 4);
        return Math.max(75, Math.min(100, base + variance));
      };
      
      const q1 = generateGrade();
      const q2 = generateGrade();
      const finalGrade = Math.round((q1 + q2) / 2);
      
      gradeDocs.push({
        id: `grade_${student.id}_${la.id}`,
        studentId: student.id,
        learningAreaId: la.id,
        sectionId: student.sectionId,
        quarter1Grade: q1,
        quarter2Grade: q2,
        finalGrade,
      });
    }
  }
  
  for (const group of chunk(gradeDocs, 400)) {
    const b = db.batch();
    for (const g of group) b.set(db.collection('grades').doc(g.id), g);
    await b.commit();
  }

  // ===== 10. CORE VALUES =====
  console.log('[10/17] 🌟 Core Values (DepEd 4 pillars)...');
  const coreValueDocs = [
    { 
      id: 'cv_makadiyos', 
      name: 'MAKADIYOS', 
      behaviors: [
        "Expresses one's spiritual beliefs while respecting the spiritual beliefs of others",
        'Shows adherence to ethical principles by upholding truth',
      ]
    },
    { 
      id: 'cv_makatao', 
      name: 'MAKATAO', 
      behaviors: [
        'Is sensitive to individual, social, and cultural differences',
        'Demonstrates contributions toward solidarity',
      ]
    },
    { 
      id: 'cv_makakalikasan', 
      name: 'MAKAKALIKASAN', 
      behaviors: [
        'Cares for the environment and utilizes resources wisely, judiciously, and economically',
      ]
    },
    { 
      id: 'cv_makabansa', 
      name: 'MAKABANSA', 
      behaviors: [
        'Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen',
        'Demonstrates appropriate behavior in carrying out activities in the school, community, and country',
      ]
    },
  ];
  
  for (const cv of coreValueDocs) {
    batch.set(db.collection('coreValues').doc(cv.id), cv);
    batchCount++;
  }

  await commitBatch();

  // ===== 11. CORE VALUE GRADES =====
  console.log('[11/17] ⭐ Core Value Grades...');
  const MARKS = ['AO', 'SO', 'RO', 'NO'];
  const coreValueGradesDocs = [];
  
  for (const student of studentDocs) {
    for (const cv of coreValueDocs) {
      const rec = {
        id: `cvg_${student.id}_${cv.id}`,
        studentId: student.id,
        coreValueId: cv.id,
        q1: {},
        q2: {},
        q3: {},
        q4: {},
      };
      
      for (const b of cv.behaviors) {
        const pickMark = () => {
          const r = Math.random();
          if (r < 0.45) return 'AO';
          if (r < 0.80) return 'SO';
          if (r < 0.95) return 'RO';
          return 'NO';
        };
        rec.q1[b] = pickMark();
        rec.q2[b] = pickMark();
        rec.q3[b] = pickMark();
        rec.q4[b] = pickMark();
      }
      coreValueGradesDocs.push(rec);
    }
  }
  
  for (const group of chunk(coreValueGradesDocs, 400)) {
    const b = db.batch();
    for (const g of group) b.set(db.collection('coreValueGrades').doc(g.id), g);
    await b.commit();
  }

  // ===== 12. ATTENDANCE RECORDS =====
  console.log('[12/17] ✅ Attendance Records (November 2025)...');
  const attendanceDocs = [];
  const startDate = new Date('2025-11-01');
  const endDate = new Date('2025-11-30');
  
  for (const student of studentDocs) {
    // Create one record per student with dailyStatus object
    const dailyStatus = {};
    
    for (let day = 0; day < 30; day++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + day);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const dateStr = date.toISOString().split('T')[0];
      const rand = Math.random();
      const status = rand < 0.95 ? 'P' : (rand < 0.98 ? 'A' : 'L');
      
      dailyStatus[dateStr] = status;
    }
    
    attendanceDocs.push({
      id: `att_${student.id}`,
      studentId: student.id,
      sectionId: student.sectionId,
      schoolYear: '2025-2026',
      month: '2025-11',
      dailyStatus,
    });
  }
  
  for (const group of chunk(attendanceDocs, 400)) {
    const b = db.batch();
    for (const a of group) b.set(db.collection('attendanceRecords').doc(a.id), a);
    await b.commit();
  }

  // ===== 13. SUBSTITUTE ASSIGNMENTS =====
  console.log('[13/17] 🔄 Substitute Assignments...');
  const substituteDocs = [
    {
      id: 'sub_1',
      originalTeacherId: 'teacher_1',
      substituteTeacherId: 'teacher_2',
      startDate: '2025-11-10',
      endDate: '2025-11-12',
      reason: 'Medical leave',
      status: 'active',
    },
  ];
  
  for (const s of substituteDocs) {
    batch.set(db.collection('substituteAssignments').doc(s.id), s);
    batchCount++;
  }

  await commitBatch();

  // ===== 14. ASSIGNMENTS =====
  console.log('[14/17] 📝 Assignments...');
  const assignmentDocs = [
    {
      id: 'assign_1',
      title: 'Math Problem Set 1',
      description: 'Solve problems on pages 45-48',
      learningAreaId: 'la_math',
      sectionId: 'section_g1a',
      teacherId: 'teacher_1',
      dueDate: '2025-11-15',
      totalPoints: 100,
      type: 'homework',
      status: 'active',
    },
    {
      id: 'assign_2',
      title: 'Science Project',
      description: 'Create a solar system model',
      learningAreaId: 'la_science',
      sectionId: 'section_g2a',
      teacherId: 'teacher_2',
      dueDate: '2025-11-20',
      totalPoints: 100,
      type: 'project',
      status: 'active',
    },
  ];
  
  for (const a of assignmentDocs) {
    batch.set(db.collection('assignments').doc(a.id), a);
    batchCount++;
  }

  await commitBatch();

  // ===== 15. STUDENT ASSIGNMENT GRADES =====
  console.log('[15/17] 📋 Student Assignment Grades...');
  const studentAssignmentDocs = [];
  
  for (const assignment of assignmentDocs) {
    const relevantStudents = studentDocs.filter(s => s.sectionId === assignment.sectionId).slice(0, 15);
    
    for (const student of relevantStudents) {
      const score = 70 + Math.floor(Math.random() * 31); // 70-100
      studentAssignmentDocs.push({
        id: `sag_${assignment.id}_${student.id}`,
        assignmentId: assignment.id,
        studentId: student.id,
        score,
        submittedDate: '2025-11-12',
        status: 'graded',
      });
    }
  }
  
  for (const group of chunk(studentAssignmentDocs, 400)) {
    const b = db.batch();
    for (const s of group) b.set(db.collection('studentAssignmentGrades').doc(s.id), s);
    await b.commit();
  }

  // ===== 16. LESSON PLANS =====
  console.log('[16/17] 📖 Lesson Plans...');
  const lessonPlanDocs = [
    {
      id: 'lp_1',
      title: 'Addition of Whole Numbers',
      learningAreaId: 'la_math',
      gradeLevel: 1,
      teacherId: 'teacher_1',
      objectives: ['Understand addition concept', 'Solve simple addition problems'],
      materials: ['Counters', 'Whiteboard', 'Worksheets'],
      procedure: 'Introduction > Discussion > Activity > Assessment',
      date: '2025-11-05',
      status: 'approved',
    },
    {
      id: 'lp_2',
      title: 'Parts of a Plant',
      learningAreaId: 'la_science',
      gradeLevel: 2,
      teacherId: 'teacher_2',
      objectives: ['Identify plant parts', 'Explain functions of each part'],
      materials: ['Plant samples', 'Chart', 'Colored pencils'],
      procedure: 'Motivation > Presentation > Group Activity > Evaluation',
      date: '2025-11-06',
      status: 'approved',
    },
  ];
  
  for (const lp of lessonPlanDocs) {
    batch.set(db.collection('lessonPlans').doc(lp.id), lp);
    batchCount++;
  }

  await commitBatch();

  // ===== 17. ANNOUNCEMENTS =====
  console.log('[17/17] 📢 Announcements...');
  const announcementDocs = [
    {
      id: 'ann_1',
      title: 'Parent-Teacher Conference',
      content: 'All parents are invited to attend the Parent-Teacher Conference on November 25, 2025 from 9:00 AM to 12:00 PM.',
      authorId: 'teacher_principal',
      authorName: 'Maria Santos',
      targetAudience: 'parents',
      priority: 'high',
      createdAt: new Date().toISOString(),
      expiresAt: '2025-11-25',
      isActive: true,
    },
    {
      id: 'ann_2',
      title: 'Sports Day Announcement',
      content: 'The Annual Sports Day will be held on November 30, 2025. All students must wear their PE uniform.',
      authorId: 'teacher_principal',
      authorName: 'Maria Santos',
      targetAudience: 'all',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      expiresAt: '2025-11-30',
      isActive: true,
    },
    {
      id: 'ann_3',
      title: 'Quarterly Exam Schedule',
      content: 'The 2nd Quarter Examinations will be conducted from December 10-14, 2025. Please review your lessons.',
      authorId: 'teacher_admin',
      authorName: 'System Admin',
      targetAudience: 'students',
      priority: 'high',
      createdAt: new Date().toISOString(),
      expiresAt: '2025-12-14',
      isActive: true,
    },
  ];
  
  for (const a of announcementDocs) {
    batch.set(db.collection('announcements').doc(a.id), a);
    batchCount++;
  }

  await commitBatch();

  // Summary
  console.log('\n✅ [Presentation Seed] Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SEEDED DATA SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   1. Settings:                    1 document`);
  console.log(`   2. Monthly Config:               1 document`);
  console.log(`   3. Teachers:                     ${teacherDocs.length} staff members`);
  console.log(`   4. Sections:                     ${sectionDocs.length} classes`);
  console.log(`   5. Students:                     ${studentDocs.length} students`);
  console.log(`   6. Parents:                      ${parentDocs.length} parents`);
  console.log(`   7. Learning Areas:               ${learningAreaDocs.length} subjects`);
  console.log(`   8. Class Schedules:              ${classSchedules.length} schedules`);
  console.log(`   9. Grades:                       ${gradeDocs.length} grade records`);
  console.log(`  10. Core Values:                  ${coreValueDocs.length} values`);
  console.log(`  11. Core Value Grades:            ${coreValueGradesDocs.length} records`);
  console.log(`  12. Attendance Records:           ${attendanceDocs.length} records`);
  console.log(`  13. Substitute Assignments:       ${substituteDocs.length} substitutions`);
  console.log(`  14. Assignments:                  ${assignmentDocs.length} assignments`);
  console.log(`  15. Student Assignment Grades:    ${studentAssignmentDocs.length} grades`);
  console.log(`  16. Lesson Plans:                 ${lessonPlanDocs.length} plans`);
  console.log(`  17. Announcements:                ${announcementDocs.length} announcements`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n⚠️  IMPORTANT: REFRESH YOUR BROWSER!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   The database has been reseeded. Please refresh your');
  console.log('   browser (F5 or Ctrl+R) to reset Firestore subscriptions');
  console.log('   and load the fresh data cleanly.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🎯 LOGIN CREDENTIALS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   Admin:      admin@school.edu');
  console.log('   Principal:  principal@school.edu');
  console.log('   Teacher 1:  juan.delacruz@school.edu');
  console.log('   Teacher 2:  rosa.garcia@school.edu');
  console.log('   Teacher 3:  pedro.reyes@school.edu');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

run().catch(e => {
  console.error('[Presentation Seed] ❌ Failed:', e && e.stack ? e.stack : e);
  process.exit(1);
});
