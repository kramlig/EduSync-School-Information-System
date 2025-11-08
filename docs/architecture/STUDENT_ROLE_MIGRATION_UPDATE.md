# Student Role Support - Migration Update Summary

**Date:** November 8, 2025  
**Status:** ✅ Documentation Updated  

---

## Issue Identified

The initial migration plan **missed student role support**, even though students can log in and access the system through:
- `StudentDashboard.tsx`
- Session type: `'student'`
- Routes for: dashboard, assignments, grades, core values, attendance, schedule

---

## What Was Updated

### 1. SECURITY_RULES_MIGRATION.md ✅ COMPLETE

**Added isStudent() Helper Function:**
```javascript
function isStudent() {
  return isAuthenticated() && getUserRole() == 'student';
}
```

**Updated Collection Rules (9 collections):**

| Collection | Student Access | Details |
|------------|---------------|---------|
| **Students** | ✅ Self-read only | `allow read: if isStudent() && request.auth.uid == studentId && belongsToUserSchool(resource.data)` |
| **Grades** | ✅ Own grades only | `allow read: if isStudent() && request.auth.uid == resource.data.studentId && belongsToUserSchool(resource.data)` |
| **CoreValues** | ✅ Read school's values | `allow read: if isStudent() && belongsToUserSchool(resource.data)` |
| **CoreValueGrades** | ✅ Own assessments only | `allow read: if isStudent() && request.auth.uid == resource.data.studentId` |
| **AttendanceRecords** | ✅ Own attendance only | `allow read: if isStudent() && request.auth.uid == resource.data.studentId` |
| **Assignments** | ✅ Read school's assignments | `allow read: if isAuthenticated() && belongsToUserSchool(resource.data)` |
| **StudentAssignmentGrades** | ✅ Own assignment grades | `allow read: if isStudent() && request.auth.uid == resource.data.studentId` |
| **Announcements** | ✅ Read school's announcements | `allow read: if isAuthenticated() && belongsToUserSchool(resource.data)` |
| **Form 137/138** | ✅ Own forms only | `allow read: if isStudent() && request.auth.uid == resource.data.studentId` |

**Student Security Model:**
- ✅ Students can ONLY read their own data
- ✅ Students can view school-wide resources (assignments, announcements, core values)
- ❌ Students CANNOT write/update/delete anything
- ❌ Students CANNOT see other students' data
- ❌ Students CANNOT access cross-school data

**Added 6 Student-Specific Security Tests:**
1. Student can read only own student record
2. Student can read own grades only
3. Student denied reading cross-school data
4. Student can read school's assignments
5. Student denied write access to grades
6. Student cannot read other students in same school

---

### 2. MULTI_TENANT_TEST_PLAN.md ✅ COMPLETE

**Added Student Portal E2E Tests (7 scenarios):**

```typescript
test.describe('Student Portal', () => {
  test('Student can login and view own data only')
  test('Student cannot access other students data')
  test('Student cannot access cross-school data')
  test('Student can view own grades from same school')
  test('Student can view assignments from their school')
  test('Student cannot modify grades')
  test('Student can view attendance from their school')
})
```

**Updated Test Environment Setup:**
- Added School 001 Student test account
- Added School 002 Student test account
- Updated seed data to include student login credentials

**Updated Manual Test Checklist:**
- Added "Login as Student → See student dashboard with own data only"
- Added "School 001 Student can view only own data"
- Added "School 001 Student cannot see School 002 data"
- Added "School 001 Student cannot see other School 001 students' data"

**Updated Seed Data Structure:**
```json
{
  "id": "s1-001",
  "schoolId": "school-001",
  "email": "student-001@school001.com",
  "password": "hashed_password"
}
```

---

### 3. QUERY_MIGRATION_CHECKLIST.md ✅ Already Covered

StudentDashboard and related components already listed:
- ✅ StudentDashboard.tsx (P1-High, 2 hours)
- ✅ AssignmentsView (P2-Medium, 2 hours)
- ✅ AttendanceView (P1-High, 3 hours)
- ✅ GradesView (P1-High, 3 hours)
- ✅ UnifiedAssessmentView (P1-High, 4 hours)
- ✅ SchedulerView (P2-Medium, 2 hours)

**Note:** These components already handle student sessions (`session.type === 'student'`), so they just need schoolId filtering applied.

---

### 4. Custom Claims Script (Pending)

**Still needs to be updated** to include student role:

