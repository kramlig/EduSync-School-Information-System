# Multi-Tenant Test Plan

**Document Version:** 1.0  
**Last Updated:** November 8, 2025  
**Status:** Draft  

---

## Overview

This document defines the complete testing strategy for validating the multi-tenant migration. Testing occurs across all phases, with the most intensive testing in Phase 6 (Weeks 13-14).

**Test Coverage Target:** 80%+ unit test coverage  
**Performance Target:** <2s page load time  
**Security Target:** Zero cross-school data leaks  
**Total Test Effort:** ~40 hours (Phase 6)  

---

## Table of Contents

1. [Testing Pyramid](#testing-pyramid)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [E2E Tests (Playwright)](#e2e-tests-playwright)
5. [Security Tests](#security-tests)
6. [Performance Tests](#performance-tests)
7. [Manual Testing](#manual-testing)
8. [Test Data Strategy](#test-data-strategy)
9. [Success Criteria](#success-criteria)

---

## Testing Pyramid

```
           /\
          /  \  E2E Tests (10-15 scenarios)
         /    \  - Critical user journeys
        /------\ - Cross-school isolation
       /        \ 
      /  INTEG-  \ Integration Tests (20-30 scenarios)
     /    RATION  \ - Component interactions
    /--------------\ - Service layer tests
   /                \
  /   UNIT TESTS     \ Unit Tests (100+ scenarios)
 /  (Target: 80%)     \ - Functions, hooks, utilities
/______________________\ - Schema validation
```

**Test Distribution:**
- 70% Unit Tests - Fast, isolated, comprehensive
- 20% Integration Tests - Service interactions
- 10% E2E Tests - Critical paths only

---

## Unit Tests

### 1. Schema Validation Tests

**File:** `tests/unit/schema-validation.test.ts`  
**Priority:** P0 - CRITICAL  
**Estimated Hours:** 4 hours  

**Test Cases:**

```typescript
import { Student, Teacher, School } from '../types';
import { validateSchoolId, validateStudent } from '../utils/validators';

describe('Schema Validation', () => {
  describe('schoolId Validation', () => {
    it('should reject documents without schoolId', () => {
      const student = {
        id: 's1',
        firstName: 'John',
        // Missing schoolId
      };
      
      expect(() => validateStudent(student)).toThrow('schoolId is required');
    });
    
    it('should reject empty schoolId', () => {
      const student = {
        id: 's1',
        schoolId: '', // Empty string
        firstName: 'John',
      };
      
      expect(() => validateStudent(student)).toThrow('schoolId cannot be empty');
    });
    
    it('should accept valid schoolId', () => {
      const student = {
        id: 's1',
        schoolId: 'school-001',
        firstName: 'John',
        lastName: 'Doe',
        gradeLevel: 7,
        // ... other required fields
      };
      
      expect(() => validateStudent(student)).not.toThrow();
    });
    
    it('should reject invalid schoolId format', () => {
      const student = {
        id: 's1',
        schoolId: 'invalid format!', // Contains special chars
        firstName: 'John',
      };
      
      expect(() => validateStudent(student)).toThrow('Invalid schoolId format');
    });
  });
  
  describe('School Interface', () => {
    it('should validate required School fields', () => {
      const school: Partial<School> = {
        id: 'school-001',
        name: 'St. Mary Academy',
        // Missing other required fields
      };
      
      const result = validateSchool(school);
      expect(result.errors).toContain('contactEmail is required');
      expect(result.errors).toContain('academicConfig is required');
    });
    
    it('should validate School.subscription.plan enum', () => {
      const school: School = {
        // ... valid school data
        subscription: {
          plan: 'invalid-plan' as any, // Invalid enum
          status: 'active',
        },
      };
      
      expect(() => validateSchool(school)).toThrow('Invalid subscription plan');
    });
  });
});
```

**Coverage Target:** 100% for validation functions  
**Run Command:** `npm run test:unit -- schema-validation`  

---

### 2. Hook Tests (useSchoolData)

**File:** `tests/unit/useSchoolData.test.ts`  
**Priority:** P0 - CRITICAL  
**Estimated Hours:** 6 hours  

**Test Cases:**

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useSchoolData } from '../hooks/useSchoolData';
import { SchoolContext } from '../contexts/SchoolContext';

describe('useSchoolData Hook', () => {
  const mockSchoolContext = {
    currentSchoolId: 'school-001',
    setCurrentSchoolId: jest.fn(),
  };
  
  const wrapper = ({ children }) => (
    <SchoolContext.Provider value={mockSchoolContext}>
      {children}
    </SchoolContext.Provider>
  );
  
  it('should filter students by schoolId', async () => {
    const { result } = renderHook(() => useSchoolData(['students']), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Verify all students have schoolId: 'school-001'
    const students = result.current.students || [];
    expect(students.every(s => s.schoolId === 'school-001')).toBe(true);
  });
  
  it('should add schoolId when creating student', async () => {
    const { result } = renderHook(() => useSchoolData(['students']), { wrapper });
    
    const newStudent = {
      firstName: 'Jane',
      lastName: 'Smith',
      gradeLevel: 8,
    };
    
    await act(async () => {
      await result.current.addStudent(newStudent);
    });
    
    // Verify schoolId was added
    const createdStudent = mockFirestore.collection('students').doc();
    expect(createdStudent.data().schoolId).toBe('school-001');
  });
  
  it('should prevent schoolId changes in updates', async () => {
    const { result } = renderHook(() => useSchoolData(['students']), { wrapper });
    
    const updateData = {
      id: 'student-1',
      schoolId: 'school-002', // Try to change schoolId
      firstName: 'Updated Name',
    };
    
    await expect(
      result.current.updateStudent('student-1', updateData)
    ).rejects.toThrow('Cannot change schoolId');
  });
  
  it('should not return data if schoolId is null', async () => {
    const nullSchoolContext = {
      currentSchoolId: null,
      setCurrentSchoolId: jest.fn(),
    };
    
    const wrapper2 = ({ children }) => (
      <SchoolContext.Provider value={nullSchoolContext}>
        {children}
      </SchoolContext.Provider>
    );
    
    const { result } = renderHook(() => useSchoolData(['students']), { wrapper: wrapper2 });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.students).toEqual([]);
  });
});
```

**Coverage Target:** 90%+  
**Mock:** Firestore emulator or jest mocks  

---

### 3. Service Layer Tests

**File:** `tests/unit/firestoreService.test.ts`  
**Priority:** P0 - CRITICAL  
**Estimated Hours:** 4 hours  

**Test Cases:**

```typescript
import { getCollection, addDocument, updateDocument } from '../services/firestoreService';

describe('Firestore Service', () => {
  beforeEach(() => {
    // Clear Firestore emulator
    firebase.firestore().clearPersistence();
  });
  
  describe('getCollection', () => {
    it('should filter by schoolId', async () => {
      // Seed data
      await seedStudents([
        { id: 's1', schoolId: 'school-001', firstName: 'John' },
        { id: 's2', schoolId: 'school-002', firstName: 'Jane' },
      ]);
      
      const students = await getCollection('students', 'school-001');
      
      expect(students).toHaveLength(1);
      expect(students[0].id).toBe('s1');
    });
    
    it('should return empty array for non-existent school', async () => {
      const students = await getCollection('students', 'school-999');
      expect(students).toEqual([]);
    });
  });
  
  describe('addDocument', () => {
    it('should add schoolId to document', async () => {
      const newStudent = {
        firstName: 'Test',
        lastName: 'Student',
      };
      
      const docId = await addDocument('students', newStudent, 'school-001');
      
      const doc = await firebase.firestore().collection('students').doc(docId).get();
      expect(doc.data().schoolId).toBe('school-001');
    });
    
    it('should throw if schoolId is missing', async () => {
      await expect(
        addDocument('students', { firstName: 'Test' }, null)
      ).rejects.toThrow('schoolId is required');
    });
  });
  
  describe('updateDocument', () => {
    it('should prevent schoolId updates', async () => {
      // Create student
      await addDocument('students', { id: 's1', schoolId: 'school-001', firstName: 'John' }, 'school-001');
      
      // Try to update schoolId
      await expect(
        updateDocument('students', 's1', { schoolId: 'school-002' })
      ).rejects.toThrow('Cannot modify schoolId');
    });
  });
});
```

---

### 4. Utility Function Tests

**File:** `tests/unit/utils.test.ts`  
**Priority:** P1 - High  
**Estimated Hours:** 2 hours  

**Test Cases:**

```typescript
describe('Utility Functions', () => {
  describe('hasSchoolAccess', () => {
    it('should return true for super admin', () => {
      const user = {
        role: 'admin',
        schoolId: 'edusync-hq',
        isSuperAdmin: true,
      };
      
      expect(hasSchoolAccess(user, 'school-001')).toBe(true);
      expect(hasSchoolAccess(user, 'school-002')).toBe(true);
    });
    
    it('should return true for assigned school', () => {
      const user = {
        role: 'teacher',
        schoolId: 'school-001',
        schoolIds: ['school-001'],
      };
      
      expect(hasSchoolAccess(user, 'school-001')).toBe(true);
      expect(hasSchoolAccess(user, 'school-002')).toBe(false);
    });
    
    it('should return true for multi-school user', () => {
      const user = {
        role: 'teacher',
        schoolId: 'school-001',
        schoolIds: ['school-001', 'school-002'],
      };
      
      expect(hasSchoolAccess(user, 'school-001')).toBe(true);
      expect(hasSchoolAccess(user, 'school-002')).toBe(true);
      expect(hasSchoolAccess(user, 'school-003')).toBe(false);
    });
  });
});
```

---

## Integration Tests

### 1. Login Flow Integration Test

**File:** `tests/integration/login-flow.test.ts`  
**Priority:** P0 - CRITICAL  
**Estimated Hours:** 3 hours  

**Test Scenario:**

```typescript
describe('Login Flow with SchoolId', () => {
  it('should set schoolId in context after login', async () => {
    // 1. User enters credentials
    const email = 'teacher@school001.com';
    const password = 'password123';
    
    // 2. Firebase Auth login
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    expect(userCredential.user).toBeDefined();
    
    // 3. Fetch user document to get schoolId
    const teachersRef = collection(db, 'teachers');
    const q = query(teachersRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    
    expect(snapshot.docs).toHaveLength(1);
    const userData = snapshot.docs[0].data();
    expect(userData.schoolId).toBe('school-001');
    
    // 4. SchoolContext should be updated
    // (This would be tested in component test with React Testing Library)
  });
  
  it('should reject login if user not found in Firestore', async () => {
    const email = 'nonexistent@example.com';
    const password = 'password123';
    
    // Even if Firebase Auth succeeds, app should reject
    await expect(
      loginWithSchoolIdLookup(email, password)
    ).rejects.toThrow('User not found');
  });
});
```

---

### 2. Cross-School Data Isolation Test

**File:** `tests/integration/cross-school-isolation.test.ts`  
**Priority:** P0 - CRITICAL  
**Estimated Hours:** 4 hours  

**Test Scenario:**

```typescript
describe('Cross-School Data Isolation', () => {
  beforeAll(async () => {
    // Seed data for 2 schools
    await seedSchool('school-001', {
      students: 10,
      teachers: 5,
      grades: 100,
    });
    
    await seedSchool('school-002', {
      students: 15,
      teachers: 7,
      grades: 150,
    });
  });
  
  it('should only return school-001 students for school-001 teacher', async () => {
    const school1Teacher = createAuthContext({
      role: 'teacher',
      schoolId: 'school-001',
    });
    
    const students = await getCollection('students', 'school-001');
    
    expect(students).toHaveLength(10);
    expect(students.every(s => s.schoolId === 'school-001')).toBe(true);
  });
  
  it('should not allow queries without schoolId filter', async () => {
    const q = query(collection(db, 'students')); // No filter!
    
    await expect(getDocs(q)).rejects.toThrow('Permission denied');
  });
  
  it('should deny direct document access from wrong school', async () => {
    const school1Teacher = createAuthContext({
      role: 'teacher',
      schoolId: 'school-001',
    });
    
    // Try to access school-002 student directly
    const school2Student = doc(db, 'students', 'student-from-school-002');
    
    await expect(getDoc(school2Student)).rejects.toThrow('Permission denied');
  });
});
```

---

### 3. Enrollment Portal Integration Test

**File:** `tests/integration/enrollment-portal.test.ts`  
**Priority:** P1 - High  
**Estimated Hours:** 3 hours  

**Test Scenario:**

```typescript
describe('Enrollment Portal with School Selection', () => {
  it('should allow public to submit application with schoolId', async () => {
    const application = {
      schoolId: 'school-001', // Selected from dropdown
      applicationNumber: 'APP-2025-001',
      studentInfo: {
        firstName: 'New',
        lastName: 'Student',
      },
      status: 'submitted',
    };
    
    const docRef = await addDoc(collection(db, 'enrollmentApplications'), application);
    
    expect(docRef.id).toBeDefined();
    
    // Verify schoolId was saved
    const doc = await getDoc(docRef);
    expect(doc.data().schoolId).toBe('school-001');
  });
  
  it('should reject application without schoolId', async () => {
    const application = {
      // Missing schoolId!
      applicationNumber: 'APP-2025-002',
      studentInfo: { firstName: 'Test' },
      status: 'submitted',
    };
    
    await expect(
      addDoc(collection(db, 'enrollmentApplications'), application)
    ).rejects.toThrow('schoolId is required');
  });
  
  it('should only show applications from own school to staff', async () => {
    // Create applications for both schools
    await addDoc(collection(db, 'enrollmentApplications'), {
      schoolId: 'school-001',
      applicationNumber: 'APP-001',
      status: 'submitted',
    });
    
    await addDoc(collection(db, 'enrollmentApplications'), {
      schoolId: 'school-002',
      applicationNumber: 'APP-002',
      status: 'submitted',
    });
    
    // School-001 staff should only see APP-001
    const school1Admin = createAuthContext({
      role: 'admin',
      schoolId: 'school-001',
    });
    
    const applications = await getApplicationsForSchool('school-001');
    
    expect(applications).toHaveLength(1);
    expect(applications[0].applicationNumber).toBe('APP-001');
  });
});
```

---

## E2E Tests (Playwright)

### 1. Multi-School User Journey

**File:** `tests/e2e/multi-school-journey.spec.ts`  
**Priority:** P0 - CRITICAL  
**Estimated Hours:** 6 hours  

**Test Scenario:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Multi-School User Journey', () => {
  test('Teacher can switch between assigned schools', async ({ page }) => {
    // Login as multi-school teacher
    await page.goto('/login');
    await page.fill('[name="email"]', 'teacher-multi@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    
    // Should land on School 001 (primary school)
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="current-school"]')).toHaveText('School 001');
    
    // Verify can see School 001 students
    await page.click('nav >> text=Students');
    const studentCount1 = await page.locator('[data-testid="student-row"]').count();
    expect(studentCount1).toBeGreaterThan(0);
    
    // Switch to School 002
    await page.click('[data-testid="school-selector"]');
    await page.click('[data-testid="school-option-002"]');
    
    // Wait for context to update
    await expect(page.locator('[data-testid="current-school"]')).toHaveText('School 002');
    
    // Student list should update
    const studentCount2 = await page.locator('[data-testid="student-row"]').count();
    expect(studentCount2).not.toBe(studentCount1); // Different count
    
    // Verify all visible students belong to School 002
    const schoolIds = await page.locator('[data-testid="student-school-id"]').allTextContents();
    expect(schoolIds.every(id => id === 'school-002')).toBe(true);
  });
  
  test('Single-school teacher cannot access other schools', async ({ page }) => {
    // Login as School 001 teacher
    await page.goto('/login');
    await page.fill('[name="email"]', 'teacher-school001@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    
    // Try to access School 002 student profile directly
    await page.goto('/students/student-from-school-002');
    
    // Should see 403 Forbidden or redirect
    await expect(page).toHaveURL(/\/(403|dashboard)/);
    await expect(page.locator('text=/Access Denied|Not Found/')).toBeVisible();
  });
});
```

---

### 2. Enrollment Portal E2E

**File:** `tests/e2e/enrollment-portal.spec.ts`  
**Priority:** P1 - High  
**Estimated Hours:** 4 hours  

**Test Scenario:**

```typescript
test.describe('Enrollment Portal', () => {
  test('Public can submit application for specific school', async ({ page }) => {
    await page.goto('/enroll');
    
    // Step 1: Select School
    await expect(page.locator('h2:has-text("Select Your School")')).toBeVisible();
    await page.selectOption('[name="schoolId"]', 'school-001');
    await page.click('button:has-text("Continue")');
    
    // Step 2: Student Information
    await page.fill('[name="studentInfo.firstName"]', 'Test');
    await page.fill('[name="studentInfo.lastName"]', 'Applicant');
    await page.fill('[name="studentInfo.birthDate"]', '2015-01-01');
    await page.click('button:has-text("Next")');
    
    // ... fill other steps
    
    // Submit
    await page.click('button:has-text("Submit Application")');
    
    // Success message
    await expect(page.locator('text=Application Submitted')).toBeVisible();
    
    // Verify application in Firestore
    const applicationNumber = await page.locator('[data-testid="application-number"]').textContent();
    
    const app = await getDoc(doc(db, 'enrollmentApplications', applicationNumber));
    expect(app.data().schoolId).toBe('school-001');
  });
  
  test('Cannot submit without selecting school', async ({ page }) => {
    await page.goto('/enroll');
    
    // Try to continue without selecting school
    await page.click('button:has-text("Continue")');
    
    // Should show validation error
    await expect(page.locator('text=Please select a school')).toBeVisible();
  });
});
```

---

### 3. Forms Generation E2E

**File:** `tests/e2e/form137-generation.spec.ts`  
**Priority:** P1 - High  
**Estimated Hours:** 3 hours  

**Test Scenario:**

```typescript
test.describe('Form 137 Generation', () => {
  test('Generated form contains only same-school data', async ({ page }) => {
    // Login as School 001 teacher
    await page.goto('/login');
    // ... login steps
    
    // Navigate to Form 137 Dashboard
    await page.click('nav >> text=Forms');
    await page.click('text=Form 137');
    
    // Select student from School 001
    await page.click('[data-testid="student-selector"]');
    await page.click('[data-testid="student-option-001"]');
    
    // Generate form
    await page.click('button:has-text("Generate Form 137")');
    
    // Wait for generation
    await expect(page.locator('text=Form Generated Successfully')).toBeVisible({ timeout: 10000 });
    
    // Verify all data on form is from School 001
    const schoolName = await page.locator('[data-testid="form-school-name"]').textContent();
    expect(schoolName).toContain('School 001');
    
    // Check grades are filtered by schoolId
    const grades = await page.locator('[data-testid="grade-row"]').count();
    expect(grades).toBeGreaterThan(0);
  });
});
```

---

### 4. Student Portal E2E

**File:** `tests/e2e/student-portal.spec.ts`  
**Priority:** P1 - High  
**Estimated Hours:** 4 hours  

**Test Scenario:**

```typescript
test.describe('Student Portal', () => {
  test('Student can login and view own data only', async ({ page }) => {
    // Login as student from School 001
    await page.goto('/login');
    await page.fill('[name="email"]', 'student-001@school001.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    
    // Should land on Student Dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1:has-text("My Dashboard")')).toBeVisible();
    
    // Verify can see own grades
    await page.click('nav >> text=Grades');
    await expect(page.locator('[data-testid="student-grade-row"]')).toBeVisible();
    
    // Verify schoolId context is set
    const schoolId = await page.locator('[data-testid="current-school"]').textContent();
    expect(schoolId).toBe('school-001');
  });
  
  test('Student cannot access other students data', async ({ page }) => {
    // Login as student-001
    await page.goto('/login');
    await page.fill('[name="email"]', 'student-001@school001.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    
    // Try to access another student's profile directly
    await page.goto('/students/student-002');
    
    // Should see access denied or redirect
    await expect(page).toHaveURL(/\/(403|dashboard)/);
    await expect(page.locator('text=/Access Denied|Not Found/')).toBeVisible();
  });
  
  test('Student cannot access cross-school data', async ({ page }) => {
    // Login as student from School 001
    await page.goto('/login');
    await page.fill('[name="email"]', 'student-001@school001.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    
    // Try to navigate to School 002 student data
    await page.goto('/students/student-from-school-002');
    
    // Should be blocked
    await expect(page).toHaveURL(/\/(403|dashboard)/);
  });
  
  test('Student can view own grades from same school', async ({ page }) => {
    // Login as student
    await page.goto('/login');
    await page.fill('[name="email"]', 'student-001@school001.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    
    // Navigate to grades
    await page.click('nav >> text=Grades');
    
    // Should see only own grades
    const gradeRows = await page.locator('[data-testid="grade-row"]').count();
    expect(gradeRows).toBeGreaterThan(0);
    
    // All grades should be for this student
    const studentIds = await page.locator('[data-testid="grade-student-id"]').allTextContents();
    expect(studentIds.every(id => id === 'student-001')).toBe(true);
  });
  
  test('Student can view assignments from their school', async ({ page }) => {
    // Login as student
    await page.goto('/login');
    await page.fill('[name="email"]', 'student-001@school001.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    
    // Navigate to assignments
    await page.click('nav >> text=Assignments');
    
    // Should see assignments from School 001
    await expect(page.locator('[data-testid="assignment-row"]')).toBeVisible();
    
    // Verify all assignments are from school-001
    const schoolIds = await page.locator('[data-testid="assignment-school-id"]').allTextContents();
    expect(schoolIds.every(id => id === 'school-001')).toBe(true);
  });
  
  test('Student cannot modify grades', async ({ page }) => {
    // Login as student
    await page.goto('/login');
    await page.fill('[name="email"]', 'student-001@school001.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    
    // Navigate to grades
    await page.click('nav >> text=Grades');
    
    // Verify no edit buttons are visible
    const editButtons = await page.locator('button:has-text("Edit Grade")').count();
    expect(editButtons).toBe(0);
    
    // Grade fields should be read-only
    const gradeInputs = await page.locator('input[name="finalGrade"]').count();
    expect(gradeInputs).toBe(0);
  });
  
  test('Student can view attendance from their school', async ({ page }) => {
    // Login as student
    await page.goto('/login');
    await page.fill('[name="email"]', 'student-001@school001.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    
    // Navigate to attendance
    await page.click('nav >> text=Attendance');
    
    // Should see own attendance record
    await expect(page.locator('[data-testid="attendance-record"]')).toBeVisible();
    
    // Verify schoolId matches
    const schoolId = await page.locator('[data-testid="attendance-school-id"]').textContent();
    expect(schoolId).toBe('school-001');
  });
});
```

---

## Security Tests

### 1. Firestore Rules Unit Tests

**File:** `tests/security/firestore-rules.test.ts`  
**Priority:** P0 - CRITICAL  
**Estimated Hours:** 8 hours  

**See SECURITY_RULES_MIGRATION.md for complete test suite**

**Key Tests:**
- ✅ Deny reading students from different school
- ✅ Allow reading students from same school
- ✅ Deny queries without schoolId filter
- ✅ Deny creating documents without schoolId
- ✅ Deny changing schoolId in updates
- ✅ Super admin can access all schools
- ✅ Multi-school user can access assigned schools
- ✅ Parents can only read their own children's data
- ✅ Public can create enrollment applications with schoolId
- ✅ Settings collection deprecated (force migration)

**Run Command:**
```bash
npm run test:security
```

---

### 2. Penetration Testing

**Priority:** P0 - CRITICAL  
**Estimated Hours:** 4 hours  
**Performed By:** Security specialist or external auditor  

**Attack Scenarios:**

1. **Cross-School Data Leak:**
   - Login as School A user
   - Manually craft Firestore query to access School B data
   - Try direct document access via URL manipulation
   - **Expected:** All attempts blocked by security rules

2. **SchoolId Manipulation:**
   - Create student with valid schoolId
   - Use browser dev tools to change schoolId in update request
   - **Expected:** Update blocked by security rules

3. **Unauthenticated Access:**
   - Access app without logging in
   - Try to access protected routes
   - Try Firestore queries without auth token
   - **Expected:** All blocked

4. **Privilege Escalation:**
   - Login as parent
   - Try to access admin-only routes
   - Try to modify other users' data
   - **Expected:** All blocked

**Reporting:**
- Document all attack vectors tested
- Record any vulnerabilities found
- Provide remediation recommendations
- Re-test after fixes

---

## Performance Tests

### 1. Query Performance with SchoolId Filtering

**File:** `tests/performance/query-performance.test.ts`  
**Priority:** P1 - High  
**Estimated Hours:** 4 hours  

**Test Scenarios:**

```typescript
describe('Query Performance', () => {
  beforeAll(async () => {
    // Seed large dataset: 10 schools, 500 students each
    for (let i = 1; i <= 10; i++) {
      await seedSchool(`school-${String(i).padStart(3, '0')}`, {
        students: 500,
        teachers: 25,
        grades: 5000, // 10 grades per student
      });
    }
  });
  
  it('should query students in <1s with schoolId filter', async () => {
    const startTime = performance.now();
    
    const q = query(
      collection(db, 'students'),
      where('schoolId', '==', 'school-001'),
      where('gradeLevel', '==', 7)
    );
    
    const snapshot = await getDocs(q);
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(1000); // <1s
    expect(snapshot.size).toBeGreaterThan(0);
  });
  
  it('should handle pagination efficiently', async () => {
    const pageSize = 50;
    const startTime = performance.now();
    
    // Fetch first page
    const q = query(
      collection(db, 'students'),
      where('schoolId', '==', 'school-001'),
      orderBy('lastName'),
      limit(pageSize)
    );
    
    const snapshot = await getDocs(q);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(500); // <0.5s
    expect(snapshot.size).toBe(pageSize);
  });
  
  it('should query grades efficiently with composite index', async () => {
    const startTime = performance.now();
    
    const q = query(
      collection(db, 'grades'),
      where('schoolId', '==', 'school-001'),
      where('studentId', '==', 'student-001'),
      where('quarter', '==', 1)
    );
    
    const snapshot = await getDocs(q);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(500);
  });
});
```

**Metrics:**
- Query time <1s for simple queries
- Query time <2s for complex joins
- First page load <2s
- Pagination <0.5s per page

---

### 2. Load Testing

**Tool:** Artillery or k6  
**Priority:** P2 - Medium  
**Estimated Hours:** 3 hours  

**Test Scenario:**

```yaml
# artillery-load-test.yml
config:
  target: "https://edusync-sis.web.app"
  phases:
    - duration: 60
      arrivalRate: 10 # 10 users/sec
    - duration: 120
      arrivalRate: 50 # Ramp to 50 users/sec
    - duration: 60
      arrivalRate: 100 # Peak: 100 users/sec

scenarios:
  - name: "Login and View Students"
    flow:
      - post:
          url: "/api/login"
          json:
            email: "teacher@school001.com"
            password: "{{ $randomString() }}"
      - get:
          url: "/students?schoolId=school-001"
          expect:
            - statusCode: 200
            - contentType: json
      - think: 5 # 5 second pause
      - get:
          url: "/grades?schoolId=school-001&studentId=student-001"
```

**Run:**
```bash
artillery run artillery-load-test.yml
```

**Success Criteria:**
- <5% error rate under peak load
- p95 response time <2s
- No database connection errors
- No security rule violations

---

## Manual Testing

### Test Environment Setup

**Requirements:**
1. **Firestore Emulator** with multi-tenant seed data
2. **Test Accounts:**
   - Super Admin (EduSync staff)
   - School 001 Admin
   - School 001 Teacher
   - School 001 Parent
   - School 001 Student
   - School 002 Admin
   - School 002 Teacher
   - School 002 Student
   - Multi-school Teacher (001 + 002)
3. **Test Data:**
   - 2 schools fully configured
   - 50 students per school (with login credentials)
   - 10 teachers per school
   - 5 parents per school
   - Grades, attendance, forms data

---

### Manual Test Checklist

**Phase 1: Login & Authentication**

- [ ] Login as School 001 Teacher → See School 001 dashboard
- [ ] Login as School 002 Teacher → See School 002 dashboard
- [ ] Login as Multi-school Teacher → See school selector
- [ ] Login as Parent → See only own children's data
- [ ] Login as Student → See student dashboard with own data only
- [ ] Login fails for non-existent user
- [ ] Logout clears school context

**Phase 2: Data Isolation**

- [ ] School 001 Teacher can view School 001 students only
- [ ] School 001 Teacher cannot see School 002 students
- [ ] School 001 Student can view only own data
- [ ] School 001 Student cannot see School 002 data
- [ ] School 001 Student cannot see other School 001 students' data
- [ ] Direct URL access to School 002 student → 403 Forbidden
- [ ] Search only returns results from current school
- [ ] Filters work correctly with schoolId

**Phase 3: CRUD Operations**

- [ ] Create student → schoolId auto-added
- [ ] Update student → schoolId unchanged
- [ ] Delete student → Only from own school
- [ ] Create grade → schoolId auto-added
- [ ] Update grade → schoolId unchanged

**Phase 4: Enrollment Portal**

- [ ] School selector dropdown visible
- [ ] Cannot submit without school selection
- [ ] Application has correct schoolId
- [ ] School 001 staff sees only School 001 applications
- [ ] School 002 staff sees only School 002 applications

**Phase 5: Forms Generation**

- [ ] Generate Form 137 → Uses current school's data
- [ ] Generate Form 138 → Uses current school's data
- [ ] PDF contains correct school name/logo
- [ ] No cross-school data in generated forms

**Phase 6: Financial Operations**

- [ ] View billings → Only from current school
- [ ] Record payment → schoolId auto-added
- [ ] Generate receipt → Correct school details
- [ ] Financial reports → Current school only

**Phase 7: Multi-School Features**

- [ ] Switch schools → Data updates immediately
- [ ] Create student in School 001 → Has School 001 ID
- [ ] Switch to School 002, create student → Has School 002 ID
- [ ] Back to School 001 → Previous student still has School 001 ID

**Phase 8: Super Admin**

- [ ] Can access all schools
- [ ] Can switch to any school
- [ ] Can create new schools
- [ ] Can manage all data across schools

---

## Test Data Strategy

### Seed Data Structure

**schools Collection:**
```json
[
  {
    "id": "school-001",
    "name": "St. Mary's Academy",
    "status": "active",
    "subscription": { "plan": "trial", "status": "active" }
  },
  {
    "id": "school-002",
    "name": "Sacred Heart School",
    "status": "active",
    "subscription": { "plan": "basic", "status": "active" }
  }
]
```

**students Collection:**
```json
[
  { "id": "s1-001", "schoolId": "school-001", "firstName": "John", "lastName": "Doe", "gradeLevel": 7, "email": "student-001@school001.com", "password": "hashed_password" },
  { "id": "s1-002", "schoolId": "school-001", "firstName": "Jane", "lastName": "Smith", "gradeLevel": 8, "email": "student-002@school001.com", "password": "hashed_password" },
  { "id": "s2-001", "schoolId": "school-002", "firstName": "Bob", "lastName": "Johnson", "gradeLevel": 7, "email": "student-001@school002.com", "password": "hashed_password" },
  // ... 50+ students per school (all with login credentials)
]
```

**teachers Collection:**
```json
[
  { "id": "t1-001", "schoolId": "school-001", "email": "teacher1@school001.com", "role": "teacher" },
  { "id": "t2-001", "schoolId": "school-002", "email": "teacher1@school002.com", "role": "teacher" },
  { "id": "t-multi", "schoolId": "school-001", "schoolIds": ["school-001", "school-002"], "email": "teacher-multi@example.com" }
]
```

**Seed Script:**
```bash
npm run emu:seed:multi-tenant
```

---

## Success Criteria

### Functional Criteria

- [ ] All unit tests passing (80%+ coverage)
- [ ] All integration tests passing
- [ ] All E2E critical paths passing
- [ ] Zero security vulnerabilities found
- [ ] All manual test checklist items pass

### Performance Criteria

- [ ] Page load time <2s (p95)
- [ ] Query time <1s (p95)
- [ ] No index warnings in console
- [ ] <5% error rate under load

### Security Criteria

- [ ] Zero cross-school data leaks
- [ ] All security rules tests passing
- [ ] Penetration test passed
- [ ] No "permission denied" errors for legitimate access
- [ ] Audit log shows no unauthorized access

### Data Integrity Criteria

- [ ] 100% of documents have schoolId
- [ ] No orphaned documents (invalid schoolId)
- [ ] Referential integrity maintained
- [ ] No data loss during migration

---

## Test Execution Timeline

**Week 13:**
- Day 1-2: Unit tests (schema, hooks, services)
- Day 3-4: Integration tests (login, isolation, enrollment)
- Day 5: E2E tests setup

**Week 14:**
- Day 1-2: E2E tests execution (all scenarios)
- Day 3: Security tests + penetration testing
- Day 4: Performance tests + load testing
- Day 5: Manual testing + bug fixes
- Day 6-7: Regression testing + sign-off

---

## Bug Tracking

**Priority Levels:**
- **P0 (Blocker):** Security vulnerability, data leak, app crash
- **P1 (Critical):** Feature broken, major UX issue
- **P2 (High):** Minor feature issue, workaround exists
- **P3 (Low):** Cosmetic, future enhancement

**Bug Workflow:**
1. Identify during testing
2. Log in GitHub Issues with `bug` label
3. Assign priority
4. Assign to developer
5. Fix and verify
6. Re-test affected area
7. Close when verified

---

## Rollback Criteria

**Trigger Rollback If:**
- 3+ P0 bugs found
- 10+ P1 bugs found
- <70% test pass rate
- Security audit fails
- Performance degradation >50%
- Data integrity violations detected

**Rollback Process:** See MULTI_TENANT_MIGRATION_PLAN.md

---

**Document Status:** Ready for review  
**Next Steps:** Begin Phase 1 implementation  
**Owner:** QA Team + Development Team
