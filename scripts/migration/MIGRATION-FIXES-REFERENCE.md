# PostgreSQL Migration - Common Issues & Fixes

This document captures all SQL errors encountered during migration and their solutions for future reference.

## Schema Mismatches (Table Column Differences)

### ❌ Issue 1: Column "age" doesn't exist in students table

**Error:**
```
ERROR: 42703: column "age" does not exist
```

**Root Cause:** 
Firestore stored age as a calculated field, PostgreSQL schema only has `date_of_birth`

**Fix:**
```sql
-- ❌ WRONG:
INSERT INTO students (..., age, ...)
VALUES (..., 6, ...)

-- ✅ CORRECT:
INSERT INTO students (..., date_of_birth, grade_level, ...)
VALUES (..., '2018-03-15'::DATE, 1, ...)
```

**Note:** Age is calculated from `date_of_birth` when needed, not stored.

---

### ❌ Issue 2: Column "academic_year" doesn't exist in students table

**Error:**
```
ERROR: 42703: column "academic_year" does not exist
```

**Root Cause:** 
Students table doesn't track academic year per student (tracked in sections/grades instead)

**Fix:**
```sql
-- ❌ WRONG:
INSERT INTO students (..., academic_year, ...)
VALUES (..., '2024-2025', ...)

-- ✅ CORRECT:
-- Remove academic_year column entirely
-- School year tracked in grades table instead
INSERT INTO grades (..., school_year, ...)
VALUES (..., '2024-2025', ...)
```

---

### ❌ Issue 3: Missing "name" column in students table

**Error:**
```
ERROR: 23502: null value in column "name" violates not-null constraint
```

**Root Cause:** 
Students table requires full name concatenation for search/display

**Fix:**
```sql
-- ❌ WRONG:
INSERT INTO students (first_name, middle_name, last_name)
VALUES ('Juan', 'Reyes', 'Santos')

-- ✅ CORRECT:
INSERT INTO students (first_name, middle_name, last_name, name)
VALUES ('Juan', 'Reyes', 'Santos', 'Juan Reyes Santos')
```

---

### ❌ Issue 4: Column "section_id" doesn't exist in grades table

**Error:**
```
ERROR: 42703: column "section_id" of relation "grades" does not exist
```

**Root Cause:** 
Grades are linked to students (who already have section_id), not directly to sections

**Fix:**
```sql
-- ❌ WRONG:
INSERT INTO grades (school_id, student_id, section_id, learning_area_id, quarter, q1)

-- ✅ CORRECT:
INSERT INTO grades (school_id, student_id, learning_area_id, school_year, q1)
-- Section determined via student.section_id
```

---

### ❌ Issue 5: Column "quarter" doesn't exist in grades table

**Error:**
```
ERROR: 42703: column "quarter" of relation "grades" does not exist
```

**Root Cause:** 
Quarters are stored as separate columns (q1, q2, q3, q4), not as a discriminator field

**Fix:**
```sql
-- ❌ WRONG:
INSERT INTO grades (..., quarter, q1)
VALUES (..., 1, 85)

-- ✅ CORRECT:
INSERT INTO grades (..., q1, q2, q3, q4)
VALUES (..., 85, NULL, NULL, NULL)
```

---

### ❌ Issue 6: Column "school_year" doesn't exist in class_schedules table

**Error:**
```
ERROR: 42703: column "school_year" of relation "class_schedules" does not exist
```

**Root Cause:** 
Class schedules don't track school year (schedules are per current year only)

**Fix:**
```sql
-- ❌ WRONG:
INSERT INTO class_schedules (school_id, section_id, ..., school_year)
VALUES (uuid, uuid, ..., '2024-2025')

-- ✅ CORRECT:
INSERT INTO class_schedules (school_id, section_id, teacher_id, day_of_week, start_time, end_time)
VALUES (uuid, uuid, uuid, 'Monday', '08:00', '09:00')
```

---

### ❌ Issue 7: Column "total_points" doesn't exist in assignments table

