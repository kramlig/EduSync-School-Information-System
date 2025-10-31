# 🎯 EduSync Standard Setup Rules

**Last Updated**: October 31, 2025  
**Purpose**: Guaranteed consistent and reliable development environment

---

## 📋 **Port Configuration (FIXED - DO NOT CHANGE)**

| Service | Port | Configuration Files |
|---------|------|---------------------|
| **Firestore Emulator** | `8086` | `firebase.json`, `.env.local`, all seed scripts |
| **Auth Emulator** | `9100` | `firebase.json`, `.env.local` |
| **Storage Emulator** | `9200` | `firebase.json`, `.env.local` |
| **Vite Dev Server** | `5173` | `package.json` scripts |

---

## ✅ **Validation Before Starting**

**ALWAYS run this first when you're unsure:**

```bash
npm run validate
```

This checks:
- ✅ All ports are configured correctly (8086, 9100, 9200, 5173)
- ✅ Environment files match emulator settings
- ✅ Seed scripts point to correct emulator
- ✅ Package.json scripts are correct

**Expected Output**: "✅ ALL CHECKS PASSED"

---

## 🚀 **Standard Commands**

### **Local Development (Emulator)**
```bash
npm run dev:emu
```

**What it does (in order):**
1. Switches to emulator environment (`.env.local.emu` → `.env.local`)
2. Starts Firebase emulators (Firestore:8086, Auth:9100, Storage:9200)
3. Waits for Firestore to be ready on port 8086
4. Runs **seed-complete.cjs** (comprehensive data)
5. Verifies the seeded data
6. Starts Vite dev server on http://127.0.0.1:5173

**Data Seeded:**
- ✅ 40 students (10 per section)
- ✅ 4 sections (Diamond, Ruby, Emerald, Sapphire)
- ✅ 4 teachers + 1 admin
- ✅ 33 learning areas (K-12 curriculum)
- ✅ 4 core values
- ✅ 920 attendance records (23 days × 40 students)
- ✅ 2,640 grade entries
- ✅ 3 announcements

**Admin Login:**
- Email: `admin@edusync.local`
- Password: `admin123`

---

### **Production/UAT Testing**
```bash
npm run dev:uat
```

**What it does:**
- Connects to **live Firebase project** (edusync-sis)
- Uses real production data
- NO emulator, NO seeding

---

### **Manual Seeding Only**
```bash
npm run seed
```

Runs `seed-complete.cjs` directly (emulator must already be running).

---

## 🔧 **Troubleshooting**

### **Problem: "Port 8085 not found" or similar**
**Solution:**
```bash
npm run validate
```
If errors found, ports are misconfigured. Check the output.

---

### **Problem: "No students found" in emulator**
**Solution:**
1. Stop everything: `npx kill-port 8086 9100 9200 5173`
2. Run: `npm run dev:emu` (this will reseed automatically)

---

### **Problem: "Data from yesterday still showing"**
**Solution:**
Emulator data persists. To start fresh:
```bash
npx kill-port 8086 9100 9200 5173
npm run dev:emu
```
The seed script **clears old data automatically** before seeding.

---

### **Problem: "Changes to seed script not applying"**
**Check:**
1. You're editing `scripts/seed-complete.cjs` (NOT `seed-sample.cjs`)
2. Restart emulator: `npm run dev:emu`

---

## 📂 **Key Files**

| File | Purpose | Port Reference |
|------|---------|----------------|
| `firebase.json` | Emulator ports | 8086, 9100, 9200 |
| `.env.local` | Vite environment | 8086, 9100 |
| `.env.local.emu` | Emulator template | 8086, 9100 |
| `.env.staging` | UAT/Production config | No emulator |
| `scripts/seed-complete.cjs` | **PRIMARY SEED SCRIPT** | 8086, 9100 |
| `scripts/emu-seed-and-admin.cjs` | Called by dev:emu | Uses seed-complete.cjs |
| `scripts/validate-setup.cjs` | Validation checker | Checks all ports |
| `package.json` | NPM scripts | 8086, 5173 |

---

## 🎯 **High-Confidence Checklist**

Before starting work each day:

- [ ] Run `npm run validate` → Should show "✅ ALL CHECKS PASSED"
- [ ] Run `npm run dev:emu` → Should start without errors
- [ ] Open http://127.0.0.1:5173
- [ ] Login with `admin@edusync.local` / `admin123`
- [ ] Navigate to **Students** → Should see **40 students**
- [ ] Navigate to **School Forms → SF2** → Should see attendance data
- [ ] Check emulator UI: http://127.0.0.1:4000 → Should see Firestore on port 8086

**If all checkmarks pass:** ✅ **You're good to go!**

---

## 🔒 **Rules to NEVER Break**

1. ❌ **DO NOT change port 8086** (Firestore emulator)
2. ❌ **DO NOT edit `.env.local` manually** (use `npm run env:emu` or `npm run env:prod`)
3. ❌ **DO NOT use `seed-sample.cjs`** (outdated, use `seed-complete.cjs`)
4. ❌ **DO NOT start emulator without seeding** (use `npm run dev:emu`, not raw `firebase emulators:start`)
5. ✅ **ALWAYS run `npm run validate` when in doubt**

---

## 📊 **Environment Quick Reference**

| Command | Environment | Firebase Project | Data Source |
|---------|-------------|------------------|-------------|
| `npm run dev:emu` | Local Emulator | `edusync-local` | Seeded (seed-complete.cjs) |
| `npm run dev:uat` | Production | `edusync-sis` | Live Database |
| `npm run build:prod` | Production Build | `edusync-sis` | N/A |
| `npm run build:uat` | Staging Build | `edusync-sis` | N/A |

---

## 🎓 **Summary**

**For Local Development:**
```bash
npm run validate  # Check setup
npm run dev:emu   # Start everything
```

**For Production Testing:**
```bash
npm run dev:uat
```

**That's it!** These two commands handle everything reliably. ✨

---

**Questions?** Run `npm run validate` first! It will tell you exactly what's wrong.
