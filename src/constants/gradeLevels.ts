/**
 * DepEd K-12 Grade Level Constants
 * 
 * Philippines K-12 Basic Education Curriculum:
 * - Kindergarten (K)
 * - Elementary: Grades 1-6
 * - Junior High School (JHS): Grades 7-10
 * - Senior High School (SHS): Grades 11-12
 */

export type GradeLevel = 'K' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const GRADE_LEVELS: ReadonlyArray<GradeLevel> = ['K', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export const GRADE_LEVEL_NUMERIC: ReadonlyArray<number> = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export const ELEMENTARY_GRADES: ReadonlyArray<GradeLevel> = ['K', 1, 2, 3, 4, 5, 6] as const;

export const JUNIOR_HIGH_GRADES: ReadonlyArray<number> = [7, 8, 9, 10] as const;

export const SENIOR_HIGH_GRADES: ReadonlyArray<number> = [11, 12] as const;

export const GRADE_LEVEL_LABELS: Record<GradeLevel, string> = {
  'K': 'Kindergarten',
  1: 'Grade 1',
  2: 'Grade 2',
  3: 'Grade 3',
  4: 'Grade 4',
  5: 'Grade 5',
  6: 'Grade 6',
  7: 'Grade 7',
  8: 'Grade 8',
  9: 'Grade 9',
  10: 'Grade 10',
  11: 'Grade 11',
  12: 'Grade 12',
};

export const GRADE_LEVEL_CATEGORIES = {
  KINDERGARTEN: { label: 'Kindergarten', levels: ['K'] as const },
  ELEMENTARY: { label: 'Elementary', levels: [1, 2, 3, 4, 5, 6] as const },
  JUNIOR_HIGH: { label: 'Junior High School', levels: [7, 8, 9, 10] as const },
  SENIOR_HIGH: { label: 'Senior High School', levels: [11, 12] as const },
} as const;

/**
 * Convert grade level to numeric value for sorting
 * K = 0, Grade 1 = 1, etc.
 */
export function gradeLevelToNumber(grade: GradeLevel | number): number {
  if (grade === 'K') return 0;
  return typeof grade === 'number' ? grade : parseInt(String(grade), 10);
}

/**
 * Convert numeric grade to display format
 * 0 = 'K', 1 = 'Grade 1', etc.
 */
export function formatGradeLevel(grade: GradeLevel | number): string {
  if (grade === 0 || grade === 'K') return 'Kindergarten';
  return `Grade ${grade}`;
}

/**
 * Get grade level category (Elementary, JHS, SHS)
 */
export function getGradeLevelCategory(grade: GradeLevel | number): string {
  const num = gradeLevelToNumber(grade);
  if (num === 0) return 'Kindergarten';
  if (num >= 1 && num <= 6) return 'Elementary';
  if (num >= 7 && num <= 10) return 'Junior High School';
  if (num >= 11 && num <= 12) return 'Senior High School';
  return 'Unknown';
}

/**
 * Check if grade level requires track selection (SHS only)
 */
export function requiresTrackSelection(grade: GradeLevel | number): boolean {
  const num = gradeLevelToNumber(grade);
  return num >= 11 && num <= 12;
}

/**
 * Senior High School tracks
 */
export const SHS_TRACKS = {
  STEM: { code: 'STEM', name: 'Science, Technology, Engineering, and Mathematics' },
  ABM: { code: 'ABM', name: 'Accountancy, Business, and Management' },
  HUMSS: { code: 'HUMSS', name: 'Humanities and Social Sciences' },
  GAS: { code: 'GAS', name: 'General Academic Strand' },
  TVL: { code: 'TVL', name: 'Technical-Vocational-Livelihood' },
  SPORTS: { code: 'SPORTS', name: 'Sports Track' },
  ARTS_DESIGN: { code: 'ARTS_DESIGN', name: 'Arts and Design Track' },
} as const;

export type SHSTrack = keyof typeof SHS_TRACKS;
