# 🚀 Quick Deployment Guide

## Current Configuration Status

✅ **Production Site:** https://edusync-sis.web.app  
✅ **Connected to:** Production Firestore (edusync-sis)  
✅ **Local Environment:** Emulator mode (for development)

---

## 📋 Deployment Checklist

Before deploying to production, always follow these steps:

```bash
# 1️⃣ Switch to production environment
npm run env:prod

# 2️⃣ Build with production config
npm run build

# 3️⃣ Deploy to Firebase
firebase deploy --only hosting

# 4️⃣ Switch back to emulator for local dev
npm run env:emu
```

---

## 🔄 Environment Commands

| Command | Purpose | Connects To |
|---------|---------|-------------|
| `npm run env:emu` | Local development | Firebase Emulators (localhost) |
| `npm run env:prod` | Production deployment | Production Firestore (edusync-sis) |

---

## ⚠️ Common Mistakes

### ❌ Don't Do This:
```bash
# Building while in emulator mode will break production!
npm run build  # ← Wrong! Still in emulator mode
firebase deploy
```

### ✅ Always Do This:
```bash
# Always switch to prod before building
npm run env:prod
npm run build
firebase deploy --only hosting
npm run env:emu  # Switch back
```

---

## 🧪 Testing Before Deployment

```bash
# Test locally with production-like environment
npm run env:prod
npm run dev

# Visit: http://localhost:5173
# Verify it connects to production Firestore (check console)

# When satisfied, build and deploy
npm run build
firebase deploy --only hosting

# Switch back to emulator
npm run env:emu
```

---

## 🔍 How to Verify Production Connection

After deploying, open the browser console on https://edusync-sis.web.app and check for:

✅ **Correct:** No emulator messages  
✅ **Correct:** Firebase SDK initializes without errors  
✅ **Correct:** Data loads from production Firestore  

❌ **Wrong:** Console shows "Firebase emulator: 127.0.0.1:8085"  
❌ **Wrong:** Connection errors or no data  

---

## 📦 What Each Environment File Does

- **`.env.local.emu`** → Points to emulators (localhost)
- **`.env.local.prod`** → Points to production (edusync-sis)
- **`.env.local`** → Active configuration (switches between above)

The `npm run env:*` commands simply copy the appropriate file to `.env.local`

---

## 🚨 Emergency: Production Not Working?

If production site isn't loading data:

1. **Check which config was used:**
   ```bash
   # In project folder
   cat .env.local | grep PROJECT_ID
   ```
   Should show: `VITE_FIREBASE_PROJECT_ID=edusync-sis`

2. **If it shows "edusync-local", redeploy:**
   ```bash
   npm run env:prod
   npm run build
   firebase deploy --only hosting
   ```

3. **Verify on live site:**
   - Open browser console
   - Look for Firebase initialization messages
   - Should NOT see emulator messages

---

## 📝 Quick Tips

- 💡 Always check `.env.local` before building
- 💡 Production builds are cached - force refresh (Ctrl+F5) to test
- 💡 Keep local development in emulator mode (faster, offline)
- 💡 Only switch to prod when ready to deploy

---

## ✨ Current Status

🟢 **Production:** Deployed and working  
🟢 **Local Dev:** Emulator mode active  
🟢 **Git:** All changes committed and pushed  

You're all set! 🎉
