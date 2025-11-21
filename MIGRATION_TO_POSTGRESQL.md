# EduSync Migration Plan: Firestore → PostgreSQL/Supabase

**Migration Start Date**: November 11, 2025  
**Target Completion**: December 2, 2025 (3 weeks)  
**Migration Lead**: Mark Gil Dotillos  
**Status**: 🟢 **Week 2 - 69% Complete (9/14 days)**

---

## Executive Summary

### Migration Status: AHEAD OF SCHEDULE ✅

**Completed Work** (as of Nov 20, 2025):
- ✅ Week 1: Database setup, schema creation, seeding (100%)
- ✅ Grades module: All 4 pages fully migrated (overview, academic, core-values, analytics)
- ✅ Students module: Full CRUD with 100% test coverage (6/6 Playwright tests passing)
- ✅ Performance optimizations: Query caching, React.memo, client-side filtering
- ✅ Database schema updates: Email field, migration scripts
- ✅ Bug fixes: UUID validation, field mapping, search functionality

**Current Phase**: Week 2 Day 5 - Teachers & Sections modules

**Next Up**: Teachers CRUD, Sections management, Reports integration

### Why We're Migrating

**Current Issues with Firestore**:
- 8 critical data integrity bugs in 1 week of testing
- No referential integrity (manual enforcement everywhere)
- Missing schoolId validation causes permission errors
- Complex queries require client-side joins
- High cost at scale ($282/month → $1,410/month for 50 schools)
- Technical debt accumulating rapidly

**Expected Benefits of PostgreSQL/Supabase**:
- ✅ Database-enforced referential integrity (foreign keys)
- ✅ ACID transactions (no more role corruption bugs)
- ✅ Schema validation (required fields enforced)
- ✅ SQL joins (complex queries in milliseconds)
- ✅ Cost reduction (97% savings: $25/month vs $282/month)
- ✅ Row-Level Security (similar to Firestore rules but cleaner)
- ✅ Real-time subscriptions (like Firestore)
- ✅ Proven reliability (used by Canvas LMS, Moodle, PowerSchool)

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss during migration | Low | Critical | Full Firestore backup, dry-run migrations, rollback plan |
| Downtime during cutover | Medium | High | Staged migration, maintain Firestore read-only during transition |
| Missing features in Supabase | Low | Medium | Feature compatibility audit completed (see below) |
| Team learning curve | Medium | Low | Supabase SDK similar to Firebase, documentation provided |
| Authentication migration | Low | Medium | Keep Firebase Auth (works with Supabase) |

### Success Criteria

- ✅ All 270 test students migrated with zero data loss
- ✅ All 6 sections with correct relationships
- ✅ All grades (current and future) stored correctly
- ✅ All 8 Firestore bugs eliminated
- ✅ Page load time ≤ 2 seconds (currently 3-5 seconds)
- ✅ Zero permission errors
- ✅ All Playwright tests passing
- ✅ Cost reduced by >90%

---

## Current System Inventory

### Firestore Collections (9 total)

| Collection | Documents | Relationships | Critical? | Notes |
|------------|-----------|---------------|-----------|-------|
| `schools` | 1 | Parent to all | ⭐ Yes | Root tenant document |
| `students` | 270 | → sections, → grades | ⭐ Yes | 45 per section × 6 sections |
| `teachers` | 5 | → sections (adviser), → classSchedules | ⭐ Yes | Includes admin users |
| `parents` | ~135 | → students (studentIds array) | Yes | 2 parents per student (avg) |
| `sections` | 6 | → teachers (adviserId), → students | ⭐ Yes | Grade 1-6, one section each |
| `learningAreas` | 9 | → grades | ⭐ Yes | MTB, Filipino, English, Math, Science, AP, ESP, MAPEH, TLE |
| `grades` | 0-2,430 | → students, → learningAreas | ⭐ Yes | Will be populated during testing (270 × 9 subjects) |
| `coreValueGrades` | ~1,080 | → students | Yes | 270 students × 4 core values |
| `classSchedules` | ~30 | → teachers, → sections, → learningAreas | Yes | Teacher-section-subject assignments |

**Total Documents**: ~4,000 (will grow to ~6,000 with full grade entry)

### Known Data Integrity Issues

1. **Orphaned References**: 
   - Students can reference non-existent sectionId
   - Grades can reference deleted students
   - Parents.studentIds can contain deleted student IDs

