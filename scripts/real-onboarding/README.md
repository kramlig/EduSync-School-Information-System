# Real School Onboarding - Complete Workflow

This directory contains the **production-ready school onboarding simulation** that mirrors the actual workflow a school will follow when signing up for EduSync.

## Overview

These scripts test the **COMPLETE** onboarding process from scratch, simulating what real schools will experience. Each phase must complete successfully before moving to the next.

---

## Phase-by-Phase Execution

### Prerequisites
- Firebase Admin SDK credentials: `edusync-sis-firebase-adminsdk.json` (in root)
- Production project: `edusync-sis`
- Clean Firestore (or unique school ID to avoid conflicts)

---

### Phase 1: Create School Account

**Simulates**: New school signs up for EduSync

**What it does**:
- Creates school document in Firestore
- Creates superadmin Firebase Auth account
- Sets custom claims (role: superadmin)
- Creates users + userRoles documents

**Run**:
```bash
node scripts/real-onboarding/phase1-create-school.cjs
```

**Input required**:
- School name (e.g., "San Jose High School")
- Superadmin email
- Superadmin password

**Expected output**:
- School ID
- Superadmin can log in via Staff tab

**Validation**:
- [ ] School document exists in Firestore
- [ ] Superadmin can log in at https://edusync.ph
- [ ] Dashboard loads without errors

---

### Phase 2: Create Teachers

**Simulates**: Admin adding teachers through the UI

**What it does**:
- Creates 5 teacher accounts (Firebase Auth + Firestore)
- Sets custom claims (role: teacher)
- Creates teachers collection documents with subjects
- **Tests auto-onboarding role assignment**

**Run**:
```bash
node scripts/real-onboarding/phase2-create-teachers.cjs
```

**Input required**:
- School ID (from Phase 1)
- Default password for all teachers

**Expected output**:
- 5 teacher accounts created
- Each teacher has email/password/subjects

**Validation**:
- [ ] All 5 teachers can log in (Staff tab)
- [ ] No "permission denied" errors
- [ ] Teachers see dashboard (but no gradebook data yet)

**CRITICAL**: This tests if auto-onboarding bug is fixed!

---

### Phase 3: Create Sections

**Simulates**: Admin creating sections for the school year

**What it does**:
- Creates 5 sections (Grade 7-10)
- Each section has: gradeLevel, sectionName, displayName
- Empty students[] array (filled in Phase 5)

**Run**:
```bash
node scripts/real-onboarding/phase3-create-sections.cjs
```

**Input required**:
- School ID

**Expected output**:
- 5 sections created
- Grade 7: St. Francis, St. John
- Grade 8: St. Peter
- Grade 9: St. Paul
- Grade 10: St. Luke

**Validation**:
- [ ] Sections appear in admin dashboard
- [ ] Sections visible in teacher assignment UI

---

### Phase 4: Assign Teachers to Sections

**Simulates**: Admin assigning teaching loads

**What it does**:
- Assigns each teacher to one section
- Creates teacher.assignments[] array (2-3 subjects each)
- **This is CRITICAL for gradebook access**

**Run**:
```bash
node scripts/real-onboarding/phase4-assign-teachers.cjs
```

**Input required**:
- School ID

**Expected output**:
- Each teacher assigned to 1 section
- Total ~10-15 subject assignments created

**Validation**:
- [ ] Teachers can access gradebook (no infinite loading)
- [ ] Teachers see their assigned section in dropdown
- [ ] Teachers see their assigned subjects

**CRITICAL**: Without this, gradebook shows infinite loading!

---

### Phase 5: Enroll Students

**Simulates**: Bulk student enrollment (import CSV)

**What it does**:
- Creates realistic student accounts (Firebase Auth + Firestore)
- Assigns students to sections
- Updates sections.students[] array
- Creates parent accounts (optional in future)

**Run**:
```bash
node scripts/real-onboarding/phase5-enroll-students.cjs
```

**Input required**:
- School ID
- Students per section (recommend 10 for testing)
- Default password

**Expected output**:
- 50 students created (10 per section)
- All students have LRN, email, password

