# DepEd School Forms Implementation Plan

> **Document Version:** 1.0  
> **Created:** January 11, 2026  
> **Last Updated:** January 11, 2026  
> **Status:** Active Development

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Grade Level Categories](#grade-level-categories)
3. [Complete Forms Matrix](#complete-forms-matrix)
4. [Current Implementation Status](#current-implementation-status)
5. [Implementation Phases](#implementation-phases)
6. [Database Schema Requirements](#database-schema-requirements)
7. [Progress Tracker](#progress-tracker)
8. [Technical Notes](#technical-notes)

---

## Overview

This document outlines the complete implementation plan for all official DepEd School Forms required for EBEIS (Enhanced Basic Education Information System) compliance. The forms are categorized by grade level: Kindergarten (K), Elementary School (ES), Junior High School (JHS), and Senior High School (SHS).

### Key Objectives
- ✅ Complete coverage of all 12 official DepEd forms
- ✅ Support for all grade level variants (K, ES, JHS, SHS)
- ✅ EBEIS-compliant data export
- ✅ Print-ready PDF generation

---

## Grade Level Categories

| Code | Grade Level | Grades | Notes |
|------|-------------|--------|-------|
| **K** | Kindergarten | Kinder | 1 year program |
| **ES** | Elementary School | Grades 1-6 | 6 years |
| **JHS** | Junior High School | Grades 7-10 | 4 years |
| **SHS** | Senior High School | Grades 11-12 | 2 years, Track/Strand based |

### SHS Tracks & Strands
- **Academic Track:** ABM, HUMSS, STEM, GAS
- **TVL Track:** Home Economics, ICT, Industrial Arts, Agri-Fishery
- **Sports Track**
- **Arts & Design Track**

---

## Complete Forms Matrix

### Official DepEd School Forms (per DO 58, s. 2017)

| # | Form Code | Form Name | K | ES | JHS | SHS |
|---|-----------|-----------|:-:|:--:|:---:|:---:|
| 1 | **SF1** | School Register | - | SF1 | SF1 | SF1-SHS |
| 2 | **SF2** | Learner Daily Attendance Report | - | SF2 | SF2 | SF2-SHS |
| 3 | **SF3** | Books Issued and Returned | - | SF3 | SF3 | SF3-SHS |
| 4 | **SF4** | Monthly Learner Movement and Attendance | - | SF4 | SF4 | SF4-SHS |
| 5 | **SF5** | Report on Promotion and Level of Proficiency | SF5-K | SF5 | SF5 | - |
| 6 | **SF5A** | End of Semester and School Year Learner Status | - | - | - | SF5A-SHS |
| 7 | **SF5B** | Learners with Complete SHS Requirements | - | - | - | SF5B-SHS |
| 8 | **SF6** | Summarized Report on Promotion and Proficiency | - | SF6 | SF6 | SF6-SHS |
| 9 | **SF7** | School Personnel Assignment List and Basic Profile | - | SF7 | SF7 | SF7-SHS |
| 10 | **SF8** | Learner's Basic Health and Nutrition Report | SF8 | SF8 | SF8 | SF8-SHS |
| 11 | **SF9** | Learner's Progress Report Card | - | SF9-ES | SF9-JHS | SF9-SHS |
| 12 | **SF10** | Learner's Permanent Academic Record | - | SF10-ES | SF10-JHS | SF10-SHS |

### Total Variants Required: **22 form variants**

---

## Current Implementation Status

### ✅ Implemented (11 variants)

| Form | Variant | Route | Status | Notes |
|------|---------|-------|--------|-------|
| SF1 | ES/JHS | `/reports/school-forms/sf1` | ✅ Complete | Enrollment record |
| SF2 | ES/JHS | `/reports/school-forms/sf2` | ✅ Complete | Daily attendance |
| SF3 | ES/JHS | `/reports/sf3` | ✅ Complete | Book inventory |
| SF4 | ES/JHS | `/reports/sf4` | ✅ Complete | Monthly movement |
| SF5 | ES/JHS | `/reports/sf5` | ✅ Complete | Promotion report |
| SF5-K | K | `/reports/sf5k` | ✅ Complete | Kindergarten proficiency |
| SF6 | ES/JHS | `/reports/sf6` | ✅ Complete | Summarized promotion |
| SF7 | ES/JHS | `/reports/sf7` | ✅ Complete | Personnel list |
| SF9 | ES/JHS | `/reports/school-forms/sf9` | ✅ Complete | Report card |
| Form 137 | All | `/reports/form137` | ✅ Complete | Permanent record (legacy) |
| Form 138 | All | `/reports/form138` | ✅ Complete | Report card (legacy) |

### ❌ Missing (11 variants)

| Form | Variant | Priority | Effort | Dependencies |
|------|---------|----------|--------|--------------|
| **SF8** | K/ES/JHS/SHS | 🔴 High | Medium | New DB table |
| **SF10** | ES/JHS/SHS | 🔴 High | High | Existing grades data |
| **SF1-SHS** | SHS | 🟡 Medium | Low | Track/Strand support |
| **SF2-SHS** | SHS | 🟡 Medium | Low | Semester-based |
| **SF3-SHS** | SHS | 🟢 Low | Low | Same as ES/JHS |
| **SF4-SHS** | SHS | 🟡 Medium | Low | Same as ES/JHS |
| **SF5A-SHS** | SHS | 🟡 Medium | Medium | Semester status |
| **SF5B-SHS** | SHS | 🟡 Medium | Medium | Graduation check |
| **SF6-SHS** | SHS | 🟢 Low | Low | Same as ES/JHS |
| **SF7-SHS** | SHS | 🟢 Low | Low | Same as ES/JHS |
| **SF9-SHS** | SHS | 🟡 Medium | Medium | Semester grades |

---

## Implementation Phases

### Phase 1: Critical Missing Forms (Priority: HIGH)
**Target:** January 2026  
**Goal:** Implement completely missing forms that affect compliance

| Task | Form | Description | Est. Days | Status |
|------|------|-------------|-----------|--------|
| 1.1 | SF8 | Health & Nutrition Report | 3-4 days | ✅ Complete |
| 1.2 | SF10 | Permanent Academic Record (→ Form137) | 1 day | ✅ Complete |

**Note:** SF10 (Learner's Permanent Academic Record) is the same as Form 137. 
The existing Form137Dashboard fully supports ES/JHS/SHS variants.
SF10 card added to School Forms Dashboard linking to `/reports/form137`.

**Deliverables:**
- [x] `student_health_records` database table
- [x] SF8Dashboard component (all grade levels)
- [x] SF10 → Form137Dashboard (ES/JHS/SHS via existing implementation)
- [x] Health data entry UI for nurses/teachers
- [ ] Print-ready PDF export (existing Form137 has print support)

---

### Phase 2: SHS Support (Priority: MEDIUM) ✅ COMPLETE
**Target:** February 2026 → **Completed:** January 13, 2026  
**Goal:** Add Senior High School variants for all forms

| Task | Form | Description | Est. Days | Status |
|------|------|-------------|-----------|--------|
| 2.1 | SF1-SHS | SHS School Register | 1-2 days | ✅ Complete |
| 2.2 | SF2-SHS | SHS Daily Attendance | 1-2 days | ✅ Complete |
| 2.3 | SF5A-SHS | End of Semester Status | 2-3 days | ✅ Complete |
| 2.4 | SF5B-SHS | SHS Completion List | 2-3 days | ✅ Complete |
| 2.5 | SF9-SHS | SHS Progress Report | 2-3 days | ✅ Complete |

**Deliverables:**
- [x] Track/Strand selection in student enrollment (via useSHSPostgreSQL hook)
- [x] Semester-based grading for SHS (useSHSSemesterGrades hook)
- [x] SHS-specific form templates (5 dashboards created)
- [x] Graduation requirements checker (SF5B-SHS with useSHSCompletion hook)

**New Files Created:**
- `src/hooks/useSHSPostgreSQL.ts` - SHS data hooks
- `components/forms/SchoolForms/SF1SHSDashboard.tsx` - SHS School Register
- `components/forms/SchoolForms/SF2SHSDashboard.tsx` - SHS Daily Attendance
- `components/forms/SchoolForms/SF5ASHSDashboard.tsx` - End of Semester Status
- `components/forms/SchoolForms/SF5BSHSDashboard.tsx` - SHS Completers
- `components/forms/SchoolForms/SF9SHSDashboard.tsx` - SHS Progress Report Card
- `scripts/migration/add-shs-track-strand-support.sql` - Database migration (pending execution)

---

### Phase 3: SHS Variants (Priority: LOW)
**Target:** March 2026  
**Goal:** Complete remaining SHS form variants

| Task | Form | Description | Est. Days | Status |
|------|------|-------------|-----------|--------|
| 3.1 | SF3-SHS | SHS Book Inventory | 1 day | ⬜ Not Started |
| 3.2 | SF4-SHS | SHS Movement Report | 1 day | ⬜ Not Started |
| 3.3 | SF6-SHS | SHS Summarized Report | 1 day | ⬜ Not Started |
| 3.4 | SF7-SHS | SHS Personnel List | 1 day | ⬜ Not Started |

**Deliverables:**
- [ ] SHS filter option in existing dashboards
- [ ] SHS-specific export templates

---

### Phase 4: Enhancements & Polish
**Target:** April 2026  
**Goal:** Final polish and EBEIS integration

| Task | Description | Est. Days | Status |
|------|-------------|-----------|--------|
| 4.1 | EBEIS Export | Bulk export all forms in EBEIS format | 3-4 days | ⬜ Not Started |
| 4.2 | Form Validation | Data completeness checks | 2 days | ⬜ Not Started |
| 4.3 | Batch Print | Print all forms for a section/grade | 2 days | ⬜ Not Started |
| 4.4 | Historical Data | View/print forms from previous years | 2 days | ⬜ Not Started |

---

## Database Schema Requirements

### New Tables Required

#### 1. `student_health_records` (for SF8)

```sql
CREATE TABLE student_health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id),
  student_id UUID REFERENCES students(id),
  school_year VARCHAR(20) NOT NULL,
  assessment_date DATE NOT NULL,
  
  -- Physical Measurements
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(5,2),
  bmi DECIMAL(4,2),
  bmi_category VARCHAR(30), -- 'Severely Wasted', 'Wasted', 'Normal', 'Overweight', 'Obese'
  
  -- Nutritional Status
  nutritional_status VARCHAR(30), -- 'Normal', 'Malnourished', 'Severely Malnourished', 'Overweight', 'Obese'
  
  -- Health Screening
  vision_left VARCHAR(20),
  vision_right VARCHAR(20),
  hearing_left VARCHAR(20),
  hearing_right VARCHAR(20),
  oral_health VARCHAR(50),
  
  -- Deworming
  deworming_1st_dose DATE,
  deworming_2nd_dose DATE,
  
  -- Immunization
  immunization_status VARCHAR(50),
  
  -- Medical Conditions
  medical_conditions TEXT[],
  allergies TEXT[],
  
  -- Remarks
  remarks TEXT,
  
  -- Metadata
  assessed_by UUID REFERENCES teachers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id, school_year)
);

CREATE INDEX idx_health_records_student ON student_health_records(student_id);
CREATE INDEX idx_health_records_school_year ON student_health_records(school_year);
```

#### 2. `shs_enrollment_details` (for SHS forms)

```sql
CREATE TABLE shs_enrollment_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  school_year VARCHAR(20) NOT NULL,
  
  -- SHS Specific
  track VARCHAR(50), -- 'Academic', 'TVL', 'Sports', 'Arts & Design'
  strand VARCHAR(50), -- 'ABM', 'HUMSS', 'STEM', 'GAS', 'HE', 'ICT', etc.
  specialization VARCHAR(100),
  
  -- Semester tracking
  semester INTEGER, -- 1 or 2
  
  -- Status
  status VARCHAR(30) DEFAULT 'enrolled',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id, school_year, semester)
);
```

### Existing Tables to Modify

```sql
-- Add SHS fields to students table (if not exists)
ALTER TABLE students ADD COLUMN IF NOT EXISTS track VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS strand VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS specialization VARCHAR(100);
```

---

## Progress Tracker

### Overall Progress

```
╔═══════════════════════════════════════════════════════════════╗
║                    DEPED FORMS PROGRESS                        ║
╠═══════════════════════════════════════════════════════════════╣
║  Total Forms Required:     22 variants                         ║
║  Currently Implemented:    11 variants                         ║
║  Missing/In Progress:      11 variants                         ║
║                                                                 ║
║  [████████████░░░░░░░░░░░░] 50% Complete                       ║
╚═══════════════════════════════════════════════════════════════╝
```

### Phase Progress

| Phase | Description | Progress | Status |
|-------|-------------|----------|--------|
| Phase 1 | Critical Missing Forms | 1/4 | 🟡 In Progress |
| Phase 2 | SHS Support | 0/5 | ⬜ Not Started |
| Phase 3 | SHS Variants | 0/4 | ⬜ Not Started |
| Phase 4 | Enhancements | 0/4 | ⬜ Not Started |

### Detailed Checklist

#### Phase 1: Critical Missing Forms
- [x] **SF8 - Health & Nutrition Report**
  - [x] Create database migration for `student_health_records`
  - [x] Create `useStudentHealthPostgreSQL` hook
  - [x] Create `SF8Dashboard` component
  - [x] Create health data entry form
  - [x] Create BMI calculator utility
  - [x] Add print/export functionality
  - [ ] Test with Kinder, ES, JHS, SHS data
  - [ ] Run database migration in production
  
- [ ] **SF10 - Permanent Academic Record**
  - [ ] Create `SF10Dashboard` component
  - [ ] Create ES variant (SF10-ES)
  - [ ] Create JHS variant (SF10-JHS)
  - [ ] Create SHS variant (SF10-SHS)
  - [ ] Add cumulative grade history
  - [ ] Add print/export functionality

#### Phase 2: SHS Support
- [ ] **SF1-SHS** - Add Track/Strand columns
- [ ] **SF2-SHS** - Semester-based attendance
- [ ] **SF5A-SHS** - End of semester status
- [ ] **SF5B-SHS** - Graduation candidates
- [ ] **SF9-SHS** - Semester report card

#### Phase 3: SHS Variants
- [ ] **SF3-SHS** - SHS book inventory
- [ ] **SF4-SHS** - SHS movement report
- [ ] **SF6-SHS** - SHS summarized report
- [ ] **SF7-SHS** - SHS personnel

#### Phase 4: Enhancements
- [ ] EBEIS bulk export
- [ ] Form validation rules
- [ ] Batch printing
- [ ] Historical data access

---

## Technical Notes

### Component Naming Convention

```
SF{number}Dashboard.tsx     - Main dashboard component
SF{number}View.tsx          - Detail/view component
SF{number}Print.tsx         - Print-optimized component
SF{number}Export.tsx        - Export utilities
```

### Route Naming Convention

```
/reports/school-forms/sf{number}           - ES/JHS forms
/reports/school-forms/sf{number}-shs       - SHS variants
/reports/school-forms/sf{number}-k         - Kindergarten variants
```

### File Locations

```
components/
├── forms/
│   ├── SchoolForms/
│   │   ├── SF1Dashboard.tsx
│   │   ├── SF2Dashboard.tsx
│   │   ├── SF8Dashboard.tsx      (to be created)
│   │   ├── SF10Dashboard.tsx     (to be created)
│   │   └── ...
│   └── shared/
│       ├── FormHeader.tsx
│       └── FormPrintLayout.tsx
└── src/
    ├── components/
    │   └── deped-forms/
    │       ├── SF3Dashboard.tsx
    │       └── ...
    └── hooks/
        ├── useStudentHealthPostgreSQL.ts  (to be created)
        └── ...
```

### Dependencies on Other Features

| Form | Dependencies |
|------|--------------|
| SF1 | Students, Sections, Enrollment |
| SF2 | Attendance records |
| SF3 | Textbook inventory |
| SF4 | Student movement tracking |
| SF5 | Grades, Promotion rules |
| SF6 | Aggregated SF5 data |
| SF7 | Teachers, Assignments |
| SF8 | **NEW: Health records** |
| SF9 | Grades, Core Values |
| SF10 | Complete grade history |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 11, 2026 | System | Initial document creation |
| 1.1 | Jan 11, 2026 | System | SF8 implementation complete (code ready, pending DB migration) |

---

## Next Steps

1. **Immediate:** Start Phase 1 with SF8 implementation
2. **Review:** Database schema with team before migration
3. **Design:** UI mockups for health data entry
4. **Test:** With sample data from each grade level

---

*This document should be updated as implementation progresses.*
