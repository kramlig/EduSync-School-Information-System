# Infinite Loop Prevention Guide

**Last Updated:** November 1, 2025  
**Critical Issue:** This is a RECURRING problem that must be addressed in EVERY new component/module

---

## 🚨 The Problem

Components using `useSchoolData()` hook can cause **infinite render loops** when the `settings` object is passed to functions that trigger re-renders.

### Why This Happens:

1. `useSchoolData(['settings'])` returns a new `settings` object reference on every render
2. Passing this object to functions or hooks that depend on it causes them to re-run
3. This triggers a re-render, which creates a new `settings` object
4. Infinite loop! ♾️

---

## ✅ The Solution: Always Use `useMemo`

### Pattern to Follow:

```typescript
import React, { useMemo } from 'react';
import { useSchoolData } from '../hooks/useSchoolData';
import { useEnrollmentFeatures } from '../services/featureFlags';

const MyComponent: React.FC = () => {
  const { settings, loading } = useSchoolData(['settings']);
  
  // ✅ CORRECT: Memoize derived values
  const enrollmentFeatures = useMemo(
    () => useEnrollmentFeatures(settings), 
    [settings]
  );
  
  // ✅ CORRECT: Memoize computed values
  const isFinancialEnabled = useMemo(
    () => FeatureFlags.isFinancialEnabled(settings),
    [settings]
  );
  
  // ... rest of component
};
```

### ❌ WRONG Pattern (Causes Infinite Loop):

```typescript
const MyComponent: React.FC = () => {
  const { settings, loading } = useSchoolData(['settings']);
  
  // ❌ WRONG: Direct function call creates new object every render
  const enrollmentFeatures = useEnrollmentFeatures(settings);
  
  // ❌ WRONG: Direct method call without memoization
  const isFinancialEnabled = FeatureFlags.isFinancialEnabled(settings);
  
  // This will cause infinite loop!
};
```

---

## 📋 Checklist for New Components/Modules

Before pushing any component that uses `useSchoolData()`, verify:

- [ ] **Import `useMemo`** from React
- [ ] **Wrap feature flag hooks** in `useMemo`
- [ ] **Wrap FeatureFlags method calls** in `useMemo`
- [ ] **Add comment** explaining why memoization is needed
- [ ] **Test in browser** - Check console for infinite loop warnings
- [ ] **Check React DevTools** - Verify component doesn't re-render continuously

---

## 🔍 How to Detect Infinite Loops

### Browser Console Signs:
```
[useSchoolData] 🔄 Subscribing to settings...
[useSchoolData] ✅ Settings loaded
[useSchoolData] 🔄 Subscribing to settings...
[useSchoolData] ✅ Settings loaded
[useSchoolData] 🔄 Subscribing to settings...
(repeats endlessly)
```

### React DevTools Signs:
- Component shows hundreds of renders in the Profiler
- "Highlight updates when components render" shows constant flashing
- Performance tab shows continuous activity even when idle

### Network Tab Signs:
- Firestore connections opening/closing rapidly
- WebSocket connections constantly reconnecting

---

## 📦 Modules That Have Been Fixed

### ✅ Fixed Modules:
1. **EnrollmentPortal** (November 1, 2025)
   - Location: `src/components/enrollment/portal/EnrollmentPortal.tsx`
   - Fixed: Memoized `useEnrollmentFeatures()` and `useFinancialFeatures()`
   - Status: ✅ FIXED with useMemo

2. **DepEd Forms** (Previous fix)
   - Location: `src/components/forms/*`
   - Fixed: Multiple components had this issue

### ✅ Verified Safe Modules (No useSchoolData):
- ✅ **ApplicationForm** - Does not use useSchoolData, no risk
- ✅ **AdminEnrollmentDashboard** - Does not use useSchoolData, no risk
- ✅ **ApplicationReview** - Does not use useSchoolData, no risk
- ✅ **All enrollment step components** - Do not use useSchoolData

### ⚠️ Modules to Check in Future:
- [ ] Any new components using `useSchoolData(['settings'])`
- [ ] Components that receive `settings` as props from parent components

---

## 🛠️ Quick Fix Template

If you discover an infinite loop, use this template:

