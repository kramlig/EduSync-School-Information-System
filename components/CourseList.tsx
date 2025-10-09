import React, { useState } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import Modal from './Modal';
import type { LearningArea, AuthUser } from '../types';

interface LearningAreaListProps {
  schoolData: SchoolDataHook;
  authUser: AuthUser;
}

const LearningAreaList: React.FC<LearningAreaListProps> = ({ schoolData, authUser }) => {
  const { learningAreas, addLearningArea } = schoolData;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLearningArea, setNewLearningArea] = useState<Omit<LearningArea, 'id'>>({ name: '', credits: 3 });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumber = e.target.type === 'number';
    setNewLearningArea(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
  };

  const handleAddLearningArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLearningArea.name && newLearningArea.credits > 0) {
      addLearningArea(newLearningArea);
      setNewLearningArea({ name: '', credits: 3 });
      setIsModalOpen(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Learning Areas</h1>
        {authUser.role === 'admin' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add Learning Area
          </button>
        )}
      </div>
      
      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Learning Area Name</th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Credits</th>
            </tr>
          </thead>
          <tbody>
            {learningAreas.map((learningArea) => (
              <tr key={learningArea.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                  <p className="text-slate-900 dark:text-white whitespace-no-wrap">{learningArea.name}</p>
                </td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                  <p className="text-slate-600 dark:text-slate-300 whitespace-no-wrap">{learningArea.credits}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Learning Area">
        <form onSubmit={handleAddLearningArea}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Learning Area Name</label>
            <input
              type="text" name="name" id="name" value={newLearningArea.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="credits" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Credits</label>
            <input
              type="number" name="credits" id="credits" value={newLearningArea.credits}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
              required min="1"
            />
          </div>
          <div className="flex justify-end space-x-2 mt-6">
             <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
             <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Add Learning Area</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LearningAreaList;