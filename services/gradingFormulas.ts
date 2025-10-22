/**
 * Grading Formulas Service - DepEd K-12 Grading System
 * 
 * Implements the official DepEd Order No. 8, s. 2015 grading system:
 * - Raw score to percentage conversion
 * - Percentage to transmuted grade (60-100 scale)
 * - Quarterly grade computation
 * - Final grade computation
 * - Descriptors (Outstanding, Very Satisfactory, etc.)
 * 
 * References:
 * - DepEd Order No. 8, s. 2015 (Policy Guidelines on Classroom Assessment)
 * - DepEd Order No. 31, s. 2020 (Interim Guidelines for Assessment and Grading)
 */

/**
 * DepEd Grading Scale Descriptors
 */
export const GRADE_DESCRIPTORS = {
  OUTSTANDING: { min: 90, max: 100, label: 'Outstanding' },
  VERY_SATISFACTORY: { min: 85, max: 89, label: 'Very Satisfactory' },
  SATISFACTORY: { min: 80, max: 84, label: 'Satisfactory' },
  FAIRLY_SATISFACTORY: { min: 75, max: 79, label: 'Fairly Satisfactory' },
  DID_NOT_MEET: { min: 60, max: 74, label: 'Did Not Meet Expectations' },
  FAILED: { min: 0, max: 59, label: 'Failed' }
} as const;

/**
 * Passing grade threshold
 */
export const PASSING_GRADE = 75;

/**
 * Minimum transmuted grade
 */
export const MIN_GRADE = 60;

/**
 * Maximum transmuted grade
 */
export const MAX_GRADE = 100;

/**
 * Grade level groups for different transmutation tables
 */
export enum GradeLevelGroup {
  KINDER_TO_GRADE_3 = 'K-3',
  GRADES_4_TO_10 = '4-10',
  GRADES_11_TO_12 = '11-12'
}

/**
 * Get grade level group for transmutation
 */
export function getGradeLevelGroup(gradeLevel: number): GradeLevelGroup {
  if (gradeLevel >= 0 && gradeLevel <= 3) {
    return GradeLevelGroup.KINDER_TO_GRADE_3;
  } else if (gradeLevel >= 4 && gradeLevel <= 10) {
    return GradeLevelGroup.GRADES_4_TO_10;
  } else {
    return GradeLevelGroup.GRADES_11_TO_12;
  }
}

/**
 * Convert raw score to percentage
 * 
 * @param rawScore - The raw score obtained
 * @param maxScore - The maximum possible score
 * @returns Percentage (0-100)
 */
export function rawScoreToPercentage(rawScore: number, maxScore: number): number {
  if (maxScore === 0) return 0;
  if (rawScore < 0) return 0;
  if (rawScore > maxScore) return 100;
  
  return (rawScore / maxScore) * 100;
}

/**
 * Transmutation Table for Grades 4-10
 * Based on DepEd Order No. 8, s. 2015
 * 
 * Converts percentage (0-100%) to transmuted grade (60-100)
 */
const TRANSMUTATION_TABLE_4_10: { [key: number]: number } = {
  100: 100, 99: 99, 98: 98, 97: 97, 96: 96,
  95: 95, 94: 94, 93: 93, 92: 92, 91: 91,
  90: 90, 89: 89, 88: 88, 87: 87, 86: 86,
  85: 85, 84: 84, 83: 83, 82: 82, 81: 81,
  80: 80, 79: 79, 78: 78, 77: 77, 76: 76,
  75: 75, 74: 74, 73: 73, 72: 72, 71: 71,
  70: 70, 69: 69, 68: 68, 67: 67, 66: 66,
  65: 65, 64: 64, 63: 63, 62: 62, 61: 61,
  60: 60,
  // Below 60% = 60 (failing but minimum grade)
  59: 60, 58: 60, 57: 60, 56: 60, 55: 60,
  54: 60, 53: 60, 52: 60, 51: 60, 50: 60,
  49: 60, 48: 60, 47: 60, 46: 60, 45: 60,
  44: 60, 43: 60, 42: 60, 41: 60, 40: 60,
  39: 60, 38: 60, 37: 60, 36: 60, 35: 60,
  34: 60, 33: 60, 32: 60, 31: 60, 30: 60,
  29: 60, 28: 60, 27: 60, 26: 60, 25: 60,
  24: 60, 23: 60, 22: 60, 21: 60, 20: 60,
  19: 60, 18: 60, 17: 60, 16: 60, 15: 60,
  14: 60, 13: 60, 12: 60, 11: 60, 10: 60,
  9: 60, 8: 60, 7: 60, 6: 60, 5: 60,
  4: 60, 3: 60, 2: 60, 1: 60, 0: 60
};

