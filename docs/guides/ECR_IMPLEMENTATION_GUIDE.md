# Electronic Class Record (ECR) Implementation

## Overview

The Electronic Class Record (ECR) is a comprehensive grading system that implements the DepEd K-12 Basic Education grading guidelines (DepEd Order No. 8, s. 2015). It provides teachers with a spreadsheet-like interface for recording student scores on Written Works (WW), Performance Tasks (PT), and Quarterly Assessments (QA), with automatic grade computation using the official DepEd transmutation formula.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [API Reference](#api-reference)
4. [Component Reference](#component-reference)
5. [Grading Formula](#grading-formula)
6. [Usage Guide](#usage-guide)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## System Architecture

### Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/20241210_create_ecr_tables.sql` | Database schema with tables, functions, triggers, and RLS policies |
| `src/types/ecr.types.ts` | TypeScript type definitions for all ECR entities |
| `src/services/ecrService.ts` | Service layer for database operations |
| `src/hooks/useECR.ts` | React hook for state management and real-time updates |
| `components/ClassRecordView.tsx` | Main UI component with spreadsheet interface |

### Data Flow

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  ClassRecordView│────▶│    useECR    │────▶│   ecrService    │
│   (Component)   │     │    (Hook)    │     │   (Service)     │
└─────────────────┘     └──────────────┘     └────────┬────────┘
                                                       │
                                                       ▼
                        ┌──────────────────────────────────────┐
                        │           Supabase/PostgreSQL         │
                        │                                        │
                        │  ┌──────────────┐  ┌─────────────────┐│
                        │  │ecr_activities│  │   ecr_scores    ││
                        │  └──────────────┘  └─────────────────┘│
                        │  ┌──────────────┐  ┌─────────────────┐│
                        │  │  ecr_weights │  │ecr_component_   ││
                        │  │              │  │    grades       ││
                        │  └──────────────┘  └─────────────────┘│
                        └──────────────────────────────────────┘
```

---

## Database Schema

### Tables

#### 1. `ecr_weights`
Stores component weight configurations per school/subject/grade level.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `school_id` | UUID | Reference to schools table |
| `learning_area_id` | UUID | Optional - specific subject override |
| `grade_level_min` | INTEGER | Optional - minimum grade level |
| `grade_level_max` | INTEGER | Optional - maximum grade level |
| `ww_weight` | INTEGER | Written Work weight (default: 30) |
| `pt_weight` | INTEGER | Performance Task weight (default: 50) |
| `qa_weight` | INTEGER | Quarterly Assessment weight (default: 20) |

#### 2. `ecr_activities`
Stores individual activities/assessments.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `school_id` | UUID | Reference to schools table |
| `teacher_id` | UUID | Teacher who created the activity |
| `section_id` | UUID | Reference to sections table |
| `learning_area_id` | UUID | Reference to learning_areas table |
| `school_year` | VARCHAR(9) | Format: "2024-2025" |
| `quarter` | SMALLINT | 1, 2, 3, or 4 |
| `activity_type` | VARCHAR(2) | 'WW', 'PT', or 'QA' |
| `activity_number` | INTEGER | Sequential number (e.g., WW 1, WW 2) |
| `activity_name` | VARCHAR(255) | Optional custom name |
| `max_score` | NUMERIC(6,2) | Maximum possible score |
| `is_published` | BOOLEAN | Whether students can see scores |
| `is_locked` | BOOLEAN | Prevent further edits |

#### 3. `ecr_scores`
Stores individual student scores.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `activity_id` | UUID | Reference to ecr_activities |
| `student_id` | UUID | Reference to students table |
| `raw_score` | NUMERIC(6,2) | Actual score achieved |
| `status` | VARCHAR(20) | 'pending', 'graded', 'absent', 'excused', 'late' |
| `remarks` | TEXT | Optional notes |
| `graded_by` | UUID | Teacher who entered the grade |
| `graded_at` | TIMESTAMPTZ | When the grade was entered |

#### 4. `ecr_component_grades`
Caches computed component grades for performance.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `student_id` | UUID | Reference to students table |
| `section_id` | UUID | Reference to sections table |
| `learning_area_id` | UUID | Reference to learning_areas table |
| `school_year` | VARCHAR(9) | Format: "2024-2025" |
| `quarter` | SMALLINT | 1, 2, 3, or 4 |
| `ww_total_score` | NUMERIC(10,2) | Sum of WW scores |
| `ww_max_score` | NUMERIC(10,2) | Sum of WW max scores |
| `ww_percentage` | NUMERIC(5,2) | Percentage score |
| `ww_transmuted` | NUMERIC(5,2) | Transmuted grade (60-100) |
| `ww_weighted` | NUMERIC(5,2) | After applying weight |
| `pt_*` | ... | Same fields for Performance Task |
| `qa_*` | ... | Same fields for Quarterly Assessment |
| `quarterly_grade` | NUMERIC(5,2) | Final quarterly grade |

### Key Functions

#### `get_ecr_weights(school_id, learning_area_id, grade_level)`
Returns component weights with priority:
1. Subject + grade specific weights
2. Subject-only weights
3. Grade-only weights
4. School defaults
5. DepEd defaults (30-50-20)

#### `transmute_grade(percentage)`
Converts percentage score to transmuted grade using DepEd formula.

#### `compute_ecr_grades(student_id, section_id, learning_area_id, school_year, quarter)`
Computes all component grades and quarterly grade, caching to `ecr_component_grades`.

#### `sync_ecr_to_grades(student_id, learning_area_id, school_year)`
Updates the main `grades` table with ECR quarterly grades.

---

## API Reference

### ecrService.ts

```typescript
// Weight Management
getECRWeights(schoolId, learningAreaId?, gradeLevel?)
saveECRWeights(schoolId, weights)

// Activity CRUD
getActivities(sectionId, learningAreaId, schoolYear, quarter)
createActivity(schoolId, teacherId, request)
updateActivity(activityId, updates)
deleteActivity(activityId) // Soft delete

// Score Management
getScoresForActivity(activityId)
getScoresForStudent(studentId, sectionId, learningAreaId, schoolYear, quarter)
saveScore(activityId, studentId, rawScore, gradedBy, status?, remarks?)
saveScoresBulk(activityId, scores[], gradedBy)

// Grade Computation
computeStudentGrades(studentId, sectionId, learningAreaId, schoolYear, quarter)
getComponentGrades(studentId, learningAreaId, schoolYear, quarter)

// Complete Class Record
getClassRecord(sectionId, learningAreaId, schoolYear, quarter)
```

### useECR Hook

```typescript
const {
  // Data
  classRecord,     // ECRClassRecord | null
  loading,         // boolean
  error,           // string | null
  
  // Activity operations
  createActivity,  // (request) => Promise<ECRActivity | null>
  updateActivity,  // (activityId, updates) => Promise<boolean>
  deleteActivity,  // (activityId) => Promise<boolean>
  
  // Score operations
  saveScore,       // (activityId, studentId, score, remarks?) => Promise<boolean>
  saveScoresBulk,  // (activityId, scores[]) => Promise<boolean>
  
  // Grade operations
  recomputeGrades,     // (studentId) => Promise<boolean>
  recomputeAllGrades,  // () => Promise<boolean>
  
  // Refresh
  refresh
} = useECR({
  sectionId,
  learningAreaId,
  schoolYear,
  quarter,
  teacherId,
  schoolId
});
```

---

## Component Reference

### ClassRecordView

Main component for the ECR interface.

**Props:**
```typescript
interface ClassRecordViewProps {
  sectionId: string;        // Section ID
  learningAreaId: string;   // Subject ID
  schoolYear: string;       // e.g., "2024-2025"
  teacherId: string;        // Current teacher's ID
  schoolId: string;         // School ID
}
```

**Route:**
```
/grades/class-record/:sectionId/:learningAreaId
```

**Features:**
- Quarter selector (Q1-Q4 tabs)
- Spreadsheet-style score entry
- Click-to-edit cells
- Activity management (add/edit/delete)
- Real-time grade computation
- Class statistics (average, pass rate, etc.)
- Component weights display

---

## Grading Formula

### DepEd Order No. 8, s. 2015

The ECR implements the official DepEd K-12 grading system:

#### Component Weights (Default)

| Component | Weight |
|-----------|--------|
| Written Work (WW) | 30% |
| Performance Task (PT) | 50% |
| Quarterly Assessment (QA) | 20% |

> **Note:** Weights can be customized per subject. For example, MAPEH uses 20-60-20.

#### Calculation Steps

1. **Percentage Score (PS)** for each component:
   ```
   PS = (Total Score / Max Score) × 100
   ```

2. **Transmuted Grade** using DepEd lookup table:
   
   | Percentage | Transmuted |
   |------------|------------|
   | 100.00 | 100 |
   | 98.40 - 99.99 | 99 |
   | 96.80 - 98.39 | 98 |
   | ... | ... |
   | 64.00 - 67.99 | 76 |
   | 60.00 - 63.99 | 75 |
   | 56.00 - 59.99 | 74 |
   | ... | ... |
   | 0 - 3.99 | 60 |

3. **Weighted Score (WS)**:
   ```
   WS = Transmuted Grade × (Weight / 100)
   ```

4. **Quarterly Grade**:
   ```
   Quarterly Grade = WW_WS + PT_WS + QA_WS
   ```
   (Rounded to whole number)

#### Grade Descriptors

| Grade Range | Descriptor |
|-------------|------------|
| 90 - 100 | Outstanding |
| 85 - 89 | Very Satisfactory |
| 80 - 84 | Satisfactory |
| 75 - 79 | Fairly Satisfactory |
| Below 75 | Did Not Meet Expectations |

---

## Usage Guide

### Accessing the ECR

1. Navigate to **Grade Entry** from the sidebar
2. Select a section and subject
3. Click on **"Open Class Record"** or navigate to:
   ```
   /grades/class-record/{sectionId}/{learningAreaId}
   ```

### Adding Activities

1. Click the **+** button in the component section header (WW, PT, or QA)
2. Enter:
   - Activity number (auto-suggested)
   - Activity name (optional)
   - Maximum score
   - Description (optional)
3. Click **Add Activity**

### Entering Scores

1. Click on any score cell
2. Enter the student's score
3. Press **Enter** or click outside to save
4. Grades are automatically computed

### Bulk Score Entry

For entering multiple scores at once:
1. Edit the activity
2. Use the bulk entry modal (coming soon)
3. Paste or enter scores for all students

### Viewing Grades

- **PS**: Percentage Score for the component
- **WS**: Weighted Score (transmuted × weight)
- **Quarterly Grade**: Final grade for the quarter

---

## Deployment

### Database Migration

Run the migration in Supabase:

```bash
# Using Supabase CLI
supabase migration up

# Or manually in Supabase SQL Editor
# Copy and run: supabase/migrations/20241210_create_ecr_tables.sql
```

### Row Level Security

The migration includes RLS policies that:
- Allow teachers to manage activities/scores for their sections
- Allow students to view their own scores (when published)
- Restrict weight management to school admins

### Performance Considerations

- Component grades are cached in `ecr_component_grades`
- Use `compute_ecr_grades()` to refresh cached values
- Real-time subscriptions are set up via Supabase channels
- Indexes are created on frequently queried columns

---

## Troubleshooting

### Common Issues

#### "No activities found"
- Ensure you've selected the correct quarter
- Activities are section and subject specific
- Check if activities were soft-deleted

#### "Grades not updating"
- Click "Recompute All Grades" to force recalculation
- Check browser console for API errors
- Verify RLS policies allow the operation

#### "Score not saving"
- Verify you have permission (must be section teacher)
- Check that activity is not locked
- Ensure score is within valid range (0 to max_score)

#### "Wrong weights applied"
- Check `ecr_weights` table for school-specific overrides
- Default weights are 30-50-20 per DepEd Order

### Debug Mode

Enable console logging:
```typescript
// In ecrService.ts
const DEBUG = true;
```

### Support

For issues related to:
- **Grade computation**: Check `gradingFormulas.ts` for transmutation logic
- **Database**: Verify migration ran successfully
- **UI bugs**: Check component props and state in React DevTools

---

## Future Enhancements

1. **Bulk import/export** - Import scores from Excel/CSV
2. **Grade history** - Track changes with audit log
3. **Student view** - Let students see their published scores
4. **Mobile optimization** - Responsive score entry on tablets
5. **Offline support** - Queue score entries when offline
6. **Analytics** - Component-level performance analysis
7. **Integration** - Auto-sync with Form 137/138 generation

---

## References

- [DepEd Order No. 8, s. 2015](https://www.deped.gov.ph/2015/04/01/do-8-s-2015-policy-guidelines-on-classroom-assessment-for-the-k-to-12-basic-education-program/)
- [K-12 Assessment Guidelines](https://www.deped.gov.ph/k-to-12/assessment/)
- [Supabase Documentation](https://supabase.com/docs)