```typescript
// BEFORE (causes infinite loop):
const MyComponent: React.FC = () => {
  const { settings } = useSchoolData(['settings']);
  const features = useFeatureFlags(settings); // ❌ WRONG
  
  return <div>...</div>;
};

// AFTER (fixed):
import React, { useMemo } from 'react'; // 1. Import useMemo

const MyComponent: React.FC = () => {
  const { settings } = useSchoolData(['settings']);
  
  // 2. Wrap in useMemo with settings dependency
  const features = useMemo(
    () => useFeatureFlags(settings),
    [settings]
  );
  
  return <div>...</div>;
};
```

---

## 🎓 Why This Works

### Without `useMemo`:
```
Render 1: settings = { id: 1, ... } (object reference A)
  → useFeatureFlags(A) returns flags
  → Render triggered because A changed

Render 2: settings = { id: 1, ... } (object reference B - NEW!)
  → useFeatureFlags(B) returns NEW flags
  → Render triggered because B changed

Render 3: settings = { id: 1, ... } (object reference C - NEW!)
  → Infinite loop! ♾️
```

### With `useMemo`:
```
Render 1: settings = { id: 1, ... } (object reference A)
  → useMemo sees A, calculates flags, caches result
  → Returns cached flags

Render 2: settings = { id: 1, ... } (object reference B)
  → useMemo compares B to A, sees same data
  → Returns CACHED flags (no recalculation)
  → No unnecessary render! ✅
```

---

## 📚 Related Issues

### Similar Problems:
1. **useEffect dependencies** - Same solution applies
2. **useCallback dependencies** - Same solution applies
3. **Component props** - May need `React.memo` + `useMemo`

### Example with useEffect:
```typescript
// ❌ WRONG: Infinite loop
useEffect(() => {
  if (settings.enrollmentConfig?.requiresApplication) {
    // Do something
  }
}, [settings]); // settings changes every render!

// ✅ CORRECT: Extract specific value
const requiresApplication = useMemo(
  () => settings.enrollmentConfig?.requiresApplication,
  [settings]
);

useEffect(() => {
  if (requiresApplication) {
    // Do something
  }
}, [requiresApplication]); // Only changes when value actually changes
```

---

## 🚀 Prevention Strategy

### For New Modules:
1. **Start with memoization** - Don't wait for the bug to appear
2. **Add comments** - Explain why memoization is needed
3. **Test immediately** - Check browser console before moving on
4. **Use ESLint** - Consider adding a custom rule to catch this

### Code Review Checklist:
- [ ] Does the component use `useSchoolData()`?
- [ ] Are feature flags or computed values memoized?
- [ ] Are there any direct function calls with `settings` parameter?
- [ ] Does the component re-render appropriately (not too often)?

---

## 🔧 Debugging Tools

### Browser Console Command:
```javascript
// Count how many times a component renders
let renderCount = 0;
console.log(`Render #${++renderCount}`);
```

### React DevTools:
1. Open React DevTools
2. Go to Profiler tab
3. Click "Record"
4. Navigate to the problematic page
5. Stop recording
6. Look for components with >100 renders in 1 second

### Performance Monitor:
```javascript
// Add this to your component
useEffect(() => {
  console.time('Component Lifecycle');
  return () => console.timeEnd('Component Lifecycle');
});
```

---

## 📝 Summary

**Golden Rule:** 
> Whenever you use `useSchoolData(['settings'])` and pass the `settings` object to any function, hook, or computed value, **ALWAYS** wrap it in `useMemo`.

**Quick Reference:**
```typescript
// Template for all new components using settings
import React, { useMemo } from 'react';
import { useSchoolData } from '../hooks/useSchoolData';

const MyComponent: React.FC = () => {
  const { settings, loading } = useSchoolData(['settings']);
  
  // Always memoize!
  const computedValue = useMemo(() => 
    computeFromSettings(settings), 
    [settings]
  );
  
  if (loading) return <Loading />;
  
  return <div>...</div>;
};
```

---

## 🆘 Emergency Fix

If production is broken due to infinite loop:

1. **Identify the component** - Check browser console logs
2. **Add `useMemo`** to all feature flag hooks
3. **Test locally** - Verify loop is fixed
4. **Deploy immediately** - This is a critical bug
5. **Update this document** - Add the module to the "Fixed Modules" list

---

**Remember:** This is a RECURRING issue. Make this document part of your development workflow! 🎯
