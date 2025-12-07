# Teaching Assignments Migration Impact Analysis
**Created:** December 7, 2025  
**Issue:** Migrate `teachers.assignments` JSONB → `teaching_assignments` relational table  
**Severity:** 🔴 **CRITICAL** - Core dependency across entire system

---

## Executive Summary

### The Problem
Currently, teaching assignments are stored as a JSONB array in the `teachers` table:
```typescript
interface Teacher {
  assignments?: TeacherAssignment[]; // JSONB array
}

interface TeacherAssignment {
  gradeLevel: number;
  learningAreaId: string;
  learningAreaName?: string;
  sectionId?: string;
  sectionName?: string;
  schoolYear?: string;
}
```

This approach has **CRITICAL limitations**:
- ❌ No foreign key constraints → data integrity issues
- ❌ No hours tracking → can't calculate teaching load
- ❌ No advisory designation → can't identify class advisers
- ❌ Poor query performance → JSONB scans are slow
- ❌ No validation → can store invalid data
- ❌ Overwrites each year → no historical tracking

### The Solution
Create a relational `teaching_assignments` table with proper structure:
```sql
CREATE TABLE teaching_assignments (
  id UUID PRIMARY KEY,
  teacher_id UUID REFERENCES teachers(id),
  school_year TEXT NOT NULL,
  grade_level INTEGER CHECK (1-12),
  section_id UUID REFERENCES sections(id),
  subject TEXT NOT NULL,
  hours_per_week NUMERIC(4,1),      -- NEW: Required for SF7
  is_advisory BOOLEAN DEFAULT false, -- NEW: Required for SF7
  created_at, updated_at TIMESTAMPTZ
);
```

---

## Impact Analysis: System-Wide Dependencies

### 🎯 **Recommendation: DUAL-MODE STRATEGY**

**Phase 1 (Immediate - 1 week):**
- ✅ Run migration script → Create `teaching_assignments` table
- ✅ Keep existing `teachers.assignments` JSONB (READ-ONLY)
- ✅ Use new table for SF7 reports ONLY
- ✅ All existing modules continue using JSONB (zero breakage)

**Phase 2 (Gradual - 2-4 weeks):**
- 🔄 Migrate modules one-by-one to use new table
- 🔄 Add sync mechanism: Write to both JSONB + relational table
- 🔄 Gradually deprecate JSONB usage

**Phase 3 (Final - After full migration):**
- 🗑️ Remove JSONB assignments column
- 🗑️ Remove sync mechanism
- ✅ 100% relational table usage

---

## Module Impact Assessment

### 1️⃣ **Teachers Management** (HIGH IMPACT)
**Files:**
- `src/components/TeachersViewPostgreSQL.tsx` (1,100+ lines)
- `src/hooks/useTeachersPostgreSQL.ts` (500+ lines)

**Current Usage:**
```typescript
// Lines 93-110: Display teacher assignments
{teacher.assignments && teacher.assignments.length > 0 ? (
  teacher.assignments.slice(0, 3).map((assignment: any, idx: number) => {
    // Shows: Grade 7 - Mathematics, Grade 8 - Science, etc.
  })
) : (
  <p>No assignments</p>
)}

// Lines 916-1014: Manage Assignments Modal
<Modal title="Manage Assignments">
  {assignedLearningAreas.map((assignment) => (
    <div>
      {formatGradeLevel(assignment.gradeLevel)} - {assignment.learningAreaName}
      <button onClick={() => handleUnassignLearningArea(assignment)}>Remove</button>
    </div>
  ))}
</Modal>

// Lines 383-428: CRUD operations
handleAssignLearningArea() // Add assignment to JSONB array
handleUnassignLearningArea() // Remove from JSONB array
```

**Impact Assessment:**
- **Reads:** 🔴 CRITICAL - Teacher list displays assignments
- **Writes:** 🔴 CRITICAL - "Manage Assignments" modal adds/removes assignments
- **Migration Strategy:**
  1. Keep JSONB read for display (Phase 1)
  2. Write to BOTH JSONB + new table (Phase 2)
  3. Switch reads to new table (Phase 2)
  4. Remove JSONB writes (Phase 3)

**Migration Complexity:** 🟠 MEDIUM
- Need to update assignment modal to support hours_per_week
- Need to add advisory checkbox (is_advisory)
- Need to update display to show hours and advisory role

---

### 2️⃣ **Gradebook** (HIGH IMPACT)
**Files:**
- `components/GradebookViewNew.tsx`
- `components/CoreValuesGradebookView.tsx`

