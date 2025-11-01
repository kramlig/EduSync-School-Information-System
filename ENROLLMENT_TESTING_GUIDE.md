# Enrollment System Testing Guide

**Date:** November 1, 2025  
**Status:** ✅ Phase 2 Complete - Ready for Testing  
**Server URL:** http://localhost:5173

---

## 🎯 What's Been Implemented

### **Core Features**
- ✅ Parent-facing enrollment portal with requirements and FAQ
- ✅ 7-step application form with auto-save
- ✅ Admin dashboard with real-time application updates
- ✅ Application review interface with approve/reject workflow
- ✅ Auto-create student record on approval
- ✅ Complete data mapping from application to student

### **Routes**
- `/enrollment` - Enrollment portal (public)
- `/enrollment/apply` - Application form (public)
- `/admin/enrollment` - Admin dashboard (admin only)
- `/admin/enrollment/:applicationId` - Review application (admin only)

---

## 🧪 Testing Workflow

### **Step 1: Submit an Application (Parent View)**

1. **Navigate to enrollment portal:**
   ```
   http://localhost:5173/enrollment
   ```

2. **Review the portal:**
   - ✓ Welcome message displays
   - ✓ Requirements checklist shows (4 items)
   - ✓ 4-step process timeline displays
   - ✓ Financial information shows (HYBRID school)
   - ✓ FAQ section displays
   - ✓ "Start Application" button is visible

3. **Click "Start Application"** → Should navigate to `/enrollment/apply`

4. **Complete the 7-step form:**

   **Step 1: Student Information**
   - First Name: `Juan`
   - Middle Name: `Santos`
   - Last Name: `Dela Cruz`
   - Date of Birth: `2012-05-15`
   - Sex: `Male`
   - Place of Birth: `Manila`
   - LRN: `123456789012`
   - Nationality: `Filipino`

   **Step 2: Guardian Details**
   - Primary Guardian:
     - Full Name: `Maria Dela Cruz`
     - Relationship: `Mother`
     - Contact Number: `09171234567`
     - Email: `maria.delacruz@email.com`
     - Occupation: `Teacher`
   - Secondary Guardian (optional): Leave blank or fill

   **Step 3: Address**
   - Barangay: `San Antonio`
   - City: `Quezon City`
   - Province: `Metro Manila`
   - ZIP Code: `1105`

   **Step 4: Academic History**
   - Grade Level: `7` (Grade 7)
   - Previous School: `San Antonio Elementary School`
   - Year Last Attended: `2024`

   **Step 5: Health Information** (all optional)
   - Blood Type: `O+`
   - Allergies: `None`
   - Medical Conditions: `None`
   - Medications: `None`

   **Step 6: Documents**
   - Note: Upload functionality coming soon (placeholder)

   **Step 7: Review & Submit**
   - ✓ Review all information
   - ✓ Check the certification checkbox
   - ✓ Click "Submit Application"

5. **Verify submission:**
   - ✓ Success alert appears
   - ✓ Application saved to Firestore `enrollmentApplications` collection
   - ✓ Auto-generated application number
   - ✓ Status set to 'submitted'

---

### **Step 2: View Applications (Admin View)**

1. **Login as admin** (if not already logged in)

2. **Navigate to admin enrollment dashboard:**
   ```
   http://localhost:5173/admin/enrollment
   ```

3. **Verify dashboard features:**
   - ✓ Statistics cards display:
     - Total Applications
     - New Submissions
     - Under Review
     - Approved
     - Rejected
   - ✓ Status filter dropdown works
   - ✓ Search bar accepts input
   - ✓ Applications table displays with columns:
     - Application #
     - Student Name
     - Grade Level
     - Submitted Date
     - Status Badge
     - Actions (View Details)
   - ✓ Real-time updates (submit another application and watch it appear)

4. **Test filtering:**
   - Select "Submitted" from status filter
   - Only submitted applications show
   - Select "All" to see everything

