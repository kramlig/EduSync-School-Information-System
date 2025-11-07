# 🔒 Security Rules Deployment Guide

**Date**: November 6, 2025  
**Status**: ✅ SECURITY RULES IMPLEMENTED  
**Priority**: 🔴 CRITICAL - MUST DEPLOY BEFORE UAT

---

## 🎯 What Changed

### ✅ Comprehensive Role-Based Access Control Implemented

**Before** (INSECURE):
```javascript
match /{document=**} {
  allow read: if true;  // PUBLIC READ ACCESS
  allow write: if request.auth != null;  // ANY AUTHENTICATED USER CAN WRITE ANYWHERE
}
```

**After** (SECURE):
- ✅ 18+ collection-specific security rules
- ✅ Role-based access control (admin, principal, registrar, teacher, parent)
- ✅ Helper functions for role checking
- ✅ Parent data isolation (parents can only see their children's data)
- ✅ Whitelist approach - deny all unmatched collections
- ✅ Financial operations protected
- ✅ Enrollment system remains public-accessible

---

## 📋 Security Rules Summary

### Role Hierarchy

```
Admin (Full Access)
  └─ Can manage: Everything
  
Principal (School Leadership)
  └─ Can manage: Teachers, schedules, announcements, substitutes
  
Registrar (Data Management)
  └─ Can manage: Students, sections, enrollment, billing, Form 137
  
Teacher (Classroom)
  └─ Can manage: Grades, attendance, assignments, core values, lesson plans
  
Parent (View Only + Upload Proofs)
  └─ Can view: Own children's data only
  └─ Can upload: Payment proofs
  └─ Can update: Own profile (notification preferences)
```

---

## 🚀 Deployment Steps

### Step 1: Deploy Security Rules (5 minutes)

```powershell
# Deploy to production
firebase deploy --only firestore:rules --project edusync-sis

# Verify deployment
firebase firestore:rules:get --project edusync-sis
```

**Expected Output**:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/edusync-sis/overview
```

---

### Step 2: Set Up Custom Claims (10-30 minutes)

#### Option A: Single User Setup (Quick Test)

1. **Get your service account key** from Firebase Console:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save as `serviceAccountKey.json` (add to .gitignore!)

2. **Set role for admin user**:
```powershell
node scripts/setup-custom-claims.cjs `
  --serviceAccount=./serviceAccountKey.json `
  --email=admin@yourschool.com `
  --role=admin
```

3. **Verify**:
```powershell
node scripts/setup-custom-claims.cjs `
  --serviceAccount=./serviceAccountKey.json `
  --list
```

#### Option B: Batch User Setup (Production)

1. **Create batch file** `scripts/school-users.json`:
```json
[
  {
    "email": "admin@yourschool.com",
    "role": "admin",
    "schoolId": "school-001"
  },
  {
    "email": "principal@yourschool.com",
    "role": "principal",
    "schoolId": "school-001"
  },
  {
    "email": "registrar@yourschool.com",
    "role": "registrar",
    "schoolId": "school-001"
  },
  {
    "email": "teacher1@yourschool.com",
    "role": "teacher",
    "schoolId": "school-001"
  },
  {
    "email": "teacher2@yourschool.com",
    "role": "teacher",
    "schoolId": "school-001"
  },
  {
    "email": "parent1@yourschool.com",
    "role": "parent",
    "schoolId": "school-001"
  }
]
```

2. **Run batch setup**:
```powershell
node scripts/setup-custom-claims.cjs `
  --serviceAccount=./serviceAccountKey.json `
  --batch=scripts/school-users.json
```

3. **Quick generate example**:
```powershell
# Creates example-users-batch.json
node scripts/setup-custom-claims.cjs --createExample
```

---

### Step 3: Update Existing Users (If Applicable)

If you already have users in Firebase Auth without roles:

```powershell
# List all users first
node scripts/setup-custom-claims.cjs --serviceAccount=./serviceAccountKey.json --list

# Then assign roles one by one or via batch file
```

---

### Step 4: Verify Security Rules (IMPORTANT!)

#### Test 1: Verify Admin Access
1. Log in as admin user
2. Should be able to access all features
3. Check browser console for no 403 errors

#### Test 2: Verify Teacher Access
1. Log in as teacher user
2. Should see: Students, Grades, Attendance, Assignments
3. Should NOT see: Settings, Fee Structures, User Management

#### Test 3: Verify Parent Access
1. Log in as parent user
2. Should ONLY see own children's data
3. Try to access another student's data (should fail)

#### Test 4: Verify Unauthorized Access
1. Create a user without role (or remove claims)
2. User should be denied access to all collections

---

## 🔍 Troubleshooting

### Issue: "Missing or insufficient permissions" Error

**Cause**: User doesn't have custom claims set

**Solution**:
```powershell
node scripts/setup-custom-claims.cjs `
  --serviceAccount=./serviceAccountKey.json `
  --email=user@school.com `
  --role=teacher
```

**IMPORTANT**: User must log out and log back in for new claims to take effect!

---

### Issue: "Cannot access Firestore" after deployment

**Cause**: Fallback rule denies all unmatched collections

**Solution**: Check if you're using a custom collection not defined in rules.
Add specific rules for your custom collection.

---

### Issue: Parent can't see their child's data

**Cause**: Parent's UID not in student's `parentIds` array

**Solution**: Update student document:
```javascript
// In Firestore console or script
await firestore.collection('students').doc(studentId).update({
  parentIds: admin.firestore.FieldValue.arrayUnion(parentUserId)
});
```

---

### Issue: Cloud Functions can't write to Firestore

**Cause**: Cloud Functions run with service account, not user auth

**Solution**: Functions have admin privileges by default. If using emulator, ensure admin SDK is initialized.

---

## 📊 Security Rules Coverage

| Collection | Rules Defined | Parent Isolation | Role-Based |
|------------|---------------|------------------|------------|
| students | ✅ | ✅ | ✅ |
| teachers | ✅ | N/A | ✅ |
| sections | ✅ | ✅ | ✅ |
| parents | ✅ | ✅ | ✅ |
| grades | ✅ | ✅ | ✅ |
| attendanceRecords | ✅ | ✅ | ✅ |
| assignments | ✅ | N/A | ✅ |
| academicHistory | ✅ | ✅ | ✅ |
| reportCards | ✅ | ✅ | ✅ |
| schoolForms | ✅ | N/A | ✅ |
| ellnAssessments | ✅ | ✅ | ✅ |
| feeStructures | ✅ | N/A | ✅ |
| payments | ✅ | ✅ | ✅ |
| billingLedgers | ✅ | ✅ | ✅ |
| paymentProofs | ✅ | ✅ | ✅ |
| enrollmentApplications | ✅ | N/A | ⚠️ Public Create |
| notifications | ✅ | ✅ | ✅ |
| announcements | ✅ | N/A | ✅ |
| lessonPlans | ✅ | N/A | ✅ |
| settings | ✅ | N/A | ⚠️ Public Read |
| **Total** | **20** | **13** | **18** |

---

## 🎯 Key Security Features

### 1. **Role-Based Functions**
```javascript
function isAdmin() {
  return isAuthenticated() && getUserRole() == 'admin';
}

function isStaff() {
  return isAdmin() || isPrincipal() || isRegistrar() || isTeacher();
}
```

### 2. **Parent Data Isolation**
```javascript
// Parents can only read their own children
allow read: if isParent() && request.auth.uid in resource.data.parentIds;
```

### 3. **Financial Protection**
```javascript
// Only admin and registrar can create payments
allow create: if isAdminOrRegistrar();

// Only admin can update/delete payments
allow update, delete: if isAdmin();
```

### 4. **Public Enrollment Portal**
```javascript
// Public can submit applications (no auth required)
allow create: if request.resource.data.status == 'submitted';

// But only staff can approve/reject
allow update: if (isAdmin() || isRegistrar() || isPrincipal());
```

### 5. **Immutable Logs**
```javascript
// Logs can be created but never modified
allow create: if isAuthenticated();
allow update, delete: if false;
```

---

## 📝 Next Steps After Deployment

1. ✅ **Test security rules** with different user roles
2. ✅ **Update frontend code** to handle 403 errors gracefully
3. ✅ **Create user management UI** for admins to assign roles
4. ✅ **Document role permissions** for school administrators
5. ✅ **Set up monitoring** for security rule violations

---

## 🚨 Emergency Rollback

If security rules cause issues in production:

```powershell
# Option 1: Rollback to previous version
firebase deploy --only firestore:rules --project edusync-sis

# Option 2: Deploy permissive rules temporarily (NOT RECOMMENDED)
# Edit firestore.rules and deploy

# Option 3: Use Firebase Console
# Go to Firestore → Rules → View previous versions → Rollback
```

---

## 📞 Support

If you encounter issues:
1. Check Firebase Console → Firestore → Rules → Logs
2. Look for "permission-denied" errors in browser console
3. Verify user has correct custom claims: `--list` command
4. Ensure user logged out and back in after claim changes

---

**Status**: ✅ **READY FOR DEPLOYMENT**  
**Estimated Deployment Time**: 15-45 minutes  
**Risk Level**: 🟡 Low (with proper testing)  
**Rollback Time**: < 5 minutes