**Current Usage:**
```typescript
// Filter learning areas by teacher assignments
const applicableLearningAreas = useMemo(() => {
  return learningAreas.filter(la => {
    // Check if teacher is assigned to this subject
    return teacher.assignments?.some(a => 
      a.learningAreaId === la.id && 
      a.gradeLevel === sectionGradeLevel
    );
  });
}, [learningAreas, teacher.assignments, sectionGradeLevel]);
```

**Impact Assessment:**
- **Reads:** 🔴 CRITICAL - Filters which subjects teacher can grade
- **Writes:** ✅ NONE
- **Migration Strategy:**
  1. Read from JSONB initially (Phase 1)
  2. Switch to query `teaching_assignments` table (Phase 2)
  3. Benefit: Can filter by `hours_per_week > 0` (active assignments)

**Migration Complexity:** 🟢 LOW
- Only reads assignments, no writes
- Simple query change: `teacher.assignments` → `teaching_assignments WHERE teacher_id = ?`

---

### 3️⃣ **Teacher Validation Wizard** (MEDIUM IMPACT)
**Files:**
- `components/TeacherValidationWizard.tsx`

**Current Usage:**
```typescript
// Lines 78-80: Get teacher's assigned grade levels and subjects
const teacherAssignments = teacher.assignments || [];
const teacherGradeLevels = teacherAssignments.map(a => a.gradeLevel);
const teacherLearningAreaIds = teacherAssignments.map(a => a.learningAreaId);

// Used to validate if teacher can access certain students/sections
```

**Impact Assessment:**
- **Reads:** 🟡 MEDIUM - Used for access control validation
- **Writes:** ✅ NONE
- **Migration Strategy:**
  1. Read from JSONB initially (Phase 1)
  2. Query new table for validation (Phase 2)

**Migration Complexity:** 🟢 LOW
- Simple array mapping, easy to replace with SQL query

---

### 4️⃣ **Lesson Plans** (MEDIUM IMPACT)
**Files:**
- `components/LessonPlanView.tsx`

**Current Usage:**
```typescript
// Line 234: Filter assignments by section and learning area
const sectionAssignments = assignments.filter(a => 
  a.sectionId === planToEdit.sectionId && 
  a.learningAreaId === planToEdit.learningAreaId
);
```

**Impact Assessment:**
- **Reads:** 🟡 MEDIUM - Validates teacher can create lesson plans for assigned subjects
- **Writes:** ✅ NONE
- **Migration Strategy:**
  1. Read from JSONB initially (Phase 1)
  2. Query new table with WHERE clause (Phase 2)

**Migration Complexity:** 🟢 LOW
- Simple filter operation

---

### 5️⃣ **Seeding Scripts** (HIGH IMPACT)
**Files:**
- `scripts/seed-complete.cjs`
- `scripts/seed-realistic-teacher-demo-data.cjs`
- `scripts/create-teacher-documents-and-assignments.cjs`
- `scripts/emu-exec-seed.cjs`

**Current Usage:**
```javascript
// Create teaching assignments JSONB array
const teachingAssignments = [];
for (const gradeLevel of assignedGrades) {
  teachingAssignments.push({
    gradeLevel: gradeLevel,
    learningAreaId: learningAreaId,
    learningAreaName: teacher.specialization,
    sectionIds: []
  });
}

// Store in teachers collection
await db.collection('teachers').doc(teacher.id).set({
  assignments: teachingAssignments, // JSONB array
  // ... other fields
});
```

**Impact Assessment:**
- **Writes:** 🔴 CRITICAL - Seeds demo data for development/testing
- **Migration Strategy:**
  1. Update scripts to insert into `teaching_assignments` table
  2. Keep JSONB seeding for backward compatibility (Phase 1-2)
  3. Remove JSONB seeding after full migration (Phase 3)

**Migration Complexity:** 🟠 MEDIUM
- Need to add hours_per_week calculations
- Need to set is_advisory based on sections.adviser_id
- Need to migrate ~20 demo teachers

---

### 6️⃣ **Student Filtering** (HIGH IMPACT)
**Files:**
- `src/hooks/useStudentsPostgreSQL.ts`
- Teacher role filters (implied via assignments)

**Current Usage:**
```typescript
// Teacher role: Filter students by assigned grade levels
// Uses teacher.assignments to determine which students are visible

// Implicit dependency:
// 1. Get teacher.assignments (grade levels)
// 2. Filter students WHERE gradeLevel IN (teacher's assigned grades)
```

**Impact Assessment:**
- **Reads:** 🔴 CRITICAL - Teachers can only see students in their assigned grades
- **Writes:** ✅ NONE
- **Migration Strategy:**
  1. Query assignments from new table
  2. Use same filtering logic
  3. **BENEFIT:** Can add `hours_per_week > 0` to filter active assignments only

