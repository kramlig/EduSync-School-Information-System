# Auto-Onboarding System - Action Plan
**Date:** January 6, 2026  
**Status:** CURRENTLY DISABLED (broken since Jan 2025)  
**Critical:** Blocking all school onboarding  

---

## 🎯 EXECUTIVE SUMMARY

**Current State:**
- ✅ Cloud Function exists and is DEPLOYED (`functions/src/autoOnboarding.js`)
- ✅ Function has smart priority system (userRoles → collections → email patterns)
- ❌ Frontend components NOT using the function properly
- ❌ `createParentWithRole` service does NOT exist
- ❌ Most user creation still uses plain `createUserWithEmailAndPassword`
- ❌ No UI for manual role assignment

**The Gap:** Documentation says function was "re-enabled with improvements" (Nov 12, 2025), but:
1. The service layer (`services/userManagement.ts`) referenced in docs **DOES NOT EXIST**
2. Frontend components still use old methods
3. Function is likely working, but frontend isn't calling it correctly

**Impact:** Every new user created through UI gets broken permissions

---

## 📋 CURRENT STATE ANALYSIS

### ✅ What EXISTS and WORKS

#### 1. Cloud Function (`functions/src/autoOnboarding.js`)
```javascript
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  // PRIORITY 1: Check userRoles collection (explicit assignment)
  // PRIORITY 2: Check teachers/students/parents collections
  // PRIORITY 3: Email pattern detection (fallback)
  // PRIORITY 4: Default to 'parent'
});
```
**Status:** ✅ Deployed and functional

**Logic:**
- Smart priority system
- Checks multiple sources before defaulting
- Safe fallback to 'parent' role
- Audit trail logging

#### 2. Parent Registration Component
**File:** `src/components/parent/ParentRegistration.tsx` (Line 206)

**Current Implementation:**
```typescript
const userResult = await createParentWithRole({
  email: formData.parentEmail,
  password: formData.password,
  role: 'parent',
  schoolId: verifiedStudent!.schoolId || 'default',
  displayName: formData.parentName,
  studentIds: [verifiedStudent!.id],
  contactNumber: formData.parentPhone,
  // ...
});
```

**Status:** ⚠️ **Calls function that DOESN'T EXIST**

---

### ❌ What's MISSING

#### 1. User Management Service Layer
**Expected:** `src/services/userManagement.ts`  
**Status:** ❌ **FILE DOES NOT EXIST**

**Should contain:**
```typescript
export async function createUserWithRole(params: {
  email: string;
  password: string;
  role: UserRole;
  schoolId?: string;
  displayName?: string;
}): Promise<CreateUserWithRoleResult>

export async function createTeacherWithRole(params)
export async function createStudentWithRole(params)
export async function createParentWithRole(params)
```

**Why it's critical:**
- Creates userRoles document BEFORE Firebase Auth user
- Ensures Cloud Function reads correct role
- Prevents race conditions

#### 2. Manual Role Assignment UI
**Expected:** Admin panel for role management  
**Status:** ❌ **DOES NOT EXIST**

**Should allow:**
- View user's current role/claims
- Change user's role
- View role change history
- Bulk role assignment

#### 3. Other User Creation Flows
**Missing implementations:**
- School admin creation
- Teacher creation (admin panel)
- Student creation (enrollment)
- Registrar account creation

All likely using plain `createUserWithEmailAndPassword` without role assignment

---

## 🚀 THE FIX PLAN

### **Phase 1: Create User Management Service** (2-3 hours)

#### Step 1.1: Create the Service File
**File:** `src/services/userManagement.ts`

