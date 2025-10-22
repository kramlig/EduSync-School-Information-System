/**
 * Sample Data for DepEd Forms
 * 
 * Test data for development and demonstration:
 * - Sample students
 * - Sample Form 137 (Academic History)
 * - Sample Form 138 (Report Cards)
 * - Sample School Forms (SF1, SF2, SF9)
 * - Sample ELLN Assessments
 */

import {
  AcademicHistory,
  ReportCard,
  SchoolForm,
  ELLNAssessment,
  SubjectGrade,
  ObservedValue,
  ProficiencyLevel
} from './FormTypes';
import { getCurrentSchoolYear, formatDepEdDate } from '../../../services/dateHelpers';

/**
 * Sample Student Data
 */
export const sampleStudents = [
  {
    id: 'STU001',
    lrn: '123456789012',
    firstName: 'Juan',
    middleName: 'Santos',
    lastName: 'Dela Cruz',
    birthDate: '2012-03-15',
    gradeLevel: 6,
    section: 'St. Francis'
  },
  {
    id: 'STU002',
    lrn: '123456789013',
    firstName: 'Maria',
    middleName: 'Garcia',
    lastName: 'Reyes',
    birthDate: '2012-05-20',
    gradeLevel: 6,
    section: 'St. Francis'
  },
  {
    id: 'STU003',
    lrn: '123456789014',
    firstName: 'Pedro',
    middleName: 'Ramos',
    lastName: 'Santos',
    birthDate: '2018-08-10',
    gradeLevel: 1,
    section: 'Rizal'
  }
];

/**
 * Sample Subject Grades for Grade 6
 */
const sampleGrade6Subjects: SubjectGrade[] = [
  {
    learningAreaId: 'FIL',
    learningAreaName: 'Filipino',
    q1: { ww: 85, pt: 88, qa: 90, finalGrade: 88 },
    q2: { ww: 87, pt: 89, qa: 91, finalGrade: 89 },
    q3: { ww: 88, pt: 90, qa: 92, finalGrade: 90 },
    q4: { ww: 89, pt: 91, qa: 93, finalGrade: 91 },
    finalRating: 90,
    remarks: 'Passed'
  },
  {
    learningAreaId: 'ENG',
    learningAreaName: 'English',
    q1: { ww: 86, pt: 89, qa: 91, finalGrade: 89 },
    q2: { ww: 88, pt: 90, qa: 92, finalGrade: 90 },
    q3: { ww: 89, pt: 91, qa: 93, finalGrade: 91 },
    q4: { ww: 90, pt: 92, qa: 94, finalGrade: 92 },
    finalRating: 91,
    remarks: 'Passed'
  },
  {
    learningAreaId: 'MATH',
    learningAreaName: 'Mathematics',
    q1: { ww: 82, pt: 85, qa: 87, finalGrade: 85 },
    q2: { ww: 84, pt: 86, qa: 88, finalGrade: 86 },
    q3: { ww: 85, pt: 87, qa: 89, finalGrade: 87 },
    q4: { ww: 86, pt: 88, qa: 90, finalGrade: 88 },
    finalRating: 87,
    remarks: 'Passed'
  },
  {
    learningAreaId: 'SCI',
    learningAreaName: 'Science',
    q1: { ww: 88, pt: 90, qa: 92, finalGrade: 90 },
    q2: { ww: 89, pt: 91, qa: 93, finalGrade: 91 },
    q3: { ww: 90, pt: 92, qa: 94, finalGrade: 92 },
    q4: { ww: 91, pt: 93, qa: 95, finalGrade: 93 },
    finalRating: 92,
    remarks: 'Passed'
  },
  {
    learningAreaId: 'AP',
    learningAreaName: 'Araling Panlipunan',
    q1: { ww: 87, pt: 89, qa: 91, finalGrade: 89 },
    q2: { ww: 88, pt: 90, qa: 92, finalGrade: 90 },
    q3: { ww: 89, pt: 91, qa: 93, finalGrade: 91 },
    q4: { ww: 90, pt: 92, qa: 94, finalGrade: 92 },
    finalRating: 91,
    remarks: 'Passed'
  },
  {
    learningAreaId: 'EPP',
    learningAreaName: 'Edukasyon sa Pagpapakatao',
    q1: { ww: 90, pt: 92, qa: 94, finalGrade: 92 },
    q2: { ww: 91, pt: 93, qa: 95, finalGrade: 93 },
    q3: { ww: 92, pt: 94, qa: 96, finalGrade: 94 },
    q4: { ww: 93, pt: 95, qa: 97, finalGrade: 95 },
    finalRating: 94,
    remarks: 'Passed'
  },
  {
    learningAreaId: 'MUSIC',
    learningAreaName: 'Music',
    q1: { ww: 89, pt: 91, qa: 93, finalGrade: 91 },
    q2: { ww: 90, pt: 92, qa: 94, finalGrade: 92 },
    q3: { ww: 91, pt: 93, qa: 95, finalGrade: 93 },
    q4: { ww: 92, pt: 94, qa: 96, finalGrade: 94 },
    finalRating: 93,
    remarks: 'Passed'
  },
  {
    learningAreaId: 'ARTS',
    learningAreaName: 'Arts',
    q1: { ww: 88, pt: 90, qa: 92, finalGrade: 90 },
    q2: { ww: 89, pt: 91, qa: 93, finalGrade: 91 },
    q3: { ww: 90, pt: 92, qa: 94, finalGrade: 92 },
    q4: { ww: 91, pt: 93, qa: 95, finalGrade: 93 },
    finalRating: 92,
    remarks: 'Passed'
  },
  {
    learningAreaId: 'PE',
    learningAreaName: 'Physical Education',
    q1: { ww: 91, pt: 93, qa: 95, finalGrade: 93 },
    q2: { ww: 92, pt: 94, qa: 96, finalGrade: 94 },
    q3: { ww: 93, pt: 95, qa: 97, finalGrade: 95 },
    q4: { ww: 94, pt: 96, qa: 98, finalGrade: 96 },
    finalRating: 95,
    remarks: 'Passed'
  },
  {
    learningAreaId: 'HEALTH',
    learningAreaName: 'Health',
    q1: { ww: 90, pt: 92, qa: 94, finalGrade: 92 },
    q2: { ww: 91, pt: 93, qa: 95, finalGrade: 93 },
    q3: { ww: 92, pt: 94, qa: 96, finalGrade: 94 },
    q4: { ww: 93, pt: 95, qa: 97, finalGrade: 95 },
    finalRating: 94,
    remarks: 'Passed'
  }
];

