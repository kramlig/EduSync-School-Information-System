# 🔄 Security Rules Transition Mode

**Status**: ⚠️ **TRANSITION MODE ACTIVE**  
**Date**: November 6, 2025  
**Issue**: Users without custom claims cause "Property role is undefined" errors

---

## 🎯 What This Is

The security rules are now in **TRANSITION MODE** - they support both:
1. ✅ Users WITH custom claims (roles) - Proper role-based access
2. ✅ Users WITHOUT custom claims - Temporary staff-level access (legacy)

This allows the system to work **immediately** while you gradually assign roles to users.

---

## ✅ Current State

### What's Working Now
- ✅ **No more "Property role is undefined" errors**
- ✅ **Authenticated users can access the system** (even without roles)
- ✅ **Legacy users** (without roles) get staff-level permissions
- ✅ **Smooth transition** - no downtime required

### How It Works
```javascript
// Helper function checks if user has a role
function hasRole() {
  return isAuthenticated() && request.auth.token.role != null;
}

// Legacy users are those without roles
function isLegacyUser() {
  return isAuthenticated() && !hasRole();
}

// All rules now support: isStaff() || isLegacyUser()
```

---

## 🚨 Security Status

### Current Security Level: **MEDIUM** ⚠️

**Why?**
- Users without roles have staff-level access (can read/write most data)
- This is NOT production-secure for multi-user schools
- Safe for: Development, testing, single-admin schools
- NOT safe for: Production with parents/teachers without proper role assignment

---

## 📋 Migration Path

### Option 1: Quick Fix (5 minutes) - For Testing/Development

**Keep transition mode active** - Works for:
- ✅ Local development
- ✅ Emulator testing
- ✅ Single-user demos
- ✅ Internal testing

**No action needed** - System works as-is!

---

### Option 2: Proper Migration (30 minutes) - For Production

**Assign roles to all users** - Required for:
- 🔴 Production deployment
- 🔴 Schools with multiple staff
- 🔴 Parent portal access
- 🔴 Multi-user environments

#### Step 1: Get Service Account Key (5 min)
1. Go to [Firebase Console](https://console.firebase.google.com/project/edusync-sis/settings/serviceaccounts/adminsdk)
2. Click "Generate New Private Key"
3. Save as `serviceAccountKey.json`

#### Step 2: Assign Roles (20 min)

**For existing emulator users**:
```powershell
# Set role for your test admin
node scripts/setup-custom-claims.cjs `
  --serviceAccount=./serviceAccountKey.json `
  --email=admin@school.com `
  --role=admin

# Set roles for other test users
node scripts/setup-custom-claims.cjs `
  --email=teacher@school.com `
  --role=teacher

node scripts/setup-custom-claims.cjs `
  --email=parent@school.com `
  --role=parent
```

**For batch users** (create `school-users.json`):
```json
[
  { "email": "admin@school.com", "role": "admin" },
  { "email": "teacher1@school.com", "role": "teacher" },
  { "email": "parent1@school.com", "role": "parent" }
]
```

Then run:
```powershell
node scripts/setup-custom-claims.cjs `
  --serviceAccount=./serviceAccountKey.json `
  --batch=school-users.json
```

#### Step 3: Verify (5 min)
```powershell
# List all users and their roles
node scripts/setup-custom-claims.cjs `
  --serviceAccount=./serviceAccountKey.json `
  --list
```

**Expected output**:
```
┌─────────┬──────────────┬────────────────────────┬────────────┬──────────────┐
│ (index) │     uid      │         email          │    role    │   schoolId   │
├─────────┼──────────────┼────────────────────────┼────────────┼──────────────┤
│    0    │ 'abc123'     │ 'admin@school.com'     │  'admin'   │ 'school-001' │
│    1    │ 'def456'     │ 'teacher@school.com'   │ 'teacher'  │ 'school-001' │
│    2    │ 'ghi789'     │ 'parent@school.com'    │ 'parent'   │ 'school-001' │
└─────────┴──────────────┴────────────────────────┴────────────┴──────────────┘
```

#### Step 4: Remove Transition Mode (Optional)

**After ALL users have roles**, remove legacy access:

1. Edit `firestore.rules`
2. Remove `|| isLegacyUser()` from all rules
3. Remove the `isLegacyUser()` function
4. Deploy: `firebase deploy --only firestore:rules`

---

## 🔍 How to Check Your Current Mode

### In Browser Console:
```javascript
// Check if current user has a role
firebase.auth().currentUser.getIdTokenResult()
  .then(token => {
    if (token.claims.role) {
      console.log('✅ User has role:', token.claims.role);
    } else {
      console.log('⚠️ User is legacy (no role)');
    }
  });
```

### Via Script:
```powershell
node scripts/setup-custom-claims.cjs --list
```

---

## ⚠️ Important Reminders

### 1. Users Must Re-Login
After assigning roles, users MUST log out and log back in for changes to take effect!

```javascript
// Force token refresh (or just log out/in)
firebase.auth().currentUser.getIdToken(true);
```

### 2. Emulator vs Production
- **Emulator**: Service account works locally
- **Production**: Must deploy rules first, then assign roles

### 3. Don't Commit Service Account
```gitignore
serviceAccountKey.json
*-serviceAccount.json
```

Already in `.gitignore` - don't remove!

---

## 🎯 Recommended Timeline

### For Development/Testing
- **Now**: ✅ Keep transition mode active
- **When ready**: Assign roles gradually
- **Before UAT**: All users should have proper roles

### For Production Deployment
- **Before deployment**: ✅ ALL users MUST have roles
- **During deployment**: Remove transition mode
- **After deployment**: Verify with strict rules

---

## 📊 Transition Status

| User Type | Current Access | Target Access | Status |
|-----------|----------------|---------------|--------|
| **Without Role** | Staff-level (legacy) | Denied | ⚠️ Temporary |
| **Admin** | Full access | Full access | ✅ Ready |
| **Teacher** | Limited access | Limited access | ✅ Ready |
| **Parent** | View-only | View-only | ✅ Ready |

---

## 🚀 Next Steps

### For Immediate Testing
1. ✅ **No action needed** - System works now!
2. ✅ Test all features with current setup
3. ✅ Verify no permission errors

### For Production Preparation
1. ⏳ **Assign roles** to all users
2. ⏳ **Test with roles** (log out/in after assigning)
3. ⏳ **Remove transition mode** from rules
4. ⏳ **Deploy strict rules** to production

---

## 📞 Support

### Common Issues

**Issue**: Still getting "Property role is undefined"
**Solution**: Rules not deployed yet. Run:
```powershell
firebase deploy --only firestore:rules --project edusync-sis
```

**Issue**: User has role but getting denied
**Solution**: User needs to log out and log back in

**Issue**: Can't assign roles
**Solution**: Check service account key path and permissions

---

**Status**: ✅ **TRANSITION MODE WORKING**  
**Next Action**: Choose Option 1 (keep as-is) or Option 2 (assign roles)  
**Production Ready**: ⚠️ Only with proper role assignment
