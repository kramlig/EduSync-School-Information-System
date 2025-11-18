# E2E Testing Guide for EduSync SIS

## Overview

This guide explains the comprehensive end-to-end testing strategy for EduSync School Information System, covering test data preparation and execution.

---

## 📋 Table of Contents

1. [Seeding Strategy](#seeding-strategy)
2. [Test Data Requirements](#test-data-requirements)
3. [Running E2E Tests](#running-e2e-tests)
4. [Test Coverage](#test-coverage)
5. [Troubleshooting](#troubleshooting)

---

## 🌱 Seeding Strategy

### Two-Layer Approach

Our E2E testing uses a **two-layer seeding strategy**:

#### Layer 1: Base Data (Complete System Setup)
**Script:** `seed-complete.cjs` or `seed-production-comprehensive.cjs`

**Purpose:** Establishes the full school operational environment

**What it creates:**
- Admin user account
- School configuration
- 60+ teachers across all departments
- K-12 sections (Elementary, Junior High, Senior High)
- Complete DepEd K-12 curriculum (61 learning areas)
- Students (existing enrolled students)
- Parents (existing parent accounts)
- Academic data (grades, attendance, assignments)
- Financial data (fee structures, student ledgers, payments)
- Forms data (DepEd forms ready to generate)
- Class schedules
- Announcements
- Lesson plans

**When to run:**
```bash
# For emulator
npm run emu:seed:comprehensive

# For production (UAT/Staging)
npm run seed:e2e:production
```

#### Layer 2: E2E Test-Specific Data
**Script:** `seed-e2e-test-data.cjs` (NEW)

**Purpose:** Adds test data specifically for E2E test scenarios

**What it creates:**
- **15 Enrollment Applications** in various workflow states:
  - 3 Submitted (awaiting review)
  - 2 Under Review (being processed)
  - 2 Approved (ready for enrollment)
  - 2 Rejected (with rejection reasons)
  - 1 Enrolled (fully processed)
- **ELLN Assessment Data** for K-3 students (literacy & numeracy)
- **Test Parent Accounts** for enrollment portal testing:
  - `parent.test1@e2etest.com` / `TestParent123!`
  - `parent.test2@e2etest.com` / `TestParent123!`

**When to run:**
```bash
# For emulator (after base seed)
npm run emu:seed:e2e

# For production (after base seed)
npm run seed:e2e:production
```

**Safety Features:**
- All documents tagged with `isE2ETest: true`
- Easy cleanup with Firestore queries
- Idempotent (can run multiple times)

---

## 📊 Test Data Requirements

### Complete E2E Test Suite Needs

Our comprehensive test suite (`tests/comprehensive-e2e-production.spec.ts`) requires:

#### User Accounts (from base seed)
- ✅ **Super Admin**: `superadmin@edusync.local` / `SuperAdmin123!`
- ✅ **Admin**: `admin@edusync.local` / `Admin123!`
- ✅ **Teacher**: `teacher_1@test.local` / `Teacher123!`
- ✅ **Parent**: `parent.test1@e2etest.com` / `TestParent123!` (Layer 2)
- ✅ **Student**: `student_1@test.local` / `Student123!`

#### School Data (from base seed)
- ✅ School configuration (`schools/default`)
- ✅ School year settings (`schoolYears/2024-2025`)
- ✅ Learning areas (61 DepEd subjects)
- ✅ Core values configuration
- ✅ Fee structures (for private schools)

#### Academic Data (from base seed)
- ✅ K-12 sections with teachers assigned
- ✅ Students enrolled in sections
- ✅ Grades (quarterly + final)
- ✅ Core value grades
- ✅ Attendance records
- ✅ Assignments with submissions
- ✅ Lesson plans

#### Enrollment Data (from Layer 2)
- ✅ **New**: Enrollment applications in all workflow states
- ✅ **New**: Test parent accounts for portal testing
- ✅ **New**: ELLN assessment data

#### Financial Data (from base seed)
- ✅ Fee structures
- ✅ Student ledgers
- ✅ Payment receipts
- ✅ Billing statements

#### Forms & Reporting Data (from base seed)
- ✅ Data for Form 137 (Permanent Record)
- ✅ Data for Form 138 (Report Card)
- ✅ Data for SF1 (Enrollment Report)
- ✅ Data for SF2 (Daily Attendance Report)
- ✅ Data for SF9 (Learner's Progress Report)
- ✅ **New**: ELLN data for K-3 assessment reports

---

## 🚀 Running E2E Tests

### Complete Workflow

#### For Emulator Testing
```bash
# 1. Start emulator and seed base data
npm run dev:emu

# 2. In another terminal, add E2E test data
npm run emu:seed:e2e

# 3. Run E2E tests
npx playwright test tests/comprehensive-e2e-production.spec.ts --config=playwright.emulator.config.ts

# 4. View report
npx playwright show-report
```

#### For Production Testing (UAT/Staging)
```bash
# 1. Seed base data to production
npm run seed:e2e:production

# Note: This assumes you've already run the main production seed
# If not, run seed-production-comprehensive.cjs first

# 2. Run E2E tests against production
PLAYWRIGHT_TEST_URL=https://edusync-sis.web.app \
TEST_SUPER_ADMIN_EMAIL=superadmin@edusync.local \
TEST_SUPER_ADMIN_PASSWORD=SuperAdmin123! \
npx playwright test tests/comprehensive-e2e-production.spec.ts --config=playwright.prod.config.ts

# 3. View report
npx playwright show-report
```

### Environment Variables

Configure these in `.env.test` or pass via command line:

```bash
# Test URL
PLAYWRIGHT_TEST_URL=https://edusync-sis.web.app  # or http://127.0.0.1:5173 for emulator

# Super Admin Account
TEST_SUPER_ADMIN_EMAIL=superadmin@edusync.local
TEST_SUPER_ADMIN_PASSWORD=SuperAdmin123!

# Admin Account
TEST_ADMIN_EMAIL=admin@edusync.local
TEST_ADMIN_PASSWORD=Admin123!

# Teacher Account
TEST_TEACHER_EMAIL=teacher_1@test.local
TEST_TEACHER_PASSWORD=Teacher123!

# Parent Account
TEST_PARENT_EMAIL=parent.test1@e2etest.com
TEST_PARENT_PASSWORD=TestParent123!

# Student Account
TEST_STUDENT_EMAIL=student_1@test.local
TEST_STUDENT_PASSWORD=Student123!

# School Context
TEST_SCHOOL_ID=default
```

---

## 🎯 Test Coverage

### 10 Test Suites | 40+ Test Scenarios

#### 1. School Setup & Configuration (Super Admin)
- View all schools in system
- Access school detail page
- View school configuration settings
- Verify multi-tenant isolation

#### 2. User Management (Admin)
- View teachers list
- View students list
- View parents list
- Search and filter users
- View user detail pages

#### 3. Enrollment Process
**3a. Public Enrollment Portal**
- Access enrollment form without login
- Fill and submit enrollment application
- Receive confirmation

**3b. Parent Enrollment Management**
- Parent views submitted applications
- Track application status
- Upload required documents

**3c. Admin Application Review**
- View pending applications
- Review application details
- Approve/reject applications
- Enroll approved students into sections

#### 4. Academic Operations (Teacher)
- View assigned sections
- Mark attendance (daily attendance view)
- Enter grades (gradebook)
- Post assignments
- Create lesson plans

#### 5. Financial Management (Admin - Private Schools)
- View fee structures
- View student billing
- Record payments
- Generate financial reports
- View payment history

#### 6. Forms & Reporting (Registrar)
- Generate Form 137 (Permanent Record)
- Generate Form 138 (Report Card)
- Generate SF1 (Enrollment Report)
- Generate SF2 (Daily Attendance)
- Generate SF9 (Learner's Progress)
- **NEW**: Generate ELLN Reports (K-3)

#### 7. Daily Operations (Teacher)
- View dashboard
- Check class schedule
- View announcements
- Post new announcements

#### 8. Parent Portal
- View child's grades
- View attendance records
- View billing statements (private schools)
- View announcements
- View class schedule

#### 9. Student Portal
- View personal grades
- View attendance
- Submit assignments
- View class schedule
- View announcements

#### 10. System-Wide Tests
- Navigation across all modules
- Role-based access control
- Logout and session management
- Responsive design checks

---

## 🧹 Cleanup Test Data

### Remove E2E Test Data Only

```javascript
// In Firebase Console or script
db.collection("enrollmentApplications")
  .where("isE2ETest", "==", true)
  .get()
  .then(snapshot => {
    snapshot.docs.forEach(doc => doc.ref.delete());
  });

db.collection("ellnAssessments")
  .where("isE2ETest", "==", true)
  .get()
  .then(snapshot => {
    snapshot.docs.forEach(doc => doc.ref.delete());
  });

db.collection("parents")
  .where("isE2ETest", "==", true)
  .get()
  .then(snapshot => {
    snapshot.docs.forEach(doc => doc.ref.delete());
  });
```

### Full System Reset (Emulator Only)

```bash
# Kill emulator
npm run emu:kill

# Restart and reseed
npm run dev:emu
npm run emu:seed:e2e
```

---

## 🔧 Troubleshooting

### Issue: "No enrollment applications found"
**Solution:**
```bash
# Run Layer 2 seed script
npm run emu:seed:e2e
```

### Issue: "Login failed for test accounts"
**Solution:**
```bash
# Verify accounts exist in Firebase Auth
# For emulator, check: http://127.0.0.1:4000/auth

# Recreate accounts if needed
npm run emu:seed:comprehensive
```

### Issue: "Student has no grades"
**Solution:**
```bash
# Run comprehensive seed first
npm run emu:seed:comprehensive

# This creates students WITH grades
```

### Issue: "ELLN data missing"
**Solution:**
```bash
# ELLN data is in Layer 2
npm run emu:seed:e2e
```

### Issue: "Tests timeout"
**Solution:**
```bash
# Increase timeout in playwright.config.ts
# Check network connectivity
# Ensure emulator is running (for local tests)
```

### Issue: "Permission denied errors"
**Solution:**
```bash
# Check Firestore security rules
# Verify user has correct custom claims (role, schoolId)
# Run: npm run emu:claims (for emulator)
```

---

## 📝 Recommended Test Sequence

### For Complete E2E Testing

1. **Day 1: Setup**
   - Run base seed: `npm run emu:seed:comprehensive`
   - Run E2E seed: `npm run emu:seed:e2e`
   - Verify data in Firebase Console

2. **Day 2: Core Flows**
   - Test Suite 1: School Setup
   - Test Suite 2: User Management
   - Test Suite 3: Enrollment (all sub-suites)

3. **Day 3: Academic & Financial**
   - Test Suite 4: Academic Operations
   - Test Suite 5: Financial Management
   - Test Suite 6: Forms & Reporting

4. **Day 4: User Portals**
   - Test Suite 7: Daily Operations
   - Test Suite 8: Parent Portal
   - Test Suite 9: Student Portal
   - Test Suite 10: System-Wide

5. **Day 5: Regression & Cleanup**
   - Run full test suite
   - Review failures
   - Clean up test data
   - Document any issues

---

## 🎓 Best Practices

### DO:
- ✅ Always run base seed before E2E seed
- ✅ Use emulator for development testing
- ✅ Tag test data for easy cleanup
- ✅ Run tests in sequence (not parallel) for enrollment flows
- ✅ Check test data before running tests
- ✅ Use environment variables for credentials
- ✅ Review Playwright HTML report after runs

### DON'T:
- ❌ Run E2E seed without base seed
- ❌ Run production tests against production DB without coordination
- ❌ Hard-code credentials in test files
- ❌ Run destructive operations in production
- ❌ Ignore test failures (each test validates critical workflows)
- ❌ Mix test data with production data

---

## 📚 Related Documentation

- [SYSTEM_FLOWS_COMPREHENSIVE.md](./SYSTEM_FLOWS_COMPREHENSIVE.md) - Detailed system workflow documentation
- [playwright.config.ts](../playwright.config.ts) - Playwright configuration
- [playwright.emulator.config.ts](../playwright.emulator.config.ts) - Emulator test config
- [playwright.prod.config.ts](../playwright.prod.config.ts) - Production test config

---

## 🆘 Support

If you encounter issues:

1. **Check the test output** - Playwright provides detailed error messages
2. **View Playwright report** - `npx playwright show-report`
3. **Check Firebase Console** - Verify data exists
4. **Check browser console** - Look for JavaScript errors
5. **Review security rules** - Ensure proper access permissions
6. **Consult this guide** - Review troubleshooting section

---

## ✅ Quick Reference

```bash
# Complete setup for emulator testing
npm run dev:emu                    # Start emulator + base seed
npm run emu:seed:e2e               # Add E2E test data
npx playwright test tests/comprehensive-e2e-production.spec.ts --config=playwright.emulator.config.ts

# Production testing
npm run seed:e2e:production        # Add E2E test data to production
PLAYWRIGHT_TEST_URL=https://edusync-sis.web.app npx playwright test tests/comprehensive-e2e-production.spec.ts

# View results
npx playwright show-report

# Cleanup
# Delete documents where isE2ETest == true
```

---

**Last Updated:** November 2024  
**Version:** 1.0  
**Test Coverage:** 10 suites, 40+ scenarios, 8 major flows
