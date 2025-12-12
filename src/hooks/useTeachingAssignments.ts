import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface TeachingAssignment {
  id: string;
  school_id: string;
  teacher_id: string;
  grade_level: number;
  section_id: string | null;
  section_name?: string | null;
  learning_area_id: string | null;
  subject: string;
  hours_per_week: number;
  is_advisory: boolean;
  is_active: boolean;
  school_year: string;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // Joined data
  section?: {
    id: string;
    name: string;
  };
  learning_area?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface UseTeachingAssignmentsResult {
  assignments: TeachingAssignment[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch teaching assignments for a specific teacher
 * 
 * @param teacherId - UUID of the teacher
 * @returns Teaching assignments with loading/error states
 */
export function useTeachingAssignments(teacherId: string): UseTeachingAssignmentsResult {
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('teaching_assignments')
        .select(`
          *,
          section:sections(id, name),
          learning_area:learning_areas(id, name, code)
        `)
        .eq('teacher_id', teacherId)
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('grade_level', { ascending: true })
        .order('is_advisory', { ascending: false }); // Advisers first

      if (fetchError) throw fetchError;

      setAssignments(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching teaching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teacherId) {
      fetchAssignments();
    }
  }, [teacherId]);

  return { assignments, loading, error, refetch: fetchAssignments };
}

/**
 * Hook to fetch section adviser for a specific section
 * 
 * @param sectionId - UUID of the section
 * @returns Teaching assignment record for the section adviser
 */
export function useSectionAdviser(sectionId: string) {
  const [adviser, setAdviser] = useState<TeachingAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAdviser() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('teaching_assignments')
          .select('*, section:sections(id, name)')
          .eq('section_id', sectionId)
          .eq('is_advisory', true)
          .is('deleted_at', null)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        setAdviser(data);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching section adviser:', err);
      } finally {
        setLoading(false);
      }
    }

    if (sectionId) {
      fetchAdviser();
    }
  }, [sectionId]);

  return { adviser, loading, error };
}

/**
 * Hook to fetch all subject teachers for a specific learning area and grade
 * 
 * @param learningAreaId - UUID of the learning area
 * @param gradeLevel - Grade level (1-12)
 * @returns List of teaching assignments for that subject
 */
export function useSubjectTeachers(learningAreaId: string, gradeLevel: number) {
  const [teachers, setTeachers] = useState<TeachingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTeachers() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('teaching_assignments')
          .select('*, learning_area:learning_areas(id, name, code)')
          .eq('learning_area_id', learningAreaId)
          .eq('grade_level', gradeLevel)
          .eq('is_advisory', false)
          .is('deleted_at', null)
          .eq('is_active', true);

        if (fetchError) throw fetchError;

        setTeachers(data || []);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching subject teachers:', err);
      } finally {
        setLoading(false);
      }
    }

    if (learningAreaId && gradeLevel) {
      fetchTeachers();
    }
  }, [learningAreaId, gradeLevel]);

  return { teachers, loading, error };
}
