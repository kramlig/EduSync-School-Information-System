import React, { useState, useMemo, useEffect } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import type { Teacher, TeacherAssignment, AuthUser, StudentUser } from '../types';
import Modal from './Modal';
import { CloseIcon, PencilIcon, TrashIcon } from './icons';
import { useDebounce } from '../hooks/useDebounce';

interface TeacherListProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser, type: 'staff' | 'student' };
}

const getRoleStyle = (role: Teacher['role']) => {
    switch (role) {
        case 'admin':
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        case 'principal':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
        case 'registrar':
            return 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200';
        case 'teacher':
        default:
            return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
}

const ITEMS_PER_PAGE = 25;

const TeacherList: React.FC<TeacherListProps> = ({ schoolData, session }) => {
  const { teachers, learningAreas, addTeacher, updateTeacher, deleteTeacher, searchTeachers, isSearching } = schoolData;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [teacherToEdit, setTeacherToEdit] = useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  const [newTeacher, setNewTeacher] = useState<Omit<Teacher, 'id'>>({ name: '', email: '', contactNumber: '', assignments: [], role: 'teacher' });
  const [newAssignment, setNewAssignment] = useState<{ gradeLevel: string; learningAreaId: string }>({ gradeLevel: '', learningAreaId: '' });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Teacher[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const authUser = session.user as AuthUser;

  // Server-side search effect
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchQuery.trim()) {
        console.log(`[TeacherList] 🔍 Triggering server-side search: "${debouncedSearchQuery}"`);
        const results = await searchTeachers(debouncedSearchQuery);
        setSearchResults(results);
      } else {
        // Clear search results when query is empty
        setSearchResults(null);
      }
    };

    performSearch();
  }, [debouncedSearchQuery, searchTeachers]);

  // Use search results if searching, otherwise use regular teachers list
  const visibleTeachers = searchResults || teachers;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTeacher(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!teacherToEdit) return;
    const { name, value } = e.target;
    setTeacherToEdit(prev => ({ ...prev!, [name]: value }));
  };
  
  const handleAssignmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAssignment(prev => ({ ...prev, [name]: value }));
  };

  const addAssignmentToTeacher = (isEditMode = false) => {
    if (newAssignment.gradeLevel && newAssignment.learningAreaId) {
      const assignment: TeacherAssignment = {
        gradeLevel: parseInt(newAssignment.gradeLevel, 10),
        learningAreaId: newAssignment.learningAreaId,
      };
      const targetTeacher = isEditMode ? teacherToEdit : newTeacher;
      const setTargetTeacher = isEditMode ? setTeacherToEdit : setNewTeacher;

      if (!targetTeacher?.assignments?.some(a => a.gradeLevel === assignment.gradeLevel && a.learningAreaId === assignment.learningAreaId)) {
        setTargetTeacher((prev: any) => ({...prev!, assignments: [...(prev?.assignments || []), assignment]}));
      }
      setNewAssignment({ gradeLevel: '', learningAreaId: '' });
    }
  };
  
  const removeAssignmentFromTeacher = (index: number, isEditMode = false) => {
    const setTargetTeacher = isEditMode ? setTeacherToEdit : setNewTeacher;
  setTargetTeacher((prev: any) => ({ ...prev!, assignments: prev!.assignments?.filter((_: any, i: number) => i !== index) }));
  };

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeacher.name && newTeacher.email) {
      addTeacher(newTeacher); 
      setNewTeacher({ name: '', email: '', contactNumber: '', assignments: [], role: 'teacher' });
      setIsAddModalOpen(false);
    }
  };

  const handleEditClick = (teacher: Teacher) => {
    setTeacherToEdit({ ...teacher });
    setIsEditModalOpen(true);
  };

  const handleUpdateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (teacherToEdit) {
      updateTeacher(teacherToEdit);
      setIsEditModalOpen(false);
      setTeacherToEdit(null);
    }
  };

  const handleDeleteClick = (teacher: Teacher) => {
    if (teacher.id === authUser.id) {
        alert("You cannot delete your own account.");
        return;
    }
    setTeacherToDelete(teacher);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (teacherToDelete) {
        deleteTeacher(teacherToDelete.id);
        setIsDeleteModalOpen(false);
        setTeacherToDelete(null);
    }
  };
  
  const gradeLevels = [1, 2, 3, 4, 5, 6];

  // No client-side filtering needed when using server-side search
  const filteredTeachers = visibleTeachers;

  const totalPages = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE);
  
  const paginatedTeachers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTeachers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTeachers, currentPage]);


  const renderAssignmentsForm = (
      teacher: Omit<Teacher, 'id'> | Teacher | null, 
      isEditMode: boolean
    ) => (
    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <h3 className="text-lg font-medium">Teaching Assignments</h3>
        <div className="mt-2 space-y-2">
            {teacher?.assignments?.map((a, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 p-2 rounded-md">
                    <span className="font-medium">Grade {a.gradeLevel} - {learningAreas.find(la => la.id === a.learningAreaId)?.name}</span>
                    <button type="button" onClick={() => removeAssignmentFromTeacher(i, isEditMode)} className="text-red-500 hover:text-red-700"><CloseIcon/></button>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 items-end">
            <div>
                <label htmlFor="gradeLevel" className="block text-sm font-medium">Grade Level</label>
                <select name="gradeLevel" value={newAssignment.gradeLevel} onChange={handleAssignmentChange} className="mt-1 w-full input-style">
                    <option value="">Select...</option>
                    {gradeLevels.map(gl => <option key={gl} value={gl}>{gl}</option>)}
                </select>
            </div>
            <div>
                 <label htmlFor="learningAreaId" className="block text-sm font-medium">Learning Area</label>
                 <select name="learningAreaId" value={newAssignment.learningAreaId} onChange={handleAssignmentChange} className="mt-1 w-full input-style">
                     <option value="">Select...</option>
                     {learningAreas.map(la => <option key={la.id} value={la.id}>{la.name}</option>)}
                 </select>
            </div>
            <button type="button" onClick={() => addAssignmentToTeacher(isEditMode)} className="bg-slate-200 dark:bg-slate-600 h-10 rounded-md font-semibold hover:bg-slate-300 dark:hover:bg-slate-500">Add Assignment</button>
        </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Teachers</h1>
        {authUser.role === 'admin' && (
          <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Add Teacher</button>
        )}
      </div>
      
      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <input 
            type="text" 
            placeholder="Search ALL teachers by name, email, or phone..." 
            value={searchQuery} 
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
        {searchResults && (
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Found {searchResults.length} teacher{searchResults.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Name</th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Role</th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Teaching Assignments</th>
              {authUser.role === 'admin' && <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedTeachers.map((teacher) => (
              <tr key={teacher.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                    <p className="text-slate-900 dark:text-white whitespace-nowrap">{teacher.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">{teacher.email}</p>
                </td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full capitalize ${getRoleStyle(teacher.role)}`}>
                        {teacher.role}
                    </span>
                </td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                   <div className="flex flex-wrap gap-1">
                    {teacher.assignments?.map((a, i) => (
                      <span key={i} className="px-2 py-1 text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/70 dark:text-indigo-200 rounded-full">
                        G{a.gradeLevel} - {learningAreas.find(la => la.id === a.learningAreaId)?.name}
                      </span>
                    ))}
                  </div>
                </td>
                 {authUser.role === 'admin' && (
                    <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                        <div className="flex items-center space-x-3">
                             <button onClick={() => handleEditClick(teacher)} className="flex items-center text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 font-semibold text-xs">
                                <PencilIcon /><span className="ml-1">Edit</span>
                            </button>
                            <button onClick={() => handleDeleteClick(teacher)} disabled={teacher.id === authUser.id} className="flex items-center text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                                <TrashIcon /><span className="ml-1">Delete</span>
                            </button>
                        </div>
                    </td>
                 )}
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="px-5 py-3 bg-white dark:bg-slate-800 border-t flex flex-col xs:flex-row items-center xs:justify-between">
            <span className="text-xs xs:text-sm text-slate-600 dark:text-slate-300">
              Showing {Math.min(1 + (currentPage-1)*ITEMS_PER_PAGE, filteredTeachers.length)} to {Math.min(currentPage*ITEMS_PER_PAGE, filteredTeachers.length)} of {filteredTeachers.length} Teachers
            </span>
            <div className="inline-flex mt-2 xs:mt-0">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold py-2 px-4 rounded-l disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold py-2 px-4 rounded-r disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Teacher" size="2xl">
        <form onSubmit={handleAddTeacher}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div><label htmlFor="name" className="block text-sm font-medium">Full Name</label><input type="text" name="name" id="name" value={newTeacher.name} onChange={handleInputChange} className="mt-1 w-full input-style" required /></div>
               <div><label htmlFor="email" className="block text-sm font-medium">Email</label><input type="email" name="email" id="email" value={newTeacher.email} onChange={handleInputChange} className="mt-1 w-full input-style" required /></div>
               <div><label htmlFor="contactNumber" className="block text-sm font-medium">Contact Number</label><input type="tel" name="contactNumber" id="contactNumber" value={newTeacher.contactNumber ?? ''} onChange={handleInputChange} className="mt-1 w-full input-style" /></div>
               <div>
                  <label htmlFor="role" className="block text-sm font-medium">Role</label>
                  <select name="role" id="role" value={newTeacher.role} onChange={handleInputChange} className="mt-1 w-full input-style">
                    <option value="teacher">Teacher</option>
                    <option value="registrar">Registrar</option>
                    <option value="principal">Principal</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
            </div>
            {renderAssignmentsForm(newTeacher, false)}
          </div>
          <div className="flex justify-end space-x-2 mt-6">
             <button type="button" onClick={() => setIsAddModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
             <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Save Teacher</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Teacher" size="2xl">
        <form onSubmit={handleUpdateTeacher}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div><label htmlFor="name" className="block text-sm font-medium">Full Name</label><input type="text" name="name" id="name" value={teacherToEdit?.name ?? ''} onChange={handleEditInputChange} className="mt-1 w-full input-style" required /></div>
               <div><label htmlFor="email" className="block text-sm font-medium">Email</label><input type="email" name="email" id="email" value={teacherToEdit?.email ?? ''} onChange={handleEditInputChange} className="mt-1 w-full input-style" required /></div>
               <div><label htmlFor="contactNumber" className="block text-sm font-medium">Contact Number</label><input type="tel" name="contactNumber" id="contactNumber" value={teacherToEdit?.contactNumber ?? ''} onChange={handleEditInputChange} className="mt-1 w-full input-style" /></div>
               <div>
                  <label htmlFor="role" className="block text-sm font-medium">Role</label>
                  <select name="role" id="role" value={teacherToEdit?.role ?? 'teacher'} onChange={handleEditInputChange} className="mt-1 w-full input-style">
                    <option value="teacher">Teacher</option>
                    <option value="registrar">Registrar</option>
                    <option value="principal">Principal</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
            </div>
            {renderAssignmentsForm(teacherToEdit, true)}
          </div>
          <div className="flex justify-end space-x-2 mt-6">
             <button type="button" onClick={() => setIsEditModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
             <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Save Changes</button>
          </div>
        </form>
      </Modal>
      
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <p>Are you sure you want to delete the teacher <span className="font-bold">{teacherToDelete?.name}</span>? They will be unassigned as an adviser from any classes. This action cannot be undone.</p>
        <div className="flex justify-end space-x-2 mt-6">
            <button onClick={() => setIsDeleteModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
            <button onClick={confirmDelete} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">Delete Teacher</button>
        </div>
      </Modal>

      <style>{`.input-style { border: 1px solid; border-radius: 0.375rem; padding: 0.5rem 0.75rem; }`}</style>
    </div>
  );
};

export default TeacherList;