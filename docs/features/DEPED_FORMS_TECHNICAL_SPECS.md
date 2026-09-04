# DepEd Forms Technical Specifications

**Document Version:** 1.0  
**Created:** December 3, 2025  
**Last Updated:** December 3, 2025

---

## 📐 Database Schema Specifications

### Schema Version Control
- **Current Version:** 2.0 (PostgreSQL Migration)
- **Previous Version:** 1.0 (Firestore)
- **Migration Status:** In Progress

---

## 🗄️ New Tables Required

### 1. Books Management (SF3)

```sql
-- Main books inventory table
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Book Information
  title TEXT NOT NULL,
  subject_area TEXT,
  grade_level INTEGER CHECK (grade_level >= 0 AND grade_level <= 12),
  isbn TEXT,
  publisher TEXT,
  publication_year INTEGER,
  
  -- Inventory Tracking
  quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
  available INTEGER DEFAULT 0 CHECK (available >= 0 AND available <= quantity),
  
  -- Metadata
  school_year TEXT,
  source TEXT CHECK (source IN ('purchased', 'donated', 'textbook_loan_board')),
  condition TEXT DEFAULT 'good' CHECK (condition IN ('new', 'good', 'fair', 'poor', 'damaged')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Book issuance tracking
CREATE TABLE book_issuances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- References
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  issued_by UUID REFERENCES teachers(id),
  
  -- Issuance Details
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_return_date DATE,
  actual_return_date DATE,
  
  -- Status Tracking
  status TEXT DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'lost', 'damaged', 'unreturned')),
  condition_on_issue TEXT DEFAULT 'good' CHECK (condition_on_issue IN ('new', 'good', 'fair', 'poor')),
  condition_on_return TEXT CHECK (condition_on_return IN ('new', 'good', 'fair', 'poor', 'damaged', 'lost')),
  
  -- Notes
  notes TEXT,
  penalty_amount DECIMAL(10,2) DEFAULT 0.00,
  
  -- Metadata
  school_year TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_return_date CHECK (actual_return_date IS NULL OR actual_return_date >= issued_date)
);

-- Indexes for performance
CREATE INDEX idx_books_school_id ON books(school_id);
CREATE INDEX idx_books_grade_level ON books(grade_level);
CREATE INDEX idx_books_school_year ON books(school_year);

CREATE INDEX idx_book_issuances_school_id ON book_issuances(school_id);
CREATE INDEX idx_book_issuances_book_id ON book_issuances(book_id);
CREATE INDEX idx_book_issuances_student_id ON book_issuances(student_id);
CREATE INDEX idx_book_issuances_status ON book_issuances(status);
CREATE INDEX idx_book_issuances_school_year ON book_issuances(school_year);
CREATE INDEX idx_book_issuances_issued_date ON book_issuances(issued_date);

-- Trigger to update available quantity
CREATE OR REPLACE FUNCTION update_book_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'issued' THEN
    UPDATE books SET available = available - 1 WHERE id = NEW.book_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'issued' AND NEW.status IN ('returned', 'lost', 'damaged') THEN
    UPDATE books SET available = available + 1 WHERE id = NEW.book_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_book_availability
AFTER INSERT OR UPDATE ON book_issuances
FOR EACH ROW EXECUTE FUNCTION update_book_availability();
```

---

### 2. Student Movement Tracking (SF4)

