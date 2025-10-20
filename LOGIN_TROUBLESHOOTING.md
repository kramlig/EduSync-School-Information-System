# Can't Login with admin@school.edu - Solutions

## Problem
You're trying to login with `admin@school.edu` but it's not working.

## Root Cause
The login system checks for users in the Firestore database:
- **Staff login** → searches `teachers` collection
- **Student login** → searches `students` collection  
- **Parent login** → searches `parents` collection

The user `admin@school.edu` needs to exist in the `teachers` collection to login as Staff.

---

## ✅ Solution 1: Check What Users Exist (Quickest)

1. **Open the app:** http://127.0.0.1:5173/
2. **Open DevTools Console** (Press F12)
3. **Look for this log:**
   ```
   [AuthDebug] First 10 user emails: [...]
   ```
   This shows the available users you can login with.

4. **Use one of those emails** to login
   - Password: `password` (or any password - debug mode accepts all)

---

## ✅ Solution 2: Add Admin User to Production Database

### Option A: Using Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `edusync-sis`
3. Go to **Firestore Database**
4. Navigate to `teachers` collection
5. Click **Add document**
6. Set Document ID: `admin-001`
7. Add these fields:
   ```
   id: "admin-001"
   email: "admin@school.edu"
   name: "System Administrator"
   role: "admin"
   department: "Administration"
   subjects: ["All"]
   ```
8. Save the document

Now you can login with:
- Email: `admin@school.edu`
- Password: `password` (or any password in debug mode)
- Login Type: **Staff**

### Option B: Using Script (If you have service account key)

If you have the service account JSON key file:

```bash
node scripts/add-admin-user.cjs <path-to-service-account-key.json>
```

This will automatically add the admin user to your production database.

---

## ✅ Solution 3: Use Quick Login (Development)

The app has a "Quick Login" button for debugging:

1. Open http://127.0.0.1:5173/
2. Select login type: **Staff**
3. Look for the **"Quick Login (debug)"** button below the sign-in button
4. Click it to auto-login as the first available teacher

---

## 🔍 Why This Happens

Your production Firebase database might be empty or doesn't have the `admin@school.edu` user yet. The app needs actual user documents in Firestore to authenticate.

### Debug Mode Features:
- ✅ `allowAnyPassword = true` - Accepts any password
- ✅ `enableQuickLogin = true` - Shows quick login button
- ✅ Console logs show available users

---

## 📝 Quick Reference

### Current Setup:
- **Environment:** Production (edusync-sis)
- **Login Type:** Email-based (searches Firestore)
- **Debug Mode:** Enabled (accepts any password)

### Login Flow:
```
1. User enters email & password
2. App searches for email in:
   - Staff → teachers collection
   - Student → students collection
   - Parent → parents collection
3. If found → Login succeeds (any password in debug mode)
4. If not found → "Invalid email or password" error
```

---

## 🎯 Recommended Action

**Easiest approach:**

1. Open http://127.0.0.1:5173/
2. Press F12 to open Console
3. Look for available user emails in the logs
4. Use one of those emails to login

OR

Add `admin@school.edu` to your Firestore `teachers` collection via Firebase Console.

---

## 📞 Need Help?

If you're still having issues, check:
1. Is your dev server running? (http://127.0.0.1:5173/)
2. Are there any errors in the browser console?
3. What does the console show for available users?

The console log `[AuthDebug] First 10 user emails:` will tell you exactly which users you can login with!
