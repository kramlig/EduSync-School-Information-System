# Forms Data Source Issue - Critical Finding

**Date**: November 21, 2025  
**Issue**: DepEd Forms fetching wrong data (Firestore instead of PostgreSQL)  
**Impact**: Forms not using migrated PostgreSQL data  
**Priority**: 🔴 HIGH - Blocks migration completion

---

## Problem Summary

All DepEd forms are still using **Firestore** as their data source instead of **PostgreSQL (Supabase)**. This means forms are showing outdated/unmigrated data.

---

## Affected Components

### 1. **Form 137 Dashboard** (`components/forms/Form137/Form137Dashboard.tsx`)
- **Current**: Uses Firestore `getDocs()` directly (lines 107-127)
- **Should use**: `useStudentsPostgreSQL()` and `useSectionsPostgreSQL()`

```tsx
// ❌ CURRENT (Firestore)
const studentsQuery = query(
  collection(db, 'students'),
  where('schoolId', '==', schoolId)
);
const snapshot = await getDocs(studentsQuery);

// ✅ SHOULD BE (PostgreSQL)
const { students, loading } = useStudentsPostgreSQL();
```

### 2. **Form 138 Dashboard** (`components/forms/Form138/Form138Dashboard.tsx`)
- **Current**: Uses `useSchoolData(['students', 'grades', 'sections', ...])` (line 33)
- **Should use**: PostgreSQL hooks

```tsx
// ❌ CURRENT (Firestore)
const schoolData = useSchoolData([
  'students', 'grades', 'sections', 'teachers',
  'learningAreas', 'coreValues', 'coreValueGrades',
  'attendanceRecords', 'parents'
]);

// ✅ SHOULD BE (PostgreSQL)
const { students } = useStudentsPostgreSQL();
const { grades } = useGradesPostgreSQL();
const { sections } = useSectionsPostgreSQL();
// ... etc
```

### 3. **Form 138 Print** (`components/forms/Form138/Form138Print.tsx`)
- **Current**: Uses `useSchoolData()` (lines 12-22)
- **Should use**: PostgreSQL hooks

### 4. **Form 138 View** (`components/forms/Form138/Form138View.tsx`)
- **Current**: Uses `useSchoolData()` (lines 14-24)
- **Should use**: PostgreSQL hooks

### 5. **School Forms Dashboard** (likely affected)
- Need to check SF1, SF2, SF9 components

---

## Root Cause

During the PostgreSQL migration (Days 6-10), we migrated:
- ✅ Students module → `useStudentsPostgreSQL()`
- ✅ Teachers module → `useTeachersPostgreSQL()`
- ✅ Sections module → `useSectionsPostgreSQL()`
- ✅ Grades pages → Direct Supabase queries

BUT we **did not update the forms** to use PostgreSQL hooks!

---

## Why Tests Passed

The navigation tests (`tests/reports-postgresql.spec.ts`) only verified:
- ✅ Routes accessible
- ✅ Pages load without errors
- ✅ Role-based access control

They **did NOT** verify the data source. The forms loaded, but with Firestore data.

---

## Fix Required

### Option 1: Create PostgreSQL Hooks for Forms (Recommended)
Create dedicated hooks for forms data:
- `useForm137Data()` - Fetches students + academic history from PostgreSQL
- `useForm138Data()` - Fetches students + grades + core values from PostgreSQL
- `useSchoolFormsData()` - Fetches enrollment/attendance from PostgreSQL

### Option 2: Update Forms to Use Existing PostgreSQL Hooks
Replace `useSchoolData()` with:
```tsx
const { students, loading: studentsLoading } = useStudentsPostgreSQL();
const { sections, loading: sectionsLoading } = useSectionsPostgreSQL();
const { teachers, loading: teachersLoading } = useTeachersPostgreSQL();
const { grades, loading: gradesLoading } = useGradesPostgreSQL(); // Need to create
```

### Option 3: Hybrid - Forms Service with PostgreSQL Backend
Update `services/formsService.ts` to use Supabase instead of Firestore:
```ts
// ❌ CURRENT
const db = getFirestoreInstance();
const snapshot = await getDocs(query(collection(db, 'students')));

// ✅ UPDATED
const { data, error } = await supabase
  .from('students')
  .select('*')
  .eq('school_id', schoolId);
```

---

## Recommended Approach

**Phase 1 (Quick Fix - Today)**:
1. Update Form 137 Dashboard to use `useStudentsPostgreSQL()`
2. Update Form 138 Dashboard to use `useStudentsPostgreSQL()`
3. Verify forms load correct PostgreSQL data

**Phase 2 (Complete Fix - Tomorrow)**:
4. Create `useGradesPostgreSQL()` hook for grades data
5. Create `useCoreValuesPostgreSQL()` hook for core values
6. Create `useAttendancePostgreSQL()` hook for attendance
7. Update all form components to use PostgreSQL hooks
8. Update `services/formsService.ts` to use Supabase
9. Add tests to verify data source (PostgreSQL vs Firestore)

---

## Files to Update

### High Priority (Forms displaying wrong data):
1. `components/forms/Form137/Form137Dashboard.tsx` - Student list
2. `components/forms/Form138/Form138Dashboard.tsx` - Student list
3. `components/forms/Form138/Form138Print.tsx` - Print functionality
4. `components/forms/Form138/Form138View.tsx` - Individual view

### Medium Priority (Supporting services):
5. `services/formsService.ts` - Update to Supabase
6. `services/form137Generator.ts` - Update grade queries

### Low Priority (Additional forms):
7. School Forms (SF1, SF2, SF9) components
8. ELLN Assessment components

---

## Impact on Migration

**Migration Status**:
- Overall: **79% → 65%** (forms data not migrated)
- Week 3 Progress: **75% → 50%** (Day 13 incomplete)

**Critical Missing**:
- Forms using wrong data source (Firestore)
- PostgreSQL student data not displayed in forms
- Forms module **NOT** actually migrated

**What This Means**:
- Navigation redesign (Day 11) ✅ Complete
- Authentication verification (Day 12) ✅ Complete
- **Testing (Day 13) ❌ INCOMPLETE** - Data source not verified
- Forms need migration before production deployment

---

## Next Steps

1. **Immediate**: Create `useGradesPostgreSQL()` hook
2. **Today**: Update Form 137 and Form 138 dashboards
3. **Tomorrow**: Complete all form component updates
4. **Final**: Add data source verification tests

---

**Status**: 🔴 **CRITICAL ISSUE IDENTIFIED** - Forms migration incomplete  
**Priority**: Must fix before declaring migration complete  
**Estimated Time**: 4-6 hours to fully migrate forms to PostgreSQL
