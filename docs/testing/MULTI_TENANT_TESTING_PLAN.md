# Multi-Tenant Testing & Validation Plan

**Phase 4 - Task 7: Comprehensive Testing**

## Overview

This document outlines the testing strategy for validating the multi-tenant implementation in EduSync. All tests must pass before deploying to production.

## Test Environment Setup

### Prerequisites
- Firebase Emulator Suite running locally
- Database seeded with multi-school data
- Test users with various schoolId configurations

### Seed Multi-School Test Data

```bash
# Create test script for multi-school seeding
npm run emu:seed:multi-school
```

Required test schools:
- `school-001` - Primary Elementary School
- `school-002` - Secondary High School  
- `school-003` - Combined School
- `default` - Legacy/Default School

Required test users:
1. **Single-school admin**: schoolId = 'school-001'
2. **Multi-school teacher**: schoolIds = ['school-001', 'school-002']
3. **Single-school parent**: schoolId = 'school-001' (inherited from child)
4. **Super admin**: isSuperAdmin = true (can access all schools)
5. **Legacy user**: No schoolId (transition mode compatibility)

---

## Test Categories

## 1. Data Isolation Tests

### 1.1 Cross-School Data Leakage Prevention

**Test ID:** ISO-001  
**Priority:** CRITICAL  
**Objective:** Verify users cannot access data from other schools

**Test Steps:**
1. Login as admin from school-001
2. Attempt to query students collection
3. Verify results only contain students with schoolId = 'school-001'
4. Repeat for all collections:
   - Students, Teachers, Sections, Parents
   - Grades, Attendance, Assignments
   - Financial records (payments, receipts, ledgers)
   - Forms (137, 138, SF1-9)
   - Notifications, Announcements

**Expected Result:**
- ✅ All queries return only school-001 data
- ✅ No school-002 or school-003 data visible
- ✅ Console shows no errors or warnings

**Actual Result:** _[To be filled during testing]_

---

### 1.2 Security Rules Enforcement

**Test ID:** ISO-002  
**Priority:** CRITICAL  
**Objective:** Verify Firestore security rules block unauthorized access

**Test Steps:**
1. Login as admin from school-001
2. Use browser console to attempt direct Firestore read:
   ```javascript
   // Attempt to read student from school-002
   const docRef = doc(db, 'students', 'student-from-school-002');
   const docSnap = await getDoc(docRef);
   console.log(docSnap.exists()); // Should be false or permission denied
   ```
3. Attempt to create document with wrong schoolId:
   ```javascript
   // Attempt to create student for school-002 (should fail)
   await addDoc(collection(db, 'students'), {
     firstName: 'Test',
     lastName: 'Student',
     schoolId: 'school-002', // Wrong school!
     // ... other fields
   });
   ```

**Expected Result:**
- ✅ Read attempt blocked by security rules (permission denied)
- ✅ Write attempt blocked (schoolId mismatch)
- ✅ Console shows Firestore permission error

**Actual Result:** _[To be filled during testing]_

---

## 2. Multi-School User Tests

### 2.1 Multi-School Teacher Access

**Test ID:** MULTI-001  
**Priority:** HIGH  
**Objective:** Verify teachers assigned to multiple schools can access all their schools

**Test Steps:**
1. Create teacher with schoolIds = ['school-001', 'school-002']
2. Set custom claims:
   ```javascript
   {
     role: 'teacher',
     schoolId: 'school-001',  // Primary school
     schoolIds: ['school-001', 'school-002']  // All schools
   }
   ```
3. Login as this teacher
4. Verify SchoolSwitcher appears in header
5. Query students collection - should see school-001 students
6. Use SchoolSwitcher to switch to school-002
7. Query students collection - should see school-002 students

**Expected Result:**
- ✅ SchoolSwitcher visible (2 schools available)
- ✅ Can see students from school-001 initially
- ✅ After switching, can see students from school-002
- ✅ Cannot see students from school-003

**Actual Result:** _[To be filled during testing]_

---

### 2.2 SchoolSwitcher UI Functionality

**Test ID:** MULTI-002  
**Priority:** MEDIUM  
**Objective:** Verify SchoolSwitcher correctly displays and switches schools

**Test Steps:**
1. Login as multi-school teacher (schoolIds.length = 2)
2. Verify SchoolSwitcher visible in header
3. Click SchoolSwitcher dropdown
4. Verify both schools displayed with names
5. Verify current school has checkmark
6. Click other school to switch
7. Verify context updates (schoolId changes)
8. Verify components re-render with new school data