```sql
-- Student movement and enrollment changes
CREATE TABLE student_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- References
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  recorded_by UUID REFERENCES teachers(id),
  
  -- Movement Details
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'enrolled',           -- New enrollment
    'transferred_in',     -- Transfer from another school
    'transferred_out',    -- Transfer to another school
    'dropped',            -- Dropped out
    'promoted',           -- Promoted to next grade
    'retained',           -- Retained in same grade
    'graduated',          -- Graduated (Grade 6, 10, 12)
    'deceased'            -- Deceased (rare but tracked)
  )),
  
  -- Section Changes
  from_section_id UUID REFERENCES sections(id),
  to_section_id UUID REFERENCES sections(id),
  from_grade_level INTEGER,
  to_grade_level INTEGER,
  
  -- Transfer Details (if applicable)
  from_school_name TEXT,
  to_school_name TEXT,
  from_school_id_number TEXT,
  to_school_id_number TEXT,
  
  -- Reason & Documentation
  reason TEXT,
  supporting_document_url TEXT,
  
  -- Metadata
  school_year TEXT NOT NULL,
  effective_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_section_change CHECK (
    (movement_type IN ('transferred_in', 'enrolled') AND to_section_id IS NOT NULL) OR
    (movement_type = 'transferred_out' AND from_section_id IS NOT NULL) OR
    (movement_type NOT IN ('transferred_in', 'enrolled', 'transferred_out'))
  )
);

-- Monthly enrollment snapshots for SF4 reporting
CREATE TABLE monthly_enrollment_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Time Period
  snapshot_month INTEGER NOT NULL CHECK (snapshot_month >= 1 AND snapshot_month <= 12),
  snapshot_year INTEGER NOT NULL,
  school_year TEXT NOT NULL,
  
  -- Enrollment Counts
  grade_level INTEGER NOT NULL CHECK (grade_level >= 0 AND grade_level <= 12),
  male_count INTEGER DEFAULT 0 CHECK (male_count >= 0),
  female_count INTEGER DEFAULT 0 CHECK (female_count >= 0),
  total_count INTEGER GENERATED ALWAYS AS (male_count + female_count) STORED,
  
  -- Movement Counts
  transferred_in INTEGER DEFAULT 0 CHECK (transferred_in >= 0),
  transferred_out INTEGER DEFAULT 0 CHECK (transferred_out >= 0),
  dropped INTEGER DEFAULT 0 CHECK (dropped >= 0),
  
  -- Metadata
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(school_id, snapshot_year, snapshot_month, grade_level)
);

-- Indexes
CREATE INDEX idx_student_movements_school_id ON student_movements(school_id);
CREATE INDEX idx_student_movements_student_id ON student_movements(student_id);
CREATE INDEX idx_student_movements_type ON student_movements(movement_type);
CREATE INDEX idx_student_movements_date ON student_movements(movement_date);
CREATE INDEX idx_student_movements_school_year ON student_movements(school_year);

CREATE INDEX idx_monthly_snapshots_school_id ON monthly_enrollment_snapshots(school_id);
CREATE INDEX idx_monthly_snapshots_period ON monthly_enrollment_snapshots(snapshot_year, snapshot_month);
CREATE INDEX idx_monthly_snapshots_school_year ON monthly_enrollment_snapshots(school_year);
```

---

### 3. Health Records (SF8)

