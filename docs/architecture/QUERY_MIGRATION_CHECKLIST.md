# Query Migration Checklist for Multi-Tenant Architecture

**Document Version:** 1.0  
**Last Updated:** November 8, 2025  
**Status:** Draft  

---

## Overview

This document provides a comprehensive checklist of ALL files containing Firestore queries that must be updated to include `schoolId` filtering for multi-tenant support.

**Total Files to Update:** ~60 files  
**Estimated Time:** 60-80 hours (Phase 3, Weeks 5-8)  
**Critical Priority:** All queries MUST filter by schoolId to prevent cross-school data leaks  

---

## Table of Contents

1. [Migration Pattern](#migration-pattern)
2. [Hooks (8 files)](#hooks-8-files)
3. [Services (10 files)](#services-10-files)
4. [Components (35+ files)](#components-35-files)
5. [Scripts (2 files)](#scripts-2-files)
6. [Common Pitfalls](#common-pitfalls)
7. [Validation Steps](#validation-steps)

---

## Migration Pattern

### Basic Query Pattern

**BEFORE (Single-Tenant):**
```typescript
const studentsRef = collection(db, 'students');
const q = query(studentsRef, where('gradeLevel', '==', 7));
const snapshot = await getDocs(q);
```

**AFTER (Multi-Tenant):**
```typescript
import { useSchoolContext } from '../contexts/SchoolContext'; // NEW

function MyComponent() {
  const { currentSchoolId } = useSchoolContext(); // NEW
  
  const studentsRef = collection(db, 'students');
  const q = query(
    studentsRef,
    where('schoolId', '==', currentSchoolId), // NEW - FIRST filter
    where('gradeLevel', '==', 7)
  );
  const snapshot = await getDocs(q);
}
```

### Real-Time Listener Pattern

**BEFORE:**
```typescript
useEffect(() => {
  const q = query(collection(db, 'students'));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setStudents(data);
  });
  return () => unsubscribe();
}, []);
```

**AFTER:**
```typescript
useEffect(() => {
  if (!currentSchoolId) return; // NEW - Guard clause
  
  const q = query(
    collection(db, 'students'),
    where('schoolId', '==', currentSchoolId) // NEW
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setStudents(data);
  });
  return () => unsubscribe();
}, [currentSchoolId]); // NEW - Add to deps
```

### CRUD Operations Pattern

**Create (addDoc):**
```typescript
// BEFORE
await addDoc(collection(db, 'students'), {
  firstName: 'John',
  lastName: 'Doe',
  gradeLevel: 7
});

// AFTER
await addDoc(collection(db, 'students'), {
  schoolId: currentSchoolId, // NEW - Add to ALL creates
  firstName: 'John',
  lastName: 'Doe',
  gradeLevel: 7
});
```

**Update (updateDoc):**
```typescript
// BEFORE
await updateDoc(doc(db, 'students', studentId), {
  gradeLevel: 8
});

// AFTER - No change needed (schoolId is immutable)
await updateDoc(doc(db, 'students', studentId), {
  gradeLevel: 8
});

// NEVER allow schoolId to change:
await updateDoc(doc(db, 'students', studentId), {
  schoolId: newSchoolId // ❌ WRONG - Security rules will block this
});
```

**Read Single Document:**
```typescript
// BEFORE
const docSnap = await getDoc(doc(db, 'students', studentId));

// AFTER - Verify schoolId matches
const docSnap = await getDoc(doc(db, 'students', studentId));
if (docSnap.exists() && docSnap.data().schoolId === currentSchoolId) {
  // OK to use
} else {
  throw new Error('Access denied');
}
```

---

## Hooks (8 files)

### 1. hooks/useSchoolData.ts

**Status:** 🔴 Not Started  
**Priority:** P0 - CRITICAL (used everywhere)  
**Estimated Hours:** 8 hours  
**Dependencies:** SchoolContext must exist first  

**Collections Queried:**
- `students` ✗
- `teachers` ✗
- `parents` ✗
- `sections` ✗
- `learningAreas` ✗
- `grades` ✗
- `coreValues` ✗
- `coreValueGrades` ✗
- `attendanceRecords` ✗
- `substituteAssignments` ✗
- `classSchedules` ✗
- `assignments` ✗
- `studentAssignmentGrades` ✗
- `lessonPlans` ✗
- `announcements` ✗
- `settings` ✗ (deprecate, use schools collection)

**Lines to Update:**
- Line ~63: `const snapshot = await getDocs(collection(db, collectionName));`
- All `onSnapshot` calls need `where('schoolId', '==', currentSchoolId)`
- All `addDoc` calls need `schoolId` in data
- All `setDoc` calls need `schoolId` in data

**Migration Steps:**
1. Import `useSchoolContext` at top
2. Add `const { currentSchoolId } = useSchoolContext();` in hook
3. Add schoolId filter to ALL queries
4. Add schoolId to ALL create operations
5. Add guard clauses: `if (!currentSchoolId) return;`
6. Update return types to include schoolId validation

**Test Cases:**
- [ ] Verify students query filters by schoolId
- [ ] Verify addStudent includes schoolId
- [ ] Verify updateStudent doesn't allow schoolId change
- [ ] Verify deleteStudent checks schoolId
- [ ] Verify cross-school access is blocked

---

### 2. hooks/useSchoolData.simplified.ts

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 4 hours  

**Collections Queried:**
- `announcements` ✗

**Lines to Update:**
- Line 63: `const snapshot = await getDocs(collection(db, collectionName));`
- Line 76: `await setDoc(docRef, { ... })`
- Line 204: `onSnapshot(collection(db, 'announcements'), ...)`

---

### 3. hooks/useSchoolData.REACT_QUERY_BACKUP.ts

**Status:** 🔴 Not Started  
**Priority:** P3 - Low (backup file, may not be used)  
**Estimated Hours:** 2 hours  

**Action:** Update if still needed, or delete if deprecated

---

### 4. hooks/useSchoolData.backup.ts

**Status:** 🔴 Not Started  
**Priority:** P3 - Low (backup file)  
**Estimated Hours:** 1 hour  

**Action:** Delete or update

---

### 5. hooks/usePaginatedStudents.ts

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 3 hours  

**Collections Queried:**
- `students` ✗

**Migration:**
- Add `schoolId` to pagination queries
- Ensure cursor-based pagination works with composite index

---

### 6. hooks/useFirestoreSyncStatus.ts

**Status:** 🔴 Not Started  
**Priority:** P2 - Medium  
**Estimated Hours:** 1 hour  

**Action:** Review if any collection queries exist

---

### 7. hooks/useOnlineStatus.ts

**Status:** ✅ No Changes Needed  
**Priority:** N/A  
**Reason:** No Firestore queries  

---

### 8. hooks/useDebounce.ts

**Status:** ✅ No Changes Needed  
**Priority:** N/A  
**Reason:** Utility hook, no Firestore queries  

---

## Services (10 files)

### 1. src/services/firestoreService.ts

**Status:** 🔴 Not Started  
**Priority:** P0 - CRITICAL  
**Estimated Hours:** 6 hours  

**Description:** Core CRUD service used throughout app  

**Functions to Update:**
- `getCollection()` - Add schoolId filter
- `getDocument()` - Verify schoolId matches
- `addDocument()` - Add schoolId to data
- `updateDocument()` - Prevent schoolId changes
- `deleteDocument()` - Verify schoolId

**Pattern:**
```typescript
// BEFORE
export async function getCollection(collectionName: string) {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// AFTER
export async function getCollection(
  collectionName: string,
  schoolId: string // NEW parameter
) {
  const q = query(
    collection(db, collectionName),
    where('schoolId', '==', schoolId) // NEW
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

---

### 2. src/services/firestoreReader.ts

**Status:** 🔴 Not Started  
**Priority:** P0 - CRITICAL  
**Estimated Hours:** 3 hours  

**Lines to Update:**
- Line 27: `const querySnapshot = await getDocs(collection(db, collectionName));`

**Migration:**
```typescript
// BEFORE
export async function readCollection(collectionName: string) {
  const querySnapshot = await getDocs(collection(db, collectionName));
  // ...
}

// AFTER
export async function readCollection(
  collectionName: string,
  schoolId: string
) {
  const q = query(
    collection(db, collectionName),
    where('schoolId', '==', schoolId)
  );
  const querySnapshot = await getDocs(q);
  // ...
}
```

---

### 3. src/services/paginationService.ts

**Status:** 🔴 Not Started  
**Priority:** P0 - CRITICAL  
**Estimated Hours:** 4 hours  

**Functions:**
- `getPaginatedCollection()`
- `getNextPage()`
- `getPaginatedStudents()`

**Lines to Update:**
- Line 53: `const collectionRef = collection(db, collectionName);`
- Line 80: `const q = query(collectionRef, ...constraints);`
- Line 159: `const collectionRef = collection(db, 'students');`
- Line 172: `const q = query(collectionRef, ...constraints);`

**Migration Pattern:**
```typescript
// Add schoolId as first constraint
const constraints = [
  where('schoolId', '==', schoolId), // NEW - FIRST
  ...otherConstraints
];
```

---

### 4. src/services/billingService.ts

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 6 hours  

**Collections Queried:**
- `receipts` ✗
- `feeStructures` ✗
- `billingLedgers` ✗
- `billingStatements` ✗
- `students` ✗ (for lookups)

**Functions to Update (20+):**
- `getReceiptsByStudent()` - Line 58
- `getFeeStructureByGrade()` - Line 95
- `saveFeeStructure()` - Line 127
- `getAllFeeStructures()` - Line 176
- `getLedgerByStudent()` - Line 284
- `recordPayment()` - Line 400
- `generateStatement()` - Line 585
- `getStatementsByStudent()` - Line 640
- `getReceiptsByStudent()` - Line 682

**Critical:** Fee structures may be school-specific (different pricing per school)

---

### 5. services/formsService.ts

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 8 hours  

**Collections Queried:**
- `form137` ✗
- `form138` ✗
- `schoolForms` (SF1, SF2, SF9) ✗
- `ellnAssessments` ✗
- `formGenerationJobs` ✗

**Functions to Update (25+):**
- `getAllForm137()` - Line 58
- `getForm137ByStudent()` - Line 77
- `getForm137BySection()` - Line 113
- `getForm137ById()` - Line 134
- `createForm137()` - Line 185
- `updateForm137()` - Line 224
- `deleteForm137()` - Line 289
- Plus similar functions for Form138, SchoolForms, ELLN

---

### 6. services/form137Generator.ts

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 4 hours  

**Collections Queried:**
- `students` ✗ - Line 59
- `sections` ✗ - Line 86
- `teachers` ✗ - Line 92
- `grades` ✗ - Line 106
- `learningAreas` ✗ - Line 116
- `attendanceRecords` ✗ - Line 128
- `coreValueGrades` ✗ - Line 159
- `coreValues` ✗ - Line 164

**Migration:**
All queries need schoolId filter. Generator should receive schoolId as parameter.

---

### 7. src/services/form138GeneratorV2.ts

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 3 hours  

Similar to form137Generator - needs schoolId in all queries

---

### 8. src/services/enrollmentDocumentService.ts

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 2 hours  

**Collections:**
- `enrollmentApplications` ✗

---

### 9. services/geminiService.ts

**Status:** ✅ No Changes Needed (Server-Side)  
**Priority:** N/A  
**Reason:** Calls Firebase Functions, doesn't query Firestore directly  

**Action:** Update corresponding Firebase Function to validate schoolId

---

### 10. src/services/dbService.ts

**Status:** 🔴 Not Started  
**Priority:** P2 - Medium  
**Estimated Hours:** 2 hours  

**Action:** Review and update if Firestore queries exist

---

## Components (35+ files)

### Core Components

#### 1. components/LoginScreen.tsx

**Status:** 🔴 Not Started  
**Priority:** P0 - CRITICAL  
**Estimated Hours:** 3 hours  

**Lines to Update:**
- Line 53: `const usersCol = collection(db, collectionName);`
- Line 54: `const q = query(usersCol, where('email', '==', email));`
- Line 66: `const allTeachers = await getDocs(collection(db, collectionName));`

**Special Case:** Login happens BEFORE we know schoolId!

**Solution:**
```typescript
// Option 1: Add schoolId to login form (school selector)
<select name="school">
  <option value="school-001">St. Mary's Academy</option>
  <option value="school-002">Sacred Heart School</option>
</select>

// Option 2: Look up user in all schools, then set schoolId in context
const teachersRef = collection(db, 'teachers');
const q = query(teachersRef, where('email', '==', email));
const snapshot = await getDocs(q); // No schoolId filter

if (!snapshot.empty) {
  const userData = snapshot.docs[0].data();
  setCurrentSchoolId(userData.schoolId); // Set context
  // Continue login...
}
```

**Recommended:** Option 2 (look up user's school from their document)

---

#### 2. components/StudentList.tsx

**Status:** 🔴 Not Started  
**Priority:** P0 - CRITICAL  
**Estimated Hours:** 2 hours  

**Collections:**
- `students` via useSchoolData hook ✗

**Migration:**
- Hook will handle filtering, but verify no direct queries
- Add schoolId to any direct addDoc calls

---

#### 3. components/TeacherList.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 2 hours  

**Collections:**
- `teachers` via useSchoolData hook ✗

---

#### 4. components/StudentProfile.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 3 hours  

**Actions:**
- Add schoolId validation when loading student
- Prevent access to students from other schools

---

#### 5. components/GradebookView.tsx / GradebookViewNew.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 4 hours each  

**Collections:**
- `students` ✗
- `sections` ✗
- `learningAreas` ✗
- `grades` ✗

---

#### 6. components/GradesView.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 3 hours  

**Collections:**
- `grades` ✗
- `students` ✗

---

#### 7. components/CoreValuesView.tsx / CoreValuesGradebookView.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 3 hours each  

**Collections:**
- `coreValues` ✗
- `coreValueGrades` ✗
- `students` ✗

---

#### 8. components/AttendanceView.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 3 hours  

**Collections:**
- `attendanceRecords` ✗
- `students` ✗
- `sections` ✗

---

#### 9. components/SubstituteView.tsx

**Status:** 🔴 Not Started  
**Priority:** P2 - Medium  
**Estimated Hours:** 2 hours  

**Collections:**
- `substituteAssignments` ✗
- `teachers` ✗
- `sections` ✗

---

#### 10. components/SchedulerView.tsx

**Status:** 🔴 Not Started  
**Priority:** P2 - Medium  
**Estimated Hours:** 2 hours  

**Collections:**
- `classSchedules` ✗
- `sections` ✗
- `teachers` ✗

---

#### 11. components/AssignmentsView.tsx

**Status:** 🔴 Not Started  
**Priority:** P2 - Medium  
**Estimated Hours:** 2 hours  

**Collections:**
- `assignments` ✗
- `studentAssignmentGrades` ✗

---

#### 12. components/LessonPlanView.tsx

**Status:** 🔴 Not Started  
**Priority:** P2 - Medium  
**Estimated Hours:** 2 hours  

**Collections:**
- `lessonPlans` ✗
- `learningAreas` ✗

---

#### 13. components/AnnouncementsView.tsx

**Status:** 🔴 Not Started  
**Priority:** P2 - Medium  
**Estimated Hours:** 2 hours  

**Collections:**
- `announcements` ✗

---

#### 14. components/SectionsView.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 2 hours  

**Collections:**
- `sections` ✗
- `teachers` ✗

---

#### 15. components/ParentsView.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 2 hours  

**Collections:**
- `parents` ✗
- `students` ✗

---

#### 16. components/SettingsView.tsx

**Status:** 🔴 Not Started  
**Priority:** P0 - CRITICAL  
**Estimated Hours:** 4 hours  

**Migration:**
- **MAJOR CHANGE:** Move from `settings` collection to `schools/{schoolId}`
- Update all reads/writes to use schools collection
- Migrate existing settings data

**Pattern:**
```typescript
// BEFORE
const settingsRef = doc(db, 'settings', 'schoolConfig');
const snapshot = await getDoc(settingsRef);
const settings = snapshot.data();

// AFTER
const { currentSchoolId } = useSchoolContext();
const schoolRef = doc(db, 'schools', currentSchoolId);
const snapshot = await getDoc(schoolRef);
const school = snapshot.data();
// Use school.academicConfig, school.features, etc.
```

---

### Parent Portal Components

#### 17. components/ParentDashboard.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 3 hours  

**Collections:**
- `students` (via parentIds) ✗
- `grades` ✗
- `announcements` ✗

---

#### 18. components/ParentProfile.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 2 hours  

---

#### 19. components/ParentBilling.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 3 hours  

**Collections:**
- `billingLedgers` ✗
- `receipts` ✗
- `students` ✗

---

#### 20. src/components/parent/ParentRegistration.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 3 hours  

**Lines to Update:**
- Line 136: `const q = query(studentsRef, where('lrn', '==', formData.studentLRN));`
- Line 187: `const emailQuery = query(parentsRef, where('email', '==', formData.parentEmail));`
- Line 226: `await setDoc(parentRef, newParent);` - Add schoolId
- Line 232: `await updateDoc(studentRef, { ... });`

**Special Case:** Parent registration may happen before knowing schoolId

**Solution:** Add school selector to registration form

---

### Enrollment Portal Components

#### 21. src/components/enrollment/portal/EnrollmentPortal.tsx

**Status:** 🔴 Not Started  
**Priority:** P0 - CRITICAL  
**Estimated Hours:** 4 hours  

**Special Case:** Public-facing enrollment form

**Solution:**
```tsx
// Add school selector at start of enrollment
<select name="school" required>
  <option value="">Select Your School</option>
  <option value="school-001">St. Mary's Academy</option>
  <option value="school-002">Sacred Heart School</option>
</select>
```

Then pass schoolId through entire enrollment flow.

---

#### 22. src/components/enrollment/forms/ApplicationForm.tsx

**Status:** 🔴 Not Started  
**Priority:** P0 - CRITICAL  
**Estimated Hours:** 3 hours  

**Lines to Update:**
- Line 273: `await addDoc(collection(db, 'enrollmentApplications'), finalApplication);`

**Migration:**
```typescript
await addDoc(collection(db, 'enrollmentApplications'), {
  ...finalApplication,
  schoolId: selectedSchoolId // From school selector
});
```

---

#### 23. src/components/enrollment/status/ApplicationStatus.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 2 hours  

**Lines:**
- Line 37-42: Query enrollmentApplications

---

#### 24. src/components/enrollment/admin/AdminEnrollmentDashboard.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 3 hours  

**Lines:**
- Line 29-37: Query enrollmentApplications

---

#### 25. src/components/enrollment/admin/ApplicationReview.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 3 hours  

**Lines:**
- Line 36: `getDoc(doc(db, 'enrollmentApplications', applicationId))`
- Line 143: `addDoc(collection(db, 'students'), newStudent)` - Add schoolId
- Line 147, 184, 208: Update application status

---

### Forms Components

#### 26. components/forms/Form137/Form137Dashboard.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 3 hours  

Uses `formsService.ts` - will be fixed when service is updated

---

#### 27. components/forms/Form138/Form138Dashboard.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 3 hours  

Uses `formsService.ts`

---

#### 28. components/forms/SchoolForms/SF1Dashboard.tsx

**Status:** 🔴 Not Started  
**Priority:** P2 - Medium  
**Estimated Hours:** 2 hours  

---

#### 29. components/forms/SchoolForms/SF2Dashboard.tsx

**Status:** 🔴 Not Started  
**Priority:** P2 - Medium  
**Estimated Hours:** 2 hours  

---

#### 30. components/forms/SchoolForms/SF9Dashboard.tsx

**Status:** 🔴 Not Started  
**Priority:** P2 - Medium  
**Estimated Hours:** 2 hours  

---

#### 31. components/forms/ELLN/ELLNDashboard.tsx

**Status:** 🔴 Not Started  
**Priority:** P2 - Medium  
**Estimated Hours:** 2 hours  

---

### Financial Components

#### 32. components/FeeStructureManager.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 3 hours  

Uses `billingService.ts`

---

#### 33. components/PaymentRecording.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 3 hours  

Uses `billingService.ts`

---

#### 34. components/FinancialReports.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 3 hours  

**Collections:**
- `receipts` ✗
- `billingLedgers` ✗
- `students` ✗

---

### Dashboard Components

#### 35. components/Dashboard.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 2 hours  

Aggregates data from multiple collections - all need schoolId filtering

---

#### 36. components/StudentDashboard.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 2 hours  

---

#### 37. components/ParentDashboard.tsx

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Hours:** 3 hours  

---

## Scripts (2 files)

### 1. scripts/test-security-rules.ts

**Status:** 🔴 Not Started  
**Priority:** P0 - CRITICAL  
**Estimated Hours:** 4 hours  

**Purpose:** Test suite for Firestore security rules  

**Migration:**
- Update all test queries to include schoolId
- Add tests for cross-school access denial
- Test that schoolId cannot be changed
- Test that queries without schoolId fail

**New Test Cases:**
```typescript
it('should deny access to students from different school', async () => {
  const school1User = testEnv.authenticatedContext('user1', {
    schoolId: 'school-001'
  });
  
  // Try to access school-002 student
  const studentDoc = doc(school1User.firestore(), 'students', 'student-from-school-002');
  await expect(getDoc(studentDoc)).to.be.rejected;
});

it('should deny queries without schoolId filter', async () => {
  const authedDb = testEnv.authenticatedContext('user1').firestore();
  const q = query(collection(authedDb, 'students')); // Missing schoolId filter
  await expect(getDocs(q)).to.be.rejected;
});
```

---

### 2. scripts/emu-exec-seed.cjs (or similar seed scripts)

**Status:** 🔴 Not Started  
**Priority:** P0 - CRITICAL  
**Estimated Hours:** 6 hours  

**Migration:**
- Create multi-tenant seed data
- Add schoolId to ALL seeded documents
- Create multiple schools in seeds (school-001, school-002, etc.)
- Create users assigned to different schools
- Test cross-school isolation

**Pattern:**
```javascript
// BEFORE
await addDoc(collection(db, 'students'), {
  firstName: 'John',
  lastName: 'Doe',
  gradeLevel: 7
});

// AFTER
await addDoc(collection(db, 'students'), {
  schoolId: 'school-001', // NEW
  firstName: 'John',
  lastName: 'Doe',
  gradeLevel: 7
});

// Create students for multiple schools
for (const schoolId of ['school-001', 'school-002']) {
  await addDoc(collection(db, 'students'), {
    schoolId, // Different school
    firstName: 'John',
    lastName: 'Doe',
    gradeLevel: 7
  });
}
```

---

## Common Pitfalls

### 1. Forgetting schoolId in Create Operations

❌ **WRONG:**
```typescript
await addDoc(collection(db, 'students'), {
  firstName: 'John',
  // Missing schoolId!
});
```

✅ **CORRECT:**
```typescript
await addDoc(collection(db, 'students'), {
  schoolId: currentSchoolId, // First field
  firstName: 'John',
});
```

---

### 2. Query Ordering Matters

❌ **WRONG:**
```typescript
query(
  collection(db, 'students'),
  where('gradeLevel', '==', 7),
  where('schoolId', '==', schoolId) // schoolId should be FIRST
);
```

✅ **CORRECT:**
```typescript
query(
  collection(db, 'students'),
  where('schoolId', '==', schoolId), // FIRST for index efficiency
  where('gradeLevel', '==', 7)
);
```

**Reason:** Firestore indexes are more efficient when schoolId is first

---

### 3. Missing Guard Clauses

❌ **WRONG:**
```typescript
useEffect(() => {
  const q = query(
    collection(db, 'students'),
    where('schoolId', '==', currentSchoolId) // May be undefined!
  );
  onSnapshot(q, setStudents);
}, [currentSchoolId]);
```

✅ **CORRECT:**
```typescript
useEffect(() => {
  if (!currentSchoolId) return; // Guard clause
  
  const q = query(
    collection(db, 'students'),
    where('schoolId', '==', currentSchoolId)
  );
  const unsubscribe = onSnapshot(q, setStudents);
  return () => unsubscribe();
}, [currentSchoolId]);
```

---

### 4. Not Validating schoolId on Read

❌ **WRONG:**
```typescript
const docSnap = await getDoc(doc(db, 'students', studentId));
const student = docSnap.data(); // May be from different school!
```

✅ **CORRECT:**
```typescript
const docSnap = await getDoc(doc(db, 'students', studentId));
if (!docSnap.exists()) throw new Error('Not found');

const student = docSnap.data();
if (student.schoolId !== currentSchoolId) {
  throw new Error('Access denied: Student belongs to different school');
}
```

---

### 5. Allowing schoolId Updates

❌ **WRONG:**
```typescript
await updateDoc(doc(db, 'students', studentId), {
  schoolId: newSchoolId, // NEVER allow this!
  gradeLevel: 8
});
```

✅ **CORRECT:**
```typescript
// schoolId is IMMUTABLE - never include in updates
await updateDoc(doc(db, 'students', studentId), {
  gradeLevel: 8
  // No schoolId!
});
```

**Security rules will block schoolId changes anyway**

---

### 6. Composite Index Not Created

❌ **SYMPTOM:**
```
Error: The query requires an index. 
You can create it here: https://console.firebase.google.com/...
```

✅ **SOLUTION:**
Add to `firestore.indexes.json`:
```json
{
  "collectionGroup": "students",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "schoolId", "order": "ASCENDING" },
    { "fieldPath": "gradeLevel", "order": "ASCENDING" }
  ]
}
```

Then deploy:
```bash
firebase deploy --only firestore:indexes
```

---

### 7. Login Before SchoolId Known

**Problem:** User login happens before we know their schoolId

**Solution:**
```typescript
async function handleLogin(email: string, password: string) {
  // 1. Firebase Auth login (no schoolId needed)
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // 2. Look up user in Firestore to get schoolId
  const teachersRef = collection(db, 'teachers');
  const q = query(teachersRef, where('email', '==', email));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) throw new Error('User not found');
  
  const userData = snapshot.docs[0].data();
  const schoolId = userData.schoolId;
  
  // 3. Set schoolId in context
  setCurrentSchoolId(schoolId);
  
  // 4. Now all future queries will filter by schoolId
}
```

---

## Validation Steps

### After Each File Update:

1. **Compile Check:**
   ```bash
   npm run build
   ```
   Verify no TypeScript errors

2. **Visual Inspection:**
   - [ ] All `query()` calls have `where('schoolId', '==', ...)`
   - [ ] All `addDoc()` calls include `schoolId` in data
   - [ ] All `setDoc()` calls include `schoolId` in data
   - [ ] `updateDoc()` calls do NOT include `schoolId`
   - [ ] Guard clauses exist: `if (!currentSchoolId) return;`

3. **Test in Emulator:**
   ```bash
   npm run dev:emu
   ```
   - [ ] Data loads correctly
   - [ ] Create operations work
   - [ ] Update operations work
   - [ ] Delete operations work

4. **Cross-School Test:**
   - [ ] Switch to different school in context
   - [ ] Verify old school's data is NOT visible
   - [ ] Verify new school's data IS visible

---

### After All Files Updated:

1. **Full Test Suite:**
   ```bash
   npm run test:e2e
   ```

2. **Security Rules Test:**
   ```bash
   npm run test:security
   ```

3. **Manual Testing:**
   - [ ] Login as school-001 user → see only school-001 data
   - [ ] Login as school-002 user → see only school-002 data
   - [ ] Try to access school-002 doc from school-001 → denied
   - [ ] Try query without schoolId → denied by rules

4. **Performance Testing:**
   - [ ] Page load times <2s
   - [ ] Queries complete <1s
   - [ ] Indexes properly deployed
   - [ ] No missing index errors

5. **Data Integrity:**
   - [ ] All documents have schoolId field
   - [ ] No orphaned documents (schoolId not in schools collection)
   - [ ] Referential integrity maintained

---

## Progress Tracking

**Total Files:** 60  
**Completed:** 0  
**In Progress:** 0  
**Not Started:** 60  

**Estimated Total Hours:** 180 hours  
**Actual Hours:** 0 hours  
**Remaining:** 180 hours  

**Completion:** [░░░░░░░░░░] 0%

---

## Next Steps

1. ✅ Complete SCHEMA_UPDATES.md
2. ✅ Complete QUERY_MIGRATION_CHECKLIST.md (this document)
3. ⏳ Create SECURITY_RULES_MIGRATION.md
4. ⏳ Create MULTI_TENANT_TEST_PLAN.md
5. ⏳ Create SchoolContext provider
6. ⏳ Update useSchoolData.ts hook (highest priority)
7. ⏳ Begin component migration

---

**Document Status:** Ready for review  
**Next Update:** After SchoolContext created  
**Owner:** Development Team
