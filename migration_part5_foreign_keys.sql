-- ############################################################################
-- FOREIGN KEY CONSTRAINTS FIX
-- The new database was missing all FKs (DDL was generated from OpenAPI spec)
-- PostgREST needs FKs for join queries like select('*, students!inner(...)')
-- ############################################################################

-- Helper: safe add FK (skip if already exists)
DO $$ BEGIN

-- ========================================
-- students table
-- ========================================
ALTER TABLE public.students
  ADD CONSTRAINT fk_students_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.students
  ADD CONSTRAINT fk_students_section FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- teachers table
-- ========================================
DO $$ BEGIN
ALTER TABLE public.teachers
  ADD CONSTRAINT fk_teachers_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- sections table
-- ========================================
DO $$ BEGIN
ALTER TABLE public.sections
  ADD CONSTRAINT fk_sections_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.sections
  ADD CONSTRAINT fk_sections_adviser FOREIGN KEY (adviser_id) REFERENCES public.teachers(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- grades table
-- ========================================
DO $$ BEGIN
ALTER TABLE public.grades
  ADD CONSTRAINT fk_grades_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.grades
  ADD CONSTRAINT fk_grades_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.grades
  ADD CONSTRAINT fk_grades_learning_area FOREIGN KEY (learning_area_id) REFERENCES public.learning_areas(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- core_value_grades table
-- ========================================
DO $$ BEGIN
ALTER TABLE public.core_value_grades
  ADD CONSTRAINT fk_core_value_grades_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.core_value_grades
  ADD CONSTRAINT fk_core_value_grades_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.core_value_grades
  ADD CONSTRAINT fk_core_value_grades_core_value FOREIGN KEY (core_value_id) REFERENCES public.core_values(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- homeroom_guidance_grades table
-- ========================================
DO $$ BEGIN
ALTER TABLE public.homeroom_guidance_grades
  ADD CONSTRAINT fk_homeroom_guidance_grades_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.homeroom_guidance_grades
  ADD CONSTRAINT fk_homeroom_guidance_grades_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- student_health_records table
-- ========================================
DO $$ BEGIN
ALTER TABLE public.student_health_records
  ADD CONSTRAINT fk_student_health_records_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.student_health_records
  ADD CONSTRAINT fk_student_health_records_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- shs_semester_grades table (SKIPPED - table does not exist in new DB)
-- ========================================

-- ========================================
-- teaching_assignments table
-- ========================================
DO $$ BEGIN
ALTER TABLE public.teaching_assignments
  ADD CONSTRAINT fk_teaching_assignments_teacher FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.teaching_assignments
  ADD CONSTRAINT fk_teaching_assignments_section FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.teaching_assignments
  ADD CONSTRAINT fk_teaching_assignments_learning_area FOREIGN KEY (learning_area_id) REFERENCES public.learning_areas(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- learning_areas table
-- ========================================
DO $$ BEGIN
ALTER TABLE public.learning_areas
  ADD CONSTRAINT fk_learning_areas_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- ECR tables
-- ========================================
DO $$ BEGIN
ALTER TABLE public.ecr_weights
  ADD CONSTRAINT fk_ecr_weights_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.ecr_weights
  ADD CONSTRAINT fk_ecr_weights_learning_area FOREIGN KEY (learning_area_id) REFERENCES public.learning_areas(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.ecr_activities
  ADD CONSTRAINT fk_ecr_activities_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.ecr_activities
  ADD CONSTRAINT fk_ecr_activities_teacher FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.ecr_activities
  ADD CONSTRAINT fk_ecr_activities_section FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.ecr_activities
  ADD CONSTRAINT fk_ecr_activities_learning_area FOREIGN KEY (learning_area_id) REFERENCES public.learning_areas(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.ecr_scores
  ADD CONSTRAINT fk_ecr_scores_activity FOREIGN KEY (activity_id) REFERENCES public.ecr_activities(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.ecr_scores
  ADD CONSTRAINT fk_ecr_scores_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.ecr_scores
  ADD CONSTRAINT fk_ecr_scores_graded_by FOREIGN KEY (graded_by) REFERENCES public.teachers(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.ecr_component_grades
  ADD CONSTRAINT fk_ecr_component_grades_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.ecr_component_grades
  ADD CONSTRAINT fk_ecr_component_grades_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.ecr_component_grades
  ADD CONSTRAINT fk_ecr_component_grades_section FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.ecr_component_grades
  ADD CONSTRAINT fk_ecr_component_grades_learning_area FOREIGN KEY (learning_area_id) REFERENCES public.learning_areas(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- Division / District tables
-- ========================================
DO $$ BEGIN
ALTER TABLE public.districts
  ADD CONSTRAINT fk_districts_division FOREIGN KEY (division_id) REFERENCES public.divisions(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.schools
  ADD CONSTRAINT fk_schools_division FOREIGN KEY (division_id) REFERENCES public.divisions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.schools
  ADD CONSTRAINT fk_schools_district FOREIGN KEY (district_id) REFERENCES public.districts(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.division_users
  ADD CONSTRAINT fk_division_users_division FOREIGN KEY (division_id) REFERENCES public.divisions(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.division_users
  ADD CONSTRAINT fk_division_users_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.division_users
  ADD CONSTRAINT fk_division_users_assigned_district FOREIGN KEY (assigned_district_id) REFERENCES public.districts(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- Other tables
-- ========================================
DO $$ BEGIN
ALTER TABLE public.login_audit
  ADD CONSTRAINT fk_login_audit_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.facility_maintenance_logs
  ADD CONSTRAINT fk_facility_maintenance_logs_facility FOREIGN KEY (facility_id) REFERENCES public.facilities(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.ancillary_responsibilities
  ADD CONSTRAINT fk_ancillary_responsibilities_teacher FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.attendance_records
  ADD CONSTRAINT fk_attendance_records_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.attendance_records
  ADD CONSTRAINT fk_attendance_records_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.enrollment_applications
  ADD CONSTRAINT fk_enrollment_applications_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.announcements
  ADD CONSTRAINT fk_announcements_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.lesson_plans
  ADD CONSTRAINT fk_lesson_plans_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.class_schedules
  ADD CONSTRAINT fk_class_schedules_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.parents
  ADD CONSTRAINT fk_parents_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.fee_structures
  ADD CONSTRAINT fk_fee_structures_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.student_ledgers
  ADD CONSTRAINT fk_student_ledgers_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.student_ledgers
  ADD CONSTRAINT fk_student_ledgers_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.promotion_records
  ADD CONSTRAINT fk_promotion_records_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.promotion_records
  ADD CONSTRAINT fk_promotion_records_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- Notify PostgREST to reload schema cache
-- ========================================
NOTIFY pgrst, 'reload schema';
