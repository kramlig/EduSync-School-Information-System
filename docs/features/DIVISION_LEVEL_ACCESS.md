# Division-Level Access Feature

> **Status**: 🟡 In Progress (Phases 1-4 Complete, Phase 5 Remaining)  
> **Started**: December 7, 2025  
> **Last Updated**: December 8, 2025  
> **Progress**: ~80% Complete  
> **Owner**: Development Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Requirements](#business-requirements)
3. [Architecture Overview](#architecture-overview)
4. [Database Schema](#database-schema)
5. [Role & Permission Model](#role--permission-model)
6. [Module Access Matrix](#module-access-matrix)
7. [Implementation Phases](#implementation-phases)
8. [Technical Specifications](#technical-specifications)
9. [UI/UX Design](#uiux-design)
10. [Testing Strategy](#testing-strategy)
11. [Migration Plan](#migration-plan)
12. [Progress Tracking](#progress-tracking)
13. [Open Questions](#open-questions)
14. [Change Log](#change-log)

---

## Executive Summary

### Purpose
Implement Division-level access to allow DepEd Division Office personnel to view and manage data across multiple schools within their jurisdiction. This enables consolidated reporting, oversight, and data validation at the division level.

### Current State
- System operates at **school level** only
- Each user is bound to a single school
- No hierarchy above school level exists
- Reports are generated per-school only

### Target State
- **Multi-tenant hierarchy**: Region → Division → District → School
- Division users can view aggregated data across all schools in their division
- Consolidated DepEd forms and reports at division level
- Role-based access with granular permissions

### Key Benefits
- ✅ Consolidated enrollment reporting (SF5, SF6)
- ✅ Division-wide personnel oversight (SF7)
- ✅ Cross-school data validation
- ✅ Streamlined DepEd compliance reporting
- ✅ Reduced manual data aggregation

---

## Business Requirements

### Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-001 | Division users can log in with division-level credentials | High | ⬜ Todo |
| FR-002 | Division users can view list of all schools in their division | High | ⬜ Todo |
| FR-003 | Division users can view aggregated enrollment data | High | ⬜ Todo |
| FR-004 | Division users can view SF5/SF6 for any school | High | ⬜ Todo |
| FR-005 | Division users can view SF7 personnel across schools | High | ⬜ Todo |
| FR-006 | Division users can export consolidated reports | Medium | ⬜ Todo |
| FR-007 | Division users can compare metrics across schools | Medium | ⬜ Todo |
| FR-008 | Division superintendent can view financial summaries | Low | ⬜ Todo |
| FR-009 | Audit logging for division-level access | High | ⬜ Todo |
| FR-010 | Division admins can manage division users | Medium | ⬜ Todo |

### Non-Functional Requirements

| ID | Requirement | Target | Status |
|----|-------------|--------|--------|
| NFR-001 | Page load time for division dashboard | < 3 seconds | ⬜ Todo |
| NFR-002 | Support for divisions with up to 100 schools | Required | ⬜ Todo |
| NFR-003 | Data privacy compliance (RA 10173) | Required | ⬜ Todo |
| NFR-004 | Concurrent division users | Up to 50 | ⬜ Todo |
| NFR-005 | Report generation time | < 30 seconds | ⬜ Todo |

---

## Architecture Overview

### Current Hierarchy
```
┌─────────────────────────────────────────┐
│                 School                   │
│  ┌─────────┬─────────┬─────────────────┐│
│  │  Admin  │ Teacher │ Parent/Student  ││
│  └─────────┴─────────┴─────────────────┘│
└─────────────────────────────────────────┘
```

### Proposed Hierarchy
```
┌─────────────────────────────────────────────────────────────┐
│                          Region                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                       Division                          │ │
│  │  ┌────────────────────────────────────────────────────┐│ │
│  │  │ Superintendent │ Supervisor │ Analyst │ Viewer     ││ │
│  │  └────────────────────────────────────────────────────┘│ │
│  │  ┌─────────────────┐  ┌─────────────────┐             │ │
│  │  │    District A   │  │    District B   │  ...        │ │
│  │  │ ┌─────┐ ┌─────┐ │  │ ┌─────┐ ┌─────┐ │             │ │
│  │  │ │Sch 1│ │Sch 2│ │  │ │Sch 3│ │Sch 4│ │             │ │
│  │  │ └─────┘ └─────┘ │  │ └─────┘ └─────┘ │             │ │
│  │  └─────────────────┘  └─────────────────┘             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                           │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  SchoolContext  │  │ DivisionContext │  │    AuthContext   │  │
│  │   (existing)    │  │     (new)       │  │   (modified)     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│                         Services Layer                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  School Services│  │Division Services│  │ Aggregate Svc   │  │
│  │   (existing)    │  │     (new)       │  │     (new)       │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│                     Supabase (PostgreSQL)                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   RLS Policies  │  │  divisions tbl  │  │division_users   │  │
│  │   (modified)    │  │     (new)       │  │     (new)       │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### New Tables

#### `divisions`
```sql
CREATE TABLE divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,        -- e.g., 'DIV-NCR-001'
    name VARCHAR(255) NOT NULL,               -- e.g., 'Division of City Schools - Manila'
    region VARCHAR(100),                      -- e.g., 'NCR', 'Region IV-A'
    region_code VARCHAR(20),                  -- e.g., 'NCR', 'IV-A'
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    superintendent_name VARCHAR(255),
    superintendent_email VARCHAR(255),
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_divisions_code ON divisions(code);
CREATE INDEX idx_divisions_region ON divisions(region);
```

#### `division_users`
```sql
CREATE TABLE division_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,                -- 'superintendent', 'supervisor', 'analyst', 'viewer'
    employee_number VARCHAR(50),
    position_title VARCHAR(100),
    department VARCHAR(100),
    permissions JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(division_id, user_id)
);

CREATE INDEX idx_division_users_division ON division_users(division_id);
CREATE INDEX idx_division_users_user ON division_users(user_id);
CREATE INDEX idx_division_users_role ON division_users(role);
```

#### `districts` (Optional - for finer granularity)
```sql
CREATE TABLE districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    supervisor_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_districts_division ON districts(division_id);
```

### Modified Tables

#### `schools` (Add division reference)
```sql
ALTER TABLE schools 
ADD COLUMN division_id UUID REFERENCES divisions(id),
ADD COLUMN district_id UUID REFERENCES districts(id);

CREATE INDEX idx_schools_division_id ON schools(division_id);
CREATE INDEX idx_schools_district_id ON schools(district_id);
```

### Materialized Views (For Performance)

```sql
-- Aggregated enrollment by division
CREATE MATERIALIZED VIEW division_enrollment_summary AS
SELECT 
    s.division_id,
    d.name as division_name,
    s.current_school_year,
    COUNT(DISTINCT s.id) as total_schools,
    COUNT(DISTINCT st.id) as total_students,
    SUM(CASE WHEN st.sex = 'Male' THEN 1 ELSE 0 END) as male_count,
    SUM(CASE WHEN st.sex = 'Female' THEN 1 ELSE 0 END) as female_count
FROM schools s
JOIN divisions d ON s.division_id = d.id
LEFT JOIN students st ON st.school_id = s.id AND st.status = 'enrolled'
GROUP BY s.division_id, d.name, s.current_school_year;

CREATE UNIQUE INDEX idx_division_enrollment_summary 
ON division_enrollment_summary(division_id, current_school_year);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_division_summaries()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY division_enrollment_summary;
END;
$$ LANGUAGE plpgsql;
```

---

## Role & Permission Model

### Division Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **Superintendent** | Division head, full access | All modules, all schools, read/write |
| **Supervisor** | Area supervisors | Most modules, assigned area, read-only |
| **Analyst** | Data analysts, statisticians | Reports and data, all schools, read-only |
| **Viewer** | Limited access users | Basic reports only, read-only |

### Permission Structure

```typescript
interface DivisionPermissions {
  // School Access
  schools: {
    view: boolean;
    viewAll: boolean;           // All schools or assigned only
    manage: boolean;            // Create/update school records
  };
  
  // Student Data
  students: {
    viewAggregate: boolean;     // Aggregated counts only
    viewList: boolean;          // Student lists (no PII)
    viewDetails: boolean;       // Full student records
    export: boolean;
  };
  
  // Personnel Data
  personnel: {
    viewAggregate: boolean;
    viewList: boolean;
    viewDetails: boolean;
    export: boolean;
  };
  
  // School Forms
  schoolForms: {
    sf1: boolean;               // School Register
    sf2: boolean;               // Daily Attendance
    sf4: boolean;               // Monthly Movement
    sf5: boolean;               // Enrollment Report
    sf6: boolean;               // Summarized Enrollment
    sf7: boolean;               // Personnel Assignment
    sf9: boolean;               // Learner Progress
  };
  
  // Financial
  financial: {
    viewSummary: boolean;
    viewDetails: boolean;
  };
  
  // Reports
  reports: {
    generate: boolean;
    export: boolean;
    schedule: boolean;
  };
  
  // Administration
  admin: {
    manageDivisionUsers: boolean;
    viewAuditLog: boolean;
    configureSettings: boolean;
  };
}
```

### Default Permission Templates

```typescript
const PERMISSION_TEMPLATES: Record<DivisionRole, DivisionPermissions> = {
  superintendent: {
    schools: { view: true, viewAll: true, manage: true },
    students: { viewAggregate: true, viewList: true, viewDetails: true, export: true },
    personnel: { viewAggregate: true, viewList: true, viewDetails: true, export: true },
    schoolForms: { sf1: true, sf2: true, sf4: true, sf5: true, sf6: true, sf7: true, sf9: true },
    financial: { viewSummary: true, viewDetails: true },
    reports: { generate: true, export: true, schedule: true },
    admin: { manageDivisionUsers: true, viewAuditLog: true, configureSettings: true },
  },
  supervisor: {
    schools: { view: true, viewAll: true, manage: false },
    students: { viewAggregate: true, viewList: true, viewDetails: false, export: true },
    personnel: { viewAggregate: true, viewList: true, viewDetails: true, export: true },
    schoolForms: { sf1: true, sf2: true, sf4: true, sf5: true, sf6: true, sf7: true, sf9: true },
    financial: { viewSummary: false, viewDetails: false },
    reports: { generate: true, export: true, schedule: false },
    admin: { manageDivisionUsers: false, viewAuditLog: true, configureSettings: false },
  },
  analyst: {
    schools: { view: true, viewAll: true, manage: false },
    students: { viewAggregate: true, viewList: true, viewDetails: false, export: true },
    personnel: { viewAggregate: true, viewList: true, viewDetails: false, export: true },
    schoolForms: { sf1: true, sf2: false, sf4: true, sf5: true, sf6: true, sf7: true, sf9: false },
    financial: { viewSummary: false, viewDetails: false },
    reports: { generate: true, export: true, schedule: false },
    admin: { manageDivisionUsers: false, viewAuditLog: false, configureSettings: false },
  },
  viewer: {
    schools: { view: true, viewAll: true, manage: false },
    students: { viewAggregate: true, viewList: false, viewDetails: false, export: false },
    personnel: { viewAggregate: true, viewList: false, viewDetails: false, export: false },
    schoolForms: { sf1: true, sf2: false, sf4: true, sf5: true, sf6: true, sf7: false, sf9: false },
    financial: { viewSummary: false, viewDetails: false },
    reports: { generate: false, export: false, schedule: false },
    admin: { manageDivisionUsers: false, viewAuditLog: false, configureSettings: false },
  },
};
```

---

## Module Access Matrix

### DepEd School Forms

| Module | School Admin | Superintendent | Supervisor | Analyst | Viewer |
|--------|-------------|----------------|------------|---------|--------|
| **SF1** - School Register | ✅ Edit | 👁️ View | 👁️ View | 👁️ View | 👁️ View |
| **SF2** - Daily Attendance | ✅ Edit | 👁️ View | 👁️ View | ❌ | ❌ |
| **SF3** - Books Issued | ✅ Edit | 👁️ View | 👁️ View | 👁️ View | ❌ |
| **SF4** - Monthly Movement | ✅ Edit | 👁️ View | 👁️ View | 👁️ View | 👁️ View |
| **SF5** - Enrollment Report | ✅ Edit | 👁️ View | 👁️ View | 👁️ View | 👁️ View |
| **SF5K** - Kindergarten Enrollment | ✅ Edit | 👁️ View | 👁️ View | 👁️ View | 👁️ View |
| **SF6** - Summarized Enrollment | ✅ Edit | 👁️ View | 👁️ View | 👁️ View | 👁️ View |
| **SF7** - Personnel Assignment | ✅ Edit | 👁️ View | 👁️ View | 👁️ View | ❌ |
| **SF9** - Learner Progress | ✅ Edit | 👁️ View | 👁️ View | ❌ | ❌ |

### Other Modules

| Module | School Admin | Superintendent | Supervisor | Analyst | Viewer |
|--------|-------------|----------------|------------|---------|--------|
| **Dashboard** | School | Division | Division | Division | Division |
| **Students** | ✅ Full | 👁️ List | 👁️ List | 👁️ Aggregate | 👁️ Aggregate |
| **Teachers** | ✅ Full | 👁️ View | 👁️ View | 👁️ View | ❌ |
| **Grades** | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Attendance** | ✅ Full | 👁️ Summary | 👁️ Summary | ❌ | ❌ |
| **Financial** | ✅ Full | 👁️ Summary | ❌ | ❌ | ❌ |
| **Reports** | School | Division | Division | Division | Limited |
| **Settings** | School | Division | ❌ | ❌ | ❌ |

---

## Implementation Phases

### Phase 1: Foundation (Week 1-3)
> **Goal**: Set up database schema and basic infrastructure
> **Status**: ✅ COMPLETE (December 7, 2025)

| Task | Description | Status | Assignee |
|------|-------------|--------|----------|
| 1.1 | Create `divisions` table | ✅ Done | |
| 1.2 | Create `division_users` table | ✅ Done | |
| 1.3 | Create `districts` table (optional) | ✅ Done | |
| 1.4 | Modify `schools` table (add division_id) | ✅ Done | |
| 1.5 | Create RLS policies for new tables | ✅ Done | |
| 1.6 | Create TypeScript types | ✅ Done | |
| 1.7 | Create division service layer | ✅ Done | |
| 1.8 | Create seed data for testing | ✅ Done | |

**Files Created:**
- `supabase/migrations/20241207_create_divisions_tables.sql` - Database schema
- `supabase/migrations/20241207_seed_divisions_data.sql` - SQL seed data
- `src/types/division.ts` - TypeScript interfaces
- `src/contexts/DivisionContext.tsx` - React context provider
- `src/services/divisionService.ts` - Supabase service layer
- `scripts/seed-divisions.cjs` - JavaScript seed script

**NPM Scripts:**
- `npm run seed:divisions` - Run division seed script

### Phase 2: Authentication & Context (Week 3-5)
> **Goal**: Implement division-aware authentication
> **Status**: ✅ COMPLETE (December 7, 2025)

| Task | Description | Status | Assignee |
|------|-------------|--------|----------|
| 2.1 | Create `DivisionContext` | ✅ Done | |
| 2.2 | Create `useDivisionAuth` hook | ✅ Done | |
| 2.3 | Modify login flow for division users | ✅ Done | |
| 2.4 | Create permission checking utilities | ✅ Done | |
| 2.5 | Create `DivisionGuard` component | ✅ Done | |
| 2.6 | Update routing for division users | ✅ Done | |
| 2.7 | Create session management | ✅ Done | |

### Phase 3: Division Dashboard (Week 5-7)
> **Goal**: Build the main division interface
> **Status**: ✅ COMPLETE (December 8, 2025)

| Task | Description | Status | Assignee |
|------|-------------|--------|----------|
| 3.1 | Create `DivisionLayout` component | ✅ Done | |
| 3.2 | Create `DivisionDashboard` page | ✅ Done | |
| 3.3 | Create `SchoolSelector` component | ✅ Done | |
| 3.4 | Create division summary cards | ✅ Done | |
| 3.5 | Create schools list/grid view | ✅ Done | |
| 3.6 | Create quick stats widgets | ✅ Done | |
| 3.7 | Implement school comparison feature | ⬜ Todo | |

**New Files Created (Phase 3):**
- `src/components/division/DivisionLayout.tsx` - Layout with sidebar navigation
- `src/components/division/DivisionDashboard.tsx` - Main dashboard
- `src/components/division/DivisionSchools.tsx` - Schools grid view
- `src/components/division/DivisionPersonnel.tsx` - Personnel overview
- `src/components/division/DivisionEnrollment.tsx` - Enrollment overview
- `src/components/division/DivisionReports.tsx` - General reports
- `src/components/division/DivisionSettings.tsx` - Division settings
- `src/components/division/DivisionGuard.tsx` - Route guard

**Features:**
- Searchable school dropdown grouped by district
- Division-level summary statistics
- School-by-school data views

### Phase 4: Report Integration (Week 7-10)
> **Goal**: Enable division-level access to school forms
> **Status**: ✅ COMPLETE (December 8, 2025)

| Task | Description | Status | Assignee |
|------|-------------|--------|----------|
| 4.1 | Create DivisionSF5Dashboard | ✅ Done | |
| 4.2 | Create DivisionSF6Dashboard | ✅ Done | |
| 4.3 | Create DivisionSF7Dashboard | ✅ Done | |
| 4.4 | Create consolidated enrollment report | ✅ Done | |
| 4.5 | Create consolidated personnel report | ✅ Done | |
| 4.6 | Implement CSV export for division | ✅ Done | |
| 4.7 | Implement PDF export for division | ⬜ Todo | |

**New Files Created (Phase 4):**
- `src/services/divisionReportService.ts` - Aggregated report data service
- `src/components/division/DivisionSF5Dashboard.tsx` - Division SF5 Promotion Report
- `src/components/division/DivisionSF6Dashboard.tsx` - Division SF6 Enrollment Summary
- `src/components/division/DivisionSF7Dashboard.tsx` - Division SF7 Personnel Report

**Features:**
- Aggregated data across all schools in division
- View by grade level, district, or school
- CSV export for all reports
- Filter by selected school or view all schools

### Phase 5: Admin & Polish (Week 10-12)
> **Goal**: Admin features and refinements
> **Status**: 🚧 In Progress

| Task | Description | Status | Assignee |
|------|-------------|--------|----------|
| 5.1 | Create division user management UI | ⬜ Todo | |
| 5.2 | Create division settings page | ⬜ Todo | |
| 5.3 | Implement audit logging | ⬜ Todo | |
| 5.4 | Create division onboarding flow | ⬜ Todo | |
| 5.5 | Performance optimization | ⬜ Todo | |
| 5.6 | Documentation | ⬜ Todo | |
| 5.7 | User acceptance testing | ⬜ Todo | |

---

## Technical Specifications

### File Structure (New Files)

```
src/
├── contexts/
│   └── DivisionContext.tsx              # Division context provider
├── hooks/
│   ├── useDivisionAuth.ts               # Division authentication hook
│   ├── useDivisionData.ts               # Division data fetching
│   ├── useDivisionSchools.ts            # Schools in division
│   └── useDivisionPermissions.ts        # Permission checking
├── services/
│   ├── divisionService.ts               # Division CRUD operations
│   ├── divisionUserService.ts           # Division user management
│   └── divisionReportService.ts         # Aggregated reports
├── components/
│   └── division/
│       ├── DivisionLayout.tsx           # Layout wrapper
│       ├── DivisionDashboard.tsx        # Main dashboard
│       ├── DivisionSidebar.tsx          # Navigation sidebar
│       ├── SchoolSelector.tsx           # Multi-school picker
│       ├── SchoolComparisonCard.tsx     # Comparison widget
│       ├── DivisionSummaryCards.tsx     # Stats cards
│       ├── SchoolsGrid.tsx              # Schools grid view
│       ├── DivisionUserManagement.tsx   # User admin
│       └── DivisionSettings.tsx         # Division settings
├── types/
│   └── division.ts                      # Division type definitions
└── utils/
    └── divisionPermissions.ts           # Permission utilities
```

### Key Components

#### DivisionContext
```typescript
// src/contexts/DivisionContext.tsx
interface DivisionContextType {
  // Division data
  division: Division | null;
  divisionUser: DivisionUser | null;
  
  // Schools
  schools: School[];
  selectedSchoolIds: string[];
  
  // Actions
  selectSchool: (schoolId: string) => void;
  deselectSchool: (schoolId: string) => void;
  selectAllSchools: () => void;
  clearSelection: () => void;
  
  // Permissions
  permissions: DivisionPermissions;
  hasPermission: (permission: string) => boolean;
  
  // State
  loading: boolean;
  error: string | null;
}
```

#### API Endpoints (Supabase Functions if needed)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/divisions` | GET | List divisions (admin only) |
| `/divisions/:id` | GET | Get division details |
| `/divisions/:id/schools` | GET | Get schools in division |
| `/divisions/:id/summary` | GET | Get aggregated summary |
| `/divisions/:id/users` | GET/POST | Manage division users |
| `/divisions/:id/reports/enrollment` | GET | Consolidated enrollment |
| `/divisions/:id/reports/personnel` | GET | Consolidated personnel |

---

## UI/UX Design

### Division Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] Division of City Schools - Manila          [User] [▼]   │
├─────────────┬───────────────────────────────────────────────────┤
│             │                                                   │
│ Dashboard   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ Schools     │  │ Schools │ │Students │ │Personnel│ │Enrolled │ │
│ Reports     │  │   42    │ │ 25,432  │ │  1,245  │ │ +3.2%   │ │
│  └ SF5      │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
│  └ SF6      │                                                   │
│  └ SF7      │  ┌─────────────────────────────────────────────┐ │
│ Analytics   │  │ Schools Overview                     [Grid]  │ │
│ Settings    │  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │ │
│             │  │ │Sch 1 │ │Sch 2 │ │Sch 3 │ │Sch 4 │  ...   │ │
│             │  │ │ 523  │ │ 412  │ │ 687  │ │ 345  │        │ │
│             │  │ └──────┘ └──────┘ └──────┘ └──────┘        │ │
│             │  └─────────────────────────────────────────────┘ │
│             │                                                   │
│             │  ┌─────────────────────────────────────────────┐ │
│             │  │ Enrollment Trend                            │ │
│             │  │ [Chart]                                     │ │
│             │  └─────────────────────────────────────────────┘ │
└─────────────┴───────────────────────────────────────────────────┘
```

### School Selector Component

```
┌──────────────────────────────────────────┐
│ Select Schools                      [X]  │
├──────────────────────────────────────────┤
│ [🔍 Search schools...]                   │
│                                          │
│ [✓] Select All (42 schools)              │
├──────────────────────────────────────────┤
│ District: East                           │
│   [✓] Manila East Elementary School      │
│   [✓] Manila East High School            │
│   [ ] San Lorenzo Elementary             │
│                                          │
│ District: West                           │
│   [ ] Manila West Elementary School      │
│   [ ] Manila West High School            │
├──────────────────────────────────────────┤
│ Selected: 3 schools    [Clear] [Apply]   │
└──────────────────────────────────────────┘
```

---

## Testing Strategy

### Unit Tests

| Component | Test Cases |
|-----------|------------|
| DivisionContext | Context initialization, school selection, permission checking |
| useDivisionAuth | Login flow, role detection, token handling |
| Permission utils | All role/permission combinations |
| Division services | CRUD operations, error handling |

### Integration Tests

| Scenario | Description |
|----------|-------------|
| Division login | User logs in and sees division dashboard |
| School selection | Select multiple schools, view combined data |
| Report generation | Generate consolidated SF5 for selected schools |
| Permission enforcement | Verify access restrictions by role |

### E2E Tests

| Flow | Steps |
|------|-------|
| Superintendent flow | Login → Dashboard → View all schools → Generate report → Export |
| Analyst flow | Login → Select schools → View enrollment → Compare schools |
| Viewer flow | Login → View limited dashboard → Verify restricted access |

---

## Migration Plan

### Step 1: Database Migration
```sql
-- Run in order
-- 1. Create new tables
-- 2. Add columns to schools
-- 3. Create RLS policies
-- 4. Seed test data
```

### Step 2: Assign Schools to Divisions
```sql
-- Option A: Manual assignment via admin UI
-- Option B: Bulk import from CSV
-- Option C: Migration script based on existing region/division data
```

### Step 3: Create Division Users
```sql
-- Create division user accounts
-- Assign roles and permissions
-- Send welcome emails
```

### Step 4: Feature Rollout
1. Deploy to staging environment
2. UAT with division stakeholders
3. Phased rollout by region
4. Full production deployment

---

## Progress Tracking

### Overall Progress

```
Phase 1: Foundation      [██████████] 100%  ✅
Phase 2: Authentication  [██████████] 100%  ✅
Phase 3: Dashboard       [█████████░]  90%  ✅ (school comparison pending)
Phase 4: Reports         [█████████░]  90%  ✅ (PDF export pending)
Phase 5: Admin & Polish  [░░░░░░░░░░]   0%  🚧
─────────────────────────────────────────────
Overall                  [████████░░]  80%
```

### Sprint Progress

| Sprint | Dates | Goals | Status |
|--------|-------|-------|--------|
| Sprint 1 | TBD | Database schema, types | ⬜ Not Started |
| Sprint 2 | TBD | Auth, context | ⬜ Not Started |
| Sprint 3 | TBD | Division dashboard | ⬜ Not Started |
| Sprint 4 | TBD | Report integration | ⬜ Not Started |
| Sprint 5 | TBD | Admin, testing | ⬜ Not Started |

### Blockers & Risks

| Issue | Impact | Mitigation | Status |
|-------|--------|------------|--------|
| None yet | | | |

---

## Open Questions

| # | Question | Answer | Decided By | Date |
|---|----------|--------|------------|------|
| 1 | Should we implement district-level access too? | TBD | | |
| 2 | How will division user accounts be created? | TBD | | |
| 3 | What is the data retention policy for audit logs? | TBD | | |
| 4 | Should division users be able to impersonate school users? | TBD | | |
| 5 | How to handle schools that belong to multiple divisions? | TBD | | |

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| Dec 8, 2025 | 0.4.1 | **Phase 4 Polish**: Fixed SF5 school_year filter (defaults to 2024-2025), removed redundant breadcrumbs, fixed sidebar navigation highlighting for SF5/SF6/SF7 | Dev Team |
| Dec 8, 2025 | 0.4.0 | **Phase 4 Complete**: Division SF5, SF6, SF7 dashboards, division report service, CSV export | Dev Team |
| Dec 8, 2025 | 0.3.0 | **Phases 2-3 Complete**: DivisionLayout, DivisionDashboard, school selector, guards, routing | Dev Team |
| Dec 7, 2025 | 0.2.1 | Added seed data (SQL + JavaScript), npm script `seed:divisions` | Dev Team |
| Dec 7, 2025 | 0.2.0 | **Phase 1 Complete**: Database schema, TypeScript types, DivisionContext, division service | Dev Team |
| Dec 7, 2025 | 0.1.0 | Initial document creation | Dev Team |

---

## References

- [DepEd Order on Division Structure](link)
- [Data Privacy Act (RA 10173)](link)
- [Current System Architecture](../architecture/)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)

---

*Last Updated: December 8, 2025*
