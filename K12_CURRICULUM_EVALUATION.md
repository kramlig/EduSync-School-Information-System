# K-12 Curriculum High-Level Re-Evaluation
**Date**: October 22, 2025  
**Issue**: Learning Areas page not showing Mother Tongue and MAPEH correctly

## 🔍 Problem Analysis

### Current State
- **DEFAULT_LEARNING_AREAS** in `hooks/useSchoolData.ts` only contains **7 Elementary subjects**
- Missing **Mother Tongue (MTB-MLE)** and **EPP/TLE** for Elementary
- Missing all **Junior High School** subjects (8 subjects)
- Missing all **Senior High School** subjects (~25 subjects across tracks)

### Root Cause
The hardcoded `DEFAULT_LEARNING_AREAS` is incomplete and outdated. It doesn't reflect the official **DepEd K-12 Curriculum**.

---

## 📚 Official K-12 Curriculum Structure

### **ELEMENTARY (Grades 1-6)** - 8 Subjects

| Subject | Code | Grades | Credits | Category | Notes |
|---------|------|--------|---------|----------|-------|
| **Mother Tongue** | MTB-MLE | 1-3 | 3 | Core | Local/regional language |
| **Filipino** | FIL-ELEM | 1-6 | 3 | Core | National language |
| **English** | ENG-ELEM | 1-6 | 3 | Core | Second language |
| **Mathematics** | MATH-ELEM | 1-6 | 3 | Core | - |
| **Science** | SCI-ELEM | 3-6 | 3 | Core | Starts Grade 3 |
| **Araling Panlipunan** | AP-ELEM | 1-6 | 3 | Core | Social Studies |
| **Edukasyon sa Pagpapakatao** | ESP-ELEM | 1-6 | 2 | Core | Values Education |
| **MAPEH** | MAPEH-ELEM | 1-6 | 4 | Specialized | Music, Arts, PE, Health (composite) |
| **EPP/TLE** | EPP-ELEM | 4-6 | 2 | Specialized | Edukasyong Pantahanan at Pangkabuhayan |

**Total: 9 subjects** (Note: Mother Tongue only for Grades 1-3)

---

### **JUNIOR HIGH SCHOOL (Grades 7-10)** - 8 Subjects

| Subject | Code | Grades | Credits | Category | Notes |
|---------|------|--------|---------|----------|-------|
| **Filipino** | FIL-JHS | 7-10 | 5 | Core | - |
| **English** | ENG-JHS | 7-10 | 5 | Core | - |
| **Mathematics** | MATH-JHS | 7-10 | 5 | Core | - |
| **Science** | SCI-JHS | 7-10 | 5 | Core | - |
| **Araling Panlipunan** | AP-JHS | 7-10 | 5 | Core | - |
| **Edukasyon sa Pagpapakatao** | ESP-JHS | 7-10 | 5 | Core | - |
| **MAPEH** | MAPEH-JHS | 7-10 | 5 | Specialized | Music, Arts, PE, Health (composite) |
| **TLE** | TLE-JHS | 7-10 | 5 | Specialized | Exploratory (7-8), Specialization (9-10) |

**Total: 8 subjects**

---

### **SENIOR HIGH SCHOOL (Grades 11-12)** - ~25 Subjects

#### **Core Subjects (All Tracks)** - 10 subjects
1. Oral Communication (G11-S1)
2. Reading and Writing (G11-S2)
3. Komunikasyon at Pananaliksik (G11-S1)
4. Pagbasa at Pagsusuri (G11-S2)
5. General Mathematics (G11-S1)
6. Statistics and Probability (G11-S2)
7. Earth Science (G11-S1)
8. Physical Science (G11-S2)
9. Personal Development (G11-S1)
10. Physical Education & Health (G11-G12)

#### **STEM Track** - 6 specialized subjects
1. Pre-Calculus
2. Basic Calculus
3. General Biology 1 & 2
4. General Chemistry 1 & 2
5. General Physics 1 & 2

#### **ABM (Accountancy, Business & Management)** - 6 specialized subjects
1. Fundamentals of Accountancy, Business & Management 1 & 2
2. Business Mathematics
3. Business Finance
4. Organization and Management
5. Principles of Marketing

#### **HUMSS (Humanities & Social Sciences)** - 6 specialized subjects
1. Creative Writing
2. Creative Nonfiction
3. World Religions and Belief Systems
4. Trends, Networks, and Critical Thinking
5. Philippine Politics and Governance
6. Community Engagement, Solidarity, and Citizenship

#### **GAS (General Academic Strand)** - Variable electives
Students choose from a mix of subjects across different tracks

#### **TVL (Technical-Vocational-Livelihood)** - Variable specializations
Depends on chosen specialization (ICT, Home Economics, Agri-Fishery, IA)

---

