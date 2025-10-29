/**
 * Subject Definitions for Different Grade Levels
 * Based on DepEd K-12 Curriculum
 */

export interface SubjectDefinition {
  id: string;
  name: string;
  category?: string;
}

// ============================================================================
// ELEMENTARY (Grades 1-6)
// ============================================================================

export const ELEMENTARY_SUBJECTS: SubjectDefinition[] = [
  { id: 'FIL', name: 'Filipino', category: 'Language' },
  { id: 'ENG', name: 'English', category: 'Language' },
  { id: 'MATH', name: 'Mathematics', category: 'Core' },
  { id: 'SCI', name: 'Science', category: 'Core' },
  { id: 'AP', name: 'Araling Panlipunan', category: 'Core' },
  { id: 'EPP', name: 'Edukasyon sa Pagpapakatao (EPP/TLE)', category: 'Core' },
  { id: 'MUSIC', name: 'Music', category: 'MAPEH' },
  { id: 'ARTS', name: 'Arts', category: 'MAPEH' },
  { id: 'PE', name: 'Physical Education', category: 'MAPEH' },
  { id: 'HEALTH', name: 'Health', category: 'MAPEH' }
];

// ============================================================================
// JUNIOR HIGH SCHOOL (Grades 7-10)
// ============================================================================

export const JUNIOR_HIGH_SUBJECTS: SubjectDefinition[] = [
  // Core Subjects
  { id: 'FIL', name: 'Filipino', category: 'Language' },
  { id: 'ENG', name: 'English', category: 'Language' },
  { id: 'MATH', name: 'Mathematics', category: 'Core' },
  { id: 'SCI', name: 'Science', category: 'Core' },
  { id: 'AP', name: 'Araling Panlipunan (AP)', category: 'Core' },
  { id: 'TLE', name: 'Technology and Livelihood Education (TLE)', category: 'Applied' },
  
  // MAPEH
  { id: 'MUSIC', name: 'Music', category: 'MAPEH' },
  { id: 'ARTS', name: 'Arts', category: 'MAPEH' },
  { id: 'PE', name: 'Physical Education', category: 'MAPEH' },
  { id: 'HEALTH', name: 'Health', category: 'MAPEH' },
  
  // Values Education
  { id: 'EsP', name: 'Edukasyon sa Pagpapakatao (EsP)', category: 'Values' }
];

// ============================================================================
// SENIOR HIGH SCHOOL - CORE SUBJECTS (All Tracks)
// ============================================================================