**Error:**
```
ERROR: 42703: column "total_points" of relation "assignments" does not exist
```

**Root Cause:** 
Assignments use `max_score` not `total_points`

**Fix:**
```sql
-- ❌ WRONG:
INSERT INTO assignments (..., total_points, assignment_type)
VALUES (..., 20, 'Homework')

-- ✅ CORRECT:
INSERT INTO assignments (..., max_score)
VALUES (..., 20)
-- Note: assignment_type column also doesn't exist
```

---

### ❌ Issue 8: Columns "indicators" and "indicator_ratings" don't exist initially

**Error:**
```
ERROR: 42703: column "indicators" does not exist
ERROR: 42703: column "indicator_ratings" of relation "core_value_grades" does not exist
```

**Root Cause:** 
Initial schema didn't include behavioral indicators (added later as enhancement)

**Fix:**
```sql
-- Step 1: Add columns first
ALTER TABLE core_values ADD COLUMN IF NOT EXISTS indicators TEXT[];
ALTER TABLE core_value_grades ADD COLUMN IF NOT EXISTS indicator_ratings JSONB;

-- Step 2: Then insert/update data
UPDATE core_values SET indicators = ARRAY[
  'Indicator 1 text',
  'Indicator 2 text'
] WHERE code = 'MAKA_DIYOS';
```

---

## Type Casting Issues

### ❌ Issue 9: UNION type mismatch (date vs text)

**Error:**
```
ERROR: 42804: UNION types date and text cannot be matched
```

**Root Cause:** 
First SELECT has `::DATE` cast, subsequent UNION ALL sections don't

**Fix:**
```sql
-- ❌ WRONG:
SELECT ..., '2018-03-15'::DATE as date_of_birth
UNION ALL
SELECT ..., '2018-05-20' as date_of_birth  -- Missing ::DATE

-- ✅ CORRECT:
SELECT ..., '2018-03-15'::DATE as date_of_birth
UNION ALL
SELECT ..., '2018-05-20'::DATE as date_of_birth  -- Added ::DATE
```

**Rule:** All UNION/UNION ALL branches must have identical column types.

---

### ❌ Issue 10: Attendance status needs enum cast

**Error:**
```
ERROR: 42804: column "status" is of type attendance_status but expression is of type character varying
```

**Root Cause:** 
Status column is ENUM type, needs explicit cast

**Fix:**
```sql
-- ❌ WRONG:
INSERT INTO attendance_records (..., status, ...)
VALUES (..., 'Present', ...)

-- ✅ CORRECT:
INSERT INTO attendance_records (..., status, ...)
VALUES (..., 'Present'::attendance_status, ...)

-- Or in CASE expression:
CASE 
  WHEN RANDOM() < 0.9 THEN 'Present'
  ELSE 'Absent'
END::attendance_status  -- Cast entire CASE result
```

---

### ❌ Issue 11: Core value rating needs enum cast

**Error:**
```
ERROR: invalid input value for enum core_value_rating
```

**Root Cause:** 
Core value ratings must be one of: 'AO', 'SO', 'RO', 'NO'

**Fix:**
```sql
-- ❌ WRONG:
INSERT INTO core_value_grades (..., q1, ...)
VALUES (..., 'Outstanding', ...)

-- ✅ CORRECT:
INSERT INTO core_value_grades (..., q1, ...)
VALUES (..., 'AO'::core_value_rating, ...)

-- With random selection:
(ARRAY['AO', 'SO', 'RO', 'NO'])[1 + floor(random() * 4)]::core_value_rating
```

---

## Data Integrity Issues

### ❌ Issue 12: Duplicate key constraint violation

**Error:**
```
ERROR: 23505: duplicate key value violates unique constraint
```

**Root Cause:** 
Test data from previous run still exists in database

