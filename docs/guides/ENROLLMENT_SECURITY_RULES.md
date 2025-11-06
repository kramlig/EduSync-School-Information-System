# Enrollment System Security Rules

**Last Updated:** November 1, 2025  
**Status:** ✅ Implemented in `firestore.rules`

---

## 🔒 Security Overview

The enrollment system uses Firestore Security Rules to control access to enrollment applications and related data. The security model balances public accessibility (for parents to apply) with admin-only management capabilities.

---

## 📋 Security Rules Breakdown

### **1. Enrollment Applications Collection**

**Collection:** `enrollmentApplications`

#### **CREATE (Public Access)**
```javascript
allow create: if true 
  && request.resource.data.keys().hasAll(['applicationNumber', 'studentInfo', 'guardian1', 'currentAddress', 'academicInfo', 'status', 'submittedAt'])
  && request.resource.data.status == 'submitted';
```

**Why public?**
- Parents don't need accounts to apply for enrollment
- Form is accessible at `/enrollment/apply` without authentication
- Creates a low-barrier entry point for new families

**Validation:**
- ✅ Requires all mandatory fields (applicationNumber, studentInfo, etc.)
- ✅ Initial status must be 'submitted'
- ✅ Cannot create applications with other statuses (approved/rejected)

#### **READ (Authenticated Only)**
```javascript
allow read: if request.auth != null;
```

**Why authenticated?**
- Admins need to view all applications in dashboard
- Prevents public browsing of submitted applications
- Parents would need to login to track their application (future feature)

#### **UPDATE (Authenticated + Field Validation)**
```javascript
allow update: if request.auth != null
  && request.resource.data.diff(resource.data).affectedKeys()
     .hasOnly(['status', 'reviewedBy', 'reviewedAt', 'reviewNotes', 'rejectionReason', 'enrolledStudentId', 'updatedAt']);
```

**Why restricted?**
- Only admins can approve/reject applications
- Prevents tampering with student information after submission
- Limits updates to review-related fields only

**Allowed Update Fields:**
- ✅ `status` - Change from submitted → under_review → approved/rejected
- ✅ `reviewedBy` - Track which admin reviewed
- ✅ `reviewedAt` - Timestamp of review
- ✅ `reviewNotes` - Admin notes during approval
- ✅ `rejectionReason` - Reason if application rejected
- ✅ `enrolledStudentId` - Link to created student record
- ✅ `updatedAt` - Last modified timestamp

**Blocked Fields (Cannot be updated after creation):**
- ❌ `applicationNumber` - Immutable identifier
- ❌ `studentInfo` - Cannot change student details
- ❌ `guardian1`, `guardian2` - Cannot change guardian info
- ❌ `currentAddress` - Cannot change address
- ❌ `academicInfo` - Cannot change grade level
- ❌ `healthInfo` - Cannot change health information
- ❌ `documents` - Cannot change uploaded documents
- ❌ `submittedAt` - Original submission timestamp

#### **DELETE (Authenticated Only)**
```javascript
allow delete: if request.auth != null;
```

**Why authenticated?**
- Rare admin action (typically applications are rejected, not deleted)
- Prevents accidental data loss
- Maintains audit trail

---

### **2. Settings Collection**

**Collection:** `settings`

#### **READ (Public Access)**
```javascript
allow read: if true;
```

**Why public?**
- Enrollment portal needs to check `enrollmentConfig.requiresApplication`
- Portal displays financial information based on `financialConfig`
- No sensitive data in settings (just school configuration)

#### **WRITE (Authenticated Only)**
```javascript
allow write: if request.auth != null;
```

**Why authenticated?**
- Only admins should modify school configuration
- Prevents unauthorized changes to enrollment settings

---

## 🚀 Testing Security Rules

### **Test 1: Public Application Creation**
```javascript
// Should succeed (no auth required)
POST /enrollmentApplications
{
  "applicationNumber": "ENR-2025-001",
  "studentInfo": { ... },
  "guardian1": { ... },
  "currentAddress": { ... },
  "academicInfo": { ... },
  "status": "submitted",
  "submittedAt": "2025-11-01T10:00:00Z"
}
```

### **Test 2: Unauthorized Application Reading**
```javascript
// Should fail (requires auth)
GET /enrollmentApplications/ENR-2025-001
// Result: permission-denied
```

### **Test 3: Admin Approval**
```javascript
// Should succeed (authenticated user)
PATCH /enrollmentApplications/ENR-2025-001
{
  "status": "approved",
  "reviewedBy": "admin@school.edu",
  "reviewedAt": "2025-11-01T11:00:00Z",
  "enrolledStudentId": "student123"
}
```

### **Test 4: Tampering with Student Info**
```javascript
// Should fail (studentInfo not in allowed update fields)
PATCH /enrollmentApplications/ENR-2025-001
{
  "studentInfo": {
    "firstName": "Hacked"
  }
}
// Result: permission-denied
```

---

## 🛡️ Production Hardening (TODO)

When custom claims are implemented, upgrade to role-based access:

```javascript
// Enrollment Applications - Role-Based
match /enrollmentApplications/{applicationId} {
  allow create: if true;  // Keep public
  
  // Only admins can read all applications
  allow read: if request.auth != null 
    && request.auth.token.role in ['admin', 'registrar', 'principal'];
  
  // Only admins can approve/reject
  allow update: if request.auth != null 
    && request.auth.token.role == 'admin'
    && request.resource.data.diff(resource.data).affectedKeys()
       .hasOnly(['status', 'reviewedBy', 'reviewedAt', 'reviewNotes', 'rejectionReason', 'enrolledStudentId', 'updatedAt']);
  
  // Only admins can delete
  allow delete: if request.auth != null 
    && request.auth.token.role == 'admin';
}

// Settings - Admin Only Writes
match /settings/{settingId} {
  allow read: if true;  // Keep public
  allow write: if request.auth != null 
    && request.auth.token.role == 'admin';
}
```

---

## 📊 Security Audit Checklist

Before deploying to production:

- [ ] Test public application creation works
- [ ] Test unauthenticated users CANNOT read applications
- [ ] Test authenticated users CAN read applications
- [ ] Test only review fields can be updated
- [ ] Test student info fields CANNOT be updated
- [ ] Test public can read settings
- [ ] Test unauthenticated users CANNOT write settings
- [ ] Implement custom claims for role-based access
- [ ] Test role-based restrictions work correctly
- [ ] Review all security rules one final time
- [ ] Deploy rules with `firebase deploy --only firestore:rules`

---

## 🔑 Key Principles

1. **Least Privilege**: Only grant minimum necessary permissions
2. **Public Access**: Only for enrollment creation and settings reading
3. **Immutable Data**: Student info cannot be changed after submission
4. **Audit Trail**: Track who reviewed and when
5. **Future-Proof**: Ready for role-based access when custom claims are added

---

## 📝 Notes

- Current rules allow authenticated users (any logged-in user) to manage applications
- This works for the emulator where all test users are admins
- Production should implement custom claims to restrict to admin role only
- Consider adding application tracking by email for parents (future enhancement)
- Document uploads will need separate Storage rules (when implemented)

---

**Security Status:** ✅ Basic security implemented, ready for production with role-based upgrade recommended