**Validation**:
- [ ] Students can log in (Student tab)
- [ ] Students see their section
- [ ] Teacher gradebook shows student names

---

### Phase 6: Enter Grades (MANUAL UI TEST)

**Simulates**: Teacher entering grades for Quarter 1

**What to test**:
1. Log in as a teacher (from Phase 2)
2. Navigate to Gradebook
3. Select assigned section
4. Select a learning area
5. Enter grades for all students:
   - Written Work (3-5 grades)
   - Performance Task (3-5 grades)
   - Quarterly Assessment (1 grade)
6. Verify initial grade calculates (30/50/20 formula)
7. Enter quarterly grade
8. Verify final grade calculates

**Validation checklist**:
- [ ] Section dropdown shows correct section
- [ ] Subject dropdown shows assigned subjects
- [ ] All students visible (from Phase 5)
- [ ] Can enter WW grades (saves correctly)
- [ ] Can enter PT grades (saves correctly)
- [ ] Can enter QA grades (saves correctly)
- [ ] Initial grade calculates: (WW×0.3 + PT×0.5 + QA×0.2)
- [ ] Quarterly grade can be entered
- [ ] Final grade matches quarterly grade
- [ ] No errors in console
- [ ] Data persists after page reload

---

### Phase 7: Enter Core Values (MANUAL UI TEST)

**Simulates**: Teacher entering Core Values for Quarter 1

**What to test**:
1. Navigate to Core Values Gradebook
2. Select assigned section
3. See 4 DepEd core values:
   - Maka-Diyos (5 behaviors)
   - Makatao (6 behaviors)
   - Makakalikasan (3 behaviors)
   - Makabansa (5 behaviors)
4. Enter ratings for all students (AO/SO/RO/NO)
5. Verify data saves

**Validation checklist**:
- [ ] All 4 core values visible
- [ ] All behaviors show correctly
- [ ] Can select ratings (AO/SO/RO/NO)
- [ ] Ratings save correctly
- [ ] No infinite loading
- [ ] No console errors

---

### Phase 8: Generate Reports (MANUAL UI TEST)

**Simulates**: Admin/Teacher generating official reports

**What to test**:

#### 8A: SF2 (School Form 2)
1. Navigate to Reports → SF2
2. Select a student
3. Generate SF2
4. Verify PDF contains:
   - All subjects (11 subjects)
   - All quarters (Q1-Q4)
   - Core Values section
   - Final grades

**Validation**:
- [ ] PDF generates without errors
- [ ] All academic grades show
- [ ] Core Values section present
- [ ] Calculations correct
- [ ] No missing data

#### 8B: Form 138 (Report Card)
1. Navigate to Reports → Form 138
2. Select a student
3. Generate Form 138
4. Verify format matches DepEd requirements

**Validation**:
- [ ] PDF generates
- [ ] Follows DepEd format
- [ ] All grades present
- [ ] Core Values included

---

### Phase 9: Validate Student/Parent Views

**Simulates**: Students and parents checking grades

**What to test**:

#### 9A: Student View
1. Log in as a student (from Phase 5)
2. Navigate to Grades
3. Verify sees own grades only
4. Check Core Values visible

**Validation**:
- [ ] Student sees own grades
- [ ] Cannot see other students' grades
- [ ] Core Values visible
- [ ] Calculations match teacher entry

#### 9B: Parent View (if implemented)
1. Log in as a parent
2. Verify sees linked child's grades
3. Check access permissions

**Validation**:
- [ ] Parent sees child's grades
- [ ] Cannot access other students
- [ ] Read-only access (cannot edit)

---

### Phase 10: Comprehensive E2E Test

**Automated test** that runs ALL scenarios:

**Run**:
```bash
npm run test:e2e:real-onboarding
```

**What it tests**:
1. Superadmin login
2. Teacher login (all 5 teachers)
3. Student login (sample students)
4. Gradebook data visibility
5. Grade calculations
6. Core Values data
7. Report generation
8. Permission boundaries

