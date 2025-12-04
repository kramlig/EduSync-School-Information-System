-- Create Student Movements Table
-- Tracks student enrollment changes for SF4 (Monthly Learner Movement & Attendance Report)

CREATE TABLE IF NOT EXISTS student_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL,
  student_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  lrn TEXT,
  grade_level INTEGER NOT NULL,
  section_id UUID,
  section_name TEXT,
  
  -- Movement details
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'enrolled',           -- Initial enrollment
    'transferred_in',     -- Transfer from another school
    'transferred_out',    -- Transfer to another school
    'dropped',           -- Dropped out
    'promoted',          -- Promoted to next grade
    'retained',          -- Retained in same grade
    'graduated',         -- Graduated (Grade 6, 10, 12)
    'completed'          -- Completed current level
  )),
  
  movement_date DATE NOT NULL,
  school_year TEXT NOT NULL,
  month TEXT NOT NULL, -- Format: 'YYYY-MM' for monthly tracking
  
  -- Additional details
  previous_school TEXT,      -- For transferred_in
  destination_school TEXT,   -- For transferred_out
  reason TEXT,              -- Reason for movement
  remarks TEXT,
  
  -- Metadata
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_movements_school ON student_movements(school_id);
CREATE INDEX IF NOT EXISTS idx_student_movements_student ON student_movements(student_id);
CREATE INDEX IF NOT EXISTS idx_student_movements_school_year ON student_movements(school_year);
CREATE INDEX IF NOT EXISTS idx_student_movements_month ON student_movements(month);
CREATE INDEX IF NOT EXISTS idx_student_movements_type ON student_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_student_movements_date ON student_movements(movement_date);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_student_movements_school_year_month 
  ON student_movements(school_id, school_year, month);
CREATE INDEX IF NOT EXISTS idx_student_movements_school_grade 
  ON student_movements(school_id, grade_level);

-- Monthly enrollment snapshots
CREATE TABLE IF NOT EXISTS monthly_enrollment_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL,
  school_year TEXT NOT NULL,
  month TEXT NOT NULL, -- Format: 'YYYY-MM'
  grade_level INTEGER NOT NULL,
  section_id UUID,
  section_name TEXT,
  
  -- Enrollment counts
  beginning_enrollment INTEGER NOT NULL DEFAULT 0,
  transferred_in INTEGER NOT NULL DEFAULT 0,
  transferred_out INTEGER NOT NULL DEFAULT 0,
  dropped INTEGER NOT NULL DEFAULT 0,
  ending_enrollment INTEGER NOT NULL DEFAULT 0,
  
  -- Attendance summary
  total_school_days INTEGER NOT NULL DEFAULT 0,
  total_absences INTEGER NOT NULL DEFAULT 0,
  attendance_rate NUMERIC(5, 2) DEFAULT 0,
  
  -- Metadata
  snapshot_date DATE NOT NULL,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for monthly snapshots
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_school ON monthly_enrollment_snapshots(school_id);
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_school_year ON monthly_enrollment_snapshots(school_year);
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_month ON monthly_enrollment_snapshots(month);
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_grade ON monthly_enrollment_snapshots(grade_level);

-- Composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_school_year_month 
  ON monthly_enrollment_snapshots(school_id, school_year, month);

-- Unique constraint using expression index to handle NULL section_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_snapshots_unique 
  ON monthly_enrollment_snapshots(school_id, school_year, month, grade_level, COALESCE(section_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Comments
COMMENT ON TABLE student_movements IS 'Tracks individual student enrollment changes for SF4 reporting';
COMMENT ON TABLE monthly_enrollment_snapshots IS 'Monthly aggregated enrollment statistics by grade level and section';
COMMENT ON COLUMN student_movements.movement_type IS 'Type of enrollment change: enrolled, transferred_in, transferred_out, dropped, promoted, retained, graduated, completed';
COMMENT ON COLUMN student_movements.month IS 'Month of movement in YYYY-MM format for grouping';
COMMENT ON COLUMN monthly_enrollment_snapshots.month IS 'Snapshot month in YYYY-MM format';
