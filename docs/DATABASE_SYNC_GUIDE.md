# Database Synchronization Guide

## Problem Identified

Your **Production** and **Emulator** databases have completely different structures and data:

### Emulator Database (Correct Structure) ✅
- **Source**: `scripts/seed-complete.cjs`
- **Triggered by**: `npm run dev:emu`
- **Contains**:
  - 1 admin account (`admin@edusync.local`)
  - 8 teacher accounts (`teacher-001` to `teacher-008`)
  - 26 sections covering K-12 (2 sections per grade level)
  - 640 realistic students with Filipino names
  - Proper teacher-section assignments
  - Real school data structure

### Production Database (Mock/Test Data) ❌
- **Source**: `scripts/sample-data/generate-bulk.cjs`
- **Contains**:
  - 5,000+ mock users (`mock-user-1`, `mock-user-2`, etc.)
  - Mock students with test data
  - No proper school structure
  - Designed for load testing, not production use
  - Missing proper teacher-section relationships

## Root Cause

The production database was seeded with **bulk mock test data** instead of the real school structure. This creates several issues:

1. ❌ No proper teacher accounts with roles
2. ❌ Sections not assigned to teachers
3. ❌ Mock data instead of realistic student information
4. ❌ Missing K-12 grade level coverage
5. ❌ No proper relationships between entities

## Solution Options

### Option 1: Sync Production with Emulator Structure (Recommended)

**Use the existing `seed-production.cjs` script** to replace production data with the same structure as emulator:

```powershell
# 1. Set up service account credentials
$env:GOOGLE_APPLICATION_CREDENTIALS="path\to\edusync-sis-serviceaccount.json"

# 2. Dry run first (shows what would change, no actual modifications)
node scripts/seed-production.cjs --dry-run

# 3. Review the output, then execute if everything looks good
node scripts/seed-production.cjs --confirm
```

**What this does**:
- ✅ Clears all mock data from production
- ✅ Creates 1 admin + 8 teacher accounts (Auth + Firestore)
- ✅ Creates 26 sections (K-12 coverage)
- ✅ Generates 640 students with realistic Filipino data
- ✅ Creates attendance and grade records
- ✅ Sets up proper teacher-section assignments

### Option 2: Export Emulator → Import to Production

If you want to preserve exact emulator data:

```powershell
# 1. Export emulator data
firebase emulators:export ./emulator-export --project edusync-local

# 2. Import to production (⚠️ requires service account)
$env:GOOGLE_APPLICATION_CREDENTIALS="path\to\serviceaccount.json"
firebase import ./emulator-export --project edusync-sis
```

### Option 3: Clear Production and Keep Empty

If you want to start fresh in production:

```powershell
# Run the clear script (create if doesn't exist)
node scripts/clear-production.cjs
```

## Recommended Action Plan

### Phase 1: Backup Current Production Data (Just in Case)

```powershell
# Export current production data before any changes
gcloud firestore export gs://edusync-sis-backup/$(Get-Date -Format "yyyy-MM-dd")
```

### Phase 2: Seed Production with Real Data

```powershell
# Set credentials
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\edusync-sis-firebase-adminsdk.json"

# Dry run to verify
node scripts/seed-production.cjs --dry-run

# Execute seeding
node scripts/seed-production.cjs --confirm
```

### Phase 3: Verify Production Data

1. Open Firebase Console → Firestore Database
2. Check collections:
   - `teachers` → Should have 8 teachers (not mock users)
   - `sections` → Should have 26 sections (K-12)
   - `students` → Should have ~640 students
   - `users` → Should have 9 users (1 admin + 8 teachers)

3. Test login in production:
   ```
   Email: admin@edusync.local
   Password: admin123
   ```

### Phase 4: Update Production Seed Script (if needed)

The current `seed-production.cjs` may need updating. Compare it with `seed-complete.cjs` to ensure they generate the same structure:

```bash
# Check if seed-production.cjs creates the same data as seed-complete.cjs
diff scripts/seed-complete.cjs scripts/seed-production.cjs
```

## Data Structure Comparison

### Emulator (Current - Correct)
```
users/
  ├── admin@edusync.local (admin)
  ├── teacher-001 (Roberto Santos)
  ├── teacher-002 (Maria Garcia)
  └── ... (8 teachers total)

teachers/
  ├── teacher-001 { role: 'teacher', email: 'roberto.santos@edusync.local' }
  ├── teacher-002 { role: 'teacher', email: 'maria.garcia@edusync.local' }
  └── ...

sections/
  ├── section-K-1 { gradeLevel: 'K', adviserId: 'teacher-001' }
  ├── section-1-1 { gradeLevel: 1, adviserId: 'teacher-002' }
  └── ... (26 sections, K-12)

students/
  ├── student-001 { firstName: 'Juan', lastName: 'Santos', sectionId: 'section-K-1' }
  └── ... (640 students)
```

### Production (Current - Incorrect)
```
users/
  ├── mock-user-1 { mock: true, role: 'student' }
  ├── mock-user-2 { mock: true, role: 'student' }
  └── ... (5000+ mock users)

teachers/
  └── (empty or minimal)

sections/
  └── (limited, grades 7-8 only)

students/
  └── (mock data, not realistic)
```

### Production (Target - After Sync)
```
Should match Emulator structure above ✅
```

## Prevention: Keep Databases in Sync

### For Future Changes

When you modify the seed script (`seed-complete.cjs`), also update `seed-production.cjs` to match:

1. Make changes to `scripts/seed-complete.cjs`
2. Test in emulator: `npm run dev:emu`
3. If everything works, copy the logic to `scripts/seed-production.cjs`
4. Document the change in `docs/SEED_DATA_REFINEMENT.md`

### Development Workflow

```bash
# Always use emulator for development
npm run dev:emu

# When ready for production testing
npm run dev:uat    # Uses production database in read-only mode

# For actual production deployment
npm run build:prod && npm run deploy:prod
```

## Troubleshooting

### Issue: Service Account Permissions Error

**Solution**: Ensure your service account has these roles:
- Cloud Datastore User
- Firebase Admin SDK Admin

### Issue: Production seed script fails

**Solution**: Check that `seed-production.cjs` uses the same logic as `seed-complete.cjs`. You may need to refactor it.

### Issue: Data partially seeded

**Solution**: Run the clear script first, then seed again:
```powershell
node scripts/clear-production.cjs
node scripts/seed-production.cjs --confirm
```

## Next Steps

1. **Immediate**: Run `seed-production.cjs --dry-run` to see what would change
2. **Plan**: Decide if you need to backup existing production data
3. **Execute**: Run `seed-production.cjs --confirm` to sync production with emulator
4. **Verify**: Test login and data structure in production
5. **Document**: Update team on the new production data structure

## Questions?

- **Q: Will this affect production users?**
  - A: Yes, this replaces ALL data. Backup first if you have real users.

- **Q: Can I run this multiple times?**
  - A: Yes, it's idempotent. Running twice will give the same result.

- **Q: How long does it take?**
  - A: ~2-5 minutes depending on network speed.

- **Q: Can I customize the data?**
  - A: Yes, edit `seed-production.cjs` before running.