**Migration Complexity:** 🟢 LOW
- Change data source, keep filtering logic

---

### 7️⃣ **Sections Management** (MEDIUM IMPACT)
**Files:**
- Section CRUD (creating sections)
- Adviser assignment (`sections.adviserId`)

**Current Usage:**
```typescript
// sections table has adviserId field
interface Section {
  id: string;
  name: string;
  gradeLevel: number;
  adviserId?: string; // Links to teachers.id
}

// When assigning adviser, need to verify teacher is assigned to that grade
```

**Impact Assessment:**
- **Reads:** 🟡 MEDIUM - Needs to validate adviser assignment
- **Writes:** 🟡 MEDIUM - Should auto-create `is_advisory = true` assignment
- **Migration Strategy:**
  1. When setting `sections.adviserId`, auto-insert `teaching_assignments` row with `is_advisory = true`
  2. Unique constraint prevents multiple advisers per section
  3. Read from JSONB during transition (Phase 1-2)

**Migration Complexity:** 🟠 MEDIUM
- Need to sync `sections.adviserId` ↔ `teaching_assignments.is_advisory`
- Add database trigger or application logic

---

### 8️⃣ **SF7 Personnel Report** (HIGH IMPACT - NEW MODULE)
**Files:**
- `src/components/deped-forms/SF7Dashboard.tsx`
- `src/services/sf7PersonnelService.ts`
- `src/utils/pdf/sf7PersonnelGenerator.ts`

**Current Usage:**
```typescript
// ✅ ALREADY uses new teaching_assignments table!
const { data, error } = await supabase
  .from('teachers')
  .select(`
    *,
    teaching_assignments!inner(
      id, grade_level, section_id, subject, 
      hours_per_week, is_advisory
    ),
    ancillary_responsibilities(*)
  `);
```

**Impact Assessment:**
- **Reads:** 🟢 ZERO IMPACT - Already designed for new table
- **Writes:** 🟢 ZERO IMPACT - Uses new table
- **Migration Strategy:** ✅ NO MIGRATION NEEDED - ready to use immediately

**Migration Complexity:** ✅ NONE
- **This module is WHY we need the new table!**

---

### 9️⃣ **UAT Tests** (LOW IMPACT)
**Files:**
- `tests/teacher-uat-script.spec.ts`
- `tests/validate-staging-data.spec.ts`

**Current Usage:**
```typescript
// Validate teacher can only see assigned grade levels
test('Teacher should only see assigned sections', async ({ page }) => {
  // Expects: Teacher with Grade 4 assignments sees only Grade 4 sections
  // Uses: teacher.assignments array to determine visibility
});
```

**Impact Assessment:**
- **Reads:** 🟡 MEDIUM - Tests rely on assignment filtering
- **Writes:** ✅ NONE
- **Migration Strategy:**
  1. Update test expectations after migration
  2. Verify assignment filtering still works

**Migration Complexity:** 🟢 LOW
- Update test setup to use new table
- Same test logic

---

## Migration Path: Detailed Plan

### ✅ **PHASE 1: IMMEDIATE (Week 1) - ZERO BREAKAGE**

**Goal:** Enable SF7 report without affecting existing modules

**Actions:**
1. ✅ Run migration script: `20241207_create_personnel_assignments_tables.sql`
   - Creates `teaching_assignments` table
   - Creates `ancillary_responsibilities` table
   - Adds indexes, RLS policies, triggers

2. ✅ Test SF7 Dashboard
   - Verify SF7Dashboard.tsx loads
   - Shows "No personnel found" (empty table)
   - No errors in console

3. ✅ All existing modules continue using JSONB
   - **NO CODE CHANGES to existing modules**
   - Zero risk of breaking production

**Validation:**
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('teaching_assignments', 'ancillary_responsibilities');

-- Should return 0 rows (empty table)
SELECT COUNT(*) FROM teaching_assignments;
```

**Duration:** 1 day  
**Risk:** 🟢 ZERO - No existing code changes

---

### 🔄 **PHASE 2: GRADUAL MIGRATION (Weeks 2-4) - DUAL-MODE**

**Goal:** Migrate modules one-by-one, maintain backward compatibility

#### **Week 2: Data Migration + Sync Layer**

**Step 1: Migrate existing JSONB data to new table**
```sql
-- Migration script: convert JSONB → relational rows
INSERT INTO teaching_assignments (
  teacher_id, school_id, school_year, grade_level, 
  section_id, subject, hours_per_week, is_advisory
)
SELECT 
  t.id AS teacher_id,
  t.school_id,
  '2024-2025' AS school_year, -- Current year
  (a->>'gradeLevel')::INTEGER AS grade_level,
  (a->>'sectionId')::UUID AS section_id,
  (a->>'learningAreaName')::TEXT AS subject,
  0 AS hours_per_week, -- Default 0 (need manual update)
  FALSE AS is_advisory -- Default false (need to sync with sections.adviserId)
