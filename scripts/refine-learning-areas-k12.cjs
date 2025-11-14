/**
 * HIGH-LEVEL LEARNING AREAS REFINEMENT
 * Based on Official DepEd K-12 Curriculum Framework
 * 
 * This script comprehensively reorganizes learning areas to match:
 * - Elementary (Grades 1-6): 8 core learning areas
 * - Junior High (Grades 7-10): 8 core learning areas
 * - Senior High (Grades 11-12): Core + Track-specific subjects
 * 
 * Follows DepEd Order No. 21, s. 2019 (K to 12 Basic Education Curriculum)
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'edusync-sis' });
}

const db = admin.firestore();

/**
 * OFFICIAL DepEd K-12 LEARNING AREAS
 * Organized by education level with proper grade level assignments
 */
const LEARNING_AREAS = {
  // ============================================================================
  // ELEMENTARY LEVEL (Grades 1-6)
  // ============================================================================
  elementary: [
    // Grades 1-3: Mother Tongue-Based Multilingual Education (MTB-MLE)
    {
      name: 'Mother Tongue',
      code: 'MT',
      gradeLevel: '1,2,3',
      order: 1,
      description: 'Mother Tongue-Based Multilingual Education (MTB-MLE)',
      category: 'Language'
    },
    // All Elementary Grades (1-6)
    {
      name: 'Filipino',
      code: 'FIL',
      gradeLevel: '1,2,3,4,5,6',
      order: 2,
      description: 'Wikang Filipino',
      category: 'Language'
    },
    {
      name: 'English',
      code: 'ENG',
      gradeLevel: '1,2,3,4,5,6',
      order: 3,
      description: 'English Language',
      category: 'Language'
    },
    {
      name: 'Mathematics',
      code: 'MATH',
      gradeLevel: '1,2,3,4,5,6',
      order: 4,
      description: 'Mathematics',
      category: 'Core'
    },
    {
      name: 'Science',
      code: 'SCI',
      gradeLevel: '3,4,5,6',
      order: 5,
      description: 'Science (Starting Grade 3)',
      category: 'Science'
    },
    {
      name: 'Araling Panlipunan',
      code: 'AP',
      gradeLevel: '1,2,3,4,5,6',
      order: 6,
      description: 'Social Studies',
      category: 'Social Studies'
    },
    {
      name: 'Edukasyon sa Pagpapakatao',
      code: 'ESP',
      gradeLevel: '1,2,3,4,5,6',
      order: 7,
      description: 'Values Education',
      category: 'Values Education'
    },
    {
      name: 'MAPEH',
      code: 'MAPEH',
      gradeLevel: '1,2,3,4,5,6',
      order: 8,
      description: 'Music, Arts, Physical Education, and Health',
      category: 'MAPEH'
    },
    {
      name: 'Edukasyon sa Paghahalaman (EPP)',
      code: 'EPP',
      gradeLevel: '4,5,6',
      order: 9,
      description: 'Edukasyong Pantahanan at Pangkabuhayan / Technology and Livelihood Education',
      category: 'TLE'
    }
  ],

  // ============================================================================
  // JUNIOR HIGH SCHOOL LEVEL (Grades 7-10)
  // ============================================================================
  juniorHigh: [
    {
      name: 'Filipino',
      code: 'FIL',
      gradeLevel: '7,8,9,10',
      order: 10,
      description: 'Wikang Filipino',
      category: 'Language'
    },
    {
      name: 'English',
      code: 'ENG',
      gradeLevel: '7,8,9,10',
      order: 11,
      description: 'English Language',
      category: 'Language'
    },
    {
      name: 'Mathematics',
      code: 'MATH',
      gradeLevel: '7,8,9,10',
      order: 12,
      description: 'Mathematics',
      category: 'Core'
    },
    {
      name: 'Science',
      code: 'SCI',
      gradeLevel: '7,8,9,10',
      order: 13,
      description: 'Science',
      category: 'Science'
    },
    {
      name: 'Araling Panlipunan',
      code: 'AP',
      gradeLevel: '7,8,9,10',
      order: 14,
      description: 'Social Studies / Philippine History, Asian Studies, Economics, World History',
      category: 'Social Studies'
    },
    {
      name: 'Edukasyon sa Pagpapakatao',
      code: 'ESP',
      gradeLevel: '7,8,9,10',
      order: 15,
      description: 'Values Education',
      category: 'Values Education'
    },
    {
      name: 'Technology and Livelihood Education',
      code: 'TLE',
      gradeLevel: '7,8,9,10',
      order: 16,
      description: 'Technology and Livelihood Education',
      category: 'TLE'
    },
    {
      name: 'MAPEH',
      code: 'MAPEH',
      gradeLevel: '7,8,9,10',
      order: 17,
      description: 'Music, Arts, Physical Education, and Health',
      category: 'MAPEH'
    }
  ],

  // ============================================================================
  // SENIOR HIGH SCHOOL - CORE SUBJECTS (Grades 11-12)
  // All SHS students must take these core subjects
  // ============================================================================
  seniorHighCore: [
    // Language Subjects
    {
      name: 'Oral Communication',
      code: 'ORAL_COM',
      gradeLevel: '11',
      order: 20,
      description: 'Grade 11 - First Semester',
      category: 'Core - Language',
      strand: 'All Strands'
    },
    {
      name: 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino',
      code: 'KOM_PAN',
      gradeLevel: '11',
      order: 21,
      description: 'Grade 11 - First Semester',
      category: 'Core - Language',
      strand: 'All Strands'
    },
    {
      name: 'Reading and Writing',
      code: 'READ_WRIT',
      gradeLevel: '11',
      order: 22,
      description: 'Grade 11 - Second Semester',
      category: 'Core - Language',
      strand: 'All Strands'
    },
    {
      name: 'Pagbasa at Pagsusuri ng Iba\'t Ibang Teksto Tungo sa Pananaliksik',
      code: 'PAGBASA',
      gradeLevel: '11',
      order: 23,
      description: 'Grade 11 - Second Semester',
      category: 'Core - Language',
      strand: 'All Strands'
    },
    {
      name: '21st Century Literature from the Philippines and the World',
      code: '21ST_LIT',
      gradeLevel: '11,12',
      order: 24,
      description: 'Grade 11/12',
      category: 'Core - Language',
      strand: 'All Strands'
    },

    // Mathematics Subjects
    {
      name: 'General Mathematics',
      code: 'GEN_MATH',
      gradeLevel: '11',
      order: 25,
      description: 'Grade 11 - First Semester',
      category: 'Core - Mathematics',
      strand: 'All Strands'
    },
    {
      name: 'Statistics and Probability',
      code: 'STAT_PROB',
      gradeLevel: '11',
      order: 26,
      description: 'Grade 11 - Second Semester',
      category: 'Core - Mathematics',
      strand: 'All Strands'
    },

    // Science Subjects
    {
      name: 'Earth and Life Science',
      code: 'EARTH_SCI',
      gradeLevel: '11',
      order: 27,
      description: 'Grade 11 - First Semester',
      category: 'Core - Science',
      strand: 'All Strands'
    },
    {
      name: 'Physical Science',
      code: 'PHYS_SCI',
      gradeLevel: '11',
      order: 28,
      description: 'Grade 11 - Second Semester',
      category: 'Core - Science',
      strand: 'All Strands'
    },

    // Social Sciences
    {
      name: 'Personal Development',
      code: 'PERS_DEV',
      gradeLevel: '11',
      order: 29,
      description: 'Grade 11',
      category: 'Core - Social Sciences',
      strand: 'All Strands'
    },
    {
      name: 'Understanding Culture, Society and Politics',
      code: 'UCSP',
      gradeLevel: '11,12',
      order: 30,
      description: 'Grade 11/12',
      category: 'Core - Social Sciences',
      strand: 'All Strands'
    },
    {
      name: 'Introduction to the Philosophy of the Human Person',
      code: 'PHIL',
      gradeLevel: '12',
      order: 31,
      description: 'Grade 12',
      category: 'Core - Social Sciences',
      strand: 'All Strands'
    },

    // Physical Education and Health
    {
      name: 'Physical Education and Health',
      code: 'PE',
      gradeLevel: '11,12',
      order: 32,
      description: 'Grades 11-12 (All Semesters)',
      category: 'Core - PE & Health',
      strand: 'All Strands'
    },

    // Applied Subjects
    {
      name: 'Empowerment Technologies',
      code: 'EMPTECH',
      gradeLevel: '11',
      order: 33,
      description: 'Grade 11 - ICT',
      category: 'Applied',
      strand: 'All Strands'
    },
    {
      name: 'Entrepreneurship',
      code: 'ENTREP',
      gradeLevel: '12',
      order: 34,
      description: 'Grade 12',
      category: 'Applied',
      strand: 'All Strands'
    },
    {
      name: 'Disaster Readiness and Risk Reduction',
      code: 'DRRR',
      gradeLevel: '11,12',
      order: 35,
      description: 'Grade 11/12',
      category: 'Applied',
      strand: 'All Strands'
    }
  ],

  // ============================================================================
  // SENIOR HIGH SCHOOL - ACADEMIC TRACK: STEM STRAND
  // Science, Technology, Engineering, and Mathematics
  // ============================================================================
  stemStrand: [
    {
      name: 'Pre-Calculus',
      code: 'PRE_CAL',
      gradeLevel: '11',
      order: 40,
      description: 'Grade 11',
      category: 'Specialized - STEM',
      strand: 'STEM'
    },
    {
      name: 'Basic Calculus',
      code: 'CALC',
      gradeLevel: '11,12',
      order: 41,
      description: 'Grade 11/12',
      category: 'Specialized - STEM',
      strand: 'STEM'
    },
    {
      name: 'General Biology 1',
      code: 'GEN_BIO_1',
      gradeLevel: '11',
      order: 42,
      description: 'Grade 11',
      category: 'Specialized - STEM',
      strand: 'STEM'
    },
    {
      name: 'General Biology 2',
      code: 'GEN_BIO_2',
      gradeLevel: '12',
      order: 43,
      description: 'Grade 12',
      category: 'Specialized - STEM',
      strand: 'STEM'
    },
    {
      name: 'General Physics 1',
      code: 'GEN_PHYS_1',
      gradeLevel: '11',
      order: 44,
      description: 'Grade 11',
      category: 'Specialized - STEM',
      strand: 'STEM'
    },
    {
      name: 'General Physics 2',
      code: 'GEN_PHYS_2',
      gradeLevel: '12',
      order: 45,
      description: 'Grade 12',
      category: 'Specialized - STEM',
      strand: 'STEM'
    },
    {
      name: 'General Chemistry 1',
      code: 'GEN_CHEM_1',
      gradeLevel: '11',
      order: 46,
      description: 'Grade 11',
      category: 'Specialized - STEM',
      strand: 'STEM'
    },
    {
      name: 'General Chemistry 2',
      code: 'GEN_CHEM_2',
      gradeLevel: '12',
      order: 47,
      description: 'Grade 12',
      category: 'Specialized - STEM',
      strand: 'STEM'
    }
  ],

  // ============================================================================
  // SENIOR HIGH SCHOOL - ACADEMIC TRACK: ABM STRAND
  // Accountancy, Business, and Management
  // ============================================================================
  abmStrand: [
    {
      name: 'Fundamentals of Accountancy, Business and Management 1',
      code: 'FABM_1',
      gradeLevel: '11',
      order: 50,
      description: 'Grade 11',
      category: 'Specialized - ABM',
      strand: 'ABM'
    },
    {
      name: 'Fundamentals of Accountancy, Business and Management 2',
      code: 'FABM_2',
      gradeLevel: '12',
      order: 51,
      description: 'Grade 12',
      category: 'Specialized - ABM',
      strand: 'ABM'
    },
    {
      name: 'Business Mathematics',
      code: 'BUS_MATH',
      gradeLevel: '11',
      order: 52,
      description: 'Grade 11',
      category: 'Specialized - ABM',
      strand: 'ABM'
    },
    {
      name: 'Business Finance',
      code: 'BUS_FIN',
      gradeLevel: '12',
      order: 53,
      description: 'Grade 12',
      category: 'Specialized - ABM',
      strand: 'ABM'
    },
    {
      name: 'Organization and Management',
      code: 'ORG_MGT',
      gradeLevel: '11',
      order: 54,
      description: 'Grade 11',
      category: 'Specialized - ABM',
      strand: 'ABM'
    },
    {
      name: 'Principles of Marketing',
      code: 'PRIN_MKTG',
      gradeLevel: '12',
      order: 55,
      description: 'Grade 12',
      category: 'Specialized - ABM',
      strand: 'ABM'
    },
    {
      name: 'Applied Economics',
      code: 'APP_ECON',
      gradeLevel: '12',
      order: 56,
      description: 'Grade 12',
      category: 'Specialized - ABM',
      strand: 'ABM'
    },
    {
      name: 'Business Ethics and Social Responsibility',
      code: 'BUS_ETHICS',
      gradeLevel: '12',
      order: 57,
      description: 'Grade 12',
      category: 'Specialized - ABM',
      strand: 'ABM'
    }
  ],

  // ============================================================================
  // SENIOR HIGH SCHOOL - ACADEMIC TRACK: HUMSS STRAND
  // Humanities and Social Sciences
  // ============================================================================
  humssStrand: [
    {
      name: 'Creative Writing',
      code: 'CREAT_WRIT',
      gradeLevel: '11',
      order: 60,
      description: 'Grade 11',
      category: 'Specialized - HUMSS',
      strand: 'HUMSS'
    },
    {
      name: 'Creative Nonfiction',
      code: 'CREAT_NON',
      gradeLevel: '12',
      order: 61,
      description: 'Grade 12',
      category: 'Specialized - HUMSS',
      strand: 'HUMSS'
    },
    {
      name: 'Trends, Networks and Critical Thinking in the 21st Century',
      code: 'TRENDS',
      gradeLevel: '11',
      order: 62,
      description: 'Grade 11',
      category: 'Specialized - HUMSS',
      strand: 'HUMSS'
    },
    {
      name: 'Philippine Politics and Governance',
      code: 'PHIL_POL',
      gradeLevel: '12',
      order: 63,
      description: 'Grade 12',
      category: 'Specialized - HUMSS',
      strand: 'HUMSS'
    },
    {
      name: 'Community Engagement, Solidarity, and Citizenship',
      code: 'COESC',
      gradeLevel: '11,12',
      order: 64,
      description: 'Grade 11/12',
      category: 'Specialized - HUMSS',
      strand: 'HUMSS'
    },
    {
      name: 'World Religions and Belief Systems',
      code: 'WRBS',
      gradeLevel: '11',
      order: 65,
      description: 'Grade 11',
      category: 'Specialized - HUMSS',
      strand: 'HUMSS'
    },
    {
      name: 'Introduction to World Religions and Belief Systems',
      code: 'INTRO_WRBS',
      gradeLevel: '11',
      order: 66,
      description: 'Grade 11',
      category: 'Specialized - HUMSS',
      strand: 'HUMSS'
    },
    {
      name: 'Disciplines and Ideas in the Social Sciences',
      code: 'DISS',
      gradeLevel: '11',
      order: 67,
      description: 'Grade 11',
      category: 'Specialized - HUMSS',
      strand: 'HUMSS'
    },
    {
      name: 'Disciplines and Ideas in the Applied Social Sciences',
      code: 'DIASS',
      gradeLevel: '12',
      order: 68,
      description: 'Grade 12',
      category: 'Specialized - HUMSS',
      strand: 'HUMSS'
    }
  ],

  // ============================================================================
  // SENIOR HIGH SCHOOL - ACADEMIC TRACK: GAS STRAND
  // General Academic Strand (flexible/exploratory)
  // ============================================================================
  gasStrand: [
    {
      name: 'Humanities 1',
      code: 'HUM_1',
      gradeLevel: '11',
      order: 70,
      description: 'Grade 11',
      category: 'Specialized - GAS',
      strand: 'GAS'
    },
    {
      name: 'Humanities 2',
      code: 'HUM_2',
      gradeLevel: '12',
      order: 71,
      description: 'Grade 12',
      category: 'Specialized - GAS',
      strand: 'GAS'
    },
    {
      name: 'Social Science 1',
      code: 'SOC_SCI_1',
      gradeLevel: '11',
      order: 72,
      description: 'Grade 11',
      category: 'Specialized - GAS',
      strand: 'GAS'
    },
    {
      name: 'Social Science 2',
      code: 'SOC_SCI_2',
      gradeLevel: '12',
      order: 73,
      description: 'Grade 12',
      category: 'Specialized - GAS',
      strand: 'GAS'
    },
    {
      name: 'Applied Economics',
      code: 'APP_ECON_GAS',
      gradeLevel: '11',
      order: 74,
      description: 'Grade 11',
      category: 'Specialized - GAS',
      strand: 'GAS'
    },
    {
      name: 'Organization and Management',
      code: 'ORG_MGT_GAS',
      gradeLevel: '11',
      order: 75,
      description: 'Grade 11',
      category: 'Specialized - GAS',
      strand: 'GAS'
    }
  ],

  // ============================================================================
  // SENIOR HIGH SCHOOL - TVL TRACK: ICT STRAND
  // Technical-Vocational-Livelihood: Information and Communications Technology
  // ============================================================================
  tvlICT: [
    {
      name: 'Computer Programming (Java)',
      code: 'COMP_PROG_JAVA',
      gradeLevel: '11,12',
      order: 80,
      description: 'Grades 11-12',
      category: 'TVL - ICT',
      strand: 'TVL-ICT'
    },
    {
      name: 'Computer Programming (Python)',
      code: 'COMP_PROG_PY',
      gradeLevel: '11,12',
      order: 81,
      description: 'Grades 11-12',
      category: 'TVL - ICT',
      strand: 'TVL-ICT'
    },
    {
      name: 'Computer Systems Servicing',
      code: 'COMP_SYS_SERV',
      gradeLevel: '11,12',
      order: 82,
      description: 'Grades 11-12',
      category: 'TVL - ICT',
      strand: 'TVL-ICT'
    },
    {
      name: 'Animation',
      code: 'ANIMATION',
      gradeLevel: '11,12',
      order: 83,
      description: 'Grades 11-12',
      category: 'TVL - ICT',
      strand: 'TVL-ICT'
    }
  ],

  // ============================================================================
  // SENIOR HIGH SCHOOL - TVL TRACK: HOME ECONOMICS STRAND
  // ============================================================================
  tvlHomeEconomics: [
    {
      name: 'Cookery',
      code: 'COOKERY',
      gradeLevel: '11,12',
      order: 90,
      description: 'Grades 11-12',
      category: 'TVL - Home Economics',
      strand: 'TVL-HE'
    },
    {
      name: 'Bread and Pastry Production',
      code: 'BREAD_PASTRY',
      gradeLevel: '11,12',
      order: 91,
      description: 'Grades 11-12',
      category: 'TVL - Home Economics',
      strand: 'TVL-HE'
    },
    {
      name: 'Food and Beverage Services',
      code: 'FBS',
      gradeLevel: '11,12',
      order: 92,
      description: 'Grades 11-12',
      category: 'TVL - Home Economics',
      strand: 'TVL-HE'
    },
    {
      name: 'Housekeeping',
      code: 'HOUSEKEEP',
      gradeLevel: '11,12',
      order: 93,
      description: 'Grades 11-12',
      category: 'TVL - Home Economics',
      strand: 'TVL-HE'
    },
    {
      name: 'Caregiving',
      code: 'CAREGIVE',
      gradeLevel: '11,12',
      order: 94,
      description: 'Grades 11-12',
      category: 'TVL - Home Economics',
      strand: 'TVL-HE'
    },
    {
      name: 'Beauty Care (Nail Care)',
      code: 'BEAUTY_NAIL',
      gradeLevel: '11,12',
      order: 95,
      description: 'Grades 11-12',
      category: 'TVL - Home Economics',
      strand: 'TVL-HE'
    },
    {
      name: 'Beauty Care (Hair Care)',
      code: 'BEAUTY_HAIR',
      gradeLevel: '11,12',
      order: 96,
      description: 'Grades 11-12',
      category: 'TVL - Home Economics',
      strand: 'TVL-HE'
    }
  ],

  // ============================================================================
  // SENIOR HIGH SCHOOL - TVL TRACK: INDUSTRIAL ARTS STRAND
  // ============================================================================
  tvlIndustrialArts: [
    {
      name: 'Automotive Servicing',
      code: 'AUTO_SERV',
      gradeLevel: '11,12',
      order: 100,
      description: 'Grades 11-12',
      category: 'TVL - Industrial Arts',
      strand: 'TVL-IA'
    },
    {
      name: 'Electrical Installation and Maintenance',
      code: 'ELEC_INST',
      gradeLevel: '11,12',
      order: 101,
      description: 'Grades 11-12',
      category: 'TVL - Industrial Arts',
      strand: 'TVL-IA'
    },
    {
      name: 'Electronics',
      code: 'ELECTRONICS',
      gradeLevel: '11,12',
      order: 102,
      description: 'Grades 11-12',
      category: 'TVL - Industrial Arts',
      strand: 'TVL-IA'
    },
    {
      name: 'Plumbing',
      code: 'PLUMBING',
      gradeLevel: '11,12',
      order: 103,
      description: 'Grades 11-12',
      category: 'TVL - Industrial Arts',
      strand: 'TVL-IA'
    },
    {
      name: 'Shielded Metal Arc Welding (SMAW)',
      code: 'SMAW',
      gradeLevel: '11,12',
      order: 104,
      description: 'Grades 11-12',
      category: 'TVL - Industrial Arts',
      strand: 'TVL-IA'
    },
    {
      name: 'Technical Drafting',
      code: 'TECH_DRAFT',
      gradeLevel: '11,12',
      order: 105,
      description: 'Grades 11-12',
      category: 'TVL - Industrial Arts',
      strand: 'TVL-IA'
    },
    {
      name: 'Carpentry',
      code: 'CARPENTRY',
      gradeLevel: '11,12',
      order: 106,
      description: 'Grades 11-12',
      category: 'TVL - Industrial Arts',
      strand: 'TVL-IA'
    },
    {
      name: 'Masonry',
      code: 'MASONRY',
      gradeLevel: '11,12',
      order: 107,
      description: 'Grades 11-12',
      category: 'TVL - Industrial Arts',
      strand: 'TVL-IA'
    }
  ],

  // ============================================================================
  // SENIOR HIGH SCHOOL - ARTS AND DESIGN TRACK
  // ============================================================================
  artsAndDesign: [
    {
      name: 'Contemporary Philippine Arts from the Regions',
      code: 'CPAR',
      gradeLevel: '11',
      order: 110,
      description: 'Grade 11',
      category: 'Arts and Design',
      strand: 'Arts & Design'
    },
    {
      name: 'Media and Information Literacy',
      code: 'MIL',
      gradeLevel: '11',
      order: 111,
      description: 'Grade 11',
      category: 'Arts and Design',
      strand: 'Arts & Design'
    },
    {
      name: 'Physical and Personal Development in the Arts',
      code: 'PPDA',
      gradeLevel: '11',
      order: 112,
      description: 'Grade 11',
      category: 'Arts and Design',
      strand: 'Arts & Design'
    },
    {
      name: 'Development of Design Principles and Elements',
      code: 'DDPE',
      gradeLevel: '11',
      order: 113,
      description: 'Grade 11',
      category: 'Arts and Design',
      strand: 'Arts & Design'
    },
    {
      name: 'Integrating Elements and Principles of Organization',
      code: 'IEPO',
      gradeLevel: '12',
      order: 114,
      description: 'Grade 12',
      category: 'Arts and Design',
      strand: 'Arts & Design'
    }
  ],

  // ============================================================================
  // SENIOR HIGH SCHOOL - SPORTS TRACK
  // ============================================================================
  sports: [
    {
      name: 'Human Movement',
      code: 'HUMAN_MOVE',
      gradeLevel: '11',
      order: 120,
      description: 'Grade 11',
      category: 'Sports',
      strand: 'Sports'
    },
    {
      name: 'Sports Officiating and Activity Management',
      code: 'SPORTS_OFFICIAL',
      gradeLevel: '11',
      order: 121,
      description: 'Grade 11',
      category: 'Sports',
      strand: 'Sports'
    },
    {
      name: 'Fitness and Conditioning',
      code: 'FITNESS_COND',
      gradeLevel: '11',
      order: 122,
      description: 'Grade 11',
      category: 'Sports',
      strand: 'Sports'
    },
    {
      name: 'Sports Psychology',
      code: 'SPORTS_PSYCH',
      gradeLevel: '12',
      order: 123,
      description: 'Grade 12',
      category: 'Sports',
      strand: 'Sports'
    },
    {
      name: 'Safety and First Aid',
      code: 'SAFETY_AID',
      gradeLevel: '12',
      order: 124,
      description: 'Grade 12',
      category: 'Sports',
      strand: 'Sports'
    }
  ]
};

