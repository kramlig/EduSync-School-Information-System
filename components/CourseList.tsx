
import React, { useState } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import Modal from './Modal';

interface LearningAreaListProps {
  schoolData: SchoolDataHook;
}

const LearningAreaList: React.FC<LearningAreaListProps> = ({ schoolData }) => {
  const { learningAreas, addLearningArea } = schoolData;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLearningAreaName, setNewLearningAreaName] = useState('');
  const [newLearningAreaCredits, setNewLearningAreaCredits] = useState(3);

  const handleAddLearningArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLearningAreaName && newLearningAreaCredits > 0) {
      addLearningArea({ name: newLearningAreaName, credits: newLearningAreaCredits });
      setNewLearningAreaName('');
      setNewLearningAreaCredits(3);
      setIsModalOpen(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Learning Areas</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Add Learning Area
        </button>
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
            <label htmlFor="learningAreaName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Learning Area Name</label>
            <input
              type="text"
              id="learningAreaName"
              value={newLearningAreaName}
              onChange={(e) => setNewLearningAreaName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="learningAreaCredits" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Credits</label>
            <input
              type="number"
              id="learningAreaCredits"
              value={newLearningAreaCredits}
              onChange={(e) => setNewLearningAreaCredits(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
              required
              min="1"
            />
          </div>
          <div className="flex justify-end space-x-2">
             <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
             <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Add Learning Area</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LearningAreaList;