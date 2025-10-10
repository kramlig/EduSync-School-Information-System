import { useState, useEffect, useCallback, SetStateAction } from 'react';
import type { Student, LearningArea, Grade, SubGradeRecord, CoreValue, CoreValueGrade, CoreValueMarking, AttendanceRecord, Teacher, Section, TeacherAssignment, AuthUser, SchoolSettings, SubstituteAssignment, ClassSchedule, StudentUser, Assignment, StudentAssignmentGrade, LessonPlan, Parent, ParentUser, Announcement } from '../types';

const MOCK_LEARNING_AREAS: LearningArea[] = [
  { id: 'la1', name: 'Mother Tongue Based (MTB)', credits: 3 },
  { id: 'la2', name: 'Filipino', credits: 3 },
  { id: 'la3', name: 'English', credits: 4 },
  { id: 'la4', name: 'Math', credits: 4 },
  { id: 'la5', name: 'Araling Panlipunan (AP)', credits: 4 },
  { id: 'la6', name: 'Edukasyon sa Pagpapakatao (EsP)', credits: 2 },
  { id: 'la7', name: 'MAPEH', credits: 4, isComposite: true, subSubjects: ['Music', 'Arts', 'PE', 'Health']},
  { id: 'la8', name: 'Science', credits: 4 },
];

const MOCK_TEACHERS: Teacher[] = [
  { id: 't0', name: 'Admin User', email: 'admin@school.edu', role: 'admin', password: 'admin123' },
  { id: 't1', name: 'Ms. Eleanor Vance', email: 'e.vance@school.edu', contactNumber: '555-0101', role: 'teacher', password: 'teacher123', assignments: [ { gradeLevel: 3, learningAreaId: 'la2' }, { gradeLevel: 3, learningAreaId: 'la3' } ] },
  { id: 't2', name: 'Mr. David Chen', email: 'd.chen@school.edu', contactNumber: '555-0102', role: 'principal', password: 'teacher123', assignments: [ { gradeLevel: 3, learningAreaId: 'la4' }, { gradeLevel: 3, learningAreaId: 'la8' } ] },
  { id: 't3', name: 'Ms. Maria Rodriguez', email: 'm.rodriguez@school.edu', contactNumber: '555-0103', role: 'teacher', password: 'teacher123', assignments: [ { gradeLevel: 4, learningAreaId: 'la5' } ] },
  { id: 't4', name: 'Mr. John Smith', email: 'j.smith@school.edu', contactNumber: '555-0104', role: 'registrar', password: 'teacher123', assignments: [ { gradeLevel: 4, learningAreaId: 'la1' } ] },
];

const MOCK_SECTIONS: Section[] = [
  { id: 'sec1', gradeLevel: 3, name: 'A', adviserId: 't1' },
  { id: 'sec2', gradeLevel: 3, name: 'B', adviserId: 't2' },
  { id: 'sec3', gradeLevel: 4, name: 'A', adviserId: 't3' },
  { id: 'sec4', gradeLevel: 4, name: 'B', adviserId: 't4' },
];

const MOCK_STUDENTS: Student[] = [
  { id: 's1', name: 'Alice Johnson', email: 'alice.j@school.edu', enrollmentDate: '2023-09-01', lrn: '123456789012', dateOfBirth: '2015-06-15', sex: 'Female', sectionId: 'sec1', password: 'student123' },
  { id: 's2', name: 'Bob Williams', email: 'bob.w@school.edu', enrollmentDate: '2023-09-01', lrn: '210987654321', dateOfBirth: '2015-03-22', sex: 'Male', sectionId: 'sec1', password: 'student123' },
  { id: 's3', name: 'Charlie Brown', email: 'charlie.b@school.edu', enrollmentDate: '2023-09-01', lrn: '345678901234', dateOfBirth: '2015-09-01', sex: 'Male', sectionId: 'sec2', password: 'student123' },
  { id: 's4', name: 'Diana Miller', email: 'diana.m@school.edu', enrollmentDate: '2023-09-01', lrn: '456789012345', dateOfBirth: '2015-11-10', sex: 'Female', sectionId: 'sec2', password: 'student123' },
  { id: 's5', name: 'Ethan Garcia', email: 'ethan.g@school.edu', enrollmentDate: '2023-09-01', lrn: '567890123456', dateOfBirth: '2014-02-18', sex: 'Male', sectionId: 'sec3', password: 'student123' },
  { id: 's6', name: 'Fiona Martinez', email: 'fiona.m@school.edu', enrollmentDate: '2023-09-01', lrn: '678901234567', dateOfBirth: '2014-07-30', sex: 'Female', sectionId: 'sec3', password: 'student123' },
  { id: 's7', name: 'George Lee', email: 'george.l@school.edu', enrollmentDate: '2023-09-01', lrn: '789012345678', dateOfBirth: '2014-04-05', sex: 'Male', sectionId: 'sec4', password: 'student123' },
];

