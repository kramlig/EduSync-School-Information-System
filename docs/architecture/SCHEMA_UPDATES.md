# Schema Updates for Multi-Tenant Migration

**Document Version:** 1.0  
**Last Updated:** November 8, 2025  
**Status:** Draft  

---

## Overview

This document details all schema changes required to transform EduSync from a single-tenant to multi-tenant architecture. Every collection will receive a `schoolId` field to enable school-level data isolation.

**Scope:** 16 collections + 1 new collection  
**Breaking Changes:** Yes - all existing data requires migration  
**Migration Effort:** ~76 hours  

---

## Table of Contents

1. [New Collection: Schools](#new-collection-schools)
2. [Updated Collections (16)](#updated-collections)
   - [Students](#students-collection)
   - [Teachers](#teachers-collection)
   - [Parents](#parents-collection)
   - [Sections](#sections-collection)
   - [Learning Areas](#learningareas-collection)
   - [Grades](#grades-collection)
   - [Core Values](#corevalues-collection)
   - [Core Value Grades](#corevaluegrades-collection)
   - [Attendance Records](#attendancerecords-collection)
   - [Substitute Assignments](#substituteassignments-collection)
   - [Class Schedules](#classschedules-collection)
   - [Assignments](#assignments-collection)
   - [Student Assignment Grades](#studentassignmentgrades-collection)
   - [Lesson Plans](#lessonplans-collection)
   - [Announcements](#announcements-collection)
   - [Settings (Deprecated)](#settings-collection-deprecated)
3. [Migration Strategy](#migration-strategy)
4. [Validation Rules](#validation-rules)
5. [Rollback Plan](#rollback-plan)

---

## New Collection: Schools

### Purpose
Central registry for all schools in the multi-tenant system. Each school document contains configuration previously stored in the singleton `settings` collection.

### Collection Path
```
schools/{schoolId}
```

### Schema Definition

```typescript
interface School {
  // Identity
  id: string; // Same as document ID, e.g., "school-001"
  name: string; // "St. Mary's Academy"
  shortName?: string; // "SMA"
  
  // Contact Information
  address: {
    street: string;
    barangay: string;
    city: string;
    province: string;
    region: string;
    zipCode?: string;
  };
  contactEmail: string;
  contactPhone: string;
  principalName: string;
  
  // Branding
  branding: {
    logoUrl?: string; // Firebase Storage path
    primaryColor?: string; // Hex color, e.g., "#1e40af"
    secondaryColor?: string; // Hex color
    schoolMotto?: string;
    schoolVision?: string;
    schoolMission?: string;
  };
  
  // DepEd Information
  depedInfo: {
    schoolId: string; // Official DepEd School ID
    regionCode: string; // e.g., "NCR"
    divisionCode: string;
    districtCode?: string;
  };
  
  // Academic Configuration
  academicConfig: {
    currentSchoolYear: string; // e.g., "2024-2025"
    schoolYearStart: string; // ISO date
    schoolYearEnd: string; // ISO date
    gradingPeriods: number; // Usually 4
    trackingSystem: 'quarterly' | 'semester';
    gradeLevel: {
      min: number; // e.g., 7 for JHS
      max: number; // e.g., 12 for SHS
    };
  };
  
  // Feature Flags (from old settings)
  features: {
    enrollmentPortal: {
      enabled: boolean;
      requirePayment: boolean;
      acceptingApplications: boolean;
    };
    billing: {
      enabled: boolean;
      currency: string; // "PHP"
      paymentMethods: ('cash' | 'check' | 'bank_transfer' | 'gcash')[];
    };
    aiFeatures: {
      lessonPlans: boolean;
      studentReports: boolean;
    };
    parentPortal: {
      enabled: boolean;
      allowGradeView: boolean;
      allowBillingView: boolean;
    };
  };
  
  // Fee Structure (from old settings)
  feeStructure: {
    [gradeLevel: string]: {
      tuitionFee: number;
      miscellaneousFees: {
        name: string;
        amount: number;
        required: boolean;
      }[];
      totalPerGradeLevel: number;
    };
  };
  
  // Subscription & Limits
  subscription: {
    plan: 'trial' | 'basic' | 'premium' | 'enterprise';
    status: 'active' | 'suspended' | 'cancelled';
    trialEndsAt?: string; // ISO date
    billingEmail: string;
    currentPeriodStart: string; // ISO date
    currentPeriodEnd: string; // ISO date
  };
  
  limits: {
    maxStudents: number; // e.g., 500 for basic
    maxTeachers: number;
    maxStorage: number; // MB
  };
  
  // Usage Tracking
  usage: {
    studentCount: number;
    teacherCount: number;
    parentCount: number;
    storageUsed: number; // MB
    lastUpdated: string; // ISO date
  };
  
  // Metadata
  createdAt: string; // ISO date
  createdBy: string; // User ID of creator
  updatedAt: string; // ISO date
  updatedBy?: string; // User ID of last updater
  status: 'active' | 'inactive' | 'archived';
}
```

### Example Document

```json
{
  "id": "school-001",
  "name": "St. Mary's Academy",
  "shortName": "SMA",
  "address": {
    "street": "123 Education St.",
    "barangay": "San Roque",
    "city": "Manila",
    "province": "Metro Manila",
    "region": "NCR",
    "zipCode": "1000"
  },
  "contactEmail": "admin@stmarys.edu.ph",
  "contactPhone": "+63 2 1234 5678",
  "principalName": "Dr. Maria Santos",
  "branding": {
    "logoUrl": "schools/school-001/logo.png",
    "primaryColor": "#1e40af",
    "schoolMotto": "Truth, Excellence, Service"
  },
  "depedInfo": {
    "schoolId": "123456",
    "regionCode": "NCR",
    "divisionCode": "MAN"
  },
  "academicConfig": {
    "currentSchoolYear": "2024-2025",
    "schoolYearStart": "2024-08-26",
    "schoolYearEnd": "2025-04-30",
    "gradingPeriods": 4,
    "trackingSystem": "quarterly",
    "gradeLevel": { "min": 7, "max": 12 }
  },
  "features": {
    "enrollmentPortal": {
      "enabled": true,
      "requirePayment": false,
      "acceptingApplications": true
    },
    "billing": {
      "enabled": true,
      "currency": "PHP",
      "paymentMethods": ["cash", "gcash"]
    },
    "aiFeatures": {
      "lessonPlans": true,
      "studentReports": false
    },
    "parentPortal": {
      "enabled": true,
      "allowGradeView": true,
      "allowBillingView": true
    }
  },
  "subscription": {
    "plan": "trial",
    "status": "active",
    "trialEndsAt": "2025-12-31",
    "billingEmail": "billing@stmarys.edu.ph",
    "currentPeriodStart": "2024-11-01",
    "currentPeriodEnd": "2024-11-30"
  },
  "limits": {
    "maxStudents": 1000,
    "maxTeachers": 50,
    "maxStorage": 5120
  },
  "usage": {
    "studentCount": 450,
    "teacherCount": 25,
    "parentCount": 320,
    "storageUsed": 1240,
    "lastUpdated": "2025-11-08T10:00:00Z"
  },
  "createdAt": "2024-11-01T00:00:00Z",
  "createdBy": "user-admin-001",
  "updatedAt": "2025-11-08T10:00:00Z",
  "status": "active"
}
```

### Migration from Settings Collection

The current `settings` collection is a singleton (only 1 document). During migration:

1. Read the existing `settings` document
2. Create a new `schools/school-001` document
3. Map old settings fields to new School schema:
   - `schoolName` → `name`
   - `currentSchoolYear` → `academicConfig.currentSchoolYear`
   - `enrollmentSettings` → `features.enrollmentPortal`
   - `feeStructure` → `feeStructure`
4. Add new required fields (subscription, limits, usage, branding)
5. Archive old settings document (don't delete for rollback)

---

## Updated Collections

### Students Collection

**Collection Path:** `students/{studentId}`

#### Current Schema (Before)

```typescript
interface Student {
  id: string;
  lrn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  birthDate: string;
  sex: 'Male' | 'Female';
  gradeLevel: number;
  section?: string;
  sectionId?: string;
  track?: string;
  strand?: string;
  emailAddress?: string;
  contactNumber?: string;
  parentContact?: string;
  address?: {
    street?: string;
    barangay?: string;
    city?: string;
    province?: string;
  };
  enrollmentStatus: 'enrolled' | 'pending' | 'transferred' | 'graduated';
  enrollmentDate?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Updated Schema (After)

```typescript
interface Student {
  // NEW: School association
  schoolId: string; // REQUIRED - e.g., "school-001"
  
  // Existing fields (unchanged)
  id: string;
  lrn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  birthDate: string;
  sex: 'Male' | 'Female';
  gradeLevel: number;
  section?: string;
  sectionId?: string;
  track?: string;
  strand?: string;
  emailAddress?: string;
  contactNumber?: string;
  parentContact?: string;
  address?: {
    street?: string;
    barangay?: string;
    city?: string;
    province?: string;
  };
  enrollmentStatus: 'enrolled' | 'pending' | 'transferred' | 'graduated';
  enrollmentDate?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Migration Strategy

1. **Add Field:**
   ```typescript
   // For each student document:
   await updateDoc(doc(db, 'students', studentId), {
     schoolId: 'school-001' // Default for existing data
   });
   ```

2. **Query Update:**
   ```typescript
   // BEFORE (single-tenant)
   const q = query(collection(db, 'students'), where('gradeLevel', '==', 7));
   
   // AFTER (multi-tenant)
   const q = query(
     collection(db, 'students'),
     where('schoolId', '==', currentSchoolId),
     where('gradeLevel', '==', 7)
   );
   ```

3. **Index Required:**
   ```json
   {
     "collectionGroup": "students",
     "queryScope": "COLLECTION",
     "fields": [
       { "fieldPath": "schoolId", "order": "ASCENDING" },
       { "fieldPath": "gradeLevel", "order": "ASCENDING" }
     ]
   }
   ```

#### Validation Rules

- `schoolId` must exist in `schools` collection
- `schoolId` cannot be changed after creation
- All queries must filter by `schoolId`

---

### Teachers Collection

**Collection Path:** `teachers/{teacherId}`

#### Current Schema (Before)

```typescript
interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  email: string;
  contactNumber?: string;
  subject?: string;
  subjects?: string[];
  department?: string;
  isAdvisor?: boolean;
  advisorySection?: string;
  advisorySectionId?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Updated Schema (After)

```typescript
interface Teacher {
  // NEW: School association
  schoolId: string; // REQUIRED
  
  // Existing fields (unchanged)
  id: string;
  employeeId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  email: string;
  contactNumber?: string;
  subject?: string;
  subjects?: string[];
  department?: string;
  isAdvisor?: boolean;
  advisorySection?: string;
  advisorySectionId?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Migration Strategy

Same as Students collection:
1. Add `schoolId: 'school-001'` to all existing teachers
2. Update all queries to filter by `schoolId`
3. Create composite indexes

#### Required Indexes

```json
[
  {
    "collectionGroup": "teachers",
    "fields": [
      { "fieldPath": "schoolId", "order": "ASCENDING" },
      { "fieldPath": "department", "order": "ASCENDING" }
    ]
  },
  {
    "collectionGroup": "teachers",
    "fields": [
      { "fieldPath": "schoolId", "order": "ASCENDING" },
      { "fieldPath": "isAdvisor", "order": "ASCENDING" }
    ]
  }
]
```

---

### Parents Collection

**Collection Path:** `parents/{parentId}`

#### Current Schema (Before)

```typescript
interface Parent {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  contactNumber?: string;
  relationship?: 'Father' | 'Mother' | 'Guardian';
  occupation?: string;
  studentIds: string[];
  createdAt: string;
  updatedAt: string;
}
```

#### Updated Schema (After)

```typescript
interface Parent {
  // NEW: School association
  schoolId: string; // REQUIRED
  
  // Existing fields (unchanged)
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  contactNumber?: string;
  relationship?: 'Father' | 'Mother' | 'Guardian';
  occupation?: string;
  studentIds: string[]; // Must belong to same school
  createdAt: string;
  updatedAt: string;
}
```

#### Migration Strategy

**Special Case:** Parents with children in multiple schools

**Option 1 (Recommended):** Create separate parent accounts per school
```typescript
// If parent has kids in school-001 and school-002:
// Create parent-001-school-001 with studentIds from school-001
// Create parent-001-school-002 with studentIds from school-002
```

**Option 2:** Use primary school + cross-references
```typescript
interface Parent {
  schoolId: string; // Primary school
  additionalSchools?: string[]; // Other schools where they have children
  studentIdsBySchool: {
    [schoolId: string]: string[];
  };
}
```

For initial migration: Use Option 1 (simpler, cleaner data isolation)

#### Required Indexes

```json
{
  "collectionGroup": "parents",
  "fields": [
    { "fieldPath": "schoolId", "order": "ASCENDING" },
    { "fieldPath": "email", "order": "ASCENDING" }
  ]
}
```

---

### Sections Collection

**Collection Path:** `sections/{sectionId}`

#### Current Schema (Before)

```typescript
interface Section {
  id: string;
  name: string;
  gradeLevel: number;
  track?: string;
  strand?: string;
  advisorId?: string;
  advisorName?: string;
  room?: string;
  schedule?: string;
  capacity?: number;
  createdAt: string;
  updatedAt: string;
}
```

#### Updated Schema (After)

```typescript
interface Section {
  // NEW: School association
  schoolId: string; // REQUIRED
  
  // Existing fields (unchanged)
  id: string;
  name: string;
  gradeLevel: number;
  track?: string;
  strand?: string;
  advisorId?: string;
  advisorName?: string;
  room?: string;
  schedule?: string;
  capacity?: number;
  createdAt: string;
  updatedAt: string;
}
```

#### Required Indexes

```json
{
  "collectionGroup": "sections",
  "fields": [
    { "fieldPath": "schoolId", "order": "ASCENDING" },
    { "fieldPath": "gradeLevel", "order": "ASCENDING" }
  ]
}
```

---

### LearningAreas Collection

**Collection Path:** `learningAreas/{learningAreaId}`

#### Current Schema (Before)

```typescript
interface LearningArea {
  id: string;
  code: string;
  name: string;
  gradeLevel: number;
  track?: string;
  strand?: string;
  semester?: number;
  isCore?: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### Updated Schema (After)

```typescript
interface LearningArea {
  // NEW: School association
  schoolId: string; // REQUIRED
  
  // Existing fields (unchanged)
  id: string;
  code: string;
  name: string;
  gradeLevel: number;
  track?: string;
  strand?: string;
  semester?: number;
  isCore?: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### Required Indexes

```json
{
  "collectionGroup": "learningAreas",
  "fields": [
    { "fieldPath": "schoolId", "order": "ASCENDING" },
    { "fieldPath": "gradeLevel", "order": "ASCENDING" }
  ]
}
```

---

### Grades Collection

**Collection Path:** `grades/{gradeId}`

**⚠️ CRITICAL:** This collection has the highest document count (~50,000+ docs in production)

#### Current Schema (Before)

```typescript
interface Grade {
  id: string;
  studentId: string;
  sectionId: string;
  learningAreaId: string;
  quarter: number;
  writtenWork?: number;
  performanceTask?: number;
  quarterlyExam?: number;
  quarterlyGrade?: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Updated Schema (After)

```typescript
interface Grade {
  // NEW: School association
  schoolId: string; // REQUIRED
  
  // Existing fields (unchanged)
  id: string;
  studentId: string;
  sectionId: string;
  learningAreaId: string;
  quarter: number;
  writtenWork?: number;
  performanceTask?: number;
  quarterlyExam?: number;
  quarterlyGrade?: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Migration Strategy

**Performance Considerations:**
- Batch updates in chunks of 500 documents
- Use Firestore batch writes (max 500 operations)
- Estimate: ~50,000 docs ÷ 500 = 100 batches
- Time: ~10-15 minutes for migration

```typescript
// Pseudo-code for batch migration
const batchSize = 500;
let lastDoc = null;

do {
  let q = query(collection(db, 'grades'), limit(batchSize));
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  
  snapshot.forEach(doc => {
    batch.update(doc.ref, { schoolId: 'school-001' });
  });
  
  await batch.commit();
  lastDoc = snapshot.docs[snapshot.docs.length - 1];
} while (lastDoc);
```

#### Required Indexes

```json
[
  {
    "collectionGroup": "grades",
    "fields": [
      { "fieldPath": "schoolId", "order": "ASCENDING" },
      { "fieldPath": "studentId", "order": "ASCENDING" },
      { "fieldPath": "quarter", "order": "ASCENDING" }
    ]
  },
  {
    "collectionGroup": "grades",
    "fields": [
      { "fieldPath": "schoolId", "order": "ASCENDING" },
      { "fieldPath": "sectionId", "order": "ASCENDING" }
    ]
  }
]
```

---

### CoreValues Collection

**Collection Path:** `coreValues/{coreValueId}`

#### Updated Schema

```typescript
interface CoreValue {
  schoolId: string; // NEW - REQUIRED
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### CoreValueGrades Collection

**Collection Path:** `coreValueGrades/{gradeId}`

#### Updated Schema

```typescript
interface CoreValueGrade {
  schoolId: string; // NEW - REQUIRED
  id: string;
  studentId: string;
  coreValueId: string;
  quarter: number;
  rating: 'AO' | 'SO' | 'RO' | 'NO'; // Always Observed, Sometimes, Rarely, Not
  createdAt: string;
  updatedAt: string;
}
```

#### Required Index

```json
{
  "collectionGroup": "coreValueGrades",
  "fields": [
    { "fieldPath": "schoolId", "order": "ASCENDING" },
    { "fieldPath": "studentId", "order": "ASCENDING" },
    { "fieldPath": "quarter", "order": "ASCENDING" }
  ]
}
```

---

### AttendanceRecords Collection

**Collection Path:** `attendanceRecords/{recordId}`

#### Updated Schema

```typescript
interface AttendanceRecord {
  schoolId: string; // NEW - REQUIRED
  id: string;
  studentId: string;
  sectionId: string;
  date: string; // ISO date
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Required Index

```json
{
  "collectionGroup": "attendanceRecords",
  "fields": [
    { "fieldPath": "schoolId", "order": "ASCENDING" },
    { "fieldPath": "date", "order": "DESCENDING" }
  ]
}
```

---

### SubstituteAssignments Collection

**Collection Path:** `substituteAssignments/{assignmentId}`

#### Updated Schema

```typescript
interface SubstituteAssignment {
  schoolId: string; // NEW - REQUIRED
  id: string;
  absentTeacherId: string;
  substituteTeacherId: string;
  sectionId: string;
  date: string;
  period?: string;
  subject?: string;
  status: 'pending' | 'confirmed' | 'completed';
  createdAt: string;
  updatedAt: string;
}
```

---

### ClassSchedules Collection

**Collection Path:** `classSchedules/{scheduleId}`

#### Updated Schema

```typescript
interface ClassSchedule {
  schoolId: string; // NEW - REQUIRED
  id: string;
  sectionId: string;
  teacherId: string;
  learningAreaId: string;
  dayOfWeek: number; // 0-6
  startTime: string; // "08:00"
  endTime: string; // "09:00"
  room?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### Assignments Collection

**Collection Path:** `assignments/{assignmentId}`

#### Updated Schema

```typescript
interface Assignment {
  schoolId: string; // NEW - REQUIRED
  id: string;
  title: string;
  description?: string;
  sectionId: string;
  learningAreaId: string;
  teacherId: string;
  dueDate?: string;
  totalPoints?: number;
  type: 'homework' | 'project' | 'quiz';
  createdAt: string;
  updatedAt: string;
}
```

---

### StudentAssignmentGrades Collection

**Collection Path:** `studentAssignmentGrades/{gradeId}`

#### Updated Schema

```typescript
interface StudentAssignmentGrade {
  schoolId: string; // NEW - REQUIRED
  id: string;
  studentId: string;
  assignmentId: string;
  score?: number;
  submittedAt?: string;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### LessonPlans Collection

**Collection Path:** `lessonPlans/{planId}`

#### Updated Schema

```typescript
interface LessonPlan {
  schoolId: string; // NEW - REQUIRED
  id: string;
  teacherId: string;
  learningAreaId: string;
  sectionId?: string;
  title: string;
  objectives?: string[];
  content?: string;
  activities?: string[];
  assessment?: string;
  date?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### Announcements Collection

**Collection Path:** `announcements/{announcementId}`

#### Updated Schema

```typescript
interface Announcement {
  schoolId: string; // NEW - REQUIRED
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  targetAudience: 'all' | 'teachers' | 'students' | 'parents';
  priority: 'low' | 'normal' | 'high';
  publishDate: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### Settings Collection (Deprecated)

**Status:** ⚠️ DEPRECATED - Will be migrated to `schools` collection

**Migration Path:**
1. Read existing `settings` document
2. Create `schools/school-001` with data
3. Rename `settings` → `settings_archive_[timestamp]`
4. Do NOT delete (needed for rollback)

**Timeline:** Phase 2, Week 4

---

## Migration Strategy

### Phase 1: Preparation (Week 1-2)

1. **Create Migration Script:**
   ```typescript
   // scripts/migrate-add-school-id.ts
   
   import { initializeApp } from 'firebase-admin/app';
   import { getFirestore, FieldValue } from 'firebase-admin/firestore';
   
   const SCHOOL_ID = 'school-001';
   const BATCH_SIZE = 500;
   
   const collections = [
     'students', 'teachers', 'parents', 'sections',
     'learningAreas', 'grades', 'coreValues', 'coreValueGrades',
     'attendanceRecords', 'substituteAssignments', 'classSchedules',
     'assignments', 'studentAssignmentGrades', 'lessonPlans', 'announcements'
   ];
   
   async function addSchoolIdToCollection(collectionName: string) {
     console.log(`Migrating ${collectionName}...`);
     const db = getFirestore();
     let processed = 0;
     
     // Get total count first
     const snapshot = await db.collection(collectionName).count().get();
     const total = snapshot.data().count;
     console.log(`Total documents: ${total}`);
     
     // Process in batches
     let lastDoc = null;
     do {
       let query = db.collection(collectionName).limit(BATCH_SIZE);
       if (lastDoc) {
         query = query.startAfter(lastDoc);
       }
       
       const batch = db.batch();
       const docs = await query.get();
       
       docs.forEach(doc => {
         batch.update(doc.ref, {
           schoolId: SCHOOL_ID,
           updatedAt: FieldValue.serverTimestamp()
         });
       });
       
       await batch.commit();
       processed += docs.size;
       console.log(`Progress: ${processed}/${total} (${((processed/total)*100).toFixed(1)}%)`);
       
       lastDoc = docs.docs[docs.size - 1];
     } while (lastDoc);
     
     console.log(`✅ Completed ${collectionName}`);
   }
   
   async function main() {
     initializeApp();
     
     for (const collection of collections) {
       await addSchoolIdToCollection(collection);
     }
     
     console.log('🎉 Migration complete!');
   }
   
   main().catch(console.error);
   ```

2. **Dry Run Script:**
   ```typescript
   // Same as above but with `dryRun: true` flag
   // Only logs what would be changed, doesn't write
   ```

### Phase 2: Execution (Week 15)

1. **Backup Production Data:**
   ```bash
   firebase firestore:export gs://edusync-sis.appspot.com/backups/pre-migration-$(date +%Y%m%d)
   ```

2. **Run Dry Run:**
   ```bash
   npm run migrate:dry-run
   ```

3. **Review Logs:**
   - Verify document counts
   - Check for errors
   - Validate data samples

4. **Execute Migration:**
   ```bash
   npm run migrate:add-school-id
   ```

5. **Verify Results:**
   - Check document counts match
   - Verify `schoolId` field present in all docs
   - Test queries in Firestore console

### Phase 3: Validation (Week 15-16)

1. **Data Integrity Checks:**
   ```typescript
   // Check every collection has schoolId
   for (const collection of collections) {
     const missing = await db.collection(collection)
       .where('schoolId', '==', null)
       .count()
       .get();
     
     if (missing.data().count > 0) {
       console.error(`❌ ${collection}: ${missing.data().count} docs missing schoolId`);
     }
   }
   ```

2. **Referential Integrity:**
   ```typescript
   // Verify all schoolIds exist in schools collection
   const schoolIds = new Set();
   const schoolsSnapshot = await db.collection('schools').get();
   schoolsSnapshot.forEach(doc => schoolIds.add(doc.id));
   
   // Check each collection
   for (const collection of collections) {
     const docs = await db.collection(collection).get();
     docs.forEach(doc => {
       if (!schoolIds.has(doc.data().schoolId)) {
         console.error(`❌ Invalid schoolId: ${doc.id} in ${collection}`);
       }
     });
   }
   ```

---

## Validation Rules

### Required Validations

1. **SchoolId Presence:**
   - All new documents MUST have `schoolId`
   - Enforced in Firestore security rules
   - Enforced in TypeScript types (non-optional)

2. **SchoolId Immutability:**
   - Cannot change `schoolId` after creation
   - Enforced in security rules

3. **SchoolId Existence:**
   - `schoolId` must exist in `schools` collection
   - Enforced in security rules

4. **Query Filtering:**
   - ALL queries MUST filter by `schoolId`
   - Enforced by code review
   - Tested in unit tests

### Security Rules Example

```javascript
match /students/{studentId} {
  allow create: if request.auth != null 
    && request.resource.data.schoolId is string
    && exists(/databases/$(database)/documents/schools/$(request.resource.data.schoolId))
    && getUserSchoolId() == request.resource.data.schoolId;
  
  allow update: if request.auth != null
    && resource.data.schoolId == request.resource.data.schoolId // Immutable
    && getUserSchoolId() == resource.data.schoolId;
  
  allow read: if request.auth != null
    && getUserSchoolId() == resource.data.schoolId;
  
  allow delete: if request.auth != null
    && getUserSchoolId() == resource.data.schoolId
    && hasRole('admin');
}
```

---

## Rollback Plan

### Scenario 1: Migration Fails Mid-Process

**Action:**
1. Stop migration script
2. Restore from backup:
   ```bash
   firebase firestore:import gs://edusync-sis.appspot.com/backups/pre-migration-20251108
   ```
3. Investigate failure
4. Fix script
5. Retry

### Scenario 2: Data Corruption Detected

**Action:**
1. Immediately switch app to maintenance mode
2. Restore from backup
3. Investigate root cause
4. Fix migration script
5. Re-test in staging
6. Retry migration

### Scenario 3: Query Performance Issues

**Action:**
1. Check if indexes are deployed:
   ```bash
   firebase firestore:indexes
   ```
2. If missing, deploy indexes:
   ```bash
   firebase deploy --only firestore:indexes
   ```
3. Wait 10-20 minutes for index build
4. Verify queries work

---

## Index Deployment

### Complete Index Configuration

**File:** `firestore.indexes.json`

```json
{
  "indexes": [
    {
      "collectionGroup": "students",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "schoolId", "order": "ASCENDING" },
        { "fieldPath": "gradeLevel", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "students",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "schoolId", "order": "ASCENDING" },
        { "fieldPath": "enrollmentStatus", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "teachers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "schoolId", "order": "ASCENDING" },
        { "fieldPath": "department", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "grades",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "schoolId", "order": "ASCENDING" },
        { "fieldPath": "studentId", "order": "ASCENDING" },
        { "fieldPath": "quarter", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "grades",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "schoolId", "order": "ASCENDING" },
        { "fieldPath": "sectionId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "attendanceRecords",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "schoolId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "announcements",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "schoolId", "order": "ASCENDING" },
        { "fieldPath": "publishDate", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### Deployment Command

```bash
firebase deploy --only firestore:indexes
```

**Expected Output:**
```
✔ firestore: deployed 20 indexes
ℹ firestore: indexes are building in the background
ℹ firestore: you can check progress at https://console.firebase.google.com/...
```

**Build Time:** 10-20 minutes (depends on data volume)

---

## Checklist

### Pre-Migration

- [ ] All TypeScript interfaces updated with `schoolId`
- [ ] Migration script created and tested
- [ ] Dry run completed successfully
- [ ] Backup created and verified
- [ ] Indexes configuration prepared
- [ ] Rollback plan documented
- [ ] Team notified of migration window

### During Migration

- [ ] Monitor script progress
- [ ] Check error logs
- [ ] Verify batch completion
- [ ] Document any issues

### Post-Migration

- [ ] Verify document counts match
- [ ] Check all docs have `schoolId`
- [ ] Deploy indexes
- [ ] Wait for index build completion
- [ ] Test queries work
- [ ] Verify referential integrity
- [ ] Run smoke tests
- [ ] Monitor error rates

---

**Document Status:** Ready for review  
**Next Steps:** Create QUERY_MIGRATION_CHECKLIST.md  
**Owner:** Development Team
