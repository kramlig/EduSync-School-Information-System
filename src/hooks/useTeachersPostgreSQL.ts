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
  gradeLevel: string | number; // Can be 'grade_1' or 1 depending on source
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
  firebaseUid?: string; // Firebase Auth UID for matching logged-in users
  assignments?: TeacherAssignment[];
  role: 'admin' | 'teacher' | 'principal' | 'registrar' | 'superadmin';
  
  // Metadata
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface UseTeachersOptions {
  schoolId?: string;
  role?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
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
  assignLearningAreaToTeacher: (teacherId: string, assignment: { gradeLevel: string; learningAreaId: string }) => Promise<void>;
  unassignLearningAreaFromTeacher: (teacherId: string, assignmentIndex: number) => Promise<void>;
  totalCount: number;
}

// Query cache with TTL
const queryCache = new Map<string, { data: Teacher[]; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds

export function useTeachersPostgreSQL(options: UseTeachersOptions = {}): UseTeachersReturn {
  const { 
    schoolId, 
    role,
    searchQuery,
    limit,
    offset,
    enableRealtime = false
  } = options;
  
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Generate cache key from query parameters
      const cacheKey = JSON.stringify({ schoolId, role, searchQuery, limit, offset });
      
      // Check cache first (only for non-paginated queries)
      if (!limit && !offset) {
        const cached = queryCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
          setTeachers(cached.data);
          setLoading(false);
          return;
        }
      }

      let query = supabase.from('teachers').select('*', { count: 'exact' }).is('deleted_at', null);

      // Apply filters
      if (schoolId && schoolId !== 'default') {
        query = query.eq('school_id', schoolId);
      }
      if (role) {
        query = query.eq('role', role);
      }
      if (searchQuery) {
        // Search by name, email, or contact number (case-insensitive)
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,contact_number.ilike.%${searchQuery}%`);
      }

      // Order by name
      query = query.order('name', { ascending: true });

      // Apply pagination if specified
      if (limit !== undefined) {
        query = query.limit(limit);
      }
      if (offset !== undefined) {
        query = query.range(offset, offset + (limit || 1000) - 1);
      }

      const { data, error: fetchError, count } = await query;

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
        firebaseUid: row.firebase_uid, // Add Firebase UID for auth matching
        assignments: row.assignments || [],
        role: row.role || 'teacher',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      setTeachers(transformedTeachers);
      setTotalCount(count || 0);

      // Update cache (only for non-paginated queries)
      if (!limit && !offset) {
        queryCache.set(cacheKey, { data: transformedTeachers, timestamp: Date.now() });
      }

      setLoading(false);
    } catch (err) {
      console.error('[useTeachersPostgreSQL] Error fetching teachers:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch teachers'));
      setLoading(false);
    }
  }, [schoolId, role, searchQuery, limit, offset]);

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

  // Assign learning area to teacher
  const assignLearningAreaToTeacher = useCallback(async (
    teacherId: string, 
    assignment: { gradeLevel: string; learningAreaId: string }
  ) => {
    try {
      // First, fetch the current teacher data
      const { data: currentTeacher, error: fetchError } = await supabase
        .from('teachers')
        .select('assignments')
        .eq('id', teacherId)
        .single();

      if (fetchError) {
        console.error('[useTeachersPostgreSQL] Fetch teacher error:', fetchError);
        throw fetchError;
      }

      // Add new assignment to existing assignments
      const currentAssignments = currentTeacher?.assignments || [];
      const updatedAssignments = [...currentAssignments, assignment];

      // Update teacher with new assignments array
      const { error: updateError } = await supabase
        .from('teachers')
        .update({ 
          assignments: updatedAssignments,
          updated_at: new Date().toISOString()
        })
        .eq('id', teacherId);

      if (updateError) {
        console.error('[useTeachersPostgreSQL] Assign learning area error:', updateError);
        throw updateError;
      }

      // Clear cache and refetch
      queryCache.clear();
      await fetchTeachers();
    } catch (err) {
      console.error('[useTeachersPostgreSQL] Assign learning area error:', err);
      throw err;
    }
  }, [fetchTeachers]);

  // Unassign learning area from teacher
  const unassignLearningAreaFromTeacher = useCallback(async (
    teacherId: string,
    assignmentIndex: number
  ) => {
    try {
      // First, fetch the current teacher data
      const { data: currentTeacher, error: fetchError } = await supabase
        .from('teachers')
        .select('assignments')
        .eq('id', teacherId)
        .single();

      if (fetchError) {
        console.error('[useTeachersPostgreSQL] Fetch teacher error:', fetchError);
        throw fetchError;
      }

      // Remove assignment at specified index
      const currentAssignments = currentTeacher?.assignments || [];
      const updatedAssignments = currentAssignments.filter((_: any, index: number) => index !== assignmentIndex);

      // Update teacher with updated assignments array
      const { error: updateError } = await supabase
        .from('teachers')
        .update({ 
          assignments: updatedAssignments,
          updated_at: new Date().toISOString()
        })
        .eq('id', teacherId);

      if (updateError) {
        console.error('[useTeachersPostgreSQL] Unassign learning area error:', updateError);
        throw updateError;
      }

      // Clear cache and refetch
      queryCache.clear();
      await fetchTeachers();
    } catch (err) {
      console.error('[useTeachersPostgreSQL] Unassign learning area error:', err);
      throw err;
    }
  }, [fetchTeachers]);

  return {
    teachers,
    loading,
    error,
    refetch: fetchTeachers,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    searchTeachers,
    assignLearningAreaToTeacher,
    unassignLearningAreaFromTeacher,
    totalCount
  };
}
