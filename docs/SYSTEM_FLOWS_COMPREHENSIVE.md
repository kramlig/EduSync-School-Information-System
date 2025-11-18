# EduSync SIS - Comprehensive System Flows (End-to-End)

**Document Version:** 1.0  
**Date:** November 15, 2025  
**Purpose:** High-level assessment of all major system workflows from start to finish

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [FLOW 1: School Setup & Configuration](#flow-1-school-setup--configuration)
3. [FLOW 2: User Management](#flow-2-user-management)
4. [FLOW 3: Enrollment Process](#flow-3-enrollment-process)
5. [FLOW 4: Academic Operations](#flow-4-academic-operations)
6. [FLOW 5: Financial Management](#flow-5-financial-management)
7. [FLOW 6: Forms & Reporting](#flow-6-forms--reporting)
8. [FLOW 7: Daily Operations](#flow-7-daily-operations)
9. [FLOW 8: Parent Portal](#flow-8-parent-portal)
10. [Complete User Journey Map](#complete-user-journey-map)

---

## System Overview

EduSync is a comprehensive School Information System with **9 major flows** covering everything from initial school setup to daily operations and reporting. The system supports multiple user roles and school types (public/private/hybrid).

### User Roles
- **Super Admin** - Multi-school management
- **School Admin** - School-wide administration
- **Principal** - Academic oversight
- **Registrar** - Student records & enrollment
- **Teacher** - Classroom management
- **Parent** - Child monitoring
- **Student** - Learning portal

### School Types
- **Public** - No financial features
- **Private** - Full billing & payment system
- **Hybrid** - Optional financial features

---

## FLOW 1: School Setup & Configuration
**Duration:** 1-2 days  
**Responsible:** Super Admin / School Admin

### Step 1.1: Super Admin Setup (First-Time System Setup)
```
START → Super Admin Account Creation
  ↓
Set Custom Claims (role: superadmin, isSuperAdmin: true)
  ↓
Access School Management Dashboard (/school-management)
  ↓
END
```

**Actions:**
- Create super admin via script: `scripts/create-superadmin-auth.cjs`
- Login credentials: `superadmin@edusync-demo.ph / admin123`
- Access all schools and management features

### Step 1.2: Create New School
```
START → School Management Dashboard
  ↓
Click "Create New School" → Fill School Form
  ├─ School Information (name, code, address, phone, email)
  ├─ Principal Details
  └─ Admin Account (email, password)
  ↓
System Creates:
  ├─ School Document (schools/{schoolId})
  ├─ Admin Auth User (with custom claims)
  ├─ Admin Teacher Record (teachers/{teacherId})
  └─ Initial Settings (embedded in school doc)
  ↓
END → School Created & Ready
```

**Firestore Collections Created:**
- `schools/{schoolId}` - School master record
- `teachers/{adminId}` - School admin account
- Firebase Auth user with `role: admin, schoolId: {schoolId}`

### Step 1.3: Configure School Settings
```
START → Login as School Admin
  ↓
Navigate to Settings (/settings)
  ↓
Configure:
  ├─ School Type (public/private/hybrid)
  ├─ Academic Year (e.g., 2024-2025)
  ├─ Current Quarter (1-4)
  ├─ Financial Config (if private/hybrid)
  │   ├─ Currency (PHP)
  │   ├─ Payment requirements
  │   ├─ Grace period days
  │   └─ Penalty rates
  └─ Enrollment Config
      ├─ Requires application: true/false
      ├─ Requires documents: true/false
      ├─ Auto-approve: true/false
      └─ Academic year dates
  ↓
Save Settings
  ↓
END → School Configured
```

**Configuration Options:**
- `schoolType`: 'public' | 'private' | 'hybrid'
- `financialConfig.enabled`: Auto-set based on school type
- `enrollmentConfig`: Controls enrollment portal behavior

### Step 1.4: Setup Learning Areas & Core Values
```
START → Navigate to Learning Areas (/learning-areas)
  ↓
Create Learning Areas (Subjects):
  ├─ Name (e.g., "Mathematics")
  ├─ Grade Level (K-12)
  ├─ Credits
  └─ Category (core/elective)
  ↓
System Creates → learningAreas/{areaId}
  ↓
Navigate to Assessment Settings
  ↓
Create Core Values:
  ├─ Name (e.g., "Makadiyos")
  ├─ Description
  └─ Order
  ↓
System Creates → coreValues/{valueId}
  ↓
END → Academic Structure Ready
```

**Standard Learning Areas:**
- Filipino, English, Mathematics, Science, Araling Panlipunan, MAPEH, TLE, Edukasyon sa Pagpapakatao

**Standard Core Values (Matatag):**
- Makadiyos, Makatao, Makakalikasan, Makabansa

### Step 1.5: Setup Sections & Teachers
```
START → Create Sections (/sections)
  ↓
For Each Grade Level:
  ├─ Create Section (e.g., "Grade 7 - Diamond")
  ├─ Set Capacity (e.g., 40 students)
  └─ Assign Adviser
  ↓
System Creates → sections/{sectionId}
  ↓
Add Teachers (/teachers)
  ↓
For Each Teacher:
  ├─ Create Auth Account
  ├─ Set Role & Permissions
  ├─ Assign to Section(s)
  └─ Assign Learning Areas
  ↓
System Creates:
  ├─ Firebase Auth User
  ├─ teachers/{teacherId}
  └─ Custom Claims (role: teacher, schoolId)
  ↓
END → School Structure Complete
```

**Teacher Onboarding Script:** `scripts/admin/onboard-teacher.cjs`

---

## FLOW 2: User Management
**Duration:** Ongoing  
**Responsible:** Admin / Registrar

### Step 2.1: Create Student Account
```
START → Navigate to Students (/students)
  ↓
Click "Add Student" → Fill Student Form
  ├─ Personal Info (name, birthdate, sex)
  ├─ LRN (Learner Reference Number)
  ├─ Section Assignment
  └─ Contact Information
  ↓
Optional: Upload Photo
  ↓
System Creates:
  ├─ students/{studentId}
  ├─ Firebase Auth User (optional)
  └─ Student Portal Access
  ↓
END → Student Record Created
```

### Step 2.2: Create Parent Account
```
START → Navigate to Parents (/parents)
  ↓
Click "Add Parent" → Fill Parent Form
  ├─ Personal Info (name, email, phone)
  ├─ Relationship to Student
  └─ Link to Student(s)
  ↓
System Creates:
  ├─ Firebase Auth User
  ├─ parents/{parentId}
  ├─ Custom Claims (role: parent, schoolId)
  └─ studentIds array (linked children)
  ↓
Parent Receives:
  ├─ Email with login credentials
  └─ Access to Parent Portal
  ↓
END → Parent Account Active
```

### Step 2.3: Manage User Roles & Permissions
```
START → User Management Interface
  ↓
Select User → Modify:
  ├─ Role (admin/teacher/registrar/principal)
  ├─ School Access (for super admin)
  ├─ Section Assignments
  └─ Active/Inactive Status
  ↓
Update Custom Claims in Firebase Auth
  ↓
Update Firestore User Document
  ↓
END → Permissions Updated
```

---

## FLOW 3: Enrollment Process
**Duration:** Per application (15-30 minutes)  
**Responsible:** Parent (application) → Admin (approval)

### Step 3.1: Parent Submits Enrollment Application
```
START → Public Enrollment Portal (/enrollment)
  ↓
Review Requirements & Process Timeline
  ↓
Click "Start Application" (/enrollment/apply)
  ↓
STEP 1/8: School Selection
  ├─ Select Target School
  └─ Confirm Selection (cannot change later)
  ↓
STEP 2/8: Student Information
  ├─ Full Name (first, middle, last)
  ├─ Birthdate & Place of Birth
  ├─ Sex, LRN, Nationality
  └─ Upload Student Photo (10MB max)
  ↓
STEP 3/8: Guardian Details
  ├─ Primary Guardian (name, relationship, contact)
  └─ Secondary Guardian (optional)
  ↓
STEP 4/8: Address
  ├─ Current Address (barangay, city, province, ZIP)
  └─ Permanent Address (if different)
  ↓
STEP 5/8: Academic History
  ├─ Grade Level Applying For
  ├─ Previous School
  └─ Year Last Attended
  ↓
STEP 6/8: Health Information (Optional)
  ├─ Medical Conditions
  ├─ Allergies
  └─ Emergency Contact
  ↓
STEP 7/8: Documents Upload
  ├─ Birth Certificate (required, PDF/JPG, 10MB max)
  ├─ Form 137 (required)
  ├─ Good Moral (optional)
  ├─ Report Card (optional)
  └─ ID Photo (optional)
  ↓
STEP 8/8: Review & Submit
  ├─ Review All Information
  ├─ Confirm Accuracy
  └─ Submit Application
  ↓
System Creates:
  ├─ enrollmentApplications/{appId}
  ├─ Application Number (ENR-2025-XXXXXX)
  ├─ Status: "submitted"
  └─ Documents in Cloud Storage
  ↓
Parent Receives:
  ├─ Application Number
  ├─ Confirmation Message
  └─ Status Tracking Link
  ↓
END → Application Submitted
```

**Application Fields Captured:**
- `selectedSchoolId` - Target school
- `studentInfo` - All student details + photo
- `guardian1`, `guardian2` - Guardian information
- `currentAddress`, `permanentAddress` - Address details
- `academicInfo` - Previous school & grade level
- `healthInfo` - Medical information (optional)
- `documents` - Uploaded files with URLs

### Step 3.2: Parent Tracks Application Status
```
START → Navigate to Application Status (/enrollment/status)
  ↓
Enter Application Number
  ↓
View Status Timeline:
  ├─ ✓ Submitted (timestamp)
  ├─ ○ Under Review (pending)
  ├─ ○ Approved/Rejected (pending)
  └─ ○ Enrolled (pending)
  ↓
View Application Details & Documents
  ↓
END → Status Checked
```

**Status Values:**
- `submitted` - Initial submission
- `under_review` - Admin is reviewing
- `approved` - Application accepted
- `rejected` - Application denied (with reason)
- `enrolled` - Student enrolled in system

### Step 3.3: Admin Reviews Application
```
START → Admin Enrollment Dashboard (/admin/enrollment)
  ↓
View Applications by Status:
  ├─ Submitted (new)
  ├─ Under Review
  ├─ Approved
  └─ Rejected
  ↓
Click Application → Review Page (/admin/enrollment/{appId})
  ↓
Review:
  ├─ Student Information + Photo
  ├─ Guardian Details
  ├─ Address Information
  ├─ Academic History
  ├─ All Uploaded Documents (inline viewer)
  └─ Application Timeline
  ↓
Decision:
  ├─ APPROVE → Create Student Record
  │   ├─ Create students/{studentId}
  │   ├─ Transfer photo to student profile
  │   ├─ Assign to section
  │   ├─ Update application status: "approved"
  │   └─ Optional: Create parent account
  │
  └─ REJECT → Provide Reason
      ├─ Enter rejection reason
      ├─ Update application status: "rejected"
      └─ Parent notified
  ↓
END → Application Processed
```

**Admin Actions:**
- View all application details in single page
- Download submitted documents
- Approve with automatic student creation
- Reject with mandatory reason
- View application history/audit trail

### Step 3.4: Student Enrollment Finalization
```
START → Approved Application
  ↓
Admin Action:
  ├─ Assign to Section
  ├─ Set Grade Level
  └─ Confirm Enrollment
  ↓
System Creates/Updates:
  ├─ students/{studentId} - Full student record
  ├─ Student Firebase Auth (if needed)
  ├─ Update section student count
  └─ Application status: "enrolled"
  ↓
If Financial School:
  ├─ Create Student Ledger (studentLedgers/{ledgerId})
  ├─ Initialize with Fee Structure
  └─ Set Balance Due
  ↓
Parent Notified:
  ├─ Enrollment Confirmation Email
  ├─ Student ID Number
  └─ Parent Portal Access
  ↓
END → Student Enrolled
```

---

## FLOW 4: Academic Operations
**Duration:** Ongoing (daily/weekly)  
**Responsible:** Teachers

### Step 4.1: Attendance Recording
```
START → Attendance View (/attendance)
  ↓
Select:
  ├─ Section
  ├─ Date
  └─ Learning Area (optional)
  ↓
Mark Attendance for Each Student:
  ├─ Present
  ├─ Absent
  ├─ Late
  └─ Excused
  ↓
Add Notes (optional)
  ↓
Save Attendance Record
  ↓
System Creates → attendanceRecords/{recordId}
  ├─ studentId
  ├─ sectionId
  ├─ date
  ├─ status
  └─ markedBy (teacherId)
  ↓
END → Attendance Recorded
```

**Attendance Analytics:**
- Daily/Weekly/Monthly reports
- Per student attendance rate
- Section attendance trends
- Absence patterns

### Step 4.2: Grade Entry & Management
```
START → Grades & Reports (/grades)
  ↓
Select Assessment Type:
  ├─ Written Works (30%)
  ├─ Performance Tasks (50%)
  └─ Quarterly Assessments (20%)
  ↓
Select:
  ├─ Quarter (1-4)
  ├─ Section
  └─ Learning Area
  ↓
Enter Scores for Each Student:
  ├─ Raw Score
  ├─ Highest Possible Score
  └─ Auto-calculate Weighted Score
  ↓
System Calculates:
  ├─ Initial Grade per Component
  ├─ Quarterly Grade (average)
  ├─ Final Grade (average of 4 quarters)
  └─ Remarks (Passed/Failed)
  ↓
Save Grades
  ↓
System Creates → grades/{gradeId}
  ├─ studentId, sectionId, learningAreaId
  ├─ quarter, schoolYear
  ├─ writtenWorks[], performanceTasks[], assessments[]
  ├─ quarterlyGrade, finalGrade
  └─ remarks
  ↓
END → Grades Saved
```

**Grading Components (DepEd K-12):**
- Written Works: 30%
- Performance Tasks: 50%
- Quarterly Assessment: 20%
- Transmutation to 100-point scale
- Final Grade = Average of 4 quarters

### Step 4.3: Core Values Assessment
```
START → Core Values (/core-values)
  ↓
Select:
  ├─ Quarter
  ├─ Section
  └─ Core Value (Makadiyos, Makatao, etc.)
  ↓
Rate Each Student:
  ├─ Always Observed (AO)
  ├─ Sometimes Observed (SO)
  ├─ Not Observed (NO)
  └─ Add Behavioral Notes
  ↓
Save Assessments
  ↓
System Creates → coreValueGrades/{gradeId}
  ├─ studentId, coreValueId
  ├─ quarter, schoolYear
  ├─ rating (AO/SO/NO)
  └─ observations
  ↓
END → Core Values Recorded
```

### Step 4.4: Assignments & Activities
```
START → Assignments (/assignments)
  ↓
Create Assignment:
  ├─ Title & Description
  ├─ Learning Area
  ├─ Section(s)
  ├─ Due Date
  ├─ Total Points
  └─ Instructions/Attachments
  ↓
System Creates → assignments/{assignmentId}
  ↓
Students View Assignment:
  ├─ In Student Portal (/assignments)
  └─ See due date & instructions
  ↓
Teacher Grades Submissions:
  ├─ View student submissions
  ├─ Enter scores
  └─ Provide feedback
  ↓
System Creates → studentAssignmentGrades/{gradeId}
  ├─ assignmentId, studentId
  ├─ score, maxScore
  ├─ submittedAt
  └─ feedback
  ↓
END → Assignment Graded
```

### Step 4.5: Lesson Planning
```
START → Lesson Plans (/lesson-plan)
  ↓
Create Lesson Plan:
  ├─ Learning Area
  ├─ Grade Level
  ├─ Topic/Competency
  ├─ Objectives
  ├─ Materials
  ├─ Procedure
  └─ Assessment
  ↓
Optional: AI Generation
  ├─ Enter topic + grade level
  ├─ System calls Gemini API
  └─ Generate complete lesson plan
  ↓
Save Lesson Plan
  ↓
System Creates → lessonPlans/{planId}
  ↓
END → Lesson Saved
```

---

## FLOW 5: Financial Management
**Duration:** Ongoing (per transaction)  
**Responsible:** Admin / Registrar  
**Applies To:** Private & Hybrid Schools Only

### Step 5.1: Setup Fee Structure
```
START → Fee Structures (/fee-structures)
  ↓
Create Fee Structure:
  ├─ School Year (e.g., 2024-2025)
  ├─ Grade Level (e.g., Grade 7)
  ├─ Tuition Fee
  ├─ Miscellaneous Fees (library, computer lab, etc.)
  ├─ Laboratory Fees (per subject)
  ├─ Other Fees (registration, ID, insurance)
  └─ Full Payment Discount (%)
  ↓
System Creates → feeStructures/{structureId}
  ├─ schoolYear, gradeLevel
  ├─ tuitionFee, miscFees[], labFees[]
  ├─ totalAmount (auto-calculated)
  └─ fullPaymentDiscount
  ↓
END → Fee Structure Active
```

**Fee Components:**
- Tuition Fee (base amount)
- Miscellaneous Fees (array of items)
- Laboratory Fees (per subject)
- Registration, ID, Insurance fees
- Discounts for full payment

### Step 5.2: Initialize Student Ledger
```
START → Student Approved/Enrolled
  ↓
System Auto-Creates Student Ledger:
  ├─ Get fee structure for grade level
  ├─ Create studentLedgers/{ledgerId}
  ├─ Set total amount due
  ├─ Set balance (initially = total)
  └─ Set status: "pending"
  ↓
Ledger Fields:
  ├─ studentId, schoolYear, gradeLevel
  ├─ feeStructureId
  ├─ totalAmount
  ├─ paidAmount: 0
  ├─ balance: totalAmount
  ├─ status: "pending"
  └─ payments: []
  ↓
END → Ledger Ready for Payments
```

### Step 5.3: Record Payment
```
START → Record Payment (/record-payment)
  ↓
Search for Student
  ↓
View Student Ledger:
  ├─ Total Amount Due
  ├─ Amount Paid
  ├─ Balance Remaining
  └─ Payment History
  ↓
Record New Payment:
  ├─ Amount
  ├─ Payment Method (cash/check/online/gcash)
  ├─ OR Number (for cash)
  ├─ Reference Number (for online/gcash)
  └─ Notes
  ↓
System Updates:
  ├─ studentLedgers/{ledgerId}
  │   ├─ paidAmount += payment amount
  │   ├─ balance -= payment amount
  │   └─ Add to payments array
  ├─ Create receipts/{receiptId}
  │   ├─ receiptNumber (auto-generated)
  │   ├─ studentId, amount, method
  │   ├─ OR number / reference
  │   └─ timestamp
  └─ Update ledger status:
      ├─ "paid" if balance = 0
      ├─ "partial" if 0 < balance < total
      └─ "pending" if balance = total
  ↓
Generate Receipt PDF:
  ├─ Official Receipt format
  ├─ School header & logo
  ├─ Student info & payment details
  └─ Download/Print
  ↓
END → Payment Recorded
```

### Step 5.4: Parent Views Billing
```
START → Parent Portal - Billing (/billing)
  ↓
View All Children's Ledgers:
  ├─ Total Amount Due per child
  ├─ Amount Paid
  ├─ Balance Remaining
  └─ Payment Status
  ↓
View Payment History:
  ├─ Date & Amount
  ├─ Payment Method
  ├─ OR/Reference Number
  └─ Download Receipt
  ↓
Optional: Upload Payment Proof
  ├─ For online/bank transfers
  ├─ Upload image/PDF
  └─ Admin reviews proof
  ↓
END → Billing Checked
```

### Step 5.5: Generate Financial Reports
```
START → Financial Reports (/financial-reports)
  ↓
Select Report Type:
  ├─ Collection Summary (daily/weekly/monthly)
  ├─ Outstanding Balances
  ├─ Revenue by Fee Type
  └─ Payment Method Analysis
  ↓
Filter:
  ├─ Date Range
  ├─ Grade Level
  └─ Payment Status
  ↓
View Report:
  ├─ Summary Statistics
  ├─ Charts & Graphs
  └─ Detailed Breakdown
  ↓
Export to CSV/Excel
  ↓
END → Report Generated
```

---

## FLOW 6: Forms & Reporting
**Duration:** End of quarter/year  
**Responsible:** Teachers / Registrar

### Step 6.1: Generate Form 137 (Permanent Record)
```
START → Forms Library (/forms) → Form 137
  ↓
Select Student
  ↓
System Auto-Generates Form 137:
  ├─ Pull from students/{studentId}
  ├─ Pull from grades (all quarters)
  ├─ Pull from coreValueGrades
  ├─ Pull from attendanceRecords
  └─ Format per DepEd standards
  ↓
Form 137 Sections:
  ├─ Student Information
  ├─ Scholastic Record (all years)
  │   ├─ Learning Areas & Grades
  │   ├─ General Average per year
  │   └─ Remarks (Passed/Promoted)
  ├─ Attendance Record
  ├─ Core Values Rating
  └─ Certification & Signatures
  ↓
Preview → Edit → Save → Print/Download PDF
  ↓
END → Form 137 Ready
```

**Form 137 Features:**
- Auto-populate from database
- Multi-year record tracking
- DepEd-compliant format
- Digital signatures
- PDF export for printing

### Step 6.2: Generate Form 138 (Report Card)
```
START → Forms Library → Form 138
  ↓
Select:
  ├─ School Year
  ├─ Student
  └─ Quarter (or annual)
  ↓
System Auto-Generates Form 138:
  ├─ Student Information
  ├─ Grades per Learning Area
  ├─ General Average
  ├─ Core Values Ratings
  ├─ Attendance Summary
  └─ Remarks
  ↓
Format Options:
  ├─ Quarterly Report Card
  └─ Annual Report Card
  ↓
Preview → Print/Download PDF
  ↓
END → Report Card Ready
```

### Step 6.3: Generate School Form 1 (SF1 - Enrollment)
```
START → School Forms → SF1
  ↓
Select School Year
  ↓
System Auto-Generates SF1:
  ├─ Count students by grade level
  ├─ Breakdown by sex (Male/Female)
  ├─ Count by age groups
  ├─ Transfer students summary
  └─ Total enrollment
  ↓
EBEIS Format:
  ├─ Table: Enrollment by Grade Level
  ├─ Table: Enrollment by Age
  ├─ Table: Transfer Students
  └─ School Information Header
  ↓
Export to Excel/PDF
  ↓
END → SF1 Ready for EBEIS
```

### Step 6.4: Generate School Form 2 (SF2 - Attendance)
```
START → School Forms → SF2
  ↓
Select:
  ├─ Month
  └─ Section
  ↓
System Auto-Generates SF2:
  ├─ Daily attendance grid (per student)
  ├─ Monthly summary
  ├─ Attendance rates
  └─ Absence patterns
  ↓
DepEd Format:
  ├─ Student List (alphabetical)
  ├─ Daily Columns (1-31)
  ├─ Status Codes (P/A/L/E)
  └─ Monthly Totals
  ↓
Export to Excel/PDF
  ↓
END → SF2 Ready
```

### Step 6.5: Generate School Form 9 (SF9 - Promotion List)
```
START → School Forms → SF9
  ↓
Select:
  ├─ School Year
  └─ Grade Level
  ↓
System Auto-Generates SF9:
  ├─ List all students in grade level
  ├─ Show final grades
  ├─ Calculate general average
  ├─ Determine promotion status
  └─ Identify honors/awards
  ↓
Promotion Criteria:
  ├─ Passed: General Average ≥ 75
  ├─ Failed: GA < 75
  ├─ Retained: Failed same grade
  └─ Promoted: Moving to next grade
  ↓
Export to Excel/PDF
  ↓
END → SF9 Ready
```

### Step 6.6: ELLN Assessment (K-3)
```
START → ELLN Dashboard (/forms/elln)
  ↓
Conduct Assessment (/forms/elln/assessment):
  ├─ Select Student (K-3 only)
  ├─ Choose Domain (Literacy/Numeracy)
  └─ Record Proficiency Level (0-100)
  ↓
Proficiency Levels:
  ├─ 90-100: Advanced
  ├─ 80-89: Proficient
  ├─ 65-79: Approaching Proficiency
  ├─ 50-64: Developing
  └─ 0-49: Beginning
  ↓
System Creates → ellnAssessments/{assessmentId}
  ├─ studentId, domain, score
  ├─ proficiencyLevel
  └─ assessedBy, assessedAt
  ↓
View Results (/forms/elln/results):
  ├─ Individual student progress
  ├─ Historical trends
  └─ Recommendations
  ↓
Generate ILMP (for struggling learners):
  ├─ Identify students below proficiency
  ├─ Create intervention plan
  └─ Track progress
  ↓
END → ELLN Complete
```

---

## FLOW 7: Daily Operations
**Duration:** Daily  
**Responsible:** All Users

### Step 7.1: Morning Routine (Teacher)
```
START → Login to System
  ↓
View Dashboard:
  ├─ Today's Schedule
  ├─ Pending Tasks
  └─ Announcements
  ↓
Mark Attendance for First Period
  ↓
Review Lesson Plan
  ↓
Check Assignments Due Today
  ↓
END → Ready for Class
```

### Step 7.2: Class Schedule Management
```
START → Scheduler (/schedule)
  ↓
View/Create Class Schedule:
  ├─ Section
  ├─ Day of Week
  ├─ Time Slot
  ├─ Learning Area
  └─ Assigned Teacher
  ↓
Handle Substitutes:
  ├─ Mark teacher absent
  ├─ Assign substitute teacher
  └─ Update schedule
  ↓
System Creates → classSchedules/{scheduleId}
  ↓
END → Schedule Updated
```

### Step 7.3: Announcements
```
START → Announcements (/announcements)
  ↓
Create Announcement (Admin/Principal):
  ├─ Title & Message
  ├─ Target Audience (all/teachers/parents/students)
  ├─ Priority (normal/urgent)
  └─ Expiry Date
  ↓
System Creates → announcements/{announcementId}
  ↓
Recipients View:
  ├─ Dashboard notification
  ├─ Announcements page
  └─ Badge count in sidebar
  ↓
END → Announcement Published
```

### Step 7.4: Student Self-Service
```
START → Student Portal Login
  ↓
View Dashboard:
  ├─ Upcoming Assignments
  ├─ Recent Grades
  ├─ Attendance Summary
  └─ Class Schedule
  ↓
Check Grades:
  ├─ View per learning area
  ├─ See quarterly progress
  └─ Track final grades
  ↓
View Assignments:
  ├─ See due dates
  └─ Check submission status
  ↓
END → Student Informed
```

---

## FLOW 8: Parent Portal
**Duration:** Ongoing  
**Responsible:** Parents

### Step 8.1: Parent Account Setup
```
START → Parent Registration (/register/parent)
  ↓
Enter Information:
  ├─ Email & Password
  ├─ Full Name
  ├─ Contact Number
  └─ Relationship to Student
  ↓
Link to Student(s):
  ├─ Enter Student LRN
  ├─ Verify student details
  └─ Request link approval
  ↓
Admin Approves Link:
  ├─ Verify parent-student relationship
  └─ Activate parent account
  ↓
System Creates:
  ├─ Firebase Auth User
  ├─ parents/{parentId}
  └─ studentIds array
  ↓
Parent Receives Welcome Email
  ↓
END → Parent Account Active
```

### Step 8.2: Monitor Child's Progress
```
START → Parent Portal Login
  ↓
Select Child (if multiple)
  ↓
View Dashboard:
  ├─ Quick Stats (grades, attendance)
  ├─ Recent Activities
  └─ Upcoming Deadlines
  ↓
Check Grades (/grades):
  ├─ All learning areas
  ├─ Quarterly breakdown
  ├─ Core values ratings
  └─ Progress trends
  ↓
Check Attendance (/attendance):
  ├─ Monthly view
  ├─ Attendance rate
  └─ Absence history
  ↓
View Assignments (/assignments):
  ├─ Pending assignments
  ├─ Submitted work
  └─ Grades & feedback
  ↓
Check Billing (if applicable):
  ├─ Balance due
  ├─ Payment history
  └─ Upload payment proof
  ↓
END → Child's Status Checked
```

### Step 8.3: Communication with School
```
START → Parent Portal
  ↓
View Announcements:
  ├─ School-wide announcements
  ├─ Grade level updates
  └─ Important reminders
  ↓
View Class Schedule:
  ├─ Daily timetable
  └─ Teacher assignments
  ↓
Access Reports:
  ├─ Download report cards
  └─ View progress reports
  ↓
END → Informed & Updated
```

---

## Complete User Journey Map

### 🏫 School Lifecycle (Macro View)

```
PHASE 1: SETUP (Week 1)
└─ Super Admin creates school
   └─ Admin configures settings
      └─ Admin sets up structure (sections, learning areas)
         └─ Admin creates teacher accounts
            └─ Teachers prepare lesson plans

PHASE 2: ENROLLMENT (Weeks 2-4)
└─ Parents submit applications
   └─ Admin reviews applications
      └─ Admin approves & creates student records
         └─ System initializes ledgers (if financial)
            └─ Parents receive confirmation

PHASE 3: ACADEMIC YEAR (Ongoing)
└─ Daily: Teachers mark attendance
   └─ Weekly: Teachers create assignments
      └─ Ongoing: Teachers enter grades
         └─ Quarterly: Generate report cards
            └─ Annually: Generate permanent records

PHASE 4: FINANCIAL (Ongoing - Private/Hybrid Only)
└─ Setup fee structures
   └─ Initialize student ledgers
      └─ Parents make payments
         └─ Admin records payments
            └─ Generate receipts & reports

PHASE 5: REPORTING (End of Quarter/Year)
└─ Generate Form 137 (Permanent Record)
   └─ Generate Form 138 (Report Cards)
      └─ Generate School Forms (SF1, SF2, SF9)
         └─ Generate ELLN reports (K-3)
            └─ Export to EBEIS format

PHASE 6: YEAR-END (End of School Year)
└─ Generate promotion lists (SF9)
   └─ Archive school year data
      └─ Setup next school year
         └─ Promote students to next grade
            └─ Reset sections & schedules
```

### 👤 User Daily Workflows

#### Super Admin
```
Morning → Review all schools' dashboards
       → Monitor system health
       → Handle escalated issues
Ongoing → Create new schools
        → Manage school admins
        → System configuration
```

#### School Admin
```
Morning → Review dashboard statistics
       → Check pending enrollments
       → Review announcements
Daily   → Approve enrollment applications
        → Manage user accounts
        → Handle financial reports (if applicable)
        → Monitor academic performance
```

#### Teacher
```
Morning → Mark attendance
       → Review lesson plan
       → Check assignment submissions
Class   → Conduct lessons
       → Record observations
After   → Enter grades
       → Provide feedback
       → Create next lesson plans
```

#### Parent
```
Weekly  → Check child's grades
       → Review attendance
       → Monitor assignments
Monthly → Check billing/payment (if applicable)
       → Download receipts
       → View progress reports
```

#### Student
```
Daily   → Check assignments
       → View schedule
       → Submit work
Weekly  → Review grades
       → Check attendance
       → Read announcements
```

---

## Summary: Critical System Touchpoints

### 🎯 Must-Have Workflows (Critical Path)
1. **School Setup** → Configure before anything else
2. **User Management** → Teachers & students must exist
3. **Enrollment** → Entry point for new students
4. **Attendance** → Daily operation
5. **Grades** → Core academic function
6. **Forms Generation** → Required for compliance

### 💰 Financial Workflows (Private/Hybrid Only)
7. **Fee Structure Setup** → Define pricing
8. **Payment Recording** → Cash flow management
9. **Financial Reports** → Revenue tracking

### 📊 Reporting Workflows (Periodic)
10. **Form 137** → Permanent record (critical)
11. **Form 138** → Report cards (quarterly)
12. **School Forms** → EBEIS compliance (annual)

### 🔄 Supporting Workflows
13. **Assignments** → Homework management
14. **Lesson Plans** → Teaching preparation
15. **Announcements** → Communication
16. **Parent Portal** → Family engagement

---

## Next Steps

**For Comprehensive Testing:**
See `tests/COMPREHENSIVE_E2E_TEST_PLAN.md` for complete Playwright test scenarios covering all these flows.

**For Implementation:**
Each flow has corresponding components in:
- Frontend: `src/components/[module]/`
- Routes: `App.tsx`
- Services: `src/services/`
- Firestore Rules: `firestore.rules`

---

**Document Owner:** EduSync Development Team  
**Last Updated:** November 15, 2025  
**Version:** 1.0
