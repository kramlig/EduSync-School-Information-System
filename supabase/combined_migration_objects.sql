-- ============================================================================
-- COMBINED MIGRATION OBJECTS FOR NEW SUPABASE PROJECT
-- Generated: 2026-03-31
-- Source: supabase/migrations/ and supabase/functions/
--
-- Contains ONLY: Types, Indexes, Unique Constraints, Functions, Triggers
-- Excludes: CREATE TABLE (handled by DDL), DROP, INSERT/UPDATE data, RLS policies
-- ============================================================================

-- ############################################################################
-- SECTION 1: CUSTOM TYPES / ENUMS
-- ############################################################################

-- Division user roles
DO $$ BEGIN
  CREATE TYPE division_user_role AS ENUM (
    'division_admin',
    'division_supervisor',
    'division_data_manager',
    'psds',
    'eps'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Login audit status
DO $$ BEGIN
  CREATE TYPE login_status AS ENUM ('success', 'failed', 'blocked', 'expired');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Login method
DO $$ BEGIN
  CREATE TYPE login_method AS ENUM ('email_password', 'google_oauth', 'microsoft_oauth', 'magic_link', 'api_key');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- ############################################################################
-- SECTION 2: INDEXES
-- ############################################################################

-- ===========================================================================
-- 2a. ECR (Electronic Class Record) Indexes
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_ecr_weights_school ON ecr_weights(school_id);
CREATE INDEX IF NOT EXISTS idx_ecr_weights_learning_area ON ecr_weights(learning_area_id);

CREATE INDEX IF NOT EXISTS idx_ecr_activities_school ON ecr_activities(school_id);
CREATE INDEX IF NOT EXISTS idx_ecr_activities_teacher ON ecr_activities(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ecr_activities_section ON ecr_activities(section_id);
CREATE INDEX IF NOT EXISTS idx_ecr_activities_learning_area ON ecr_activities(learning_area_id);
CREATE INDEX IF NOT EXISTS idx_ecr_activities_quarter ON ecr_activities(school_year, quarter);
CREATE INDEX IF NOT EXISTS idx_ecr_activities_type ON ecr_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_ecr_activities_deleted ON ecr_activities(deleted_at);

CREATE INDEX IF NOT EXISTS idx_ecr_scores_activity ON ecr_scores(activity_id);
CREATE INDEX IF NOT EXISTS idx_ecr_scores_student ON ecr_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_ecr_scores_status ON ecr_scores(status);

CREATE INDEX IF NOT EXISTS idx_ecr_component_grades_school ON ecr_component_grades(school_id);
CREATE INDEX IF NOT EXISTS idx_ecr_component_grades_student ON ecr_component_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_ecr_component_grades_section ON ecr_component_grades(section_id);
CREATE INDEX IF NOT EXISTS idx_ecr_component_grades_quarter ON ecr_component_grades(school_year, quarter);

-- ===========================================================================
-- 2b. Division / District Indexes
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_divisions_code ON divisions(code);
CREATE INDEX IF NOT EXISTS idx_divisions_region ON divisions(region);
CREATE INDEX IF NOT EXISTS idx_divisions_region_code ON divisions(region_code);
CREATE INDEX IF NOT EXISTS idx_divisions_is_active ON divisions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_divisions_deleted_at ON divisions(deleted_at);

CREATE INDEX IF NOT EXISTS idx_division_users_division_id ON division_users(division_id);
CREATE INDEX IF NOT EXISTS idx_division_users_user_id ON division_users(user_id);
CREATE INDEX IF NOT EXISTS idx_division_users_firebase_uid ON division_users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_division_users_email ON division_users(email);
CREATE INDEX IF NOT EXISTS idx_division_users_role ON division_users(role);
CREATE INDEX IF NOT EXISTS idx_division_users_is_active ON division_users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_division_users_deleted_at ON division_users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_division_users_assigned_district ON division_users(assigned_district_id);

CREATE INDEX IF NOT EXISTS idx_districts_division_id ON districts(division_id);
CREATE INDEX IF NOT EXISTS idx_districts_code ON districts(code);
CREATE INDEX IF NOT EXISTS idx_districts_is_active ON districts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_districts_deleted_at ON districts(deleted_at);

-- Schools -> division/district FK indexes
CREATE INDEX IF NOT EXISTS idx_schools_division_id ON schools(division_id);
CREATE INDEX IF NOT EXISTS idx_schools_district_id ON schools(district_id);

-- ===========================================================================
-- 2c. Teaching Assignments & Ancillary Responsibilities Indexes
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_teacher_id ON teaching_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_school_id ON teaching_assignments(school_id);
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_school_year ON teaching_assignments(school_year);
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_section_id ON teaching_assignments(section_id);
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_grade_level ON teaching_assignments(grade_level);
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_is_advisory ON teaching_assignments(is_advisory) WHERE is_advisory = true;
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_school_year_teacher ON teaching_assignments(school_id, school_year, teacher_id);
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_learning_area ON teaching_assignments(learning_area_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_active_flag ON teaching_assignments(teacher_id, is_active) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_deleted ON teaching_assignments(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ancillary_responsibilities_teacher_id ON ancillary_responsibilities(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ancillary_responsibilities_school_id ON ancillary_responsibilities(school_id);
CREATE INDEX IF NOT EXISTS idx_ancillary_responsibilities_school_year ON ancillary_responsibilities(school_year);
CREATE INDEX IF NOT EXISTS idx_ancillary_responsibilities_school_year_teacher ON ancillary_responsibilities(school_id, school_year, teacher_id);

-- ===========================================================================
-- 2d. Auth Architecture Indexes (Option A)
-- ===========================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_firebase_uid ON teachers(firebase_uid) WHERE firebase_uid IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_firebase_uid ON students(firebase_uid) WHERE firebase_uid IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_parents_firebase_uid ON parents(firebase_uid) WHERE firebase_uid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_parents_email ON parents(email);
CREATE INDEX IF NOT EXISTS idx_teachers_role ON teachers(role);

CREATE INDEX IF NOT EXISTS idx_superadmins_firebase_uid ON superadmins(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_superadmins_email ON superadmins(email);

-- ===========================================================================
-- 2e. Teacher SF7 Fields Indexes
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_teachers_last_name ON teachers(last_name);
CREATE INDEX IF NOT EXISTS idx_teachers_first_name ON teachers(first_name);
CREATE INDEX IF NOT EXISTS idx_teachers_position ON teachers(position);
CREATE INDEX IF NOT EXISTS idx_teachers_employment_status ON teachers(employment_status);
CREATE INDEX IF NOT EXISTS idx_teachers_firebase_uid ON teachers(firebase_uid);

-- ===========================================================================
-- 2f. Login Audit Indexes
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_login_audit_firebase_uid ON login_audit(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_login_audit_email ON login_audit(email);
CREATE INDEX IF NOT EXISTS idx_login_audit_status ON login_audit(login_status);
CREATE INDEX IF NOT EXISTS idx_login_audit_ip ON login_audit(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_audit_date ON login_audit(login_date DESC);
CREATE INDEX IF NOT EXISTS idx_login_audit_created_at ON login_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_audit_rate_limit ON login_audit(email, ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_audit_school ON login_audit(school_id, login_date DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_blocks_lookup ON rate_limit_blocks(block_type, block_value, blocked_until);

-- ===========================================================================
-- 2g. Facilities Indexes
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_facilities_school_id ON facilities(school_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_facilities_type ON facilities(facility_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_facilities_status ON facilities(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_facilities_condition ON facilities(condition) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_facilities_building ON facilities(building_name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_facilities_assigned ON facilities(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_facilities_school_type ON facilities(school_id, facility_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_facilities_school_status ON facilities(school_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_facilities_school_condition ON facilities(school_id, condition) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_maintenance_facility ON facility_maintenance_logs(facility_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_maintenance_school ON facility_maintenance_logs(school_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON facility_maintenance_logs(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_maintenance_dates ON facility_maintenance_logs(reported_date, completed_date) WHERE deleted_at IS NULL;

-- ===========================================================================
-- 2h. Disabled At Indexes
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_teachers_disabled_at ON teachers(disabled_at) WHERE disabled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_disabled_at ON students(disabled_at) WHERE disabled_at IS NOT NULL;

-- ===========================================================================
-- 2i. Homeroom Guidance Grades Indexes
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_hg_grades_school_year ON homeroom_guidance_grades(school_id, school_year);
CREATE INDEX IF NOT EXISTS idx_hg_grades_student ON homeroom_guidance_grades(student_id);

-- ===========================================================================
-- 2j. Books & Book Issuances Indexes (SF3)
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_books_school ON books(school_id);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_subject ON books(subject);
CREATE INDEX IF NOT EXISTS idx_books_grade ON books(grade_level);
CREATE INDEX IF NOT EXISTS idx_books_deleted ON books(deleted_at);

CREATE INDEX IF NOT EXISTS idx_issuances_school ON book_issuances(school_id);
CREATE INDEX IF NOT EXISTS idx_issuances_book ON book_issuances(book_id);
CREATE INDEX IF NOT EXISTS idx_issuances_student ON book_issuances(student_id);
CREATE INDEX IF NOT EXISTS idx_issuances_school_year ON book_issuances(school_year);
CREATE INDEX IF NOT EXISTS idx_issuances_status ON book_issuances(status);
CREATE INDEX IF NOT EXISTS idx_issuances_issue_date ON book_issuances(issue_date);
CREATE INDEX IF NOT EXISTS idx_issuances_school_year_status ON book_issuances(school_id, school_year, status);
CREATE INDEX IF NOT EXISTS idx_books_school_subject_grade ON books(school_id, subject, grade_level) WHERE deleted_at IS NULL;

-- ===========================================================================
-- 2k. Textbook Distributions Indexes (SF6)
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_textbook_distributions_school ON textbook_distributions(school_id);
CREATE INDEX IF NOT EXISTS idx_textbook_distributions_book ON textbook_distributions(book_id);
CREATE INDEX IF NOT EXISTS idx_textbook_distributions_student ON textbook_distributions(student_id);
CREATE INDEX IF NOT EXISTS idx_textbook_distributions_section ON textbook_distributions(section_id);
CREATE INDEX IF NOT EXISTS idx_textbook_distributions_school_year ON textbook_distributions(school_year);
CREATE INDEX IF NOT EXISTS idx_textbook_distributions_status ON textbook_distributions(distribution_status);
CREATE INDEX IF NOT EXISTS idx_textbook_distributions_distributed_date ON textbook_distributions(distributed_date);
CREATE INDEX IF NOT EXISTS idx_textbook_distributions_payment_status ON textbook_distributions(payment_status);
CREATE INDEX IF NOT EXISTS idx_textbook_distributions_school_year_status ON textbook_distributions(school_id, school_year, distribution_status);
CREATE INDEX IF NOT EXISTS idx_textbook_distributions_student_year ON textbook_distributions(student_id, school_year);
CREATE INDEX IF NOT EXISTS idx_textbook_distributions_book_year ON textbook_distributions(book_id, school_year);

-- ===========================================================================
-- 2l. Division Proficiency Report Indexes
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_grades_school_student ON grades(school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_grades_learning_area ON grades(learning_area_id);
CREATE INDEX IF NOT EXISTS idx_students_school_section ON students(school_id, section_id) WHERE deleted_at IS NULL AND enrollment_status = 'enrolled';
CREATE INDEX IF NOT EXISTS idx_schools_division ON schools(division_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_learning_areas_school ON learning_areas(school_id, code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sections_grade_level ON sections(id, grade_level);

-- ===========================================================================
-- 2m. Division Report Indexes (SF5/SF6)
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_students_division_enrollment ON students(school_id, enrollment_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_students_school_grade_gender ON students(school_id, grade_level, gender) WHERE deleted_at IS NULL AND enrollment_status = 'enrolled';
CREATE INDEX IF NOT EXISTS idx_promotion_records_division_summary ON promotion_records(school_id, school_year, grading_period);
CREATE INDEX IF NOT EXISTS idx_promotion_records_school_grade_status ON promotion_records(school_id, current_grade_level, promotion_status, school_year, grading_period);
CREATE INDEX IF NOT EXISTS idx_schools_division_active ON schools(division_id) WHERE deleted_at IS NULL;

-- ===========================================================================
-- 2n. Student Movements Indexes (SF4)
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_student_movements_school ON student_movements(school_id);
CREATE INDEX IF NOT EXISTS idx_student_movements_student ON student_movements(student_id);
CREATE INDEX IF NOT EXISTS idx_student_movements_school_year ON student_movements(school_year);
CREATE INDEX IF NOT EXISTS idx_student_movements_month ON student_movements(month);
CREATE INDEX IF NOT EXISTS idx_student_movements_type ON student_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_student_movements_date ON student_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_student_movements_school_year_month ON student_movements(school_id, school_year, month);
CREATE INDEX IF NOT EXISTS idx_student_movements_school_grade ON student_movements(school_id, grade_level);

CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_school ON monthly_enrollment_snapshots(school_id);
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_school_year ON monthly_enrollment_snapshots(school_year);
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_month ON monthly_enrollment_snapshots(month);
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_grade ON monthly_enrollment_snapshots(grade_level);
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_school_year_month ON monthly_enrollment_snapshots(school_id, school_year, month);

-- ===========================================================================
-- 2o. ELLN Assessment Indexes
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_elln_school_id ON elln_assessments(school_id);
CREATE INDEX IF NOT EXISTS idx_elln_student_id ON elln_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_elln_grade_level ON elln_assessments(grade_level);
CREATE INDEX IF NOT EXISTS idx_elln_school_year ON elln_assessments(school_year);
CREATE INDEX IF NOT EXISTS idx_elln_assessment_date ON elln_assessments(assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_elln_proficiency ON elln_assessments(proficiency_level);
CREATE INDEX IF NOT EXISTS idx_elln_student_year_quarter ON elln_assessments(student_id, school_year, quarter);


-- ############################################################################
-- SECTION 3: UNIQUE CONSTRAINTS & UNIQUE INDEXES (ALTER TABLE / CREATE UNIQUE INDEX)
-- ############################################################################

-- Teaching assignments: Only one advisory per teacher/grade/section/year
CREATE UNIQUE INDEX IF NOT EXISTS idx_teaching_assignments_unique_advisory
  ON teaching_assignments(teacher_id, school_year, grade_level, section_id)
  WHERE is_advisory = true;

-- Monthly enrollment snapshots: One per school/year/month/grade/section
CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_snapshots_unique
  ON monthly_enrollment_snapshots(school_id, school_year, month, grade_level, COALESCE(section_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Textbook distributions: One active distribution per student/book/year
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_distribution
  ON textbook_distributions(school_id, book_id, student_id, school_year)
  WHERE distribution_status = 'issued';

-- Teachers: One teacher per user per school
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_teacher_per_user_per_school'
  ) THEN
    ALTER TABLE teachers ADD CONSTRAINT unique_teacher_per_user_per_school UNIQUE (user_id, school_id);
  END IF;
END $$;

-- Teachers: Unique email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'teachers_email_unique'
  ) THEN
    ALTER TABLE teachers ADD CONSTRAINT teachers_email_unique UNIQUE (email);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN others THEN NULL;
END $$;

-- Division users: FK to districts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_division_users_assigned_district'
  ) THEN
    ALTER TABLE division_users
    ADD CONSTRAINT fk_division_users_assigned_district
    FOREIGN KEY (assigned_district_id) REFERENCES districts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Promotion records: Updated CHECK constraint with 'conditionally_promoted'
ALTER TABLE promotion_records DROP CONSTRAINT IF EXISTS promotion_records_promotion_status_check;
ALTER TABLE promotion_records ADD CONSTRAINT promotion_records_promotion_status_check
CHECK (promotion_status IN (
  'promoted',
  'conditionally_promoted',
  'retained',
  'pending',
  'graduated',
  'transferred'
));

-- Learning areas: subject_group check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'learning_areas_subject_group_check'
  ) THEN
    ALTER TABLE learning_areas ADD CONSTRAINT learning_areas_subject_group_check
      CHECK (subject_group IN (
        'core_academic',
        'mapeh',
        'epp_tle_exploratory',
        'tle_specialized',
        'tvl_shs'
      ));
  END IF;
END $$;


-- ############################################################################
-- SECTION 4: FUNCTIONS (CREATE OR REPLACE FUNCTION)
-- ############################################################################

-- ===========================================================================
-- 4a. get_user_by_firebase_uid (Role-Centric Auth - latest version)
-- ===========================================================================
CREATE OR REPLACE FUNCTION get_user_by_firebase_uid(p_firebase_uid VARCHAR(128))
RETURNS TABLE (
    user_id UUID,
    user_type VARCHAR(20),
    email VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50),
    school_id UUID,
    school_name VARCHAR(255),
    division_id UUID,
    division_name VARCHAR(255),
    grade_level INTEGER,
    section_id UUID,
    contact_number VARCHAR(20),
    employee_number VARCHAR(50),
    user_position VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100)
) AS $$
BEGIN
    -- 1. Check superadmins first (platform level)
    RETURN QUERY
    SELECT
        sa.id AS user_id,
        'superadmin'::VARCHAR(20) AS user_type,
        sa.email,
        sa.name,
        'superadmin'::VARCHAR(50) AS role,
        NULL::UUID AS school_id,
        NULL::VARCHAR(255) AS school_name,
        NULL::UUID AS division_id,
        NULL::VARCHAR(255) AS division_name,
        NULL::INTEGER AS grade_level,
        NULL::UUID AS section_id,
        NULL::VARCHAR(20) AS contact_number,
        NULL::VARCHAR(50) AS employee_number,
        NULL::VARCHAR(50) AS user_position,
        NULL::VARCHAR(100) AS first_name,
        NULL::VARCHAR(100) AS last_name
    FROM superadmins sa
    WHERE sa.firebase_uid = p_firebase_uid
    AND sa.deleted_at IS NULL
    AND sa.is_active = true
    LIMIT 1;

    IF FOUND THEN RETURN; END IF;

    -- 2. Check division_users (division level)
    RETURN QUERY
    SELECT
        du.id AS user_id,
        'division_user'::VARCHAR(20) AS user_type,
        du.email,
        du.name,
        du.role::VARCHAR(50),
        NULL::UUID AS school_id,
        NULL::VARCHAR(255) AS school_name,
        du.division_id,
        d.name AS division_name,
        NULL::INTEGER AS grade_level,
        NULL::UUID AS section_id,
        NULL::VARCHAR(20) AS contact_number,
        NULL::VARCHAR(50) AS employee_number,
        NULL::VARCHAR(50) AS user_position,
        NULL::VARCHAR(100) AS first_name,
        NULL::VARCHAR(100) AS last_name
    FROM division_users du
    LEFT JOIN divisions d ON d.id = du.division_id
    WHERE du.firebase_uid = p_firebase_uid
    AND du.deleted_at IS NULL
    AND du.is_active = true
    LIMIT 1;

    IF FOUND THEN RETURN; END IF;

    -- 3. Check teachers (school staff: admin, principal, registrar, teacher)
    RETURN QUERY
    SELECT
        t.id AS user_id,
        'teacher'::VARCHAR(20) AS user_type,
        t.email,
        t.name,
        COALESCE(t.role, 'teacher')::VARCHAR(50) AS role,
        t.school_id,
        s.name AS school_name,
        NULL::UUID AS division_id,
        NULL::VARCHAR(255) AS division_name,
        NULL::INTEGER AS grade_level,
        NULL::UUID AS section_id,
        t.phone AS contact_number,
        t.employee_number,
        t.position AS user_position,
        t.first_name::VARCHAR(100),
        t.last_name::VARCHAR(100)
    FROM teachers t
    JOIN schools s ON s.id = t.school_id
    WHERE t.firebase_uid = p_firebase_uid
    AND t.deleted_at IS NULL
    LIMIT 1;

    IF FOUND THEN RETURN; END IF;

    -- 4. Check students
    RETURN QUERY
    SELECT
        st.id AS user_id,
        'student'::VARCHAR(20) AS user_type,
        st.email,
        CONCAT(st.first_name, ' ', st.last_name)::VARCHAR(255) AS name,
        'student'::VARCHAR(50) AS role,
        st.school_id,
        s.name AS school_name,
        NULL::UUID AS division_id,
        NULL::VARCHAR(255) AS division_name,
        st.grade_level,
        st.section_id,
        st.contact_number,
        NULL::VARCHAR(50) AS employee_number,
        NULL::VARCHAR(50) AS user_position,
        st.first_name::VARCHAR(100),
        st.last_name::VARCHAR(100)
    FROM students st
    JOIN schools s ON s.id = st.school_id
    WHERE st.firebase_uid = p_firebase_uid
    AND st.deleted_at IS NULL
    LIMIT 1;

    IF FOUND THEN RETURN; END IF;

    -- 5. Check parents
    RETURN QUERY
    SELECT
        p.id AS user_id,
        'parent'::VARCHAR(20) AS user_type,
        p.email,
        p.name,
        'parent'::VARCHAR(50) AS role,
        p.school_id,
        s.name AS school_name,
        NULL::UUID AS division_id,
        NULL::VARCHAR(255) AS division_name,
        NULL::INTEGER AS grade_level,
        NULL::UUID AS section_id,
        p.contact_number,
        NULL::VARCHAR(50) AS employee_number,
        NULL::VARCHAR(50) AS user_position,
        NULL::VARCHAR(100) AS first_name,
        NULL::VARCHAR(100) AS last_name
    FROM parents p
    JOIN schools s ON s.id = p.school_id
    WHERE p.firebase_uid = p_firebase_uid
    AND p.deleted_at IS NULL
    LIMIT 1;

END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- 4b. get_teacher_by_firebase_uid
-- ===========================================================================
CREATE OR REPLACE FUNCTION get_teacher_by_firebase_uid(p_firebase_uid VARCHAR(128))
RETURNS TABLE (
    id UUID,
    school_id UUID,
    email VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50),
    employee_number VARCHAR(50),
    user_position VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.school_id,
        t.email::VARCHAR(255),
        t.name::VARCHAR(255),
        COALESCE(t.role, 'teacher')::VARCHAR(50),
        t.employee_number::VARCHAR(50),
        t.position::VARCHAR(50) AS user_position
    FROM teachers t
    WHERE t.firebase_uid = p_firebase_uid
    AND t.deleted_at IS NULL
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- 4c. get_accessible_schools_for_division_user
-- ===========================================================================
CREATE OR REPLACE FUNCTION get_accessible_schools_for_division_user(p_firebase_uid VARCHAR)
RETURNS SETOF UUID AS $$
DECLARE
  v_division_user RECORD;
BEGIN
  SELECT * INTO v_division_user
  FROM division_users
  WHERE firebase_uid = p_firebase_uid
    AND is_active = true
    AND deleted_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_division_user.accessible_school_ids IS NOT NULL
     AND array_length(v_division_user.accessible_school_ids, 1) > 0 THEN
    RETURN QUERY SELECT unnest(v_division_user.accessible_school_ids);
    RETURN;
  END IF;

  IF v_division_user.role = 'psds' THEN
    IF v_division_user.assigned_district_ids IS NOT NULL
       AND array_length(v_division_user.assigned_district_ids, 1) > 0 THEN
      RETURN QUERY
        SELECT s.id FROM schools s
        WHERE s.district_id = ANY(v_division_user.assigned_district_ids)
          AND s.deleted_at IS NULL;
      RETURN;
    ELSIF v_division_user.assigned_district_id IS NOT NULL THEN
      RETURN QUERY
        SELECT s.id FROM schools s
        WHERE s.district_id = v_division_user.assigned_district_id
          AND s.deleted_at IS NULL;
      RETURN;
    END IF;
  END IF;

  RETURN QUERY
    SELECT s.id FROM schools s
    WHERE s.division_id = v_division_user.division_id
      AND s.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================================================
-- 4d. check_division_user_permission
-- ===========================================================================
CREATE OR REPLACE FUNCTION check_division_user_permission(
  p_firebase_uid VARCHAR,
  p_module VARCHAR,
  p_action VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  v_permissions JSONB;
  v_module_permissions JSONB;
BEGIN
  SELECT permissions INTO v_permissions
  FROM division_users
  WHERE firebase_uid = p_firebase_uid
    AND is_active = true
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_permissions IS NULL THEN
    RETURN FALSE;
  END IF;

  v_module_permissions := v_permissions -> p_module;
  IF v_module_permissions IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN v_module_permissions ? p_action;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================================================
-- 4e. log_login_attempt
-- ===========================================================================
CREATE OR REPLACE FUNCTION log_login_attempt(
    p_email VARCHAR(255),
    p_firebase_uid VARCHAR(128) DEFAULT NULL,
    p_user_type VARCHAR(20) DEFAULT NULL,
    p_school_id UUID DEFAULT NULL,
    p_login_status login_status DEFAULT 'success',
    p_login_type VARCHAR(20) DEFAULT 'staff',
    p_login_method login_method DEFAULT 'email_password',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_error_code VARCHAR(50) DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO login_audit (
        email, firebase_uid, user_type, school_id,
        login_status, login_type, login_method,
        ip_address, user_agent, error_code, error_message
    ) VALUES (
        LOWER(p_email), p_firebase_uid, p_user_type, p_school_id,
        p_login_status, p_login_type, p_login_method,
        p_ip_address, p_user_agent, p_error_code, p_error_message
    ) RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- 4f. check_rate_limit
-- ===========================================================================
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_email VARCHAR(255),
    p_ip_address INET DEFAULT NULL,
    p_max_attempts INTEGER DEFAULT 5,
    p_window_minutes INTEGER DEFAULT 15,
    p_block_minutes INTEGER DEFAULT 30
) RETURNS TABLE (
    is_blocked BOOLEAN,
    block_reason VARCHAR(100),
    blocked_until TIMESTAMPTZ,
    recent_attempts INTEGER
) AS $$
DECLARE
    v_recent_attempts INTEGER;
    v_blocked_until TIMESTAMPTZ;
    v_block_reason VARCHAR(100);
BEGIN
    SELECT rlb.blocked_until, rlb.reason
    INTO v_blocked_until, v_block_reason
    FROM rate_limit_blocks rlb
    WHERE (
        (rlb.block_type = 'email' AND rlb.block_value = LOWER(p_email))
        OR (rlb.block_type = 'ip' AND rlb.block_value = p_ip_address::TEXT)
    )
    AND rlb.blocked_until > NOW()
    LIMIT 1;

    IF v_blocked_until IS NOT NULL THEN
        RETURN QUERY SELECT TRUE, v_block_reason, v_blocked_until, 0;
        RETURN;
    END IF;

    SELECT COUNT(*)
    INTO v_recent_attempts
    FROM login_audit la
    WHERE la.email = LOWER(p_email)
    AND la.login_status = 'failed'
    AND la.created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;

    IF v_recent_attempts >= p_max_attempts THEN
        INSERT INTO rate_limit_blocks (block_type, block_value, reason, attempt_count, blocked_until)
        VALUES ('email', LOWER(p_email), 'Too many failed login attempts', v_recent_attempts, NOW() + (p_block_minutes || ' minutes')::INTERVAL)
        ON CONFLICT (block_type, block_value)
        DO UPDATE SET
            attempt_count = EXCLUDED.attempt_count,
            blocked_until = EXCLUDED.blocked_until,
            blocked_at = NOW();

        RETURN QUERY SELECT TRUE, 'Too many failed login attempts'::VARCHAR(100), NOW() + (p_block_minutes || ' minutes')::INTERVAL, v_recent_attempts;
        RETURN;
    END IF;

    RETURN QUERY SELECT FALSE, NULL::VARCHAR(100), NULL::TIMESTAMPTZ, v_recent_attempts;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- 4g. cleanup_old_login_audit
-- ===========================================================================
CREATE OR REPLACE FUNCTION cleanup_old_login_audit(p_retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM login_audit
    WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    DELETE FROM rate_limit_blocks
    WHERE blocked_until < NOW() - INTERVAL '1 day';

    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- 4h. update_updated_at_column (generic timestamp trigger)
-- ===========================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- 4i. update_facilities_updated_at
-- ===========================================================================
CREATE OR REPLACE FUNCTION update_facilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- 4j. update_elln_assessments_updated_at
-- ===========================================================================
CREATE OR REPLACE FUNCTION update_elln_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- 4k. update_textbook_distributions_updated_at
-- ===========================================================================
CREATE OR REPLACE FUNCTION update_textbook_distributions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- 4l. get_ecr_weights
-- ===========================================================================
CREATE OR REPLACE FUNCTION get_ecr_weights(
    p_school_id UUID,
    p_learning_area_id UUID,
    p_grade_level INTEGER
)
RETURNS TABLE (
    ww_weight NUMERIC,
    pt_weight NUMERIC,
    qa_weight NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT ew.ww_weight, ew.pt_weight, ew.qa_weight
    FROM ecr_weights ew
    WHERE ew.school_id = p_school_id
      AND (ew.learning_area_id = p_learning_area_id OR ew.learning_area_id IS NULL)
      AND (ew.grade_level_min IS NULL OR ew.grade_level_min <= p_grade_level)
      AND (ew.grade_level_max IS NULL OR ew.grade_level_max >= p_grade_level)
    ORDER BY
        CASE WHEN ew.learning_area_id IS NOT NULL THEN 0 ELSE 1 END,
        CASE WHEN ew.grade_level_min IS NOT NULL THEN 0 ELSE 1 END
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN QUERY SELECT 30.00::NUMERIC, 50.00::NUMERIC, 20.00::NUMERIC;
    END IF;
END;
$$;

-- ===========================================================================
-- 4m. transmute_grade (DepEd grading transmutation)
-- ===========================================================================
CREATE OR REPLACE FUNCTION transmute_grade(
    p_percentage NUMERIC,
    p_grade_level INTEGER DEFAULT 7
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    v_transmuted NUMERIC;
BEGIN
    IF p_percentage IS NULL OR p_percentage < 0 THEN
        RETURN 60;
    END IF;

    IF p_percentage > 100 THEN
        RETURN 100;
    END IF;

    IF p_percentage >= 100 THEN
        v_transmuted := 100;
    ELSIF p_percentage >= 0 THEN
        v_transmuted := 60 + (p_percentage * 0.4);
    ELSE
        v_transmuted := 60;
    END IF;

    RETURN ROUND(v_transmuted, 2);
END;
$$;

-- ===========================================================================
-- 4n. compute_ecr_grades
-- ===========================================================================
CREATE OR REPLACE FUNCTION compute_ecr_grades(
    p_student_id UUID,
    p_section_id UUID,
    p_learning_area_id UUID,
    p_school_year VARCHAR,
    p_quarter VARCHAR
)
RETURNS TABLE (
    ww_weighted NUMERIC,
    pt_weighted NUMERIC,
    qa_weighted NUMERIC,
    quarterly_grade NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_school_id UUID;
    v_grade_level INTEGER;
    v_ww_weight NUMERIC;
    v_pt_weight NUMERIC;
    v_qa_weight NUMERIC;
    v_ww_total NUMERIC := 0;
    v_ww_max NUMERIC := 0;
    v_pt_total NUMERIC := 0;
    v_pt_max NUMERIC := 0;
    v_qa_total NUMERIC := 0;
    v_qa_max NUMERIC := 0;
    v_ww_pct NUMERIC;
    v_pt_pct NUMERIC;
    v_qa_pct NUMERIC;
    v_ww_trans NUMERIC;
    v_pt_trans NUMERIC;
    v_qa_trans NUMERIC;
    v_ww_wtd NUMERIC;
    v_pt_wtd NUMERIC;
    v_qa_wtd NUMERIC;
    v_final NUMERIC;
BEGIN
    SELECT sec.school_id, sec.grade_level
    INTO v_school_id, v_grade_level
    FROM sections sec
    WHERE sec.id = p_section_id;

    SELECT ew.ww_weight, ew.pt_weight, ew.qa_weight
    INTO v_ww_weight, v_pt_weight, v_qa_weight
    FROM get_ecr_weights(v_school_id, p_learning_area_id, v_grade_level) ew;

    SELECT COALESCE(SUM(s.raw_score), 0), COALESCE(SUM(a.max_score), 0)
    INTO v_ww_total, v_ww_max
    FROM ecr_activities a
    JOIN ecr_scores s ON s.activity_id = a.id AND s.student_id = p_student_id
    WHERE a.section_id = p_section_id
      AND a.learning_area_id = p_learning_area_id
      AND a.school_year = p_school_year
      AND a.quarter = p_quarter
      AND a.activity_type = 'WW'
      AND a.deleted_at IS NULL
      AND s.status = 'graded';

    SELECT COALESCE(SUM(s.raw_score), 0), COALESCE(SUM(a.max_score), 0)
    INTO v_pt_total, v_pt_max
    FROM ecr_activities a
    JOIN ecr_scores s ON s.activity_id = a.id AND s.student_id = p_student_id
    WHERE a.section_id = p_section_id
      AND a.learning_area_id = p_learning_area_id
      AND a.school_year = p_school_year
      AND a.quarter = p_quarter
      AND a.activity_type = 'PT'
      AND a.deleted_at IS NULL
      AND s.status = 'graded';

    SELECT COALESCE(SUM(s.raw_score), 0), COALESCE(SUM(a.max_score), 0)
    INTO v_qa_total, v_qa_max
    FROM ecr_activities a
    JOIN ecr_scores s ON s.activity_id = a.id AND s.student_id = p_student_id
    WHERE a.section_id = p_section_id
      AND a.learning_area_id = p_learning_area_id
      AND a.school_year = p_school_year
      AND a.quarter = p_quarter
      AND a.activity_type = 'QA'
      AND a.deleted_at IS NULL
      AND s.status = 'graded';

    v_ww_pct := CASE WHEN v_ww_max > 0 THEN (v_ww_total / v_ww_max) * 100 ELSE 0 END;
    v_pt_pct := CASE WHEN v_pt_max > 0 THEN (v_pt_total / v_pt_max) * 100 ELSE 0 END;
    v_qa_pct := CASE WHEN v_qa_max > 0 THEN (v_qa_total / v_qa_max) * 100 ELSE 0 END;

    v_ww_trans := transmute_grade(v_ww_pct, v_grade_level);
    v_pt_trans := transmute_grade(v_pt_pct, v_grade_level);
    v_qa_trans := transmute_grade(v_qa_pct, v_grade_level);

    v_ww_wtd := ROUND((v_ww_trans * v_ww_weight / 100), 2);
    v_pt_wtd := ROUND((v_pt_trans * v_pt_weight / 100), 2);
    v_qa_wtd := ROUND((v_qa_trans * v_qa_weight / 100), 2);

    v_final := ROUND(v_ww_wtd + v_pt_wtd + v_qa_wtd, 0);

    INSERT INTO ecr_component_grades (
        school_id, student_id, section_id, learning_area_id, school_year, quarter,
        ww_total_score, ww_max_score, ww_percentage, ww_transmuted,
        pt_total_score, pt_max_score, pt_percentage, pt_transmuted,
        qa_total_score, qa_max_score, qa_percentage, qa_transmuted,
        ww_weighted, pt_weighted, qa_weighted, quarterly_grade,
        last_computed_at, updated_at
    )
    VALUES (
        v_school_id, p_student_id, p_section_id, p_learning_area_id, p_school_year, p_quarter,
        v_ww_total, v_ww_max, v_ww_pct, v_ww_trans,
        v_pt_total, v_pt_max, v_pt_pct, v_pt_trans,
        v_qa_total, v_qa_max, v_qa_pct, v_qa_trans,
        v_ww_wtd, v_pt_wtd, v_qa_wtd, v_final,
        NOW(), NOW()
    )
    ON CONFLICT (student_id, learning_area_id, school_year, quarter)
    DO UPDATE SET
        ww_total_score = EXCLUDED.ww_total_score,
        ww_max_score = EXCLUDED.ww_max_score,
        ww_percentage = EXCLUDED.ww_percentage,
        ww_transmuted = EXCLUDED.ww_transmuted,
        pt_total_score = EXCLUDED.pt_total_score,
        pt_max_score = EXCLUDED.pt_max_score,
        pt_percentage = EXCLUDED.pt_percentage,
        pt_transmuted = EXCLUDED.pt_transmuted,
        qa_total_score = EXCLUDED.qa_total_score,
        qa_max_score = EXCLUDED.qa_max_score,
        qa_percentage = EXCLUDED.qa_percentage,
        qa_transmuted = EXCLUDED.qa_transmuted,
        ww_weighted = EXCLUDED.ww_weighted,
        pt_weighted = EXCLUDED.pt_weighted,
        qa_weighted = EXCLUDED.qa_weighted,
        quarterly_grade = EXCLUDED.quarterly_grade,
        last_computed_at = NOW(),
        updated_at = NOW();

    RETURN QUERY SELECT v_ww_wtd, v_pt_wtd, v_qa_wtd, v_final;
END;
$$;

-- ===========================================================================
-- 4o. sync_ecr_to_grades (fixed version with school-specific LA mapping)
-- ===========================================================================
CREATE OR REPLACE FUNCTION sync_ecr_to_grades(
    p_student_id UUID,
    p_learning_area_id UUID,
    p_school_year VARCHAR,
    p_quarter VARCHAR
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_quarterly_grade NUMERIC;
    v_school_id UUID;
    v_correct_learning_area_id UUID;
    v_la_code VARCHAR;
BEGIN
    SELECT quarterly_grade, school_id
    INTO v_quarterly_grade, v_school_id
    FROM ecr_component_grades
    WHERE student_id = p_student_id
      AND learning_area_id = p_learning_area_id
      AND school_year = p_school_year
      AND quarter = p_quarter;

    IF v_quarterly_grade IS NOT NULL AND v_quarterly_grade > 0 AND v_school_id IS NOT NULL THEN
        SELECT id INTO v_correct_learning_area_id
        FROM learning_areas
        WHERE id = p_learning_area_id
          AND school_id = v_school_id
          AND deleted_at IS NULL;

        IF v_correct_learning_area_id IS NULL THEN
            SELECT code INTO v_la_code
            FROM learning_areas
            WHERE id = p_learning_area_id;

            IF v_la_code IS NOT NULL THEN
                SELECT id INTO v_correct_learning_area_id
                FROM learning_areas
                WHERE code = v_la_code
                  AND school_id = v_school_id
                  AND deleted_at IS NULL
                LIMIT 1;
            END IF;
        END IF;

        IF v_correct_learning_area_id IS NULL THEN
            v_correct_learning_area_id := p_learning_area_id;
        END IF;

        INSERT INTO grades (school_id, student_id, learning_area_id, school_year)
        VALUES (v_school_id, p_student_id, v_correct_learning_area_id, p_school_year)
        ON CONFLICT (student_id, learning_area_id, school_year)
        DO NOTHING;

        EXECUTE format(
            'UPDATE grades SET %I = $1, updated_at = NOW()
             WHERE student_id = $2 AND learning_area_id = $3 AND school_year = $4',
            LOWER(p_quarter)
        ) USING v_quarterly_grade, p_student_id, v_correct_learning_area_id, p_school_year;
    END IF;
END;
$$;

-- ===========================================================================
-- 4p. trigger_compute_ecr_on_score_change
-- ===========================================================================
CREATE OR REPLACE FUNCTION trigger_compute_ecr_on_score_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_activity RECORD;
BEGIN
    SELECT a.*, s.id as student_id
    INTO v_activity
    FROM ecr_activities a
    CROSS JOIN (SELECT COALESCE(NEW.student_id, OLD.student_id) as id) s
    WHERE a.id = COALESCE(NEW.activity_id, OLD.activity_id);

    IF v_activity IS NOT NULL THEN
        PERFORM compute_ecr_grades(
            COALESCE(NEW.student_id, OLD.student_id),
            v_activity.section_id,
            v_activity.learning_area_id,
            v_activity.school_year,
            v_activity.quarter
        );

        PERFORM sync_ecr_to_grades(
            COALESCE(NEW.student_id, OLD.student_id),
            v_activity.learning_area_id,
            v_activity.school_year,
            v_activity.quarter
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ===========================================================================
-- 4q. auto_assign_ecr_weights (trigger function for new learning areas)
-- ===========================================================================
CREATE OR REPLACE FUNCTION auto_assign_ecr_weights()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_ww NUMERIC := 30.00;
    v_pt NUMERIC := 50.00;
    v_qa NUMERIC := 20.00;
BEGIN
    IF NEW.subject_group IN ('tle_specialized', 'tvl_shs') THEN
        v_ww := 30.00;
        v_pt := 70.00;
        v_qa := 0.00;
    ELSIF NEW.subject_group IN ('mapeh', 'epp_tle_exploratory') THEN
        v_ww := 20.00;
        v_pt := 60.00;
        v_qa := 20.00;
    ELSE
        v_ww := 30.00;
        v_pt := 50.00;
        v_qa := 20.00;
    END IF;

    IF NEW.school_id IS NOT NULL THEN
        INSERT INTO ecr_weights (school_id, learning_area_id, ww_weight, pt_weight, qa_weight)
        VALUES (NEW.school_id, NEW.id, v_ww, v_pt, v_qa)
        ON CONFLICT (school_id, learning_area_id, grade_level_min, grade_level_max)
        DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

-- ===========================================================================
-- 4r. seed_default_learning_areas (auto-seed on school creation)
-- ===========================================================================
CREATE OR REPLACE FUNCTION seed_default_learning_areas()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM learning_areas WHERE school_id = NEW.id LIMIT 1) THEN
    RETURN NEW;
  END IF;

  IF NEW.school_type IS NULL
     OR NEW.school_type IN ('elementary', 'integrated') THEN
    INSERT INTO learning_areas (school_id, code, name, grade_levels, category, display_order, is_active, is_composite, components)
    VALUES
      (NEW.id, 'MTB',   'Mother Tongue',                 ARRAY[1,2,3],         'core', 1,  true, false, NULL),
      (NEW.id, 'FIL',   'Filipino',                      ARRAY[1,2,3,4,5,6],   'core', 2,  true, false, NULL),
      (NEW.id, 'ENG',   'English',                       ARRAY[1,2,3,4,5,6],   'core', 3,  true, false, NULL),
      (NEW.id, 'MATH',  'Mathematics',                   ARRAY[1,2,3,4,5,6],   'core', 4,  true, false, NULL),
      (NEW.id, 'SCI',   'Science',                       ARRAY[3,4,5,6],       'core', 5,  true, false, NULL),
      (NEW.id, 'AP',    'Araling Panlipunan',            ARRAY[1,2,3,4,5,6],   'core', 6,  true, false, NULL),
      (NEW.id, 'ESP',   'Edukasyon sa Pagpapakatao',     ARRAY[1,2,3,4,5,6],   'core', 7,  true, false, NULL),
      (NEW.id, 'EPP',   'EPP/TLE',                       ARRAY[4,5,6],         'tle',  8,  true, false, NULL),
      (NEW.id, 'MAPEH', 'MAPEH',                         ARRAY[1,2,3,4,5,6],   'core', 9,  true, true,  ARRAY['Music','Arts','Physical Education','Health']);
  END IF;

  IF NEW.school_type IN ('high_school', 'senior_high', 'integrated') THEN
    INSERT INTO learning_areas (school_id, code, name, grade_levels, category, display_order, is_active, is_composite, components)
    VALUES
      (NEW.id, CASE WHEN NEW.school_type = 'integrated' THEN 'FIL-SEC'   ELSE 'FIL'   END, 'Filipino',                              ARRAY[7,8,9,10], 'core', 10, true, false, NULL),
      (NEW.id, CASE WHEN NEW.school_type = 'integrated' THEN 'ENG-SEC'   ELSE 'ENG'   END, 'English',                               ARRAY[7,8,9,10], 'core', 11, true, false, NULL),
      (NEW.id, CASE WHEN NEW.school_type = 'integrated' THEN 'MATH-SEC'  ELSE 'MATH'  END, 'Mathematics',                           ARRAY[7,8,9,10], 'core', 12, true, false, NULL),
      (NEW.id, CASE WHEN NEW.school_type = 'integrated' THEN 'SCI-SEC'   ELSE 'SCI'   END, 'Science',                               ARRAY[7,8,9,10], 'core', 13, true, false, NULL),
      (NEW.id, CASE WHEN NEW.school_type = 'integrated' THEN 'AP-SEC'    ELSE 'AP'    END, 'Araling Panlipunan',                     ARRAY[7,8,9,10], 'core', 14, true, false, NULL),
      (NEW.id, CASE WHEN NEW.school_type = 'integrated' THEN 'ESP-SEC'   ELSE 'ESP'   END, 'Edukasyon sa Pagpapakatao',              ARRAY[7,8,9,10], 'core', 15, true, false, NULL),
      (NEW.id, 'TLE',                                                                      'Technology and Livelihood Education',    ARRAY[7,8,9,10], 'tle',  16, true, false, NULL),
      (NEW.id, CASE WHEN NEW.school_type = 'integrated' THEN 'MAPEH-SEC' ELSE 'MAPEH' END, 'MAPEH',                                 ARRAY[7,8,9,10], 'core', 17, true, true,  ARRAY['Music','Arts','Physical Education','Health']);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- 4s. Division RPC Functions
-- ===========================================================================

-- get_division_dashboard_stats
CREATE OR REPLACE FUNCTION get_division_dashboard_stats(
  p_division_id UUID,
  p_school_ids UUID[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH filtered_schools AS (
    SELECT id, name, district
    FROM schools
    WHERE division_id = p_division_id
      AND deleted_at IS NULL
      AND (p_school_ids IS NULL OR id = ANY(p_school_ids))
  ),
  student_stats AS (
    SELECT
      COUNT(*) as total_students,
      COUNT(*) FILTER (WHERE gender = 'Male') as male_count,
      COUNT(*) FILTER (WHERE gender = 'Female') as female_count,
      COUNT(*) FILTER (WHERE enrollment_status = 'enrolled') as enrolled_count
    FROM students
    WHERE school_id IN (SELECT id FROM filtered_schools)
      AND deleted_at IS NULL
  ),
  teacher_stats AS (
    SELECT
      COUNT(*) as total_teachers,
      COUNT(*) FILTER (WHERE employment_status = 'permanent') as permanent_count,
      COUNT(*) FILTER (WHERE employment_status = 'temporary') as temporary_count
    FROM teachers
    WHERE school_id IN (SELECT id FROM filtered_schools)
      AND deleted_at IS NULL
  ),
  school_summaries AS (
    SELECT
      fs.id as school_id,
      fs.name as school_name,
      fs.district,
      COALESCE((SELECT COUNT(*) FROM students WHERE school_id = fs.id AND deleted_at IS NULL AND enrollment_status = 'enrolled'), 0) as student_count,
      COALESCE((SELECT COUNT(*) FROM teachers WHERE school_id = fs.id AND deleted_at IS NULL), 0) as teacher_count
    FROM filtered_schools fs
  )
  SELECT json_build_object(
    'total_schools', (SELECT COUNT(*) FROM filtered_schools),
    'total_students', COALESCE((SELECT total_students FROM student_stats), 0),
    'total_male', COALESCE((SELECT male_count FROM student_stats), 0),
    'total_female', COALESCE((SELECT female_count FROM student_stats), 0),
    'enrolled_count', COALESCE((SELECT enrolled_count FROM student_stats), 0),
    'total_teachers', COALESCE((SELECT total_teachers FROM teacher_stats), 0),
    'permanent_teachers', COALESCE((SELECT permanent_count FROM teacher_stats), 0),
    'temporary_teachers', COALESCE((SELECT temporary_count FROM teacher_stats), 0),
    'total_districts', (SELECT COUNT(DISTINCT district) FROM filtered_schools WHERE district IS NOT NULL),
    'schools', (SELECT json_agg(json_build_object(
      'school_id', school_id, 'school_name', school_name, 'district', district,
      'student_count', student_count, 'teacher_count', teacher_count
    ) ORDER BY school_name) FROM school_summaries)
  ) INTO result;

  RETURN result;
END;
$$;

-- get_division_schools_stats
CREATE OR REPLACE FUNCTION get_division_schools_stats(
  p_division_id UUID,
  p_school_ids UUID[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH filtered_schools AS (
    SELECT id, name, school_id_number, district, address, principal_name
    FROM schools
    WHERE division_id = p_division_id
      AND deleted_at IS NULL
      AND (p_school_ids IS NULL OR id = ANY(p_school_ids))
  ),
  student_counts AS (
    SELECT school_id, COUNT(*) as student_count
    FROM students
    WHERE school_id IN (SELECT id FROM filtered_schools)
      AND deleted_at IS NULL AND enrollment_status = 'enrolled'
    GROUP BY school_id
  ),
  teacher_counts AS (
    SELECT school_id, COUNT(*) as teacher_count
    FROM teachers
    WHERE school_id IN (SELECT id FROM filtered_schools)
      AND deleted_at IS NULL
    GROUP BY school_id
  ),
  school_stats AS (
    SELECT fs.id as school_id, fs.name, fs.school_id_number, fs.district, fs.address, fs.principal_name,
      COALESCE(sc.student_count, 0) as student_count,
      COALESCE(tc.teacher_count, 0) as teacher_count
    FROM filtered_schools fs
    LEFT JOIN student_counts sc ON fs.id = sc.school_id
    LEFT JOIN teacher_counts tc ON fs.id = tc.school_id
  )
  SELECT json_build_object(
    'total_schools', (SELECT COUNT(*) FROM filtered_schools),
    'total_students', (SELECT COALESCE(SUM(student_count), 0) FROM student_counts),
    'total_teachers', (SELECT COALESCE(SUM(teacher_count), 0) FROM teacher_counts),
    'total_districts', (SELECT COUNT(DISTINCT district) FROM filtered_schools WHERE district IS NOT NULL),
    'schools', (SELECT json_agg(json_build_object(
      'school_id', school_id, 'name', name, 'school_id_number', school_id_number,
      'district', district, 'address', address, 'principal_name', principal_name,
      'student_count', student_count, 'teacher_count', teacher_count
    ) ORDER BY name) FROM school_stats)
  ) INTO result;

  RETURN result;
END;
$$;

-- get_division_personnel_counts
CREATE OR REPLACE FUNCTION get_division_personnel_counts(
  p_division_id UUID,
  p_school_ids UUID[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH filtered_schools AS (
    SELECT id FROM schools
    WHERE division_id = p_division_id AND deleted_at IS NULL
      AND (p_school_ids IS NULL OR id = ANY(p_school_ids))
  )
  SELECT json_build_object(
    'total', (SELECT COUNT(*) FROM teachers WHERE school_id IN (SELECT id FROM filtered_schools) AND deleted_at IS NULL),
    'permanent', (SELECT COUNT(*) FROM teachers WHERE school_id IN (SELECT id FROM filtered_schools) AND deleted_at IS NULL AND employment_status = 'permanent'),
    'temporary', (SELECT COUNT(*) FROM teachers WHERE school_id IN (SELECT id FROM filtered_schools) AND deleted_at IS NULL AND employment_status = 'temporary'),
    'school_count', (SELECT COUNT(*) FROM filtered_schools)
  ) INTO result;

  RETURN result;
END;
$$;

-- get_division_enrollment_counts
CREATE OR REPLACE FUNCTION get_division_enrollment_counts(
  p_division_id UUID,
  p_school_ids UUID[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH filtered_schools AS (
    SELECT id FROM schools
    WHERE division_id = p_division_id AND deleted_at IS NULL
      AND (p_school_ids IS NULL OR id = ANY(p_school_ids))
  )
  SELECT json_build_object(
    'total', (SELECT COUNT(*) FROM students WHERE school_id IN (SELECT id FROM filtered_schools) AND deleted_at IS NULL),
    'male', (SELECT COUNT(*) FROM students WHERE school_id IN (SELECT id FROM filtered_schools) AND deleted_at IS NULL AND gender = 'Male'),
    'female', (SELECT COUNT(*) FROM students WHERE school_id IN (SELECT id FROM filtered_schools) AND deleted_at IS NULL AND gender = 'Female'),
    'enrolled', (SELECT COUNT(*) FROM students WHERE school_id IN (SELECT id FROM filtered_schools) AND deleted_at IS NULL AND enrollment_status = 'enrolled'),
    'school_count', (SELECT COUNT(*) FROM filtered_schools)
  ) INTO result;

  RETURN result;
END;
$$;

-- get_division_personnel_summary
CREATE OR REPLACE FUNCTION get_division_personnel_summary(
  p_division_id UUID,
  p_school_ids UUID[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH filtered_schools AS (
    SELECT id, name, district
    FROM schools
    WHERE division_id = p_division_id AND deleted_at IS NULL
      AND (p_school_ids IS NULL OR id = ANY(p_school_ids))
  ),
  personnel_data AS (
    SELECT t.school_id, fs.name as school_name, fs.district,
      COALESCE(t.position, 'other') as position,
      COALESCE(t.employment_status, 'permanent') as employment_status
    FROM teachers t
    JOIN filtered_schools fs ON t.school_id = fs.id
    WHERE t.deleted_at IS NULL
  ),
  position_counts AS (
    SELECT position, COUNT(*) as count FROM personnel_data GROUP BY position
  ),
  status_counts AS (
    SELECT employment_status as status, COUNT(*) as count FROM personnel_data GROUP BY employment_status
  ),
  district_counts AS (
    SELECT COALESCE(district, 'Unassigned') as district,
      COUNT(DISTINCT school_id) as schools, COUNT(*) as personnel
    FROM personnel_data
    GROUP BY COALESCE(district, 'Unassigned')
  ),
  school_summaries AS (
    SELECT school_id, school_name, district, COUNT(*) as total_personnel,
      json_object_agg(position, pos_count) as by_position,
      json_object_agg(status, stat_count) as by_status
    FROM (
      SELECT pd.school_id, pd.school_name, pd.district, pd.position, pd.employment_status as status,
        COUNT(*) FILTER (WHERE TRUE) OVER (PARTITION BY pd.school_id, pd.position) as pos_count,
        COUNT(*) FILTER (WHERE TRUE) OVER (PARTITION BY pd.school_id, pd.employment_status) as stat_count
      FROM personnel_data pd
    ) sub
    GROUP BY school_id, school_name, district
  )
  SELECT json_build_object(
    'total_schools', (SELECT COUNT(*) FROM filtered_schools),
    'total_personnel', (SELECT COUNT(*) FROM personnel_data),
    'by_position', (SELECT json_object_agg(position, count) FROM position_counts),
    'by_status', (SELECT json_object_agg(status, count) FROM status_counts),
    'by_district', (SELECT json_object_agg(district, json_build_object('schools', schools, 'personnel', personnel)) FROM district_counts),
    'schools', (SELECT json_agg(json_build_object(
      'school_id', school_id, 'school_name', school_name, 'district', district,
      'total_personnel', total_personnel, 'by_position', by_position, 'by_status', by_status
    ) ORDER BY school_name) FROM school_summaries)
  ) INTO result;

  RETURN result;
END;
$$;

-- get_division_enrollment_summary
CREATE OR REPLACE FUNCTION get_division_enrollment_summary(
  p_division_id UUID,
  p_school_ids UUID[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH school_list AS MATERIALIZED (
    SELECT id, name, district
    FROM schools
    WHERE division_id = p_division_id AND deleted_at IS NULL
      AND (p_school_ids IS NULL OR id = ANY(p_school_ids))
  ),
  student_stats AS MATERIALIZED (
    SELECT s.school_id, s.grade_level,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE s.gender = 'Male') as male,
      COUNT(*) FILTER (WHERE s.gender = 'Female') as female
    FROM students s
    WHERE s.school_id IN (SELECT id FROM school_list)
      AND s.deleted_at IS NULL AND s.enrollment_status = 'enrolled'
    GROUP BY s.school_id, s.grade_level
  ),
  aggregates AS MATERIALIZED (
    SELECT COALESCE(SUM(total), 0)::int as total_students,
      COALESCE(SUM(male), 0)::int as total_male,
      COALESCE(SUM(female), 0)::int as total_female
    FROM student_stats
  ),
  by_grade AS (
    SELECT grade_level, SUM(total)::int as total, SUM(male)::int as male, SUM(female)::int as female
    FROM student_stats GROUP BY grade_level
  ),
  by_district AS (
    SELECT COALESCE(sl.district, 'Unassigned') as district,
      COUNT(DISTINCT sl.id)::int as schools,
      COALESCE(SUM(ss.total), 0)::int as students,
      COALESCE(SUM(ss.male), 0)::int as male,
      COALESCE(SUM(ss.female), 0)::int as female
    FROM school_list sl
    LEFT JOIN student_stats ss ON sl.id = ss.school_id
    GROUP BY COALESCE(sl.district, 'Unassigned')
  ),
  by_school AS (
    SELECT sl.id as school_id, sl.name as school_name, sl.district,
      COALESCE(SUM(ss.total), 0)::int as total_students,
      COALESCE(SUM(ss.male), 0)::int as male_count,
      COALESCE(SUM(ss.female), 0)::int as female_count,
      COALESCE(jsonb_object_agg(ss.grade_level::text,
        jsonb_build_object('total', ss.total, 'male', ss.male, 'female', ss.female)
      ) FILTER (WHERE ss.grade_level IS NOT NULL), '{}'::jsonb) as by_grade
    FROM school_list sl
    LEFT JOIN student_stats ss ON sl.id = ss.school_id
    GROUP BY sl.id, sl.name, sl.district
  )
  SELECT json_build_object(
    'total_schools', (SELECT COUNT(*) FROM school_list),
    'total_students', (SELECT total_students FROM aggregates),
    'total_male', (SELECT total_male FROM aggregates),
    'total_female', (SELECT total_female FROM aggregates),
    'by_grade', COALESCE((SELECT json_object_agg(grade_level, json_build_object('total', total, 'male', male, 'female', female)) FROM by_grade), '{}'),
    'by_district', COALESCE((SELECT json_object_agg(district, json_build_object('schools', schools, 'students', students, 'male', male, 'female', female)) FROM by_district), '{}'),
    'schools', COALESCE((SELECT json_agg(json_build_object(
      'school_id', school_id, 'school_name', school_name, 'district', district,
      'total_students', total_students, 'male_count', male_count, 'female_count', female_count, 'by_grade', by_grade
    )) FROM by_school), '[]')
  ) INTO result;

  RETURN result;
END;
$$;

-- get_division_promotion_summary
CREATE OR REPLACE FUNCTION get_division_promotion_summary(
  p_division_id UUID,
  p_school_year TEXT DEFAULT NULL,
  p_grading_period TEXT DEFAULT 'final',
  p_school_ids UUID[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH school_list AS (
    SELECT id, name, district
    FROM schools
    WHERE division_id = p_division_id AND deleted_at IS NULL
      AND (p_school_ids IS NULL OR id = ANY(p_school_ids))
  ),
  promotion_stats AS (
    SELECT pr.school_id, pr.current_grade_level,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE pr.promotion_status = 'promoted') as promoted,
      COUNT(*) FILTER (WHERE pr.promotion_status = 'retained') as retained,
      COUNT(*) FILTER (WHERE pr.promotion_status = 'conditionally_promoted') as conditionally_promoted
    FROM promotion_records pr
    JOIN school_list sl ON pr.school_id = sl.id
    WHERE (p_school_year IS NULL OR pr.school_year = p_school_year)
      AND (p_grading_period IS NULL OR pr.grading_period = p_grading_period)
    GROUP BY pr.school_id, pr.current_grade_level
  ),
  by_grade AS (
    SELECT current_grade_level, SUM(total)::int as total, SUM(promoted)::int as promoted,
      SUM(retained)::int as retained, SUM(conditionally_promoted)::int as conditionally_promoted,
      CASE WHEN SUM(total) > 0 THEN ROUND(100.0 * SUM(promoted) / SUM(total), 1) ELSE 0 END as promotion_rate
    FROM promotion_stats GROUP BY current_grade_level
  ),
  by_district AS (
    SELECT COALESCE(sl.district, 'Unassigned') as district,
      COUNT(DISTINCT sl.id)::int as schools,
      COALESCE(SUM(ps.total), 0)::int as students,
      COALESCE(SUM(ps.promoted), 0)::int as promoted,
      CASE WHEN COALESCE(SUM(ps.total), 0) > 0
        THEN ROUND(100.0 * COALESCE(SUM(ps.promoted), 0) / COALESCE(SUM(ps.total), 1), 1) ELSE 0 END as promotion_rate
    FROM school_list sl
    LEFT JOIN promotion_stats ps ON sl.id = ps.school_id
    GROUP BY COALESCE(sl.district, 'Unassigned')
  ),
  by_school AS (
    SELECT sl.id as school_id, sl.name as school_name, sl.district,
      COALESCE(SUM(ps.total), 0)::int as total_students,
      COALESCE(SUM(ps.promoted), 0)::int as promoted,
      COALESCE(SUM(ps.retained), 0)::int as retained,
      COALESCE(SUM(ps.conditionally_promoted), 0)::int as conditionally_promoted,
      CASE WHEN COALESCE(SUM(ps.total), 0) > 0
        THEN ROUND(100.0 * COALESCE(SUM(ps.promoted), 0) / COALESCE(SUM(ps.total), 1), 1) ELSE 0 END as promotion_rate,
      jsonb_object_agg(
        COALESCE(ps.current_grade_level::text, '0'),
        jsonb_build_object('total', ps.total, 'promoted', ps.promoted, 'retained', ps.retained,
          'conditionally_promoted', ps.conditionally_promoted,
          'promotion_rate', CASE WHEN ps.total > 0 THEN ROUND(100.0 * ps.promoted / ps.total, 1) ELSE 0 END)
      ) FILTER (WHERE ps.current_grade_level IS NOT NULL) as by_grade
    FROM school_list sl
    LEFT JOIN promotion_stats ps ON sl.id = ps.school_id
    GROUP BY sl.id, sl.name, sl.district
  ),
  totals AS (
    SELECT COALESCE(SUM(total), 0)::int as total_students,
      COALESCE(SUM(promoted), 0)::int as total_promoted,
      COALESCE(SUM(retained), 0)::int as total_retained,
      COALESCE(SUM(conditionally_promoted), 0)::int as total_conditionally_promoted
    FROM promotion_stats
  )
  SELECT json_build_object(
    'total_schools', (SELECT COUNT(*) FROM school_list),
    'total_students', (SELECT total_students FROM totals),
    'total_promoted', (SELECT total_promoted FROM totals),
    'total_retained', (SELECT total_retained FROM totals),
    'total_conditionally_promoted', (SELECT total_conditionally_promoted FROM totals),
    'overall_promotion_rate', (SELECT CASE WHEN total_students > 0 THEN ROUND(100.0 * total_promoted / total_students, 1) ELSE 0 END FROM totals),
    'by_grade', (SELECT COALESCE(json_object_agg(current_grade_level, json_build_object(
      'total', total, 'promoted', promoted, 'retained', retained,
      'conditionally_promoted', conditionally_promoted, 'promotion_rate', promotion_rate
    )), '{}') FROM by_grade),
    'by_district', (SELECT COALESCE(json_object_agg(district, json_build_object(
      'schools', schools, 'students', students, 'promoted', promoted, 'promotion_rate', promotion_rate
    )), '{}') FROM by_district),
    'schools', (SELECT COALESCE(json_agg(json_build_object(
      'school_id', school_id, 'school_name', school_name, 'district', district,
      'total_students', total_students, 'promoted', promoted, 'retained', retained,
      'conditionally_promoted', conditionally_promoted, 'promotion_rate', promotion_rate,
      'by_grade', COALESCE(by_grade, '{}'::jsonb)
    )), '[]') FROM by_school)
  ) INTO result;

  RETURN result;
END;
$$;

-- get_division_proficiency_summary
CREATE OR REPLACE FUNCTION get_division_proficiency_summary(
  p_division_id UUID,
  p_quarter TEXT DEFAULT 'Q2',
  p_school_year TEXT DEFAULT NULL,
  p_school_ids UUID[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  quarter_column TEXT;
BEGIN
  quarter_column := CASE p_quarter
    WHEN 'Q1' THEN 'q1' WHEN 'Q2' THEN 'q2' WHEN 'Q3' THEN 'q3' WHEN 'Q4' THEN 'q4' ELSE 'q2'
  END;

  WITH school_list AS MATERIALIZED (
    SELECT id, name, district FROM schools
    WHERE division_id = p_division_id AND deleted_at IS NULL
      AND (p_school_ids IS NULL OR id = ANY(p_school_ids))
  ),
  enrolled_students AS MATERIALIZED (
    SELECT s.id as student_id, s.school_id, s.gender, sec.grade_level
    FROM students s
    JOIN sections sec ON s.section_id = sec.id
    WHERE s.school_id IN (SELECT id FROM school_list)
      AND s.deleted_at IS NULL AND s.enrollment_status = 'enrolled'
  ),
  learning_area_mapping AS MATERIALIZED (
    SELECT la.id as learning_area_id, la.school_id, la.name, la.code, la.grade_levels,
      CASE
        WHEN LOWER(la.name) LIKE '%filipino%' OR LOWER(la.code) LIKE '%fil%' THEN 'language'
        WHEN LOWER(la.name) LIKE '%mother tongue%' OR LOWER(la.code) LIKE '%mt%' OR LOWER(la.code) LIKE '%mtb%' THEN 'mother_tongue'
        WHEN LOWER(la.name) LIKE '%reading%' OR LOWER(la.name) LIKE '%literacy%' THEN 'reading_literacy'
        WHEN LOWER(la.name) LIKE '%english%' OR LOWER(la.code) LIKE '%eng%' THEN 'english'
        ELSE NULL
      END as subject_category
    FROM learning_areas la
    WHERE la.school_id IN (SELECT id FROM school_list) AND la.is_active = true
  ),
  grade_data AS MATERIALIZED (
    SELECT g.student_id, g.school_id, g.learning_area_id, es.grade_level, lam.subject_category,
      CASE p_quarter
        WHEN 'Q1' THEN COALESCE(g.q1, CASE WHEN g.composite_grades IS NOT NULL AND g.composite_grades->'q1' IS NOT NULL
          THEN (SELECT AVG(value::numeric) FROM jsonb_each_text(g.composite_grades->'q1')) ELSE NULL END)
        WHEN 'Q2' THEN COALESCE(g.q2, CASE WHEN g.composite_grades IS NOT NULL AND g.composite_grades->'q2' IS NOT NULL
          THEN (SELECT AVG(value::numeric) FROM jsonb_each_text(g.composite_grades->'q2')) ELSE NULL END)
        WHEN 'Q3' THEN COALESCE(g.q3, CASE WHEN g.composite_grades IS NOT NULL AND g.composite_grades->'q3' IS NOT NULL
          THEN (SELECT AVG(value::numeric) FROM jsonb_each_text(g.composite_grades->'q3')) ELSE NULL END)
        WHEN 'Q4' THEN COALESCE(g.q4, CASE WHEN g.composite_grades IS NOT NULL AND g.composite_grades->'q4' IS NOT NULL
          THEN (SELECT AVG(value::numeric) FROM jsonb_each_text(g.composite_grades->'q4')) ELSE NULL END)
      END as grade_value
    FROM grades g
    JOIN enrolled_students es ON g.student_id = es.student_id
    LEFT JOIN learning_area_mapping lam ON g.learning_area_id = lam.learning_area_id
    WHERE g.school_id IN (SELECT id FROM school_list)
  ),
  school_proficiency AS (
    SELECT gd.school_id, sl.name as school_name, sl.district, gd.grade_level, gd.subject_category,
      COUNT(DISTINCT gd.student_id) as total_students,
      AVG(gd.grade_value) as mean_percentage_score,
      COUNT(DISTINCT gd.student_id) FILTER (WHERE gd.grade_value >= 75) as students_75_above
    FROM grade_data gd
    JOIN school_list sl ON gd.school_id = sl.id
    WHERE gd.grade_value IS NOT NULL AND gd.grade_value > 0 AND gd.subject_category IS NOT NULL
    GROUP BY gd.school_id, sl.name, sl.district, gd.grade_level, gd.subject_category
  ),
  district_proficiency AS (
    SELECT COALESCE(district, 'Unassigned') as district_name, grade_level, subject_category,
      SUM(total_students)::int as total_students,
      CASE WHEN SUM(total_students) > 0 THEN SUM(mean_percentage_score * total_students) / SUM(total_students) ELSE 0 END as mean_percentage_score,
      SUM(students_75_above)::int as students_75_above
    FROM school_proficiency
    GROUP BY COALESCE(district, 'Unassigned'), grade_level, subject_category
  ),
  division_totals AS (
    SELECT SUM(total_students)::int as total_students,
      CASE WHEN SUM(total_students) > 0 THEN SUM(mean_percentage_score * total_students) / SUM(total_students) ELSE 0 END as overall_mps,
      CASE WHEN SUM(total_students) > 0 THEN (SUM(students_75_above)::float / SUM(total_students) * 100) ELSE 0 END as passing_rate
    FROM school_proficiency
  )
  SELECT json_build_object(
    'quarter', p_quarter,
    'school_year', COALESCE(p_school_year, to_char(CURRENT_DATE, 'YYYY') || '-' || to_char(CURRENT_DATE + interval '1 year', 'YYYY')),
    'summary', json_build_object(
      'total_schools', (SELECT COUNT(*) FROM school_list),
      'total_districts', (SELECT COUNT(DISTINCT COALESCE(district, 'Unassigned')) FROM school_list),
      'total_students_elementary', COALESCE((SELECT total_students FROM division_totals), 0),
      'overall_mps_elementary', COALESCE(ROUND((SELECT overall_mps FROM division_totals)::numeric, 2), 0),
      'overall_passing_rate', COALESCE(ROUND((SELECT passing_rate FROM division_totals)::numeric, 2), 0)
    ),
    'schools', COALESCE((SELECT json_agg(json_build_object(
      'school_id', sp.school_id, 'school_name', sp.school_name, 'district', sp.district,
      'grade_level', sp.grade_level, 'subject_category', sp.subject_category,
      'total_students', sp.total_students,
      'mean_percentage_score', ROUND(sp.mean_percentage_score::numeric, 2),
      'students_75_above', sp.students_75_above,
      'percent_75_above', CASE WHEN sp.total_students > 0
        THEN ROUND((sp.students_75_above::float / sp.total_students * 100)::numeric, 2) ELSE 0 END
    )) FROM school_proficiency sp), '[]'::json),
    'by_district', COALESCE((SELECT json_object_agg(district_name,
      (SELECT json_agg(json_build_object(
        'grade_level', dp2.grade_level, 'subject_category', dp2.subject_category,
        'total_students', dp2.total_students,
        'mean_percentage_score', ROUND(dp2.mean_percentage_score::numeric, 2),
        'students_75_above', dp2.students_75_above,
        'percent_75_above', CASE WHEN dp2.total_students > 0
          THEN ROUND((dp2.students_75_above::float / dp2.total_students * 100)::numeric, 2) ELSE 0 END
      )) FROM district_proficiency dp2 WHERE dp2.district_name = dp.district_name)
    ) FROM (SELECT DISTINCT district_name FROM district_proficiency) dp), '{}'::json)
  ) INTO result;

  RETURN result;
END;
$$;

-- get_division_proficiency_v2
CREATE OR REPLACE FUNCTION get_division_proficiency_v2(
  p_division_id UUID,
  p_quarter TEXT DEFAULT 'Q2'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '60s'
AS $$
DECLARE
  result JSON;
BEGIN
  WITH school_list AS MATERIALIZED (
    SELECT id, name, district FROM schools
    WHERE division_id = p_division_id AND deleted_at IS NULL
  ),
  kinder_data AS MATERIALIZED (
    SELECT pr.school_id, sl.name as school_name, sl.district,
      COUNT(*) as total_kinder,
      ROUND(AVG(CASE WHEN pr.socio_emotional_dev = 'developing' OR pr.physical_motor_dev = 'developing'
        OR pr.cognitive_dev = 'developing' OR pr.language_literacy_dev = 'developing' THEN 1 ELSE 0 END) * 100, 2) as beginning_pct,
      ROUND(AVG(CASE WHEN pr.socio_emotional_dev = 'emerging' OR pr.physical_motor_dev = 'emerging'
        OR pr.cognitive_dev = 'emerging' OR pr.language_literacy_dev = 'emerging' THEN 1 ELSE 0 END) * 100, 2) as developing_pct,
      ROUND(AVG(CASE WHEN pr.socio_emotional_dev = 'advancing' OR pr.physical_motor_dev = 'advancing'
        OR pr.cognitive_dev = 'advancing' OR pr.language_literacy_dev = 'advancing' THEN 1 ELSE 0 END) * 100, 2) as consistent_pct
    FROM promotion_records pr
    JOIN school_list sl ON pr.school_id = sl.id
    WHERE pr.current_grade_level = 0
      AND (pr.socio_emotional_dev IS NOT NULL OR pr.physical_motor_dev IS NOT NULL
           OR pr.cognitive_dev IS NOT NULL OR pr.language_literacy_dev IS NOT NULL)
    GROUP BY pr.school_id, sl.name, sl.district
  ),
  student_grades AS MATERIALIZED (
    SELECT st.id as student_id, st.school_id, sec.grade_level
    FROM students st
    JOIN sections sec ON st.section_id = sec.id
    WHERE st.school_id IN (SELECT id FROM school_list)
      AND st.deleted_at IS NULL AND st.enrollment_status = 'enrolled'
  ),
  grade_data AS MATERIALIZED (
    SELECT g.school_id, la.code as subject_code, sg.grade_level,
      CASE p_quarter WHEN 'Q1' THEN g.q1 WHEN 'Q2' THEN g.q2 WHEN 'Q3' THEN g.q3 WHEN 'Q4' THEN g.q4 END as grade_value
    FROM grades g
    JOIN learning_areas la ON g.learning_area_id = la.id AND la.school_id = g.school_id
    LEFT JOIN student_grades sg ON g.student_id = sg.student_id
    WHERE g.school_id IN (SELECT id FROM school_list)
  ),
  school_subject_grade_stats AS MATERIALIZED (
    SELECT gd.school_id, sl.name as school_name, sl.district, gd.subject_code, gd.grade_level,
      COUNT(*)::int as total_students, ROUND(AVG(gd.grade_value)::numeric, 2) as mps,
      SUM(CASE WHEN gd.grade_value >= 75 THEN 1 ELSE 0 END)::int as passing_count
    FROM grade_data gd
    JOIN school_list sl ON gd.school_id = sl.id
    WHERE gd.grade_value IS NOT NULL AND gd.grade_value > 0
    GROUP BY gd.school_id, sl.name, sl.district, gd.subject_code, gd.grade_level
  ),
  school_subject_stats AS MATERIALIZED (
    SELECT school_id, school_name, district, subject_code,
      SUM(total_students)::int as total_students,
      ROUND((SUM(mps * total_students) / NULLIF(SUM(total_students), 0))::numeric, 2) as mps,
      SUM(passing_count)::int as passing_count
    FROM school_subject_grade_stats
    GROUP BY school_id, school_name, district, subject_code
  ),
  subject_totals AS MATERIALIZED (
    SELECT subject_code, COUNT(DISTINCT school_id)::int as schools_with_data,
      SUM(total_students)::int as total_students,
      ROUND((SUM(mps * total_students) / NULLIF(SUM(total_students), 0))::numeric, 2) as avg_mps,
      SUM(passing_count)::int as total_passing
    FROM school_subject_stats
    GROUP BY subject_code
  )
  SELECT json_build_object(
    'quarter', p_quarter,
    'total_schools', (SELECT COUNT(*)::int FROM school_list),
    'schools_checked', (SELECT COUNT(DISTINCT school_id)::int FROM school_subject_stats),
    'total_grades', COALESCE((SELECT SUM(total_students)::int FROM subject_totals), 0),
    'overall_mps', COALESCE((SELECT ROUND((SUM(avg_mps * total_students) / NULLIF(SUM(total_students), 0))::numeric, 2) FROM subject_totals), 0),
    'kindergarten', COALESCE((SELECT json_agg(json_build_object(
      'school_id', school_id, 'school_name', school_name,
      'district', COALESCE(district, 'Unassigned'), 'total_students', total_kinder,
      'beginning_pct', beginning_pct, 'developing_pct', developing_pct,
      'consistent_pct', consistent_pct,
      'total_pct', ROUND(beginning_pct + developing_pct + consistent_pct, 2)
    ) ORDER BY COALESCE(district, 'ZZZ'), school_name) FROM kinder_data), '[]'::json),
    'by_subject', COALESCE((SELECT json_agg(json_build_object(
      'code', subject_code, 'schools_with_data', schools_with_data,
      'total_students', total_students, 'mps', avg_mps,
      'passing', total_passing,
      'passing_rate', CASE WHEN total_students > 0
        THEN ROUND((total_passing::float / total_students * 100)::numeric, 2) ELSE 0 END
    ) ORDER BY subject_code) FROM subject_totals), '[]'::json),
    'school_data', COALESCE((SELECT json_agg(json_build_object(
      'school_id', school_id, 'school_name', school_name,
      'district', COALESCE(district, 'Unassigned'), 'subject_code', subject_code,
      'total_students', total_students, 'mps', mps, 'passing', passing_count,
      'passing_rate', CASE WHEN total_students > 0
        THEN ROUND((passing_count::float / total_students * 100)::numeric, 2) ELSE 0 END
    ) ORDER BY COALESCE(district, 'ZZZ'), school_name, subject_code) FROM school_subject_stats), '[]'::json),
    'by_grade_level', COALESCE((SELECT json_agg(json_build_object(
      'school_id', school_id, 'school_name', school_name,
      'district', COALESCE(district, 'Unassigned'), 'subject_code', subject_code,
      'grade_level', grade_level, 'total_students', total_students, 'mps', mps,
      'passing_rate', CASE WHEN total_students > 0
        THEN ROUND((passing_count::float / total_students * 100)::numeric, 2) ELSE 0 END
    ) ORDER BY COALESCE(district, 'ZZZ'), school_name, subject_code, grade_level) FROM school_subject_grade_stats), '[]'::json)
  ) INTO result;

  RETURN result;
END;
$$;


-- ############################################################################
-- SECTION 5: TRIGGERS
-- ############################################################################

-- ECR: Auto-compute grades when scores change
DROP TRIGGER IF EXISTS trg_compute_ecr_on_score ON ecr_scores;
CREATE TRIGGER trg_compute_ecr_on_score
    AFTER INSERT OR UPDATE OR DELETE ON ecr_scores
    FOR EACH ROW
    EXECUTE FUNCTION trigger_compute_ecr_on_score_change();

-- ECR: Auto-assign weights for new learning areas
DROP TRIGGER IF EXISTS trg_auto_assign_ecr_weights ON learning_areas;
CREATE TRIGGER trg_auto_assign_ecr_weights
    AFTER INSERT ON learning_areas
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_ecr_weights();

-- Auto-seed learning areas on school creation
DROP TRIGGER IF EXISTS trg_seed_learning_areas ON schools;
CREATE TRIGGER trg_seed_learning_areas
    AFTER INSERT ON schools
    FOR EACH ROW
    EXECUTE FUNCTION seed_default_learning_areas();

-- Teaching assignments: Auto-update updated_at
DROP TRIGGER IF EXISTS update_teaching_assignments_updated_at ON teaching_assignments;
CREATE TRIGGER update_teaching_assignments_updated_at
    BEFORE UPDATE ON teaching_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Ancillary responsibilities: Auto-update updated_at
DROP TRIGGER IF EXISTS update_ancillary_responsibilities_updated_at ON ancillary_responsibilities;
CREATE TRIGGER update_ancillary_responsibilities_updated_at
    BEFORE UPDATE ON ancillary_responsibilities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Facilities: Auto-update updated_at
DROP TRIGGER IF EXISTS facilities_updated_at ON facilities;
CREATE TRIGGER facilities_updated_at
    BEFORE UPDATE ON facilities
    FOR EACH ROW
    EXECUTE FUNCTION update_facilities_updated_at();

DROP TRIGGER IF EXISTS maintenance_logs_updated_at ON facility_maintenance_logs;
CREATE TRIGGER maintenance_logs_updated_at
    BEFORE UPDATE ON facility_maintenance_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_facilities_updated_at();

-- ELLN Assessments: Auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_elln_assessments_updated_at ON elln_assessments;
CREATE TRIGGER trigger_update_elln_assessments_updated_at
    BEFORE UPDATE ON elln_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_elln_assessments_updated_at();

-- Textbook Distributions: Auto-update updated_at
DROP TRIGGER IF EXISTS trigger_textbook_distributions_updated_at ON textbook_distributions;
CREATE TRIGGER trigger_textbook_distributions_updated_at
    BEFORE UPDATE ON textbook_distributions
    FOR EACH ROW
    EXECUTE FUNCTION update_textbook_distributions_updated_at();


-- ############################################################################
-- GRANTS (for RPC functions)
-- ############################################################################

GRANT EXECUTE ON FUNCTION get_division_dashboard_stats(UUID, UUID[]) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_division_schools_stats(UUID, UUID[]) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_division_personnel_counts(UUID, UUID[]) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_division_enrollment_counts(UUID, UUID[]) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_division_personnel_summary(UUID, UUID[]) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_division_enrollment_summary(UUID, UUID[]) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_division_promotion_summary(UUID, TEXT, TEXT, UUID[]) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_division_proficiency_summary(UUID, TEXT, TEXT, UUID[]) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_division_proficiency_v2(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION sync_ecr_to_grades(UUID, UUID, VARCHAR, VARCHAR) TO authenticated, service_role;


-- ############################################################################
-- END OF COMBINED MIGRATION OBJECTS
-- ############################################################################