**Fix:**
```sql
-- Always DELETE before INSERT when re-seeding:
DELETE FROM core_value_grades;
DELETE FROM grades;
DELETE FROM attendance_records;
DELETE FROM assignments;
DELETE FROM class_schedules;
DELETE FROM parent_students;
DELETE FROM parents;
DELETE FROM students;
DELETE FROM core_values;
DELETE FROM learning_areas;
DELETE FROM sections;
DELETE FROM teachers;
DELETE FROM users;
DELETE FROM schools;

-- Then do INSERT operations
```

**Note:** Delete in dependency order (children first, parents last).

---

## MAPEH Composite Grades Structure

### ✅ Correct MAPEH Implementation

**Firestore Structure (Old):**
```javascript
grade.q1 = {
  Music: 85,
  Arts: 90,
  "Physical Education": 88,
  Health: 92
}
```

**PostgreSQL Structure (New):**
```sql
-- learning_areas table:
INSERT INTO learning_areas (code, name, is_composite, components)
VALUES (
  'MAPEH',
  'MAPEH',
  true,
  ARRAY['Music', 'Arts', 'Physical Education', 'Health']
);

-- grades table:
INSERT INTO grades (learning_area_id, q1, composite_grades)
VALUES (
  (SELECT id FROM learning_areas WHERE code = 'MAPEH'),
  87.50,  -- Average of components
  jsonb_build_object(
    'q1', jsonb_build_object(
      'Music', 85,
      'Arts', 90,
      'Physical Education', 88,
      'Health', 92
    )
  )
);
```

**Access Pattern:**
```typescript
// Frontend:
const q1Music = grade.composite_grades?.q1?.Music;
const q2Arts = grade.composite_grades?.q2?.Arts;
```

---

## Core Values with Behavioral Indicators

### ✅ Correct Core Values Implementation

**DepEd Structure:**
Each core value has multiple behavioral indicators that are rated separately.

**Schema:**
```sql
-- core_values table:
CREATE TABLE core_values (
  code VARCHAR(20),
  name VARCHAR(100),
  description TEXT,
  indicators TEXT[],  -- Array of behavioral indicators
  display_order INTEGER
);

-- core_value_grades table:
CREATE TABLE core_value_grades (
  core_value_id UUID,
  q1 core_value_rating,  -- Overall quarter rating
  q2 core_value_rating,
  q3 core_value_rating,
  q4 core_value_rating,
  indicator_ratings JSONB  -- Per-indicator ratings
);
```

**Data:**
```sql
-- Insert core value with indicators:
INSERT INTO core_values (code, name, indicators)
VALUES (
  'MAKA_DIYOS',
  'Maka-Diyos',
  ARRAY[
    'Expresses one''s spiritual beliefs while respecting the spiritual beliefs of others',
    'Shows adherence to ethical principles by upholding truth'
  ]
);

-- Insert grade with indicator ratings:
INSERT INTO core_value_grades (core_value_id, q1, indicator_ratings)
VALUES (
  uuid,
  'AO',  -- Overall Q1 rating
  jsonb_build_object(
    'q1', jsonb_build_object(
      'Expresses one''s spiritual beliefs...', 'AO',
      'Shows adherence to ethical principles...', 'SO'
    )
  )
);
```

**Access Pattern:**
```typescript
// Frontend:
const overallQ1 = coreValueGrade.q1;  // 'AO'
const indicator1Q1 = coreValueGrade.indicator_ratings?.q1?.['Expresses one''s spiritual beliefs...'];  // 'AO'
const indicator2Q1 = coreValueGrade.indicator_ratings?.q1?.['Shows adherence to ethical principles...'];  // 'SO'
```

---

## Best Practices for Future Migrations

### 1. Always Check Schema First
```bash
# Before writing INSERT, check actual table structure:
\d+ table_name  # In psql
# Or query information_schema in Supabase SQL Editor
```

### 2. Use Explicit Type Casts
```sql
-- Good practice:
'2018-03-15'::DATE
'Present'::attendance_status
'AO'::core_value_rating
85::NUMERIC(5,2)
```

### 3. Test with Small Data First
```sql
-- Insert 1-2 records first to verify structure
-- Then scale up to full dataset
```

