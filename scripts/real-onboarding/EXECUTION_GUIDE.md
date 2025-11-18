# Real School Onboarding - Execution Guide

**Status**: Production is empty, ready to start  
**Date**: November 17, 2025

---

## Phase 1: Create School Account

**Command**: 
```bash
node scripts/real-onboarding/phase1-create-school.cjs
```

**You will be prompted for**:
1. **School Name** (e.g., "Demo High School" or "Test Academy")
2. **Superadmin Email** (e.g., "admin@demo.edu")
3. **Superadmin Password** (e.g., "Demo123!" - min 6 characters)

**What it creates**:
- School document in Firestore
- Superadmin Firebase Auth account
- Custom claims (role: superadmin)
- Users collection document
- UserRoles collection document

**Output**:
- School ID (auto-generated from school name)
- Superadmin UID
- Login credentials

**Validation**:
- [ ] Login at https://edusync.ph using Staff tab
- [ ] Dashboard loads without errors
- [ ] No "permission denied" errors

**Time**: ~2 minutes

---

## Phase 2: Create Teachers

**Command**: 
```bash
node scripts/real-onboarding/phase2-create-teachers.cjs
```

**You will be prompted for**:
1. **Default password for all teachers** (e.g., "Teacher123!")

**Note**: School ID is auto-detected from Phase 1

**What it creates**:
- 5 teacher accounts:
  - Maria Santos (Filipino, AP)
  - Juan Cruz (Mathematics, Science)
  - Ana Reyes (English, TLE)
  - Pedro Garcia (MAPEH, Values)
  - Rosa Mendoza (ESP, Music)
- Firebase Auth accounts for each
- Custom claims (role: teacher)
- Teachers collection documents
- Empty assignments[] arrays (populated in Phase 4)

**Output**:
- List of all teacher emails and passwords
- Teacher document IDs
- Firebase UIDs

**Validation**:
- [ ] Login with ANY teacher account (Staff tab)
- [ ] Dashboard loads
- [ ] No "permission denied" errors
- [ ] Gradebook shows "no sections assigned" (expected at this point)

**Time**: ~3 minutes

---

## Phase 3: Create Sections

**Command**: 
```bash
node scripts/real-onboarding/phase3-create-sections.cjs
```

**You will be prompted for**:
1. **School ID** (same as Phase 1)

**What it creates**:
- 5 sections:
  - Grade 7 - St. Francis
  - Grade 7 - St. John
  - Grade 8 - St. Peter
  - Grade 9 - St. Paul
  - Grade 10 - St. Luke
- Empty students[] arrays (populated in Phase 5)
- Empty teachers[] arrays (populated in Phase 4)

**Output**:
- List of section IDs and names

**Validation**:
- [ ] Sections visible in admin dashboard
- [ ] Section selector shows in teacher gradebook (but empty)

**Time**: ~2 minutes

---

## Phase 4: Assign Teachers to Sections

**Command**: 
```bash
node scripts/real-onboarding/phase4-assign-teachers.cjs
```

**You will be prompted for**:
1. **School ID** (same as Phase 1)

**What it creates**:
- Teacher assignments (round-robin distribution)
- Each teacher assigned to 1 section
- Each teacher gets 2-3 subjects based on their specialization
- Updates teacher.assignments[] array (CRITICAL for gradebook access)

**Output**:
- List of assignments (teacher → section → subjects)
- Total assignment count

**Validation**:
- [ ] Login as a teacher
- [ ] Gradebook loads WITHOUT infinite loading
- [ ] Section dropdown shows assigned section
- [ ] Subject dropdown shows assigned subjects
- [ ] No students visible yet (expected)

**CRITICAL**: This phase fixes the "infinite loading" bug!

**Time**: ~2 minutes

---

## Phase 5: Enroll Students

**Command**: 
```bash
node scripts/real-onboarding/phase5-enroll-students.cjs
```

**You will be prompted for**:
1. **Students per section** (recommend: 10 for testing, 25 for realistic)
2. **Default password for all students** (e.g., "Student123!")

**Note**: School ID is auto-detected from Phase 1

**What it creates**:
- Realistic student accounts (Filipino names)
- Firebase Auth accounts for each student
- Custom claims (role: student)
- Students collection documents
- Assigns students to sections
- Updates section.students[] arrays
- Generates LRNs for each student

**Output**:
- Total students created
- Breakdown by section
- Sample student login credentials

**Validation**:
- [ ] Login as a teacher
- [ ] Gradebook shows student names
- [ ] Correct number of students per section
- [ ] Login as a student (Student tab)
- [ ] Student sees their own section

**Time**: ~5 minutes (depends on student count)

---

## Phase 6: Enter Grades (MANUAL UI TEST)

**No script** - this is manual testing through the UI

**What to do**:
1. Login as a teacher from Phase 2
2. Navigate to Gradebook
3. Select assigned section
4. Select a learning area (subject)
5. Enter grades for all students:
   - **Written Work**: 3-5 grades (e.g., 85, 90, 88)
   - **Performance Task**: 3-5 grades (e.g., 92, 88, 90)
   - **Quarterly Assessment**: 1 grade (e.g., 87)
6. Verify **Initial Grade** calculates: `(WW avg × 0.3) + (PT avg × 0.5) + (QA × 0.2)`
7. Enter **Quarterly Grade** (can match initial or be different)
8. Verify **Final Grade** = Quarterly Grade
9. Repeat for all subjects assigned to that teacher

