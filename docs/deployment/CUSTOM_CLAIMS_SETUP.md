# Custom Claims Setup Guide

## Overview

Custom claims (user roles) are essential for the security rules to work properly. This guide explains how custom claims are managed in both the emulator and production environments.

## How It Works

### Firebase Custom Claims

Custom claims are JWT token attributes that Firebase Authentication attaches to user tokens. Our security rules check `request.auth.token.role` to determine user permissions.

### Roles in the System

- `admin` - Full system access
- `principal` - School administrator access
- `registrar` - Student records management
- `teacher` - Class and grades management
- `parent` - Limited access to own children's data

## Emulator Environment

### Automatic Setup (Recommended)

The custom claims are **automatically set** when you run:

```bash
npm run dev:emu
```

This workflow:
1. Starts the Firebase emulators
2. Runs the seed script (`seed-complete.cjs`)
3. The seed script creates users AND sets their custom claims
4. Starts the Vite dev server

**No additional steps needed!** The seed script handles everything.

### Manual Claims Assignment

If you need to manually assign claims to additional users:

```bash
# Set environment variables for emulator
$env:FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9100'
$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8086'

# Run the claims script
node scripts/set-emulator-claims.cjs
```

Edit `scripts/set-emulator-claims.cjs` to add users:

```javascript
const USERS_WITH_ROLES = [
  { email: 'admin@edusync.local', role: 'admin', uid: 'admin123' },
  { email: 'newuser@edusync.local', role: 'teacher' },
];
```

### How seed-complete.cjs Sets Claims

The seed script uses the Firebase Admin SDK to set claims immediately after creating users:

```javascript
// Create user
const userRecord = await auth.createUser({
  uid: 'admin123',
  email: 'admin@edusync.local',
  password: 'admin123',
  displayName: 'System Admin',
});

// Set custom claims
await auth.setCustomUserClaims(userRecord.uid, {
  role: 'admin',
  schoolId: 'default'
});
```

## Production Environment

### Prerequisites

1. Firebase Admin SDK service account credentials
2. Access to the production Firebase project

### Setting Claims for Production Users

Use the `set-emulator-claims.cjs` script (rename or copy to `set-production-claims.cjs`):

```bash
# Set environment to production
$env:GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"

# Run the script
node scripts/set-production-claims.cjs
```

### Using Firebase CLI

Alternatively, use the Firebase CLI extension:

```bash
# Install the Firebase Admin SDK
npm install -g firebase-tools

# Set custom claims
firebase auth:export --project edusync-sis
# Manually edit the exported file to add claims
firebase auth:import --project edusync-sis users.json
```

## Verification

### Check Claims in Emulator

1. Open Firebase Emulator UI: http://localhost:4400
2. Navigate to Authentication
3. Click on a user
4. Check "Custom Claims" section

### Check Claims in Code

Add this to your login handler:

```typescript
const user = await signInWithEmailAndPassword(auth, email, password);
const tokenResult = await user.user.getIdTokenResult();
console.log('User role:', tokenResult.claims.role);
```

### Test Security Rules

Run the automated security tests:

```bash
npx ts-node scripts/test-security-rules.ts
```

## Common Issues

### "Property role is undefined" Error

**Cause**: User lacks custom claims in JWT token.

**Solution**: 
1. Ensure seed script ran successfully (check console output)
2. Verify claims were set (check emulator UI)
3. **Log out and log back in** (claims only update on new login)

### "ECONNREFUSED" When Running emu:claims

**Cause**: Auth emulator not ready yet.

**Solution**: Don't worry! The seed script (`seed-complete.cjs`) already sets claims. The `emu:claims` step has been **removed** from the dev:emu workflow because it's redundant.

### Claims Not Taking Effect

**Important**: Custom claims only take effect on **new logins**. After setting claims:

1. Log out of the application
2. Clear browser cache (optional but recommended)
3. Log back in
4. New JWT token will include the claims

## Technical Details

### Token Lifetime

- JWT tokens are cached by Firebase for **1 hour**
- Claims changes require re-authentication to take effect
- Force token refresh: `user.getIdToken(true)`

### Claims Structure

```json
{
  "role": "admin",
  "schoolId": "default"
}
```

### Security Rules Integration

```javascript
function getUserRole() {
  return request.auth.token.role;
}

function isAdmin() {
  return getUserRole() == 'admin';
}
```

## Best Practices

1. **Set claims during user creation** - Most efficient approach
2. **Use transition mode** - Allow gradual migration with `isLegacyUser()` fallback
3. **Test thoroughly** - Run security rules tests before deployment
4. **Document roles** - Keep role definitions up to date
5. **Minimal claims** - Only store role and schoolId, not all user data

## Migration Path

If you have existing users without roles:

1. Keep transition mode active (`isLegacyUser()` in rules)
2. Assign roles gradually as users log in
3. Monitor which users still lack roles
4. Set claims for remaining users
5. Remove transition mode after all users have roles

See `TRANSITION_MODE_GUIDE.md` for detailed migration steps.

## Reference

- **Seed Script**: `scripts/seed-complete.cjs` (sets claims automatically)
- **Claims Script**: `scripts/set-emulator-claims.cjs` (manual assignment)
- **Security Rules**: `firestore.rules` (role checks)
- **Testing**: `scripts/test-security-rules.ts` (automated tests)

---

**Last Updated**: 2025-01-08  
**Related Docs**: RESTART_INSTRUCTIONS.md, TRANSITION_MODE_GUIDE.md, UAT_READINESS_ASSESSMENT.md
