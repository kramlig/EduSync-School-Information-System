/**
 * ParentsViewPostgreSQL - Parents Management (PostgreSQL Migration)
 * 
 * Modern, optimized component for managing parent accounts and student relationships.
 * Uses PostgreSQL via Supabase for data persistence.
 * 
 * Features:
 * - Real-time parent list with search
 * - CRUD operations (Create, Read, Update, Delete)
 * - Student relationship management
 * - Responsive design with dark mode
 * - Pagination and filtering
 * - Optimistic UI updates
 * 
 * IMPORTANT: Memoized to prevent infinite render loops
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useParentsPostgreSQL } from '../hooks/useParentsPostgreSQL';
import { useStudentsPostgreSQL } from '../hooks/useStudentsPostgreSQL';
import { useDebounce } from '../../hooks/useDebounce';
import { PencilIcon, TrashIcon, CloseIcon, UserGroupIcon, SearchIcon } from '../../components/icons';
import Modal from '../../components/Modal';

interface ParentsViewPostgreSQLProps {
  schoolId: string;
}

const ITEMS_PER_PAGE = 25;

const ParentsViewPostgreSQL: React.FC<ParentsViewPostgreSQLProps> = ({ schoolId }) => {
  // State for modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isManageChildrenModalOpen, setIsManageChildrenModalOpen] = useState(false);
  
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
  const [selectedParent, setSelectedParent] = useState<any | null>(null);
  const [newParent, setNewParent] = useState({ 
    name: '', 
    email: '', 
    relationship: '',
    contactNumber: '',
    occupation: '',
    address: ''
  });

  // Search and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Child search (for assigning students)
  const [childSearchQuery, setChildSearchQuery] = useState('');
  const debouncedChildSearchQuery = useDebounce(childSearchQuery, 300);

  // Calculate offset for server-side pagination
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Fetch parents with search and server-side pagination
  const { 
    parents, 
    loading, 
    error,
    createParent, 
    updateParent, 
    deleteParent,
    assignStudentToParent,
    unassignStudentFromParent,
    totalCount
  } = useParentsPostgreSQL({
    schoolId,
    searchQuery: debouncedSearchQuery || undefined,
    limit: ITEMS_PER_PAGE,
    offset: offset,
  });

  // Fetch all students for child assignment (only when modal is open)
  const { students } = useStudentsPostgreSQL({
    schoolId,
    status: 'enrolled',
  });

  // Server-side pagination - calculate total pages from totalCount
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Use parents directly (already paginated from server)
  const paginatedParents = parents;

  // Filter unassigned students for assignment dropdown
  const filteredUnassignedStudents = useMemo(() => {
    if (!debouncedChildSearchQuery || !selectedParent) return [];
    return students.filter(s => {
      const name = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim();
      return !selectedParent.studentIds.includes(s.id) &&
             name.toLowerCase().includes(debouncedChildSearchQuery.toLowerCase());
    });
  }, [students, selectedParent, debouncedChildSearchQuery]);

  // Get assigned children for selected parent
  const assignedChildren = useMemo(() => {
    if (!selectedParent) return [];
    return students.filter(s => selectedParent.studentIds.includes(s.id));
  }, [students, selectedParent]);

  // Handle add parent
  const handleAddParent = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParent.name || !newParent.email) return;

    try {
      await createParent({
        schoolId,
        name: newParent.name,
        email: newParent.email,
        relationship: newParent.relationship || undefined,
        contactNumber: newParent.contactNumber || undefined,
        occupation: newParent.occupation || undefined,
        address: newParent.address || undefined,
        studentIds: [],
      });

      showToast('success', `✅ Parent "${newParent.name}" created successfully!`);
      
      setNewParent({ 
        name: '', 
        email: '', 
        relationship: '',
        contactNumber: '',
        occupation: '',
        address: ''
      });
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Failed to add parent:', err);
      showToast('error', 'Failed to create parent', err instanceof Error ? err.message : 'Please try again.');
    }
  }, [newParent, createParent, schoolId, showToast]);

  // Handle edit parent
  const handleEditClick = useCallback((parent: any) => {
    setSelectedParent({ ...parent });
    setIsEditModalOpen(true);
  }, []);

  const handleUpdateParent = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParent) return;

    // Store original data for comparison
    const originalParent = parents.find(p => p.id === selectedParent.id);
    const changes: string[] = [];
    
    if (originalParent) {
      if (originalParent.name !== selectedParent.name) changes.push(`Name: "${originalParent.name}" → "${selectedParent.name}"`);
      if (originalParent.email !== selectedParent.email) changes.push(`Email: "${originalParent.email}" → "${selectedParent.email}"`);
      if (originalParent.relationship !== selectedParent.relationship) changes.push(`Relationship: "${originalParent.relationship || 'N/A'}" → "${selectedParent.relationship || 'N/A'}"`);
      if (originalParent.contactNumber !== selectedParent.contactNumber) changes.push(`Contact: "${originalParent.contactNumber || 'N/A'}" → "${selectedParent.contactNumber || 'N/A'}"`);
      if (originalParent.occupation !== selectedParent.occupation) changes.push(`Occupation: "${originalParent.occupation || 'N/A'}" → "${selectedParent.occupation || 'N/A'}"`);
      if (originalParent.address !== selectedParent.address) changes.push(`Address: "${originalParent.address || 'N/A'}" → "${selectedParent.address || 'N/A'}"`);
    }

    try {
      await updateParent(selectedParent.id, {
        name: selectedParent.name,
        email: selectedParent.email,
        relationship: selectedParent.relationship,
        contactNumber: selectedParent.contactNumber,
        occupation: selectedParent.occupation,
        address: selectedParent.address,
      });

      const changesText = changes.length > 0 ? changes.join('; ') : 'No changes detected';
      showToast('success', `✅ Parent "${selectedParent.name}" updated successfully!`, changesText);

      setIsEditModalOpen(false);
      setSelectedParent(null);
    } catch (err) {
      console.error('Failed to update parent:', err);
      showToast('error', 'Failed to update parent', err instanceof Error ? err.message : 'Please try again.');
    }
  }, [selectedParent, updateParent, parents, showToast]);

  // Handle delete parent
  const handleDeleteClick = useCallback((parent: any) => {
    setSelectedParent(parent);
    setIsDeleteModalOpen(true);
  }, []);

  const confirmDeleteParent = useCallback(async () => {
    if (!selectedParent) return;

    const parentName = selectedParent.name;

    try {
      await deleteParent(selectedParent.id);
      showToast('success', `✅ Parent "${parentName}" deleted successfully!`);
      setIsDeleteModalOpen(false);
      setSelectedParent(null);
    } catch (err) {
      console.error('Failed to delete parent:', err);
      showToast('error', 'Failed to delete parent', err instanceof Error ? err.message : 'Please try again.');
    }
  }, [selectedParent, deleteParent, showToast]);

  // Handle manage children
  const handleManageChildrenClick = useCallback((parent: any) => {
    setSelectedParent(parent);
    setChildSearchQuery('');
    setIsManageChildrenModalOpen(true);
  }, []);

  const handleAssignStudent = useCallback(async (studentId: string) => {
    if (!selectedParent) return;

    const student = students.find(s => s.id === studentId);
    const studentName = student?.name || `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || 'Unknown';

    try {
      await assignStudentToParent(selectedParent.id, studentId);
      
      // Optimistic update
      setSelectedParent((prev: any) => prev ? { 
        ...prev, 
        studentIds: [...prev.studentIds, studentId] 
      } : null);
      
      showToast('success', `✅ Student "${studentName}" assigned to "${selectedParent.name}"`);
      setChildSearchQuery('');
    } catch (err) {
      console.error('Failed to assign student:', err);
      showToast('error', 'Failed to assign student', err instanceof Error ? err.message : 'Please try again.');
    }
  }, [selectedParent, assignStudentToParent, students, showToast]);

  const handleUnassignStudent = useCallback(async (studentId: string) => {
    if (!selectedParent) return;

    const student = students.find(s => s.id === studentId);
    const studentName = student?.name || `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || 'Unknown';

    try {
      await unassignStudentFromParent(selectedParent.id, studentId);
      
      // Optimistic update
      setSelectedParent((prev: any) => prev ? { 
        ...prev, 
        studentIds: prev.studentIds.filter((id: string) => id !== studentId) 
      } : null);
      
      showToast('success', `✅ Student "${studentName}" removed from "${selectedParent.name}"`);
    } catch (err) {
      console.error('Failed to unassign student:', err);
      showToast('error', 'Failed to remove student', err instanceof Error ? err.message : 'Please try again.');
    }
  }, [selectedParent, unassignStudentFromParent, students, showToast]);

  // Loading state with skeleton
  if (loading && parents.length === 0) {
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
          {[1, 2, 3, 4, 5].map(i => (
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
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Failed to Load Parents</h3>
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <UserGroupIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            </div>
            Parents Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">
            Manage parent accounts, contact information, and student relationships
          </p>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-white">{totalCount}</span> {totalCount === 1 ? 'parent' : 'parents'} total
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
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Parent
        </button>
      </div>

      {/* Enhanced Search Bar with Filter Chips */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by parent name, email, or contact number..." 
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

      {/* Enhanced Parents Table */}
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        {paginatedParents.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Parent Information
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Contact Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Additional Info
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Children
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {paginatedParents.map((parent) => (
                    <tr 
                      key={parent.id} 
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-150 group animate-fade-in"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                            <span className="text-white font-bold text-lg">
                              {parent.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                              {parent.name}
                            </div>
                            {parent.relationship && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                  {parent.relationship}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {parent.email ? (
                            <div className="flex items-center gap-2 text-sm text-slate-900 dark:text-white">
                              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <a href={`mailto:${parent.email}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                {parent.email}
                              </a>
                            </div>
                          ) : (
                            <div className="text-sm text-slate-400 dark:text-slate-500 italic">No email</div>
                          )}
                          {parent.contactNumber && (
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <a href={`tel:${parent.contactNumber}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                {parent.contactNumber}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {parent.occupation && (
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>{parent.occupation}</span>
                            </div>
                          )}
                          {parent.address && (
                            <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="line-clamp-2">{parent.address}</span>
                            </div>
                          )}
                          {!parent.occupation && !parent.address && (
                            <div className="text-xs text-slate-400 dark:text-slate-500 italic">No additional info</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleManageChildrenClick(parent)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            parent.studentIds?.length > 0
                              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span>{parent.studentIds?.length || 0}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleManageChildrenClick(parent)} 
                            className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                            title="Manage children"
                          >
                            Manage
                          </button>
                          <button 
                            onClick={() => handleEditClick(parent)} 
                            className="p-2 text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-all"
                            aria-label="Edit parent"
                            title="Edit parent"
                          >
                            <PencilIcon />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(parent)} 
                            className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            aria-label="Delete parent"
                            title="Delete parent"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Showing <span className="font-semibold text-slate-900 dark:text-white">{offset + 1}</span> to <span className="font-semibold text-slate-900 dark:text-white">{Math.min(offset + ITEMS_PER_PAGE, totalCount)}</span> of <span className="font-semibold text-slate-900 dark:text-white">{totalCount}</span> parents
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
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {searchQuery ? 'No Parents Found' : 'No Parents Yet'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {searchQuery 
                  ? `No parents match "${searchQuery}". Try a different search term.`
                  : 'Get started by adding your first parent to the system.'
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Your First Parent
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Parent Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Parent">
        <form onSubmit={handleAddParent} className="space-y-4">
          <div>
            <label htmlFor="add-parent-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input 
              id="add-parent-name"
              type="text" 
              value={newParent.name} 
              onChange={e => setNewParent(p => ({ ...p, name: e.target.value }))} 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              required 
            />
          </div>
          <div>
            <label htmlFor="add-parent-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input 
              id="add-parent-email"
              type="email" 
              value={newParent.email} 
              onChange={e => setNewParent(p => ({ ...p, email: e.target.value }))} 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              required 
            />
          </div>
          <div>
            <label htmlFor="add-parent-relationship" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Relationship
            </label>
            <select
              id="add-parent-relationship"
              value={newParent.relationship}
              onChange={e => setNewParent(p => ({ ...p, relationship: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Select...</option>
              <option value="Mother">Mother</option>
              <option value="Father">Father</option>
              <option value="Guardian">Guardian</option>
              <option value="Grandmother">Grandmother</option>
              <option value="Grandfather">Grandfather</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="add-parent-contact" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Contact Number
            </label>
            <input 
              id="add-parent-contact"
              type="tel" 
              value={newParent.contactNumber} 
              onChange={e => setNewParent(p => ({ ...p, contactNumber: e.target.value }))} 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="add-parent-occupation" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Occupation
            </label>
            <input 
              id="add-parent-occupation"
              type="text" 
              value={newParent.occupation} 
              onChange={e => setNewParent(p => ({ ...p, occupation: e.target.value }))} 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="add-parent-address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Address
            </label>
            <textarea 
              id="add-parent-address"
              value={newParent.address} 
              onChange={e => setNewParent(p => ({ ...p, address: e.target.value }))} 
              rows={2}
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
              Add Parent
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Parent Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Parent">
        <form onSubmit={handleUpdateParent} className="space-y-4">
          <div>
            <label htmlFor="edit-parent-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input 
              id="edit-parent-name"
              type="text" 
              value={selectedParent?.name || ''} 
              onChange={e => setSelectedParent((prev: any) => ({ ...prev, name: e.target.value }))} 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              required 
            />
          </div>
          <div>
            <label htmlFor="edit-parent-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input 
              id="edit-parent-email"
              type="email" 
              value={selectedParent?.email || ''} 
              onChange={e => setSelectedParent((prev: any) => ({ ...prev, email: e.target.value }))} 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              required 
            />
          </div>
          <div>
            <label htmlFor="edit-parent-relationship" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Relationship
            </label>
            <select
              id="edit-parent-relationship"
              value={selectedParent?.relationship || ''}
              onChange={e => setSelectedParent((prev: any) => ({ ...prev, relationship: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Select...</option>
              <option value="Mother">Mother</option>
              <option value="Father">Father</option>
              <option value="Guardian">Guardian</option>
              <option value="Grandmother">Grandmother</option>
              <option value="Grandfather">Grandfather</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="edit-parent-contact" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Contact Number
            </label>
            <input 
              id="edit-parent-contact"
              type="tel" 
              value={selectedParent?.contactNumber || ''} 
              onChange={e => setSelectedParent((prev: any) => ({ ...prev, contactNumber: e.target.value }))} 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="edit-parent-occupation" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Occupation
            </label>
            <input 
              id="edit-parent-occupation"
              type="text" 
              value={selectedParent?.occupation || ''} 
              onChange={e => setSelectedParent((prev: any) => ({ ...prev, occupation: e.target.value }))} 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="edit-parent-address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Address
            </label>
            <textarea 
              id="edit-parent-address"
              value={selectedParent?.address || ''} 
              onChange={e => setSelectedParent((prev: any) => ({ ...prev, address: e.target.value }))} 
              rows={2}
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
            Are you sure you want to delete the parent account for <span className="font-bold">{selectedParent?.name}</span>? 
            This will remove their access but will not delete student records.
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={() => setIsDeleteModalOpen(false)} 
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-600 rounded-md hover:bg-slate-200 dark:hover:bg-slate-500"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDeleteParent} 
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Delete Parent
            </button>
          </div>
        </div>
      </Modal>

      {/* Manage Children Modal */}
      <Modal 
        isOpen={isManageChildrenModalOpen} 
        onClose={() => setIsManageChildrenModalOpen(false)} 
        title={`Manage Children for ${selectedParent?.name}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Assigned Children */}
          <div>
            <h3 className="font-semibold text-lg mb-3 text-slate-800 dark:text-white">
              Assigned Children
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {assignedChildren.length > 0 ? (
                assignedChildren.map(child => (
                  <div 
                    key={child.id} 
                    className="flex items-center justify-between bg-slate-50 dark:bg-slate-700 p-3 rounded-md"
                  >
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {child.name}
                      </div>
                      {child.sectionName && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {child.sectionName}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleUnassignStudent(child.id)} 
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      aria-label="Unassign student"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm italic">
                  No children assigned yet.
                </p>
              )}
            </div>
          </div>

          {/* Assign New Child */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="font-semibold text-lg mb-3 text-slate-800 dark:text-white">
              Assign New Child
            </h3>
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Search Student to Assign
              </label>
              <input
                type="text"
                value={childSearchQuery}
                onChange={e => setChildSearchQuery(e.target.value)}
                placeholder="Type student name..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              />
              {debouncedChildSearchQuery && (
                <div className="absolute z-10 w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                  {filteredUnassignedStudents.length > 0 ? (
                    filteredUnassignedStudents.map(student => (
                      <div
                        key={student.id}
                        onClick={() => handleAssignStudent(student.id)}
                        className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer text-slate-900 dark:text-white"
                      >
                        <div className="font-medium">{student.name}</div>
                        {student.sectionName && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {student.sectionName}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-slate-500 dark:text-slate-400">
                      No students found.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button 
              onClick={() => setIsManageChildrenModalOpen(false)} 
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

export default ParentsViewPostgreSQL;