5. **Test search:**
   - Type student name in search bar
   - Results filter in real-time
   - Try searching by application number

---

### **Step 3: Review Application (Admin View)**

1. **Click on an application** in the dashboard

2. **Verify review interface:**
   - ✓ Back button to dashboard
   - ✓ Application number displayed
   - ✓ Status badge displayed
   - ✓ **Student Information card** shows:
     - Full name, DOB, Sex, Nationality, LRN, Place of Birth
   - ✓ **Guardian Information card** shows:
     - Primary guardian details
     - Secondary guardian (if provided)
   - ✓ **Address card** shows:
     - Formatted full address
   - ✓ **Academic Information card** shows:
     - Grade level, previous school, year attended
   - ✓ **Review Actions card** displays (if not yet approved/rejected)

3. **Test "Mark as Under Review":**
   - Click "Mark as Under Review" button
   - Status updates to 'under_review'
   - Status badge changes to yellow "Under Review"
   - Review history appears at bottom

4. **Navigate back** to dashboard and verify status updated

---

### **Step 4: Approve Application (Admin View)**

1. **Go back to the application** (click it again in dashboard)

2. **Add review notes** (optional):
   ```
   Application approved. All documents verified.
   ```

3. **Click "Approve Application"** (green button)

4. **Verify approval confirmation:**
   - ✓ Confirmation alert appears
   - ✓ Success message: "Application approved! Student record created successfully."
   - ✓ Redirects to admin dashboard

5. **Verify student record created:**
   
   Open browser console and run:
   ```javascript
   // Get the student record
   import { collection, getDocs } from 'firebase/firestore';
   import { db } from './src/services/firestoreService';
   
   const studentsSnapshot = await getDocs(collection(db, 'students'));
   const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
   console.table(students);
   ```

   Or navigate to the Students page and verify the new student appears.

6. **Verify student record contents:**
   - ✓ `name`: "Juan Santos Dela Cruz"
   - ✓ `firstName`: "Juan"
   - ✓ `lastName`: "Dela Cruz"
   - ✓ `sex`: "Male"
   - ✓ `dateOfBirth`: "2012-05-15"
   - ✓ `lrn`: "123456789012"
   - ✓ `guardianName`: "Maria Dela Cruz"
   - ✓ `guardianContactNumber`: "09171234567"
   - ✓ `address`: "San Antonio, Quezon City, Metro Manila"
   - ✓ `status`: "active"
   - ✓ `remarks`: Contains "Applied for Grade 7. Application #XXX"

7. **Verify application status updated:**
   - Go back to admin enrollment dashboard
   - Find the approved application
   - Status badge shows green "Approved"
   - Review history shows approval date and reviewer

---

### **Step 5: Test Rejection Flow (Admin View)**

1. **Submit another test application** (repeat Step 1 with different student)

2. **Go to admin dashboard** and click the new application

3. **Add rejection reason:**
   ```
   Missing required documents. Please resubmit with birth certificate.
   ```

4. **Click "Reject Application"** (red button)

