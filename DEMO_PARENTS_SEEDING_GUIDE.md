# Demo Parents Seeding Guide

**Date**: December 1, 2025  
**Purpose**: Seed realistic demo parent data for testing the Parents module

## 🎯 What Was Created

### 20 Demo Parents with Complete Information

**Parent Details**:
- **Names**: Filipino names (Roberto, Maria, Juan, Elena, etc.)
- **Relationships**: Alternating Father/Mother
- **Occupations**: Teacher, Business Owner, Engineer, Nurse, Sales Manager
- **Contact Numbers**: Realistic Philippine mobile numbers (+63-9XXXXXXXXX)
- **Emails**: Generated from parent names (e.g., roberto.santos@email.com)
- **Addresses**: Various barangays in Dolores, Batangas

**Student Linkage**:
- Each parent linked to one student in Grades 1-3
- Proper parent-student relationships in junction table
- Primary contact flag set

## 📁 Files Updated

### 1. `scripts/migration/COMPLETE-SEEDING-MASTER.sql`
**Updated Section**: STEP 10 & STEP 11 (Parents & Parent-Student Links)

**Changes**:
- Expanded from 10 to 20 parents
- Added occupation field
- Improved name generation (Filipino first names)
- Better email formatting
- Multiple address variations
- Links parents to students in Grades 1-3 (not just Grade 1)

### 2. `scripts/migration/seed-demo-parents.sql` (NEW)
**Purpose**: Quick-run script to seed only parents data

**Features**:
- Standalone script for adding parents to existing database
- Only affects newly created parents (last 1 minute filter)
- Includes verification queries
- Shows sample data and relationships

## 🚀 How to Use

### Option 1: Full Database Seed (Recommended for Fresh Start)

Run the complete seeding script:
```bash
# In Supabase SQL Editor, run:
scripts/migration/COMPLETE-SEEDING-MASTER.sql
```

This will create:
- School
- Sections
- Teachers
- Students
- Learning Areas
- **Parents (20)**
- **Parent-Student Relationships (20)**
- Schedules
- Attendance
- Grades

### Option 2: Add Parents Only (For Existing Database)

If you already have students and just want to add parents:

```bash
# In Supabase SQL Editor, run:
scripts/migration/seed-demo-parents.sql
```

This will:
1. Create 20 parents
2. Link them to existing students in Grades 1-3
3. Show verification data

## 📊 Demo Parent Data Preview

| # | Parent Name | Relationship | Occupation | Contact | Email |
|---|-------------|--------------|------------|---------|-------|
| 1 | Roberto Santos | Father | Business Owner | +63-9100012345 | roberto.santos@email.com |
| 2 | Maria Santos | Mother | Engineer | +63-9100024690 | maria.santos@email.com |
| 3 | Juan Cruz | Father | Nurse | +63-9100037035 | juan.cruz@email.com |
| 4 | Elena Cruz | Mother | Sales Manager | +63-9100049380 | elena.cruz@email.com |
| 5 | Pedro Reyes | Father | Teacher | +63-9100061725 | pedro.reyes@email.com |
| 6 | Carmen Reyes | Mother | Business Owner | +63-9100074070 | carmen.reyes@email.com |
| 7 | Antonio Garcia | Father | Engineer | +63-9100086415 | antonio.garcia@email.com |
| 8 | Rosa Garcia | Mother | Nurse | +63-9100098760 | rosa.garcia@email.com |
| ... | ... | ... | ... | ... | ... |

## 🔍 Verification Queries

After seeding, verify the data:

```sql
-- Count total parents
SELECT COUNT(*) as total_parents FROM parents;
-- Expected: 20

-- Count parent-student relationships
SELECT COUNT(*) as total_relationships FROM parent_students;
-- Expected: 20

-- Show all parents with their children
SELECT 
  p.name as parent_name,
  p.relationship,
  p.occupation,
  s.name as student_name,
  sec.name as section_name
FROM parents p
JOIN parent_students ps ON p.id = ps.parent_id
JOIN students s ON ps.student_id = s.id
JOIN sections sec ON s.section_id = sec.id
ORDER BY p.name;
```

## 🎨 Testing the UI

After seeding, test the ParentsViewPostgreSQL component:

1. **Login** to the application
2. **Navigate** to `/parents` route
3. **Verify** you see 20 parents in the table
4. **Test Search**: Search for "Roberto" or "Maria"
5. **Test Actions**:
   - Click "Manage Children" on any parent
   - View assigned student
   - Try assigning/unassigning students
   - Edit parent information
   - Create new parent

## 📝 Sample Test Scenarios

### Scenario 1: View Parent Details
1. Navigate to `/parents`
2. See list of 20 parents
3. Click on "Roberto Santos"
4. View his information:
   - Name: Roberto Santos
   - Relationship: Father
   - Occupation: Business Owner
   - Contact: +63-9100012345
   - Email: roberto.santos@email.com

### Scenario 2: Manage Children
1. Click "Manage Children" for Maria Santos
2. See her assigned child from Grade 1-3
3. Section information displayed
4. Try assigning another student
5. Successfully link multiple children

### Scenario 3: Search Functionality
1. Search for "Garcia"
2. See Antonio Garcia and Rosa Garcia
3. Search for "Teacher"
4. See all parents with Teacher occupation
5. Clear search shows all 20 again

### Scenario 4: Edit Parent
1. Click Edit on Pedro Reyes
2. Change occupation to "Doctor"
3. Update contact number
4. Save changes
5. Verify updated in list

## 🔧 Database Schema

```sql
-- Parents Table
CREATE TABLE parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50),      -- Father, Mother, Guardian
    occupation VARCHAR(100),        -- NEW: Added occupation
    contact_number VARCHAR(20),
    email VARCHAR(255),
    address TEXT,                   -- Full address with barangay
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Parent-Student Junction Table
CREATE TABLE parent_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES parents(id),
    student_id UUID NOT NULL REFERENCES students(id),
    relationship VARCHAR(50),       -- Can differ from parent.relationship
    is_primary_contact BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);
```

## 🎯 Next Steps

After seeding parents:

1. **Test UI**: Open `/parents` and verify all 20 parents display
2. **Test CRUD**: Create, edit, delete parent records
3. **Test Search**: Search by name, email, occupation
4. **Test Relationships**: Assign/unassign students
5. **Test Real-time**: Open in multiple tabs, verify sync
6. **Test Dark Mode**: Toggle dark mode, verify styling
7. **Test Mobile**: Check responsive design on mobile

## 📚 Related Files

- `src/hooks/useParentsPostgreSQL.ts` - Parent data hook
- `src/components/ParentsViewPostgreSQL.tsx` - Parent UI component
- `scripts/migration/COMPLETE-SEEDING-MASTER.sql` - Full database seed
- `scripts/migration/seed-demo-parents.sql` - Quick parent seed
- `PARENTS_POSTGRESQL_MIGRATION_COMPLETE.md` - Migration documentation

## ✅ Checklist

After running the seeding script:

- [ ] 20 parents created in database
- [ ] All parents have complete information (name, email, contact, etc.)
- [ ] 20 parent-student relationships created
- [ ] Parents UI displays all 20 parents
- [ ] Search functionality works
- [ ] Manage Children modal shows correct students
- [ ] Edit parent works correctly
- [ ] Delete parent works (soft delete)
- [ ] Real-time updates working across tabs

---

**Success!** You now have 20 realistic demo parents ready for testing! 🎉