**Expected Result:**
- ✅ Dropdown shows both schools
- ✅ Current school indicated with checkmark
- ✅ Clicking school triggers setActiveSchool()
- ✅ Components reload with new schoolId
- ✅ School count shown in footer

**Actual Result:** _[To be filled during testing]_

---

### 2.3 Single-School User (No Switcher)

**Test ID:** MULTI-003  
**Priority:** MEDIUM  
**Objective:** Verify SchoolSwitcher auto-hides for single-school users

**Test Steps:**
1. Login as single-school admin (schoolIds = ['school-001'])
2. Check header for SchoolSwitcher component

**Expected Result:**
- ✅ SchoolSwitcher NOT visible (auto-hidden)
- ✅ User can only access school-001 data
- ✅ No errors in console

**Actual Result:** _[To be filled during testing]_

---

## 3. Component SchoolId Filtering Tests

### 3.1 Student List Filtering

**Test ID:** COMP-001  
**Priority:** HIGH  
**Objective:** Verify StudentList component filters by schoolId

**Test Steps:**
1. Login as admin from school-001
2. Navigate to Students page
3. Open browser DevTools Network tab
4. Observe Firestore query
5. Verify query includes `where('schoolId', '==', 'school-001')`

**Expected Result:**
- ✅ Query has schoolId filter as FIRST where clause
- ✅ Only school-001 students displayed
- ✅ Student count accurate

**Actual Result:** _[To be filled during testing]_

---

### 3.2 Enrollment Dashboard Filtering

**Test ID:** COMP-002  
**Priority:** HIGH  
**Objective:** Verify enrollment applications filtered by schoolId

**Test Steps:**
1. Create enrollment applications for multiple schools:
   - 3 applications for school-001
   - 2 applications for school-002
2. Login as admin from school-001
3. Navigate to Enrollment > Applications
4. Verify only school-001 applications visible (count = 3)

**Expected Result:**
- ✅ Dashboard shows 3 applications (school-001 only)
- ✅ No school-002 applications visible
- ✅ Status filtering works correctly

**Actual Result:** _[To be filled during testing]_

---

### 3.3 Financial Reports Filtering

**Test ID:** COMP-003  
**Priority:** HIGH  
**Objective:** Verify financial reports show only school-specific data

**Test Steps:**
1. Create payment records for multiple schools
2. Login as admin from school-001
3. Navigate to Financial > Reports
4. Generate report for date range
5. Verify all amounts are from school-001 only

**Expected Result:**
- ✅ Receipts filtered by schoolId
- ✅ Student ledgers filtered by schoolId
- ✅ Total amounts accurate for school-001
- ✅ No cross-contamination from other schools

**Actual Result:** _[To be filled during testing]_

---

### 3.4 Form 137 Dashboard Filtering

**Test ID:** COMP-004  
**Priority:** HIGH  
**Objective:** Verify Form 137 dashboard filters sections and students

**Test Steps:**
1. Login as registrar from school-001
2. Navigate to Forms > Form 137
3. Select school year and grade level
4. Verify sections dropdown shows only school-001 sections
5. Select section, verify students are from school-001

**Expected Result:**
- ✅ Sections filtered by schoolId
- ✅ Students filtered by schoolId
- ✅ Form generation uses correct school data

**Actual Result:** _[To be filled during testing]_

---

## 4. Data Inheritance Tests

### 4.1 Parent Registration SchoolId Inheritance

**Test ID:** INHERIT-001  
**Priority:** HIGH  
**Objective:** Verify parent inherits schoolId from verified student

**Test Steps:**
1. Create student in school-001 with LRN: '123456789012'
2. Navigate to public parent registration page
3. Enter LRN to verify student
4. Complete parent registration
5. Check created parent document in Firestore
6. Verify parent.schoolId = 'school-001' (inherited from student)

**Expected Result:**
- ✅ Parent document has schoolId = 'school-001'
- ✅ Parent can only access school-001 data after login
- ✅ Parent sees only their school-001 children

**Actual Result:** _[To be filled during testing]_

---

### 4.2 Enrollment Application SchoolId Assignment

**Test ID:** INHERIT-002  
**Priority:** HIGH  
**Objective:** Verify enrollment applications get correct schoolId

**Test Steps:**
1. Navigate to public enrollment portal
2. Submit application without verification (should use 'default')
3. Verify application document has schoolId = 'default'
4. Submit application with verified student (school-001)
5. Verify application inherits schoolId = 'school-001'

