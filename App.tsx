import React, { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './src/services/firestoreService';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSchoolData } from './hooks/useSchoolData';
import type { AuthUser, StudentUser, ParentUser } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginScreen from './components/LoginScreen';
import FullScreenLoader from './components/FullScreenLoader';

// Lazy load heavy components for better code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const StudentList = lazy(() => import('./components/StudentList'));
const TeacherList = lazy(() => import('./components/TeacherList'));
const ParentsView = lazy(() => import('./components/ParentsView'));
const SectionsView = lazy(() => import('./components/SectionsView'));
const GradesView = lazy(() => import('./components/GradesView'));
const GradebookView = lazy(() => import('./components/GradebookView'));
const CoreValuesView = lazy(() => import('./components/CoreValuesView'));
const CoreValuesGradebookView = lazy(() => import('./components/CoreValuesGradebookView'));
const AttendanceView = lazy(() => import('./components/AttendanceView'));
const SchedulerView = lazy(() => import('./components/SchedulerView'));
const SubstituteView = lazy(() => import('./components/SubstituteView'));
const AssignmentsView = lazy(() => import('./components/AssignmentsView'));
const LessonPlanView = lazy(() => import('./components/LessonPlanView'));
const AnnouncementsView = lazy(() => import('./components/AnnouncementsView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const CourseList = lazy(() => import('./components/CourseList'));
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const ParentDashboard = lazy(() => import('./components/ParentDashboard'));

const App: React.FC = () => {
  console.log('[App] Rendering');
  
  // Ensure we have a Firebase Auth user for Firestore writes (rules require request.auth != null)
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Trigger anonymous sign-in; wait for next auth state change before proceeding
        signInAnonymously(auth).catch((e) => {
          console.error('[Auth] Anonymous sign-in failed:', e);
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
  
  // Get data from simplified hook - no memoization needed!
  // Initially fetch only essential collections for login and basic app functionality
  const schoolData = useSchoolData(['settings', 'teachers', 'students', 'parents']);
  
  const { 
    loading, error, settings, students, teachers, parents,
    grades = [], coreValues = [], coreValueGrades = [], attendanceRecords = [],
    sections = [], substituteAssignments = [], classSchedules = [],
    assignments = [], studentAssignmentGrades = [], lessonPlans = [],
    announcements = []
  } = schoolData;

  // Track selected child for parent sessions
  const [parentSelectedChildId, setParentSelectedChildId] = useState<string | null>(null);
  
  // Auto-select first child for parent sessions (simplified)
  useEffect(() => {
    if (session?.type === 'parent') {
      const parent = session.user as ParentUser;
      const children = students.filter(s => parent.studentIds.includes(s.id));
      if (children.length > 0 && !parentSelectedChildId) {
        setParentSelectedChildId(children[0].id);
      } else if (children.length === 0) {
        setParentSelectedChildId(null);
      }
    } else {
      setParentSelectedChildId(null);
    }
  }, [session, students, parentSelectedChildId]);

  const handleLogin = useCallback((user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent') => {
    setSession({ user, type });
  }, []);
  
  const handleLogout = useCallback(() => {
    setSession(null);
  }, []);

  const getUsersForLogin = useMemo(() => {
    if (loginType === 'staff') return teachers;
    if (loginType === 'student') return students;
    if (loginType === 'parent') return parents;
    return [];
  }, [loginType, teachers, students, parents]);

  console.log('[App] Loading check:', { authReady, loading, studentsCount: students.length });
  
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
      users={getUsersForLogin}
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
        <Sidebar 
          session={session} 
          schoolName={settings.schoolName}
          schoolYear={settings.schoolYear}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            schoolYear={settings.schoolYear}
            session={session}
            onLogout={handleLogout}
            students={students}
            parentSelectedChildId={parentSelectedChildId}
            onParentChildChange={(id) => setParentSelectedChildId(id)}
          />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 p-6">
            <Suspense fallback={<FullScreenLoader message="Loading page..." />}>
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
            </Suspense>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
