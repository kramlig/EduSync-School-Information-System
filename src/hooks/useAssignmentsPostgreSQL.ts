/**
 * useAssignmentsPostgreSQL - PostgreSQL Assignments Hook
 * 
 * Manages assignments and student assignment grades from PostgreSQL
 * 
 * IMPORTANT: Requires student_assignment_grades table to be created
 * Run: scripts/migration/add-student-assignment-grades-table.sql
 * 
 * PostgreSQL Migration: ✅ COMPLETE (Nov 27, 2025)
 * - Fetches from assignments and student_assignment_grades tables
 * - Full CRUD operations
 * - Real-time polling every 30 seconds
 * - Teacher Firebase UID → PostgreSQL UUID conversion
 */

import { useState, useEffect, useCallback } from 'react';
import { useSchoolContext } from '../contexts/SchoolContext';
import type { Assignment, StudentAssignmentGrade } from '../../types';
import * as assignmentsService from '../services/assignmentsServicePostgreSQL';

interface UseAssignmentsPostgreSQLResult {
  assignments: Assignment[];
  studentAssignmentGrades: StudentAssignmentGrade[];
  loading: boolean;
  error: string | null;
  addAssignment: (assignment: Omit<Assignment, 'id' | 'schoolId'>) => Promise<void>;
  updateAssignment: (assignment: Assignment) => Promise<void>;
  deleteAssignment: (assignmentId: string) => Promise<void>;
  updateAssignmentGrade: (
    studentId: string,
    assignmentId: string,
    score: number | null,
    feedback: string | null
  ) => Promise<void>;
  submitAssignment: (
    studentId: string,
    assignmentId: string,
    filePath: string
  ) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook to manage assignments and grades from PostgreSQL
 * @param teacherFirebaseUid - Firebase UID of teacher (optional, needed for creating assignments)
 */
export function useAssignmentsPostgreSQL(teacherFirebaseUid?: string): UseAssignmentsPostgreSQLResult {
  const { schoolId } = useSchoolContext();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentAssignmentGrades, setStudentAssignmentGrades] = useState<StudentAssignmentGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const fetchData = useCallback(async (showLoading = false) => {
    if (!schoolId || schoolId === 'default') {
      setLoading(false);
      return;
    }

    try {
      // Only show loading spinner on initial load, not on polling updates
      if (showLoading) {
        setLoading(true);
      }
      
      const [assignmentsData, gradesData] = await Promise.all([
        assignmentsService.fetchAssignments(schoolId),
        assignmentsService.fetchStudentAssignmentGrades(schoolId)
      ]);

      setAssignments(assignmentsData);
      setStudentAssignmentGrades(gradesData);
      setError(null);
    } catch (err) {
      console.error('[useAssignmentsPostgreSQL] Error fetching data:', err);
      setError('Failed to load assignments');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [schoolId]);

  // Initial fetch and polling
  useEffect(() => {
    // Initial fetch with loading indicator
    fetchData(true);

    // Poll every 30 seconds (silently, no loading indicator)
    const interval = setInterval(() => fetchData(false), 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // CRUD operations
  const addAssignment = useCallback(
    async (assignment: Omit<Assignment, 'id' | 'schoolId'>) => {
      if (!schoolId) throw new Error('No school ID');
      if (!teacherFirebaseUid) throw new Error('No teacher Firebase UID');

      const newAssignment = await assignmentsService.addAssignment(
        schoolId,
        teacherFirebaseUid, // Pass Firebase UID, service will convert to PostgreSQL UUID
        assignment
      );

      setAssignments(prev => [...prev, newAssignment]);
    },
    [schoolId, teacherFirebaseUid]
  );

  const updateAssignment = useCallback(
    async (assignment: Assignment) => {
      await assignmentsService.updateAssignment(assignment);
      setAssignments(prev =>
        prev.map(a => (a.id === assignment.id ? assignment : a))
      );
    },
    []
  );

  const deleteAssignment = useCallback(
    async (assignmentId: string) => {
      await assignmentsService.deleteAssignment(assignmentId);
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      // Also remove related grades
      setStudentAssignmentGrades(prev =>
        prev.filter(g => g.assignmentId !== assignmentId)
      );
    },
    []
  );

  const updateAssignmentGrade = useCallback(
    async (
      studentId: string,
      assignmentId: string,
      score: number | null,
      feedback: string | null
    ) => {
      if (!schoolId) throw new Error('No school ID');

      await assignmentsService.updateAssignmentGrade(
        schoolId,
        studentId,
        assignmentId,
        score,
        feedback
      );

      // Optimistically update local state
      setStudentAssignmentGrades(prev => {
        const existing = prev.find(
          g => g.studentId === studentId && g.assignmentId === assignmentId
        );

        if (existing) {
          return prev.map(g =>
            g.studentId === studentId && g.assignmentId === assignmentId
              ? { ...g, score, feedback }
              : g
          );
        } else {
          return [
            ...prev,
            {
              id: `temp_${Date.now()}`,
              schoolId,
              studentId,
              assignmentId,
              score,
              feedback,
              submissionDate: null,
              filePath: null
            }
          ];
        }
      });

      // Refetch to get accurate data
      await fetchData();
    },
    [schoolId, fetchData]
  );

  const submitAssignment = useCallback(
    async (studentId: string, assignmentId: string, filePath: string) => {
      if (!schoolId) throw new Error('No school ID');

      await assignmentsService.submitAssignment(
        schoolId,
        studentId,
        assignmentId,
        filePath
      );

      // Refetch to get updated submission
      await fetchData();
    },
    [schoolId, fetchData]
  );

  return {
    assignments,
    studentAssignmentGrades,
    loading,
    error,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    updateAssignmentGrade,
    submitAssignment,
    refetch: () => fetchData(true) // Manual refetch shows loading
  };
}