const MOCK_PARENTS: Parent[] = [
    { id: 'p1', name: 'Sarah Johnson', email: 's.johnson@family.com', password: 'parent123', studentIds: ['s1'] },
    { id: 'p2', name: 'Michael Williams', email: 'm.williams@family.com', password: 'parent123', studentIds: ['s2'] },
    { id: 'p3', name: 'Linda Brown', email: 'l.brown@family.com', password: 'parent123', studentIds: ['s3', 's5'] }, // Parent with two children
];

const MOCK_CORE_VALUES: CoreValue[] = [
  { id: 'cv1', name: 'Maka-Diyos', behaviors: ["Expresses one's spiritual beliefs while respecting the spiritual beliefs of others", "Shows adherence to ethical principles by upholding truth"] },
  { id: 'cv2', name: 'Makatao', behaviors: ["Is sensitive to individual, social, and cultural differences", "Demonstrates contributions toward solidarity"] },
  { id: 'cv3', name: 'Makakalikasan', behaviors: ["Cares for the environment and utilizes resources wisely, judiciously, and economically"] },
  { id: 'cv4', name: 'Makabansa', behaviors: ["Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen", "Demonstrates appropriate behavior in carrying out activities in the school, community, and country"] }
];

export const MONTHLY_SCHOOL_DAYS_CONFIG: Record<string, number> = {
  'Jun': 21, 'Jul': 22, 'Aug': 23, 'Sep': 21, 'Oct': 20,
  'Nov': 19, 'Dec': 15, 'Jan': 22, 'Feb': 20, 'Mar': 21, 'Apr': 5,
};

const MOCK_SETTINGS: SchoolSettings = {
    schoolName: 'ENRIQUE URENCIA ELEMENTARY SCHOOL',
    region: 'Region XI',
    division: 'Division of the City of Mati',
    district: 'Governor Generoso North District',
    schoolYear: '2023-2024'
};

const MOCK_SUBSTITUTE_ASSIGNMENTS: SubstituteAssignment[] = [];

