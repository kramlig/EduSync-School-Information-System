# 🚀 Quick Deployment Checklist - Security Rules

**Date**: November 6, 2025  
**Status**: ✅ Code Ready - Awaiting Deployment  
**Estimated Time**: 15-30 minutes

---

## ✅ Pre-Deployment (COMPLETE)

- [x] Security rules implemented (447 lines)
- [x] Custom claims script created
- [x] Test suite written (25 tests)
- [x] Documentation complete
- [x] Code committed to Git
- [x] UAT readiness assessment updated

---

## 🚀 Deployment Steps (DO NOW)

### Step 1: Deploy Security Rules (5 min)

```powershell
# Deploy to production
firebase deploy --only firestore:rules --project edusync-sis
```

**Expected Output**:
```
✔  Deploy complete!
```

**Verify**:
- Go to Firebase Console → Firestore → Rules
- Confirm rules are updated (447 lines)
- Check deploy timestamp

---

### Step 2: Set Up Custom Claims (10-20 min)

#### A. Get Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/project/edusync-sis/settings/serviceaccounts/adminsdk)
2. Click "Generate New Private Key"
3. Save as `serviceAccountKey.json`
4. **Important**: Add to `.gitignore` (already configured)

#### B. Set Role for Admin User

```powershell
# Replace with YOUR admin email
node scripts/setup-custom-claims.cjs `
  --serviceAccount=./serviceAccountKey.json `
  --email=YOUR_ADMIN_EMAIL@school.com `
  --role=admin
```

#### C. Create Batch File for Other Users

Create `scripts/school-users.json`:
```json
[
  {
    "email": "admin@yourschool.com",
    "role": "admin",
    "schoolId": "school-001"
  },
  {
    "email": "teacher1@yourschool.com",
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

#### D. Run Batch Setup

```powershell
node scripts/setup-custom-claims.cjs `
  --serviceAccount=./serviceAccountKey.json `
  --batch=scripts/school-users.json
```

#### E. Verify Users

```powershell
node scripts/setup-custom-claims.cjs `
  --serviceAccount=./serviceAccountKey.json `
  --list
```

---

### Step 3: Test Access (5-10 min)

#### Test 1: Admin Access ✅
1. Log in as admin
2. Should access all features
3. No 403 errors in console

#### Test 2: Teacher Access ✅
1. Log in as teacher
2. Can access: Students, Grades, Attendance
3. Cannot access: Settings, Financial Management

#### Test 3: Parent Access ✅
1. Log in as parent
2. Can only see own children
3. Cannot modify grades

---

## 🔍 Verification Checklist

- [ ] **Rules Deployed**: Firebase Console shows new rules
- [ ] **Admin Role Set**: Admin can access everything
- [ ] **Teacher Role Set**: Teacher has limited access
- [ ] **Parent Role Set**: Parent has view-only access
- [ ] **No Console Errors**: Browser console clean
- [ ] **Data Isolation Works**: Parents can't see other students

---

## 🚨 Troubleshooting

### Issue: "Missing or insufficient permissions"

**Solution**: User needs custom claims set
```powershell
node scripts/setup-custom-claims.cjs --email=user@school.com --role=teacher
```
**IMPORTANT**: User must log out and log back in!

---

### Issue: "Cannot read property 'role' of undefined"

**Solution**: Custom claims not set or user not re-logged in
1. Verify claims: `--list` command
2. Log out user
3. Log back in
4. Check again

---

### Issue: Firebase console shows old rules

**Solution**: Clear cache and refresh
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Check "Rules" tab for timestamp
3. Verify deployment: `firebase deploy --only firestore:rules`

---

## 📊 Success Criteria

✅ **All checks passed**:
- Rules deployed successfully
- Admin can access all features
- Teachers have appropriate access
- Parents can only see own children
- No permission errors in console
- UAT can proceed

---

## 📞 Next Steps After Deployment

1. ✅ Monitor Firebase logs for first 24 hours
2. ✅ Test with real users (admin, teachers, parents)
3. ✅ Proceed with UAT deployment
4. ✅ Collect user feedback

---

## 🎉 Deployment Complete

Once all checkboxes are ✅, you're ready for UAT!

**UAT Readiness**: 85% → Ready to Deploy  
**Security Status**: Production Ready ✅  
**Next Phase**: Full UAT Deployment

---

**Need Help?**
- Documentation: `docs/deployment/SECURITY_RULES_DEPLOYMENT_GUIDE.md`
- Implementation: `docs/deployment/SECURITY_RULES_IMPLEMENTATION_SUMMARY.md`
- UAT Readiness: `docs/deployment/UAT_READINESS_ASSESSMENT.md`
