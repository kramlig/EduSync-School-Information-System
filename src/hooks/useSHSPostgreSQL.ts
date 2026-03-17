/**
 * useSHSPostgreSQL Hook
 * 
 * Provides SHS (Senior High School) specific data and operations:
 * - Track/Strand reference data
 * - SHS student queries with track/strand filters
 * - Semester grades CRUD
 * - Completion requirements tracking
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

// ==========================================
// Type Definitions
// ==========================================

export interface SHSTrack {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

export interface SHSStrand {
  id: string;
  track_code: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

export interface SHSStudent {
  id: string;
  school_id: string;
  lrn: string;
  name: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: 'Male' | 'Female';
  grade_level: number;
  section_id?: string;
  section_name?: string;
  shs_track?: string;
  track_name?: string;
  shs_strand?: string;
  strand_name?: string;
  shs_specialization?: string;
  current_semester?: number;
  shs_completion_status?: string;
  enrollment_status?: string;
}

export interface SHSSemesterGrade {
  id: string;
  school_id: string;
  student_id: string;
  learning_area_id: string;
  school_year: string;
  semester: 1 | 2;
  grade_level: 11 | 12;
  midterm_grade?: number;
  final_grade?: number;
  semester_grade?: number;
  remarks?: string;
  // Joined data
  student_name?: string;
  learning_area_name?: string;
}

export interface SHSCompletionRequirement {
  id: string;
  school_id: string;
  student_id: string;
  school_year: string;
  core_subjects_completed: boolean;
  core_subjects_units: number;
  applied_subjects_completed: boolean;
  applied_subjects_units: number;
  work_immersion_completed: boolean;
  work_immersion_hours: number;
  work_immersion_company?: string;
  work_immersion_supervisor?: string;
  research_completed: boolean;
  research_title?: string;
  all_requirements_met: boolean;
  eligible_for_graduation: boolean;
  graduation_date?: string;
  remarks?: string;
}

export interface SHSStatistics {
  totalSHSStudents: number;
  byTrack: Record<string, number>;
  byStrand: Record<string, number>;
  byGradeLevel: { grade11: number; grade12: number };
  completionStatus: {
    in_progress: number;
    completed: number;
    incomplete: number;
  };
  eligibleForGraduation: number;
}

// ==========================================
// Constants
// ==========================================

export const SHS_TRACKS: { code: string; name: string }[] = [
  { code: 'ACADEMIC', name: 'Academic Track' },
  { code: 'TVL', name: 'Technical-Vocational-Livelihood Track' },
  { code: 'SPORTS', name: 'Sports Track' },
  { code: 'ARTS', name: 'Arts and Design Track' },
];

export const SHS_STRANDS: { code: string; name: string; track: string }[] = [
  // Academic Track
  { code: 'STEM', name: 'Science, Technology, Engineering, and Mathematics', track: 'ACADEMIC' },
  { code: 'ABM', name: 'Accountancy, Business, and Management', track: 'ACADEMIC' },
  { code: 'HUMSS', name: 'Humanities and Social Sciences', track: 'ACADEMIC' },
  { code: 'GAS', name: 'General Academic Strand', track: 'ACADEMIC' },
  // TVL Track
  { code: 'TVL-HE', name: 'Home Economics', track: 'TVL' },
  { code: 'TVL-ICT', name: 'Information and Communications Technology', track: 'TVL' },
  { code: 'TVL-IA', name: 'Industrial Arts', track: 'TVL' },
  { code: 'TVL-AF', name: 'Agri-Fishery Arts', track: 'TVL' },
  // Sports Track
  { code: 'SPORTS', name: 'Sports', track: 'SPORTS' },
  // Arts Track
  { code: 'ARTS', name: 'Arts and Design', track: 'ARTS' },
];

export const getStrandsByTrack = (trackCode: string) => {
  return SHS_STRANDS.filter(s => s.track === trackCode);
};

export const getTrackName = (trackCode: string): string => {
  return SHS_TRACKS.find(t => t.code === trackCode)?.name || trackCode;
};

export const getStrandName = (strandCode: string): string => {
  return SHS_STRANDS.find(s => s.code === strandCode)?.name || strandCode;
};

// ==========================================
// Hooks
// ==========================================

interface UseSHSStudentsOptions {
  schoolId?: string;
  gradeLevel?: 11 | 12;
  track?: string;
  strand?: string;
  sectionId?: string;
  schoolYear?: string;
  completionStatus?: string;
}

export function useSHSStudents(options: UseSHSStudentsOptions) {
  const { schoolId, gradeLevel, track, strand, sectionId, completionStatus } = options;
  
  const [students, setStudents] = useState<SHSStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStudents = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('students')
        .select(`
          id,
          school_id,
          lrn,
          name,
          first_name,
          middle_name,
          last_name,
          gender,
          grade_level,
          section_id,
          shs_track,
          shs_strand,
          shs_specialization,
          current_semester,
          shs_completion_status,
          enrollment_status,
          sections!left(name)
        `)
        .eq('school_id', schoolId)
        .in('grade_level', [11, 12])
        .is('deleted_at', null);

      if (gradeLevel) {
        query = query.eq('grade_level', gradeLevel);
      }

      if (track) {
        query = query.eq('shs_track', track);
      }

      if (strand) {
        query = query.eq('shs_strand', strand);
      }

      if (sectionId) {
        query = query.eq('section_id', sectionId);
      }

      if (completionStatus) {
        query = query.eq('shs_completion_status', completionStatus);
      }

      const { data, error: fetchError } = await query.order('last_name');

      if (fetchError) throw fetchError;

      const transformed: SHSStudent[] = (data || []).map((s: any) => ({
        id: s.id,
        school_id: s.school_id,
        lrn: s.lrn,
        name: s.name,
        first_name: s.first_name,
        middle_name: s.middle_name,
        last_name: s.last_name,
        gender: s.gender,
        grade_level: s.grade_level,
        section_id: s.section_id,
        section_name: s.sections?.name,
        shs_track: s.shs_track,
        track_name: s.shs_track ? getTrackName(s.shs_track) : undefined,
        shs_strand: s.shs_strand,
        strand_name: s.shs_strand ? getStrandName(s.shs_strand) : undefined,
        shs_specialization: s.shs_specialization,
        current_semester: s.current_semester,
        shs_completion_status: s.shs_completion_status,
        enrollment_status: s.enrollment_status,
      }));

      setStudents(transformed);
    } catch (err) {
      console.error('Error fetching SHS students:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch SHS students'));
    } finally {
      setLoading(false);
    }
  }, [schoolId, gradeLevel, track, strand, sectionId, completionStatus]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Calculate statistics
  const statistics = useMemo((): SHSStatistics => {
    const byTrack: Record<string, number> = {};
    const byStrand: Record<string, number> = {};
    let grade11 = 0;
    let grade12 = 0;
    const completionStatusCount = { in_progress: 0, completed: 0, incomplete: 0 };
    let eligibleForGraduation = 0;

    students.forEach(s => {
      // By track
      if (s.shs_track) {
        byTrack[s.shs_track] = (byTrack[s.shs_track] || 0) + 1;
      }
      
      // By strand
      if (s.shs_strand) {
        byStrand[s.shs_strand] = (byStrand[s.shs_strand] || 0) + 1;
      }
      
      // By grade level
      if (s.grade_level === 11) grade11++;
      if (s.grade_level === 12) grade12++;
      
      // By completion status
      if (s.shs_completion_status) {
        completionStatusCount[s.shs_completion_status as keyof typeof completionStatusCount] = 
          (completionStatusCount[s.shs_completion_status as keyof typeof completionStatusCount] || 0) + 1;
      }
    });

    return {
      totalSHSStudents: students.length,
      byTrack,
      byStrand,
      byGradeLevel: { grade11, grade12 },
      completionStatus: completionStatusCount,
      eligibleForGraduation,
    };
  }, [students]);

  return {
    students,
    statistics,
    loading,
    error,
    refresh: fetchStudents,
  };
}

// ==========================================
// Semester Grades Hook
// ==========================================

interface UseSHSSemesterGradesOptions {
  schoolId?: string;
  studentId?: string;
  schoolYear?: string;
  semester?: 1 | 2;
  gradeLevel?: 11 | 12;
}

export function useSHSSemesterGrades(options: UseSHSSemesterGradesOptions) {
  const { schoolId, studentId, schoolYear, semester, gradeLevel } = options;
  
  const [grades, setGrades] = useState<SHSSemesterGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGrades = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('shs_semester_grades')
        .select(`
          *,
          students!inner(name),
          learning_areas!inner(name)
        `)
        .eq('school_id', schoolId);

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      if (schoolYear) {
        query = query.eq('school_year', schoolYear);
      }

      if (semester) {
        query = query.eq('semester', semester);
      }

      if (gradeLevel) {
        query = query.eq('grade_level', gradeLevel);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const transformed: SHSSemesterGrade[] = (data || []).map((g: any) => ({
        ...g,
        student_name: g.students?.name,
        learning_area_name: g.learning_areas?.name,
      }));

      setGrades(transformed);
    } catch (err) {
      console.error('Error fetching SHS semester grades:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch grades'));
    } finally {
      setLoading(false);
    }
  }, [schoolId, studentId, schoolYear, semester, gradeLevel]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const updateGrade = useCallback(async (
    gradeId: string,
    updates: Partial<Pick<SHSSemesterGrade, 'midterm_grade' | 'final_grade' | 'remarks'>>
  ) => {
    const { error } = await supabase
      .from('shs_semester_grades')
      .update(updates)
      .eq('id', gradeId);

    if (error) throw error;
    await fetchGrades();
  }, [fetchGrades]);

  const createGrade = useCallback(async (
    grade: Omit<SHSSemesterGrade, 'id' | 'semester_grade'>
  ) => {
    const { error } = await supabase
      .from('shs_semester_grades')
      .insert(grade);

    if (error) throw error;
    await fetchGrades();
  }, [fetchGrades]);

  return {
    grades,
    loading,
    error,
    updateGrade,
    createGrade,
    refresh: fetchGrades,
  };
}

// ==========================================
// Completion Requirements Hook
// ==========================================

interface UseSHSCompletionOptions {
  schoolId?: string;
  studentId?: string;
  schoolYear?: string;
  eligibleOnly?: boolean;
}

export function useSHSCompletion(options: UseSHSCompletionOptions) {
  const { schoolId, studentId, schoolYear, eligibleOnly } = options;
  
  const [requirements, setRequirements] = useState<SHSCompletionRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRequirements = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('shs_completion_requirements')
        .select('*')
        .eq('school_id', schoolId);

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      if (schoolYear) {
        query = query.eq('school_year', schoolYear);
      }

      if (eligibleOnly) {
        query = query.eq('eligible_for_graduation', true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setRequirements(data || []);
    } catch (err) {
      console.error('Error fetching SHS completion requirements:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch requirements'));
    } finally {
      setLoading(false);
    }
  }, [schoolId, studentId, schoolYear, eligibleOnly]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  const updateRequirements = useCallback(async (
    reqId: string,
    updates: Partial<SHSCompletionRequirement>
  ) => {
    const { error } = await supabase
      .from('shs_completion_requirements')
      .update(updates)
      .eq('id', reqId);

    if (error) throw error;
    await fetchRequirements();
  }, [fetchRequirements]);

  return {
    requirements,
    loading,
    error,
    updateRequirements,
    refresh: fetchRequirements,
  };
}

export default {
  useSHSStudents,
  useSHSSemesterGrades,
  useSHSCompletion,
  SHS_TRACKS,
  SHS_STRANDS,
  getStrandsByTrack,
  getTrackName,
  getStrandName,
};
