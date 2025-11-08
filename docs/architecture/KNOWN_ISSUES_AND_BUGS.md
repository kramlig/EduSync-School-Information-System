# Known Issues & Bugs - Multi-Tenant Migration

**Project:** EduSync Multi-Tenant Architecture  
**Status:** Pre-Migration (Current Single-Tenant)  
**Last Updated:** November 8, 2025

---

## Critical Issues (P0) - Must Fix Before Migration

### 🚨 Issue #MT-001: No SchoolId in Data Models
**Status:** Known Limitation  
**Severity:** P0-Critical  
**Component:** Database Schema  
**Affects:** All 16 collections

**Description:**
Current architecture has no `schoolId` field in any collection. All queries fetch data globally without school isolation.

**Impact:**
- Cannot support multiple schools in one Firebase project
- Data contamination risk if multi-tenant deployed as-is
- Security rules cannot enforce school-level access control

**Root Cause:**
System designed for single-school use case.

**Workaround (Current):**
Deploy separate Firebase project per school.

**Fix Required:**
Add `schoolId: string` to all interfaces and collections (Phase 2).

**Estimated Fix Time:** 76 hours (full migration)

---

### 🚨 Issue #MT-002: Global Settings Collection
**Status:** Known Limitation  
**Severity:** P0-Critical  
**Component:** SchoolSettings  
**Affects:** Settings management

**Description:**
Settings stored as singleton document (`settings/default`). Only one school can have settings.

**Current Schema:**
```typescript
Collection: settings
Document: default
{
  schoolName: "ABC School",
  region: "NCR",
  // ... single school only
}
```

**Impact:**
- Multiple schools would overwrite each other's settings
- Cannot customize per-school configuration
- School year is global (incompatible with multiple schools)

**Fix Required:**
Migrate to School model where each school has embedded settings.

**Target Schema:**
```typescript
Collection: schools
Document: school-001
{
  id: "school-001",
  name: "ABC School",
  settings: {
    region: "NCR",
    schoolYear: "2024-2025",
    // ... per-school settings
  }
}
```

**Estimated Fix Time:** 4 hours (Phase 2)

---

### 🚨 Issue #MT-003: No SchoolId in Auth Custom Claims
**Status:** Known Limitation  
**Severity:** P0-Critical  
**Component:** Firebase Authentication  
**Affects:** User access control

**Description:**
Custom claims only include `role` field. No `schoolId` to identify which school(s) a user belongs to.

**Current Claims:**
```json
{
  "role": "teacher",
  "email": "teacher@school.edu"
}
```

**Impact:**
- Cannot enforce school-level access in security rules
- Users could theoretically access any school's data
- Multi-school users (e.g., district admin) not supported

**Fix Required:**
Add `schoolId` and `schoolIds` to custom claims (Phase 4).

**Target Claims:**
```json
{
  "role": "teacher",
  "schoolId": "school-001",
  "schoolIds": ["school-001"],
  "isSuperAdmin": false
}
```

**Estimated Fix Time:** 6 hours (Phase 4)

---

### 🚨 Issue #MT-004: Security Rules Allow Cross-School Access
**Status:** Security Vulnerability (if multi-tenant)  
**Severity:** P0-Critical  
**Component:** Firestore Security Rules  
**Affects:** Data isolation

**Description:**
Current security rules check `isStaff()` but don't validate schoolId. In multi-tenant setup, Teacher A from School 1 could read students from School 2.

**Current Rule (Vulnerable):**
```javascript
match /students/{studentId} {
  allow read: if isStaff();  // ❌ No school check
}
```

**Impact:**
- Complete data breach potential in multi-tenant setup
- GDPR/DPA violation risk
- DepEd compliance failure

**Fix Required:**
Add school isolation to all collection rules (Phase 4).

**Target Rule:**
```javascript
match /students/{studentId} {
  allow read: if isStaff() && 
    getUserSchoolId() == resource.data.schoolId;  // ✅ School isolation
}
```

**Estimated Fix Time:** 8 hours (Phase 4)

---

## High Priority Issues (P1)

### ⚠️ Issue #MT-005: Missing Composite Indexes for SchoolId
**Status:** Not Yet Implemented  
**Severity:** P1-High  
**Component:** Firestore Indexes  
**Affects:** Query performance

**Description:**
When schoolId is added to queries, existing indexes won't support the new compound queries.

**Example Query (After Migration):**
```typescript
query(
  collection(db, 'students'),
  where('schoolId', '==', 'school-001'),
  orderBy('enrollmentDate', 'desc')
)
```

**Missing Index:**
```json
{
  "collectionGroup": "students",
  "fields": [
    { "fieldPath": "schoolId", "order": "ASCENDING" },
    { "fieldPath": "enrollmentDate", "order": "DESCENDING" }
  ]
}
```

