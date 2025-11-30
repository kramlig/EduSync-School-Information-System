# District & TIN Column Migration - November 27, 2025

## Summary
Added `district` and `tin` as dedicated columns to the `schools` table instead of storing them in the `settings` JSONB field.

## Why This Change?

### 1. **Schema Inconsistency**
- Production schema (`supabase-schema.sql`) had NO `district` column
- Seed script (`seed-teachers.sql`) expected `district` column to exist
- Code was using workarounds: `school.settings?.district`

### 2. **DepEd Compliance**
Philippine DepEd organizational hierarchy:
```
Region → Division → District → School
```
District is a fundamental organizational unit required for:
- Official forms (SF1, SF2, Form 137, Form 138)
- BIR-compliant receipts
- DepEd reporting and submissions

### 3. **Performance & Data Integrity**
- **JSONB extraction is slow**: `settings->>'district'` requires JSON parsing
- **No validation**: JSONB allows typos and inconsistent data
- **Direct column is fast**: Indexed VARCHAR enables efficient queries
- **Better for reporting**: GROUP BY district, filter by district operations

### 4. **BIR Receipt Requirements**
Official receipts must display:
- School Name
- Complete Address
- **TIN (Tax Identification Number)**
- Region/Division/District hierarchy

## Changes Made

### Files Modified

#### 1. **Migration Script** (NEW)
- `scripts/migration/add-district-tin-columns.sql`
  - Adds `district VARCHAR(100)` column
  - Adds `tin VARCHAR(20)` column
  - Migrates existing data from `settings` JSONB
  - Creates index: `idx_schools_district`
  - Includes verification queries

#### 2. **Schema Definition**
- `scripts/migration/supabase-schema.sql`
  - Added `district VARCHAR(100)` after `region`
  - Added `tin VARCHAR(20)` after `principal_name`
  - Added index for district queries
  - Added inline comments explaining purpose

#### 3. **Application Code**
- `components/ReceiptManagement.tsx` (2 changes)
  - Changed query: `select('...district, tin...')` instead of `select('...settings')`
  - Changed usage: `school.district` instead of `school.settings?.district`
  - Changed usage: `school.tin` instead of `school.settings?.tin`

- `components/forms/Form138/Form138Dashboard.tsx` (1 change)
  - Added `district` to SELECT query
  - Set `district: schoolData.district` in settings object

- `components/forms/Form138/Form138Print.tsx` (No change needed)
  - Already expecting `schoolData.district` as direct column
  - Code was written correctly from the start

## Migration Steps

### For You to Execute:

1. **Run Migration in Supabase SQL Editor**:
   ```sql
   -- Copy and paste contents of:
   scripts/migration/add-district-tin-columns.sql
   ```

2. **Verify Migration**:
   ```sql
   -- Check columns added
   \d schools
   
   -- View migrated data
   SELECT id, name, region, division, district, tin 
   FROM schools 
   WHERE deleted_at IS NULL;
   ```

3. **Test Application**:
   - Print a receipt → verify district and TIN display
   - Generate Form 138 → verify district appears
   - Check Settings page → district field should work

4. **Optional: Update Seed Data**:
   If you have existing schools without district/TIN, update them:
   ```sql
   UPDATE schools 
   SET 
     district = 'Your District Name',
     tin = '123-456-789-000'
   WHERE id = 'your-school-id';
   ```

## Rollback Plan (if needed)

If something goes wrong:
```sql
-- Remove columns
ALTER TABLE schools DROP COLUMN IF EXISTS district;
ALTER TABLE schools DROP COLUMN IF EXISTS tin;

-- Restore code to use settings JSONB (revert Git commits)
git revert HEAD
```

## Testing Checklist

- [ ] Migration script runs without errors
- [ ] `district` and `tin` columns visible in schema
- [ ] Existing data migrated from JSONB to columns
- [ ] Receipt printing shows district and TIN correctly
- [ ] Form 138 displays district in header
- [ ] No TypeScript errors in application
- [ ] Settings page loads without errors

## Notes

- **Backward Compatible**: Old JSONB data remains intact (optional cleanup commented out)
- **Indexed**: `idx_schools_district` for fast filtering/grouping
- **Nullable**: Both columns allow NULL for gradual data entry
- **Future-Ready**: Supports multi-district reporting and BIR audit requirements
