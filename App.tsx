import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './src/services/firestoreService';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useSchoolData } from './hooks/useSchoolData';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useFirestoreSyncStatus } from './hooks/useFirestoreSyncStatus';
import type { AuthUser, StudentUser, ParentUser } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Breadcrumb from './components/Breadcrumb';
import LoginScreen from './components/LoginScreen';
import FullScreenLoader from './components/FullScreenLoader';
import OfflineBanner from './components/OfflineBanner';
import UpdateNotification from './components/UpdateNotification';

// Lazy load heavy components for better code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const StudentList = lazy(() => import('./components/StudentList'));
const TeacherList = lazy(() => import('./components/TeacherList'));
const ParentsView = lazy(() => import('./components/ParentsView'));
const SectionsView = lazy(() => import('./components/SectionsView'));
const UnifiedAssessmentView = lazy(() => import('./components/UnifiedAssessmentView'));
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
const FormsLibrary = lazy(() => import('./components/forms/FormsLibrary'));
const Form137Dashboard = lazy(() => import('./components/forms/Form137/Form137Dashboard'));
const Form137Manager = lazy(() => import('./components/forms/Form137/Form137Manager'));
const Form138Dashboard = lazy(() => import('./components/forms/Form138/Form138Dashboard'));
const Form138View = lazy(() => import('./components/forms/Form138/Form138View'));
const Form138Print = lazy(() => import('./components/forms/Form138/Form138Print'));
const SchoolFormsDashboard = lazy(() => import('./components/forms/SchoolForms/SchoolFormsDashboard'));
const SF1Dashboard = lazy(() => import('./components/forms/SchoolForms/SF1Dashboard'));
const SF2Dashboard = lazy(() => import('./components/forms/SchoolForms/SF2Dashboard'));
const SF9Dashboard = lazy(() => import('./components/forms/SchoolForms/SF9Dashboard'));
const ELLNDashboard = lazy(() => import('./components/forms/ELLN/ELLNDashboard'));
const ELLNAssessment = lazy(() => import('./components/forms/ELLN/ELLNAssessment'));
const ELLNResults = lazy(() => import('./components/forms/ELLN/ELLNResults'));
const ELLNReports = lazy(() => import('./components/forms/ELLN/ELLNReports'));
const ILMPTemplate = lazy(() => import('./components/forms/ELLN/ILMPTemplate'));
const GradesReportsDashboard = lazy(() => import('./components/GradesReportsDashboard'));
const TeacherValidationWizard = lazy(() => import('./components/TeacherValidationWizard'));
const ValidationResultsDashboard = lazy(() => import('./components/ValidationResultsDashboard'));

// Enrollment components
const EnrollmentPortal = lazy(() => import('./src/components/enrollment/portal/EnrollmentPortal'));
const ApplicationForm = lazy(() => import('./src/components/enrollment/forms/ApplicationForm'));
const ApplicationStatus = lazy(() => import('./src/components/enrollment/status/ApplicationStatus'));
const AdminEnrollmentDashboard = lazy(() => import('./src/components/enrollment/admin/AdminEnrollmentDashboard'));
const ApplicationReview = lazy(() => import('./src/components/enrollment/admin/ApplicationReview'));

// Wrapper components to extract URL params
const Form137ManagerWrapper: React.FC<{ schoolYear: string }> = ({ schoolYear }) => {
  const { studentId } = useParams<{ studentId: string }>();
  return <Form137Manager studentId={studentId || ''} schoolYear={schoolYear} />;
};

const Form137CreateWrapper: React.FC<{ schoolYear: string }> = ({ schoolYear }) => {
  return <Form137Manager studentId="" schoolYear={schoolYear} initialMode="create" />;
};