```sql
-- Learner health and nutrition records
CREATE TABLE health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- References
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  recorded_by UUID REFERENCES teachers(id),
  
  -- Measurement Date
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  academic_period TEXT CHECK (academic_period IN ('opening', 'midyear', 'end_of_year')),
  
  -- Physical Measurements
  weight_kg DECIMAL(5,2) CHECK (weight_kg > 0 AND weight_kg < 200),
  height_cm DECIMAL(5,2) CHECK (height_cm > 0 AND height_cm < 250),
  bmi DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN height_cm > 0 THEN weight_kg / ((height_cm / 100) * (height_cm / 100))
      ELSE NULL
    END
  ) STORED,
  
  -- Nutritional Status (WHO Standards)
  nutritional_status TEXT CHECK (nutritional_status IN (
    'severely_wasted',   -- BMI < -3 SD
    'wasted',            -- BMI -3 to -2 SD
    'normal',            -- BMI -2 to +1 SD
    'overweight',        -- BMI +1 to +2 SD
    'obese'              -- BMI > +2 SD
  )),
  height_for_age TEXT CHECK (height_for_age IN ('stunted', 'normal', 'tall')),
  
  -- Immunization Status
  immunization_complete BOOLEAN DEFAULT FALSE,
  immunization_details JSONB, -- Stores array of vaccines with dates
  
  -- Deworming
  dewormed BOOLEAN DEFAULT FALSE,
  deworming_date DATE,
  
  -- Medical Examination
  medical_exam_date DATE,
  medical_findings TEXT,
  vision_screening TEXT CHECK (vision_screening IN ('passed', 'failed', 'needs_referral', 'not_tested')),
  hearing_screening TEXT CHECK (hearing_screening IN ('passed', 'failed', 'needs_referral', 'not_tested')),
  dental_screening TEXT CHECK (dental_screening IN ('healthy', 'cavities', 'needs_treatment', 'not_tested')),
  
  -- Special Concerns
  chronic_conditions TEXT[], -- Array of chronic conditions
  allergies TEXT[],
  medications TEXT[],
  
  -- Parent Consent
  parent_consent_given BOOLEAN DEFAULT FALSE,
  parent_consent_date DATE,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  school_year TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feeding program participation
CREATE TABLE feeding_program_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- References
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  health_record_id UUID REFERENCES health_records(id),
  
  -- Program Details
  program_type TEXT CHECK (program_type IN ('sbfp', 'milk_feeding', 'supplementary')),
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Progress Tracking
  baseline_weight_kg DECIMAL(5,2),
  current_weight_kg DECIMAL(5,2),
  weight_gain_kg DECIMAL(5,2) GENERATED ALWAYS AS (current_weight_kg - baseline_weight_kg) STORED,
  
  -- Participation
  total_feeding_days INTEGER DEFAULT 0,
  days_participated INTEGER DEFAULT 0,
  participation_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_feeding_days > 0 THEN (days_participated::DECIMAL / total_feeding_days) * 100
      ELSE 0
    END
  ) STORED,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'withdrawn')),
  
  -- Metadata
  school_year TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_health_records_school_id ON health_records(school_id);
CREATE INDEX idx_health_records_student_id ON health_records(student_id);
CREATE INDEX idx_health_records_date ON health_records(measurement_date);
CREATE INDEX idx_health_records_school_year ON health_records(school_year);
CREATE INDEX idx_health_records_nutritional_status ON health_records(nutritional_status);

CREATE INDEX idx_feeding_program_school_id ON feeding_program_records(school_id);
CREATE INDEX idx_feeding_program_student_id ON feeding_program_records(student_id);
CREATE INDEX idx_feeding_program_status ON feeding_program_records(status);
CREATE INDEX idx_feeding_program_school_year ON feeding_program_records(school_year);
```

---

### 4. Teacher Assignments (SF7)

