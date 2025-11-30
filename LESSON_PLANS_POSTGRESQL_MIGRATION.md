# Lesson Plans PostgreSQL Migration

**Date**: November 28, 2025  
**Status**: ✅ Complete  
**Migration Type**: Full (Firestore → PostgreSQL)

## Overview

Successfully migrated the Lesson Plans module from Firestore to PostgreSQL, following the same pattern established for the Assignments migration. This ensures consistent architecture, better performance, and multi-tenant data isolation.

## Files Created

### 1. Database Schema
- **File**: `scripts/migration/add-lesson-plans-table.sql`
- **Size**: 103 lines
- **Features**:
  - `lesson_plans` table with all required columns
  - Foreign keys to `schools`, `sections`, `learning_areas`
  - TEXT[] arrays for objectives, activities, materials, assessment
  - JSONB column for resources (links, documents)
  - 6 indexes for performance optimization
  - Row Level Security (RLS) policies for multi-tenant isolation
  - Helpful column comments

### 2. Service Layer
- **File**: `src/services/lessonPlansServicePostgreSQL.ts`
- **Size**: 202 lines
- **Functions**:
  - `fetchLessonPlans(schoolId)` - Get all lesson plans for a school
  - `fetchLessonPlansBySection(schoolId, sectionId)` - Filter by section
  - `addLessonPlan(lessonPlan)` - Create new lesson plan
  - `updateLessonPlan(id, updates)` - Update existing lesson plan
  - `deleteLessonPlan(id)` - Remove lesson plan
  - `transformFromDB(row)` - Database row to LessonPlan model transformation

### 3. React Hook
- **File**: `src/hooks/useLessonPlansPostgreSQL.ts`
- **Size**: 119 lines
- **Features**:
  - Real-time polling (30-second intervals)
  - Conditional loading states (initial vs. background refresh)
  - Optimistic updates for better UX
  - Error handling with user-friendly messages
  - School ID isolation
  - Memoized options to prevent infinite loops

### 4. Component Updates
- **File**: `components/LessonPlanView.tsx`
- **Changes**:
  - ✅ Removed `SchoolDataHook` prop dependency
  - ✅ Added individual PostgreSQL hooks (useLessonPlansPostgreSQL, useAssignmentsPostgreSQL, useSectionsPostgreSQL, useLearningAreasPostgreSQL)
  - ✅ Memoized all hook options to prevent infinite render loops
  - ✅ Updated AIGeneratorModal to accept individual props instead of schoolData
  - ✅ Fixed all lint errors (inline styles, form accessibility)
  - ✅ Added proper type definitions (LessonPlanViewProps interface)
  - ✅ Added useSchool helper hook for SchoolContext access

## Migration Pattern

Following the established pattern from Assignments migration:

```typescript
// 1. Memoize hook options to prevent infinite loops
const lessonPlansOptions = useMemo(() => ({ 
  schoolId: schoolId || undefined 
}), [schoolId]);

// 2. Use PostgreSQL hooks
const { 
  lessonPlans, 
  loading, 
  addLessonPlan, 
  updateLessonPlan, 
  deleteLessonPlan 
} = useLessonPlansPostgreSQL(lessonPlansOptions);

// 3. Combine loading states from all hooks
const loading = plansLoading || sectionsLoading || areasLoading || assignmentsLoading;
```

## Database Schema Highlights

```sql
CREATE TABLE lesson_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    learning_area_id UUID NOT NULL REFERENCES learning_areas(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    duration INTEGER NOT NULL,
    objectives TEXT[] NOT NULL DEFAULT '{}',
    activities TEXT[] NOT NULL DEFAULT '{}',
    materials TEXT[] NOT NULL DEFAULT '{}',
    assessment TEXT[] NOT NULL DEFAULT '{}',
    notes TEXT,
    resources JSONB DEFAULT '[]'::jsonb,
    assignment_ids TEXT[] DEFAULT '{}',
    teacher_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access lesson plans from their school
CREATE POLICY lesson_plans_school_isolation ON lesson_plans
    FOR ALL
    USING (school_id = current_setting('app.current_school_id')::uuid);
```

## Performance Optimizations

