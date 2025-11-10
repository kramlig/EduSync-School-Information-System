import React, { useState, useMemo, useEffect } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import type { Parent, AuthUser, StudentUser } from '../types';
import Modal from './Modal';
import { PencilIcon, TrashIcon, CloseIcon } from './icons';
import { useDebounce } from '../hooks/useDebounce';

interface ParentsViewProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser, type: 'staff' | 'student' };
}

const ITEMS_PER_PAGE = 25;

const ParentsView: React.FC<ParentsViewProps> = ({ schoolData }) => {
  const { 
    parents, students, 
    addParent, updateParent, deleteParent, 
    assignStudentToParent, unassignStudentFromParent,
    searchParents, isSearching
  } = schoolData;
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isManageChildrenModalOpen, setIsManageChildrenModalOpen] = useState(false);
  
  const [parentToManage, setParentToManage] = useState<Parent | null>(null);
  const [parentToDelete, setParentToDelete] = useState<Parent | null>(null);

  const [newParent, setNewParent] = useState<Omit<Parent, 'id' | 'studentIds'>>({ name: '', email: '' });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Parent[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const [childSearchQuery, setChildSearchQuery] = useState('');
  const debouncedChildSearchQuery = useDebounce(childSearchQuery, 300);
  
  // const authUser = session.user as AuthUser;

  // Server-side search effect
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchQuery.trim()) {
        console.log(`[ParentsView] 🔍 Triggering server-side search: "${debouncedSearchQuery}"`);
        const results = await searchParents(debouncedSearchQuery);
        setSearchResults(results);
      } else {
        // Clear search results when query is empty
        setSearchResults(null);
      }
    };

    performSearch();
  }, [debouncedSearchQuery, searchParents]);

  // Use search results if searching, otherwise use regular parents list
  const visibleParents = searchResults || parents;

  const handleAddParent = (e: React.FormEvent) => {
    e.preventDefault();
    if (newParent.name && newParent.email) {
      addParent({ ...newParent, studentIds: [] });
      setNewParent({ name: '', email: '' });
      setIsAddModalOpen(false);
    }
  };

  const handleEditClick = (parent: Parent) => {
    setParentToManage({ ...parent });
    setIsEditModalOpen(true);
  };
  
  const handleUpdateParent = (e: React.FormEvent) => {
    e.preventDefault();
    if (parentToManage) {
      updateParent(parentToManage);
      setIsEditModalOpen(false);
      setParentToManage(null);
    }
  };
  
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!parentToManage) return;
      const { name, value } = e.target;
      setParentToManage(prev => ({...prev!, [name]: value}));
  };

  const handleDeleteClick = (parent: Parent) => {
    setParentToDelete(parent);
    setIsDeleteModalOpen(true);
  };
  
  const confirmDeleteParent = () => {
    if (parentToDelete) {
      deleteParent(parentToDelete.id);
      setIsDeleteModalOpen(false);
      setParentToDelete(null);
    }
  };

  const handleManageChildrenClick = (parent: Parent) => {
    setParentToManage(parent);
    setChildSearchQuery('');
    setIsManageChildrenModalOpen(true);
  };

  const handleAssignStudent = (studentId: string) => {
    if (parentToManage && studentId) {
      assignStudentToParent(parentToManage.id, studentId);
      // Optimistically update local state for immediate UI feedback
      setParentToManage(prev => prev ? { ...prev, studentIds: [...prev.studentIds, studentId] } : null);
      setChildSearchQuery('');
    }
  };

  const handleUnassignStudent = (studentId: string) => {
    if (parentToManage) {
      unassignStudentFromParent(parentToManage.id, studentId);
      // Optimistically update local state
      setParentToManage(prev => prev ? { ...prev, studentIds: prev.studentIds.filter(id => id !== studentId) } : null);
    }
  };

  // No client-side filtering needed when using server-side search
  const filteredParents = visibleParents;

  const totalPages = Math.ceil(filteredParents.length / ITEMS_PER_PAGE);

  const paginatedParents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredParents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredParents, currentPage]);


  const filteredUnassignedStudents = useMemo(() => {
    if (!debouncedChildSearchQuery || !parentToManage) return [];
    return students.filter(s => {
        const name = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim();
        return !parentToManage.studentIds.includes(s.id) &&
               name.toLowerCase().includes(debouncedChildSearchQuery.toLowerCase());
    });
  }, [students, parentToManage, debouncedChildSearchQuery]);
  
  const childrenOfParent = useMemo(() => {
    if (!parentToManage) return [];
    return students.filter(s => parentToManage.studentIds.includes(s.id));
  }, [students, parentToManage]);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Parents</h1>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Add Parent</button>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <input 
            type="text" 
            placeholder="Search ALL parents by name or email..." 
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
            Found {searchResults.length} parent{searchResults.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Parent Name</th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Linked Children</th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedParents.map((parent) => (
              <tr key={parent.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                    <p className="text-slate-900 dark:text-white whitespace-nowrap">{parent.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">{parent.email}</p>
                </td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                    <p className="text-slate-600 dark:text-slate-300 whitespace-nowrap">{parent.studentIds?.length || 0}</p>
                </td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                  <div className="flex items-center space-x-3">
                    <button onClick={() => handleManageChildrenClick(parent)} className="font-semibold text-xs bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">
                      Manage Children
                    </button>
                    <button onClick={() => handleEditClick(parent)} className="flex items-center text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 font-semibold text-xs">
                        <PencilIcon /><span className="ml-1">Edit</span>
                    </button>
                    <button onClick={() => handleDeleteClick(parent)} className="flex items-center text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-semibold text-xs">
                        <TrashIcon /><span className="ml-1">Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
         {totalPages > 1 && (
          <div className="px-5 py-3 bg-white dark:bg-slate-800 border-t flex flex-col xs:flex-row items-center xs:justify-between">
            <span className="text-xs xs:text-sm text-slate-600 dark:text-slate-300">
              Showing {Math.min(1 + (currentPage-1)*ITEMS_PER_PAGE, filteredParents.length)} to {Math.min(currentPage*ITEMS_PER_PAGE, filteredParents.length)} of {filteredParents.length} Parents
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
      
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Parent">
        <form onSubmit={handleAddParent}>
            <div className="space-y-4">
                <div><label className="block text-sm font-medium">Full Name</label><input type="text" value={newParent.name} onChange={e => setNewParent(p => ({...p, name: e.target.value}))} className="mt-1 w-full input-style" required /></div>
                <div><label className="block text-sm font-medium">Email</label><input type="email" value={newParent.email} onChange={e => setNewParent(p => ({...p, email: e.target.value}))} className="mt-1 w-full input-style" required /></div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Add Parent</button>
            </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Parent">
        <form onSubmit={handleUpdateParent}>
            <div className="space-y-4">
                <div><label className="block text-sm font-medium">Full Name</label><input type="text" name="name" value={parentToManage?.name ?? ''} onChange={handleEditInputChange} className="mt-1 w-full input-style" required /></div>
                <div><label className="block text-sm font-medium">Email</label><input type="email" name="email" value={parentToManage?.email ?? ''} onChange={handleEditInputChange} className="mt-1 w-full input-style" required /></div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Save Changes</button>
            </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <p>Are you sure you want to delete the parent account for <span className="font-bold">{parentToDelete?.name}</span>? This will not delete student records but will remove their access. This action cannot be undone.</p>
        <div className="flex justify-end space-x-2 mt-6">
            <button onClick={() => setIsDeleteModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
            <button onClick={confirmDeleteParent} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">Delete Parent</button>
        </div>
      </Modal>

      <Modal isOpen={isManageChildrenModalOpen} onClose={() => setIsManageChildrenModalOpen(false)} title={`Manage Children for ${parentToManage?.name}`} size="lg">
        <div>
            <h3 className="font-semibold text-lg mb-2">Assigned Children</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {childrenOfParent.length > 0 ? childrenOfParent.map(child => (
                    <div key={child.id} className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 p-2 rounded-md">
                        <span>{child.name}</span>
                        <button onClick={() => handleUnassignStudent(child.id)} className="text-red-500 hover:text-red-700"><CloseIcon/></button>
                    </div>
                )) : <p className="text-slate-500 text-sm">No children assigned yet.</p>}
            </div>
        </div>
        <div className="mt-6 border-t pt-4">
             <h3 className="font-semibold text-lg mb-2">Assign New Child</h3>
             <div className="relative">
                <label className="block text-sm font-medium">Search Student to Assign</label>
                <input
                    type="text"
                    value={childSearchQuery}
                    onChange={e => setChildSearchQuery(e.target.value)}
                    placeholder="Type student name..."
                    className="mt-1 w-full input-style"
                />
                {debouncedChildSearchQuery && (
                    <div className="absolute z-10 w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                        {filteredUnassignedStudents.length > 0 ? (
                            filteredUnassignedStudents.map(student => (
                                <div
                                    key={student.id}
                                    onClick={() => handleAssignStudent(student.id)}
                                    className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer"
                                >
                                    {student.name}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-slate-500">No students found.</div>
                        )}
                    </div>
                )}
             </div>
        </div>
        <div className="flex justify-end mt-6">
            <button onClick={() => setIsManageChildrenModalOpen(false)} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Done</button>
        </div>
      </Modal>

      <style>{`.input-style { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid; border-color: #d1d5db; background-color: transparent; padding: 0.5rem 0.75rem; } .dark .input-style { border-color: #4b5563; }`}</style>
    </div>
  );
};

export default ParentsView;