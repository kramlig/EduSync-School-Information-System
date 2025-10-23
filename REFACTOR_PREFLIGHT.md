# Option C Refactor - Pre-Flight Verification

**Date:** October 23, 2025  
**Branch:** `refactor/firestore-subscriptions`  
**Status:** ✅ READY TO BEGIN

---

## ✅ Pre-Flight Checklist

### Git Setup
- ✅ Branch created: `refactor/firestore-subscriptions`
- ✅ Currently checked out on correct branch
- ✅ Working tree clean (no uncommitted changes)
- ✅ Base branch saved: `perf/login-optimization`

### Backups Created
- ✅ `hooks/useSchoolData.REACT_QUERY_BACKUP.ts` - React Query implementation
- ✅ Git history preserved with commit: `49621d7`

### Documentation
- ✅ `OPTION_C_REFACTOR_TRACKER.md` - Full 3-4 day implementation plan
- ✅ `REFACTOR_QUICK_START.md` - Day 1 quick reference
- ✅ This file - Pre-flight verification

### Current State Verification
Let's verify the current architecture before we start:

```powershell
# Check current imports
Select-String -Path "App.tsx" -Pattern "@tanstack/react-query"
# Expected: Should find imports (will remove Day 2)

# Check hook location
Test-Path "hooks\useSchoolData.ts"
# Expected: True

# Check backup exists
Test-Path "hooks\useSchoolData.REACT_QUERY_BACKUP.ts"
# Expected: True

# Verify build works NOW (before changes)
npm run build
# Expected: Success
```

---

## 📊 Baseline Metrics (React Query)

Record these BEFORE starting refactor:

### Build Metrics
```powershell
npm run build
```

**Capture:**
- ✅ Build time: ??? seconds
- ✅ Bundle size: ??? KB
- ✅ Number of chunks: ???
- ✅ Any warnings: ???

### Test Metrics
```powershell
npx playwright test tests/offline-audit.spec.ts
```

**Current Status:**
- ✅ Tests passing: 14/14 ✅
- ✅ Test runtime: ??? seconds

```powershell
npx playwright test tests/offline-first-visit.spec.ts
```

**Current Status:**
- ❌ Test 1 (offline-first): FAILS - Blank page
- ✅ Test 2 (visit online first): PASSES

### Package.json Dependencies
```json
{
  "@tanstack/react-query": "^5.x.x" // Current version
}
```

---

## 🎯 Target Metrics (After Refactor)

### Build Metrics (Target)
- ⏱️ Build time: ≤ React Query time (acceptable)
- 📦 Bundle size: < React Query (should be smaller without RQ)
- ✅ All builds: Success
- ⚠️ Warnings: ≤ current warnings

### Test Metrics (Target)
- ✅ offline-audit.spec.ts: 14/14 passing (maintain)
- ✅ offline-first-visit.spec.ts: 2/2 passing (FIX Test 1)
- ⏱️ Test runtime: Similar or faster

### Code Quality (Target)
- 📉 Lines of code: Less than React Query version
- 🎯 Complexity: Simpler (no RQ abstractions)
- 📝 Maintainability: Higher (direct Firestore)

---

## 🔍 Known Issues to Fix

### Critical (Must Fix)
1. **Blank Page on Offline First Visit**
   - Test: `tests/offline-first-visit.spec.ts` - Test 1
   - Current: Returns empty array, component crashes
   - Target: Component renders even with empty cache

### Important (Should Fix)
2. **Infinite Loading State**
   - Current: `retry: 0` prevents but doesn't solve root cause
   - Target: No loading state issues

3. **Component Rendering Failure**
   - Current: Even basic page structure doesn't render
   - Target: Always render UI, show empty states gracefully

---

## 📁 Files to Create (Day 1)

### New Files
- [ ] `hooks/useFirestoreData.ts` - New Firestore subscription hook

### Files to Modify (Day 2)
- [ ] `App.tsx` - Switch to new hook, remove React Query
- [ ] `hooks/useSchoolData.ts` - Delete and replace with useFirestoreData.ts

