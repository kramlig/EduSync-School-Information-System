#!/usr/bin/env node
/**
 * Seed script for realistic Assignment data
 * Creates assignments, submissions, and grades for testing
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Assignment templates by learning area
const ASSIGNMENT_TEMPLATES = {
  'Filipino': [
    { title: 'Pagsulat ng Sanaysay: Ang Aking Pamilya', description: 'Sumulat ng isang maikling sanaysay tungkol sa inyong pamilya (300-500 salita)', points: 50, daysFromNow: 7 },
    { title: 'Pagbasa at Pagsusuri ng Tula', description: 'Basahin ang tulang "Sa Aking Mga Kabata" at sagutin ang mga tanong', points: 30, daysFromNow: 5 },
    { title: 'Talumpati: Kahalagahan ng Edukasyon', description: 'Maghanda ng 3-5 minutong talumpati', points: 40, daysFromNow: 14 },
    { title: 'Pagsulat ng Liham Pormal', description: 'Sumulat ng liham sa Punong Guro tungkol sa proyekto ng klase', points: 25, daysFromNow: -3 }, // Past due
  ],
  'English': [
    { title: 'Book Report: "The Little Prince"', description: 'Write a comprehensive book report (500 words minimum)', points: 50, daysFromNow: 10 },
    { title: 'Grammar Quiz: Tenses and Subject-Verb Agreement', description: 'Complete the online quiz covering present, past, and future tenses', points: 30, daysFromNow: 3 },
    { title: 'Creative Writing: Short Story', description: 'Write a short story with a moral lesson (800-1000 words)', points: 60, daysFromNow: 21 },
    { title: 'Poetry Analysis: "The Road Not Taken"', description: 'Analyze the poem and submit a 2-page essay', points: 40, daysFromNow: -5 }, // Past due
  ],
  'Mathematics': [
    { title: 'Problem Set: Fractions and Decimals', description: 'Solve problems 1-30 on pages 45-48 of your textbook', points: 40, daysFromNow: 4 },
    { title: 'Geometry Quiz: Angles and Triangles', description: 'Online quiz covering angles, triangle properties, and congruence', points: 30, daysFromNow: 2 },
    { title: 'Project: Real-World Math Applications', description: 'Create a poster showing how math is used in everyday life', points: 50, daysFromNow: 14 },
    { title: 'Algebra Practice: Linear Equations', description: 'Complete worksheet on solving linear equations', points: 35, daysFromNow: -2 }, // Past due
  ],
  'Science': [
    { title: 'Lab Report: Plant Cell Observation', description: 'Write a detailed lab report with observations and drawings', points: 50, daysFromNow: 7 },
    { title: 'Research Assignment: Renewable Energy', description: 'Research and present one type of renewable energy (solar, wind, hydro)', points: 40, daysFromNow: 14 },
    { title: 'Science Quiz: Human Body Systems', description: 'Quiz covering digestive, respiratory, and circulatory systems', points: 30, daysFromNow: 5 },
    { title: 'Experiment Report: Volcano Model', description: 'Submit photos and explanation of your volcano model', points: 45, daysFromNow: -4 }, // Past due
  ],
  'Araling Panlipunan': [
    { title: 'Mapa ng Pilipinas: Mga Rehiyon', description: 'Gumawa ng mapa na nagpapakita ng 17 rehiyon ng Pilipinas', points: 40, daysFromNow: 10 },
    { title: 'Timeline ng Rebolusyong Pilipino', description: 'Lumikha ng timeline mula 1896-1898 na may mga larawan', points: 50, daysFromNow: 14 },
    { title: 'Pagsusulit: Kasaysayan ng Pilipinas', description: 'Pagsusulit sa unang 5 kabanata ng ating libro', points: 30, daysFromNow: 3 },
    { title: 'Talaan ng mga Bayani', description: 'Magsaliksik at gumawa ng portfolio ng tatlong Pilipinong bayani', points: 45, daysFromNow: -6 }, // Past due
  ],
};

// Status simulation for realistic data
const SUBMISSION_SCENARIOS = [
  { submitted: true, graded: true, scorePercent: 0.95 },  // Excellent
  { submitted: true, graded: true, scorePercent: 0.88 },  // Good
  { submitted: true, graded: true, scorePercent: 0.75 },  // Passing
  { submitted: true, graded: false, scorePercent: null }, // Submitted, not graded yet
  { submitted: false, graded: false, scorePercent: null }, // Not submitted
];

// Realistic feedback templates
const FEEDBACK_TEMPLATES = {
  excellent: [
    'Excellent work! Your analysis is thorough and well-written.',
    'Outstanding! You clearly understand the concept.',
    'Great job! Your creativity and effort really show.',
    'Perfect! This exceeds expectations.',
  ],
  good: [
    'Good work! There\'s room for improvement in organization.',
    'Well done! Pay attention to grammar in your next submission.',
    'Nice effort! Consider adding more examples next time.',
    'Good job! Make sure to cite your sources properly.',
  ],
  passing: [
    'Passing work. Please review the rubric carefully.',
    'Acceptable. Work on improving your analysis.',
    'Meets minimum requirements. Try to submit earlier next time.',
    'Passing grade. Consider revising before final submission.',
  ],
};

function getDateString(daysOffset) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getScoreAndFeedback(points, scenario) {
  if (!scenario.graded) return { score: null, feedback: null };
  
  const score = Math.round(points * scenario.scorePercent);
  let feedbackCategory;
  
  if (scenario.scorePercent >= 0.9) feedbackCategory = 'excellent';
  else if (scenario.scorePercent >= 0.8) feedbackCategory = 'good';
  else feedbackCategory = 'passing';
  
  const feedback = getRandomElement(FEEDBACK_TEMPLATES[feedbackCategory]);
  
  return { score, feedback };
}

async function seedAssignments() {
  console.log('🌱 Starting assignment data seeding...');
  
  // Initialize Firebase Admin
  let app, db;
  try {
    // Check if GOOGLE_APPLICATION_CREDENTIALS is set
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!serviceAccountPath) {
      console.error('❌ GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
      console.log('   Set it to your service account JSON file path:');
      console.log('   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"');
      process.exit(1);
    }

    app = initializeApp({
      credential: cert(require(serviceAccountPath)),
      projectId: 'edusync-sis',
    });
    db = getFirestore(app);
    console.log('✅ Connected to Firestore');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
    process.exit(1);
  }

  try {
    // Fetch required data
    console.log('📚 Fetching sections, learning areas, students, and teachers...');
    
    const sectionsSnap = await db.collection('sections').get();
    const learningAreasSnap = await db.collection('learningAreas').get();
    const studentsSnap = await db.collection('students').get();
    const usersSnap = await db.collection('users').where('role', '==', 'teacher').get();
    
    const sections = sectionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const learningAreas = learningAreasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const students = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const teachers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`   Found ${sections.length} sections`);
    console.log(`   Found ${learningAreas.length} learning areas`);
    console.log(`   Found ${students.length} students`);
    console.log(`   Found ${teachers.length} teachers`);
    
    if (sections.length === 0 || learningAreas.length === 0 || students.length === 0) {
      console.error('❌ Missing required data. Please seed sections, learning areas, and students first.');
      process.exit(1);
    }

    // Create a map of learning area name to ID
    const laNameToId = {};
    learningAreas.forEach(la => {
      laNameToId[la.name] = la.id;
    });

    let assignmentCount = 0;
    let gradeCount = 0;
    
    // Create assignments for each section
    for (const section of sections) {
      console.log(`\n📝 Creating assignments for Grade ${section.gradeLevel} - ${section.name}`);
      
      // Get students in this section
      const sectionStudents = students.filter(s => s.sectionId === section.id);
      console.log(`   ${sectionStudents.length} students in this section`);
      
      // Create assignments for each learning area that has templates
      for (const [laName, templates] of Object.entries(ASSIGNMENT_TEMPLATES)) {
        const laId = laNameToId[laName];
        if (!laId) {
          console.log(`   ⚠️  Skipping ${laName} - learning area not found in database`);
          continue;
        }
        
        console.log(`   Creating ${templates.length} assignments for ${laName}...`);
        
        for (const template of templates) {
          // Create assignment
          const assignmentRef = db.collection('assignments').doc();
          const assignmentData = {
            id: assignmentRef.id,
            title: template.title,
            description: template.description,
            sectionId: section.id,
            learningAreaId: laId,
            totalPoints: template.points,
            dueDate: getDateString(template.daysFromNow),
            createdAt: FieldValue.serverTimestamp(),
          };
          
          await assignmentRef.set(assignmentData);
          assignmentCount++;
          
          // Create student grades (varied scenarios)
          for (const student of sectionStudents) {
            const scenario = getRandomElement(SUBMISSION_SCENARIOS);
            const { score, feedback } = getScoreAndFeedback(template.points, scenario);
            
            const gradeData = {
              studentId: student.id,
              assignmentId: assignmentRef.id,
              score: score,
              feedback: feedback,
              submissionDate: scenario.submitted ? getDateString(Math.floor(Math.random() * template.daysFromNow)) : null,
              filePath: scenario.submitted ? `uploads/${student.id}/${assignmentRef.id}_submission.pdf` : null,
            };
            
            const gradeRef = db.collection('studentAssignmentGrades').doc(`${student.id}_${assignmentRef.id}`);
            await gradeRef.set(gradeData);
            gradeCount++;
          }
        }
      }
    }
    
    console.log('\n✅ Seeding completed successfully!');
    console.log(`   📊 Created ${assignmentCount} assignments`);
    console.log(`   📈 Created ${gradeCount} student grades`);
    console.log('\n💡 Tips:');
    console.log('   - Past due assignments (negative days) show "Late" status');
    console.log('   - Submitted but not graded assignments show "Submitted" status');
    console.log('   - Graded assignments show scores and feedback');
    console.log('   - Not submitted assignments show "Not Submitted" status');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run the seed function
seedAssignments()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
