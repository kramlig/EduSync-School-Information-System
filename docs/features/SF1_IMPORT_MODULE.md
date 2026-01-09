# SF1 Import Module - Division Level

## Overview

The SF1 Import Module allows Division Administrators to import student enrollment data from DepEd LIS (Learner Information System) SF1 CSV exports. This module handles the **bootstrap scenario** where a new school needs to be created along with its sections and students.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SF1 IMPORT FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. UPLOAD               2. PARSE                 3. VALIDATE               │
│  ┌─────────────┐        ┌─────────────┐          ┌─────────────┐           │
│  │ CSV File    │───────>│ sf1Parser   │─────────>│ Check LRNs  │           │
│  │ from LIS    │        │ Extract:    │          │ Check School│           │
│  └─────────────┘        │ - Metadata  │          │ Check Section│          │
│                         │ - Students  │          └──────┬──────┘           │
│                         └─────────────┘                 │                   │
│                                                         ▼                   │
│  4. DECISION             5. CREATE                6. IMPORT                 │
│  ┌─────────────┐        ┌─────────────┐          ┌─────────────┐           │
│  │ School      │───────>│ Create:     │─────────>│ Bulk Insert │           │
│  │ Exists?     │  No    │ - School    │          │ Students    │           │
│  │             │───────>│ - Section   │          │             │           │
│  └─────────────┘  Yes   └─────────────┘          └─────────────┘           │
│        │                                                │                   │
│        └────────────────────────────────────────────────┘                   │
│                                                         │                   │
│  7. REPORT                                              ▼                   │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │ Import Summary:                                              │           │
│  │ - New students created: 26                                   │           │
│  │ - Duplicates skipped: 0                                      │           │
│  │ - Invalid records: 0                                         │           │
│  │ - School created: Yes (Onotan Daganio Tagbobolo ES)         │           │
│  │ - Section created: Yes (Grade 1 - HOPE)                      │           │
│  └─────────────────────────────────────────────────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Permission Matrix

| Role              | Can Import? | School Scope              | Can Create School? |
|-------------------|-------------|---------------------------|-------------------|
| Superadmin        | ✅ Yes      | Any school in any division | ✅ Yes           |
| Division Admin    | ✅ Yes      | Any school in division     | ✅ Yes           |
| Division Supervisor| ✅ Yes     | Any school in division     | ❌ No (link only)|
| School Admin      | ✅ Yes      | Own school only           | ❌ No            |
| Teacher           | ❌ No       | N/A                       | ❌ No            |

## Data Mapping

### SF1 CSV → PostgreSQL Tables

| SF1 Field              | PostgreSQL Column       | Table      |
|------------------------|------------------------|------------|
| School ID              | school_id_number       | schools    |
| School Name            | name                   | schools    |
| Region                 | region                 | schools    |
| Division               | division               | schools    |
| District               | district               | schools    |
| School Year            | current_school_year    | schools    |
| Grade Level            | grade_level            | sections   |
| Section                | name                   | sections   |
| LRN                    | lrn                    | students   |
| Name (LAST,FIRST,MI)   | first_name, middle_name, last_name | students |
| Sex                    | gender                 | students   |
| Birth Date             | date_of_birth          | students   |
| Address (combined)     | address                | students   |
| Father Name            | name + relationship    | parents    |
| Mother Name            | name + relationship    | parents    |
| Guardian Name          | name + relationship    | parents    |
| Contact Number         | contact_number         | students/parents |

### School Creation Logic

```typescript
// If school doesn't exist, create with these defaults:
{
  name: metadata.schoolName,
  school_id_number: metadata.schoolId,    // DepEd School ID
  division: metadata.division,
  region: metadata.region,
  district: metadata.district,
  current_school_year: metadata.schoolYear,
  settings: {
    imported_from_sf1: true,
    import_date: new Date().toISOString()
  }
}
```

### Section Creation Logic

```typescript
// Always create section if it doesn't exist for the school+grade+year
{
  school_id: schoolUUID,
  name: metadata.sectionName,        // e.g., "HOPE"
  grade_level: metadata.gradeLevel,  // e.g., 1
  school_year: metadata.schoolYear   // e.g., "2025-2026"
}
```

## File Structure

