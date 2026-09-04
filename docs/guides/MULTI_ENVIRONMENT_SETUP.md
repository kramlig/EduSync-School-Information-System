# Multi-Environment Architecture - Complete Setup

## 🎯 What We Built

A professional multi-environment setup separating production and staging for safe development and testing.

---

## 📁 Files Created/Modified

### Configuration Files
- ✅ `.firebaserc` - Added staging project alias
- ✅ `firebase.staging.json` - Staging-specific Firebase config
- ✅ `.env.staging.example` - Environment variables template

### Scripts Updated
- ✅ `scripts/seed-production-comprehensive.cjs` - Now supports `--project=staging`
- ✅ `scripts/seed-e2e-test-data.cjs` - Multi-project support
- ✅ `scripts/clean-and-reseed-production.cjs` - Safety checks for production

### NPM Scripts Added
- ✅ `npm run use:staging` / `use:production` - Switch projects
- ✅ `npm run deploy:staging` / `deploy:production` - Deploy to environments
- ✅ `npm run seed:staging` - Seed staging database
- ✅ `npm run clean:staging` - Clean and reseed staging (SAFE)
- ✅ `npm run test:staging` / `test:production` - Run E2E tests

### Documentation
- ✅ `STAGING_SETUP_GUIDE.md` - Complete setup instructions
- ✅ `DNS_SETUP_GUIDE.md` - DNS configuration for staging.edusync.ph
- ✅ `QUICK_START_CHECKLIST.md` - Step-by-step checklist
- ✅ `MULTI_ENVIRONMENT_SETUP.md` - This file

---

## 🌐 Environment Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION                                │
│  Domain: edusync.ph                                         │
│  Project: edusync-sis                                       │
│  Data: REAL student/teacher data 🔒                         │
│  Actions: Deploy only, NO seeding, NO cleanup              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    STAGING                                   │
│  Domain: staging.edusync.ph                                 │
│  Project: edusync-sis-staging                               │
│  Data: Demo/test data (tagged with isDemo: true) 🧪        │
│  Actions: Deploy, seed, test, wipe - ALL SAFE              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    LOCAL EMULATOR                            │
│  URL: http://127.0.0.1:5173                                 │
│  Project: edusync-local                                     │
│  Data: Local test data (destroyed on restart)              │
│  Actions: Rapid development, instant reset                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Commands Reference

### Environment Switching
```bash
firebase use production    # Switch to edusync.ph
firebase use staging       # Switch to staging.edusync.ph
firebase use               # Show current project
```

### Deployment
```bash
# Staging (safe - test here first!)
npm run deploy:staging

# Production (careful - only deploy tested code!)
npm run deploy:production
```

### Database Seeding
```bash
# Emulator (local development)
npm run emu:seed:comprehensive
npm run emu:seed:e2e

# Staging (safe to wipe and reseed)
npm run seed:staging        # Seed with demo data
npm run clean:staging       # Wipe and reseed

# Production (NEVER seed production!)
# npm run seed:production   # ❌ Don't run this!
```

### Testing
```bash
# Local emulator tests
npm run test:playwright

# Staging E2E tests
npm run test:staging

# Production E2E tests (read-only, safe)
npm run test:production
```

---

## 🔐 Safety Features

### Production Protection
1. **No cleanup scripts** - `clean-and-reseed-production.cjs` blocks production by default
2. **Requires --force-production** flag - Must explicitly confirm dangerous operations
3. **No seed shortcuts** - No npm scripts that seed production
4. **Separate configs** - Different Firebase configs for each environment

### Staging Freedom
1. **Safe to wipe** - All data tagged with `isDemo: true`
2. **Automated cleanup** - `npm run clean:staging` resets everything
3. **E2E testing** - Run comprehensive tests without fear
4. **Team collaboration** - Share staging URL for UAT

---

## 📋 Typical Workflow

### 1. Development Phase
```bash
# Work locally with emulator
npm run dev:emu

# Make code changes
# Test locally

# Run local E2E tests
npm run test:playwright
```

### 2. Staging Deployment
```bash
# Build and deploy to staging
npm run deploy:staging

# Seed staging with test data
npm run seed:staging

# Run E2E tests against staging
npm run test:staging

# Share staging URL with team
# URL: https://staging.edusync.ph
```

