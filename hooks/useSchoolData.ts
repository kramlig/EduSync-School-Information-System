import { useState, useEffect, useCallback, SetStateAction } from 'react';
import type { Student, LearningArea, Grade, SubGradeRecord, CoreValue, CoreValueGrade, CoreValueMarking, AttendanceRecord, Teacher, Section, TeacherAssignment, AuthUser, SchoolSettings, SubstituteAssignment } from '../types';

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
  { id: 't1', name: 'Ms. Eleanor Vance', email: 'e.vance@school.edu', contactNumber: '555-0101', role: 'teacher', password: 'teacher123', assignments: [
    { gradeLevel: 3, learningAreaId: 'la2' },
    { gradeLevel: 3, learningAreaId: 'la3' },
    { gradeLevel: 4, learningAreaId: 'la3' },
  ] },
  { id: 't2', name: 'Mr. David Chen', email: 'd.chen@school.edu', contactNumber: '555-0102', role: 'principal', password: 'teacher123', assignments: [
    { gradeLevel: 3, learningAreaId: 'la4' },
    { gradeLevel: 3, learningAreaId: 'la8' },
    { gradeLevel: 3, learningAreaId: 'la7' },
  ] },
];

const MOCK_SECTIONS: Section[] = [
  { id: 'sec1', gradeLevel: 3, name: 'A', adviserId: 't1' },
  { id: 'sec2', gradeLevel: 3, name: 'B', adviserId: 't2' },
];

const MOCK_STUDENTS: Student[] = [
  { id: 's1', name: 'Alice Johnson', email: 'alice.j@school.edu', enrollmentDate: '2023-09-01', lrn: '123456789012', dateOfBirth: '2015-06-15', sex: 'Female', sectionId: 'sec1' },
  { id: 's2', name: 'Bob Williams', email: 'bob.w@school.edu', enrollmentDate: '2023-09-01', lrn: '210987654321', dateOfBirth: '2015-03-22', sex: 'Male', sectionId: 'sec1' },
  { id: 's3', name: 'Charlie Brown', email: 'charlie.b@school.edu', enrollmentDate: '2023-09-01', lrn: '345678901234', dateOfBirth: '2015-09-01', sex: 'Male', sectionId: 'sec2' },
];

const MOCK_GRADES: Grade[] = [
  { id: 'g-s1-la1', studentId: 's1', learningAreaId: 'la1', q1: 92, q2: 94, q3: 88, q4: 95, finalGrade: 92, remarks: 'Passed' },
  { id: 'g-s1-la2', studentId: 's1', learningAreaId: 'la2', q1: 88, q2: 90, q3: 91, q4: 89, finalGrade: 90, remarks: 'Passed' },
  { id: 'g-s1-la3', studentId: 's1', learningAreaId: 'la3', q1: 85, q2: 87, q3: 88, q4: 90, finalGrade: 88, remarks: 'Passed' },
  { id: 'g-s1-la4', studentId: 's1', learningAreaId: 'la4', q1: 95, q2: 93, q3: 96, q4: 94, finalGrade: 95, remarks: 'Passed' },
  { id: 'g-s1-la5', studentId: 's1', learningAreaId: 'la5', q1: 88, q2: 89, q3: 92, q4: 90, finalGrade: 90, remarks: 'Passed' },
  { id: 'g-s1-la6', studentId: 's1', learningAreaId: 'la6', q1: 91, q2: 92, q3: 93, q4: 94, finalGrade: 93, remarks: 'Passed' },
  { id: 'g-s1-la7', studentId: 's1', learningAreaId: 'la7', q1: { 'Music': 90, 'Arts': 85, 'PE': 92, 'Health': 88 }, q2: { 'Music': 92, 'Arts': 88, 'PE': 94, 'Health': 90 }, q3: { 'Music': 88, 'Arts': 90, 'PE': 91, 'Health': 89 }, q4: { 'Music': 94, 'Arts': 91, 'PE': 93, 'Health': 92 }, finalGrade: 91, remarks: 'Passed' },
  { id: 'g-s2-la1', studentId: 's2', learningAreaId: 'la1', q1: 74, q2: 70, q3: 78, q4: 75, finalGrade: 74, remarks: 'Failed' },
];

