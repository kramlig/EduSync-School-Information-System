# Quick Diagnosis & Fix Script

## 🔍 STEP 1: Check the Debug Logs

Visit https://edusync-sis.web.app and open the console (F12).

Look for these patterns:

### Pattern A: App is UNMOUNTING/REMOUNTING (SEVERE)
```
[App] MOUNTED - mount #1
[useSchoolData] mounted
[App] UNMOUNTED - mount #1
[App] MOUNTED - mount #2      ← BAD!
[useSchoolData] mounted
```
**If you see this:** The entire App component is being destroyed and recreated. This is BAD.
→ Go to STEP 2A

### Pattern B: App is just RE-RENDERING (FIXABLE)
```
[App] MOUNTED - mount #1
[App] render #1
[App] render #2
[App] render #3
[App] render #4      ← This is normal, but if it goes to 100+, it's bad
```
**If you see this:** Component stays mounted but re-renders too much. This is GOOD - easy to fix.
→ Go to STEP 2B

### Pattern C: useSchoolData is initializing multiple times
```
[useSchoolData] mounted {VITE_USE_FIREBASE_EMULATOR: 'false', ...}
[useSchoolData] mounted {VITE_USE_FIREBASE_EMULATOR: 'false', ...}
```
**If you see this:** Hook is being called multiple times per mount.
→ Go to STEP 2C

---

## 🔧 STEP 2A: Fix Unmounting Issue (SEVERE)

This means something is destroying the App component. Check:

1. **Is React StrictMode causing double-mounting?**
   - Open `index.tsx`
   - Remove `<React.StrictMode>` wrapper
   - Rebuild and deploy

2. **Is there a router issue?**
   - Check if navigation is causing App to unmount
   - Look for any `window.location.reload()` calls

3. **Nuclear option: Disable real-time listeners**
   ```typescript
   // In hooks/useSchoolData.ts, find these lines and comment them out:
   // const stopGrades = subscribeCollection<Grade>(...);  // TEMP DISABLED
   // const stopSag = subscribeCollection<StudentAssignmentGrade>(...);  // TEMP DISABLED
   // const unsub = onSnapshot(announcementsCol, ...);  // TEMP DISABLED
   ```

---

## 🔧 STEP 2B: Fix Excessive Re-renders (PREFERRED)

This is the most likely issue. The fix is to memoize schoolData.

### Quick Copy-Paste Fix:

In `App.tsx`, find this line:
```typescript
const schoolData = useSchoolData();
```

Replace with:
```typescript
const schoolDataRaw = useSchoolData();
const schoolData = useMemo(() => schoolDataRaw, [
  schoolDataRaw.loading,
  schoolDataRaw.error,
  schoolDataRaw.students.length,
  schoolDataRaw.teachers.length,
  schoolDataRaw.parents.length,
  schoolDataRaw.sections.length,
  schoolDataRaw.grades.length,
  schoolDataRaw.learningAreas.length,
  schoolDataRaw.classSchedules.length,
  schoolDataRaw.attendanceRecords.length,
  schoolDataRaw.assignments.length,
  schoolDataRaw.studentAssignmentGrades.length,
  schoolDataRaw.announcements.length,
  schoolDataRaw.coreValues.length,
  schoolDataRaw.coreValueGrades.length,
  schoolDataRaw.lessonPlans.length,
  schoolDataRaw.substituteAssignments.length,
  schoolDataRaw.settings.schoolName,
  schoolDataRaw.settings.schoolYear,
  schoolDataRaw.settings.currentQuarter,
]);
```

Make sure `useMemo` is imported:
```typescript
import React, { useState, useEffect, useRef, useMemo } from 'react';
```

Then:
```bash
npm run build
firebase deploy --only hosting
git add -A
git commit -m "fix: memoize schoolData to prevent excessive re-renders"
git push
```

---

## 🔧 STEP 2C: Fix Hook Multiple Initialization

If useSchoolData is being called multiple times per mount, add this guard:

In `hooks/useSchoolData.ts`, add at the very top of the function:
```typescript
export function useSchoolData(): SchoolDataState & { /* ... */ } {
  const initialized = useRef(false);
  
  if (initialized.current) {
    console.warn('[useSchoolData] Already initialized, skipping re-init');
  }
  
  useEffect(() => {
    initialized.current = true;
  }, []);
  
  // ... rest of code
}
```

---

## 🎯 STEP 3: Verify the Fix

After deploying, check console again:

✅ **Success indicators:**
- `[App] MOUNTED` appears ONCE
- `[App] render` appears < 10 times in first 5 seconds
- `[useSchoolData] mounted` appears ONCE
- Network tab shows < 5 requests per second
- No more spam!

❌ **Still broken indicators:**
- Logs still spamming
- Network tab shows 100+ requests
- Browser is laggy

If still broken → Tell me which pattern (A, B, or C) you saw in STEP 1.

---

## 📊 Performance Expectations

**Good Performance:**
- Initial load: ~2-5 seconds
- Renders after mount: < 10 in first minute
- Firestore requests: 10-20 on load, then 1-2 per minute
- CPU usage: Low
- Smooth scrolling

**Bad Performance (needs more fixes):**
- Initial load: > 10 seconds
- Renders: 100+ in first minute
- Firestore requests: 100+ per minute
- CPU usage: High
- Laggy interface

---

## 🚨 Emergency Rollback

If everything breaks, revert to last working version:

```bash
git log --oneline | head -20  # Find last good commit
git revert HEAD~3..HEAD  # Revert last 3 commits
npm run build
firebase deploy --only hosting
git push
```

---

## 📝 When You Wake Up

Just tell me:
1. What pattern you saw (A, B, or C)
2. Copy-paste a few lines of the console output
3. Screenshot of Network tab if possible

I'll know exactly what to do next! 💪

Good night and rest well! 🌙
