import React, { useState, useEffect } from 'react';
import type { ViewType, AuthUser, StudentUser, ParentUser } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import StudentDashboard from './components/StudentDashboard';
import ParentDashboard from './components/ParentDashboard';
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
import LessonPlanView from './components/LessonPlanView';
import AnnouncementsView from './components/AnnouncementsView';
import ParentsView from './components/ParentsView';
import { useSchoolData } from './hooks/useSchoolData';
import LoginScreen from './components/LoginScreen';

type SessionUser = AuthUser | StudentUser | ParentUser;
type SessionType = 'staff' | 'student' | 'parent';
type Session = { user: SessionUser; type: SessionType; };

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  
  const schoolData = useSchoolData(isOnline);

  const handleLogin = (newSession: Session) => {
    setSession(newSession);
    if (newSession.type === 'parent') {
        const parentUser = newSession.user as ParentUser;
        if (parentUser.studentIds.length > 0) {
            setSelectedChildId(parentUser.studentIds[0]);
        }
    }
    setView('dashboard');
  };

  const handleLogout = () => {
    setSession(null);
    setSelectedChildId(null);
  };
  
  useEffect(() => {
    if (session?.type === 'parent') {
        const parentUser = session.user as ParentUser;
        if (!selectedChildId && parentUser.studentIds.length > 0) {
            setSelectedChildId(parentUser.studentIds[0]);
        }
    }
  }, [session, selectedChildId]);

  const renderView = () => {
    if (!session) {
      return null;
    }

    if (session.type === 'staff') {
      const staffSession = session as { user: AuthUser, type: 'staff' };
      switch (view) {
        case 'students': return <StudentList schoolData={schoolData} session={staffSession} />;
        case 'learningAreas': return <LearningAreaList schoolData={schoolData} session={staffSession} />;
        case 'grades': return <GradesView schoolData={schoolData} session={staffSession} />;
        case 'gradebook': return <GradebookView schoolData={schoolData} session={staffSession} />;
        case 'coreValues': return <CoreValuesView schoolData={schoolData} session={staffSession} />;
        case 'coreValuesGradebook': return <CoreValuesGradebookView schoolData={schoolData} session={staffSession} />;
        case 'attendance': return <AttendanceView schoolData={schoolData} session={staffSession} />;
        case 'teachers': return <TeacherList schoolData={schoolData} session={staffSession} />;
        case 'parents': return <ParentsView schoolData={schoolData} session={staffSession} />;
        case 'sections': return <SectionsView schoolData={schoolData} session={staffSession} />;
        case 'substitutes': return <SubstituteView schoolData={schoolData} />;
        case 'scheduler': return <SchedulerView schoolData={schoolData} session={staffSession} />;
        case 'assignments': return <AssignmentsView schoolData={schoolData} session={staffSession} />;
        case 'lessonPlans': return <LessonPlanView schoolData={schoolData} session={staffSession} />;
        case 'announcements': return <AnnouncementsView schoolData={schoolData} session={staffSession} />;
        case 'settings': return <SettingsView schoolData={schoolData} />;
        case 'dashboard': default: return <Dashboard schoolData={schoolData} session={staffSession} />;
      }
    }

    if (session.type === 'student') {
       const studentSession = session as { user: StudentUser, type: 'student' };
      switch (view) {
        case 'grades': return <GradesView schoolData={schoolData} session={studentSession} />;
        case 'coreValues': return <CoreValuesView schoolData={schoolData} session={studentSession} />;
        case 'attendance': return <AttendanceView schoolData={schoolData} session={studentSession} />;
        case 'scheduler': return <SchedulerView schoolData={schoolData} session={studentSession} />;
        case 'dashboard': default: return <StudentDashboard schoolData={schoolData} session={studentSession} />;
      }
    }

    if (session.type === 'parent') {
      const parentSession = session as { user: ParentUser, type: 'parent' };
      if (!selectedChildId) return <ParentDashboard schoolData={schoolData} session={parentSession} />;
        
      switch (view) {
        case 'grades': return <GradesView schoolData={schoolData} session={parentSession} forceStudentId={selectedChildId} />;
        case 'coreValues': return <CoreValuesView schoolData={schoolData} session={parentSession} forceStudentId={selectedChildId} />;
        case 'attendance': return <AttendanceView schoolData={schoolData} session={parentSession} forceStudentId={selectedChildId} />;
        case 'scheduler': return <SchedulerView schoolData={schoolData} session={parentSession} forceStudentId={selectedChildId} />;
        case 'announcements': return <AnnouncementsView schoolData={schoolData} session={parentSession} />;
        case 'dashboard': default: return <ParentDashboard schoolData={schoolData} session={parentSession} />;
      }
    }
    
    return null;
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
          schoolData={schoolData}
          selectedChildId={selectedChildId}
          setSelectedChildId={setSelectedChildId}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 p-6 lg:p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;