**Implementation:**
```typescript
import { 
  createUserWithEmailAndPassword,
  Auth,
  UserCredential 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  collection, 
  Firestore, 
  serverTimestamp 
} from 'firebase/firestore';

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'registrar' | 'superadmin';

interface CreateUserWithRoleParams {
  email: string;
  password: string;
  role: UserRole;
  schoolId?: string;
  displayName?: string;
  additionalData?: Record<string, any>;
}

interface CreateUserWithRoleResult {
  success: boolean;
  userId?: string;
  userCredential?: UserCredential;
  error?: string;
}

/**
 * STEP-BY-STEP WORKFLOW:
 * 1. Create Firebase Auth user (get UID)
 * 2. IMMEDIATELY create userRoles document with intended role
 * 3. Auto-onboarding Cloud Function fires (reads userRoles doc)
 * 4. Function sets custom claims from userRoles
 * 5. Wait for claims propagation
 * 6. Return success
 */
export async function createUserWithRole(
  auth: Auth,
  db: Firestore,
  params: CreateUserWithRoleParams
): Promise<CreateUserWithRoleResult> {
  try {
    // Step 1: Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      params.email,
      params.password
    );
    
    const uid = userCredential.user.uid;
    console.log(`[UserManagement] Created auth user: ${uid}`);
    
    // Step 2: IMMEDIATELY create userRoles document (BEFORE Cloud Function processes)
    const userRoleRef = doc(db, 'userRoles', uid);
    await setDoc(userRoleRef, {
      role: params.role,
      schoolId: params.schoolId || 'default',
      email: params.email,
      displayName: params.displayName || null,
      createdAt: serverTimestamp(),
      createdBy: 'system',
      assignmentMethod: 'explicit-ui',
      ...params.additionalData
    });
    
    console.log(`[UserManagement] Created userRoles doc with role: ${params.role}`);
    
    // Step 3: Wait for Cloud Function to process and set claims
    // The onUserCreated trigger will read userRoles and set custom claims
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    
    console.log(`[UserManagement] Auto-onboarding should have set claims by now`);
    
    return {
      success: true,
      userId: uid,
      userCredential
    };
    
  } catch (error: any) {
    console.error('[UserManagement] Error creating user with role:', error);
    return {
      success: false,
      error: error.message || 'Failed to create user'
    };
  }
}

// Specialized helper functions
export async function createParentWithRole(
  auth: Auth,
  db: Firestore,
  params: Omit<CreateUserWithRoleParams, 'role'> & {
    studentIds: string[];
    contactNumber?: string;
  }
): Promise<CreateUserWithRoleResult> {
  return createUserWithRole(auth, db, {
    ...params,
    role: 'parent',
    additionalData: {
      ...params.additionalData,
      studentIds: params.studentIds,
      contactNumber: params.contactNumber
    }
  });
}

export async function createTeacherWithRole(
  auth: Auth,
  db: Firestore,
  params: Omit<CreateUserWithRoleParams, 'role'>
): Promise<CreateUserWithRoleResult> {
  return createUserWithRole(auth, db, {
    ...params,
    role: 'teacher'
  });
}

export async function createStudentWithRole(
  auth: Auth,
  db: Firestore,
  params: Omit<CreateUserWithRoleParams, 'role'> & {
    lrn: string;
    sectionId?: string;
  }
): Promise<CreateUserWithRoleResult> {
  return createUserWithRole(auth, db, {
    ...params,
    role: 'student',
    additionalData: {
      ...params.additionalData,
      lrn: params.lrn,
      sectionId: params.sectionId
    }
  });
}

export async function createAdminWithRole(
  auth: Auth,
  db: Firestore,
  params: Omit<CreateUserWithRoleParams, 'role'>
): Promise<CreateUserWithRoleResult> {
  return createUserWithRole(auth, db, {
    ...params,
    role: 'admin'
  });
}
```

#### Step 1.2: Update ParentRegistration.tsx
**File:** `src/components/parent/ParentRegistration.tsx`

**Current (Line 206):**
```typescript
const userResult = await createParentWithRole({
  email: formData.parentEmail,
  // ...
});
```

**Change to:**
```typescript
import { createParentWithRole } from '../../services/userManagement';
import { auth, db } from '../../firebase';

// ...

const userResult = await createParentWithRole(auth, db, {
  email: formData.parentEmail,
  password: formData.password,
  schoolId: verifiedStudent!.schoolId || 'default',
  displayName: formData.parentName,
  studentIds: [verifiedStudent!.id],
  contactNumber: formData.parentPhone,
  additionalData: {
    firstName,
    lastName,
    emailVerified: false,
    registrationDate: new Date().toISOString()
  }
});
```

---

### **Phase 2: Find & Fix All User Creation Points** (3-4 hours)

#### Step 2.1: Search for All createUserWithEmailAndPassword Calls
```bash
# Search for direct Firebase Auth calls
grep -r "createUserWithEmailAndPassword" src/components --include="*.tsx"
```

#### Step 2.2: Update Each Component

**Expected locations:**
1. ✅ `ParentRegistration.tsx` (will be fixed in Phase 1)
2. ❓ School admin creation (likely in admin panel)
3. ❓ Teacher creation (admin panel)
4. ❓ Student enrollment flow
5. ❓ Registrar account creation

**For each:**
- Import `createXWithRole` function
- Replace `createUserWithEmailAndPassword` with proper function
- Test the flow

---

### **Phase 3: Create Role Management UI** (4-5 hours)

#### Step 3.1: Create RoleManagementPanel Component
**File:** `src/components/admin/RoleManagementPanel.tsx`

**Features:**
- List all users with their current roles
- Change user role (dropdown)
- View custom claims (read-only)
- Role change history
- Search/filter users

**UI Design:**
```
┌─────────────────────────────────────────┐
│ 👥 User Role Management                 │
├─────────────────────────────────────────┤
│ Search: [________________] 🔍           │
├──────────┬──────────┬────────┬─────────┤
│ Email    │ Name     │ Role   │ Actions │
├──────────┼──────────┼────────┼─────────┤
│ juan@... │ Juan D.  │ student│ [Edit]  │
│ maria@.. │ Maria C. │ teacher│ [Edit]  │
│ ana@...  │ Ana R.   │ parent │ [Edit]  │
└──────────┴──────────┴────────┴─────────┘
```

