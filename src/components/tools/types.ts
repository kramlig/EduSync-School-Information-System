/**
 * Shared types for the Free Form Generator Tool UI components.
 */

export type FormType = 'sf5' | 'sf9' | 'sf2';

export interface SchoolInfo {
  name: string;
  schoolId: string;
  division: string;
  region: string;
  district: string;
  schoolYear: string;
  gradeLevel: number;
  sectionName: string;
  adviserName: string;
}

export type WizardStep = 'select-form' | 'school-info' | 'upload-data' | 'preview';

export const FORM_LABELS: Record<FormType, { label: string; description: string }> = {
  sf5: { label: 'SF5', description: 'Report on Promotion and Level of Proficiency' },
  sf9: { label: 'SF9', description: 'Learner\'s Progress Report Card' },
  sf2: { label: 'SF2', description: 'Learner Daily Attendance Report' },
};

/** Cache key for school info in localStorage */
export const SCHOOL_INFO_CACHE_KEY = 'edusync_tool_school_info';
