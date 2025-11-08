# Multi-Tenant Migration: GitHub Issues Tracker

**Project:** EduSync Multi-Tenant Architecture  
**Total Issues:** 87  
**Status:** Ready for Import to GitHub  

---

## How to Import to GitHub

```bash
# Using GitHub CLI
gh issue create --title "..." --body "..." --label "..." --milestone "..."

# Or manually create in GitHub UI:
# https://github.com/kramlig/EduSync-School-Information-System/issues/new
```

---

## Issue Template

```markdown
**Phase:** [Phase Number]
**Estimated Hours:** [X hours]
**Priority:** [P0-Critical | P1-High | P2-Medium | P3-Low]
**Dependencies:** [Issue #X, #Y]
**Assignee:** [TBD]
```

---

## Phase 1: Foundation & Design (Weeks 1-2)

### Documentation Issues

**Issue #1: Create Schema Migration Guide**
```
Title: [P1][Phase1] Create SCHEMA_UPDATES.md documentation
Labels: documentation, phase-1
Milestone: Phase 1 - Foundation

Description:
Create comprehensive schema migration guide documenting:
- All 16 collections requiring schoolId field
- Before/After TypeScript interfaces
- Migration strategy for each collection
- Data validation requirements

Estimated Hours: 3 hours
Dependencies: None
Acceptance Criteria:
- [ ] Document covers all 16 collections
- [ ] Includes code examples for each type
- [ ] Migration strategy clearly defined
```

**Issue #2: Create Query Migration Checklist**
```
Title: [P1][Phase1] Create QUERY_MIGRATION_CHECKLIST.md
Labels: documentation, phase-1
Milestone: Phase 1 - Foundation

Description:
Create checklist for migrating all Firestore queries to include schoolId filtering.

Deliverables:
- List of all files with Firestore queries (~50 files)
- Checklist format for tracking progress
- Code examples of before/after queries
- Common pitfalls and solutions

Estimated Hours: 4 hours
Dependencies: None
```

**Issue #3: Create Security Rules Migration Guide**
```
Title: [P1][Phase1] Create SECURITY_RULES_MIGRATION.md
Labels: documentation, security, phase-1
Milestone: Phase 1 - Foundation

Description:
Document security rules changes for multi-tenancy.

Contents:
- Current rules analysis
- New helper functions
- Collection-by-collection rule updates
- Test scenarios for validation

Estimated Hours: 4 hours
Dependencies: None
Priority: P0 (Security critical)
```

**Issue #4: Create Multi-Tenant Test Plan**
```
Title: [P1][Phase1] Create MULTI_TENANT_TEST_PLAN.md
Labels: documentation, testing, phase-1
Milestone: Phase 1 - Foundation

Description:
Comprehensive test plan covering:
- Unit test requirements
- Integration test scenarios
- E2E test cases
- Security test scenarios
- Performance test benchmarks

Estimated Hours: 6 hours
Dependencies: None
```

**Issue #5: Set Up GitHub Project Board**
```
Title: [P1][Phase1] Set up GitHub Project for Multi-Tenant Migration
Labels: project-management, phase-1
Milestone: Phase 1 - Foundation

Description:
Create GitHub Project board with:
- Columns: Backlog, In Progress, Review, Done, Blocked
- All 87 issues imported
- Milestones for each phase
- Labels configured

Estimated Hours: 2 hours
Dependencies: Issues #1-#4 created first
```

### Prototype Issues

**Issue #6: Create School Interface**
```
Title: [P1][Phase1] Add School interface to types.ts
Labels: types, phase-1, prototype
Milestone: Phase 1 - Foundation

Description:
Add comprehensive School interface to types.ts

Requirements:
- All fields from migration plan
- TSDoc comments
- Validation helpers
- Example data

File: types.ts
Lines to add: ~80 lines

Estimated Hours: 2 hours
Dependencies: Issue #1
```

**Issue #7: Build SchoolContext Provider**
```
Title: [P1][Phase1] Create SchoolContext provider (prototype)
Labels: react, context, phase-1, prototype
Milestone: Phase 1 - Foundation

Description:
Build SchoolContext provider with basic functionality:
- Load schoolId from auth claims
- Provide currentSchoolId to app
- Basic school switching
- Error handling

Files:
- src/contexts/SchoolContext.tsx (new)
- src/hooks/useSchool.ts (new)

Estimated Hours: 4 hours
Dependencies: Issue #6
```

