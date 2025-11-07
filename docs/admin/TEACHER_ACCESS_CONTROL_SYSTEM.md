# Teacher Access Control - Comprehensive System Documentation

## Overview

This document explains how teacher access control works in EduSync, the three-layer architecture, and how to properly onboard teachers.

## Architecture: Three-Layer System

Teacher access control requires **three synchronized layers** working together:

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Firebase Auth (Custom Claims)                      │
│ - Stores: role, schoolId                                    │
│ - Used by: Security rules, route guards                     │
│ - Managed by: Auth APIs, Cloud Functions                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Firestore Teacher Profile                          │
│ - Collection: teachers                                       │
│ - Stores: email, name, employeeNumber, assignments, etc.    │
│ - Used by: UI components, filtering logic                   │
│ - Managed by: Admin scripts, Cloud Functions                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Section Assignment                                 │
│ - Collection: sections                                       │
│ - Field: adviserId (references teacher.id)                  │
│ - Used by: Student filtering, Form 138 access               │
│ - Managed by: Admin scripts, UI section management          │
└─────────────────────────────────────────────────────────────┘
```

### Why Three Layers?

1. **Auth (Layer 1)**: Fast, secure, cached in browser - used for authentication and authorization
2. **Firestore Profile (Layer 2)**: Rich profile data - used for UI display and queries
3. **Section Assignment (Layer 3)**: Relationship data - used for filtering students by teacher responsibility

## How Form 138 Filtering Works

### Code Logic (`Form138Dashboard.tsx`)

```typescript
const filteredStudents = useMemo(() => {
  let filtered = [...students];

  // Detect if user is a teacher
  const isTeacher = currentUser?.email?.includes('teacher') || 
                   currentUser?.email?.includes('@teach');
  
  if (currentTeacher && currentTeacher.id) {
    // ✅ CASE 1: Teacher profile exists - filter by advised sections
    filtered = filtered.filter(student => {
      const studentSection = sections.find(s => s.id === student.sectionId);
      if (!studentSection) return false;
      return studentSection.adviserId === currentTeacher.id;
    });
  } else if (isTeacher && !currentTeacher) {
    // ⚠️ CASE 2: Teacher account but no profile - show NO students
    filtered = [];
  }
  // 🔓 CASE 3: Admin or no teacher pattern - show all students
  
  return filtered;
}, [students, sections, currentTeacher, currentUser]);
```

### What Each Case Means

| Case | Auth Role | Teacher Profile | Section Assignment | Result |
|------|-----------|----------------|-------------------|--------|
| 1 (✅) | `teacher` | ✅ Exists | ✅ adviserId set | Shows only adviser's students |
| 2 (⚠️) | `teacher` | ❌ Missing | N/A | Shows NO students + warning |
| 3 (🔓) | `admin` | Any | Any | Shows ALL students |
| 3 (🔓) | `parent` | Any | Any | Shows ALL students (for testing) |

## Common Issues and Root Causes

### Issue: "Teacher sees all students"

**Root Cause**: Teacher profile missing (Layer 2) or section not assigned (Layer 3)

**Diagnosis**:
```bash
# Check if teacher profile exists in Firestore
# Look in: Firestore > teachers collection > search by email

# Check if any section has adviserId matching teacher
# Look in: Firestore > sections collection > check adviserId field
```

**Fix**: Use comprehensive onboarding script (see below)

### Issue: "Teacher Profile Not Set Up" warning

**Root Cause**: Auth user exists with `role: teacher` but no Firestore teacher document

**Why this happens**:
- Manual creation via Firebase Console (Auth only)
- Auto-onboarding created Auth but not Firestore profile
- Teacher document was deleted

**Fix**: Run onboarding script with existing email

### Issue: "Teacher sees no students (but profile exists)"

**Root Cause**: Teacher profile exists but no section has `adviserId` pointing to the teacher

**Diagnosis**:
```bash
# Get teacher ID from Firestore
teacherId = "PsBgah2tN7BglK35CNgO"

# Check sections for this adviserId
# Query: sections where adviserId == teacherId
```

**Fix**: Assign teacher to section using onboarding script

## Proper Teacher Onboarding

### Use the Comprehensive Script (RECOMMENDED)

```bash
# For emulator
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
node scripts/admin/onboard-teacher.cjs \
  --email=kramlig.dotillos@gmail.com \
  --firstName=Mark \
  --lastName=Dotillos \
  --gradeLevel=6 \
  --sectionName=Diamond \
  --password=Test1234!

# For production
GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceaccount.json \
node scripts/admin/onboard-teacher.cjs \
  --email=teacher@school.edu \
  --firstName=John \
  --lastName=Doe \
  --gradeLevel=7 \
  --sectionName=Ruby \
  --password=SecurePass123!
```

This script handles **ALL three layers automatically**:
1. ✅ Creates/updates Auth user with `role: teacher` custom claim
2. ✅ Creates/updates Firestore teacher profile
3. ✅ Assigns teacher as adviser to section (creates section if needed)
4. ✅ Creates audit trail

### Alternative: Fix Existing Teacher

If a teacher already exists but missing layers:

```bash
# Update existing teacher and assign to section
node scripts/admin/onboard-teacher.cjs \
  --email=existing@teacher.com \
  --firstName=John \
  --lastName=Doe \
  --sectionId=existing-section-id-123
