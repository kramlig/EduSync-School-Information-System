# Firebase Emulator Standard Operating Procedures

## Purpose
This document establishes the **standard workflow** for working with Firebase Emulators in the EduSync project. Follow these procedures to avoid port conflicts, data inconsistencies, and time-wasting debugging.

---

## 🚀 Standard Workflow

### **Scenario 1: Starting Fresh (Clean Slate)**

**When to use**: First time today, switching branches, or want clean data.

```powershell
# 1. Kill any existing emulator processes (safe to run even if nothing running)
npm run emu:kill

# 2. Start emulator with fresh seed data
npm run dev:emu
```

**What happens**:
- Clears all Firestore data
- Starts Firestore (8086), Auth (9100), Storage (9200) emulators
- Seeds database with complete data (640 students, 8 teachers, etc.)
- Starts Vite dev server on port 5173

**Expected time**: ~2-3 minutes

---

### **Scenario 2: Re-seeding Data Only (Emulator Already Running)**

**When to use**: You only changed seed scripts (`seed-complete.cjs`), want different data, or current data is corrupted.

```powershell
# Just re-run the seed (emulator stays running)
npm run emu:seed:admin
```

**What happens**:
- Clears all Firestore data
- Re-seeds with fresh data
- Emulator keeps running (no restart)

**Expected time**: ~30-60 seconds

**⚠️ Don't use if**: Emulator isn't running or is hung/crashed

---

### **Scenario 3: Emulator is Hung/Frozen**

**When to use**: Browser shows connection errors, `dev:emu` won't start, or ports are stuck.

```powershell
# Option A: Use the kill script (recommended)
npm run emu:kill

# Option B: Manual kill
netstat -ano | findstr ":8086"  # Note the PID
netstat -ano | findstr ":9100"  # Note the PID
taskkill /F /PID <PID_8086>
taskkill /F /PID <PID_9100>

# Then start fresh
npm run dev:emu
```

---

### **Scenario 4: Quick Test Without Full Seed**

**When to use**: Testing a specific feature, don't need all 640 students.

```powershell
# Small dataset (8 teachers, 40 students, 4 sections)
npm run emu:seed:small
```

**Expected time**: ~10-15 seconds

---

### **Scenario 5: Stopping Emulator for the Day**

**When to use**: Done coding, want to free up resources.

```powershell
# Stop everything cleanly
npm run emu:stop
```

Or just press **Ctrl+C** in the terminal running `dev:emu`.

---

## 📋 Standard Scripts Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run dev:emu` | **Full restart** (kill + start + seed + vite) | Starting work, switching branches, major changes |
| `npm run emu:seed:admin` | **Re-seed only** (keep emulator running) | Changed seed script, want fresh data |
| `npm run emu:seed:small` | **Quick small seed** (40 students) | Testing, development |
| `npm run emu:seed:big` | **Large dataset** (3000 students) | Performance testing |
| `npm run emu:kill` | **Force kill** all emulator processes | Emulator hung, port conflicts |
| `npm run emu:stop` | **Graceful stop** | End of work session |
| `npm run emu:up` | **Start emulator only** (no seed, no vite) | Advanced: manual control |

---

## 🛑 Common Mistakes to Avoid

### ❌ **DON'T: Run `npm run dev:emu` twice**
**Problem**: Creates duplicate emulator instances, port conflicts, data corruption.

**Fix**: Always kill existing emulator first:
```powershell
npm run emu:kill
npm run dev:emu
```

---

### ❌ **DON'T: Re-seed while emulator is starting**
**Problem**: Seed script runs before emulator is ready, fails silently.

**Fix**: Wait for emulator to fully start:
```powershell
npm run dev:emu
# Wait for: "✅ Created X students" message
# Then browser auto-opens
```

---

### ❌ **DON'T: Edit Firestore data manually without re-seeding**
**Problem**: Inconsistent data, broken relationships (e.g., student without section).

**Fix**: Always re-seed after manual edits:
```powershell
npm run emu:seed:admin
```

---

### ❌ **DON'T: Use production Firebase config in `.env.local` during emulator development**
**Problem**: Accidentally writes test data to production database.

