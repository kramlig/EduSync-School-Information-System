import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './src/services/firestoreService';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSchoolData } from './hooks/useSchoolData';
import type { AuthUser, StudentUser, ParentUser } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import TeacherList from './components/TeacherList';
import ParentsView from './components/ParentsView';
import SectionsView from './components/SectionsView';
import GradesView from './components/GradesView';
import GradebookView from './components/GradebookView';
import CoreValuesView from './components/CoreValuesView';
import CoreValuesGradebookView from './components/CoreValuesGradebookView';
import AttendanceView from './components/AttendanceView';
import SchedulerView from './components/SchedulerView';
import SubstituteView from './components/SubstituteView';
import AssignmentsView from './components/AssignmentsView';
import LessonPlanView from './components/LessonPlanView';
import AnnouncementsView from './components/AnnouncementsView';
import SettingsView from './components/SettingsView';
import CourseList from './components/CourseList';
import StudentDashboard from './components/StudentDashboard';
import ParentDashboard from './components/ParentDashboard';
import LoginScreen from './components/LoginScreen';
import FullScreenLoader from './components/FullScreenLoader';
import DevSyncStatus from './components/DevSyncStatus';

const App: React.FC = () => {
  try { console.log('[App] mounted'); } catch {}
  // Ensure we have a Firebase Auth user for Firestore writes (rules require request.auth != null)
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Trigger anonymous sign-in; wait for next auth state change before proceeding
        signInAnonymously(auth).catch((e) => {
          // eslint-disable-next-line no-console
          console.error('[Auth] Anonymous sign-in failed:', e);
          // If the Anonymous provider is disabled (auth/admin-restricted-operation),
          // allow the app to render in read-only mode rather than blocking indefinitely.
          setAuthReady(true);
        });
        return;
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);
  const [session, setSession] = useState<{ user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' } | null>(null);
  // Load session from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem('edusync_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.user && parsed.type) {
          setSession(parsed);
        }
      }
    } catch {}
  }, []);

  // Persist session changes
  useEffect(() => {
    if (session) {
      localStorage.setItem('edusync_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('edusync_session');
    }
  }, [session]);
  const [loginType, setLoginType] = useState<'staff' | 'student' | 'parent'>('staff');
  const schoolData = useSchoolData();
  const { loading, error, settings, students, teachers, parents } = schoolData;

  // Track selected child for parent sessions and pass to views
  const [parentSelectedChildId, setParentSelectedChildId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.type === 'parent') {
      const parent = session.user as ParentUser;
      const children = students.filter(s => parent.studentIds.includes(s.id));
      if (children.length === 0) {
        setParentSelectedChildId(null);
      } else if (!parentSelectedChildId || !children.some(c => c.id === parentSelectedChildId)) {
        setParentSelectedChildId(children[0].id);
      }
    } else if (parentSelectedChildId !== null) {
      setParentSelectedChildId(null);
    }
  }, [session, students]);

  const handleLogin = (user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent') => {
    setSession({ user, type });
  };
  
  const handleLogout = () => {
    setSession(null);
  };

  const getUsersForLogin = () => {
    if (loginType === 'staff') return teachers;
    if (loginType === 'student') return students;
    if (loginType === 'parent') return parents;
    return [];
  };

  if (!authReady || loading) {
    return <FullScreenLoader message="Loading school data..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 text-red-800">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Failed to Load Application Data</h1>
          <p className="mb-4">There was a critical error fetching data from the server. Please check the console for details and try refreshing the page.</p>
          <pre className="bg-red-100 p-4 rounded-md text-left text-sm">{error}</pre>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen 
      onLogin={handleLogin} 
      users={getUsersForLogin()}
      loginType={loginType}
      setLoginType={setLoginType}
    />;
  }
  
  const staffSession = session as { user: AuthUser, type: 'staff' };
  const studentSession = session as { user: StudentUser, type: 'student' };
  const parentSession = session as { user: ParentUser, type: 'parent' };

  return (
    <Router>
      <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
        <Sidebar session={session} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            schoolName={settings.schoolName}
            schoolYear={settings.schoolYear}
            session={session}
            onLogout={handleLogout}
            students={students}
            parentSelectedChildId={parentSelectedChildId}
            onParentChildChange={(id) => setParentSelectedChildId(id)}
            onSyncClick={async (scope) => {
              const path = window.location.pathname;
              // Map route to store scopes when 'auto' is selected
              const auto = () => {
                if (path.includes('/grades') || path.includes('/gradebook')) return ['grades','students','learningAreas'] as const;
                if (path.includes('/core-values')) return ['coreValues','coreValueGrades','students'] as const;
                if (path.includes('/attendance')) return ['attendanceRecords','students'] as const;
                if (path.includes('/assignments')) return ['assignments','studentAssignmentGrades','students','sections'] as const;
                if (path.includes('/lesson-plan')) return ['lessonPlans','assignments','sections','learningAreas'] as const;
                if (path.includes('/schedule')) return ['classSchedules','sections','teachers'] as const;
                if (path.includes('/parents')) return ['parents','students'] as const;
                if (path.includes('/teachers')) return ['teachers'] as const;
                if (path.includes('/sections')) return ['sections','students'] as const;
                if (path.includes('/announcements')) return ['announcements'] as const;
                return 'all' as const;
              };
              const mapSingle = (s: string) => s as any;
              const stores = scope === 'auto' ? auto() : scope === 'all' ? 'all' : [mapSingle(scope)];
              try {
                const res = await (schoolData as any).refreshStores(stores);
                // eslint-disable-next-line no-console
                console.info('[Sync] Refreshed', stores, res.updated);
              } catch (e) {
                // eslint-disable-next-line no-alert
                alert('Sync failed. See console for details.');
                // eslint-disable-next-line no-console
                console.error('[Sync] error', e);
              }
            }}
          />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 p-6">
            <Routes>
                {session.type === 'staff' && (
                    <>
                        <Route path="/" element={<Dashboard schoolData={schoolData} session={staffSession} />} />
                        <Route path="/students" element={<StudentList schoolData={schoolData} session={staffSession} />} />
                        <Route path="/teachers" element={<TeacherList schoolData={schoolData} session={staffSession} />} />
                        <Route path="/parents" element={<ParentsView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/sections" element={<SectionsView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/grades" element={<GradesView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/gradebook" element={<GradebookView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/core-values" element={<CoreValuesView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/core-values-gradebook" element={<CoreValuesGradebookView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/attendance" element={<AttendanceView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/schedule" element={<SchedulerView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/substitute" element={<SubstituteView schoolData={schoolData} />} />
                        <Route path="/assignments" element={<AssignmentsView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/lesson-plan" element={<LessonPlanView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/announcements" element={<AnnouncementsView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/learning-areas" element={<CourseList schoolData={schoolData} session={staffSession} />} />
                        <Route path="/settings" element={<SettingsView schoolData={schoolData} />} />
                    </>
                )}
        {session.type === 'student' && (
          <>
            <Route path="/" element={<StudentDashboard schoolData={schoolData} session={studentSession} />} />
            <Route path="/assignments" element={<AssignmentsView schoolData={schoolData} session={studentSession} />} />
            <Route path="/grades" element={<GradesView schoolData={schoolData} session={studentSession} />} />
            <Route path="/core-values" element={<CoreValuesView schoolData={schoolData} session={studentSession} />} />
            <Route path="/attendance" element={<AttendanceView schoolData={schoolData} session={studentSession} />} />
            <Route path="/schedule" element={<SchedulerView schoolData={schoolData} session={studentSession} />} />
          </>
        )}
        {session.type === 'parent' && (
           <>
            <Route path="/" element={<ParentDashboard schoolData={schoolData} session={parentSession} />} />
            <Route path="/announcements" element={<AnnouncementsView schoolData={schoolData} session={parentSession} />} />
            <Route path="/assignments" element={<AssignmentsView schoolData={schoolData} session={parentSession} forceStudentId={parentSelectedChildId ?? undefined} />} />
            <Route path="/grades" element={<GradesView schoolData={schoolData} session={parentSession} forceStudentId={parentSelectedChildId ?? undefined} />} />
            <Route path="/core-values" element={<CoreValuesView schoolData={schoolData} session={parentSession} forceStudentId={parentSelectedChildId ?? undefined} />} />
            <Route path="/attendance" element={<AttendanceView schoolData={schoolData} session={parentSession} forceStudentId={parentSelectedChildId ?? undefined} />} />
            <Route path="/schedule" element={<SchedulerView schoolData={schoolData} session={parentSession} forceStudentId={parentSelectedChildId ?? undefined} />} />
          </>
        )}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          {String((import.meta as any).env?.VITE_USE_FIREBASE_EMULATOR || '').toLowerCase() === 'true' && (
            <DevSyncStatus />
          )}
        </div>
      </div>
    </Router>
  );
};

export default App;