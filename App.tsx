import React, { useState } from 'react';
import type { ViewType, AuthUser } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import LearningAreaList from './components/CourseList';
import GradesView from './components/GradesView';
import CoreValuesView from './components/CoreValuesView';
import AttendanceView from './components/AttendanceView';
import TeacherList from './components/TeacherList';
import SectionsView from './components/SectionsView';
import SubstituteView from './components/SubstituteView';
import SettingsView from './components/SettingsView';
import { useSchoolData } from './hooks/useSchoolData';
import LoginScreen from './components/LoginScreen';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  
  const schoolData = useSchoolData(isOnline);

  const handleLogin = (user: AuthUser) => {
    setAuthUser(user);
    setView('dashboard'); // Reset to dashboard on login
  };

  const handleLogout = () => {
    setAuthUser(null);
  };

  const renderView = () => {
    if (!authUser) return null; // Should not happen if auth logic is correct
    
    switch (view) {
      case 'students':
        return <StudentList schoolData={schoolData} authUser={authUser} />;
      case 'learningAreas':
        return <LearningAreaList schoolData={schoolData} authUser={authUser} />;
      case 'grades':
        return <GradesView schoolData={schoolData} authUser={authUser} />;
      case 'coreValues':
        return <CoreValuesView schoolData={schoolData} authUser={authUser} />;
      case 'attendance':
        return <AttendanceView schoolData={schoolData} authUser={authUser} />;
      case 'teachers':
        return <TeacherList schoolData={schoolData} authUser={authUser} />;
      case 'sections':
        return <SectionsView schoolData={schoolData} authUser={authUser} />;
      case 'substitutes':
        return <SubstituteView schoolData={schoolData} />;
      case 'settings':
        return <SettingsView schoolData={schoolData} />;
      case 'dashboard':
      default:
        return <Dashboard schoolData={schoolData} authUser={authUser} />;
    }
  };
  
  if (!authUser) {
    return <LoginScreen onLogin={handleLogin} loginFn={schoolData.login} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <Sidebar currentView={view} setView={setView} authUser={authUser} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          isOnline={isOnline} 
          setIsOnline={setIsOnline} 
          authUser={authUser}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 p-6 lg:p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;