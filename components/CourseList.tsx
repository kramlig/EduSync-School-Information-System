import React, { useState } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import Modal from './Modal';
import type { LearningArea, AuthUser, StudentUser } from '../types';
import { TrashIcon, PencilIcon } from './icons';

interface LearningAreaListProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser, type: 'staff' | 'student' };
}

const LearningAreaList: React.FC<LearningAreaListProps> = ({ schoolData, session }) => {
  const { learningAreas, addLearningArea, updateLearningArea, deleteLearningArea } = schoolData;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<LearningArea | null>(null);
  const [editingArea, setEditingArea] = useState<LearningArea | null>(null);
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Learning Areas</h1>
        <div className="flex gap-3">
          {authUser.role === 'admin' && (
            <>
              <button
                onClick={async () => {
                  if (!confirm('This will reset all learning area grade levels to match DepEd K-12 curriculum. Continue?')) return;
                  
                  const updates: Array<{id: string, name: string, grades: number[], special?: string}> = [];
                  
                  for (const area of learningAreas) {
                    let correctGrades: number[] | null = null;
                    let updateData: Partial<LearningArea> = {};
                    
                    // Match by name patterns
                    if (area.name.toLowerCase().includes('mother tongue') || area.name.toLowerCase().includes('mtb')) {
                      correctGrades = [1, 2, 3];
                    } else if (area.name.toLowerCase().includes('mapeh')) {
                      // MAPEH has special composite structure
                      if (area.gradeLevel?.includes(1) || area.gradeLevel?.includes(2)) {
                        // Elementary MAPEH
                        correctGrades = [1, 2, 3, 4, 5, 6];
                      } else {
                        // JHS MAPEH
                        correctGrades = [7, 8, 9, 10];
                      }
                      // Ensure MAPEH has composite structure
                      if (!area.isComposite || !area.subSubjects?.length) {
                        updateData.isComposite = true;
                        updateData.subSubjects = ['Music', 'Arts', 'PE', 'Health'];
                        updateData.category = 'specialized';
                      }
                    } else if (area.name.toLowerCase().includes('science') && area.gradeLevel?.includes(1)) {
                      correctGrades = [3, 4, 5, 6]; // Elementary Science starts Grade 3
                    } else if (area.name.toLowerCase().includes('science') && !area.gradeLevel?.includes(7)) {
                      correctGrades = [3, 4, 5, 6]; // Elementary Science
                    } else if (area.gradeLevel?.includes(1) || area.gradeLevel?.includes(2)) {
                      // It's elementary but wrong grades
                      if (!area.name.toLowerCase().includes('science') && !area.name.toLowerCase().includes('mtb')) {
                        correctGrades = [1, 2, 3, 4, 5, 6];
                      }
                    } else if (area.gradeLevel?.includes(7) && area.gradeLevel?.length !== 4) {
                      // It's JHS but wrong grades
                      correctGrades = [7, 8, 9, 10];
                    }
                    
                    if (correctGrades && JSON.stringify(area.gradeLevel?.sort()) !== JSON.stringify(correctGrades.sort())) {
                      const updateInfo: any = {id: area.id, name: area.name, grades: correctGrades};
                      if (Object.keys(updateData).length > 0) {
                        updateInfo.special = 'MAPEH composite structure added';
                      }
                      updates.push(updateInfo);
                      updateLearningArea(area.id, {...area, ...updateData, gradeLevel: correctGrades});
                    } else if (Object.keys(updateData).length > 0) {
                      // Only structure update needed (e.g., MAPEH composite fix)
                      updates.push({id: area.id, name: area.name, grades: area.gradeLevel || [], special: 'MAPEH composite structure added'});
                      updateLearningArea(area.id, {...area, ...updateData});
                    }
                  }
                  
                  if (updates.length === 0) {
                    alert('All learning areas already have correct grade levels!');
                  } else {
                    alert(`Fixed ${updates.length} learning area(s)!`);
                  }
                }}
                className="bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Fix Grade Levels
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Learning Area
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Learning Area</th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Category</th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Department</th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Grade Levels</th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Credits</th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
              {authUser.role === 'admin' && <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {learningAreas.map((learningArea) => (
              <tr key={learningArea.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                  <p className="text-slate-900 dark:text-white font-medium">{learningArea.name}</p>
                  {learningArea.kToTwelveCode && (
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Code: {learningArea.kToTwelveCode}</p>
                  )}
                </td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    learningArea.category === 'core' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    learningArea.category === 'specialized' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                    learningArea.category === 'elective' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    learningArea.category === 'tle' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                    'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
                  }`}>
                    {learningArea.category?.toUpperCase() || 'CORE'}
                  </span>
                </td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                  <p className="text-slate-600 dark:text-slate-300">{learningArea.department || 'N/A'}</p>
                </td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                  <p className="text-slate-600 dark:text-slate-300">
                    {learningArea.gradeLevel?.join(', ') || '7-10'}
                  </p>
                </td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                  <p className="text-slate-600 dark:text-slate-300">{learningArea.credits}</p>
                </td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    learningArea.isActive !== false ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {learningArea.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                {authUser.role === 'admin' && (
                    <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleEditClick(learningArea)} 
                            className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold text-xs"
                          >
                            <PencilIcon /><span className="ml-1">Edit</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(learningArea)} 
                            className="flex items-center text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-semibold text-xs"
                          >
                            <TrashIcon /><span className="ml-1">Delete</span>
                          </button>
                        </div>
                    </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
    </div>
  );
};

export default LearningAreaList;