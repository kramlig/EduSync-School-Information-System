
import React, { useState } from 'react';
import type { ViewType } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import CourseList from './components/CourseList';
import GradesView from './components/GradesView';
import { useSchoolData } from './hooks/useSchoolData';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const schoolData = useSchoolData(isOnline);

  const renderView = () => {
    switch (view) {
      case 'students':
        return <StudentList schoolData={schoolData} />;
      case 'courses':
        return <CourseList schoolData={schoolData} />;
      case 'grades':
        return <GradesView schoolData={schoolData} />;
      case 'dashboard':
      default:
        return <Dashboard schoolData={schoolData} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <Sidebar currentView={view} setView={setView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header isOnline={isOnline} setIsOnline={setIsOnline} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 p-6 lg:p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
