# Phase 1: Teaching Assignments Migration - Instructions
**Date:** December 7, 2025  
**Strategy:** Dual-Mode Migration (ZERO RISK)  
**Duration:** 10-15 minutes

---

## ✅ What This Does

**Creates new database tables:**
- `teaching_assignments` - Tracks teacher subject assignments, hours, advisory roles
- `ancillary_responsibilities` - Tracks additional duties (coordinators, etc.)

**What it DOESN'T do:**
- ❌ Does NOT modify existing `teachers.assignments` JSONB column
- ❌ Does NOT change ANY existing code
- ❌ Does NOT affect ANY running modules
- ❌ ZERO risk to production

**Result:**
- ✅ SF7 Personnel Report will work (uses new tables)
- ✅ All other modules keep working exactly as before (use JSONB)
- ✅ Ready for Phase 2 gradual migration

---

## 🎯 Step-by-Step Instructions

### **Option A: Run via Supabase Dashboard (Recommended)**

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `EduSync School Information System`

2. **Navigate to SQL Editor**
   - Left sidebar → Click "SQL Editor"
   - Click "New Query"

3. **Copy Migration Scripts (Run in Order)**
   
   **First: Add SF7 fields to teachers table**
   - Open file: `supabase/migrations/20241207_add_sf7_fields_to_teachers.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run" button (or press Ctrl+Enter)
   - Wait for green checkmark ✅

   **Second: Create teaching assignments tables**
   - Open file: `supabase/migrations/20241207_create_personnel_assignments_tables.sql`
   - Copy entire contents (168 lines)
   - Paste into SQL Editor (clear previous query first)
   - Click "Run" button (or press Ctrl+Enter)
   - Wait 5-10 seconds for execution

4. **Verify Success**
   - Look for green checkmark: ✅ "Success. No rows returned"
   - If errors appear, check error message and notify developer

5. **Validate Tables Created**
   - Run this validation query:
   ```sql
   SELECT table_name, 
          (SELECT COUNT(*) FROM information_schema.columns 
           WHERE columns.table_name = tables.table_name) AS column_count
   FROM information_schema.tables
   WHERE table_name IN ('teaching_assignments', 'ancillary_responsibilities')
   ORDER BY table_name;
   ```
   - Expected result: 2 rows showing both tables

---

### **Option B: Run via Local Supabase CLI** (If using local development)

1. **Open PowerShell Terminal**
   - In VS Code: Terminal → New Terminal

2. **Navigate to Project Root**
   ```powershell
   cd "C:\Users\Mark Gil Dotillos\Workspaces\EduSyncSIS\EduSync-School-Information-System"
   ```

3. **Run Migrations (in order)**
   ```powershell
   # First: Add SF7 fields to teachers table
   psql $env:DATABASE_URL -f "supabase/migrations/20241207_add_sf7_fields_to_teachers.sql"
   
   # Second: Create teaching assignments tables
   psql $env:DATABASE_URL -f "supabase/migrations/20241207_create_personnel_assignments_tables.sql"
   ```

4. **Verify Success**
   ```powershell
   # Check if tables exist
   psql $env:DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('teaching_assignments', 'ancillary_responsibilities');"
   
   # Check if teachers fields added
   psql $env:DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'teachers' AND column_name IN ('first_name', 'last_name', 'position', 'employment_status');"
   ```

---

## 🔍 Validation Checklist

After running the migration, verify:

### ✅ **1. Tables Created**
```sql
-- Run this query
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('teaching_assignments', 'ancillary_responsibilities');
```
**Expected:** 2 rows returned

---

### ✅ **2. Indexes Created**
```sql
-- Run this query
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('teaching_assignments', 'ancillary_responsibilities')
ORDER BY tablename, indexname;
```
**Expected:** 13 indexes total
- 9 for `teaching_assignments`
- 4 for `ancillary_responsibilities`

---

### ✅ **3. RLS Policies Enabled**
```sql
-- Run this query
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('teaching_assignments', 'ancillary_responsibilities')
ORDER BY tablename, policyname;
```
**Expected:** 8 policies (4 per table: SELECT, INSERT, UPDATE, DELETE)

---

### ✅ **4. Triggers Created**
```sql
-- Run this query
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN ('teaching_assignments', 'ancillary_responsibilities');
```
**Expected:** 2 triggers (one per table for `updated_at`)

---

### ✅ **5. Tables Are Empty**
```sql
-- Run this query
SELECT 
  (SELECT COUNT(*) FROM teaching_assignments) AS teaching_count,
  (SELECT COUNT(*) FROM ancillary_responsibilities) AS ancillary_count;
