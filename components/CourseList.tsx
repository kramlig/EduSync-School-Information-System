/**
 * CourseList - Learning Areas Management Page
 * 
 * Optimized and refactored to use extracted components for better maintainability.
 * Uses PostgreSQL backend via useLearningAreasPostgreSQL hook.
 * 
 * Features:
 * - CRUD operations for learning areas
 * - Search, filter, and sort functionality
 * - Bulk selection and deletion
 * - CSV/JSON export
 * - Statistics dashboard
 * - Keyboard shortcuts (Ctrl+F, Ctrl+N, Escape)
 * 
 * @module components/CourseList
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useLearningAreasPostgreSQL } from '../src/hooks/useLearningAreasPostgreSQL';
import type { LearningArea, AuthUser, StudentUser } from '../types';
import {
  CollapsibleSection,
  SubjectRow,
  StatisticsDashboard,
  LearningAreaFormModal,
  DeleteConfirmationModal,
  BulkDeleteConfirmationModal,
  Toast,
} from './learning-areas';
import type { Stats } from './learning-areas';

// ==================== Types ====================

interface LearningAreaListProps {
  session: { user: AuthUser | StudentUser; type: 'staff' | 'student' };
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  undo?: () => void;
}

type SortField = 'name' | 'credits' | 'gradeLevel';
type SortOrder = 'asc' | 'desc';

// ==================== Constants ====================

const DEFAULT_FORM_DATA: Omit<LearningArea, 'id' | 'schoolId'> = {
  name: '',
  credits: 3,
  category: 'core',
  gradeLevel: [1, 2, 3, 4, 5, 6],
  isActive: true,
  department: '',
  order: 0,
  kToTwelveCode: '',
};

// ==================== Utility Functions ====================

/** Calculate statistics from learning areas */
const calculateStats = (areas: LearningArea[]): Stats => {
  if (!areas || !Array.isArray(areas)) {
    return {
      total: 0, elementary: 0, juniorHigh: 0, seniorHighCore: 0,
      seniorHighSTEM: 0, seniorHighABM: 0, seniorHighHUMSS: 0, seniorHighGAS: 0,
      byCategory: { core: 0, specialized: 0, elective: 0, tle: 0, sports: 0 },
      active: 0, inactive: 0,
    };
  }

  const getMaxGrade = (a: LearningArea) => 
    a.gradeLevel && Array.isArray(a.gradeLevel) ? Math.max(...a.gradeLevel) : 0;

  const elementary = areas.filter(a => getMaxGrade(a) <= 6 && getMaxGrade(a) > 0);
  const juniorHigh = areas.filter(a => getMaxGrade(a) > 6 && getMaxGrade(a) <= 10);
  const seniorHigh = areas.filter(a => getMaxGrade(a) > 10);

  return {
    total: areas.length,
    elementary: elementary.length,
    juniorHigh: juniorHigh.length,
    seniorHighCore: seniorHigh.filter(a => !a.trackRequired?.length).length,
    seniorHighSTEM: seniorHigh.filter(a => a.trackRequired?.includes('STEM')).length,
    seniorHighABM: seniorHigh.filter(a => a.trackRequired?.includes('ABM')).length,
    seniorHighHUMSS: seniorHigh.filter(a => a.trackRequired?.includes('HUMSS')).length,
    seniorHighGAS: seniorHigh.filter(a => a.trackRequired?.includes('GAS')).length,
    byCategory: {
      core: areas.filter(a => a.category === 'core').length,
      specialized: areas.filter(a => a.category === 'specialized').length,
      elective: areas.filter(a => a.category === 'elective').length,
      tle: areas.filter(a => a.category === 'tle').length,
      sports: areas.filter(a => a.category === 'sports').length,
    },
    active: areas.filter(a => a.isActive !== false).length,
    inactive: areas.filter(a => a.isActive === false).length,
  };
};

/** Sort learning areas by specified field and order */
const sortAreas = (areas: LearningArea[], sortBy: SortField, sortOrder: SortOrder): LearningArea[] => {
  return [...areas].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'name') {
      comparison = (a.name || '').localeCompare(b.name || '');
    } else if (sortBy === 'credits') {
      comparison = a.credits - b.credits;
    } else if (sortBy === 'gradeLevel') {
      const aMin = Math.min(...(a.gradeLevel || [1]));
      const bMin = Math.min(...(b.gradeLevel || [1]));
      comparison = aMin - bMin;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
};

