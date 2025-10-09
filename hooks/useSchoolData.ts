import { useState, useEffect, useCallback, SetStateAction } from 'react';
import type { Student, LearningArea, Grade, SubGradeRecord, CoreValue, CoreValueGrade, CoreValueMarking } from '../types';

const MOCK_STUDENTS: Student[] = [
  { id: 's1', name: 'Alice Johnson', email: 'alice.j@school.edu', enrollmentDate: '2023-09-01' },
  { id: 's2', name: 'Bob Williams', email: 'bob.w@school.edu', enrollmentDate: '2023-09-01' },
  { id: 's3', name: 'Charlie Brown', email: 'charlie.b@school.edu', enrollmentDate: '2023-09-01' },
];

const MOCK_LEARNING_AREAS: LearningArea[] = [
  { id: 'c1', name: 'Mother Tongue Based (MTB)', credits: 3 },
  { id: 'c2', name: 'Filipino', credits: 3 },
  { id: 'c3', name: 'English', credits: 4 },
  { id: 'c4', name: 'Math', credits: 4 },
  { id: 'c4', name: 'Araling Panlipunan', credits: 4 },
  { id: 'c4', name: 'Edukasyong Pagpakatao (EsP)', credits: 4 },
  { 
    id: 'c5', 
    name: 'MAPEH', 
    credits: 4, 
    isComposite: true, 
    subSubjects: ['Music', 'Arts', 'PE', 'Health'] 
  },
];

const MOCK_GRADES: Grade[] = [
  { id: 'g-s1-c1', studentId: 's1', learningAreaId: 'c1', q1: 92, q2: 94, q3: 88, q4: 95, finalGrade: 92, remarks: 'Passed' },
  { id: 'g-s1-c2', studentId: 's1', learningAreaId: 'c2', q1: 88, q2: 90, finalGrade: 89, remarks: 'Passed' },
  { id: 'g-s2-c1', studentId: 's2', learningAreaId: 'c1', q1: 74, q2: 70, q3: 78, q4: 75, finalGrade: 74, remarks: 'Failed' },
  { id: 'g-s2-c3', studentId: 's2', learningAreaId: 'c3', q1: 95, q2: 96, q3: 92, finalGrade: 94, remarks: 'Passed' },
  { id: 'g-s3-c4', studentId: 's3', learningAreaId: 'c4', q1: 68, q2: 72, finalGrade: 70, remarks: 'Failed' },
  { 
    id: 'g-s1-c5', 
    studentId: 's1', 
    learningAreaId: 'c5',
    q1: { 'Music': 90, 'Arts': 85, 'PE': 92, 'Health': 88 }, // Avg: 89
    q2: { 'Music': 92, 'Arts': 88, 'PE': 94, 'Health': 90 }, // Avg: 91
    finalGrade: 90,
    remarks: 'Passed'
  },
];

const MOCK_CORE_VALUES: CoreValue[] = [
  {
    id: 'cv1',
    name: 'Maka-Diyos',
    behaviors: [
      "Expresses one's spiritual beliefs while respecting the spiritual beliefs of others",
      "Shows adherence to ethical principles by upholding truth"
    ]
  },
  {
    id: 'cv2',
    name: 'Makatao',
    behaviors: [
      "Is sensitive to individual, social, and cultural differences",
      "Demonstrates contributions toward solidarity"
    ]
  },
  {
    id: 'cv3',
    name: 'Makakalikasan',
    behaviors: [
      "Cares for the environment and utilizes resources wisely, judiciously, and economically"
    ]
  },
  {
    id: 'cv4',
    name: 'Makabansa',
    behaviors: [
      "Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen",
      "Demonstrates appropriate behavior in carrying out activities in the school, community, and country"
    ]
  }
];

const MOCK_CORE_VALUE_GRADES: CoreValueGrade[] = [
  {
    id: 'cvg-s1-cv1',
    studentId: 's1',
    coreValueId: 'cv1',
    q1: {
      "Expresses one's spiritual beliefs while respecting the spiritual beliefs of others": 'AO',
      "Shows adherence to ethical principles by upholding truth": 'SO'
    },
    q2: {
      "Expresses one's spiritual beliefs while respecting the spiritual beliefs of others": 'AO',
      "Shows adherence to ethical principles by upholding truth": 'AO'
    }
  }
];

const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: SetStateAction<T>) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: SetStateAction<T>) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };
  return [storedValue, setValue];
};

const calculateQuarterAverage = (grade: number | SubGradeRecord | undefined): number | undefined => {
  if (grade === undefined) return undefined;
  if (typeof grade === 'number') return grade;
  
  const subGrades = Object.values(grade).filter(g => typeof g === 'number');
  if (subGrades.length === 0) return undefined;
  
  const total = subGrades.reduce((acc, val) => acc + val, 0);
  return Math.round(total / subGrades.length);
};

