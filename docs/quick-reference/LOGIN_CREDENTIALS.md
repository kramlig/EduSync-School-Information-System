# 🔑 EduSync Login Credentials - Quick Reference

**Environment:** Firebase Emulator (Local Development)  
**Last Updated:** January 2025  
**Total Accounts:** 90 users

---

## 👨‍💼 Admin Account

```
Email:    admin@edusync.local
Password: admin123
Role:     Administrator
Access:   Full system access
```

---

## 👩‍🏫 Teacher Accounts (9 total)

**Default Password for ALL teachers:** `teacher123`

### Primary Teachers (DepEd K-12 Curriculum)
```
1. roberto.santos@edusync.local   (Roberto Santos)
2. ana.cruz@edusync.local         (Ana Cruz)
3. pedro.garcia@edusync.local     (Pedro Garcia)
4. maria.lopez@edusync.local      (Maria Lopez)
```

### Additional Teachers
```
5. jordanpatel@school.edu
6. drewgarcia@school.edu
7. jamielee@school.edu
8. rileylopez@school.edu
```

**Test Login:**
```
Email:    roberto.santos@edusync.local
Password: teacher123
```

---

## 🎓 Student Accounts (80 total)

**Default Password for ALL students:** `student123`

### Sample Students (DepEd Format)
```
1.  juan.garcia1@student.local         (Juan Garcia)
2.  maria.rodriguez2@student.local     (Maria Rodriguez)
3.  jose.martinez3@student.local       (Jose Martinez)
4.  ana.torres4@student.local          (Ana Torres)
5.  pedro.cruz5@student.local          (Pedro Cruz)
6.  rosa.garcia6@student.local         (Rosa Garcia)
7.  carlos.rodriguez7@student.local    (Carlos Rodriguez)
8.  sofia.martinez8@student.local      (Sofia Martinez)
9.  miguel.torres9@student.local       (Miguel Torres)
10. isabella.cruz10@student.local      (Isabella Cruz)
```

### Additional Students (70 more)
Pattern: `firstname.lastname[number]@students.edu`
Examples:
```
- jordanmartinez.1292@students.edu
- rileypatel.8198@students.edu
- morganreyes.9082@students.edu
- drewlee.7145@students.edu
- caseylopez.7255@students.edu
```

**Test Login:**
```
Email:    juan.garcia1@student.local
Password: student123
```

---

## 👨‍👩‍👧‍👦 Parent Accounts

**Status:** ❌ No parent accounts currently available

**Reason:** No parents exist in the seeded database

**To Add Parents:**
1. Update seed scripts to create parent records
2. Run `npm run emu:seed:small`
3. Run `node scripts/create-auth-accounts.cjs`

---

## 🧪 Quick Test Scenarios

### Scenario 1: Admin Dashboard
```
Login:  admin@edusync.local / admin123
Test:   Access all modules, create users, view reports
```

### Scenario 2: Teacher - Conduct ELLN Assessment
```
Login:  roberto.santos@edusync.local / teacher123
Test:   Navigate to ELLN → Assessment → Select student → Enter scores
```

### Scenario 3: Teacher - View ELLN Reports
```
Login:  ana.cruz@edusync.local / teacher123
Test:   Navigate to ELLN → Reports → Select section/grade → Generate report
```

### Scenario 4: Student - View Own Grades
```
Login:  juan.garcia1@student.local / student123
Test:   View dashboard, check grades, see announcements
```

---

## 📊 Account Distribution

| Role     | Count | Password     | Email Domain        |
|----------|-------|--------------|---------------------|
| Admin    | 1     | admin123     | @edusync.local      |
| Teachers | 9     | teacher123   | @edusync.local, @school.edu |
| Students | 80    | student123   | @student.local, @students.edu |
| Parents  | 0     | parent123    | N/A                 |
| **TOTAL**| **90**|              |                     |

---

## 🔐 Security Notes

⚠️ **DEVELOPMENT ONLY** - These are test credentials for local emulator use only.

- All passwords are simple and identical per role
- Email verification is bypassed (emailVerified: true)
- No password recovery implemented
- Auth emulator running on `127.0.0.1:9100`
- Firestore emulator running on `127.0.0.1:8086`

**Production Deployment:**
- Generate strong, unique passwords
- Implement password reset flow
- Enable email verification
- Use Firebase security rules
- Set up 2FA for admin accounts

---

## 🛠️ Maintenance Commands

### Recreate All Auth Accounts
```bash
# Windows PowerShell
$env:FIREBASE_PROJECT_ID='edusync-local'; node scripts/create-auth-accounts.cjs
```

### Reset Database and Auth
```bash
# Stop emulator, clear data, restart, and reseed
npm run emu:seed:small
$env:FIREBASE_PROJECT_ID='edusync-local'; node scripts/create-auth-accounts.cjs
node scripts/seed-elln-data.cjs
```

### Check Auth Account Count
```bash
# Windows PowerShell
firebase auth:export temp_export.json --project edusync-local
```

---

## 🐛 Troubleshooting

### Problem: "Invalid email or password"
**Solution:**
1. Ensure emulators are running: `npm run dev:emu`
2. Check Auth emulator UI: `http://127.0.0.1:9100`
3. Re-run auth creation script if accounts missing

### Problem: "User not found"
**Solution:**
1. Verify Firestore has user documents: `http://127.0.0.1:8086`
2. Re-seed database: `npm run emu:seed:small`

### Problem: "Cannot log in with student account"
**Solution:**
1. Check if student has Auth account
2. Run: `$env:FIREBASE_PROJECT_ID='edusync-local'; node scripts/create-auth-accounts.cjs`
3. Try again with: `student123` password

---

## 📍 Quick Links

- **Login Page:** http://127.0.0.1:5173/login
- **Auth Emulator UI:** http://127.0.0.1:9100
- **Firestore Emulator UI:** http://127.0.0.1:8086
- **ELLN Dashboard:** http://127.0.0.1:5173/forms/elln
- **Main Dashboard:** http://127.0.0.1:5173/dashboard

---

**Last Account Creation:** January 2025  
**Script:** `scripts/create-auth-accounts.cjs`  
**Database Seed:** `scripts/seed-and-verify.cjs`