### Files to Delete (Day 2)
- [ ] Old `hooks/useSchoolData.ts` (after renaming useFirestoreData.ts)

---

## 🧪 Testing Strategy

### Phase 1: Unit Testing (Day 1-2)
```typescript
// Test hook directly
import { renderHook } from '@testing-library/react';
import { useFirestoreData } from './hooks/useFirestoreData';

test('Hook returns correct interface', () => {
  const { result } = renderHook(() => useFirestoreData());
  expect(result.current).toHaveProperty('students');
  expect(result.current).toHaveProperty('teachers');
  // ... verify all properties
});
```

### Phase 2: Integration Testing (Day 2-3)
```powershell
# Full app build
npm run build

# Check for TypeScript errors
# Check for console errors in browser
# Verify all pages load
```

### Phase 3: E2E Testing (Day 3-4)
```powershell
# Run all Playwright tests
npx playwright test

# Focus on offline scenarios
npx playwright test tests/offline-first-visit.spec.ts
npx playwright test tests/offline-audit.spec.ts
```

---

## 🚨 Stop Conditions

### When to STOP and Rollback

If any of these occur, STOP and reassess:

1. **Critical Functionality Broken**
   - App won't compile after 2 hours of debugging
   - More than 5 tests fail consistently
   - Data loss or corruption observed

2. **Performance Significantly Worse**
   - Load time > 2x React Query
   - Bundle size > 50% larger
   - Memory leaks detected

3. **Unforeseen Technical Blockers**
   - Firestore SDK incompatibility
   - TypeScript typing issues unsolvable
   - Service Worker conflicts with existing code

**Rollback Command:**
```powershell
git checkout perf/login-optimization
Copy-Item "hooks\useSchoolData.REACT_QUERY_BACKUP.ts" -Destination "hooks\useSchoolData.ts" -Force
npm install
npm run build
```

---

## 📞 Support Resources

### Documentation
- [Firestore onSnapshot Docs](https://firebase.google.com/docs/firestore/query-data/listen)
- [React Hook Best Practices](https://react.dev/reference/react/hooks)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

### Internal Docs
- `OPTION_C_REFACTOR_TRACKER.md` - Full plan
- `REFACTOR_QUICK_START.md` - Day 1 guide
- `hooks/useSchoolData.REACT_QUERY_BACKUP.ts` - Reference implementation

### Debugging Tips
```typescript
// Add verbose logging in new hook
console.log('[useFirestoreData] Mounting...');
console.log('[useFirestoreData] Students:', students.length);
console.log('[useFirestoreData] From cache:', snapshot.metadata.fromCache);

// Check Firestore persistence status
enableIndexedDbPersistence(db)
  .then(() => console.log('✅ Firestore persistence enabled'))
  .catch((err) => console.error('❌ Persistence failed:', err));
```

---

## ✅ Final Pre-Flight Check

Before starting Day 1 implementation:

- [ ] Read `OPTION_C_REFACTOR_TRACKER.md` (full plan)
- [ ] Read `REFACTOR_QUICK_START.md` (quick reference)
- [ ] Verified `git branch` shows `refactor/firestore-subscriptions`
- [ ] Verified `npm run build` succeeds (baseline)
- [ ] Verified tests run (baseline metrics)
- [ ] Backup file exists and is readable
- [ ] Rollback procedure understood
- [ ] Coffee ready ☕

---

## 🚀 Ready to Start!

**Next Command:**
```powershell
# Create the new hook file
New-Item -Path "hooks\useFirestoreData.ts" -ItemType File
code hooks\useFirestoreData.ts
```

**First Commit Target:**
```
feat: Create initial useFirestoreData hook structure

- Add basic hook scaffold
- Implement students subscription
- Implement teachers subscription
- Add loading/error state management
- Add cleanup on unmount

Status: 2/16 collections implemented
Next: Add remaining 14 collections
```

---

**Good luck! Let's fix that blank page issue! 🎯**