#### Step 3.2: Create HTTP Callable Function for Role Change
**File:** `functions/src/roleManagement.js` (NEW)

```javascript
exports.changeUserRole = functions.https.onCall(async (data, context) => {
  // Verify caller is admin
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can change roles');
  }
  
  const { userId, newRole } = data;
  
  // Update custom claims
  await admin.auth().setCustomUserClaims(userId, { role: newRole });
  
  // Log change
  await db.collection('roleChangeHistory').add({
    userId,
    newRole,
    changedBy: context.auth.uid,
    changedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { success: true };
});
```

---

### **Phase 4: Testing & Validation** (2-3 hours)

#### Test Scenarios:

**Scenario 1: Parent Self-Registration**
1. Go to parent registration page
2. Fill form and submit
3. Check Firebase Auth (should have user)
4. Check `userRoles` collection (should have doc with role='parent')
5. Check custom claims (should have role='parent')
6. Log in as parent (should work)

**Scenario 2: Admin Creates Teacher**
1. Log in as admin
2. Navigate to teacher creation
3. Create new teacher
4. Verify role='teacher' in userRoles
5. Verify custom claims
6. Log in as teacher (should work)

**Scenario 3: Role Change via UI**
1. Log in as admin
2. Navigate to role management
3. Change user's role from 'student' to 'teacher'
4. User logs out and back in
5. Verify new role works

**Scenario 4: Bulk School Onboarding**
1. Create school
2. Create admin for school
3. Create 5 teachers
4. Create 20 students
5. Verify all have correct roles
6. Test each user type login

---

## 📊 EFFORT ESTIMATION

| Phase | Task | Hours | Priority |
|-------|------|-------|----------|
| 1.1 | Create userManagement.ts | 1.5 | 🔴 Critical |
| 1.2 | Fix ParentRegistration.tsx | 0.5 | 🔴 Critical |
| 2.1 | Search all user creation points | 0.5 | 🔴 Critical |
| 2.2 | Update all components | 2.0 | 🔴 Critical |
| 3.1 | Build RoleManagementPanel UI | 3.0 | 🟡 High |
| 3.2 | Create changeUserRole function | 1.0 | 🟡 High |
| 4 | Testing all scenarios | 2.5 | 🔴 Critical |
| **TOTAL** | | **11 hours** | |

**Timeline:** 1.5 days (with testing)

---

## ✅ SUCCESS CRITERIA

### Must Have (Phase 1-2):
- [ ] `userManagement.ts` service created
- [ ] ParentRegistration uses new service
- [ ] All user creation flows use new service
- [ ] New users get correct roles automatically
- [ ] Cloud Function logs show "pre-assigned-userRoles" method
- [ ] No "permission denied" errors after user creation

### Should Have (Phase 3):
- [ ] Role management UI accessible to admins
- [ ] Admins can change user roles
- [ ] Role change history visible
- [ ] Changes take effect after re-login

### Nice to Have (Future):
- [ ] Email domain verification
- [ ] Role approval workflow
- [ ] Audit trail viewer
- [ ] Bulk role assignment

---

## 🚨 RISKS & MITIGATION

**Risk 1:** Cloud Function doesn't read userRoles fast enough
- **Mitigation:** Added 2-second delay in service layer
- **Alternative:** Increase delay or add retry logic

**Risk 2:** Existing users don't have userRoles docs
- **Mitigation:** Cloud Function falls back to collection lookup
- **Alternative:** Create migration script for existing users

**Risk 3:** Token caching issues
- **Mitigation:** Force users to log out/in after role change
- **Alternative:** Implement token refresh logic

**Risk 4:** Multiple user creation methods exist
- **Mitigation:** Comprehensive search and update
- **Alternative:** Create linter rule to prevent direct Firebase Auth calls

---

## 🎯 IMMEDIATE NEXT STEPS (Start Now)

### 1. Create the Service (30 minutes)
```bash
# Create file
touch src/services/userManagement.ts

# Copy the implementation from this document
# Test imports compile
npm run dev
```

### 2. Fix ParentRegistration (15 minutes)
```bash
# Edit file
code src/components/parent/ParentRegistration.tsx

# Add import
# Update function call
# Test registration flow
```

### 3. Search for Other User Creation (15 minutes)
```bash
# Find all occurrences
grep -r "createUserWithEmailAndPassword" src/components

# Document each location
# Prioritize by usage frequency
```

### 4. Test End-to-End (30 minutes)
```bash
# Start dev server
npm run dev:emu

# Test parent registration
# Check userRoles collection
# Check custom claims
# Verify login works
```

---

## 📝 DOCUMENTATION UPDATES NEEDED

After implementation:
1. Update README with new user creation flow
2. Document userManagement service API
3. Create admin guide for role management
4. Update onboarding checklist
5. Add troubleshooting guide for role issues

---

**Ready to start?** Let's begin with Phase 1 - creating the userManagement service.
