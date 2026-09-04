# Multi-Environment Setup Guide
## Production (edusync.ph) + Staging (staging.edusync.ph)

This guide will set up proper separation between production and staging environments.

---

## 🎯 Overview

**Current Setup (Single Project - RISKY):**
```
edusync.ph → edusync-sis → Mixed demo + production data ⚠️
```

**New Setup (Multi-Project - SAFE):**
```
edusync.ph         → edusync-sis         → Real production data only 🔒
staging.edusync.ph → edusync-sis-staging → Test/demo data (safe to wipe) 🧪
```

---

## 📋 Step-by-Step Setup

### STEP 1: Create Staging Firebase Project

```bash
# 1. Create new Firebase project
firebase projects:create edusync-sis-staging

# 2. Add to your workspace
firebase use --add

# When prompted:
# ? Which project do you want to add? edusync-sis-staging
# ? What alias do you want to use for this project? staging

# 3. Verify setup
firebase projects:list
```

**Expected Output:**
```
┌──────────────────────┬────────────────────┬────────────────┬──────────────────────┐
│ Project Display Name │ Project ID         │ Project Number │ Resource Location ID │
├──────────────────────┼────────────────────┼────────────────┼──────────────────────┤
│ EduSync SIS          │ edusync-sis        │ ...            │ asia-southeast1      │
├──────────────────────┼────────────────────┼────────────────┼──────────────────────┤
│ EduSync SIS Staging  │ edusync-sis-staging│ ...            │ asia-southeast1      │
└──────────────────────┴────────────────────┴────────────────┴──────────────────────┘
```

---

### STEP 2: Enable Firebase Services for Staging

```bash
# Switch to staging project
firebase use staging

# Enable Firestore
firebase firestore:databases:create --location=asia-southeast1

# Enable Authentication (via Firebase Console is easier)
# Go to: https://console.firebase.google.com/project/edusync-sis-staging/authentication
# Click "Get Started"

# Enable Storage
# Go to: https://console.firebase.google.com/project/edusync-sis-staging/storage
# Click "Get Started"
```

---

### STEP 3: Deploy Security Rules to Staging

```bash
# Switch to staging
firebase use staging

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

---

### STEP 4: Setup Custom Domain (staging.edusync.ph)

#### A. In Firebase Console

1. Go to: https://console.firebase.google.com/project/edusync-sis-staging/hosting
2. Click "Add custom domain"
3. Enter: `staging.edusync.ph`
4. Firebase will provide DNS records (save these!)

#### B. Update DNS Records

Add these records to your domain registrar (where you bought edusync.ph):

**For staging.edusync.ph:**
```
Type: A
Name: staging
Value: [Firebase will provide IP addresses]

Type: TXT  
Name: staging
Value: [Firebase verification token]
```

**Example (typical Firebase IPs):**
```
A     staging    151.101.1.195
A     staging    151.101.65.195
TXT   staging    firebase=edusync-sis-staging
```

#### C. Wait for SSL Certificate

- DNS propagation: 10 minutes - 24 hours
- SSL certificate: Auto-issued by Firebase
- Status: Check in Firebase Console

---

### STEP 5: Deploy Frontend to Staging

```bash
# Switch to staging
firebase use staging

# Build for staging
npm run build:uat

# Deploy
firebase deploy --only hosting

# View your staging site
# https://edusync-sis-staging.web.app (immediate)
# https://staging.edusync.ph (after DNS propagation)
```

---

### STEP 6: Seed Staging Database

```bash
# Make sure you're on staging project
firebase use staging

# Run comprehensive seed
node scripts/seed-production-comprehensive.cjs --project=edusync-sis-staging

# Add E2E test data
node scripts/seed-e2e-test-data.cjs --project=edusync-sis-staging
```

---

## 🔧 Updated Workflow

### Daily Development

```bash
# Work with emulator (local)
npm run dev:emu

# Test changes locally
npm run emu:seed:e2e
npx playwright test --config=playwright.emulator.config.ts
```

### Deploy to Staging (for team testing)

```bash
# Switch to staging
firebase use staging