## ✅ What SHOULD Be in the System

### Total Learning Areas by Level
- **Elementary**: 9 subjects (including Mother Tongue for Grades 1-3)
- **Junior High**: 8 subjects
- **Senior High**: ~25 subjects (varies by track)
- **TOTAL**: ~42 learning areas

### Critical Missing Subjects
1. ✅ **Mother Tongue (MTB-MLE)** - Grades 1-3 Elementary
2. ✅ **EPP/TLE** - Grades 4-6 Elementary  
3. ✅ **MAPEH (Composite)** - Both Elementary and JHS versions
4. ❌ **All JHS subjects** - Currently only 7 Elementary subjects in default
5. ❌ **All SHS subjects** - No SHS subjects in default list

---

## 🔧 Required Fixes

### Option 1: Update DEFAULT_LEARNING_AREAS (Temporary)
Update the hardcoded array in `hooks/useSchoolData.ts` to include all 42 subjects.

**Pros**: 
- Quick fix for development/testing
- Ensures UI shows correct groupings

**Cons**:
- Still hardcoded, not production-ready
- Needs to be synced with Firestore eventually

### Option 2: Run K-12 Migration Script (Recommended)
Execute the existing migration script to properly populate Firestore.

**Script**: `scripts/migrate-k12-curriculum.cjs`

**Phases**:
1. Fix Elementary ID mismatches
2. Add K-12 metadata to Elementary subjects
3. Create JHS subjects (8 subjects)
4. Create SHS subjects (25+ subjects)
5. Seed grades for existing students

**Pros**:
- Production-ready
- Properly structured in Firestore
- Includes grade seeding for existing students

**Cons**:
- Takes longer to execute
- Need to verify database state after migration

---

## 📋 Recommended Action Plan

### Immediate (Next 30 minutes)
1. ✅ Run K-12 migration script to populate Firestore with complete curriculum
2. ✅ Verify all 42 learning areas are in database
3. ✅ Test Learning Areas page shows correct groupings:
   - Elementary (9 subjects)
   - Junior High (8 subjects)
   - Senior High (25 subjects in nested tracks)

### Follow-up (Later today)
4. ✅ Update DEFAULT_LEARNING_AREAS to match Firestore (as fallback)
5. ✅ Test Mother Tongue shows for Grades 1-3 only
6. ✅ Test MAPEH composite grading UI
7. ✅ Verify all subjects display correct grade levels

### Testing Checklist
- [ ] Elementary section shows 9 subjects
- [ ] Mother Tongue visible for Grades 1-3 students
- [ ] MAPEH (Elementary) shows for Grades 1-6
- [ ] EPP/TLE shows for Grades 4-6
- [ ] Junior High section shows 8 subjects
- [ ] MAPEH (JHS) shows for Grades 7-10
- [ ] Senior High shows all track-specific subjects
- [ ] Filters work correctly
- [ ] Search finds subjects across all levels
- [ ] Add/Edit/Delete still functional

---

## 📊 Expected Results After Fix

### Learning Areas Page Structure
```
📚 ELEMENTARY (9 subjects)
  ├─ Mother Tongue (Grades 1-3)
  ├─ Filipino (Grades 1-6)
  ├─ English (Grades 1-6)
  ├─ Mathematics (Grades 1-6)
  ├─ Science (Grades 3-6)
  ├─ Araling Panlipunan (Grades 1-6)
  ├─ Edukasyon sa Pagpapakatao (Grades 1-6)
  ├─ MAPEH (Grades 1-6) [Composite: Music, Arts, PE, Health]
  └─ EPP/TLE (Grades 4-6)

🎓 JUNIOR HIGH SCHOOL (8 subjects)
  ├─ Filipino (Grades 7-10)
  ├─ English (Grades 7-10)
  ├─ Mathematics (Grades 7-10)
  ├─ Science (Grades 7-10)
  ├─ Araling Panlipunan (Grades 7-10)
  ├─ Edukasyon sa Pagpapakatao (Grades 7-10)
  ├─ MAPEH (Grades 7-10) [Composite: Music, Arts, PE, Health]
  └─ TLE (Grades 7-10)

🏆 SENIOR HIGH SCHOOL (25 subjects)
  ├─ 📌 Core Subjects (10 subjects - all tracks)
  ├─ 🔬 STEM Track (6 specialized subjects)
  ├─ 💼 ABM Track (6 specialized subjects)
  ├─ 💭 HUMSS Track (6 specialized subjects)
  └─ 🌐 GAS Track (elective mix)
```

---

## 🎯 Next Steps

**Would you like me to:**
1. ✅ Run the K-12 migration script now?
2. ✅ Update DEFAULT_LEARNING_AREAS with complete list?
3. ✅ Both (recommended)?

This will ensure the system properly reflects the official DepEd K-12 curriculum structure.
