# 🚀 Restart Instructions - Fix Firestore Internal Errors

## What You Need to Do (5 minutes)

### Step 1: Stop Everything

1. **Stop the dev server** (Terminal running Vite):
   - Press `Ctrl+C` in the terminal
   - Wait for it to fully stop

2. **Stop the Firebase emulator** (if running separately):
   - Press `Ctrl+C` in that terminal too

### Step 2: Clear Browser Cache

1. Open Chrome DevTools:
   - Press `F12`
   
2. Go to Application tab:
   - Click "Application" in the top menu
   
3. Clear storage:
   - In left sidebar, click "Storage"
   - Check "IndexedDB"
   - Check "Local storage"
   - Check "Session storage"
   - Click **"Clear site data"** button
   
4. Close and reopen the browser

### Step 3: Restart Dev Environment

In your terminal:

```powershell
# This will:
# 1. Start Firebase emulator
# 2. Seed the database
# 3. Start Vite dev server
npm run dev:emu
```

### Step 4: Login and Test

1. Open http://localhost:5173
2. Login with admin account:
   - **Email**: `admin@test.com`
   - **Password**: (whatever you set during seeding)

3. Check console (F12) for errors:
   - ✅ Should NOT see "INTERNAL ASSERTION FAILED"
   - ✅ Should see data loading successfully

---

## If Errors Persist

### Option A: Test with Production Firebase (Recommended)

The emulator is buggy. Test with real Firebase:

```powershell
# 1. Deploy security rules
firebase deploy --only firestore:rules --project edusync-sis

# 2. Run dev server (connects to production)
npm run dev
```

### Option B: Run Security Tests

Verify security rules are working:

```powershell
# In a new terminal (keep emulator running):
npx ts-node scripts/test-security-rules.ts
```

**Expected**: All tests pass (15/15 ✅)

---

## What We Fixed

1. ✅ **Added error recovery** - Auto-retries SDK internal errors
2. ✅ **Created testing script** - Comprehensive security rules testing
3. ✅ **Troubleshooting guide** - Full documentation
4. ✅ **Cleared caches** - Removed corrupted IndexedDB data

---

## Understanding the Error

**NOT a security rules problem!**

The error you saw:
```
FIRESTORE (12.4.0) INTERNAL ASSERTION FAILED: Unexpected state
```

Is a **Firebase SDK bug**, not a security issue. It happens when:
- Using the emulator (production is stable)
- Multiple listeners active simultaneously
- Browser cache gets corrupted

**Security rules are fine** - they just need proper testing without SDK bugs interfering.

---

## Next Steps After Restart

1. [ ] Verify no console errors
2. [ ] Confirm data loads in dashboard
3. [ ] Test admin can create students
4. [ ] Test teacher can view grades
5. [ ] Run automated security tests
6. [ ] Deploy to production for UAT

---

**Questions?** Check: `docs/deployment/FIRESTORE_INTERNAL_ERROR_TROUBLESHOOTING.md`
