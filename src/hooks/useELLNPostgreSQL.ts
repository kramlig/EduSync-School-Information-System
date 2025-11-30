/**
 * useELLNPostgreSQL Hook
 * 
 * Manages ELLN (Early Language, Literacy & Numeracy) assessments from PostgreSQL/Supabase
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ELLNAssessment {
  id: string;
  school_id: string;
  student_id: string;
  student_name: string;
  grade_level: number;
  school_year: string;
  quarter: 'q1' | 'q2' | 'q3' | 'q4';
  literacy_scores: {
    oralLanguage: number;
    phonologicalAwareness: number;
    bookAndPrintKnowledge: number;
    alphabetKnowledge: number;
    phonics: number;
    comprehension: number;
  };
  numeracy_scores: {
    numberSense: number;
    measurement: number;
    geometry: number;
    patterns: number;
    dataAnalysis: number;
  };
  literacy_score: number;
  numeracy_score: number;
  overall_score: number;
  proficiency_level: 'Advanced' | 'Proficient' | 'Approaching' | 'Developing' | 'Beginning';
  assessed_by: string;
  assessed_by_name: string;
  assessment_date: string;
  notes?: string;
  recommendations?: string;
  created_at?: string;
  updated_at?: string;
}

interface UseELLNOptions {
  schoolId?: string;
  studentId?: string;
  gradeLevel?: number;
  schoolYear?: string;
}

export function useELLNPostgreSQL(options: UseELLNOptions = {}) {
  const [assessments, setAssessments] = useState<ELLNAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchAssessments();
  }, [options.schoolId, options.studentId, options.gradeLevel, options.schoolYear]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('elln_assessments')
        .select('*')
        .order('assessment_date', { ascending: false });

      if (options.schoolId) {
        query = query.eq('school_id', options.schoolId);
      }

      if (options.studentId) {
        query = query.eq('student_id', options.studentId);
      }

      if (options.gradeLevel !== undefined) {
        query = query.eq('grade_level', options.gradeLevel);
      }

      if (options.schoolYear) {
        query = query.eq('school_year', options.schoolYear);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setAssessments(data || []);
    } catch (err) {
      setError(err as Error);
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  const createAssessment = async (assessment: Omit<ELLNAssessment, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
    try {
      const { data, error: insertError } = await supabase
        .from('elln_assessments')
        .insert([assessment])
        .select()
        .single();

      if (insertError) throw insertError;

      // Don't refresh the list automatically - let the component handle it
      // await fetchAssessments();

      return data.id;
    } catch (err) {
      throw err;
    }
  };

  const updateAssessment = async (id: string, updates: Partial<ELLNAssessment>): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('elln_assessments')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      // Refresh the list
      await fetchAssessments();
    } catch (err) {
      throw err;
    }
  };

  const deleteAssessment = async (id: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('elln_assessments')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Refresh the list
      await fetchAssessments();
    } catch (err) {
      throw err;
    }
  };

  return {
    assessments,
    loading,
    error,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    refresh: fetchAssessments
  };
}
