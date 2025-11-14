# Auto-Onboarding Disabled - January 2025

## Critical Issue Resolved

The auto-onboarding Cloud Function has been **DISABLED** due to fundamental design flaws causing recurring permission errors.

## The Problem

### What Was Happening
1. Script creates new user account with correct role (e.g., `role: 'teacher'`)
2. Firebase Auth onCreate trigger fires automatically
3. `autoOnboarding.js` function runs
4. Function calls `determineRole(email)` which checks email patterns
5. Email doesn't match patterns (real teachers use `maria.cruz@gmail.com`, not `maria.cruz@teacher.local`)
6. Function defaults to `role: 'parent'`
7. `setCustomUserClaims()` overwrites the correct role with `'parent'`
8. User gets permission denied errors everywhere

### Evidence
```
Custom Claims: {
  role: 'parent',           ❌ WRONG! Should be 'teacher'
  assignedBy: 'system-auto' ⚠️ Proves Cloud Function did this
}
```

### Root Cause
**Email pattern detection doesn't work for real users.**

The function checked for patterns like:
- `teacher@`, `teacher-`, `@teacher.`
- `faculty@`, `staff@`
- `student@`, `student-`, `@student.`

But real users have emails like:
- ✅ `maria.cruz@gmail.com` (real teacher)
- ✅ `juan.santos@school.edu` (real teacher)
- ❌ `maria.cruz@teacher.local` (only works for demo accounts)

## The Solution

### What We Did
1. **Commented out entire `exports.onUserCreated` function** in `functions/src/autoOnboarding.js`
2. Added clear documentation explaining why it's disabled
3. Deployed to production to prevent future auto-overwriting

### File Changes
- **functions/src/autoOnboarding.js**: Entire onCreate trigger commented out (lines 24-205)
- **functions/src/utils/roleDetection.js**: Email patterns remain but function isn't called anymore

## Current State

### Demo Accounts (All Working)
- **5 Students**: `juan.delacruz@student.local`, `maria.santos@student.local`, etc.
  - Password: `student123`
  - Custom claims: ✅ `role: 'student'` (manually fixed)
  
- **3 Teachers**: `maria.cruz@teacher.local`, `juan.santos@teacher.local`, `ana.reyes@teacher.local`
  - Password: `teacher123`
  - Custom claims: ✅ `role: 'teacher'` (manually fixed)
  
- **10 Parents**: `parent1-10@edusync-demo.ph`
  - Password: `parent123`
  - Custom claims: ✅ `role: 'parent'`

### Manual Role Assignment
Roles are now assigned through:
1. **Setup Scripts**: `create-teacher-demo-accounts.cjs`, `cleanup-students-demo.cjs`
2. **HTTP Callable Function**: `assignUserRole` (requires admin authentication)
3. **Future**: Admin UI for role management (not yet built)

## Next Steps

### Immediate Actions Required
1. **Log out all demo accounts** (browser caches old tokens)
2. **Clear browser cache** (Ctrl+Shift+Del)
3. **Log back in** to get fresh tokens with correct custom claims
4. **Verify no permission errors** in browser console

### Testing Checklist
- [ ] Student can log in and see their grades
- [ ] Teacher can log in and see their classes
- [ ] Parent can log in and see their children
- [ ] No "Missing required permissions" errors in console
- [ ] onCreate function no longer overwrites roles (test by creating new account)

### Long-term Improvements
1. **Remove auto-detection code entirely** (delete `roleDetection.js` and dead code)
2. **Build admin UI** for role assignment (currently only via scripts)
3. **Add role change audit trail** (track who changed what role and when)
4. **Email verification** for institutional domains (verify `@school.edu` before allowing teacher role)
5. **Onboarding workflow** (new users request role, admin approves)

## Alternative Approaches for Production

### Option 1: SSO Integration (Recommended)
Use Google Workspace or Microsoft AD to get role from organizational data:
```javascript
// Get role from LDAP/AD groups
if (user.groups.includes('Teachers')) {
  role = 'teacher';
} else if (user.groups.includes('Students')) {
  role = 'student';
}
```

### Option 2: Email Domain Verification
Verify institutional email domains:
```javascript
// Only allow teachers from verified school domains
if (email.endsWith('@ourschool.edu')) {
  // Still requires admin approval before setting role
  role = 'pending-teacher';
}
```

### Option 3: Invitation System
Admins invite users with pre-assigned roles:
```javascript
// Admin generates invitation link with role embedded
const inviteLink = generateInvite({ 
  email: 'maria.cruz@gmail.com',
  role: 'teacher'
});
```

### Option 4: Database Lookup (Current Workaround)
Check if user document exists before auto-assigning:
```javascript
// Check if teacher document exists
const teacherDoc = await db.collection('teachers')
  .where('email', '==', email)
  .limit(1)
  .get();

if (!teacherDoc.empty) {
  role = 'teacher'; // Only assign if pre-existing document
}
```

## Scripts for Reference

### Create New Teacher Account
```bash
node scripts/create-teacher-demo-accounts.cjs
```

### Fix Role After Creation
```bash
node scripts/fix-teacher-roles.cjs
```

### Check Current Custom Claims
```bash
node scripts/check-teacher-claims.cjs
```

## Important Notes

1. **Token Refresh**: After changing custom claims, users MUST log out and back in
2. **Browser Cache**: Old tokens cached in browser will still have wrong role
3. **onCreate Disabled**: New users will NOT get auto-assigned any role
4. **Manual Assignment**: Roles must be set explicitly via scripts or admin UI

## Related Issues

- [CRITICAL_LOGIN_FIX_NOV_10_2025.md](CRITICAL_LOGIN_FIX_NOV_10_2025.md)
- Permission errors when accessing collections
- Student/teacher views showing wrong data
- Auto-detection overwriting manually-set roles

## Contact

If you encounter role assignment issues:
1. Check custom claims: `firebase auth:export --project edusync-sis`
2. Verify onCreate function is still disabled
3. Use manual assignUserRole function
4. Consider implementing SSO for automatic role detection

---

**Status**: ✅ RESOLVED - Auto-onboarding disabled, demo accounts working  
**Last Updated**: January 18, 2025  
**Deployed**: Production (edusync-sis)
