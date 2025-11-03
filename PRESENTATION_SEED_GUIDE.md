# Presentation-Ready Data Seeding ✅

## Quick Start

```bash
# 1. Start emulator with dev environment
npm run dev:emu

# 2. In another terminal, run presentation seed
npm run seed:presentation
```

## What Gets Seeded

### Complete 17-Collection Dataset

1. **Settings** (1 doc)
   - School: ENRIQUE ORENCIA ELEMENTARY SCHOOL
   - Year: 2025-2026
   - Quarter: 2
   - All features enabled

2. **Monthly School Days Config** (1 doc)
   - August 2025 - May 2026 calendar

3. **Teachers** (5 staff)
   - System Admin (admin@school.edu)
   - Principal: Maria Santos
   - Teacher 1: Juan Dela Cruz
   - Teacher 2: Rosa Garcia
   - Teacher 3: Pedro Reyes

4. **Sections** (3 classes)
   - Grade 1 - Acacia (Juan Dela Cruz)
   - Grade 2 - Mahogany (Rosa Garcia)
   - Grade 3 - Narra (Pedro Reyes)

5. **Students** (50 students)
   - Realistic Filipino names
   - Evenly distributed across 3 sections
   - Complete profile data (LRN, DOB, sex)

6. **Parents** (10 parents)
   - Each linked to 2 students
   - Filipino names

7. **Learning Areas** (7 subjects)
   - Filipino, English, Math, Science
   - Araling Panlipunan, EPP/TLE, MAPEH

8. **Class Schedules** (21 schedules)
   - Complete weekly schedule
   - All subjects × all sections

9. **Grades** (350 records)
   - Q1 and Q2 grades for all students
   - Final grades calculated (75-100 range)
   - Realistic bell curve distribution

10. **Core Values** (4 pillars)
    - Makadiyos, Makatao, Makakalikasan, Makabansa
    - Official DepEd behaviors

11. **Core Value Grades** (200 records)
    - AO/SO/RO/NO ratings for all students
    - All 4 quarters filled

12. **Attendance Records** (700+ records)
    - November 2025 (current month)
    - 95% present rate
    - Some absences and late marks

13. **Substitute Assignments** (1 active)
    - Teacher 1 substituted by Teacher 2
    - Nov 10-12, 2025

14. **Assignments** (2 tasks)
    - Math Problem Set (Grade 1)
    - Science Project (Grade 2)

15. **Student Assignment Grades** (30 grades)
    - 15 students per assignment
    - Scores 70-100

16. **Lesson Plans** (2 plans)
    - Math: Addition of Whole Numbers
    - Science: Parts of a Plant

17. **Announcements** (3 active)
    - Parent-Teacher Conference
    - Sports Day
    - Quarterly Exam Schedule

## Login Credentials

| Role      | Email                      | Password |
|-----------|----------------------------|----------|
| Admin     | admin@school.edu           | (any)    |
| Principal | principal@school.edu       | (any)    |
| Teacher 1 | juan.delacruz@school.edu   | (any)    |
| Teacher 2 | rosa.garcia@school.edu     | (any)    |
| Teacher 3 | pedro.reyes@school.edu     | (any)    |

> **Note**: In emulator mode, any password works!

## Data Highlights for Presentation

### Dashboard Will Show:
- ✅ **40 students** (varied across sections)
- ✅ **Average Grade: ~87%** (realistic performance)
- ✅ **Honor Students** (90+): ~8 students
- ✅ **At-Risk Students** (<75): 0 students
- ✅ **Grading Progress: 100%** (all students graded)
- ✅ **Grade Distribution**: Natural bell curve

### Analytics Will Show:
- Complete attendance trends for November
- Grade distribution charts with real data
- All 7 subjects with grades
- Performance by section comparisons

### Forms Will Show:
- Complete Form 137 data (Permanent Record)
- Form 138 (Report Cards) with grades
- SF1 (Enrollment Data)
- SF2 (Daily Attendance)
- All DepEd forms filled

### Assignments Module:
- Active assignments with due dates
- Student submissions and grades
- Completion tracking

### Lesson Plans Module:
- Sample lesson plans with objectives
- Materials and procedures
- Approved status

### Announcements:
- School-wide announcements
- Target audience filters (parents/students/all)
- Priority levels

## Perfect For:

✅ **Demo Videos** - All features have real data
✅ **Client Presentations** - Realistic Filipino school context
✅ **Testing** - Comprehensive edge cases covered
✅ **Screenshots** - Professional-looking data
✅ **Training** - Complete workflow examples

## Reseed Anytime

To refresh the data:

```bash
# Stop dev server (Ctrl+C)
# Run seed again
npm run seed:presentation
# Refresh browser
```

The seed script is **idempotent** - it will overwrite existing data with fresh presentation-ready data.

## File Location

**Seed Script**: `scripts/seed-presentation.cjs`
**Runner Script**: `scripts/run-presentation-seed.cjs`

## Customization

Edit `scripts/seed-presentation.cjs` to:
- Add more students/teachers/sections
- Change school name
- Modify grade distributions
- Add more announcements/assignments
- Adjust attendance patterns

---

**Ready to present!** 🎯
