/**
 * Electronic Class Record (ECR) Types
 * 
 * Type definitions for the ECR system following DepEd grading guidelines.
 * 
 * Components:
 * - WW: Written Work (30% default)
 * - PT: Performance Task (50% default)
 * - QA: Quarterly Assessment (20% default)
 */

// ============================================
// ECR Activity Types
// ============================================

/**
 * Activity type codes
 */
export type ECRActivityType = 'WW' | 'PT' | 'QA';

/**
 * Activity type labels
 */
export const ECR_ACTIVITY_TYPE_LABELS: Record<ECRActivityType, string> = {
  WW: 'Written Work',
  PT: 'Performance Task',
  QA: 'Quarterly Assessment'
};

/**
 * Quarter identifiers (Q1-Q4 for database compatibility)
 */
export type ECRQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

/**
 * Helper to convert quarter number to string
 */
export function quarterToString(q: number): ECRQuarter {
  return `Q${q}` as ECRQuarter;
}

/**
 * Helper to convert quarter string to number
 */
export function quarterToNumber(q: ECRQuarter): number {
  return parseInt(q.replace('Q', ''));
}

/**
 * Score status
 */
export type ECRScoreStatus = 'pending' | 'graded' | 'absent' | 'excused' | 'incomplete';

// ============================================
// Database Models
// ============================================

/**
 * ECR Weight Configuration
 * Defines component weights per school/subject/grade level
 */
export interface ECRWeight {
  id: string;
  schoolId: string;
  learningAreaId: string | null;
  gradeLevelMin: number | null;
  gradeLevelMax: number | null;
  wwWeight: number; // Default: 30
  ptWeight: number; // Default: 50
  qaWeight: number; // Default: 20
  createdAt: string;
  updatedAt: string;
}

/**
 * ECR Activity
 * An individual assessment (quiz, project, exam, etc.)
 */
export interface ECRActivity {
  id: string;
  schoolId: string;
  teacherId: string;
  sectionId: string;
  learningAreaId: string;
  schoolYear: string;
  quarter: ECRQuarter;
  activityType: ECRActivityType;
  activityNumber: number;
  activityName: string | null;
  description: string | null;
  maxScore: number;
  activityDate: string | null;
  dueDate: string | null;
  isPublished: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * ECR Score
 * A student's score for an activity
 */
export interface ECRScore {
  id: string;
  activityId: string;
  studentId: string;
  rawScore: number | null;
  status: ECRScoreStatus;
  remarks: string | null;
  gradedBy: string | null;
  gradedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * ECR Component Grades (Cached)
 * Computed grades per student per quarter
 */
export interface ECRComponentGrades {
  id: string;
  schoolId: string;
  studentId: string;
  sectionId: string;
  learningAreaId: string;
  schoolYear: string;
  quarter: ECRQuarter;
  
  // Written Work
  wwTotalScore: number;
  wwMaxScore: number;
  wwPercentage: number;
  wwTransmuted: number;
  wwWeighted: number;
  
  // Performance Task
  ptTotalScore: number;
  ptMaxScore: number;
  ptPercentage: number;
  ptTransmuted: number;
  ptWeighted: number;
  
  // Quarterly Assessment
  qaTotalScore: number;
  qaMaxScore: number;
  qaPercentage: number;
  qaTransmuted: number;
  qaWeighted: number;
  
  // Final
  quarterlyGrade: number;
  lastComputedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// API/Form Models
// ============================================

/**
 * Create activity request
 */
export interface CreateECRActivityRequest {
  sectionId: string;
  learningAreaId: string;
  schoolYear: string;
  quarter: ECRQuarter;
  activityType: ECRActivityType;
  activityNumber: number;
  activityName?: string;
  description?: string;
  maxScore: number;
  activityDate?: string;
  dueDate?: string;
}

/**
 * Update activity request
 */
export interface UpdateECRActivityRequest {
  activityName?: string;
  description?: string;
  maxScore?: number;
  activityDate?: string;
  dueDate?: string;
  isPublished?: boolean;
  isLocked?: boolean;
}

/**
 * Bulk score entry
 */
export interface BulkScoreEntry {
  studentId: string;
  rawScore: number | null;
  status?: ECRScoreStatus;
  remarks?: string;
}

/**
 * Activity with scores (for class record view)
 */
export interface ECRActivityWithScores extends ECRActivity {
  scores: ECRScore[];
}

/**
 * Student row in class record (all activities for one student)
 */
export interface ECRStudentRow {
  studentId: string;
  studentName: string;
  lrn: string;
  
  // Scores by activity ID
  scores: Record<string, ECRScore>;
  
  // Computed totals per component
  wwTotal: number;
  wwMax: number;
  wwPercentage: number;
  wwTransmuted: number;
  
  ptTotal: number;
  ptMax: number;
  ptPercentage: number;
  ptTransmuted: number;
  
  qaTotal: number;
  qaMax: number;
  qaPercentage: number;
  qaTransmuted: number;
  
  // Weighted scores
  wwWeighted: number;
  ptWeighted: number;
  qaWeighted: number;
  
