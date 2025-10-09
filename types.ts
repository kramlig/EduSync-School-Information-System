
export interface Student {
  id: string;
  name: string;
  email: string;
  enrollmentDate: string;
}

export interface Course {
  id: string;
  name: string;
  credits: number;
}

export interface Grade {
  id: string;
  studentId: string;
  courseId: string;
  grade: number; // A percentage grade
}

export type ViewType = 'dashboard' | 'students' | 'courses' | 'grades';