# Build and deploy
npm run build:uat
firebase deploy

# Seed/reseed staging data (SAFE - can wipe anytime)
npm run clean:staging
npm run seed:staging
```

### Deploy to Production (CAREFUL!)

```bash
# Switch to production
firebase use production

# Build production
npm run build:prod

# Deploy (NO DATABASE CHANGES!)
firebase deploy --only hosting

# NEVER run seed scripts on production!
```

---

## 📝 Environment-Specific Commands

I've added these npm scripts to package.json:

### Staging Commands
```bash
npm run use:staging          # Switch to staging project
npm run deploy:staging       # Build & deploy to staging
npm run seed:staging         # Seed staging database
npm run clean:staging        # Clean & reseed staging (SAFE)
npm run test:staging         # Run E2E tests against staging
```

### Production Commands
```bash
npm run use:production       # Switch to production project
npm run deploy:production    # Build & deploy to production
# NO seed/clean scripts for production!
```

---

## 🔐 Security Best Practices

### Production (`edusync.ph`)
- ✅ Real student/teacher data
- ✅ Strict access controls
- ✅ Regular backups
- ❌ NEVER run cleanup scripts
- ❌ NEVER run seed scripts
- ❌ NEVER run E2E tests

### Staging (`staging.edusync.ph`)
- ✅ Demo/test data only
- ✅ Can wipe and reseed anytime
- ✅ Run E2E tests freely
- ✅ Team testing and UAT
- ❌ No real student data

---

## 📊 Current Project Status Check

Run this to see which project you're currently using:

```bash
firebase use
```

Output will show:
```
Active Project: staging (edusync-sis-staging)

Project aliases for C:\...\EduSync-School-Information-System:
* production (edusync-sis)
* staging (edusync-sis-staging)
```

---

## 🆘 Troubleshooting

### "Project doesn't exist"
```bash
# Make sure you created it
firebase projects:create edusync-sis-staging

# Add to workspace
firebase use --add
```

### "Permission denied"
```bash
# Make sure you're logged in with correct account
firebase login --reauth

# Check your account
firebase login:list
```

### "Hosting setup failed"
```bash
# Initialize hosting for staging
firebase use staging
firebase init hosting
# Choose: Build directory = dist
# Configure as single-page app? Yes
# Set up automatic builds with GitHub? No (for now)
```

### DNS not propagating
```bash
# Check DNS status
nslookup staging.edusync.ph

# Check with different DNS
nslookup staging.edusync.ph 8.8.8.8

# Be patient - can take up to 24 hours
```

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Staging project created and accessible in Firebase Console
- [ ] Firestore enabled in staging
- [ ] Authentication enabled in staging  
- [ ] Security rules deployed to staging
- [ ] Frontend deployed to `edusync-sis-staging.web.app`
- [ ] Custom domain `staging.edusync.ph` configured (DNS propagating)
- [ ] Staging database seeded with test data
- [ ] E2E tests pass against staging
- [ ] Production project untouched and working
- [ ] `.firebaserc` has both project aliases

---

## 🎓 Next Steps

Once staging is set up:

1. **Test thoroughly on staging** before any production deploy
2. **Run E2E tests** against staging after each deployment
3. **Use staging for demos** and client presentations
4. **Keep production pristine** - only deploy tested code

---

## 📚 Quick Reference

```bash
# Switch projects
firebase use staging       # Switch to staging
firebase use production    # Switch to production

# Deploy
firebase deploy --only hosting                    # Deploy frontend
firebase deploy --only firestore:rules            # Deploy security rules
firebase deploy --only functions                  # Deploy cloud functions

# Seed data (STAGING ONLY)
npm run clean:staging      # Wipe and reseed staging
npm run seed:staging       # Just seed staging

# Test
npm run test:staging       # E2E tests against staging
npm run test:emulator      # E2E tests against local emulator
```

---

**Time to Complete:** 30-45 minutes (excluding DNS propagation)  
**Difficulty:** Intermediate  
**Safety:** High - Protects production data  
**Recommended:** Essential for professional development workflow
