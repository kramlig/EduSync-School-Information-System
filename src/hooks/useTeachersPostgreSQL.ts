/**
 * useTeachersPostgreSQL Hook
 * 
 * Provides teacher data fetching and CRUD operations using PostgreSQL via Supabase.
 * Designed to replace Firestore teacher queries during migration.
 * 
 * Features:
 * - Real-time teacher subscriptions
 * - Search by name, email, contact
 * - Teacher assignments and roles
 * - CRUD operations (create, update, delete)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Type definitions (matching Firestore Teacher type)
interface TeacherAssignment {
  gradeLevel: number;
  learningAreaId: string;
  learningAreaName?: string;
  sectionId?: string;
  sectionName?: string;
  schoolYear?: string;
}

interface Teacher {
  id: string;
  schoolId: string;
  name: string;
  email: string;
  contactNumber?: string;
  assignments?: TeacherAssignment[];
  role: 'admin' | 'teacher' | 'principal' | 'registrar' | 'superadmin';
  
  // Metadata
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface UseTeachersOptions {
  schoolId?: string;
  role?: string;
  enableRealtime?: boolean;
}

interface UseTeachersReturn {
  teachers: Teacher[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createTeacher: (teacher: Partial<Teacher>) => Promise<Teacher>;
  updateTeacher: (id: string, updates: Partial<Teacher>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  searchTeachers: (query: string) => Promise<Teacher[]>;
}

// Query cache with TTL
const queryCache = new Map<string, { data: Teacher[]; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds

export function useTeachersPostgreSQL(options: UseTeachersOptions = {}): UseTeachersReturn {
  const { 
    schoolId, 
    role,
    enableRealtime = false
  } = options;
  
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cacheKey = `teachers:${schoolId}:${role}`;
      const cached = queryCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        setTeachers(cached.data);
        setLoading(false);
        return;
      }

      let query = supabase.from('teachers').select('*');

      // Apply filters
      if (schoolId && schoolId !== 'default') {
        query = query.eq('school_id', schoolId);
      }
      if (role) {
        query = query.eq('role', role);
      }

      // Order by name
      query = query.order('name', { ascending: true });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('[useTeachersPostgreSQL] Supabase query error:', fetchError);
        throw fetchError;
      }

      // Transform PostgreSQL data to match Firestore format
      const transformedTeachers: Teacher[] = (data || []).map(row => ({
        id: row.id,
        schoolId: row.school_id || 'default',
        name: row.name || '',
        email: row.email || '',
        contactNumber: row.contact_number,
        assignments: row.assignments || [],
        role: row.role || 'teacher',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      // Update cache
      queryCache.set(cacheKey, { data: transformedTeachers, timestamp: Date.now() });

      setTeachers(transformedTeachers);
      setLoading(false);
    } catch (err) {
      console.error('[useTeachersPostgreSQL] Error fetching teachers:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch teachers'));
      setLoading(false);
    }
  }, [schoolId, role]);

  // Initial fetch
  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // Real-time subscription
  useEffect(() => {
    if (!enableRealtime) return;

    let channel: RealtimeChannel | null = null;

    const setupRealtime = async () => {
      channel = supabase
        .channel('teachers_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'teachers',
            filter: schoolId && schoolId !== 'default' ? `school_id=eq.${schoolId}` : undefined
          },
          (payload) => {
            fetchTeachers(); // Refetch on any change
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [enableRealtime, schoolId, fetchTeachers]);

  // Create teacher
  const createTeacher = useCallback(async (teacherData: Partial<Teacher>): Promise<Teacher> => {
    try {
      // Get school_id
      let actualSchoolId = teacherData.schoolId;
      if (!actualSchoolId || actualSchoolId === 'default') {
        const { data: schoolData } = await supabase
          .from('schools')
          .select('id')
          .limit(1)
          .single();
        actualSchoolId = schoolData?.id || 'default';
      }

      const insertData = {
        school_id: actualSchoolId,
        name: teacherData.name || '',
        email: teacherData.email || '',
        contact_number: teacherData.contactNumber,
        assignments: teacherData.assignments || [],
        role: teacherData.role || 'teacher',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('teachers')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[useTeachersPostgreSQL] Create error:', error);
        throw error;
      }

      // Clear cache
      queryCache.clear();

      // Refetch to update state
      await fetchTeachers();

      return {
        id: data.id,
        schoolId: data.school_id,
        name: data.name,
        email: data.email,
        contactNumber: data.contact_number,
        assignments: data.assignments || [],
        role: data.role,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (err) {
      console.error('[useTeachersPostgreSQL] Create teacher error:', err);
      throw err;
    }
  }, [fetchTeachers]);

  // Update teacher
  const updateTeacher = useCallback(async (id: string, updates: Partial<Teacher>): Promise<void> => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.contactNumber !== undefined) {
        updateData.contact_number = updates.contactNumber;
      }
      if (updates.assignments !== undefined) updateData.assignments = updates.assignments;
      if (updates.role !== undefined) updateData.role = updates.role;

      const { error } = await supabase
        .from('teachers')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('[useTeachersPostgreSQL] Update error:', error);
        throw error;
      }

      // Clear cache
      queryCache.clear();

      // Refetch to update state
      await fetchTeachers();
    } catch (err) {
      console.error('[useTeachersPostgreSQL] Update teacher error:', err);
      throw err;
    }
  }, [fetchTeachers]);

  // Delete teacher
  const deleteTeacher = useCallback(async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useTeachersPostgreSQL] Delete error:', error);
        throw error;
      }

      // Clear cache
      queryCache.clear();

      // Refetch to update state
      await fetchTeachers();
    } catch (err) {
      console.error('[useTeachersPostgreSQL] Delete teacher error:', err);
      throw err;
    }
  }, [fetchTeachers]);

  // Search teachers
  const searchTeachers = useCallback(async (query: string): Promise<Teacher[]> => {
    try {
      if (!query.trim()) {
        return teachers;
      }

      const searchTerm = `%${query.toLowerCase()}%`;
      
      let searchQuery = supabase
        .from('teachers')
        .select('*')
        .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},contact_number.ilike.${searchTerm}`);

      if (schoolId && schoolId !== 'default') {
        searchQuery = searchQuery.eq('school_id', schoolId);
      }

      const { data, error } = await searchQuery.order('name', { ascending: true });

      if (error) {
        console.error('[useTeachersPostgreSQL] Search error:', error);
        throw error;
      }

      return (data || []).map(row => ({
        id: row.id,
        schoolId: row.school_id || 'default',
        name: row.name || '',
        email: row.email || '',
        contactNumber: row.contact_number,
        assignments: row.assignments || [],
        role: row.role || 'teacher',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (err) {
      console.error('[useTeachersPostgreSQL] Search teachers error:', err);
      throw err;
    }
  }, [teachers, schoolId]);

  return {
    teachers,
    loading,
    error,
    refetch: fetchTeachers,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    searchTeachers
  };
}