```sql
-- Teacher teaching assignments
CREATE TABLE teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- References
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  
  -- Assignment Details
  school_year TEXT NOT NULL,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN (
    'class_adviser',      -- Homeroom/Class Adviser
    'subject_teacher',    -- Subject Teacher
    'department_head',    -- Department Head
    'coordinator',        -- Coordinator (e.g., Science Coordinator)
    'guidance_counselor', -- Guidance Counselor
    'librarian',          -- Librarian
    'admin_staff'         -- Administrative Staff
  )),
  
  -- Subject/Grade Information
  grade_level INTEGER CHECK (grade_level >= 0 AND grade_level <= 12),
  subject_area TEXT,
  learning_area_code TEXT,
  
  -- Load Information
  weekly_hours INTEGER DEFAULT 0 CHECK (weekly_hours >= 0),
  number_of_sections INTEGER DEFAULT 0 CHECK (number_of_sections >= 0),
  total_students INTEGER DEFAULT 0 CHECK (total_students >= 0),
  
  -- Additional Responsibilities
  additional_roles TEXT[], -- Array: ['sdo_officer', 'sss_coordinator', etc.]
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'transferred')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_end_date CHECK (end_date IS NULL OR end_date >= start_date)
);

-- SF7 summary view for quick reporting
CREATE VIEW sf7_teacher_summary AS
SELECT 
  ta.school_id,
  ta.school_year,
  t.id AS teacher_id,
  t.first_name || ' ' || t.last_name AS teacher_name,
  t.employee_number,
  t.position,
  t.employment_status,
  STRING_AGG(DISTINCT ta.grade_level::TEXT, ', ' ORDER BY ta.grade_level::TEXT) AS grade_levels,
  STRING_AGG(DISTINCT ta.subject_area, ', ') AS subjects,
  SUM(ta.weekly_hours) AS total_weekly_hours,
  SUM(ta.number_of_sections) AS total_sections,
  SUM(ta.total_students) AS total_students_handled,
  STRING_AGG(DISTINCT ta.assignment_type, ', ') AS assignment_types,
  BOOL_OR(ta.assignment_type = 'class_adviser') AS is_class_adviser
FROM teacher_assignments ta
JOIN teachers t ON ta.teacher_id = t.id
WHERE ta.status = 'active'
GROUP BY ta.school_id, ta.school_year, t.id, t.first_name, t.last_name, t.employee_number, t.position, t.employment_status;

-- Indexes
CREATE INDEX idx_teacher_assignments_school_id ON teacher_assignments(school_id);
CREATE INDEX idx_teacher_assignments_teacher_id ON teacher_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_section_id ON teacher_assignments(section_id);
CREATE INDEX idx_teacher_assignments_school_year ON teacher_assignments(school_year);
CREATE INDEX idx_teacher_assignments_status ON teacher_assignments(status);
CREATE INDEX idx_teacher_assignments_type ON teacher_assignments(assignment_type);
```

---

### 5. Promotion & Proficiency Records (SF5, SF5-K)

```sql
-- Promotion and proficiency tracking
CREATE TABLE promotion_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- References
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  section_id UUID REFERENCES sections(id),
  
  -- Period
  school_year TEXT NOT NULL,
  grading_period TEXT CHECK (grading_period IN ('1st_quarter', '2nd_quarter', '3rd_quarter', '4th_quarter', 'final')),
  
  -- Grade Level
  current_grade_level INTEGER NOT NULL CHECK (current_grade_level >= 0 AND current_grade_level <= 12),
  
  -- Proficiency Levels (for Kindergarten)
  socio_emotional_dev TEXT CHECK (socio_emotional_dev IN ('developing', 'emerging', 'advancing')),
  physical_motor_dev TEXT CHECK (physical_motor_dev IN ('developing', 'emerging', 'advancing')),
  cognitive_dev TEXT CHECK (cognitive_dev IN ('developing', 'emerging', 'advancing')),
  language_literacy_dev TEXT CHECK (language_literacy_dev IN ('developing', 'emerging', 'advancing')),
  
  -- General Average (for ES/JHS/SHS)
  general_average DECIMAL(5,2) CHECK (general_average >= 0 AND general_average <= 100),
  
  -- Promotion Decision
  promotion_status TEXT NOT NULL CHECK (promotion_status IN (
    'promoted',
    'retained',
    'pending',
    'graduated',
    'transferred'
  )),
  
  -- Next Grade/Section (if promoted)
  next_grade_level INTEGER,
  next_section_id UUID REFERENCES sections(id),
  
  -- Remarks
  remarks TEXT,
  attendance_days_present INTEGER,
  attendance_days_absent INTEGER,
  
  -- Recorded By
  recorded_by UUID REFERENCES teachers(id),
  approved_by UUID REFERENCES teachers(id), -- Principal approval
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one final record per student per school year
  UNIQUE(student_id, school_year, grading_period)
);

-- Indexes
CREATE INDEX idx_promotion_records_school_id ON promotion_records(school_id);
CREATE INDEX idx_promotion_records_student_id ON promotion_records(student_id);
CREATE INDEX idx_promotion_records_school_year ON promotion_records(school_year);
CREATE INDEX idx_promotion_records_status ON promotion_records(promotion_status);
CREATE INDEX idx_promotion_records_grade_level ON promotion_records(current_grade_level);
```