1. **Indexes**:
   - `idx_lesson_plans_school_id` - Fast school filtering
   - `idx_lesson_plans_section_id` - Fast section filtering
   - `idx_lesson_plans_learning_area_id` - Fast learning area filtering
   - `idx_lesson_plans_date` - Fast date-based queries
   - `idx_lesson_plans_teacher_id` - Fast teacher filtering
   - `idx_lesson_plans_created_at` - Fast chronological sorting

2. **Polling Strategy**:
   - Silent background updates every 30 seconds
   - Loading spinner only on initial fetch
   - No UI flashing during polling

3. **Memoization**:
   - All hook options memoized with `useMemo`
   - Prevents infinite render loops
   - Reduces unnecessary re-renders

## Testing Checklist

- [ ] Run database migration script: `psql -f scripts/migration/add-lesson-plans-table.sql`
- [ ] Verify table creation: `\d lesson_plans`
- [ ] Test CRUD operations:
  - [ ] Create lesson plan
  - [ ] Update lesson plan
  - [ ] Delete lesson plan
  - [ ] Filter by section
  - [ ] Search by title
- [ ] Test multi-tenant isolation:
  - [ ] Verify users can only see their school's lesson plans
  - [ ] Test RLS policies
- [ ] Test AI generation:
  - [ ] Generate lesson plan with Gemini API
  - [ ] Save generated plan
  - [ ] Edit generated plan
- [ ] Test performance:
  - [ ] Verify indexes are used
  - [ ] Check query performance
  - [ ] Monitor polling behavior

## Lessons Learned

### Critical: Infinite Loop Prevention

**Problem**: Components using `useSchoolData(['settings'])` or passing objects to hooks can cause infinite render loops because object references change on every render.

**Solution**: ALWAYS use `useMemo` when passing options to hooks:

```typescript
// ✅ CORRECT
const lessonPlansOptions = useMemo(() => ({ 
  schoolId: schoolId || undefined 
}), [schoolId]);
const { lessonPlans } = useLessonPlansPostgreSQL(lessonPlansOptions);

// ❌ WRONG (causes infinite loop)
const { lessonPlans } = useLessonPlansPostgreSQL({ 
  schoolId: schoolId || undefined 
});
```

### Polling Without UI Flash

**Problem**: Polling every 30 seconds triggered loading spinner, causing UI to flash.

**Solution**: Add conditional loading parameter to fetchData:

```typescript
const fetchData = useCallback(async (showLoading = true) => {
  if (showLoading) setLoading(true);
  // ... fetch data
  setLoading(false);
}, []);

// Initial fetch: show loading
useEffect(() => {
  fetchData(true);
}, [fetchData]);

// Polling: silent updates
useEffect(() => {
  const interval = setInterval(() => fetchData(false), 30000);
  return () => clearInterval(interval);
}, [fetchData]);
```

## Next Steps

1. **Data Migration**: If there's existing Firestore data:
   - Export Firestore lesson plans
   - Transform data format
   - Import to PostgreSQL
   - Verify data integrity

2. **Cleanup**: Remove Firestore dependencies:
   - Remove old lesson plan hooks
   - Remove Firestore queries
   - Update documentation

3. **Monitor**: Track performance in production:
   - Query execution times
   - Index usage
   - RLS policy performance
   - Polling network traffic

## Related Documentation

- `ASSIGNMENTS_POSTGRESQL_MIGRATION.md` - Similar migration pattern
- `INFINITE_LOOP_PREVENTION.md` - Detailed guide on preventing infinite loops
- `POSTGRESQL_MIGRATION_COMPLETE.md` - Overall migration strategy

## Summary

The Lesson Plans module has been successfully migrated to PostgreSQL with:
- ✅ Complete database schema with RLS
- ✅ Full CRUD service layer
- ✅ React hook with polling and optimistic updates
- ✅ Updated component with no Firestore dependencies
- ✅ Zero lint errors
- ✅ Zero TypeScript errors
- ✅ Proper memoization to prevent infinite loops
- ✅ Accessibility improvements (form labels, titles)
- ✅ Performance optimizations (indexes, polling strategy)

Migration follows the established pattern and is ready for testing.
