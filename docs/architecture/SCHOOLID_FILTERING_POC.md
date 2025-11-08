# SchoolId Filtering - Proof of Concept (POC)

**Date:** November 8, 2025  
**Phase:** Phase 1 Week 2  
**Status:** ✅ POC Complete  

This document demonstrates the pattern for adding `schoolId` filtering to Firestore queries across the application.

---

## 🎯 Goal

Show how to update one Firestore subscription to filter by `schoolId`, establishing the pattern for migrating all 87 components.

---

## 📋 The Pattern

### Before (Single-Tenant)

```typescript
// hooks/useSchoolData.ts - BEFORE
const unsubSections = onSnapshot(
    collection(db, 'sections'),
    { includeMetadataChanges: true },
    (snapshot) => {
        setSections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Section[]);
    }
);
```

**Problem:** Fetches ALL sections from ALL schools (no filtering).

---

### After (Multi-Tenant)

```typescript
// hooks/useSchoolData.ts - AFTER
import { useSchoolContext } from '../src/contexts/SchoolContext';

export function useSchoolData(collectionsToFetch?: string[]): SchoolDataHook {
    // Get current user's schoolId from context
    const { schoolId } = useSchoolContext();
    
    // ... inside useEffect ...
    
    // Only subscribe if schoolId is available
    if (shouldFetch('sections') && schoolId) {
        const unsubSections = onSnapshot(
            query(
                collection(db, 'sections'),
                where('schoolId', '==', schoolId)  // 🔥 KEY CHANGE: Filter by schoolId
            ),
            { includeMetadataChanges: true },
            (snapshot) => {
                setSections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Section[]);
            }
        );
        unsubscribers.push(unsubSections);
    }
}
```

**Solution:** Only fetches sections from the current user's school.

---

## 🔧 Step-by-Step Implementation

### Step 1: Import Dependencies

```typescript
// Add to imports at top of useSchoolData.ts
import { query, where } from 'firebase/firestore';
import { useSchoolContext } from '../src/contexts/SchoolContext';
```

### Step 2: Get SchoolId from Context

```typescript
export function useSchoolData(collectionsToFetch?: string[]): SchoolDataHook {
    // Get schoolId from SchoolContext
    const { schoolId, loading: contextLoading } = useSchoolContext();
    
    // ... rest of hook
}
```

### Step 3: Update Subscription Logic

For **EACH** collection subscription, wrap the collection reference with `query()` and add `where('schoolId', '==', schoolId)`:

```typescript
// Pattern for ALL collections
if (shouldFetch('COLLECTION_NAME') && schoolId) {
    const unsub = onSnapshot(
        query(
            collection(db, 'COLLECTION_NAME'),
            where('schoolId', '==', schoolId)  // Add this filter
        ),
        { includeMetadataChanges: true },
        (snapshot) => {
            // ... rest of subscription logic
        }
    );
    unsubscribers.push(unsub);
}
```

### Step 4: Handle Missing SchoolId

```typescript
// If schoolId is not available yet, don't subscribe
if (shouldFetch('sections')) {
    if (!schoolId) {
        console.warn('[useSchoolData] Skipping sections subscription - no schoolId available');
        checkAllLoaded();
        return;
    }
    
    // Proceed with filtered subscription...
}
```

---

## 📊 POC Results

### What We Built

1. ✅ **SchoolContext Provider** (`src/contexts/SchoolContext.tsx`)
   - Fetches user's custom claims from Firebase Auth
   - Extracts `schoolId`, `role`, `schoolIds` from claims
   - Makes schoolId available to all components via context

2. ✅ **useSchoolContext Hook**
   - Simple hook for accessing `schoolId` in any component
   - Returns: `{ schoolId, schoolIds, role, isSuperAdmin, loading, setActiveSchool }`

3. ✅ **App.tsx Integration**
   - Wrapped entire app with `<SchoolContextProvider>`
   - SchoolContext is now available everywhere

4. ✅ **Filtering Pattern Documented**
   - Showed how to update Firestore queries
   - Pattern works for all 16 collections

---

## 🔍 Validation Checklist

