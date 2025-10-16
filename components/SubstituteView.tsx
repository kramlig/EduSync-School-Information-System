import React, { useState, useMemo } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import type { SubstituteAssignment } from '../types';
import Modal from './Modal';
import { PencilIcon, TrashIcon } from './icons';

interface SubstituteViewProps {
  schoolData: SchoolDataHook;
}

const getStatus = (assignment: SubstituteAssignment): { text: string; color: string } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(assignment.startDate);
    const endDate = new Date(assignment.endDate);

    if (today >= startDate && today <= endDate) {
        return { text: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    }
    if (today < startDate) {
        return { text: 'Upcoming', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
    }
    return { text: 'Expired', color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200' };
};

const SubstituteView: React.FC<SubstituteViewProps> = ({ schoolData }) => {
  const { substituteAssignments, teachers, addSubstituteAssignment, updateSubstituteAssignment, deleteSubstituteAssignment } = schoolData;
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [assignmentToEdit, setAssignmentToEdit] = useState<SubstituteAssignment | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<SubstituteAssignment | null>(null);
  
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
  
  const teacherOptions = useMemo(() => teachers.filter(t => t.role === 'teacher'), [teachers]);
  
  const sortedAssignments = useMemo(() => 
    [...substituteAssignments].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
  , [substituteAssignments]);


  const renderForm = (
    isEdit: boolean,
    data: Omit<SubstituteAssignment, 'id'> | SubstituteAssignment,
    handler: (e: React.FormEvent) => void
  ) => (
    <form onSubmit={handler}>
        <div className="space-y-4">
            <div>
                <label htmlFor="teacherId" className="block text-sm font-medium">Substitute Teacher</label>
                <select name="teacherId" id="teacherId" value={data.teacherId} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500" required>
                    <option value="">Select a teacher...</option>
                    {teacherOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="originalTeacherId" className="block text-sm font-medium">Teacher to be Replaced</label>
                <select name="originalTeacherId" id="originalTeacherId" value={data.originalTeacherId} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500" required>
                    <option value="">Select original teacher...</option>
                    {teacherOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="startDate" className="block text-sm font-medium">Start Date</label>
                    <input type="date" name="startDate" id="startDate" value={data.startDate} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500" required />
                </div>
                 <div>
                    <label htmlFor="endDate" className="block text-sm font-medium">End Date</label>
                    <input type="date" name="endDate" id="endDate" value={data.endDate} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500" required />
                </div>
            </div>
            {formError && (
                <div className="p-3 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-slate-900 dark:text-red-400" role="alert">
                  <span className="font-medium">Error:</span> {formError}
                </div>
              )}
        </div>
         <div className="flex justify-end space-x-2 mt-6">
             <button type="button" onClick={() => { isEdit ? setIsEditModalOpen(false) : setIsAddModalOpen(false); setFormError(null); }} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
             <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">{isEdit ? 'Save Changes' : 'Add Assignment'}</button>
        </div>
    </form>
  );

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Substitute Management</h1>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                Add Assignment
            </button>
        </div>
        
        <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-full leading-normal">
                <thead>
                    <tr>
                        <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Substitute Teacher</th>
                        <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Original Teacher</th>
                        <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Dates</th>
                        <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
                        <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedAssignments.map(sub => {
                        const substituteTeacher = teachers.find(t => t.id === sub.teacherId);
                        const originalTeacher = teachers.find(t => t.id === sub.originalTeacherId);
                        const status = getStatus(sub);
                        return (
                             <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                    <p className="text-slate-900 dark:text-white whitespace-nowrap">{substituteTeacher?.name ?? 'Unknown'}</p>
                                </td>
                                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                    <p className="text-slate-600 dark:text-slate-300 whitespace-nowrap">{originalTeacher?.name ?? 'Unknown'}</p>
                                </td>
                                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                    <p className="text-slate-600 dark:text-slate-300 whitespace-nowrap">{sub.startDate} to {sub.endDate}</p>
                                </td>
                                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${status.color}`}>{status.text}</span>
                                </td>
                                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                    <div className="flex items-center space-x-3">
                                        <button onClick={() => handleEditClick(sub)} className="flex items-center text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 font-semibold text-xs">
                                            <PencilIcon /><span className="ml-1">Edit</span>
                                        </button>
                                        <button onClick={() => handleDeleteClick(sub)} className="flex items-center text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-semibold text-xs">
                                            <TrashIcon /><span className="ml-1">Delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
        
        <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setFormError(null); }} title="Add Substitute Assignment">
            {renderForm(false, newAssignment, handleAddAssignment)}
        </Modal>

        <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setFormError(null); }} title="Edit Substitute Assignment">
            {assignmentToEdit && renderForm(true, assignmentToEdit, handleUpdateAssignment)}
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
            <p>Are you sure you want to delete this substitute assignment? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2 mt-6">
                <button onClick={() => setIsDeleteModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
                <button onClick={confirmDelete} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">Delete Assignment</button>
            </div>
        </Modal>
    </div>
  );
};

export default SubstituteView;