```typescript
// Current: admin, teacher, principal, registrar, parent
// Need to add: student

async function setCustomClaims(uid: string, role: string, schoolId: string) {
  if (!['admin', 'teacher', 'principal', 'registrar', 'parent', 'student'].includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }
  
  await admin.auth().setCustomClaims(uid, {
    role: role,
    schoolId: schoolId,
    schoolIds: [schoolId],
    isSuperAdmin: false
  });
}

// For students, get schoolId from student document
async function setStudentClaims(studentId: string) {
  const studentDoc = await firestore.collection('students').doc(studentId).get();
  const schoolId = studentDoc.data().schoolId;
  
  await setCustomClaims(studentId, 'student', schoolId);
}
```

---

## Student Role Specifications

### Authentication Flow

1. **Student Login:**
   - Email: student email from `students` collection
   - Password: student password field
   - Firebase Auth UID matches student document ID

2. **Get SchoolId:**
   - Query `students` collection by email (like teacher login)
   - Extract `schoolId` from student document
   - Set in `SchoolContext`

3. **Custom Claims:**
   ```json
   {
     "role": "student",
     "schoolId": "school-001",
     "schoolIds": ["school-001"],
     "isSuperAdmin": false
   }
   ```

### Data Access Matrix

| Resource | Read | Write | Notes |
|----------|------|-------|-------|
| **Own Student Record** | ✅ | ❌ | Can view profile |
| **Own Grades** | ✅ | ❌ | All subjects |
| **Own Attendance** | ✅ | ❌ | Full history |
| **Own Assignments** | ✅ | ❌ | View homework |
| **Own Assignment Grades** | ✅ | ❌ | See scores |
| **Own Core Values** | ✅ | ❌ | Character assessment |
| **Own Forms (137/138)** | ✅ | ❌ | Permanent records |
| **School Announcements** | ✅ | ❌ | School news |
| **School Assignments** | ✅ | ❌ | All class homework |
| **Other Students** | ❌ | ❌ | Completely hidden |
| **Teachers** | ❌ | ❌ | Hidden |
| **Settings** | ❌ | ❌ | Admin only |

---

## Migration Impact

### No Breaking Changes ✅

The student role addition is **ADDITIVE ONLY**:
- ✅ Existing code already handles `session.type === 'student'`
- ✅ Components already check `isStudentView` before showing data
- ✅ Read-only mode already enforced in UI
- ✅ Just need to add `schoolId` filtering to existing queries

### Estimated Effort

| Task | Hours |
|------|-------|
| ✅ Update SECURITY_RULES_MIGRATION.md | 2 hours (DONE) |
| ✅ Update MULTI_TENANT_TEST_PLAN.md | 1 hour (DONE) |
| ⏳ Update Custom Claims Script | 1 hour |
| ⏳ Verify StudentDashboard queries | 1 hour |
| ⏳ Test student login flow | 1 hour |
| **Total** | **6 hours** |

---

## Next Steps

### Immediate (This Session)
1. ✅ Update SECURITY_RULES_MIGRATION.md - DONE
2. ✅ Update MULTI_TENANT_TEST_PLAN.md - DONE
3. ⏳ Add note to QUERY_MIGRATION_CHECKLIST.md - IN PROGRESS
4. ⏳ Create custom claims script template

### Phase 1 Week 2 (Prototype)
- Test student login with schoolId lookup
- Verify StudentDashboard filters by schoolId
- Confirm student cannot see cross-school data

### Phase 4 (Security Rules)
- Deploy isStudent() helper function
- Deploy student read rules for all 9 collections
- Run student security tests
- Verify student access restrictions

---

## Success Criteria

**Student Role Support Complete When:**
- [ ] isStudent() function in firestore.rules
- [ ] 9 collection rules updated with student access
- [ ] 6+ student security tests passing
- [ ] 7 student E2E tests passing
- [ ] Custom claims script supports 'student' role
- [ ] Student can login and see only own data
- [ ] Student cannot access other students
- [ ] Student cannot access cross-school data
- [ ] Student cannot modify any data
- [ ] StudentDashboard filters by schoolId

---

## Risk Assessment

**LOW RISK** because:
1. Student UI already exists and works
2. Just adding security layer (schoolId filtering)
3. Read-only access prevents data corruption
4. Test coverage comprehensive
5. Can rollback security rules if issues

**Potential Issues:**
- Student login flow might need email → schoolId lookup (same as teachers)
- Custom claims need to be set for all students
- Seed scripts need to create student Firebase Auth users

---

**Status:** Documentation phase complete ✅  
**Next:** Update QUERY_MIGRATION_CHECKLIST.md and create custom claims script template  
**Timeline:** +6 hours to total migration effort
