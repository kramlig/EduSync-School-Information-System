# ✅ Custom Claims Fix - Manual Testing Guide

## ⚠️ CRITICAL: Clear Your Browser Session First!

Before testing, you MUST clear your old session because JWT tokens are cached:

### Step 1: Log Out (if logged in)
1. Click your profile/settings
2. Click "Log Out" or "Sign Out"

### Step 2: Clear Browser Cache
**Press `Ctrl + Shift + Delete`** and:
- ✅ Check "Cookies and other site data"  
- ✅ Check "Cached images and files"
- ⏱️ Time range: "All time"
- 🔵 Click "Clear data"

### Step 3: Close and Reopen Browser
- Close ALL browser windows
- Reopen browser
- Navigate to: http://localhost:5173

---

## 🧪 Manual Test Checklist

### Test 1: Admin Login
- [ ] Go to http://localhost:5173
- [ ] Log in:
  - Email: `admin@edusync.local`
  - Password: `admin123`
- [ ] **Expected**: Dashboard loads successfully
- [ ] **Expected**: NO console errors about "Property role is undefined"
- [ ] **Expected**: Can navigate to all sections (Students, Teachers, Grades, Attendance)

### Test 2: Check Admin Custom Claims
1. Open browser DevTools (F12)
2. Go to Console tab
3. Paste this code:
   ```javascript
   const auth = await import('firebase/auth');
   const user = auth.getAuth().currentUser;
   const token = await user.getIdTokenResult();
   console.log('Custom Claims:', token.claims);
   ```
4. **Expected Output**:
   ```javascript
   {
     role: 'admin',
     schoolId: 'default',
     email: 'admin@edusync.local',
     ...
   }
   ```

### Test 3: Attendance Records (Your Original Issue)
- [ ] Navigate to "Attendance" section
- [ ] **Expected**: Attendance records load without errors
- [ ] **Expected**: NO errors in console:
  - ❌ "Property role is undefined on object. for 'list' @ L152"
  - ❌ "Property role is undefined on object. for 'list' @ L155"
  - ❌ "false for 'list' @ L463"

### Test 4: All Main Views
- [ ] Navigate to "Students" - should load without errors
- [ ] Navigate to "Teachers" - should load without errors
- [ ] Navigate to "Grades" - should load without errors
- [ ] Navigate to "Sections" - should load without errors

### Test 5: Parent Login
- [ ] Log out as admin
- [ ] Log in:
  - Email: `juan.garcia@test.com`
  - Password: `parent123`
- [ ] **Expected**: Parent portal loads
- [ ] **Expected**: Can only see linked student's data
- [ ] **Expected**: NO role errors in console

---

## 🐛 If You Still See Errors

### Symptom: "Property role is undefined" errors

**Cause**: Your browser is still using an old JWT token without custom claims.

**Solution**:
1. Open DevTools Console (F12)
2. Run this to check your token:
   ```javascript
   const auth = await import('firebase/auth');
   const user = auth.getAuth().currentUser;
   const token = await user.getIdTokenResult();
   console.log('Has role?', 'role' in token.claims);
   console.log('Role value:', token.claims.role);
   ```
3. If `Has role?` is `false`:
   - Your token doesn't have claims yet
   - **Log out completely**
   - **Clear browser cache** (Ctrl+Shift+Delete)
   - **Log back in**

### Symptom: Can't log in at all

**Check emulator is running**:
```powershell
netstat -ano | findstr "8086"  # Firestore
netstat -ano | findstr "9100"  # Auth
netstat -ano | findstr "5173"  # Vite dev server
```

If not running:
```powershell
npm run dev:emu
```

### Symptom: User not found

**Re-seed the database**:
```powershell
node scripts/setup-test-environment.cjs
```

---

##  ✅ Success Criteria

You'll know it's working when:

1. ✅ Admin logs in successfully without errors
2. ✅ Console shows NO "Property role is undefined" errors
3. ✅ Attendance page loads with data
4. ✅ All navigation works smoothly
5. ✅ DevTools console shows custom claims in token
6. ✅ Parent account also works without errors

---

## 📊 Verification Commands

### Check if users have claims in emulator:
```powershell
$env:FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9100'
$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8086'
node scripts/set-emulator-claims.cjs
```

Expected output:
```
✅ Set role 'admin' for admin@edusync.local (UID: admin123)
✅ Set role 'parent' for juan.garcia@test.com (UID: parent-0001)
```

### Re-seed everything fresh:
```powershell
node scripts/setup-test-environment.cjs
```

---

## 🎯 Quick Test (30 seconds)

1. Clear browser cache (Ctrl+Shift+Delete)
2. Go to http://localhost:5173
3. Login as admin@edusync.local / admin123
4. Open DevTools Console (F12)
5. Look for ANY red errors
6. Navigate to "Attendance"
7. Check console again

**✅ PASS**: No "Property role is undefined" errors  
**❌ FAIL**: Still seeing role errors → Follow "If You Still See Errors" section

---

## 📞 Need Help?

If manual testing still shows errors:

1. **Check Claims are Set**:
   ```javascript
   // In browser console after login
   const auth = await import('firebase/auth');
   const user = auth.getAuth().currentUser;
   if (user) {
     const token = await user.getIdTokenResult();
     console.table(token.claims);
   }
   ```

2. **Force Token Refresh**:
   ```javascript
   const auth = await import('firebase/auth');
   const user = auth.getAuth().currentUser;
   if (user) {
     await user.getIdToken(true); // Force refresh
     const token = await user.getIdTokenResult();
     console.log('Refreshed token claims:', token.claims);
   }
   ```

3. **Check Firestore Rules**:
   The rules expect `request.auth.token.role` to exist. If your token doesn't have it, the rules will fail with "Property role is undefined".

---

**Last Updated**: 2025-11-06
**Issue**: Attendance Records - Property role is undefined  
**Status**: FIXED - Users need to log out/in with fresh tokens
