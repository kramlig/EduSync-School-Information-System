
import React, { useState } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import Modal from './Modal';

interface CourseListProps {
  schoolData: SchoolDataHook;
}

const CourseList: React.FC<CourseListProps> = ({ schoolData }) => {
  const { courses, addCourse } = schoolData;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCredits, setNewCourseCredits] = useState(3);

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCourseName && newCourseCredits > 0) {
      addCourse({ name: newCourseName, credits: newCourseCredits });
      setNewCourseName('');
      setNewCourseCredits(3);
      setIsModalOpen(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Courses</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Add Course
        </button>
      </div>
      
      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Course Name</th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Credits</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                  <p className="text-slate-900 dark:text-white whitespace-no-wrap">{course.name}</p>
                </td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                  <p className="text-slate-600 dark:text-slate-300 whitespace-no-wrap">{course.credits}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Course">
        <form onSubmit={handleAddCourse}>
          <div className="mb-4">
            <label htmlFor="courseName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Course Name</label>
            <input
              type="text"
              id="courseName"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="courseCredits" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Credits</label>
            <input
              type="number"
              id="courseCredits"
              value={newCourseCredits}
              onChange={(e) => setNewCourseCredits(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
              required
              min="1"
            />
          </div>
          <div className="flex justify-end space-x-2">
             <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
             <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Add Course</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CourseList;