**Impact:**
- Queries will fail with "index not found" error
- Poor query performance
- Timeout errors on large datasets

**Fix Required:**
Update `firestore.indexes.json` with ~20 new composite indexes (Phase 2).

**Estimated Fix Time:** 3 hours (Phase 2)

---

### ⚠️ Issue #MT-006: Enrollment Portal No School Selection
**Status:** Feature Gap  
**Severity:** P1-High  
**Component:** Enrollment Portal  
**Affects:** Public enrollment

**Description:**
Enrollment portal (`/enrollment`) has no school selector. Assumes single school.

**Current Flow:**
1. Parent visits edusync.ph/enrollment
2. Fills application
3. Submitted to... which school?

**Impact:**
- Cannot determine which school application is for
- Manual sorting required
- Poor UX for multi-school districts

**Fix Required:**
Add school selection step to enrollment flow (Phase 5).

**Target Flow:**
1. Select school from dropdown (or auto-detect from subdomain)
2. Fill application
3. Application tagged with schoolId
4. Routed to correct school admin

**Estimated Fix Time:** 6 hours (Phase 5)

---

### ⚠️ Issue #MT-007: No School Branding Support
**Status:** Feature Gap  
**Severity:** P1-High  
**Component:** UI/UX  
**Affects:** School identity

**Description:**
All schools see same branding (EduSync logo, colors). No way to customize per school.

**Impact:**
- Schools want their own logo in reports
- Principal signature on report cards
- School colors in UI
- Custom domain per school

**Fix Required:**
Add branding fields to School model (Phase 2) and apply in UI (Phase 5).

**School Model Addition:**
```typescript
interface School {
  // ... existing fields
  branding: {
    logoURL?: string;
    primaryColor?: string;      // #1E40AF
    secondaryColor?: string;    // #10B981
    customDomain?: string;      // abc-school.edusync.ph
    principalSignatureURL?: string;
  };
}
```

**Estimated Fix Time:** 8 hours (Phase 5)

---

## Medium Priority Issues (P2)

### ℹ️ Issue #MT-008: Parent Multi-School Support
**Status:** Feature Gap  
**Severity:** P2-Medium  
**Component:** Parent Portal  
**Affects:** Parents with kids in multiple schools

**Description:**
Parent with children in different schools (e.g., elementary + high school) needs separate accounts.

**Current Limitation:**
```typescript
interface Parent {
  id: string;
  studentIds: string[];  // All must be in same school
  // No schoolId field
}
```

**Desired:**
```typescript
interface Parent {
  id: string;
  schoolId: string;      // Primary school
  children: Array<{
    studentId: string;
    schoolId: string;    // Can be different schools
  }>;
}
```

**Workaround:**
Parent creates separate account per school.

**Fix Required:**
Support multi-school parent access (Phase 5).

**Estimated Fix Time:** 6 hours (Phase 5)

---

### ℹ️ Issue #MT-009: No Centralized School Management UI
**Status:** Feature Gap  
**Severity:** P2-Medium  
**Component:** Admin UI  
**Affects:** EduSync staff

**Description:**
No UI for EduSync staff to manage schools (create, configure, monitor).

**Needed Features:**
- School creation form
- School list/search
- Per-school analytics dashboard
- Bulk operations (e.g., update all schools)
- School status management (active/suspended)

**Fix Required:**
Build Super Admin dashboard (Post-migration enhancement).

**Estimated Fix Time:** 20 hours (Future)

---

### ℹ️ Issue #MT-010: Teacher Multi-School Assignments
**Status:** Feature Gap  
**Severity:** P2-Medium  
**Component:** Teacher Management  
**Affects:** Teachers teaching at multiple schools

**Description:**
Teacher who teaches at 2+ schools needs separate accounts.

**Use Case:**
- District resource teacher
- Part-time teacher at multiple schools
- Substitute teacher pool

**Current:**
Teacher has `schoolId: "school-001"` (single school only).

**Desired:**
Teacher has `schoolIds: ["school-001", "school-002"]` with school switcher in UI.

**Fix Required:**
Support multi-school teacher access (Post-migration).

**Estimated Fix Time:** 8 hours (Future)

---

## Low Priority Issues (P3)

### 📌 Issue #MT-011: No School Logo in PDFs
**Status:** Enhancement  
**Severity:** P3-Low  
**Component:** PDF Generation  
**Affects:** Form 137, Form 138, Report Cards

**Description:**
Generated PDFs use DepEd seal only. Schools want their own logo.

**Fix Required:**
Add school logo to PDF templates (Phase 5 or post-migration).

**Estimated Fix Time:** 4 hours

---

### 📌 Issue #MT-012: No Per-School Feature Flags
**Status:** Enhancement  
**Severity:** P3-Low  
**Component:** Feature Management

**Description:**
Features are global (enrollment enabled/disabled for all schools). Some schools want different features.

