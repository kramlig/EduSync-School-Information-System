/**
 * useParentsPostgreSQL Hook
 * 
 * Provides parent data fetching and CRUD operations using PostgreSQL via Supabase.
 * Designed to replace Firestore parent queries during migration.
 * 
 * Features:
 * - Real-time parent subscriptions
 * - Parent search by name, email
 * - CRUD operations (create, update, delete)
 * - Student relationship management (assign/unassign)
 * - Child count and student loading
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Query result cache (shared across all hook instances)
const queryCache = new Map<string, { data: Parent[]; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds cache

// Type definitions (matching Firestore Parent type)
interface Parent {
  id: string;
  schoolId: string;
  userId?: string; // Optional link to Firebase Auth user
  name: string;
  email?: string;
  relationship?: string; // Mother, Father, Guardian
  occupation?: string;
  contactNumber?: string;
  address?: string;
  studentIds: string[]; // Array of student IDs (computed from parent_students junction table)
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface UseParentsOptions {
  schoolId?: string;
  searchQuery?: string;
  studentId?: string; // Filter parents by student
  limit?: number;
  offset?: number;
}

interface UseParentsReturn {
  parents: Parent[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createParent: (parent: Partial<Parent>) => Promise<Parent>;
  updateParent: (id: string, updates: Partial<Parent>) => Promise<void>;
  deleteParent: (id: string) => Promise<void>;
  assignStudentToParent: (parentId: string, studentId: string, relationship?: string) => Promise<void>;
  unassignStudentFromParent: (parentId: string, studentId: string) => Promise<void>;
  totalCount: number;
}

export function useParentsPostgreSQL(options: UseParentsOptions = {}): UseParentsReturn {
  const { 
    schoolId, 
    searchQuery,
    studentId,
    limit,
    offset
  } = options;
  
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchParents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Generate cache key from query parameters
      const cacheKey = JSON.stringify({ schoolId, searchQuery, studentId, limit, offset });
      
      // Check cache first
      if (!limit && !offset) {
        const cached = queryCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          setParents(cached.data);
          setLoading(false);
          return;
        }
      }

      // Fetch parents with student relationships
      let query = supabase.from('parents').select(
        `
          id,
          school_id,
          user_id,
          name,
          email,
          relationship,
          occupation,
          contact_number,
          address,
          created_at,
          updated_at,
          parent_students(student_id)
        `,
        { count: 'exact' }
      ).is('deleted_at', null); // Soft delete filter

      // Apply filters
      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }
      if (searchQuery) {
        // Search by name or email (case-insensitive)
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      if (studentId) {
        // Filter by student ID through junction table
        query = query.eq('parent_students.student_id', studentId);
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

      if (fetchError) throw fetchError;

      // Transform data to match Firestore format
      const transformedParents: Parent[] = (data || []).map((row: any) => ({
        id: row.id,
        schoolId: row.school_id,
        userId: row.user_id,
        name: row.name,
        email: row.email,
        relationship: row.relationship,
        occupation: row.occupation,
        contactNumber: row.contact_number,
        address: row.address,
        studentIds: row.parent_students?.map((ps: any) => ps.student_id) || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      setParents(transformedParents);
      setTotalCount(count || 0);

      // Cache the results
      if (!limit && !offset) {
        queryCache.set(cacheKey, { data: transformedParents, timestamp: Date.now() });
      }

    } catch (err) {
      console.error('[useParentsPostgreSQL] Fetch error:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [schoolId, searchQuery, studentId, limit, offset]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  // Real-time subscription
  useEffect(() => {
    if (!schoolId) return;

    const channel: RealtimeChannel = supabase
      .channel(`parents:${schoolId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parents',
          filter: `school_id=eq.${schoolId}`
        },
        (payload) => {
          console.log('[useParentsPostgreSQL] Real-time update:', payload);
          // Clear cache and refetch
          queryCache.clear();
          fetchParents();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [schoolId, fetchParents]);

  // Create parent
  const createParent = useCallback(async (parentData: Partial<Parent>): Promise<Parent> => {
    try {
      // Extract studentIds separately (not a DB column)
      const { studentIds, ...dbData } = parentData;

      // Insert parent
      const { data, error } = await supabase
        .from('parents')
        .insert([{
          school_id: dbData.schoolId || schoolId,
          user_id: dbData.userId,
          name: dbData.name,
          email: dbData.email,
          relationship: dbData.relationship,
          occupation: dbData.occupation,
          contact_number: dbData.contactNumber,
          address: dbData.address,
        }])
        .select()
        .single();

      if (error) throw error;

      const newParent: Parent = {
        id: data.id,
        schoolId: data.school_id,
        userId: data.user_id,
        name: data.name,
        email: data.email,
        relationship: data.relationship,
        occupation: data.occupation,
        contactNumber: data.contact_number,
        address: data.address,
        studentIds: [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      // Assign students if provided
      if (studentIds && studentIds.length > 0) {
        for (const studentId of studentIds) {
          await assignStudentToParent(data.id, studentId);
        }
        newParent.studentIds = studentIds;
      }

      // Clear cache and refetch immediately
      queryCache.clear();
      
      // Small delay to ensure real-time subscription processes the insert
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await fetchParents();

      return newParent;
    } catch (err) {
      console.error('[useParentsPostgreSQL] Create error:', err);
      throw err;
    }
  }, [schoolId, fetchParents]);

  // Update parent
  const updateParent = useCallback(async (id: string, updates: Partial<Parent>): Promise<void> => {
    try {
      // Extract studentIds separately (managed via junction table)
      const { studentIds, ...dbUpdates } = updates || {};

      // Build update object with only provided fields
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      
      if (dbUpdates.name !== undefined) updateData.name = dbUpdates.name;
      if (dbUpdates.email !== undefined) updateData.email = dbUpdates.email;
      if (dbUpdates.relationship !== undefined) updateData.relationship = dbUpdates.relationship;
      if (dbUpdates.occupation !== undefined) updateData.occupation = dbUpdates.occupation;
      if (dbUpdates.contactNumber !== undefined) updateData.contact_number = dbUpdates.contactNumber;
      if (dbUpdates.address !== undefined) updateData.address = dbUpdates.address;
      if (dbUpdates.notificationPreferences !== undefined) updateData.notification_preferences = dbUpdates.notificationPreferences;

      const { error } = await supabase
        .from('parents')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Clear cache and refetch
      queryCache.clear();
      await fetchParents();
    } catch (err) {
      console.error('[useParentsPostgreSQL] Update error:', err);
      throw err;
    }
  }, [fetchParents]);

  // Delete parent (soft delete)
  const deleteParent = useCallback(async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('parents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Clear cache and refetch
      queryCache.clear();
      await fetchParents();
    } catch (err) {
      console.error('[useParentsPostgreSQL] Delete error:', err);
      throw err;
    }
  }, [fetchParents]);

  // Assign student to parent
  const assignStudentToParent = useCallback(async (
    parentId: string, 
    studentId: string, 
    relationship?: string
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('parent_students')
        .insert([{
          parent_id: parentId,
          student_id: studentId,
          relationship: relationship,
          is_primary_contact: false,
        }]);

      if (error) throw error;

      // Clear cache and refetch
      queryCache.clear();
      await fetchParents();
    } catch (err) {
      console.error('[useParentsPostgreSQL] Assign student error:', err);
      throw err;
    }
  }, [fetchParents]);

  // Unassign student from parent
  const unassignStudentFromParent = useCallback(async (
    parentId: string, 
    studentId: string
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('parent_students')
        .delete()
        .eq('parent_id', parentId)
        .eq('student_id', studentId);

      if (error) throw error;

      // Clear cache and refetch
      queryCache.clear();
      await fetchParents();
    } catch (err) {
      console.error('[useParentsPostgreSQL] Unassign student error:', err);
      throw err;
    }
  }, [fetchParents]);

  return {
    parents,
    loading,
    error,
    refetch: fetchParents,
    createParent,
    updateParent,
    deleteParent,
    assignStudentToParent,
    unassignStudentFromParent,
    totalCount,
  };
}
