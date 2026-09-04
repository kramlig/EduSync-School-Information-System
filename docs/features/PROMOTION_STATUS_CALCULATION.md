# Automatic Promotion Status Calculation

**Implementation Date:** December 4, 2025  
**DepEd Compliance:** Based on DepEd Order 8, s. 2015

## Overview

The system now automatically calculates student promotion status based on their quarterly grades (Q1-Q4). This ensures accurate and consistent promotion decisions following DepEd guidelines.

## Requirements

### All Quarters Must Be Complete

Promotion status can **only** be finalized when:
- All 4 quarters (Q1, Q2, Q3, Q4) have grades entered
- For **every** learning area the student is enrolled in

If any quarter is missing, the status remains **PENDING**.

### Calculation Logic

#### Step 1: Calculate Final Grade per Learning Area
```
Final Grade = (Q1 + Q2 + Q3 + Q4) / 4
```
Rounded to whole number.

#### Step 2: Calculate General Average
```
General Average = Sum of all Final Grades / Number of Learning Areas
```
Rounded to 2 decimal places.

#### Step 3: Count Failed Learning Areas
A learning area is considered **FAILED** if Final Grade < 75.

#### Step 4: Determine Promotion Status

| General Average | Failed Learning Areas | Status | Next Action |
|----------------|----------------------|---------|-------------|
| ≥ 75 | 0-1 | **PROMOTED** | Advance to next grade |
| ≥ 75 | Exactly 2 | **PROMOTED (CONDITIONAL)** | Advance but requires remedial classes |
| ≥ 75 | 3 or more | **RETAINED** | Repeat current grade |
| < 75 | Any number | **RETAINED** | Repeat current grade |

### Special Cases

#### Graduation (End of Cycle)
- **Grade 6:** Student status changes to **GRADUATED** (Elementary completion)
- **Grade 10:** Student status changes to **GRADUATED** (Junior High completion)  
- **Grade 12:** Student status changes to **GRADUATED** (Senior High completion)

#### Conditional Promotion
Students who are conditionally promoted:
- Must take remedial classes in the 2 failed learning areas
- Can advance to the next grade level
- Remarks field will show: `"CONDITIONAL: Requires remedial classes in failed learning areas"`
- Will appear in the "*Conditional" row of SF5 Summary Table

## Implementation Files

### Core Logic
- **`src/utils/promotionCalculator.ts`**
  - `calculatePromotionStatus()` - Main calculation function
  - `determineNextGradeLevel()` - Handles graduation logic
  - Returns detailed calculation results with reasons

### Service Integration
- **`src/services/promotionRecordsService.ts`**
  - `generatePromotionRecords()` - Auto-calculates during bulk generation
  - `recalculatePromotionStatus()` - Recalculate single student
  - `recalculateAllPromotionStatuses()` - Bulk recalculation for entire school year

### PDF Generation
- **`src/utils/pdf/sf5Generator.ts`**
  - Summary Table displays conditional counts separately
  - Learning Progress table shows achievement distribution

## Usage Examples

### Example 1: Generate Promotion Records
```typescript
const result = await generatePromotionRecords({
  school_id: 'school-123',
  school_year: '2024-2025',
  grading_period: 'final',
  grade_level: 1,
  section_id: 'section-456'
});

console.log(`Created: ${result.records_created}`);
console.log(`Updated: ${result.records_updated}`);
console.log(`Errors: ${result.errors.length}`);
```

### Example 2: Recalculate Single Student
```typescript
const result = await recalculatePromotionStatus('promotion-record-id');

if (result.success) {
  console.log('Status:', result.calculation.final_status);
  console.log('General Average:', result.calculation.general_average);
  console.log('Failed Areas:', result.calculation.failed_learning_areas);
} else {
  console.log('Error:', result.error);
  // Might be "Incomplete quarters: 2 learning area(s) missing Q3, Q4"
}
```

### Example 3: End-of-Year Bulk Recalculation
```typescript
const result = await recalculateAllPromotionStatuses(
  'school-123',
  '2024-2025',
  'final'
);

console.log(`Updated: ${result.updated} students`);
console.log(`Still Pending: ${result.pending} students (incomplete quarters)`);
console.log(`Errors: ${result.errors.length}`);
```

## Sample Scenarios

### Scenario 1: Promoted (Excellent Performance)
```
Student: Juan Dela Cruz
Learning Areas:
  - Filipino:    Q1=88, Q2=90, Q3=92, Q4=91 → Final=90
  - English:     Q1=85, Q2=87, Q3=89, Q4=88 → Final=87
  - Math:        Q1=91, Q2=93, Q3=90, Q4=92 → Final=92
  - Science:     Q1=86, Q2=88, Q3=87, Q4=89 → Final=88
  
General Average: (90+87+92+88)/4 = 89.25
Failed Areas: 0
Status: PROMOTED
Next Grade: 2
```

