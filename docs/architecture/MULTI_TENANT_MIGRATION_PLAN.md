# Multi-Tenant Architecture Migration Plan

**Project:** EduSync School Information System  
**Goal:** Transform single-school architecture to support multiple schools in one Firebase project  
**Timeline:** 12-16 weeks  
**Status:** 📋 Planning Phase  
**Last Updated:** November 8, 2025

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Target Architecture](#target-architecture)
4. [Migration Phases](#migration-phases)
5. [Risk Assessment](#risk-assessment)
6. [Success Criteria](#success-criteria)
7. [Rollback Plan](#rollback-plan)

---

## Executive Summary

### Why Multi-Tenancy?

**Business Drivers:**
- Speaking with **multiple schools** for potential adoption
- Need centralized management for easier updates and monitoring
- Lower per-school operational costs (economies of scale)
- Unified analytics and reporting across all schools
- Single codebase for all schools (easier maintenance)

**Technical Drivers:**
- Current architecture: **1 Firebase project = 1 school** (expensive at scale)
- Target architecture: **1 Firebase project = N schools** (cost-effective)
- Better resource utilization and database query efficiency
- Centralized user management and authentication

### Key Metrics

| Metric | Current (Single-School) | Target (Multi-Tenant) |
|--------|------------------------|----------------------|
| Firebase projects | 1 per school | 1 for all schools |
| Monthly cost (10 schools) | $80-150 | $15-30 |
| Code updates | Deploy to N projects | Deploy once |
| Data isolation | Physical (separate DBs) | Logical (schoolId filter) |
| Setup time per school | 2-4 hours | 15-30 minutes |

### Timeline Overview

- **Phase 1:** Foundation & Design (Weeks 1-2)
- **Phase 2:** Schema & Type Updates (Weeks 3-4)
- **Phase 3:** Data Layer Migration (Weeks 5-8)
- **Phase 4:** Security & Auth (Weeks 9-10)
- **Phase 5:** UI & UX Updates (Weeks 11-12)
- **Phase 6:** Testing & Validation (Weeks 13-14)
- **Phase 7:** Data Migration & Deployment (Weeks 15-16)

---

## Current State Analysis

### Architecture Overview

```
Current: Single-Tenant (One School Per Firebase Project)

Firebase Project: edusync-sis
├── Firestore Database
│   ├── students (NO schoolId)
│   ├── teachers (NO schoolId)
│   ├── sections (NO schoolId)
│   ├── grades (NO schoolId)
│   └── settings (singleton: 'default')
├── Auth Users
│   └── Custom Claims: { role: 'teacher' } (NO schoolId)
└── Security Rules
    └── Allow read if isStaff() (NO school filtering)
```

### Data Collections Affected

| Collection | Documents | Needs schoolId | Query Impact |
|------------|-----------|----------------|--------------|
| students | ~3,000/school | ✅ Yes | HIGH |
| teachers | ~50/school | ✅ Yes | MEDIUM |
| parents | ~1,500/school | ✅ Yes | MEDIUM |
| sections | ~20/school | ✅ Yes | MEDIUM |
| learningAreas | ~30/school | ✅ Yes | LOW |
| grades | ~15,000/school | ✅ Yes | CRITICAL |
| coreValues | ~5/school | ✅ Yes | LOW |
| coreValueGrades | ~10,000/school | ✅ Yes | HIGH |
| attendanceRecords | ~3,000/school | ✅ Yes | HIGH |
| classSchedules | ~100/school | ✅ Yes | MEDIUM |
| assignments | ~500/school | ✅ Yes | MEDIUM |
| studentAssignmentGrades | ~5,000/school | ✅ Yes | HIGH |
| lessonPlans | ~200/school | ✅ Yes | LOW |
| announcements | ~100/school | ✅ Yes | LOW |
| substituteAssignments | ~20/school | ✅ Yes | LOW |
| settings | 1 (singleton) | ⚠️ Migrate to schools | N/A |

**Total Collections:** 16 need `schoolId` field

### Code Files Affected

| Category | Files | Effort |
|----------|-------|--------|
| **Type Definitions** | `types.ts` | 2 hours |
| **Hooks** | `useSchoolData.ts`, `useSchoolData.*.ts` | 12 hours |
| **Components** | 60+ components (StudentList, GradesView, etc.) | 20 hours |
| **Services** | `firestoreService.ts`, `billingService.ts`, etc. | 8 hours |
| **Security Rules** | `firestore.rules` | 6 hours |
| **Functions** | `functions/index.js` | 4 hours |
| **Tests** | 50+ test files | 16 hours |
| **Scripts** | Seeding, migration scripts | 8 hours |
| **TOTAL** | **150+ files** | **76 hours** |

### Current Pain Points

1. **Deployment Complexity:** Need to deploy same code to multiple Firebase projects
2. **Data Fragmentation:** Student data scattered across projects (no unified reporting)
3. **Cost Inefficiency:** Paying for underutilized resources per project
4. **Update Propagation:** Bug fixes must be deployed N times
5. **Monitoring Overhead:** Must monitor N Firebase consoles
6. **User Management:** Parent with kids in different schools needs multiple accounts

---

## Target Architecture

### High-Level Design

```
Target: Multi-Tenant (Multiple Schools in One Firebase Project)

Firebase Project: edusync-sis-multi
├── Firestore Database
│   ├── schools (NEW)
│   │   ├── school-001
│   │   ├── school-002
│   │   └── school-003
│   ├── students (WITH schoolId)
│   ├── teachers (WITH schoolId)
│   ├── sections (WITH schoolId)
│   └── grades (WITH schoolId)
├── Auth Users
│   └── Custom Claims: { role: 'teacher', schoolId: 'school-001' }
└── Security Rules
    └── Allow read if isStaff() && getUserSchoolId() == resource.data.schoolId
```

### New Data Model

#### 1. Schools Collection (NEW)

```typescript
interface School {
  id: string;                    // e.g., 'school-001', 'depasco-elem'
  
  // Basic Info
  name: string;                  // 'DepEd Pasay Elementary School'
  schoolId: string;              // Official DepEd School ID
  region: string;                // 'NCR'
  division: string;              // 'Pasay City'
  district: string;              // 'District I'
  
  // Contact & Location
  address: string;
  city: string;
  province: string;
  zipCode: string;
  contactNumber: string;
  email: string;
  principalName?: string;
  
  // Configuration
  schoolType: 'public' | 'private' | 'hybrid';
  gradelevelsOffered: number[];  // [1,2,3,4,5,6] or [7,8,9,10] or [11,12]
  schoolYear: string;            // '2024-2025'
  
  // Features & Settings
  settings: SchoolSettings;      // Moved from global settings collection
  features: {
    financialEnabled: boolean;
    enrollmentPortalEnabled: boolean;
    parentPortalEnabled: boolean;
    smsNotificationsEnabled: boolean;
  };
  
  // Subscription & Billing
  subscriptionTier: 'free' | 'basic' | 'premium' | 'enterprise';
  subscriptionStatus: 'active' | 'suspended' | 'trial' | 'cancelled';
  trialEndsAt?: string;
  
  // Limits (based on subscription)
  limits: {
    maxStudents: number;         // Free: 100, Basic: 500, Premium: 2000
    maxTeachers: number;
    maxStorage: number;          // In GB
  };
  
  // Usage Stats
  currentUsage: {
    studentCount: number;
    teacherCount: number;
    storageUsed: number;
  };
  
  // Metadata
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  lastActivityAt?: string;
  
  // Branding (optional)
  logoURL?: string;
  primaryColor?: string;
  secondaryColor?: string;
}
```

#### 2. Updated Student Interface

```typescript
interface Student {
  id: string;
  schoolId: string;              // ✅ NEW - References schools/{schoolId}
  
  // ... all existing fields remain
  name: string;
  email: string;
  lrn?: string;
  sectionId?: string;
  // etc.
}
```

#### 3. Updated Teacher Interface

```typescript
interface Teacher {
  id: string;
  schoolId: string;              // ✅ NEW - References schools/{schoolId}
  
  // ... existing fields
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'principal' | 'registrar';
  assignments?: TeacherAssignment[];
}
```

**Similar updates for all 16 collections** (see detailed schema in `SCHEMA_UPDATES.md`)

### Security Model

#### Custom Claims Structure

```typescript
// Firebase Auth Custom Claims
{
  uid: "user-123",
  email: "teacher@school1.edu",
  customClaims: {
    role: "teacher",
    schoolId: "school-001",      // ✅ NEW - Isolates user to specific school
    schoolIds: ["school-001"],   // ✅ For users in multiple schools (e.g., district admin)
    isSuperAdmin: false          // ✅ For EduSync staff (can access all schools)
  }
}
```

#### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: Get user's school ID from custom claims
    function getUserSchoolId() {
      return request.auth.token.schoolId;
    }
    
    // Helper: Check if user has access to multiple schools
    function getUserSchoolIds() {
      return request.auth.token.schoolIds;
    }
    
    // Helper: Check if super admin
    function isSuperAdmin() {
      return request.auth.token.isSuperAdmin == true;
    }
    
    // Schools Collection - Read only your school(s)
    match /schools/{schoolId} {
      allow read: if isAuthenticated() && 
        (schoolId == getUserSchoolId() || 
         schoolId in getUserSchoolIds() || 
         isSuperAdmin());
      
      allow write: if isSuperAdmin(); // Only EduSync staff can create schools
    }
    
    // Students Collection - School isolation
    match /students/{studentId} {
      // Can only read students from YOUR school
      allow read: if isStaff() && 
        (getUserSchoolId() == resource.data.schoolId ||
         resource.data.schoolId in getUserSchoolIds() ||
         isSuperAdmin());
      
      // Can only write students to YOUR school
      allow create: if isAdminOrRegistrar() && 
        getUserSchoolId() == request.resource.data.schoolId;
      
      allow update: if isAdminOrRegistrar() && 
        getUserSchoolId() == resource.data.schoolId;
      
      allow delete: if isAdmin() && 
        getUserSchoolId() == resource.data.schoolId;
    }
    
    // Similar rules for all other collections...
    // (see complete rules in firestore.rules)
  }
}
```

### Query Patterns

#### Before (Single-Tenant)

```typescript
// Get all students (no filtering needed)
const studentsQuery = query(
  collection(db, 'students'),
  orderBy('enrollmentDate', 'desc'),
  limit(100)
);
```

#### After (Multi-Tenant)

```typescript
// Get students for current school only
const currentSchoolId = useSchoolContext().currentSchoolId;

const studentsQuery = query(
  collection(db, 'students'),
  where('schoolId', '==', currentSchoolId),  // ✅ CRITICAL FILTER
  orderBy('enrollmentDate', 'desc'),
  limit(100)
);
```

**EVERY query must include `where('schoolId', '==', currentSchoolId)`**

### Firestore Indexes Required

```json
{
  "indexes": [
    {
      "collectionGroup": "students",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "schoolId", "order": "ASCENDING" },
        { "fieldPath": "enrollmentDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "students",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "schoolId", "order": "ASCENDING" },
        { "fieldPath": "lastName", "order": "ASCENDING" },
        { "fieldPath": "firstName", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "grades",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "schoolId", "order": "ASCENDING" },
        { "fieldPath": "studentId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "teachers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "schoolId", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    }
    // ... ~20 more indexes needed
  ]
}
```

### React Context Architecture

```typescript
// src/contexts/SchoolContext.tsx

interface SchoolContextType {
  currentSchoolId: string;
  currentSchool: School | null;
  userSchools: School[];          // For users with multiple schools
  switchSchool: (schoolId: string) => Promise<void>;
  refreshSchool: () => Promise<void>;
  isSuperAdmin: boolean;
}

export const SchoolProvider: React.FC = ({ children }) => {
  const [currentSchoolId, setCurrentSchoolId] = useState<string>('');
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [userSchools, setUserSchools] = useState<School[]>([]);
  
  // Load schoolId from auth claims on mount
  useEffect(() => {
    const loadSchoolContext = async () => {
      const user = auth.currentUser;
      if (!user) return;
      
      const token = await user.getIdTokenResult();
      const schoolId = token.claims.schoolId as string;
      const schoolIds = token.claims.schoolIds as string[] || [];
      const isSuperAdmin = token.claims.isSuperAdmin as boolean;
      
      setCurrentSchoolId(schoolId);
      
      // Fetch current school details
      if (schoolId) {
        const schoolDoc = await getDoc(doc(db, 'schools', schoolId));
        setCurrentSchool({ id: schoolDoc.id, ...schoolDoc.data() } as School);
      }
      
      // Fetch all schools user has access to
      if (isSuperAdmin) {
        // Super admin sees all schools
        const schoolsSnap = await getDocs(collection(db, 'schools'));
        setUserSchools(schoolsSnap.docs.map(d => ({ id: d.id, ...d.data() } as School)));
      } else if (schoolIds.length > 1) {
        // Multi-school user
        const schoolsPromises = schoolIds.map(id => getDoc(doc(db, 'schools', id)));
        const schoolDocs = await Promise.all(schoolsPromises);
        setUserSchools(schoolDocs.map(d => ({ id: d.id, ...d.data() } as School)));
      }
    };
    
    loadSchoolContext();
  }, []);
  
  const switchSchool = async (schoolId: string) => {
    // For multi-school users
    setCurrentSchoolId(schoolId);
    const schoolDoc = await getDoc(doc(db, 'schools', schoolId));
    setCurrentSchool({ id: schoolDoc.id, ...schoolDoc.data() } as School);
  };
  
  return (
    <SchoolContext.Provider value={{
      currentSchoolId,
      currentSchool,
      userSchools,
      switchSchool,
      isSuperAdmin: userSchools.length > 10 // Heuristic
    }}>
      {children}
    </SchoolContext.Provider>
  );
};
```

---

## Migration Phases

### Phase 1: Foundation & Design (Weeks 1-2)

**Goal:** Establish architecture patterns and prepare development environment

#### Week 1: Documentation & Planning

**Tasks:**
- [x] Create migration plan document (this document)
- [ ] Create detailed schema migration guide (`SCHEMA_UPDATES.md`)
- [ ] Create query migration checklist (`QUERY_MIGRATION_CHECKLIST.md`)
- [ ] Create security rules migration guide (`SECURITY_RULES_MIGRATION.md`)
- [ ] Set up project tracking (GitHub Issues/Projects)
- [ ] Create test plan document (`MULTI_TENANT_TEST_PLAN.md`)

**Deliverables:**
- ✅ Migration plan (this doc)
- ⏳ 5 additional documentation files
- ⏳ GitHub Project board set up
- ⏳ 50+ GitHub Issues created

#### Week 2: Prototype & Proof of Concept

**Tasks:**
- [ ] Create `School` interface in types.ts
- [ ] Build SchoolContext provider (prototype)
- [ ] Update one collection (students) with schoolId
- [ ] Update one component (StudentList) to use schoolId filtering
- [ ] Write proof-of-concept test
- [ ] Demo multi-tenant query working in emulator

**Deliverables:**
- ✅ Working prototype of school isolation
- ✅ Confidence in approach
- ✅ Time estimates validated

**Success Criteria:**
- Can create 2 schools in emulator
- Can add students to each school with different schoolIds
- StudentList component shows only current school's students
- Query performance acceptable with schoolId filter

---

### Phase 2: Schema & Type Updates (Weeks 3-4)

**Goal:** Update all TypeScript interfaces and create new collections

#### Week 3: Type System Updates

**Tasks:**
- [ ] Add `School` interface to types.ts (complete definition)
- [ ] Add `schoolId: string` to all 16 interfaces
- [ ] Update `SchoolDataHook` interface
- [ ] Create `useSchool` hook
- [ ] Update all type guards and validators
- [ ] Fix TypeScript compilation errors

**Files Modified:**
- `types.ts`
- `hooks/useSchoolData.ts` (types only)
- `hooks/useSchool.ts` (new file)
- `contexts/SchoolContext.tsx` (new file)

**Deliverables:**
- ✅ All types updated with schoolId
- ✅ No TypeScript errors
- ✅ SchoolContext fully implemented

#### Week 4: Database Schema Updates

**Tasks:**
- [ ] Create schools collection structure in Firestore
- [ ] Write script to initialize schools collection
- [ ] Update firestore.indexes.json with schoolId indexes
- [ ] Deploy indexes to Firebase (takes 5-10 minutes)
- [ ] Create seed script for multi-tenant data
- [ ] Test seeding multiple schools in emulator

**Scripts Created:**
- `scripts/init-schools-collection.cjs`
- `scripts/seed-multi-tenant.cjs`
- `scripts/migrate-single-to-multi.cjs` (prep for Phase 7)

**Deliverables:**
- ✅ Schools collection schema defined
- ✅ Indexes deployed
- ✅ Can seed multiple schools in emulator

---

### Phase 3: Data Layer Migration (Weeks 5-8)

**Goal:** Update all Firestore queries to include schoolId filtering

#### Week 5-6: Core Hooks Migration

**Tasks:**
- [ ] Update `useSchoolData.ts` - all collection subscriptions
- [ ] Add schoolId filter to students query
- [ ] Add schoolId filter to teachers query
- [ ] Add schoolId filter to parents query
- [ ] Add schoolId filter to sections query
- [ ] Add schoolId filter to learningAreas query
- [ ] Add schoolId filter to grades query
- [ ] Add schoolId filter to coreValues query
- [ ] Add schoolId filter to coreValueGrades query
- [ ] Add schoolId filter to attendanceRecords query
- [ ] Update all CRUD functions (add/update/delete) to include schoolId
- [ ] Add validation: reject operations without schoolId

**Files Modified:**
- `hooks/useSchoolData.ts` (~1,800 lines)
- `hooks/useSchoolData.simplified.ts`
- `hooks/useSchoolData.REACT_QUERY_BACKUP.ts`

**Test Strategy:**
- Create 2 test schools in emulator
- Add data to both schools
- Verify queries return only current school's data
- Verify no cross-contamination

#### Week 7: Service Layer Migration

**Tasks:**
- [ ] Update `firestoreService.ts` with schoolId
- [ ] Update `billingService.ts` with schoolId
- [ ] Update `formsService.ts` with schoolId
- [ ] Update `enrollmentService.ts` with schoolId
- [ ] Update `paginationService.ts` with schoolId
- [ ] Update `form138GeneratorV2.ts` with schoolId
- [ ] Update `form137Generator.ts` with schoolId

**Files Modified:**
- `services/firestoreService.ts`
- `services/billingService.ts`
- `services/formsService.ts`
- `services/enrollmentService.ts`
- `services/paginationService.ts`
- `src/services/*.ts` (8 files)

#### Week 8: Firebase Functions Migration

**Tasks:**
- [ ] Update `generateLessonPlan` function
- [ ] Update `generateStudentReport` function
- [ ] Update `processTrialSignup` function (add schoolId)
- [ ] Update all Firestore triggers with schoolId
- [ ] Add schoolId validation in functions
- [ ] Deploy and test functions in emulator

**Files Modified:**
- `functions/index.js`

---

### Phase 4: Security & Auth (Weeks 9-10)

**Goal:** Implement school-level access control and data isolation

#### Week 9: Security Rules

**Tasks:**
- [ ] Update helper functions in firestore.rules
  - [ ] Add `getUserSchoolId()`
  - [ ] Add `getUserSchoolIds()`
  - [ ] Add `isSuperAdmin()`
  - [ ] Add `hasAccessToSchool(schoolId)`
- [ ] Update students collection rules
- [ ] Update teachers collection rules
- [ ] Update parents collection rules
- [ ] Update sections collection rules
- [ ] Update grades collection rules (CRITICAL)
- [ ] Update all 16 collection rules
- [ ] Add schools collection rules
- [ ] Deploy rules to emulator
- [ ] Test with multiple user types

**Files Modified:**
- `firestore.rules` (592 lines → ~800 lines)

**Test Scenarios:**
- [ ] Teacher from School A cannot read School B students
- [ ] Admin from School A cannot write to School B
- [ ] Super admin can access all schools
- [ ] User with schoolIds=['school-A','school-B'] can access both

#### Week 10: Authentication Updates

**Tasks:**
- [ ] Create script to set custom claims with schoolId
  - `scripts/set-school-claims.cjs`
- [ ] Update existing users with schoolId claims
- [ ] Create super admin accounts (for EduSync staff)
- [ ] Test auth flow with schoolId
- [ ] Update login flow to load school context
- [ ] Add school selector for multi-school users

**Scripts Created:**
- `scripts/set-school-claims.cjs`
- `scripts/batch-update-claims.cjs`

---

### Phase 5: UI & UX Updates (Weeks 11-12)

**Goal:** Update all UI components to support multi-tenancy

#### Week 11: Core Components

**Tasks:**
- [ ] Update StudentList component
- [ ] Update TeacherList component
- [ ] Update GradesView component
- [ ] Update GradebookView component
- [ ] Update AttendanceView component
- [ ] Update SectionsView component
- [ ] Update ParentsView component
- [ ] Add school selector to Header (for multi-school users)
- [ ] Add school branding support (logo, colors)

**Components Modified:** ~20 files

#### Week 12: Forms & Reports

**Tasks:**
- [ ] Update Form138Dashboard (add schoolId filtering)
- [ ] Update Form137Dashboard
- [ ] Update SF1Dashboard, SF2Dashboard, SF9Dashboard
- [ ] Update enrollment portal (school selection)
- [ ] Update parent portal (show all children across schools)
- [ ] Update billing components
- [ ] Update reports to include school name

**Components Modified:** ~30 files

---

### Phase 6: Testing & Validation (Weeks 13-14)

**Goal:** Comprehensive testing of multi-tenant functionality

#### Week 13: Automated Testing

**Tasks:**
- [ ] Write unit tests for SchoolContext
- [ ] Write unit tests for updated hooks
- [ ] Update existing component tests with schoolId
- [ ] Write integration tests for multi-school scenarios
- [ ] Write E2E tests with Playwright
- [ ] Test school isolation
- [ ] Test cross-school access denial
- [ ] Performance test with 10 schools

**Test Coverage Goals:**
- Unit tests: 80%+ coverage
- Integration tests: All critical flows
- E2E tests: 10+ scenarios

#### Week 14: Manual Testing & QA

**Tasks:**
- [ ] Create 5 test schools in staging
- [ ] Populate with realistic data
- [ ] Test all user roles in each school
- [ ] Test super admin capabilities
- [ ] Test school switching
- [ ] Test enrollment portal for multiple schools
- [ ] Security audit (attempt cross-school access)
- [ ] Performance testing (load time, query speed)
- [ ] Bug bash session

**QA Checklist:** ~100 items

---

### Phase 7: Data Migration & Deployment (Weeks 15-16)

**Goal:** Migrate production data and deploy to production

#### Week 15: Production Data Migration

**Tasks:**
- [ ] Backup all production data
- [ ] Create schools collection in production
- [ ] Run migration script to add schoolId to all documents
  - [ ] Migrate students
  - [ ] Migrate teachers
  - [ ] Migrate parents
  - [ ] Migrate sections
  - [ ] Migrate grades (CRITICAL - most documents)
  - [ ] Migrate all other collections
- [ ] Verify data integrity
- [ ] Test queries in production
- [ ] Update custom claims for all users

**Migration Script:**
```bash
# Dry run first
node scripts/migrate-single-to-multi.cjs --dryRun --project edusync-sis

# Real migration
node scripts/migrate-single-to-multi.cjs --project edusync-sis --schoolId school-001
```

**Rollback Plan:**
- Keep backups for 30 days
- Script to remove schoolId field if needed
- Restore from backup if catastrophic failure

#### Week 16: Production Deployment

**Tasks:**
- [ ] Deploy Firestore indexes (wait for completion)
- [ ] Deploy security rules
- [ ] Deploy Firebase Functions
- [ ] Deploy web app (new build with multi-tenant code)
- [ ] Monitor errors and performance
- [ ] Run smoke tests in production
- [ ] Gradual rollout (10% → 50% → 100%)
- [ ] Announce completion

**Monitoring:**
- Firebase Console alerts
- Error tracking (Sentry)
- Query performance monitoring
- User feedback collection

---

## Risk Assessment

### Critical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Data contamination** (Student A sees Student B's data) | CRITICAL | MEDIUM | Comprehensive testing, security rules audit, gradual rollout |
| **Query performance degradation** | HIGH | MEDIUM | Proper indexing, query optimization, load testing |
| **Migration data loss** | CRITICAL | LOW | Multiple backups, dry run, manual verification |
| **Breaking existing functionality** | HIGH | MEDIUM | Extensive testing, feature flags, rollback plan |
| **Security rule bypass** | CRITICAL | LOW | Security audit, penetration testing, peer review |
| **Auth claim sync issues** | HIGH | MEDIUM | Validation scripts, user re-authentication flow |

### Medium Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Timeline overrun** | MEDIUM | HIGH | Buffer weeks, prioritize critical features |
| **TypeScript errors** | MEDIUM | HIGH | Incremental updates, CI/CD type checking |
| **Test coverage gaps** | MEDIUM | MEDIUM | TDD approach, code review requirements |
| **Developer confusion** | MEDIUM | HIGH | Detailed documentation, code examples, training |

### Low Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **UI/UX regressions** | LOW | LOW | Visual regression testing, user testing |
| **Documentation outdated** | LOW | HIGH | Documentation updates in each PR |
| **Cost increase** | LOW | LOW | Monitor Firebase usage, set billing alerts |

---

## Success Criteria

### Technical Success Metrics

- [ ] **Data Isolation:** Zero cross-school data leaks in security audit
- [ ] **Query Performance:** <2s load time for pages with schoolId filtering
- [ ] **Test Coverage:** 80%+ unit test coverage, all E2E scenarios passing
- [ ] **Type Safety:** Zero TypeScript errors in production build
- [ ] **Security Rules:** All 16 collections have schoolId validation
- [ ] **Index Coverage:** All queries have supporting indexes
- [ ] **Migration Success:** 100% of documents have valid schoolId

### Business Success Metrics

- [ ] **Cost Reduction:** 60%+ reduction in Firebase costs for 10 schools
- [ ] **Deployment Time:** <30 minutes to onboard new school
- [ ] **Update Efficiency:** Single deploy updates all schools
- [ ] **User Satisfaction:** No complaints about seeing wrong school's data
- [ ] **Scalability:** Can support 50+ schools on one project

### Operational Success Metrics

- [ ] **Uptime:** 99.9% uptime during and after migration
- [ ] **Error Rate:** <0.1% error rate in production
- [ ] **Support Tickets:** No increase in support tickets
- [ ] **Rollback:** Can rollback to single-tenant in <1 hour if needed

---

## Rollback Plan

### Immediate Rollback (<1 hour)

**If critical issue discovered within first 24 hours:**

1. **Revert Web App:**
   ```bash
   firebase hosting:rollback --project edusync-sis
   ```

2. **Revert Security Rules:**
   ```bash
   git checkout main~1 firestore.rules
   firebase deploy --only firestore:rules --project edusync-sis
   ```

3. **Revert Functions:**
   ```bash
   firebase functions:delete --project edusync-sis
   git checkout main~1 functions/
   firebase deploy --only functions --project edusync-sis
   ```

4. **Communicate:**
   - Email all users: "Temporary rollback, investigating issue"
   - Post status update on status page

### Data Rollback (1-4 hours)

**If data corruption detected:**

1. **Restore from Backup:**
   ```bash
   # Restore Firestore from backup
   gcloud firestore import gs://edusync-backups/2025-11-08 \
     --project edusync-sis
   ```

2. **Verify Data Integrity:**
   - Run validation scripts
   - Manually check critical collections

3. **Re-deploy Single-Tenant Code:**
   ```bash
   git revert <multi-tenant-commits>
   npm run build:prod
   firebase deploy --project edusync-sis
   ```

### Partial Rollback (Feature Flags)

**If specific feature broken:**

Use feature flags to disable multi-tenant features:

```typescript
// .env.production
VITE_ENABLE_MULTI_TENANT=false

// In code
const isMultiTenant = import.meta.env.VITE_ENABLE_MULTI_TENANT === 'true';

if (isMultiTenant) {
  // Use schoolId filtering
} else {
  // Fall back to single-tenant queries
}
```

---

## Next Steps

1. **Review this plan** with team
2. **Create GitHub Project** and issues
3. **Begin Phase 1** (Foundation & Design)
4. **Weekly progress reviews** every Friday
5. **Update this document** as plan evolves

---

**Document Owner:** Development Team  
**Stakeholders:** Product, Engineering, Operations  
**Review Cadence:** Weekly  
**Version:** 1.0  