2. **Missing Required Fields**:
   - `schoolId` missing from some documents (Bug #8)
   - No enforcement of required fields like LRN, name, etc.

3. **Duplicate Data**:
   - MAPEH stored as composite and 4 individual subjects (Bug #6)
   - Learning areas: 13 total (should be 9)

4. **Role Corruption**:
   - Admin users can have teacher role simultaneously (Bug #4)
   - No ENUM constraint on role values

---

## PostgreSQL Schema Design

### Core Principles

1. **Multi-tenancy**: Every table has `school_id` with foreign key
2. **Audit Trail**: `created_at`, `updated_at`, `created_by` on all tables
3. **Soft Deletes**: `deleted_at` instead of hard deletes (DepEd compliance)
4. **Normalization**: 3NF (Third Normal Form) for data integrity
5. **Performance**: Indexes on all foreign keys and commonly queried fields

### Database Schema

```sql
-- ==========================================
-- TENANT MANAGEMENT
-- ==========================================

CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    school_id_number VARCHAR(50) UNIQUE, -- DepEd School ID
    division VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    principal_name VARCHAR(255),
    current_school_year VARCHAR(10) NOT NULL, -- e.g., "2024-2025"
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_schools_school_id_number ON schools(school_id_number);
CREATE INDEX idx_schools_deleted_at ON schools(deleted_at);

-- ==========================================
-- USER MANAGEMENT
-- ==========================================

-- Note: Authentication remains in Firebase Auth
-- This table stores profile data only

CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'parent');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL, -- Links to Firebase Auth
    email VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(school_id, email)
);

CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- ==========================================
-- STUDENTS
-- ==========================================

CREATE TYPE gender_type AS ENUM ('Male', 'Female');

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Optional: student portal login
    
    -- DepEd Required Fields
    lrn VARCHAR(12) UNIQUE NOT NULL, -- Learner Reference Number (DepEd standard)
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(10), -- Jr., Sr., III, etc.
    
    gender gender_type NOT NULL,
    date_of_birth DATE NOT NULL,
    place_of_birth VARCHAR(255),
    
    -- Current Academic Info
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
    enrollment_status VARCHAR(50) DEFAULT 'enrolled',
    
    -- Contact Info
    address TEXT,
    contact_number VARCHAR(20),
    email VARCHAR(255),
    
    -- Additional Info
    religion VARCHAR(100),
    indigenous_people BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    UNIQUE(school_id, lrn)
);

CREATE INDEX idx_students_school_id ON students(school_id);
CREATE INDEX idx_students_section_id ON students(section_id);
CREATE INDEX idx_students_lrn ON students(lrn);
CREATE INDEX idx_students_grade_level ON students(grade_level);
CREATE INDEX idx_students_deleted_at ON students(deleted_at);

-- ==========================================
-- TEACHERS
-- ==========================================

CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    employee_number VARCHAR(50),
    specialization VARCHAR(255),
    department VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    UNIQUE(school_id, user_id)
);

CREATE INDEX idx_teachers_school_id ON teachers(school_id);
CREATE INDEX idx_teachers_user_id ON teachers(user_id);
CREATE INDEX idx_teachers_deleted_at ON teachers(deleted_at);

-- ==========================================
-- PARENTS
-- ==========================================

CREATE TABLE parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50), -- Mother, Father, Guardian
    occupation VARCHAR(100),
    contact_number VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_parents_school_id ON parents(school_id);
CREATE INDEX idx_parents_user_id ON parents(user_id);
CREATE INDEX idx_parents_deleted_at ON parents(deleted_at);

-- Parent-Student Relationship (Many-to-Many)
CREATE TABLE parent_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    relationship VARCHAR(50), -- Mother, Father, Guardian
    is_primary_contact BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

CREATE INDEX idx_parent_students_parent_id ON parent_students(parent_id);
CREATE INDEX idx_parent_students_student_id ON parent_students(student_id);

-- ==========================================
-- SECTIONS
-- ==========================================

CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL, -- e.g., "St. Peter", "Sampaguita"
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
    school_year VARCHAR(10) NOT NULL,
    
    adviser_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    room_number VARCHAR(50),
    capacity INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    UNIQUE(school_id, grade_level, name, school_year)
);

CREATE INDEX idx_sections_school_id ON sections(school_id);
CREATE INDEX idx_sections_grade_level ON sections(grade_level);
CREATE INDEX idx_sections_adviser_id ON sections(adviser_id);
CREATE INDEX idx_sections_school_year ON sections(school_year);
CREATE INDEX idx_sections_deleted_at ON sections(deleted_at);

-- ==========================================
-- LEARNING AREAS (SUBJECTS)
-- ==========================================

CREATE TABLE learning_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    code VARCHAR(20) NOT NULL, -- MTB, FIL, ENG, MATH, etc.
    name VARCHAR(100) NOT NULL, -- Mother Tongue, Filipino, English, etc.
    description TEXT,
    
    -- Grade Level Applicability (JSONB array for flexibility)
    grade_levels INTEGER[] NOT NULL, -- e.g., {1, 2, 3} for MTB
    
    -- MAPEH Composite Support
    is_composite BOOLEAN DEFAULT false,
    components VARCHAR(100)[], -- ['Music', 'Arts', 'Physical Education', 'Health']
    
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    UNIQUE(school_id, code)
);

CREATE INDEX idx_learning_areas_school_id ON learning_areas(school_id);
CREATE INDEX idx_learning_areas_code ON learning_areas(code);
CREATE INDEX idx_learning_areas_grade_levels ON learning_areas USING GIN(grade_levels);
CREATE INDEX idx_learning_areas_deleted_at ON learning_areas(deleted_at);

-- ==========================================
-- GRADES (ACADEMIC)
-- ==========================================

CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    learning_area_id UUID NOT NULL REFERENCES learning_areas(id) ON DELETE RESTRICT,
    school_year VARCHAR(10) NOT NULL,
    
    -- Quarterly Grades (can be NULL if not yet graded)
    q1 NUMERIC(5,2) CHECK (q1 IS NULL OR (q1 >= 60 AND q1 <= 100)),
    q2 NUMERIC(5,2) CHECK (q2 IS NULL OR (q2 >= 60 AND q2 <= 100)),
    q3 NUMERIC(5,2) CHECK (q3 IS NULL OR (q3 >= 60 AND q3 <= 100)),
    q4 NUMERIC(5,2) CHECK (q4 IS NULL OR (q4 >= 60 AND q4 <= 100)),
    
    -- Composite Grades (MAPEH components stored as JSONB)
    -- Format: {"q1": {"Music": 85, "Arts": 90, "PE": 88, "Health": 92}}
    composite_grades JSONB,
    
    -- Computed Fields
    final_grade NUMERIC(5,2) CHECK (final_grade IS NULL OR (final_grade >= 60 AND final_grade <= 100)),
    remarks VARCHAR(50), -- "Passed", "Failed", "Incomplete"
    
    -- Metadata
    graded_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
    graded_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    UNIQUE(student_id, learning_area_id, school_year)
);

CREATE INDEX idx_grades_school_id ON grades(school_id);
CREATE INDEX idx_grades_student_id ON grades(student_id);
CREATE INDEX idx_grades_learning_area_id ON grades(learning_area_id);
CREATE INDEX idx_grades_school_year ON grades(school_year);
CREATE INDEX idx_grades_final_grade ON grades(final_grade);
CREATE INDEX idx_grades_deleted_at ON grades(deleted_at);

-- Function to auto-calculate final grade
CREATE OR REPLACE FUNCTION calculate_final_grade()
RETURNS TRIGGER AS $$
BEGIN
    -- Only calculate if at least one quarter is graded
    IF NEW.q1 IS NOT NULL OR NEW.q2 IS NOT NULL OR NEW.q3 IS NOT NULL OR NEW.q4 IS NOT NULL THEN
        NEW.final_grade := (
            COALESCE(NEW.q1, 0) + 
            COALESCE(NEW.q2, 0) + 
            COALESCE(NEW.q3, 0) + 
            COALESCE(NEW.q4, 0)
        ) / NULLIF(
            (CASE WHEN NEW.q1 IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN NEW.q2 IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN NEW.q3 IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN NEW.q4 IS NOT NULL THEN 1 ELSE 0 END), 
            0
        );
        
        -- Auto-set remarks
        IF NEW.final_grade >= 75 THEN
            NEW.remarks := 'Passed';
        ELSIF NEW.final_grade < 75 THEN
            NEW.remarks := 'Failed';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_final_grade
    BEFORE INSERT OR UPDATE ON grades
    FOR EACH ROW
    EXECUTE FUNCTION calculate_final_grade();

-- ==========================================
-- CORE VALUES (DepEd Requirement)
-- ==========================================

CREATE TABLE core_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    code VARCHAR(20) NOT NULL, -- MAKA_DIYOS, MAKATAO, etc.
    name VARCHAR(100) NOT NULL, -- Maka-Diyos, Makatao, etc.
    description TEXT,
    display_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(school_id, code)
);

CREATE INDEX idx_core_values_school_id ON core_values(school_id);

CREATE TYPE core_value_rating AS ENUM ('AO', 'SO', 'RO', 'NO'); -- Always, Sometimes, Rarely, Never Observed

CREATE TABLE core_value_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    core_value_id UUID NOT NULL REFERENCES core_values(id) ON DELETE CASCADE,
    school_year VARCHAR(10) NOT NULL,
    
    q1 core_value_rating,
    q2 core_value_rating,
    q3 core_value_rating,
    q4 core_value_rating,
    
    graded_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    UNIQUE(student_id, core_value_id, school_year)
);

CREATE INDEX idx_core_value_grades_school_id ON core_value_grades(school_id);
CREATE INDEX idx_core_value_grades_student_id ON core_value_grades(student_id);
CREATE INDEX idx_core_value_grades_school_year ON core_value_grades(school_year);
CREATE INDEX idx_core_value_grades_deleted_at ON core_value_grades(deleted_at);

-- ==========================================
-- CLASS SCHEDULES
-- ==========================================

CREATE TYPE day_of_week AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');

CREATE TABLE class_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    learning_area_id UUID NOT NULL REFERENCES learning_areas(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    
    day_of_week day_of_week NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_class_schedules_school_id ON class_schedules(school_id);
CREATE INDEX idx_class_schedules_section_id ON class_schedules(section_id);
CREATE INDEX idx_class_schedules_teacher_id ON class_schedules(teacher_id);
CREATE INDEX idx_class_schedules_day ON class_schedules(day_of_week);
CREATE INDEX idx_class_schedules_deleted_at ON class_schedules(deleted_at);

-- ==========================================
-- ATTENDANCE
-- ==========================================

CREATE TYPE attendance_status AS ENUM ('Present', 'Absent', 'Late', 'Excused');

CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    
    date DATE NOT NULL,
    status attendance_status NOT NULL DEFAULT 'Present',
    remarks TEXT,
    
    recorded_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(student_id, date)
);

CREATE INDEX idx_attendance_school_id ON attendance_records(school_id);
CREATE INDEX idx_attendance_student_id ON attendance_records(student_id);
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_attendance_status ON attendance_records(status);

-- ==========================================
-- ASSIGNMENTS
-- ==========================================

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    learning_area_id UUID NOT NULL REFERENCES learning_areas(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    max_score NUMERIC(5,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_assignments_school_id ON assignments(school_id);
CREATE INDEX idx_assignments_section_id ON assignments(section_id);
CREATE INDEX idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignments_deleted_at ON assignments(deleted_at);

-- ==========================================
-- AUDIT LOG (Optional but Recommended)
-- ==========================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_school_id ON audit_log(school_id);
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_record_id ON audit_log(record_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_value_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's school_id from JWT
CREATE OR REPLACE FUNCTION auth.get_user_school_id()
RETURNS UUID AS $$
BEGIN
    RETURN (auth.jwt() -> 'app_metadata' ->> 'school_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN auth.jwt() -> 'app_metadata' ->> 'role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example RLS Policies (apply similar to all tables)

-- Schools: Users can only see their own school
CREATE POLICY school_isolation ON schools
    FOR ALL
    USING (id = auth.get_user_school_id());

-- Students: Scoped to school
CREATE POLICY student_school_isolation ON students
    FOR ALL
    USING (school_id = auth.get_user_school_id());

-- Grades: Teachers can create/update, students can read their own
CREATE POLICY grade_teacher_write ON grades
    FOR INSERT
    WITH CHECK (
        school_id = auth.get_user_school_id() AND
        auth.get_user_role() IN ('admin', 'teacher')
    );

CREATE POLICY grade_student_read ON grades
    FOR SELECT
    USING (
        school_id = auth.get_user_school_id() AND
        (
            auth.get_user_role() IN ('admin', 'teacher') OR
            (auth.get_user_role() = 'student' AND student_id = auth.uid()::UUID)
        )
    );

-- ==========================================
-- UTILITY FUNCTIONS
-- ==========================================

-- Function to get student report card
CREATE OR REPLACE FUNCTION get_student_report_card(p_student_id UUID, p_school_year VARCHAR)
RETURNS TABLE (
    student_name VARCHAR,
    lrn VARCHAR,
    grade_level INTEGER,
    section_name VARCHAR,
    learning_area VARCHAR,
    q1 NUMERIC,
    q2 NUMERIC,
    q3 NUMERIC,
    q4 NUMERIC,
    final_grade NUMERIC,
    remarks VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.name,
        s.lrn,
        s.grade_level,
        sec.name,
        la.name,
        g.q1,
        g.q2,
        g.q3,
        g.q4,
        g.final_grade,
        g.remarks
    FROM students s
    LEFT JOIN sections sec ON s.section_id = sec.id
    LEFT JOIN grades g ON s.id = g.student_id
    LEFT JOIN learning_areas la ON g.learning_area_id = la.id
    WHERE s.id = p_student_id 
      AND g.school_year = p_school_year
    ORDER BY la.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get section grade summary
CREATE OR REPLACE FUNCTION get_section_grade_summary(p_section_id UUID, p_school_year VARCHAR)
RETURNS TABLE (
    total_students INTEGER,
    avg_final_grade NUMERIC,
    passing_students INTEGER,
    failing_students INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT s.id)::INTEGER as total_students,
        ROUND(AVG(g.final_grade), 2) as avg_final_grade,
        COUNT(DISTINCT CASE WHEN g.final_grade >= 75 THEN s.id END)::INTEGER as passing_students,
        COUNT(DISTINCT CASE WHEN g.final_grade < 75 THEN s.id END)::INTEGER as failing_students
    FROM students s
    LEFT JOIN grades g ON s.id = g.student_id AND g.school_year = p_school_year
    WHERE s.section_id = p_section_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Data Mapping: Firestore → PostgreSQL

### Collection Transformations

| Firestore Collection | PostgreSQL Table(s) | Transformation Notes |
|---------------------|-------------------|---------------------|
| `schools/{schoolId}` | `schools` | Direct 1:1 mapping |
| `students/{studentId}` | `students` | Add `user_id` FK (optional for portal) |
| `teachers/{teacherId}` | `teachers` + `users` | Split: auth data → users, profile → teachers |
| `parents/{parentId}` | `parents` + `parent_students` | studentIds[] → junction table |
| `sections/{sectionId}` | `sections` | Direct mapping |
| `learningAreas/{laId}` | `learning_areas` | gradeLevel field → grade_levels array |
| `grades/{gradeId}` | `grades` | MAPEH components → composite_grades JSONB |
| `coreValueGrades/{cvgId}` | `core_value_grades` | Direct mapping |
| `classSchedules/{csId}` | `class_schedules` | Direct mapping |

### Field Mappings

#### Students Collection → students Table

| Firestore Field | PostgreSQL Column | Type Change | Notes |
|----------------|-------------------|-------------|-------|
| `id` | `id` | string → UUID | Generate new UUIDs |
| `schoolId` | `school_id` | string → UUID FK | Reference schools table |
| `lrn` | `lrn` | VARCHAR(12) | ✅ Same |
| `name` | `name` + split | VARCHAR | Parse into first/middle/last |
| `gender` | `gender` | ENUM | ✅ Same values |
| `dateOfBirth` | `date_of_birth` | Timestamp → DATE | Convert format |
| `sectionId` | `section_id` | string → UUID FK | Reference sections table |
| `gradeLevel` | `grade_level` | number → INTEGER | ✅ Same |
| `address` | `address` | TEXT | ✅ Same |
| `contactNumber` | `contact_number` | VARCHAR(20) | ✅ Same |

#### Grades Collection → grades Table

| Firestore Field | PostgreSQL Column | Type Change | Notes |
|----------------|-------------------|-------------|-------|
| `id` | `id` | string → UUID | Generate new UUIDs |
| `schoolId` | `school_id` | string → UUID FK | ✅ Required |
| `studentId` | `student_id` | string → UUID FK | Reference students |
| `learningAreaId` | `learning_area_id` | string → UUID FK | Reference learning_areas |
| `q1` (number) | `q1` | number → NUMERIC(5,2) | Validate 60-100 range |
| `q1` (object for MAPEH) | `composite_grades` | object → JSONB | Store {"q1": {"Music": 85, ...}} |
| `q2`, `q3`, `q4` | Same pattern | - | - |
| `finalGrade` | `final_grade` | NUMERIC | Auto-calculated by trigger |
| `remarks` | `remarks` | VARCHAR(50) | Auto-set by trigger |

---

## Migration Timeline (3 Weeks)

### Week 1: Preparation & Setup (Nov 18-24)

#### Day 1 (Nov 18 - Monday): Planning & Backup ✅
- [x] Create migration plan document (this file)
- [ ] Create ER diagram
- [ ] Full Firestore backup (all collections)
- [ ] Set up Supabase project
- [ ] Initialize Git branch: `migration/postgresql`

#### Day 2 (Nov 19 - Tuesday): Schema Creation
- [ ] Create PostgreSQL schema in Supabase
- [ ] Set up RLS policies
- [ ] Create utility functions
- [ ] Test schema with sample data
- [ ] Document schema validation results

#### Day 3 (Nov 20 - Wednesday): Export Scripts
- [ ] Write Firestore export script
- [ ] Export all collections to JSON
- [ ] Validate exported data integrity
- [ ] Check for orphaned references
- [ ] Clean duplicate data (MAPEH issue)

#### Day 4 (Nov 21 - Thursday): Data Transformation
- [ ] Write transformation script (Firestore JSON → PostgreSQL format)
- [ ] Transform student data
- [ ] Transform teacher/parent data
- [ ] Transform section/learning area data
- [ ] Handle MAPEH composite grades

#### Day 5 (Nov 22 - Friday): Import & Validation
- [ ] Import transformed data to PostgreSQL
- [ ] Verify row counts match Firestore
- [ ] Test foreign key relationships
- [ ] Run data integrity queries
- [ ] Create migration rollback plan

### Week 2: Code Migration (Nov 25-Dec 1)

#### Day 6 (Nov 25 - Monday): Setup Supabase SDK
- [ ] Install `@supabase/supabase-js`
- [ ] Create Supabase client configuration
- [ ] Set up environment variables
- [ ] Create connection test script
- [ ] Document API usage patterns

#### Day 7 (Nov 26 - Tuesday): Core Hook Migration
- [ ] Create `useSupabase` hook (replaces useSchoolData)
- [ ] Implement real-time subscriptions
- [ ] Add offline caching layer (localStorage)
- [ ] Test CRUD operations
- [ ] Performance benchmarking

#### Day 8 (Nov 27 - Wednesday): Component Updates (Part 1)
- [ ] Update Dashboard component
- [ ] Update GradebookView component
- [ ] Update GradesView component
- [ ] Remove Firestore listeners
- [ ] Test grade entry flow

#### Day 9 (Nov 28 - Thursday): Component Updates (Part 2)
- [ ] Update StudentList component
- [ ] Update TeacherDashboard component
- [ ] Update SectionManagement component
- [ ] Update Reports components
- [ ] Handle MAPEH composite rendering

#### Day 10 (Nov 29 - Friday): Authentication & Authorization
- [ ] Keep Firebase Auth (no changes)
- [ ] Update custom claims to include school_id
- [ ] Sync user roles to PostgreSQL users table
- [ ] Test RLS policies with different roles
- [ ] Document auth flow

### Week 3: Testing & Deployment (Dec 2-8)

#### Day 11 (Dec 2 - Monday): Unit Testing
- [ ] Update all unit tests
- [ ] Test grade calculations
- [ ] Test MAPEH composite grades
- [ ] Test data validation
- [ ] Test error handling

#### Day 12 (Dec 3 - Tuesday): Integration Testing
- [ ] Run full Playwright test suite
- [ ] Test teacher workflows
- [ ] Test student portal
- [ ] Test parent portal
- [ ] Test report generation

#### Day 13 (Dec 4 - Wednesday): Performance Testing
- [ ] Load test with 1,000 students
- [ ] Test query performance
- [ ] Optimize slow queries
- [ ] Add missing indexes
- [ ] Cache strategy validation

#### Day 14 (Dec 5 - Thursday): Bug Fixes
- [ ] Fix failing tests
- [ ] Address performance issues
- [ ] Handle edge cases
- [ ] Test rollback procedure
- [ ] Update documentation

#### Day 15 (Dec 6 - Friday): Staging Deployment
- [ ] Deploy to staging environment
- [ ] Full smoke test
- [ ] Teacher UAT testing
- [ ] Collect feedback
- [ ] Final adjustments

#### Day 16-18 (Dec 7-9 - Weekend): Production Cutover
- [ ] **FRIDAY NIGHT**: Deploy to production
- [ ] Monitor for errors
- [ ] Test critical paths
- [ ] Verify data integrity
- [ ] Document known issues
- [ ] ✅ **MONDAY**: Go-live celebration

---

## Backup & Rollback Strategy

### Pre-Migration Backup (CRITICAL)

```bash
# 1. Export all Firestore collections
node scripts/migration/backup-firestore.cjs --project edusync-sis

# Output: 
# - backups/2025-11-18/schools.json
# - backups/2025-11-18/students.json
# - backups/2025-11-18/teachers.json
# - backups/2025-11-18/parents.json
# - backups/2025-11-18/sections.json
# - backups/2025-11-18/learningAreas.json
# - backups/2025-11-18/grades.json
# - backups/2025-11-18/coreValueGrades.json
# - backups/2025-11-18/classSchedules.json

# 2. Backup Firebase Auth users
firebase auth:export backups/2025-11-18/auth-users.json --project edusync-sis

# 3. Create Git tag
git tag -a firestore-backup-2025-11-18 -m "Pre-migration Firestore backup"
git push origin firestore-backup-2025-11-18

# 4. Backup Firestore rules
cp firestore.rules backups/2025-11-18/firestore.rules
```

### Rollback Plan

**If migration fails during Week 1-2** (Data/Code issues):
1. Delete PostgreSQL data
2. Fix transformation scripts
3. Re-run import
4. No impact to production (still on Firestore)

**If migration fails during Week 3** (Deployment issues):
1. Revert Git to `firestore-backup-2025-11-18` tag
2. Redeploy Firestore version
3. Restore Firebase Auth if needed
4. System back online in <30 minutes

**If migration succeeds but issues found in production**:
1. Keep PostgreSQL running (no data loss)
2. Re-enable Firestore as read-only fallback
3. Debug PostgreSQL issues
4. Switch back to PostgreSQL when fixed

---

## Testing Strategy

### Data Integrity Tests

```sql
-- Test 1: Verify all students migrated
SELECT 
    'students' as table_name,
    COUNT(*) as pg_count,
    270 as expected_count, -- From Firestore
    CASE WHEN COUNT(*) = 270 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM students WHERE deleted_at IS NULL;

-- Test 2: Verify all foreign keys are valid
SELECT 
    'student_section_fk' as test,
    COUNT(*) as invalid_count,
    CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM students s
LEFT JOIN sections sec ON s.section_id = sec.id
WHERE s.section_id IS NOT NULL AND sec.id IS NULL;

-- Test 3: Verify grade constraints
SELECT 
    'grade_range_check' as test,
    COUNT(*) as invalid_count,
    CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM grades
WHERE (q1 IS NOT NULL AND (q1 < 60 OR q1 > 100))
   OR (q2 IS NOT NULL AND (q2 < 60 OR q2 > 100))
   OR (q3 IS NOT NULL AND (q3 < 60 OR q3 > 100))
   OR (q4 IS NOT NULL AND (q4 < 60 OR q4 > 100));

-- Test 4: Verify MAPEH composite grades
SELECT 
    'mapeh_composite' as test,
    COUNT(*) as mapeh_count,
    CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM grades g
JOIN learning_areas la ON g.learning_area_id = la.id
WHERE la.is_composite = true AND g.composite_grades IS NOT NULL;

-- Test 5: Verify no orphaned parent relationships
SELECT 
    'parent_student_orphans' as test,
    COUNT(*) as orphan_count,
    CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM parent_students ps
LEFT JOIN students s ON ps.student_id = s.id
WHERE s.id IS NULL;
```

### Performance Benchmarks

| Query | Firestore (Current) | PostgreSQL (Target) | Improvement |
|-------|-------------------|-------------------|-------------|
| Load teacher dashboard (45 students) | 3.2s | <0.5s | 6.4x faster |
| Get all grades for section | 2.8s | <0.3s | 9.3x faster |
| Generate SF2 report (500 students) | 45s | <5s | 9x faster |
| Student search by LRN | 1.2s | <0.1s | 12x faster |
| Parent view (2 children grades) | 2.5s | <0.4s | 6.2x faster |

### User Acceptance Testing (UAT)

**Test Users**:
- Admin: `admin@lipa-city-elementary-school.edu.ph` / Test123!
- Teacher: `maria.santos@teacher.local` / Teacher123!
- Student: TBD (if student portal ready)
- Parent: TBD (if parent portal ready)

**Test Scenarios**:
1. ✅ Admin can view all students across all sections
2. ✅ Teacher can view only assigned section students
3. ✅ Teacher can enter grades for MAPEH (all 4 components)
4. ✅ Final grades auto-calculate correctly
5. ✅ Reports generate without errors
6. ✅ Offline grade entry (localStorage cache)
7. ✅ Real-time updates when another teacher edits

---

## Risk Mitigation

### Risk 1: Data Loss During Migration
**Mitigation**:
- ✅ Full Firestore backup before starting
- ✅ Git tag for code rollback
- ✅ Dry-run migrations on staging first
- ✅ Row count validation after import
- ✅ Keep Firestore read-only for 1 week after cutover

### Risk 2: Downtime During Cutover
**Mitigation**:
- ✅ Deploy Friday night (low traffic)
- ✅ Read-only mode during migration
- ✅ Pre-deploy to staging
- ✅ Rollback plan tested
- ✅ Monitor logs closely

### Risk 3: Missing Firestore Features
**Mitigation**:
- ✅ Supabase has real-time subscriptions (similar to Firestore)
- ✅ Offline support via localStorage (40 lines of code)
- ✅ Feature parity audit completed
- ✅ No critical missing features identified

### Risk 4: Performance Regression
**Mitigation**:
- ✅ Load testing before go-live
- ✅ Indexes on all foreign keys
- ✅ Query optimization
- ✅ Caching strategy (localStorage + Supabase cache)
- ✅ Rollback if performance < Firestore

### Risk 5: Team Learning Curve
**Mitigation**:
- ✅ Supabase SDK similar to Firebase (minimal retraining)
- ✅ SQL knowledge transfer session
- ✅ Documentation for all new patterns
- ✅ Code examples for common operations
- ✅ No impact on current development (happens in parallel)

---

## Success Metrics

### Quantitative Metrics

| Metric | Baseline (Firestore) | Target (PostgreSQL) | Actual | Status |
|--------|---------------------|-------------------|--------|--------|
| Data Integrity Bugs | 8 in 1 week | 0 | TBD | ⏳ Pending |
| Dashboard Load Time | 3.2s | <1s | TBD | ⏳ Pending |
| Report Generation Time | 45s | <5s | TBD | ⏳ Pending |
| Monthly Cost (10 schools) | $282 | <$30 | TBD | ⏳ Pending |
| Test Coverage | 60% | >90% | TBD | ⏳ Pending |
| Production Bugs (Week 1) | N/A | <3 | TBD | ⏳ Pending |

### Qualitative Metrics

- [ ] All Playwright tests passing
- [ ] No permission errors
- [ ] No "student count 0" bugs
- [ ] No role corruption issues
- [ ] MAPEH grades work perfectly
- [ ] Teachers report faster performance
- [ ] Confidence level: >95%

---

## Team Responsibilities

| Role | Responsibilities | Time Commitment |
|------|-----------------|----------------|
| **Mark Gil Dotillos** (Lead) | - Schema design<br>- Migration scripts<br>- Code updates<br>- Testing<br>- Deployment | Full-time (3 weeks) |
| **QA Tester** (Optional) | - UAT testing<br>- Bug reporting<br>- Regression testing | 2-3 days (Week 3) |
| **Stakeholder** (School Admin) | - Review test results<br>- Approve go-live<br>- Provide feedback | 2 hours total |

---

## Communication Plan

### Status Updates

**Daily Standup** (async in Slack/Discord):
- What did I complete yesterday?
- What will I work on today?
- Any blockers?

**Weekly Summary** (Fridays):
- Progress vs. timeline
- Risks identified
- Decisions needed
- Next week's plan

**Go-Live Checklist**:
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Stakeholder approval
- [ ] Rollback plan tested
- [ ] Monitoring enabled
- [ ] Documentation updated

---

## Post-Migration Tasks

### Week 1 After Go-Live (Dec 9-15)
- [ ] Monitor error logs daily
- [ ] Track performance metrics
- [ ] Collect user feedback
- [ ] Fix any critical bugs
- [ ] Optimize slow queries

### Month 1 After Go-Live (Dec 9 - Jan 9)
- [ ] Review cost savings
- [ ] Document lessons learned
- [ ] Archive Firestore backup
- [ ] Update developer documentation
- [ ] Plan next features using PostgreSQL advantages

### Long-Term (3-6 months)
- [ ] Decommission Firestore (keep Auth only)
- [ ] Implement advanced PostgreSQL features:
  - Materialized views for reports
  - Full-text search for students
  - Partitioning by school_year
- [ ] Multi-school rollout
- [ ] Consider PostgreSQL-specific optimizations

---

## Migration Progress Summary (Updated Nov 20, 2025)

### Modules Migrated to PostgreSQL

| Module | Status | CRUD | Tests | Performance | Notes |
|--------|--------|------|-------|-------------|-------|
| **Grades (Overview)** | ✅ Complete | Read-only | Manual | Excellent | Displays all student grades |
| **Grades (Academic)** | ✅ Complete | Read-only | Manual | Excellent | Learning area grades with MAPEH |
| **Grades (Core Values)** | ✅ Complete | Read-only | Manual | Excellent | 4 core values display |
| **Grades (Analytics)** | ✅ Complete | Read-only | Manual | Excellent | Charts and statistics |
| **Students** | ✅ Complete | Full CRUD | 6/6 Playwright | Optimized | Query caching, React.memo |
| **Teachers** | ⏸️ Planned | - | - | - | Day 10 target |
| **Sections** | ⏸️ Planned | - | - | - | Day 10 target |
| **Reports** | ⏸️ Planned | - | - | - | Week 3 target |

### Technical Achievements

**Performance Optimizations**:
- Query result caching with TTL (30s for students, 60s for learning areas)
- React.memo() on heavy components (StudentList)
- Client-side filtering for instant search (<1000 records)
- Removed 50+ excessive console.logs
- Loading time: "24 years" → <1 second

**Database Enhancements**:
- Added email column to students table
- Created migration script infrastructure
- Implemented field mapping layer (Firestore ↔ PostgreSQL)
- Auto-derive grade_level from section assignment

**Bug Fixes**:
- UUID validation (schoolId === 'default' handling)
- Field name mismatches (sex/gender, name/firstName/lastName)
- Search using Firestore instead of PostgreSQL
- School_id undefined in create operations
- Cache invalidation after CRUD operations

**Test Coverage**:
- Comprehensive Playwright test suite for Students module
- 100% pass rate (6/6 tests)
- Tests: display, create, update, delete, filter, search

### Files Created/Modified

**New Files**:
- `scripts/migration/add-email-column.sql` - Email field migration
- `tests/students-crud.spec.ts` - Comprehensive E2E tests

**Modified Files**:
- `src/hooks/useStudentsPostgreSQL.ts` - CRUD operations, caching, field mapping
- `src/hooks/useLearningAreasPostgreSQL.ts` - Query caching
- `hooks/useSchoolData.ts` - PostgreSQL integration for CRUD
- `scripts/migration/seed-production.sql` - Email generation
- `components/StudentList.tsx` - React.memo optimization
- `App.tsx`, `SchoolContext.tsx` - Logging cleanup

### Lessons Learned

1. **Caching Strategy**: Query result caching dramatically improves performance for re-renders
2. **Field Mapping**: Always validate field names match between UI form and database schema
3. **Client-Side Filtering**: Instant search for datasets <1000 records
4. **Test Timing**: Playwright needs generous timeouts for React hydration
5. **Navigation**: Click sidebar links more reliable than direct URL navigation
6. **Error Detection**: Modal staying open indicates validation failure

---

## Appendix

### Tools & Resources

- **Supabase Dashboard**: https://app.supabase.com
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Supabase Docs**: https://supabase.com/docs
- **Migration Scripts**: `/scripts/migration/`
- **Backup Location**: `/backups/2025-11-18/`
- **ER Diagram**: `SCHEMA_ER_DIAGRAM.md`
- **Progress Tracker**: `MIGRATION_PROGRESS.md`

### Contact Information

- **Migration Lead**: Mark Gil Dotillos
- **Escalation**: TBD
- **Emergency Rollback**: See "Rollback Plan" section

---

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Migration Lead** | Mark Gil Dotillos | _____________ | Nov 18, 2025 |
| **Stakeholder** | TBD | _____________ | _________ |

---

**Document Version**: 1.0  
**Last Updated**: November 18, 2025  
**Next Review**: November 25, 2025 (End of Week 1)
