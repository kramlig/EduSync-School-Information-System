
-- ############################################################################
-- SECTION: ENABLE REALTIME
-- ############################################################################

-- Add tables to supabase_realtime publication
-- (Supabase uses this publication for realtime subscriptions)

DO $$
DECLARE
  _table TEXT;
  _tables TEXT[] := ARRAY['grades', 'sections', 'ecr_activities', 'announcements', 'attendance_records', 'schools', 'enrollment_applications', 'student_health_records', 'parents', 'students', 'teachers', 'teaching_assignments', 'learning_areas', 'core_values', 'core_value_grades', 'ecr_scores', 'ecr_weights', 'ecr_component_grades', 'lesson_plans', 'class_schedules', 'subscriptions', 'fee_structures', 'student_ledgers', 'superadmins', 'users', 'division_users', 'divisions', 'districts'];
BEGIN
  FOREACH _table IN ARRAY _tables LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', _table);
      RAISE NOTICE 'Added % to supabase_realtime', _table;
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE '% already in publication', _table;
      WHEN undefined_table THEN
        RAISE NOTICE '% does not exist, skipping', _table;
    END;
  END LOOP;
END $$;
