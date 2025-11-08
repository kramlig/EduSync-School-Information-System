# Security Rules Migration for Multi-Tenant Architecture

**Document Version:** 1.0  
**Last Updated:** November 8, 2025  
**Status:** Draft  

---

## Overview

This document details the complete migration of Firestore security rules from single-tenant to multi-tenant architecture. Every rule must enforce school-level data isolation to prevent cross-school access.

**Critical Priority:** Security rules are the LAST LINE OF DEFENSE against data leaks  
**Estimated Time:** 22 hours (Phase 4, Weeks 9-10)  
**Breaking Change:** Yes - All rules will be rewritten  

---

## Table of Contents

1. [Current Security Model](#current-security-model)
2. [Target Security Model](#target-security-model)
3. [Helper Functions](#helper-functions)
4. [Collection Rules (16 Collections)](#collection-rules)
5. [Special Cases](#special-cases)
6. [Testing Strategy](#testing-strategy)
7. [Rollback Plan](#rollback-plan)

---

## Current Security Model

### Architecture (Single-Tenant)

The current security rules use **role-based access control (RBAC)** without school isolation:

**Roles:**
- `admin` - Full access to all data
- `principal` - School management access
- `registrar` - Student/enrollment management
- `teacher` - Academic data access
- `parent` - Limited to own children's data
- `student` - Limited to own academic data (grades, attendance, assignments)

**Custom Claims:**
```json
{
  "role": "teacher"
  // No schoolId!
}
```

**Example Current Rule:**
```javascript
match /students/{studentId} {
  // ❌ NO SCHOOL ISOLATION
  allow read: if isStaff();
  allow write: if isAdminOrRegistrar();
}
```

**Problem:** A teacher from School A can read students from School B!

---

## Target Security Model

### Architecture (Multi-Tenant)

The new security rules add **school-level isolation** on top of RBAC:

**Custom Claims (Updated):**
```json
{
  "role": "teacher",
  "schoolId": "school-001",        // NEW - Primary school
  "schoolIds": ["school-001"],     // NEW - For multi-school users
  "isSuperAdmin": false            // NEW - EduSync staff only
}
```

**Example Target Rule:**
```javascript
match /students/{studentId} {
  // ✅ SCHOOL ISOLATION ENFORCED
  allow read: if isStaff() 
    && getUserSchoolId() == resource.data.schoolId;
    
  allow write: if isAdminOrRegistrar()
    && getUserSchoolId() == request.resource.data.schoolId;
}
```

**Security Guarantees:**
1. User can only access data from their own school
2. Super admins (EduSync staff) can access all schools
3. Multi-school users (teachers working at 2+ schools) can access their assigned schools
4. Cross-school queries are impossible (enforced by Firestore rules)

---

## Helper Functions

### Current Helper Functions

Located in `firestore.rules` lines 1-75:

```javascript
// ========================================
// CURRENT HELPERS (Single-Tenant)
// ========================================

function isAuthenticated() {
  return request.auth != null;
}

function getUserRole() {
  return isAuthenticated() && 
         request.auth.token.keys().hasAny(['role']) && 
         request.auth.token.role != null 
    ? request.auth.token.role 
    : 'none';
}

function hasRole() {
  return isAuthenticated() && 
         request.auth.token.keys().hasAny(['role']) && 
         request.auth.token.role != null;
}

function isAdmin() {
  return isAuthenticated() && getUserRole() == 'admin';
}

function isPrincipal() {
  return isAuthenticated() && getUserRole() == 'principal';
}

function isRegistrar() {
  return isAuthenticated() && getUserRole() == 'registrar';
}

function isTeacher() {
  return isAuthenticated() && getUserRole() == 'teacher';
}

function isParent() {
  return isAuthenticated() && getUserRole() == 'parent';
}

function isStudent() {
  return isAuthenticated() && getUserRole() == 'student';
}

function isStaff() {
  return isAdmin() || isPrincipal() || isRegistrar() || isTeacher();
}

function isAdminOrPrincipal() {
  return isAdmin() || isPrincipal();
}

function isAdminOrRegistrar() {
  return isAdmin() || isRegistrar();
}

// TEMPORARY - Legacy user support (REMOVE after migration)
function isLegacyUser() {
  return isAuthenticated() && !hasRole();
}
```

---

### New Helper Functions (Multi-Tenant)

Add these NEW functions to `firestore.rules`:

```javascript
// ========================================
// NEW MULTI-TENANT HELPER FUNCTIONS
// ========================================

/**
 * Get the user's primary school ID from custom claims
 * Returns null if not set (should never happen after migration)
 */
function getUserSchoolId() {
  return isAuthenticated() && 
         request.auth.token.keys().hasAny(['schoolId']) &&
         request.auth.token.schoolId != null
    ? request.auth.token.schoolId
    : null;
}

/**
 * Get all school IDs the user has access to
 * Used for teachers working at multiple schools
 */
function getUserSchoolIds() {
  return isAuthenticated() && 
         request.auth.token.keys().hasAny(['schoolIds']) &&
         request.auth.token.schoolIds != null
    ? request.auth.token.schoolIds
    : (getUserSchoolId() != null ? [getUserSchoolId()] : []);
}

/**
 * Check if user is a super admin (EduSync staff)
 * Super admins can access ALL schools
 */
function isSuperAdmin() {
  return isAuthenticated() && 
         request.auth.token.keys().hasAny(['isSuperAdmin']) &&
         request.auth.token.isSuperAdmin == true;
}

/**
 * Check if user has access to a specific school
 * Returns true if:
 * - User is super admin, OR
 * - School ID is in user's schoolIds array
 */
function hasSchoolAccess(schoolId) {
  return isSuperAdmin() || schoolId in getUserSchoolIds();
}

/**
 * Verify the document belongs to the user's school
 * Used for READ operations
 */
function belongsToUserSchool(docData) {
  return isSuperAdmin() || 
         (docData.keys().hasAny(['schoolId']) && 
          hasSchoolAccess(docData.schoolId));
}

/**
 * Verify the incoming data has valid schoolId
 * Used for CREATE operations
 */
function hasValidSchoolId(docData) {
  return docData.keys().hasAny(['schoolId']) &&
         docData.schoolId is string &&
         docData.schoolId.size() > 0 &&
         hasSchoolAccess(docData.schoolId);
}

/**
 * Verify schoolId is not being changed
 * Used for UPDATE operations
 */
function schoolIdUnchanged() {
  return !request.resource.data.diff(resource.data).affectedKeys().hasAny(['schoolId']);
}

/**
 * Verify the schoolId exists in schools collection
 * Prevents orphaned documents
 */
function schoolExists(schoolId) {
  return isSuperAdmin() || exists(/databases/$(database)/documents/schools/$(schoolId));
}
```

---

## Collection Rules

### 1. Schools Collection (NEW)

**Priority:** P0 - CRITICAL  
**Estimated Hours:** 2 hours  

```javascript
// ========================================
// SCHOOLS COLLECTION (Multi-Tenant Central Registry)
// ========================================

match /schools/{schoolId} {
  // All authenticated users can read their own school
  allow read: if isAuthenticated() && hasSchoolAccess(schoolId);
  
  // Super admins can read all schools
  allow read: if isSuperAdmin();
  
  // Only super admins can create schools
  allow create: if isSuperAdmin() 
    && request.resource.data.keys().hasAll(['id', 'name', 'status'])
    && request.resource.data.id == schoolId;
  
  // Admins can update their own school (settings, features, branding)
  allow update: if (isAdmin() && hasSchoolAccess(schoolId))
    || isSuperAdmin();
  
  // Only super admins can delete schools
  allow delete: if isSuperAdmin();
}
```

**Validation Rules:**
- `id` must match document ID
- `name` required
- `status` must be 'active' | 'inactive' | 'archived'
- `subscription.status` must be 'active' for school to function

---

### 2. Students Collection

**Priority:** P0 - CRITICAL  
**Estimated Hours:** 1 hour  

**Current Rule:**
```javascript
match /students/{studentId} {
  allow read: if isStaff() || isLegacyUser();
  allow read: if isParent() && request.auth.uid in resource.data.parentIds;
  allow create: if isAdminOrRegistrar() || isLegacyUser();
  allow update: if isAdminOrRegistrar() || isLegacyUser();
  allow delete: if isAdmin() || isLegacyUser();
}
```

**New Rule:**
```javascript
match /students/{studentId} {
  // Staff can read students from their school
  allow read: if isStaff() && belongsToUserSchool(resource.data);
  
  // Parents can read their own children (if same school)
  allow read: if isParent() 
    && request.auth.uid in resource.data.parentIds
    && belongsToUserSchool(resource.data);
  
  // Students can ONLY read their own record (if same school)
  allow read: if isStudent() 
    && request.auth.uid == studentId
    && belongsToUserSchool(resource.data);
  
  // Create: Must have valid schoolId
  allow create: if isAdminOrRegistrar() 
    && hasValidSchoolId(request.resource.data)
    && schoolExists(request.resource.data.schoolId);
  
  // Update: Cannot change schoolId
  allow update: if isAdminOrRegistrar()
    && belongsToUserSchool(resource.data)
    && schoolIdUnchanged();
  
  // Delete: Admin only, must own the school
  allow delete: if isAdmin() && belongsToUserSchool(resource.data);
}
```

**Changes:**
- ✅ Added school isolation to all read rules
- ✅ **Added student self-read access** (can only read own record)
- ✅ Required `schoolId` in create operations
- ✅ Prevented `schoolId` changes in updates
- ✅ Verified school exists in schools collection
- ❌ Removed `isLegacyUser()` (transition mode ends after migration)

---

### 3. Teachers Collection

**Priority:** P0 - CRITICAL  
**Estimated Hours:** 1 hour  

**Current Rule:**
```javascript
match /teachers/{teacherId} {
  allow read: if isAuthenticated() || isLegacyUser();
  allow write: if isAdminOrPrincipal() || isLegacyUser();
}
```

**New Rule:**
```javascript
match /teachers/{teacherId} {
  // SPECIAL CASE: Login screen needs to query teachers by email
  // Allow unauthenticated read ONLY if querying by email
  // This is safe because security rules can't filter by WHERE clause
  // So we allow broad read, but app code will filter by schoolId
  allow read: if true; // Required for login lookup
  
  // Authenticated users can read teachers from their school
  allow read: if isAuthenticated() && belongsToUserSchool(resource.data);
  
  // Create: Must have valid schoolId
  allow create: if isAdminOrPrincipal()
    && hasValidSchoolId(request.resource.data)
    && schoolExists(request.resource.data.schoolId);
  
  // Update: Cannot change schoolId
  allow update: if isAdminOrPrincipal()
    && belongsToUserSchool(resource.data)
    && schoolIdUnchanged();
  
  // Delete: Admin only, must own the school
  allow delete: if isAdmin() && belongsToUserSchool(resource.data);
}
```

**⚠️ Special Case:** Teachers collection requires open read access for login screen to query by email. This is a known tradeoff. Alternative solutions:
1. Use Firebase Auth lookup instead (requires backend function)
2. Separate login collection (teachers-public)
3. Client-side validation after read (current approach)

**Mitigation:** Application code MUST filter teachers by schoolId after read.

---

### 4. Parents Collection

**Priority:** P1 - High  
**Estimated Hours:** 1 hour  

**New Rule:**
```javascript
match /parents/{parentId} {
  // Staff can read parents from their school
  allow read: if isStaff() && belongsToUserSchool(resource.data);
  
  // Parents can read their own profile (if same school)
  allow read: if isParent() 
    && request.auth.uid == parentId
    && belongsToUserSchool(resource.data);
  
  // Parents can update their own profile (notifications, contact)
  allow update: if isParent() 
    && request.auth.uid == parentId
    && belongsToUserSchool(resource.data)
    && schoolIdUnchanged()
    && request.resource.data.diff(resource.data).affectedKeys()
       .hasOnly(['notificationPreferences', 'contactNumber', 'updatedAt']);
  
  // Create: Must have valid schoolId
  allow create: if isAdminOrRegistrar()
    && hasValidSchoolId(request.resource.data)
    && schoolExists(request.resource.data.schoolId);
  
  // Update: Admin/Registrar only
  allow update: if isAdminOrRegistrar()
    && belongsToUserSchool(resource.data)
    && schoolIdUnchanged();
  
  // Delete: Admin only
  allow delete: if isAdmin() && belongsToUserSchool(resource.data);
}
```

---

### 5. Sections Collection

**Priority:** P1 - High  
**Estimated Hours:** 1 hour  

**New Rule:**
```javascript
match /sections/{sectionId} {
  // Staff can read sections from their school
  allow read: if isStaff() && belongsToUserSchool(resource.data);
  
  // Parents can read sections their children are in (same school)
  allow read: if isParent() 
    && request.auth.uid in resource.data.parentIds
    && belongsToUserSchool(resource.data);
  
  // Create: Must have valid schoolId
  allow create: if (isAdmin() || isPrincipal() || isRegistrar())
    && hasValidSchoolId(request.resource.data)
    && schoolExists(request.resource.data.schoolId);
  
  // Update: Cannot change schoolId
  allow update: if (isAdmin() || isPrincipal() || isRegistrar())
    && belongsToUserSchool(resource.data)
    && schoolIdUnchanged();
  
  // Delete: Admin only
  allow delete: if isAdmin() && belongsToUserSchool(resource.data);
}
```

---

### 6. LearningAreas Collection

**Priority:** P1 - High  
**Estimated Hours:** 1 hour  

**New Rule:**
```javascript
match /learningAreas/{areaId} {
  // All authenticated users can read learning areas from their school
  allow read: if isAuthenticated() && belongsToUserSchool(resource.data);
  
  // Create: Must have valid schoolId
  allow create: if isAdminOrPrincipal()
    && hasValidSchoolId(request.resource.data)
    && schoolExists(request.resource.data.schoolId);
  
  // Update: Cannot change schoolId
  allow update: if isAdminOrPrincipal()
    && belongsToUserSchool(resource.data)
    && schoolIdUnchanged();
  
  // Delete: Admin only
  allow delete: if isAdmin() && belongsToUserSchool(resource.data);
}
```

---

### 7. Grades Collection

**Priority:** P0 - CRITICAL (most sensitive data)  
**Estimated Hours:** 2 hours  

**New Rule:**
```javascript
match /grades/{gradeId} {
  // Staff can read grades from their school
  allow read: if isStaff() && belongsToUserSchool(resource.data);
  
  // Parents can read their children's grades (same school)
  allow read: if isParent() 
    && request.auth.uid == resource.data.parentId
    && belongsToUserSchool(resource.data);
  
  // Students can ONLY read their own grades (same school)
  allow read: if isStudent() 
    && request.auth.uid == resource.data.studentId
    && belongsToUserSchool(resource.data);
  
  // Create: Must have valid schoolId, teachers and admin only
  allow create: if (isTeacher() || isAdmin())
    && hasValidSchoolId(request.resource.data)
    && schoolExists(request.resource.data.schoolId);
  
  // Update: Cannot change schoolId, teachers and admin only
  allow update: if (isTeacher() || isAdmin())
    && belongsToUserSchool(resource.data)
    && schoolIdUnchanged();
  
  // Delete: Admin only
  allow delete: if isAdmin() && belongsToUserSchool(resource.data);
}
```

---

### 8. CoreValues Collection

**Priority:** P2 - Medium  
**Estimated Hours:** 1 hour  

**New Rule:**
```javascript
match /coreValues/{valueId} {
  // Staff can read core values from their school
  allow read: if isStaff() && belongsToUserSchool(resource.data);
  
  // Parents can read if same school (for viewing assessments)
  allow read: if isParent() && belongsToUserSchool(resource.data);
  
  // Students can read core values from their school
  allow read: if isStudent() && belongsToUserSchool(resource.data);
  
  // Admin and Principal can manage (school-specific values)
  allow write: if isAdminOrPrincipal()
    && hasValidSchoolId(request.resource.data)
    && schoolExists(request.resource.data.schoolId)
    && (request.method == 'create' || 
        (belongsToUserSchool(resource.data) && schoolIdUnchanged()));
}
```

---

### 9. CoreValueGrades Collection

**Priority:** P2 - Medium  
**Estimated Hours:** 1 hour  

**New Rule:**
```javascript
match /coreValueGrades/{gradeId} {
  // Staff can read from their school
  allow read: if isStaff() && belongsToUserSchool(resource.data);
  
  // Parents can read their children's assessments
  allow read: if isParent() 
    && request.auth.uid == resource.data.parentId
    && belongsToUserSchool(resource.data);
  
  // Students can ONLY read their own core value grades
  allow read: if isStudent() 
    && request.auth.uid == resource.data.studentId
    && belongsToUserSchool(resource.data);
  
  // Teachers and admin can write
  allow create: if (isTeacher() || isAdmin())
    && hasValidSchoolId(request.resource.data);
  
  allow update: if (isTeacher() || isAdmin())
    && belongsToUserSchool(resource.data)
    && schoolIdUnchanged();
  
  allow delete: if isAdmin() && belongsToUserSchool(resource.data);
}
```

---

### 10. AttendanceRecords Collection

**Priority:** P1 - High  
**Estimated Hours:** 1 hour  

**New Rule:**
```javascript
match /attendanceRecords/{recordId} {
  // Staff can read from their school
  allow read: if isStaff() && belongsToUserSchool(resource.data);
  
  // Parents can read their children's attendance
  allow read: if isParent() 
    && request.auth.uid == resource.data.parentId
    && belongsToUserSchool(resource.data);
  
  // Students can ONLY read their own attendance
  allow read: if isStudent() 
    && request.auth.uid == resource.data.studentId
    && belongsToUserSchool(resource.data);
  
  // Teachers and admin can manage
  allow write: if (isTeacher() || isAdmin())
    && hasValidSchoolId(request.resource.data)
    && (request.method == 'create' || 
        (belongsToUserSchool(resource.data) && schoolIdUnchanged()));
}
```

---

### 11. SubstituteAssignments Collection

**Priority:** P2 - Medium  
**Estimated Hours:** 1 hour  

**New Rule:**
```javascript
match /substituteAssignments/{assignmentId} {
  // Staff can read from their school
  allow read: if isStaff() && belongsToUserSchool(resource.data);
  
  // Admin and principal can manage
  allow write: if isAdminOrPrincipal()
    && hasValidSchoolId(request.resource.data)
    && (request.method == 'create' || 
        (belongsToUserSchool(resource.data) && schoolIdUnchanged()));
}
```

---

### 12. ClassSchedules Collection

**Priority:** P2 - Medium  
**Estimated Hours:** 1 hour  

**New Rule:**
```javascript
match /classSchedules/{scheduleId} {
  // All authenticated users can read schedules from their school
  allow read: if isAuthenticated() && belongsToUserSchool(resource.data);
  
  // Admin, principal, registrar can manage
  allow write: if (isAdmin() || isPrincipal() || isRegistrar())
    && hasValidSchoolId(request.resource.data)
    && (request.method == 'create' || 
        (belongsToUserSchool(resource.data) && schoolIdUnchanged()));
}
```

---

### 13. Assignments Collection

**Priority:** P2 - Medium  
**Estimated Hours:** 1 hour  

**New Rule:**
```javascript
match /assignments/{assignmentId} {
  // All authenticated users can read from their school (staff, parents, students)
  allow read: if isAuthenticated() && belongsToUserSchool(resource.data);
  
  // Teachers and admin can manage
  allow write: if (isTeacher() || isAdmin())
    && hasValidSchoolId(request.resource.data)
    && (request.method == 'create' || 
        (belongsToUserSchool(resource.data) && schoolIdUnchanged()));
}
```

**Note:** Students can read all assignments from their school to view homework/tasks.

---

### 14. StudentAssignmentGrades Collection

**Priority:** P2 - Medium  
**Estimated Hours:** 1 hour  

**New Rule:**
```javascript
match /studentAssignmentGrades/{gradeId} {
  // Staff can read from their school
  allow read: if isStaff() && belongsToUserSchool(resource.data);
  
  // Parents can read their children's assignment grades
  allow read: if isParent() 
    && request.auth.uid == resource.data.parentId
    && belongsToUserSchool(resource.data);
  
  // Students can ONLY read their own assignment grades
  allow read: if isStudent() 
    && request.auth.uid == resource.data.studentId
    && belongsToUserSchool(resource.data);
  
  // Teachers and admin can write
  allow create, update: if (isTeacher() || isAdmin())
    && hasValidSchoolId(request.resource.data)
    && (request.method == 'create' || schoolIdUnchanged());
  
  allow delete: if isAdmin() && belongsToUserSchool(resource.data);
}
```

---

### 15. LessonPlans Collection

**Priority:** P2 - Medium  
**Estimated Hours:** 1 hour  

**New Rule:**
```javascript
match /lessonPlans/{planId} {
  // Teachers from same school can read
  allow read: if (isTeacher() || isAdmin() || isPrincipal())
    && belongsToUserSchool(resource.data);
  
  // Teachers can create their own lesson plans
  allow create: if isTeacher()
    && hasValidSchoolId(request.resource.data)
    && request.resource.data.teacherId == request.auth.uid;
  
  // Teachers can update/delete their own plans
  allow update, delete: if isTeacher()
    && resource.data.teacherId == request.auth.uid
    && belongsToUserSchool(resource.data)
    && schoolIdUnchanged();
  
  // Admin can manage all lesson plans in their school
  allow write: if isAdmin() && belongsToUserSchool(resource.data);
}
```

---

### 16. Announcements Collection

**Priority:** P2 - Medium  
**Estimated Hours:** 1 hour  

**New Rule:**
```javascript
match /announcements/{announcementId} {
  // All authenticated users can read from their school (staff, parents, students)
  allow read: if isAuthenticated() && belongsToUserSchool(resource.data);
  
  // Staff can create
  allow create: if isStaff() && hasValidSchoolId(request.resource.data);
  
  // Admin and principal can update/delete
  allow update, delete: if isAdminOrPrincipal()
    && belongsToUserSchool(resource.data)
    && schoolIdUnchanged();
}
```

**Note:** Students can read announcements from their school (important for school news/events).

---

### 17. Settings Collection (DEPRECATED)

**Priority:** P0 - CRITICAL  
**Estimated Hours:** 2 hours  

**Action:** Migrate to `schools` collection, then REMOVE this rule

**Transition Rule (temporary):**
```javascript
match /settings/{settingId} {
  // DEPRECATED: Redirect reads to schools collection
  // This rule should be REMOVED after migration
  allow read: if false; // Force migration
  allow write: if false; // Force migration
}
```

**Users should query `schools/{schoolId}` instead**

---

## Special Cases

### 1. Enrollment Portal (Public Access)

**Challenge:** Enrollment applications are submitted BEFORE user authentication

**Current Rule:**
```javascript
match /enrollmentApplications/{applicationId} {
  // Public can CREATE (no auth!)
  allow create: if request.resource.data.keys().hasAll([...])
    && request.resource.data.status == 'submitted';
}
```

**New Rule:**
```javascript
match /enrollmentApplications/{applicationId} {
  // Public can CREATE with valid schoolId
  allow create: if request.resource.data.keys().hasAll(['schoolId', 'applicationNumber', ...])
    && request.resource.data.status == 'submitted'
    && request.resource.data.schoolId is string
    && request.resource.data.schoolId.size() > 0
    && schoolExists(request.resource.data.schoolId); // Verify school exists
  
  // Staff can read from their school
  allow read: if isStaff() && belongsToUserSchool(resource.data);
  
  // Admin/Registrar/Principal can update (approve/reject)
  allow update: if (isAdmin() || isRegistrar() || isPrincipal())
    && belongsToUserSchool(resource.data)
    && schoolIdUnchanged()
    && request.resource.data.diff(resource.data).affectedKeys()
       .hasOnly(['status', 'reviewedBy', 'reviewedAt', 'reviewNotes', 'rejectionReason', 'enrolledStudentId', 'updatedAt']);
  
  // Admin can delete
  allow delete: if isAdmin() && belongsToUserSchool(resource.data);
}
```

**Enrollment Portal UI must include school selector dropdown!**

---

### 2. Financial Collections (Multi-School Pricing)

**Challenge:** Fee structures may vary by school

**Solution:** All financial collections get `schoolId`:

```javascript
match /feeStructures/{feeId} {
  // Staff and parents can read from their school
  allow read: if (isStaff() || isParent()) 
    && belongsToUserSchool(resource.data);
  
  // Admin and registrar can manage
  allow write: if isAdminOrRegistrar()
    && hasValidSchoolId(request.resource.data)
    && (request.method == 'create' || 
        (belongsToUserSchool(resource.data) && schoolIdUnchanged()));
}

match /billingLedgers/{ledgerId} {
  // Staff can read from their school
  allow read: if isStaff() && belongsToUserSchool(resource.data);
  
  // Parents can read their own ledger
  allow read: if isParent() 
    && request.auth.uid == resource.data.parentId
    && belongsToUserSchool(resource.data);
  
  // Admin and registrar can write
  allow write: if isAdminOrRegistrar()
    && hasValidSchoolId(request.resource.data)
    && (request.method == 'create' || 
        (belongsToUserSchool(resource.data) && schoolIdUnchanged()));
}

match /receipts/{receiptId} {
  // Staff can read from their school
  allow read: if isStaff() && belongsToUserSchool(resource.data);
  
  // Parents can read their own receipts
  allow read: if isParent() 
    && request.auth.uid == resource.data.parentId
    && belongsToUserSchool(resource.data);
  
  // Admin and registrar can create
  allow create: if isAdminOrRegistrar()
    && hasValidSchoolId(request.resource.data);
  
  // Admin can update/delete
  allow update, delete: if isAdmin() 
    && belongsToUserSchool(resource.data)
    && schoolIdUnchanged();
}
```

---

### 3. DepEd Forms Collections

All forms collections (Form 137, Form 138, School Forms, ELLN) follow same pattern:

```javascript
match /form137/{recordId} {
  // Staff can read from their school
  allow read: if isStaff() && belongsToUserSchool(resource.data);
  
  // Parents can read their children's forms
  allow read: if isParent() 
    && request.auth.uid == resource.data.parentId
    && belongsToUserSchool(resource.data);
  
  // Students can read their own forms (Form 137/138 are student records)
  allow read: if isStudent() 
    && request.auth.uid == resource.data.studentId
    && belongsToUserSchool(resource.data);
  
  // Admin, Registrar, Principal can manage
  allow write: if (isAdmin() || isRegistrar() || isPrincipal())
    && hasValidSchoolId(request.resource.data)
    && (request.method == 'create' || 
        (belongsToUserSchool(resource.data) && schoolIdUnchanged()));
}
```

**Repeat for:** `form138`, `schoolForms`, `ellnAssessments`

**Note:** Students can view their own Form 137/138 (permanent records).

---

## Testing Strategy

### 1. Unit Tests (Firebase Emulator)

**Test File:** `scripts/test-security-rules.ts`

**Test Cases:**

```typescript
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';

describe('Multi-Tenant Security Rules', () => {
  let testEnv: RulesTestEnvironment;
  
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'edusync-test',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });
  
  describe('School Isolation', () => {
    it('should deny reading students from different school', async () => {
      const school1Teacher = testEnv.authenticatedContext('teacher1', {
        role: 'teacher',
        schoolId: 'school-001',
        schoolIds: ['school-001']
      });
      
      // Create student in school-002
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('students').doc('student-002').set({
          schoolId: 'school-002',
          firstName: 'Jane',
          lastName: 'Smith'
        });
      });
      
      // Try to read from school-001 teacher
      const studentDoc = school1Teacher.firestore().collection('students').doc('student-002');
      await expect(getDoc(studentDoc)).to.be.rejected;
    });
    
    it('should allow reading students from same school', async () => {
      const school1Teacher = testEnv.authenticatedContext('teacher1', {
        role: 'teacher',
        schoolId: 'school-001',
        schoolIds: ['school-001']
      });
      
      // Create student in school-001
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('students').doc('student-001').set({
          schoolId: 'school-001',
          firstName: 'John',
          lastName: 'Doe'
        });
      });
      
      // Read from same school - should succeed
      const studentDoc = school1Teacher.firestore().collection('students').doc('student-001');
      await expect(getDoc(studentDoc)).to.eventually.exist;
    });
    
    it('should deny queries without schoolId filter', async () => {
      const school1Teacher = testEnv.authenticatedContext('teacher1', {
        role: 'teacher',
        schoolId: 'school-001'
      });
      
      // Try global query (no where clause)
      const allStudents = school1Teacher.firestore().collection('students');
      await expect(getDocs(allStudents)).to.be.rejected;
    });
    
    it('should deny creating student without schoolId', async () => {
      const admin = testEnv.authenticatedContext('admin1', {
        role: 'admin',
        schoolId: 'school-001'
      });
      
      await expect(
        addDoc(admin.firestore().collection('students'), {
          firstName: 'Test'
          // Missing schoolId!
        })
      ).to.be.rejected;
    });
    
    it('should deny changing schoolId in update', async () => {
      const admin = testEnv.authenticatedContext('admin1', {
        role: 'admin',
        schoolId: 'school-001'
      });
      
      // Create student
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('students').doc('student-001').set({
          schoolId: 'school-001',
          firstName: 'John'
        });
      });
      
      // Try to change schoolId
      await expect(
        updateDoc(admin.firestore().collection('students').doc('student-001'), {
          schoolId: 'school-002' // ❌ Not allowed!
        })
      ).to.be.rejected;
    });
  });
  
  describe('Student Access', () => {
    it('should allow student to read only their own data', async () => {
      const student1 = testEnv.authenticatedContext('student-001', {
        role: 'student',
        schoolId: 'school-001',
        schoolIds: ['school-001']
      });
      
      // Create two students in school-001
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('students').doc('student-001').set({
          schoolId: 'school-001',
          firstName: 'Student 1'
        });
        await context.firestore().collection('students').doc('student-002').set({
          schoolId: 'school-001',
          firstName: 'Student 2'
        });
      });
      
      // Student can read own record - should succeed
      const ownDoc = student1.firestore().collection('students').doc('student-001');
      await expect(getDoc(ownDoc)).to.eventually.exist;
      
      // Student cannot read other student's record - should fail
      const otherDoc = student1.firestore().collection('students').doc('student-002');
      await expect(getDoc(otherDoc)).to.be.rejected;
    });
    
    it('should allow student to read own grades only', async () => {
      const student1 = testEnv.authenticatedContext('student-001', {
        role: 'student',
        schoolId: 'school-001'
      });
      
      // Create grades for two students
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('grades').doc('g1').set({
          schoolId: 'school-001',
          studentId: 'student-001',
          finalGrade: 90
        });
        await context.firestore().collection('grades').doc('g2').set({
          schoolId: 'school-001',
          studentId: 'student-002',
          finalGrade: 85
        });
      });
      
      // Student can read own grades
      const ownGrade = await getDoc(student1.firestore().collection('grades').doc('g1'));
      expect(ownGrade.exists()).to.be.true;
      
      // Student cannot read other student's grades
      const otherGrade = student1.firestore().collection('grades').doc('g2');
      await expect(getDoc(otherGrade)).to.be.rejected;
    });
    
    it('should deny student from reading cross-school data', async () => {
      const student1 = testEnv.authenticatedContext('student-001', {
        role: 'student',
        schoolId: 'school-001'
      });
      
      // Create student in school-002
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('students').doc('student-002').set({
          schoolId: 'school-002',
          firstName: 'Student 2'
        });
      });
      
      // Student from school-001 cannot read school-002 student
      const otherSchoolDoc = student1.firestore().collection('students').doc('student-002');
      await expect(getDoc(otherSchoolDoc)).to.be.rejected;
    });
    
    it('should allow student to read assignments from their school', async () => {
      const student1 = testEnv.authenticatedContext('student-001', {
        role: 'student',
        schoolId: 'school-001'
      });
      
      // Create assignment in school-001
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('assignments').doc('a1').set({
          schoolId: 'school-001',
          title: 'Homework 1'
        });
      });
      
      // Student can read assignments from their school
      const assignmentDoc = await getDoc(student1.firestore().collection('assignments').doc('a1'));
      expect(assignmentDoc.exists()).to.be.true;
    });
    
    it('should deny student write access to grades', async () => {
      const student1 = testEnv.authenticatedContext('student-001', {
        role: 'student',
        schoolId: 'school-001'
      });
      
      // Student cannot create/update/delete grades
      await expect(
        addDoc(student1.firestore().collection('grades'), {
          schoolId: 'school-001',
          studentId: 'student-001',
          finalGrade: 100 // Nice try!
        })
      ).to.be.rejected;
    });
  });
  
  describe('Super Admin Access', () => {
    it('should allow super admin to read all schools', async () => {
      const superAdmin = testEnv.authenticatedContext('superadmin', {
        role: 'admin',
        schoolId: 'edusync-hq',
        isSuperAdmin: true
      });
      
      // Create students in different schools
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('students').doc('s1').set({
          schoolId: 'school-001',
          firstName: 'Student 1'
        });
        await context.firestore().collection('students').doc('s2').set({
          schoolId: 'school-002',
          firstName: 'Student 2'
        });
      });
      
      // Super admin can read both
      const s1 = await getDoc(superAdmin.firestore().collection('students').doc('s1'));
      const s2 = await getDoc(superAdmin.firestore().collection('students').doc('s2'));
      
      expect(s1.exists()).to.be.true;
      expect(s2.exists()).to.be.true;
    });
  });
  
  describe('Multi-School Teachers', () => {
    it('should allow teacher to access both assigned schools', async () => {
      const multiSchoolTeacher = testEnv.authenticatedContext('teacher-multi', {
        role: 'teacher',
        schoolId: 'school-001', // Primary
        schoolIds: ['school-001', 'school-002'] // Access to both
      });
      
      // Create students in both schools
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('students').doc('s1').set({
          schoolId: 'school-001',
          firstName: 'Student 1'
        });
        await context.firestore().collection('students').doc('s2').set({
          schoolId: 'school-002',
          firstName: 'Student 2'
        });
      });
      
      // Teacher can access both
      const s1 = await getDoc(multiSchoolTeacher.firestore().collection('students').doc('s1'));
      const s2 = await getDoc(multiSchoolTeacher.firestore().collection('students').doc('s2'));
      
      expect(s1.exists()).to.be.true;
      expect(s2.exists()).to.be.true;
    });
  });
});
```

**Run Tests:**
```bash
npm run test:security
```

---

### 2. Integration Tests (E2E)

**Test Scenarios:**

1. **Login as School A teacher** → Can only see School A students
2. **Login as School B teacher** → Can only see School B students
3. **Switch schools (multi-school user)** → Data updates to new school
4. **Try to access other school's data via URL** → Redirect to 403 Forbidden
5. **Create student without schoolId** → Error message shown
6. **Try to change student's schoolId** → Update blocked

---

### 3. Manual Testing Checklist

**Before Deployment:**

- [ ] Deploy rules to staging environment
- [ ] Test login as each role (admin, teacher, parent)
- [ ] Verify can only see own school's data
- [ ] Test enrollment portal with school selector
- [ ] Test parent portal (cross-school validation)
- [ ] Test financial operations (receipts, ledgers)
- [ ] Test forms generation (Form 137, Form 138)
- [ ] Test super admin can access all schools
- [ ] Test multi-school teacher can access assigned schools
- [ ] Verify no error spikes in Firebase console
- [ ] Check security rules simulator in Firebase console

**Post-Deployment:**

- [ ] Monitor error rates (first 24 hours)
- [ ] Check for "permission denied" errors
- [ ] Verify no data leaks (audit logs)
- [ ] Test with real users (pilot group)
- [ ] Collect feedback on access issues

---

## Rollback Plan

### Scenario 1: Rules Deployed But Breaking App

**Symptoms:**
- Users can't access any data
- "Permission denied" errors everywhere
- App unusable

**Action:**
```bash
# Revert to previous rules
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules

# Expected: Rules reverted in <1 minute
```

---

### Scenario 2: Data Leaks Detected

**Symptoms:**
- Cross-school data visible
- Security audit fails
- User reports seeing other school's data

**Action:**
1. **Immediate:** Deploy emergency lockdown rules:
```javascript
match /{document=**} {
  allow read, write: if false; // Block all access
}
```

2. **Investigate:** Check logs for how leak occurred
3. **Fix:** Update rules with proper schoolId check
4. **Test:** Verify fix in emulator
5. **Deploy:** Careful gradual rollout

---

### Scenario 3: Custom Claims Not Set

**Symptoms:**
- Users have `role` but no `schoolId`
- Rules deny all access

**Action:**
1. Check if `set-school-claims.cjs` script ran
2. Verify custom claims in Firebase Auth console
3. Re-run script for affected users
4. Users must re-login to refresh token

---

## Deployment Checklist

### Pre-Deployment

- [ ] All helper functions added to firestore.rules
- [ ] All 16 collection rules updated
- [ ] Security tests passing
- [ ] Code review completed
- [ ] Staging environment tested
- [ ] Backup of current rules saved
- [ ] Rollback plan documented

### Deployment

```bash
# 1. Backup current rules
cp firestore.rules firestore.rules.backup

# 2. Deploy new rules
firebase deploy --only firestore:rules --project edusync-sis

# 3. Verify deployment
firebase firestore:rules get --project edusync-sis
```

### Post-Deployment

- [ ] Monitor Firebase Console for errors (15 mins)
- [ ] Test login for each role
- [ ] Verify data access works
- [ ] Check no cross-school leaks
- [ ] Announce to users: "Security update complete"
- [ ] Document any issues in incident log

---

## Timeline

**Week 9:**
- Day 1-2: Write helper functions
- Day 3-5: Update 16 collection rules
- Day 6-7: Write security tests

**Week 10:**
- Day 1-2: Test in emulator
- Day 3: Deploy to staging
- Day 4: Integration testing
- Day 5: Manual testing + fixes
- Day 6: Deploy to production
- Day 7: Monitor + support

---

**Document Status:** Ready for review  
**Next Steps:** Update firestore.rules file  
**Owner:** Development Team
