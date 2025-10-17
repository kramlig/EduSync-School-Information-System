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
  
  // Phase 1 enhancements
  status?: 'active' | 'inactive' | 'transferred' | 'graduated' | 'dropped';
  parentIds?: string[];      // Link to parent accounts
  remarks?: string;          // General notes/remarks about the student
  middleName?: string;       // For complete name
  lastName?: string;         // Separate last name
  firstName?: string;        // Separate first name
  
  // Phase 2: Contact & Address Information
  contactNumber?: string;    // Student's phone number
  address?: string;          // Complete residential address
  barangay?: string;         // Barangay/Village
  city?: string;             // City/Municipality
  province?: string;         // Province
  zipCode?: string;          // Postal/ZIP code
  
  // Phase 2: Guardian Information
  guardianName?: string;     // Primary guardian full name
  guardianRelationship?: string; // Mother, Father, Grandparent, etc.
  guardianContactNumber?: string;
  guardianEmail?: string;
  guardianOccupation?: string;
  guardianAddress?: string;  // If different from student
  
  // Secondary guardian (optional)
  guardian2Name?: string;
  guardian2Relationship?: string;
  guardian2ContactNumber?: string;
  guardian2Email?: string;
  
  // Phase 2: Health & Special Needs
  healthNotes?: string;      // Medical conditions, allergies, etc.
  specialNeeds?: string;     // Learning accommodations, disabilities
  bloodType?: string;        // A+, B+, O+, AB+, A-, B-, O-, AB-
  
  // Phase 2: Previous School Information
  previousSchool?: string;   // Name of previous school
  previousSchoolAddress?: string;
  yearLastAttended?: string; // Last year attended previous school
  
  // Phase 2: Additional Academic Info
  nationality?: string;      // Citizenship
  religion?: string;         // Religious affiliation
  motherTongue?: string;     // First language/dialect
  placeOfBirth?: string;     // Birth place
  
  // Photo Management
  photoURL?: string;         // Firebase Storage download URL
  photoPath?: string;        // Storage path for deletion/update
  photoUploadedAt?: string;  // ISO timestamp of last upload
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
  id: string;
  name: string;
  credits: number;
  isComposite?: boolean;
  subSubjects?: string[];
  
  // Phase 1: Essential metadata for better organization
  category?: 'core' | 'specialized' | 'elective' | 'tle' | 'sports';
  gradeLevel?: number[];      // [7, 8, 9, 10] - applicable grade levels
  isActive?: boolean;          // Soft delete - default true
  department?: string;         // 'Language', 'STEM', 'Humanities', 'Arts', 'Sports'
  order?: number;              // Display order in lists/reports
  
  // Phase 2: DepEd K-12 Curriculum compliance
  kToTwelveCode?: string;      // Official DepEd code: "FIL7", "ENG8", etc.
  semesterBased?: boolean;     // For SHS subjects (1st/2nd semester)
  trackRequired?: string[];    // ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL'] for SHS
  
  // Phase 3: Advanced features
  prerequisite?: string;       // ID of required prerequisite subject
  description?: string;        // Full subject description
  hoursPerWeek?: number;       // For scheduling
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