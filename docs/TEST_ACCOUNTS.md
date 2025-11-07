# 🔐 Test Accounts Reference Card

## Quick Login Credentials

### Admin Account
```
Email: admin@edusync.local
Password: admin123
Role: System Administrator
Access: Full system access, all students, all sections
```

### Teacher Accounts (All use password: `teacher123`)

| Name | Email | Specialization |
|------|-------|----------------|
| Roberto Santos | roberto.santos@edusync.local | Mathematics |
| Maria Garcia | maria.garcia@edusync.local | Science |
| Juan Cruz | juan.cruz@edusync.local | English |
| Ana Reyes | ana.reyes@edusync.local | Filipino |
| Carlos Lopez | carlos.lopez@edusync.local | Araling Panlipunan |
| Sofia Mendoza | sofia.mendoza@edusync.local | MAPEH |
| Miguel Torres | miguel.torres@edusync.local | TLE |
| Isabella Flores | isabella.flores@edusync.local | Values Education |

**Teacher Access**: Filtered to own advised sections only

### Parent Account
```
Email: juan.garcia@test.com
Password: parent123
Role: Parent
Access: Own children's records only
```

## K-12 Coverage

### Sections Created

- **Kindergarten**: 2 sections (Diamond, Ruby)
- **Elementary (1-6)**: 12 sections (2 per grade)
- **Junior High (7-10)**: 8 sections (2 per grade)
- **Senior High (11-12)**: 4 sections (2 per grade)

**Total**: 26 sections across K-12

### Student Distribution

- **Kindergarten**: 20 students per section = 40 total
- **Grades 1-12**: 25 students per section = 600 total
- **Grand Total**: ~640 students

## Testing Scenarios

### Test as Admin
1. Login: `admin@edusync.local` / `admin123`
2. Can access all modules
3. Can see all 640 students
4. Can manage all 26 sections
5. Can view all teacher accounts

### Test as Teacher
1. Login: `roberto.santos@edusync.local` / `teacher123`
2. Navigate to Form138 (Report Cards)
3. Should see only students from your advised sections
4. Cannot see students from other teachers' sections
5. Section dropdown shows only your sections

### Test as Parent
1. Login: `juan.garcia@test.com` / `parent123`
2. Dashboard shows your children
3. Can view children's grades and attendance
4. Cannot access other students' data

## Common URLs (Emulator)

- **App**: http://localhost:5173
- **Firestore Emulator UI**: http://localhost:4000/firestore
- **Auth Emulator UI**: http://localhost:4000/auth

## Quick Commands

```powershell
# Start development environment with fresh seed
npm run dev:emu

# Reseed database only (emulator must be running)
npm run emu:seed:admin

# Start emulator without auto-seeding
npm run emu:up
```

## Troubleshooting

### "No students found"
- Check if you're logged in as a teacher
- Teacher must be assigned as adviser to at least one section
- Run comprehensive onboarding script if needed

### "Role undefined" errors
- Clear browser cache
- Log out and log back in
- Check custom claims in Auth Emulator UI

### Database empty after restart
- Emulator doesn't persist data between restarts
- Run `npm run dev:emu` to reseed automatically

---

**Last Updated**: November 6, 2025
**Seed Script**: `scripts/seed-complete.cjs`
**Run By**: `npm run dev:emu` (automatic)