/**
 * Transmutation Table for Grades 11-12 (Senior High School)
 * Based on DepEd Order No. 8, s. 2015
 * 
 * Uses a steeper curve for SHS
 */
const TRANSMUTATION_TABLE_11_12: { [key: number]: number } = {
  100: 100, 99: 99, 98: 98, 97: 97, 96: 96,
  95: 95, 94: 94, 93: 93, 92: 92, 91: 91,
  90: 90, 89: 89, 88: 88, 87: 87, 86: 86,
  85: 85, 84: 84, 83: 83, 82: 82, 81: 81,
  80: 80, 79: 79, 78: 78, 77: 77, 76: 76,
  75: 75, 74: 74, 73: 73, 72: 72, 71: 71,
  70: 70, 69: 69, 68: 68, 67: 67, 66: 66,
  65: 65, 64: 64, 63: 63, 62: 62, 61: 61,
  60: 60,
  // Below 60% = 60 (failing but minimum grade)
  59: 60, 58: 60, 57: 60, 56: 60, 55: 60,
  54: 60, 53: 60, 52: 60, 51: 60, 50: 60,
  49: 60, 48: 60, 47: 60, 46: 60, 45: 60,
  44: 60, 43: 60, 42: 60, 41: 60, 40: 60,
  39: 60, 38: 60, 37: 60, 36: 60, 35: 60,
  34: 60, 33: 60, 32: 60, 31: 60, 30: 60,
  29: 60, 28: 60, 27: 60, 26: 60, 25: 60,
  24: 60, 23: 60, 22: 60, 21: 60, 20: 60,
  19: 60, 18: 60, 17: 60, 16: 60, 15: 60,
  14: 60, 13: 60, 12: 60, 11: 60, 10: 60,
  9: 60, 8: 60, 7: 60, 6: 60, 5: 60,
  4: 60, 3: 60, 2: 60, 1: 60, 0: 60
};

/**
 * Convert percentage to transmuted grade
 * 
 * @param percentage - The percentage score (0-100)
 * @param gradeLevel - The student's grade level (0-12)
 * @returns Transmuted grade (60-100)
 */
export function percentageToTransmutedGrade(
  percentage: number,
  gradeLevel: number
): number {
  // Round percentage to nearest integer
  const roundedPercentage = Math.round(percentage);
  
  // Clamp to valid range
  const clampedPercentage = Math.max(0, Math.min(100, roundedPercentage));
  
  // Select appropriate transmutation table
  const gradeLevelGroup = getGradeLevelGroup(gradeLevel);
  
  // K-3 uses direct percentage (no transmutation for early grades)
  if (gradeLevelGroup === GradeLevelGroup.KINDER_TO_GRADE_3) {
    return clampedPercentage;
  }
  
  // Grades 4-10
  if (gradeLevelGroup === GradeLevelGroup.GRADES_4_TO_10) {
    return TRANSMUTATION_TABLE_4_10[clampedPercentage] || MIN_GRADE;
  }
  
  // Grades 11-12
  return TRANSMUTATION_TABLE_11_12[clampedPercentage] || MIN_GRADE;
}

