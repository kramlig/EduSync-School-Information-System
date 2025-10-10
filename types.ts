export type ViewType = 'dashboard' | 'students' | 'learningAreas' | 'grades' | 'coreValues' | 'attendance' | 'teachers' | 'sections' | 'settings' | 'substitutes' | 'scheduler' | 'gradebook' | 'coreValuesGradebook' | 'assignments';
import type { SetStateAction } from 'react';

export interface Student {
  id: string;
  name: string;
  email: string;
  enrollmentDate: string;
  dateOfBirth?: string;
  sex?: 'Male' | 'Female';
  lrn?: string;
  sectionId?: string;
  password?: string;
}

export type StudentUser = Omit<Student, 'password'>;

export interface TeacherAssignment {
  gradeLevel: number;
  learningAreaId: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  contactNumber?: string;
  assignments?: TeacherAssignment[];
  role: 'admin' | 'teacher' | 'principal' | 'registrar';
  password?: string;
}

// FIX: Updated AuthUser to Omit only 'password' from Teacher.
// The previous type omitted 'assignments' and 'contactNumber', which are present on the user
// object after login and are required by some components.
export type AuthUser = Omit<Teacher, 'password'>;

export interface Section {
  id: string;
  gradeLevel: number;
  name: string;
  adviserId?: string;
}

export interface LearningArea {
  id:string;
  name: string;
  credits: number;
  isComposite?: boolean;
  subSubjects?: string[];
}

export type SubGradeRecord = Record<string, number>;

export interface Grade {
  id: string;
  studentId: string;
  learningAreaId: string;
  q1?: number | SubGradeRecord;
  q2?: number | SubGradeRecord;
  q3?: number | SubGradeRecord;
  q4?: number | SubGradeRecord;
  finalGrade?: number;
  remarks?: 'Passed' | 'Failed';
}

export interface CoreValue {
  id: string;
  name: string;
  behaviors: string[];
}

export type CoreValueMarking = 'AO' | 'SO' | 'RO' | 'NO';

export interface CoreValueGrade {
  id: string;
  studentId: string;
  coreValueId: string;
  q1?: Record<string, CoreValueMarking>;
  q2?: Record<string, CoreValueMarking>;
  q3?: Record<string, CoreValueMarking>;
  q4?: Record<string, CoreValueMarking>;
}

export interface AttendanceRecord {
    studentId: string;
    monthlyData: Record<string, { present: number; absent: number }>; 
}

export interface SchoolSettings {
    schoolName: string;
    region: string;
    division: string;
    district: string;
    schoolYear: string;
}

export interface SubstituteAssignment {
  id: string;
  teacherId: string;
  sectionId: string;
  startDate: string; 
  endDate: string;
}

export interface ClassSchedule {
  id: string;
  title: string;
  type: 'academic' | 'extracurricular';
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string; // "HH:mm" format
  endTime: string;   // "HH:mm" format
  
  scope: 'section' | 'gradeLevel' | 'all';
  
  // Optional fields that depend on the type
  sectionId?: string;
  learningAreaId?: string;
  teacherId?: string;
  gradeLevel?: number;
}

export interface Assignment {
  id: string;
  sectionId: string;
  learningAreaId: string;
  title: string;
  description: string;
  totalPoints: number;
  dueDate: string;
}

export interface StudentAssignmentGrade {
  assignmentId: string;
  studentId: string;
  score: number | null;
}