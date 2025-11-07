# Teacher Setup Guide

## Problem: Teacher Sees All Students (or No Students)

When a teacher account is created via Firebase Auth (manually or through auto-onboarding), only the **Auth user** and **custom claims** are set up. The teacher still needs a **profile document** in the `teachers` Firestore collection to be linked to sections and students.

Without a teacher profile, the Form138 dashboard will:
- Show a warning: "Teacher Profile Not Set Up"
- Display no students (safe default)

---

## Solution: Create Teacher Profile

### Step 1: Create Auth User (if not exists)

```bash
# Create Auth user with role claim
node scripts/admin/create-test-users.cjs
```

This creates:
- `admin-test@edusync.local` (role: admin)
- `teacher-test@edusync.local` (role: teacher)
- `parent-test@gmail.com` (role: parent)

All passwords: `Test1234!`

### Step 2: List Available Sections

```bash
# See all sections and their IDs
node scripts/admin/list-sections.cjs
```

Example output:
```
ID                       Name                          Grade     Adviser ID
──────────────────────────────────────────────────────────────────────────────
section-001              Diamond (Grade 7)             Grade 7   teacher-123
section-002              Ruby (Grade 7)                Grade 7   None
section-003              Sapphire (Grade 8)            Grade 8   None
```

### Step 3: Create Teacher Profile

```bash
# Create teacher profile and assign to section
node scripts/admin/create-teacher-profile.cjs \
  --email=teacher-test@edusync.local \
  --firstName=Test \
  --lastName=Teacher \
  --employeeNumber=T-2024-001 \
  --section=section-002
```

**Arguments:**
- `--email`: Teacher's email (must match Auth user)
- `--firstName`: First name
- `--lastName`: Last name
- `--employeeNumber`: (Optional) Employee ID
- `--section`: (Optional) Section ID to assign as adviser

### Step 4: Verify

1. Log in as the teacher
2. Navigate to **Grades & Reports** → **Report Cards (Form 138)**
3. Should now see only students from the assigned section

---

## How It Works

### Auth Layer (Custom Claims)
- **Role**: `teacher`
- **SchoolId**: `default`
- Used for: Firestore security rules, route guards

### Firestore Layer (Teacher Profile)
- **Collection**: `teachers`
- **Fields**: `email`, `name`, `employeeNumber`, `uid`, `status`
- Used for: Linking to sections, student filtering, UI display

### Section Assignment
- **Collection**: `sections`
- **Field**: `adviserId` (references teacher profile ID)
- Used for: Filtering students by adviser

### Form138 Filter Logic
```typescript
// If teacher profile exists
if (currentTeacher && currentTeacher.id) {
  // Show only students from advised sections
  filtered = filtered.filter(student => {
    const section = sections.find(s => s.id === student.sectionId);
    return section && section.adviserId === currentTeacher.id;
  });
}
// If teacher account but no profile
else if (isTeacher && !currentTeacher) {
  // Show NO students (safe default)
  filtered = [];
}
```

---

## Production Setup

### For Emulator (Local Dev)

Run the seeding scripts which create both Auth users and teacher profiles:

```bash
npm run dev:emu
```

This automatically:
1. Creates Auth users with roles
2. Creates teacher profiles in Firestore
3. Links teachers to sections

### For Production

#### Option A: Manual via Scripts

```bash
# Set credentials
export GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Create Auth user
node scripts/admin/create-test-users.cjs

# Create teacher profile
node scripts/admin/create-teacher-profile.cjs \
  --email=teacher@school.edu \
  --firstName=John \
  --lastName=Doe \
  --section=section-xyz
```

#### Option B: Via Firebase Console + Script

1. Create Auth user in Firebase Console
2. Auto-onboarding function sets custom claims automatically
3. Run `create-teacher-profile.cjs` to create Firestore profile

#### Option C: Enhanced Auto-Onboarding (Future)

Extend `onUserCreated` Cloud Function to:
1. Detect role from email
2. Set custom claims
3. **Create Firestore profile automatically**
4. Send welcome email with setup instructions

---

## Troubleshooting

### "Teacher Profile Not Set Up" Warning

**Cause**: Auth user exists but no teacher document in Firestore

**Fix**:
```bash
node scripts/admin/create-teacher-profile.cjs --email=EMAIL --firstName=FIRST --lastName=LAST
```

### Teacher Sees All Students

**Cause**: No teacher profile filtering is applied (old code or admin role)

**Fix**: Check user's custom claims role:
```bash
node scripts/admin/audit-user-roles.cjs
```

Should show `role: teacher`. If shows `admin`, teacher will see all students (intentional for admin access).

### Teacher Sees No Students (But Profile Exists)

**Cause**: Teacher is not assigned as adviser to any section

**Fix**:
```bash
# List sections to find unassigned ones
node scripts/admin/list-sections.cjs

# Assign teacher to section
node scripts/admin/create-teacher-profile.cjs \
  --email=teacher@school.edu \
  --firstName=John \
  --lastName=Doe \
  --section=SECTION_ID
```

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `create-test-users.cjs` | Create Auth users with role claims |
| `create-teacher-profile.cjs` | Create teacher Firestore profile |
| `list-sections.cjs` | List all sections with IDs |
| `assign-role.cjs` | Manually set custom claims |
| `audit-user-roles.cjs` | List all users with roles |

All scripts are in `scripts/admin/` directory.
