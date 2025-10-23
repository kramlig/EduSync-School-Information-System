# Quick Command Reference - Option C Refactor

**Branch:** `refactor/firestore-subscriptions`  
**Current Status:** ✅ Setup Complete, Ready for Day 1

---

## 🚀 Day 1 Commands

### Create New Hook File
```powershell
# Create the file
New-Item -Path "hooks\useFirestoreData.ts" -ItemType File

# Open in VS Code
code hooks\useFirestoreData.ts
```

### Verify Build (After Changes)
```powershell
npm run build
```

### Commit Checkpoints
```powershell
# After creating hook structure
git add hooks/useFirestoreData.ts
git commit -m "feat: Create useFirestoreData hook structure with 2 collections"

# After adding all collections
git add hooks/useFirestoreData.ts
git commit -m "feat: Implement all 16 collection subscriptions"

# After adding CRUD methods
git add hooks/useFirestoreData.ts
git commit -m "feat: Add all CRUD and search methods to useFirestoreData"
```

---

## 🧪 Testing Commands

### Build Only
```powershell
npm run build
```

### Run Offline Tests
```powershell
# Run offline-first-visit test (currently 1/2 passing)
npx playwright test tests/offline-first-visit.spec.ts

# Run full offline audit (currently 14/14 passing)
npx playwright test tests/offline-audit.spec.ts

# Run all tests
npx playwright test
```

### Run Tests in Headed Mode (Visual Debugging)
```powershell
npx playwright test tests/offline-first-visit.spec.ts --headed
```

---

## 📊 Metrics Commands

### Check Bundle Size
```powershell
npm run build
# Look for dist/assets/*.js file sizes
```

### Check Build Time
```powershell
Measure-Command { npm run build }
```

### Check Git Status
```powershell
git status
git log --oneline -5
git branch
```

---

## 🛡️ Rollback Commands (Emergency)

### Quick Rollback
```powershell
# Switch to safe branch
git checkout perf/login-optimization

# Restore React Query version
Copy-Item "hooks\useSchoolData.REACT_QUERY_BACKUP.ts" -Destination "hooks\useSchoolData.ts" -Force

# Reinstall dependencies
npm install

# Verify
npm run build
```

### Return to Refactor Branch
```powershell
git checkout refactor/firestore-subscriptions
```

---

## 📖 Documentation Commands

### Open Documentation
```powershell
# Full plan
start OPTION_C_REFACTOR_TRACKER.md

# Quick reference
start REFACTOR_QUICK_START.md

# Setup summary
start SETUP_COMPLETE.md
```

### Open Backup (Reference)
```powershell
code hooks\useSchoolData.REACT_QUERY_BACKUP.ts
```

---

## 🔍 Debugging Commands

### Check Firestore Connection
```powershell
# In browser console after running app:
# Check if persistence is enabled
```

### Check Service Worker (Day 3+)
```powershell
# In browser:
# F12 -> Application tab -> Service Workers
```

### View Build Output
```powershell
# Open dist folder
explorer dist

# Check index.html
code dist\index.html
```

---

## 📦 Package Management (Day 2+)

### Remove React Query
```powershell
npm uninstall @tanstack/react-query
npm install  # Update package-lock.json
```

### Add PWA Plugin (Day 3)
```powershell
npm install -D vite-plugin-pwa
npm install -D workbox-window
```

---

## 🎯 Daily Workflow

### Start of Day
```powershell
# Verify branch
git branch
# Should show: * refactor/firestore-subscriptions

# Check git status
git status
# Should be clean

# Open docs
start OPTION_C_REFACTOR_TRACKER.md
```

### During Development
```powershell
# Frequent builds to catch errors early
npm run build

# Commit frequently
git add -A
git commit -m "wip: [description of current work]"
```

### End of Day
```powershell
# Run full test suite
npx playwright test

# Check metrics
npm run build

# Commit final checkpoint
git add -A
git commit -m "feat: Day X complete - [summary]"

# Update tracker
code OPTION_C_REFACTOR_TRACKER.md
# Mark completed tasks with ✅
```

---

## 🔧 Troubleshooting Commands

### If Build Fails
```powershell
# Clear cache and rebuild
Remove-Item -Recurse -Force node_modules\.vite
npm run build
```

### If TypeScript Errors
```powershell
# Check types
npx tsc --noEmit
```

### If Tests Fail
```powershell
# Run single test with full output
npx playwright test tests/offline-first-visit.spec.ts --reporter=list

# Debug mode
npx playwright test tests/offline-first-visit.spec.ts --debug
```

### If Hook Causes Issues
```powershell
# Check for infinite loops
# Add console.log at top of hook:
console.log('[useFirestoreData] RENDER');

# Run dev server and watch console
npm run dev
```

---

## 📝 File Locations Quick Reference

```
├── hooks/
│   ├── useSchoolData.ts               ← Current (will delete Day 2)
│   ├── useSchoolData.REACT_QUERY_BACKUP.ts  ← Backup
│   └── useFirestoreData.ts            ← New (create Day 1)
│
├── tests/
│   ├── offline-first-visit.spec.ts    ← Problem test (1/2 passing)
│   └── offline-audit.spec.ts          ← Regression test (14/14 passing)
│
├── OPTION_C_REFACTOR_TRACKER.md       ← Full plan
├── REFACTOR_QUICK_START.md            ← Day 1 reference
├── REFACTOR_PREFLIGHT.md              ← Verification checklist
├── SETUP_COMPLETE.md                  ← Go-live summary
└── QUICK_COMMANDS.md                  ← This file
```

---

## 🎓 Useful PowerShell Aliases (Optional)

```powershell
# Add to your PowerShell profile (optional)

# Quick build
function qb { npm run build }

# Quick test
function qt { npx playwright test }

# Open tracker
function tracker { start OPTION_C_REFACTOR_TRACKER.md }

# Git shortcuts
function gs { git status }
function gl { git log --oneline -10 }
function gb { git branch }
```

---

## 📞 Quick Help

### Can't find a file?
```powershell
Get-ChildItem -Recurse -Filter "useSchoolData*"
```

### Need to see git history?
```powershell
git log --oneline --all --graph -10
```

### Want to see what changed?
```powershell
git diff hooks/useSchoolData.ts hooks/useSchoolData.REACT_QUERY_BACKUP.ts
```

### Need to stash changes?
```powershell
git stash
git stash list
git stash pop
```

---

## ✅ Pre-Flight Checklist (Before Starting)

```powershell
# Run these to verify setup:
git branch              # Should show: * refactor/firestore-subscriptions
git status              # Should be: clean
npm run build           # Should: succeed in ~4.5s
Test-Path "hooks\useSchoolData.REACT_QUERY_BACKUP.ts"  # Should: True
```

---

**Ready to code! 🚀**

**First command to run:**
```powershell
New-Item -Path "hooks\useFirestoreData.ts" -ItemType File
code hooks\useFirestoreData.ts
```