**Expected Result:**
- ✅ Unverified application: schoolId = 'default'
- ✅ Verified application: schoolId = student.schoolId
- ✅ Admin can only see applications for their school

**Actual Result:** _[To be filled during testing]_

---

## 5. Performance Tests

### 5.1 Query Performance with Indexes

**Test ID:** PERF-001  
**Priority:** MEDIUM  
**Objective:** Verify composite indexes optimize queries

**Test Steps:**
1. Seed database with 1000+ students per school (3 schools = 3000+ students)
2. Login as admin from school-001
3. Navigate to Students page
4. Open browser DevTools Performance tab
5. Record performance while loading student list
6. Check Firestore console for index usage

**Expected Result:**
- ✅ Query completes in < 1 second
- ✅ Firestore uses composite index (schoolId + lastName)
- ✅ No "Create index" warnings in console
- ✅ Page renders smoothly without lag

**Actual Result:** _[To be filled during testing]_

---

### 5.2 SchoolSwitcher Load Time

**Test ID:** PERF-002  
**Priority:** LOW  
**Objective:** Verify SchoolSwitcher loads school metadata quickly

**Test Steps:**
1. Login as multi-school teacher (10 schools)
2. Click SchoolSwitcher dropdown
3. Measure time to display all school names

**Expected Result:**
- ✅ Dropdown appears in < 200ms
- ✅ School names loaded from Firestore
- ✅ List sorted alphabetically

**Actual Result:** _[To be filled during testing]_

---

## 6. Edge Cases & Error Handling

### 6.1 Missing SchoolId in Document

**Test ID:** EDGE-001  
**Priority:** HIGH  
**Objective:** Verify graceful handling of documents without schoolId

**Test Steps:**
1. Manually create student document without schoolId field
2. Login as admin and navigate to Students page
3. Observe behavior

**Expected Result:**
- ✅ Document not visible to any school (filtered out)
- ✅ No JavaScript errors in console
- ✅ Guard clause prevents crashes

**Actual Result:** _[To be filled during testing]_

---

### 6.2 Legacy User Access (No SchoolId Claims)

**Test ID:** EDGE-002  
**Priority:** HIGH  
**Objective:** Verify legacy users still have access during transition

**Test Steps:**
1. Create user without schoolId custom claims
2. Login as this legacy user
3. Verify access granted via isLegacyUser() rules

**Expected Result:**
- ✅ User can access data (transition mode)
- ✅ Warning logged: "No schoolId - using legacy access"
- ✅ No crashes or permission errors

**Actual Result:** _[To be filled during testing]_

---

### 6.3 Super Admin Cross-School Access

**Test ID:** EDGE-003  
**Priority:** MEDIUM  
**Objective:** Verify super admins can access all schools

**Test Steps:**
1. Create user with custom claim: isSuperAdmin = true
2. Login as super admin
3. Query students collection
4. Verify can see students from ALL schools

**Expected Result:**
- ✅ Super admin sees students from all schools
- ✅ Security rules allow via isSuperAdmin() check
- ✅ SchoolSwitcher shows all schools

**Actual Result:** _[To be filled during testing]_

---

## 7. Security Rule Validation

### 7.1 Emulator Security Rules Testing

**Test ID:** SEC-001  
**Priority:** CRITICAL  
**Objective:** Test security rules in Firebase Emulator

