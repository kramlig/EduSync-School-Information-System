/**
 * PostgreSQL Hook: Attendance Records
 * Fetches attendance data from Supabase PostgreSQL
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
          console.error('[useAttendancePostgreSQL] Error fetching attendance:', fetchError);
          throw fetchError;
        }

        if (!isMounted) return;

        // Transform PostgreSQL rows to Firestore-compatible structure
        // Group by studentId and build dailyStatus object
        const studentAttendanceMap = new Map<string, AttendanceRecord>();
        
        console.log('[useAttendancePostgreSQL] Transforming data:', {
          rowCount: (data || []).length,
          sampleRow: data?.[0]
        });
        
        (data || []).forEach((row: any) => {
          const studentId = row.student_id;
          // Normalize date to YYYY-MM-DD format (PostgreSQL may return ISO string)
          const rawDate = row.date;
          const date = typeof rawDate === 'string' && rawDate.includes('T') 
            ? rawDate.split('T')[0]  // Extract YYYY-MM-DD from ISO timestamp
            : rawDate;
          
          const statusMap: Record<string, 'P' | 'A' | 'L' | 'E'> = {
            'Present': 'P',
            'Absent': 'A',
            'Late': 'L',
            'Excused': 'E'
          };
          const status = statusMap[row.status] || 'A';
          
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
        
        console.log('[useAttendancePostgreSQL] Transformation complete:', {
          recordCount: transformedRecords.length,
          sampleRecord: transformedRecords[0],
          sampleDailyStatusKeys: transformedRecords[0] ? Object.keys(transformedRecords[0].dailyStatus).slice(0, 5) : []
        });
        
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
