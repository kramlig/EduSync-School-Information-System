/**
 * Create Teacher Documents and Assignments for Demo Teachers
 * 
 * Creates:
 * 1. Teacher documents in teachers collection
 * 2. Teaching assignments for each teacher
 * 3. Class schedules linking teachers to sections
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'edusync-sis' });
}

const db = admin.firestore();
const auth = admin.auth();

const demoTeachers = [
  {
    email: 'maria.cruz@teacher.local',
    firstName: 'Maria',
    lastName: 'Cruz',
    department: 'Mathematics',
    subjects: [
      { name: 'Mathematics', gradeLevel: 7 },
      { name: 'Mathematics', gradeLevel: 8 },
      { name: 'Statistics and Probability', gradeLevel: 11 }
    ]
  },
  {
    email: 'juan.santos@teacher.local',
    firstName: 'Juan',
    lastName: 'Santos',
    department: 'Science',
    subjects: [
      { name: 'Science', gradeLevel: 7 },
      { name: 'Science', gradeLevel: 8 },
      { name: 'Earth and Life Science', gradeLevel: 11 }
    ]
  },
  {
    email: 'ana.reyes@teacher.local',
    firstName: 'Ana',
    lastName: 'Reyes',
    department: 'English',
    subjects: [
      { name: 'English', gradeLevel: 7 },
      { name: 'English', gradeLevel: 8 },
      { name: 'Reading and Writing', gradeLevel: 11 }
    ]
  }
];

async function createTeacherData() {
  console.log('='.repeat(80));
  console.log('CREATING TEACHER DEMO DATA');
  console.log('='.repeat(80));
  
  // Get ALL sections to assign
  const sectionsSnap = await db.collection('sections')
    .where('schoolId', '==', 'default')
    .get();
  
  const sections = [];
  sectionsSnap.forEach(doc => {
    sections.push({ id: doc.id, ...doc.data() });
  });
  
  console.log(`\nFound ${sections.length} sections available for assignment`);
  
  // Get learning areas
  const learningAreasSnap = await db.collection('learningAreas')
    .where('schoolId', '==', 'default')
    .get();
  
  const learningAreasMap = {};
  learningAreasSnap.forEach(doc => {
    const data = doc.data();
    // Handle both single gradeLevel and array of gradeLevels
    const grades = Array.isArray(data.gradeLevel) ? data.gradeLevel : [data.gradeLevel];
    grades.forEach(grade => {
      const key = `${data.name}-${grade}`;
      learningAreasMap[key] = { id: doc.id, ...data };
    });
  });
  
  console.log(`Found ${learningAreasSnap.size} learning areas\n`);
  
  for (const teacherData of demoTeachers) {
    console.log('='.repeat(80));
    console.log(`Creating data for: ${teacherData.firstName} ${teacherData.lastName}`);
    console.log('='.repeat(80));
    
    try {
      // Get teacher's auth UID
      const user = await auth.getUserByEmail(teacherData.email);
      const teacherUid = user.uid;
      
      console.log(`\n✅ Found auth user: ${teacherUid}`);
      
      // Create teaching assignments
      const teachingAssignments = [];
      const classSchedules = [];
      
      for (const subject of teacherData.subjects) {
        // Find all matching sections for this grade level
        const matchingSections = sections.filter(s => s.gradeLevel === subject.gradeLevel);
        
        if (matchingSections.length === 0) {
          console.log(`   ⚠️  No sections found for grade ${subject.gradeLevel}`);
          continue;
        }
        
        // Use the first matching section
        const section = matchingSections[0];
        
        // Find learning area
        const laKey = `${subject.name}-${subject.gradeLevel}`;
        const learningArea = learningAreasMap[laKey];
        
        if (!learningArea) {
          console.log(`   ⚠️  No learning area found for ${subject.name} (Grade ${subject.gradeLevel})`);
          continue;
        }
        
        // Create teaching assignment
        const assignment = {
          subjectId: learningArea.id,
          subjectName: subject.name,
          sectionId: section.id,
          sectionName: section.name,
          gradeLevel: subject.gradeLevel,
          schoolYear: '2024-2025',
          semester: 1
        };
        
        teachingAssignments.push(assignment);
        
        // Create class schedule
        const schedule = {
          teacherId: teacherUid,
          teacherName: `${teacherData.firstName} ${teacherData.lastName}`,
          learningAreaId: learningArea.id,
          learningAreaName: subject.name,
          sectionId: section.id,
          sectionName: section.name,
          gradeLevel: subject.gradeLevel,
          schoolId: 'default',
          schoolYear: '2024-2025',
          semester: 1,
          dayOfWeek: 'Monday',
          startTime: '08:00',
          endTime: '09:00',
          room: `Room ${100 + subject.gradeLevel}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        classSchedules.push(schedule);
        
        console.log(`   ✅ ${subject.name} - ${section.name} (Grade ${subject.gradeLevel})`);
      }
      
      // Create teacher document
      const teacherDoc = {
        uid: teacherUid,
        email: teacherData.email,
        firstName: teacherData.firstName,
        lastName: teacherData.lastName,
        displayName: `${teacherData.firstName} ${teacherData.lastName}`,
        role: 'teacher',
        department: teacherData.department,
        schoolId: 'default',
        teachingAssignments: teachingAssignments,
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('teachers').doc(teacherUid).set(teacherDoc);
      console.log(`\n✅ Teacher document created`);
      
      // Create class schedules
      for (const schedule of classSchedules) {
        await db.collection('classSchedules').add(schedule);
      }
      console.log(`✅ ${classSchedules.length} class schedules created\n`);
      
    } catch (error) {
      console.error(`\n❌ Error creating data for ${teacherData.email}:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('TEACHER DATA CREATION COMPLETE');
  console.log('='.repeat(80));
  console.log('\n✅ All demo teachers now have:');
  console.log('   - Teacher documents in teachers collection');
  console.log('   - Teaching assignments (3 subjects each)');
  console.log('   - Class schedules linking them to sections');
  console.log('\n🎬 Teachers can now log in and see their assigned classes!\n');
  
  process.exit(0);
}

createTeacherData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