### 3. Production Deployment
```bash
# After staging tests pass...

# Build for production
npm run build:prod

# Deploy to production (frontend only!)
npm run deploy:production

# Verify on edusync.ph
# Monitor for errors

# NEVER run seed or cleanup scripts on production!
```

---

## 🛡️ Security Best Practices

### Production (edusync.ph)
- ✅ Real student/teacher data only
- ✅ Strict access controls
- ✅ Regular backups (Firebase automatic)
- ✅ Monitor usage and errors
- ❌ NEVER run cleanup scripts
- ❌ NEVER run seed scripts
- ❌ NEVER modify data directly

### Staging (staging.edusync.ph)
- ✅ Demo/test data only
- ✅ Can wipe and reseed anytime
- ✅ Share with team for testing
- ✅ Use for client demos
- ✅ Run E2E tests frequently
- ❌ No real student data

### Local Emulator
- ✅ Rapid iteration
- ✅ Offline development
- ✅ No production access
- ✅ Safe experimentation

---

## 📊 Data Isolation

All seed scripts tag data appropriately:

```javascript
// Production seed (future real data)
{
  studentId: 's_001',
  name: 'Juan Dela Cruz',
  // No tags - real data
}

// Staging/Demo data
{
  studentId: 's_demo_001',
  name: 'Test Student',
  isDemo: true,        // ← Tagged for cleanup
  schoolId: 'default'
}

// E2E Test data
{
  applicationId: 'ENR-2025-E2E001',
  status: 'submitted',
  isE2ETest: true,     // ← Tagged for cleanup
  schoolId: 'default'
}
```

---

## 🎓 Training Your Team

Share these commands with your team:

### For Developers
```bash
# Daily development
npm run dev:emu

# Deploy to staging for team review
npm run deploy:staging
```

### For QA/Testers
```bash
# Test on staging
Open: https://staging.edusync.ph
Login: admin@edusync.local / Admin123!

# Run automated tests
npm run test:staging
```

### For Admins (Production)
```bash
# Deploy to production (frontend only)
npm run deploy:production

# Monitor production
Open: https://edusync.ph
Check Firebase Console for errors
```

---

## 🔄 Migration Path

If you need to clean current mixed data:

```bash
# 1. Backup everything first!
firebase use production
firebase firestore:export gs://edusync-sis.firebasestorage.app/backups/$(date +%Y%m%d)

# 2. Identify what's real vs demo
# Review data in Firebase Console
# Document what needs to be preserved

# 3. Option A: Keep mixed data, add tags
# Manually tag demo data with isDemo: true

# 4. Option B: Start fresh on staging
npm run use:staging
npm run clean:staging

# 5. Keep production untouched until ready
# Only deploy frontend updates to production
```

---

## 📈 Next Steps

After setup completion:

1. ✅ Create staging Firebase project
2. ✅ Deploy to staging
3. ✅ Seed staging database
4. ✅ Configure DNS for staging.edusync.ph
5. ✅ Run E2E tests on staging
6. ✅ Train team on workflow
7. ✅ Document production data migration plan (if needed)
8. ✅ Set up monitoring and alerts
9. ✅ Establish deployment schedule
10. ✅ Create incident response plan

---

## 🆘 Support

### Documentation
- `STAGING_SETUP_GUIDE.md` - Detailed setup instructions
- `DNS_SETUP_GUIDE.md` - DNS configuration help
- `QUICK_START_CHECKLIST.md` - Step-by-step checklist
- `E2E_TESTING_GUIDE.md` - Testing documentation

### Firebase Console
- Production: https://console.firebase.google.com/project/edusync-sis
- Staging: https://console.firebase.google.com/project/edusync-sis-staging

### Commands to Check Status
```bash
# Which project am I on?
firebase use

# List all projects
firebase projects:list

# Check deployment
firebase hosting:channel:list

# Verify DNS
nslookup staging.edusync.ph
```

---

## ✨ Success Criteria

You'll know the setup is complete when:

- ✅ `firebase use staging` and `firebase use production` both work
- ✅ https://staging.edusync.ph loads (after DNS propagation)
- ✅ https://edusync.ph still works normally
- ✅ `npm run seed:staging` successfully seeds staging database
- ✅ `npm run test:staging` passes all E2E tests
- ✅ Production database remains untouched
- ✅ Team can deploy to staging without fear
- ✅ You have a safe playground for testing

---

**Congratulations! You now have a professional multi-environment setup! 🎉**

This architecture protects your production data while giving you freedom to test, experiment, and iterate safely on staging.
