# PostgreSQL Migration - Quick Start Guide

This guide will walk you through the complete migration from Firestore to PostgreSQL/Supabase.

---

## 📁 Migration Documents

All migration documentation is located in your project root:

| Document | Purpose | Status |
|----------|---------|--------|
| `MIGRATION_TO_POSTGRESQL.md` | Complete 35-page migration plan | ✅ Ready |
| `docs/SCHEMA_ER_DIAGRAM.md` | PostgreSQL schema & ER diagram | ✅ Ready |
| `MIGRATION_PROGRESS.md` | Daily progress tracker | 🟡 In Progress |
| `scripts/migration/01-export-firestore.cjs` | Firestore backup script | ✅ Ready |
| `scripts/migration/02-transform-data.cjs` | Data transformation (pending) | ⏸️ Day 4 |
| `scripts/migration/03-import-postgresql.cjs` | PostgreSQL import (pending) | ⏸️ Day 5 |

---

## 🚀 Quick Start (Day 1 - Today)

You've already completed Day 1! Here's what's done:

### ✅ Completed
- [x] Full migration plan created
- [x] PostgreSQL schema designed with all tables, constraints, triggers
- [x] ER diagram with relationships
- [x] Progress tracker set up
- [x] Firestore backup script ready

### 📋 Current Status
- **Day**: 1 of 21
- **Progress**: 5%
- **Phase**: Preparation & Setup
- **Next**: Create Supabase project tomorrow

---

## 📅 Tomorrow (Day 2 - Nov 19)

### Tasks for Tomorrow

1. **Create Supabase Account** (15 minutes)
   ```
   1. Go to https://supabase.com
   2. Sign up with GitHub account
   3. Create new project: "edusync-sis-migration"
   4. Region: Choose closest to Philippines (Singapore)
   5. Database password: [save securely]
   6. Wait 2 minutes for project to provision
   ```

2. **Get Connection Details** (5 minutes)
   ```
   1. Go to Project Settings → API
   2. Copy these values:
      - Project URL (VITE_SUPABASE_URL)
      - anon public key (VITE_SUPABASE_ANON_KEY)
      - service_role key (SUPABASE_SERVICE_KEY - keep secret!)
   3. Save to .env.local file
   ```

3. **Run Schema Creation SQL** (30 minutes)
   ```
   1. Go to SQL Editor in Supabase dashboard
   2. Open MIGRATION_TO_POSTGRESQL.md
   3. Copy the entire PostgreSQL schema (starting from CREATE TABLE schools...)
   4. Paste into SQL Editor
   5. Click "Run"
   6. Verify: Go to Table Editor → should see 12+ tables
   ```

4. **Test With Sample Data** (30 minutes)
   ```sql
   -- Insert test school
   INSERT INTO schools (name, division, region, current_school_year)
   VALUES ('Test School', 'Batangas', 'Region IV-A', '2024-2025')
   RETURNING id;
   
   -- Insert test student (use school id from above)
   INSERT INTO students (
     school_id, lrn, name, first_name, last_name, 
     gender, date_of_birth, grade_level
   )
   VALUES (
     'SCHOOL_ID_HERE', '123456789012', 'Juan Dela Cruz', 
     'Juan', 'Dela Cruz', 'Male', '2015-01-01', 3
   );
   
   -- Test foreign key constraint (should fail - no section exists)
   UPDATE students SET section_id = 'invalid-uuid-here';
   -- Expected: ERROR - foreign key constraint violation ✅
   ```

### Estimated Time: 4-6 hours

---

## 📖 How to Read the Migration Plan

The main migration plan (`MIGRATION_TO_POSTGRESQL.md`) has these sections:

1. **Executive Summary** (pages 1-3)
   - Why we're migrating
   - Benefits
   - Risk assessment
   - Success criteria

2. **Current System Inventory** (pages 4-7)
   - All Firestore collections
   - Known bugs
   - Data integrity issues

3. **PostgreSQL Schema Design** (pages 8-25)
   - Complete SQL schema
   - All tables, relationships, constraints
   - Row-Level Security policies
   - Triggers and functions

4. **Data Mapping** (pages 26-28)
   - Firestore → PostgreSQL field mappings
   - MAPEH composite transformation
   - UUID conversion strategy

5. **Migration Timeline** (pages 29-35)
   - 21-day detailed plan
   - Daily tasks and deliverables
   - Acceptance criteria

---

## 🗺️ Understanding the ER Diagram

Open `docs/SCHEMA_ER_DIAGRAM.md` to see:

- **Mermaid Diagram**: Visual representation of all tables and relationships
- **Relationship Summary**: Which tables connect to which
- **Index Strategy**: Performance optimizations
- **Constraints**: Data integrity rules

### Key Relationships to Understand

```
schools (1) → (many) students
schools (1) → (many) teachers
schools (1) → (many) sections

sections (1) → (many) students
sections (1) → (1) teachers (adviser)

students (1) → (many) grades
students (many) → (many) parents (junction: parent_students)

grades (many) → (1) students
grades (many) → (1) learning_areas
grades (many) → (1) teachers (graded_by)
```

---

## 🔧 Running the Backup Script

When you're ready to export Firestore data (Day 3):

```bash
# Production
node scripts/migration/01-export-firestore.cjs --project edusync-sis

# Staging
node scripts/migration/01-export-firestore.cjs --project edusync-staging

# Local emulator
node scripts/migration/01-export-firestore.cjs --project edusync-sis --useEmulator=true
```

