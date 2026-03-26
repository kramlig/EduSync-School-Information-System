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
  placeOfBirth?: string;
  gradeLevel?: number | string;
  sectionId?: string;
  sectionName?: string; // Populated from join
  enrollmentStatus?: 'enrolled' | 'transferred' | 'dropped' | 'graduated'; // Match DB column name
  photoURL?: string;
  photoPath?: string;
  photoUploadedAt?: string;
  
  // Contact info
  address?: string;
  barangay?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  contactNumber?: string;
  email?: string;
  
  // Guardian info
  guardianName?: string;
  guardianRelationship?: string;
  guardianContactNumber?: string;
  guardianEmail?: string;
  guardianOccupation?: string;
  guardianAddress?: string;
  
  // Additional DepEd fields
  religion?: string;
  nationality?: string;
  motherTongue?: string;
  indigenousPeople?: string;
  fourPsBeneficiary?: boolean;
  
  // Academic history
  enrollmentDate?: string;
  previousSchool?: string;
  previousSchoolAddress?: string;
  yearLastAttended?: string;
  
  // Health info
  bloodType?: string;
  healthNotes?: string;
  specialNeeds?: string;
  
  // Other
  remarks?: string;
  
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
  forceRefetch: () => Promise<void>; // Clears cache first, use after updates
  createStudent: (student: Partial<Student>) => Promise<Student>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  searchStudents: (query: string) => Promise<Student[]>;
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

      // Fetching students - select ALL columns for complete data
      let query = supabase.from('students').select(
        includeSection 
          ? '*, sections(name)'
          : '*',
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
        placeOfBirth: row.place_of_birth || undefined,
        gradeLevel: row.grade_level,
        sectionId: row.section_id || undefined,
        sectionName: row.sections?.name || undefined,
        enrollmentStatus: row.enrollment_status || 'enrolled',
        
        // Photo fields
        photoURL: row.photo_url || undefined,
        photoPath: row.photo_path || undefined,
        photoUploadedAt: row.photo_uploaded_at || undefined,
        
        // Contact info
        address: row.address || undefined,
        barangay: row.barangay || undefined,
        city: row.city || undefined,
        province: row.province || undefined,
        zipCode: row.zip_code || undefined,
        contactNumber: row.contact_number || undefined,
        email: row.email || undefined,
        
        // Guardian info
        guardianName: row.guardian_name || undefined,
        guardianRelationship: row.guardian_relationship || undefined,
        guardianContactNumber: row.guardian_contact_number || undefined,
        guardianEmail: row.guardian_email || undefined,
        guardianOccupation: row.guardian_occupation || undefined,
        guardianAddress: row.guardian_address || undefined,
        
        // DepEd fields
        religion: row.religion || undefined,
        nationality: row.nationality || undefined,
        motherTongue: row.mother_tongue || undefined,
        indigenousPeople: row.indigenous_people ? 'Yes' : undefined, // BOOLEAN → string
        fourPsBeneficiary: row.four_ps_beneficiary || false,
        
        // Academic history
        enrollmentDate: row.enrollment_date || undefined,
        previousSchool: row.previous_school || undefined,
        previousSchoolAddress: row.previous_school_address || undefined,
        yearLastAttended: row.year_last_attended || undefined,
        
        // Health info
        bloodType: row.blood_type || undefined,
        healthNotes: row.health_notes || undefined,
        specialNeeds: row.special_needs || undefined,
        
        // Other
        remarks: row.remarks || undefined,
        
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
        date_of_birth: studentData.dateOfBirth || '2000-01-01',
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
      // Basic Info
      if (updates.schoolId !== undefined) updateData.school_id = updates.schoolId;
      if (updates.lrn !== undefined) updateData.lrn = updates.lrn;
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
      if (updates.middleName !== undefined) updateData.middle_name = updates.middleName;
      if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
      if (updates.suffix !== undefined) updateData.suffix = updates.suffix;
      if (updates.sex !== undefined) updateData.gender = updates.sex;
      if (updates.dateOfBirth !== undefined) updateData.date_of_birth = updates.dateOfBirth;
      if (updates.placeOfBirth !== undefined) updateData.place_of_birth = updates.placeOfBirth;
      if (updates.gradeLevel !== undefined) updateData.grade_level = updates.gradeLevel;
      if (updates.sectionId !== undefined) updateData.section_id = updates.sectionId;
      if (updates.enrollmentStatus !== undefined) updateData.enrollment_status = updates.enrollmentStatus;
      
      // Photo fields
      if (updates.photoURL !== undefined) updateData.photo_url = updates.photoURL;
      if (updates.photoPath !== undefined) updateData.photo_path = updates.photoPath;
      if (updates.photoUploadedAt !== undefined) updateData.photo_uploaded_at = updates.photoUploadedAt;
      
      // Contact Info
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.barangay !== undefined) updateData.barangay = updates.barangay;
      if (updates.city !== undefined) updateData.city = updates.city;
      if (updates.province !== undefined) updateData.province = updates.province;
      if (updates.zipCode !== undefined) updateData.zip_code = updates.zipCode;
      if (updates.contactNumber !== undefined) updateData.contact_number = updates.contactNumber;
      if (updates.email !== undefined) updateData.email = updates.email;
      
      // Guardian Info
      if (updates.guardianName !== undefined) updateData.guardian_name = updates.guardianName;
      if (updates.guardianRelationship !== undefined) updateData.guardian_relationship = updates.guardianRelationship;
      if (updates.guardianContactNumber !== undefined) updateData.guardian_contact_number = updates.guardianContactNumber;
      if (updates.guardianEmail !== undefined) updateData.guardian_email = updates.guardianEmail;
      if (updates.guardianOccupation !== undefined) updateData.guardian_occupation = updates.guardianOccupation;
      if (updates.guardianAddress !== undefined) updateData.guardian_address = updates.guardianAddress;
      
      // DepEd fields
      if (updates.religion !== undefined) updateData.religion = updates.religion;
      if (updates.nationality !== undefined) updateData.nationality = updates.nationality;
      if (updates.motherTongue !== undefined) updateData.mother_tongue = updates.motherTongue;
      if (updates.indigenousPeople !== undefined) {
        updateData.indigenous_people = updates.indigenousPeople === 'Yes';
      }
      if (updates.fourPsBeneficiary !== undefined) updateData.four_ps_beneficiary = updates.fourPsBeneficiary;
      
      // Academic History
      if (updates.enrollmentDate !== undefined) updateData.enrollment_date = updates.enrollmentDate;
      if (updates.previousSchool !== undefined) updateData.previous_school = updates.previousSchool;
      if (updates.previousSchoolAddress !== undefined) updateData.previous_school_address = updates.previousSchoolAddress;
      if (updates.yearLastAttended !== undefined) updateData.year_last_attended = updates.yearLastAttended;
      
      // Health Info
      if (updates.bloodType !== undefined) updateData.blood_type = updates.bloodType;
      if (updates.healthNotes !== undefined) updateData.health_notes = updates.healthNotes;
      if (updates.specialNeeds !== undefined) updateData.special_needs = updates.specialNeeds;
      
      // Other
      if (updates.remarks !== undefined) updateData.remarks = updates.remarks;
      
      // Always update the updated_at timestamp
      updateData.updated_at = new Date().toISOString();

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

  // Search students by name or LRN
  const searchStudents = useCallback(async (query: string): Promise<Student[]> => {
    if (!query.trim()) return [];
    
    try {
      let dbQuery = supabase
        .from('students')
        .select('*')
        .or(`name.ilike.%${query}%,lrn.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .eq('enrollment_status', 'enrolled')
        .is('deleted_at', null)
        .limit(50);
      
      if (schoolId) {
        dbQuery = dbQuery.eq('school_id', schoolId);
      }

      const { data, error: searchError } = await dbQuery;

      if (searchError) throw searchError;

      // Transform to Student type
      return (data || []).map((row: any) => ({
        id: row.id,
        schoolId: row.school_id,
        lrn: row.lrn || '',
        name: row.name || `${row.first_name || ''} ${row.middle_name || ''} ${row.last_name || ''}`.trim(),
        firstName: row.first_name || '',
        middleName: row.middle_name,
        lastName: row.last_name || '',
        suffix: row.suffix,
        sex: row.gender,
        dateOfBirth: row.date_of_birth,
        placeOfBirth: row.place_of_birth,
        gradeLevel: row.grade_level,
        sectionId: row.section_id,
        enrollmentStatus: row.enrollment_status,
        photoURL: row.photo_url,
        photoPath: row.photo_path,
        photoUploadedAt: row.photo_uploaded_at,
        address: row.address,
        barangay: row.barangay,
        city: row.city,
        province: row.province,
        zipCode: row.zip_code,
        contactNumber: row.contact_number,
        email: row.email,
        guardianName: row.guardian_name,
        guardianRelationship: row.guardian_relationship,
        guardianContactNumber: row.guardian_contact_number,
        guardianEmail: row.guardian_email,
        guardianOccupation: row.guardian_occupation,
        guardianAddress: row.guardian_address,
        religion: row.religion,
        nationality: row.nationality,
        motherTongue: row.mother_tongue,
        indigenousPeople: row.indigenous_people ? 'Yes' : 'No',
        fourPsBeneficiary: row.four_ps_beneficiary,
        enrollmentDate: row.enrollment_date,
        previousSchool: row.previous_school,
        previousSchoolAddress: row.previous_school_address,
        yearLastAttended: row.year_last_attended,
        bloodType: row.blood_type,
        healthNotes: row.health_notes,
        specialNeeds: row.special_needs,
        remarks: row.remarks,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (err) {
      console.error('[useStudentsPostgreSQL] Error searching students:', err);
      return [];
    }
  }, [schoolId]);

  // Force refetch - clears cache first then fetches fresh data
  const forceRefetch = useCallback(async () => {
    queryCache.clear();
    await fetchStudents();
  }, [fetchStudents]);

  return {
    students,
    loading,
    error,
    refetch: fetchStudents,
    forceRefetch, // Use this after updates for guaranteed fresh data
    createStudent: createStudent as (studentData: Partial<Student>) => Promise<Student>,
    updateStudent,
    deleteStudent,
    searchStudents,
    totalCount
  };
}

export default useStudentsPostgreSQL;
