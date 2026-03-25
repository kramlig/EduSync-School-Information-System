/**
 * PostgreSQL Hook: Homeroom Guidance Grades
 * Fetches and manages homeroom guidance competency ratings from Supabase PostgreSQL.
 *
 * Used by both main workspace and personal workspace (shared hook).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface HomeroomGuidanceGrade {
  id: string;
  studentId: string;
  schoolId: string;
  schoolYear: string;
  q1Ratings: Record<string, number>;
  q2Ratings: Record<string, number>;
  q3Ratings: Record<string, number>;
  q4Ratings: Record<string, number>;
  createdAt?: string;
  updatedAt?: string;
}

export function useHomeroomGuidancePostgreSQL(
  enabled: boolean,
  schoolId?: string,
  schoolYear?: string,
  sectionId?: string
) {
  const [grades, setGrades] = useState<HomeroomGuidanceGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = () => setRefetchTrigger(prev => prev + 1);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Only join students table when filtering by section
        const selectClause = sectionId
          ? '*, students!inner(section_id)'
          : '*';

        let query = supabase
          .from('homeroom_guidance_grades')
          .select(selectClause)
          .is('deleted_at', null);

        if (schoolId && schoolId !== 'default') {
          query = query.eq('school_id', schoolId);
        }
        if (schoolYear) {
          query = query.eq('school_year', schoolYear);
        }
        if (sectionId) {
          query = query.eq('students.section_id', sectionId);
        }

        const { data, error: fetchErr } = await query;
        if (fetchErr) throw fetchErr;

        const transformed: HomeroomGuidanceGrade[] = (data || []).map((row: any) => ({
          id: row.id,
          studentId: row.student_id,
          schoolId: row.school_id,
          schoolYear: row.school_year,
          q1Ratings: row.q1_ratings || {},
          q2Ratings: row.q2_ratings || {},
          q3Ratings: row.q3_ratings || {},
          q4Ratings: row.q4_ratings || {},
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));

        if (isMounted) setGrades(transformed);
      } catch (err: any) {
        // Gracefully handle missing table
        if (err.message?.includes('does not exist') || err.code === '42P01') {
          if (isMounted) setGrades([]);
        } else {
          if (isMounted) setError(err as Error);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [enabled, schoolId, schoolYear, sectionId, refetchTrigger]);

  /**
   * Update a single competency rating for a student in a given quarter.
   * Creates the record via upsert if it doesn't exist.
   */
  const updateRating = useCallback(async (
    studentId: string,
    quarter: 'q1' | 'q2' | 'q3' | 'q4',
    competency: string,
    value: number | null,
    targetSchoolYear: string,
  ): Promise<void> => {
    const colMap = { q1: 'q1_ratings', q2: 'q2_ratings', q3: 'q3_ratings', q4: 'q4_ratings' } as const;
    const col = colMap[quarter];

    // Optimistic local update
    setGrades(prev => {
      const next = [...prev];
      const idx = next.findIndex(g => g.studentId === studentId && g.schoolYear === targetSchoolYear);
      const ratingsKey = `${quarter}Ratings` as keyof Pick<HomeroomGuidanceGrade, 'q1Ratings' | 'q2Ratings' | 'q3Ratings' | 'q4Ratings'>;

      if (idx >= 0) {
        const updated = { ...next[idx], [ratingsKey]: { ...next[idx][ratingsKey] } };
        if (value !== null) {
          (updated[ratingsKey] as Record<string, number>)[competency] = value;
        } else {
          delete (updated[ratingsKey] as Record<string, number>)[competency];
        }
        next[idx] = updated;
      } else {
        const newGrade: HomeroomGuidanceGrade = {
          id: '',
          studentId,
          schoolId: schoolId || '',
          schoolYear: targetSchoolYear,
          q1Ratings: {},
          q2Ratings: {},
          q3Ratings: {},
          q4Ratings: {},
        };
        if (value !== null) {
          (newGrade[ratingsKey] as Record<string, number>)[competency] = value;
        }
        next.push(newGrade);
      }
      return next;
    });

    // Persist: find existing row
    const existing = grades.find(g => g.studentId === studentId && g.schoolYear === targetSchoolYear);

    if (existing?.id) {
      const currentRatings = { ...(existing as any)[`${quarter}Ratings`] };
      if (value !== null) { currentRatings[competency] = value; } else { delete currentRatings[competency]; }

      const { error: upErr } = await supabase
        .from('homeroom_guidance_grades')
        .update({ [col]: currentRatings, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (upErr) throw upErr;
    } else {
      const ratings: Record<string, number> = {};
      if (value !== null) ratings[competency] = value;

      const { data, error: insErr } = await supabase
        .from('homeroom_guidance_grades')
        .upsert({
          school_id: schoolId || 'default',
          student_id: studentId,
          school_year: targetSchoolYear,
          [col]: ratings,
        }, { onConflict: 'student_id,school_year' })
        .select('*')
        .single();

      if (insErr) throw insErr;

      if (data) {
        setGrades(prev => {
          const next = prev.filter(g => !(g.studentId === studentId && g.schoolYear === targetSchoolYear && g.id === ''));
          next.push({
            id: data.id,
            studentId: data.student_id,
            schoolId: data.school_id,
            schoolYear: data.school_year,
            q1Ratings: data.q1_ratings || {},
            q2Ratings: data.q2_ratings || {},
            q3Ratings: data.q3_ratings || {},
            q4Ratings: data.q4_ratings || {},
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          });
          return next;
        });
      }
    }
  }, [schoolId, grades]);

  return { grades, loading, error, refetch, updateRating };
}
