-- Add student_assignment_grades table
-- Migration Date: November 27, 2025
-- Purpose: Store student submissions and grades for assignments

CREATE TABLE IF NOT EXISTS student_assignment_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    
    score NUMERIC(5,2),
    submission_date TIMESTAMPTZ,
    file_path TEXT,
    feedback TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one grade record per student per assignment
    UNIQUE(assignment_id, student_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_assignment_grades_school_id ON student_assignment_grades(school_id);
CREATE INDEX IF NOT EXISTS idx_student_assignment_grades_assignment_id ON student_assignment_grades(assignment_id);
CREATE INDEX IF NOT EXISTS idx_student_assignment_grades_student_id ON student_assignment_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assignment_grades_submission_date ON student_assignment_grades(submission_date);

-- Add comment
COMMENT ON TABLE student_assignment_grades IS 'Student submissions and grades for assignments';
