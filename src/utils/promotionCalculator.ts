/**
 * Promotion Status Calculator
 * Implements DepEd Order 8, s. 2015 guidelines for promotion decisions
 * 
 * RULES:
 * - All 4 quarters (Q1-Q4) must be completed
 * - Final General Average = (Q1 + Q2 + Q3 + Q4) / 4 for each learning area
 * - Student General Average = average of all learning area final grades
 * - PROMOTED: Final avg ≥ 75 AND failed ≤ 2 learning areas
 * - CONDITIONAL: Final avg ≥ 75 BUT failed exactly 2 learning areas
 * - RETAINED: Final avg < 75 OR failed ≥ 3 learning areas
 */

import type { PromotionStatus } from '../types/promotionRecords';

export interface QuarterlyGrade {
  q1?: number | null;
  q2?: number | null;
  q3?: number | null;
  q4?: number | null;
  final_grade?: number | null;
  learning_area?: string;
}

export interface PromotionCalculationResult {
  status: PromotionStatus;
  general_average: number | null;
  quarters_complete: boolean;
  failed_learning_areas: number;
  total_learning_areas: number;
  missing_quarters: string[];
  can_finalize: boolean;
  is_conditional: boolean;
  reason: string;
}

/**
 * Check if a single grade record has all 4 quarters completed
 */
function hasAllQuarters(grade: QuarterlyGrade): boolean {
  return (
    grade.q1 !== null && grade.q1 !== undefined &&
    grade.q2 !== null && grade.q2 !== undefined &&
    grade.q3 !== null && grade.q3 !== undefined &&
    grade.q4 !== null && grade.q4 !== undefined
  );
}

/**
 * Calculate final grade for a learning area
 */
function calculateFinalGrade(grade: QuarterlyGrade): number | null {
  if (!hasAllQuarters(grade)) {
    return null;
  }
  
  const q1 = Number(grade.q1);
  const q2 = Number(grade.q2);
  const q3 = Number(grade.q3);
  const q4 = Number(grade.q4);
  
  return Math.round((q1 + q2 + q3 + q4) / 4);
}

/**
 * Calculate promotion status based on quarterly grades
 * 
 * @param grades - Array of grade records with quarterly grades
 * @returns Promotion calculation result with status and details
 */
export function calculatePromotionStatus(
  grades: QuarterlyGrade[]
): PromotionCalculationResult {
  
  // Default result
  const result: PromotionCalculationResult = {
    status: 'pending',
    general_average: null,
    quarters_complete: false,
    failed_learning_areas: 0,
    total_learning_areas: grades.length,
    missing_quarters: [],
    can_finalize: false,
    is_conditional: false,
    reason: 'No grades available'
  };

  // Check if there are any grades
  if (!grades || grades.length === 0) {
    result.reason = 'No learning areas with grades found';
    return result;
  }

  // Check if all grades have complete quarters
  const incompleteGrades = grades.filter(g => !hasAllQuarters(g));
  
  if (incompleteGrades.length > 0) {
    // Find which quarters are missing
    const missingQuarters = new Set<string>();
    incompleteGrades.forEach(g => {
      if (!g.q1 && g.q1 !== 0) missingQuarters.add('Q1');
      if (!g.q2 && g.q2 !== 0) missingQuarters.add('Q2');
      if (!g.q3 && g.q3 !== 0) missingQuarters.add('Q3');
      if (!g.q4 && g.q4 !== 0) missingQuarters.add('Q4');
    });
    
    result.missing_quarters = Array.from(missingQuarters).sort();
    result.reason = `Incomplete quarters: ${incompleteGrades.length} learning area(s) missing ${result.missing_quarters.join(', ')}`;
    return result;
  }

  // All quarters are complete
  result.quarters_complete = true;

  // Calculate final grades for each learning area
  const finalGrades: number[] = [];
  let failedCount = 0;

  grades.forEach(grade => {
    const finalGrade = calculateFinalGrade(grade);
    
    if (finalGrade !== null) {
      finalGrades.push(finalGrade);
      
      // DepEd passing grade is 75
      if (finalGrade < 75) {
        failedCount++;
      }
    }
  });

  // Calculate general average
  if (finalGrades.length > 0) {
    const sum = finalGrades.reduce((acc, grade) => acc + grade, 0);
    result.general_average = Math.round((sum / finalGrades.length) * 100) / 100; // Round to 2 decimals
  } else {
    result.reason = 'Unable to calculate final grades';
    return result;
  }

  result.failed_learning_areas = failedCount;
  result.can_finalize = true;

  // Determine promotion status based on DepEd Order 8, s. 2015
  
  // RETAINED: General average < 75 OR failed 3+ learning areas
  if (result.general_average < 75) {
    result.status = 'retained';
    result.reason = `General average (${result.general_average.toFixed(2)}) is below 75`;
  } else if (failedCount >= 3) {
    result.status = 'retained';
    result.reason = `Failed ${failedCount} learning area(s) (3 or more)`;
  }
  // CONDITIONAL: General average ≥ 75 BUT failed exactly 2 learning areas
  else if (failedCount === 2) {
    result.status = 'promoted'; // Note: DepEd uses "Conditional" as a sub-category of promoted
    result.is_conditional = true;
    result.reason = `Promoted with conditions: Failed ${failedCount} learning area(s) - requires remedial classes`;
  }
  // PROMOTED: General average ≥ 75 AND failed ≤ 1 learning areas
  else {
    result.status = 'promoted';
    if (failedCount === 1) {
      result.reason = `Promoted: General average ${result.general_average.toFixed(2)}, failed 1 learning area`;
    } else {
      result.reason = `Promoted: General average ${result.general_average.toFixed(2)}, passed all learning areas`;
    }
  }

  return result;
}

/**
 * Determine if a student can be promoted based on grade level
 * For Grade 6, 10, 12 - student graduates instead of being promoted
 */
export function determineNextGradeLevel(
  currentGradeLevel: number,
  promotionStatus: PromotionStatus
): { nextGradeLevel: number | null; actualStatus: PromotionStatus } {
  
  if (promotionStatus === 'retained') {
    // Student repeats the same grade
    return {
      nextGradeLevel: null,
      actualStatus: 'retained'
    };
  }

  if (promotionStatus === 'promoted') {
    // Check if graduating
    if (currentGradeLevel === 6 || currentGradeLevel === 10 || currentGradeLevel === 12) {
      return {
        nextGradeLevel: null,
        actualStatus: 'graduated'
      };
    }
    
    // Normal promotion
    return {
      nextGradeLevel: currentGradeLevel + 1,
      actualStatus: 'promoted'
    };
  }

  // Pending or other status
  return {
    nextGradeLevel: null,
    actualStatus: promotionStatus
  };
}