/**
 * Convert raw score directly to transmuted grade
 * 
 * @param rawScore - The raw score obtained
 * @param maxScore - The maximum possible score
 * @param gradeLevel - The student's grade level (0-12)
 * @returns Transmuted grade (60-100)
 */
export function rawScoreToTransmutedGrade(
  rawScore: number,
  maxScore: number,
  gradeLevel: number
): number {
  const percentage = rawScoreToPercentage(rawScore, maxScore);
  return percentageToTransmutedGrade(percentage, gradeLevel);
}

/**
 * Compute quarterly grade from written work, performance tasks, and quarterly assessment
 * 
 * DepEd weightings:
 * - Written Work: 30%
 * - Performance Tasks: 50%
 * - Quarterly Assessment: 20%
 * 
 * @param writtenWork - Written work grade (already transmuted, 60-100)
 * @param performanceTasks - Performance tasks grade (already transmuted, 60-100)
 * @param quarterlyAssessment - Quarterly assessment grade (already transmuted, 60-100)
 * @returns Quarterly grade (60-100)
 */
export function computeQuarterlyGrade(
  writtenWork: number,
  performanceTasks: number,
  quarterlyAssessment: number
): number {
  const WW_WEIGHT = 0.30;
  const PT_WEIGHT = 0.50;
  const QA_WEIGHT = 0.20;
  
  const quarterlyGrade = 
    (writtenWork * WW_WEIGHT) +
    (performanceTasks * PT_WEIGHT) +
    (quarterlyAssessment * QA_WEIGHT);
  
  // Round to 2 decimal places
  return Math.round(quarterlyGrade * 100) / 100;
}

/**
 * Compute final grade from quarterly grades
 * 
 * @param q1 - First quarter grade
 * @param q2 - Second quarter grade
 * @param q3 - Third quarter grade
 * @param q4 - Fourth quarter grade
 * @returns Final grade (60-100), rounded to whole number
 */
export function computeFinalGrade(
  q1: number,
  q2: number,
  q3: number,
  q4: number
): number {
  const finalGrade = (q1 + q2 + q3 + q4) / 4;
  
  // DepEd requires rounding to nearest whole number for final grades
  return Math.round(finalGrade);
}

/**
 * Get grade descriptor based on grade value
 * 
 * @param grade - The grade (60-100)
 * @returns Descriptor object with label, min, and max
 */
export function getGradeDescriptor(grade: number): {
  label: string;
  min: number;
  max: number;
} {
  if (grade >= 90) return GRADE_DESCRIPTORS.OUTSTANDING;
  if (grade >= 85) return GRADE_DESCRIPTORS.VERY_SATISFACTORY;
  if (grade >= 80) return GRADE_DESCRIPTORS.SATISFACTORY;
  if (grade >= 75) return GRADE_DESCRIPTORS.FAIRLY_SATISFACTORY;
  if (grade >= 60) return GRADE_DESCRIPTORS.DID_NOT_MEET;
  return GRADE_DESCRIPTORS.FAILED;
}

/**
 * Check if a grade is passing
 * 
 * @param grade - The grade to check (60-100)
 * @returns True if grade is passing (>= 75)
 */
export function isPassing(grade: number): boolean {
  return grade >= PASSING_GRADE;
}

/**
 * Compute general average from subject grades
 * 
 * @param subjectGrades - Array of subject final grades
 * @returns General average (60-100), rounded to 2 decimal places
 */
export function computeGeneralAverage(subjectGrades: number[]): number {
  if (subjectGrades.length === 0) return MIN_GRADE;
  
  const sum = subjectGrades.reduce((acc, grade) => acc + grade, 0);
  const average = sum / subjectGrades.length;
  
  return Math.round(average * 100) / 100;
}

/**
 * Determine promotion status based on general average
 * 
 * @param generalAverage - The general average (60-100)
 * @returns 'PROMOTED' | 'RETAINED' | 'CONDITIONAL'
 */