**Desired:**
```typescript
interface School {
  features: {
    enrollmentPortalEnabled: boolean;   // School A: true, School B: false
    financialEnabled: boolean;          // Private schools: true, Public: false
    parentPortalEnabled: boolean;
  };
}
```

**Fix Required:**
Already in target School model (Phase 2).

---

## Bugs in Current Single-Tenant System

### 🐛 Bug #ST-001: Infinite Loop in DepEd Forms Module
**Status:** RESOLVED ✅  
**Severity:** P0-Critical  
**Component:** DepEd Forms  
**Fixed In:** Commit ac86a5e

**Description:**
`useSchoolData(['settings'])` caused infinite render loops because settings object reference changed every render.

**Fix:**
Memoized feature flag hooks with `useMemo`.

**See:** `INFINITE_LOOP_PREVENTION.md`

---

### 🐛 Bug #ST-002: Footer Links Not Working
**Status:** RESOLVED ✅  
**Severity:** P2-Medium  
**Component:** Landing Page  
**Fixed In:** Commit ac86a5e

**Description:**
Footer anchor links (#features, #pricing, #faq) didn't scroll.

**Fix:**
Replaced hash anchors with JavaScript `scrollIntoView()` handlers.

---

## Migration-Specific Risks

### 🔥 Risk #MTR-001: Data Migration Failure
**Probability:** Low  
**Impact:** Critical  
**Mitigation:** Multiple backups, dry runs, manual verification

**Description:**
Migration script could fail partway through, leaving data in inconsistent state.

**Prevention:**
- Run dry run first (`--dryRun` flag)
- Backup all collections before migration
- Verify data integrity after migration
- Keep backups for 30 days

**Rollback Plan:**
Restore from backup and revert code.

---

### 🔥 Risk #MTR-002: Performance Degradation
**Probability:** Medium  
**Impact:** High  
**Mitigation:** Proper indexing, load testing, query optimization

**Description:**
Adding `where('schoolId', '==', ...)` to all queries could slow down performance if indexes not properly configured.

**Prevention:**
- Deploy all indexes before migration (Phase 2)
- Load test with 10+ schools
- Monitor query performance in Firebase Console
- Optimize slow queries

**Benchmark:**
- Target: <2s page load with schoolId filtering
- Current: ~1s without filtering

---

### 🔥 Risk #MTR-003: Auth Claim Sync Issues
**Probability:** Medium  
**Impact:** High  
**Mitigation:** Validation scripts, user re-login flow

**Description:**
Users may have stale custom claims (no schoolId) after migration.

**Prevention:**
- Force token refresh after migration
- Add validation: reject requests without schoolId
- Graceful error handling with re-login prompt

**Script:**
```javascript
// Validate all users have schoolId claim
node scripts/validate-school-claims.cjs --fix
```

---

## Testing Gaps (Pre-Migration)

### 🧪 Gap #TEST-001: No Multi-School Test Suite
**Status:** Not Yet Created  
**Component:** Testing

**Description:**
No tests for multi-school scenarios:
- Cross-school data isolation
- School switching
- Multi-school user access
- Super admin capabilities

**Fix Required:**
Create comprehensive multi-tenant test suite (Phase 6).

**Tests Needed:**
- Unit: 50+ tests
- Integration: 20+ scenarios
- E2E: 10+ Playwright tests
- Security: Penetration testing

---

### 🧪 Gap #TEST-002: No Security Audit
**Status:** Not Yet Performed  
**Component:** Security Testing

**Description:**
No formal security audit for multi-tenant access control.

**Fix Required:**
Hire security firm or perform internal security audit (Phase 6).

**Scope:**
- Attempt cross-school data access
- Test security rule bypasses
- Validate schoolId filtering
- Check for SQL injection equivalent

---

## Bug Triage Process

**Weekly Bug Review:** Every Monday 10 AM

**Priority Definitions:**
- **P0-Critical:** System down, data loss, security breach
- **P1-High:** Major feature broken, bad UX
- **P2-Medium:** Minor feature broken, workaround exists
- **P3-Low:** Cosmetic, nice-to-have

**SLA:**
- P0: Fix within 24 hours
- P1: Fix within 1 week
- P2: Fix within 1 month
- P3: Backlog (no SLA)

---

## Reporting Bugs

**Template:**
```markdown
**Bug Title:** [Component] Brief description

**Severity:** P0 | P1 | P2 | P3

**Environment:** 
- Production / Staging / Emulator
- Browser: Chrome 120
- OS: Windows 11

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. See error

**Expected Behavior:**
Should show...

**Actual Behavior:**
Shows error...

**Error Message:**
```
[Paste error message]
```

**Screenshots:**
[Attach if applicable]

**Additional Context:**
Any other relevant info
```

---

**Document Owner:** QA Team  
**Review Cadence:** Weekly  
**Last Updated:** November 8, 2025
