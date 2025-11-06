# 🚀 Week 9 Testing - Quick Start Guide

**Status**: ✅ Environment Ready  
**Server**: Running at http://127.0.0.1:5173  
**Date**: October 31, 2025

---

## 🔐 **Login Credentials**

```
Email: admin@edusync.local
Password: admin123
```

---

## 📊 **Test Data Available**

- **Teachers**: 5
- **Sections**: 4 (Diamond, Ruby, Emerald, Sapphire)
- **Students**: 40 (10 per section)
- **Grade Levels**: 7-8 (for demo - represents K-3 for ELLN)
- **Attendance Records**: 920 (23 days × 40 students)
- **Grade Entries**: 2,640

---

## ✅ **Testing Checklist - Execute in Order**

### 1. 🎯 **ELLN Assessment Tool** (30 mins)
**URL**: http://127.0.0.1:5173/forms/elln/assessment

**Test Steps**:
- [ ] Navigate to ELLN Assessment page
- [ ] Test searchable dropdown:
  - [ ] Type student name (e.g., "Ana")
  - [ ] Type LRN (if available)
  - [ ] Use arrow keys to navigate
  - [ ] Press Enter to select
- [ ] Fill assessment form:
  - [ ] Select Quarter (Q1)
  - [ ] Enter Literacy scores (e.g., 85, 90, 88)
  - [ ] Enter Numeracy scores (e.g., 87, 92, 85)
  - [ ] Verify auto-calculation of averages
  - [ ] Verify proficiency level updates
- [ ] Click "Save Assessment"
- [ ] Verify success message
- [ ] Repeat for 5 different students in different quarters

**Expected**: All calculations correct, data saves successfully

---

### 2. 📈 **ELLN Results Viewer** (20 mins)
**URL**: http://127.0.0.1:5173/forms/elln/results

**Test Steps**:
- [ ] Select student with assessments (created in Step 1)
- [ ] Verify student info displays correctly
- [ ] Check quarterly progress chart:
  - [ ] Bars render at correct heights
  - [ ] Labels display below bars (not overlapping)
  - [ ] Proficiency levels show for each quarter
  - [ ] Hover tooltips work
- [ ] Check literacy score chart (blue bars)
- [ ] Check numeracy score chart (green bars)
- [ ] Select student with no assessments
- [ ] Verify "No assessments found" message

**Expected**: All charts render correctly, labels aligned

---

### 3. 📊 **ELLN Reports Dashboard** (45 mins)
**URL**: http://127.0.0.1:5173/forms/elln/reports

**Test Steps**:
- [ ] **Section-Level Report**:
  - [ ] Select "Section Level" report type
  - [ ] Choose a section (e.g., Diamond)
  - [ ] Select "All Quarters"
  - [ ] Verify summary statistics load
  - [ ] Check proficiency distribution chart
  - [ ] Scroll down to Statistical Reports section
  - [ ] Verify mean, median, standard deviation
  - [ ] Check quarterly trend analysis
  
- [ ] **Grade-Level Report**:
  - [ ] Select "Grade Level" report type
  - [ ] Choose "Grade 7" (representing K-3 for demo)
  - [ ] Verify data aggregates correctly
  
- [ ] **School-Wide Report**:
  - [ ] Select "School-Wide" report type
  - [ ] Verify all students included
  
- [ ] **Excel Export**:
  - [ ] Click "Export to Excel" button
  - [ ] Verify file downloads (.xlsx)
  - [ ] Open Excel file
  - [ ] Check all 4 sheets:
    - [ ] Summary Statistics
    - [ ] Proficiency Distribution
    - [ ] Assessment Details
    - [ ] Student List
  - [ ] Verify data accuracy and formatting

**Expected**: All report types work, Excel export contains 4 sheets with correct data

---

### 4. 📝 **ILMP Template Creation** (30 mins)
**URL**: http://127.0.0.1:5173/forms/elln/ilmp