---

## 🔌 API Endpoints Specification

### Books Service API

```typescript
// GET /api/books?schoolId={uuid}&gradeLevel={int}
interface BooksListResponse {
  books: Book[];
  total: number;
  available: number;
}

// POST /api/books
interface CreateBookRequest {
  schoolId: string;
  title: string;
  subjectArea?: string;
  gradeLevel?: number;
  isbn?: string;
  quantity: number;
  schoolYear: string;
}

// POST /api/books/issue
interface IssueBookRequest {
  bookId: string;
  studentId: string;
  issuedBy: string;
  expectedReturnDate?: string;
  schoolYear: string;
}

// PUT /api/books/return/{issuanceId}
interface ReturnBookRequest {
  actualReturnDate: string;
  conditionOnReturn: 'new' | 'good' | 'fair' | 'poor' | 'damaged' | 'lost';
  penaltyAmount?: number;
  notes?: string;
}

// GET /api/books/unreturned?schoolId={uuid}&schoolYear={year}
interface UnreturnedBooksResponse {
  issuances: BookIssuance[];
  totalCount: number;
}
```

### Student Movement Service API

```typescript
// POST /api/students/movements
interface CreateMovementRequest {
  schoolId: string;
  studentId: string;
  movementType: 'enrolled' | 'transferred_in' | 'transferred_out' | 'dropped' | 'promoted' | 'retained';
  movementDate: string;
  toSectionId?: string;
  fromSchoolName?: string;
  reason?: string;
  schoolYear: string;
}

// GET /api/students/movements/monthly?schoolId={uuid}&year={year}&month={month}
interface MonthlyMovementResponse {
  movements: StudentMovement[];
  snapshot: MonthlyEnrollmentSnapshot;
  summary: {
    enrolled: number;
    transferredIn: number;
    transferredOut: number;
    dropped: number;
    totalEnrollment: number;
  };
}

// POST /api/students/movements/generate-sf4
interface GenerateSF4Request {
  schoolId: string;
  year: number;
  month: number;
  gradeLevel?: number;
}
```

### Health Records Service API

```typescript
// POST /api/health/records
interface CreateHealthRecordRequest {
  schoolId: string;
  studentId: string;
  measurementDate: string;
  weightKg: number;
  heightCm: number;
  academicPeriod: 'opening' | 'midyear' | 'end_of_year';
  nutritionalStatus?: string;
  immunizationComplete?: boolean;
  schoolYear: string;
}

// PUT /api/health/records/{id}
interface UpdateHealthRecordRequest {
  weightKg?: number;
  heightCm?: number;
  immunizationComplete?: boolean;
  medicalFindings?: string;
  notes?: string;
}

// GET /api/health/records/student/{studentId}
interface StudentHealthHistoryResponse {
  records: HealthRecord[];
  latestRecord: HealthRecord;
  growthChart: {
    date: string;
    weightKg: number;
    heightCm: number;
    bmi: number;
  }[];
}

// POST /api/health/feeding-program
interface EnrollFeedingProgramRequest {
  studentId: string;
  programType: 'sbfp' | 'milk_feeding' | 'supplementary';
  startDate: string;
  baselineWeightKg: number;
  schoolYear: string;
}
```

### Teacher Assignment Service API

```typescript
// POST /api/teachers/assignments
interface CreateAssignmentRequest {
  schoolId: string;
  teacherId: string;
  assignmentType: 'class_adviser' | 'subject_teacher' | 'department_head';
  sectionId?: string;
  gradeLevel?: number;
  subjectArea?: string;
  weeklyHours: number;
  schoolYear: string;
}

// GET /api/teachers/assignments/sf7?schoolId={uuid}&schoolYear={year}
interface SF7ReportResponse {
  assignments: TeacherAssignmentSummary[];
  totalTeachers: number;
  totalSections: number;
  averageLoad: number;
}

// PUT /api/teachers/assignments/{id}/load
interface UpdateTeachingLoadRequest {
  weeklyHours: number;
  numberOfSections: number;
  totalStudents: number;
}
```

