-- Create Homeroom Guidance Grades Table
-- Stores per-student homeroom guidance competency ratings for SF9 Report Card

CREATE TABLE IF NOT EXISTS homeroom_guidance_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_year VARCHAR(10) NOT NULL,
  
  -- Ratings per quarter: { "competency text": 4 } where value is 0-4
  q1_ratings JSONB NOT NULL DEFAULT '{}'::jsonb,
  q2_ratings JSONB NOT NULL DEFAULT '{}'::jsonb,
  q3_ratings JSONB NOT NULL DEFAULT '{}'::jsonb,
  q4_ratings JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  graded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(student_id, school_year)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_hg_grades_school_year 
  ON homeroom_guidance_grades(school_id, school_year);
CREATE INDEX IF NOT EXISTS idx_hg_grades_student 
  ON homeroom_guidance_grades(student_id);

-- RLS
ALTER TABLE homeroom_guidance_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read homeroom guidance grades for their school"
  ON homeroom_guidance_grades FOR SELECT
  USING (true);

CREATE POLICY "Users can insert homeroom guidance grades"
  ON homeroom_guidance_grades FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update homeroom guidance grades"
  ON homeroom_guidance_grades FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete homeroom guidance grades"
  ON homeroom_guidance_grades FOR DELETE
  USING (true);
