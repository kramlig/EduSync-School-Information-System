import type { SetStateAction } from 'react';

export interface Student {
  id: string;
  name: string;
  email: string;
  enrollmentDate: string;
}

export interface LearningArea {
  id: string;
  name: string;
  credits: number;
  isComposite?: boolean; // To identify subjects like MAPEH
  subSubjects?: string[]; // e.g., ['Music', 'Arts', 'PE', 'Health']
}

// Represents the grade for a single quarter for a composite subject
export type SubGradeRecord = Record<string, number>;

export interface Grade {
  id: string;
  studentId: string;
  learningAreaId: string;
  
  // A grade for each of the 4 quarters.
  // The value can be a direct grade or sub-grades for composite subjects.
  q1?: number | SubGradeRecord;
  q2?: number | SubGradeRecord;
  q3?: number | SubGradeRecord;
  q4?: number | SubGradeRecord;

  // Calculated fields
  finalGrade?: number;
  remarks?: 'Passed' | 'Failed';
}

// --- New Core Values Types ---

export interface CoreValue {
  id: string;
  name: string;
  behaviors: string[];
}

export type CoreValueMarking = 'AO' | 'SO' | 'RO' | 'NO';

export interface CoreValueGrade {
  id: string; // e.g., 'cvg-s1-cv1'
  studentId: string;
  coreValueId: string;
  // Each quarter contains a record of markings for each behavior statement
  q1?: Record<string, CoreValueMarking>;
  q2?: Record<string, CoreValueMarking>;
  q3?: Record<string, CoreValueMarking>;
  q4?: Record<string, CoreValueMarking>;
}

export type ViewType = 'dashboard' | 'students' | 'learningAreas' | 'grades' | 'coreValues';