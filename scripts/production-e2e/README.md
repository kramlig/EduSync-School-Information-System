# Production E2E Testing Setup

**Status: ✅ ALL PHASES COMPLETE (8/8)**

This directory contains scripts for comprehensive E2E testing on the production Firebase project (`edusync-sis`). All 8 phases have been successfully completed and demo data is ready for testing.

---

## Quick Start

### Run Automated Tests (Recommended)
```bash
# Run all production smoke tests
npx playwright test tests/production-smoke-test.spec.ts

# Run with UI mode
npx playwright test tests/production-smoke-test.spec.ts --ui

# Run in headed mode (see browser)
npx playwright test tests/production-smoke-test.spec.ts --headed
```

### Manual Testing
1. Go to https://edusync.ph
2. Login with any test account (password: `Demo123!`)
3. Verify role-specific functionality

**Test Accounts:**
- `superadmin-demo@edusync.ph` - Superadmin (login at /admin)
- `admin-demo@edusync.ph` - School admin (login at /admin)
- `teacher-demo@edusync.ph` - Teacher
- `student-demo@edusync.ph` - Student
- `parent-demo@edusync.ph` - Parent

---

## Why Production E2E?

After extensive testing on staging (`edusync-staging`), we discovered several issues:
- Session caching causing outdated data
- Environment configuration drift  
- Time wasted on deployment and data setup
- Delayed feedback on data structure issues

**Production E2E benefits:**
- Real configuration (no drift)
- True confidence (works for actual users)
- Faster iteration (no deploy delays)
- Immediate issue identification

**Safety:** Uses isolated multi-tenant school (`demo-e2e-testing`) that won't affect real schools.

---

## Phase Completion Summary

| Phase | Script | Purpose | Status |
|-------|--------|---------|--------|
| 1 | `phase1-create-demo-school.cjs` | Create demo school | ✅ Complete |
| 2 | `phase2-create-test-accounts.cjs` | Create 5 test accounts | ✅ Complete |
| 3 | `phase3-create-sections.cjs` | Create 5 sections | ✅ Complete |
| 4 | `phase4-create-teachers.cjs` | Teacher assignments + learning areas | ✅ Complete |
| 5 | `phase5-create-students.cjs` | Create 51 students | ✅ Complete |
| 6 | `phase6-seed-grades.cjs` | Seed 2,805 grades | ✅ Complete |
| 7 | `phase7-link-parent.cjs` | Link parent to 3 children | ✅ Complete |
| 8 | `phase8-smoke-tests.cjs` | Verify all data | ✅ Complete |

---

## Final Data Summary

**School:** `demo-e2e-testing`
- **Accounts:** 5 (superadmin, admin, teacher, student, parent)
- **Sections:** 5 (3 Grade 7, 2 Grade 10)
- **Learning Areas:** 11 subjects (Filipino, English, Math, Science, AP, ESP, TLE, Music, Arts, PE, Health)
- **Students:** 51 total (30 Grade 7, 21 Grade 10)
- **Grades:** 2,805 documents (Q1-Q4 + finals for all students)
- **Parent-Child Links:** 1 parent → 3 children

---

## Phase Details

### Phase 1: Create Demo School ✅
**Script:** `phase1-create-demo-school.cjs`

