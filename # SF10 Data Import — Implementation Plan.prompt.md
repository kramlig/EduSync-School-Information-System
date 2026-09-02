# SF10 Data Import — Implementation Plan

## Goal
Allow client to provide live student data via Excel spreadsheet, import it into the system, and generate SF10 (Form 137 - Learner's Permanent Academic Record).

## Prerequisites
- Client provides Excel file with columns: LRN, Student Name, Grade Level, Section, Adviser, School Year, Subject, Q1, Q2, Q3, Q4
- System already has Form137 generator and dashboard at `/reports/form137`

## Steps

### 1. Generate Excel Template
- Create `generate-sf10-template.cjs` script
- Columns: LRN, Student Name, Grade Level, Section, Adviser, School Year, Subject, Q1–Q4
- Include sample rows for reference
- Client fills in and returns

### 2. Build Import Script
- Create `scripts/import-sf10-data.cjs`
- Read client's filled Excel using `xlsx` package
- Parse rows, group by student (LRN)
- For each student:
  - Upsert into `students` table (LRN, name, grade level)
  - Upsert into `sections` table (section name, grade level, school year)
  - Upsert into `teachers` table (adviser name)
  - Link section → adviser
  - Upsert into `learning_areas` table (subject names)
  - Insert into `grades` table (Q1, Q2, Q3, Q4 per subject)
- Validate: no blank LRNs, grades 0–100, required columns present
- Dry-run mode by default, `--dry-run=false` to commit

### 3. Trigger Form 137 Generation
- After import, call existing `generateForm137FromSystemData()` per student
- Or rely on the Form137Dashboard UI to generate on demand
- Verify output renders correctly in `/reports/form137`

### 4. Optional Enhancements
- Add attendance columns (Days of School, Days Present) to template
- Add core values columns (Maka-Diyos, Makatao, Makakalikasan, Makabansa)
- Add birth date, gender, address columns for demographics
- Build a UI-based import (drag & drop Excel in the dashboard)

## Data Flow
```
Client Excel → import script → PostgreSQL (students, grades, sections, teachers, learning_areas) → Form137 generator → SF10 output
```

## Validation Rules
- LRN must be 12 digits
- Grades must be numeric, 0–100
- Grade Level must be 1–12
- School Year format: YYYY-YYYY
- No duplicate subject rows per student per school year

## Files to Create/Modify
- `generate-sf10-template.cjs` — Excel template generator
- `scripts/import-sf10-data.cjs` — Main import script
- No changes needed to existing Form137 components (they already work)