**Issue #8: Prototype - Update Students Collection**
```
Title: [P1][Phase1] POC: Add schoolId to students collection
Labels: firestore, phase-1, prototype
Milestone: Phase 1 - Foundation

Description:
Prototype schoolId filtering on students collection:
- Add schoolId field to Student interface
- Update students query in useSchoolData.ts
- Test with 2 schools in emulator
- Verify isolation

Success Criteria:
- Can create students with different schoolIds
- Queries only return current school's students
- No cross-contamination

Estimated Hours: 3 hours
Dependencies: Issue #7
```

**Issue #9: Prototype - Update StudentList Component**
```
Title: [P1][Phase1] POC: Update StudentList to use schoolId filtering
Labels: component, phase-1, prototype
Milestone: Phase 1 - Foundation

Description:
Update StudentList component to consume SchoolContext and verify filtering works.

Changes:
- Import and use useSchool hook
- Display current school name in header
- Verify only current school students shown

File: components/StudentList.tsx

Estimated Hours: 2 hours
Dependencies: Issue #8
```

**Issue #10: Write POC Tests**
```
Title: [P1][Phase1] Write tests for multi-tenant prototype
Labels: testing, phase-1, prototype
Milestone: Phase 1 - Foundation

Description:
Write tests validating prototype works:
- SchoolContext provider test
- useSchool hook test
- Student query filtering test
- Cross-school isolation test

Test Files:
- contexts/__tests__/SchoolContext.test.tsx
- hooks/__tests__/useSchool.test.ts

Estimated Hours: 4 hours
Dependencies: Issue #9
```

---

## Phase 2: Schema & Type Updates (Weeks 3-4)

**Issue #11: Add schoolId to all 16 interfaces**
```
Title: [P0][Phase2] Add schoolId field to all TypeScript interfaces
Labels: types, phase-2, breaking-change
Milestone: Phase 2 - Schema Updates

Description:
Add `schoolId: string` to all 16 data model interfaces:
- [x] Student
- [ ] Teacher
- [ ] Parent
- [ ] Section
- [ ] LearningArea
- [ ] Grade
- [ ] CoreValue
- [ ] CoreValueGrade
- [ ] AttendanceRecord
- [ ] SubstituteAssignment
- [ ] ClassSchedule
- [ ] Assignment
- [ ] StudentAssignmentGrade
- [ ] LessonPlan
- [ ] Announcement
- [ ] SchoolSettings (migrate to School)

File: types.ts
Estimated Hours: 2 hours
Dependencies: Issue #6
Priority: P0 (Blocks all other work)
```

**Issue #12: Update SchoolDataHook Interface**
```
Title: [P0][Phase2] Update SchoolDataHook interface with School type
Labels: types, phase-2
Milestone: Phase 2 - Schema Updates

Description:
Update SchoolDataHook to include:
- schools: School[]
- currentSchool: School | null
- Remove global settings (moved to School)

Files: 
- hooks/useSchoolData.ts
- types.ts

Estimated Hours: 1 hour
Dependencies: Issue #11
```

**Issue #13-18: Type Guards and Validators**
```
(6 issues for updating type guards, validators, and fixing TS errors)
```

**Issue #19: Create schools collection in Firestore**
```
Title: [P0][Phase2] Initialize schools collection schema
Labels: firestore, phase-2, database
Milestone: Phase 2 - Schema Updates

Description:
Create schools collection with proper structure:
- Collection: /schools
- Example documents for testing
- Seed script to create test schools

Script: scripts/init-schools-collection.cjs

Estimated Hours: 3 hours
Dependencies: Issue #11
```

**Issue #20: Update firestore.indexes.json**
```
Title: [P0][Phase2] Add schoolId to all Firestore indexes
Labels: firestore, indexes, phase-2
Milestone: Phase 2 - Schema Updates

Description:
Add schoolId as first field in all compound indexes:
- students (schoolId + enrollmentDate)
- students (schoolId + lastName + firstName)
- grades (schoolId + studentId)
- teachers (schoolId + name)
- ~20 total index updates

File: firestore.indexes.json
Estimated Hours: 2 hours
Dependencies: Issue #11
Priority: P0 (Required for query performance)
```

