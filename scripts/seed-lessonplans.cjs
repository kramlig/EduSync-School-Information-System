#!/usr/bin/env node
/**
 * Seed script for realistic Lesson Plan data
 * Creates lesson plans for different learning areas and grade levels
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Lesson plan templates by learning area
const LESSON_PLAN_TEMPLATES = {
  'Filipino': [
    {
      title: 'Mga Uri ng Pangngalan',
      objectives: [
        'Matukoy ang iba\'t ibang uri ng pangngalan',
        'Magamit nang wasto ang mga pangngalan sa pangungusap',
        'Makilala ang kahalagahan ng tamang paggamit ng pangngalan'
      ],
      activities: [
        'Pagtingin sa mga halimbawa ng pangngalan mula sa aklat-aralin',
        'Pangkatang gawain: Paghahanay ng mga pangngalan ayon sa uri',
        'Pagbuo ng mga pangungusap gamit ang iba\'t ibang uri ng pangngalan',
        'Paglalaro ng "Pangngalan Bingo" para sa masayang pag-aaral'
      ],
      materials: ['Kartolina', 'Manila paper', 'Markers', 'Aklat-aralin sa Filipino'],
      assessment: [
        'Pagsusulit sa pagtukoy ng uri ng pangngalan (10 items)',
        'Pagbuo ng 5 pangungusap na gumagamit ng iba\'t ibang uri ng pangngalan',
        'Oral participation sa pangkatang gawain'
      ]
    },
    {
      title: 'Pagsulat ng Talata',
      objectives: [
        'Maunawaan ang kahulugan at bahagi ng talata',
        'Makapagsulat ng maayos na talata na may simula, gitna, at wakas',
        'Magamit ang wastong bantas at baybay'
      ],
      activities: [
        'Pagtalakay tungkol sa mga bahagi ng talata',
        'Pagbasa at pagsusuri ng mga halimbawang talata',
        'Pagsusulat ng sariling talata tungkol sa "Ang Aking Paboritong Araw"',
        'Peer editing at pagbabahagi ng mga gawa'
      ],
      materials: ['Writing paper', 'Pencils', 'Halimbawang talata', 'Rubrics'],
      assessment: [
        'Pagsusuri ng nakasulat na talata gamit ang rubrics',
        'Pagcheck ng wastong paggamit ng bantas at baybay',
        'Tsek ng kompletong bahagi ng talata'
      ]
    }
  ],
  'English': [
    {
      title: 'Parts of Speech: Nouns and Verbs',
      objectives: [
        'Identify nouns and verbs in sentences',
        'Understand the function of nouns and verbs in communication',
        'Use nouns and verbs correctly in written and oral expression'
      ],
      activities: [
        'Introduction: Review of parts of speech using visual aids',
        'Guided practice: Identifying nouns and verbs in sample sentences',
        'Group activity: Create sentences using given nouns and verbs',
        'Game: "Noun or Verb?" - Students categorize flashcards'
      ],
      materials: ['Flashcards', 'Whiteboard and markers', 'Worksheets', 'Chart paper'],
      assessment: [
        'Written quiz on identifying nouns and verbs (15 items)',
        'Oral recitation: Students create original sentences',
        'Worksheet completion and accuracy check'
      ]
    },
    {
      title: 'Reading Comprehension: Story Elements',
      objectives: [
        'Identify the elements of a story (characters, setting, plot)',
        'Demonstrate understanding through retelling',
        'Analyze the message or moral of the story'
      ],
      activities: [
        'Read aloud: Teacher reads a short story to the class',
        'Discussion: Identify characters, setting, and main events',
        'Small group work: Create a story map on chart paper',
        'Individual activity: Answer comprehension questions'
      ],
      materials: ['Story book', 'Story map template', 'Chart paper', 'Crayons/markers'],
      assessment: [
        'Story map completion and presentation',
        'Written comprehension questions (10 items)',
        'Participation in group discussion'
      ]
    }
  ],
  'Mathematics': [
    {
      title: 'Addition and Subtraction of Fractions',
      objectives: [
        'Add fractions with similar denominators',
        'Subtract fractions with similar denominators',
        'Solve real-world problems involving fractions'
      ],
      activities: [
        'Review: Concept of fractions using visual aids (pizza, pie charts)',
        'Direct instruction: Steps for adding and subtracting fractions',
        'Guided practice: Solve sample problems together',
        'Independent practice: Students solve worksheet problems',
        'Application: Word problems involving real-life scenarios'
      ],
      materials: ['Fraction strips', 'Whiteboard', 'Worksheets', 'Manipulatives'],
      assessment: [
        'Written test on adding and subtracting fractions (20 items)',
        'Problem-solving task: Solve 5 word problems',
        'Observation during guided practice'
      ]
    },
    {
      title: 'Geometry: Properties of Triangles',
      objectives: [
        'Identify different types of triangles based on sides and angles',
        'Understand the properties of each type of triangle',
        'Measure and classify triangles accurately'
      ],
      activities: [
        'Introduction: Show real-world examples of triangular shapes',
        'Direct teaching: Types of triangles (equilateral, isosceles, scalene)',
        'Hands-on activity: Students measure and classify triangle cutouts',
        'Group work: Create a triangle poster showing all types',
        'Practice: Complete classification worksheet'
      ],
      materials: ['Triangle cutouts', 'Rulers', 'Protractors', 'Poster paper', 'Markers'],
      assessment: [
        'Triangle classification quiz (15 items)',
        'Practical assessment: Measure and classify given triangles',
        'Poster presentation and accuracy evaluation'
      ]
    }
  ],
  'Science': [
    {
      title: 'The Water Cycle',
      objectives: [
        'Describe the stages of the water cycle',
        'Explain how water moves through the environment',
        'Understand the importance of water cycle to life on Earth'
      ],
      activities: [
        'Video presentation: Animation of the water cycle',
        'Discussion: Stages of the water cycle (evaporation, condensation, precipitation)',
        'Demonstration: Simple water cycle experiment using plastic bag',
        'Art activity: Draw and label the water cycle diagram',
        'Group presentation: Explain one stage of the water cycle'
      ],
      materials: ['Video player', 'Plastic bags', 'Water', 'Drawing materials', 'Chart paper'],
      assessment: [
        'Water cycle diagram with labels (graded for accuracy)',
        'Written quiz on stages of water cycle (10 items)',
        'Group presentation rubric'
      ]
    },
    {
      title: 'Plant Parts and Their Functions',
      objectives: [
        'Identify the main parts of a plant (roots, stem, leaves, flowers)',
        'Describe the function of each plant part',
        'Observe and record plant parts in nature'
      ],
      activities: [
        'Nature walk: Observe plants in the school garden',
        'Class discussion: Parts of a plant and their functions',
        'Hands-on activity: Dissect a flowering plant',
        'Labeling activity: Label plant diagram',
        'Creative task: Create a 3D plant model using recyclable materials'
      ],
      materials: ['Real plants', 'Magnifying glasses', 'Plant diagram handout', 'Recyclable materials', 'Glue and scissors'],
      assessment: [
        'Plant diagram labeling quiz (10 items)',
        '3D plant model presentation and accuracy',
        'Observation checklist during nature walk'
      ]
    }
  ],
  'Araling Panlipunan': [
    {
      title: 'Mga Anyong Lupa ng Pilipinas',
      objectives: [
        'Matukoy ang mga pangunahing anyong lupa ng Pilipinas',
        'Maunawaan ang kahalagahan ng bawat anyong lupa',
        'Makilala ang mga lugar na may mga tanyag na anyong lupa'
      ],
      activities: [
        'Pagtingin sa mapa ng Pilipinas at pagtukoy ng mga anyong lupa',
        'Pagtalakay: Bundok, kapatagan, lambak, burol, talampas',
        'Video presentation: Mga tanyag na bundok at kapatagan',
        'Pangkatang gawain: Gumawa ng 3D model ng anyong lupa',
        'Paghahanap sa mapa: I-locate ang mga lugar na nabanggit'
      ],
      materials: ['Mapa ng Pilipinas', 'Video clips', 'Clay o playdough', 'Cartolina', 'Markers'],
      assessment: [
        'Pagsusulit sa pagtukoy ng anyong lupa (15 items)',
        '3D model presentation at accuracy',
        'Map skills: Pagtukoy ng lokasyon sa mapa'
      ]
    },
    {
      title: 'Mga Bayani ng Pilipinas',
      objectives: [
        'Makilala ang mga pangunahing bayani ng Pilipinas',
        'Maunawaan ang kanilang mga ambag sa bayan',
        'Mapahalagahan ang kanilang mga sakripisyo para sa kalayaan'
      ],
      activities: [
        'Pagbabahagi ng mga kuwento tungkol sa mga bayani',
        'Video biography: Buhay ni Jose Rizal',
        'Pangkatang gawain: Research at presentation tungkol sa isang bayani',
        'Creative activity: Gumawa ng "Hero Trading Card"',
        'Reflection: Paano tayo magiging bayani sa ating sariling paraan?'
      ],
      materials: ['Biography books', 'Computer/tablet for research', 'Index cards', 'Art materials', 'Manila paper'],
      assessment: [
        'Hero presentation rubric (content, delivery, creativity)',
        'Trading card design and information accuracy',
        'Written reflection paper (1 paragraph)'
      ]
    }
  ]
};

function getDateString(daysOffset) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(startOffset, endOffset) {
  const randomDays = Math.floor(Math.random() * (endOffset - startOffset + 1)) + startOffset;
  return getDateString(randomDays);
}

async function seedLessonPlans() {
  console.log('🌱 Starting lesson plan data seeding...\n');

  // Initialize Firebase Admin
  try {
    const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
      ? require(process.env.GOOGLE_APPLICATION_CREDENTIALS)
      : null;

    if (!serviceAccount) {
      console.error('❌ Error: GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
      console.log('Please set it to your Firebase service account JSON file path:');
      console.log('  export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"');
      process.exit(1);
    }

    initializeApp({
      credential: cert(serviceAccount),
    });

    console.log('✅ Connected to Firestore\n');
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error.message);
    process.exit(1);
  }

  const db = getFirestore();

  try {
    // Fetch necessary data
    console.log('📚 Fetching sections, learning areas, and teachers...');
    const sectionsSnapshot = await db.collection('sections').get();
    const learningAreasSnapshot = await db.collection('learningAreas').get();
    const teachersSnapshot = await db.collection('users').where('role', '==', 'teacher').get();

    const sections = [];
    sectionsSnapshot.forEach(doc => sections.push({ id: doc.id, ...doc.data() }));

    const learningAreas = [];
    learningAreasSnapshot.forEach(doc => learningAreas.push({ id: doc.id, ...doc.data() }));

    const teachers = [];
    teachersSnapshot.forEach(doc => teachers.push({ id: doc.id, ...doc.data() }));

    console.log(`   Found ${sections.length} sections`);
    console.log(`   Found ${learningAreas.length} learning areas`);
    console.log(`   Found ${teachers.length} teachers\n`);

    if (sections.length === 0 || learningAreas.length === 0) {
      console.error('❌ No sections or learning areas found. Please seed basic data first.');
      process.exit(1);
    }

    let totalPlansCreated = 0;

    // Create lesson plans for each section
    for (const section of sections) {
      console.log(`📝 Creating lesson plans for Grade ${section.gradeLevel} - ${section.name}`);

      // Get learning areas for this grade level
      const teacherForSection = teachers.find(t => 
        t.assignments && t.assignments.some(a => a.gradeLevel === section.gradeLevel)
      );

      if (!teacherForSection) {
        console.log(`   ⚠️  No teacher assigned to Grade ${section.gradeLevel}, skipping...`);
        continue;
      }

      const learningAreasForGrade = learningAreas.filter(la => {
        return teacherForSection.assignments.some(a => 
          a.gradeLevel === section.gradeLevel && a.learningAreaId === la.id
        );
      });

      console.log(`   ${learningAreasForGrade.length} learning areas for this grade`);

      // Create lesson plans for each learning area
      for (const learningArea of learningAreasForGrade) {
        const templates = LESSON_PLAN_TEMPLATES[learningArea.name] || [];
        
        if (templates.length === 0) {
          console.log(`   ⚠️  No templates for ${learningArea.name}, skipping...`);
          continue;
        }

        console.log(`   Creating ${templates.length} lesson plans for ${learningArea.name}...`);

        // Create lesson plans with varied dates (past, present, future)
        for (let i = 0; i < templates.length; i++) {
          const template = templates[i];
          
          // Distribute dates: some past, some present, some future
          let dateOffset;
          if (i === 0) dateOffset = -7; // Last week
          else if (i === 1) dateOffset = 0; // Today
          else if (i === 2) dateOffset = 7; // Next week
          else dateOffset = 14; // Two weeks from now
          
          const lessonPlanData = {
            sectionId: section.id,
            learningAreaId: learningArea.id,
            date: getDateString(dateOffset),
            title: template.title,
            objectives: template.objectives,
            activities: template.activities,
            materials: template.materials,
            assessment: template.assessment,
            resources: [],
            assignmentIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await db.collection('lessonPlans').add(lessonPlanData);
          totalPlansCreated++;
        }
      }

      console.log('');
    }

    console.log('✅ Seeding completed successfully!');
    console.log(`   📊 Created ${totalPlansCreated} lesson plans\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedLessonPlans();
