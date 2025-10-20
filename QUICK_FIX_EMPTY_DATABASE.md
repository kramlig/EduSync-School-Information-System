# Quick Fix: Add Test User to Production Database

## 🎯 Fastest Solution: Add User via Firebase Console

Since your production database is empty, here's the quickest way to add a test user:

### Step-by-Step:

1. **Go to Firebase Console:**
   ```
   https://console.firebase.google.com/project/edusync-sis/firestore
   ```

2. **Create 'teachers' Collection:**
   - Click "Start collection"
   - Collection ID: `teachers`
   - Click "Next"

3. **Add First Document:**
   - Document ID: `teacher-001`
   - Add these fields:

   | Field | Type | Value |
   |-------|------|-------|
   | `id` | string | `teacher-001` |
   | `email` | string | `admin@school.edu` |
   | `name` | string | `Admin Teacher` |
   | `role` | string | `admin` |
   | `department` | string | `Administration` |
   | `subjects` | array | `["All"]` |

4. **Save** the document

5. **Refresh your app** at http://127.0.0.1:5173/

6. **Login with:**
   - Email: `admin@school.edu`
   - Password: `password` (or any password)
   - Login Type: **Staff**

---

## 🔄 Alternative: Use Emulator (Sample Data Included)

If you want to test with sample data without modifying production:

### Stop current server:
```powershell
# Close the PowerShell window running the server
```

### Start emulator:
```powershell
npm run dev:emu
```

**Note:** This will take a few minutes to:
1. Start Firebase emulators
2. Seed sample data (teachers, students, parents)
3. Start Vite dev server

Once ready, you'll have sample users like:
- `teacher1@example.com`
- `teacher2@example.com`
- `student1@example.com`
- etc.

---

## 🚨 Why This Happened

Your production Firebase database (`edusync-sis`) is currently **empty**. The app needs at least one teacher document in the `teachers` collection to allow staff login.

**Console logs show:**
```
Login screen received 0 users for type "staff"
```

This means the `teachers` collection is either:
- Empty (no documents)
- Doesn't exist yet
- Has permission issues (less likely with admin)

---

## 📝 Quick Add User via Console (5 minutes)

This is the **fastest** solution:

1. Open: https://console.firebase.google.com/project/edusync-sis/firestore
2. Create collection: `teachers`
3. Add one document with the fields above
4. Refresh your app
5. Login!

✅ **This will immediately fix your login issue!**
