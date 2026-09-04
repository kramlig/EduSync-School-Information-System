# Quick Script to Create student_assignment_grades Table
# Run this in PowerShell from the project root

Write-Host "Creating student_assignment_grades table..." -ForegroundColor Cyan

$sql = @"
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
"@

Write-Host "`nCopy this SQL and run it in Supabase SQL Editor:" -ForegroundColor Yellow
Write-Host "1. Go to https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Select your project" -ForegroundColor White
Write-Host "3. Click 'SQL Editor' in left sidebar" -ForegroundColor White
Write-Host "4. Click 'New Query'" -ForegroundColor White
Write-Host "5. Paste the SQL below and click 'Run'" -ForegroundColor White
Write-Host "`n--- SQL START ---`n" -ForegroundColor Green
Write-Host $sql -ForegroundColor Gray
Write-Host "`n--- SQL END ---`n" -ForegroundColor Green

# Copy to clipboard if possible
try {
    $sql | Set-Clipboard
    Write-Host "✅ SQL has been copied to your clipboard!" -ForegroundColor Green
    Write-Host "Just paste it (Ctrl+V) in Supabase SQL Editor and click Run" -ForegroundColor Cyan
} catch {
    Write-Host "⚠️ Could not copy to clipboard automatically" -ForegroundColor Yellow
    Write-Host "Please copy the SQL manually from above" -ForegroundColor Yellow
}

Write-Host "`nAfter running the SQL:" -ForegroundColor Cyan
Write-Host "1. Wait 30-60 seconds for Supabase to refresh" -ForegroundColor White
Write-Host "2. Hard refresh your browser (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "3. Try entering scores again" -ForegroundColor White
