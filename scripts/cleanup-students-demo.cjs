#!/usr/bin/env node
/**
 * Clean up students and create proper demo accounts
 * - Remove students without email who have sections (enrollment data only)
 * - Add sections to students with email but no section
 * - Create 5 demo student accounts with proper data
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with production project
delete process.env.FIRESTORE_EMULATOR_HOST;
admin.initializeApp({ projectId: 'edusync-sis' });

const db = admin.firestore();
const auth = admin.auth();

const SCHOOL_ID = 'default';

// Demo student accounts to create/update
const DEMO_STUDENTS = [
  {
    email: 'juan.delacruz@student.local',
    password: 'student123',
    firstName: 'Juan',
    lastName: 'De La Cruz',
    lrn: '200300000001',
    sectionId: 'sec_grade1_a',
    gradeLevel: 1
  },
  {
    email: 'maria.santos@student.local',
    password: 'student123',
    firstName: 'Maria',
    lastName: 'Santos',
    lrn: '200300000002',
    sectionId: 'sec_grade2_emerald',
    gradeLevel: 2
  },
  {
    email: 'jose.reyes@student.local',
    password: 'student123',
    firstName: 'Jose',
    lastName: 'Reyes',
    lrn: '200300000003',
    sectionId: 'sec_grade3_sapphire',
    gradeLevel: 3
  },
  {
    email: 'ana.garcia@student.local',
    password: 'student123',
    firstName: 'Ana',
    lastName: 'Garcia',
    lrn: '200300000004',
    sectionId: 'sec_grade4_pearl',
    gradeLevel: 4
  },
  {
    email: 'pedro.lopez@student.local',
    password: 'student123',
    firstName: 'Pedro',
    lastName: 'Lopez',
    lrn: '200300000005',
    sectionId: 'sec_grade5_ruby',
    gradeLevel: 5
  }
];

async function cleanupAndCreateDemoStudents() {
  console.log('🧹 Starting student cleanup and demo account creation...\n');

  try {
    // Step 1: Get all students
    const studentsSnapshot = await db.collection('students')
      .where('schoolId', '==', SCHOOL_ID)
      .get();

    console.log(`📊 Found ${studentsSnapshot.size} total students\n`);

    let studentsWithNoEmail = [];
    let studentsWithEmailNoSection = [];
    let studentsWithBoth = [];

    studentsSnapshot.forEach(doc => {
      const student = { id: doc.id, ...doc.data() };
      if (!student.email) {
        studentsWithNoEmail.push(student);
      } else if (!student.sectionId) {
        studentsWithEmailNoSection.push(student);
      } else {
        studentsWithBoth.push(student);
      }
    });

    console.log(`📋 Student Categories:`);
    console.log(`   ✅ Students with email AND section: ${studentsWithBoth.length}`);
    console.log(`   ⚠️  Students with email but NO section: ${studentsWithEmailNoSection.length}`);
    console.log(`   ❌ Students with NO email (enrollment data only): ${studentsWithNoEmail.length}\n`);

    // Step 2: Delete students without email (enrollment records only)
    console.log('🗑️  Deleting students without email addresses...');
    const batch1 = db.batch();
    let deleteCount = 0;
    
    for (const student of studentsWithNoEmail) {
      batch1.delete(db.collection('students').doc(student.id));
      deleteCount++;
      
      if (deleteCount % 10 === 0) {
        console.log(`   Deleted ${deleteCount}/${studentsWithNoEmail.length}`);
      }
    }
    
    if (deleteCount > 0) {
      await batch1.commit();
      console.log(`   ✅ Deleted ${deleteCount} students without email\n`);
    }

    // Step 3: Update students with email but no section (assign to appropriate sections)
    if (studentsWithEmailNoSection.length > 0) {
      console.log('📝 Updating students with email but no section...');
      const sections = await db.collection('sections')
        .where('schoolId', '==', SCHOOL_ID)
        .get();
      
      const sectionsByGrade = {};
      sections.forEach(doc => {
        const section = doc.data();
        if (!sectionsByGrade[section.gradeLevel]) {
          sectionsByGrade[section.gradeLevel] = [];
        }
        sectionsByGrade[section.gradeLevel].push({ id: doc.id, ...section });
      });

      const batch2 = db.batch();
      let updateCount = 0;

      for (const student of studentsWithEmailNoSection) {
        const gradeLevel = student.gradeLevel || 1;
        const availableSections = sectionsByGrade[gradeLevel] || [];
        
        if (availableSections.length > 0) {
          const randomSection = availableSections[Math.floor(Math.random() * availableSections.length)];
          batch2.update(db.collection('students').doc(student.id), {
            sectionId: randomSection.id,
            gradeLevel: gradeLevel
          });
          updateCount++;
          console.log(`   Updated ${student.firstName} ${student.lastName} → ${randomSection.name}`);
        }
      }

      if (updateCount > 0) {
        await batch2.commit();
        console.log(`   ✅ Updated ${updateCount} students with sections\n`);
      }
    }

    // Step 4: Create/Update demo student accounts
    console.log('👥 Creating demo student accounts...\n');

    for (const demoStudent of DEMO_STUDENTS) {
      try {
        // Check if Firebase Auth user exists
        let authUser;
        try {
          authUser = await auth.getUserByEmail(demoStudent.email);
          console.log(`   📧 Auth exists: ${demoStudent.email}`);
          
          // Update password
          await auth.updateUser(authUser.uid, { password: demoStudent.password });
          console.log(`   🔑 Updated password`);
        } catch (error) {
          if (error.code === 'auth/user-not-found') {
            // Create new auth user
            authUser = await auth.createUser({
              email: demoStudent.email,
              password: demoStudent.password,
              displayName: `${demoStudent.firstName} ${demoStudent.lastName}`
            });
            console.log(`   ✅ Created auth: ${demoStudent.email}`);
          } else {
            throw error;
          }
        }

        // Set custom claims
        await auth.setCustomUserClaims(authUser.uid, {
          role: 'student',
          schoolId: SCHOOL_ID
        });

        // Check if student document exists
        const studentQuery = await db.collection('students')
          .where('email', '==', demoStudent.email)
          .where('schoolId', '==', SCHOOL_ID)
          .limit(1)
          .get();

        if (!studentQuery.empty) {
          // Update existing student
          const studentDoc = studentQuery.docs[0];
          await db.collection('students').doc(studentDoc.id).update({
            firstName: demoStudent.firstName,
            lastName: demoStudent.lastName,
            name: `${demoStudent.firstName} ${demoStudent.lastName}`,
            lrn: demoStudent.lrn,
            sectionId: demoStudent.sectionId,
            gradeLevel: demoStudent.gradeLevel,
            isActive: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Update users collection
          await db.collection('users').doc(authUser.uid).set({
            email: demoStudent.email,
            firstName: demoStudent.firstName,
            lastName: demoStudent.lastName,
            name: `${demoStudent.firstName} ${demoStudent.lastName}`,
            role: 'student',
            schoolId: SCHOOL_ID,
            sectionId: demoStudent.sectionId,
            gradeLevel: demoStudent.gradeLevel,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          console.log(`   ✅ Updated: ${demoStudent.firstName} ${demoStudent.lastName} (Grade ${demoStudent.gradeLevel})`);
        } else {
          // Create new student
          const newStudentRef = db.collection('students').doc();
          await newStudentRef.set({
            schoolId: SCHOOL_ID,
            email: demoStudent.email,
            firstName: demoStudent.firstName,
            lastName: demoStudent.lastName,
            name: `${demoStudent.firstName} ${demoStudent.lastName}`,
            lrn: demoStudent.lrn,
            sectionId: demoStudent.sectionId,
            gradeLevel: demoStudent.gradeLevel,
            isActive: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // Create users collection entry
          await db.collection('users').doc(authUser.uid).set({
            email: demoStudent.email,
            firstName: demoStudent.firstName,
            lastName: demoStudent.lastName,
            name: `${demoStudent.firstName} ${demoStudent.lastName}`,
            role: 'student',
            schoolId: SCHOOL_ID,
            sectionId: demoStudent.sectionId,
            gradeLevel: demoStudent.gradeLevel,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log(`   ✅ Created: ${demoStudent.firstName} ${demoStudent.lastName} (Grade ${demoStudent.gradeLevel})`);
        }

        console.log('');
      } catch (error) {
        console.error(`   ❌ Error with ${demoStudent.email}:`, error.message);
      }
    }

    // Step 5: Final summary
    console.log('\n📊 Final Summary:');
    const finalStudents = await db.collection('students')
      .where('schoolId', '==', SCHOOL_ID)
      .get();
    
    const withEmail = finalStudents.docs.filter(doc => doc.data().email).length;
    const withSection = finalStudents.docs.filter(doc => doc.data().sectionId).length;
    
    console.log(`   Total students: ${finalStudents.size}`);
    console.log(`   With email: ${withEmail}`);
    console.log(`   With section: ${withSection}`);
    console.log(`\n✅ Cleanup and demo account creation complete!`);
    console.log('\n📝 Demo Student Accounts:');
    console.log('   Email: juan.delacruz@student.local | Password: student123 | Grade 1');
    console.log('   Email: maria.santos@student.local | Password: student123 | Grade 2');
    console.log('   Email: jose.reyes@student.local | Password: student123 | Grade 3');
    console.log('   Email: ana.garcia@student.local | Password: student123 | Grade 4');
    console.log('   Email: pedro.lopez@student.local | Password: student123 | Grade 5');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

cleanupAndCreateDemoStudents();