const MOCK_CORE_VALUES: CoreValue[] = [
  { id: 'cv1', name: 'Maka-Diyos', behaviors: ["Expresses one's spiritual beliefs while respecting the spiritual beliefs of others", "Shows adherence to ethical principles by upholding truth"] },
  { id: 'cv2', name: 'Makatao', behaviors: ["Is sensitive to individual, social, and cultural differences", "Demonstrates contributions toward solidarity"] },
  { id: 'cv3', name: 'Makakalikasan', behaviors: ["Cares for the environment and utilizes resources wisely, judiciously, and economically"] },
  { id: 'cv4', name: 'Makabansa', behaviors: ["Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen", "Demonstrates appropriate behavior in carrying out activities in the school, community, and country"] }
];

const MOCK_CORE_VALUE_GRADES: CoreValueGrade[] = [
  { id: 'cvg-s1-cv1', studentId: 's1', coreValueId: 'cv1', q1: { "Expresses one's spiritual beliefs while respecting the spiritual beliefs of others": 'AO', "Shows adherence to ethical principles by upholding truth": 'SO' } },
];

export const MONTHLY_SCHOOL_DAYS_CONFIG: Record<string, number> = {
  'Jun': 21, 'Jul': 22, 'Aug': 23, 'Sep': 21, 'Oct': 20,
  'Nov': 19, 'Dec': 15, 'Jan': 22, 'Feb': 20, 'Mar': 21, 'Apr': 5,
};

const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] = [
    { studentId: 's1', monthlyData: { 'Jun': { present: 21, absent: 0 }, 'Jul': { present: 20, absent: 2 }}},
    { studentId: 's2', monthlyData: { 'Jun': { present: 19, absent: 2 }, 'Jul': { present: 22, absent: 0 }}},
];

const MOCK_SETTINGS: SchoolSettings = {
    schoolName: 'ENRIQUE URENCIA ELEMENTARY SCHOOL',
    region: 'Region XI',
    division: 'Division of the City of Mati',
    district: 'Governor Generoso North District',
    schoolYear: '2023-2024'
};

const MOCK_SUBSTITUTE_ASSIGNMENTS: SubstituteAssignment[] = [];