**Pass criteria**:
- All tests PASS
- No console errors
- Data accuracy verified
- Performance acceptable (<3 seconds per page load)

---

## Success Criteria

Before declaring **production-ready**, ALL of the following must pass:

### Critical Path
- [x] Phase 1: School created successfully
- [ ] Phase 2: All teachers can log in (tests auto-onboarding fix)
- [ ] Phase 3: Sections visible in UI
- [ ] Phase 4: Teachers see gradebook (no infinite loading)
- [ ] Phase 5: Students enrolled and visible
- [ ] Phase 6: Grades entered and calculated correctly
- [ ] Phase 7: Core Values saved properly
- [ ] Phase 8: Reports generate with complete data
- [ ] Phase 9: Student/parent views work correctly
- [ ] Phase 10: E2E test passes 10 consecutive times

### Data Validation
- [ ] Grade calculations match manual verification
- [ ] Core Values structure matches DepEd standards
- [ ] Reports contain 100% of entered data
- [ ] No data loss after page reload
- [ ] Offline persistence works

### Performance
- [ ] Page loads < 3 seconds
- [ ] Grade entry < 1 second per field
- [ ] Report generation < 30 seconds
- [ ] No memory leaks
- [ ] No infinite loops

### User Experience
- [ ] No "infinite loading" states
- [ ] Clear error messages (if any)
- [ ] Intuitive navigation
- [ ] Mobile responsive (test on phone)

---

## Known Issues to Watch For

Based on previous fixes, monitor for:

1. **Auto-onboarding bug**: Teachers get `role: 'parent'` instead of `'teacher'`
   - **Fix**: Custom claims must be set correctly in Phase 2
   - **Test**: All teachers must log in successfully

2. **Missing assignments array**: Gradebook infinite loading
   - **Fix**: Phase 4 creates assignments[]
   - **Test**: Teachers must see gradebook immediately

3. **Core Values wrong structure**: Data doesn't match code expectations
   - **Fix**: Use exact DepEd structure from types.ts
   - **Test**: Core Values must save and display correctly

4. **Calculation errors**: Grades don't match formula
   - **Fix**: Verify WW×0.3 + PT×0.5 + QA×0.2
   - **Test**: Manual calculation vs system calculation

5. **Cache issues**: Login slow or shows old data
   - **Fix**: Already using getDocsFromServer()
   - **Test**: Fresh login < 5 seconds

---

## Rollback Procedures

If a phase fails:

### Clean Up School
```bash
node scripts/real-onboarding/cleanup-school.cjs
```

Deletes:
- School document
- All teachers
- All sections
- All students
- All Firebase Auth users

### Restart from Specific Phase
Each phase is idempotent - safe to re-run:
- Re-run Phase 2 to recreate teachers
- Re-run Phase 4 to fix assignments
- Re-run Phase 5 to add more students

---

## Timeline Estimate

### First Run (Finding Bugs)
- Phase 1: 5 minutes
- Phase 2: 10 minutes (test all teacher logins)
- Phase 3: 5 minutes
- Phase 4: 10 minutes (verify gradebook access)
- Phase 5: 15 minutes (create + verify students)
- Phase 6: 30 minutes (manual grade entry)
- Phase 7: 15 minutes (manual Core Values)
- Phase 8: 20 minutes (generate + verify reports)
- Phase 9: 15 minutes (test student/parent views)
- Phase 10: 10 minutes (run E2E test)

**Total: ~2-3 hours** (expect to find bugs)

### Bug Fixing
Estimate: 1-3 days depending on severity

### Validation Run (After Fixes)
**Total: ~1 hour** (all phases should pass smoothly)

---

## Final Confidence Level

After 10 consecutive successful runs of ALL phases:

**Expected Confidence: 80-85%**

Remaining 15-20% risk:
- Edge cases we didn't test
- Large-scale performance (500+ students)
- Real-world network issues
- Unique school configurations

---

## Contact / Support

**Created**: November 17, 2025  
**Purpose**: Production readiness validation  
**Status**: Ready to execute Phase 1

**Next Action**: Run Phase 1 to create first test school
