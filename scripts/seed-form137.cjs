#!/usr/bin/env node
/**
 * Seed Form 137 Sample Data
 * 
 * Creates sample Form 137 (Academic History) records for testing
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'edusync-sis',
  });
}

const db = admin.firestore();

// Sample Form 137 records
const sampleRecords = [
  {
    studentId: '1',
    schoolYear: '2023-2024',
    gradeLevel: 7,
    section: 'Sampaguita',
    lrn: '123456789012',
    studentName: 'Juan Dela Cruz',
    birthDate: '2010-05-15',
    birthPlace: 'Manila, Philippines',
    parentGuardian: 'Maria Dela Cruz',
    adviserName: 'Mrs. Gloria Santos',
    schoolDays: 200,
    daysPresent: 195,
    subjects: [
      {
        name: 'Filipino',
        q1: 88,
        q2: 90,
        q3: 87,
        q4: 89,
        finalRating: 89
      },
      {
        name: 'English',
        q1: 85,
        q2: 87,
        q3: 86,
        q4: 88,
        finalRating: 87
      },
      {
        name: 'Mathematics',
        q1: 82,
        q2: 84,
        q3: 83,
        q4: 85,
        finalRating: 84
      },
      {
        name: 'Science',
        q1: 86,
        q2: 88,
        q3: 87,
        q4: 89,
        finalRating: 88
      },
      {
        name: 'Araling Panlipunan',
        q1: 90,
        q2: 91,
        q3: 89,
        q4: 92,
        finalRating: 91
      },
      {
        name: 'MAPEH',
        q1: 91,
        q2: 92,
        q3: 90,
        q4: 93,
        finalRating: 92
      },
      {
        name: 'TLE',
        q1: 88,
        q2: 89,
        q3: 87,
        q4: 90,
        finalRating: 89
      },
      {
        name: 'ESP/Values Education',
        q1: 93,
        q2: 94,
        q3: 92,
        q4: 95,
        finalRating: 94
      }
    ],
    generalAverage: 89,
    promotionStatus: 'PROMOTED',
    coreValues: {
      markaPagmamahal: 'AO',
      markaPagmamahalNaSaBayan: 'AO',
      markaPagkamakaDiyos: 'SO',
      markaPagkamataoBehaviour: 'SO',
      observedValues: 'Student shows excellent leadership skills and actively participates in class.'
    },
    remarks: 'Promoted to Grade 8',
    createdBy: 'admin@edusync.com',
    updatedBy: 'admin@edusync.com',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    studentId: '2',
    schoolYear: '2023-2024',
    gradeLevel: 7,
    section: 'Rosal',
    lrn: '123456789013',
    studentName: 'Maria Santos',
    birthDate: '2010-08-20',
    birthPlace: 'Quezon City, Philippines',
    parentGuardian: 'Pedro Santos',
    adviserName: 'Mr. Roberto Cruz',
    schoolDays: 200,
    daysPresent: 198,
    subjects: [
      {
        name: 'Filipino',
        q1: 92,
        q2: 93,
        q3: 91,
        q4: 94,
        finalRating: 93
      },
      {
        name: 'English',
        q1: 90,
        q2: 91,
        q3: 89,
        q4: 92,
        finalRating: 91
      },
      {
        name: 'Mathematics',
        q1: 88,
        q2: 89,
        q3: 87,
        q4: 90,
        finalRating: 89
      },
      {
        name: 'Science',
        q1: 91,
        q2: 92,
        q3: 90,
        q4: 93,
        finalRating: 92
      },
      {
        name: 'Araling Panlipunan',
        q1: 93,
        q2: 94,
        q3: 92,
        q4: 95,
        finalRating: 94
      },
      {
        name: 'MAPEH',
        q1: 95,
        q2: 96,
        q3: 94,
        q4: 97,
        finalRating: 96
      },
      {
        name: 'TLE',
        q1: 91,
        q2: 92,
        q3: 90,
        q4: 93,
        finalRating: 92
      },
      {
        name: 'ESP/Values Education',
        q1: 96,
        q2: 97,
        q3: 95,
        q4: 98,
        finalRating: 97
      }
    ],
    generalAverage: 93,
    promotionStatus: 'PROMOTED',
    coreValues: {
      markaPagmamahal: 'AO',
      markaPagmamahalNaSaBayan: 'AO',
      markaPagkamakaDiyos: 'AO',
      markaPagkamataoBehaviour: 'AO',
      observedValues: 'Outstanding student with exemplary behavior and academic performance.'
    },
    remarks: 'Promoted to Grade 8 with Honors',
    createdBy: 'admin@edusync.com',
    updatedBy: 'admin@edusync.com',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    studentId: '3',
    schoolYear: '2023-2024',
    gradeLevel: 8,
    section: 'Gumamela',
    lrn: '123456789014',
    studentName: 'Pedro Reyes',
    birthDate: '2009-03-10',
    birthPlace: 'Caloocan, Philippines',
    parentGuardian: 'Ana Reyes',
    adviserName: 'Ms. Carmen Garcia',
    schoolDays: 200,
    daysPresent: 190,
    subjects: [
      {
        name: 'Filipino',
        q1: 80,
        q2: 82,
        q3: 81,
        q4: 83,
        finalRating: 82
      },
      {
        name: 'English',
        q1: 78,
        q2: 80,
        q3: 79,
        q4: 81,
        finalRating: 80
      },
      {
        name: 'Mathematics',
        q1: 76,
        q2: 78,
        q3: 77,
        q4: 79,
        finalRating: 78
      },
      {
        name: 'Science',
        q1: 79,
        q2: 81,
        q3: 80,
        q4: 82,
        finalRating: 81
      },
      {
        name: 'Araling Panlipunan',
        q1: 82,
        q2: 84,
        q3: 83,
        q4: 85,
        finalRating: 84
      },
      {
        name: 'MAPEH',
        q1: 85,
        q2: 86,
        q3: 84,
        q4: 87,
        finalRating: 86
      },
      {
        name: 'TLE',
        q1: 81,
        q2: 82,
        q3: 80,
        q4: 83,
        finalRating: 82
      },
      {
        name: 'ESP/Values Education',
        q1: 86,
        q2: 87,
        q3: 85,
        q4: 88,
        finalRating: 87
      }
    ],
    generalAverage: 83,
    promotionStatus: 'PROMOTED',
    coreValues: {
      markaPagmamahal: 'SO',
      markaPagmamahalNaSaBayan: 'SO',
      markaPagkamakaDiyos: 'SO',
      markaPagkamataoBehaviour: 'SO',
      observedValues: 'Student needs improvement in attendance and punctuality.'
    },
    remarks: 'Promoted to Grade 9',
    createdBy: 'admin@edusync.com',
    updatedBy: 'admin@edusync.com',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  }
];

async function seedForm137Data() {
  console.log('🌱 Starting Form 137 data seeding...\n');

  try {
    const batch = db.batch();
    let count = 0;

    for (const record of sampleRecords) {
      const docRef = db.collection('form137').doc();
      batch.set(docRef, record);
      count++;
      console.log(`✅ Added record ${count}/${sampleRecords.length}: ${record.studentName} (${record.schoolYear})`);
    }

    await batch.commit();
    console.log(`\n✅ Successfully seeded ${count} Form 137 records!`);
    console.log('\n📊 Summary:');
    console.log(`   - Student 1: Juan Dela Cruz (Grade 7, 89 avg)`);
    console.log(`   - Student 2: Maria Santos (Grade 7, 93 avg)`);
    console.log(`   - Student 3: Pedro Reyes (Grade 8, 83 avg)`);
    console.log('\n🎉 Form 137 seeding complete!\n');
    
  } catch (error) {
    console.error('❌ Error seeding Form 137 data:', error);
    throw error;
  }
}

// Run the seed function
seedForm137Data()
  .then(() => {
    console.log('✅ Seed script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
