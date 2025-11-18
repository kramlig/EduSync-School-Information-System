export type ViewType = 'dashboard' | 'students' | 'learningAreas' | 'grades' | 'coreValues' | 'attendance' | 'teachers' | 'sections' | 'settings' | 'substitutes' | 'scheduler' | 'gradebook' | 'coreValuesGradebook' | 'assignments' | 'lessonPlans' | 'announcements' | 'parents';

// ============================================================================
// MULTI-TENANT ARCHITECTURE - SCHOOL ENTITY
// ============================================================================

/**
 * School Interface - Multi-Tenant Core Entity
 * 
 * Represents a single school in the multi-tenant system.
 * Each school's data is isolated by schoolId across all collections.
 */
export interface School {
  id: string;  // Firestore document ID (e.g., "school-001", "school-002")
  name: string;  // School name (e.g., "Enrique Urencia Elementary School")
  
  // Administrative Details
  region: string;  // DepEd Region (e.g., "Region XI")
  division: string;  // DepEd Division (e.g., "Division of the City of Mati")
  district: string;  // School District (e.g., "Governor Generoso North District")
  
  // School Type
  schoolType: 'public' | 'private' | 'hybrid';
  schoolLevel: 'elementary' | 'secondary' | 'shs' | 'kto12';  // K-12 levels
  
  // Contact Information
  address?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  
  // Current Academic Year
  currentSchoolYear: string;  // e.g., "2024-2025"
  
  // Status
  status: 'active' | 'inactive' | 'archived';
  
  // Metadata
  createdAt: string;  // ISO timestamp
  updatedAt?: string;  // ISO timestamp
  
  // Optional: School-specific settings override
  settings?: Partial<SchoolSettings>;
}

export interface Student {
  id: string;
  schoolId: string;  // MULTI-TENANT: Required for school isolation
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
  learningAreaName?: string;
  sectionId?: string;
  sectionName?: string;
  schoolYear?: string;
}

export interface Teacher {
  id: string;
  schoolId: string;  // MULTI-TENANT: Required for school isolation
  name: string;
  email: string;
  contactNumber?: string;
  assignments?: TeacherAssignment[];
  role: 'admin' | 'teacher' | 'principal' | 'registrar' | 'superadmin';
  password?: string;
}

export type AuthUser = Omit<Teacher, 'password'>;

export interface Parent {
    id: string;
    schoolId: string;  // MULTI-TENANT: Required for school isolation
    name: string;
    email: string;
    password?: string;
    studentIds: string[];
    phone?: string;                 // Phone number for SMS notifications
    emailVerified?: boolean;        // Email verification status
    registrationDate?: string;      // ISO date of registration
    notificationPreferences?: {     // Notification settings
      emailEnabled?: boolean;
      smsEnabled?: boolean;
      absenceAlerts?: boolean;
      gradeAlerts?: boolean;
      announcementAlerts?: boolean;
    };
}

export type ParentUser = Omit<Parent, 'password'>;

export interface Section {
  id: string;
  schoolId: string;  // MULTI-TENANT: Required for school isolation
  gradeLevel: number;
  name: string;
  adviserId?: string;
}

export interface LearningArea {
  id: string;
  schoolId: string;  // MULTI-TENANT: Required for school isolation
  name: string;
  credits: number;
  isComposite?: boolean;
  subSubjects?: string[];  // Legacy field for backward compatibility
  components?: string[];   // New field for composite subjects like MAPEH
  
  // Phase 1: Essential metadata for better organization
  category?: 'core' | 'specialized' | 'elective' | 'tle' | 'sports';
  gradeLevel?: number[];      // [7, 8, 9, 10] - applicable grade levels
  isActive?: boolean;          // Soft delete - default true
  department?: string;         // 'Language', 'STEM', 'Humanities', 'Arts', 'Sports'
  order?: number;              // Display order in lists/reports
  
  // Phase 2: DepEd K-12 Curriculum compliance
  kToTwelveCode?: string;      // Official DepEd code: "FIL7", "ENG8", etc.
  semesterBased?: boolean;     // For SHS subjects (1st/2nd semester)
  semester?: 1 | 2;            // Which semester (1st or 2nd) for SHS
  trackRequired?: string[];    // ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL'] for SHS
  
  // Phase 3: Advanced features
  prerequisite?: string;       // ID of required prerequisite subject
  description?: string;        // Full subject description
  hoursPerWeek?: number;       // For scheduling
}

export type SubGradeRecord = Record<string, number>;