```
src/
├── components/
│   └── division/
│       └── DivisionSF1Import.tsx    # Main import UI component
├── services/
│   ├── sf1Parser.ts                 # CSV parsing (existing)
│   └── sf1ImportService.ts          # Database operations (new)
└── types/
    └── sf1Import.ts                 # TypeScript types (if needed)
```

## Database Operations (Transactional)

All import operations are wrapped in a transaction to ensure data integrity:

```sql
BEGIN;

-- 1. Check/Create School
INSERT INTO schools (...) 
ON CONFLICT (school_id_number) DO UPDATE SET updated_at = NOW()
RETURNING id;

-- 2. Check/Create Section
INSERT INTO sections (school_id, name, grade_level, school_year)
VALUES ($1, $2, $3, $4)
ON CONFLICT (school_id, grade_level, name, school_year) DO NOTHING
RETURNING id;

-- 3. Bulk Insert Students
INSERT INTO students (school_id, section_id, lrn, first_name, ...)
SELECT * FROM unnest($1::student_row[])
ON CONFLICT (lrn) DO NOTHING;

-- 4. Create Parent Records (optional)
INSERT INTO parents (school_id, name, relationship, ...)
...

-- 5. Link Parents to Students
INSERT INTO parent_students (parent_id, student_id, relationship)
...

COMMIT;
```

## UI Components

### Main Import Page (`/division/sf1-import`)

1. **Upload Zone**
   - Drag-and-drop CSV file
   - File type validation
   - File size limit (10MB)

2. **Preview Panel**
   - Parsed metadata (School, Section, Grade Level, SY)
   - Student count (Male/Female/Total)
   - Sample student records

3. **Validation Panel**
   - School status (✅ Exists / ⚠️ Will be created)
   - Section status (✅ Exists / ⚠️ Will be created)
   - Duplicate LRNs (existing in database)
   - Invalid records (missing required fields)

4. **Import Actions**
   - "Import All Valid" button
   - "Download Error Report" (for invalid records)
   - Progress indicator

5. **Results Summary**
   - Students created
   - Students skipped (duplicates)
   - Errors encountered
   - Navigation to new section/school

## Error Handling

| Error Type           | Handling                                    |
|---------------------|---------------------------------------------|
| Invalid CSV format  | Show parser errors, reject file             |
| Missing School ID   | Allow manual entry or reject                |
| Missing Section     | Reject file (section name required)         |
| Duplicate LRN       | Skip student, log in report                 |
| Invalid birth date  | Import with null, warn user                 |
| Missing name        | Skip student, log in report                 |
| Database error      | Rollback transaction, show error            |

## Import History (Future)

Track all imports for audit purposes:

```sql
CREATE TABLE sf1_import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id UUID REFERENCES divisions(id),
  school_id UUID REFERENCES schools(id),
  imported_by UUID REFERENCES users(id),
  
  file_name VARCHAR(255),
  school_year VARCHAR(10),
  grade_level INTEGER,
  section_name VARCHAR(100),
  
  students_imported INTEGER,
  students_skipped INTEGER,
  students_failed INTEGER,
  
  import_data JSONB, -- Full parse result for debugging
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Usage Example

1. Division Admin logs into EduSync
2. Navigates to Division Portal → SF1 Import
3. Uploads `SF1_Grade1_HOPE_2025-2026.csv` from DepEd LIS
4. System shows:
   - School: Onotan Daganio Tagbobolo ES (ID: 129386) - **NEW**
   - Section: Grade 1 - HOPE - **NEW**
   - Students: 26 (16 Male, 10 Female)
   - Duplicates: 0
5. Admin clicks "Import All"
6. System creates school, section, and 26 students
7. Admin sees success report and can navigate to new school

## Security Considerations

1. **File Validation**: Only accept CSV files, max 10MB
2. **Permission Check**: Verify user has division admin access
3. **School Ownership**: Verify school belongs to user's division (or create new)
4. **LRN Uniqueness**: LRN is unique across all schools (DepEd standard)
5. **Transaction Safety**: All-or-nothing import prevents partial data

## Related Files

- [src/services/sf1Parser.ts](../../src/services/sf1Parser.ts) - CSV Parser
- [src/services/sf1ImportService.ts](../../src/services/sf1ImportService.ts) - Import Service
- [src/components/division/DivisionSF1Import.tsx](../../src/components/division/DivisionSF1Import.tsx) - UI Component
