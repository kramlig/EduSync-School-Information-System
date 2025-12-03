/**
 * SubstituteView - Optimized PostgreSQL Version
 * 
 * Main component for managing substitute teacher assignments.
 * Migrated to PostgreSQL with optimized component extraction.
 * 
 * IMPORTANT: Feature flag hooks are memoized to prevent infinite render loops
 * caused by settings object reference changes from useSchoolData
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useSubstituteAssignmentsPostgreSQL } from '../src/hooks/useSubstituteAssignmentsPostgreSQL';
// import { useSchoolData } from '../hooks/useSchoolData'; // REMOVED: Production PostgreSQL
import type { SubstituteAssignmentExtended } from '../src/services/substituteServicePostgreSQL';
import type { Teacher } from '../types';

// Import extracted components
import {
  StatisticsDashboard,
  AssignmentCard,
  AssignmentFormModal,
  DeleteConfirmationModal,
  SearchFilterBar,
  EmptyState,
} from './substitute';

// ==================== Utility Functions ====================

const getStatus = (assignment: SubstituteAssignmentExtended): { text: string; color: string; icon: string } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(assignment.startDate);
  const endDate = new Date(assignment.endDate);

  if (today >= startDate && today <= endDate) {
    return { text: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: '✓' };
  }
  if (today < startDate) {
    return { text: 'Scheduled', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: '⏱' };
  }
  return { text: 'Completed', color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200', icon: '✔' };
};

const getDuration = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '1 day';
  if (diffDays < 7) return `${diffDays + 1} days`;
  const weeks = Math.floor(diffDays / 7);
  return weeks === 1 ? '1 week' : `${weeks} weeks`;
};

const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
};

// ==================== Types ====================

type StatusFilter = 'all' | 'active' | 'scheduled' | 'completed';

interface FormData {
  teacherId: string;
  originalTeacherId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  notes?: string;
}

// ==================== Constants ====================

// Define data keys outside component to prevent re-creation
const SCHOOL_DATA_KEYS = ['teachers'] as const;

// ==================== Main Component ====================

const SubstituteView: React.FC = () => {
  // PostgreSQL hook for data management
  const {
    assignments,
    loading: assignmentsLoading,
    error,
    stats,
    addAssignment,
    updateAssignment,
    deleteAssignment,
  } = useSubstituteAssignmentsPostgreSQL();

  // Get teachers from school data (REMOVED: Production PostgreSQL)
  // const { teachers, loading: teachersLoading } = useSchoolData(SCHOOL_DATA_KEYS);
  const teachers: Teacher[] = []; // TEMPORARY: Load from useTeachersPostgreSQL
  const teachersLoading = false;
  
  // Combined loading state
  const loading = assignmentsLoading || teachersLoading;
  
  // Memoize teachers to prevent reference changes
  const memoizedTeachers = useMemo<Teacher[]>(() => teachers || [], [teachers]);
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form state
  const [assignmentToEdit, setAssignmentToEdit] = useState<SubstituteAssignmentExtended | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<SubstituteAssignmentExtended | null>(null);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
  // Form data
  const todayStr = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState<FormData>({
    teacherId: '',
    originalTeacherId: '',
    startDate: todayStr,
    endDate: todayStr,
    reason: '',
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // ==================== Memoized Computations ====================

  const sortedAssignments = useMemo(() => 
    [...assignments].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
  , [assignments]);

  const filteredAssignments = useMemo(() => {
    return sortedAssignments.filter(assignment => {
      // Status filter
      if (statusFilter !== 'all') {
        const status = getStatus(assignment).text.toLowerCase();
        if (statusFilter !== status) return false;
      }
      
      // Search filter
      if (searchTerm.trim()) {
        const subTeacher = memoizedTeachers.find(t => t.id === assignment.teacherId);
        const originalTeacher = memoizedTeachers.find(t => t.id === assignment.originalTeacherId);
        const searchLower = searchTerm.toLowerCase();
        
        const matchesSubstitute = subTeacher?.name?.toLowerCase().includes(searchLower);
        const matchesOriginal = originalTeacher?.name?.toLowerCase().includes(searchLower);
        
        if (!matchesSubstitute && !matchesOriginal) return false;
      }
      
      return true;
    });
  }, [sortedAssignments, statusFilter, searchTerm, memoizedTeachers]);

  // ==================== Callbacks ====================

  const validateAssignment = useCallback((data: FormData): string | null => {
    if (!data.teacherId || !data.originalTeacherId || !data.startDate || !data.endDate) {
      return "All required fields must be filled.";
    }
    if (data.endDate < data.startDate) {
      return "End date cannot be before the start date.";
    }
    if (data.teacherId === data.originalTeacherId) {
      return "Substitute and original teacher cannot be the same person.";
    }
    return null;
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (isEditModalOpen && assignmentToEdit) {
      setAssignmentToEdit(prev => prev ? { ...prev, [name]: value } : null);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setFormError(null);
  }, [isEditModalOpen, assignmentToEdit]);

  const handleSelectChange = useCallback((name: string, value: string) => {
    if (isEditModalOpen && assignmentToEdit) {
      setAssignmentToEdit(prev => prev ? { ...prev, [name]: value } : null);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setFormError(null);
  }, [isEditModalOpen, assignmentToEdit]);

  const handleAddAssignment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateAssignment(formData);
    if (error) {
      setFormError(error);
      return;
    }
    
    const result = await addAssignment({
      teacherId: formData.teacherId,
      originalTeacherId: formData.originalTeacherId,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      notes: formData.notes,
    });
    
    if (result) {
      setFormData({ teacherId: '', originalTeacherId: '', startDate: todayStr, endDate: todayStr, reason: '', notes: '' });
      setIsAddModalOpen(false);
      setFormError(null);
    }
  }, [formData, addAssignment, validateAssignment, todayStr]);

  const handleEditClick = useCallback((id: string) => {
    const assignment = assignments.find(a => a.id === id);
    if (assignment) {
      setAssignmentToEdit({ ...assignment });
      setIsEditModalOpen(true);
    }
  }, [assignments]);

  const handleUpdateAssignment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentToEdit) return;
    
    const validationData: FormData = {
      teacherId: assignmentToEdit.teacherId,
      originalTeacherId: assignmentToEdit.originalTeacherId,
      startDate: assignmentToEdit.startDate,
      endDate: assignmentToEdit.endDate,
      reason: assignmentToEdit.reason,
      notes: assignmentToEdit.notes,
    };
    
    const error = validateAssignment(validationData);
    if (error) {
      setFormError(error);
      return;
    }
    
    const result = await updateAssignment(assignmentToEdit.id, assignmentToEdit);
    
    if (result) {
      setIsEditModalOpen(false);
      setAssignmentToEdit(null);
      setFormError(null);
    }
  }, [assignmentToEdit, updateAssignment, validateAssignment]);

  const handleDeleteClick = useCallback((id: string) => {
    const assignment = assignments.find(a => a.id === id);
    if (assignment) {
      setAssignmentToDelete(assignment);
      setIsDeleteModalOpen(true);
    }
  }, [assignments]);

  const confirmDelete = useCallback(async () => {
    if (assignmentToDelete) {
      const success = await deleteAssignment(assignmentToDelete.id);
      if (success) {
        setIsDeleteModalOpen(false);
        setAssignmentToDelete(null);
      }
    }
  }, [assignmentToDelete, deleteAssignment]);

  const handleCloseAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    setFormError(null);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setAssignmentToEdit(null);
    setFormError(null);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setAssignmentToDelete(null);
  }, []);

  // ==================== Render ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-slate-600 dark:text-slate-400">Loading substitute assignments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error Loading Data</h3>
        <p className="text-red-600 dark:text-red-300">{error}</p>
        <p className="text-sm text-red-500 dark:text-red-400 mt-2">
          Please ensure the substitute_assignments table has been created in the database.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">📋 Substitute Management</h1>
        <button 
          onClick={() => setIsAddModalOpen(true)} 
          className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
        >
          + Add Assignment
        </button>
      </div>

      {/* Stats Cards */}
      <StatisticsDashboard stats={stats} />

      {/* Search and Filter */}
      <SearchFilterBar
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
      />

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <EmptyState 
          hasFilters={!!(searchTerm || statusFilter !== 'all')}
          onAddClick={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAssignments.map(assignment => {
            const substituteTeacher = memoizedTeachers.find(t => t.id === assignment.teacherId);
            const originalTeacher = memoizedTeachers.find(t => t.id === assignment.originalTeacherId);
            const status = getStatus(assignment);
            const duration = getDuration(assignment.startDate, assignment.endDate);
            const dateRange = formatDateRange(assignment.startDate, assignment.endDate);
            
            return (
              <AssignmentCard
                key={assignment.id}
                id={assignment.id}
                substituteTeacher={substituteTeacher}
                originalTeacher={originalTeacher}
                dateRange={dateRange}
                duration={duration}
                status={status}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <AssignmentFormModal
        isOpen={isAddModalOpen}
        isEdit={false}
        formData={formData}
        formError={formError}
        teachers={memoizedTeachers}
        onClose={handleCloseAddModal}
        onSubmit={handleAddAssignment}
        onInputChange={handleInputChange}
        onSelectChange={handleSelectChange}
      />

      {/* Edit Modal */}
      {assignmentToEdit && (
        <AssignmentFormModal
          isOpen={isEditModalOpen}
          isEdit={true}
          formData={{
            teacherId: assignmentToEdit.teacherId,
            originalTeacherId: assignmentToEdit.originalTeacherId,
            startDate: assignmentToEdit.startDate,
            endDate: assignmentToEdit.endDate,
            reason: assignmentToEdit.reason,
            notes: assignmentToEdit.notes,
          }}
          formError={formError}
          teachers={memoizedTeachers}
          onClose={handleCloseEditModal}
          onSubmit={handleUpdateAssignment}
          onInputChange={handleInputChange}
          onSelectChange={handleSelectChange}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        assignmentId={assignmentToDelete?.id || null}
        substituteTeacher={assignmentToDelete ? memoizedTeachers.find(t => t.id === assignmentToDelete.teacherId) : undefined}
        originalTeacher={assignmentToDelete ? memoizedTeachers.find(t => t.id === assignmentToDelete.originalTeacherId) : undefined}
        dateRange={assignmentToDelete ? formatDateRange(assignmentToDelete.startDate, assignmentToDelete.endDate) : ''}
        onClose={handleCloseDeleteModal}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default SubstituteView;