### 4. Delete Before Insert for Idempotency
```sql
-- Always start with DELETE to allow re-running script
DELETE FROM table_name WHERE condition;
INSERT INTO table_name (...) VALUES (...);
```

### 5. Use CTEs for Readability
```sql
WITH school AS (SELECT id FROM schools LIMIT 1),
     students AS (SELECT id FROM students WHERE grade_level = 1)
INSERT INTO grades (...)
SELECT ... FROM school, students;
```

### 6. Verify After Each Major Step
```sql
SELECT COUNT(*) FROM table_name;
SELECT * FROM table_name LIMIT 5;
```

---

## Migration Cheat Sheet

| Firestore Field | PostgreSQL Column | Notes |
|----------------|-------------------|-------|
| `age` | `date_of_birth` | Calculate age from DOB |
| `academic_year` (students) | N/A | Tracked in sections/grades |
| `quarter` (grades) | `q1`, `q2`, `q3`, `q4` | Separate columns |
| `section_id` (grades) | N/A | Via `students.section_id` |
| `total_points` (assignments) | `max_score` | Different naming |
| `assignment_type` | N/A | Column doesn't exist |
| `school_year` (schedules) | N/A | Not tracked in schedules |
| MAPEH grade object | `composite_grades` JSONB | Full quarter structure |
| Core values | `indicators` TEXT[] | Behavioral indicators array |
| Core value ratings | `indicator_ratings` JSONB | Per-indicator per-quarter |

---

## Quick Reference: Common Errors

```sql
-- Error: column "X" does not exist
-- Fix: Check schema, remove or rename column

-- Error: UNION types cannot be matched
-- Fix: Add ::TYPE cast to all UNION branches

-- Error: column "X" is of type Y but expression is of type Z
-- Fix: Add explicit cast with ::TYPE

-- Error: duplicate key value violates unique constraint
-- Fix: DELETE existing data before INSERT

-- Error: null value in column "X" violates not-null constraint
-- Fix: Provide value for required column

-- Error: invalid input value for enum
-- Fix: Use correct enum value ('AO' not 'Outstanding')
```

---

## Testing Queries

### Verify Data Integrity
```sql
-- Check student counts per section:
SELECT s.name, COUNT(st.id) as student_count
FROM sections s
LEFT JOIN students st ON st.section_id = s.id
GROUP BY s.id, s.name
ORDER BY s.grade_level, s.name;

-- Check grade completeness:
SELECT 
  st.name as student,
  COUNT(DISTINCT g.learning_area_id) as subjects_graded
FROM students st
LEFT JOIN grades g ON g.student_id = st.id
GROUP BY st.id, st.name
HAVING COUNT(DISTINCT g.learning_area_id) != 7  -- Should be 7 subjects
ORDER BY subjects_graded;

-- Check MAPEH composite grades:
SELECT 
  st.name,
  g.q1 as average_grade,
  g.composite_grades->'q1' as component_grades
FROM students st
JOIN grades g ON g.student_id = st.id
JOIN learning_areas la ON la.id = g.learning_area_id
WHERE la.code = 'MAPEH';

-- Check core value indicators:
SELECT 
  cv.code,
  cv.name,
  array_length(cv.indicators, 1) as indicator_count,
  cv.indicators
FROM core_values cv
ORDER BY cv.display_order;

-- Check indicator ratings:
SELECT 
  st.name as student,
  cv.name as core_value,
  cvg.q1 as overall_rating,
  cvg.indicator_ratings->'q1' as indicator_ratings
FROM students st
JOIN core_value_grades cvg ON cvg.student_id = st.id
JOIN core_values cv ON cv.id = cvg.core_value_id
WHERE st.grade_level = 1
LIMIT 10;
```

---

## Version History

- **v1.0** (Nov 18, 2025): Initial migration fixes documentation
  - Schema mismatches (8 issues)
  - Type casting (3 issues)
  - Data integrity (1 issue)
  - MAPEH composite structure
  - Core values behavioral indicators