### Promotion Records Service API

```typescript
// POST /api/promotion/records
interface CreatePromotionRecordRequest {
  schoolId: string;
  studentId: string;
  schoolYear: string;
  gradingPeriod: 'final';
  currentGradeLevel: number;
  generalAverage?: number;
  promotionStatus: 'promoted' | 'retained' | 'graduated';
  nextGradeLevel?: number;
  nextSectionId?: string;
}

// POST /api/promotion/generate-sf5
interface GenerateSF5Request {
  schoolId: string;
  schoolYear: string;
  gradeLevel: number;
  sectionId?: string;
}

// GET /api/promotion/summary/sf6?schoolId={uuid}&schoolYear={year}
interface SF6SummaryResponse {
  byGradeLevel: {
    gradeLevel: number;
    totalStudents: number;
    promoted: number;
    retained: number;
    promotionRate: number;
  }[];
  schoolTotal: {
    totalStudents: number;
    promoted: number;
    retained: number;
    promotionRate: number;
  };
}
```

---

## 🎨 Component Architecture

### Component Hierarchy

```
FormsLibrary (Parent Hub)
├── SF1Dashboard (Existing ✅)
├── SF2Dashboard (Existing ✅)
├── SF3Dashboard (NEW ⚡)
│   ├── BooksInventoryTable
│   ├── BookIssuanceForm
│   ├── UnreturnedBooksReport
│   └── SF3PDFTemplate
├── SF4Dashboard (NEW ⚡)
│   ├── MonthlyMovementTable
│   ├── EnrollmentSnapshotCard
│   ├── StudentMovementForm
│   └── SF4PDFTemplate
├── SF5Dashboard (NEW ⚡)
│   ├── PromotionRecordsTable
│   ├── AutoGenerateButton
│   ├── PromotionStatusFilter
│   └── SF5PDFTemplate
├── SF5KDashboard (NEW ⚡)
│   ├── ProficiencyRecordsTable
│   ├── DevelopmentalDomainsForm
│   ├── KinderPromotionReport
│   └── SF5KPDFTemplate
├── SF6Dashboard (NEW ⚡)
│   ├── PromotionSummaryTable
│   ├── GradeLevelStatistics
│   ├── SchoolWideSummary
│   └── SF6PDFTemplate
├── SF7Dashboard (NEW ⚡)
│   ├── TeacherAssignmentsTable
│   ├── AssignmentForm
│   ├── TeachingLoadCalculator
│   └── SF7PDFTemplate
├── SF8Dashboard (NEW ⚡)
│   ├── HealthRecordsTable
│   ├── HealthMeasurementForm
│   ├── GrowthChartVisualization
│   ├── FeedingProgramSection
│   └── SF8PDFTemplate
├── SF9Dashboard (Existing ✅)
└── Form137Dashboard (Existing ✅)
```

### Shared Components

```
components/shared/
├── FormHeader
│   └── props: { title, formCode, schoolYear, printButton }
├── FilterPanel
│   └── props: { filters: FilterConfig[], onFilterChange }
├── DataTable
│   └── props: { columns, data, actions, pagination }
├── PDFPreviewModal
│   └── props: { pdfContent, onDownload, onClose }
├── BulkActionToolbar
│   └── props: { selectedItems, actions: Action[] }
├── EmptyState
│   └── props: { icon, message, actionButton }
└── LoadingState
    └── props: { message, progress }
```

---

## 📄 PDF Template Specifications

### Common PDF Styles

```typescript
const depedFormStyles = {
  pageSize: 'LETTER', // 8.5" x 11"
  margins: {
    top: 0.75,    // inches
    bottom: 0.75,
    left: 1.0,
    right: 1.0
  },
  fonts: {
    header: 'Arial-Bold',
    body: 'Arial',
    size: {
      title: 14,
      header: 12,
      body: 10,
      footer: 8
    }
  },
  colors: {
    headerBg: '#f0f0f0',
    borderColor: '#000000',
    textPrimary: '#000000',
    textSecondary: '#666666'
  },
  branding: {
    depedLogo: true,
    schoolLogo: true,
    seal: 'DepEd Official Seal'
  }
};
```

