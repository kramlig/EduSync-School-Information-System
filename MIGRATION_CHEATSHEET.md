# Migration Quick Reference Cheat Sheet

**Quick Links**:
- 📋 Main Plan: `MIGRATION_TO_POSTGRESQL.md`
- 📊 Progress Tracker: `MIGRATION_PROGRESS.md`
- 🗺️ Schema Diagram: `docs/SCHEMA_ER_DIAGRAM.md`
- 🚀 Getting Started: `MIGRATION_README.md`

---

## Day-by-Day Checklist

### ✅ Day 1 (Nov 18) - COMPLETED
- [x] Migration plan created
- [x] PostgreSQL schema designed
- [x] ER diagram created
- [x] Progress tracker set up
- [x] Git branch: `migration/postgresql`

### Day 2 (Nov 19) - IN PROGRESS
- [ ] Create Supabase account
- [ ] Create project: "edusync-sis-migration"
- [ ] Run schema SQL in SQL Editor
- [ ] Verify 12 tables created
- [ ] Test sample data insert
- [ ] Test foreign key constraints

### Day 3 (Nov 20)
- [ ] Run export script: `node scripts/migration/01-export-firestore.cjs`
- [ ] Verify all 9 collections exported
- [ ] Review `export-summary.txt`
- [ ] Check `data-quality-issues.json`
- [ ] Document issues found

### Day 4 (Nov 21)
- [ ] Write transformation script
- [ ] Generate UUID mappings
- [ ] Transform MAPEH composites
- [ ] Generate SQL INSERT files
- [ ] Validate transformation

### Day 5 (Nov 22)
- [ ] Import data to PostgreSQL
- [ ] Verify row counts
- [ ] Test foreign keys
- [ ] Run data integrity queries
- [ ] Test rollback plan

---

## Essential Commands

### Supabase
```bash
# Install Supabase CLI (optional)
npm install -g supabase

# Login to Supabase
supabase login

# Link to project
supabase link --project-ref YOUR_PROJECT_REF
```

### Firestore Export
```bash
# Production
node scripts/migration/01-export-firestore.cjs --project edusync-sis

# Check export
ls -lh backups/2025-11-18/
cat backups/2025-11-18/export-summary.txt
```

### Git Workflow
```bash
# Daily commits
git add .
git commit -m "Day X: [description]"
git push origin migration/postgresql

# Create checkpoint tags
git tag -a checkpoint-day-X -m "Completed Day X"
git push origin checkpoint-day-X
```

### PostgreSQL Queries
```sql
-- Check row counts
SELECT 
    schemaname,
    tablename,
    n_live_tup as rows
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Check for orphaned records
SELECT 
    s.id, s.name, s.section_id
FROM students s
LEFT JOIN sections sec ON s.section_id = sec.id
WHERE s.section_id IS NOT NULL AND sec.id IS NULL;

-- Test MAPEH composites
SELECT 
    s.name,
    la.name as subject,
    g.composite_grades
FROM grades g
JOIN students s ON g.student_id = s.id
JOIN learning_areas la ON g.learning_area_id = la.id
WHERE la.is_composite = true
LIMIT 5;
```

---

## Common Issues & Solutions

### Issue: Schema creation fails
**Solution**: Check PostgreSQL version (need 12+), verify no syntax errors, run statements one at a time

### Issue: Foreign key constraint violation during import
**Solution**: Import in correct order (schools → users → students → grades), check UUID mappings are correct

### Issue: RLS policies blocking access
**Solution**: Verify JWT contains `app_metadata.school_id`, check policy conditions match your auth setup

### Issue: Supabase free tier quota exceeded
**Solution**: Optimize queries, add indexes, consider upgrading ($25/month pro tier)

---

## Key Firestore → PostgreSQL Differences

| Feature | Firestore | PostgreSQL |
|---------|-----------|------------|
| **IDs** | Custom strings (`st_001`) | UUIDs (`a0eebc99-...`) |
| **Timestamps** | `Timestamp` object | `TIMESTAMPTZ` |
| **References** | String IDs | UUID foreign keys |
| **Validation** | Client-side | Database constraints |
| **Queries** | Limited operators | Full SQL |
| **Joins** | Manual in code | Native SQL JOINs |
| **Transactions** | Limited | Full ACID |

---

## Environment Variables

### Add to `.env.local`:
```bash
# Supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Secret!

# Firebase (keep during migration)
VITE_FIREBASE_PROJECT_ID=edusync-sis
VITE_FIREBASE_API_KEY=AIzaSy...
```

---

## Testing Checklist

### Data Integrity
- [ ] All students have valid section_id or NULL
- [ ] All grades reference existing students
- [ ] All grades reference existing learning_areas
- [ ] No duplicate LRNs
- [ ] Grade values are 60-100 or NULL
- [ ] MAPEH composite_grades are valid JSONB

### Performance
- [ ] Dashboard loads in <1s
- [ ] Section grades query <500ms
- [ ] Student search <200ms
- [ ] Report generation <5s

### Functionality
- [ ] Teachers see only assigned sections
- [ ] Students see only own grades
- [ ] Parents see only children's grades
- [ ] Admins see all school data

---

## Rollback Plan (If Needed)

```bash
# 1. Revert Git
git checkout main
git branch -D migration/postgresql

# 2. Restore Firestore (if needed)
node scripts/migration/restore-firestore.cjs

# 3. Redeploy current version
npm run build:prod
firebase deploy --only hosting

# Time: <5 minutes
```

---

## Success Metrics

Track these in `MIGRATION_PROGRESS.md`:

✅ **Data Migration**
- 270 students migrated ✓
- 0 data loss ✓
- All relationships intact ✓

✅ **Bugs Eliminated**
- No student count 0 ✓
- No role corruption ✓
- No permission errors ✓
- No MAPEH issues ✓

✅ **Performance**
- Dashboard: <1s (was 3.2s) ✓
- Reports: <5s (was 45s) ✓
- Cost: <$30/mo (was $282/mo) ✓

---

## Contact Info

**Migration Lead**: Mark Gil Dotillos  
**Timeline**: Nov 18 - Dec 9, 2025 (3 weeks)  
**Status Updates**: Daily in `MIGRATION_PROGRESS.md`  
**Rollback Authority**: TBD

---

## Next Actions (Priority)

1. **TODAY (Day 1)**: Rest! You've completed planning.
2. **TOMORROW (Day 2)**: Create Supabase project
3. **Day 3**: Export Firestore data
4. **Day 4**: Transform data
5. **Day 5**: Import to PostgreSQL

---

**Last Updated**: November 18, 2025  
**Version**: 1.0  
**Status**: Day 1 Complete ✅
