import React, { useState } from 'react';
import type { ViewType, AuthUser, StudentUser } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import StudentDashboard from './components/StudentDashboard';
import StudentList from './components/StudentList';
import LearningAreaList from './components/CourseList';
import GradesView from './components/GradesView';
import GradebookView from './components/GradebookView';
import CoreValuesView from './components/CoreValuesView';
import CoreValuesGradebookView from './components/CoreValuesGradebookView';
import AttendanceView from './components/AttendanceView';
import TeacherList from './components/TeacherList';
import SectionsView from './components/SectionsView';
import SubstituteView from './components/SubstituteView';
import SettingsView from './components/SettingsView';
import SchedulerView from './components/SchedulerView';
import AssignmentsView from './components/AssignmentsView';
import { useSchoolData } from './hooks/useSchoolData';
import LoginScreen from './components/LoginScreen';

type Session = { user: AuthUser | StudentUser; type: 'staff' | 'student'; };

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);
  
  const schoolData = useSchoolData(isOnline);

  const handleLogin = (newSession: Session) => {
    setSession(newSession);
    setView('dashboard');
  };

  const handleLogout = () => {
    setSession(null);
  };

  const renderStaffView = () => {
    if (!session || session.type !== 'staff') return null;
    
    switch (view) {
      case 'students':
        return <StudentList schoolData={schoolData} session={session} />;
      case 'learningAreas':
        return <LearningAreaList schoolData={schoolData} session={session} />;
      case 'grades':
        return <GradesView schoolData={schoolData} session={session} />;
      case 'gradebook':
        return <GradebookView schoolData={schoolData} session={session} />;
      case 'coreValues':
        return <CoreValuesView schoolData={schoolData} session={session} />;
      case 'coreValuesGradebook':
        return <CoreValuesGradebookView schoolData={schoolData} session={session} />;
      case 'attendance':
        return <AttendanceView schoolData={schoolData} session={session} />;
      case 'teachers':
        return <TeacherList schoolData={schoolData} session={session} />;
      case 'sections':
        return <SectionsView schoolData={schoolData} session={session} />;
      case 'substitutes':
        return <SubstituteView schoolData={schoolData} />;
      case 'scheduler':
        return <SchedulerView schoolData={schoolData} session={session} />;
      case 'assignments':
        return <AssignmentsView schoolData={schoolData} session={session} />;
      case 'settings':
        return <SettingsView schoolData={schoolData} />;
      case 'dashboard':
      default:
        return <Dashboard schoolData={schoolData} session={session} />;
    }
  };

  const renderStudentView = () => {
      if (!session || session.type !== 'student') return null;
      
      switch (view) {
        case 'grades':
          return <GradesView schoolData={schoolData} session={session} />;
        case 'coreValues':
          return <CoreValuesView schoolData={schoolData} session={session} />;
        case 'attendance':
          return <AttendanceView schoolData={schoolData} session={session} />;
        case 'scheduler':
          return <SchedulerView schoolData={schoolData} session={session} />;
        case 'dashboard':
        default:
          return <StudentDashboard schoolData={schoolData} session={session} />;
      }
  };

  const renderView = () => {
      if (!session) return null;
      return session.type === 'staff' ? renderStaffView() : renderStudentView();
  };
  
  if (!session) {
    return <LoginScreen onLogin={handleLogin} loginFn={schoolData.login} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <Sidebar currentView={view} setView={setView} session={session} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          isOnline={isOnline} 
          setIsOnline={setIsOnline} 
          session={session}
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