const MOCK_SCHEDULES: ClassSchedule[] = [
  { id: 'cs1', title: 'Math', type: 'academic', scope: 'section', sectionId: 'sec1', learningAreaId: 'la4', teacherId: 't2', dayOfWeek: 'Monday', startTime: '08:00', endTime: '09:00' },
  { id: 'cs2', title: 'English', type: 'academic', scope: 'section', sectionId: 'sec1', learningAreaId: 'la3', teacherId: 't1', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00' },
  { id: 'cs3', title: 'Science', type: 'academic', scope: 'section', sectionId: 'sec2', learningAreaId: 'la8', teacherId: 't2', dayOfWeek: 'Tuesday', startTime: '10:00', endTime: '11:30' },
  { id: 'cs4', title: 'Recess', type: 'extracurricular', scope: 'gradeLevel', gradeLevel: 3, dayOfWeek: 'Monday', startTime: '10:00', endTime: '10:30' },
  { id: 'cs5', title: 'Flag Ceremony', type: 'extracurricular', scope: 'all', dayOfWeek: 'Monday', startTime: '07:30', endTime: '08:00' },
  { id: 'cs6', title: 'AP', type: 'academic', scope: 'section', sectionId: 'sec3', learningAreaId: 'la5', teacherId: 't3', dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '10:00' },
  { id: 'cs7', title: 'Lunch', type: 'extracurricular', scope: 'all', dayOfWeek: 'Friday', startTime: '12:00', endTime: '13:00' },
];

const MOCK_ASSIGNMENTS: Assignment[] = [
    { id: 'as1', sectionId: 'sec1', learningAreaId: 'la4', title: 'Q1 - Addition Worksheet', description: 'Complete the worksheet on two-digit addition.', totalPoints: 20, dueDate: '2023-09-30' },
    { id: 'as2', sectionId: 'sec1', learningAreaId: 'la3', title: 'Q1 - Book Report: "Charlotte\'s Web"', description: 'Write a one-page summary and review.', totalPoints: 50, dueDate: '2023-10-15' },
    { id: 'as3', sectionId: 'sec2', learningAreaId: 'la8', title: 'Q2 - Plant Growth Experiment', description: 'Observe and record plant growth over two weeks.', totalPoints: 100, dueDate: '2023-11-20' },
];

const MOCK_LESSON_PLANS: LessonPlan[] = [
    { id: 'lp1', sectionId: 'sec1', learningAreaId: 'la4', date: '2023-09-25', title: 'Introduction to Two-Digit Addition', objectives: ['Understand place value', 'Add two-digit numbers without regrouping'], activities: ['Whiteboard examples', 'Worksheet practice'], materials: ['Whiteboard', 'Markers', 'Worksheet A'], assessment: ['Check worksheet for accuracy'], resources: [], assignmentIds: ['as1'] },
    { id: 'lp2', sectionId: 'sec1', learningAreaId: 'la3', date: '2023-10-02', title: 'Discussing "Charlotte\'s Web"', objectives: ['Identify main characters', 'Summarize the plot'], activities: ['Class discussion', 'Begin book report draft'], materials: ['Copy of "Charlotte\'s Web"'], assessment: ['Oral questioning on plot points'], resources: [{name: 'Book summary online', url: 'http://example.com'}], assignmentIds: ['as2'] },
];

const MOCK_ANNOUNCEMENTS: Announcement[] = [
    { id: 'an1', title: 'Parent-Teacher Conference', content: 'The Q2 Parent-Teacher Conference will be held on December 15th. Please schedule an appointment with your child\'s adviser.', authorId: 't2', date: '2023-11-28', target: 'parents' },
    { id: 'an2', title: 'School Holiday: National Heroes Day', content: 'There will be no classes on November 30th in observance of National Heroes Day.', authorId: 't2', date: '2023-11-25', target: 'all' },
];

// Data Generation
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const quarters: ('q1' | 'q2' | 'q3' | 'q4')[] = ['q1', 'q2', 'q3', 'q4'];
const markings: CoreValueMarking[] = ['AO', 'SO', 'RO', 'NO'];

const MOCK_GRADES: Grade[] = MOCK_STUDENTS.flatMap(student => 
  MOCK_LEARNING_AREAS.map(la => {
    const grade: Grade = { id: `g-${student.id}-${la.id}`, studentId: student.id, learningAreaId: la.id };
    let finalGradeSum = 0;
    let quarterCount = 0;

    quarters.forEach(q => {
      if (la.isComposite) {
        const subGrades: SubGradeRecord = {};
        la.subSubjects!.forEach(sub => { subGrades[sub] = rand(70, 98); });
        grade[q] = subGrades;
        const avg = Math.round(Object.values(subGrades).reduce((a,b) => a+b, 0) / la.subSubjects!.length);
        finalGradeSum += avg;
        quarterCount++;
      } else {
        const qGrade = rand(72, 99);
        grade[q] = qGrade;
        finalGradeSum += qGrade;
        quarterCount++;
      }
    });
    
    const finalGrade = Math.round(finalGradeSum / quarterCount);
    grade.finalGrade = finalGrade;
    grade.remarks = finalGrade >= 75 ? 'Passed' : 'Failed';
    return grade;
  })
);

const MOCK_CORE_VALUE_GRADES: CoreValueGrade[] = MOCK_STUDENTS.flatMap(student =>
  MOCK_CORE_VALUES.map(cv => {
    const grade: CoreValueGrade = { id: `cvg-${student.id}-${cv.id}`, studentId: student.id, coreValueId: cv.id };
    quarters.forEach(q => {
      grade[q] = {};
      cv.behaviors.forEach(b => {
        grade[q]![b] = markings[rand(0, 3)];
      });
    });
    return grade;
  })
);

const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] = MOCK_STUDENTS.map(student => {
  const record: AttendanceRecord = { studentId: student.id, monthlyData: {} };
  Object.entries(MONTHLY_SCHOOL_DAYS_CONFIG).forEach(([month, totalDays]) => {
    const absent = rand(0, 3);
    record.monthlyData[month] = { present: totalDays - absent, absent };
  });
  return record;
});

const MOCK_STUDENT_ASSIGNMENT_GRADES: StudentAssignmentGrade[] = MOCK_STUDENTS
    .filter(s => s.sectionId === 'sec1')
    .flatMap(student => [
        { assignmentId: 'as1', studentId: student.id, score: rand(15, 20) },
        { assignmentId: 'as2', studentId: student.id, score: rand(35, 50) },
    ]);


