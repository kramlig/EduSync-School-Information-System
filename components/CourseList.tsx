import React, { useState, useMemo } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import Modal from './Modal';
import type { LearningArea, AuthUser, StudentUser } from '../types';
import { TrashIcon, PencilIcon } from './icons';

interface LearningAreaListProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser, type: 'staff' | 'student' };
}

// Collapsible Section Component
const CollapsibleSection: React.FC<{
  title: string;
  count: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}> = ({ title, count, defaultExpanded = false, children }) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem(`learning-area-section-${title}`);
    return saved !== null ? saved === 'true' : defaultExpanded;
  });

  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem(`learning-area-section-${title}`, String(newState));
  };

  return (
    <div className="mb-4 bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
      <button
        onClick={toggleExpanded}
        className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{isExpanded ? '▼' : '▶'}</span>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h2>
          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-sm font-semibold">
            {count} subject{count !== 1 ? 's' : ''}
          </span>
        </div>
      </button>
      {isExpanded && (
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {children}
        </div>
      )}
    </div>
  );
};

// Subject Row Component
const SubjectRow: React.FC<{
  subject: LearningArea;
  onEdit: (subject: LearningArea) => void;
  onDelete: (subject: LearningArea) => void;
  isAdmin: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}> = ({ subject, onEdit, onDelete, isAdmin, isSelected, onToggleSelect }) => {
  return (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      {isAdmin && onToggleSelect && (
        <label className="mr-4 flex items-center" title={`Select ${subject.name}`}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(subject.id)}
            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            aria-label={`Select ${subject.name}`}
          />
        </label>
      )}
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-slate-900 dark:text-white">
            {subject.name}
          </h3>
          {subject.kToTwelveCode && (
            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-mono">
              {subject.kToTwelveCode}
            </span>
          )}
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            subject.category === 'core' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
            subject.category === 'specialized' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
            subject.category === 'elective' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
            subject.category === 'tle' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
            'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
          }`}>
            {subject.category?.toUpperCase() || 'CORE'}
          </span>
          {subject.isActive === false && (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
              INACTIVE
            </span>
          )}
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Grades {subject.gradeLevel?.join(', ') || 'N/A'} • {subject.credits} credit{subject.credits !== 1 ? 's' : ''}
          {subject.department && ` • ${subject.department}`}
        </div>
        {subject.description && (
          <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            {subject.description}
          </div>
        )}
      </div>
      {isAdmin && (
        <div className="flex items-center gap-2 ml-4">
          <button 
            onClick={() => onEdit(subject)} 
            className="flex items-center gap-1 px-3 py-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors font-semibold text-xs"
          >
            <PencilIcon /><span>Edit</span>
          </button>
          <button 
            onClick={() => onDelete(subject)} 
            className="flex items-center gap-1 px-3 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors font-semibold text-xs"
          >
            <TrashIcon /><span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

const LearningAreaList: React.FC<LearningAreaListProps> = ({ schoolData, session }) => {
  const { learningAreas, addLearningArea, updateLearningArea, deleteLearningArea } = schoolData;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<LearningArea | null>(null);
  const [editingArea, setEditingArea] = useState<LearningArea | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'credits' | 'gradeLevel'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; undo?: () => void } | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [newLearningArea, setNewLearningArea] = useState<Omit<LearningArea, 'id'>>({ 
    name: '', 
    credits: 3,
    category: 'core',
    gradeLevel: [1, 2, 3, 4, 5, 6], // Default to elementary
    isActive: true,
    department: '',
    order: 0,
    kToTwelveCode: ''
  });

  const authUser = session.user as AuthUser;

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Ctrl/Cmd + F - Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Ctrl/Cmd + N - New subject (admin only)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && authUser.role === 'admin') {
        e.preventDefault();
        setIsModalOpen(true);
      }
      // Escape - Close modals
      if (e.key === 'Escape') {
        if (isModalOpen) {
          handleModalClose();
        } else if (isDeleteModalOpen) {
          setIsDeleteModalOpen(false);
        } else if (isBulkDeleteModalOpen) {
          setIsBulkDeleteModalOpen(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [isModalOpen, isDeleteModalOpen, isBulkDeleteModalOpen, authUser.role]);

  // Auto-dismiss toast after 5 seconds
  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Statistics calculation
  const stats = useMemo(() => {
    if (!learningAreas || !Array.isArray(learningAreas)) {
      return {
        total: 0, elementary: 0, juniorHigh: 0, seniorHighCore: 0,
        seniorHighSTEM: 0, seniorHighABM: 0, seniorHighHUMSS: 0, seniorHighGAS: 0,
        byCategory: { core: 0, specialized: 0, elective: 0, tle: 0, sports: 0 },
        active: 0, inactive: 0
      };
    }
    const elementary = learningAreas.filter(a => a.gradeLevel && Array.isArray(a.gradeLevel) && Math.max(...a.gradeLevel) <= 6);
    const juniorHigh = learningAreas.filter(a => a.gradeLevel && Array.isArray(a.gradeLevel) && Math.max(...a.gradeLevel) > 6 && Math.max(...a.gradeLevel) <= 10);
    const seniorHigh = learningAreas.filter(a => a.gradeLevel && Array.isArray(a.gradeLevel) && Math.max(...a.gradeLevel) > 10);
    
    return {
      total: learningAreas.length,
      elementary: elementary.length,
      juniorHigh: juniorHigh.length,
      seniorHighCore: seniorHigh.filter(a => !a.trackRequired || a.trackRequired.length === 0).length,
      seniorHighSTEM: seniorHigh.filter(a => a.trackRequired?.includes('STEM')).length,
      seniorHighABM: seniorHigh.filter(a => a.trackRequired?.includes('ABM')).length,
      seniorHighHUMSS: seniorHigh.filter(a => a.trackRequired?.includes('HUMSS')).length,
      seniorHighGAS: seniorHigh.filter(a => a.trackRequired?.includes('GAS')).length,
      byCategory: {
        core: learningAreas.filter(a => a.category === 'core').length,
        specialized: learningAreas.filter(a => a.category === 'specialized').length,
        elective: learningAreas.filter(a => a.category === 'elective').length,
        tle: learningAreas.filter(a => a.category === 'tle').length,
        sports: learningAreas.filter(a => a.category === 'sports').length,
      },
      active: learningAreas.filter(a => a.isActive !== false).length,
      inactive: learningAreas.filter(a => a.isActive === false).length,
    };
  }, [learningAreas]);

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAreas.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAreas.map(a => a.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    const idsToDelete = Array.from(selectedIds);
    const deletedAreas = idsToDelete.map(id => learningAreas.find(a => a.id === id)!);
    
    idsToDelete.forEach(id => deleteLearningArea(id));
    
    setToast({
      message: `Deleted ${idsToDelete.length} learning area${idsToDelete.length !== 1 ? 's' : ''}`,
      type: 'success',
      undo: () => {
        deletedAreas.forEach(area => {
          if (area) {
            const { id, ...areaData } = area;
            addLearningArea(areaData);
          }
        });
        setToast({ message: 'Deletion undone', type: 'info' });
      }
    });
    
    setSelectedIds(new Set());
    setIsBulkDeleteModalOpen(false);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Code', 'Category', 'Credits', 'Grade Levels', 'Department', 'Active'];
    const rows = filteredAreas.map(area => [
      area.name,
      area.kToTwelveCode || '',
      area.category || '',
      area.credits,
      area.gradeLevel?.join(';') || '',
      area.department || '',
      area.isActive !== false ? 'Yes' : 'No'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-areas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    setToast({ message: `Exported ${filteredAreas.length} learning areas to CSV`, type: 'success' });
  };

  // Export to JSON
  const exportToJSON = () => {
    const jsonContent = JSON.stringify(filteredAreas, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-areas-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setToast({ message: `Exported ${filteredAreas.length} learning areas to JSON`, type: 'success' });
  };

  // Apply sorting to groups
  const sortAreas = (areas: LearningArea[]) => {
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

  // Filter learning areas based on search and filters
  const filteredAreas = useMemo(() => {
    if (!learningAreas || !Array.isArray(learningAreas)) {
      return [];
    }
    return learningAreas.filter(area => {
      // Search filter
      const matchesSearch = !searchQuery || 
        (area.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        area.kToTwelveCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        area.department?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = categoryFilter === 'all' || area.category === categoryFilter;
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && area.isActive !== false) ||
        (statusFilter === 'inactive' && area.isActive === false);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [learningAreas, searchQuery, categoryFilter, statusFilter]);

  // Group learning areas by education level
  const groupedAreas = useMemo(() => {
    const groups = {
      elementary: [] as LearningArea[],
      juniorHigh: [] as LearningArea[],
      seniorHigh: {
        core: [] as LearningArea[],
        stem: [] as LearningArea[],
        abm: [] as LearningArea[],
        humss: [] as LearningArea[],
        gas: [] as LearningArea[]
      }
    };

    filteredAreas.forEach(area => {
      if (!area.gradeLevel || !Array.isArray(area.gradeLevel) || area.gradeLevel.length === 0) return;
      
      const maxGrade = Math.max(...area.gradeLevel);
      
      if (maxGrade <= 6) {
        // Elementary
        groups.elementary.push(area);
      } else if (maxGrade <= 10) {
        // Junior High
        groups.juniorHigh.push(area);
      } else {
        // Senior High
        if (!area.trackRequired || area.trackRequired.length === 0) {
          // Core subjects (no track required)
          groups.seniorHigh.core.push(area);
        } else {
          // Track-specific subjects
          area.trackRequired.forEach(track => {
            const trackKey = track.toLowerCase() as keyof typeof groups.seniorHigh;
            if (groups.seniorHigh[trackKey]) {
              groups.seniorHigh[trackKey].push(area);
            }
          });
        }
      }
    });

    // Apply sorting to each group
    groups.elementary = sortAreas(groups.elementary);
    groups.juniorHigh = sortAreas(groups.juniorHigh);
    Object.keys(groups.seniorHigh).forEach(key => {
      groups.seniorHigh[key as keyof typeof groups.seniorHigh] = sortAreas(groups.seniorHigh[key as keyof typeof groups.seniorHigh]);
    });

    return groups;
  }, [filteredAreas, sortBy, sortOrder]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkboxValue = Number(value);
      const currentGrades = newLearningArea.gradeLevel || [];
      const newGrades = (e.target as HTMLInputElement).checked
        ? [...currentGrades, checkboxValue]
        : currentGrades.filter(g => g !== checkboxValue);
      setNewLearningArea(prev => ({ ...prev, gradeLevel: newGrades.sort() }));
    } else if (type === 'number') {
      setNewLearningArea(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setNewLearningArea(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddLearningArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLearningArea.name && newLearningArea.credits > 0) {
      if (editingArea) {
        // Update existing learning area
        updateLearningArea(editingArea.id, newLearningArea);
      } else {
        // Add new learning area
        addLearningArea(newLearningArea);
      }
      // Reset form
      setNewLearningArea({ 
        name: '', 
        credits: 3,
        category: 'core',
        gradeLevel: [1, 2, 3, 4, 5, 6], // Default to elementary
        isActive: true,
        department: '',
        order: 0,
        kToTwelveCode: ''
      });
      setEditingArea(null);
      setIsModalOpen(false);
    }
  };

  const handleEditClick = (area: LearningArea) => {
    setNewLearningArea({
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
      prerequisite: area.prerequisite
    });
    setEditingArea(area);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingArea(null);
    setNewLearningArea({ 
      name: '', 
      credits: 3,
      category: 'core',
      gradeLevel: [1, 2, 3, 4, 5, 6],
      isActive: true,
      department: '',
      order: 0,
      kToTwelveCode: ''
    });
  };
  
  const handleDeleteClick = (area: LearningArea) => {
    setAreaToDelete(area);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (areaToDelete) {
      deleteLearningArea(areaToDelete.id);
      setIsDeleteModalOpen(false);
      setAreaToDelete(null);
    }
  };

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg flex items-center justify-between gap-3 ${
          toast.type === 'success' ? 'bg-green-600 text-white' :
          toast.type === 'error' ? 'bg-red-600 text-white' :
          'bg-blue-600 text-white'
        } animate-fade-in`}>
          <span>{toast.message}</span>
          <div className="flex gap-2">
            {toast.undo && (
              <button
                onClick={() => { toast.undo!(); setToast(null); }}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-semibold"
              >
                Undo
              </button>
            )}
            <button
              onClick={() => setToast(null)}
              className="text-white/80 hover:text-white font-bold text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
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
                onClick={() => setShowStats(!showStats)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                {showStats ? 'Hide' : 'Show'} statistics
              </button>
            </p>
          </div>
          <div className="flex gap-2">
            {authUser.role === 'admin' && (
              <>
                <button
                  onClick={exportToCSV}
                  className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Export CSV
                </button>
                <button
                  onClick={exportToJSON}
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
              </>
            )}
          </div>
        </div>

        {/* Statistics Dashboard */}
        {showStats && (
          <div className="mt-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-lg shadow-md border border-indigo-100 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Curriculum Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.total}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Total Subjects</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.elementary}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Elementary</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.juniorHigh}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Junior High</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">{stats.seniorHighCore}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">SHS Core</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.active}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Active</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">{stats.inactive}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Inactive</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">By Category</h3>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 text-center text-sm">
                <div><span className="font-bold text-blue-600 dark:text-blue-400">{stats.byCategory.core}</span> Core</div>
                <div><span className="font-bold text-purple-600 dark:text-purple-400">{stats.byCategory.specialized}</span> Specialized</div>
                <div><span className="font-bold text-green-600 dark:text-green-400">{stats.byCategory.elective}</span> Elective</div>
                <div><span className="font-bold text-orange-600 dark:text-orange-400">{stats.byCategory.tle}</span> TLE</div>
                <div><span className="font-bold text-pink-600 dark:text-pink-400">{stats.byCategory.sports}</span> Sports</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Senior High Tracks</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-sm">
                <div><span className="font-bold text-indigo-600 dark:text-indigo-400">{stats.seniorHighSTEM}</span> STEM</div>
                <div><span className="font-bold text-blue-600 dark:text-blue-400">{stats.seniorHighABM}</span> ABM</div>
                <div><span className="font-bold text-purple-600 dark:text-purple-400">{stats.seniorHighHUMSS}</span> HUMSS</div>
                <div><span className="font-bold text-pink-600 dark:text-pink-400">{stats.seniorHighGAS}</span> GAS</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {authUser.role === 'admin' && selectedIds.size > 0 && (
        <div className="mb-4 bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700 p-4 rounded-lg flex items-center justify-between">
          <span className="text-indigo-800 dark:text-indigo-200 font-semibold">
            {selectedIds.size} subject{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkDelete}
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

      {/* Filters and Sorting */}
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
                const [field, order] = e.target.value.split('-') as ['name' | 'credits' | 'gradeLevel', 'asc' | 'desc'];
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
        
        {/* Bulk Select Checkbox */}
        {authUser.role === 'admin' && filteredAreas.length > 0 && (
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

      {/* Empty State */}
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
          {/* Elementary Section */}
          {groupedAreas.elementary.length > 0 && (
            <CollapsibleSection 
              title="📚 ELEMENTARY (Grades 1-6)" 
              count={groupedAreas.elementary.length}
              defaultExpanded={true}
            >
              {groupedAreas.elementary.map(subject => (
                <SubjectRow 
                  key={subject.id}
                  subject={subject}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  isAdmin={authUser.role === 'admin'}
                  isSelected={selectedIds.has(subject.id)}
                  onToggleSelect={toggleSelectOne}
                />
              ))}
            </CollapsibleSection>
          )}

          {/* Junior High Section */}
          {groupedAreas.juniorHigh.length > 0 && (
            <CollapsibleSection 
              title="🎓 JUNIOR HIGH (Grades 7-10)" 
              count={groupedAreas.juniorHigh.length}
              defaultExpanded={true}
            >
              {groupedAreas.juniorHigh.map(subject => (
                <SubjectRow 
                  key={subject.id}
                  subject={subject}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  isAdmin={authUser.role === 'admin'}
                  isSelected={selectedIds.has(subject.id)}
                  onToggleSelect={toggleSelectOne}
                />
              ))}
            </CollapsibleSection>
          )}

          {/* Senior High Section */}
          {(groupedAreas.seniorHigh.core.length > 0 || 
            groupedAreas.seniorHigh.stem.length > 0 ||
            groupedAreas.seniorHigh.abm.length > 0 ||
            groupedAreas.seniorHigh.humss.length > 0 ||
            groupedAreas.seniorHigh.gas.length > 0) && (
            <div className="mb-4">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 rounded-lg mb-3">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  🏆 SENIOR HIGH (Grades 11-12)
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm font-semibold">
                    {groupedAreas.seniorHigh.core.length + 
                     groupedAreas.seniorHigh.stem.length + 
                     groupedAreas.seniorHigh.abm.length + 
                     groupedAreas.seniorHigh.humss.length + 
                     groupedAreas.seniorHigh.gas.length} subjects
                  </span>
                </h2>
              </div>

              {/* Core Subjects */}
              {groupedAreas.seniorHigh.core.length > 0 && (
                <div className="ml-4 mb-3">
                  <CollapsibleSection 
                    title="📌 Core Subjects (All Tracks)" 
                    count={groupedAreas.seniorHigh.core.length}
                    defaultExpanded={false}
                  >
                    {groupedAreas.seniorHigh.core.map(subject => (
                      <SubjectRow 
                        key={subject.id}
                        subject={subject}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        isAdmin={authUser.role === 'admin'}
                        isSelected={selectedIds.has(subject.id)}
                        onToggleSelect={toggleSelectOne}
                      />
                    ))}
                  </CollapsibleSection>
                </div>
              )}

              {/* STEM Track */}
              {groupedAreas.seniorHigh.stem.length > 0 && (
                <div className="ml-4 mb-3">
                  <CollapsibleSection 
                    title="🔬 STEM Track" 
                    count={groupedAreas.seniorHigh.stem.length}
                    defaultExpanded={false}
                  >
                    {groupedAreas.seniorHigh.stem.map(subject => (
                      <SubjectRow 
                        key={subject.id}
                        subject={subject}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        isAdmin={authUser.role === 'admin'}
                        isSelected={selectedIds.has(subject.id)}
                        onToggleSelect={toggleSelectOne}
                      />
                    ))}
                  </CollapsibleSection>
                </div>
              )}

              {/* ABM Track */}
              {groupedAreas.seniorHigh.abm.length > 0 && (
                <div className="ml-4 mb-3">
                  <CollapsibleSection 
                    title="💼 ABM Track" 
                    count={groupedAreas.seniorHigh.abm.length}
                    defaultExpanded={false}
                  >
                    {groupedAreas.seniorHigh.abm.map(subject => (
                      <SubjectRow 
                        key={subject.id}
                        subject={subject}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        isAdmin={authUser.role === 'admin'}
                        isSelected={selectedIds.has(subject.id)}
                        onToggleSelect={toggleSelectOne}
                      />
                    ))}
                  </CollapsibleSection>
                </div>
              )}

              {/* HUMSS Track */}
              {groupedAreas.seniorHigh.humss.length > 0 && (
                <div className="ml-4 mb-3">
                  <CollapsibleSection 
                    title="💭 HUMSS Track" 
                    count={groupedAreas.seniorHigh.humss.length}
                    defaultExpanded={false}
                  >
                    {groupedAreas.seniorHigh.humss.map(subject => (
                      <SubjectRow 
                        key={subject.id}
                        subject={subject}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        isAdmin={authUser.role === 'admin'}
                        isSelected={selectedIds.has(subject.id)}
                        onToggleSelect={toggleSelectOne}
                      />
                    ))}
                  </CollapsibleSection>
                </div>
              )}

              {/* GAS Track */}
              {groupedAreas.seniorHigh.gas.length > 0 && (
                <div className="ml-4 mb-3">
                  <CollapsibleSection 
                    title="🌐 GAS Track" 
                    count={groupedAreas.seniorHigh.gas.length}
                    defaultExpanded={false}
                  >
                    {groupedAreas.seniorHigh.gas.map(subject => (
                      <SubjectRow 
                        key={subject.id}
                        subject={subject}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        isAdmin={authUser.role === 'admin'}
                        isSelected={selectedIds.has(subject.id)}
                        onToggleSelect={toggleSelectOne}
                      />
                    ))}
                  </CollapsibleSection>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <Modal isOpen={isModalOpen} onClose={handleModalClose} title={editingArea ? "Edit Learning Area" : "Add New Learning Area"}>
        <form onSubmit={handleAddLearningArea}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Learning Area Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text" name="name" id="name" value={newLearningArea.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category" id="category" value={newLearningArea.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                required
              >
                <option value="core">Core</option>
                <option value="specialized">Specialized</option>
                <option value="elective">Elective</option>
                <option value="tle">TLE</option>
                <option value="sports">Sports</option>
              </select>
            </div>

            <div>
              <label htmlFor="credits" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Credits <span className="text-red-500">*</span>
              </label>
              <input
                type="number" name="credits" id="credits" value={newLearningArea.credits}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                required min="1"
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <input
                type="text" name="department" id="department" value={newLearningArea.department}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                placeholder="e.g., Language, STEM"
              />
            </div>

            <div>
              <label htmlFor="kToTwelveCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                DepEd K-12 Code
              </label>
              <input
                type="text" name="kToTwelveCode" id="kToTwelveCode" value={newLearningArea.kToTwelveCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                placeholder="e.g., FIL, ENG, MATH"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Grade Levels <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-4">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-full">Elementary:</span>
                  {[1, 2, 3, 4, 5, 6].map(grade => (
                    <label key={grade} className="flex items-center">
                      <input
                        type="checkbox"
                        value={grade}
                        checked={newLearningArea.gradeLevel?.includes(grade) || false}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Grade {grade}</span>
                    </label>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-full">Junior High:</span>
                  {[7, 8, 9, 10].map(grade => (
                    <label key={grade} className="flex items-center">
                      <input
                        type="checkbox"
                        value={grade}
                        checked={newLearningArea.gradeLevel?.includes(grade) || false}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Grade {grade}</span>
                    </label>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-full">Senior High:</span>
                  {[11, 12].map(grade => (
                    <label key={grade} className="flex items-center">
                      <input
                        type="checkbox"
                        value={grade}
                        checked={newLearningArea.gradeLevel?.includes(grade) || false}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Grade {grade}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="order" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Display Order
              </label>
              <input
                type="number" name="order" id="order" value={newLearningArea.order}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                min="0"
              />
            </div>

            <div>
              <label htmlFor="hoursPerWeek" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Hours Per Week
              </label>
              <input
                type="number" name="hoursPerWeek" id="hoursPerWeek" value={newLearningArea.hoursPerWeek || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                min="1"
                placeholder="Optional"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                name="description" id="description" value={newLearningArea.description || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                placeholder="Brief description of the learning area"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
             <button type="button" onClick={handleModalClose} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
             <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
               {editingArea ? 'Update Learning Area' : 'Add Learning Area'}
             </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <p>Are you sure you want to delete the learning area <span className="font-bold">{areaToDelete?.name}</span>? This will also delete all associated grades for all students. This action cannot be undone.</p>
        <div className="flex justify-end space-x-2 mt-6">
            <button onClick={() => setIsDeleteModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
            <button onClick={confirmDelete} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">Delete Learning Area</button>
        </div>
      </Modal>

      <Modal isOpen={isBulkDeleteModalOpen} onClose={() => setIsBulkDeleteModalOpen(false)} title="Bulk Delete Confirmation">
        <p className="mb-4">
          Are you sure you want to delete <span className="font-bold">{selectedIds.size} learning area{selectedIds.size !== 1 ? 's' : ''}</span>? 
          This will also delete all associated grades for all students in these subjects.
        </p>
        <div className="mb-4 max-h-60 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Subjects to be deleted:</p>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            {Array.from(selectedIds).map(id => {
              const area = learningAreas.find(a => a.id === id);
              return area ? <li key={id}>• {area.name} ({area.kToTwelveCode || 'No code'})</li> : null;
            })}
          </ul>
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm font-semibold mb-4">
          ⚠️ This action cannot be undone!
        </p>
        <div className="flex justify-end space-x-2">
          <button 
            onClick={() => setIsBulkDeleteModalOpen(false)} 
            className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={confirmBulkDelete} 
            className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete {selectedIds.size} Subject{selectedIds.size !== 1 ? 's' : ''}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default LearningAreaList;