# Infinite Loop Fix Plan

## Problem Analysis
The `[useSchoolData] mounted` log is spamming infinitely, indicating either:
1. **App component is unmounting/remounting** (severe)
2. **App is re-rendering excessively** (manageable)

## Debug Deployment
Deployed version with detailed logging:
- `[App] MOUNTED` - fires once when component mounts
- `[App] UNMOUNTED` - fires when component unmounts
- `[App] render #X` - fires on every render
- `[useSchoolData] mounted` - fires when hook initializes

## Root Causes Identified

### 1. Real-time Listener Updates
- `subscribeCollection` for grades/SAG triggers `setState`
- Every setState creates new object reference: `return { ...state, ... }`
- New object passed as `schoolData` prop to all route components
- Causes excessive re-renders

### 2. Parent Selection Effect (FIXED)
- Was triggering on every `students` array update
- Now only triggers on student count change or session type change

### 3. Potential Issues
- BroadcastChannel listeners may be firing too frequently
- onSnapshot for announcements updating rapidly
- No throttling/debouncing on real-time updates

## Solution Options

### Option A: Throttle Real-time Updates (Quick Fix)
**Pros:** Immediate stabilization, minimal code changes
**Cons:** Slight delay in real-time sync (acceptable for 1-2 sec delay)

```typescript
// In useSchoolData.ts, throttle setState calls
const throttledSetState = useRef<NodeJS.Timeout | null>(null);
const pendingUpdates = useRef<Partial<SchoolDataState>>({});

const throttleStateUpdate = (updates: Partial<SchoolDataState>) => {
  pendingUpdates.current = { ...pendingUpdates.current, ...updates };
  
  if (!throttledSetState.current) {
    throttledSetState.current = setTimeout(() => {
      setState(prev => ({ ...prev, ...pendingUpdates.current }));
      pendingUpdates.current = {};
      throttledSetState.current = null;
    }, 1000); // 1 second throttle
  }
};
```

### Option B: Memoize SchoolData Object (Best Practice)
**Pros:** Proper React optimization, prevents unnecessary re-renders
**Cons:** More complex, requires careful dependency management

```typescript
// In App.tsx
const schoolDataRaw = useSchoolData();
const schoolData = useMemo(() => schoolDataRaw, [
  schoolDataRaw.students.length,
  schoolDataRaw.teachers.length,
  schoolDataRaw.grades.length,
  // ... only re-create when counts change
]);
```

### Option C: Disable Real-time Sync (Emergency)
**Pros:** Immediate stop of infinite loop
**Cons:** Loses real-time features, requires manual refresh

```typescript
// In useSchoolData.ts, comment out subscribeCollection calls
// subscribeCollection<Grade>(...)  // DISABLED
// subscribeCollection<StudentAssignmentGrade>(...)  // DISABLED
// onSnapshot(announcementsCol, ...)  // DISABLED
```

### Option D: Add Rate Limiting to Listeners
**Pros:** Keeps real-time sync but prevents spam
**Cons:** Requires careful implementation

```typescript
const lastUpdate = useRef<Record<string, number>>({});
const MIN_UPDATE_INTERVAL = 500; // ms

const shouldUpdate = (key: string) => {
  const now = Date.now();
  const last = lastUpdate.current[key] || 0;
  if (now - last < MIN_UPDATE_INTERVAL) {
    return false;
  }
  lastUpdate.current[key] = now;
  return true;
};
```

## Recommended Approach

### Phase 1: Emergency Stabilization (NOW)
1. Check debug logs to confirm if App is mounting/rendering
2. If MOUNTING infinitely → Option C (disable real-time)
3. If RENDERING infinitely → Option A (throttle updates)

### Phase 2: Proper Fix (After Debug)
1. Implement Option D (rate limiting on listeners)
2. Add Option B (memoization) for additional optimization
3. Test thoroughly with 7K+ records

### Phase 3: Long-term Optimization
1. Implement proper pagination (revisit after stability)
2. Add IndexedDB caching improvements
3. Consider virtual scrolling for large lists

## Next Steps for User

When you wake up, check the console:

**If you see:**
```
[App] MOUNTED - mount #1
[App] MOUNTED - mount #2  // ← BAD!
[App] UNMOUNTED - mount #1
[useSchoolData] mounted
```
→ **Severe issue**: App is unmounting. Tell me immediately.

**If you see:**
```
[App] MOUNTED - mount #1
[App] render #1
[App] render #2
[App] render #3
[App] render #4  // ← MANAGEABLE
[useSchoolData] mounted
```
→ **Expected issue**: Just excessive renders. Easy to fix with memoization.

**If you see:**
```
[useSchoolData] mounted {VITE_USE_FIREBASE_EMULATOR: 'false', ...}
[useSchoolData] mounted {VITE_USE_FIREBASE_EMULATOR: 'false', ...}
[useSchoolData] mounted {VITE_USE_FIREBASE_EMULATOR: 'false', ...}
```
→ Hook is initializing multiple times. Might be StrictMode or something else.

## Files to Check
- `/App.tsx` - Main component with state management
- `/hooks/useSchoolData.ts` - Data hook with real-time listeners
- `/index.tsx` - Check if StrictMode is enabled
- Network tab - Firestore request frequency

## Commit Message
```
debug: add detailed mount/render logging to diagnose infinite loop
```