**Sample Calculation**:
- WW: 85, 90, 88 → Avg = 87.67
- PT: 92, 88, 90 → Avg = 90
- QA: 87
- **Initial**: (87.67 × 0.3) + (90 × 0.5) + (87 × 0.2) = **88.70**
- **Quarterly**: 89 (teacher can adjust)
- **Final**: 89

**Validation Checklist**:
- [ ] Can select section
- [ ] Can select subject
- [ ] All students visible
- [ ] Can enter WW grades
- [ ] Can enter PT grades
- [ ] Can enter QA grades
- [ ] Initial grade auto-calculates correctly
- [ ] Can enter quarterly grade
- [ ] Final grade displays correctly
- [ ] Grades save (refresh page, still there)
- [ ] No console errors

**Time**: ~20-30 minutes

---

## Phase 7: Enter Core Values (MANUAL UI TEST)

**No script** - manual testing through UI

**What to do**:
1. Navigate to Core Values Gradebook
2. Select assigned section
3. See 4 DepEd core values with behaviors:
   - **Maka-Diyos** (5 behaviors)
   - **Makatao** (6 behaviors)
   - **Makakalikasan** (3 behaviors)
   - **Makabansa** (5 behaviors)
4. Enter ratings for all students for Q1:
   - **AO** (Always Observed)
   - **SO** (Sometimes Observed)
   - **RO** (Rarely Observed)
   - **NO** (Not Observed)

**Validation Checklist**:
- [ ] All 4 core values visible
- [ ] All behaviors show correctly
- [ ] Can select ratings (AO/SO/RO/NO)
- [ ] Ratings save correctly
- [ ] No infinite loading
- [ ] No console errors
- [ ] Refresh page, data persists

**Time**: ~15 minutes

---

## Phase 8: Generate Reports (MANUAL UI TEST)

**No script** - manual testing through UI

### 8A: School Form 2 (SF2)

**What to do**:
1. Navigate to Reports → SF2
2. Select a student (who has grades from Phase 6)
3. Click "Generate SF2"
4. Verify PDF contains:
   - All subjects (11 total)
   - All quarters (Q1-Q4, only Q1 should have data)
   - Core Values section
   - Final grades
   - Student info (LRN, name, section)

**Validation Checklist**:
- [ ] PDF generates without errors
- [ ] All academic grades show correctly
- [ ] Core Values section present
- [ ] Calculations match what was entered
- [ ] No missing data
- [ ] Format looks professional

### 8B: Form 138 (Report Card)

**What to do**:
1. Navigate to Reports → Form 138
2. Select same student
3. Click "Generate Form 138"
4. Verify format matches DepEd requirements

**Validation Checklist**:
- [ ] PDF generates
- [ ] Follows DepEd format
- [ ] All grades present
- [ ] Core Values included
- [ ] School info correct

**Time**: ~10 minutes

---

## Phase 9: Validate Student/Parent Views (MANUAL UI TEST)

### 9A: Student View

**What to do**:
1. Logout from teacher account
2. Login as a student (use credentials from Phase 5)
3. Navigate to Grades
4. Verify sees own grades only

**Validation Checklist**:
- [ ] Student sees own grades
- [ ] Cannot see other students' grades
- [ ] Core Values visible
- [ ] Calculations match teacher entry
- [ ] No edit capabilities (read-only)

### 9B: Parent View (if implemented)

**What to do**:
1. Login as a parent (if parent accounts exist)
2. Verify sees linked child's grades
3. Check access permissions

**Validation Checklist**:
- [ ] Parent sees child's grades
- [ ] Cannot access other students
- [ ] Read-only access
- [ ] All data matches student view

**Time**: ~5 minutes

---

## Phase 10: Run Automated E2E Test (TODO)

**Command**: 
```bash
npm run test:e2e:real-onboarding
```

**What it tests**:
- All login scenarios (superadmin, teachers, students)
- Gradebook data visibility
- Grade calculations
- Core Values data
- Permission boundaries

**Pass criteria**:
- All tests PASS
- No console errors
- Data accuracy verified

**Note**: This test script doesn't exist yet - needs to be created

**Time**: ~5 minutes

---

## Summary of Required Information

**You need to decide/provide**:

1. **School Name** (Phase 1)
2. **Admin Email** (Phase 1)
3. **Admin Password** (Phase 1)
4. **Teacher Password** (Phase 2)
5. **Students per Section** (Phase 5) - recommend 10 for quick test
6. **Student Password** (Phase 5)

**Note**: Phases 2-5 auto-detect the school ID, no need to copy/paste!

**Recommended Values for Quick Test**:
```
School Name: Demo Academy
Admin Email: admin@demo.edu
Admin Password: Demo123!
Teacher Password: Teacher123!
Student Password: Student123!
Students per Section: 10
```

---

## Total Time Estimate

- **Automated Phases (1-5)**: ~15 minutes
- **Manual Testing (6-9)**: ~50 minutes
- **Total First Run**: ~65 minutes (1 hour)

---

## What Happens After All Phases Complete?

**If everything passes**:
- ✅ Real school onboarding workflow validated
- ✅ All critical bugs caught and fixed
- ✅ Confidence level: 80-85%
- ✅ Ready for first real school onboarding

**If bugs are found**:
- Document the bug
- Fix immediately
- Re-run failed phase
- Continue until all phases pass

---

## Ready to Start?

Run this command when ready:
```bash
node scripts/real-onboarding/phase1-create-school.cjs
```

I'll guide you through each phase step by step.
