/**
 * PostgreSQL Hook: Attendance Records
 * Fetches and manages attendance data from Supabase PostgreSQL
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Status mapper: Firestore shorthand -> PostgreSQL enum
const STATUS_MAP: Record<string, string> = {
  'P': 'Present',
  'A': 'Absent',
  'L': 'Late',
  'E': 'Excused',
  // Also support full names (case-insensitive)
  'present': 'Present',
  'absent': 'Absent',
  'late': 'Late',
  'excused': 'Excused'
};

// Reverse mapper: PostgreSQL enum -> Firestore shorthand
const STATUS_REVERSE_MAP: Record<string, string> = {
  'Present': 'P',
  'Absent': 'A',
  'Late': 'L',
  'Excused': 'E'
};

const mapStatusToPostgres = (status: string): string => {
  return STATUS_MAP[status] || STATUS_MAP[status.toLowerCase()] || 'Present';
};

const mapStatusToFirestore = (status: string): string => {
  return STATUS_REVERSE_MAP[status] || status;
};

// PostgreSQL row structure
interface AttendanceRow {
  id: string;
  schoolId: string;
  studentId: string;
  sectionId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  remarks?: string;
  recordedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Firestore-compatible structure (expected by SF2Dashboard)
export interface AttendanceRecord {
  schoolId: string;
  studentId: string;
  dailyStatus: Record<string, 'P' | 'A' | 'L' | 'E'>; // "YYYY-MM-DD": "P"
}

interface UseAttendanceOptions {
  schoolId: string;
  studentId?: string;
  sectionId?: string;
  startDate?: string;
  endDate?: string;
}

export function useAttendancePostgreSQL(options: UseAttendanceOptions) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Expose refetch function
  const refetch = () => setRefetchTrigger(prev => prev + 1);

  useEffect(() => {
    if (!options.schoolId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query
        let query = supabase
          .from('attendance_records')
          .select('*')
          .eq('school_id', options.schoolId)
          .order('date', { ascending: false });

        // Apply filters
        if (options.studentId) {
          query = query.eq('student_id', options.studentId);
        }
        if (options.sectionId) {
          query = query.eq('section_id', options.sectionId);
        }
        if (options.startDate) {
          query = query.gte('date', options.startDate);
        }
        if (options.endDate) {
          query = query.lte('date', options.endDate);
        }
        
        // REMOVED: Automatic 3-month filter - let caller decide date range
        
        const { data, error: fetchError } = await query;
        
        if (fetchError) {
          throw fetchError;
        }

        if (!isMounted) return;

        // Transform PostgreSQL rows to Firestore-compatible structure
        // Group by studentId and build dailyStatus object
        const studentAttendanceMap = new Map<string, AttendanceRecord>();
        
        (data || []).forEach((row: any) => {
          const studentId = row.student_id;
          // Normalize date to YYYY-MM-DD format (PostgreSQL may return ISO string)
          const rawDate = row.date;
          const date = typeof rawDate === 'string' && rawDate.includes('T') 
            ? rawDate.split('T')[0]  // Extract YYYY-MM-DD from ISO timestamp
            : rawDate;
          
          const status = mapStatusToFirestore(row.status);
          
          if (!studentAttendanceMap.has(studentId)) {
            studentAttendanceMap.set(studentId, {
              schoolId: row.school_id,
              studentId: studentId,
              dailyStatus: {}
            });
          }
          
          const record = studentAttendanceMap.get(studentId)!;
          record.dailyStatus[date] = status;
        });

        const transformedRecords = Array.from(studentAttendanceMap.values());
        
        setAttendanceRecords(transformedRecords);
        
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Set up real-time subscription
    const subscription = supabase
      .channel('attendance_records_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `school_id=eq.${options.schoolId}`
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [
    options.schoolId,
    options.studentId,
    options.sectionId,
    options.startDate,
    options.endDate,
    refetchTrigger
  ]);

  /**
   * Add or update attendance record (UPSERT operation)
   * Handles both new records and updates to existing ones
   */
  const updateAttendance = useCallback(async (
    studentId: string,
    date: string,
    status: string,
    remarks?: string
  ): Promise<void> => {
    if (!options.schoolId) {
      throw new Error('School ID is required to update attendance');
    }

    // Fetch student's section_id from the database
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('section_id')
      .eq('id', studentId)
      .single();

    if (studentError || !studentData?.section_id) {
      throw new Error(`Student ${studentId} has no section assigned or not found`);
    }

    const attendanceData = {
      school_id: options.schoolId,
      student_id: studentId,
      section_id: studentData.section_id,
      date,
      status: mapStatusToPostgres(status),
      remarks: remarks || null,
      recorded_by: null, // Will be set by backend trigger or app logic
      updated_at: new Date().toISOString()
    };

    // Upsert: Insert new or update existing based on unique constraint (student_id, date)
    // Schema has UNIQUE(student_id, date) constraint
    const { error: upsertError } = await supabase
      .from('attendance_records')
      .upsert(attendanceData, {
        onConflict: 'student_id,date'
      });

    if (upsertError) {
      throw new Error(`Failed to update attendance: ${upsertError.message}`);
    }

    // Don't refetch - rely on real-time subscription for smoother UX
  }, [options.schoolId]);

  /**
   * Add new attendance record
   * If sectionId not provided, fetches from student record
   */
  const addAttendance = useCallback(async (
    studentId: string,
    date: string,
    status: string,
    sectionId?: string,
    remarks?: string
  ): Promise<void> => {
    if (!options.schoolId) {
      throw new Error('School ID is required to add attendance');
    }

    let finalSectionId = sectionId;

    // If sectionId not provided, fetch from student record
    if (!finalSectionId) {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('section_id')
        .eq('id', studentId)
        .single();

      if (studentError || !studentData?.section_id) {
        throw new Error(`Student ${studentId} has no section assigned or not found`);
      }

      finalSectionId = studentData.section_id;
    }

    const attendanceData = {
      school_id: options.schoolId,
      student_id: studentId,
      section_id: finalSectionId,
      date,
      status: mapStatusToPostgres(status),
      remarks: remarks || null,
      recorded_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('attendance_records')
      .insert(attendanceData);

    if (insertError) {
      throw new Error(`Failed to add attendance: ${insertError.message}`);
    }

    // Don't refetch - rely on real-time subscription
  }, [options.schoolId]);

  /**
   * Delete attendance record by student ID and date
   */
  const deleteAttendance = useCallback(async (
    studentId: string,
    date: string
  ): Promise<void> => {
    if (!options.schoolId) {
      throw new Error('School ID is required to delete attendance');
    }

    const { error: deleteError } = await supabase
      .from('attendance_records')
      .delete()
      .eq('school_id', options.schoolId)
      .eq('student_id', studentId)
      .eq('date', date);

    if (deleteError) {
      throw new Error(`Failed to delete attendance: ${deleteError.message}`);
    }

    // Don't refetch - rely on real-time subscription
  }, [options.schoolId]);

  return {
    attendanceRecords,
    loading,
    error,
    refetch,
    updateAttendance,
    addAttendance,
    deleteAttendance
  };
}
