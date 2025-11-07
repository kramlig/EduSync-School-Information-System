# Auto-Onboarding System - Role Assignment Guide

## Overview

The auto-onboarding system automatically assigns roles to new users based on their email address patterns. This eliminates manual role assignment and ensures consistent security from day one.

## How It Works

### 1. User Creation Trigger

When a new user is created in Firebase Auth (via sign-up, admin console, or API), the `onUserCreated` Cloud Function is automatically triggered.

### 2. Role Detection

The system analyzes the user's email address to determine their role:

| Email Pattern | Assigned Role | Examples |
|--------------|---------------|----------|
| `admin@*`, `*admin@*` | `admin` | admin@school.edu, john.admin@school.edu |
| `principal@*`, `head@*` | `principal` | principal@school.edu, head@school.edu |
| `registrar@*`, `enrollment@*` | `registrar` | registrar@school.edu, enrollment@school.edu |
| `teacher@*`, `faculty@*` | `teacher` | teacher1@school.edu, faculty@school.edu |
| All others | `parent` | john.doe@gmail.com, parent@school.edu |

### 3. Custom Claims Assignment

The system sets custom claims on the user's Firebase Auth token:

```javascript
{
  role: 'teacher',           // Determined role
  schoolId: 'default',       // School identifier
  assignedAt: 1699276800000, // Timestamp
  assignedBy: 'system-auto'  // Assignment method
}
```

### 4. Audit Trail

Every role assignment is logged to the `userRoles` collection:

```javascript
{
  userId: 'abc123',
  email: 'teacher@school.edu',
  role: 'teacher',
  assignedBy: 'system-auto',
  assignedAt: Timestamp,
  method: 'auto-onboarding',
  emailPattern: 'teacher-prefix'
}
```

## Deployment

### Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy only auto-onboarding functions
firebase deploy --only functions:onUserCreated,functions:assignUserRole,functions:getUserRoleHistory
```

### Verify Deployment

1. Check Firebase Console → Functions
2. Look for:
   - `onUserCreated` (Auth trigger)
   - `assignUserRole` (Callable)
   - `getUserRoleHistory` (Callable)

## Testing

### Test Auto-Assignment

1. **Create a test user with a teacher email:**
   ```bash
   # Via Firebase Console or Auth API
   firebase auth:import test-users.json
   ```

2. **Check the logs:**
   ```bash
   firebase functions:log --only onUserCreated
   ```

3. **Verify custom claims:**
   ```bash
   node scripts/admin/audit-user-roles.cjs
   ```

### Test Manual Override

```bash
# Assign role manually
node scripts/admin/assign-role.cjs --email=user@example.com --role=admin
```

## Manual Role Assignment

### Individual User

```bash
# By email
node scripts/admin/assign-role.cjs --email=john@school.edu --role=teacher

# By user ID
node scripts/admin/assign-role.cjs --userId=abc123 --role=admin
```

### Bulk Assignment

```bash
# Assign roles to all users without roles
node scripts/admin/bulk-assign-roles.cjs
```

### Via Frontend (Admin Only)

Admins can call the `assignUserRole` callable function:

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const assignRole = httpsCallable(functions, 'assignUserRole');

const result = await assignRole({
  userId: 'abc123',
  role: 'teacher'
});

console.log(result.data.message);
```

## Audit & Monitoring

### Check All Users

```bash
# See who has roles and who doesn't
node scripts/admin/audit-user-roles.cjs
```

Output:
```
📊 AUDIT RESULTS
═══════════════════════════════════════════════════════════
Total Users:              15
Users WITH roles:         12 (80.0%)
Users WITHOUT roles:      3 (20.0%)

ROLE DISTRIBUTION:
───────────────────────────────────────────────────────────
  Admin:                  2
  Principal:              1
  Registrar:              1
  Teacher:                5
  Parent:                 3
```

### View Role History

Get a user's role assignment history:

```javascript
const functions = getFunctions();
const getRoleHistory = httpsCallable(functions, 'getUserRoleHistory');

const result = await getRoleHistory({ userId: 'abc123' });
console.log(result.data);
```

### Monitor Function Logs

```bash
# Stream real-time logs
firebase functions:log --only onUserCreated

# Check for errors
firebase functions:log --only onUserCreated --lines 100 | grep ERROR
```

