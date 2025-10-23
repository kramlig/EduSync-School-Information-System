# Tier 1B Offline Support - Testing Guide

**Branch:** `perf/login-optimization`  
**Phase:** Phase 3 - Comprehensive Testing  
**Date:** December 2024  
**Dev Server:** http://localhost:5174/

## Testing Overview

This guide covers 13 test cases across 4 categories:
1. **Offline Login Flow** (4 tests)
2. **CRUD Operations Offline** (4 tests)
3. **UI/UX Verification** (4 tests)
4. **Regression Testing** (1 test)

---

## Prerequisites

### Tools Needed
- Chrome/Edge DevTools (for offline simulation)
- Browser localStorage inspector
- Console for error checking

### Test Users
Use existing test accounts:
- **Teacher:** (use your test teacher email/password)
- **Admin:** (use your test admin email/password)
- **Student:** (use your test student email/password)

### Setup
1. ✅ Dev server running on port 5174
2. ✅ Build successful (Phase 2 complete)
3. Open browser: http://localhost:5174/
4. Open DevTools (F12)

---

## Category 1: Offline Login Flow

### Test 1.1: Returning User Offline Login ✅/❌

**Goal:** Verify cached credentials work offline

**Steps:**
1. Navigate to http://localhost:5174/
2. Login as teacher (while online)
3. Verify dashboard loads
4. Click "Logout"
5. Open DevTools → Network tab → Check "Offline"
6. Enter same credentials and login

**Expected Results:**
- ✅ Login successful using cached data
- ✅ Orange "You're offline" banner appears at top
- ✅ Dashboard loads with cached data
- ✅ No Firestore queries attempted (check Network tab)

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

**Screenshot:** (attach if failed)

---

### Test 1.2: First-Login Error Message ✅/❌

**Goal:** Verify helpful error for first-time offline login

**Steps:**
1. Clear localStorage:
   - DevTools → Application → Local Storage → localhost:5174
   - Delete `edusync_cached_user` key
2. Stay offline (Network tab → Offline checked)
3. Try to login as any user

**Expected Results:**
- ✅ Error message appears:
  > ⚠️ First login requires internet connection. Please connect to WiFi to set up your account. After first login, you can work offline anytime.
- ✅ Login form remains visible
- ✅ No crash or undefined errors

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

### Test 1.3: Cache Expiry (7 days) ✅/❌

**Goal:** Verify cache expires after 7 days

**Steps:**
1. Go online → Login as teacher → Logout
2. DevTools → Application → Local Storage → localhost:5174
3. Find `edusync_cached_user` key
4. Edit JSON: Change `cachedAt` to 8 days ago:
   ```js
   const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
   // Set cachedAt to this value
   ```
5. Go offline → Try to login with same credentials

**Expected Results:**
- ✅ Error message: "Cached login expired. Please connect to internet."
- ✅ Login blocked
- ✅ No crash

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

### Test 1.4: Wrong Cached User ✅/❌

**Goal:** Verify security - can't use cached user A to login as user B

**Steps:**
1. Go online → Login as Teacher A → Logout
2. Go offline
3. Try to login as Teacher B (different email)

**Expected Results:**
- ✅ Error message: "Cannot login offline. Credentials don't match cached user."
- ✅ Login blocked
- ✅ No security bypass

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

## Category 2: CRUD Operations Offline

### Test 2.1: Create Record Offline ✅/❌

**Goal:** Verify new records queue for sync

**Steps:**
1. Login as teacher (online)
2. Go offline (DevTools → Network → Offline)
3. Navigate to Grades or Attendance
4. Create a new record (e.g., add a grade)
5. Observe header sync badge
6. Go back online

**Expected Results:**
- ✅ Record created locally
- ✅ Sync badge shows "Syncing (1)" with spinner (orange pill)
- ✅ OfflineBanner shows pending writes count
- ✅ When online: Badge changes to "All changes saved ✓" (green)
- ✅ Record persists after refresh

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

**Pending Count Observed:** ___

---

### Test 2.2: Update Record Offline ✅/❌

**Goal:** Verify updates queue for sync

**Steps:**
1. Login as teacher (online)
2. Create a grade/attendance record
3. Go offline
4. Edit the record (change value)
5. Observe sync status
6. Go back online

**Expected Results:**
- ✅ Update saved locally
- ✅ Sync badge shows pending
- ✅ When online: Record syncs to Firestore
- ✅ Changes visible after refresh

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

### Test 2.3: Delete Record Offline ✅/❌

**Goal:** Verify deletes queue for sync

**Steps:**
1. Login as teacher (online)
2. Create a test record
3. Go offline
4. Delete the record
5. Observe sync status
6. Go back online

**Expected Results:**
- ✅ Delete queued locally
- ✅ Sync badge shows pending
- ✅ When online: Record deleted from Firestore
- ✅ Record gone after refresh

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

### Test 2.4: Multiple Offline Operations ✅/❌

**Goal:** Verify multiple operations queue correctly

**Steps:**
1. Login as teacher (online)
2. Go offline
3. Perform these actions:
   - Create 2 new grades
   - Update 1 existing grade
   - Delete 1 grade
