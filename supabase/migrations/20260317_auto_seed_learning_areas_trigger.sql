-- ============================================================================
-- AUTO-SEED DEFAULT LEARNING AREAS ON SCHOOL CREATION (MATATAG Curriculum)
-- 
-- 1. Adds school_type column to schools table (if not exists)
-- 2. Creates a trigger that automatically inserts standard DepEd MATATAG
--    subjects when a new school is created, based on the school_type column.
--
-- School types → subjects:
--   elementary    → 11 elementary subjects (Grades 1-6, MATATAG)
--   high_school   → 8 JHS subjects (Grades 7-10)
--   senior_high   → 8 JHS subjects (Grades 7-10) — same base curriculum
--   integrated    → Both elementary + secondary
--   NULL/unknown  → Elementary defaults (most common school type)
--
-- MATATAG Changes (April 2026):
--   - Mother Tongue REMOVED
--   - ESP renamed to GMRC (all grades)
--   - AP renamed to MAKABANSA (Grades 1-3), AP stays for Grades 4-6
--   - Grade 1: Language + Reading and Literacy (not Filipino/English)
--   - Filipino/English: Grades 2-6 only
--   - MAPEH: Grades 4-6 only (removed from 1-3)
--   - EPP (Grades 4-5) and TLE (Grade 6) are separate
-- ============================================================================

-- Step 0: Add school_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'schools' AND column_name = 'school_type'
  ) THEN
    ALTER TABLE schools ADD COLUMN school_type TEXT;
    RAISE NOTICE '✅ Added school_type column to schools table';
  ELSE
    RAISE NOTICE 'ℹ️  school_type column already exists';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION seed_default_learning_areas()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip if school already has learning areas (e.g., from import/migration)
  IF EXISTS (SELECT 1 FROM learning_areas WHERE school_id = NEW.id LIMIT 1) THEN
    RETURN NEW;
  END IF;

  -- ============================
  -- ELEMENTARY SUBJECTS (MATATAG)
  -- ============================
  IF NEW.school_type IS NULL 
     OR NEW.school_type IN ('elementary', 'integrated') THEN
    
    INSERT INTO learning_areas (school_id, code, name, grade_levels, category, display_order, is_active, is_composite, components)
    VALUES
      -- Grade 1 specific
      (NEW.id, 'LANG',  'Language',                      ARRAY[1],             'core', 1,  true, false, NULL),
      (NEW.id, 'RL',    'Reading and Literacy',          ARRAY[1],             'core', 2,  true, false, NULL),
      -- Grades 2-6
      (NEW.id, 'FIL',   'Filipino',                      ARRAY[2,3,4,5,6],    'core', 3,  true, false, NULL),
      (NEW.id, 'ENG',   'English',                       ARRAY[2,3,4,5,6],    'core', 4,  true, false, NULL),
      -- All elementary grades
      (NEW.id, 'MATH',  'Mathematics',                   ARRAY[1,2,3,4,5,6],  'core', 5,  true, false, NULL),
      (NEW.id, 'GMRC',  'GMRC',                          ARRAY[1,2,3,4,5,6],  'core', 6,  true, false, NULL),
      -- Grades 1-3 only
      (NEW.id, 'MKBS',  'MAKABANSA',                     ARRAY[1,2,3],        'core', 7,  true, false, NULL),
      -- Grades 3-6
      (NEW.id, 'SCI',   'Science',                       ARRAY[3,4,5,6],      'core', 8,  true, false, NULL),
      -- Grades 4-6 only
      (NEW.id, 'AP',    'Araling Panlipunan',            ARRAY[4,5,6],        'core', 9,  true, false, NULL),
      (NEW.id, 'EPP',   'EPP',                            ARRAY[4,5],          'tle',  10, true, false, NULL),
      (NEW.id, 'TLE',   'TLE',                            ARRAY[6],            'tle',  11, true, false, NULL),
      (NEW.id, 'MAPEH', 'MAPEH',                          ARRAY[4,5,6],        'core', 12, true, true,  ARRAY['Music','Arts','Physical Education','Health']);
  END IF;

  -- =====================
  -- SECONDARY SUBJECTS
  -- =====================
  IF NEW.school_type IN ('high_school', 'senior_high', 'integrated') THEN
    
    -- Use -SEC suffix for integrated schools to avoid code collision with elementary
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

-- Create the trigger (AFTER INSERT so NEW.id is available)
DROP TRIGGER IF EXISTS trg_seed_learning_areas ON schools;
CREATE TRIGGER trg_seed_learning_areas
  AFTER INSERT ON schools
  FOR EACH ROW
  EXECUTE FUNCTION seed_default_learning_areas();

-- ============================================================================
-- VERIFICATION: Check trigger exists
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_seed_learning_areas'
  ) THEN
    RAISE NOTICE '✅ Trigger trg_seed_learning_areas created successfully';
  ELSE
    RAISE NOTICE '❌ Trigger creation failed';
  END IF;
END $$;
