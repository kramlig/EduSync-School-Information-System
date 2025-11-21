/**
 * PostgreSQL Hook: Attendance Records
 * Fetches attendance data from Supabase PostgreSQL
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface AttendanceRecord {
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
    // Skip if schoolId is not a valid UUID (e.g., "default")
    if (!options.schoolId || options.schoolId === 'default') {
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
        
        // Add limit for performance (fetch only current school year)
        // For bulk fetching without filters, limit to recent 3 months
        if (!options.studentId && !options.sectionId && !options.startDate) {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          query = query.gte('date', threeMonthsAgo.toISOString().split('T')[0]);
        }

        const { data, error: fetchError } = await query;
        
        if (fetchError) {
          console.error('[useAttendancePostgreSQL] Error fetching attendance:', fetchError);
          throw fetchError;
        }

        if (!isMounted) return;

        // Transform to camelCase
        const transformedRecords: AttendanceRecord[] = (data || []).map((row: any) => ({
          id: row.id,
          schoolId: row.school_id,
          studentId: row.student_id,
          sectionId: row.section_id,
          date: row.date,
          status: row.status,
          remarks: row.remarks,
          recordedBy: row.recorded_by,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));

        setAttendanceRecords(transformedRecords);
        
      } catch (err) {
        console.error('[useAttendancePostgreSQL] Error:', err);
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
        (payload) => {
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

  return {
    attendanceRecords,
    loading,
    error,
    refetch
  };
}
