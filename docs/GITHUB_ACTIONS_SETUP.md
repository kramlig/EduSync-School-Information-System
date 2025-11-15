# GitHub Actions Deployment Setup Guide

## Step 1: Generate Firebase Service Account

1. Go to: https://console.firebase.google.com/project/edusync-staging/settings/serviceaccounts/adminsdk
2. Click **"Generate new private key"**
3. Click **"Generate key"** (downloads JSON file)
4. Save the JSON file securely (don't commit to Git!)

## Step 2: Add Service Account to GitHub Secrets

1. Go to: https://github.com/kramlig/EduSync-School-Information-System/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `FIREBASE_SERVICE_ACCOUNT_STAGING`
4. Value: Paste the **entire JSON content** from the downloaded file
5. Click **"Add secret"**

## Step 3: Push Code to GitHub

```powershell
# In your project directory
git add .
git commit -m "Add GitHub Actions deployment workflow"
git push origin main
```

## Step 4: Trigger Deployment

### Option A: Manual Trigger
1. Go to: https://github.com/kramlig/EduSync-School-Information-System/actions
2. Click **"Deploy to Staging"** workflow
3. Click **"Run workflow"**
4. Select branch: `main`
5. Click **"Run workflow"**

### Option B: Auto-deploy (create staging branch)
```powershell
git checkout -b staging
git push origin staging
# Auto-deploys whenever you push to staging branch
```

## Step 5: Verify Deployment

1. Check GitHub Actions: https://github.com/kramlig/EduSync-School-Information-System/actions
2. Wait for green checkmark ✅
3. Visit: https://edusync-staging.web.app
4. Test login with demo accounts

---

## Alternative: Quick Deploy via Firebase Console (UI)

If GitHub Actions is too complex right now:

1. Go to: https://console.firebase.google.com/project/edusync-staging/hosting/main
2. Click **"Add another site"** (if needed)
3. Or click on existing site
4. There's NO direct upload UI in new Firebase Console 😞

**So we're back to needing either:**
- GitHub Actions (proper CI/CD)
- GCS direct upload (manual but works)
- WSL installation (5 min install)

---

## FASTEST SOLUTION: Install WSL (5 minutes)

```powershell
# 1. Install WSL (requires admin, one-time setup)
wsl --install

# 2. Restart computer

# 3. After restart, deploy via WSL:
wsl
cd /mnt/c/Users/Mark` Gil` Dotillos/Workspaces/EduSyncSIS/EduSync-School-Information-System
npm install -g firebase-tools
firebase login --no-localhost
firebase use staging
firebase deploy --only hosting
```

---

## My Recommendation

**For TODAY (immediate E2E testing)**:
- Install WSL (5 min) → Deploy via Linux environment

**For LONG-TERM (proper CI/CD)**:
- Set up GitHub Actions (15 min) → Automated deployments

Which approach do you prefer?