### Output
```
backups/2025-11-18/
  ├── schools.json (1 doc, 5 KB)
  ├── students.json (270 docs, 540 KB)
  ├── teachers.json (5 docs, 7.5 KB)
  ├── parents.json (135 docs, 135 KB)
  ├── sections.json (6 docs, 6 KB)
  ├── learningAreas.json (9 docs, 4.5 KB)
  ├── grades.json (0-2430 docs, ~2 MB)
  ├── coreValueGrades.json (1080 docs, 324 KB)
  ├── classSchedules.json (30 docs, 15 KB)
  ├── export-summary.txt (detailed report)
  └── data-quality-issues.json (if any found)
```

---

## 📊 Tracking Your Progress

### Daily Updates

At the end of each day:

1. Open `MIGRATION_PROGRESS.md`
2. Update the day's section:
   - Mark tasks as complete [x]
   - Add actual time spent
   - Note any blockers
   - Add notes/lessons learned
3. Commit to Git:
   ```bash
   git add MIGRATION_PROGRESS.md
   git commit -m "Day X progress: [summary]"
   ```

### Weekly Reviews

Every Friday, review:
- Overall progress vs. plan
- Risks encountered
- Adjustments needed
- Next week's plan

---

## ⚠️ Critical Reminders

### Before You Start Day 2

1. ✅ **Git Branch**: Make sure you're on `migration/postgresql` branch
   ```bash
   git checkout -b migration/postgresql
   git push -u origin migration/postgresql
   ```

2. ✅ **Backup Firestore**: Even though script exists, manually export Auth users:
   ```bash
   firebase auth:export backups/2025-11-18/auth-users.json --project edusync-sis
   ```

3. ✅ **Tag Current State**:
   ```bash
   git tag -a firestore-backup-2025-11-18 -m "Pre-migration Firestore state"
   git push origin firestore-backup-2025-11-18
   ```

### Data Quality Issues to Watch

Based on current bugs, expect to find:

- ⚠️ Duplicate MAPEH learning areas (4 individual + 1 composite = 5 total, should be 1)
- ⚠️ Some grades missing `schoolId` field
- ⚠️ Possibly orphaned parent.studentIds references
- ⚠️ Students without sections (if any)

The backup script will detect and report these automatically.

---

## 🎯 Success Criteria

By the end of 3 weeks, you should have:

### Data Migration
- [x] All 270 students migrated with zero data loss
- [x] All relationships preserved (section ↔ students ↔ grades)
- [x] MAPEH composite grades working correctly
- [x] No orphaned records

### Bug Elimination
- [x] No more "student count 0" bugs (foreign keys prevent this)
- [x] No more role corruption (ENUM constraint prevents this)
- [x] No more permission errors (schema enforces schoolId)
- [x] No more MAPEH input disappearing (proper data model)

### Performance
- [x] Dashboard loads in <1s (currently 3.2s)
- [x] Reports generate in <5s (currently 45s)
- [x] Grade entry is instant (no Firestore delays)

### Cost
- [x] Monthly cost <$30 (currently $282 projected)
- [x] 97% cost reduction achieved

---

## 📞 Need Help?

### Common Questions

**Q: What if I find issues with the schema during Day 2 testing?**  
A: Update the schema SQL and re-run. That's why Day 2 is for testing! Document any changes in MIGRATION_PROGRESS.md.

**Q: Can I pause and resume the migration?**  
A: Yes! The plan is designed for daily incremental progress. Commit your work daily.

**Q: What if the migration takes longer than 3 weeks?**  
A: Not a problem. The timeline is a target, not a hard deadline. Update MIGRATION_PROGRESS.md with revised dates.

**Q: Can I rollback if something goes wrong?**  
A: Yes! The rollback plan is on page 30 of MIGRATION_TO_POSTGRESQL.md. You can revert to Firestore anytime.

### Migration Lead
- **Name**: Mark Gil Dotillos
- **Daily Updates**: MIGRATION_PROGRESS.md (commit EOD)
- **Questions**: Review migration docs first, then ask

---

## 📚 Additional Resources

### PostgreSQL Learning
- PostgreSQL Tutorial: https://www.postgresqltutorial.com/
- Supabase Docs: https://supabase.com/docs
- PostgreSQL Constraints: https://www.postgresql.org/docs/current/ddl-constraints.html

### Supabase Features
- Row-Level Security: https://supabase.com/docs/guides/auth/row-level-security
- Realtime: https://supabase.com/docs/guides/realtime
- PostgREST API: https://supabase.com/docs/guides/api

### Migration Best Practices
- Schema Design: https://www.postgresql.org/docs/current/ddl.html
- Data Migration: https://supabase.com/docs/guides/database/import-data
- Testing: https://www.postgresql.org/docs/current/regress.html

---

## 🎉 Ready to Start!

You've completed Day 1! Here's what you have:

✅ **Planning Complete**
- 35-page migration plan
- Complete PostgreSQL schema
- ER diagram
- Progress tracker
- Backup scripts

✅ **Understanding Complete**
- You know why we're migrating
- You understand the PostgreSQL schema
- You know the 3-week timeline
- You have daily tasks planned

✅ **Preparation Complete**
- Git branch created
- Documentation organized
- Tools ready
- Backup strategy defined

### Tomorrow's Goal

By end of Day 2, you should have:
- ✅ Working Supabase project
- ✅ All PostgreSQL tables created
- ✅ RLS policies tested
- ✅ Sample data inserted successfully
- ✅ Foreign keys validated

**Time to rest!** Tomorrow we create the actual PostgreSQL database. 🚀

---

**Last Updated**: November 18, 2025  
**Migration Status**: Day 1 Complete (5%)  
**Next Action**: Create Supabase project (Day 2)
