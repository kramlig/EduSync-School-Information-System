export type ViewType = 'dashboard' | 'students' | 'learningAreas' | 'grades' | 'coreValues' | 'attendance' | 'teachers' | 'sections' | 'settings' | 'substitutes' | 'scheduler' | 'gradebook' | 'coreValuesGradebook' | 'assignments' | 'lessonPlans' | 'announcements' | 'parents';

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

export type AuthUser = Omit<Teacher, 'password'>;

export interface Parent {
    id: string;
    name: string;
    email: string;
    password?: string;
    studentIds: string[];
}

export type ParentUser = Omit<Parent, 'password'>;

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

export type AttendanceStatus = 'P' | 'A' | 'L' | 'E'; // Present, Absent, Late, Excused

export interface AttendanceRecord {
    studentId: string;
    dailyStatus: Record<string, AttendanceStatus>; // "YYYY-MM-DD": "P"
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
  teacherId: string; // The substitute teacher
  originalTeacherId: string; // The teacher being replaced
  startDate: string; 
  endDate: string;
}

export interface ClassSchedule {
  id: string;
  title: string;
  type: 'academic' | 'extracurricular';
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'; // This is the start day
  endDayOfWeek?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'; // Optional end day for multi-day events
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
  id?: string; // Firestore document id (composite: sag_{assignmentId}_{studentId})
  assignmentId: string;
  studentId: string;
  score: number | null;
  submissionDate: string | null;
  filePath: string | null;
  feedback: string | null;
  updatedAt?: number; // client-side timestamp for last update
}

export interface LessonResource {
  name: string;
  url: string;
}

export interface LessonPlan {
  id: string;
  sectionId: string;
  learningAreaId: string;
  date: string; // YYYY-MM-DD
  title: string;
  objectives: string[];
  activities: string[];
  materials: string[];
  assessment: string[];
  resources: LessonResource[];
  assignmentIds: string[];
}

export type AnnouncementTarget = 'all' | 'staff' | 'parents' | 'students';

export interface Announcement {
    id: string;
    title: string;
    content: string;
    authorId: string;
    date: string; // YYYY-MM-DD
    target: AnnouncementTarget;
}