const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: SetStateAction<T>) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try { const item = window.localStorage.getItem(key); return item ? JSON.parse(item) : initialValue; } catch (error) { console.error(error); return initialValue; }
  });
  const setValue = (value: SetStateAction<T>) => {
    try { const valueToStore = value instanceof Function ? value(storedValue) : value; setStoredValue(valueToStore); window.localStorage.setItem(key, JSON.stringify(valueToStore)); } catch (error) { console.error(error); }
  };
  return [storedValue, setValue];
};

const calculateQuarterAverage = (grade: number | SubGradeRecord | undefined): number | undefined => {
  if (grade === undefined) return undefined; if (typeof grade === 'number') return grade;
  const subGrades = Object.values(grade).filter(g => typeof g === 'number'); if (subGrades.length === 0) return undefined;
  const total = subGrades.reduce((acc, val) => acc + val, 0); return Math.round(total / subGrades.length);
};

export const useSchoolData = (isOnline: boolean) => {
  const [students, setStudents] = useLocalStorage<Student[]>('students', MOCK_STUDENTS);
  const [learningAreas, setLearningAreas] = useLocalStorage<LearningArea[]>('learningAreas', MOCK_LEARNING_AREAS);
  const [grades, setGrades] = useLocalStorage<Grade[]>('grades', MOCK_GRADES);
  const [coreValues] = useLocalStorage<CoreValue[]>('coreValues', MOCK_CORE_VALUES);
  const [coreValueGrades, setCoreValueGrades] = useLocalStorage<CoreValueGrade[]>('coreValueGrades', MOCK_CORE_VALUE_GRADES);
  const [attendanceRecords, setAttendanceRecords] = useLocalStorage<AttendanceRecord[]>('attendance', MOCK_ATTENDANCE_RECORDS);
  const [teachers, setTeachers] = useLocalStorage<Teacher[]>('teachers', MOCK_TEACHERS);
  const [parents, setParents] = useLocalStorage<Parent[]>('parents', MOCK_PARENTS);
  const [sections, setSections] = useLocalStorage<Section[]>('sections', MOCK_SECTIONS);
  const [settings, setSettings] = useLocalStorage<SchoolSettings>('settings', MOCK_SETTINGS);
  const [substituteAssignments, setSubstituteAssignments] = useLocalStorage<SubstituteAssignment[]>('substituteAssignments', MOCK_SUBSTITUTE_ASSIGNMENTS);
  const [classSchedules, setClassSchedules] = useLocalStorage<ClassSchedule[]>('classSchedules', MOCK_SCHEDULES);
  const [assignments, setAssignments] = useLocalStorage<Assignment[]>('assignments', MOCK_ASSIGNMENTS);
  const [studentAssignmentGrades, setStudentAssignmentGrades] = useLocalStorage<StudentAssignmentGrade[]>('studentAssignmentGrades', MOCK_STUDENT_ASSIGNMENT_GRADES);
  const [lessonPlans, setLessonPlans] = useLocalStorage<LessonPlan[]>('lessonPlans', MOCK_LESSON_PLANS);
  const [announcements, setAnnouncements] = useLocalStorage<Announcement[]>('announcements', MOCK_ANNOUNCEMENTS);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (isOnline) { setIsSyncing(true); const timer = setTimeout(() => { console.log("Data synced with server."); setIsSyncing(false); }, 1500); return () => clearTimeout(timer); }
  }, [isOnline]);

  const login = useCallback(async (email: string, password: string, type: 'staff' | 'student' | 'parent'): Promise<{ user: AuthUser | StudentUser | ParentUser; type: 'staff' | 'student' | 'parent' } | null> => {
    const lowerEmail = email.toLowerCase();
    if (type === 'staff') {
        const user = teachers.find(t => t.email.toLowerCase() === lowerEmail);
        if (user && user.password === password) {
            const { password: _, ...authUser } = user; return { user: authUser, type: 'staff' };
        }
    } else if (type === 'student') {
        const user = students.find(s => s.email.toLowerCase() === lowerEmail);
        if (user && user.password === password) {
            const { password: _, ...studentUser } = user; return { user: studentUser, type: 'student' };
        }
    } else { // parent
        const user = parents.find(p => p.email.toLowerCase() === lowerEmail);
        if (user && user.password === password) {
            const { password: _, ...parentUser } = user; return { user: parentUser, type: 'parent' };
        }
    }
    return null;
  }, [teachers, students, parents]);

  const addStudent = useCallback((student: Omit<Student, 'id' | 'enrollmentDate'>): { success: boolean; message?: string } => {
    if (student.lrn && !/^\d{12}$/.test(student.lrn)) { return { success: false, message: 'Invalid LRN. The LRN must be a 12-digit number.' }; }
    const newStudent: Student = { ...student, id: `s${Date.now()}`, enrollmentDate: new Date().toISOString().split('T')[0], password: 'student123' };
    setStudents(prev => [...prev, newStudent]); return { success: true };
  }, [setStudents]);
  
  const updateStudent = useCallback((updatedStudent: Student) => setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s)), [setStudents]);
  const deleteStudent = useCallback((studentId: string) => { setStudents(prev => prev.filter(s => s.id !== studentId)); setGrades(prev => prev.filter(g => g.studentId !== studentId)); setCoreValueGrades(prev => prev.filter(cvg => cvg.studentId !== studentId)); setAttendanceRecords(prev => prev.filter(ar => ar.studentId !== studentId)); setStudentAssignmentGrades(prev => prev.filter(sg => sg.studentId !== studentId)); setParents(prev => prev.map(p => ({ ...p, studentIds: p.studentIds.filter(id => id !== studentId) }))); }, [setStudents, setGrades, setCoreValueGrades, setAttendanceRecords, setStudentAssignmentGrades, setParents]);
  
  const addParent = useCallback((parent: Omit<Parent, 'id'>) => {
    const newParent: Parent = { ...parent, id: `p${Date.now()}`, password: 'parent123' };
    setParents(prev => [...prev, newParent]);
  }, [setParents]);
  
  const updateParent = useCallback((updatedParent: Parent) => {
    setParents(prev => prev.map(p => p.id === updatedParent.id ? updatedParent : p));
  }, [setParents]);

  const deleteParent = useCallback((parentId: string) => {
    setParents(prev => prev.filter(p => p.id !== parentId));
  }, [setParents]);

  const assignStudentToParent = useCallback((parentId: string, studentId: string) => {
    setParents(prev => prev.map(p => {
      if (p.id === parentId && !p.studentIds.includes(studentId)) {
        return { ...p, studentIds: [...p.studentIds, studentId] };
      }
      return p;
    }));
  }, [setParents]);

  const unassignStudentFromParent = useCallback((parentId: string, studentId: string) => {
    setParents(prev => prev.map(p => {
      if (p.id === parentId) {
        return { ...p, studentIds: p.studentIds.filter(id => id !== studentId) };
      }
      return p;
    }));
  }, [setParents]);

  const addLearningArea = useCallback((learningArea: Omit<LearningArea, 'id'>) => { let newLearningArea: LearningArea = { ...learningArea, id: `la${Date.now()}` }; if (learningArea.name.toUpperCase() === 'MAPEH') { newLearningArea = { ...newLearningArea, isComposite: true, subSubjects: ['Music', 'Arts', 'PE', 'Health'], }; } setLearningAreas(prev => [...prev, newLearningArea]); }, [setLearningAreas]);
  const deleteLearningArea = useCallback((learningAreaId: string) => { setLearningAreas(prev => prev.filter(la => la.id !== learningAreaId)); setGrades(prev => prev.filter(g => g.learningAreaId !== learningAreaId)); setAssignments(prev => prev.filter(a => a.learningAreaId !== learningAreaId)); setLessonPlans(prev => prev.filter(lp => lp.learningAreaId !== learningAreaId)); }, [setLearningAreas, setGrades, setAssignments, setLessonPlans]);

  const addTeacher = useCallback((teacher: Omit<Teacher, 'id'>) => { const newTeacher: Teacher = { ...teacher, id: `t${Date.now()}`, password: 'teacher123' }; setTeachers(prev => { let newTeachers = [...prev]; if (newTeacher.role === 'principal') { newTeachers = newTeachers.map(t => t.role === 'principal' ? { ...t, role: 'teacher' } : t); } return [...newTeachers, newTeacher]; }); }, [setTeachers]);
  const updateTeacher = useCallback((updatedTeacher: Teacher) => { setTeachers(prev => { let newTeachers = prev.map(t => t.id === updatedTeacher.id ? updatedTeacher : t); if (updatedTeacher.role === 'principal') { newTeachers = newTeachers.map(t => (t.role === 'principal' && t.id !== updatedTeacher.id) ? { ...t, role: 'teacher' } : t); } return newTeachers; }); }, [setTeachers]);
  const deleteTeacher = useCallback((teacherId: string) => { setTeachers(prev => prev.filter(t => t.id !== teacherId)); setSections(prev => prev.map(s => s.adviserId === teacherId ? {...s, adviserId: undefined} : s)); setSubstituteAssignments(prev => prev.filter(sub => sub.teacherId !== teacherId)); }, [setTeachers, setSections, setSubstituteAssignments]);
  
  const addSection = useCallback((section: Omit<Section, 'id'>) => { const newSection: Section = { ...section, id: `sec${Date.now()}` }; setSections(prev => [...prev, newSection]); }, [setSections]);
  const updateSection = useCallback((updatedSection: Section) => setSections(prev => prev.map(s => s.id === updatedSection.id ? updatedSection : s)), [setSections]);
  const deleteSection = useCallback((sectionId: string) => { setSections(prev => prev.filter(s => s.id !== sectionId)); setStudents(prev => prev.map(s => s.sectionId === sectionId ? {...s, sectionId: undefined} : s)); setSubstituteAssignments(prev => prev.filter(sub => sub.sectionId !== sectionId)); setAssignments(prev => prev.filter(a => a.sectionId !== sectionId)); setLessonPlans(prev => prev.filter(lp => lp.sectionId !== sectionId)); }, [setSections, setStudents, setSubstituteAssignments, setAssignments, setLessonPlans]);

  const addSubstituteAssignment = useCallback((assignment: Omit<SubstituteAssignment, 'id'>) => { const newAssignment: SubstituteAssignment = { ...assignment, id: `sub${Date.now()}` }; setSubstituteAssignments(prev => [...prev, newAssignment]); }, [setSubstituteAssignments]);
  const updateSubstituteAssignment = useCallback((updatedAssignment: SubstituteAssignment) => setSubstituteAssignments(prev => prev.map(sub => sub.id === updatedAssignment.id ? updatedAssignment : sub)), [setSubstituteAssignments]);
  const deleteSubstituteAssignment = useCallback((assignmentId: string) => setSubstituteAssignments(prev => prev.filter(sub => sub.id !== assignmentId)), [setSubstituteAssignments]);

  const updateGrade = useCallback((studentId: string, learningAreaId: string, quarter: 'q1'|'q2'|'q3'|'q4', gradeValue: number|undefined, subSubject?: string) => { setGrades(prev => { const newGrades = [...prev]; let gradeIndex = newGrades.findIndex(g => g.studentId === studentId && g.learningAreaId === learningAreaId); if (gradeIndex === -1) { newGrades.push({ id: `g-${studentId}-${learningAreaId}`, studentId, learningAreaId, }); gradeIndex = newGrades.length - 1; } const updatedGrade = { ...newGrades[gradeIndex] }; const learningArea = learningAreas.find(la => la.id === learningAreaId); if (learningArea?.isComposite && subSubject) { const currentQuarterGrade = updatedGrade[quarter]; let newSubGrades: SubGradeRecord = {}; if (typeof currentQuarterGrade === 'object' && currentQuarterGrade !== null) { newSubGrades = { ...currentQuarterGrade }; } if (gradeValue === undefined) { delete newSubGrades[subSubject]; } else { newSubGrades[subSubject] = gradeValue; } updatedGrade[quarter] = newSubGrades; } else if (!learningArea?.isComposite) { if (gradeValue === undefined) { delete updatedGrade[quarter]; } else { updatedGrade[quarter] = gradeValue; } } const quarterAverages = [calculateQuarterAverage(updatedGrade.q1), calculateQuarterAverage(updatedGrade.q2), calculateQuarterAverage(updatedGrade.q3), calculateQuarterAverage(updatedGrade.q4)].filter(g => g !== undefined) as number[]; if (quarterAverages.length > 0) { const total = quarterAverages.reduce((acc, val) => acc + val, 0); const finalGrade = Math.round(total / quarterAverages.length); updatedGrade.finalGrade = finalGrade; updatedGrade.remarks = finalGrade >= 75 ? 'Passed' : 'Failed'; } else { delete updatedGrade.finalGrade; delete updatedGrade.remarks; } newGrades[gradeIndex] = updatedGrade; return newGrades; }); }, [setGrades, learningAreas]);
  const updateCoreValueGrade = useCallback((studentId: string, coreValueId: string, quarter: 'q1'|'q2'|'q3'|'q4', behavior: string, marking: CoreValueMarking|'') => { setCoreValueGrades(prev => { const newGrades = [...prev]; let gradeIndex = newGrades.findIndex(g => g.studentId === studentId && g.coreValueId === coreValueId); if (gradeIndex === -1) { newGrades.push({ id: `cvg-${studentId}-${coreValueId}`, studentId, coreValueId, }); gradeIndex = newGrades.length - 1; } const updatedGrade = { ...newGrades[gradeIndex] }; const currentQuarterMarkings = updatedGrade[quarter] ?? {}; const newQuarterMarkings = { ...currentQuarterMarkings }; if (marking === '') { delete newQuarterMarkings[behavior]; } else { newQuarterMarkings[behavior] = marking; } updatedGrade[quarter] = newQuarterMarkings; newGrades[gradeIndex] = updatedGrade; return newGrades; }); }, [setCoreValueGrades]);
  const updateAttendance = useCallback((studentId: string, month: string, type: 'present' | 'absent', value: number) => { setAttendanceRecords(prev => { const newRecords = [...prev]; let recordIndex = newRecords.findIndex(r => r.studentId === studentId); if (recordIndex === -1) { newRecords.push({ studentId, monthlyData: {} }); recordIndex = newRecords.length - 1; } const updatedRecord = { ...newRecords[recordIndex] }; const monthData = updatedRecord.monthlyData[month] ?? { present: 0, absent: 0 }; const newMonthData = { ...monthData, [type]: value }; updatedRecord.monthlyData = { ...updatedRecord.monthlyData, [month]: newMonthData }; newRecords[recordIndex] = updatedRecord; return newRecords; }); }, [setAttendanceRecords]);
  const updateSettings = useCallback((newSettings: SchoolSettings) => setSettings(newSettings), [setSettings]);

  const checkScheduleConflict = (newSchedule: Omit<ClassSchedule, 'id'>, existingSchedules: ClassSchedule[], scheduleIdToIgnore?: string): string | null => { const { startTime: newStart, endTime: newEnd, dayOfWeek, type, scope, sectionId, gradeLevel, teacherId } = newSchedule; const newScheduleSection = sections.find(s => s.id === sectionId); for (const existing of existingSchedules) { if (scheduleIdToIgnore && existing.id === scheduleIdToIgnore) continue; if (existing.dayOfWeek !== dayOfWeek) continue; if (newStart < existing.endTime && existing.startTime < newEnd) { if (type === 'academic' && existing.type === 'academic' && teacherId && existing.teacherId === teacherId) { const teacher = teachers.find(t => t.id === teacherId); return `Conflict: ${teacher?.name || 'Teacher'} is already scheduled at this time.`; } const existingSection = sections.find(s => s.id === existing.sectionId); if (scope === 'all' || existing.scope === 'all') return `Conflict: A school-wide event is scheduled at this time.`; if (scope === 'gradeLevel' && existing.scope === 'gradeLevel' && gradeLevel === existing.gradeLevel) return `Conflict: An event for Grade ${gradeLevel} is already scheduled.`; if (scope === 'section' && existing.scope === 'section' && sectionId === existing.sectionId) { const section = sections.find(s => s.id === sectionId); return `Conflict: Section ${section?.name || ''} already has an event scheduled.`; } if (scope === 'gradeLevel' && existing.scope === 'section' && existingSection && gradeLevel === existingSection.gradeLevel) return `Conflict: Section ${existingSection.name} (Grade ${gradeLevel}) has a class, which conflicts with the grade-level event.`; if (scope === 'section' && existing.scope === 'gradeLevel' && newScheduleSection && newScheduleSection.gradeLevel === existing.gradeLevel) return `Conflict: A grade-level event for Grade ${newScheduleSection.gradeLevel} is scheduled, which conflicts with this section's class.`; } } return null; };
  const addSchedule = useCallback((schedule: Omit<ClassSchedule, 'id'>): { success: boolean, message?: string } => { const conflict = checkScheduleConflict(schedule, classSchedules); if (conflict) { return { success: false, message: conflict }; } const newSchedule: ClassSchedule = { ...schedule, id: `cs${Date.now()}` }; setClassSchedules(prev => [...prev, newSchedule]); return { success: true }; }, [classSchedules, setClassSchedules, teachers, sections]);
  const updateSchedule = useCallback((updatedSchedule: ClassSchedule): { success: boolean, message?: string } => { const conflict = checkScheduleConflict(updatedSchedule, classSchedules, updatedSchedule.id); if (conflict) { return { success: false, message: conflict }; } setClassSchedules(prev => prev.map(s => s.id === updatedSchedule.id ? updatedSchedule : s)); return { success: true }; }, [classSchedules, setClassSchedules, teachers, sections]);
  const deleteSchedule = useCallback((scheduleId: string) => setClassSchedules(prev => prev.filter(s => s.id !== scheduleId)), [setClassSchedules]);

  const addAssignment = useCallback((assignment: Omit<Assignment, 'id'>) => { const newAssignment: Assignment = { ...assignment, id: `as${Date.now()}` }; setAssignments(prev => [...prev, newAssignment]); }, [setAssignments]);
  const updateAssignment = useCallback((updatedAssignment: Assignment) => setAssignments(prev => prev.map(a => a.id === updatedAssignment.id ? updatedAssignment : a)), [setAssignments]);
  const deleteAssignment = useCallback((assignmentId: string) => { setAssignments(prev => prev.filter(a => a.id !== assignmentId)); setStudentAssignmentGrades(prev => prev.filter(sg => sg.assignmentId !== assignmentId)); }, [setAssignments, setStudentAssignmentGrades]);
  const updateStudentAssignmentScore = useCallback((studentId: string, assignmentId: string, score: number | null) => { setStudentAssignmentGrades(prev => { const newGrades = [...prev]; const gradeIndex = newGrades.findIndex(g => g.studentId === studentId && g.assignmentId === assignmentId); if (gradeIndex > -1) { newGrades[gradeIndex] = { ...newGrades[gradeIndex], score }; } else { newGrades.push({ studentId, assignmentId, score }); } return newGrades; }); }, [setStudentAssignmentGrades]);

  const addLessonPlan = useCallback((lessonPlan: Omit<LessonPlan, 'id'>) => { const newPlan: LessonPlan = { ...lessonPlan, id: `lp${Date.now()}`}; setLessonPlans(prev => [...prev, newPlan]); }, [setLessonPlans]);
  const updateLessonPlan = useCallback((updatedPlan: LessonPlan) => { setLessonPlans(prev => prev.map(lp => lp.id === updatedPlan.id ? updatedPlan : lp)); }, [setLessonPlans]);
  const deleteLessonPlan = useCallback((lessonPlanId: string) => { setLessonPlans(prev => prev.filter(lp => lp.id !== lessonPlanId)); }, [setLessonPlans]);

  const addAnnouncement = useCallback((announcement: Omit<Announcement, 'id'>) => { const newAnnouncement: Announcement = { ...announcement, id: `an${Date.now()}`}; setAnnouncements(prev => [newAnnouncement, ...prev]); }, [setAnnouncements]);
  const updateAnnouncement = useCallback((updatedAnnouncement: Announcement) => { setAnnouncements(prev => prev.map(an => an.id === updatedAnnouncement.id ? updatedAnnouncement : an)); }, [setAnnouncements]);
  const deleteAnnouncement = useCallback((announcementId: string) => { setAnnouncements(prev => prev.filter(an => an.id !== announcementId)); }, [setAnnouncements]);

  return { students, learningAreas, grades, coreValues, coreValueGrades, attendanceRecords, teachers, parents, sections, settings, substituteAssignments, classSchedules, assignments, studentAssignmentGrades, lessonPlans, announcements, login, addStudent, updateStudent, deleteStudent, addLearningArea, deleteLearningArea, addTeacher, updateTeacher, deleteTeacher, addSection, updateSection, deleteSection, updateGrade, updateCoreValueGrade, updateAttendance, updateSettings, addSubstituteAssignment, updateSubstituteAssignment, deleteSubstituteAssignment, addSchedule, updateSchedule, deleteSchedule, addAssignment, updateAssignment, deleteAssignment, updateStudentAssignmentScore, addLessonPlan, updateLessonPlan, deleteLessonPlan, addAnnouncement, updateAnnouncement, deleteAnnouncement, isSyncing, loading: false, monthlySchoolDaysConfig: MONTHLY_SCHOOL_DAYS_CONFIG, addParent, updateParent, deleteParent, assignStudentToParent, unassignStudentFromParent };
};

export type SchoolDataHook = ReturnType<typeof useSchoolData>;