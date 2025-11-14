#!/usr/bin/env node
/**
 * Create comprehensive teacher demo accounts with:
 * - Teacher auth users with custom claims
 * - Teacher documents with assignments
 * - Class schedules they're assigned to
 * - Students they teach
 */

const admin = require('firebase-admin');

delete process.env.FIRESTORE_EMULATOR_HOST;
admin.initializeApp({ projectId: 'edusync-sis' });
const db = admin.firestore();
const auth = admin.auth();

const SCHOOL_ID = 'default';
const SCHOOL_YEAR = 'SY 2024-2025';

// Demo teachers with their teaching assignments
const DEMO_TEACHERS = [
  {
    email: 'maria.cruz@teacher.local',
    password: 'teacher123',
    firstName: 'Maria',
    lastName: 'Cruz',
    gradeLevel: 1,  // Grade 1 teacher
    subjects: ['Filipino', 'English', 'Mathematics']
  },
  {
    email: 'juan.santos@teacher.local',
    password: 'teacher123',
    firstName: 'Juan',
    lastName: 'Santos',
    gradeLevel: 2,  // Grade 2 teacher
    subjects: ['Science', 'MAPEH', 'Araling Panlipunan (AP)']
  },
  {
    email: 'ana.reyes@teacher.local',
    password: 'teacher123',
    firstName: 'Ana',
    lastName: 'Reyes',
    gradeLevel: 3,  // Grade 3 teacher
    subjects: ['Filipino', 'English', 'Mathematics']
  }
];

async function createTeacherDemoAccounts() {
  console.log('👨‍🏫 Creating comprehensive teacher demo accounts...\n');

  try {
    // Get all learning areas
    const learningAreasSnapshot = await db.collection('learningAreas')
      .where('schoolId', '==', SCHOOL_ID)
      .get();
    
    const learningAreasMap = {};
    learningAreasSnapshot.forEach(doc => {
      const la = doc.data();
      learningAreasMap[la.name] = { id: doc.id, ...la };
    });

    // Get sections
    const sectionsSnapshot = await db.collection('sections')
      .where('schoolId', '==', SCHOOL_ID)
      .get();
    
    const sectionsByGrade = {};
    sectionsSnapshot.forEach(doc => {
      const section = doc.data();
      if (!sectionsByGrade[section.gradeLevel]) {
        sectionsByGrade[section.gradeLevel] = [];
      }
      sectionsByGrade[section.gradeLevel].push({ id: doc.id, ...section });
    });

    for (const teacher of DEMO_TEACHERS) {
      console.log(`\n👤 Creating ${teacher.firstName} ${teacher.lastName}...`);
      
      // 1. Create/Update Firebase Auth
      let authUser;
      try {
        authUser = await auth.getUserByEmail(teacher.email);
        console.log(`   📧 Auth exists: ${teacher.email}`);
        await auth.updateUser(authUser.uid, { 
          password: teacher.password,
          displayName: `${teacher.firstName} ${teacher.lastName}`
        });
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          authUser = await auth.createUser({
            email: teacher.email,
            password: teacher.password,
            displayName: `${teacher.firstName} ${teacher.lastName}`
          });
          console.log(`   ✅ Created auth: ${teacher.email}`);
        } else {
          throw error;
        }
      }

      // 2. Set custom claims
      await auth.setCustomUserClaims(authUser.uid, {
        role: 'teacher',
        schoolId: SCHOOL_ID
      });
      console.log(`   ✅ Set custom claims: role='teacher'`);

      // 3. Create teacher assignments
      const assignments = [];
      const sections = sectionsByGrade[teacher.gradeLevel] || [];
      
      for (const subject of teacher.subjects) {
        const learningArea = learningAreasMap[subject];
        if (!learningArea) {
          console.log(`   ⚠️  Subject not found: ${subject}`);
          continue;
        }

        // Assign to first section of the grade level
        if (sections.length > 0) {
          assignments.push({
            learningAreaId: learningArea.id,
            learningAreaName: learningArea.name,
            gradeLevel: teacher.gradeLevel,
            sectionId: sections[0].id,
            sectionName: sections[0].name,
            schoolYear: SCHOOL_YEAR
          });
        }
      }

      // 4. Create/Update teacher document using auth UID as ID
      const teacherData = {
        schoolId: SCHOOL_ID,
        email: teacher.email,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        name: `${teacher.firstName} ${teacher.lastName}`,
        role: 'teacher',
        isActive: true,
        assignments: assignments,
        gradeLevel: teacher.gradeLevel,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('users').doc(authUser.uid).set(teacherData, { merge: true });
      console.log(`   ✅ Created teacher document with ${assignments.length} assignments`);

      // 5. Create class schedules for this teacher
      let schedulesCreated = 0;
      for (const assignment of assignments) {
        const existingSchedule = await db.collection('classSchedules')
          .where('teacherId', '==', authUser.uid)
          .where('learningAreaId', '==', assignment.learningAreaId)
          .where('sectionId', '==', assignment.sectionId)
          .limit(1)
          .get();

        if (existingSchedule.empty) {
          await db.collection('classSchedules').add({
            schoolId: SCHOOL_ID,
            teacherId: authUser.uid,
            teacherName: teacherData.name,
            learningAreaId: assignment.learningAreaId,
            learningAreaName: assignment.learningAreaName,
            sectionId: assignment.sectionId,
            sectionName: assignment.sectionName,
            gradeLevel: assignment.gradeLevel,
            schoolYear: SCHOOL_YEAR,
            dayOfWeek: 1, // Monday
            startTime: '08:00',
            endTime: '09:00',
            room: `Room ${teacher.gradeLevel}${['A', 'B', 'C'][DEMO_TEACHERS.indexOf(teacher)]}`,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          schedulesCreated++;
        }
      }
      console.log(`   ✅ Created ${schedulesCreated} class schedules`);

      console.log(`   ✅ Completed ${teacher.firstName} ${teacher.lastName}`);
      console.log(`      Email: ${teacher.email}`);
      console.log(`      Password: ${teacher.password}`);
      console.log(`      Grade: ${teacher.gradeLevel}`);
      console.log(`      Subjects: ${teacher.subjects.join(', ')}`);
    }

    console.log('\n\n🎉 Teacher demo accounts created!');
    console.log('\n📋 Summary:');
    console.log('   ✅ 3 teacher accounts with auth & custom claims');
    console.log('   ✅ Teacher documents with assignments');
    console.log('   ✅ Class schedules created');
    console.log('\n👨‍🏫 Demo Teacher Accounts:');
    console.log('   maria.cruz@teacher.local / teacher123 (Grade 1)');
    console.log('   juan.santos@teacher.local / teacher123 (Grade 2)');
    console.log('   ana.reyes@teacher.local / teacher123 (Grade 3)');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

createTeacherDemoAccounts();