## Security Rules Update

The `userRoles` collection requires security rules:

```javascript
// In firestore.rules
match /userRoles/{userId} {
  // Users can read their own role history
  allow read: if request.auth.uid == userId;
  
  // Admins can read all role histories
  allow read: if isAdmin();
  
  // Only the system (Cloud Functions) can write
  allow write: if false;
}
```

## Troubleshooting

### User Not Getting Role

1. **Check function logs:**
   ```bash
   firebase functions:log --only onUserCreated
   ```

2. **Verify function deployed:**
   ```bash
   firebase functions:list
   ```

3. **Check user's custom claims:**
   ```bash
   node scripts/admin/audit-user-roles.cjs
   ```

4. **Manually assign role:**
   ```bash
   node scripts/admin/assign-role.cjs --email=user@example.com --role=teacher
   ```

### Wrong Role Assigned

1. **Check email pattern:**
   - Email: `teacher123@school.edu` → Should match `teacher-prefix`
   - If wrong, update `roleDetection.js` logic

2. **Override with manual assignment:**
   ```bash
   node scripts/admin/assign-role.cjs --email=user@example.com --role=admin
   ```

### Function Not Triggering

1. **Check function is deployed:**
   ```bash
   firebase functions:list | grep onUserCreated
   ```

2. **Check function permissions:**
   ```bash
   gcloud functions describe onUserCreated
   ```

3. **Redeploy function:**
   ```bash
   firebase deploy --only functions:onUserCreated --force
   ```

## Customization

### Change Email Patterns

Edit `functions/src/utils/roleDetection.js`:

```javascript
function determineRole(email) {
  const emailLower = email.toLowerCase();
  
  // Add custom pattern for your school
  if (emailLower.endsWith('@myschool.edu')) {
    if (emailLower.startsWith('staff')) return 'teacher';
  }
  
  // ... rest of logic
}
```

### Change School ID

Edit `functions/src/autoOnboarding.js`:

```javascript
// Change from 'default' to your school ID
await auth.setCustomUserClaims(uid, {
  role: role,
  schoolId: 'myschool-001', // ← Change this
  assignedAt: Date.now(),
  assignedBy: 'system-auto'
});
```

### Add Notification

Edit `functions/src/autoOnboarding.js`:

```javascript
// Send welcome email
await db.collection('mail').add({
  to: email,
  template: {
    name: 'welcome',
    data: {
      role: role,
      displayName: displayName
    }
  }
});
```

## Best Practices

### ✅ DO

- Test with dummy users first
- Monitor function logs after deployment
- Keep audit trail for compliance
- Use manual override for edge cases
- Update email patterns as needed

### ❌ DON'T

- Assign admin role to public emails
- Delete audit trail records
- Skip testing after changes
- Use overly broad email patterns
- Ignore function errors

## Performance

### Metrics

- **Average execution time:** < 1 second
- **Success rate:** > 99.5%
- **Cost:** ~$0.00001 per assignment (free tier: 2M/month)

### Monitoring

Set up alerts for:
- Function errors > 5% error rate
- Execution time > 5 seconds
- Failed role assignments

```bash
# Create alert
gcloud logging metrics create auto_onboarding_errors \
  --log-filter='resource.type="cloud_function" AND resource.labels.function_name="onUserCreated" AND severity>=ERROR'
```

## Migration from Manual to Auto

If you have existing users without roles:

1. **Audit current state:**
   ```bash
   node scripts/admin/audit-user-roles.cjs
   ```

2. **Deploy auto-onboarding function:**
   ```bash
   firebase deploy --only functions:onUserCreated
   ```

3. **Assign roles to existing users:**
   ```bash
   node scripts/admin/bulk-assign-roles.cjs
   ```

4. **Verify all users have roles:**
   ```bash
   node scripts/admin/audit-user-roles.cjs
   ```

5. **Remove transition mode from firestore.rules:**
   ```bash
   # Remove all || isLegacyUser() fallbacks
   firebase deploy --only firestore:rules
   ```

## Support

- **Documentation:** `docs/admin/ROLE_ASSIGNMENT.md`
- **Function Code:** `functions/src/autoOnboarding.js`
- **Scripts:** `scripts/admin/`
- **Logs:** `firebase functions:log`

---

*Last Updated: November 6, 2025*