**Fix**: Always run `npm run env:emu` first (or it's auto-run by `dev:emu`):
```powershell
npm run env:emu  # Switches to emulator config
npm run dev:emu
```

---

## 🔍 Troubleshooting Decision Tree

```
Emulator won't start?
├─ Port already in use?
│  └─ Run: npm run emu:kill
│     Then: npm run dev:emu
│
├─ WebChannel 400 errors?
│  └─ Hard refresh browser: Ctrl+Shift+R
│     (Clears cached JS with old Firestore config)
│
├─ Seed script hangs/crashes?
│  └─ Use small seed: npm run emu:seed:small
│     Or check seed script logs
│
├─ Data looks wrong/missing?
│  └─ Re-seed: npm run emu:seed:admin
│
└─ Emulator UI (localhost:4000) not loading?
   └─ Check if emulator started: netstat -ano | findstr ":8086"
      If not running: npm run emu:up
```

---

## 🎯 Best Practices

### **1. Start of Day Routine**
```powershell
# Standard morning startup (3 minutes)
npm run emu:kill   # Clean slate
npm run dev:emu    # Fresh start
```

### **2. After Pulling New Code**
```powershell
# If seed scripts changed
npm run emu:seed:admin

# If emulator config changed
npm run emu:kill
npm run dev:emu
```

### **3. Testing Workflow**
```powershell
# During active development (fast iterations)
npm run emu:seed:small  # Quick reset between tests
```

### **4. Before Committing Code**
```powershell
# Final verification with full dataset
npm run emu:seed:admin
# Test all features
```

### **5. End of Day**
```powershell
# Clean shutdown
Ctrl+C  # In the dev:emu terminal
```

---

## 📊 Seed Data Sizes

| Seed Command | Students | Teachers | Sections | Time | Use Case |
|--------------|----------|----------|----------|------|----------|
| `emu:seed:small` | 40 | 8 | 4 | 15s | Quick testing |
| `emu:seed:admin` | 640 | 8 | 26 | 60s | Standard development |
| `emu:seed:big` | 3000 | 300 | 50 | 5m | Performance testing |

---

## 🔧 Advanced: Custom Workflow

### **Start Emulator Without Seeding**
```powershell
npm run emu:up      # Start emulator only
# Manually seed or import data
npm run emu:seed:admin
```

### **Keep Emulator Running, Restart Vite Only**
```powershell
# In a separate terminal
npm run dev:emu:serve
```

### **Connect to Production Firebase (UAT Testing)**
```powershell
npm run dev:uat  # Uses production Firebase, NOT emulator
```

---

## ✅ Quick Reference Card

**Print this and keep on your desk!**

```
┌─────────────────────────────────────────────────┐
│  EDUSYNC EMULATOR QUICK REFERENCE               │
├─────────────────────────────────────────────────┤
│  START FRESH:     npm run dev:emu               │
│  RE-SEED ONLY:    npm run emu:seed:admin        │
│  FORCE KILL:      npm run emu:kill              │
│  SMALL DATASET:   npm run emu:seed:small        │
│  EMULATOR UI:     http://localhost:4000         │
│  APP:             http://localhost:5173         │
│                                                  │
│  PORTS:                                          │
│    Firestore: 8086                               │
│    Auth:      9100                               │
│    Storage:   9200                               │
│    Vite:      5173                               │
│    Emulator:  4000                               │
│                                                  │
│  EMERGENCY:   Ctrl+C, then npm run emu:kill     │
└─────────────────────────────────────────────────┘
```

---

## 🚨 Emergency Procedures

### **Everything is Broken**
```powershell
# Nuclear option (resets everything)
npm run emu:kill
rm -rf node_modules/.vite  # Clear Vite cache
rm -rf .firebase           # Clear emulator data
npm run dev:emu
```

### **Port Conflicts**
```powershell
# Find what's using the port
netstat -ano | findstr ":5173"
netstat -ano | findstr ":8086"

# Kill specific process
taskkill /F /PID <PID>
```

### **Seed Script Hangs**
```powershell
# Kill seed process (if hung)
Ctrl+C

# Use smaller seed
npm run emu:seed:small

# Or check seed script for errors
node scripts/seed-complete.cjs 2>&1 | Select-String "Error"
```

---

## 📝 Standard Operating Checklist

**Before starting work:**
- [ ] Check if emulator is already running: `netstat -ano | findstr ":8086"`
- [ ] Kill existing emulator if found: `npm run emu:kill`
- [ ] Start fresh: `npm run dev:emu`
- [ ] Wait for "Created X students" message
- [ ] Browser opens automatically to `localhost:5173`
- [ ] Test login: `admin@edusync.local` / `admin123`

**During development:**
- [ ] If seed script changes: `npm run emu:seed:admin`
- [ ] If emulator hangs: `npm run emu:kill` → `npm run dev:emu`
- [ ] If browser errors: Hard refresh `Ctrl+Shift+R`

**Before committing:**
- [ ] Re-seed with full data: `npm run emu:seed:admin`
- [ ] Test all affected features
- [ ] Check console for errors
- [ ] Verify Firestore data in UI (`localhost:4000`)

**End of day:**
- [ ] Stop emulator: `Ctrl+C` in terminal
- [ ] (Optional) Clear data: `rm -rf .firebase`

---

## 🎓 Training: Common Scenarios

### **Scenario: "I pulled new code and now data looks wrong"**
**Solution**: Re-seed the database
```powershell
npm run emu:seed:admin
```

### **Scenario: "Browser shows 400 Bad Request errors"**
**Solution**: Hard refresh to reload JavaScript
```
Press: Ctrl+Shift+R
```

### **Scenario: "I want to test with less data to iterate faster"**
**Solution**: Use small seed
```powershell
npm run emu:seed:small
```

### **Scenario: "Emulator won't start, says port in use"**
**Solution**: Kill existing emulator
```powershell
npm run emu:kill
npm run dev:emu
```

### **Scenario: "I accidentally ran dev:emu twice"**
**Solution**: Kill all and restart
```powershell
npm run emu:kill
npm run dev:emu
```

---

## 📚 Related Documentation

- [Seed Data Refinement](./SEED_DATA_REFINEMENT.md) - What data is created
- [WebChannel Fix](./WEBCHANNEL_FIX.md) - Connection troubleshooting
- [Collection Structure](./COLLECTION_STRUCTURE_COMPARISON.md) - Database schema
- [Copilot Instructions](../.github/copilot-instructions.md) - Architecture overview

---

## 🔄 Update Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-07 | Initial standard procedures created | Copilot |
| | | |

---

**Remember**: When in doubt, run `npm run dev:emu` for a clean slate. It's better to wait 3 minutes for a fresh start than waste 30 minutes debugging stale data.