// Semester grading for Senior High School
export interface SemesterGrade {
  midterm: number;
  final: number;
  average: number;
}

// Base grade interface for quarterly grading (Elementary & JHS)
export interface Grade {
  id: string;
  schoolId: string;  // MULTI-TENANT: Required for school isolation
  studentId: string;
  learningAreaId: string;
  q1?: number | SubGradeRecord;
  q2?: number | SubGradeRecord;
  q3?: number | SubGradeRecord;
  q4?: number | SubGradeRecord;
  finalGrade?: number;
  remarks?: 'Passed' | 'Failed';
}

// Senior High School grade interface (semester-based)
export interface GradeSHS {
  id: string;
  schoolId: string;  // MULTI-TENANT: Required for school isolation
  studentId: string;
  learningAreaId: string;
  semester1?: SemesterGrade;
  semester2?: SemesterGrade;
  finalGrade?: number;
  remarks?: 'Passed' | 'Failed';
}

// Union type for all grade types
export type GradeInput = Grade | GradeSHS;

export interface CoreValue {
  id: string;
  schoolId: string;  // MULTI-TENANT: Required for school isolation
  name: string;
  behaviors: string[];
}

export type CoreValueMarking = 'AO' | 'SO' | 'RO' | 'NO';

export interface CoreValueGrade {
  id: string;
  schoolId: string;  // MULTI-TENANT: Required for school isolation
  studentId: string;
  coreValueId: string;
  q1?: Record<string, CoreValueMarking>;
  q2?: Record<string, CoreValueMarking>;
  q3?: Record<string, CoreValueMarking>;
  q4?: Record<string, CoreValueMarking>;
}

export type AttendanceStatus = 'P' | 'A' | 'L' | 'E'; // Present, Absent, Late, Excused

export interface AttendanceRecord {
    schoolId: string;  // MULTI-TENANT: Required for school isolation
    studentId: string;
    dailyStatus: Record<string, AttendanceStatus>; // "YYYY-MM-DD": "P"
}

export interface SchoolSettings {
    schoolName: string;
    region: string;
    division: string;
    district: string;
    schoolYear: string;
    
    // School Type Configuration
    schoolType?: 'public' | 'private' | 'hybrid';
    
    // Financial Configuration (for private/hybrid schools)
    financialConfig?: {
        enabled: boolean;
        currency: 'PHP' | 'USD' | 'EUR';
        requiresPayment: boolean;
        allowPartialPayment: boolean;
        gracePeriodDays: number;
        penaltyRate?: number; // Percentage per month for late payments
    };
    
    // Enrollment Configuration
    enrollmentConfig?: {
        requiresApplication: boolean;
        requiresDocuments: boolean;
        autoApprove: boolean;
        allowSelfRegistration: boolean;
        academicYearStart?: string; // "YYYY-MM-DD"
        academicYearEnd?: string;
    };
}

export interface SubstituteAssignment {
  id: string;
  schoolId: string;  // MULTI-TENANT: Required for school isolation
  teacherId: string; // The substitute teacher
  originalTeacherId: string; // The teacher being replaced
  startDate: string; 
  endDate: string;
}

export interface ClassSchedule {
  id: string;
  schoolId: string;  // MULTI-TENANT: Required for school isolation
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
  schoolId: string;  // MULTI-TENANT: Required for school isolation
  sectionId: string;
  learningAreaId: string;
  title: string;
  description: string;
  totalPoints: number;
  dueDate: string;
}

export interface StudentAssignmentGrade {
  id?: string; // Firestore document id (composite: sag_{assignmentId}_{studentId})
  schoolId: string;  // MULTI-TENANT: Required for school isolation
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
  schoolId: string;  // MULTI-TENANT: Required for school isolation
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
    schoolId: string;  // MULTI-TENANT: Required for school isolation
    title: string;
    content: string;
    authorId: string;
    date: string; // YYYY-MM-DD
    target: AnnouncementTarget;
}

// ============================================================================
// ENROLLMENT APPLICATION SYSTEM
// ============================================================================

export interface GuardianDetails {
    fullName: string;
    relationship: string;
    contactNumber: string;
    email?: string;
    occupation?: string;
    employer?: string;
    monthlyIncome?: number;
}

export interface AddressDetails {
    houseNumber?: string;
    street?: string;
    barangay: string;
    city: string;
    province: string;
    zipCode?: string;
}

export interface DocumentUpload {
    fileName: string;
    fileURL: string;
    uploadedAt: string;
    fileSize: number;
    mimeType: string;
}

