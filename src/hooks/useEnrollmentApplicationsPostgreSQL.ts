/**
 * useEnrollmentApplicationsPostgreSQL.ts
 * 
 * PostgreSQL hook for managing enrollment applications
 * Handles parent/guardian submissions, admin review workflow, and student enrollment
 * 
 * Created: December 2, 2025
 * Migration: Day 22 - Enrollment Applications Module
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { EnrollmentApplication } from '../../types';

// ============================================================================
// Types
// ============================================================================

interface UseEnrollmentApplicationsOptions {
  schoolId?: string;
  status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'enrolled';
  enableRealtime?: boolean;
  submittedBy?: string; // Email filter for parent's applications
}

interface UseEnrollmentApplicationsResult {
  applications: EnrollmentApplication[];
  loading: boolean;
  error: Error | null;
  createApplication: (data: Partial<EnrollmentApplication>) => Promise<{ id: string; applicationNumber: string }>;
  updateApplication: (id: string, updates: Partial<EnrollmentApplication>) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  approveApplication: (id: string, reviewNotes?: string) => Promise<void>;
  rejectApplication: (id: string, reason: string) => Promise<void>;
  enrollStudent: (id: string, studentId: string, sectionId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useEnrollmentApplicationsPostgreSQL(
  options: UseEnrollmentApplicationsOptions = {}
): UseEnrollmentApplicationsResult {
  const { 
    schoolId, 
    status, 
    enableRealtime = true,
    submittedBy 
  } = options;

  const [applications, setApplications] = useState<EnrollmentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ============================================================================
  // Fetch Applications
  // ============================================================================

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[useEnrollmentApplicationsPostgreSQL] Fetching with schoolId:', schoolId, 'status:', status);

      let query = supabase
        .from('enrollment_applications')
        .select('*')
        .order('submitted_at', { ascending: false, nullsFirst: false });

      // Apply filters
      // NOTE: For admin review, we often want ALL applications regardless of school
      // so only filter if schoolId is explicitly provided and not empty
      if (schoolId && schoolId.trim() !== '') {
        console.log('[useEnrollmentApplicationsPostgreSQL] Filtering by school_id:', schoolId);
        query = query.eq('school_id', schoolId);
      } else {
        console.log('[useEnrollmentApplicationsPostgreSQL] Fetching ALL applications (no school filter)');
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (submittedBy) {
        query = query.eq('submitted_by', submittedBy);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform database rows to EnrollmentApplication format
      const transformed = (data || []).map(transformDatabaseRow);
      setApplications(transformed);

      console.log(`[useEnrollmentApplicationsPostgreSQL] Loaded ${transformed.length} applications`, {
        schoolId,
        status,
        submittedBy
      });
    } catch (err) {
      console.error('[useEnrollmentApplicationsPostgreSQL] Fetch error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch applications'));
    } finally {
      setLoading(false);
    }
  }, [schoolId, status, submittedBy]);

  // Initial fetch
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // ============================================================================
  // Real-time Subscription
  // ============================================================================

  useEffect(() => {
    if (!enableRealtime || !schoolId) return;

    console.log('[useEnrollmentApplicationsPostgreSQL] Setting up real-time subscription for school:', schoolId);

    const channel = supabase
      .channel(`enrollment_applications_${schoolId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'enrollment_applications',
          filter: `school_id=eq.${schoolId}`,
        },
        (payload) => {
          console.log('[useEnrollmentApplicationsPostgreSQL] Real-time update:', payload);
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      console.log('[useEnrollmentApplicationsPostgreSQL] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [enableRealtime, schoolId, fetchApplications]);

  // ============================================================================
  // CRUD Operations
  // ============================================================================

  /**
   * Create new enrollment application
   */
  const createApplication = useCallback(async (data: Partial<EnrollmentApplication>): Promise<{ id: string; applicationNumber: string }> => {
    try {
      if (!data.schoolId) {
        throw new Error('schoolId is required');
      }

      // Generate application number
      const schoolYear = new Date().getFullYear().toString();
      const { data: appNumber, error: numberError } = await supabase
        .rpc('generate_application_number', {
          p_school_id: data.schoolId,
          p_year: schoolYear
        });

      if (numberError) throw numberError;

      const applicationData = {
        school_id: data.schoolId,
        application_number: appNumber,
        student_info: data.studentInfo || {},
        guardian1: data.guardian1 || {},
        guardian2: data.guardian2 || null,
        current_address: data.currentAddress || {},
        permanent_address: data.permanentAddress || null,
        same_as_current: data.sameAsCurrent ?? true,
        academic_info: data.academicInfo || {},
        health_info: data.healthInfo || null,
        documents: data.documents || {},
        status: data.status || 'draft',
        submitted_at: data.submittedAt || null,
        submitted_by: data.submittedBy || null,
      };

      const { data: inserted, error: insertError } = await supabase
        .from('enrollment_applications')
        .insert([applicationData])
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('[useEnrollmentApplicationsPostgreSQL] Created application:', inserted.id);
      
      // Refresh list
      await fetchApplications();
      
      return { id: inserted.id, applicationNumber: appNumber };
    } catch (err) {
      console.error('[useEnrollmentApplicationsPostgreSQL] Create error:', err);
      throw err;
    }
  }, [fetchApplications]);

  /**
   * Update existing application
   */
  const updateApplication = useCallback(async (id: string, updates: Partial<EnrollmentApplication>): Promise<void> => {
    try {
      const updateData: Record<string, any> = {};

      // Map EnrollmentApplication fields to database columns
      if (updates.studentInfo !== undefined) updateData.student_info = updates.studentInfo;
      if (updates.guardian1 !== undefined) updateData.guardian1 = updates.guardian1;
      if (updates.guardian2 !== undefined) updateData.guardian2 = updates.guardian2;
      if (updates.currentAddress !== undefined) updateData.current_address = updates.currentAddress;
      if (updates.permanentAddress !== undefined) updateData.permanent_address = updates.permanentAddress;
      if (updates.sameAsCurrent !== undefined) updateData.same_as_current = updates.sameAsCurrent;
      if (updates.academicInfo !== undefined) updateData.academic_info = updates.academicInfo;
      if (updates.healthInfo !== undefined) updateData.health_info = updates.healthInfo;
      if (updates.documents !== undefined) updateData.documents = updates.documents;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.submittedAt !== undefined) updateData.submitted_at = updates.submittedAt;
      if (updates.submittedBy !== undefined) updateData.submitted_by = updates.submittedBy;
      if (updates.reviewedBy !== undefined) updateData.reviewed_by = updates.reviewedBy;
      if (updates.reviewedAt !== undefined) updateData.reviewed_at = updates.reviewedAt;
      if (updates.reviewNotes !== undefined) updateData.review_notes = updates.reviewNotes;
      if (updates.rejectionReason !== undefined) updateData.rejection_reason = updates.rejectionReason;
      if (updates.enrolledStudentId !== undefined) updateData.enrolled_student_id = updates.enrolledStudentId;
      if (updates.sectionId !== undefined) updateData.section_id = updates.sectionId;
      if (updates.enrollmentDate !== undefined) updateData.enrollment_date = updates.enrollmentDate;

      const { error: updateError } = await supabase
        .from('enrollment_applications')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      console.log('[useEnrollmentApplicationsPostgreSQL] Updated application:', id);
      
      // Refresh list
      await fetchApplications();
    } catch (err) {
      console.error('[useEnrollmentApplicationsPostgreSQL] Update error:', err);
      throw err;
    }
  }, [fetchApplications]);

  /**
   * Delete application (soft delete by status change preferred)
   */
  const deleteApplication = useCallback(async (id: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('enrollment_applications')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      console.log('[useEnrollmentApplicationsPostgreSQL] Deleted application:', id);
      
      // Refresh list
      await fetchApplications();
    } catch (err) {
      console.error('[useEnrollmentApplicationsPostgreSQL] Delete error:', err);
      throw err;
    }
  }, [fetchApplications]);

  /**
   * Approve application (admin workflow)
   */
  const approveApplication = useCallback(async (id: string, reviewNotes?: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('enrollment_applications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      console.log('[useEnrollmentApplicationsPostgreSQL] Approved application:', id);
      
      // Refresh list
      await fetchApplications();
    } catch (err) {
      console.error('[useEnrollmentApplicationsPostgreSQL] Approve error:', err);
      throw err;
    }
  }, [fetchApplications]);

  /**
   * Reject application (admin workflow)
   */
  const rejectApplication = useCallback(async (id: string, reason: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('enrollment_applications')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      console.log('[useEnrollmentApplicationsPostgreSQL] Rejected application:', id);
      
      // Refresh list
      await fetchApplications();
    } catch (err) {
      console.error('[useEnrollmentApplicationsPostgreSQL] Reject error:', err);
      throw err;
    }
  }, [fetchApplications]);

  /**
   * Mark application as enrolled and link to student record
   * Section can be null/empty if not assigned yet
   */
  const enrollStudent = useCallback(async (id: string, studentId: string, sectionId?: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('enrollment_applications')
        .update({
          status: 'enrolled',
          enrolled_student_id: studentId,
          section_id: sectionId || null,
          enrollment_date: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      console.log('[useEnrollmentApplicationsPostgreSQL] Enrolled student:', { id, studentId, sectionId });
      
      // Refresh list
      await fetchApplications();
    } catch (err) {
      console.error('[useEnrollmentApplicationsPostgreSQL] Enroll error:', err);
      throw err;
    }
  }, [fetchApplications]);

  // ============================================================================
  // Return Hook API
  // ============================================================================

  return {
    applications,
    loading,
    error,
    createApplication,
    updateApplication,
    deleteApplication,
    approveApplication,
    rejectApplication,
    enrollStudent,
    refetch: fetchApplications,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transform database row to EnrollmentApplication format
 */
function transformDatabaseRow(row: any): EnrollmentApplication {
  return {
    id: row.id,
    schoolId: row.school_id,
    applicationNumber: row.application_number,
    studentInfo: row.student_info,
    guardian1: row.guardian1,
    guardian2: row.guardian2 || undefined,
    currentAddress: row.current_address,
    permanentAddress: row.permanent_address || undefined,
    sameAsCurrent: row.same_as_current,
    academicInfo: row.academic_info,
    healthInfo: row.health_info || undefined,
    documents: row.documents || {},
    status: row.status,
    submittedAt: row.submitted_at,
    submittedBy: row.submitted_by,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewNotes: row.review_notes,
    rejectionReason: row.rejection_reason,
    enrolledStudentId: row.enrolled_student_id,
    sectionId: row.section_id,
    enrollmentDate: row.enrollment_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