```

## For Your Specific Case (kramlig.dotillos@gmail.com)

Based on your screenshot, you have:
- ✅ Auth user (created manually or via auto-onboarding)
- ✅ Teacher profile (created manually via Firestore UI)
- ❌ Section assignment (MISSING - no section has adviserId = PsBgah2tN7BglK35CNgO)

### Fix Command

```bash
# Make sure emulator is running first
# Then run:
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
node scripts/admin/onboard-teacher.cjs \
  --email=kramlig.dotillos@gmail.com \
  --firstName=Mark \
  --lastName=Dotillos \
  --gradeLevel=6 \
  --sectionName=Diamond

# This will:
# 1. Confirm Auth user exists (already does)
# 2. Update teacher profile (already exists, will be updated)
# 3. Find/create Grade 6 Diamond section and set adviserId to your teacher ID
```

### Verification

After running the script:
1. **Refresh the Form138 page** (or log out/in to refresh claims)
2. You should see:
   - Only students from Grade 6 Diamond section
   - Badge: "👨‍🏫 Viewing your students only"
   - No warning message

## Development Workflow

### Automated Seeding (npm run dev:emu)

The `seed-sample.cjs` script already creates proper relationships:

```javascript
// Creates sections with adviserId
const adviser = pick(teacherDocs.filter(t => t.role === 'teacher')).id;
sectionDocs.push({ 
  id: id('sec'), 
  gradeLevel, 
  name, 
  adviserId: adviser  // ← Automatically assigns teacher
});
```

So seeded teachers will have proper access automatically.

### Manual Teacher Addition

**DON'T**: Create teacher via Firebase Console UI (incomplete)

**DO**: Use `onboard-teacher.cjs` script (comprehensive)

## Security Implications

### Firestore Rules

The security rules check **both** Auth claims and Firestore relationships:

```javascript
// Allow teacher to read students in their sections
match /students/{studentId} {
  allow read: if hasRole('teacher') && 
    exists(/databases/$(database)/documents/sections/$(studentSection(studentId))) &&
    get(/databases/$(database)/documents/sections/$(studentSection(studentId))).data.adviserId == getUserId();
}
```

This ensures:
- **Auth layer**: User has `role: teacher` claim
- **Relationship layer**: Teacher's ID matches the section's adviserId

### UI Layer

The UI filter is **additional protection** - not the primary security:

```typescript
// This is a UX enhancement, not security
// Real security is in Firestore rules
filtered = filtered.filter(student => {
  const section = sections.find(s => s.id === student.sectionId);
  return section && section.adviserId === currentTeacher.id;
});
```

## Future Enhancements

### Auto-Onboarding Cloud Function

Extend `onUserCreated` to create Firestore profiles automatically:

```javascript
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  const role = determineRole(user.email);
  
  // Set custom claims
  await admin.auth().setCustomUserClaims(user.uid, { role, schoolId: 'default' });
  
  // NEW: Create Firestore profile for teachers/admins
  if (role === 'teacher' || role === 'admin') {
    const [firstName, lastName] = parseNameFromEmail(user.email);
    await admin.firestore().collection('teachers').add({
      email: user.email,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      uid: user.uid,
      role,
      status: 'pending-assignment',  // Admin must assign section
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Send notification to admin about new teacher needing section assignment
    await sendAdminNotification({
      type: 'teacher-needs-section',
      teacherId: newTeacherId,
      email: user.email
    });
  }
});
```

### Admin UI for Teacher Management

Create a UI in the app:
- **Teacher List**: Show all teachers with section assignments
- **Assign Section**: Dropdown to assign/reassign teachers to sections
- **Bulk Import**: CSV upload for multiple teachers
- **Status Tracking**: See which teachers need setup completion

## Scripts Reference

| Script | Purpose | Layers Handled |
|--------|---------|----------------|
| `onboard-teacher.cjs` | **Comprehensive onboarding** | All 3 layers |
| `create-teacher-profile.cjs` | Create Firestore profile only | Layer 2 only |
| `update-user-role.cjs` | Update Auth custom claims only | Layer 1 only |
| `list-sections.cjs` | View sections and advisers | Read-only |
| `seed-sample.cjs` | Automated seeding | All 3 layers |

## Troubleshooting Checklist

When a teacher has access issues, check in order:

1. **Auth Custom Claims**
   ```bash
   # Via Firebase Console: Authentication > Users > Click user > Custom claims
   # Should show: { role: "teacher", schoolId: "default" }
   ```

2. **Firestore Teacher Profile**
   ```bash
   # Via Firestore UI: teachers collection
   # Search by email
   # Should have: email, name, uid, role="teacher"
   ```

3. **Section Assignment**
   ```bash
   # Via Firestore UI: sections collection
   # Filter where: adviserId == <teacher_id>
   # Should have at least one section
   ```

4. **User Session**
   ```bash
   # In browser console:
   firebase.auth().currentUser.getIdTokenResult()
     .then(token => console.log(token.claims))
   
   # Should show: { role: "teacher" }
   # If not, user needs to log out and back in
   ```

## Summary

**Never manually create teachers via Firebase Console UI alone.** Always use the comprehensive onboarding script to ensure all three layers are properly synchronized. This prevents the "sees all students" or "sees no students" issues caused by missing or mismatched data across layers.
