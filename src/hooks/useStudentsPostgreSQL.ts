/**
 * useStudentsPostgreSQL Hook
 * 
 * Provides student data fetching and CRUD operations using PostgreSQL via Supabase.
 * Designed to replace Firestore student queries during migration.
 * 
 * Features:
 * - Real-time student subscriptions
 * - Filtering by section, grade level
 * - Student search by name, LRN
 * - CRUD operations (create, update, delete)
 * - Section relationship loading
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Query result cache (shared across all hook instances)
const queryCache = new Map<string, { data: Student[]; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds cache

// Type definitions (matching Firestore Student type)
interface Student {
  id: string;
  schoolId: string;
  lrn: string;
  name: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  sex?: 'Male' | 'Female'; // Match global Student type
  dateOfBirth: Date | string;
  gradeLevel?: number | string;
  sectionId?: string;
  sectionName?: string; // Populated from join
  enrollmentStatus?: 'enrolled' | 'transferred' | 'dropped' | 'graduated'; // Match DB column name
  photoURL?: string;
  
  // Contact info
  address?: string;
  contactNumber?: string;
  email?: string;
  
  // Additional DepEd fields
  religion?: string;
  motherTongue?: string;
  indigenousPeople?: string;
  fourPsBeneficiary?: boolean;
  
  // Metadata
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface UseStudentsOptions {
  sectionId?: string;
  gradeLevel?: number | string;
  schoolId?: string;
  includeSection?: boolean; // Load section name via join
  searchQuery?: string;
  status?: 'enrolled' | 'transferred' | 'dropped' | 'graduated'; // Match actual DB column
  limit?: number; // Limit number of results (for pagination)
  offset?: number; // Skip first N results (for pagination)
}

interface UseStudentsReturn {
  students: Student[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createStudent: (student: Partial<Student>) => Promise<Student>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  totalCount: number; // Total number of students (for pagination)
}

export function useStudentsPostgreSQL(options: UseStudentsOptions = {}): UseStudentsReturn {
  const { 
    sectionId, 
    gradeLevel, 
    schoolId, 
    includeSection = false,
    searchQuery,
    status = 'enrolled', // Default to 'enrolled' to match DB
    limit,
    offset
  } = options;
  
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Generate cache key from query parameters
      const cacheKey = JSON.stringify({ sectionId, gradeLevel, schoolId, includeSection, searchQuery, status, limit, offset });
      
      // Check cache first (skip cache for paginated queries to ensure freshness)
      if (!limit && !offset) {
        const cached = queryCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          setStudents(cached.data);
          setLoading(false);
          return;
        }
      }

      // Fetching students with optimized single query

      let query = supabase.from('students').select(
        // Only select essential columns for better performance
        'id, school_id, lrn, name, first_name, middle_name, last_name, suffix, gender, date_of_birth, grade_level, section_id, enrollment_status, contact_number, email',
        { count: 'exact' } // Get count in same query
      );

      // Apply filters
      if (sectionId) {
        query = query.eq('section_id', sectionId);
      }
      if (gradeLevel !== undefined) {
        query = query.eq('grade_level', gradeLevel);
      }
      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }
      if (status) {
        query = query.eq('enrollment_status', status); // Use correct column name
      }
      if (searchQuery) {
        // Search by name or LRN (case-insensitive)
        query = query.or(`name.ilike.%${searchQuery}%,lrn.ilike.%${searchQuery}%`);
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
        throw fetchError;
      }

      // Set total count from single query
      setTotalCount(count || 0);

      // Transform PostgreSQL data to match Firestore Student interface
      const transformedStudents: Student[] = (data || []).map((row: any) => ({
        id: row.id,
        schoolId: row.school_id,
        lrn: row.lrn,
        name: row.name,
        firstName: row.first_name,
        middleName: row.middle_name || undefined,
        lastName: row.last_name,
        suffix: row.suffix || undefined,
        sex: row.gender, // Map DB 'gender' to Student 'sex'
        dateOfBirth: row.date_of_birth,
        gradeLevel: row.grade_level,
        sectionId: row.section_id || undefined,
        sectionName: row.sections?.name || undefined,
        enrollmentStatus: row.enrollment_status || 'enrolled',
        photoURL: undefined, // Not in DB yet
        
        // Contact info
        address: row.address || undefined,
        contactNumber: row.contact_number || undefined,
        email: row.email || undefined,
        
        // DepEd fields
        religion: row.religion || undefined,
        motherTongue: undefined, // Not in DB yet
        indigenousPeople: row.indigenous_people ? 'Yes' : undefined, // BOOLEAN → string
        fourPsBeneficiary: false, // Not in DB yet,
        
        // Metadata
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      setStudents(transformedStudents);
      
      // Update cache (only for non-paginated queries)
      if (!limit && !offset) {
        queryCache.set(cacheKey, { data: transformedStudents, timestamp: Date.now() });
      }
      
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [sectionId, gradeLevel, schoolId, includeSection, searchQuery, status, limit, offset]);

  // Initial fetch
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Real-time subscriptions DISABLED for performance
  // Re-enable if you need live updates
  /*
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = () => {
      // Build filter based on options
      const filter: Record<string, any> = {};
      if (sectionId) filter.section_id = sectionId;
      if (gradeLevel !== undefined) filter.grade_level = gradeLevel;
      if (schoolId) filter.school_id = schoolId;
      if (status) filter.status = status;

      channel = supabase
        .channel('students-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'students',
            filter: Object.keys(filter).length > 0 
              ? Object.entries(filter).map(([k, v]) => `${k}=eq.${v}`).join(',')
              : undefined
          },
          () => {
            // Refetch to ensure data consistency
            fetchStudents();
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
  }, [sectionId, gradeLevel, schoolId, status, fetchStudents]);
  */

  // Create student
  const createStudent = useCallback(async (studentData: Partial<Student>, sections?: any[]): Promise<Student> => {
    try {
      const actualSchoolId = studentData.schoolId;

      // Parse full name into components if firstName/lastName not provided
      let firstName = studentData.firstName;
      let middleName = studentData.middleName;
      let lastName = studentData.lastName;
      
      if (!firstName && studentData.name) {
        const nameParts = studentData.name.trim().split(/\s+/);
        if (nameParts.length === 1) {
          firstName = nameParts[0];
          lastName = nameParts[0]; // Use same as first if only one word
        } else if (nameParts.length === 2) {
          firstName = nameParts[0];
          lastName = nameParts[1];
        } else {
          firstName = nameParts[0];
          middleName = nameParts.slice(1, -1).join(' ');
          lastName = nameParts[nameParts.length - 1];
        }
      }

      // Validate required fields
      if (!firstName) throw new Error('First name is required');
      if (!lastName) throw new Error('Last name is required');
      
      // Handle sex/gender field mapping (form uses 'sex', DB uses 'gender')
      const gender = studentData.sex;
      if (!gender) throw new Error('Gender is required');

      // Get grade level from section if not provided directly
      let gradeLevel = studentData.gradeLevel;
      if (!gradeLevel && studentData.sectionId && sections) {
        const section = sections.find((s: any) => s.id === studentData.sectionId);
        gradeLevel = section?.gradeLevel;
      }

      const insertData = {
        school_id: actualSchoolId,
        lrn: studentData.lrn || null,
        name: studentData.name || `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim(),
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        suffix: studentData.suffix || null,
        gender: gender,
        date_of_birth: studentData.dateOfBirth || null,
        grade_level: gradeLevel || null,
        section_id: studentData.sectionId || null,
        enrollment_status: studentData.enrollmentStatus || 'enrolled',
        address: studentData.address || null,
        contact_number: studentData.contactNumber || null,
        email: studentData.email || null,
        religion: studentData.religion || null,
        indigenous_people: studentData.indigenousPeople === 'Yes'
      };

      const { data, error: insertError } = await supabase
        .from('students')
        .insert([insertData])
        .select()
        .single();

      if (insertError) throw insertError;

      // Clear cache to force fresh data on next fetch
      queryCache.clear();

      // Transform back to Student type
      const newStudent: Student = {
        id: data.id,
        schoolId: data.school_id,
        lrn: data.lrn,
        name: data.name,
        firstName: data.first_name,
        middleName: data.middle_name,
        lastName: data.last_name,
        suffix: data.suffix,
        sex: data.gender,
        dateOfBirth: data.date_of_birth,
        gradeLevel: data.grade_level,
        sectionId: data.section_id,
        enrollmentStatus: data.enrollment_status,
        photoURL: undefined,
        address: data.address,
        contactNumber: data.contact_number,
        email: data.email,
        religion: data.religion,
        motherTongue: undefined,
        indigenousPeople: data.indigenous_people ? 'Yes' : undefined,
        fourPsBeneficiary: false,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      return newStudent;

    } catch (err) {
      console.error('[useStudentsPostgreSQL] Error creating student:', err);
      throw err;
    }
  }, []);

  // Update student
  const updateStudent = useCallback(async (id: string, updates: Partial<Student>): Promise<void> => {
    try {
      const updateData: Record<string, any> = {};
      
      // Map Student fields to PostgreSQL column names
      if (updates.schoolId !== undefined) updateData.school_id = updates.schoolId;
      if (updates.lrn !== undefined) updateData.lrn = updates.lrn;
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
      if (updates.middleName !== undefined) updateData.middle_name = updates.middleName;
      if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
      if (updates.suffix !== undefined) updateData.suffix = updates.suffix;
      // Handle sex field (form uses 'sex', DB uses 'gender')
      if (updates.sex !== undefined) updateData.gender = updates.sex;
      if (updates.dateOfBirth !== undefined) updateData.date_of_birth = updates.dateOfBirth;
      if (updates.gradeLevel !== undefined) updateData.grade_level = updates.gradeLevel;
      if (updates.sectionId !== undefined) updateData.section_id = updates.sectionId;
      if (updates.enrollmentStatus !== undefined) updateData.enrollment_status = updates.enrollmentStatus;
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.contactNumber !== undefined) updateData.contact_number = updates.contactNumber;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.religion !== undefined) updateData.religion = updates.religion;
      if (updates.indigenousPeople !== undefined) {
        updateData.indigenous_people = updates.indigenousPeople === 'Yes';
      }

      const { error: updateError } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      // Clear cache to force fresh data on next fetch
      queryCache.clear();


    } catch (err) {
      console.error('[useStudentsPostgreSQL] Error updating student:', err);
      throw err;
    }
  }, []);

  // Delete student (soft delete)
  const deleteStudent = useCallback(async (id: string): Promise<void> => {
    try {
      // Soft delete by setting enrollment_status to 'dropped'
      const { error: deleteError } = await supabase
        .from('students')
        .update({ enrollment_status: 'dropped', updated_at: new Date().toISOString() })
        .eq('id', id);

      // Clear cache to force fresh data on next fetch
      queryCache.clear();

      if (deleteError) throw deleteError;


    } catch (err) {
      console.error('[useStudentsPostgreSQL] Error deleting student:', err);
      throw err;
    }
  }, []);

  return {
    students,
    loading,
    error,
    refetch: fetchStudents,
    createStudent: createStudent as (studentData: Partial<Student>) => Promise<Student>,
    updateStudent,
    deleteStudent,
    totalCount
  };
}

export default useStudentsPostgreSQL;
