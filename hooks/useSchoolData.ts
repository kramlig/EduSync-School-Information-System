import { useState, useEffect, useCallback, SetStateAction } from 'react';
import type { Student, LearningArea, Grade, SubGradeRecord, CoreValue, CoreValueGrade, CoreValueMarking, AttendanceRecord } from '../types';

const MOCK_STUDENTS: Student[] = [
  { id: 's1', name: 'Alice Johnson', email: 'alice.j@school.edu', enrollmentDate: '2023-09-01', lrn: '123456789012', dateOfBirth: '2015-06-15', sex: 'Female', gradeLevel: 3, section: 'A', schoolYear: '2023-2024' },
  { id: 's2', name: 'Bob Williams', email: 'bob.w@school.edu', enrollmentDate: '2023-09-01', lrn: '210987654321', dateOfBirth: '2015-03-22', sex: 'Male', gradeLevel: 3, section: 'A', schoolYear: '2023-2024' },
  { id: 's3', name: 'Charlie Brown', email: 'charlie.b@school.edu', enrollmentDate: '2023-09-01', lrn: '345678901234', dateOfBirth: '2015-09-01', sex: 'Male', gradeLevel: 3, section: 'B', schoolYear: '2023-2024' },
];

const MOCK_LEARNING_AREAS: LearningArea[] = [
  { id: 'la1', name: 'Mother Tongue Based (MTB)', credits: 3 },
  { id: 'la2', name: 'Filipino', credits: 3 },
  { id: 'la3', name: 'English', credits: 4 },
  { id: 'la4', name: 'Math', credits: 4 },
  { id: 'la5', name: 'Araling Panlipunan (AP)', credits: 4 },
  { id: 'la6', name: 'Edukasyon sa Pagpapakatao (EsP)', credits: 2 },
  { 
    id: 'la7', 
    name: 'MAPEH', 
    credits: 4, 
    isComposite: true, 
    subSubjects: ['Music', 'Arts', 'PE', 'Health'] 
  },
];

const MOCK_GRADES: Grade[] = [
  { id: 'g-s1-la1', studentId: 's1', learningAreaId: 'la1', q1: 92, q2: 94, q3: 88, q4: 95, finalGrade: 92, remarks: 'Passed' },
  { id: 'g-s1-la2', studentId: 's1', learningAreaId: 'la2', q1: 88, q2: 90, q3: 91, q4: 89, finalGrade: 90, remarks: 'Passed' },
  { id: 'g-s1-la3', studentId: 's1', learningAreaId: 'la3', q1: 85, q2: 87, q3: 88, q4: 90, finalGrade: 88, remarks: 'Passed' },
  { id: 'g-s1-la4', studentId: 's1', learningAreaId: 'la4', q1: 95, q2: 93, q3: 96, q4: 94, finalGrade: 95, remarks: 'Passed' },
  { id: 'g-s1-la5', studentId: 's1', learningAreaId: 'la5', q1: 88, q2: 89, q3: 92, q4: 90, finalGrade: 90, remarks: 'Passed' },
  { id: 'g-s1-la6', studentId: 's1', learningAreaId: 'la6', q1: 91, q2: 92, q3: 93, q4: 94, finalGrade: 93, remarks: 'Passed' },
  { 
    id: 'g-s1-la7', 
    studentId: 's1', 
    learningAreaId: 'la7',
    q1: { 'Music': 90, 'Arts': 85, 'PE': 92, 'Health': 88 }, // Avg: 89
    q2: { 'Music': 92, 'Arts': 88, 'PE': 94, 'Health': 90 }, // Avg: 91
    q3: { 'Music': 88, 'Arts': 90, 'PE': 91, 'Health': 89 }, // Avg: 90
    q4: { 'Music': 94, 'Arts': 91, 'PE': 93, 'Health': 92 }, // Avg: 93
    finalGrade: 91,
    remarks: 'Passed'
  },
  { id: 'g-s2-la1', studentId: 's2', learningAreaId: 'la1', q1: 74, q2: 70, q3: 78, q4: 75, finalGrade: 74, remarks: 'Failed' },
  { id: 'g-s2-la3', studentId: 's2', learningAreaId: 'la3', q1: 95, q2: 96, q3: 92, finalGrade: 94, remarks: 'Passed' },
  { id: 'g-s3-la4', studentId: 's3', learningAreaId: 'la4', q1: 68, q2: 72, finalGrade: 70, remarks: 'Failed' },
];

