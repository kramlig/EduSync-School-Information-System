-- Create ELLN Assessments Table
-- Early Language, Literacy & Numeracy Assessment tracking for K-3 students

CREATE TABLE IF NOT EXISTS elln_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL,
  student_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  grade_level INTEGER NOT NULL CHECK (grade_level >= 0 AND grade_level <= 3),
  school_year TEXT NOT NULL,
  quarter TEXT NOT NULL CHECK (quarter IN ('q1', 'q2', 'q3', 'q4')),
  
  -- Literacy domain scores (0-100)
  literacy_scores JSONB NOT NULL DEFAULT '{
    "oralLanguage": 0,
    "phonologicalAwareness": 0,
    "bookAndPrintKnowledge": 0,
    "alphabetKnowledge": 0,
    "phonics": 0,
    "comprehension": 0
  }'::jsonb,
  
  -- Numeracy domain scores (0-100)
  numeracy_scores JSONB NOT NULL DEFAULT '{
    "numberSense": 0,
    "measurement": 0,
    "geometry": 0,
    "patterns": 0,
    "dataAnalysis": 0
  }'::jsonb,
  
  -- Calculated averages
  literacy_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  numeracy_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  overall_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  
  -- Proficiency level
  proficiency_level TEXT NOT NULL CHECK (proficiency_level IN (
    'Advanced', 'Proficient', 'Approaching', 'Developing', 'Beginning'
  )),
  
  -- Assessor information
  assessed_by TEXT NOT NULL,
  assessed_by_name TEXT NOT NULL,
  assessment_date DATE NOT NULL,
  
  -- Additional notes
  notes TEXT,
  recommendations TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_elln_school_id ON elln_assessments(school_id);
CREATE INDEX idx_elln_student_id ON elln_assessments(student_id);
CREATE INDEX idx_elln_grade_level ON elln_assessments(grade_level);
CREATE INDEX idx_elln_school_year ON elln_assessments(school_year);
CREATE INDEX idx_elln_assessment_date ON elln_assessments(assessment_date DESC);
CREATE INDEX idx_elln_proficiency ON elln_assessments(proficiency_level);

-- Composite index for common queries
CREATE INDEX idx_elln_student_year_quarter ON elln_assessments(student_id, school_year, quarter);

-- Enable Row Level Security
ALTER TABLE elln_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all operations for authenticated users (adjust based on your auth system)
CREATE POLICY "Allow full access to elln_assessments"
  ON elln_assessments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_elln_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_elln_assessments_updated_at
  BEFORE UPDATE ON elln_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_elln_assessments_updated_at();

-- Add comments for documentation
COMMENT ON TABLE elln_assessments IS 'Early Language, Literacy & Numeracy assessments for K-3 students';
COMMENT ON COLUMN elln_assessments.literacy_scores IS 'JSONB object containing 6 literacy domain scores';
COMMENT ON COLUMN elln_assessments.numeracy_scores IS 'JSONB object containing 5 numeracy domain scores';
COMMENT ON COLUMN elln_assessments.proficiency_level IS 'Overall proficiency: Advanced (90+), Proficient (80-89), Approaching (65-79), Developing (50-64), Beginning (<50)';
