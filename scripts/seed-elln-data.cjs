/**
 * Seed ELLN Assessment Data
 * Creates realistic ELLN assessments for K-3 students across all quarters
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Connect to emulators
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9100';

const app = initializeApp({ projectId: 'edusync-local' });
const db = getFirestore();

// Proficiency level calculator
function calculateProficiencyLevel(score) {
  if (score >= 90) return 'Advanced';
  if (score >= 80) return 'Proficient';
  if (score >= 65) return 'Approaching Proficiency';
  if (score >= 50) return 'Developing';
  return 'Beginning';
}

// Generate realistic scores with some variance and progression
function generateDomainScores(quarter, baseLevel = 'average') {
  // Base scores by level
  const baseLevels = {
    struggling: { min: 40, max: 60 },
    developing: { min: 55, max: 70 },
    average: { min: 65, max: 80 },
    advanced: { min: 80, max: 95 },
  };

  const level = baseLevels[baseLevel];
  const progression = (quarter - 1) * 5; // Students improve ~5 points per quarter

  // Generate scores with slight variation per domain
  const scores = {
    // Literacy domains
    oralLanguage: Math.min(100, Math.floor(Math.random() * (level.max - level.min) + level.min + progression + Math.random() * 5)),
    phonologicalAwareness: Math.min(100, Math.floor(Math.random() * (level.max - level.min) + level.min + progression + Math.random() * 5)),
    bookAndPrintKnowledge: Math.min(100, Math.floor(Math.random() * (level.max - level.min) + level.min + progression + Math.random() * 5)),
    alphabetKnowledge: Math.min(100, Math.floor(Math.random() * (level.max - level.min) + level.min + progression + Math.random() * 5)),
    phonics: Math.min(100, Math.floor(Math.random() * (level.max - level.min) + level.min + progression + Math.random() * 5)),
    comprehension: Math.min(100, Math.floor(Math.random() * (level.max - level.min) + level.min + progression + Math.random() * 5)),
    
    // Numeracy domains
    numberSense: Math.min(100, Math.floor(Math.random() * (level.max - level.min) + level.min + progression + Math.random() * 5)),
    measurement: Math.min(100, Math.floor(Math.random() * (level.max - level.min) + level.min + progression + Math.random() * 5)),
    geometry: Math.min(100, Math.floor(Math.random() * (level.max - level.min) + level.min + progression + Math.random() * 5)),
    patterns: Math.min(100, Math.floor(Math.random() * (level.max - level.min) + level.min + progression + Math.random() * 5)),
    dataAnalysis: Math.min(100, Math.floor(Math.random() * (level.max - level.min) + level.min + progression + Math.random() * 5)),
  };

  return scores;
}

function calculateAverages(scores) {
  const literacyScores = [
    scores.oralLanguage,
    scores.phonologicalAwareness,
    scores.bookAndPrintKnowledge,
    scores.alphabetKnowledge,
    scores.phonics,
    scores.comprehension,
  ];

  const numeracyScores = [
    scores.numberSense,
    scores.measurement,
    scores.geometry,
    scores.patterns,
    scores.dataAnalysis,
  ];

  const literacyScore = Math.round(literacyScores.reduce((a, b) => a + b, 0) / literacyScores.length);
  const numeracyScore = Math.round(numeracyScores.reduce((a, b) => a + b, 0) / numeracyScores.length);
  const overallScore = Math.round((literacyScore + numeracyScore) / 2);

  return { literacyScore, numeracyScore, overallScore };
}

// Sample teacher notes based on performance
const teacherNotes = [
  'Student shows steady progress in all literacy domains.',
  'Excellent improvement in phonological awareness this quarter.',
  'Student needs additional support in comprehension skills.',
  'Strong number sense and pattern recognition abilities.',
  'Recommend continued practice with alphabet knowledge.',
  'Outstanding performance across all domains.',
  'Student would benefit from one-on-one reading support.',
  'Great progress in measurement and geometry concepts.',
  'Shows enthusiasm for learning. Continue current strategies.',
  'Recommend parent involvement in reading at home.',
];

const recommendations = [
  'Continue current instructional strategies.',
  'Provide additional phonics practice activities.',
  'Implement small group reading sessions.',
  'Use manipulatives for math concept reinforcement.',
  'Schedule follow-up assessment next month.',
  'Consider peer tutoring opportunities.',
  'Engage parents with home learning activities.',
  'Increase exposure to diverse reading materials.',
  'Focus on building number sense through games.',
  'Monitor progress closely and adjust instruction as needed.',
];

async function seedELLNData() {
  console.log('🌱 Starting ELLN Assessment data seeding...\n');

  try {
    // Get any school year (prefer current, but fallback to first available)
    let schoolYearsSnapshot = await db.collection('schoolYears')
      .where('isCurrent', '==', true)
      .limit(1)
      .get();

    if (schoolYearsSnapshot.empty) {
      console.log('⚠️  No current school year found, using first available...');
      schoolYearsSnapshot = await db.collection('schoolYears')
        .limit(1)
        .get();
    }

    if (schoolYearsSnapshot.empty) {
      console.error('❌ No school year found in database');
      return;
    }

    const schoolYear = schoolYearsSnapshot.docs[0].data();
    const schoolYearId = schoolYearsSnapshot.docs[0].id;
    console.log(`📅 Using school year: ${schoolYear.year || schoolYearId}`);

    // Get all sections (they have schoolYear field, not schoolYearId)
    const sectionsSnapshot = await db.collection('sections')
      .where('schoolYear', '==', schoolYearId)
      .get();

    const sections = sectionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`🏫 Found ${sections.length} sections`);

    // Get K-3 students only (gradeLevel 0-3)
    const k3Sections = sections.filter(s => s.gradeLevel >= 0 && s.gradeLevel <= 3);
    console.log(`👶 K-3 Sections: ${k3Sections.length}`);
    
    // If no K-3 sections, use all sections for demo (the seeded data has Grade 7-8)
    const sectionsToUse = k3Sections.length > 0 ? k3Sections : sections;
    console.log(`📋 Using ${sectionsToUse.length} sections for ELLN data\n`);

    let totalAssessments = 0;
    const batch = db.batch();
    let batchCount = 0;

    for (const section of sectionsToUse) {
      // Get students in this section
      const studentsSnapshot = await db.collection('students')
        .where('sectionId', '==', section.id)
        .get();

      const students = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`\n📚 Section: ${section.name} (Grade ${section.gradeLevel}) - ${students.length} students`);

      // Assign performance levels to students for variety
      const performanceLevels = ['struggling', 'developing', 'average', 'average', 'advanced'];

      for (const student of students) {
        // Random performance level (more students in average category)
        const performanceLevel = performanceLevels[Math.floor(Math.random() * performanceLevels.length)];

        // Create assessments for Q1, Q2, and Q3 (Q4 in progress)
        for (let quarter = 1; quarter <= 3; quarter++) {
          const quarterName = `q${quarter}`;
          const scores = generateDomainScores(quarter, performanceLevel);
          const averages = calculateAverages(scores);

          const assessmentData = {
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            lrn: student.lrn,
            sectionId: section.id,
            sectionName: section.name,
            gradeLevel: section.gradeLevel,
            schoolYearId: schoolYearId,
            schoolYear: schoolYear.year || schoolYearId,
            quarter: quarterName,
            
            // Literacy domains
            oralLanguage: scores.oralLanguage,
            phonologicalAwareness: scores.phonologicalAwareness,
            bookAndPrintKnowledge: scores.bookAndPrintKnowledge,
            alphabetKnowledge: scores.alphabetKnowledge,
            phonics: scores.phonics,
            comprehension: scores.comprehension,
            
            // Numeracy domains
            numberSense: scores.numberSense,
            measurement: scores.measurement,
            geometry: scores.geometry,
            patterns: scores.patterns,
            dataAnalysis: scores.dataAnalysis,
            
            // Calculated scores
            literacyScore: averages.literacyScore,
            numeracyScore: averages.numeracyScore,
            overallScore: averages.overallScore,
            proficiencyLevel: calculateProficiencyLevel(averages.overallScore),
            
            // Additional info
            assessmentDate: new Date(`2024-${quarter * 3 - 1}-15`), // Spread across school year
            teacherNotes: teacherNotes[Math.floor(Math.random() * teacherNotes.length)],
            recommendations: recommendations[Math.floor(Math.random() * recommendations.length)],
            
            // Metadata
            assessedBy: 'admin@edusync.local',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const docRef = db.collection('ellnAssessments').doc();
          batch.set(docRef, assessmentData);
          batchCount++;
          totalAssessments++;

          // Commit batch every 500 documents
          if (batchCount >= 500) {
            await batch.commit();
            console.log(`   ✓ Committed ${batchCount} assessments`);
            batchCount = 0;
          }
        }
      }

      console.log(`   ✅ Created 3 quarters of assessments for ${students.length} students`);
    }

    // Commit remaining documents
    if (batchCount > 0) {
      await batch.commit();
      console.log(`   ✓ Committed final ${batchCount} assessments`);
    }

    console.log('\n============================================================');
    console.log('✨ ELLN ASSESSMENT DATA SEEDING COMPLETE!');
    console.log('============================================================\n');
    console.log('📊 Summary:');
    console.log(`   • Total Students: ${sectionsToUse.length * 10} (across ${sectionsToUse.length} sections)`);
    console.log(`   • Quarters Seeded: Q1, Q2, Q3`);
    console.log(`   • Total Assessments Created: ${totalAssessments}`);
    console.log(`   • Performance Levels: Mixed (struggling to advanced)`);
    console.log(`   • Average Scores: Realistic progression across quarters\n`);
    console.log('🔍 Test the data:');
    console.log('   • Navigate to http://127.0.0.1:5173/forms/elln/assessment');
    console.log('   • View results at http://127.0.0.1:5173/forms/elln/results');
    console.log('   • Check reports at http://127.0.0.1:5173/forms/elln/reports\n');

  } catch (error) {
    console.error('❌ Error seeding ELLN data:', error);
    throw error;
  }
}

// Run the seed function
seedELLNData()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