/**
 * Sample Form 137 (Academic History)
 */
export const sampleForm137: Partial<AcademicHistory> = {
  studentId: 'STU001',
  lrn: '123456789012',
  studentName: 'Juan Santos Dela Cruz',
  birthDate: '2012-03-15',
  birthPlace: 'Manila, Philippines',
  parentGuardian: 'Pedro Dela Cruz',
  schoolId: 'SCH001',
  schoolName: 'Sample Elementary School',
  schoolYear: getCurrentSchoolYear(),
  gradeLevel: 6,
  section: 'St. Francis',
  adviserName: 'Ms. Maria Santos',
  subjects: sampleGrade6Subjects,
  generalAverage: 91,
  promotionStatus: 'PROMOTED',
  daysOfSchool: 200,
  daysPresent: 198,
  remarks: 'Promoted to Grade 7',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Sample Form 138 (Report Card) - First Quarter
 */
export const sampleForm138Q1: Partial<ReportCard> = {
  studentId: 'STU001',
  lrn: '123456789012',
  studentName: 'Juan Santos Dela Cruz',
  gradeLevel: 6,
  section: 'St. Francis',
  schoolYear: getCurrentSchoolYear(),
  quarter: 1,
  schoolId: 'SCH001',
  schoolName: 'Sample Elementary School',
  adviserName: 'Ms. Maria Santos',
  subjects: sampleGrade6Subjects.map(subject => ({
    learningAreaId: subject.learningAreaId,
    learningAreaName: subject.learningAreaName,
    q1: subject.q1,
    finalRating: subject.q1?.finalGrade || 0,
    remarks: (subject.q1?.finalGrade || 0) >= 75 ? 'Passed' : 'Failed'
  })),
  generalAverage: 90,
  coreValues: [
    { value: 'Maka-Diyos', rating: 'Outstanding' },
    { value: 'Makatao', rating: 'Very Satisfactory' },
    { value: 'Makakalikasan', rating: 'Satisfactory' },
    { value: 'Makabansa', rating: 'Very Satisfactory' }
  ],
  daysOfSchool: 50,
  daysPresent: 50,
  dateIssued: formatDepEdDate(new Date()),
  remarks: 'Keep up the good work!',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Sample School Form 1 (SF1) - School Register
 */
export const sampleSF1: Partial<SchoolForm> = {
  formType: 'SF1',
  schoolYear: getCurrentSchoolYear(),
  schoolId: 'SCH001',
  schoolName: 'Sample Elementary School',
  gradeLevel: 6,
  section: 'St. Francis',
  data: {
    students: sampleStudents.filter(s => s.gradeLevel === 6),
    enrollmentSummary: {
      male: 15,
      female: 18,
      total: 33
    }
  },
  preparedBy: 'Ms. Maria Santos',
  preparedDate: formatDepEdDate(new Date()),
  notedBy: 'Mr. Juan Principal',
  notedDate: formatDepEdDate(new Date()),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Sample School Form 2 (SF2) - Daily Attendance Report
 */
export const sampleSF2: Partial<SchoolForm> = {
  formType: 'SF2',
  schoolYear: getCurrentSchoolYear(),
  schoolId: 'SCH001',
  schoolName: 'Sample Elementary School',
  gradeLevel: 6,
  section: 'St. Francis',
  month: 'October',
  data: {
    dailyAttendance: Array.from({ length: 22 }, (_, i) => ({
      date: `2025-10-${(i + 1).toString().padStart(2, '0')}`,
      present: 31 + Math.floor(Math.random() * 3),
      absent: Math.floor(Math.random() * 3),
      late: Math.floor(Math.random() * 2)
    }))
  },
  preparedBy: 'Ms. Maria Santos',
  preparedDate: formatDepEdDate(new Date()),
  notedBy: 'Mr. Juan Principal',
  notedDate: formatDepEdDate(new Date()),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Sample School Form 9 (SF9) - Learner's Progress Report
 */
export const sampleSF9: Partial<SchoolForm> = {
  formType: 'SF9',
  schoolYear: getCurrentSchoolYear(),
  schoolId: 'SCH001',
  schoolName: 'Sample Elementary School',
  gradeLevel: 6,
  section: 'St. Francis',
  data: {
    studentId: 'STU001',
    lrn: '123456789012',
    studentName: 'Juan Santos Dela Cruz',
    subjects: sampleGrade6Subjects,
    generalAverage: 91,
    promotionStatus: 'PROMOTED'
  },
  preparedBy: 'Ms. Maria Santos',
  preparedDate: formatDepEdDate(new Date()),
  notedBy: 'Mr. Juan Principal',
  notedDate: formatDepEdDate(new Date()),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Sample ELLN Assessment for Grade 1
 */
export const sampleELLN: Partial<ELLNAssessment> = {
  studentId: 'STU003',
  lrn: '123456789014',
  studentName: 'Pedro Ramos Santos',
  gradeLevel: 1,
  schoolYear: getCurrentSchoolYear(),
  quarter: 1,
  schoolId: 'SCH001',
  schoolName: 'Sample Elementary School',
  teacherName: 'Ms. Ana Garcia',
  assessmentDate: formatDepEdDate(new Date()),
  
  // Filipino Literacy
  literacyFilipino: {
    letterNaming: 'Developing',
    letterSoundAssociation: 'Developing',
    wordRecognition: 'Beginning',
    readingFluency: 'Beginning',
    readingComprehension: 'Beginning',
    writingSkills: 'Developing',
    notes: 'Makikita ang pag-unlad sa pagbasa ng mga salita.'
  },
  
  // English Literacy
  literacyEnglish: {
    letterNaming: 'Developing',
    letterSoundAssociation: 'Beginning',
    wordRecognition: 'Beginning',
    readingFluency: 'Beginning',
    readingComprehension: 'Beginning',
    writingSkills: 'Beginning',
    notes: 'Needs more practice with letter sounds.'
  },
  
  // Numeracy
  numeracy: {
    numberRecognition: 'Developing',
    counting: 'Proficient',
    numberComparison: 'Developing',
    basicOperations: 'Beginning',
    problemSolving: 'Developing',
    measurement: 'Beginning',
    geometry: 'Beginning',
    patterns: 'Developing',
    notes: 'Good at counting, needs practice with operations.'
  },
  
  // Overall proficiency
  proficiencyLevel: 'Developing',
  recommendations: 'Continue practice with letter sounds and basic operations. Provide more reading materials.',
  parentNotified: true,
  parentNotifiedDate: formatDepEdDate(new Date()),
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Generate random grades for testing
 */
export function generateRandomGrades(min: number = 75, max: number = 95): {
  ww: number;
  pt: number;
  qa: number;
  finalGrade: number;
} {
  const ww = Math.floor(Math.random() * (max - min + 1)) + min;
  const pt = Math.floor(Math.random() * (max - min + 1)) + min;
  const qa = Math.floor(Math.random() * (max - min + 1)) + min;
  const finalGrade = Math.round((ww * 0.3) + (pt * 0.5) + (qa * 0.2));
  
  return { ww, pt, qa, finalGrade };
}

/**
 * Generate sample subjects for any grade level
 */
export function generateSampleSubjects(gradeLevel: number): SubjectGrade[] {
  const subjects: { id: string; name: string }[] = [];
  
  if (gradeLevel <= 6) {
    // Elementary subjects
    subjects.push(
      { id: 'FIL', name: 'Filipino' },
      { id: 'ENG', name: 'English' },
      { id: 'MATH', name: 'Mathematics' },
      { id: 'SCI', name: 'Science' },
      { id: 'AP', name: 'Araling Panlipunan' },
      { id: 'EPP', name: 'Edukasyon sa Pagpapakatao' },
      { id: 'MUSIC', name: 'Music' },
      { id: 'ARTS', name: 'Arts' },
      { id: 'PE', name: 'Physical Education' },
      { id: 'HEALTH', name: 'Health' }
    );
  } else if (gradeLevel <= 10) {
    // Junior High School subjects
    subjects.push(
      { id: 'FIL', name: 'Filipino' },
      { id: 'ENG', name: 'English' },
      { id: 'MATH', name: 'Mathematics' },
      { id: 'SCI', name: 'Science' },
      { id: 'AP', name: 'Araling Panlipunan' },
      { id: 'TLE', name: 'Technology and Livelihood Education' },
      { id: 'MAPEH', name: 'MAPEH' },
      { id: 'ESP', name: 'Edukasyon sa Pagpapakatao' }
    );
  } else {
    // Senior High School - simplified
    subjects.push(
      { id: 'CORE1', name: 'Core Subject 1' },
      { id: 'CORE2', name: 'Core Subject 2' },
      { id: 'CORE3', name: 'Core Subject 3' },
      { id: 'CORE4', name: 'Core Subject 4' },
      { id: 'SPEC1', name: 'Specialized Subject 1' },
      { id: 'SPEC2', name: 'Specialized Subject 2' }
    );
  }
  
  return subjects.map(subject => {
    const q1 = generateRandomGrades();
    const q2 = generateRandomGrades();
    const q3 = generateRandomGrades();
    const q4 = generateRandomGrades();
    const finalRating = Math.round((q1.finalGrade + q2.finalGrade + q3.finalGrade + q4.finalGrade) / 4);
    
    return {
      learningAreaId: subject.id,
      learningAreaName: subject.name,
      q1,
      q2,
      q3,
      q4,
      finalRating,
      remarks: finalRating >= 75 ? 'Passed' : 'Failed'
    };
  });
}

/**
 * Get all sample data
 */
export const getAllSampleData = () => ({
  students: sampleStudents,
  form137: sampleForm137,
  form138: sampleForm138Q1,
  sf1: sampleSF1,
  sf2: sampleSF2,
  sf9: sampleSF9,
  elln: sampleELLN
});
