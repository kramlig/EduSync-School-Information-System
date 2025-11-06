# Option C Refactor - Quick Start Guide

## ✅ Setup Complete

**Branch:** `refactor/firestore-subscriptions`  
**Tracker:** `OPTION_C_REFACTOR_TRACKER.md` (full details)  
**Backup:** `hooks/useSchoolData.REACT_QUERY_BACKUP.ts`

---

## 🎯 Current Status

- ✅ Branch created and checked out
- ✅ Comprehensive tracker document created (3-4 day plan)
- ✅ React Query implementation backed up
- ✅ Initial commit done
- 🔄 **Ready to start Phase 1 Day 1**

---

## 🚀 Next Steps (Day 1 Morning)

### 1. Create New Hook Structure

Create `hooks/useFirestoreData.ts`:

```typescript
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';
import type { SchoolDataHook } from './useSchoolData';

export function useFirestoreData(): SchoolDataHook {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];
    
    // Students subscription
    const unsubStudents = onSnapshot(
      collection(db, 'students'),
      { includeMetadataChanges: true },
      (snapshot) => {
        console.log(snapshot.metadata.fromCache ? '📦 CACHE' : '📡 SERVER');
        setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (err) => setError(err.message)
    );
    unsubscribers.push(unsubStudents);
    
    // TODO: Add remaining 15 collections...
    
    return () => unsubscribers.forEach(unsub => unsub());
  }, []);
  
  return {
    students,
    teachers,
    loading,
    error,
    // TODO: Add remaining properties to match SchoolDataHook interface
  };
}
```

### 2. Verify Compilation

```powershell
npm run build
```

Expected: No TypeScript errors

### 3. Commit Checkpoint

```powershell
git add hooks/useFirestoreData.ts
git commit -m "feat: Create initial useFirestoreData hook structure"
```

---

## 📋 Day 1 Checklist

- [ ] Morning: Create `useFirestoreData.ts` hook structure
- [ ] Morning: Add students + teachers subscriptions (test 2 collections)
- [ ] Morning: Verify compilation with `npm run build`
- [ ] Afternoon: Add remaining 14 collection subscriptions
- [ ] Afternoon: Add all CRUD methods (add/update/delete)
- [ ] Afternoon: Add search methods (students, teachers, parents)
- [ ] Evening: Commit checkpoint

**Target:** Working hook that mirrors current `SchoolDataHook` interface

---

## 🛡️ Rollback Instructions

If something goes wrong:

```powershell
# 1. Switch back to working branch
git checkout perf/login-optimization

# 2. Restore backup
Copy-Item "hooks\useSchoolData.REACT_QUERY_BACKUP.ts" -Destination "hooks\useSchoolData.ts" -Force

# 3. Verify
npm run build
```

---

## 📊 Success Metrics for Day 1

- ✅ New hook compiles without errors
- ✅ Exports valid `SchoolDataHook` interface
- ✅ All 16 collections have `onSnapshot()` subscriptions
- ✅ Loading/error states managed
- ✅ Cleanup on unmount implemented
- ✅ Console logs show cache detection working

---

## 🔗 Key Files Reference

| File | Purpose |
|------|---------|
| `OPTION_C_REFACTOR_TRACKER.md` | Full 3-4 day plan with details |
| `hooks/useSchoolData.ts` | Current React Query version (will delete Day 2) |
| `hooks/useSchoolData.REACT_QUERY_BACKUP.ts` | Safety backup |
| `hooks/useFirestoreData.ts` | New implementation (create Day 1) |
| `App.tsx` | Will update Day 2 to use new hook |

---

## 💡 Implementation Tips

### Firestore Subscription Pattern

```typescript
// Pattern for each collection:
const unsubCollection = onSnapshot(
  collection(db, 'collectionName'),
  { includeMetadataChanges: true }, // ← CRITICAL for cache detection
  (snapshot) => {
    // Success handler
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setCollectionData(data);
    
    // Log cache vs server
    if (snapshot.metadata.fromCache) {
      console.log('📦 [collectionName] from CACHE');
    } else {
      console.log('📡 [collectionName] from SERVER');
    }
  },
  (error) => {
    // Error handler
    console.error('[collectionName] error:', error);
    setError(error.message);
  }
);

// Store unsubscribe function
unsubscribers.push(unsubCollection);
```

### CRUD Operations Pattern

```typescript
// Add operation
const addStudent = async (student: Partial<Student>) => {
  try {
    const docRef = await addDoc(collection(db, 'students'), {
      ...student,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
};

// Update operation
const updateStudent = async (id: string, updates: Partial<Student>) => {
  try {
    await updateDoc(doc(db, 'students', id), updates);
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
};

// Delete operation
const deleteStudent = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'students', id));
  } catch (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
};
```

---

## 📞 Questions to Answer During Day 1

1. Do subscriptions stay active when navigating between pages?
   - **Yes** - They're in App.tsx level hook, stay mounted

2. How to handle pagination with subscriptions?
   - **Keep existing fetchMoreStudents** logic, just wrap in subscription

3. What about search functionality?
   - **Keep client-side search** on subscribed data arrays

4. Performance impact of 16 active subscriptions?
   - **Measure** - Firestore SDK optimizes, but track bundle size

---

## 🎯 Ready to Start?

Run these commands to begin:

```powershell
# Verify you're on the right branch
git branch

# Should show: * refactor/firestore-subscriptions

# Open the hook file to edit
code hooks\useFirestoreData.ts

# Keep tracker open in browser
start OPTION_C_REFACTOR_TRACKER.md
```

**Let's build this! 🚀**