const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: SetStateAction<T>) => void] => {
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
  const [sections, setSections] = useLocalStorage<Section[]>('sections', MOCK_SECTIONS);
  const [settings, setSettings] = useLocalStorage<SchoolSettings>('settings', MOCK_SETTINGS);
  const [substituteAssignments, setSubstituteAssignments] = useLocalStorage<SubstituteAssignment[]>('substituteAssignments', MOCK_SUBSTITUTE_ASSIGNMENTS);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (isOnline) { setIsSyncing(true); const timer = setTimeout(() => { console.log("Data synced with server."); setIsSyncing(false); }, 1500); return () => clearTimeout(timer); }
  }, [isOnline]);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser | null> => {
    const user = teachers.find(t => t.email.toLowerCase() === email.toLowerCase());
    if (user && user.password === password) {
      const { password: _, ...authUser } = user;
      return authUser;
    }
    return null;
  }, [teachers]);

  const addStudent = useCallback((student: Omit<Student, 'id' | 'enrollmentDate'>): { success: boolean; message?: string } => {
    if (student.lrn && !/^\d{12}$/.test(student.lrn)) {
      return { success: false, message: 'Invalid LRN. The LRN must be a 12-digit number.' };
    }
    const newStudent: Student = { ...student, id: `s${Date.now()}`, enrollmentDate: new Date().toISOString().split('T')[0] };
    setStudents(prev => [...prev, newStudent]);
    return { success: true };
  }, [setStudents]);
  
  const updateStudent = useCallback((updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  }, [setStudents]);

  const deleteStudent = useCallback((studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    setGrades(prev => prev.filter(g => g.studentId !== studentId));
    setCoreValueGrades(prev => prev.filter(cvg => cvg.studentId !== studentId));
    setAttendanceRecords(prev => prev.filter(ar => ar.studentId !== studentId));
  }, [setStudents, setGrades, setCoreValueGrades, setAttendanceRecords]);

  const addLearningArea = useCallback((learningArea: Omit<LearningArea, 'id'>) => {
    let newLearningArea: LearningArea = { ...learningArea, id: `la${Date.now()}` };
    if (learningArea.name.toUpperCase() === 'MAPEH') { newLearningArea = { ...newLearningArea, isComposite: true, subSubjects: ['Music', 'Arts', 'PE', 'Health'], }; }
    setLearningAreas(prev => [...prev, newLearningArea]);
  }, [setLearningAreas]);

  const deleteLearningArea = useCallback((learningAreaId: string) => {
    setLearningAreas(prev => prev.filter(la => la.id !== learningAreaId));
    setGrades(prev => prev.filter(g => g.learningAreaId !== learningAreaId));
  }, [setLearningAreas, setGrades]);

  const addTeacher = useCallback((teacher: Omit<Teacher, 'id'>) => {
    const newTeacher: Teacher = { ...teacher, id: `t${Date.now()}`, password: 'teacher123' }; // Default password for new teachers
    setTeachers(prev => {
        let newTeachers = [...prev];
        if (newTeacher.role === 'principal') {
            newTeachers = newTeachers.map(t => t.role === 'principal' ? { ...t, role: 'teacher' } : t);
        }
        return [...newTeachers, newTeacher];
    });
  }, [setTeachers]);

  const updateTeacher = useCallback((updatedTeacher: Teacher) => {
    setTeachers(prev => {
        let newTeachers = prev.map(t => t.id === updatedTeacher.id ? updatedTeacher : t);
        if (updatedTeacher.role === 'principal') {
            newTeachers = newTeachers.map(t => (t.role === 'principal' && t.id !== updatedTeacher.id) ? { ...t, role: 'teacher' } : t);
        }
        return newTeachers;
    });
  }, [setTeachers]);
  
  const deleteTeacher = useCallback((teacherId: string) => {
      setTeachers(prev => prev.filter(t => t.id !== teacherId));
      setSections(prev => prev.map(s => s.adviserId === teacherId ? {...s, adviserId: undefined} : s));
      setSubstituteAssignments(prev => prev.filter(sub => sub.teacherId !== teacherId));
  }, [setTeachers, setSections, setSubstituteAssignments]);
  
  const addSection = useCallback((section: Omit<Section, 'id'>) => {
    const newSection: Section = { ...section, id: `sec${Date.now()}` };
    setSections(prev => [...prev, newSection]);
  }, [setSections]);
  
  const updateSection = useCallback((updatedSection: Section) => {
    setSections(prev => prev.map(s => s.id === updatedSection.id ? updatedSection : s));
  }, [setSections]);

  const deleteSection = useCallback((sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
    setStudents(prev => prev.map(s => s.sectionId === sectionId ? {...s, sectionId: undefined} : s));
    setSubstituteAssignments(prev => prev.filter(sub => sub.sectionId !== sectionId));
  }, [setSections, setStudents, setSubstituteAssignments]);

  const addSubstituteAssignment = useCallback((assignment: Omit<SubstituteAssignment, 'id'>) => {
    const newAssignment: SubstituteAssignment = { ...assignment, id: `sub${Date.now()}` };
    setSubstituteAssignments(prev => [...prev, newAssignment]);
  }, [setSubstituteAssignments]);

  const updateSubstituteAssignment = useCallback((updatedAssignment: SubstituteAssignment) => {
    setSubstituteAssignments(prev => prev.map(sub => sub.id === updatedAssignment.id ? updatedAssignment : sub));
  }, [setSubstituteAssignments]);

  const deleteSubstituteAssignment = useCallback((assignmentId: string) => {
    setSubstituteAssignments(prev => prev.filter(sub => sub.id !== assignmentId));
  }, [setSubstituteAssignments]);


  const updateGrade = useCallback((studentId: string, learningAreaId: string, quarter: 'q1'|'q2'|'q3'|'q4', gradeValue: number|undefined, subSubject?: string) => {
    setGrades(prev => {
      const newGrades = [...prev]; let gradeIndex = newGrades.findIndex(g => g.studentId === studentId && g.learningAreaId === learningAreaId);
      if (gradeIndex === -1) { newGrades.push({ id: `g-${studentId}-${learningAreaId}`, studentId, learningAreaId, }); gradeIndex = newGrades.length - 1; }
      const updatedGrade = { ...newGrades[gradeIndex] }; const learningArea = learningAreas.find(la => la.id === learningAreaId);
      if (learningArea?.isComposite && subSubject) { const currentQuarterGrade = updatedGrade[quarter]; let newSubGrades: SubGradeRecord = {}; if (typeof currentQuarterGrade === 'object' && currentQuarterGrade !== null) { newSubGrades = { ...currentQuarterGrade }; } if (gradeValue === undefined) { delete newSubGrades[subSubject]; } else { newSubGrades[subSubject] = gradeValue; } updatedGrade[quarter] = newSubGrades; } else if (!learningArea?.isComposite) { if (gradeValue === undefined) { delete updatedGrade[quarter]; } else { updatedGrade[quarter] = gradeValue; } }
      const quarterAverages = [calculateQuarterAverage(updatedGrade.q1), calculateQuarterAverage(updatedGrade.q2), calculateQuarterAverage(updatedGrade.q3), calculateQuarterAverage(updatedGrade.q4)].filter(g => g !== undefined) as number[];
      if (quarterAverages.length > 0) { const total = quarterAverages.reduce((acc, val) => acc + val, 0); const finalGrade = Math.round(total / quarterAverages.length); updatedGrade.finalGrade = finalGrade; updatedGrade.remarks = finalGrade >= 75 ? 'Passed' : 'Failed'; } else { delete updatedGrade.finalGrade; delete updatedGrade.remarks; }
      newGrades[gradeIndex] = updatedGrade; return newGrades;
    });
  }, [setGrades, learningAreas]);
  
  const updateCoreValueGrade = useCallback((studentId: string, coreValueId: string, quarter: 'q1'|'q2'|'q3'|'q4', behavior: string, marking: CoreValueMarking|'') => {
    setCoreValueGrades(prev => {
      const newGrades = [...prev]; let gradeIndex = newGrades.findIndex(g => g.studentId === studentId && g.coreValueId === coreValueId);
      if (gradeIndex === -1) { newGrades.push({ id: `cvg-${studentId}-${coreValueId}`, studentId, coreValueId, }); gradeIndex = newGrades.length - 1; }
      const updatedGrade = { ...newGrades[gradeIndex] }; const currentQuarterMarkings = updatedGrade[quarter] ?? {}; const newQuarterMarkings = { ...currentQuarterMarkings };
      if (marking === '') { delete newQuarterMarkings[behavior]; } else { newQuarterMarkings[behavior] = marking; }
      updatedGrade[quarter] = newQuarterMarkings; newGrades[gradeIndex] = updatedGrade; return newGrades;
    });
  }, [setCoreValueGrades]);

  const updateAttendance = useCallback((studentId: string, month: string, type: 'present' | 'absent', value: number) => {
    setAttendanceRecords(prev => {
        const newRecords = [...prev];
        let recordIndex = newRecords.findIndex(r => r.studentId === studentId);
        if (recordIndex === -1) { newRecords.push({ studentId, monthlyData: {} }); recordIndex = newRecords.length - 1; }
        const updatedRecord = { ...newRecords[recordIndex] }; const monthData = updatedRecord.monthlyData[month] ?? { present: 0, absent: 0 };
        const newMonthData = { ...monthData, [type]: value }; updatedRecord.monthlyData = { ...updatedRecord.monthlyData, [month]: newMonthData };
        newRecords[recordIndex] = updatedRecord; return newRecords;
    });
  }, [setAttendanceRecords]);

  const updateSettings = useCallback((newSettings: SchoolSettings) => {
    setSettings(newSettings);
  }, [setSettings]);

  return { students, learningAreas, grades, coreValues, coreValueGrades, attendanceRecords, teachers, sections, settings, substituteAssignments, login, addStudent, updateStudent, deleteStudent, addLearningArea, deleteLearningArea, addTeacher, updateTeacher, deleteTeacher, addSection, updateSection, deleteSection, updateGrade, updateCoreValueGrade, updateAttendance, updateSettings, addSubstituteAssignment, updateSubstituteAssignment, deleteSubstituteAssignment, isSyncing, loading: false, monthlySchoolDaysConfig: MONTHLY_SCHOOL_DAYS_CONFIG };
};

export type SchoolDataHook = ReturnType<typeof useSchoolData>;