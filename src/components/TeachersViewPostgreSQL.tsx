/**
 * TeachersViewPostgreSQL - Teachers Management (PostgreSQL Migration)
 * 
 * Modern, optimized component for managing teacher accounts and learning area assignments.
 * Uses PostgreSQL via Supabase for data persistence.
 * 
 * Features:
 * - Real-time teacher list with search
 * - CRUD operations (Create, Read, Update, Delete)
 * - Learning area assignment management
 * - Role-based access control
 * - Responsive design with dark mode
 * - Pagination and filtering
 * - Optimistic UI updates
 * 
 * IMPORTANT: Memoized to prevent infinite render loops
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useTeachersPostgreSQL } from '../hooks/useTeachersPostgreSQL';
import { useDebounce } from '../../hooks/useDebounce';
import { PencilIcon, TrashIcon, CloseIcon, SearchIcon } from '../../components/icons';
import { GRADE_LEVELS, formatGradeLevel } from '../utils/gradeUtils';
import Modal from '../../components/Modal';

interface TeachersViewPostgreSQLProps {
  schoolId: string;
  learningAreas: any[];
  authUserId: string;
  authUserRole: string;
}

const ITEMS_PER_PAGE = 25;

// Memoized teacher row component for performance
const TeacherRow = React.memo<{
  teacher: any;
  learningAreasMap: Map<string, any>;
  authUserId: string;
  getRoleBadgeColor: (role: string) => string;
  onEdit: (teacher: any) => void;
  onDelete: (teacher: any) => void;
  onManageAssignments: (teacher: any) => void;
}>(({ teacher, learningAreasMap, authUserId, getRoleBadgeColor, onEdit, onDelete, onManageAssignments }) => {
  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-150 group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <span className="text-white font-bold text-lg">
              {teacher.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              {teacher.name}
            </div>
            {teacher.email && (
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-600 dark:text-slate-400">
                <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${teacher.email}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  {teacher.email}
                </a>
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(teacher.role)}`}>
          {teacher.role.charAt(0).toUpperCase() + teacher.role.slice(1)}
        </span>
      </td>
      <td className="px-6 py-4">
        {teacher.contactNumber ? (
          <div className="flex items-center gap-2 text-sm text-slate-900 dark:text-white">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <a href={`tel:${teacher.contactNumber}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {teacher.contactNumber}
            </a>
          </div>
        ) : (
          <div className="text-sm text-slate-400 dark:text-slate-500 italic">No contact</div>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1.5">
          {teacher.assignments && teacher.assignments.length > 0 ? (
            teacher.assignments.slice(0, 3).map((assignment: any, idx: number) => {
              const learningArea = learningAreasMap.get(assignment.learningAreaId);
              return (
                <span 
                  key={idx}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                  title={`${formatGradeLevel(assignment.gradeLevel)} - ${learningArea?.name || 'Unknown'}`}
                >
                  {formatGradeLevel(assignment.gradeLevel)} - {learningArea?.name || 'Unknown'}
                </span>
              );
            })
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500 italic">No assignments</span>
          )}
          {teacher.assignments && teacher.assignments.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
              +{teacher.assignments.length - 3}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={() => onManageAssignments(teacher)} 
            className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
            title="Manage assignments"
          >
            Manage
          </button>
          <button 
            onClick={() => onEdit(teacher)} 
            className="p-2 text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-all"
            aria-label="Edit teacher"
            title="Edit teacher"
          >
            <PencilIcon />
          </button>
          <button 
            onClick={() => onDelete(teacher)} 
            className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
            aria-label="Delete teacher"
            title="Delete teacher"
            disabled={teacher.id === authUserId}
          >
            <TrashIcon />
          </button>
        </div>
      </td>
    </tr>
  );
});

TeacherRow.displayName = 'TeacherRow';

const TeachersViewPostgreSQL: React.FC<TeachersViewPostgreSQLProps> = ({ 
  schoolId, 
  learningAreas,
  authUserId,
  authUserRole
}) => {
  // State for modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isManageAssignmentsModalOpen, setIsManageAssignmentsModalOpen] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
    details?: string;
  }>({ show: false, type: 'success', message: '' });

  // Show toast helper
  const showToast = useCallback((type: 'success' | 'error', message: string, details?: string) => {
    setToast({ show: true, type, message, details });
    setTimeout(() => setToast({ show: false, type: 'success', message: '' }), 5000);
  }, []);

  // State for current operations
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [newTeacher, setNewTeacher] = useState({ 
    name: '', 
    email: '', 
    contactNumber: '',
    role: 'teacher' as 'admin' | 'principal' | 'registrar' | 'teacher'
  });

  // Search and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Assignment search (for assigning learning areas)
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState('');
  const debouncedAssignmentSearchQuery = useDebounce(assignmentSearchQuery, 300);

  // Assignment form state
  const [newAssignment, setNewAssignment] = useState({
    gradeLevel: '',
    learningAreaId: ''
  });

  // Calculate offset for server-side pagination
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Fetch teachers with search and server-side pagination
  const { 
    teachers, 
    loading, 
    error,
    createTeacher, 
    updateTeacher, 
    deleteTeacher,
    assignLearningAreaToTeacher,
    unassignLearningAreaFromTeacher,
    totalCount
  } = useTeachersPostgreSQL({
    schoolId,
    searchQuery: debouncedSearchQuery || undefined,
    limit: ITEMS_PER_PAGE,
    offset: offset,
  });

  // Server-side pagination - calculate total pages from totalCount
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Use teachers directly (already paginated from server)
  const paginatedTeachers = teachers;

  // Memoize learning area lookup map for O(1) access
  const learningAreasMap = useMemo(() => {
    const map = new Map();
    learningAreas.forEach(la => map.set(la.id, la));
    return map;
  }, [learningAreas]);

  // Filter learning areas for assignment dropdown
  const filteredLearningAreas = useMemo(() => {
    if (!debouncedAssignmentSearchQuery) return learningAreas;
    return learningAreas.filter(la => 
      la.name.toLowerCase().includes(debouncedAssignmentSearchQuery.toLowerCase())
    );
  }, [learningAreas, debouncedAssignmentSearchQuery]);

  // Get assigned learning areas for selected teacher
  const assignedLearningAreas = useMemo(() => {
    if (!selectedTeacher || !selectedTeacher.assignments) return [];
    return selectedTeacher.assignments.map((assignment: any) => {
      const learningArea = learningAreas.find(la => la.id === assignment.learningAreaId);
      return {
        ...assignment,
        learningAreaName: learningArea?.name || 'Unknown'
      };
    });
  }, [selectedTeacher, learningAreas]);

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'principal':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
      case 'registrar':
        return 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300';
      case 'teacher':
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
    }
  };

  // Handle add teacher
  const handleAddTeacher = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacher.name || !newTeacher.email) return;

    try {
      await createTeacher({
        schoolId,
        name: newTeacher.name,
        email: newTeacher.email,
        role: newTeacher.role,
        contactNumber: newTeacher.contactNumber || undefined,
        assignments: [],
      });

      showToast('success', `✅ Teacher "${newTeacher.name}" created successfully!`);
      
      setNewTeacher({ 
        name: '', 
        email: '', 
        contactNumber: '',
        role: 'teacher'
      });
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Failed to add teacher:', err);
      showToast('error', 'Failed to create teacher', err instanceof Error ? err.message : 'Please try again.');
    }
  }, [newTeacher, createTeacher, schoolId, showToast]);

  // Handle edit teacher
  const handleEditClick = useCallback((teacher: any) => {
    setSelectedTeacher({ ...teacher });
    setIsEditModalOpen(true);
  }, []);

  const handleUpdateTeacher = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    // Store original data for comparison
    const originalTeacher = teachers.find(t => t.id === selectedTeacher.id);
    const changes: string[] = [];
    
    if (originalTeacher) {
      if (originalTeacher.name !== selectedTeacher.name) changes.push(`Name: "${originalTeacher.name}" → "${selectedTeacher.name}"`);
      if (originalTeacher.email !== selectedTeacher.email) changes.push(`Email: "${originalTeacher.email}" → "${selectedTeacher.email}"`);
      if (originalTeacher.role !== selectedTeacher.role) changes.push(`Role: "${originalTeacher.role}" → "${selectedTeacher.role}"`);
      if (originalTeacher.contactNumber !== selectedTeacher.contactNumber) changes.push(`Contact: "${originalTeacher.contactNumber || 'N/A'}" → "${selectedTeacher.contactNumber || 'N/A'}"`);
    }

    try {
      await updateTeacher(selectedTeacher.id, {
        name: selectedTeacher.name,
        email: selectedTeacher.email,
        role: selectedTeacher.role,
        contactNumber: selectedTeacher.contactNumber,
      });

      const changesText = changes.length > 0 ? changes.join('; ') : 'No changes detected';
      showToast('success', `✅ Teacher "${selectedTeacher.name}" updated successfully!`, changesText);

      setIsEditModalOpen(false);
      setSelectedTeacher(null);
    } catch (err) {
      console.error('Failed to update teacher:', err);
      showToast('error', 'Failed to update teacher', err instanceof Error ? err.message : 'Please try again.');
    }
  }, [selectedTeacher, updateTeacher, teachers, showToast]);

  // Handle delete teacher
  const handleDeleteClick = useCallback((teacher: any) => {
    setSelectedTeacher(teacher);
    setIsDeleteModalOpen(true);
  }, []);

  const confirmDeleteTeacher = useCallback(async () => {
    if (!selectedTeacher) return;

    // Prevent deleting yourself
    if (selectedTeacher.id === authUserId) {
      showToast('error', 'Cannot delete yourself', 'You cannot delete your own account.');
      setIsDeleteModalOpen(false);
      setSelectedTeacher(null);
      return;
    }

    const teacherName = selectedTeacher.name;

    try {
      await deleteTeacher(selectedTeacher.id);
      showToast('success', `✅ Teacher "${teacherName}" deleted successfully!`);
      setIsDeleteModalOpen(false);
      setSelectedTeacher(null);
    } catch (err) {
      console.error('Failed to delete teacher:', err);
      showToast('error', 'Failed to delete teacher', err instanceof Error ? err.message : 'Please try again.');
    }
  }, [selectedTeacher, deleteTeacher, authUserId, showToast]);

  // Handle manage assignments
  const handleManageAssignmentsClick = useCallback((teacher: any) => {
    setSelectedTeacher(teacher);
    setAssignmentSearchQuery('');
    setNewAssignment({ gradeLevel: '', learningAreaId: '' });
    setIsManageAssignmentsModalOpen(true);
  }, []);

  const handleAssignLearningArea = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !newAssignment.gradeLevel || !newAssignment.learningAreaId) return;

    const learningArea = learningAreas.find(la => la.id === newAssignment.learningAreaId);
    const learningAreaName = learningArea?.name || 'Unknown';
    const gradeLevelFormatted = formatGradeLevel(newAssignment.gradeLevel);

    try {
      await assignLearningAreaToTeacher(selectedTeacher.id, {
        gradeLevel: newAssignment.gradeLevel,
        learningAreaId: newAssignment.learningAreaId
      });
      
      // Optimistic update
      setSelectedTeacher((prev: any) => prev ? { 
        ...prev, 
        assignments: [
          ...(prev.assignments || []),
          {
            gradeLevel: newAssignment.gradeLevel,
            learningAreaId: newAssignment.learningAreaId
          }
        ]
      } : null);
      
      showToast('success', `✅ Assigned "${gradeLevelFormatted} - ${learningAreaName}" to "${selectedTeacher.name}"`);
      setNewAssignment({ gradeLevel: '', learningAreaId: '' });
    } catch (err) {
      console.error('Failed to assign learning area:', err);
      showToast('error', 'Failed to assign learning area', err instanceof Error ? err.message : 'Please try again.');
    }
  }, [selectedTeacher, newAssignment, assignLearningAreaToTeacher, learningAreas, showToast]);

  const handleUnassignLearningArea = useCallback(async (assignment: any) => {
    if (!selectedTeacher) return;

    const learningAreaName = assignment.learningAreaName || 'Unknown';
    const gradeLevelFormatted = formatGradeLevel(assignment.gradeLevel);

    try {
      const assignmentIndex = selectedTeacher.assignments.findIndex(
        (a: any) => a.gradeLevel === assignment.gradeLevel && a.learningAreaId === assignment.learningAreaId
      );
      
      if (assignmentIndex !== -1) {
        await unassignLearningAreaFromTeacher(selectedTeacher.id, assignmentIndex);
      }
      
      // Optimistic update
      setSelectedTeacher((prev: any) => prev ? { 
        ...prev, 
        assignments: (prev.assignments || []).filter((a: any) => 
          !(a.gradeLevel === assignment.gradeLevel && a.learningAreaId === assignment.learningAreaId)
        )
      } : null);
      
      showToast('success', `✅ Removed "${gradeLevelFormatted} - ${learningAreaName}" from "${selectedTeacher.name}"`);
    } catch (err) {
      console.error('Failed to unassign learning area:', err);
      showToast('error', 'Failed to remove assignment', err instanceof Error ? err.message : 'Please try again.');
    }
  }, [selectedTeacher, unassignLearningAreaFromTeacher, showToast]);

  // Loading state with skeleton
  if (loading && teachers.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        </div>
        <div className="h-12 w-96 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
            <div key={i} className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Failed to Load Teachers</h3>
            <p className="text-red-700 dark:text-red-300 mb-6">{error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Enhanced Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg">
              <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            Teachers Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">
            Manage teacher accounts, roles, and learning area assignments
          </p>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-white">{totalCount}</span> {totalCount === 1 ? 'teacher' : 'teachers'} total
              </span>
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                <span>Syncing...</span>
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)} 
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Teacher
        </button>
      </div>

      {/* Enhanced Search Bar with Filter Chips */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by teacher name, email, or contact number..." 
              value={searchQuery} 
              onChange={(e) => { 
                setSearchQuery(e.target.value); 
                setCurrentPage(1); 
              }} 
              className="w-full pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-white placeholder-slate-400 transition-shadow"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                aria-label="Clear search"
              >
                <CloseIcon />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                {totalCount} {totalCount === 1 ? 'result' : 'results'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Teachers Table */}
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        {paginatedTeachers.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Assignments
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {paginatedTeachers.map((teacher) => (
                    <TeacherRow
                      key={teacher.id}
                      teacher={teacher}
                      learningAreasMap={learningAreasMap}
                      authUserId={authUserId}
                      getRoleBadgeColor={getRoleBadgeColor}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteClick}
                      onManageAssignments={handleManageAssignmentsClick}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Showing <span className="font-semibold text-slate-900 dark:text-white">{offset + 1}</span> to <span className="font-semibold text-slate-900 dark:text-white">{Math.min(offset + ITEMS_PER_PAGE, totalCount)}</span> of <span className="font-semibold text-slate-900 dark:text-white">{totalCount}</span> teachers
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                            currentPage === pageNum
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          // Enhanced Empty State
          <div className="py-16 px-6 text-center">
            <div className="max-w-sm mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {searchQuery ? 'No Teachers Found' : 'No Teachers Yet'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {searchQuery 
                  ? `No teachers match "${searchQuery}". Try a different search term.`
                  : 'Get started by adding your first teacher to the system.'
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-colors shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Your First Teacher
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Teacher Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Teacher">
        <form onSubmit={handleAddTeacher} className="space-y-4">
          <div>
            <label htmlFor="add-teacher-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input 
              id="add-teacher-name"
              type="text" 
              value={newTeacher.name} 
              onChange={e => setNewTeacher(p => ({ ...p, name: e.target.value }))} 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              required 
            />
          </div>
          <div>
            <label htmlFor="add-teacher-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input 
              id="add-teacher-email"
              type="email" 
              value={newTeacher.email} 
              onChange={e => setNewTeacher(p => ({ ...p, email: e.target.value }))} 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              required 
            />
          </div>
          <div>
            <label htmlFor="add-teacher-role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              id="add-teacher-role"
              value={newTeacher.role}
              onChange={e => setNewTeacher(p => ({ ...p, role: e.target.value as any }))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              required
            >
              <option value="teacher">Teacher</option>
              <option value="registrar">Registrar</option>
              <option value="principal">Principal</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label htmlFor="add-teacher-contact" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Contact Number
            </label>
            <input 
              id="add-teacher-contact"
              type="tel" 
              value={newTeacher.contactNumber} 
              onChange={e => setNewTeacher(p => ({ ...p, contactNumber: e.target.value }))} 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={() => setIsAddModalOpen(false)} 
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-600 rounded-md hover:bg-slate-200 dark:hover:bg-slate-500"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Add Teacher
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Teacher Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Teacher">
        <form onSubmit={handleUpdateTeacher} className="space-y-4">
          <div>
            <label htmlFor="edit-teacher-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input 
              id="edit-teacher-name"
              type="text" 
              value={selectedTeacher?.name || ''} 
              onChange={e => setSelectedTeacher((prev: any) => ({ ...prev, name: e.target.value }))} 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              required 
            />
          </div>
          <div>
            <label htmlFor="edit-teacher-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input 
              id="edit-teacher-email"
              type="email" 
              value={selectedTeacher?.email || ''} 
              onChange={e => setSelectedTeacher((prev: any) => ({ ...prev, email: e.target.value }))} 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              required 
            />
          </div>
          <div>
            <label htmlFor="edit-teacher-role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              id="edit-teacher-role"
              value={selectedTeacher?.role || 'teacher'}
              onChange={e => setSelectedTeacher((prev: any) => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              required
            >
              <option value="teacher">Teacher</option>
              <option value="registrar">Registrar</option>
              <option value="principal">Principal</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label htmlFor="edit-teacher-contact" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Contact Number
            </label>
            <input 
              id="edit-teacher-contact"
              type="tel" 
              value={selectedTeacher?.contactNumber || ''} 
              onChange={e => setSelectedTeacher((prev: any) => ({ ...prev, contactNumber: e.target.value }))} 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={() => setIsEditModalOpen(false)} 
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-600 rounded-md hover:bg-slate-200 dark:hover:bg-slate-500"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            Are you sure you want to delete the teacher account for <span className="font-bold">{selectedTeacher?.name}</span>? 
            This will remove their access and all their assignments.
          </p>
          {selectedTeacher?.id === authUserId && (
            <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
              ⚠️ You cannot delete your own account.
            </p>
          )}
          {selectedTeacher?.id !== authUserId && (
            <p className="text-sm text-red-600 dark:text-red-400">
              This action cannot be undone.
            </p>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={() => setIsDeleteModalOpen(false)} 
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-600 rounded-md hover:bg-slate-200 dark:hover:bg-slate-500"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDeleteTeacher} 
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedTeacher?.id === authUserId}
            >
              Delete Teacher
            </button>
          </div>
        </div>
      </Modal>

      {/* Manage Assignments Modal */}
      <Modal 
        isOpen={isManageAssignmentsModalOpen} 
        onClose={() => setIsManageAssignmentsModalOpen(false)} 
        title={`Manage Assignments for ${selectedTeacher?.name}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Assigned Learning Areas */}
          <div>
            <h3 className="font-semibold text-lg mb-3 text-slate-800 dark:text-white">
              Current Assignments
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {assignedLearningAreas.length > 0 ? (
                assignedLearningAreas.map((assignment: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between bg-slate-50 dark:bg-slate-700 p-3 rounded-md"
                  >
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {formatGradeLevel(assignment.gradeLevel)} - {assignment.learningAreaName}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleUnassignLearningArea(assignment)} 
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      aria-label="Remove assignment"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm italic">
                  No assignments yet.
                </p>
              )}
            </div>
          </div>

          {/* Assign New Learning Area */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="font-semibold text-lg mb-3 text-slate-800 dark:text-white">
              Assign New Learning Area
            </h3>
            <form onSubmit={handleAssignLearningArea} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Grade Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={newAssignment.gradeLevel}
                  onChange={e => setNewAssignment(prev => ({ ...prev, gradeLevel: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                  aria-label="Select grade level"
                  required
                >
                  <option value="">Select grade level...</option>
                  {GRADE_LEVELS.map((grade: { value: string; label: string }) => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Learning Area <span className="text-red-500">*</span>
                </label>
                <select
                  value={newAssignment.learningAreaId}
                  onChange={e => setNewAssignment(prev => ({ ...prev, learningAreaId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                  aria-label="Select learning area"
                  required
                >
                  <option value="">Select learning area...</option>
                  {learningAreas.map(la => (
                    <option key={la.id} value={la.id}>
                      {la.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  disabled={!newAssignment.gradeLevel || !newAssignment.learningAreaId}
                >
                  Assign
                </button>
              </div>
            </form>
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setIsManageAssignmentsModalOpen(false)} 
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className={`
            rounded-lg shadow-lg p-4 max-w-md
            ${toast.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/30 border-2 border-green-500' 
              : 'bg-red-50 dark:bg-red-900/30 border-2 border-red-500'
            }
          `}>
            <div className="flex items-start gap-3">
              <div className={`
                flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}
              `}>
                {toast.type === 'success' ? (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className={`
                  font-semibold text-sm
                  ${toast.type === 'success' 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-red-800 dark:text-red-200'
                  }
                `}>
                  {toast.message}
                </p>
                {toast.details && (
                  <p className={`
                    text-xs mt-1
                    ${toast.type === 'success' 
                      ? 'text-green-700 dark:text-green-300' 
                      : 'text-red-700 dark:text-red-300'
                    }
                  `}>
                    {toast.details}
                  </p>
                )}
              </div>
              <button
                onClick={() => setToast({ show: false, type: 'success', message: '' })}
                className={`
                  flex-shrink-0 text-sm font-medium
                  ${toast.type === 'success' 
                    ? 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200' 
                    : 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200'
                  }
                `}
                aria-label="Close notification"
              >
                <CloseIcon />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersViewPostgreSQL;