/**
 * Helper function to convert gradeLevel string to number array
 * "7,8,9,10" => [7, 8, 9, 10]
 */
function parseGradeLevels(gradeLevel) {
  if (!gradeLevel) return [];
  return gradeLevel.split(',').map(g => parseInt(g.trim(), 10));
}

/**
 * Main execution function
 */
async function refineLearningAreas() {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║         HIGH-LEVEL LEARNING AREAS REFINEMENT (DepEd K-12)                 ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Delete ALL existing learning areas
    console.log('================================================================================');
    console.log('STEP 1: CLEANING UP OLD LEARNING AREAS');
    console.log('================================================================================\n');

    const existingSnapshot = await db.collection('learningAreas').get();
    console.log(`Found ${existingSnapshot.size} existing learning area documents`);
    
    const batch = db.batch();
    existingSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log('✅ Deleted all old learning areas\n');

    // Step 2: Create comprehensive K-12 learning areas
    console.log('================================================================================');
    console.log('STEP 2: CREATING COMPREHENSIVE K-12 LEARNING AREAS');
    console.log('================================================================================\n');

    let totalCreated = 0;

    // Elementary
    console.log('📚 ELEMENTARY LEVEL (Grades 1-6):');
    console.log('────────────────────────────────────────────────────────────────────────────────');
    for (const area of LEARNING_AREAS.elementary) {
      await db.collection('learningAreas').add({
        ...area,
        gradeLevel: parseGradeLevels(area.gradeLevel), // Convert "1,2,3" to [1, 2, 3]
        level: 'Elementary',
        schoolId: 'default', // MULTI-TENANT: Required for queries
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`  ✓ ${area.name} (Grades ${area.gradeLevel})`);
      totalCreated++;
    }

    // Junior High
    console.log('\n🎓 JUNIOR HIGH SCHOOL LEVEL (Grades 7-10):');
    console.log('────────────────────────────────────────────────────────────────────────────────');
    for (const area of LEARNING_AREAS.juniorHigh) {
      await db.collection('learningAreas').add({
        ...area,
        gradeLevel: parseGradeLevels(area.gradeLevel), // Convert string to array
        level: 'Junior High',
        schoolId: 'default', // MULTI-TENANT: Required for queries
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`  ✓ ${area.name}`);
      totalCreated++;
    }

    // Senior High - Core
    console.log('\n🎯 SENIOR HIGH SCHOOL - CORE SUBJECTS (All Strands):');
    console.log('────────────────────────────────────────────────────────────────────────────────');
    for (const area of LEARNING_AREAS.seniorHighCore) {
      await db.collection('learningAreas').add({
        ...area,
        gradeLevel: parseGradeLevels(area.gradeLevel), // Convert string to array
        level: 'Senior High',
        schoolId: 'default', // MULTI-TENANT: Required for queries
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`  ✓ ${area.name} (${area.description})`);
      totalCreated++;
    }

    // STEM Strand
    console.log('\n🔬 SENIOR HIGH SCHOOL - STEM STRAND:');
    console.log('────────────────────────────────────────────────────────────────────────────────');
    for (const area of LEARNING_AREAS.stemStrand) {
      await db.collection('learningAreas').add({
        ...area,
        gradeLevel: parseGradeLevels(area.gradeLevel), // Convert string to array
        level: 'Senior High',
        track: 'Academic',
        schoolId: 'default', // MULTI-TENANT: Required for queries
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`  ✓ ${area.name}`);
      totalCreated++;
    }

    // ABM Strand
    console.log('\n💼 SENIOR HIGH SCHOOL - ABM STRAND:');
    console.log('────────────────────────────────────────────────────────────────────────────────');
    for (const area of LEARNING_AREAS.abmStrand) {
      await db.collection('learningAreas').add({
        ...area,
        gradeLevel: parseGradeLevels(area.gradeLevel), // Convert string to array
        level: 'Senior High',
        track: 'Academic',
        schoolId: 'default', // MULTI-TENANT: Required for queries
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`  ✓ ${area.name}`);
      totalCreated++;
    }

    // HUMSS Strand
    console.log('\n📖 SENIOR HIGH SCHOOL - HUMSS STRAND:');
    console.log('────────────────────────────────────────────────────────────────────────────────');
    for (const area of LEARNING_AREAS.humssStrand) {
      await db.collection('learningAreas').add({
        ...area,
        gradeLevel: parseGradeLevels(area.gradeLevel), // Convert string to array
        level: 'Senior High',
        track: 'Academic',
        schoolId: 'default', // MULTI-TENANT: Required for queries
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`  ✓ ${area.name}`);
      totalCreated++;
    }

    // GAS Strand
    console.log('\n🌐 SENIOR HIGH SCHOOL - GAS STRAND:');
    console.log('────────────────────────────────────────────────────────────────────────────────');
    for (const area of LEARNING_AREAS.gasStrand) {
      await db.collection('learningAreas').add({
        ...area,
        gradeLevel: parseGradeLevels(area.gradeLevel), // Convert string to array
        level: 'Senior High',
        track: 'Academic',
        schoolId: 'default', // MULTI-TENANT: Required for queries
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`  ✓ ${area.name}`);
      totalCreated++;
    }

    // TVL - ICT
    console.log('\n💻 SENIOR HIGH SCHOOL - TVL: ICT STRAND:');
    console.log('────────────────────────────────────────────────────────────────────────────────');
    for (const area of LEARNING_AREAS.tvlICT) {
      await db.collection('learningAreas').add({
        ...area,
        gradeLevel: parseGradeLevels(area.gradeLevel), // Convert string to array
        level: 'Senior High',
        track: 'TVL',
        schoolId: 'default', // MULTI-TENANT: Required for queries
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`  ✓ ${area.name}`);
      totalCreated++;
    }

    // TVL - Home Economics
    console.log('\n🍳 SENIOR HIGH SCHOOL - TVL: HOME ECONOMICS STRAND:');
    console.log('────────────────────────────────────────────────────────────────────────────────');
    for (const area of LEARNING_AREAS.tvlHomeEconomics) {
      await db.collection('learningAreas').add({
        ...area,
        gradeLevel: parseGradeLevels(area.gradeLevel), // Convert string to array
        level: 'Senior High',
        track: 'TVL',
        schoolId: 'default', // MULTI-TENANT: Required for queries
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`  ✓ ${area.name}`);
      totalCreated++;
    }

    // TVL - Industrial Arts
    console.log('\n🔧 SENIOR HIGH SCHOOL - TVL: INDUSTRIAL ARTS STRAND:');
    console.log('────────────────────────────────────────────────────────────────────────────────');
    for (const area of LEARNING_AREAS.tvlIndustrialArts) {
      await db.collection('learningAreas').add({
        ...area,
        gradeLevel: parseGradeLevels(area.gradeLevel), // Convert string to array
        level: 'Senior High',
        track: 'TVL',
        schoolId: 'default', // MULTI-TENANT: Required for queries
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`  ✓ ${area.name}`);
      totalCreated++;
    }

    // Arts and Design
    console.log('\n🎨 SENIOR HIGH SCHOOL - ARTS AND DESIGN TRACK:');
    console.log('────────────────────────────────────────────────────────────────────────────────');
    for (const area of LEARNING_AREAS.artsAndDesign) {
      await db.collection('learningAreas').add({
        ...area,
        gradeLevel: parseGradeLevels(area.gradeLevel), // Convert string to array
        level: 'Senior High',
        track: 'Arts & Design',
        schoolId: 'default', // MULTI-TENANT: Required for queries
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`  ✓ ${area.name}`);
      totalCreated++;
    }

    // Sports
    console.log('\n⚽ SENIOR HIGH SCHOOL - SPORTS TRACK:');
    console.log('────────────────────────────────────────────────────────────────────────────────');
    for (const area of LEARNING_AREAS.sports) {
      await db.collection('learningAreas').add({
        ...area,
        gradeLevel: parseGradeLevels(area.gradeLevel), // Convert string to array
        level: 'Senior High',
        track: 'Sports',
        schoolId: 'default', // MULTI-TENANT: Required for queries
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`  ✓ ${area.name}`);
      totalCreated++;
    }

    console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                          REFINEMENT COMPLETE!                              ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

    console.log('📊 SUMMARY:');
    console.log(`   • Total Learning Areas Created: ${totalCreated}`);
    console.log(`   • Elementary (Grades 1-6): ${LEARNING_AREAS.elementary.length} subjects`);
    console.log(`   • Junior High (Grades 7-10): ${LEARNING_AREAS.juniorHigh.length} subjects`);
    console.log(`   • Senior High Core: ${LEARNING_AREAS.seniorHighCore.length} subjects`);
    console.log(`   • STEM Strand: ${LEARNING_AREAS.stemStrand.length} subjects`);
    console.log(`   • ABM Strand: ${LEARNING_AREAS.abmStrand.length} subjects`);
    console.log(`   • HUMSS Strand: ${LEARNING_AREAS.humssStrand.length} subjects`);
    console.log(`   • GAS Strand: ${LEARNING_AREAS.gasStrand.length} subjects`);
    console.log(`   • TVL-ICT: ${LEARNING_AREAS.tvlICT.length} subjects`);
    console.log(`   • TVL-Home Economics: ${LEARNING_AREAS.tvlHomeEconomics.length} subjects`);
    console.log(`   • TVL-Industrial Arts: ${LEARNING_AREAS.tvlIndustrialArts.length} subjects`);
    console.log(`   • Arts & Design: ${LEARNING_AREAS.artsAndDesign.length} subjects`);
    console.log(`   • Sports: ${LEARNING_AREAS.sports.length} subjects`);
    console.log('\n✅ Learning areas are now properly organized by DepEd K-12 curriculum!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Execute
refineLearningAreas();