export function determinePromotionStatus(
  generalAverage: number
): 'PROMOTED' | 'RETAINED' | 'CONDITIONAL' {
  if (generalAverage >= PASSING_GRADE) {
    return 'PROMOTED';
  } else if (generalAverage >= 70) {
    return 'CONDITIONAL'; // Conditional promotion (summer class)
  } else {
    return 'RETAINED';
  }
}

/**
 * Compute weighted score for a component
 * 
 * @param scores - Array of scores for the component
 * @param highestPossibleScore - Highest possible score for each item
 * @param weight - Weight of the component (0-1)
 * @returns Weighted score
 */
export function computeWeightedScore(
  scores: number[],
  highestPossibleScore: number,
  weight: number
): number {
  if (scores.length === 0) return 0;
  
  const totalScore = scores.reduce((acc, score) => acc + score, 0);
  const maxPossible = highestPossibleScore * scores.length;
  
  const percentage = rawScoreToPercentage(totalScore, maxPossible);
  
  return percentage * weight;
}

/**
 * Format grade for display
 * 
 * @param grade - The grade to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted grade string
 */
export function formatGrade(grade: number, decimals: number = 0): string {
  return grade.toFixed(decimals);
}

/**
 * Validate grade value
 * 
 * @param grade - The grade to validate
 * @returns True if grade is valid (60-100)
 */
export function isValidGrade(grade: number): boolean {
  return grade >= MIN_GRADE && grade <= MAX_GRADE;
}

/**
 * Clamp grade to valid range
 * 
 * @param grade - The grade to clamp
 * @returns Clamped grade (60-100)
 */
export function clampGrade(grade: number): number {
  return Math.max(MIN_GRADE, Math.min(MAX_GRADE, grade));
}

/**
 * Example usage and testing function
 */
export function exampleUsage() {
  console.log('=== DepEd K-12 Grading System Examples ===\n');
  
  // Example 1: Raw score to percentage
  console.log('Example 1: Raw Score to Percentage');
  const rawScore = 42;
  const maxScore = 50;
  const percentage = rawScoreToPercentage(rawScore, maxScore);
  console.log(`Score: ${rawScore}/${maxScore} = ${percentage}%\n`);
  
  // Example 2: Percentage to transmuted grade (Grade 7)
  console.log('Example 2: Transmutation (Grade 7)');
  const transmuted = percentageToTransmutedGrade(percentage, 7);
  console.log(`${percentage}% → ${transmuted} (transmuted)\n`);
  
  // Example 3: Quarterly grade computation
  console.log('Example 3: Quarterly Grade');
  const ww = 85;
  const pt = 90;
  const qa = 88;
  const quarterlyGrade = computeQuarterlyGrade(ww, pt, qa);
  console.log(`WW: ${ww} (30%), PT: ${pt} (50%), QA: ${qa} (20%)`);
  console.log(`Quarterly Grade: ${quarterlyGrade}\n`);
  
  // Example 4: Final grade computation
  console.log('Example 4: Final Grade');
  const q1 = 85, q2 = 88, q3 = 87, q4 = 90;
  const finalGrade = computeFinalGrade(q1, q2, q3, q4);
  console.log(`Q1: ${q1}, Q2: ${q2}, Q3: ${q3}, Q4: ${q4}`);
  console.log(`Final Grade: ${finalGrade}`);
  
  // Example 5: Grade descriptor
  const descriptor = getGradeDescriptor(finalGrade);
  console.log(`Descriptor: ${descriptor.label}\n`);
  
  // Example 6: General average
  console.log('Example 5: General Average');
  const subjects = [88, 90, 85, 92, 87, 89, 91];
  const genAve = computeGeneralAverage(subjects);
  console.log(`Subjects: ${subjects.join(', ')}`);
  console.log(`General Average: ${genAve}`);
  console.log(`Status: ${determinePromotionStatus(genAve)}\n`);
}
