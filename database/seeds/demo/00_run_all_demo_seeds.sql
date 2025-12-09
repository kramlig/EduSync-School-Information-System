-- ============================================================================
-- MATI DIVISION DEMO DATA - MASTER SEED SCRIPT
-- ============================================================================
-- This script executes all demo data seeds in the correct order.
-- 
-- Prerequisites (run these first if not already done):
--   1. seed_mati_sf7_schools.sql (53 elementary schools)
--   2. seed_mati_sf7_secondary_schools.sql (18 secondary schools)
--   3. personnel/batch_1-4*.sql (1,686 teachers)
--   4. students/batch_0-8*.sql (38,804 students)
--
-- This script will create:
--   - Sections (~2-4 per grade level per school)
--   - Learning Areas (9 elementary + 8 secondary per school type)
--   - Grades (Q1 & Q2 for all students in all applicable subjects)
--
-- EXECUTION ORDER:
--   \i database/seeds/demo/01_seed_sections.sql
--   \i database/seeds/demo/02_seed_learning_areas.sql
--   \i database/seeds/demo/03_seed_demo_grades.sql
--
-- Expected Results:
--   - ~71 schools
--   - ~1,686 teachers
--   - ~38,804 students
--   - ~800+ sections
--   - ~700+ learning areas
--   - ~300,000+ grade records
--
-- For Division Q2 Proficiency Report:
--   - 15% Outstanding (90-100)
--   - 25% Very Satisfactory (85-89)
--   - 35% Satisfactory (80-84)
--   - 20% Fairly Satisfactory (75-79)
--   - 5% Did Not Meet Expectations (<75)
-- ============================================================================

-- Step 1: Create Sections
\echo '============================================'
\echo 'Step 1/3: Creating sections...'
\echo '============================================'
\i database/seeds/demo/01_seed_sections.sql

-- Step 2: Create Learning Areas
\echo '============================================'
\echo 'Step 2/3: Creating learning areas...'
\echo '============================================'
\i database/seeds/demo/02_seed_learning_areas.sql

-- Step 3: Create Grades
\echo '============================================'
\echo 'Step 3/3: Creating Q1 & Q2 grades...'
\echo 'This may take 10-15 minutes for 38k students...'
\echo '============================================'
\i database/seeds/demo/03_seed_demo_grades.sql

-- Final Summary
\echo '============================================'
\echo 'MATI DIVISION DEMO DATA COMPLETE!'
\echo '============================================'

SELECT 
  'Summary' as report,
  (SELECT COUNT(*) FROM schools WHERE division = 'Division of City of Mati') as schools,
  (SELECT COUNT(*) FROM teachers t JOIN schools s ON t.school_id = s.id WHERE s.division = 'Division of City of Mati') as teachers,
  (SELECT COUNT(*) FROM students st JOIN schools s ON st.school_id = s.id WHERE s.division = 'Division of City of Mati') as students,
  (SELECT COUNT(*) FROM sections sec JOIN schools s ON sec.school_id = s.id WHERE s.division = 'Division of City of Mati') as sections,
  (SELECT COUNT(*) FROM learning_areas la JOIN schools s ON la.school_id = s.id WHERE s.division = 'Division of City of Mati') as learning_areas,
  (SELECT COUNT(*) FROM grades g JOIN schools s ON g.school_id = s.id WHERE s.division = 'Division of City of Mati') as grades;