4. Observe sync badge count (should be 4)
5. Go back online
6. Verify all sync

**Expected Results:**
- ✅ Sync badge shows "Syncing (4)"
- ✅ All 4 operations queued
- ✅ When online: All sync correctly
- ✅ Final state matches expectations after refresh

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

**Pending Count Observed:** ___

---

## Category 3: UI/UX Verification

### Test 3.1: Sync Badge - Desktop ✅/❌

**Goal:** Verify sync badge displays correctly on desktop

**Steps:**
1. Desktop browser (width > 1024px)
2. Login as teacher
3. Go offline → Create record
4. Locate sync badge in header (before Logout button)

**Expected Results:**
- ✅ Badge visible to left of "Logout" button
- ✅ Orange pill with spinner when syncing
- ✅ Text: "Syncing (N)"
- ✅ Smooth animation
- ✅ Dark mode: Correct colors (orange-900/30 bg)

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

**Screenshot:** (attach)

---

### Test 3.2: Sync Badge - Mobile ✅/❌

**Goal:** Verify sync badge in mobile menu

**Steps:**
1. Resize browser to mobile (width < 1024px)
2. Login as teacher
3. Go offline → Create record
4. Open mobile menu (hamburger icon)
5. Check sync status indicator

**Expected Results:**
- ✅ Full-width sync indicator in menu
- ✅ Same states as desktop (syncing vs saved)
- ✅ Text: "Syncing N changes..."
- ✅ Readable on mobile screen
- ✅ Dark mode works

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

**Screenshot:** (attach)

---

### Test 3.3: OfflineBanner States ✅/❌

**Goal:** Verify banner shows correct states

**Steps:**
1. Login as teacher (online)
2. Go offline → Observe banner
3. Create record → Observe pending count
4. Go online → Observe banner change

**Expected Results:**

**Offline State:**
- ✅ Orange banner at top
- ✅ WiFi slash icon
- ✅ Text: "You're offline. Changes will sync when back online."
- ✅ Banner auto-hides after 5 seconds

**Online State (after being offline):**
- ✅ Green banner at top
- ✅ WiFi icon
- ✅ Text: "Back online. Syncing N changes..."
- ✅ Shows correct pending count
- ✅ Banner auto-hides after 5 seconds

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

### Test 3.4: Dark Mode Compatibility ✅/❌

**Goal:** Verify all offline components work in dark mode

**Steps:**
1. Login as teacher
2. Toggle dark mode (if available in settings)
3. Go offline → Create record
4. Check all offline UI elements

**Expected Results:**
- ✅ OfflineBanner: Dark background (slate-800), readable text
- ✅ Sync badge: Dark backgrounds (orange-900/30, green-900/30)
- ✅ Login error messages: Readable in dark mode
- ✅ No contrast issues
- ✅ Icons visible

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

**Screenshot:** (attach)

---

## Category 4: Regression Testing

### Test 4.1: No Breaking Changes ✅/❌

**Goal:** Verify normal online workflow still works

**Steps:**
1. **Stay online throughout**
2. Login as teacher
3. Navigate to all major views:
   - Dashboard
   - Gradebook
   - Attendance
   - Announcements
   - Settings
4. Perform CRUD operations:
   - Create grade
   - Update grade
   - Delete grade
5. Logout
6. Login as different user (student/admin)
7. Navigate and interact

**Expected Results:**
- ✅ All views load correctly
- ✅ All CRUD operations work immediately
- ✅ No unexpected sync badges (should show "All saved")
- ✅ No offline banners
- ✅ Performance feels normal (no slowdown)
- ✅ No console errors
- ✅ Logout works correctly
- ✅ Multiple user types work

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

**Console Errors:** (list any)

---

## Testing Checklist Summary

**Offline Login Flow:**
- [ ] Test 1.1: Returning user offline
- [ ] Test 1.2: First-login error
- [ ] Test 1.3: Cache expiry
- [ ] Test 1.4: Wrong cached user

**CRUD Operations:**
- [ ] Test 2.1: Create offline
- [ ] Test 2.2: Update offline
- [ ] Test 2.3: Delete offline
- [ ] Test 2.4: Multiple operations

**UI/UX:**
- [ ] Test 3.1: Desktop sync badge
- [ ] Test 3.2: Mobile sync badge
- [ ] Test 3.3: OfflineBanner states
- [ ] Test 3.4: Dark mode

**Regression:**
- [ ] Test 4.1: No breaking changes

---

## Known Issues / Notes

(Document any issues found during testing)

---

## Testing Results

**Date Tested:** _______________  
**Tested By:** _______________  
**Browser:** _______________  
**Pass Rate:** ___/13 tests

**Ready for Deployment?** ☐ Yes  ☐ No (document blockers)

---

## Next Steps After Testing

If all tests pass:
1. Update TIER_1B_OFFLINE_SUPPORT_TRACKER.md (mark Phase 3 complete)
2. Update PERFORMANCE_OPTIMIZATION_TRACKER.md
3. Get user approval
4. Merge to main: `git checkout main && git merge perf/login-optimization`
5. Deploy to production

If issues found:
1. Document in "Known Issues" section
2. Create fix commits
3. Re-run affected tests
4. Iterate until all pass