export interface EnrollmentApplication {
    id: string;
    schoolId: string;  // MULTI-TENANT: Required for school isolation
    applicationNumber: string; // Auto-generated: "APP-2025-001"
    
    // Student Information
    studentInfo: {
        firstName: string;
        middleName?: string;
        lastName: string;
        dateOfBirth: string;
        sex: 'Male' | 'Female';
        lrn?: string;
        nationality: string;
        religion?: string;
        motherTongue?: string;
        placeOfBirth?: string;
    };
    
    // Guardian Information
    guardian1: GuardianDetails;
    guardian2?: GuardianDetails;
    
    // Address Information
    currentAddress: AddressDetails;
    permanentAddress?: AddressDetails; // If different from current
    sameAsCurrent: boolean;
    
    // Academic Information
    academicInfo: {
        gradeLevel: number;
        track?: string; // For SHS: STEM, ABM, HUMSS, GAS, TVL
        strand?: string; // For TVL: specific strand
        previousSchool?: string;
        previousSchoolAddress?: string;
        yearLastAttended?: string;
        lastGradeCompleted?: number;
    };
    
    // Health Information
    healthInfo?: {
        bloodType?: string;
        allergies?: string;
        medicalConditions?: string;
        medications?: string;
        specialNeeds?: string;
    };
    
    // Required Documents
    documents: {
        birthCertificate?: DocumentUpload;
        form137?: DocumentUpload;
        goodMoral?: DocumentUpload;
        reportCard?: DocumentUpload;
        photoId?: DocumentUpload;
        other?: DocumentUpload[];
    };
    
    // Application Status
    status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'enrolled';
    submittedAt?: string;
    submittedBy?: string; // Parent/Guardian email
    
    // Review Information
    reviewedBy?: string; // Admin/Registrar ID
    reviewedAt?: string;
    reviewNotes?: string;
    rejectionReason?: string;
    
    // Enrollment Information (filled after approval)
    enrolledStudentId?: string;
    sectionId?: string;
    enrollmentDate?: string;
    
    // Metadata
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// FINANCIAL SYSTEM (for Private/Hybrid Schools)
// ============================================================================

export interface FeeStructure {
    id: string;
    schoolId: string;  // MULTI-TENANT: Required for school isolation
    schoolYear: string;
    gradeLevel: number;
    track?: string; // For SHS
    strand?: string;
    
    fees: {
        // Tuition
        tuitionFee: number;
        
        // Miscellaneous Fees
        miscFees: {
            id: string;
            name: string;
            amount: number;
            required: boolean;
            description?: string;
        }[];
        
        // Laboratory Fees (per subject)
        labFees?: {
            subject: string;
            amount: number;
        }[];
        
        // Other Fees
        registrationFee?: number;
        idFee?: number;
        insuranceFee?: number;
    };
    
    // Computed
    totalRequired: number;
    totalOptional: number;
    
    // Payment Options
    paymentOptions: {
        fullPayment: {
            enabled: boolean;
            discount?: number; // Percentage
        };
        quarterly: {
            enabled: boolean;
            numberOfPayments: number;
        };
        monthly: {
            enabled: boolean;
            numberOfPayments: number;
        };
    };
    
    // Metadata
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

export interface Charge {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'tuition' | 'misc' | 'lab' | 'penalty' | 'other';
    referenceId?: string; // Link to fee structure or specific item
}

export interface Payment {
    id: string;
    schoolId: string;  // MULTI-TENANT: Required for school isolation
    date: string;
    amount: number;
    method: 'cash' | 'check' | 'bank_transfer' | 'gcash' | 'maya' | 'card' | 'online';
    referenceNumber?: string;
    checkNumber?: string;
    bankName?: string;
    receiptNumber: string;
    receivedBy: string;
    receivedByName: string;
    notes?: string;
}

export interface StudentLedger {
    id: string; // Composite: `${studentId}_${schoolYear}`
    schoolId: string;  // MULTI-TENANT: Required for school isolation
    studentId: string;
    schoolYear: string;
    gradeLevel: number;
    
    // Fee Structure Applied
    feeStructureId: string;
    
    // Payment Plan
    paymentPlan: 'full' | 'quarterly' | 'monthly';
    
    // Charges
    charges: Charge[];
    
    // Payments
    payments: Payment[];
    
    // Discounts/Scholarships
    discounts: {
        id: string;
        type: 'scholarship' | 'sibling' | 'staff' | 'early_bird' | 'other';
        name: string;
        amount: number;
        percentage?: number;
        appliedAt: string;
        appliedBy: string;
    }[];
    
