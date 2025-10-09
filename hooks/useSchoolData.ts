
import { useState, useEffect, useCallback, SetStateAction } from 'react';
import type { Student, Course, Grade } from '../types';

const MOCK_STUDENTS: Student[] = [
  { id: 's1', name: 'Alice Johnson', email: 'alice.j@school.edu', enrollmentDate: '2023-09-01' },
  { id: 's2', name: 'Bob Williams', email: 'bob.w@school.edu', enrollmentDate: '2023-09-01' },
  { id: 's3', name: 'Charlie Brown', email: 'charlie.b@school.edu', enrollmentDate: '2023-09-01' },
];

const MOCK_COURSES: Course[] = [
  { id: 'c1', name: 'Mathematics 101', credits: 3 },
  { id: 'c2', name: 'History of Art', credits: 3 },
  { id: 'c3', name: 'Introduction to Python', credits: 4 },
  { id: 'c4', name: 'Physics for Beginners', credits: 4 },
];

const MOCK_GRADES: Grade[] = [
  { id: 'g1', studentId: 's1', courseId: 'c1', grade: 92 },
  { id: 'g2', studentId: 's1', courseId: 'c2', grade: 88 },
  { id: 'g3', studentId: 's2', courseId: 'c1', grade: 74 },
  { id: 'g4', studentId: 's2', courseId: 'c3', grade: 95 },
  { id: 'g5', studentId: 's3', courseId: 'c4', grade: 68 },
];

// FIX: Update the signature of useLocalStorage to correctly handle functional updates.
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

export const useSchoolData = (isOnline: boolean) => {
  const [students, setStudents] = useLocalStorage<Student[]>('students', MOCK_STUDENTS);
  const [courses, setCourses] = useLocalStorage<Course[]>('courses', MOCK_COURSES);
  const [grades, setGrades] = useLocalStorage<Grade[]>('grades', MOCK_GRADES);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (isOnline) {
      setIsSyncing(true);
      // Simulate syncing data with a server
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

  const addCourse = useCallback((course: Omit<Course, 'id'>) => {
    const newCourse: Course = { ...course, id: `c${Date.now()}` };
    setCourses(prev => [...prev, newCourse]);
  }, [setCourses]);

  const addGrade = useCallback((grade: Omit<Grade, 'id'>) => {
    const newGrade: Grade = { ...grade, id: `g${Date.now()}` };
    setGrades(prev => {
        const existingGradeIndex = prev.findIndex(g => g.studentId === newGrade.studentId && g.courseId === newGrade.courseId);
        if (existingGradeIndex > -1) {
            const updatedGrades = [...prev];
            updatedGrades[existingGradeIndex] = newGrade;
            return updatedGrades;
        }
        return [...prev, newGrade];
    });
  }, [setGrades]);
  
  const getStudentById = useCallback((id: string) => {
    return students.find(s => s.id === id);
  }, [students]);

  const getCourseById = useCallback((id: string) => {
    return courses.find(c => c.id === id);
  }, [courses]);

  return {
    students,
    courses,
    grades,
    addStudent,
    addCourse,
    addGrade,
    getStudentById,
    getCourseById,
    isSyncing,
    loading: false, // In a real app, this would track fetching state
  };
};

export type SchoolDataHook = ReturnType<typeof useSchoolData>;