**Issue #21: Deploy Firestore Indexes**
```
Title: [P0][Phase2] Deploy schoolId indexes to Firebase
Labels: deployment, phase-2
Milestone: Phase 2 - Schema Updates

Description:
Deploy updated indexes to Firebase emulator and staging.

Commands:
```bash
firebase deploy --only firestore:indexes --project edusync-sis-dev
```

Wait time: 5-10 minutes per project
Estimated Hours: 1 hour
Dependencies: Issue #20
```

**Issue #22: Create Multi-Tenant Seed Script**
```
Title: [P1][Phase2] Create seed script for multiple schools
Labels: scripts, testing, phase-2
Milestone: Phase 2 - Schema Updates

Description:
Create script to seed emulator with multiple schools:
- 3-5 test schools
- Each with full dataset (students, teachers, etc.)
- Realistic data with proper schoolId references

Script: scripts/seed-multi-tenant.cjs

Features:
- Configurable number of schools
- Per-school data isolation
- Relationship integrity (section.schoolId == student.schoolId)

Estimated Hours: 6 hours
Dependencies: Issue #19, #21
```

---

## Phase 3: Data Layer Migration (Weeks 5-8)

### Core Hooks Migration (Week 5-6)

**Issue #23-37: Update useSchoolData.ts subscriptions**
```
Title: [P0][Phase3] Add schoolId filter to [COLLECTION] query
Labels: hooks, firestore, phase-3
Milestone: Phase 3 - Data Layer

15 separate issues, one per collection:
#23 - students
#24 - teachers
#25 - parents
#26 - sections
#27 - learningAreas
#28 - grades (CRITICAL - most documents)
#29 - coreValues
#30 - coreValueGrades
#31 - attendanceRecords
#32 - substituteAssignments
#33 - classSchedules
#34 - assignments
#35 - studentAssignmentGrades
#36 - lessonPlans
#37 - announcements

Template:
Description:
Update [COLLECTION] subscription query to include schoolId filter.

Before:
```typescript
const query = collection(db, '[COLLECTION]');
```

After:
```typescript
const currentSchoolId = useSchoolContext().currentSchoolId;
const query = query(
  collection(db, '[COLLECTION]'),
  where('schoolId', '==', currentSchoolId)
);
```

File: hooks/useSchoolData.ts
Estimated Hours: 1-2 hours each
Dependencies: Issue #11, #20
Priority: P0
```

**Issue #38-52: Update CRUD functions**
```
Title: [P0][Phase3] Add schoolId to [OPERATION] in [COLLECTION]
Labels: crud, phase-3
Milestone: Phase 3 - Data Layer

15 issues for CRUD operations:
- addStudent, updateStudent, deleteStudent
- addTeacher, updateTeacher, deleteTeacher
- etc.

Template:
Description:
Update [OPERATION] function to:
1. Include schoolId when creating documents
2. Validate schoolId matches current school
3. Reject operations on wrong school's data

Example for addStudent:
```typescript
const addStudent = async (student: Omit<Student, 'id'>) => {
  const currentSchoolId = useSchoolContext().currentSchoolId;
  
  // Validate
  if (!currentSchoolId) {
    throw new Error('No school context available');
  }
  
  // Add with schoolId
  const newStudent = {
    ...student,
    schoolId: currentSchoolId,  // ✅ Force current school
    createdAt: serverTimestamp()
  };
  
  await addDoc(collection(db, 'students'), newStudent);
};
```

Estimated Hours: 1 hour each
Priority: P0
```

### Service Layer Migration (Week 7)

**Issue #53-60: Update service files**
```
8 issues for service layer:
#53 - firestoreService.ts
#54 - billingService.ts
#55 - formsService.ts
#56 - enrollmentService.ts
#57 - paginationService.ts
#58 - form138GeneratorV2.ts
#59 - form137Generator.ts
#60 - geminiService.ts

Each requires adding schoolId to queries and operations.

Estimated Hours: 2-3 hours each
```

