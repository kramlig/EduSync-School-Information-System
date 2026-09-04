-- ############################################################################
-- ADDITIONAL FOREIGN KEY CONSTRAINTS (Part 6)
-- Covers parent_students, school_invitations, student_movements,
-- textbook_distributions, book_issuances, assignments, promotion_records,
-- substitute_assignments, and remaining join dependencies
-- ############################################################################

-- ========================================
-- parent_students (junction table)
-- ========================================
DO $$ BEGIN
ALTER TABLE public.parent_students
  ADD CONSTRAINT fk_parent_students_parent FOREIGN KEY (parent_id) REFERENCES public.parents(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.parent_students
  ADD CONSTRAINT fk_parent_students_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- school_invitations
-- ========================================
DO $$ BEGIN
ALTER TABLE public.school_invitations
  ADD CONSTRAINT fk_school_invitations_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- student_movements
-- ========================================
DO $$ BEGIN
ALTER TABLE public.student_movements
  ADD CONSTRAINT fk_student_movements_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.student_movements
  ADD CONSTRAINT fk_student_movements_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.student_movements
  ADD CONSTRAINT fk_student_movements_section FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- textbook_distributions
-- ========================================
DO $$ BEGIN
ALTER TABLE public.textbook_distributions
  ADD CONSTRAINT fk_textbook_distributions_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.textbook_distributions
  ADD CONSTRAINT fk_textbook_distributions_book FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.textbook_distributions
  ADD CONSTRAINT fk_textbook_distributions_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.textbook_distributions
  ADD CONSTRAINT fk_textbook_distributions_section FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- book_issuances
-- ========================================
DO $$ BEGIN
ALTER TABLE public.book_issuances
  ADD CONSTRAINT fk_book_issuances_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.book_issuances
  ADD CONSTRAINT fk_book_issuances_book FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.book_issuances
  ADD CONSTRAINT fk_book_issuances_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- assignments
-- ========================================
DO $$ BEGIN
ALTER TABLE public.assignments
  ADD CONSTRAINT fk_assignments_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.assignments
  ADD CONSTRAINT fk_assignments_section FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.assignments
  ADD CONSTRAINT fk_assignments_learning_area FOREIGN KEY (learning_area_id) REFERENCES public.learning_areas(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.assignments
  ADD CONSTRAINT fk_assignments_teacher FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- student_assignment_grades
-- ========================================
DO $$ BEGIN
ALTER TABLE public.student_assignment_grades
  ADD CONSTRAINT fk_student_assignment_grades_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.student_assignment_grades
  ADD CONSTRAINT fk_student_assignment_grades_assignment FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.student_assignment_grades
  ADD CONSTRAINT fk_student_assignment_grades_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- substitute_assignments (teacher_id/original_teacher_id are TEXT, need to cast to UUID first)
-- ========================================
DO $$ BEGIN
ALTER TABLE public.substitute_assignments
  ADD CONSTRAINT fk_substitute_assignments_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.substitute_assignments
  ALTER COLUMN teacher_id TYPE UUID USING teacher_id::uuid;
ALTER TABLE public.substitute_assignments
  ADD CONSTRAINT fk_substitute_assignments_teacher FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE public.substitute_assignments
  ALTER COLUMN original_teacher_id TYPE UUID USING original_teacher_id::uuid;
ALTER TABLE public.substitute_assignments
  ADD CONSTRAINT fk_substitute_assignments_original_teacher FOREIGN KEY (original_teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- promotion_records (additional FKs)
-- ========================================
DO $$ BEGIN
ALTER TABLE public.promotion_records
  ADD CONSTRAINT fk_promotion_records_section FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- books
-- ========================================
DO $$ BEGIN
ALTER TABLE public.books
  ADD CONSTRAINT fk_books_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- subscriptions (user_id is TEXT, need to cast to UUID)
-- ========================================
DO $$ BEGIN
ALTER TABLE public.subscriptions
  ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- users → schools
-- ========================================
DO $$ BEGIN
ALTER TABLE public.users
  ADD CONSTRAINT fk_users_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- Notify PostgREST to reload schema cache
-- ========================================
NOTIFY pgrst, 'reload schema';
