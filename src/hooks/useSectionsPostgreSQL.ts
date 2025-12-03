/**
 * useSectionsPostgreSQL Hook
 * 
 * Provides section data fetching and CRUD operations using PostgreSQL via Supabase.
 * Designed to replace Firestore section queries during migration.
 * 
 * Features:
 * - Real-time section subscriptions
 * - Filtering by grade level, school year
 * - Section relationships (adviser, student count)
 * - CRUD operations (create, update, delete)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Type definitions (matching Firestore Section type)
interface Section {
  id: string;
  schoolId: string;
  name: string;
  gradeLevel: number | string;
  adviserId?: string;
  adviserName?: string; // Populated from join
  schoolYear?: string;
  capacity?: number;
  studentCount?: number; // Calculated field
  room?: string;
  schedule?: string;
  
  // Metadata
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface UseSectionsOptions {
  gradeLevel?: number | string;
  schoolId?: string;
  schoolYear?: string;
  includeAdviser?: boolean; // Load adviser name via join
  includeStudentCount?: boolean; // Calculate student count
}

interface UseSectionsReturn {
  sections: Section[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createSection: (section: Partial<Section>) => Promise<Section>;
  updateSection: (id: string, updates: Partial<Section>) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;
}

export function useSectionsPostgreSQL(options: UseSectionsOptions = {}): UseSectionsReturn {
  const { 
    gradeLevel, 
    schoolId, 
    schoolYear,
    includeAdviser = false,
    includeStudentCount = false
  } = options;
  
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('sections').select(
        includeAdviser 
          ? 'id, school_id, name, grade_level, adviser_id, school_year, capacity, room_number, created_at, updated_at, teachers(name)'
          : '*'
      );

      // Apply filters
      if (gradeLevel !== undefined) {
        query = query.eq('grade_level', gradeLevel);
      }
      // Only filter by schoolId if it's a valid UUID (not "default")
      if (schoolId && schoolId !== 'default') {
        query = query.eq('school_id', schoolId);
      }
      if (schoolYear) {
        query = query.eq('school_year', schoolYear);
      }

      // Order by grade level, then name
      query = query.order('grade_level', { ascending: true });
      query = query.order('name', { ascending: true });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('[useSectionsPostgreSQL] Supabase query error:', fetchError);
        console.error('[useSectionsPostgreSQL] Error message:', fetchError.message);
        throw fetchError;
      }

      // Get student counts if requested
      let studentCounts: Record<string, number> = {};
      if (includeStudentCount && data && data.length > 0) {
        const sectionIds = data.map((s: any) => s.id);
        
        const { data: countData, error: countError } = await supabase
          .from('students')
          .select('section_id')
          .in('section_id', sectionIds)
          .eq('status', 'enrolled')
          .is('deleted_at', null);

        if (!countError && countData) {
          studentCounts = countData.reduce((acc, student) => {
            acc[student.section_id] = (acc[student.section_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
        }
      }

      // Transform PostgreSQL data to match Firestore Section interface
      const transformedSections: Section[] = (data || []).map((row: any) => ({
        id: row.id,
        schoolId: row.school_id,
        name: row.name,
        gradeLevel: row.grade_level,
        adviserId: row.adviser_id || undefined,
        adviserName: row.teachers?.name || undefined,
        schoolYear: row.school_year || undefined,
        capacity: row.capacity || undefined,
        studentCount: studentCounts[row.id] || 0,
        room: row.room_number || undefined,
        schedule: undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      setSections(transformedSections);

    } catch (err) {
      console.error('[useSectionsPostgreSQL] Error fetching sections:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [gradeLevel, schoolId, schoolYear, includeAdviser, includeStudentCount]);

  // Initial fetch
  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  // Real-time subscriptions
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = () => {
      channel = supabase
        .channel('sections-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'sections'
            // Don't filter here - we'll filter in fetchSections instead
          },
          (payload: any) => {
            // Refetch to ensure data consistency
            fetchSections();
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchSections]); // Only depend on fetchSections, not gradeLevel/schoolId/schoolYear

  // Create section
  const createSection = useCallback(async (sectionData: Partial<Section>): Promise<Section> => {
    try {
      const insertData = {
        school_id: sectionData.schoolId,
        name: sectionData.name,
        grade_level: sectionData.gradeLevel,
        adviser_id: sectionData.adviserId,
        school_year: sectionData.schoolYear,
        capacity: sectionData.capacity,
        room_number: sectionData.room
      };

      const { data, error: insertError } = await supabase
        .from('sections')
        .insert([insertData])
        .select()
        .single();

      if (insertError) throw insertError;

      // Transform back to Section type
      const newSection: Section = {
        id: data.id,
        schoolId: data.school_id,
        name: data.name,
        gradeLevel: data.grade_level,
        adviserId: data.adviser_id,
        schoolYear: data.school_year,
        capacity: data.capacity,
        room: data.room_number,
        schedule: undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      return newSection;

    } catch (err) {
      console.error('[useSectionsPostgreSQL] Error creating section:', err);
      throw err;
    }
  }, []);

  // Update section
  const updateSection = useCallback(async (id: string, updates: Partial<Section>): Promise<void> => {
    try {
      const updateData: Record<string, any> = {};
      
      // Map Section fields to PostgreSQL column names
      if (updates.schoolId !== undefined) updateData.school_id = updates.schoolId;
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.gradeLevel !== undefined) updateData.grade_level = updates.gradeLevel;
      if (updates.adviserId !== undefined) updateData.adviser_id = updates.adviserId || null; // Handle empty string
      if (updates.schoolYear !== undefined) updateData.school_year = updates.schoolYear;
      if (updates.capacity !== undefined) updateData.capacity = updates.capacity;
      if (updates.room !== undefined) updateData.room_number = updates.room || null; // Handle empty string

      const { data, error: updateError } = await supabase
        .from('sections')
        .update(updateData)
        .eq('id', id)
        .select();

      if (updateError) throw updateError;

    } catch (err) {
      console.error('[useSectionsPostgreSQL] Error updating section:', err);
      throw err;
    }
  }, []);

  // Delete section
  const deleteSection = useCallback(async (id: string): Promise<void> => {
    try {
      // Check if section has students
      const { data: students, error: checkError } = await supabase
        .from('students')
        .select('id')
        .eq('section_id', id)
        .is('deleted_at', null)
        .limit(1);

      if (checkError) throw checkError;

      if (students && students.length > 0) {
        throw new Error('Cannot delete section with active students. Please move students to another section first.');
      }

      // Hard delete (no students, safe to remove)
      const { error: deleteError } = await supabase
        .from('sections')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;


    } catch (err) {
      console.error('[useSectionsPostgreSQL] Error deleting section:', err);
      throw err;
    }
  }, []);

  return {
    sections,
    loading,
    error,
    refetch: fetchSections,
    createSection,
    updateSection,
    deleteSection
  };
}

export default useSectionsPostgreSQL;
