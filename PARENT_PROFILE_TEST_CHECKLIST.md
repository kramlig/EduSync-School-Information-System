# Parent Profile Testing - Pre-Test Checklist

**Test File:** `tests/parent-profile-comprehensive.spec.ts`  
**Feature:** Parent Profile Management  
**Date:** November 4, 2025  
**Branch:** `feature/parent-portal-enhancements`

---

## 🎯 Testing Objective

Verify that parent users can successfully edit their profile information, change passwords, and manage notification preferences with proper validation and persistence.

---

## ⚠️ CRITICAL: Read Before Testing!

**GOLDEN RULE FROM TESTING_STANDARDS.md:**
> 🔴 **NEVER TOUCH THE SERVER TERMINAL!** 🔴
> 
> Once `npm run dev:emu` is running in Terminal 1, NEVER run ANY command in that terminal!
> ALL test commands MUST be run in a SEPARATE Terminal 2!

---

## 📋 PRE-TEST CHECKLIST

### Step 1: Environment Check ✅

**Before running ANY test, verify:**

#### 1.1 Check if Server is Already Running
```powershell
# Open a NEW terminal (Terminal 2)
# DO NOT use the terminal running npm run dev:emu!

# Check if port 5173 is listening
Test-NetConnection -ComputerName localhost -Port 5173 -InformationLevel Quiet

# Expected: True (server is running)
# If False: Server is not running, proceed to Step 1.2
```

#### 1.2 Check for Node Processes
```powershell
# In Terminal 2 (NOT the server terminal!)
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# If you see node processes: Server is already running, skip to Step 2
# If no processes: Safe to start server
```

#### 1.3 Start Development Server (If Not Running)
```powershell
# ONLY IF server is not running!
# Open Terminal 1 (dedicated for server)
npm run dev:emu

# Wait for:
# ✅ Vite dev server started on http://127.0.0.1:5173
# ✅ Firestore emulator on localhost:8086
# ✅ Seeding complete

# ⚠️ LEAVE THIS TERMINAL ALONE! Don't run any more commands here!
```

### Step 2: Verify Test Data ✅

#### 2.1 Check Parent Account Exists
```powershell
# In Terminal 2
node -e "const admin = require('firebase-admin'); process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086'; try { admin.app(); } catch(e) { admin.initializeApp({ projectId: 'edusync-local' }); } admin.firestore().collection('parents').where('email', '==', 'juan.garcia@test.com').get().then(snap => { if (snap.empty) { console.log('❌ Parent not found!'); } else { console.log('✅ Parent found:', snap.docs[0].data().name); } process.exit(0); });"
```

**Expected Output:**
```
✅ Parent found: Juan Garcia
```

#### 2.2 Check Linked Student Exists
```powershell
# In Terminal 2
node -e "const admin = require('firebase-admin'); process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086'; try { admin.app(); } catch(e) { admin.initializeApp({ projectId: 'edusync-local' }); } admin.firestore().collection('students').where('lrn', '==', '123456789001').get().then(snap => { if (snap.empty) { console.log('❌ Student not found!'); } else { console.log('✅ Student found:', snap.docs[0].data().firstName, snap.docs[0].data().lastName); } process.exit(0); });"
```

**Expected Output:**
```
✅ Student found: Juan Garcia
```

### Step 3: Manual Pre-Test Verification ✅

#### 3.1 Login to Application
1. Open browser to http://127.0.0.1:5173
2. Login with:
   - Email: `juan.garcia@test.com`
   - Password: `parent123`
3. Verify dashboard loads with "Parent Dashboard" heading
4. Verify announcements are visible
5. Verify child performance card shows "Juan Garcia"

#### 3.2 Navigate to Profile Page
1. Click "Profile" in sidebar navigation
2. Verify URL is http://127.0.0.1:5173/profile
3. Verify page sections visible:
   - ✅ Personal Information (name, email, phone)
   - ✅ Change Password section
   - ✅ Notification Preferences (5 toggles)
   - ✅ Linked Children sidebar

#### 3.3 Test Edit Button
1. Click "Edit" button
2. Verify inputs become enabled
3. Verify "Save Changes" and "Cancel" buttons appear
4. Click "Cancel" without changing anything
5. Verify form returns to read-only mode

**✅ If all above checks pass, proceed to automated testing**

---

## 🚀 Running the Tests

### Option 1: Run All Tests (Headed Mode - Recommended First)
```powershell
# In Terminal 2 (NOT the server terminal!)
npx playwright test tests/parent-profile-comprehensive.spec.ts --headed
```

### Option 2: Run Specific Test
```powershell
# In Terminal 2
npx playwright test tests/parent-profile-comprehensive.spec.ts --headed -g "TC-PP-004"
```

