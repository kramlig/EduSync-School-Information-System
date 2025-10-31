# Database Seeding Guide

## Quick Start

To seed the entire database with all necessary data, run:

```bash
npm run seed
```

This single command will:
1. ✅ Clear all existing data (17 collections)
2. ✅ Create admin user (admin@edusync.local / admin123)
3. ✅ Create school year 2023-2024
4. ✅ Create 4 teachers
5. ✅ Create 8 learning areas (Math, English, Science, etc.)
6. ✅ Create 4 core values (Maka-Diyos, Maka-tao, etc.)
7. ✅ Create 4 sections (2x Grade 7, 2x Grade 8)
8. ✅ Create 40 students (10 per section)
9. ✅ Create attendance records for October 2025 (23 school days)
10. ✅ Create grades for Q1 and Q2 (640 grade entries)
11. ✅ Create 3 announcements

## What Gets Created

### Teachers (4)
- Roberto Santos (Mathematics)
- Ana Cruz (English)
- Pedro Garcia (Science)
- Maria Lopez (Filipino)

### Students (40 total)
- **Grade 7 - Diamond**: 10 students
- **Grade 7 - Ruby**: 10 students
- **Grade 8 - Emerald**: 10 students
- **Grade 8 - Sapphire**: 10 students

Each student has:
- Name, LRN, email
- Section assignment
- Date of birth, sex, status

### Learning Areas (8)
- Mathematics, English, Science, Filipino
- Araling Panlipunan, TLE, MAPEH, Values Education

### Core Values (4)
- Maka-Diyos (Faith in God)
- Maka-tao (Respect for humanity)
- Makakalikasan (Care for environment)
- Makabansa (Love of country)

### Attendance (920 entries)
- October 2025: 23 school days (weekdays only)
- Realistic patterns:
  - 85% Present (P)
  - 5% Absent (A)
  - 5% Late (L)
  - 5% Excused (E)

### Grades (640 entries)
- Q1 and Q2 grades for all students
- 8 learning areas per student
- Components:
  - Written Work (30%)
  - Performance Task (50%)
  - Quarterly Assessment (20%)
- Random grades between 75-100

### Announcements (3)
- School opening announcement
- Parent-teacher conference notice
- Sports fest 2024 announcement

## Prerequisites

Make sure Firebase emulators are running:
```bash
# Firestore should be on port 8086
# Auth should be on port 9100
```

## After Seeding

1. **Login to the app:**
   - URL: http://localhost:5173 or http://localhost:5174
   - Email: admin@edusync.local
   - Password: admin123

2. **Navigate to SF2 Dashboard:**
   - Go to: School Forms → SF2 Dashboard
   - Switch to "Monthly View" tab
   - You should see the calendar grid with all students and attendance data

3. **Test features:**
   - ✅ View attendance in monthly calendar grid
   - ✅ Click cells to change attendance status
   - ✅ See student avatars and color-coded cells
   - ✅ View grades in Grades & Reports section

## Troubleshooting

### No data showing up?
1. Check if emulators are running on correct ports (8086, 9100)
2. Verify in terminal output that seed completed successfully
3. Clear browser cache and reload

### Need to re-seed?
Just run `npm run seed` again - it automatically clears old data first.

### Want different data?
Edit `scripts/seed-complete.cjs` to customize:
- Number of students per section
- Grade ranges
- Attendance patterns
- Learning areas