### SF3 Template Layout

```
┌─────────────────────────────────────────────┐
│  DepEd Logo        REPUBLIC OF PHILIPPINES  │
│                  Department of Education     │
│                     Region: ___              │
│                    Division: ___             │
│           SCHOOL FORM 3 (SF3)               │
│        BOOKS ISSUED AND RETURNED            │
│           School Year: 2024-2025            │
├─────────────────────────────────────────────┤
│ School: ___________________                  │
│ Grade Level: ___                            │
│ Subject Area: ___                           │
├──────┬──────────┬────────┬──────┬──────────┤
│ No.  │ Title    │ ISBN   │ Qty  │ Status   │
├──────┼──────────┼────────┼──────┼──────────┤
│      │          │        │      │          │
│      │          │        │      │          │
└──────┴──────────┴────────┴──────┴──────────┘
```

### SF4 Template Layout

```
┌─────────────────────────────────────────────┐
│  DepEd Logo    MONTHLY REPORT ON LEARNER    │
│              MOVEMENT AND ATTENDANCE         │
│                  SF4 Form                   │
├─────────────────────────────────────────────┤
│ School: ___________________                  │
│ Month: ________  Year: ____                 │
│ Grade Level: ___                            │
├──────────┬────────┬────────┬────────┬──────┤
│ Grade    │ Boys   │ Girls  │ Total  │ %    │
├──────────┼────────┼────────┼────────┼──────┤
│ Enrolled │        │        │        │      │
│ Trans-IN │        │        │        │      │
│ Trans-OUT│        │        │        │      │
│ Dropped  │        │        │        │      │
│ Total    │        │        │        │      │
└──────────┴────────┴────────┴────────┴──────┘
```

---

## 🔒 Security & Privacy Specifications

### Row Level Security (RLS) Policies

```sql
-- Books: School-specific access
CREATE POLICY books_school_isolation ON books
FOR ALL USING (school_id = current_setting('app.current_school_id')::UUID);

-- Health Records: Strict privacy
CREATE POLICY health_records_limited_access ON health_records
FOR SELECT USING (
  school_id = current_setting('app.current_school_id')::UUID
  AND (
    current_setting('app.current_user_role') IN ('admin', 'principal', 'nurse')
    OR recorded_by = current_setting('app.current_user_id')::UUID
  )
);

-- Student Movements: Audit trail
CREATE POLICY student_movements_read_only ON student_movements
FOR SELECT USING (school_id = current_setting('app.current_school_id')::UUID);

CREATE POLICY student_movements_insert_logged ON student_movements
FOR INSERT WITH CHECK (
  school_id = current_setting('app.current_school_id')::UUID
  AND recorded_by = current_setting('app.current_user_id')::UUID
);
```

### Data Privacy Compliance

```typescript
// Health data encryption at rest
interface HealthRecordSecurity {
  encryptedFields: ['medicalFindings', 'chronicConditions', 'medications'];
  accessLog: {
    userId: string;
    action: 'view' | 'create' | 'update' | 'export';
    timestamp: Date;
    ipAddress: string;
  }[];
  parentConsent: {
    required: true;
    expiresAfter: '1 year';
    renewalReminder: '30 days before';
  };
}

// Data retention policies
interface DataRetentionPolicy {
  healthRecords: '7 years after graduation';
  studentMovements: 'Permanent (audit trail)';
  bookIssuances: '3 years after return';
  teacherAssignments: 'Permanent (employment record)';
}
```

---

## 📊 Performance Optimization

### Database Indexing Strategy

