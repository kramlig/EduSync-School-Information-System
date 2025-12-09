/**
 * Division Proficiency Service - Simple Version
 * 
 * Uses PostgreSQL RPC function for server-side aggregation.
 * No complex transformations - just pass through the data.
 */

import { supabase } from '../lib/supabase';

// =====================================================
// TYPES - Simple, flat structures
// =====================================================

export interface SubjectSummary {
  code: string;
  schools_with_data: number;
  total_students: number;
  mps: number;
  passing: number;
  passing_rate: number;
}

export interface SchoolSubjectData {
  school_id: string;
  school_name: string;
  district: string;
  subject_code: string;
  total_students: number;
  mps: number;
  passing: number;
  passing_rate: number;
}

export interface GradeLevelData {
  school_id: string;
  school_name: string;
  district: string;
  subject_code: string;
  grade_level: string;
  total_students: number;
  mps: number;
  passing_rate: number;
}

export interface KindergartenData {
  school_id: string;
  school_name: string;
  district: string;
  total_students: number;
  beginning_pct: number;
  developing_pct: number;
  consistent_pct: number;
  total_pct: number;
}

export interface ProficiencyReport {
  quarter: string;
  total_schools: number;
  schools_checked: number;
  total_grades: number;
  overall_mps: number;
  by_subject: SubjectSummary[];
  school_data: SchoolSubjectData[];
  by_grade_level: GradeLevelData[];
  kindergarten: KindergartenData[];
}

// Subject display names
export const SUBJECT_NAMES: Record<string, string> = {
  FIL: 'Filipino',
  ENG: 'English',
  MTB: 'Mother Tongue',
  READ: 'Reading & Literacy',
  MATH: 'Mathematics',
  SCI: 'Science',
  AP: 'Araling Panlipunan',
  ESP: 'Edukasyon sa Pagpapakatao',
  EPP: 'EPP/TLE',
  TLE: 'EPP/TLE',
  MAPEH: 'MAPEH',
};

// Subject groupings for tabs
export const SUBJECT_GROUPS = {
  literacy: ['FIL', 'ENG', 'MTB', 'READ'],
  numeracy: ['MATH', 'SCI'],
  values: ['ESP', 'AP'],
  skills: ['EPP', 'TLE', 'MAPEH'],
};

// =====================================================
// SERVICE FUNCTION
// =====================================================

export async function fetchDivisionProficiency(
  divisionId: string,
  quarter: string = 'Q2'
): Promise<ProficiencyReport> {
  console.log('[ProficiencyService] Fetching for division:', divisionId, 'quarter:', quarter);
  
  // Call the RPC function - all aggregation happens server-side
  const { data, error } = await supabase.rpc('get_division_proficiency_v2', {
    p_division_id: divisionId,
    p_quarter: quarter,
  });

  if (error) {
    console.error('[ProficiencyService] RPC error:', error);
    throw new Error(`Failed to fetch proficiency data: ${error.message}`);
  }

  if (!data) {
    console.warn('[ProficiencyService] No data returned');
    return {
      quarter,
      total_schools: 0,
      schools_checked: 0,
      total_grades: 0,
      overall_mps: 0,
      by_subject: [],
      school_data: [],
      by_grade_level: [],
      kindergarten: [],
    };
  }

  console.log('[ProficiencyService] Got data:', {
    total_schools: data.total_schools,
    schools_checked: data.schools_checked,
    subjects: data.by_subject?.length || 0,
    school_rows: data.school_data?.length || 0,
    grade_level_rows: data.by_grade_level?.length || 0,
  });

  return data as ProficiencyReport;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function getSubjectName(code: string): string {
  return SUBJECT_NAMES[code] || code;
}

export function getSubjectGroup(code: string): string | null {
  for (const [group, codes] of Object.entries(SUBJECT_GROUPS)) {
    if (codes.includes(code)) return group;
  }
  return null;
}

export function getMPSColor(mps: number): string {
  if (mps >= 85) return 'text-green-600 dark:text-green-400';
  if (mps >= 75) return 'text-blue-600 dark:text-blue-400';
  if (mps >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

export function getMPSBgColor(mps: number): string {
  if (mps >= 85) return 'bg-green-100 dark:bg-green-900/30';
  if (mps >= 75) return 'bg-blue-100 dark:bg-blue-900/30';
  if (mps >= 60) return 'bg-amber-100 dark:bg-amber-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
}

// =====================================================
// DEPED FORMAT HELPERS
// =====================================================

// Subjects in DepEd order with grade level applicability
export const DEPED_SUBJECTS = [
  { code: 'LANG', name: 'Language', grades: [1, 2, 3] },
  { code: 'MTB', name: 'Mother Tongue', grades: [1, 2, 3] },
  { code: 'READ', name: 'Reading & Literacy', grades: [1, 2, 3] },
  { code: 'ENG', name: 'English', grades: [1, 2, 3, 4, 5, 6] },
  { code: 'MATH', name: 'Mathematics', grades: [1, 2, 3, 4, 5, 6] },
  { code: 'SCI', name: 'Science', grades: [3, 4, 5, 6] },
  { code: 'FIL', name: 'Filipino', grades: [1, 2, 3, 4, 5, 6] },
  { code: 'AP', name: 'Araling Panlipunan', grades: [1, 2, 3, 4, 5, 6] },
  { code: 'ESP', name: 'EsP/GMRC', grades: [1, 2, 3, 4, 5, 6] },
  { code: 'EPP', name: 'EPP/TLE', grades: [4, 5, 6] },
  { code: 'TLE', name: 'EPP/TLE', grades: [4, 5, 6] },
  { code: 'MAPEH', name: 'MAPEH', grades: [1, 2, 3, 4, 5, 6] },
];

// Transform report data into DepEd-format structure grouped by district and school
export function transformToDepEdFormat(report: ProficiencyReport): DepEdSchoolRow[] {
  if (!report.by_grade_level || report.by_grade_level.length === 0) {
    return [];
  }

  // Group data by school
  const schoolMap = new Map<string, DepEdSchoolRow>();
  
  for (const row of report.by_grade_level) {
    if (!schoolMap.has(row.school_id)) {
      schoolMap.set(row.school_id, {
        school_id: row.school_id,
        school_name: row.school_name,
        district: row.district,
        subjects: {},
      });
    }
    
    const school = schoolMap.get(row.school_id)!;
    const subjectKey = row.subject_code;
    
    if (!school.subjects[subjectKey]) {
      school.subjects[subjectKey] = {};
    }
    
    school.subjects[subjectKey][row.grade_level] = {
      passing_rate: row.passing_rate,
      mps: row.mps,
    };
  }
  
  // Convert to array and sort by district then school name
  return Array.from(schoolMap.values()).sort((a, b) => {
    if (a.district !== b.district) {
      return a.district.localeCompare(b.district);
    }
    return a.school_name.localeCompare(b.school_name);
  });
}

export interface DepEdSchoolRow {
  school_id: string;
  school_name: string;
  district: string;
  subjects: {
    [subjectCode: string]: {
      [gradeLevel: string]: {
        passing_rate: number;
        mps: number;
      };
    };
  };
}