**Test Steps:**
1. Start Firebase Emulator with security rules
2. Use Firestore Emulator UI (http://localhost:4000/firestore)
3. Attempt unauthorized operations:
   - Read document from different school
   - Write document with wrong schoolId
   - Delete document from different school

**Expected Result:**
- ✅ All unauthorized operations blocked
- ✅ "Permission denied" errors in emulator UI
- ✅ Rules properly enforce schoolId matching

**Actual Result:** _[To be filled during testing]_

---

### 7.2 Production-Like Security Test

**Test ID:** SEC-002  
**Priority:** CRITICAL  
**Objective:** Simulate production security before deployment

**Test Steps:**
1. Deploy rules to staging/UAT Firebase project
2. Create test users with different schoolIds
3. Attempt cross-school access via REST API
4. Verify all requests properly authenticated and authorized

**Expected Result:**
- ✅ Security rules deployed successfully
- ✅ All cross-school access blocked
- ✅ Same-school access allowed
- ✅ No security vulnerabilities found

**Actual Result:** _[To be filled during testing]_

---

## 8. Integration Tests

### 8.1 End-to-End Enrollment Flow

**Test ID:** E2E-001  
**Priority:** HIGH  
**Objective:** Test complete enrollment process with multi-tenancy

**Test Steps:**
1. Public user submits enrollment application (school-001)
2. Admin from school-001 logs in
3. Admin reviews and approves application
4. Student created in school-001
5. Parent registers using student LRN
6. Parent logs in and sees student data

**Expected Result:**
- ✅ Application has correct schoolId
- ✅ Only school-001 admin can see/approve
- ✅ Student created with schoolId = 'school-001'
- ✅ Parent inherits schoolId = 'school-001'
- ✅ Parent sees only their school-001 children

**Actual Result:** _[To be filled during testing]_

---

### 8.2 Multi-School Teacher Workflow

**Test ID:** E2E-002  
**Priority:** MEDIUM  
**Objective:** Test multi-school teacher complete workflow

**Test Steps:**
1. Login as teacher (school-001, school-002)
2. View students from school-001
3. Enter grades for school-001 students
4. Switch to school-002 via SchoolSwitcher
5. View students from school-002
6. Enter grades for school-002 students
7. Switch back to school-001
8. Verify grades saved correctly

**Expected Result:**
- ✅ Can switch between schools seamlessly
- ✅ Grades saved with correct schoolId
- ✅ No data cross-contamination
- ✅ Each school's data independent

**Actual Result:** _[To be filled during testing]_

---

## Test Execution Checklist

### Pre-Testing Setup
- [ ] Firebase Emulator running
- [ ] Multi-school test data seeded
- [ ] Test users created with proper claims
- [ ] Browser DevTools ready for inspection

### Critical Tests (Must Pass)
- [ ] ISO-001: Cross-School Data Leakage Prevention
- [ ] ISO-002: Security Rules Enforcement
- [ ] COMP-001: Student List Filtering
- [ ] COMP-002: Enrollment Dashboard Filtering
- [ ] COMP-003: Financial Reports Filtering
- [ ] INHERIT-001: Parent SchoolId Inheritance
- [ ] SEC-001: Emulator Security Rules Testing
- [ ] SEC-002: Production-Like Security Test

### High Priority Tests
- [ ] MULTI-001: Multi-School Teacher Access
- [ ] COMP-004: Form 137 Dashboard Filtering
- [ ] INHERIT-002: Enrollment Application SchoolId
- [ ] EDGE-001: Missing SchoolId Handling
- [ ] EDGE-002: Legacy User Access
- [ ] E2E-001: End-to-End Enrollment Flow

### Medium Priority Tests
- [ ] MULTI-002: SchoolSwitcher UI Functionality
- [ ] MULTI-003: Single-School User (No Switcher)
- [ ] PERF-001: Query Performance with Indexes
- [ ] EDGE-003: Super Admin Cross-School Access
- [ ] E2E-002: Multi-School Teacher Workflow

### Low Priority Tests
- [ ] PERF-002: SchoolSwitcher Load Time

---

## Test Results Summary

**Total Tests:** 23  
**Passed:** _[To be filled]_  
**Failed:** _[To be filled]_  
**Blocked:** _[To be filled]_  
**Skipped:** _[To be filled]_  

**Overall Status:** ⏸️ PENDING

---

## Issues Found

| Issue ID | Severity | Description | Component | Status |
|----------|----------|-------------|-----------|--------|
| _[To be filled during testing]_ | | | | |

---

## Production Deployment Checklist

**DO NOT DEPLOY TO PRODUCTION UNTIL ALL CRITICAL TESTS PASS**

- [ ] All critical tests passed (ISO-001, ISO-002, SEC-001, SEC-002)
- [ ] All high priority tests passed
- [ ] No data leakage vulnerabilities found
- [ ] Security rules tested in staging environment
- [ ] Performance meets requirements (< 1s query time)
- [ ] Multi-school workflows validated
- [ ] Edge cases handled gracefully
- [ ] Documentation updated
- [ ] Team reviewed and approved

**Sign-off Required:**
- [ ] Lead Developer: _______________ Date: ___________
- [ ] QA Engineer: _______________ Date: ___________
- [ ] Security Review: _______________ Date: ___________

---

## Notes

- Test with realistic data volumes (1000+ records per school)
- Use browser incognito mode to test different users
- Clear local storage between user switches
- Monitor Firestore console for index warnings
- Document any unexpected behavior
- Re-test after any bug fixes

**Last Updated:** 2025-01-08  
**Version:** 1.0  
**Status:** In Progress