**Test Steps**:
- [ ] Search and select student
- [ ] Fill in sections:
  - [ ] Identified Learning Needs: "Struggling with reading comprehension and basic phonics"
  - [ ] Learning Goals: "Improve reading level by 2 grades within 6 months"
  - [ ] Intervention Strategies (add 3):
    - Strategy 1: Reading | One-on-one reading sessions | 2x per week | Reading Teacher
    - Strategy 2: Literacy | Phonics workbook exercises | Daily | Homeroom Teacher
    - Strategy 3: Assessment | Monthly progress checks | Monthly | Grade Adviser
  - [ ] Monitoring Plan: "Weekly check-ins with reading teacher, monthly assessments"
  - [ ] Parent Involvement: "Parents to read with child 15 minutes daily"
- [ ] Click "Save" (verify success)
- [ ] Click "Generate PDF"
- [ ] Verify PDF downloads
- [ ] Open PDF and check:
  - [ ] Student information header
  - [ ] All 5 sections present
  - [ ] Intervention strategies in table
  - [ ] Signature blocks
  - [ ] Page numbers and footer
  - [ ] DepEd Order reference

**Expected**: Form saves, PDF generates with DepEd-compliant format

---

### 5. 🎛️ **Principal Dashboard Widget** (15 mins)

**Note**: Widget needs to be integrated into principal dashboard page first.

**Test Steps**:
- [ ] Locate ELLNDashboardWidget component
- [ ] Verify metrics display:
  - [ ] Total Assessments (should match created assessments)
  - [ ] Average Overall Score
  - [ ] Students At Risk (score < 75)
  - [ ] Top Performers (score ≥ 90)
- [ ] Check trend indicator (emoji and percentage)
- [ ] Test quick action buttons:
  - [ ] "New Assessment" → navigate to assessment page
  - [ ] "View Results" → navigate to results page
  - [ ] "ILMP" → navigate to ILMP page
  - [ ] "View Reports" link → navigate to reports page

**Expected**: Widget displays correct metrics, all navigation works

---

## 🐛 **Bug Reporting**

If you find any issues, document them using this template:

```
**Bug ID**: BUG-ELLN-001
**Component**: [e.g., ELLNAssessment]
**Priority**: [Critical/High/Medium/Low]
**Description**: [What's wrong]
**Steps to Reproduce**:
1. Step 1
2. Step 2
**Expected**: [What should happen]
**Actual**: [What actually happens]
**Browser**: [Chrome/Firefox/Edge/Safari + version]
```

---

## ⚡ **Performance Checks**

While testing, observe:
- [ ] Searchable dropdown responds quickly (< 100ms)
- [ ] Charts render smoothly (< 500ms)
- [ ] Reports load within 3 seconds
- [ ] No page freezing or lag
- [ ] Excel/PDF generation completes quickly

---

## ✅ **Completion Criteria**

Testing is complete when:
- [ ] All 5 test sections completed
- [ ] All checkboxes marked
- [ ] Any bugs documented
- [ ] Performance acceptable
- [ ] Screenshots captured (if issues found)

---

## 📸 **Screenshot Locations**

Capture screenshots for:
- ✅ Successful assessment save
- ✅ Quarterly progress charts (all 3 charts)
- ✅ Statistical reports section
- ✅ Excel export (4 sheets)
- ✅ Generated ILMP PDF
- ⚠️ Any errors or issues

---

## 🎯 **Next Steps After Testing**

1. Review test results
2. Document any bugs found
3. Create bug fix tasks
4. Perform regression testing after fixes
5. Proceed to UAT with teachers
6. Finalize documentation

---

**Testing Start Time**: _________  
**Testing End Time**: _________  
**Total Time**: _________  
**Bugs Found**: _________  
**Tester Name**: _________  
**Status**: ⏳ In Progress

---

**Ready to test!** 🚀  
Open http://127.0.0.1:5173 and login with admin@edusync.local / admin123
