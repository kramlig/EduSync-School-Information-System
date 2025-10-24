# 🧪 Teacher UAT Testing - Quick Start

## 📦 What's Included

This UAT package contains everything needed to test teacher assignment filtering:

### 1. **Automated Tests** 
📄 `tests/teacher-uat-script.spec.ts`
- 8 automated test cases using Playwright
- Validates filtering, counts, and permissions
- Runs in ~2-3 minutes

### 2. **Manual Testing Guide**
📄 `docs/TEACHER_UAT_GUIDE.md`
- 15 detailed test scenarios
- Printable checklist format
- Bug report templates

### 3. **Test Runner Script**
📄 `scripts/run-teacher-uat.ps1`
- One-click test execution
- Automatic dependency installation
- Formatted results

---

## 🚀 How to Run Tests

### Option A: Automated Tests (Recommended)

**Run everything automatically:**
```powershell
.\scripts\run-teacher-uat.ps1
```

**Or run with Playwright directly:**
```bash
npx playwright test tests/teacher-uat-script.spec.ts --reporter=list --headed
```

**Run single test:**
```bash
npx playwright test tests/teacher-uat-script.spec.ts -g "TC001"
```

### Option B: Manual Testing

1. **Open the manual guide:**
   ```
   docs/TEACHER_UAT_GUIDE.md
   ```

2. **Print or use digitally** to check off each test

3. **Document results** in the provided templates

---

## 🔑 Test Credentials

**Production URL:** https://edusync-sis.web.app

**Teacher Account:**
- Email: `pedro.reyes@edusync.edu`
- Password: `teacher123`
- Role: Teacher
- Assignment: Grade 4 (Math, English, ESP)

**Expected Behavior:**
- ✅ Sees ONLY Grade 4 sections
- ✅ Total Students: ~18-20 (NOT 100)
- ✅ Subjects: Math, English, ESP only
- ✅ Cannot access other grade levels

---

## ✅ What to Test

### Critical Items (Must Pass):
1. ✅ Section dropdown shows "All My Sections" + Grade 4 sections ONLY
2. ✅ Total Students shows ~18-20 (not 100)
3. ✅ Report Cards tab also filtered correctly
4. ✅ Cannot access other grade levels
5. ✅ Analytics calculated from Grade 4 students only

### Additional Items:
- Search functionality within Grade 4
- Performance filters work correctly
- Quarter selection works
- Export functions (manual verification)
- Page refresh persistence
- Cross-browser compatibility

---

## 📊 Test Scenarios

| # | Test Name | Type | Duration |
|---|-----------|------|----------|
| TC001 | Section Filtering | Auto | ~20s |
| TC002 | Student Count | Auto | ~15s |
| TC003 | Class Average | Auto | ~15s |
| TC004 | Report Cards Filter | Auto | ~20s |
| TC005 | Section Selection | Auto | ~30s |
| TC006 | Access Control | Auto | ~25s |
| TC007 | Deep Analytics | Auto | ~20s |
| TC008 | Export Functions | Manual | ~5m |
| TC009 | Search Filter | Manual | ~3m |
| TC010 | Performance Tests | Manual | ~5m |
| TC011 | Browser Testing | Manual | ~10m |

**Total Automated:** ~2-3 minutes  
**Total Manual:** ~30-45 minutes

---

## 📝 Reporting Results

### Automated Test Results
- ✅ View in terminal output
- 📸 Screenshots in `test-results/` folder
- 📄 HTML report: `npx playwright show-report`

### Manual Test Results
- 📋 Fill out checklist in `TEACHER_UAT_GUIDE.md`
- 🐛 Use bug report template for issues
- 📸 Take screenshots of problems

---

## 🐛 Common Issues & Solutions

### Issue: "All 100 students showing"
**Expected:** ~18-20 Grade 4 students only  
**Action:** FAIL - Report to dev team immediately

### Issue: "Can see Grade 1, 2, 3 sections"
**Expected:** Only Grade 4 sections  
**Action:** FAIL - Critical access control issue

### Issue: "Section dropdown shows 'All Sections'"
**Expected:** Should show "All My Sections" for teachers  
**Action:** Minor - Document but may not block UAT

### Issue: "Tests fail to run"
**Solution:** 
```bash
npm install -D @playwright/test
npx playwright install chromium
```

---

## 📞 Support & Questions

**Developer:** Mark Gil Dotillos  
**Project:** EduSync SIS  
**Version:** v1.0.0-teacher-filters  
**Deployment:** October 24, 2025

**Questions?** Review the detailed guide in `docs/TEACHER_UAT_GUIDE.md`

---

## 🎯 Sign-Off Criteria

UAT can be signed off when:
- [ ] All automated tests pass (8/8)
- [ ] Critical manual tests pass (5/5 minimum)
- [ ] No Critical or High severity bugs
- [ ] Tested on at least 2 browsers
- [ ] Performance acceptable (<5s load times)

**Sign-Off:**
```
Tester Name: _________________________________
Date: _______________________________________
Status: [ ] APPROVED  [ ] APPROVED WITH NOTES  [ ] REJECTED
Signature: ___________________________________
```

---

## 🚦 Quick Status Check

Run this to see if production is working:
```bash
# Test login endpoint
curl https://edusync-sis.web.app

# Check if site is up
curl -I https://edusync-sis.web.app | grep "200 OK"
```

**Expected:** Should return HTTP 200 OK

---

## 📁 File Structure

```
tests/
  └── teacher-uat-script.spec.ts    # Automated tests
docs/
  └── TEACHER_UAT_GUIDE.md          # Manual testing guide
  └── TEACHER_UAT_README.md         # This file
scripts/
  └── run-teacher-uat.ps1           # Test runner script
test-results/                        # Test output (generated)
```

---

## ⏱️ Estimated Time

- **Setup:** 5 minutes
- **Automated Tests:** 3 minutes
- **Manual Tests:** 30 minutes
- **Documentation:** 10 minutes
- **Total:** ~45-50 minutes

---

## 🎓 For First-Time Testers

1. **Read this file first** (you're doing it!)
2. **Run automated tests** to get familiar
3. **Open manual guide** and follow step-by-step
4. **Document everything** - even small issues
5. **Ask questions** if anything is unclear

**Pro Tip:** Use two monitors - one for the app, one for the checklist!

---

## ✨ Success Stories

After this UAT:
- ✅ Teachers see only their students
- ✅ No data leakage between grade levels
- ✅ Accurate student counts and analytics
- ✅ Improved performance and UX
- ✅ Ready for production rollout

**Thank you for testing!** 🙏