### Firebase Functions Migration (Week 8)

**Issue #61-65: Update Cloud Functions**
```
#61 - generateLessonPlan function
#62 - generateStudentReport function
#63 - processTrialSignup function (add schoolId selection)
#64 - Firestore triggers (add schoolId validation)
#65 - Deploy and test functions

Estimated Hours: 2-4 hours each
```

---

## Phase 4: Security & Auth (Weeks 9-10)

**Issue #66-72: Security Rules Migration**
```
#66 - Add helper functions (getUserSchoolId, isSuperAdmin, etc.)
#67 - Update students collection rules
#68 - Update teachers collection rules
#69 - Update grades collection rules (CRITICAL)
#70 - Update all remaining collection rules
#71 - Add schools collection rules
#72 - Deploy and test security rules

Priority: P0 (Security critical)
Estimated Hours: 1-2 hours each
```

**Issue #73-76: Authentication Updates**
```
#73 - Create set-school-claims.cjs script
#74 - Update existing users with schoolId claims
#75 - Create super admin accounts
#76 - Test auth flow with schoolId

Estimated Hours: 2-3 hours each
```

---

## Phase 5: UI & UX Updates (Weeks 11-12)

**Issue #77-82: Core Components**
```
#77 - Update StudentList component
#78 - Update TeacherList component
#79 - Update GradesView component
#80 - Update GradebookView component
#81 - Add school selector to Header
#82 - Add school branding support

Estimated Hours: 2-4 hours each
```

**Issue #83-87: Forms & Reports**
```
#83 - Update Form138Dashboard
#84 - Update Form137Dashboard
#85 - Update SF1/SF2/SF9 Dashboards
#86 - Update enrollment portal
#87 - Update billing components

Estimated Hours: 3-5 hours each
```

---

## Phase 6: Testing (Weeks 13-14)

**(20+ issues for testing will be created in Phase 5)**

---

## Phase 7: Migration & Deployment (Weeks 15-16)

**(15+ issues for deployment will be created in Phase 6)**

---

## Issue Labels

```
Priority:
- p0-critical (Blocking, security, data integrity)
- p1-high (Important, user-facing)
- p2-medium (Nice to have)
- p3-low (Future enhancement)

Type:
- bug
- feature
- documentation
- testing
- security
- performance

Phase:
- phase-1 (Foundation)
- phase-2 (Schema)
- phase-3 (Data Layer)
- phase-4 (Security)
- phase-5 (UI)
- phase-6 (Testing)
- phase-7 (Deployment)

Component:
- hooks
- components
- services
- functions
- firestore
- types
- scripts
```

---

## Milestones

1. **Phase 1 - Foundation** (Weeks 1-2) - 10 issues
2. **Phase 2 - Schema Updates** (Weeks 3-4) - 12 issues
3. **Phase 3 - Data Layer** (Weeks 5-8) - 45 issues
4. **Phase 4 - Security** (Weeks 9-10) - 11 issues
5. **Phase 5 - UI Updates** (Weeks 11-12) - 11 issues
6. **Phase 6 - Testing** (Weeks 13-14) - TBD
7. **Phase 7 - Deployment** (Weeks 15-16) - TBD

---

## Progress Tracking

**Format:**
```
Phase X: [████████░░] 80% (8/10 issues complete)
Overall: [███░░░░░░░] 30% (26/87 issues complete)
```

**Weekly Updates:** Every Friday at 4 PM

---

## Quick Import Script

Save this as `import-issues.sh`:

```bash
#!/bin/bash

# Import all issues to GitHub
# Requires: gh CLI installed and authenticated

REPO="kramlig/EduSync-School-Information-System"

# Phase 1 Issues
gh issue create --repo $REPO \
  --title "[P1][Phase1] Create SCHEMA_UPDATES.md documentation" \
  --body "See GITHUB_ISSUES_TRACKER.md Issue #1" \
  --label "documentation,phase-1" \
  --milestone "Phase 1 - Foundation"

# (Repeat for all 87 issues...)
```

---

**Document Owner:** Development Team  
**Status:** Ready for GitHub Import  
**Last Updated:** November 8, 2025