```sql
-- Composite indexes for common queries
CREATE INDEX idx_book_issuances_school_year_status 
ON book_issuances(school_id, school_year, status);

CREATE INDEX idx_health_records_school_year_grade 
ON health_records(school_id, school_year, (
  SELECT grade_level FROM students WHERE id = student_id
));

CREATE INDEX idx_movements_school_year_type 
ON student_movements(school_id, school_year, movement_type);
```

### Query Optimization Patterns

```typescript
// Use pagination for large datasets
interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Batch operations for bulk updates
interface BulkOperationConfig {
  batchSize: 100;
  concurrentBatches: 3;
  retryOnFailure: true;
  progressCallback: (completed: number, total: number) => void;
}

// Cache frequently accessed data
interface CacheStrategy {
  schoolSettings: '1 hour';
  teacherAssignments: '30 minutes';
  monthlySnapshots: '24 hours';
  healthRecordsSummary: '1 hour';
}
```

---

## 🧪 Testing Requirements

### Unit Test Coverage

- Database models: 100%
- Service functions: 95%
- PDF generators: 90%
- API endpoints: 100%

### Integration Tests

```typescript
describe('SF3 Books Management', () => {
  test('Issue book reduces available quantity');
  test('Return book increases available quantity');
  test('Generate SF3 PDF with accurate data');
  test('Unreturned books report filters correctly');
});

describe('SF4 Student Movements', () => {
  test('Record transfer updates enrollment snapshot');
  test('Monthly snapshot auto-generates on schedule');
  test('SF4 PDF matches DepEd template');
});

describe('SF8 Health Records', () => {
  test('BMI calculates correctly from weight/height');
  test('Nutritional status determined by WHO standards');
  test('Parent consent required before data entry');
  test('Access log tracks all health record views');
});
```

### E2E Tests (Playwright)

```typescript
test('Complete SF5 workflow: auto-generate → review → print', async ({ page }) => {
  await page.goto('/forms/sf5');
  await page.selectOption('#schoolYear', '2024-2025');
  await page.selectOption('#gradeLevel', '6');
  await page.click('#btnAutoGenerate');
  await page.waitForSelector('.promotion-records-table');
  await page.click('#btnGeneratePDF');
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toContain('SF5_Grade6_2024-2025.pdf');
});
```

---

## 📝 Documentation Standards

### Code Documentation

```typescript
/**
 * Generates SF4 Monthly Movement Report for a specific grade level
 * 
 * @param schoolId - UUID of the school
 * @param year - Academic year (e.g., 2024)
 * @param month - Month number (1-12)
 * @param gradeLevel - Grade level to filter (optional, generates for all if omitted)
 * @returns Promise<SF4ReportData> - Report data with movements and snapshot
 * 
 * @example
 * const report = await generateSF4Report(
 *   'school-uuid',
 *   2024,
 *   9,
 *   6
 * );
 * 
 * @throws {ValidationError} If month is not 1-12
 * @throws {NotFoundError} If school not found
 */
async function generateSF4Report(
  schoolId: string,
  year: number,
  month: number,
  gradeLevel?: number
): Promise<SF4ReportData> {
  // Implementation
}
```

---

## 🔄 Migration Scripts

### Data Migration from Firestore to PostgreSQL

```javascript
// migrate-books-to-postgresql.js
async function migrateBooks() {
  const firestoreBooks = await admin.firestore()
    .collection('books')
    .get();
  
  const batch = [];
  firestoreBooks.forEach(doc => {
    const data = doc.data();
    batch.push({
      id: doc.id,
      school_id: data.schoolId,
      title: data.title,
      subject_area: data.subjectArea,
      grade_level: data.gradeLevel,
      quantity: data.quantity || 0,
      available: data.available || 0,
      school_year: data.schoolYear,
      created_at: data.createdAt?.toDate() || new Date(),
      updated_at: data.updatedAt?.toDate() || new Date()
    });
  });
  
  await supabase.from('books').insert(batch);
  console.log(`Migrated ${batch.length} books`);
}
```

---

**Document Version:** 1.0  
**Next Review Date:** January 3, 2026  
**Maintained By:** EduSync Development Team