/** Export data to CSV */
const exportToCSV = (areas: LearningArea[]): void => {
  const headers = ['Name', 'Code', 'Category', 'Credits', 'Grade Levels', 'Department', 'Active'];
  const rows = areas.map(area => [
    area.name,
    area.kToTwelveCode || '',
    area.category || '',
    area.credits,
    area.gradeLevel?.join(';') || '',
    area.department || '',
    area.isActive !== false ? 'Yes' : 'No',
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `learning-areas-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/** Export data to JSON */
const exportToJSON = (areas: LearningArea[]): void => {
  const jsonContent = JSON.stringify(areas, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `learning-areas-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// ==================== Main Component ====================

const LearningAreaList: React.FC<LearningAreaListProps> = ({ session }) => {
  // Data hooks
  const {
    learningAreas,
    loading,
    error,
    addLearningArea,
    updateLearningArea,
    deleteLearningArea,
    bulkDeleteLearningAreas,
  } = useLearningAreasPostgreSQL();

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<LearningArea, 'id' | 'schoolId'>>(DEFAULT_FORM_DATA);
  const [editingArea, setEditingArea] = useState<LearningArea | null>(null);
  const [areaToDelete, setAreaToDelete] = useState<LearningArea | null>(null);

  // Filter/Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Derived data
  const authUser = session.user as AuthUser;
  const isAdmin = authUser.role === 'admin';

  // ==================== Memoized Computations ====================

  const stats = useMemo(() => calculateStats(learningAreas), [learningAreas]);

  const filteredAreas = useMemo(() => {
    if (!learningAreas || !Array.isArray(learningAreas)) return [];
    
    return learningAreas.filter(area => {
      const matchesSearch = !searchQuery ||
        area.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        area.kToTwelveCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        area.department?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || area.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && area.isActive !== false) ||
        (statusFilter === 'inactive' && area.isActive === false);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [learningAreas, searchQuery, categoryFilter, statusFilter]);

  const groupedAreas = useMemo(() => {
    const groups = {
      elementary: [] as LearningArea[],
      juniorHigh: [] as LearningArea[],
      seniorHigh: {
        core: [] as LearningArea[],
        stem: [] as LearningArea[],
        abm: [] as LearningArea[],
        humss: [] as LearningArea[],
        gas: [] as LearningArea[],
      },
    };

    filteredAreas.forEach(area => {
      if (!area.gradeLevel?.length) return;
      
      const maxGrade = Math.max(...area.gradeLevel);
      
      if (maxGrade <= 6) {
        groups.elementary.push(area);
      } else if (maxGrade <= 10) {
        groups.juniorHigh.push(area);
      } else {
        if (!area.trackRequired?.length) {
          groups.seniorHigh.core.push(area);
        } else {
          area.trackRequired.forEach(track => {
            const trackKey = track.toLowerCase() as keyof typeof groups.seniorHigh;
            if (groups.seniorHigh[trackKey]) {
              groups.seniorHigh[trackKey].push(area);
            }
          });
        }
      }
    });

    // Sort each group
    groups.elementary = sortAreas(groups.elementary, sortBy, sortOrder);
    groups.juniorHigh = sortAreas(groups.juniorHigh, sortBy, sortOrder);
    Object.keys(groups.seniorHigh).forEach(key => {
      const k = key as keyof typeof groups.seniorHigh;
      groups.seniorHigh[k] = sortAreas(groups.seniorHigh[k], sortBy, sortOrder);
    });

    return groups;
  }, [filteredAreas, sortBy, sortOrder]);

  // ==================== Event Handlers ====================

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkboxValue = Number(value);
      setFormData(prev => {
        const currentGrades = prev.gradeLevel || [];
        const newGrades = (e.target as HTMLInputElement).checked
          ? [...currentGrades, checkboxValue]
          : currentGrades.filter(g => g !== checkboxValue);
        return { ...prev, gradeLevel: newGrades.sort((a, b) => a - b) };
      });
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setEditingArea(null);
    setFormData(DEFAULT_FORM_DATA);
  }, []);

  const handleEditClick = useCallback((area: LearningArea) => {
    setFormData({
      name: area.name,
      credits: area.credits,
      category: area.category || 'core',
      gradeLevel: area.gradeLevel || [1, 2, 3, 4, 5, 6],
      isActive: area.isActive !== false,
      department: area.department || '',
      order: area.order || 0,
      kToTwelveCode: area.kToTwelveCode || '',
      isComposite: area.isComposite,
      subSubjects: area.subSubjects,
      description: area.description,
      hoursPerWeek: area.hoursPerWeek,
      semesterBased: area.semesterBased,
      trackRequired: area.trackRequired,
      prerequisite: area.prerequisite,
    });
    setEditingArea(area);
    setIsModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((area: LearningArea) => {
    setAreaToDelete(area);
    setIsDeleteModalOpen(true);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.credits <= 0) return;

    try {
      if (editingArea) {
        await updateLearningArea(editingArea.id, formData);
        setToast({ message: 'Learning area updated successfully', type: 'success' });
      } else {
        await addLearningArea(formData);
        setToast({ message: 'Learning area added successfully', type: 'success' });
      }
      handleModalClose();
    } catch {
      setToast({ message: 'Failed to save learning area', type: 'error' });
    }
  }, [formData, editingArea, addLearningArea, updateLearningArea, handleModalClose]);

  const confirmDelete = useCallback(async () => {
    if (!areaToDelete) return;
    
    try {
      await deleteLearningArea(areaToDelete.id);
      setToast({ message: 'Learning area deleted successfully', type: 'success' });
      setIsDeleteModalOpen(false);
      setAreaToDelete(null);
    } catch {
      setToast({ message: 'Failed to delete learning area', type: 'error' });
    }
  }, [areaToDelete, deleteLearningArea]);

  const confirmBulkDelete = useCallback(async () => {
    const idsToDelete = Array.from(selectedIds);
    const deletedAreas = idsToDelete.map(id => learningAreas.find(a => a.id === id)).filter(Boolean) as LearningArea[];

    try {
      await bulkDeleteLearningAreas(idsToDelete);
      setToast({
        message: `Deleted ${idsToDelete.length} learning area${idsToDelete.length !== 1 ? 's' : ''}`,
        type: 'success',
        undo: async () => {
          for (const area of deletedAreas) {
            const { id: _id, schoolId: _schoolId, ...areaData } = area;
            await addLearningArea(areaData);
          }
          setToast({ message: 'Deletion undone', type: 'info' });
        },
      });
      setSelectedIds(new Set());
      setIsBulkDeleteModalOpen(false);
    } catch {
      setToast({ message: 'Failed to delete learning areas', type: 'error' });
    }
  }, [selectedIds, learningAreas, bulkDeleteLearningAreas, addLearningArea]);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => 
      prev.size === filteredAreas.length ? new Set() : new Set(filteredAreas.map(a => a.id))
    );
  }, [filteredAreas]);

  const toggleSelectOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleExportCSV = useCallback(() => {
    exportToCSV(filteredAreas);
    setToast({ message: `Exported ${filteredAreas.length} learning areas to CSV`, type: 'success' });
  }, [filteredAreas]);

  const handleExportJSON = useCallback(() => {
    exportToJSON(filteredAreas);
    setToast({ message: `Exported ${filteredAreas.length} learning areas to JSON`, type: 'success' });
  }, [filteredAreas]);

  // ==================== Effects ====================

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && isAdmin) {
        e.preventDefault();
        setIsModalOpen(true);
      }
      if (e.key === 'Escape') {
        if (isModalOpen) handleModalClose();
        else if (isDeleteModalOpen) setIsDeleteModalOpen(false);
        else if (isBulkDeleteModalOpen) setIsBulkDeleteModalOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [isModalOpen, isDeleteModalOpen, isBulkDeleteModalOpen, isAdmin, handleModalClose]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ==================== Render Helpers ====================

  const renderSeniorHighSection = () => {
    const { core, stem, abm, humss, gas } = groupedAreas.seniorHigh;
    const totalSHS = core.length + stem.length + abm.length + humss.length + gas.length;
    
    if (totalSHS === 0) return null;

    const tracks = [
      { key: 'core', title: '📌 Core Subjects (All Tracks)', areas: core },
      { key: 'stem', title: '🔬 STEM Track', areas: stem },
      { key: 'abm', title: '💼 ABM Track', areas: abm },
      { key: 'humss', title: '💭 HUMSS Track', areas: humss },
      { key: 'gas', title: '🌐 GAS Track', areas: gas },
    ];

    return (
      <div className="mb-4">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 rounded-lg mb-3">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            🏆 SENIOR HIGH (Grades 11-12)
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm font-semibold">
              {totalSHS} subjects
            </span>
          </h2>
        </div>
        
        {tracks.map(({ key, title, areas }) => 
          areas.length > 0 && (
            <div key={key} className="ml-4 mb-3">
              <CollapsibleSection title={title} count={areas.length} defaultExpanded={false}>
                {areas.map(subject => (
                  <SubjectRow
                    key={subject.id}
                    subject={subject}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                    isAdmin={isAdmin}
                    isSelected={selectedIds.has(subject.id)}
                    onToggleSelect={toggleSelectOne}
                  />
                ))}
              </CollapsibleSection>
            </div>
          )
        )}
      </div>
    );
  };

  // ==================== Main Render ====================

  return (
    <div>
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading learning areas...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-200 font-semibold">Error loading learning areas</p>
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error.message}</p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          undo={toast.undo}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Learning Areas Management</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {learningAreas.length} subject{learningAreas.length !== 1 ? 's' : ''} across K-12 curriculum
              <span className="mx-2">•</span>
              <button
                onClick={() => setShowStats(prev => !prev)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                {showStats ? 'Hide' : 'Show'} statistics
              </button>
            </p>
          </div>
          
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Export CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Export JSON
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                + Add Learning Area
              </button>
            </div>
          )}
        </div>

        {/* Statistics Dashboard */}
        {showStats && <StatisticsDashboard stats={stats} />}
      </div>

      {/* Bulk Actions Bar */}
      {isAdmin && selectedIds.size > 0 && (
        <div className="mb-4 bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700 p-4 rounded-lg flex items-center justify-between">
          <span className="text-indigo-800 dark:text-indigo-200 font-semibold">
            {selectedIds.size} subject{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors text-sm"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Search <span className="text-xs text-slate-500">(Ctrl+F)</span>
            </label>
            <input
              ref={searchInputRef}
              id="search"
              type="text"
              placeholder="Search by name, code, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              id="category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="all">All Categories</option>
              <option value="core">Core</option>
              <option value="specialized">Specialized</option>
              <option value="elective">Elective</option>
              <option value="tle">TLE</option>
              <option value="sports">Sports</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Sort By
            </label>
            <select
              id="sort"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-') as [SortField, SortOrder];
                setSortBy(field);
                setSortOrder(order);
              }}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="credits-asc">Credits (Low-High)</option>
              <option value="credits-desc">Credits (High-Low)</option>
              <option value="gradeLevel-asc">Grade Level (Low-High)</option>
              <option value="gradeLevel-desc">Grade Level (High-Low)</option>
            </select>
          </div>
        </div>
        
        {/* Bulk Select */}
        {isAdmin && filteredAreas.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredAreas.length && filteredAreas.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 mr-2"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Select all {filteredAreas.length} subject{filteredAreas.length !== 1 ? 's' : ''}
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Content */}
      {filteredAreas.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center">
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'No learning areas match your filters.'
              : 'No learning areas yet. Click "Add Learning Area" to get started.'}
          </p>
        </div>
      ) : (
        <>
          {/* Elementary */}
          {groupedAreas.elementary.length > 0 && (
            <CollapsibleSection
              title="📚 ELEMENTARY (Grades 1-6)"
              count={groupedAreas.elementary.length}
              defaultExpanded
            >
              {groupedAreas.elementary.map(subject => (
                <SubjectRow
                  key={subject.id}
                  subject={subject}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  isAdmin={isAdmin}
                  isSelected={selectedIds.has(subject.id)}
                  onToggleSelect={toggleSelectOne}
                />
              ))}
            </CollapsibleSection>
          )}

          {/* Junior High */}
          {groupedAreas.juniorHigh.length > 0 && (
            <CollapsibleSection
              title="🎓 JUNIOR HIGH (Grades 7-10)"
              count={groupedAreas.juniorHigh.length}
              defaultExpanded
            >
              {groupedAreas.juniorHigh.map(subject => (
                <SubjectRow
                  key={subject.id}
                  subject={subject}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  isAdmin={isAdmin}
                  isSelected={selectedIds.has(subject.id)}
                  onToggleSelect={toggleSelectOne}
                />
              ))}
            </CollapsibleSection>
          )}

          {/* Senior High */}
          {renderSeniorHighSection()}
        </>
      )}

      {/* Modals */}
      <LearningAreaFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        formData={formData}
        isEditing={!!editingArea}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        area={areaToDelete}
        onConfirm={confirmDelete}
      />

      <BulkDeleteConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        selectedIds={selectedIds}
        learningAreas={learningAreas}
        onConfirm={confirmBulkDelete}
      />
    </div>
  );
};

export default LearningAreaList;