  // Final
  quarterlyGrade: number;
}

/**
 * Class record summary (for a section/subject/quarter)
 */
export interface ECRClassRecord {
  sectionId: string;
  sectionName: string;
  gradeLevel: number;
  learningAreaId: string;
  learningAreaName: string;
  learningAreaCode: string; // Short code (e.g., 'TLE', 'MATH', 'FIL')
  schoolId: string;
  schoolName: string;
  schoolIdNumber: string; // DepEd official school ID number
  division: string;
  region: string;
  district: string;
  schoolYear: string;
  quarter: ECRQuarter;
  teacherId: string;
  teacherName: string;
  
  // Weights
  weights: {
    ww: number;
    pt: number;
    qa: number;
  };
  
  // Activities grouped by type
  activities: {
    ww: ECRActivity[];
    pt: ECRActivity[];
    qa: ECRActivity[];
  };
  
  // Student rows
  students: ECRStudentRow[];
  
  // Class statistics
  stats: {
    totalStudents: number;
    gradedCount: number;
    classAverage: number;
    passingCount: number;
    passingRate: number;
    highestGrade: number;
    lowestGrade: number;
  };
}

// ============================================
// UI State Types
// ============================================

/**
 * Class record view state
 */
export interface ECRViewState {
  selectedSection: string | null;
  selectedSubject: string | null;
  selectedQuarter: ECRQuarter;
  schoolYear: string;
  isLoading: boolean;
  error: string | null;
}

/**
 * Activity modal state
 */
export interface ECRActivityModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  activity: Partial<ECRActivity> | null;
  activityType: ECRActivityType;
}

/**
 * Score entry mode
 */
export type ECRScoreEntryMode = 'cell' | 'bulk' | 'import';

// ============================================
// Helper Functions
// ============================================

/**
 * Get default weights for DepEd grading
 */
export function getDefaultECRWeights(): Pick<ECRWeight, 'wwWeight' | 'ptWeight' | 'qaWeight'> {
  return {
    wwWeight: 30,
    ptWeight: 50,
    qaWeight: 20
  };
}

/**
 * Calculate percentage from raw score
 */
export function calculatePercentage(rawScore: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return Math.min(100, Math.max(0, (rawScore / maxScore) * 100));
}

/**
 * Transmute percentage to DepEd grade (60-100)
 */
export function transmuteGrade(percentage: number): number {
  if (percentage < 0) return 60;
  if (percentage > 100) return 100;
  
  // Linear interpolation: 0% → 60, 100% → 100
  return Math.round(60 + (percentage * 0.4));
}

/**
 * Calculate weighted score
 */
export function calculateWeightedScore(transmutedGrade: number, weight: number): number {
  return Math.round((transmutedGrade * weight / 100) * 100) / 100;
}

/**
 * Calculate quarterly grade from components
 */
export function calculateQuarterlyGrade(
  wwTransmuted: number,
  ptTransmuted: number,
  qaTransmuted: number,
  weights: { ww: number; pt: number; qa: number }
): number {
  const wwWeighted = calculateWeightedScore(wwTransmuted, weights.ww);
  const ptWeighted = calculateWeightedScore(ptTransmuted, weights.pt);
  const qaWeighted = calculateWeightedScore(qaTransmuted, weights.qa);
  
  return Math.round(wwWeighted + ptWeighted + qaWeighted);
}

/**
 * Get grade descriptor
 */
export function getGradeDescriptor(grade: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (grade >= 90) {
    return { label: 'Outstanding', color: 'text-green-700', bgColor: 'bg-green-100' };
  } else if (grade >= 85) {
    return { label: 'Very Satisfactory', color: 'text-blue-700', bgColor: 'bg-blue-100' };
  } else if (grade >= 80) {
    return { label: 'Satisfactory', color: 'text-cyan-700', bgColor: 'bg-cyan-100' };
  } else if (grade >= 75) {
    return { label: 'Fairly Satisfactory', color: 'text-yellow-700', bgColor: 'bg-yellow-100' };
  } else {
    return { label: 'Did Not Meet Expectations', color: 'text-red-700', bgColor: 'bg-red-100' };
  }
}

/**
 * Check if grade is passing
 */
export function isPassing(grade: number): boolean {
  return grade >= 75;
}

/**
 * Get next activity number for a type
 */
export function getNextActivityNumber(activities: ECRActivity[], type: ECRActivityType): number {
  const typeActivities = activities.filter(a => a.activityType === type);
  if (typeActivities.length === 0) return 1;
  
  const maxNumber = Math.max(...typeActivities.map(a => a.activityNumber));
  return maxNumber + 1;
}

/**
 * Format activity label (e.g., "WW1", "PT3", "QA")
 */
export function formatActivityLabel(type: ECRActivityType, number: number): string {
  return `${type}${number}`;
}

/**
 * Parse activity label to type and number
 */
export function parseActivityLabel(label: string): { type: ECRActivityType; number: number } | null {
  const match = label.match(/^(WW|PT|QA)(\d+)$/);
  if (!match) return null;
  
  return {
    type: match[1] as ECRActivityType,
    number: parseInt(match[2], 10)
  };
}
