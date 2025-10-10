import React from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import { SchoolSettings } from '../types';

interface SettingsViewProps {
  schoolData: SchoolDataHook;
}

const SettingsView: React.FC<SettingsViewProps> = ({ schoolData }) => {
  const { settings, updateSettings } = schoolData;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateSettings({ ...settings, [name]: value });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">School Settings</h1>
      
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 shadow-md rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="schoolName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">School Name</label>
            <input
              type="text"
              name="schoolName"
              id="schoolName"
              value={settings.schoolName}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="schoolYear" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Current School Year</label>
            <input
              type="text"
              name="schoolYear"
              id="schoolYear"
              placeholder="e.g. 2023-2024"
              value={settings.schoolYear}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Region</label>
              <input
                type="text"
                name="region"
                id="region"
                value={settings.region}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="division" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Division</label>
              <input
                type="text"
                name="division"
                id="division"
                value={settings.division}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="district" className="block text-sm font-medium text-slate-700 dark:text-slate-300">District</label>
            <input
              type="text"
              name="district"
              id="district"
              value={settings.district}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
         <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">Changes are saved automatically.</p>
      </div>
    </div>
  );
};

export default SettingsView;