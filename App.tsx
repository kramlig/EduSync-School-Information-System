import React, { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { auth } from './src/services/firestoreService';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
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
import './src/diagnostics'; // Run Firestore diagnostics in development

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
const ParentProfile = lazy(() => import('./components/ParentProfile'));
const ParentBilling = lazy(() => import('./components/ParentBilling'));
const ParentRegistration = lazy(() => import('./src/components/parent/ParentRegistration'));
// const EmailVerification = lazy(() => import('./components/EmailVerification')); // Temporarily disabled
const FeeStructureManager = lazy(() => import('./components/FeeStructureManager'));
const PaymentRecording = lazy(() => import('./components/PaymentRecording'));
const FinancialReports = lazy(() => import('./components/FinancialReports'));
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

// School Management for Super Admins
const SchoolManagementView = lazy(() => import('./components/SchoolManagementView'));

// Enrollment components
const EnrollmentPortal = lazy(() => import('./src/components/enrollment/portal/EnrollmentPortal'));
const ApplicationForm = lazy(() => import('./src/components/enrollment/forms/ApplicationForm'));
const ApplicationStatus = lazy(() => import('./src/components/enrollment/status/ApplicationStatus'));
const AdminEnrollmentDashboard = lazy(() => import('./src/components/enrollment/admin/AdminEnrollmentDashboard'));
const ApplicationReview = lazy(() => import('./src/components/enrollment/admin/ApplicationReview'));

// Marketing components
const LandingPage = lazy(() => import('./src/components/marketing/LandingPage'));
const PrivacyPolicy = lazy(() => import('./src/components/marketing/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./src/components/marketing/TermsOfService'));

// Wrapper components to extract URL params
const Form137ManagerWrapper: React.FC<{ schoolYear: string }> = ({ schoolYear }) => {
  const { studentId } = useParams<{ studentId: string }>();
  return <Form137Manager studentId={studentId || ''} schoolYear={schoolYear} />;
};

const Form137CreateWrapper: React.FC<{ schoolYear: string }> = ({ schoolYear }) => {
  return <Form137Manager studentId="" schoolYear={schoolYear} initialMode="create" />;
};

const App: React.FC = () => {
  const isDev = import.meta.env.MODE === 'development';
  const devLog = (...args: any[]) => isDev && console.log(...args);
  const devError = (...args: any[]) => isDev && console.error(...args);
  const devWarn = (...args: any[]) => isDev && console.warn(...args);
  
  // Check if we're on a public route FIRST (before any expensive operations)
  // NOTE: /admin is NOT in public routes - it's handled specially below
  // NOTE: / IS public for non-logged-in users (landing page), but becomes dashboard when logged in
  const publicRoutes = ['/', '/home', '/landing', '/enrollment', '/enrollment/apply', '/enrollment/status', '/register/parent'];
  const isPublicRoute = publicRoutes.some(route => 
    window.location.pathname === route || window.location.pathname.startsWith('/enrollment') || window.location.pathname.startsWith('/register')
  );
  
  // Special handling for /admin route
  const isAdminLoginRoute = window.location.pathname === '/admin';
  
  // Initialize session from localStorage BEFORE checking if we should skip Firebase operations
  const [session, setSession] = useState<{ user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' } | null>(() => {
    try {
      const raw = localStorage.getItem('edusync_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.user && parsed.type) {
          devLog('[App] 🔄 Restored session from localStorage:', parsed.user.email);
          return parsed;
        }
      }
    } catch (e) {
      devError('[App] ❌ Failed to restore session:', e);
    }
    return null;
  });
  
  // Determine if we should skip expensive Firebase operations
  // Skip ONLY if: (1) no session AND (2) on a public route
  // This allows logged-in users on / to load data, while anonymous users skip Firebase
  const shouldSkipFirebase = !session && isPublicRoute;
  
  // TIER 1B: Monitor online/offline status and pending writes (only for authenticated routes)
  const { isOnline, wasOffline } = useOnlineStatus();
  // CRITICAL: Always call useFirestoreSyncStatus (can't conditionally call hooks!)
  // Pass skip=true to disable monitoring for public routes without session
  const { pendingCount } = useFirestoreSyncStatus(shouldSkipFirebase || isAdminLoginRoute);
  
  // Ensure we have a Firebase Auth user for Firestore writes (rules require request.auth != null)
  // SKIP for public routes without session AND /admin login page to avoid 30+ second delay
  const [authReady, setAuthReady] = useState(shouldSkipFirebase || isAdminLoginRoute);
  const [authError, setAuthError] = useState<string | null>(null);
  
  useEffect(() => {
    // Skip auth for public routes without session and login page - no Firebase needed
    if (shouldSkipFirebase || isAdminLoginRoute) {
      setAuthReady(true);
      return;
    }
    
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Trigger anonymous sign-in; wait for next auth state change before proceeding
        signInAnonymously(auth).catch((e) => {
          devError('[Auth] Anonymous sign-in failed:', e);
          // If offline, don't show error - just set ready to allow offline mode
          if (!navigator.onLine) {
            devLog('[Auth] ⚠️ Offline mode - skipping anonymous auth');
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
      devLog('[Auth] ✅ Auth ready:', user.uid);
    });
    return () => unsub();
  }, [devLog, devError, shouldSkipFirebase, isAdminLoginRoute]);
  
  // Persist session changes
  useEffect(() => {
    devLog('[App] 📦 Session changed:', session ? `${session.user.email} (${session.type})` : 'null');
    if (session) {
      localStorage.setItem('edusync_session', JSON.stringify(session));
      devLog('[App] 💾 Session saved to localStorage');
    } else {
      localStorage.removeItem('edusync_session');
      devLog('[App] 🗑️ Session removed from localStorage');
      // TIER 1B: Clear cached user credentials on logout
      localStorage.removeItem('edusync_cached_user');
      devLog('[App] 🗑️ Cached user credentials cleared');
    }
  }, [session, devLog]);
  
  // Add timeout mechanism to prevent infinite loading
  // TIER 1 FIX: Only run timeout when logged in AND loading data
  // Skip for public routes, login screen, and /admin page
  const [loadTimeout, setLoadTimeout] = useState(false);
  useEffect(() => {
    // Reset timeout when session changes
    setLoadTimeout(false);
    
    // Skip timeout for public routes, login page, or when not logged in
    if (!session || isPublicRoute || isAdminLoginRoute) {
      return; // No timeout needed for public pages or login screen
    }
    
    const timer = setTimeout(() => {
      devWarn('[App] ⏰ Load timeout reached (30 seconds)');
      setLoadTimeout(true);
    }, 30000); // 30 second timeout for mobile compatibility
    
    return () => clearTimeout(timer);
  }, [session, devWarn, isPublicRoute, isAdminLoginRoute]); // Re-run when session or route changes
  
  const [loginType, setLoginType] = useState<'staff' | 'student' | 'parent'>('staff');
  
  // 🚀 PERFORMANCE OPTIMIZATION: Route-based lazy loading
  // Only load collections needed for the current route
  // This reduces initial load time from 11s to 2-3s while maintaining offline-first
  // Firestore SDK caches everything, so once loaded, works offline forever
  
  const emptyCollections = useMemo(() => [], []);
  const isSchoolManagementRoute = location.pathname === '/school-management';
  const shouldLoadData = session && !shouldSkipFirebase && !isAdminLoginRoute && !isSchoolManagementRoute;
  
  // Determine which collections to load based on current route
  const requiredCollections = useMemo(() => {
    if (!shouldLoadData) return emptyCollections;
    
    const path = location.pathname;
    
    // Core collections needed for most routes
    const core = ['settings', 'students', 'sections'];
    
    // Route-specific collections
    if (path === '/' || path === '/dashboard') {
      return [...core, 'grades', 'substituteAssignments', 'classSchedules', 'learningAreas'];
    }
    if (path.startsWith('/students')) {
      return [...core, 'grades', 'coreValueGrades', 'attendanceRecords', 'learningAreas'];
    }
    if (path.startsWith('/teachers')) {
      return [...core, 'teachers', 'classSchedules', 'substituteAssignments'];
    }
    if (path.startsWith('/parents')) {
      return [...core, 'parents'];
    }
    if (path.startsWith('/grades') || path.startsWith('/assessment')) {
      return [...core, 'grades', 'learningAreas', 'coreValues', 'coreValueGrades'];
    }
    if (path.startsWith('/attendance')) {
      return [...core, 'attendanceRecords'];
    }
    if (path.startsWith('/schedule')) {
      return [...core, 'teachers', 'classSchedules', 'learningAreas'];
    }
    if (path.startsWith('/substitute')) {
      return [...core, 'teachers', 'substituteAssignments', 'classSchedules'];
    }
    if (path.startsWith('/assignments')) {
      return [...core, 'assignments', 'studentAssignmentGrades', 'learningAreas'];
    }
    if (path.startsWith('/lessons')) {
      return [...core, 'lessonPlans', 'learningAreas'];
    }
    if (path.startsWith('/announcements')) {
      return [...core, 'announcements'];
    }
    if (path.startsWith('/billing') || path.startsWith('/financial')) {
      return [...core, 'parents']; // Financial data managed separately
    }
    
    // Default: Load core + commonly used collections
    return [...core, 'grades', 'teachers', 'learningAreas'];
  }, [shouldLoadData, location.pathname, emptyCollections]);
  
  const schoolData = useSchoolData(requiredCollections);
  
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
    devLog('[App] 🔐 Login successful for:', user.email, 'Type:', type, 'SchoolID:', (user as AuthUser).schoolId);
    
    // CRITICAL: Save session to localStorage AND React state
    const sessionData = { user, type };
    localStorage.setItem('edusync_session', JSON.stringify(sessionData));
    devLog('[App] 💾 Session saved to localStorage:', sessionData);
    
    // Notify SchoolContext that session was updated
    window.dispatchEvent(new Event('edusync-session-updated'));
    
    // Set React state FIRST (this triggers re-render with session)
    setSession(sessionData);
    devLog('[App] ✅ Session state updated');
    
    // Navigate away from /admin login page to dashboard using pushState (no page reload!)
    if (window.location.pathname === '/admin') {
      devLog('[App] 🔄 Navigating from /admin to dashboard');
      window.history.pushState({}, '', '/');
      // Force a re-render by dispatching a popstate event
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [devLog]);
  
  const handleLogout = useCallback(async () => {
    try {
      // Sign out from Firebase Auth (fast - just clears token)
      await signOut(auth);
      
      // Clear local state immediately (instant UI update)
      setSession(null);
      localStorage.removeItem('edusync_session');
      localStorage.removeItem('edusync_cached_user');
      
      // Navigate to login (instant - no page reload)
      window.history.pushState({}, '', '/admin');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (error) {
      // Fallback to page reload if something fails
      devError('Logout error:', error);
      setSession(null);
      window.location.href = '/admin';
    }
  }, [devError]);

  devLog('[App] Loading check:', { authReady, loading, studentsCount: students.length, teachersCount: teachers.length, loadTimeout });
  
  // TIER 1 OPTIMIZATION: Simplified initialization logic
  // Show login screen as soon as auth is ready
  // Only wait for data loading AFTER user is logged in AND only on initial mount
  // Once we've loaded at least SOME data (1+ collection), allow navigation
  const hasAnyData = students.length > 0 || teachers.length > 0 || learningAreas.length > 0 || 
                      sections.length > 0 || settings.schoolName !== '';
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

  // Render public routes without authentication (landing page + enrollment)
  // BUT skip if user is already logged in (session exists)
  if (!session && isPublicRoute) {
    devLog('[App] 🌐 Public route - rendering without auth');
    return (
      <Router>
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
          <Suspense fallback={<FullScreenLoader message="Loading..." />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<LandingPage />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/enrollment" element={<EnrollmentPortal />} />
              <Route path="/enrollment/apply" element={<ApplicationForm />} />
              <Route path="/enrollment/status" element={<ApplicationStatus />} />
              <Route path="/register/parent" element={<ParentRegistration />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    );
  }
  
  // Handle /admin login route specially (before checking session)
  // Show login screen if not logged in
  if (isAdminLoginRoute && !session) {
    devLog('[App] 🔓 /admin route - rendering LoginScreen');
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        loginType={loginType}
        setLoginType={setLoginType}
      />
    );
  }
  
  // If logged in on /admin, let it fall through to main Router
  // which will handle routing properly (doesn't need special case)
  
  // Fallback for any other routes without session
  if (!session && !isPublicRoute && !isAdminLoginRoute) {
    devLog('[App] 🔓 No session - rendering LoginScreen (NO pre-loaded data)');
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        loginType={loginType}
        setLoginType={setLoginType}
      />
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
  
  devLog('[App] ✅ Session exists - rendering Router/Dashboard');
  
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
          announcements={announcements}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            schoolYear={settings.schoolYear}
            schoolName={settings.schoolName}
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
                {/* Redirect logged-in users from /admin to dashboard */}
                <Route path="/admin" element={<Navigate to="/" replace />} />
                
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
                        <Route path="/grades" element={<GradesReportsDashboard session={staffSession} schoolData={schoolData} />} />
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
                        
                        {/* Super Admin Routes - Route always rendered, component handles access control */}
                        <Route path="/school-management" element={
                          staffSession.user.role === 'superadmin' 
                            ? <SchoolManagementView /> 
                            : <Navigate to="/" replace />
                        } />
                        
                        {/* Financial Management Routes */}
                        {(staffSession.user.role === 'admin' || staffSession.user.role === 'registrar') && (
                          <>
                            <Route path="/fee-structures" element={<FeeStructureManager schoolData={schoolData} />} />
                            <Route path="/record-payment" element={<PaymentRecording schoolData={schoolData} session={staffSession} />} />
                            <Route path="/financial-reports" element={<FinancialReports schoolData={schoolData} session={staffSession} />} />
                          </>
                        )}
                        
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
            <Route path="/profile" element={<ParentProfile schoolData={schoolData} session={parentSession} onSessionUpdate={(updatedUser) => setSession({ user: updatedUser, type: 'parent' })} />} />
            <Route path="/billing" element={<ParentBilling schoolData={schoolData} session={parentSession} selectedChildId={parentSelectedChildId} />} />
            {/* <Route path="/verify-email" element={<EmailVerification />} /> */}
            {/* <Route path="/email-verification" element={<EmailVerification />} /> */}
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
