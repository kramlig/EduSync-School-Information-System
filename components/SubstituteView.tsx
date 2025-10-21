import React, { useState, useMemo } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import type { SubstituteAssignment } from '../types';
import Modal from './Modal';
import { PencilIcon, TrashIcon } from './icons';
import SearchableSelect from './SearchableSelect';

interface SubstituteViewProps {
  schoolData: SchoolDataHook;
}

const getStatus = (assignment: SubstituteAssignment): { text: string; color: string; icon: string } => {
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

const SubstituteView: React.FC<SubstituteViewProps> = ({ schoolData }) => {
  const { substituteAssignments, teachers, addSubstituteAssignment, updateSubstituteAssignment, deleteSubstituteAssignment } = schoolData;
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [assignmentToEdit, setAssignmentToEdit] = useState<SubstituteAssignment | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<SubstituteAssignment | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'completed'>('all');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [newAssignment, setNewAssignment] = useState<Omit<SubstituteAssignment, 'id'>>({
    teacherId: '',
    originalTeacherId: '',
    startDate: todayStr,
    endDate: todayStr,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (isEditModalOpen && assignmentToEdit) {
      setAssignmentToEdit(prev => ({ ...prev!, [name]: value }));
    } else {
      setNewAssignment(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handler for SearchableSelect (receives value directly)
  const handleSelectChange = (name: string, value: string) => {
    if (isEditModalOpen && assignmentToEdit) {
      setAssignmentToEdit(prev => ({ ...prev!, [name]: value }));
    } else {
      setNewAssignment(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const validateAssignment = (assignment: Omit<SubstituteAssignment, 'id'> | SubstituteAssignment) => {
    if (!assignment.teacherId || !assignment.originalTeacherId || !assignment.startDate || !assignment.endDate) {
        return "All fields are required.";
    }
    if (assignment.endDate < assignment.startDate) {
        return "End date cannot be before the start date.";
    }
    if (assignment.teacherId === assignment.originalTeacherId) {
        return "Substitute and original teacher cannot be the same person.";
    }
    return null;
  };

  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateAssignment(newAssignment);
    if (error) {
        setFormError(error);
        return;
    }
    addSubstituteAssignment(newAssignment);
    setNewAssignment({ teacherId: '', originalTeacherId: '', startDate: todayStr, endDate: todayStr });
    setIsAddModalOpen(false);
    setFormError(null);
  };
  
  const handleEditClick = (assignment: SubstituteAssignment) => {
    setAssignmentToEdit({ ...assignment });
    setIsEditModalOpen(true);
  };
  
  const handleUpdateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentToEdit) return;
     const error = validateAssignment(assignmentToEdit);
    if (error) {
        setFormError(error);
        return;
    }
    updateSubstituteAssignment(assignmentToEdit);
    setIsEditModalOpen(false);
    setAssignmentToEdit(null);
    setFormError(null);
  };
  
  const handleDeleteClick = (assignment: SubstituteAssignment) => {
    setAssignmentToDelete(assignment);
    setIsDeleteModalOpen(true);
  };
  
  const confirmDelete = () => {
    if (assignmentToDelete) {
        deleteSubstituteAssignment(assignmentToDelete.id);
        setIsDeleteModalOpen(false);
        setAssignmentToDelete(null);
    }
  };
  
  const teacherOptions = useMemo(() => 
    teachers
      .filter(t => t.role === 'teacher')
      .map(t => ({ value: t.id, label: t.name }))
      .sort((a, b) => a.label.localeCompare(b.label))
  , [teachers]);
  
  const sortedAssignments = useMemo(() => 
    [...substituteAssignments].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
  , [substituteAssignments]);

  // Filter and search logic
  const filteredAssignments = useMemo(() => {
    return sortedAssignments.filter(assignment => {
      // Status filter
      if (statusFilter !== 'all') {
        const status = getStatus(assignment).text.toLowerCase();
        if (statusFilter !== status) return false;
      }
      
      // Search filter
      if (searchTerm.trim()) {
        const subTeacher = teachers.find(t => t.id === assignment.teacherId);
        const originalTeacher = teachers.find(t => t.id === assignment.originalTeacherId);
        const searchLower = searchTerm.toLowerCase();
        
        const matchesSubstitute = subTeacher?.name.toLowerCase().includes(searchLower);
        const matchesOriginal = originalTeacher?.name.toLowerCase().includes(searchLower);
        
        if (!matchesSubstitute && !matchesOriginal) return false;
      }
      
      return true;
    });
  }, [sortedAssignments, statusFilter, searchTerm, teachers]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = substituteAssignments.length;
    const active = substituteAssignments.filter(a => getStatus(a).text === 'Active').length;
    const scheduled = substituteAssignments.filter(a => getStatus(a).text === 'Scheduled').length;
    const completed = substituteAssignments.filter(a => getStatus(a).text === 'Completed').length;
    
    return { total, active, scheduled, completed };
  }, [substituteAssignments]);


  const renderForm = (
    isEdit: boolean,
    data: Omit<SubstituteAssignment, 'id'> | SubstituteAssignment,
    handler: (e: React.FormEvent) => void
  ) => {
    const isFormValid = data.teacherId && data.originalTeacherId && data.startDate && data.endDate && !formError;
    const duration = data.startDate && data.endDate ? getDuration(data.startDate, data.endDate) : null;
    
    return (
      <form onSubmit={handler} className="space-y-6">
        {/* Teacher Selection Section */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">👥</span>
            <h4 className="font-semibold text-slate-800 dark:text-white">Teacher Assignment</h4>
          </div>
          
          <div>
            <label htmlFor="teacherId" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Substitute Teacher <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              id="teacherId"
              name="teacherId"
              value={data.teacherId}
              onChange={(value) => handleSelectChange('teacherId', value)}
              options={teacherOptions}
              placeholder="Search for a substitute teacher..."
              icon="👤"
              required
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Who will be filling in during this period? ({teacherOptions.length} teachers available)
            </p>
          </div>
          
          <div>
            <label htmlFor="originalTeacherId" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Teacher to Replace <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              id="originalTeacherId"
              name="originalTeacherId"
              value={data.originalTeacherId}
              onChange={(value) => handleSelectChange('originalTeacherId', value)}
              options={teacherOptions}
              placeholder="Search for the teacher to replace..."
              icon="🎓"
              required
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Which teacher's classes will be covered?
            </p>
          </div>
        </div>

        {/* Date Selection Section */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">📅</span>
            <h4 className="font-semibold text-slate-800 dark:text-white">Assignment Period</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                name="startDate" 
                id="startDate" 
                value={data.startDate} 
                onChange={handleInputChange} 
                className="block w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all" 
                required 
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                First day of substitution
              </p>
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                name="endDate" 
                id="endDate" 
                value={data.endDate} 
                onChange={handleInputChange}
                min={data.startDate}
                className="block w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all" 
                required 
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Last day of substitution
              </p>
            </div>
          </div>
          
          {duration && !formError && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <span className="font-semibold">Duration:</span> {duration}
              </p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {formError && (
          <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-900/30 dark:text-red-400 border-2 border-red-200 dark:border-red-800" role="alert">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <span className="font-bold block mb-1">Validation Error</span>
                <span>{formError}</span>
              </div>
            </div>
          </div>
        )}

        {/* Success Indicator */}
        {isFormValid && (
          <div className="p-3 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span className="font-medium">Form is ready to submit!</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button 
            type="button" 
            onClick={() => { 
              isEdit ? setIsEditModalOpen(false) : setIsAddModalOpen(false); 
              setFormError(null); 
            }} 
            className="px-5 py-2.5 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={!isFormValid}
            className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {isEdit ? '💾 Save Changes' : '➕ Add Assignment'}
          </button>
        </div>
      </form>
    );
  };

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-5 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-indigo-100 text-sm font-medium">Total Assignments</p>
                        <p className="text-3xl font-bold mt-1">{stats.total}</p>
                    </div>
                    <div className="text-5xl opacity-80">👥</div>
                </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-5 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-green-100 text-sm font-medium">Active Now</p>
                        <p className="text-3xl font-bold mt-1">{stats.active}</p>
                    </div>
                    <div className="text-5xl opacity-80">✓</div>
                </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-5 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-blue-100 text-sm font-medium">Scheduled</p>
                        <p className="text-3xl font-bold mt-1">{stats.scheduled}</p>
                    </div>
                    <div className="text-5xl opacity-80">📅</div>
                </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg p-5 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-100 text-sm font-medium">Completed</p>
                        <p className="text-3xl font-bold mt-1">{stats.completed}</p>
                    </div>
                    <div className="text-5xl opacity-80">✔</div>
                </div>
            </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <label htmlFor="search" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Search by teacher name
                    </label>
                    <input
                        type="text"
                        id="search"
                        placeholder="Search substitute or original teacher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2"
                    />
                </div>
                <div className="md:w-64">
                    <label htmlFor="statusFilter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Filter by status
                    </label>
                    <select
                        id="statusFilter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                        className="w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2"
                    >
                        <option value="all">All Assignments</option>
                        <option value="active">Active</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>
        </div>

        {/* Assignments Grid */}
        {filteredAssignments.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center shadow-md">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                    {searchTerm || statusFilter !== 'all' ? 'No assignments found' : 'No substitute assignments yet'}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                    {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filter criteria.'
                        : 'Get started by creating your first substitute assignment.'
                    }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        + Add First Assignment
                    </button>
                )}
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
                {filteredAssignments.map(sub => {
                    const substituteTeacher = teachers.find(t => t.id === sub.teacherId);
                    const originalTeacher = teachers.find(t => t.id === sub.originalTeacherId);
                    const status = getStatus(sub);
                    const duration = getDuration(sub.startDate, sub.endDate);
                    const dateRange = formatDateRange(sub.startDate, sub.endDate);
                    
                    return (
                        <div 
                            key={sub.id} 
                            className="bg-white dark:bg-slate-800 rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow border border-slate-200 dark:border-slate-700"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-xl">
                                            👤
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                {substituteTeacher?.name ?? 'Unknown Teacher'}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Replacing: {originalTeacher?.name ?? 'Unknown'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-400">📅</span>
                                            <span className="text-slate-600 dark:text-slate-300">{dateRange}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500 dark:text-slate-400">Duration:</span>
                                            <span className="font-medium text-slate-700 dark:text-slate-200">{duration}</span>
                                        </div>
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${status.color} flex items-center gap-1`}>
                                            <span>{status.icon}</span>
                                            {status.text}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 ml-4">
                                    <button 
                                        onClick={() => handleEditClick(sub)} 
                                        className="p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-lg transition-colors flex items-center gap-1"
                                        title="Edit assignment"
                                    >
                                        <PencilIcon />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteClick(sub)} 
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-1"
                                        title="Delete assignment"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
        
        <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setFormError(null); }} title="➕ Add Substitute Assignment">
            {renderForm(false, newAssignment, handleAddAssignment)}
        </Modal>

        <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setFormError(null); }} title="✏️ Edit Substitute Assignment">
            {assignmentToEdit && renderForm(true, assignmentToEdit, handleUpdateAssignment)}
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="🗑️ Confirm Deletion">
            <div className="space-y-4">
                {/* Warning Icon */}
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <span className="text-4xl">⚠️</span>
                    </div>
                </div>
                
                {/* Assignment Details */}
                {assignmentToDelete && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Assignment to Delete:</h4>
                        <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                            <p>
                                <span className="font-medium">Substitute:</span>{' '}
                                {teachers.find(t => t.id === assignmentToDelete.teacherId)?.name ?? 'Unknown'}
                            </p>
                            <p>
                                <span className="font-medium">Replacing:</span>{' '}
                                {teachers.find(t => t.id === assignmentToDelete.originalTeacherId)?.name ?? 'Unknown'}
                            </p>
                            <p>
                                <span className="font-medium">Period:</span>{' '}
                                {formatDateRange(assignmentToDelete.startDate, assignmentToDelete.endDate)}
                            </p>
                        </div>
                    </div>
                )}
                
                {/* Warning Message */}
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-300">
                        <span className="font-bold">Warning:</span> This action cannot be undone. The substitute assignment will be permanently removed from the system.
                    </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                    <button 
                        onClick={() => setIsDeleteModalOpen(false)} 
                        className="px-5 py-2.5 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDelete} 
                        className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
                    >
                        🗑️ Delete Assignment
                    </button>
                </div>
            </div>
        </Modal>
    </div>
  );
};

export default SubstituteView;