const App: React.FC = () => {
  console.log('[App] Rendering');
  
  // TIER 1B: Monitor online/offline status and pending writes
  const { isOnline, wasOffline } = useOnlineStatus();
  const { pendingCount } = useFirestoreSyncStatus();
  
  // Ensure we have a Firebase Auth user for Firestore writes (rules require request.auth != null)
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Trigger anonymous sign-in; wait for next auth state change before proceeding
        signInAnonymously(auth).catch((e) => {
          console.error('[Auth] Anonymous sign-in failed:', e);
          // If offline, don't show error - just set ready to allow offline mode
          if (!navigator.onLine) {
            console.log('[Auth] ⚠️ Offline mode - skipping anonymous auth');
            setAuthReady(true);
          } else {
            setAuthError('Failed to initialize authentication. Please check your internet connection.');
            setAuthReady(true); // Set ready anyway to show error
          }
        });
        return;
      }
      setAuthError(null); // Clear any previous errors
      setAuthReady(true);
      console.log('[Auth] ✅ Auth ready:', user.uid);
    });
    return () => unsub();
  }, []);
  
  // Initialize session from localStorage BEFORE first render
  const [session, setSession] = useState<{ user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' } | null>(() => {
    try {
      const raw = localStorage.getItem('edusync_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.user && parsed.type) {
          console.log('[App] 🔄 Restored session from localStorage:', parsed.user.email);
          return parsed;
        }
      }
    } catch (e) {
      console.error('[App] ❌ Failed to restore session:', e);
    }
    return null;
  });
  
  // Remove the duplicate useEffect that loads session
  // (now handled in useState initializer above)

  // Persist session changes
  useEffect(() => {
    console.log('[App] 📦 Session changed:', session ? `${session.user.email} (${session.type})` : 'null');
    if (session) {
      localStorage.setItem('edusync_session', JSON.stringify(session));
      console.log('[App] 💾 Session saved to localStorage');
    } else {
      localStorage.removeItem('edusync_session');
      console.log('[App] 🗑️ Session removed from localStorage');
      // TIER 1B: Clear cached user credentials on logout
      localStorage.removeItem('edusync_cached_user');
      console.log('[App] 🗑️ Cached user credentials cleared');
    }
  }, [session]);
  
  // Add timeout mechanism to prevent infinite loading
  // TIER 1 FIX: Only run timeout when logged in AND loading data
  // Not when sitting at login screen!
  const [loadTimeout, setLoadTimeout] = useState(false);
  useEffect(() => {
    // Reset timeout when session changes
    setLoadTimeout(false);
    
    // Only start timeout if user is logged in
    if (!session) {
      return; // No timeout needed at login screen
    }
    
    const timer = setTimeout(() => {
      console.warn('[App] ⏰ Load timeout reached (30 seconds)');
      setLoadTimeout(true);
    }, 30000); // 30 second timeout for mobile compatibility
    
    return () => clearTimeout(timer);
  }, [session]); // Re-run when session changes
  
  const [loginType, setLoginType] = useState<'staff' | 'student' | 'parent'>('staff');
  
  // NEW: Firestore subscriptions hook - loads all data automatically with real-time updates
  // IMPORTANT: Only fetch data when user is logged in (session exists)
  // Pass empty array when no session to prevent unnecessary subscriptions
  const schoolData = useSchoolData(session ? undefined : []);
  
  const { 
    loading, error, settings, students, teachers, parents,
    grades, coreValues, coreValueGrades, attendanceRecords,
    sections, learningAreas, substituteAssignments, classSchedules,
    assignments, studentAssignmentGrades, lessonPlans,
    announcements
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
    console.log('[App] 🔐 Login successful for:', user.email, 'Type:', type);
    // Clear any old session first to prevent conflicts
    localStorage.removeItem('edusync_session');
    // Then set new session
    setSession({ user, type });
    console.log('[App] ✅ Session state updated, should redirect to dashboard');
  }, []);
  
  const handleLogout = useCallback(() => {
    setSession(null);
  }, []);

  console.log('[App] Loading check:', { authReady, loading, studentsCount: students.length, teachersCount: teachers.length, loadTimeout });
  
  // TIER 1 OPTIMIZATION: Simplified initialization logic
  // Show login screen as soon as auth is ready
  // Only wait for data loading AFTER user is logged in AND only on initial mount
  // Once we've loaded at least SOME data (1+ collection), allow navigation
  const hasAnyData = students.length > 0 || teachers.length > 0 || learningAreas.length > 0 || 
                      sections.length > 0 || settings.length > 0;
  const isInitializing = !authReady || (session && loading && !loadTimeout && !hasAnyData);
  
  if (isInitializing) {
    return <FullScreenLoader message="Loading school data..." />;
  }
  
  // NEW: Removed hasMinimalData check - allow app to render with empty data
  // Components will show appropriate empty states
  // This fixes offline-first-visit blank page issue
  if (false && loadTimeout) { // Disabled timeout error screen
    return (
      <div className="flex items-center justify-center min-h-screen bg-orange-50 dark:bg-slate-900 text-orange-900 dark:text-orange-200">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Connection Timeout</h1>
          <p className="mb-4">
            Unable to load school data from the server. This could be due to:
          </p>
          <ul className="text-left list-disc list-inside mb-6 space-y-2">
            <li>Slow or unstable internet connection</li>
            <li>Firebase services temporarily unavailable</li>
            <li>Browser blocking third-party cookies</li>
            <li>Firewall or network restrictions</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            🔄 Retry Connection
          </button>
          <p className="mt-4 text-sm text-orange-700 dark:text-orange-400">
            If the problem persists, please check your internet connection and try again.
          </p>
        </div>
      </div>
    );
  }
  
  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-slate-900 text-red-900 dark:text-red-200">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
          <p className="mb-6">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-slate-900 text-red-800 dark:text-red-200">
        <div className="text-center p-8 max-w-2xl">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4">Failed to Load Application Data</h1>
          <p className="mb-4">There was a critical error fetching data from the server.</p>
          <details className="mb-6">
            <summary className="cursor-pointer text-sm font-semibold mb-2">Technical Details</summary>
            <pre className="bg-red-100 dark:bg-red-900/30 p-4 rounded-md text-left text-sm overflow-auto">{error}</pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            🔄 Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Allow public access to enrollment routes
  const publicEnrollmentRoutes = ['/enrollment', '/enrollment/apply', '/enrollment/status'];
  const isPublicEnrollmentRoute = publicEnrollmentRoutes.some(route => 
    window.location.pathname.startsWith(route)
  );

  if (!session && !isPublicEnrollmentRoute) {
    console.log('[App] 🔓 No session - rendering LoginScreen (NO pre-loaded data)');
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        loginType={loginType}
        setLoginType={setLoginType}
      />
    );
  }
  
  // Render public enrollment routes without authentication
  if (!session && isPublicEnrollmentRoute) {
    console.log('[App] 🌐 Public enrollment route - rendering without auth');
    return (
      <Router>
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
          <Suspense fallback={<FullScreenLoader message="Loading enrollment..." />}>
            <Routes>
              <Route path="/enrollment" element={<EnrollmentPortal />} />
              <Route path="/enrollment/apply" element={<ApplicationForm />} />
              <Route path="/enrollment/status" element={<ApplicationStatus />} />
              <Route path="*" element={<Navigate to="/enrollment" replace />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    );
  }
  
  // At this point, session must exist (either logged in or handled by public routes above)
  if (!session) {
    return <FullScreenLoader message="Initializing..." />;
  }
  
  // TIER 1 OPTIMIZATION: Show loading state while data loads after login
  // This prevents confusion when transitioning from login to dashboard
  if (loading) {
    return <FullScreenLoader message="Loading your data..." />;
  }
  
  console.log('[App] ✅ Session exists - rendering Router/Dashboard');
  
  const staffSession = session as { user: AuthUser, type: 'staff' };
  const studentSession = session as { user: StudentUser, type: 'student' };
  const parentSession = session as { user: ParentUser, type: 'parent' };

  return (
    <Router key={session?.user.id || 'no-session'}>
      {/* PWA Update Notification */}
      <UpdateNotification />
      
      {/* TIER 1B: Offline status indicator */}
      <OfflineBanner 
        isOnline={isOnline} 
        wasOffline={wasOffline}
        pendingWrites={pendingCount}
      />
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
          <Breadcrumb />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 px-6 pb-6">
            <Suspense fallback={<FullScreenLoader message="Loading page..." />}>
              <Routes>
                {session.type === 'staff' && (
                    <>
                        <Route path="/" element={<Dashboard schoolData={schoolData} session={staffSession} />} />
                        <Route path="/students" element={<StudentList schoolData={schoolData} session={staffSession} />} />
                        <Route path="/teachers" element={<TeacherList schoolData={schoolData} session={staffSession} />} />
                        <Route path="/parents" element={<ParentsView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/sections" element={<SectionsView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/forms" element={<FormsLibrary user={staffSession.user} />} />
                        <Route path="/forms/137" element={<Form137Dashboard />} />
                        <Route path="/forms/137/:studentId" element={<Form137ManagerWrapper schoolYear={settings.schoolYear} />} />
                        <Route path="/forms/137/new" element={<Form137CreateWrapper schoolYear={settings.schoolYear} />} />
                        <Route path="/forms/138" element={<Form138Dashboard />} />
                        <Route path="/forms/elln" element={<ELLNDashboard />} />
                        <Route path="/forms/elln/assessment" element={<ELLNAssessment />} />
                        <Route path="/forms/elln/results" element={<ELLNResults />} />
                        <Route path="/forms/elln/reports" element={<ELLNReports />} />
                        <Route path="/forms/elln/ilmp" element={<ILMPTemplate />} />
                        <Route path="/grades" element={<GradesReportsDashboard session={staffSession} />} />
                        <Route path="/grades/entry" element={<UnifiedAssessmentView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/grades/form137" element={<Form137Dashboard />} />
                        <Route path="/grades/form137/:studentId" element={<Form137ManagerWrapper schoolYear={settings.schoolYear} />} />
                        <Route path="/grades/form137/new" element={<Form137CreateWrapper schoolYear={settings.schoolYear} />} />
                        <Route path="/grades/form138" element={<Form138Dashboard />} />
                        <Route path="/grades/form138/view/:studentId" element={<Form138View />} />
                        <Route path="/grades/form138/print" element={<Form138Print />} />
                        <Route path="/grades/schoolforms" element={<SchoolFormsDashboard session={staffSession} />} />
                        <Route path="/grades/schoolforms/sf1" element={<SF1Dashboard schoolData={schoolData} session={staffSession} onBack={() => window.history.back()} />} />
                        <Route path="/grades/schoolforms/sf2" element={<SF2Dashboard schoolData={schoolData} session={staffSession} onBack={() => window.history.back()} />} />
                        <Route path="/grades/schoolforms/sf9" element={<SF9Dashboard schoolData={schoolData} session={staffSession} onBack={() => window.history.back()} />} />
                        <Route path="/gradebook" element={<UnifiedAssessmentView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/core-values" element={<UnifiedAssessmentView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/core-values-gradebook" element={<UnifiedAssessmentView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/attendance" element={<AttendanceView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/schedule" element={<SchedulerView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/substitute" element={<SubstituteView schoolData={schoolData} />} />
                        <Route path="/assignments" element={<AssignmentsView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/lesson-plan" element={<LessonPlanView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/announcements" element={<AnnouncementsView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/learning-areas" element={<CourseList schoolData={schoolData} session={staffSession} />} />
                        <Route path="/settings" element={<SettingsView schoolData={schoolData} />} />
                        
                        {/* Enrollment Routes */}
                        <Route path="/enrollment" element={<EnrollmentPortal />} />
                        <Route path="/enrollment/apply" element={<ApplicationForm />} />
                        
                        {/* Admin Enrollment Routes */}
                        {staffSession.user.role === 'admin' && (
                          <>
                            <Route path="/admin/enrollment" element={<AdminEnrollmentDashboard />} />
                            <Route path="/admin/enrollment/:applicationId" element={<ApplicationReview />} />
                          </>
                        )}
                        
                        {staffSession.user.role === 'teacher' && (
                          <Route path="/teacher-validation" element={<TeacherValidationWizard session={staffSession} />} />
                        )}
                        {staffSession.user.role === 'admin' && (
                          <Route path="/validation-results" element={<ValidationResultsDashboard />} />
                        )}
                    </>
                )}
        {session.type === 'student' && (
          <>
            <Route path="/" element={<StudentDashboard schoolData={schoolData} session={studentSession} />} />
            <Route path="/assignments" element={<AssignmentsView schoolData={schoolData} session={studentSession} />} />
            <Route path="/grades" element={<UnifiedAssessmentView schoolData={schoolData} session={studentSession} />} />
            <Route path="/core-values" element={<UnifiedAssessmentView schoolData={schoolData} session={studentSession} />} />
            <Route path="/attendance" element={<AttendanceView schoolData={schoolData} session={studentSession} />} />
            <Route path="/schedule" element={<SchedulerView schoolData={schoolData} session={studentSession} />} />
          </>
        )}
        {session.type === 'parent' && (
           <>
            <Route path="/" element={<ParentDashboard schoolData={schoolData} session={parentSession} />} />
            <Route path="/announcements" element={<AnnouncementsView schoolData={schoolData} session={parentSession} />} />
            <Route path="/assignments" element={<AssignmentsView schoolData={schoolData} session={parentSession} forceStudentId={parentSelectedChildId ?? undefined} />} />
            <Route path="/grades" element={<UnifiedAssessmentView schoolData={schoolData} session={parentSession} forceStudentId={parentSelectedChildId ?? undefined} />} />
            <Route path="/core-values" element={<UnifiedAssessmentView schoolData={schoolData} session={parentSession} forceStudentId={parentSelectedChildId ?? undefined} />} />
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