### Option 3: Debug Mode (Step-by-Step)
```powershell
# In Terminal 2
npx playwright test tests/parent-profile-comprehensive.spec.ts --debug
```

### Option 4: UI Mode (Interactive)
```powershell
# In Terminal 2
npx playwright test tests/parent-profile-comprehensive.spec.ts --ui
```

---

## 📊 Test Cases Covered

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| TC-PP-001 | Profile page loads correctly | P0 | ⏳ |
| TC-PP-002 | Edit button enables form fields | P0 | ⏳ |
| TC-PP-003 | Cancel button reverts changes | P1 | ⏳ |
| TC-PP-004 | Save profile with valid data | P0 | ⏳ |
| TC-PP-005 | Phone number validation | P1 | ⏳ |
| TC-PP-006 | Password change validation | P1 | ⏳ |
| TC-PP-007 | Notification preferences toggle | P1 | ⏳ |
| TC-PP-008 | Linked children display | P2 | ⏳ |
| TC-PP-009 | Console errors check | P0 | ⏳ |
| TC-PP-010 | Keyboard navigation | P2 | ⏳ |

**Priority Levels:**
- **P0:** Critical - Must pass before merge
- **P1:** High - Should pass before merge
- **P2:** Medium - Nice to have

---

## 🔍 Known Issues to Investigate

### Issue #1: Profile Save Failing (USER REPORTED)
**Symptom:** User reports "can't save the info" when editing profile  
**Expected:** Success message + form disabled + values persist  
**Actual:** Unknown - needs investigation  

**Debug Steps:**
1. Run TC-PP-004 in --headed mode
2. Watch for error messages on page
3. Check browser console (F12) for errors
4. Check Network tab for failed Firestore requests
5. Verify `updateParent` function in useSchoolData hook
6. Check Firestore emulator logs

**Potential Causes:**
- [ ] `updateParent` function not working
- [ ] Firestore emulator connection issue
- [ ] Missing parent.id field
- [ ] Phone validation rejecting valid input
- [ ] Button not triggering handleSaveProfile
- [ ] Race condition with async save

---

## 📸 Test Artifacts

Tests will generate screenshots in `test-results/` folder:
- `parent-profile-before-save-{timestamp}.png`
- `parent-profile-after-save-{timestamp}.png`
- `parent-profile-save-error-{timestamp}.png` (if fails)

---

## ✅ Success Criteria

**All tests must:**
- ✅ Pass without flakiness (3 consecutive runs)
- ✅ Complete in under 2 minutes
- ✅ Generate zero console errors
- ✅ Leave test data in clean state

**TC-PP-004 specifically must:**
- ✅ Show success message "Profile updated successfully"
- ✅ Disable form after save
- ✅ Persist values to Firestore (verified by reload)
- ✅ Handle phone validation correctly

---

## 🆘 Troubleshooting

### Test Fails: "Server is not running"
**Solution:**
```powershell
# Terminal 1: Start server
npm run dev:emu

# Wait for "ready in X ms"
# Then in Terminal 2, re-run tests
```

### Test Fails: "Parent not found"
**Solution:**
```powershell
# Terminal 2: Re-seed database
npm run emu:seed:admin
```

### Test Hangs on Login
**Solution:**
- Check Firestore emulator is running (localhost:8086)
- Verify no network errors in browser console
- Try clearing emulator data and re-seeding

### Screenshots Show Wrong Page
**Solution:**
- Increase timeout values in TEST_CONFIG
- Run in --headed mode to watch execution
- Check for navigation race conditions

---

## 📝 Post-Test Checklist

After test completion:
- [ ] Review test results summary
- [ ] Check all screenshots in test-results/
- [ ] Review browser console for errors
- [ ] Update test status in table above
- [ ] Document any new bugs found
- [ ] Update code if issues found
- [ ] Re-run tests to verify fixes
- [ ] Commit test results to documentation

---

## 🎯 Next Steps

1. **Run Tests:** Execute `npx playwright test parent-profile-comprehensive.spec.ts --headed`
2. **Analyze Results:** Review pass/fail status for each test case
3. **Debug Failures:** For TC-PP-004 (the save issue), use screenshots and console logs
4. **Fix Code:** Update ParentProfile.tsx based on findings
5. **Re-test:** Run tests again to verify fixes
6. **Document:** Update this checklist with findings
7. **Proceed:** Move to next feature testing

---

**Remember:** 
- ✅ Use separate terminals for server and tests
- ✅ Run in --headed mode first for debugging
- ✅ Check TESTING_STANDARDS.md for best practices
- ✅ Take breaks if frustrated - debugging at 3am is not productive! 😊

---

**Last Updated:** November 4, 2025  
**Tester:** GitHub Copilot + User  
**Status:** Ready for testing ⏳