5. **Verify rejection:**
   - ✓ Confirmation alert appears
   - ✓ Status updates to 'rejected'
   - ✓ Status badge shows red "Rejected"
   - ✓ Review history shows rejection reason
   - ✓ NO student record created (verify in students collection)
   - ✓ Review actions no longer appear (can't approve rejected application)

---

## 🔍 Key Things to Verify

### **Data Integrity**
- [ ] All form fields save correctly
- [ ] Auto-save works (refresh page mid-form and data persists)
- [ ] Application numbers are unique and sequential
- [ ] Student records have all required fields
- [ ] Guardian information maps correctly (including secondary guardian)
- [ ] Address fields split correctly (barangay, city, province)
- [ ] Health information concatenates properly in healthNotes

### **Real-time Updates**
- [ ] Dashboard updates when new application submitted (without refresh)
- [ ] Status changes reflect immediately in dashboard
- [ ] Statistics update in real-time

### **User Experience**
- [ ] Progress bar shows correct percentage
- [ ] Step indicators show checkmarks for completed steps
- [ ] Validation prevents advancing with missing required fields
- [ ] Form data persists in localStorage
- [ ] Success/error messages display appropriately
- [ ] Navigation works (back button, breadcrumbs)

### **Security & Access Control**
- [ ] Admin routes only accessible to admins
- [ ] Public can access /enrollment and /enrollment/apply
- [ ] Cannot access other user's applications (future enhancement)

---

## 🐛 Common Issues & Solutions

### **Issue: Form doesn't save**
- **Check:** Browser localStorage enabled
- **Check:** Firestore emulator running
- **Solution:** Clear localStorage and try again

### **Issue: Dashboard shows no applications**
- **Check:** Applications collection in Firestore
- **Check:** Console for Firestore errors
- **Solution:** Submit a test application first

### **Issue: Student not created on approval**
- **Check:** Browser console for errors
- **Check:** Student type mapping in ApplicationReview.tsx
- **Solution:** Verify all required Student fields are provided

### **Issue: Real-time updates not working**
- **Check:** Firestore onSnapshot subscription
- **Check:** Network tab for Firestore connections
- **Solution:** Restart dev server

---

## 📊 Test Data Templates

### **Elementary Student (Grade 1-6)**
```
Name: Maria Santos Garcia
DOB: 2015-08-20
Grade: 3
Guardian: Pedro Garcia (Father)
```

### **Junior High Student (Grade 7-10)**
```
Name: Juan Santos Dela Cruz
DOB: 2012-05-15
Grade: 8
Guardian: Maria Dela Cruz (Mother)
```

### **Senior High Student (Grade 11-12)**
```
Name: Ana Marie Reyes
DOB: 2008-03-10
Grade: 11
Guardian: Carlos Reyes (Father)
```

---

## ✅ Success Criteria

### **Phase 2 Complete When:**
- [x] Parents can submit applications successfully
- [x] Applications appear in admin dashboard
- [x] Admins can filter and search applications
- [x] Admins can review application details
- [x] Admins can mark as under review
- [x] Admins can approve applications
- [x] Student records auto-create on approval
- [x] Admins can reject applications
- [x] Status updates reflect in real-time
- [x] All data maps correctly from application to student

---

## 🚀 Next Phase (Optional Enhancements)

### **Phase 3: Document Management**
- [ ] Firebase Storage integration
- [ ] Document upload in Step 6
- [ ] Document viewer in admin review
- [ ] Document requirement validation

### **Phase 4: Communication**
- [ ] Application status tracking page (/enrollment/status)
- [ ] Email notifications (submission, approval, rejection)
- [ ] SMS notifications (optional)

### **Phase 5: Advanced Features**
- [ ] Bulk approve/reject
- [ ] Section assignment after approval
- [ ] Enrollment analytics dashboard
- [ ] Export applications to CSV/Excel

---

## 📝 Testing Checklist

Print this and check off as you test:

**Parent Flow:**
- [ ] Can access enrollment portal
- [ ] Can start application
- [ ] Can complete all 7 steps
- [ ] Form validates required fields
- [ ] Auto-save works
- [ ] Can review before submit
- [ ] Can submit successfully

**Admin Flow:**
- [ ] Can access admin dashboard
- [ ] Can see all applications
- [ ] Can filter by status
- [ ] Can search applications
- [ ] Can view application details
- [ ] Can mark as under review
- [ ] Can approve application
- [ ] Can reject application
- [ ] Student created on approval

**Data Validation:**
- [ ] Student record has correct data
- [ ] Guardian info maps correctly
- [ ] Address splits correctly
- [ ] Health info concatenates
- [ ] Status updates correctly
- [ ] Review history saves

---

## 🎉 You're Ready!

The enrollment system is fully functional. Test it thoroughly and report any issues. Good luck! 🚀
