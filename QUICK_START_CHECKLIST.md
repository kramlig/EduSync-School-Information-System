# 🚀 Multi-Environment Setup - Quick Start Checklist

Complete these steps to set up staging environment separate from production.

---

## ✅ Setup Checklist

### Phase 1: Firebase Project Setup (15 minutes)

- [ ] **Create staging Firebase project**
  ```bash
  firebase projects:create edusync-sis-staging
  ```

- [ ] **Add project to workspace**
  ```bash
  firebase use --add
  # Select: edusync-sis-staging
  # Alias: staging
  ```

- [ ] **Verify projects**
  ```bash
  firebase projects:list
  ```
  Should see both `edusync-sis` and `edusync-sis-staging`

### Phase 2: Enable Firebase Services (10 minutes)

- [ ] **Switch to staging**
  ```bash
  firebase use staging
  ```

- [ ] **Enable Firestore**
  ```bash
  firebase firestore:databases:create --location=asia-southeast1
  ```

- [ ] **Enable Authentication** (via Console)
  - Go to: https://console.firebase.google.com/project/edusync-sis-staging/authentication
  - Click "Get Started"
  - Enable Email/Password provider

- [ ] **Enable Storage** (via Console)
  - Go to: https://console.firebase.google.com/project/edusync-sis-staging/storage
  - Click "Get Started"

### Phase 3: Deploy Security Rules (5 minutes)

- [ ] **Deploy Firestore rules**
  ```bash
  firebase use staging
  firebase deploy --only firestore:rules
  firebase deploy --only firestore:indexes
  ```

- [ ] **Deploy Storage rules**
  ```bash
  firebase deploy --only storage
  ```

### Phase 4: Deploy Frontend (10 minutes)

- [ ] **Build for staging**
  ```bash
  npm run build:uat
  ```

- [ ] **Deploy to Firebase**
  ```bash
  firebase use staging
  firebase deploy --only hosting --config firebase.staging.json
  ```

- [ ] **Verify deployment**
  - Open: https://edusync-sis-staging.web.app
  - Should see login page

### Phase 5: Seed Database (5-10 minutes)

- [ ] **Seed staging with comprehensive data**
  ```bash
  npm run seed:staging
  ```
  This runs both production seed + E2E test data

- [ ] **Verify seeding in Firebase Console**
  - Go to: https://console.firebase.google.com/project/edusync-sis-staging/firestore
  - Check collections: students, teachers, grades, enrollmentApplications

### Phase 6: Custom Domain (24-48 hours)

- [ ] **Add custom domain in Firebase Console**
  - Go to: Hosting → Add custom domain
  - Enter: `staging.edusync.ph`
  - Copy provided DNS records

- [ ] **Update DNS records** (see DNS_SETUP_GUIDE.md)
  - Add A records
  - Add TXT verification record
  - Wait for propagation

- [ ] **Verify DNS propagation**
  ```bash
  nslookup staging.edusync.ph
  ```

- [ ] **Wait for SSL certificate**
  - Check status in Firebase Console
  - Wait for "Connected" status

### Phase 7: Test Everything (15 minutes)

- [ ] **Access staging site**
  - URL: https://edusync-sis-staging.web.app
  - Or: https://staging.edusync.ph (after DNS)

- [ ] **Test login with seed data**
  - Admin: `admin@edusync.local` / `Admin123!`
  - Teacher: `teacher_1@test.local` / `Teacher123!`
  - Parent: `parent.test1@e2etest.com` / `TestParent123!`

- [ ] **Run E2E tests**
  ```bash
  npm run test:staging
  ```

- [ ] **Verify data isolation**
  - Staging database should have demo data
  - Production database should be untouched

---

## 🎯 Post-Setup Workflow

### Daily Development
```bash
# Local development with emulator
npm run dev:emu
```

### Deploy to Staging (for team testing)
```bash
# Build and deploy
npm run deploy:staging

# Or clean and reseed
npm run clean:staging
```

### Deploy to Production (CAREFUL!)
```bash
# Switch to production
npm run use:production

# Build and deploy (frontend only!)
npm run deploy:production

# NEVER run seed scripts on production!
```

---

## 📊 Verification

Run these commands to verify setup:

```bash
# Check current project
firebase use

# List all projects
firebase projects:list

# Check npm scripts
npm run | grep "staging\|production"

# Test staging seed (dry run)
npm run use:staging
```

---

## 🆘 Troubleshooting

### "Project doesn't exist"
- Make sure you created it: `firebase projects:create edusync-sis-staging`
- Check Firebase Console: https://console.firebase.google.com

### "Permission denied"
- Re-authenticate: `firebase login --reauth`
- Check account: `firebase login:list`

### "Deployment failed"
- Check build succeeded: `npm run build:uat`
- Verify Firebase config: `firebase use`
- Check deployment target: `firebase hosting:channel:list`

### DNS not working
- Be patient (24-48 hours for full propagation)
- Check propagation: https://dnschecker.org
- Verify records match Firebase's requirements

---

## 📚 Documentation

- **STAGING_SETUP_GUIDE.md** - Complete step-by-step guide
- **DNS_SETUP_GUIDE.md** - DNS configuration details
- **E2E_TESTING_GUIDE.md** - Testing workflow

---

## ✨ Benefits

After setup, you'll have:

✅ **Separate environments** - No risk of touching production data  
✅ **Safe testing** - Wipe and reseed staging anytime  
✅ **Professional workflow** - Test → Stage → Production  
✅ **Custom domains** - edusync.ph (prod) + staging.edusync.ph  
✅ **E2E tests** - Run comprehensive tests on staging  
✅ **Team collaboration** - Share staging for UAT  

---

**Estimated Total Time:** 1-2 hours (excluding DNS propagation)

**Status Tracking:**
- [ ] Phase 1 Complete
- [ ] Phase 2 Complete
- [ ] Phase 3 Complete
- [ ] Phase 4 Complete
- [ ] Phase 5 Complete
- [ ] Phase 6 Complete (may take 24-48 hours)
- [ ] Phase 7 Complete

---

Good luck! 🚀
