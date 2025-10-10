import React, { useState } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import type { Section, AuthUser } from '../types';
import Modal from './Modal';
import { PencilIcon, TrashIcon } from './icons';

interface SectionsViewProps {
  schoolData: SchoolDataHook;
  authUser: AuthUser;
}

const SectionsView: React.FC<SectionsViewProps> = ({ schoolData, authUser }) => {
  const { sections, teachers, addSection, updateSection, deleteSection } = schoolData;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [sectionToEdit, setSectionToEdit] = useState<Section | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);

  const [newSection, setNewSection] = useState<Omit<Section, 'id'>>({
    gradeLevel: 1,
    name: '',
    adviserId: ''
  });

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

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSection.name && newSection.gradeLevel) {
      addSection(newSection);
      setNewSection({ gradeLevel: 1, name: '', adviserId: '' });
      setIsAddModalOpen(false);
    }
  };

  const handleEditClick = (section: Section) => {
    setSectionToEdit({ ...section });
    setIsEditModalOpen(true);
  };

  const handleUpdateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (sectionToEdit) {
      updateSection(sectionToEdit);
      setIsEditModalOpen(false);
      setSectionToEdit(null);
    }
  };

  const handleDeleteClick = (section: Section) => {
    setSectionToDelete(section);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (sectionToDelete) {
      deleteSection(sectionToDelete.id);
      setIsDeleteModalOpen(false);
      setSectionToDelete(null);
    }
  };

  const canManageSections = ['admin', 'registrar'].includes(authUser.role);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Classes / Sections</h1>
        {canManageSections && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add Class
          </button>
        )}
      </div>
      
      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Class Name</th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Grade Level</th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Class Adviser</th>
              {canManageSections && <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => {
                const adviser = teachers.find(t => t.id === section.adviserId);
                return (
                    <tr key={section.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                            <p className="text-slate-900 dark:text-white whitespace-no-wrap">{section.name}</p>
                        </td>
                        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                            <p className="text-slate-600 dark:text-slate-300 whitespace-no-wrap">{section.gradeLevel}</p>
                        </td>
                         <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                            <p className="text-slate-600 dark:text-slate-300 whitespace-no-wrap">{adviser?.name ?? 'N/A'}</p>
                        </td>
                        {canManageSections && (
                           <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                <div className="flex items-center space-x-3">
                                    <button onClick={() => handleEditClick(section)} className="flex items-center text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 font-semibold text-xs">
                                        <PencilIcon /><span className="ml-1">Edit</span>
                                    </button>
                                    <button onClick={() => handleDeleteClick(section)} className="flex items-center text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-semibold text-xs">
                                        <TrashIcon /><span className="ml-1">Delete</span>
                                    </button>
                                </div>
                           </td>
                        )}
                    </tr>
                )
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Class">
        <form onSubmit={handleAddSection}>
          <div className="space-y-4">
             <div>
                <label htmlFor="gradeLevel" className="block text-sm font-medium">Grade Level</label>
                <input type="number" name="gradeLevel" id="gradeLevel" min="1" max="12" value={newSection.gradeLevel} onChange={handleInputChange} className="mt-1 w-full input-style" required />
            </div>
            <div>
                <label htmlFor="name" className="block text-sm font-medium">Section Name (e.g., A, B, Acacia)</label>
                <input type="text" name="name" id="name" value={newSection.name} onChange={handleInputChange} className="mt-1 w-full input-style" required />
            </div>
             <div>
                <label htmlFor="adviserId" className="block text-sm font-medium">Class Adviser</label>
                 <select name="adviserId" id="adviserId" value={newSection.adviserId ?? ''} onChange={handleInputChange} className="mt-1 block w-full input-style">
                    <option value="">Assign an Adviser...</option>
                    {teachers.filter(t => t.role === 'teacher').map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                 </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
             <button type="button" onClick={() => setIsAddModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
             <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Add Class</button>
          </div>
        </form>
         <style>{`.input-style { border: 1px solid; border-radius: 0.375rem; padding: 0.5rem 0.75rem; }`}</style>
      </Modal>

       <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Class">
        <form onSubmit={handleUpdateSection}>
          <div className="space-y-4">
             <div>
                <label htmlFor="gradeLevel" className="block text-sm font-medium">Grade Level</label>
                <input type="number" name="gradeLevel" id="gradeLevel" min="1" max="12" value={sectionToEdit?.gradeLevel ?? 1} onChange={handleEditInputChange} className="mt-1 w-full input-style" required />
            </div>
            <div>
                <label htmlFor="name" className="block text-sm font-medium">Section Name (e.g., A, B, Acacia)</label>
                <input type="text" name="name" id="name" value={sectionToEdit?.name ?? ''} onChange={handleEditInputChange} className="mt-1 w-full input-style" required />
            </div>
             <div>
                <label htmlFor="adviserId" className="block text-sm font-medium">Class Adviser</label>
                 <select name="adviserId" id="adviserId" value={sectionToEdit?.adviserId ?? ''} onChange={handleEditInputChange} className="mt-1 block w-full input-style">
                    <option value="">Assign an Adviser...</option>
                    {teachers.filter(t => t.role === 'teacher').map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                 </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
             <button type="button" onClick={() => setIsEditModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
             <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Save Changes</button>
          </div>
        </form>
         <style>{`.input-style { border: 1px solid; border-radius: 0.375rem; padding: 0.5rem 0.75rem; }`}</style>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <p>Are you sure you want to delete the class <span className="font-bold">Grade {sectionToDelete?.gradeLevel} - {sectionToDelete?.name}</span>? Students in this class will be unassigned. This action cannot be undone.</p>
        <div className="flex justify-end space-x-2 mt-6">
            <button onClick={() => setIsDeleteModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
            <button onClick={confirmDelete} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">Delete Class</button>
        </div>
      </Modal>
    </div>
  );
};

export default SectionsView;