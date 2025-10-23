# Creating Teacher Account for Pilot

## 🎯 **Why Create Separate Teacher Account?**

**DON'T share admin credentials because:**
- ❌ Admin can delete all data (risky!)
- ❌ Admin sees all features (overwhelming)
- ❌ Can't track realistic teacher usage
- ❌ Can't test role-based permissions
- ✅ Separate account = better UX + safer

---

## 🚀 **Quick Method: Using Admin Script**

### **Option 1: Create via Script** (Recommended)

```bash
# Create teacher account
node scripts/create-admin.cjs --email="teacher@school.com" --name="Teacher Name" --role="teacher" --id="teacher-001"
```

**Parameters:**
- `--email`: Teacher's email (or test email like teacher1@test.com)
- `--name`: Teacher's full name
- `--role`: "teacher" (NOT "admin")
- `--id`: Unique ID (e.g., "teacher-001")

**Example:**
```bash
node scripts/create-admin.cjs --email="juan.delacruz@school.edu" --name="Juan Dela Cruz" --role="teacher" --id="teacher-jdc"
```

---

### **Option 2: Create via Firebase Console** (Manual)

1. **Go to Firebase Console**
   - Navigate to: https://console.firebase.google.com
   - Select project: `edusync-sis`

2. **Create Authentication User**
   - Go to: Authentication > Users
   - Click "Add User"
   - Email: `teacher@school.com`
   - Password: `TempPass123!` (they'll change it)
   - Click "Add User"
   - Copy the generated UID

3. **Create Firestore Teacher Document**
   - Go to: Firestore Database
   - Navigate to `teachers` collection
   - Click "Add Document"
   - Document ID: Use the UID from step 2 (or custom like "teacher-001")
   - Add fields:
     ```
     id: "teacher-001"
     email: "teacher@school.com"
     name: "Teacher Name"
     role: "teacher"
     subjects: ["Mathematics", "Science"]
     sections: ["Grade 7-A", "Grade 7-B"]
     employeeId: "T-2025-001"
     department: "Junior High School"
     specialization: "Mathematics"
     contactNumber: "+63 XXX XXX XXXX"
     status: "active"
     createdAt: [current timestamp]
     updatedAt: [current timestamp]
     ```

4. **Create Users Collection Mirror**
   - Navigate to `users` collection
   - Create document with same ID as teacher document
   - Add fields:
     ```
     id: "teacher-001"
     email: "teacher@school.com"
     name: "Teacher Name"
     role: "teacher"
     createdAt: [current timestamp]
     ```

---

## 📝 **Recommended Teacher Account Setup**

### **Account Details Template:**

```javascript
{
  // Identity
  id: "teacher-001",
  email: "teacher@yourschool.com",
  name: "[Friend's Full Name]",
  role: "teacher",
  
  // Professional Info
  employeeId: "T-2025-001",
  department: "Junior High School",
  specialization: "Mathematics", // or their subject
  
  // Assignments (customize based on their actual classes)
  subjects: ["Mathematics", "Science"],
  sections: ["Grade 7-Sampaguita", "Grade 7-Rosal"],
  gradeLevels: [7],
  
  // Contact
  contactNumber: "+63 XXX XXX XXXX",
  
  // Status
  status: "active",
  isVerified: true,
  
  // Timestamps
  createdAt: [Firestore.Timestamp.now()],
  updatedAt: [Firestore.Timestamp.now()]
}
```

---

## 👥 **Assigning Students to Teacher**

After creating teacher account, assign students:

### **Method 1: Via Sample Students Script**

Create students with the teacher's sections:

```javascript
// In your seed script or manual creation
{
  studentId: "1",
  name: "Juan Dela Cruz",
  gradeLevel: 7,
  section: "Sampaguita", // Must match teacher's section
  // ... other student fields
}
```

### **Method 2: Update Existing Students**

If you already have students, update their section to match teacher's assigned sections.

---

## 🔐 **Login Credentials to Share**

### **What to Send Teacher:**

```
Subject: Your EduSync System Access

Hi [Teacher Name],

Welcome to EduSync! Here are your login credentials:

🔗 URL: https://edusync-sis.web.app
📧 Email: teacher@school.com
🔑 Password: TempPass123!

⚠️ IMPORTANT: Please change your password after first login!

📱 Quick Start:
1. Log in with credentials above
2. Navigate to "Gradebook" to see your classes
3. Click on a student to view/edit grades

📞 Need help?
- Viber/Messenger: [Your Number]
- Email: [Your Email]
- I'll call you tomorrow to walk through it!

Best,
[Your Name]
```

---

## ✅ **Testing Checklist Before Sharing**

**Before sending credentials to teacher:**

- [ ] Teacher account created in Firebase Auth
- [ ] Teacher document exists in Firestore `teachers` collection
- [ ] Teacher document exists in Firestore `users` collection
- [ ] Teacher assigned to at least 1 section
- [ ] 10-20 sample students created in teacher's sections
- [ ] Teacher can log in (test it yourself!)
- [ ] Teacher sees their students in gradebook
- [ ] Teacher can add/edit grades
- [ ] No admin-only features visible
- [ ] All links work (no 404 errors)

---

## 🔄 **If They Forget Password**

### **Option 1: Firebase Console Reset**
1. Go to Firebase Console > Authentication
2. Find the teacher's email
3. Click "..." → "Reset password"
4. Firebase sends them email with reset link

### **Option 2: Change Password via Script**
```bash
# Using Firebase Admin SDK
firebase auth:users:update teacher@school.com --password "NewTempPass123"
```

---

## 📊 **Monitoring Teacher Usage**

### **What to Track:**

1. **Login Activity**
   - First login date/time
   - Frequency (daily, weekly?)
   - Session duration

2. **Feature Usage**
   - Which pages visited most
   - Which features used
   - Which features ignored

3. **Data Created**
   - Grades entered
   - Attendance marked
   - Assignments created

### **Tools:**
- Firebase Console > Analytics (if enabled)
- Firestore audit logs
- Direct feedback from teacher

---

## 🎯 **Summary: Best Practice**

### **DO:**
✅ Create separate teacher-role account  
✅ Use realistic data (their actual subjects/sections if possible)  
✅ Test login yourself before sharing  
✅ Provide simple credentials + quick guide  
✅ Schedule follow-up call next day  

### **DON'T:**
❌ Share admin credentials  
❌ Give them empty system (add sample students first!)  
❌ Overwhelm with documentation  
❌ Leave them without support contact  

---

## 🚀 **Next Steps**

1. Run the create-admin script or use Firebase Console
2. Create 20-30 sample students in their sections
3. Test login yourself
4. Send credentials + quick guide
5. Schedule kickoff call
6. Update PILOT_TRACKER.md

**Estimated Time:** 15-30 minutes total

Good luck with the pilot! 🎉
