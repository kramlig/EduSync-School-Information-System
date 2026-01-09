# SF7 Import Module

## Overview

The SF7 Import Module enables Division Administrators to bulk import teacher/personnel data from DepEd LIS School Form 7 (SF7) CSV exports into EduSync. This module is designed to handle the initial population of teacher records for new schools joining the division, as well as updates to existing school personnel rosters.

## Features

- **CSV File Upload**: Drag-and-drop or file browser support for SF7 CSV files
- **Automatic Parsing**: Intelligent detection of SF7 format with column mapping
- **School Management**: Automatic school creation if school doesn't exist
- **Duplicate Detection**: Checks for existing employee numbers and emails
- **Position Mapping**: Standardizes position titles (Teacher I-III, Master Teacher, Head Teacher, Principal)
- **Employment Status Tracking**: Supports Permanent, Temporary, Contract, Substitute, and Volunteer status
- **Validation Preview**: Shows what will be imported before committing
- **Error Handling**: Detailed error reporting for failed imports

## Architecture

### Components

| File | Description |
|------|-------------|
| `src/services/sf7Parser.ts` | Parses SF7 CSV files into structured data |
| `src/services/sf7ImportService.ts` | PostgreSQL database operations for importing |
| `src/components/division/DivisionSF7Import.tsx` | React UI component |

### Data Flow

```
CSV File → sf7Parser → SF7ParseResult → previewSF7Import → User Review → importSF7 → PostgreSQL
```

## SF7 CSV Format

The SF7 parser expects the standard DepEd LIS export format:

### Header Section (Rows 1-6)
```
School Form 7 (SF7) - School Personnel Report
[blank]
School ID: 123456    Region: XI    Division: Davao de Oro    District: Mati
School Name: Sample Elementary School    School Year: 2024-2025
[Column Headers Row 1]
[Column Headers Row 2]
```

### Expected Columns
| Column | Description |
|--------|-------------|
| Employee Number | DepEd Employee ID |
| Name | Last Name, First Name Middle Name format |
| Position/Designation | Teacher I, Teacher II, Master Teacher, etc. |
| Employment Status | Permanent, Temporary, Contract, etc. |
| Date Hired | Employment start date |
| Highest Education | Educational attainment |
| Major/Specialization | Subject area or specialization |
| PRC License Number | Professional license number |
| Email | Contact email |
| Contact Number | Phone number |

## Teacher Position Types

| Database Value | Display Label |
|----------------|---------------|
| `teacher_i` | Teacher I |
| `teacher_ii` | Teacher II |
| `teacher_iii` | Teacher III |
| `master_teacher_i` | Master Teacher I |
| `master_teacher_ii` | Master Teacher II |
| `head_teacher_i` | Head Teacher I |
| `head_teacher_ii` | Head Teacher II |
| `head_teacher_iii` | Head Teacher III |
| `principal_i` | Principal I |
| `principal_ii` | Principal II |
| `principal_iii` | Principal III |
| `principal_iv` | Principal IV |
| `other` | Other |

## Employment Status Types

| Database Value | Display Label |
|----------------|---------------|
| `permanent` | Permanent |
| `temporary` | Temporary |
| `contract` | Contract/JO |
| `substitute` | Substitute |
| `volunteer` | Volunteer |

## Import Options

| Option | Default | Description |
|--------|---------|-------------|
| Create school if missing | ✓ | Creates new school record if School ID not found |
| Skip duplicate employee numbers | ✓ | Skips teachers with employee numbers already in database |
| Skip duplicate emails | ✓ | Skips teachers with emails already in database |
| Generate temporary emails | ✗ | Creates temporary email for teachers without email |

## Database Schema

Teachers are inserted into the `teachers` table:

```sql
INSERT INTO teachers (
  school_id,
  name,
  first_name,
  middle_name,
  last_name,
  email,
  employee_number,
  position,
  employment_status,
  date_hired,
  highest_education,
  major_specialization,
  prc_license_number,
  prc_license_expiry,
  contact_number,
  phone,
  role
) VALUES (...)
```

## Usage

### Accessing the Module

1. Log in as a Division Administrator
2. Navigate to **Division Portal** → **SF7 Import** in the sidebar
3. Or directly visit `/division/sf7-import`

### Import Process

1. **Upload**: Drag and drop or select your SF7 CSV file
2. **Preview**: Review the parsed data, including:
   - School information and status
   - Personnel summary (total, valid, invalid)
   - Position breakdown
   - Employment status breakdown
   - Duplicate detection results
3. **Configure**: Adjust import options as needed
4. **Import**: Click "Import X Teachers" to proceed
5. **Results**: View the import summary including:
   - Number imported
   - Number skipped (duplicates)
   - Number failed (validation errors)
   - List of imported teachers

## API Reference

### parseSF7(csvContent: string): SF7ParseResult

Parses SF7 CSV content into structured data.

**Returns:**
```typescript
{
  success: boolean;
  metadata: SF7Metadata | null;
  teachers: SF7Teacher[];
  maleCount: number;
  femaleCount: number;
  totalCount: number;
  errors: string[];
  warnings: string[];
}
```

### previewSF7Import(parseResult, schoolId?): Promise<PreviewResult>

Previews what will happen during import without making changes.

**Returns:**
```typescript
{
  schoolStatus: 'exists' | 'will_create' | 'provided' | 'error';
  schoolData: SchoolData | null;
  teachersToImport: number;
  duplicateEmployeeNumbers: number;
  duplicateEmails: number;
  invalidTeachers: SF7Teacher[];
}
```

### importSF7(parseResult, options): Promise<SF7ImportResult>

Executes the import operation.

**Returns:**
```typescript
{
  success: boolean;
  schoolId: string | null;
  schoolCreated: boolean;
  teachersImported: number;
  teachersSkipped: number;
  teachersFailed: number;
  errors: string[];
  warnings: string[];
  importedTeachers: Array<{ employeeNumber, name, id }>;
  skippedTeachers: Array<{ employeeNumber, name, reason }>;
  failedTeachers: Array<{ employeeNumber, name, error }>;
}
```

## Error Handling

### Common Parse Errors

| Error | Solution |
|-------|----------|
| "Invalid CSV format" | Ensure file is valid CSV from DepEd LIS |
| "Could not find school metadata" | Check that header rows contain school info |
| "No teacher data found" | Verify CSV contains data rows after headers |

### Common Import Errors

| Error | Solution |
|-------|----------|
| "School not found" | Enable "Create school if missing" option |
| "Employee number already exists" | Enable "Skip duplicate employee numbers" |
| "Email already exists" | Enable "Skip duplicate emails" |
| "Invalid teacher data" | Check validation errors in preview |

## Security Considerations

- Division users can only import to schools in their division
- Imports are logged in the audit trail
- Teachers are created without Firebase accounts (no login access until accounts are created)
- Temporary emails (if enabled) use `@temp.edusync.ph` domain

## Related Modules

- [SF1 Import](./SF1_IMPORT_MODULE.md) - Student enrollment import
- [SF7 Dashboard](./SF7_DASHBOARD.md) - Personnel report viewing
- [Division Personnel](./DIVISION_PERSONNEL.md) - Teacher management
