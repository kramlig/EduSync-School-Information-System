/**
 * Grade Level Utilities
 * 
 * Constants and helper functions for working with grade levels
 */

export const GRADE_LEVELS = [
  { value: 'grade_1', label: 'Grade 1' },
  { value: 'grade_2', label: 'Grade 2' },
  { value: 'grade_3', label: 'Grade 3' },
  { value: 'grade_4', label: 'Grade 4' },
  { value: 'grade_5', label: 'Grade 5' },
  { value: 'grade_6', label: 'Grade 6' },
  { value: 'grade_7', label: 'Grade 7' },
  { value: 'grade_8', label: 'Grade 8' },
  { value: 'grade_9', label: 'Grade 9' },
  { value: 'grade_10', label: 'Grade 10' },
  { value: 'grade_11', label: 'Grade 11' },
  { value: 'grade_12', label: 'Grade 12' },
] as const;

/**
 * Formats a grade level value to a human-readable label
 * @param gradeLevel - The grade level value (e.g., 'grade_1' or 1)
 * @returns The formatted grade level (e.g., 'G1')
 */
export function formatGradeLevel(gradeLevel: string | number): string {
  if (typeof gradeLevel === 'number') {
    return `G${gradeLevel}`;
  }
  const gradeNumber = gradeLevel.replace('grade_', '');
  return `G${gradeNumber}`;
}

/**
 * Gets the full label for a grade level
 * @param gradeLevel - The grade level value (e.g., 'grade_1' or 1)
 * @returns The full label (e.g., 'Grade 1')
 */
export function getGradeLevelLabel(gradeLevel: string | number): string {
  // Normalize to string format 'grade_X'
  const normalized = typeof gradeLevel === 'number' ? `grade_${gradeLevel}` : gradeLevel;
  const grade = GRADE_LEVELS.find(g => g.value === normalized);
  return grade?.label || String(gradeLevel);
}