FROM teachers t
CROSS JOIN LATERAL jsonb_array_elements(t.assignments) AS a
WHERE t.assignments IS NOT NULL
  AND jsonb_array_length(t.assignments) > 0;

-- Update is_advisory from sections.adviserId
UPDATE teaching_assignments ta
SET is_advisory = TRUE
FROM sections s
WHERE ta.section_id = s.id
  AND ta.teacher_id = s.teacher_id;
```

**Step 2: Create sync layer (write to both)**
```typescript
// src/services/teacherAssignmentSync.ts
export async function addTeachingAssignment(assignment: TeachingAssignment) {
  // 1. Insert into teaching_assignments table
  await supabase.from('teaching_assignments').insert({
    teacher_id: assignment.teacherId,
    school_year: assignment.schoolYear,
    grade_level: assignment.gradeLevel,
    section_id: assignment.sectionId,
    subject: assignment.subject,
    hours_per_week: assignment.hoursPerWeek || 0,
    is_advisory: assignment.isAdvisory || false
  });

  // 2. Also update JSONB array (backward compatibility)
  const { data: teacher } = await supabase
    .from('teachers')
    .select('assignments')
    .eq('id', assignment.teacherId)
    .single();

  const updatedAssignments = [
    ...(teacher.assignments || []),
    {
      gradeLevel: assignment.gradeLevel,
      learningAreaId: assignment.learningAreaId,
      learningAreaName: assignment.subject,
      sectionId: assignment.sectionId,
      schoolYear: assignment.schoolYear
    }
  ];

  await supabase
    .from('teachers')
    .update({ assignments: updatedAssignments })
    .eq('id', assignment.teacherId);
}
```

**Duration:** 5 days  
**Risk:** 🟡 LOW - Dual-mode ensures fallback

---

#### **Week 3: Migrate High-Impact Modules**

**Priority 1: Teachers Management**
- Update `TeachersViewPostgreSQL.tsx`:
  - Change assignment display to query `teaching_assignments` table
  - Update "Manage Assignments" modal:
    - Add "Hours per Week" input field
    - Add "Is Advisory" checkbox
    - Save to new table (via sync layer)

**Priority 2: Gradebook Filtering**
- Update `GradebookViewNew.tsx`:
  - Replace `teacher.assignments.filter()` with Supabase query
  - Filter by `hours_per_week > 0` (active assignments only)

**Priority 3: Student Filtering**
- Update teacher role filters to query new table

**Duration:** 7 days  
**Risk:** 🟠 MEDIUM - Core modules, needs thorough testing

---

#### **Week 4: Migrate Remaining Modules**

**Priority 4: Lesson Plans, Validation, Other**
- Update `LessonPlanView.tsx`
- Update `TeacherValidationWizard.tsx`
- Update seeding scripts

**Priority 5: Testing**
- Update UAT tests
- Verify all modules work with new table
- Performance testing (compare JSONB vs relational queries)

**Duration:** 5 days  
**Risk:** 🟢 LOW - Less critical modules

---

### 🗑️ **PHASE 3: CLEANUP (Week 5) - REMOVE JSONB**

**Goal:** Complete migration, remove legacy code

**Actions:**
1. Remove sync layer (stop writing to JSONB)
2. Remove `assignments` column from `teachers` table:
   ```sql
   ALTER TABLE teachers DROP COLUMN assignments;
   ```
3. Remove JSONB-related code from all modules
4. Update TypeScript types (remove `assignments?: TeacherAssignment[]`)

**Duration:** 2 days  
**Risk:** 🟢 LOW - All modules already using new table

---

## Performance Comparison

### JSONB Query (Current)
```sql
-- Get teacher's Grade 7 assignments
SELECT * FROM teachers
WHERE id = 'teacher-uuid'
  AND assignments @> '[{"gradeLevel": 7}]'::jsonb;
```
- ❌ Full JSONB scan (no index)
- ❌ ~50-200ms for large JSONB arrays
- ❌ Can't use FK joins

### Relational Query (New)
```sql
-- Get teacher's Grade 7 assignments
SELECT ta.*, s.name AS section_name
FROM teaching_assignments ta
LEFT JOIN sections s ON ta.section_id = s.id
WHERE ta.teacher_id = 'teacher-uuid'
  AND ta.grade_level = 7;