```
**Expected:** Both counts = 0 (tables are empty, ready for data)

---

### ✅ **6. Test SF7 Dashboard**

1. Start development server:
   ```powershell
   npm run dev:emu
   ```

2. Navigate to SF7 Dashboard:
   - Go to: http://localhost:5173/reports/sf7
   - Or: Click "School Forms" → Click "SF7 - School Personnel Assignment List"

3. **Expected Result:**
   - ✅ Page loads without errors
   - ✅ Shows "No personnel found" message (table is empty)
   - ✅ No console errors

4. **If errors occur:**
   - Check browser console (F12)
   - Check terminal for backend errors
   - Verify migration completed successfully

---

## 🎉 Success Indicators

You'll know Phase 1 succeeded when:

1. ✅ Migration script ran without errors
2. ✅ All validation queries pass (6 checkpoints above)
3. ✅ SF7 Dashboard loads (shows empty state)
4. ✅ Existing modules still work (Teachers, Gradebook, Students)
5. ✅ No errors in browser console
6. ✅ No errors in server terminal

---

## ⚠️ Troubleshooting

### **Error: "relation already exists"**
```
ERROR: relation "teaching_assignments" already exists
```
**Solution:** Tables already created! Skip to validation step.

---

### **Error: "permission denied"**
```
ERROR: permission denied for schema public
```
**Solution:** 
1. Check you're logged into correct Supabase project
2. Verify you have admin/owner access
3. Try running via Supabase Dashboard instead of CLI

---

### **Error: "current_setting(...) not found"**
```
ERROR: unrecognized configuration parameter "app.current_school_id"
```
**Solution:** This is normal for RLS policies. Policies will work when app sets this parameter at runtime. Ignore this error during migration.

---

### **SF7 Dashboard shows 500 error**
**Solution:**
1. Check if `supabase` import path is correct in `sf7PersonnelService.ts`
2. Verify tables created: Run validation query #1
3. Check browser console for specific error message
4. Restart dev server: `npm run dev:emu`

---

## 📋 Next Steps After Phase 1

**Immediate (Today):**
- ✅ Verify all checks pass
- ✅ Confirm SF7 Dashboard loads
- ✅ Test existing modules still work
- ✅ Mark Phase 1 complete ✅

**Phase 2 Planning (Next Sprint):**
- 📅 Schedule: Week of December 9-13, 2025
- 🎯 Goal: Migrate JSONB data to new tables
- 📝 Tasks:
  1. Create data migration script
  2. Migrate existing assignments to `teaching_assignments`
  3. Set `is_advisory` based on `sections.adviserId`
  4. Calculate default `hours_per_week` values
  5. Validate data integrity

**Phase 3 (Future):**
- Gradually migrate modules to use new tables
- Add UI for managing teaching assignments with hours
- Eventually remove JSONB column

---

## 📞 Support

If you encounter issues:

1. **Check validation queries** - Most issues visible in checks 1-6
2. **Review error messages** - Copy exact error text
3. **Check migration script** - Ensure you copied all 168 lines
4. **Restart services** - Stop and restart dev server

---

## ✅ Completion Checklist

Mark complete when:

- [ ] Migration script executed successfully
- [ ] All 6 validation queries pass
- [ ] SF7 Dashboard loads (empty state OK)
- [ ] Existing Teachers module works
- [ ] Existing Gradebook works
- [ ] Existing Students list works
- [ ] No console errors
- [ ] This document updated with completion date

**Completed By:** _________________  
**Completion Date:** _________________  
**Notes:** _________________________________________________

---

**Status:** 🟡 PENDING → Change to ✅ COMPLETE after validation
