import React, { useState } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import Modal from './Modal';

interface SettingsViewProps {
  schoolData: SchoolDataHook;
}

const SettingsView: React.FC<SettingsViewProps> = ({ schoolData }) => {
  const { settings, updateSettings } = schoolData;
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateSettings({ ...settings, [name]: value });
  };

  const handleClearAndResync = () => {
    setIsConfirmModalOpen(true);
  };

  const confirmClear = () => {
    console.log("Clearing IndexedDB...");
    const deleteRequest = indexedDB.deleteDatabase('EduSyncDB');
    deleteRequest.onsuccess = () => {
      console.log("Database deleted successfully. Please reload the page.");
      alert("Local data has been cleared. The application will now reload to sync with the latest data from the server.");
      window.location.reload();
    };
    deleteRequest.onerror = (event) => {
      console.error("Error deleting database:", event);
      alert("Error clearing local data. Please check the console for details.");
    };
    deleteRequest.onblocked = () => {
        console.warn("Database delete blocked. Please close other tabs with this app open.");
        alert("Could not clear local data because the database is in use. Please close any other tabs running this application and try again.");
    };
    setIsConfirmModalOpen(false);
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
   <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center italic">Changes are saved automatically.</p>
      </div>

  <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">Danger Zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Clear Local Data and Resync</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              If you are experiencing data inconsistencies, you can clear all locally stored data.
              The app will fetch a fresh copy from the server on the next load.
              <br />
              <span className="font-semibold">Warning:</span> This action is irreversible and will log you out.
            </p>
          </div>
          <button 
            onClick={handleClearAndResync}
            className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear and Resync
          </button>
        </div>
      </div>

      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirm Clear Data">
        <p>Are you sure you want to delete all local data? The application will reload and sync fresh data from the server. This will log you out.</p>
        <div className="flex justify-end space-x-2 mt-6">
            <button onClick={() => setIsConfirmModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
            <button onClick={confirmClear} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">Yes, Clear Data</button>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsView;