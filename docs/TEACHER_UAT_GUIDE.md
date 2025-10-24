# 🧪 Teacher UAT Testing Guide

## 📋 Overview
This guide helps you test the teacher assignment filtering feature to ensure teachers only see students, sections, and subjects they are assigned to teach.

---

## 🔑 Test Account

**Login Credentials:**
- **URL:** https://edusync-sis.web.app
- **Email:** pedro.reyes@edusync.edu
- **Password:** teacher123
- **Expected Role:** Teacher
- **Expected Assignment:** Grade 4 (Math, English, ESP)

---

## ✅ Test Scenarios

### Test 1: Login and Dashboard
**Objective:** Verify teacher can login and sees appropriate dashboard

**Steps:**
1. Go to https://edusync-sis.web.app
2. Enter email: `pedro.reyes@edusync.edu`
3. Enter password: `teacher123`
4. Click "Sign In"

**Expected Results:**
- ✅ Login successful
- ✅ Dashboard loads within 3 seconds
- ✅ Name "Pedro Reyes" appears in header
- ✅ No admin menu items visible (like "Settings" or "Manage Users")

**Status:** [ ] Pass  [ ] Fail

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

### Test 2: Grades & Report - Overview Tab
**Objective:** Verify section filtering and student count accuracy

**Steps:**
1. Click "Grades & Report" in the sidebar
2. Ensure "Overview & Analytics" tab is selected
3. Look at the section dropdown
4. Look at the "Total Students" card

**Expected Results:**
- ✅ Section dropdown shows "All My Sections" as default
- ✅ Dropdown contains ONLY Grade 4 sections (e.g., "Grade 4 - Section A", "Grade 4 - Section B")
- ✅ NO other grade levels visible (no Grade 1, 2, 3, 5, 6, etc.)
- ✅ "Total Students" shows approximately 18-20 students (NOT 100)
- ✅ Class Average is displayed (e.g., "88%")

**Status:** [ ] Pass  [ ] Fail

**Screenshot Location:** `___________________________`

**Notes:**
```
Total Students Count: __________
Sections Visible: _____________________________
_____________________________________________
```

---

### Test 3: Section Dropdown Validation
**Objective:** Verify only assigned sections are visible

**Steps:**
1. On "Overview & Analytics" tab
2. Click the section dropdown
3. Review all options in the dropdown

**Expected Results:**
- ✅ First option is "All My Sections"
- ✅ Only Grade 4 sections listed below
- ✅ No Grade 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, or 12 sections

**Status:** [ ] Pass  [ ] Fail

**Dropdown Contents:**
```
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________
4. _____________________________________________
5. _____________________________________________
```

---

### Test 4: Section Selection Filtering
**Objective:** Verify selecting a section filters data correctly

**Steps:**
1. Note the current "Total Students" count with "All My Sections" selected
2. Click section dropdown
3. Select a specific Grade 4 section (e.g., "Grade 4 - Section A")
4. Note the new "Total Students" count
5. Switch back to "All My Sections"

**Expected Results:**
- ✅ Selecting specific section reduces student count
- ✅ Student count makes sense for one section (~5-10 students)
- ✅ Switching back to "All My Sections" restores original count
- ✅ Class Average updates when changing sections

**Status:** [ ] Pass  [ ] Fail

**Data Recorded:**
```
All My Sections Count: __________
Section A Count: __________
Section B Count: __________
Total Match: [ ] Yes  [ ] No
```

---

### Test 5: Report Cards Tab Filtering
**Objective:** Verify Report Cards tab also filters by teacher assignments

**Steps:**
1. Click "Report Cards" tab
2. Look at section dropdown
3. Check student list

**Expected Results:**
- ✅ Section dropdown shows "All My Sections" as default
- ✅ Only Grade 4 sections in dropdown
- ✅ Student list shows only Grade 4 students
- ✅ Can check/select students for report cards

**Status:** [ ] Pass  [ ] Fail

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

### Test 6: Subject/Learning Area Filtering
**Objective:** Verify teacher only sees assigned subjects

**Steps:**
1. Look at any charts or tables showing subjects
2. Check "Subject Performance" section if visible
3. Look for subject names in analytics

**Expected Results:**
- ✅ Only sees Math, English, and ESP (assigned subjects)
- ✅ Does NOT see Science, Filipino, MAPEH, TLE, etc.
- ✅ Subject performance data is limited to assigned subjects

**Status:** [ ] Pass  [ ] Fail

**Subjects Visible:**
```
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________
4. _____________________________________________
```

---

### Test 7: Search Functionality
**Objective:** Verify search only finds students in assigned sections

**Steps:**
1. In "Overview & Analytics" or "Report Cards" tab
2. Find the search box
3. Search for a common name (e.g., "Maria")
4. Review search results

**Expected Results:**
- ✅ Search returns only Grade 4 students
- ✅ No results from other grade levels
- ✅ Search works within teacher's assigned sections

**Status:** [ ] Pass  [ ] Fail

**Search Term Used:** `_____________________`
**Results Count:** `_____________________`

---

### Test 8: Performance Filters
**Objective:** Verify filtering by performance works correctly

**Steps:**
1. On "Overview & Analytics" tab
2. Find performance filter dropdown
3. Select "Honor Roll (≥90%)"
4. Note student count
5. Select "Needs Improvement (<75%)"
6. Note student count

**Expected Results:**
- ✅ Performance filters work
- ✅ Student counts change appropriately
- ✅ Only Grade 4 students shown in filtered results

**Status:** [ ] Pass  [ ] Fail

**Data:**
```
All Students: __________
Honor Roll: __________
Needs Improvement: __________
```

---

### Test 9: Quarter Filter
**Objective:** Verify quarter selection works correctly

**Steps:**
1. Find quarter dropdown (Q1, Q2, Q3, Q4)
2. Select "Quarter 1"
3. Check if data updates
4. Try other quarters

**Expected Results:**
- ✅ Quarter filter works
- ✅ Data reflects selected quarter
- ✅ Still shows only Grade 4 data

**Status:** [ ] Pass  [ ] Fail

---

### Test 10: Deep Analytics (If Accessible)
**Objective:** Verify Deep Analytics shows teacher-specific data

**Steps:**
1. Click "Deep Analytics" tab (if visible)
2. Check section dropdown
3. Review analytics charts

**Expected Results:**
- ✅ Section dropdown shows "All My Sections"
- ✅ Only Grade 4 sections available
- ✅ Analytics calculated from teacher's students only

**Status:** [ ] Pass  [ ] Fail  [ ] Not Accessible

---

### Test 11: Access Restrictions
**Objective:** Verify teacher cannot access unauthorized areas

**Steps:**
1. Try to access "Students" menu (if visible)
2. Try to access "Teachers" menu
3. Try to access "Sections" menu
4. Check sidebar for admin-only options

**Expected Results:**
- ✅ Cannot access student management (or only sees Grade 4)
- ✅ Cannot access teacher management
- ✅ Cannot access section management
- ✅ No "Settings" or "Admin" menu items

**Status:** [ ] Pass  [ ] Fail

**Unauthorized Access Attempts:**
```
Students Page: [ ] Blocked  [ ] Limited  [ ] Full Access
Teachers Page: [ ] Blocked  [ ] Limited  [ ] Full Access
Sections Page: [ ] Blocked  [ ] Limited  [ ] Full Access
Settings Page: [ ] Blocked  [ ] Limited  [ ] Full Access
```

---

### Test 12: Page Refresh Persistence
**Objective:** Verify filters persist after page reload

**Steps:**
1. On "Grades & Report" → "Overview & Analytics"
2. Note section dropdown says "All My Sections"
3. Note Total Students count
4. Press F5 or refresh browser
5. Wait for page to reload
6. Check section dropdown and student count again