### Scenario 2: Conditional Promotion
```
Student: Maria Santos
Learning Areas:
  - Filipino:    Q1=80, Q2=82, Q3=81, Q4=83 → Final=82
  - English:     Q1=70, Q2=72, Q3=73, Q4=71 → Final=72 ❌
  - Math:        Q1=85, Q2=87, Q3=86, Q4=88 → Final=87
  - Science:     Q1=73, Q2=74, Q3=72, Q4=73 → Final=73 ❌
  
General Average: (82+72+87+73)/4 = 78.50
Failed Areas: 2 (English, Science)
Status: PROMOTED (CONDITIONAL)
Remarks: "CONDITIONAL: Requires remedial classes in failed learning areas"
Next Grade: 2
```

### Scenario 3: Retained (Multiple Failures)
```
Student: Pedro Garcia
Learning Areas:
  - Filipino:    Q1=70, Q2=72, Q3=71, Q4=73 → Final=72 ❌
  - English:     Q1=68, Q2=70, Q3=69, Q4=71 → Final=70 ❌
  - Math:        Q1=65, Q2=67, Q3=66, Q4=68 → Final=67 ❌
  - Science:     Q1=80, Q2=82, Q3=81, Q4=83 → Final=82
  
General Average: (72+70+67+82)/4 = 72.75
Failed Areas: 3 (Filipino, English, Math)
Status: RETAINED (≥3 failed areas)
Next Grade: null (repeats Grade 1)
```

### Scenario 4: Retained (Low General Average)
```
Student: Ana Cruz
Learning Areas:
  - Filipino:    Q1=70, Q2=72, Q3=71, Q4=73 → Final=72 ❌
  - English:     Q1=73, Q2=74, Q3=72, Q4=73 → Final=73 ❌
  - Math:        Q1=75, Q2=76, Q3=74, Q4=75 → Final=75
  - Science:     Q1=76, Q2=77, Q3=75, Q4=76 → Final=76
  
General Average: (72+73+75+76)/4 = 74.00
Failed Areas: 2
Status: RETAINED (General average < 75)
Next Grade: null (repeats Grade 1)
```

### Scenario 5: Pending (Incomplete Quarters)
```
Student: Jose Reyes
Learning Areas:
  - Filipino:    Q1=85, Q2=87, Q3=-, Q4=- → Cannot calculate
  - English:     Q1=80, Q2=82, Q3=-, Q4=- → Cannot calculate
  
Status: PENDING
Reason: "Incomplete quarters: 2 learning area(s) missing Q3, Q4"
```

## SF5 PDF Report

The SF5 PDF Summary Table now displays:

```
┌──────────────┬──────┬────────┬───────┐
│ STATUS       │ MALE │ FEMALE │ TOTAL │
├──────────────┼──────┼────────┼───────┤
│ PROMOTED     │  25  │   28   │   53  │
├──────────────┼──────┼────────┼───────┤
│ *Conditional │   3  │    2   │    5  │ ← Now shows actual counts
├──────────────┼──────┼────────┼───────┤
│ RETAINED     │   2  │    1   │    3  │
└──────────────┴──────┴────────┴───────┘
```

## Database Impact

### Updated Fields
- `general_average` - Auto-calculated from quarterly grades
- `promotion_status` - Auto-determined (promoted/retained/graduated/pending)
- `next_grade_level` - Auto-set based on promotion status
- `remarks` - Auto-set for conditional promotions

### Manual Override
Teachers/admins can still manually update promotion status if needed for special cases (e.g., transferring students, medical cases).

## Best Practices

1. **Enter Quarterly Grades Consistently**
   - Complete all 4 quarters before finalizing promotion
   - Ensure all learning areas have grades

2. **Run Recalculation After Grade Entry**
   - After entering Q4 grades, run bulk recalculation
   - Verify pending students have incomplete quarters

3. **Review Conditional Promotions**
   - Check students with conditional status
   - Arrange remedial classes before next school year

4. **Generate SF5 After Finalization**
   - Only generate SF5 when grading_period = 'final'
   - All students should have status other than 'pending'

## Troubleshooting

### "Status is still PENDING"
**Cause:** Not all quarters are complete.  
**Solution:** Check which quarters are missing, enter remaining grades.

### "Calculation seems wrong"
**Verify:**
1. All 4 quarters entered correctly
2. Learning areas are properly configured
3. Grades are within valid range (0-100)

### "Conditional not showing in SF5"
**Cause:** Remarks field doesn't contain "CONDITIONAL"  
**Solution:** Run `recalculateAllPromotionStatuses()` to update all records.

## Related Documentation
- DepEd Order 8, s. 2015 (Policy Guidelines on Classroom Assessment)
- `INFINITE_LOOP_PREVENTION.md` - Feature flags best practices
- `MIGRATION_TO_POSTGRESQL.md` - Database schema details
