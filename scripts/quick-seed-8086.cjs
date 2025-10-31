const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Connect to emulators on port 8086
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9100';

const app = initializeApp({ projectId: 'edusync-local' });
const db = getFirestore();
const auth = getAuth();

async function seedData() {
  try {
    console.log('🌱 Starting quick seed for port 8086...\n');

    // Create admin user
    console.log('👤 Creating admin user...');
    try {
      await auth.createUser({
        uid: 'admin123',
        email: 'admin@edusync.local',
        password: 'admin123',
        displayName: 'System Admin'
      });
      console.log('✅ Admin user created: admin@edusync.local / admin123');
    } catch (err) {
      if (err.code === 'auth/email-already-exists' || err.code === 'auth/uid-already-exists') {
        console.log('ℹ️  Admin user already exists (skipping)');
      } else {
        throw err;
      }
    }

    // Create school year
    console.log('\n📅 Creating school year...');
    const schoolYear = '2023-2024';
    await db.collection('schoolYears').doc(schoolYear).set({
      year: schoolYear,
      startDate: new Date('2023-08-01'),
      endDate: new Date('2024-05-31'),
      currentQuarter: 'Q2',
      isActive: true
    });
    console.log('✅ School year created:', schoolYear);

    // Check if students already exist
    console.log('\n🔍 Checking for existing data...');
    const existingStudents = await db.collection('students').get();
    const existingSections = await db.collection('sections').get();
    
    let studentCount = 0;
    let sections = [];

    if (existingStudents.empty || existingSections.empty) {
      // Create sections and students
      console.log('\n🏫 Creating sections and students...');
      
      sections = [
        { id: 'section-7-diamond', name: 'Grade 7-Diamond', gradeLevel: 7 },
        { id: 'section-7-ruby', name: 'Grade 7-Ruby', gradeLevel: 7 },
        { id: 'section-8-emerald', name: 'Grade 8-Emerald', gradeLevel: 8 },
        { id: 'section-8-sapphire', name: 'Grade 8-Sapphire', gradeLevel: 8 }
      ];

      const firstNames = ['Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Sofia', 'Miguel', 'Isabella'];
      const lastNames = ['Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Martinez', 'Lopez', 'Hernandez', 'Rodriguez', 'Torres', 'Flores'];

      for (const section of sections) {
        // Create section with proper structure
        await db.collection('sections').doc(section.id).set({
          id: section.id,
          name: section.name,
          gradeLevel: section.gradeLevel,
          adviserId: 'teacher-admin',
          createdAt: new Date()
        });

        // Create 10 students per section
        const batch = db.batch();
        for (let i = 0; i < 10; i++) {
          studentCount++;
          const studentId = 'student-' + studentCount.toString().padStart(4, '0');
          const firstName = firstNames[i % firstNames.length];
          const lastName = lastNames[(i + studentCount) % lastNames.length];
          const fullName = `${firstName} ${lastName}`;
          
          const studentRef = db.collection('students').doc(studentId);
          batch.set(studentRef, {
            id: studentId,
            name: fullName,
            firstName: firstName,
            lastName: lastName,
            middleName: 'M.',
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.local`,
            lrn: '1234567890' + studentCount.toString().padStart(2, '0'),
            sectionId: section.id,  // Correct field name!
            enrollmentDate: new Date('2023-08-01').toISOString(),
            dateOfBirth: '2010-01-15',
            sex: i % 2 === 0 ? 'Male' : 'Female',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        await batch.commit();
        console.log(`✅ Created section: ${section.name} (10 students)`);
      }
    } else {
      console.log(`ℹ️  Found ${existingStudents.size} existing students and ${existingSections.size} sections`);
      console.log('   Skipping student/section creation, will only add attendance data');
      studentCount = existingStudents.size;
    }

    // Generate attendance data for October 2025
    console.log('\n📋 Generating attendance data for October 2025...');
    
    // Get all weekdays in October 2025
    const year = 2025;
    const month = 9; // October (0-indexed)
    const date = new Date(year, month, 1);
    const weekdays = [];
    
    while (date.getMonth() === month) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday-Friday
        weekdays.push(date.toISOString().split('T')[0]);
      }
      date.setDate(date.getDate() + 1);
    }
    
    console.log(`   Found ${weekdays.length} school days in October 2025`);
    
    // Fetch all actual students from database
    const studentsSnapshot = await db.collection('students').get();
    const students = [];
    studentsSnapshot.forEach(doc => {
      students.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`   Fetched ${students.length} students from database`);
    
    // Generate attendance for each actual student
    const attendanceBatch = db.batch();
    let attendanceCount = 0;
    
    students.forEach(student => {
      const attendanceRef = db.collection('attendance').doc(student.id);
      
      const dailyStatus = {};
      
      // Generate realistic attendance patterns
      weekdays.forEach((dateStr) => {
        // 85% chance of being present
        // 5% chance of being absent
        // 5% chance of being late
        // 5% chance of being excused
        const rand = Math.random();
        
        if (rand < 0.85) {
          dailyStatus[dateStr] = 'P'; // Present
        } else if (rand < 0.90) {
          dailyStatus[dateStr] = 'A'; // Absent
        } else if (rand < 0.95) {
          dailyStatus[dateStr] = 'L'; // Late
        } else {
          dailyStatus[dateStr] = 'E'; // Excused
        }
      });
      
      attendanceBatch.set(attendanceRef, {
        studentId: student.id,
        schoolYear: schoolYear,
        dailyStatus: dailyStatus,
        updatedAt: new Date()
      });
      
      attendanceCount++;
    });
    
    await attendanceBatch.commit();
    console.log(`✅ Created attendance records for ${attendanceCount} students (${weekdays.length} days each)`);

    // Get final counts
    const finalStudentsCount = (await db.collection('students').get()).size;
    const finalSectionsCount = (await db.collection('sections').get()).size;
    
    console.log('\n✨ Seeding complete!');
    console.log(`📊 Total: ${finalSectionsCount} sections, ${finalStudentsCount} students, ${attendanceCount * weekdays.length} attendance entries`);
    console.log('\n🔐 Login credentials:');
    console.log('   Email: admin@edusync.local');
    console.log('   Password: admin123');
    console.log('\n🌐 Open: http://localhost:5173');
    console.log('   Navigate to: School Forms → SF2\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