```
- ✅ Indexed query (~5-10ms)
- ✅ Can join with sections, subjects
- ✅ Can aggregate (SUM hours_per_week)

**Performance Gain:** 10-20x faster

---

## Risk Mitigation

### Critical Risks

#### 1️⃣ **Data Loss During Migration**
**Risk:** JSONB → relational conversion loses data  
**Mitigation:**
- ✅ Keep JSONB column during Phase 1-2
- ✅ Sync writes to both sources
- ✅ Validate row counts match before cleanup

#### 2️⃣ **Breaking Production**
**Risk:** Changing core assignment logic breaks app  
**Mitigation:**
- ✅ Dual-mode: Read from JSONB initially
- ✅ Gradual migration: One module at a time
- ✅ Feature flags: Toggle between old/new queries

#### 3️⃣ **Advisory Role Conflicts**
**Risk:** Multiple teachers marked as advisory for same section  
**Mitigation:**
- ✅ Database constraint: `UNIQUE INDEX ... WHERE is_advisory = true`
- ✅ Application logic: Auto-remove old advisory when assigning new
- ✅ Sync with `sections.adviserId` field

#### 4️⃣ **Missing Hours Data**
**Risk:** No historical hours_per_week data  
**Mitigation:**
- ✅ Default to 0 during migration
- ✅ Provide UI for principals to update hours
- ✅ Calculate based on DepEd standards (e.g., 6 hours/week per subject)

---

## Recommendations

### ✅ **RECOMMENDED APPROACH: Dual-Mode Migration**

**Why this approach:**
1. ✅ **Zero downtime** - Existing modules keep working
2. ✅ **Low risk** - Gradual migration allows testing at each step
3. ✅ **Rollback ready** - Can revert to JSONB if issues arise
4. ✅ **Enables SF7** - Can use new table immediately for reports
5. ✅ **Future-proof** - Proper relational structure for growth

**Timeline:**
- Week 1: Setup (1 day)
- Week 2-4: Migration (15 days)
- Week 5: Cleanup (2 days)
- **Total: 3-4 weeks**

**Team Effort:**
- 1 developer full-time
- 1 QA tester part-time
- Database admin for migration scripts

---

## Testing Checklist

### Database Migration
- [ ] Run migration script on local dev database
- [ ] Verify tables created with correct schema
- [ ] Verify indexes created (13 indexes)
- [ ] Verify RLS policies enabled
- [ ] Test CRUD operations

### Data Migration
- [ ] Count teachers with assignments: `SELECT COUNT(*) FROM teachers WHERE assignments IS NOT NULL`
- [ ] Run JSONB → relational conversion script
- [ ] Verify row counts match: `SELECT COUNT(*) FROM teaching_assignments`
- [ ] Verify no duplicate assignments
- [ ] Verify advisory roles match `sections.adviserId`

### Module Testing
- [ ] Teachers Management: Assign/unassign subjects works
- [ ] Gradebook: Correct subjects shown for teacher
- [ ] Student list: Teacher sees only assigned grades
- [ ] Lesson Plans: Can create plans for assigned subjects
- [ ] SF7 Report: Shows correct personnel assignments

### Performance Testing
- [ ] Query speed: Relational vs JSONB (expect 10x faster)
- [ ] Load testing: 100+ teachers with 10+ assignments each
- [ ] Concurrent writes: Multiple teachers assigned simultaneously

### Rollback Testing
- [ ] Can revert to JSONB if needed
- [ ] No data loss during rollback
- [ ] Application continues working

---

## Conclusion

### Summary
Migrating teaching assignments from JSONB to relational table is:
- 🔴 **CRITICAL** - Core dependency across 9+ modules
- 🟠 **COMPLEX** - Requires careful planning and testing
- ✅ **NECESSARY** - Required for SF7 compliance and better performance
- ✅ **FEASIBLE** - With dual-mode strategy, can be done safely in 3-4 weeks

### Next Steps
1. **Approve this migration plan** ✅
2. **Run Phase 1 migration script** (1 day)
3. **Test SF7 Dashboard** (1 day)
4. **Begin Phase 2 data migration** (Week 2)
5. **Migrate modules incrementally** (Weeks 3-4)
6. **Cleanup and finalize** (Week 5)

### Final Recommendation
✅ **Proceed with Dual-Mode Migration**
- Start with SF7 using new table (zero risk)
- Keep existing modules on JSONB (no breakage)
- Migrate gradually over 3-4 weeks
- Remove JSONB after all modules migrated

This approach balances **safety** (no production breakage) with **progress** (enables SF7 immediately).
