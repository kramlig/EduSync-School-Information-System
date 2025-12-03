/**
 * SectionsViewOptimized - PostgreSQL-powered Sections Management
 * 
 * Features:
 * - PostgreSQL integration with real-time updates
 * - Enhanced UI with card and table views
 * - Search and filtering by grade level
 * - Student count and capacity tracking
 * - Statistics dashboard
 * - Responsive design with dark mode
 * 
 * IMPORTANT: Uses memoization to prevent infinite render loops
 * The dataKeys array is memoized to prevent infinite loops from useSchoolData
 */

import React, { useState, useMemo, useEffect } from 'react';
// import { useSchoolData } from '../hooks/useSchoolData'; // REMOVED: Production PostgreSQL
import { useSectionsPostgreSQL } from '../src/hooks/useSectionsPostgreSQL';
import type { Section, AuthUser, StudentUser } from '../types';
import Modal from './Modal';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon, Squares2X2Icon, ListBulletIcon } from './icons';

interface SectionsViewOptimizedProps {
  session: { user: AuthUser | StudentUser, type: 'staff' | 'student' };
}

const SectionsViewOptimized: React.FC<SectionsViewOptimizedProps> = ({ session }) => {
  // Memoize dataKeys array to prevent infinite render loops
  // const dataKeys = useMemo(() => ['teachers', 'settings'], []); // REMOVED
  // const { teachers, settings } = useSchoolData(dataKeys); // REMOVED: Production PostgreSQL
  const teachers: any[] = []; // TEMPORARY: Load from PostgreSQL
  const settings = { schoolYear: '2024-2025' }; // TEMPORARY: Load from PostgreSQL
  
  // Get school ID from user session and school year from settings (memoized to prevent loops)
  const schoolId = useMemo(() => session.user.schoolId || '', [session.user.schoolId]);
  const currentSchoolYear = useMemo(() => settings?.schoolYear || '2024-2025', [settings]);
  
  // Memoize feature flags
  const USE_POSTGRESQL = useMemo(
    () => import.meta.env.VITE_USE_POSTGRESQL === 'true',
    []
  );

  // UI State - must be before hook that uses selectedSchoolYear
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sectionToEdit, setSectionToEdit] = useState<Section | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<number | 'all'>('all');
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(currentSchoolYear);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // PostgreSQL integration - uses selectedSchoolYear
  const { 
    sections, 
    loading, 
    error,
    createSection: createSectionPG, 
    updateSection: updateSectionPG, 
    deleteSection: deleteSectionPG,
    refetch: refetchSections // Get refetch function
  } = useSectionsPostgreSQL({
    schoolId,
    schoolYear: selectedSchoolYear, // Use selected school year
    includeAdviser: true,
    includeStudentCount: true
  });

  const [newSection, setNewSection] = useState<Omit<Section, 'id'>>({
    gradeLevel: 1,
    name: '',
    adviserId: '',
    schoolId,
    schoolYear: selectedSchoolYear,
    capacity: 40
  });

  // Update newSection when selectedSchoolYear changes
  useEffect(() => {
    setNewSection(prev => ({ ...prev, schoolYear: selectedSchoolYear }));
  }, [selectedSchoolYear]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const authUser = session.user as AuthUser;
  const canManageSections = ['admin', 'registrar'].includes(authUser.role);

  // Statistics
  const statistics = useMemo(() => {
    const totalSections = sections.length;
    const totalStudents = sections.reduce((sum, s) => sum + (s.studentCount || 0), 0);
    const totalCapacity = sections.reduce((sum, s) => sum + (s.capacity || 40), 0);
    const utilizationRate = totalCapacity > 0 ? (totalStudents / totalCapacity) * 100 : 0;
    
    const byGrade = sections.reduce((acc, s) => {
      const grade = s.gradeLevel;
      if (!acc[grade]) acc[grade] = { sections: 0, students: 0 };
      acc[grade].sections++;
      acc[grade].students += s.studentCount || 0;
      return acc;
    }, {} as Record<number, { sections: number; students: number }>);

    return {
      totalSections,
      totalStudents,
      totalCapacity,
      utilizationRate,
      byGrade
    };
  }, [sections]);

  // Filtered sections
  const filteredSections = useMemo(() => {
    return sections.filter(section => {
      const matchesSearch = searchQuery === '' || 
        section.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (section.adviserName && section.adviserName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesGrade = selectedGradeLevel === 'all' || section.gradeLevel === selectedGradeLevel;
      
      return matchesSearch && matchesGrade;
    });
  }, [sections, searchQuery, selectedGradeLevel]);

  // Grouped by level for better UX
  const groupedSections = useMemo(() => {
    const groups = {
      elementary: [] as typeof sections,
      juniorHigh: [] as typeof sections,
      seniorHigh: [] as typeof sections
    };

    filteredSections.forEach(section => {
      const grade = typeof section.gradeLevel === 'number' ? section.gradeLevel : parseInt(section.gradeLevel);
      if (grade <= 6) groups.elementary.push(section);
      else if (grade <= 10) groups.juniorHigh.push(section);
      else groups.seniorHigh.push(section);
    });

    return groups;
  }, [filteredSections]);

  // Event Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumber = e.target.type === 'number';
    setNewSection(prev => ({ ...prev, [name]: isNumber ? parseInt(value, 10) : value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!sectionToEdit) return;
    const { name, value } = e.target;
    const isNumber = e.target.type === 'number';
    setSectionToEdit(prev => ({...prev!, [name]: isNumber ? parseInt(value, 10) : value }));
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSection.name && newSection.gradeLevel) {
      try {
        await createSectionPG(newSection);
        setNewSection({ gradeLevel: 1, name: '', adviserId: '', schoolId, schoolYear: selectedSchoolYear, capacity: 40 });
        setIsAddModalOpen(false);
        setToast({ message: `✓ Section "${newSection.name}" created successfully`, type: 'success' });
      } catch (error: any) {
        console.error('Error adding section:', error);
        
        // Handle duplicate section error
        if (error?.code === '23505') {
          alert(`❌ Section "${newSection.name}" already exists for Grade ${newSection.gradeLevel} in ${newSection.schoolYear}.\n\nPlease use a different name (e.g., "${newSection.name}-2", "AGUINALDO", "MABINI").`);
        } else {
          alert('Failed to add section. Please try again.');
        }
      }
    }
  };

  const handleEditClick = (section: Section) => {
    setSectionToEdit({ ...section });
    setIsEditModalOpen(true);
  };

  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sectionToEdit) {
      try {
        // Only send editable fields to avoid issues with read-only properties
        const updates = {
          name: sectionToEdit.name,
          gradeLevel: sectionToEdit.gradeLevel,
          adviserId: sectionToEdit.adviserId || null, // Convert empty string to null
          capacity: (sectionToEdit as any).capacity,
          room: (sectionToEdit as any).room
        };
        
        await updateSectionPG(sectionToEdit.id, updates);
        
        // Manually refetch to ensure UI updates immediately
        await refetchSections();
        
        setIsEditModalOpen(false);
        setSectionToEdit(null);
        setToast({ message: `✓ Section "${sectionToEdit.name}" updated successfully`, type: 'success' });
      } catch (error: any) {
        console.error('[SectionsViewOptimized] Error updating section:', error);
        
        // Show user-friendly error messages
        if (error?.code === '23505') {
          alert(`❌ A section with this name already exists for Grade ${sectionToEdit.gradeLevel}.\n\nPlease choose a different name.`);
        } else {
          alert(`Failed to update section: ${error?.message || 'Unknown error'}. Please try again.`);
        }
      }
    }
  };

  const handleDeleteClick = (section: Section) => {
    setSectionToDelete(section);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (sectionToDelete) {
      try {
        await deleteSectionPG(sectionToDelete.id);
        setIsDeleteModalOpen(false);
        setSectionToDelete(null);
        setToast({ message: `✓ Section "${sectionToDelete.name}" deleted successfully`, type: 'success' });
      } catch (error) {
        console.error('Error deleting section:', error);
        alert('Failed to delete section. It may have students enrolled.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error Loading Sections</h3>
        <p className="text-red-600 dark:text-red-300">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Sections Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            SY {selectedSchoolYear}
          </p>
        </div>
        {canManageSections && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            + Add Section
          </button>
        )}
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-1">Total Sections</div>
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{statistics.totalSections}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <div className="text-green-600 dark:text-green-400 text-sm font-medium mb-1">Total Students</div>
          <div className="text-3xl font-bold text-green-900 dark:text-green-100">{statistics.totalStudents}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <div className="text-purple-600 dark:text-purple-400 text-sm font-medium mb-1">Total Capacity</div>
          <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{statistics.totalCapacity}</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
          <div className="text-amber-600 dark:text-amber-400 text-sm font-medium mb-1">Utilization</div>
          <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">{statistics.utilizationRate.toFixed(1)}%</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                <MagnifyingGlassIcon />
              </div>
              <input
                type="text"
                placeholder="Search sections or advisers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>

          {/* School Year Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">SY:</label>
            <select
              value={selectedSchoolYear}
              onChange={(e) => setSelectedSchoolYear(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="2024-2025">2024-2025</option>
              <option value="2023-2024">2023-2024</option>
              <option value="2025-2026">2025-2026</option>
            </select>
          </div>

          {/* Grade Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Grade:</label>
            <select
              value={selectedGradeLevel}
              onChange={(e) => setSelectedGradeLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="all">All Grades</option>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Squares2X2Icon />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ListBulletIcon />
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchQuery || selectedGradeLevel !== 'all') && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-slate-600 dark:text-slate-400">Active filters:</span>
            {searchQuery && (
              <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full">
                Search: "{searchQuery}"
              </span>
            )}
            {selectedGradeLevel !== 'all' && (
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
                Grade {selectedGradeLevel}
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGradeLevel('all');
              }}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Sections Display */}
      {filteredSections.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-12 text-center border border-slate-200 dark:border-slate-700">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">No sections found</h3>
          <p className="text-slate-600 dark:text-slate-400">
            {searchQuery || selectedGradeLevel !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first section to get started'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="space-y-8">
          {/* Elementary */}
          {groupedSections.elementary.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">📚</span> Elementary (Grades 1-6)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedSections.elementary.map(section => (
                  <SectionCard 
                    key={section.id} 
                    section={section} 
                    teachers={teachers}
                    canManage={canManageSections}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Junior High */}
          {groupedSections.juniorHigh.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🎓</span> Junior High School (Grades 7-10)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedSections.juniorHigh.map(section => (
                  <SectionCard 
                    key={section.id} 
                    section={section} 
                    teachers={teachers}
                    canManage={canManageSections}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Senior High */}
          {groupedSections.seniorHigh.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🎯</span> Senior High School (Grades 11-12)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedSections.seniorHigh.map(section => (
                  <SectionCard 
                    key={section.id} 
                    section={section} 
                    teachers={teachers}
                    canManage={canManageSections}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <SectionTable 
          sections={filteredSections}
          teachers={teachers}
          canManage={canManageSections}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Section">
        <form onSubmit={handleAddSection} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="gradeLevel" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Grade Level <span className="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                name="gradeLevel" 
                id="gradeLevel" 
                min="1" 
                max="12" 
                value={newSection.gradeLevel} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white" 
                required 
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Section Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                name="name" 
                id="name" 
                value={newSection.name} 
                onChange={handleInputChange} 
                placeholder="e.g., St. Peter, Sampaguita"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white" 
                required 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Capacity
              </label>
              <input 
                type="number" 
                name="capacity" 
                id="capacity" 
                min="1" 
                value={newSection.capacity} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white" 
              />
            </div>
            <div>
              <label htmlFor="room" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Room Number
              </label>
              <input 
                type="text" 
                name="room" 
                id="room" 
                value={newSection.room || ''} 
                onChange={handleInputChange} 
                placeholder="e.g., Room 101"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white" 
              />
            </div>
          </div>

          <div>
            <label htmlFor="adviserId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Class Adviser
            </label>
            <select 
              name="adviserId" 
              id="adviserId" 
              value={newSection.adviserId ?? ''} 
              onChange={handleInputChange} 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">No adviser assigned</option>
              {teachers.filter(t => t.role === 'teacher').map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button 
              type="button" 
              onClick={() => setIsAddModalOpen(false)} 
              className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Section
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Section">
        <form onSubmit={handleUpdateSection} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-gradeLevel" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Grade Level <span className="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                name="gradeLevel" 
                id="edit-gradeLevel" 
                min="1" 
                max="12" 
                value={sectionToEdit?.gradeLevel ?? 1} 
                onChange={handleEditInputChange} 
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white" 
                required 
              />
            </div>
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Section Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                name="name" 
                id="edit-name" 
                value={sectionToEdit?.name ?? ''} 
                onChange={handleEditInputChange} 
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white" 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-capacity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Capacity
              </label>
              <input 
                type="number" 
                name="capacity" 
                id="edit-capacity" 
                min="1" 
                value={sectionToEdit?.capacity ?? 40} 
                onChange={handleEditInputChange} 
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white" 
              />
            </div>
            <div>
              <label htmlFor="edit-room" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Room Number
              </label>
              <input 
                type="text" 
                name="room" 
                id="edit-room" 
                value={sectionToEdit?.room || ''} 
                onChange={handleEditInputChange} 
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white" 
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-adviserId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Class Adviser
            </label>
            <select 
              name="adviserId" 
              id="edit-adviserId" 
              value={sectionToEdit?.adviserId ?? ''} 
              onChange={handleEditInputChange} 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">No adviser assigned</option>
              {teachers.filter(t => t.role === 'teacher').map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button 
              type="button" 
              onClick={() => setIsEditModalOpen(false)} 
              className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-slate-800 dark:text-slate-200">
              Are you sure you want to delete <span className="font-bold">Grade {sectionToDelete?.gradeLevel} - {sectionToDelete?.name}</span>?
            </p>
            {sectionToDelete && sectionToDelete.studentCount! > 0 && (
              <p className="text-red-600 dark:text-red-400 mt-2 font-medium">
                ⚠️ This section has {sectionToDelete.studentCount} enrolled students. They will be unassigned.
              </p>
            )}
          </div>
          <div className="flex justify-end space-x-3">
            <button 
              onClick={() => setIsDeleteModalOpen(false)} 
              className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete} 
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Section
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-600' :
          toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        } text-white flex items-center gap-3 animate-fade-in min-w-[280px]`}>
          <span className="flex-1">{toast.message}</span>
          <button 
            onClick={() => setToast(null)} 
            className="text-white hover:text-gray-200 font-bold text-xl leading-none"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

// Section Card Component
const SectionCard: React.FC<{
  section: Section;
  teachers: any[];
  canManage: boolean;
  onEdit: (section: Section) => void;
  onDelete: (section: Section) => void;
}> = ({ section, teachers, canManage, onEdit, onDelete }) => {
  const adviser = teachers.find(t => t.id === section.adviserId);
  const utilizationPercent = section.capacity ? (section.studentCount! / section.capacity) * 100 : 0;
  const isOverCapacity = utilizationPercent > 100;
  const isNearCapacity = utilizationPercent > 90 && !isOverCapacity;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-all border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
        <h3 className="text-xl font-bold">Grade {section.gradeLevel} - {section.name}</h3>
        {section.room && <p className="text-indigo-100 text-sm mt-1">{section.room}</p>}
      </div>

      <div className="p-4 space-y-3">
        {/* Adviser */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Adviser:</span>
          <span className="font-medium text-slate-800 dark:text-white">
            {adviser?.name || section.adviserName || 'Not assigned'}
          </span>
        </div>

        {/* Student Count */}
        <div className="flex items-center justify-between">
          <span className="text-slate-600 dark:text-slate-400 text-sm">Students:</span>
          <span className={`font-semibold text-lg ${
            isOverCapacity ? 'text-red-600 dark:text-red-400' :
            isNearCapacity ? 'text-amber-600 dark:text-amber-400' :
            'text-green-600 dark:text-green-400'
          }`}>
            {section.studentCount} / {section.capacity || 40}
          </span>
        </div>

        {/* Utilization Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Capacity</span>
            <span>{utilizationPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                isOverCapacity ? 'bg-red-500' :
                isNearCapacity ? 'bg-amber-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        {canManage && (
          <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => onEdit(section)} 
              className="flex-1 flex items-center justify-center gap-1 text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-medium text-sm py-2 rounded-md hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button 
              onClick={() => onDelete(section)} 
              className="flex-1 flex items-center justify-center gap-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm py-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Section Table Component
const SectionTable: React.FC<{
  sections: Section[];
  teachers: any[];
  canManage: boolean;
  onEdit: (section: Section) => void;
  onDelete: (section: Section) => void;
}> = ({ sections, teachers, canManage, onEdit, onDelete }) => {
  return (
    <div className="bg-white dark:bg-slate-800 shadow-md rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Section
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Grade Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Adviser
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Room
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Students
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Capacity
              </th>
              {canManage && (
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {sections.map((section) => {
              const adviser = teachers.find(t => t.id === section.adviserId);
              const utilizationPercent = section.capacity ? (section.studentCount! / section.capacity) * 100 : 0;
              const isOverCapacity = utilizationPercent > 100;

              return (
                <tr key={section.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900 dark:text-white">{section.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-slate-600 dark:text-slate-300">Grade {section.gradeLevel}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-slate-600 dark:text-slate-300">
                      {adviser?.name || section.adviserName || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-slate-600 dark:text-slate-300">{section.room || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`font-semibold ${
                      isOverCapacity ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'
                    }`}>
                      {section.studentCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 dark:text-slate-300">{section.capacity || 40}</span>
                      <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className={`h-full rounded-full ${
                            isOverCapacity ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  {canManage && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => onEdit(section)} 
                          className="text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 font-medium text-sm"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => onDelete(section)} 
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SectionsViewOptimized;
