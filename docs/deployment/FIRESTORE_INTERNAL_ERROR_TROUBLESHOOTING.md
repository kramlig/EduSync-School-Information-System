# 🐛 Firestore Internal Assertion Failed - Troubleshooting Guide

## Error Overview

```
FIRESTORE (12.4.0) INTERNAL ASSERTION FAILED: Unexpected state (ID: ca9) / (ID: b815)
```

**Critical**: This is **NOT** a security rules error. This is a known **Firebase SDK bug** related to watch stream state management.

---

## ⚡ Quick Fix (Recommended)

### Step 1: Clear All Caches

```powershell
# Stop dev server (Ctrl+C)

# Clear Firebase cache
Remove-Item -Recurse -Force .\.firebase

# Clear browser cache
# 1. Open Chrome DevTools (F12)
# 2. Application tab > Storage > Clear storage
# 3. Check "IndexedDB" and click "Clear site data"

# Restart emulator and dev server
npm run dev:emu
```

### Step 2: Test with Production Firebase

The emulator has known bugs with watch streams. Test with production:

```powershell
# Switch to production config
node scripts/switch-env.cjs prod

# Deploy security rules
firebase deploy --only firestore:rules --project edusync-sis

# Run dev server
npm run dev
```

---

## 🔍 Root Cause Analysis

### What's Happening?

The Firebase Firestore SDK has an internal state machine that manages watch streams (real-time listeners). When multiple listeners are active simultaneously and connection interruptions occur, the state machine can enter an invalid state.

### Known Triggers:

1. **Emulator instability** - The Firebase emulator is less stable than production
2. **Multiple simultaneous listeners** - `useSchoolData` subscribes to 16+ collections
3. **Rapid reconnections** - Browser refresh or tab switching
4. **IndexedDB corruption** - Cached persistence data becomes stale

### Why It's Not Security Rules:

- Security rule errors show as `permission-denied` (code: `PERMISSION_DENIED`)
- This error shows as `INTERNAL ASSERTION FAILED` (internal SDK bug)
- Error occurs BEFORE security rules are even evaluated
- Error is in `watch_change.ts` (SDK internals), not rule evaluation

---

## 🛠️ Solution Options

### Option 1: Use Production Firebase (Recommended for Testing)

**Why**: Production Firebase is much more stable than emulator.

```bash
# 1. Deploy security rules
firebase deploy --only firestore:rules --project edusync-sis

# 2. Assign custom claims to test users
node scripts/setup-custom-claims.cjs set admin@test.com admin

# 3. Test in production
npm run dev
```

**Pros**: 
- No SDK bugs
- Real security rules testing
- Stable watch streams

**Cons**: 
- Uses production data
- Slower than emulator

---

### Option 2: Implement Error Recovery (Already Done)

We've created `src/utils/firestoreErrorHandler.ts` that:

1. **Detects internal errors** - Distinguishes SDK bugs from real errors
2. **Auto-retries failed queries** - Handles transient failures
3. **Logs appropriately** - Warns about SDK issues without throwing

**Usage in hooks**:

```typescript
import { handleFirestoreQueryError } from '../utils/firestoreErrorHandler';

// In your Firestore query error handler
const unsubscribe = onSnapshot(
  query,
  (snapshot) => { /* success */ },
  (error) => {
    const { shouldRetry, errorMessage } = handleFirestoreQueryError('students', error);
    
    if (shouldRetry) {
      console.warn('Retrying query...');
      // Retry logic here
    } else {
      console.error(errorMessage);
    }
  }
);
```

---

### Option 3: Reduce Simultaneous Listeners

**Problem**: `useSchoolData` subscribes to 16 collections simultaneously.

**Solution**: Lazy-load collections only when needed.

```typescript
// Instead of loading everything upfront:
const { students, teachers, grades, ... } = useSchoolData([...all collections]);

// Load on demand:
const { students } = useSchoolData(['students']); // Only when needed
const { grades } = useSchoolData(['grades']);      // Only in gradebook
```

**Implementation**:
- Dashboard: Load only summary data
- Student view: Load only students
- Gradebook: Load only grades + students
- Settings: Load only settings

---

### Option 4: Update Firebase SDK

Check if newer SDK version fixes the issue:

```bash
npm update firebase
```

**Current**: `firebase@10.x` (check package.json)
**Latest**: May have fixes for internal assertion errors

---

## 🧪 Testing Security Rules (The Real Test)

The comprehensive testing script is at: `scripts/test-security-rules.ts`

### Run the test:

```powershell
# 1. Start emulator with seeded data
npm run dev:emu

# 2. In a new terminal, run tests
npx ts-node scripts/test-security-rules.ts
```

### What it tests:

1. ✅ Admin can read/write everything
2. ✅ Teachers can read but not delete students
3. ✅ Parents can only see their own children
4. ✅ Unauthenticated users are blocked
5. ✅ Role-based write permissions work

**Expected output**:
```
🧪 Starting Comprehensive Security Rules Testing...

🔑 Testing Admin Access...
✅ Admin can read students
✅ Admin can read teachers
✅ Admin can read grades
...

📊 Test Results Summary
═══════════════════════════════════════════════════════════
Total Tests: 15
Passed: 15 ✅
Failed: 0 ❌
Success Rate: 100.0%

🎉 All security tests passed! Rules are working correctly.
```

---

## 📊 Verification Checklist

After applying fixes, verify:

- [ ] No more `INTERNAL ASSERTION FAILED` errors in console
- [ ] Admin can access all collections
- [ ] Teacher can read but not delete students
- [ ] Parent can only see own children
- [ ] Unauthenticated users are blocked
- [ ] Data loads correctly in dashboard
- [ ] Grades can be entered by teachers
- [ ] Settings are read-only for non-admins

---

## 🚨 When to Escalate

If after trying all solutions:

1. ✅ Caches cleared
2. ✅ Production Firebase tested
3. ✅ SDK updated
4. ✅ Still getting errors

Then it's a Firebase SDK bug - file an issue at:
https://github.com/firebase/firebase-js-sdk/issues

**Include**:
- SDK version (`firebase@12.4.0`)
- Error ID (`ca9`, `b815`)
- Reproduction steps
- Number of simultaneous listeners

---

## 💡 Prevention Tips

1. **Use production for UAT** - Don't rely on emulator for final testing
2. **Lazy-load collections** - Don't subscribe to everything upfront
3. **Clear caches regularly** - Prevent IndexedDB corruption
4. **Test security rules separately** - Use `scripts/test-security-rules.ts`
5. **Monitor console** - Watch for permission-denied vs internal errors

---

## 📚 References

- [Firebase SDK Known Issues](https://github.com/firebase/firebase-js-sdk/issues?q=is%3Aissue+INTERNAL+ASSERTION+FAILED)
- [Firestore Security Rules Docs](https://firebase.google.com/docs/firestore/security/get-started)
- [EduSync Security Implementation](./SECURITY_RULES_IMPLEMENTATION_SUMMARY.md)
- [Transition Mode Guide](./TRANSITION_MODE_GUIDE.md)

---

**Last Updated**: November 6, 2025  
**Status**: Solutions implemented, ready for testing
