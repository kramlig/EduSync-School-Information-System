import React, { useState } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import type { Teacher, TeacherAssignment, AuthUser } from '../types';
import Modal from './Modal';
import { CloseIcon } from './icons';

interface TeacherListProps {
  schoolData: SchoolDataHook;
  authUser: AuthUser;
}

const TeacherList: React.FC<TeacherListProps> = ({ schoolData, authUser }) => {
  const { teachers, learningAreas, addTeacher } = schoolData;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState<Omit<Teacher, 'id' | 'role'>>({ name: '', email: '', contactNumber: '', assignments: [] });
  const [newAssignment, setNewAssignment] = useState<{ gradeLevel: string; learningAreaId: string }>({ gradeLevel: '', learningAreaId: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTeacher(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAssignmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAssignment(prev => ({ ...prev, [name]: value }));
  };

  const addAssignmentToTeacher = () => {
    if (newAssignment.gradeLevel && newAssignment.learningAreaId) {
      const assignment: TeacherAssignment = {
        gradeLevel: parseInt(newAssignment.gradeLevel, 10),
        learningAreaId: newAssignment.learningAreaId,
      };
      // Prevent duplicate assignments
      if (!newTeacher.assignments?.some(a => a.gradeLevel === assignment.gradeLevel && a.learningAreaId === assignment.learningAreaId)) {
        setNewTeacher(prev => ({...prev, assignments: [...(prev.assignments || []), assignment]}));
      }
      setNewAssignment({ gradeLevel: '', learningAreaId: '' });
    }
  };
  
  const removeAssignmentFromTeacher = (index: number) => {
    setNewTeacher(prev => ({ ...prev, assignments: prev.assignments?.filter((_, i) => i !== index) }));
  };

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeacher.name && newTeacher.email) {
      addTeacher({ ...newTeacher, role: 'teacher' }); // Default role is teacher
      setNewTeacher({ name: '', email: '', contactNumber: '', assignments: [] });
      setIsModalOpen(false);
    }
  };
  
  const gradeLevels = [1, 2, 3, 4, 5, 6];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Teachers</h1>
        {authUser.role === 'admin' && (
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Add Teacher</button>
        )}
      </div>
      
      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Name</th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Contact Info</th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Teaching Assignments</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm"><p className="text-slate-900 dark:text-white whitespace-no-wrap">{teacher.name}</p></td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm"><p className="text-slate-600 dark:text-slate-300 whitespace-no-wrap">{teacher.email}</p><p className="text-slate-500 dark:text-slate-400 text-xs">{teacher.contactNumber}</p></td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                   <div className="flex flex-wrap gap-1">
                    {teacher.assignments?.map((a, i) => (
                      <span key={i} className="px-2 py-1 text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/70 dark:text-indigo-200 rounded-full">
                        G{a.gradeLevel} - {learningAreas.find(la => la.id === a.learningAreaId)?.name}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Teacher" size="2xl">
        <form onSubmit={handleAddTeacher}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div><label htmlFor="name" className="block text-sm font-medium">Full Name</label><input type="text" name="name" id="name" value={newTeacher.name} onChange={handleInputChange} className="mt-1 w-full input-style" required /></div>
               <div><label htmlFor="email" className="block text-sm font-medium">Email</label><input type="email" name="email" id="email" value={newTeacher.email} onChange={handleInputChange} className="mt-1 w-full input-style" required /></div>
               <div className="col-span-2"><label htmlFor="contactNumber" className="block text-sm font-medium">Contact Number</label><input type="tel" name="contactNumber" id="contactNumber" value={newTeacher.contactNumber ?? ''} onChange={handleInputChange} className="mt-1 w-full input-style" /></div>
            </div>
            
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="text-lg font-medium">Teaching Assignments</h3>
                <div className="mt-2 space-y-2">
                    {newTeacher.assignments?.map((a, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 p-2 rounded-md">
                            <span className="font-medium">Grade {a.gradeLevel} - {learningAreas.find(la => la.id === a.learningAreaId)?.name}</span>
                            <button type="button" onClick={() => removeAssignmentFromTeacher(i)} className="text-red-500 hover:text-red-700"><CloseIcon/></button>
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
                    <button type="button" onClick={addAssignmentToTeacher} className="bg-slate-200 dark:bg-slate-600 h-10 rounded-md font-semibold hover:bg-slate-300 dark:hover:bg-slate-500">Add Assignment</button>
                </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
             <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
             <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Save Teacher</button>
          </div>
        </form>
      </Modal>
      <style>{`.input-style { border: 1px solid; border-radius: 0.375rem; padding: 0.5rem 0.75rem; }`}</style>
    </div>
  );
};

export default TeacherList;