**What it creates:**
- Isolated school: `demo-e2e-testing`
- School metadata (name, year 2024-2025, public secondary)
- Multi-tenant isolation (won't affect real schools)

**Result:** 1 demo school created

**Run:** `node scripts/production-e2e/phase1-create-demo-school.cjs`

---

### Phase 2: Create Test Accounts ✅
**Script:** `phase2-create-test-accounts.cjs`

**What it creates:**
- 5 Firebase Auth accounts
- Custom claims (role + schoolId)
- Users collection documents
- Role-specific collection documents

**Accounts created:**
- `superadmin-demo@edusync.ph` (UID: G4V8k7udaWWGVpEX8FvIdtSzEu23)
- `admin-demo@edusync.ph` (UID: WnY1HmTYlzSkBquvHrJ4HDkkfHj2)
- `teacher-demo@edusync.ph` (UID: rizO0eysrAbLCsZy3OhM29Gvx6N2)
- `student-demo@edusync.ph` (UID: RvW2AT6lyLX4rsI7YNdAsQquCFs2)
- `parent-demo@edusync.ph` (UID: jumLcSsXcGcG7Zu81SvBHwXFx013)

**Password:** `Demo123!` (all accounts)

**Result:** 5 accounts, all verified and can login

**Run:** 
```bash
node scripts/production-e2e/phase2-create-test-accounts.cjs
node scripts/production-e2e/verify-phase2.cjs  # Verify
```

---

### Phase 3: Create Sections ✅
**Script:** `phase3-create-sections.cjs`

**What it creates:**
- Grade 7 Section A (Room 7A, capacity 10)
- Grade 7 Section B (Room 7B, capacity 10)
- Grade 7 Section C (Room 7C, capacity 10)
- Grade 10 Section A (Room 10A, capacity 10)
- Grade 10 Section B (Room 10B, capacity 10)

**Result:** 5 sections created

**Run:** `node scripts/production-e2e/phase3-create-sections.cjs`

---

### Phase 4: Create Teachers ✅ **CRITICAL PHASE**
**Script:** `phase4-create-teachers.cjs`

**What it creates:**
- 11 learning areas (Filipino, English, Math, Science, AP, ESP, TLE, Music, Arts, PE, Health)
- 11 teacher assignments (one per subject for Grade 10 Section A)
- Teacher assigned as adviser to Grade 10 Section A
- **Properly formatted `assignments` array** (fixes infinite loading from staging)

**Why critical:** This phase implements the lesson learned from staging - teachers MUST have assignments array with specific sectionIds for gradebook to work.

**Result:** 
- 11 learning areas
- Teacher has 11 assignments
- Teacher is adviser
- **Gradebook will work** (once students added)

**Run:** `node scripts/production-e2e/phase4-create-teachers.cjs`

---

### Phase 5: Create Students ✅
**Script:** `phase5-create-students.cjs`

**What it creates:**
- 50 students (10 per section)
- Demo student account assigned to Grade 10 Section A
- Realistic names, LRNs, demographics

**Students distribution:**
- Grade 7 Section A: 10 students
- Grade 7 Section B: 10 students
- Grade 7 Section C: 10 students
- Grade 10 Section A: 11 students (includes demo student)
- Grade 10 Section B: 10 students

**Result:** 51 students total

**Run:** `node scripts/production-e2e/phase5-create-students.cjs`

---

### Phase 6: Seed Grades ✅
**Script:** `phase6-seed-grades.cjs`

**What it creates:**
- 51 students × 11 subjects × 5 docs (Q1-Q4 + Final) = 2,805 grades
- Realistic grade distribution (75-95 range)
- Component scores: Written Work (40%), Performance Task (40%), Quarterly Assessment (20%)

**Grades breakdown:**
- Q1 grades: 561
- Q2 grades: 561
- Q3 grades: 561
- Q4 grades: 561
- Final grades: 561

**Result:** Complete grade records for all students

**Run:** `node scripts/production-e2e/phase6-seed-grades.cjs`

---

### Phase 7: Link Parent ✅
**Script:** `phase7-link-parent.cjs`

**What it creates:**
- Parent linked to 3 children:
  1. Francisco Santos - Grade 7 Section A
  2. Jorge Santos - Grade 7 Section B
  3. Juan Santos - Grade 10 Section A
- Updates parent and student documents
- Enables parent grade viewing

**Result:** Parent can view all 3 children's grades

**Run:** `node scripts/production-e2e/phase7-link-parent.cjs`

---

### Phase 8: Smoke Tests ✅
**Script:** `phase8-smoke-tests.cjs`

**What it does:**
- Verifies all phases completed
- Checks data integrity
- Provides testing instructions
- Generates comprehensive summary

**Result:** All data verified and ready

**Run:** `node scripts/production-e2e/phase8-smoke-tests.cjs`

---

## Automated Testing

### Production Smoke Tests
**File:** `tests/production-smoke-test.spec.ts`

**10 comprehensive tests:**
1. Site loads and service worker registers (PWA)
2. Superadmin login and dashboard
3. Admin login and dashboard
4. Teacher login and gradebook access
5. Student login and grades view
6. Parent login and children view
7. Navigation and route accessibility
8. Offline mode (PWA)
9. Data integrity check
10. Performance check

**Run tests:**
```bash
# All tests
npx playwright test tests/production-smoke-test.spec.ts

# With UI mode (recommended)
npx playwright test tests/production-smoke-test.spec.ts --ui

# Headed mode (see browser)
npx playwright test tests/production-smoke-test.spec.ts --headed

# Specific test
npx playwright test tests/production-smoke-test.spec.ts -g "Teacher login"
```

---

## Manual Verification Checklist

### Teacher Testing (teacher-demo@edusync.ph)
- [ ] Login successful at https://edusync.ph
- [ ] Dashboard shows teacher info
- [ ] Navigate to Gradebook/Assessment
- [ ] Select "Grade 10 - Section A"
- [ ] See 11 students listed
- [ ] See all 11 subjects
- [ ] Grades populated for all quarters
- [ ] No infinite loading

### Student Testing (student-demo@edusync.ph)
- [ ] Login successful
- [ ] Dashboard shows "Grade 10 - Section A"
- [ ] Navigate to Grades
- [ ] See all 11 subjects
- [ ] See Q1-Q4 grades and finals
- [ ] Realistic grades (75-95 range)

### Parent Testing (parent-demo@edusync.ph)
- [ ] Login successful
- [ ] Dashboard shows 3 children
- [ ] Click Francisco Santos → see grades
- [ ] Click Jorge Santos → see grades
- [ ] Click Juan Santos → see grades

### Admin Testing (admin-demo@edusync.ph)
- [ ] Login successful
- [ ] Dashboard shows school stats
- [ ] Navigate to Students → see 51 students
- [ ] Navigate to Teachers → see demo teacher
- [ ] Navigate to Sections → see 5 sections

---

## Re-running All Phases

If you need to re-setup (e.g., after cleanup):

```bash
node scripts/production-e2e/phase1-create-demo-school.cjs
node scripts/production-e2e/phase2-create-test-accounts.cjs
node scripts/production-e2e/verify-phase2.cjs
node scripts/production-e2e/phase3-create-sections.cjs
node scripts/production-e2e/phase4-create-teachers.cjs
node scripts/production-e2e/phase5-create-students.cjs
node scripts/production-e2e/phase6-seed-grades.cjs
node scripts/production-e2e/phase7-link-parent.cjs
node scripts/production-e2e/phase8-smoke-tests.cjs

# Then run automated tests
npx playwright test tests/production-smoke-test.spec.ts
```

---

## Troubleshooting

### Common Issues

1. **"School not found"** → Run Phase 1 first
2. **"User document not found"** → Ensure Phase 2 completed, run verify-phase2.cjs
3. **"No custom claims"** → Re-run verify-phase2.cjs
4. **Login fails** → Check both users and role-specific collections exist
5. **Gradebook infinite loading** → Verify teacher has assignments array (Phase 4)
6. **No students in gradebook** → Ensure Phase 5 completed
7. **No grades showing** → Verify Phase 6 completed

### Debug Commands

Check school:
```bash
firebase firestore:get schools/demo-e2e-testing --project edusync-sis
```

Check user:
```bash
firebase auth:export users.json --project edusync-sis
```

Verify teacher assignments:
```bash
firebase firestore:get teachers/rizO0eysrAbLCsZy3OhM29Gvx6N2 --project edusync-sis
```

---

## Lessons Learned from Staging

**Critical discoveries that shaped this approach:**

### 1. Teacher Assignments Array Required ⚠️
**Problem:** Gradebook showed infinite loading for teachers  
**Root Cause:** Teacher document missing `assignments` array  
**Why It Matters:** Gradebook filters by `session.user.assignments[]`, NOT by `adviserId`  
**Solution:** Phase 4 creates properly formatted assignments:

```javascript
assignments: [
  { 
    gradeLevel: 10, 
    learningAreaId: "demo_la_xxx", 
    sectionId: "demo_grade10_section_a"  // CRITICAL: specific section
  }
  // ... one per subject per section
]
```

### 2. Multi-Collection Architecture
**Discovery:** Login requires BOTH collections

**Structure:**
- `users/{uid}` - Universal user doc (login checks this first)
- `teachers/{uid}` - Teacher-specific data + assignments
- `students/{uid}` - Student-specific data + sectionId
- `parents/{uid}` - Parent-specific data + studentIds

**Solution:** Phase 2 creates both collections for every account

### 3. Session Caching
**Discovery:** Session object NOT auto-updated when Firestore changes  
**Behavior:** Session created at login, remains static until logout  
**Impact:** Adding assignments doesn't affect logged-in session  
**Solution:** Fresh login required to see Firestore updates

### 4. Phase-by-Phase Benefits
**Old Approach:** Create all data at once, debug when tests fail  
**New Approach:** Create incrementally, verify each step

**Benefits:**
- Identify issues immediately (Phase 2 caught missing users collection)
- Fix before building on broken foundation
- Faster completion (no 2-hour debugging sessions)
- Reusable scripts for targeted fixes

### 5. Production E2E > Staging E2E
**Staging Issues:**
- Session caching caused outdated data
- Environment drift (staging config ≠ production)
- Deployment overhead slowed iteration
- Synthetic data setup wasted time

**Production Benefits:**
- Real configuration (exactly what users see)
- Multi-tenant isolation (safe)
- Immediate feedback (no deploy)
- True confidence (if works here, works for users)

---

## Next Steps

1. **Run Automated Tests** ✅
   - Execute production smoke tests
   - Review test results
   - Document any failures

2. **Manual Verification** ✅
   - Test all 5 roles manually
   - Verify critical user flows
   - Check edge cases

3. **Expand Test Coverage** 📝
   - Create functional tests for other modules
   - Add tests for attendance, assignments, forms
   - Test offline functionality thoroughly
   - Add performance benchmarks

4. **Continuous Testing** 📝
   - Schedule regular E2E test runs
   - Monitor for regressions
   - Update tests as features change

---

## Additional Resources

- **Staging Investigation:** See staging test files for lessons learned
- **Grading Fix:** `GRADING_SYSTEM_FIXED.md` documents the debugging journey
- **Copilot Instructions:** `.github/copilot-instructions.md` for architecture context
- **Infinite Loop Prevention:** `INFINITE_LOOP_PREVENTION.md` for React best practices