export const SHS_CORE_SUBJECTS: SubjectDefinition[] = [
  // Languages
  { id: 'ORAL_COM', name: 'Oral Communication', category: 'Language' },
  { id: 'READ_WRITE', name: 'Reading and Writing', category: 'Language' },
  { id: 'KOMUN_FIL', name: 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino', category: 'Language' },
  { id: 'PAGBASA', name: 'Pagbasa at Pagsusuri ng Iba\'t Ibang Teksto Tungo sa Pananaliksik', category: 'Language' },
  { id: '21ST_LIT', name: '21st Century Literature from the Philippines and the World', category: 'Language' },
  
  // Mathematics
  { id: 'GEN_MATH', name: 'General Mathematics', category: 'Mathematics' },
  { id: 'STAT_PROB', name: 'Statistics and Probability', category: 'Mathematics' },
  
  // Science
  { id: 'EARTH_SCI', name: 'Earth and Life Science', category: 'Science' },
  { id: 'PHYS_SCI', name: 'Physical Science', category: 'Science' },
  
  // Social Sciences
  { id: 'PERDEV', name: 'Personal Development', category: 'Social Science' },
  { id: 'UNDER_SELF', name: 'Understanding the Self', category: 'Social Science' },
  { id: 'PHIL_HIST', name: 'Readings in Philippine History', category: 'Social Science' },
  { id: 'CONTEMP_WORLD', name: 'The Contemporary World', category: 'Social Science' },
  
  // Applied Subjects
  { id: 'MEDIA_INFO_LIT', name: 'Media and Information Literacy', category: 'Applied' },
  { id: 'EMPTECH', name: 'Empowerment Technologies', category: 'Applied' },
  
  // PE & Health
  { id: 'PE_11', name: 'Physical Education and Health 11', category: 'PE & Health' },
  { id: 'PE_12', name: 'Physical Education and Health 12', category: 'PE & Health' }
];

// ============================================================================
// SENIOR HIGH SCHOOL - ACADEMIC TRACK - STEM STRAND
// ============================================================================

export const SHS_STEM_SUBJECTS: SubjectDefinition[] = [
  // Core Specialized Subjects
  { id: 'PRE_CALC', name: 'Pre-Calculus', category: 'STEM Specialized' },
  { id: 'BASIC_CALC', name: 'Basic Calculus', category: 'STEM Specialized' },
  { id: 'GEN_BIO_1', name: 'General Biology 1', category: 'STEM Specialized' },
  { id: 'GEN_BIO_2', name: 'General Biology 2', category: 'STEM Specialized' },
  { id: 'GEN_CHEM_1', name: 'General Chemistry 1', category: 'STEM Specialized' },
  { id: 'GEN_CHEM_2', name: 'General Chemistry 2', category: 'STEM Specialized' },
  { id: 'GEN_PHYS_1', name: 'General Physics 1', category: 'STEM Specialized' },
  { id: 'GEN_PHYS_2', name: 'General Physics 2', category: 'STEM Specialized' },
  
  // Applied Subjects
  { id: 'RESEARCH_1', name: 'Research Project in Science 1', category: 'STEM Applied' },
  { id: 'RESEARCH_2', name: 'Research Project in Science 2', category: 'STEM Applied' }
];

// ============================================================================
// SENIOR HIGH SCHOOL - ACADEMIC TRACK - ABM STRAND
// ============================================================================

export const SHS_ABM_SUBJECTS: SubjectDefinition[] = [
  // Core Specialized Subjects
  { id: 'FUND_ACCT_1', name: 'Fundamentals of Accountancy, Business and Management 1', category: 'ABM Specialized' },
  { id: 'FUND_ACCT_2', name: 'Fundamentals of Accountancy, Business and Management 2', category: 'ABM Specialized' },
  { id: 'BUS_MATH', name: 'Business Mathematics', category: 'ABM Specialized' },
  { id: 'BUS_FINANCE', name: 'Business Finance', category: 'ABM Specialized' },
  { id: 'ORG_MGMT', name: 'Organization and Management', category: 'ABM Specialized' },
  { id: 'PRIN_MARKETING', name: 'Principles of Marketing', category: 'ABM Specialized' },
  { id: 'BUS_ETHICS', name: 'Business Ethics and Social Responsibility', category: 'ABM Specialized' },
  { id: 'APPL_ECON', name: 'Applied Economics', category: 'ABM Specialized' },
  
  // Applied Subjects
  { id: 'BUS_ENTERPRISE', name: 'Business Enterprise Simulation', category: 'ABM Applied' },
  { id: 'INQUIRIES', name: 'Inquiries, Investigations and Immersion', category: 'ABM Applied' }
];

// ============================================================================
// SENIOR HIGH SCHOOL - ACADEMIC TRACK - HUMSS STRAND
// ============================================================================

export const SHS_HUMSS_SUBJECTS: SubjectDefinition[] = [
  // Core Specialized Subjects
  { id: 'CREATIVE_WRITING', name: 'Creative Writing', category: 'HUMSS Specialized' },
  { id: 'CREATIVE_NONFIC', name: 'Creative Nonfiction', category: 'HUMSS Specialized' },
  { id: 'INTRO_PHIL', name: 'Introduction to World Religions and Belief Systems', category: 'HUMSS Specialized' },
  { id: 'PHIL_MAN', name: 'Introduction to Philosophy of the Human Person', category: 'HUMSS Specialized' },
  { id: 'COMM_CULT_1', name: 'Community Engagement, Solidarity and Citizenship 1', category: 'HUMSS Specialized' },
  { id: 'COMM_CULT_2', name: 'Community Engagement, Solidarity and Citizenship 2', category: 'HUMSS Specialized' },
  { id: 'SOC_SCI_1', name: 'Disciplines and Ideas in the Social Sciences 1', category: 'HUMSS Specialized' },
  { id: 'SOC_SCI_2', name: 'Disciplines and Ideas in the Social Sciences 2', category: 'HUMSS Specialized' },
  
  // Applied Subjects
  { id: 'HUMSS_RESEARCH_1', name: 'Research in Social Sciences 1', category: 'HUMSS Applied' },
  { id: 'HUMSS_RESEARCH_2', name: 'Research in Social Sciences 2', category: 'HUMSS Applied' }
];

// ============================================================================
// SENIOR HIGH SCHOOL - ACADEMIC TRACK - GAS STRAND
// ============================================================================

export const SHS_GAS_SUBJECTS: SubjectDefinition[] = [
  // Elective Subjects (Students choose based on interest)
  { id: 'HUMANITIES_1', name: 'Humanities 1', category: 'GAS Elective' },
  { id: 'HUMANITIES_2', name: 'Humanities 2', category: 'GAS Elective' },
  { id: 'SOC_SCI_1', name: 'Social Science 1', category: 'GAS Elective' },
  { id: 'SOC_SCI_2', name: 'Social Science 2', category: 'GAS Elective' },
  { id: 'APPL_ECON', name: 'Applied Economics', category: 'GAS Elective' },
  { id: 'ORG_MGMT', name: 'Organization and Management', category: 'GAS Elective' },
  { id: 'GAS_ELECTIVE_1', name: 'Elective Subject 1', category: 'GAS Elective' },
  { id: 'GAS_ELECTIVE_2', name: 'Elective Subject 2', category: 'GAS Elective' },
  
  // Applied Subjects
  { id: 'GAS_RESEARCH', name: 'Research Project', category: 'GAS Applied' },
  { id: 'WORK_IMMERSION', name: 'Work Immersion/Research/Business Enterprise/Exhibit/Performance', category: 'GAS Applied' }
];

// ============================================================================
// SENIOR HIGH SCHOOL - TVL TRACK
// ============================================================================

export const SHS_TVL_SUBJECTS: SubjectDefinition[] = [
  // Common TVL Subjects
  { id: 'TVL_SPEC_1', name: 'Specialization Course 1', category: 'TVL Specialized' },
  { id: 'TVL_SPEC_2', name: 'Specialization Course 2', category: 'TVL Specialized' },
  { id: 'TVL_SPEC_3', name: 'Specialization Course 3', category: 'TVL Specialized' },
  { id: 'TVL_SPEC_4', name: 'Specialization Course 4', category: 'TVL Specialized' },
  { id: 'TVL_SPEC_5', name: 'Specialization Course 5', category: 'TVL Specialized' },
  { id: 'TVL_SPEC_6', name: 'Specialization Course 6', category: 'TVL Specialized' },
  
  // Applied Subjects
  { id: 'WORK_IMMERSION_TVL', name: 'Work Immersion', category: 'TVL Applied' },
  { id: 'ENTERPRISE_SIM', name: 'Enterprise Simulation', category: 'TVL Applied' }
];

// Note: TVL has many specializations (ICT, Home Economics, Agri-Fishery Arts, Industrial Arts)
// Each has specific subjects that should be configured per school

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get subjects for a specific grade level
 */
export function getSubjectsByGradeLevel(gradeLevel: number, strand?: string): SubjectDefinition[] {
  // Kindergarten (0)
  if (gradeLevel === 0) {
    return [
      { id: 'MTB', name: 'Mother Tongue-Based', category: 'Core' },
      { id: 'FIL_KINDER', name: 'Filipino', category: 'Core' },
      { id: 'KINDER_LITERACY', name: 'Literacy', category: 'Core' },
      { id: 'KINDER_NUMERACY', name: 'Numeracy', category: 'Core' },
      { id: 'KINDER_SOCIO', name: 'Socio-Emotional Development', category: 'Core' }
    ];
  }
  
  // Elementary (1-6)
  if (gradeLevel >= 1 && gradeLevel <= 6) {
    return ELEMENTARY_SUBJECTS;
  }
  
  // Junior High School (7-10)
  if (gradeLevel >= 7 && gradeLevel <= 10) {
    return JUNIOR_HIGH_SUBJECTS;
  }
  
  // Senior High School (11-12)
  if (gradeLevel >= 11 && gradeLevel <= 12) {
    let subjects = [...SHS_CORE_SUBJECTS];
    
    // Add strand-specific subjects
    switch (strand?.toUpperCase()) {
      case 'STEM':
        subjects = [...subjects, ...SHS_STEM_SUBJECTS];
        break;
      case 'ABM':
        subjects = [...subjects, ...SHS_ABM_SUBJECTS];
        break;
      case 'HUMSS':
        subjects = [...subjects, ...SHS_HUMSS_SUBJECTS];
        break;
      case 'GAS':
        subjects = [...subjects, ...SHS_GAS_SUBJECTS];
        break;
      case 'TVL':
        subjects = [...subjects, ...SHS_TVL_SUBJECTS];
        break;
      default:
        // If no strand specified, return core subjects only
        break;
    }
    
    return subjects;
  }
  
  // Default: return empty array
  return [];
}

/**
 * Get display name for grade level
 */
export function getGradeLevelName(gradeLevel: number): string {
  if (gradeLevel === 0) return 'Kindergarten';
  if (gradeLevel >= 1 && gradeLevel <= 6) return `Grade ${gradeLevel} (Elementary)`;
  if (gradeLevel >= 7 && gradeLevel <= 10) return `Grade ${gradeLevel} (Junior High)`;
  if (gradeLevel >= 11 && gradeLevel <= 12) return `Grade ${gradeLevel} (Senior High)`;
  return `Grade ${gradeLevel}`;
}

/**
 * Get available strands for Senior High School
 */
export function getSeniorHighStrands(): Array<{ value: string; label: string }> {
  return [
    { value: 'STEM', label: 'Science, Technology, Engineering and Mathematics (STEM)' },
    { value: 'ABM', label: 'Accountancy, Business and Management (ABM)' },
    { value: 'HUMSS', label: 'Humanities and Social Sciences (HUMSS)' },
    { value: 'GAS', label: 'General Academic Strand (GAS)' },
    { value: 'TVL', label: 'Technical-Vocational-Livelihood (TVL)' },
    { value: 'Sports', label: 'Sports Track' },
    { value: 'Arts', label: 'Arts and Design Track' }
  ];
}

/**
 * Get available tracks for Senior High School
 */
export function getSeniorHighTracks(): Array<{ value: string; label: string }> {
  return [
    { value: 'Academic', label: 'Academic Track' },
    { value: 'Technical-Vocational-Livelihood', label: 'Technical-Vocational-Livelihood Track' },
    { value: 'Sports', label: 'Sports Track' },
    { value: 'Arts and Design', label: 'Arts and Design Track' }
  ];
}