    // Computed Totals
    totalCharges: number;
    totalDiscounts: number;
    totalPayments: number;
    balance: number;
    
    // Status
    status: 'paid' | 'partial' | 'overdue' | 'cancelled';
    dueDate?: string;
    lastPaymentDate?: string;
    
    // Metadata
    createdAt: string;
    updatedAt: string;
}

export interface Scholarship {
    id: string;
    name: string;
    type: 'academic' | 'sports' | 'talent' | 'financial_need' | 'sibling' | 'other';
    description: string;
    
    // Discount Details
    discountType: 'percentage' | 'fixed';
    discountValue: number; // Percentage (50) or fixed amount (5000)
    
    // Eligibility
    eligibility: {
        minGPA?: number;
        maxFamilyIncome?: number;
        requiredDocuments?: string[];
        otherRequirements?: string[];
    };
    
    // Application Period
    applicationStart: string;
    applicationEnd: string;
    
    // Status
    isActive: boolean;
    slotsAvailable?: number;
    slotsUsed?: number;
    
    // Metadata
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

export interface ScholarshipApplication {
    id: string;
    scholarshipId: string;
    studentId: string;
    schoolYear: string;
    
    // Application Details
    reason: string;
    documents: DocumentUpload[];
    
    // Status
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
    reviewedBy?: string;
    reviewedAt?: string;
    reviewNotes?: string;
    
    // If Approved
    appliedToLedgerId?: string;
    
    // Metadata
    createdAt: string;
    updatedAt: string;
}

export interface BillingStatement {
    id: string; // Composite: `${studentId}_${schoolYear}_${term}`
    studentId: string;
    studentName: string;
    schoolYear: string;
    gradeLevel: number;
    term: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual'; // Billing period
    
    // Fee Breakdown
    charges: Charge[];
    totalCharges: number;
    
    // Discounts Applied
    discounts: {
        id: string;
        type: 'scholarship' | 'sibling' | 'staff' | 'early_bird' | 'other';
        name: string;
        amount: number;
        percentage?: number;
    }[];
    totalDiscounts: number;
    
    // Payments Received
    payments: Payment[];
    totalPayments: number;
    
    // Balance
    subtotal: number; // totalCharges - totalDiscounts
    balance: number;  // subtotal - totalPayments
    
    // Payment Schedule
    dueDate: string;
    paymentPlan: 'full' | 'quarterly' | 'monthly';
    
    // Status
    status: 'paid' | 'partial' | 'overdue' | 'pending';
    
    // Metadata
    generatedAt: string;
    generatedBy: string;
    lastUpdated: string;
}

export interface Receipt {
    id: string;
    receiptNumber: string; // Auto-generated: OR-YYYY-00001
    
    // Transaction Details
    studentId: string;
    studentName: string;
    schoolYear: string;
    paymentId: string; // Link to Payment in StudentLedger
    
    // Payment Information
    date: string;
    amount: number;
    paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'gcash' | 'maya' | 'card' | 'online';
    checkNumber?: string;
    bankName?: string;
    referenceNumber?: string;
    
    // Payment For
    description: string; // e.g., "Tuition Fee - Q1 2024-2025"
    
    // Issued By
    receivedBy: string; // Staff user ID
    receivedByName: string;
    
    // Balance Information
    previousBalance: number;
    amountPaid: number;
    newBalance: number;
    
    // Status
    status: 'issued' | 'void' | 'cancelled';
    voidReason?: string;
    voidedBy?: string;
    voidedAt?: string;
    
    // Metadata
    createdAt: string;
    printedAt?: string;
}

export interface PaymentProof {
    id: string;
    studentId: string;
    
    // File Information
    fileName: string;
    fileURL: string;
    fileType: 'image/jpeg' | 'image/png' | 'application/pdf';
    fileSize: number; // in bytes
    
    // Payment Details
    amount?: number;
    paymentDate?: string;
    paymentMethod?: string;
    referenceNumber?: string;
    notes?: string;
    
    // Verification Status
    status: 'pending' | 'verified' | 'rejected';
    verifiedBy?: string;
    verifiedByName?: string;
    verifiedAt?: string;
    rejectionReason?: string;
    
    // Link to official receipt (if verified and payment recorded)
    linkedReceiptId?: string;
    
    // Metadata
    uploadedAt: string;
    uploadedBy: string; // Parent user ID
}