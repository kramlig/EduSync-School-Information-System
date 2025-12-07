-- ============================================================================
-- Update Firebase UIDs for Mati Division Users
-- Run this AFTER creating Firebase Auth accounts
-- ============================================================================
-- 
-- STEPS TO USE THIS FILE:
-- 
-- 1. Create Firebase Auth accounts for each division user:
--    - Go to Firebase Console → Authentication → Users → Add User
--    - Create accounts with these emails and password "division123":
--      * div.admin@mati.deped.gov.ph
--      * supervisor@mati.deped.gov.ph
--      * psds.central@mati.deped.gov.ph
--      * psds.north@mati.deped.gov.ph
--      * psds.south@mati.deped.gov.ph
--      * psds.east@mati.deped.gov.ph
--      * data.manager@mati.deped.gov.ph
--      * eps.math@mati.deped.gov.ph
--
-- 2. Copy the Firebase UID for each user (shown in Firebase Console)
--
-- 3. Replace the placeholder UIDs below with the real ones
--
-- 4. Run this SQL in Supabase Dashboard
--
-- ============================================================================

-- Division Admin
UPDATE division_users 
SET firebase_uid = 'PASTE_REAL_UID_HERE'
WHERE email = 'div.admin@mati.deped.gov.ph';

-- Division Supervisor
UPDATE division_users 
SET firebase_uid = 'PASTE_REAL_UID_HERE'
WHERE email = 'supervisor@mati.deped.gov.ph';

-- PSDS Central
UPDATE division_users 
SET firebase_uid = 'PASTE_REAL_UID_HERE'
WHERE email = 'psds.central@mati.deped.gov.ph';

-- PSDS North
UPDATE division_users 
SET firebase_uid = 'PASTE_REAL_UID_HERE'
WHERE email = 'psds.north@mati.deped.gov.ph';

-- PSDS South
UPDATE division_users 
SET firebase_uid = 'PASTE_REAL_UID_HERE'
WHERE email = 'psds.south@mati.deped.gov.ph';

-- PSDS East
UPDATE division_users 
SET firebase_uid = 'PASTE_REAL_UID_HERE'
WHERE email = 'psds.east@mati.deped.gov.ph';

-- Data Manager
UPDATE division_users 
SET firebase_uid = 'PASTE_REAL_UID_HERE'
WHERE email = 'data.manager@mati.deped.gov.ph';

-- EPS Math
UPDATE division_users 
SET firebase_uid = 'PASTE_REAL_UID_HERE'
WHERE email = 'eps.math@mati.deped.gov.ph';

-- ============================================================================
-- VERIFICATION: Check that all UIDs are updated
-- ============================================================================
SELECT 
  email,
  name,
  role,
  firebase_uid,
  CASE 
    WHEN firebase_uid LIKE 'PLACEHOLDER%' THEN '❌ NOT UPDATED'
    ELSE '✅ Updated'
  END as status
FROM division_users
WHERE email LIKE '%@mati.deped.gov.ph'
ORDER BY role, name;

-- ============================================================================
-- QUICK TEST: Use your current school user's Firebase UID temporarily
-- ============================================================================
-- If you want to test RIGHT NOW before creating Firebase accounts:
-- 
-- 1. Find your current Firebase UID:
--    - Open browser console
--    - Run: firebase.auth().currentUser.uid
--    - Copy the UID
--
-- 2. Temporarily update ONE division user with your UID:
--    UPDATE division_users 
--    SET firebase_uid = 'YOUR_CURRENT_FIREBASE_UID'
--    WHERE email = 'div.admin@mati.deped.gov.ph';
--
-- 3. Now you can test division access by logging in with your school account
--    (it will be detected as a division user)
--
-- 4. Remember to revert this later when you create proper Firebase accounts!
--
-- ============================================================================
