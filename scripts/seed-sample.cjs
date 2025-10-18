#!/usr/bin/env node
/**
 * Seed realistic connected data for Teachers, Parents, Sections, and Students (+ basic Class Schedules).
 *
 * Relationships:
 * - sections: each has an adviserId referencing a teacher with role 'teacher'.
 * - students: assigned to sections.
 * - parents: each links to 1-3 students via studentIds array.
 * - teachers mirrored into 'users' for UI login/testing parity.
 * - optional: simple class schedules assign teachers to sections by learning area.
 *
 * Usage examples:
 *  node scripts/seed-sample.cjs --useEmulator=true --projectId=edusync-local --emuHost=127.0.0.1 --emuPort=8085 \
 *      --teachers=300 --parents=2000 --sections=50 --students=3000
 *
 * Defaults (safe small): teachers=4, parents=6, sections=2, students=0.
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

const NUM_TEACHERS = parseInt(args.teachers || '4', 10);
const NUM_PARENTS = parseInt(args.parents || '6', 10);
const NUM_SECTIONS = parseInt(args.sections || '2', 10);
const NUM_STUDENTS = parseInt(args.students || '0', 10);

function pick(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function id(prefix) { return `${prefix}_${Date.now()}_${Math.floor(Math.random()*1e6)}`; }

const firstNames = ['Alex','Jamie','Taylor','Riley','Jordan','Morgan','Sam','Casey','Avery','Drew'];
const lastNames = ['Santos','Reyes','Cruz','Garcia','Lee','Martinez','Kim','Nguyen','Patel','Lopez'];
const sectionNames = ['A','B','C','D','Acacia','Mahogany','Narra','Molave'];

function chunk(arr, size) {
  const out = [];
  for (let i=0;i<arr.length;i+=size) out.push(arr.slice(i, i+size));
  return out;
}

async function run() {
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const net = await import('node:net');

  if (useEmulator) {
    if (emuHostArg || emuPortArg) {
      const hostPart = emuHostArg && !emuHostArg.includes(':') ? emuHostArg : (emuHostArg || '127.0.0.1');
      const portPart = emuPortArg || (emuHostArg && emuHostArg.includes(':') ? emuHostArg.split(':')[1] : '8085');
      process.env.FIRESTORE_EMULATOR_HOST = `${hostPart.replace(/^https?:\/\//, '')}:${portPart}`;
    } else if (!process.env.FIRESTORE_EMULATOR_HOST) {
      process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8085';
    }

    // Preflight connectivity check (fail fast if emulator is not running)
    const [host, portStr] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
    const port = parseInt(portStr, 10) || 8085;
    await new Promise((resolve, reject) => {
      const socket = new net.Socket();
      const onError = (err) => { try { socket.destroy(); } catch {} reject(new Error(`Cannot connect to Firestore emulator at ${host}:${port} (${err && err.message ? err.message : err})`)); };
      socket.setTimeout(2000, () => onError(new Error('timeout')));
      socket.on('error', onError);
      socket.connect(port, host, () => { socket.end(); resolve(); });
    }).catch(err => {
      console.error(`[Seeder] Firestore emulator not reachable: ${err.message}`);
      console.error(`[Seeder] Start it in another terminal, then re-run:")`);
      console.error(`  npx firebase emulators:start --only firestore --project ${projectId}`);
      process.exit(2);
    });
    initializeApp({ projectId });
    console.log(`[Seeder] Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST} (projectId=${projectId})`);
  } else {
    // For prod, rely on ADC or GOOGLE_APPLICATION_CREDENTIALS.
    initializeApp({ projectId });
    console.log('[Seeder] Using Firestore project (non-emulator).');
  }

  const db = getFirestore();
  console.log(`[Seeder] Initialized Firestore with projectId: ${projectId} and emulator host: ${process.env.FIRESTORE_EMULATOR_HOST}`);

  // Seed teachers
  const roles = ['teacher','teacher','teacher','teacher','registrar','principal'];
  const teacherDocs = [];
  for (let i=0;i<NUM_TEACHERS;i++) {
    const name = `${pick(firstNames)} ${pick(lastNames)}`;
    const email = `${name.toLowerCase().replace(/\s+/g,'')}@school.edu`;
    const role = pick(roles);
    const t = { id: id('t'), name, email, role, assignments: [] };
    teacherDocs.push(t);
  }
  // Batch teachers + users mirror (chunked)
  for (const group of chunk(teacherDocs, 300)) {
    const batch = db.batch();
    for (const t of group) {
      batch.set(db.collection('teachers').doc(t.id), t, { merge: true });
      batch.set(db.collection('users').doc(t.id), { ...t }, { merge: true });
    }
    await batch.commit();
  }

  // Seed parents
  const parentDocs = [];
  for (let i=0;i<NUM_PARENTS;i++) {
    const name = `${pick(firstNames)} ${pick(lastNames)}`;
    const email = `${name.toLowerCase().replace(/\s+/g,'')}@mail.com`;
    parentDocs.push({ id: id('p'), name, email, studentIds: [] });
  }
  for (const group of chunk(parentDocs, 300)) {
    const batch = db.batch();
    for (const p of group) batch.set(db.collection('parents').doc(p.id), p, { merge: true });
    await batch.commit();
  }

  // Seed sections/classes
  const grades = [1,2,3,4,5,6];
  const sectionDocs = [];
  for (let i=0;i<NUM_SECTIONS;i++) {
    const gradeLevel = pick(grades);
    const name = pick(sectionNames);
    const adviser = pick(teacherDocs.filter(t => t.role === 'teacher')).id;
    sectionDocs.push({ id: id('sec'), gradeLevel, name, adviserId: adviser });
  }
  for (const group of chunk(sectionDocs, 200)) {
    const batch = db.batch();
    for (const s of group) batch.set(db.collection('sections').doc(s.id), s, { merge: true });
    await batch.commit();
  }

  // Optionally seed students and connect to parents and sections if requested
  const studentDocs = [];
  if (NUM_STUDENTS > 0) {
    for (let i=0;i<NUM_STUDENTS;i++) {
      const name = `${pick(firstNames)} ${pick(lastNames)}`;
      const email = `${name.toLowerCase().replace(/\s+/g,'')}.${Math.floor(Math.random()*10000)}@students.edu`;
      const section = pick(sectionDocs);
      const dob = `2010-${String(1 + Math.floor(Math.random()*12)).padStart(2,'0')}-${String(1 + Math.floor(Math.random()*28)).padStart(2,'0')}`;
      studentDocs.push({
        id: id('s'), name, email, enrollmentDate: '2023-09-01',
        dateOfBirth: dob, sex: (Math.random() < 0.5 ? 'Male' : 'Female'),
        lrn: String(100000000000 + Math.floor(Math.random()*9_000_000_000)),
        sectionId: section.id,
      });
    }
    console.log(`[Seeder] Attempting to commit ${studentDocs.length} student documents...`);
    for (const group of chunk(studentDocs, 400)) {
      const batch = db.batch();
      for (const s of group) batch.set(db.collection('students').doc(s.id), s, { merge: true });
      await batch.commit();
    }
    console.log(`[Seeder] Successfully committed ${studentDocs.length} student documents.`);
  }

  // Connect parents to 1-3 students each (if students exist)
  if (studentDocs.length > 0 && parentDocs.length > 0) {
    const studentsBySection = new Map(sectionDocs.map(sec => [sec.id, []]));
    for (const s of studentDocs) studentsBySection.get(s.sectionId)?.push(s.id);
    // For distribution, randomly assign from same or nearby sections
    for (const p of parentDocs) {
      const count = 1 + Math.floor(Math.random() * 3);
      const sec = pick(sectionDocs);
      const pool = studentsBySection.get(sec.id) || studentDocs.map(s => s.id);
      const chosen = new Set();
      while (chosen.size < count && pool.length > 0) {
        chosen.add(pick(pool));
      }
      p.studentIds = Array.from(chosen);
    }
    for (const group of chunk(parentDocs, 300)) {
      const batch = db.batch();
      for (const p of group) batch.set(db.collection('parents').doc(p.id), p, { merge: true });
      await batch.commit();
    }
  }

  // Simple class schedules to link more teachers to sections (subject teachers)
  const laNames = ['Filipino','English','Mathematics','Science','Araling Panlipunan','EPP/TLE','MAPEH'];
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
  const classSchedules = [];
  for (const sec of sectionDocs) {
    const subjectTeachers = teacherDocs.filter(t => t.role === 'teacher');
    const used = new Set();
    for (const la of laNames) {
      const t = pick(subjectTeachers);
      // avoid assigning the same teacher to too many entries per section
      if (used.has(t.id) && Math.random() < 0.5) continue;
      used.add(t.id);
      const day = pick(days);
      classSchedules.push({
        id: id('sched'),
        title: `${la} - G${sec.gradeLevel}${sec.name}`,
        type: 'academic',
        dayOfWeek: day,
        startTime: '08:00', endTime: '09:00',
        scope: 'section',
        sectionId: sec.id,
        learningAreaId: la.toLowerCase(),
        teacherId: t.id,
        gradeLevel: sec.gradeLevel,
      });
    }
  }
  if (classSchedules.length) {
    for (const group of chunk(classSchedules, 400)) {
      const batch = db.batch();
      for (const c of group) batch.set(db.collection('classSchedules').doc(c.id), c, { merge: true });
      await batch.commit();
    }
  }

  // --- Seed Core Values (deterministic IDs to prevent duplicates) ---
  const defaultCoreValues = [
    { id: 'cv_makadiyos', name: 'Maka-Diyos', behaviors: [
      'Expresses spiritual beliefs with respect for others',
      'Shows respect for religious beliefs and traditions',
      'Participates in spiritual or reflective activities',
    ]},
    { id: 'cv_makatao', name: 'Maka-tao', behaviors: [
      'Demonstrates empathy and compassion',
      'Shows respect and courtesy towards others',
      'Observes fairness and justice in actions',
    ]},
    { id: 'cv_makakalikasan', name: 'Makakalikasan', behaviors: [
      'Cares for the environment and school surroundings',
      'Practices proper waste segregation and disposal',
      'Conserves water, energy, and resources',
    ]},
    { id: 'cv_makabansa', name: 'Makabansa', behaviors: [
      'Shows love of country and community',
      'Respects the flag and national symbols',
      'Upholds school rules and the law',
    ]},
  ];

  // Upsert core values
  {
    const batch = db.batch();
    for (const cv of defaultCoreValues) {
      batch.set(db.collection('coreValues').doc(cv.id), cv, { merge: true });
    }
    await batch.commit();
  }

  // Seed Core Value Grades for each student across quarters (randomized markings)
  const MARKS = ['AO','SO','RO','NO'];
  const coreValueGrades = [];
  if (studentDocs.length > 0) {
    for (const s of studentDocs) {
      for (const cv of defaultCoreValues) {
        const rec = {
          id: `cvg_${s.id}_${cv.id}`,
          studentId: s.id,
          coreValueId: cv.id,
          q1: {}, q2: {}, q3: {}, q4: {},
        };
        for (const b of cv.behaviors) {
          // Randomly assign per quarter (skew slightly towards AO/SO)
          const pickMark = () => {
            const r = Math.random();
            if (r < 0.45) return 'AO';
            if (r < 0.8) return 'SO';
            if (r < 0.95) return 'RO';
            return 'NO';
          };
          rec.q1[b] = pickMark();
          rec.q2[b] = pickMark();
          rec.q3[b] = pickMark();
          rec.q4[b] = pickMark();
        }
        coreValueGrades.push(rec);
      }
    }
    for (const group of chunk(coreValueGrades, 400)) {
      const batch = db.batch();
      for (const g of group) batch.set(db.collection('coreValueGrades').doc(g.id), g, { merge: true });
      await batch.commit();
    }
  }

  console.log(`[Seeder] Seeded: ${teacherDocs.length} teachers, ${parentDocs.length} parents, ${sectionDocs.length} sections, ${studentDocs.length} students, ${classSchedules.length} schedules, ${defaultCoreValues.length} core values, ${coreValueGrades.length} core value grade records.`);
}

run().catch(e => {
  console.error('[Seeder] Failed to seed sample data:', e && e.stack ? e.stack : e);
  process.exit(1);
});
