# Mati Division Setup Guide

This guide will help you complete the Division of City of Mati setup.

## Current Status

✅ **Completed:**
- Division seed SQL created (`database/seeds/seed_mati_city_division.sql`)
- 1 Division (Division of City of Mati)
- 4 Districts (Central, North, South, East)
- 72 Schools distributed across districts
- 8 Division user records in database

❌ **Pending:**
- Firebase Auth accounts for division users
- Firebase UID updates in database

---

## Issue: Infinite Redirect Loop

**Problem:** You're seeing "Prevented infinite redirect loop" because:
1. Division user records have placeholder Firebase UIDs (`PLACEHOLDER_MATI_ADMIN_UID`)
2. When you try to access `/division`, the system can't find your user in `division_users` table
3. `isDivisionUser` becomes `false`
4. Guard tries to redirect but fails

**Solution:** Create Firebase Auth accounts and update UIDs (see steps below)

---

## Step-by-Step Setup

### Step 1: Create Firebase Auth Accounts

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/
   - Select your project
   - Navigate to: **Authentication** → **Users**

2. **Create 8 Division User Accounts:**
   Click "Add User" for each account below:

   | Email | Password | Name |
   |-------|----------|------|
   | `div.admin@mati.deped.gov.ph` | `division123` | Dr. Amelia R. Gutierrez |
   | `supervisor@mati.deped.gov.ph` | `division123` | Dr. Carlos M. Villanueva |
   | `psds.central@mati.deped.gov.ph` | `division123` | Dr. Roberto P. Salazar |
   | `psds.north@mati.deped.gov.ph` | `division123` | Dr. Marissa L. Aquino |
   | `psds.south@mati.deped.gov.ph` | `division123` | Dr. Ferdinand T. Reyes |
   | `psds.east@mati.deped.gov.ph` | `division123` | Dr. Lourdes C. Magpantay |
   | `data.manager@mati.deped.gov.ph` | `division123` | Mrs. Regina T. Santos |
   | `eps.math@mati.deped.gov.ph` | `division123` | Dr. Jonathan P. Reyes |

3. **Copy Each Firebase UID:**
   - After creating each user, click on them
   - Copy the **User UID** (e.g., `a1b2c3d4e5f6...`)
   - Save it in a text file for the next step

---

### Step 2: Update Firebase UIDs in Database

1. **Open the Update SQL File:**
   - File: `database/seeds/update_mati_firebase_uids.sql`

2. **Replace Placeholders with Real UIDs:**
   ```sql
   -- Replace 'PASTE_REAL_UID_HERE' with the actual Firebase UID
   
   UPDATE division_users 
   SET firebase_uid = 'a1b2c3d4e5f6g7h8i9j0'  -- Paste real UID here
   WHERE email = 'div.admin@mati.deped.gov.ph';
   ```

3. **Run in Supabase Dashboard:**
   - Open Supabase Dashboard → SQL Editor
   - Paste the updated SQL
   - Execute

4. **Verify Updates:**
   Run the verification query:
   ```sql
   SELECT email, name, role, firebase_uid,
     CASE 
       WHEN firebase_uid LIKE 'PLACEHOLDER%' THEN '❌ NOT UPDATED'
       ELSE '✅ Updated'
     END as status
   FROM division_users
   WHERE email LIKE '%@mati.deped.gov.ph'
   ORDER BY role, name;
   ```

---

### Step 3: Test Division Access

1. **Login as Division User:**
   - Go to: `http://localhost:5173/division`
   - Use credentials:
     - Email: `div.admin@mati.deped.gov.ph`
     - Password: `division123`

2. **Verify Access:**
   - ✅ Should redirect to `/division/dashboard`
   - ✅ Should see 72 schools from Mati City
   - ✅ No infinite redirect loop error

3. **Test Other Division Users:**
   - Try logging in as PSDS users
   - Verify they only see schools in their assigned district

---

## Quick Test (Alternative)

If you want to test **RIGHT NOW** without creating 8 Firebase accounts:

1. **Get Your Current Firebase UID:**
   - Open browser console (F12)
   - Login to your school account
   - Run: `firebase.auth().currentUser.uid`
   - Copy the UID

2. **Temporarily Update One Division User:**
   ```sql
   UPDATE division_users 
   SET firebase_uid = 'YOUR_CURRENT_FIREBASE_UID_HERE'
   WHERE email = 'div.admin@mati.deped.gov.ph';
   ```

3. **Test:**
   - Refresh the page
   - Your school account will now be detected as a division user
   - You can access `/division` routes

4. **⚠️ Important:**
   - This is TEMPORARY for testing only
   - Revert this change when you create proper Firebase accounts
   - You'll be logged in as both a school user AND division user

---

## Troubleshooting

### Problem: Still seeing infinite redirect loop

**Check 1: Verify Firebase UID matches**
```sql
-- Get the firebase_uid from database
SELECT email, firebase_uid FROM division_users WHERE email = 'div.admin@mati.deped.gov.ph';

-- Compare with Firebase Console → Authentication → Users → User UID
```

**Check 2: Check browser console for errors**
- Look for `[DivisionContext]` log messages
- Check for 406 errors (RLS issues)
- Check for query errors

**Check 3: Verify division_users table has no RLS**
```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'division_users';

-- If rowsecurity = true, disable it:
ALTER TABLE division_users DISABLE ROW LEVEL SECURITY;
```

---

### Problem: 406 Not Acceptable Error

This means RLS (Row Level Security) is blocking the query.

**Solution:**
```sql
-- Disable RLS on division tables
ALTER TABLE division_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE divisions DISABLE ROW LEVEL SECURITY;
ALTER TABLE districts DISABLE ROW LEVEL SECURITY;

-- Grant read access to anon role
GRANT SELECT ON division_users TO anon;
GRANT SELECT ON divisions TO anon;
GRANT SELECT ON districts TO anon;
```

---

### Problem: Division user data not loading

**Check database connection:**
```sql
-- Verify division user exists
SELECT * FROM division_users WHERE email = 'div.admin@mati.deped.gov.ph';

-- Verify division exists
SELECT * FROM divisions WHERE code = 'DIV-MATI-CITY';

-- Verify schools exist
SELECT COUNT(*) FROM schools WHERE division_id IN (
  SELECT id FROM divisions WHERE code = 'DIV-MATI-CITY'
);
```

---

## Next Steps After Setup

Once division access is working:

1. **Create More Divisions:**
   - Use `seed_mati_city_division.sql` as a template
   - Create seeds for other divisions in Region XI

2. **Add Division-Specific Features:**
   - Dashboard with aggregated statistics
   - School comparison reports
   - District-level analytics
   - Bulk data management

3. **Security Hardening:**
   - Implement proper RLS policies
   - Add permission-based access control
   - Enable audit logging

---

## File Reference

- **Seed File:** `database/seeds/seed_mati_city_division.sql`
- **UID Update:** `database/seeds/update_mati_firebase_uids.sql`
- **Context:** `src/contexts/DivisionContext.tsx`
- **Guard:** `src/components/division/DivisionGuard.tsx`
- **Types:** `src/types/division.ts`

---

## Summary

**To fix the infinite redirect loop:**
1. Create Firebase Auth accounts for 8 Mati division users
2. Copy their Firebase UIDs
3. Update `division_users.firebase_uid` in database
4. Test login at `/division`

**Or for quick testing:**
- Use your current school user's Firebase UID temporarily
- Update one division_users record with it
- Test immediately

---

**Questions?** Check the console logs for `[DivisionContext]` and `[DivisionGuard]` messages to see what's happening.