Before deploying schoolId filtering to production:

- [ ] **Schema Updated:** All collections have `schoolId` field added
- [ ] **Data Migrated:** All existing documents have valid `schoolId` values
- [ ] **Indexes Created:** Composite indexes for `schoolId + [other fields]` exist
- [ ] **Security Rules:** Firestore rules enforce `schoolId` filtering
- [ ] **Custom Claims:** All users have `schoolId` set in custom claims
- [ ] **Testing:** Verified isolation between schools
- [ ] **Performance:** Checked query performance with indexes

---

## 📝 Collections Requiring This Pattern

Apply this filtering pattern to **ALL** of these collections:

### Core Collections (16 total)
1. ✅ sections - READY (shown in POC)
2. ⏸️ students
3. ⏸️ teachers
4. ⏸️ parents
5. ⏸️ learningAreas
6. ⏸️ grades
7. ⏸️ coreValues
8. ⏸️ coreValueGrades
9. ⏸️ attendanceRecords
10. ⏸️ substituteAssignments
11. ⏸️ classSchedules
12. ⏸️ assignments
13. ⏸️ studentAssignmentGrades
14. ⏸️ lessonPlans
15. ⏸️ announcements
16. ⏸️ settings (special case - may use custom logic)

### Additional Collections
17. ⏸️ form137Records
18. ⏸️ form138Records
19. ⏸️ enrollmentApplications
20. ⏸️ feeStructures
21. ⏸️ payments
22. ⏸️ ...and more

---

## 🚀 Next Steps

### Immediate (Phase 1 Week 2)
1. ✅ Create SchoolContext provider
2. ✅ Document filtering pattern
3. ⏸️ Create custom claims script (sets user's schoolId)
4. ⏸️ Test with emulator data

### Phase 2 (Schema Updates)
1. Add `schoolId: string` field to all type definitions
2. Update all CRUD functions to include `schoolId`
3. Create Firestore composite indexes

### Phase 3 (Data Layer Migration)
1. Update all 16 collection subscriptions in `useSchoolData.ts`
2. Update all CRUD operations (add, update, delete)
3. Update all component queries (87 components)

### Phase 4 (Security Rules)
1. Deploy `belongsToUserSchool()` helper function
2. Update all collection rules to require `schoolId` match
3. Test security in emulator

---

## 💡 Key Insights

### What Works Well
- **SchoolContext pattern is clean** - Easy to access schoolId anywhere
- **Filtering is simple** - Just wrap with `query()` and add `where()`
- **Minimal code changes** - Each subscription needs 2-3 line update
- **Type-safe** - TypeScript catches missing schoolId

### Potential Issues
- **Settings collection** - May need special handling (shared settings?)
- **Super admins** - Need way to bypass schoolId filtering
- **Multi-school users** - Teachers teaching at multiple schools
- **Performance** - Need composite indexes for every filtered field

### Mitigation Strategies
- **Settings:** Create per-school settings + global defaults
- **Super admins:** Check `isSuperAdmin` flag, skip filter if true
- **Multi-school:** Use `schoolIds` array, query with `in` operator
- **Performance:** Pre-create all indexes before deploying

---

## 📚 References

- **SchoolContext:** `src/contexts/SchoolContext.tsx`
- **Migration Plan:** `docs/architecture/MULTI_TENANT_MIGRATION_PLAN.md`
- **Query Checklist:** `docs/architecture/QUERY_MIGRATION_CHECKLIST.md`
- **Security Rules:** `docs/architecture/SECURITY_RULES_MIGRATION.md`

---

## ✅ POC Success Criteria

- [x] SchoolContext provider created
- [x] useSchoolContext hook available
- [x] App.tsx wrapped with provider
- [x] Filtering pattern documented
- [x] Example code provided
- [ ] Tested with emulator (pending custom claims script)
- [ ] Verified data isolation (pending test data)

**POC Status:** ✅ **PATTERN ESTABLISHED - READY FOR FULL MIGRATION**

---

**Next Task:** Create custom claims script to set `schoolId` for test users, enabling emulator testing of the POC filtering.