const MOCK_CORE_VALUES: CoreValue[] = [
  { id: 'cv1', name: 'Maka-Diyos', behaviors: ["Expresses one's spiritual beliefs while respecting the spiritual beliefs of others", "Shows adherence to ethical principles by upholding truth"] },
  { id: 'cv2', name: 'Makatao', behaviors: ["Is sensitive to individual, social, and cultural differences", "Demonstrates contributions toward solidarity"] },
  { id: 'cv3', name: 'Makakalikasan', behaviors: ["Cares for the environment and utilizes resources wisely, judiciously, and economically"] },
  { id: 'cv4', name: 'Makabansa', behaviors: ["Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen", "Demonstrates appropriate behavior in carrying out activities in the school, community, and country"] }
];

const MOCK_CORE_VALUE_GRADES: CoreValueGrade[] = [
  { id: 'cvg-s1-cv1', studentId: 's1', coreValueId: 'cv1', q1: { "Expresses one's spiritual beliefs while respecting the spiritual beliefs of others": 'AO', "Shows adherence to ethical principles by upholding truth": 'SO' }, q2: { "Expresses one's spiritual beliefs while respecting the spiritual beliefs of others": 'AO', "Shows adherence to ethical principles by upholding truth": 'AO' }, q3: { "Expresses one's spiritual beliefs while respecting the spiritual beliefs of others": 'AO', "Shows adherence to ethical principles by upholding truth": 'AO' }, q4: { "Expresses one's spiritual beliefs while respecting the spiritual beliefs of others": 'AO', "Shows adherence to ethical principles by upholding truth": 'AO' } },
  { id: 'cvg-s1-cv2', studentId: 's1', coreValueId: 'cv2', q1: { "Is sensitive to individual, social, and cultural differences": 'SO', "Demonstrates contributions toward solidarity": 'AO' }, q2: { "Is sensitive to individual, social, and cultural differences": 'AO', "Demonstrates contributions toward solidarity": 'AO' } }
];

export const MONTHLY_SCHOOL_DAYS_CONFIG: Record<string, number> = {
  'Jun': 21, 'Jul': 22, 'Aug': 23, 'Sep': 21, 'Oct': 20,
  'Nov': 19, 'Dec': 15, 'Jan': 22, 'Feb': 20, 'Mar': 21, 'Apr': 5,
};

const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] = [
    { studentId: 's1', monthlyData: {
        'Jun': { present: 21, absent: 0 },
        'Jul': { present: 20, absent: 2 },
        'Aug': { present: 23, absent: 0 },
    }},
     { studentId: 's2', monthlyData: {
        'Jun': { present: 19, absent: 2 },
        'Jul': { present: 22, absent: 0 },
    }},
];

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
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (isOnline) { setIsSyncing(true); const timer = setTimeout(() => { console.log("Data synced with server."); setIsSyncing(false); }, 1500); return () => clearTimeout(timer); }
  }, [isOnline]);

  const addStudent = useCallback((student: Omit<Student, 'id' | 'enrollmentDate'>) => {
    const newStudent: Student = { ...student, id: `s${Date.now()}`, enrollmentDate: new Date().toISOString().split('T')[0] };
    setStudents(prev => [...prev, newStudent]);
  }, [setStudents]);

  const addLearningArea = useCallback((learningArea: Omit<LearningArea, 'id'>) => {
    let newLearningArea: LearningArea = { ...learningArea, id: `c${Date.now()}` };
    if (learningArea.name.toUpperCase() === 'MAPEH') { newLearningArea = { ...newLearningArea, isComposite: true, subSubjects: ['Music', 'Arts', 'PE', 'Health'], }; }
    setLearningAreas(prev => [...prev, newLearningArea]);
  }, [setLearningAreas]);

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
        if (recordIndex === -1) {
            newRecords.push({ studentId, monthlyData: {} });
            recordIndex = newRecords.length - 1;
        }
        const updatedRecord = { ...newRecords[recordIndex] };
        const monthData = updatedRecord.monthlyData[month] ?? { present: 0, absent: 0 };
        const newMonthData = { ...monthData, [type]: value };
        updatedRecord.monthlyData = { ...updatedRecord.monthlyData, [month]: newMonthData };
        newRecords[recordIndex] = updatedRecord;
        return newRecords;
    });
  }, [setAttendanceRecords]);

  return { students, learningAreas, grades, coreValues, coreValueGrades, attendanceRecords, addStudent, addLearningArea, updateGrade, updateCoreValueGrade, updateAttendance, isSyncing, loading: false, monthlySchoolDaysConfig: MONTHLY_SCHOOL_DAYS_CONFIG };
};

export type SchoolDataHook = ReturnType<typeof useSchoolData>;