**Expected Results:**
- ✅ Section dropdown still shows "All My Sections"
- ✅ Student count is the same as before refresh
- ✅ Still shows only Grade 4 data

**Status:** [ ] Pass  [ ] Fail

**Before Refresh:** `___________`
**After Refresh:** `___________`

---

### Test 13: Browser Console Check
**Objective:** Verify no JavaScript errors

**Steps:**
1. Press F12 to open browser developer tools
2. Click "Console" tab
3. Refresh page
4. Check for red error messages

**Expected Results:**
- ✅ No red error messages
- ✅ No "500 Internal Server Error"
- ✅ No "Access Denied" errors
- ✅ Application functions normally

**Status:** [ ] Pass  [ ] Fail

**Errors Found:**
```
_____________________________________________
_____________________________________________
```

---

### Test 14: Performance & Loading
**Objective:** Verify acceptable performance

**Steps:**
1. Time how long it takes to load "Grades & Report"
2. Time section dropdown change response
3. Time tab switching

**Expected Results:**
- ✅ Initial load under 5 seconds
- ✅ Section change response under 2 seconds
- ✅ Tab switching under 1 second
- ✅ No "infinite loading" states

**Status:** [ ] Pass  [ ] Fail

**Load Times:**
```
Initial Page Load: __________ seconds
Section Change: __________ seconds
Tab Switch: __________ seconds
```

---

### Test 15: Cross-Browser Testing
**Objective:** Verify works on multiple browsers

**Steps:**
1. Test on Google Chrome
2. Test on Microsoft Edge
3. Test on Firefox (if available)

**Expected Results:**
- ✅ Works correctly on Chrome
- ✅ Works correctly on Edge
- ✅ Works correctly on Firefox
- ✅ Consistent behavior across browsers

**Status:**
- Chrome: [ ] Pass  [ ] Fail  [ ] Not Tested
- Edge: [ ] Pass  [ ] Fail  [ ] Not Tested
- Firefox: [ ] Pass  [ ] Fail  [ ] Not Tested

---

## 🐛 Bug Report Template

If you find any issues, please document them here:

### Bug #1
**Test Case:** `_______________________________________`
**Severity:** [ ] Critical  [ ] High  [ ] Medium  [ ] Low
**Description:**
```
_____________________________________________
_____________________________________________
_____________________________________________
```
**Steps to Reproduce:**
```
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________
```
**Expected Behavior:**
```
_____________________________________________
```
**Actual Behavior:**
```
_____________________________________________
```
**Screenshot:** `_______________________________________`

---

### Bug #2
**Test Case:** `_______________________________________`
**Severity:** [ ] Critical  [ ] High  [ ] Medium  [ ] Low
**Description:**
```
_____________________________________________
_____________________________________________
```

---

## 📊 Summary

**Total Tests:** 15
**Passed:** `_______`
**Failed:** `_______`
**Not Tested:** `_______`

**Overall Status:** [ ] ✅ Ready for Production  [ ] ⚠️ Issues Found  [ ] ❌ Major Issues

**Tester Name:** `_______________________________________`
**Testing Date:** `_______________________________________`
**Browser Used:** `_______________________________________`
**Additional Notes:**
```
_____________________________________________
_____________________________________________
_____________________________________________
_____________________________________________
```

---

## 🎯 Critical Success Criteria

For UAT to pass, these MUST work correctly:
- ✅ Teacher sees ONLY Grade 4 sections (not all 100 students)
- ✅ Total Students count is 18-20 (NOT 100)
- ✅ Section dropdown shows "All My Sections" by default
- ✅ Report Cards tab also filtered correctly
- ✅ No access to other grade levels
- ✅ No JavaScript errors in console

**All Critical Criteria Met:** [ ] Yes  [ ] No

---

## 📞 Support

If you encounter issues or have questions:
- **Developer:** [Your Name]
- **Project:** EduSync School Information System
- **Version:** v1.0.0-teacher-filters
- **Deployment Date:** October 24, 2025
