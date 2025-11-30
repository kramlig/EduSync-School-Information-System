# Run This First: Create student_assignment_grades Table

**CRITICAL**: The Assignments page requires the `student_assignment_grades` table to be created in your PostgreSQL database.

## Quick Fix

Run this SQL migration script in your Supabase SQL Editor:

```sql
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
```

## Steps to Run

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Paste the SQL above**
   - Copy the entire SQL block
   - Paste into the query editor

4. **Run the migration**
   - Click "Run" button
   - Wait for "Success" message

5. **Verify table was created**
   - Click "Table Editor" in left sidebar
   - You should see `student_assignment_grades` in the table list

## Alternative: Use the migration file

If you prefer to use the migration file directly:

```powershell
# From project root
psql $DATABASE_URL -f scripts/migration/add-student-assignment-grades-table.sql
```

## After Migration

Once the table is created:
1. Refresh your browser (clear cache if needed)
2. Navigate to Assignments page
3. The errors should be gone
4. You can now create, view, and grade assignments

## Troubleshooting

**Error: "relation already exists"**
- Table is already created, you're good to go!

**Error: "permission denied"**
- Make sure you're running as database owner
- Or use Supabase SQL Editor which has proper permissions

**Still seeing 404 errors?**
- Supabase may need to refresh its schema cache
- Wait 30-60 seconds after creating the table
- Hard refresh browser (Ctrl+Shift+R)
- If still not working, restart Supabase project in dashboard

## What This Table Does

- Stores student submissions for assignments
- Tracks submission dates and file paths
- Stores teacher feedback and scores
- One record per student per assignment (UNIQUE constraint)
- Auto-timestamps for audit trail

## Related Files

- Migration: `scripts/migration/add-student-assignment-grades-table.sql`
- Service: `src/services/assignmentsServicePostgreSQL.ts`
- Hook: `src/hooks/useAssignmentsPostgreSQL.ts`
- Component: `components/AssignmentsView.tsx`