export const useSchoolData = (isOnline: boolean) => {
  const [students, setStudents] = useLocalStorage<Student[]>('students', MOCK_STUDENTS);
  const [learningAreas, setLearningAreas] = useLocalStorage<LearningArea[]>('learningAreas', MOCK_LEARNING_AREAS);
  const [grades, setGrades] = useLocalStorage<Grade[]>('grades', MOCK_GRADES);
  const [coreValues, setCoreValues] = useLocalStorage<CoreValue[]>('coreValues', MOCK_CORE_VALUES);
  const [coreValueGrades, setCoreValueGrades] = useLocalStorage<CoreValueGrade[]>('coreValueGrades', MOCK_CORE_VALUE_GRADES);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (isOnline) {
      setIsSyncing(true);
      const timer = setTimeout(() => {
        console.log("Data synced with server.");
        setIsSyncing(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const addStudent = useCallback((student: Omit<Student, 'id'>) => {
    const newStudent: Student = { ...student, id: `s${Date.now()}` };
    setStudents(prev => [...prev, newStudent]);
  }, [setStudents]);

  const addLearningArea = useCallback((learningArea: Omit<LearningArea, 'id'>) => {
    let newLearningArea: LearningArea = { ...learningArea, id: `c${Date.now()}` };
    if (learningArea.name.toUpperCase() === 'MAPEH') {
      newLearningArea = {
        ...newLearningArea,
        isComposite: true,
        subSubjects: ['Music', 'Arts', 'PE', 'Health'],
      };
    }
    setLearningAreas(prev => [...prev, newLearningArea]);
  }, [setLearningAreas]);

  const updateGrade = useCallback((
    studentId: string,
    learningAreaId: string,
    quarter: 'q1' | 'q2' | 'q3' | 'q4',
    gradeValue: number | undefined,
    subSubject?: string
  ) => {
      setGrades(prev => {
        const newGrades = [...prev];
        let gradeIndex = newGrades.findIndex(g => g.studentId === studentId && g.learningAreaId === learningAreaId);

        if (gradeIndex === -1) {
          newGrades.push({
            id: `g-${studentId}-${learningAreaId}`,
            studentId,
            learningAreaId,
          });
          gradeIndex = newGrades.length - 1;
        }

        const updatedGrade = { ...newGrades[gradeIndex] };
        const learningArea = learningAreas.find(la => la.id === learningAreaId);

        if (learningArea?.isComposite && subSubject) {
            const currentQuarterGrade = updatedGrade[quarter];
            let newSubGrades: SubGradeRecord = {};
            if (typeof currentQuarterGrade === 'object' && currentQuarterGrade !== null) {
                newSubGrades = { ...currentQuarterGrade };
            }

            if (gradeValue === undefined) {
                delete newSubGrades[subSubject];
            } else {
                newSubGrades[subSubject] = gradeValue;
            }
            updatedGrade[quarter] = newSubGrades;
        } else if (!learningArea?.isComposite) {
            if (gradeValue === undefined) {
              delete updatedGrade[quarter];
            } else {
              updatedGrade[quarter] = gradeValue;
            }
        }
        
        const q1Avg = calculateQuarterAverage(updatedGrade.q1);
        const q2Avg = calculateQuarterAverage(updatedGrade.q2);
        const q3Avg = calculateQuarterAverage(updatedGrade.q3);
        const q4Avg = calculateQuarterAverage(updatedGrade.q4);
        
        const quarterAverages = [q1Avg, q2Avg, q3Avg, q4Avg].filter(g => g !== undefined) as number[];

        if (quarterAverages.length > 0) {
            const total = quarterAverages.reduce((acc, val) => acc + val, 0);
            const finalGrade = Math.round(total / quarterAverages.length);
            updatedGrade.finalGrade = finalGrade;
            updatedGrade.remarks = finalGrade >= 75 ? 'Passed' : 'Failed';
        } else {
            delete updatedGrade.finalGrade;
            delete updatedGrade.remarks;
        }
        
        newGrades[gradeIndex] = updatedGrade;
        return newGrades;
      });
  }, [setGrades, learningAreas]);
  
  const updateCoreValueGrade = useCallback((
    studentId: string,
    coreValueId: string,
    quarter: 'q1' | 'q2' | 'q3' | 'q4',
    behavior: string,
    marking: CoreValueMarking | ''
  ) => {
    setCoreValueGrades(prev => {
      const newGrades = [...prev];
      let gradeIndex = newGrades.findIndex(g => g.studentId === studentId && g.coreValueId === coreValueId);

      if (gradeIndex === -1) {
        newGrades.push({
          id: `cvg-${studentId}-${coreValueId}`,
          studentId,
          coreValueId,
        });
        gradeIndex = newGrades.length - 1;
      }
      
      const updatedGrade = { ...newGrades[gradeIndex] };
      const currentQuarterMarkings = updatedGrade[quarter] ?? {};
      const newQuarterMarkings = { ...currentQuarterMarkings };

      if (marking === '') {
        delete newQuarterMarkings[behavior];
      } else {
        newQuarterMarkings[behavior] = marking;
      }
      
      updatedGrade[quarter] = newQuarterMarkings;
      newGrades[gradeIndex] = updatedGrade;

      return newGrades;
    });
  }, [setCoreValueGrades]);


  const getStudentById = useCallback((id: string) => {
    return students.find(s => s.id === id);
  }, [students]);

  const getLearningAreaById = useCallback((id: string) => {
    return learningAreas.find(c => c.id === id);
  }, [learningAreas]);

  return {
    students,
    learningAreas,
    grades,
    coreValues,
    coreValueGrades,
    addStudent,
    addLearningArea,
    updateGrade,
    updateCoreValueGrade,
    getStudentById,
    getLearningAreaById,
    isSyncing,
    loading: false,
  };
};

export type SchoolDataHook = ReturnType<typeof useSchoolData>;