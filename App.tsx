import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { auth } from './src/services/firestoreService';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useSchoolDataPostgreSQL } from './src/hooks/useSchoolDataPostgreSQL';
import { useStudentsPostgreSQL } from './src/hooks/useStudentsPostgreSQL';
import { useParentsPostgreSQL } from './src/hooks/useParentsPostgreSQL';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useFirestoreSyncStatus } from './hooks/useFirestoreSyncStatus';
import type { AuthUser, StudentUser, ParentUser } from './types';
import type { DivisionAuthUser } from './src/services/authService';
import type { SchoolDataHook } from './hooks/useSchoolData';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Breadcrumb from './components/Breadcrumb';
import LoginScreen from './components/LoginScreen';
import FullScreenLoader from './components/FullScreenLoader';
import OfflineBanner from './components/OfflineBanner';
import UpdateNotification from './components/UpdateNotification';
import './src/diagnostics'; // Run Firestore diagnostics in development
import './src/utils/logger'; // Initialize logger (disables console in production)
import { getPersonalWorkspace, getUserSubscription } from './src/services/personalWorkspaceService';
import { lazyWithRetry } from './src/utils/lazyWithRetry';

// Lazy load heavy components for better code splitting (using lazyWithRetry to handle stale chunks after deployments)
const Dashboard = lazyWithRetry(() => import('./components/Dashboard'));
const StudentList = lazyWithRetry(() => import('./components/StudentList'));
const TeacherList = lazyWithRetry(() => import('./components/TeacherList'));
const ParentsView = lazyWithRetry(() => import('./components/ParentsView'));
const ParentsViewPostgreSQL = lazyWithRetry(() => import('./src/components/ParentsViewPostgreSQL'));
const TeachersViewPostgreSQL = lazyWithRetry(() => import('./src/components/TeachersViewPostgreSQL'));
const SectionsView = lazyWithRetry(() => import('./components/SectionsViewOptimized'));
const UnifiedAssessmentView = lazyWithRetry(() => import('./components/UnifiedAssessmentView'));
const GradesDashboard = lazyWithRetry(() => import('./components/GradesDashboard'));
const GradesView = lazyWithRetry(() => import('./components/GradesView'));
const GradesSummary = lazyWithRetry(() => import('./components/GradesSummaryNew'));
const GradebookView = lazyWithRetry(() => import('./components/GradebookView'));
const CoreValuesGradebookView = lazyWithRetry(() => import('./components/CoreValuesGradebookView'));
const HomeroomGuidanceView = lazyWithRetry(() => import('./components/HomeroomGuidanceView'));
const AttendanceView = lazyWithRetry(() => import('./components/AttendanceView'));
const SchedulerView = lazyWithRetry(() => import('./components/SchedulerView'));
const SubstituteView = lazyWithRetry(() => import('./components/SubstituteView'));
const AssignmentsView = lazyWithRetry(() => import('./components/AssignmentsView'));
const LessonPlanView = lazyWithRetry(() => import('./components/LessonPlanView'));
const AnnouncementsView = lazyWithRetry(() => import('./components/AnnouncementsView'));
const SettingsView = lazyWithRetry(() => import('./components/SettingsView'));
const SchoolSettingsPostgreSQL = lazyWithRetry(() => import('./components/SchoolSettingsPostgreSQL'));
const CourseList = lazyWithRetry(() => import('./components/CourseList'));
const StudentDashboard = lazyWithRetry(() => import('./components/StudentDashboard'));
const ParentDashboard = lazyWithRetry(() => import('./components/ParentDashboard'));
const ParentProfile = lazyWithRetry(() => import('./components/ParentProfile'));
const ParentBilling = lazyWithRetry(() => import('./components/ParentBilling'));
const ParentRegistration = lazyWithRetry(() => import('./src/components/parent/ParentRegistration'));
// const EmailVerification = lazyWithRetry(() => import('./components/EmailVerification')); // Temporarily disabled
const FeeStructureManager = lazyWithRetry(() => import('./components/FeeStructureManager'));
const PaymentRecording = lazyWithRetry(() => import('./components/PaymentRecording'));
const FinancialReports = lazyWithRetry(() => import('./components/FinancialReports'));
const ReceiptManagement = lazyWithRetry(() => import('./components/ReceiptManagement'));
// const FormsLibrary = lazyWithRetry(() => import('./components/forms/FormsLibrary')); // Deprecated - using direct form routes now
const Form137Dashboard = lazyWithRetry(() => import('./components/forms/Form137/Form137Dashboard'));
const Form137Manager = lazyWithRetry(() => import('./components/forms/Form137/Form137Manager'));
const Form138Dashboard = lazyWithRetry(() => import('./components/forms/Form138/Form138Dashboard'));
const Form138View = lazyWithRetry(() => import('./components/forms/Form138/Form138View'));
const Form138Print = lazyWithRetry(() => import('./components/forms/Form138/Form138Print'));
const SchoolFormsDashboard = lazyWithRetry(() => import('./components/forms/SchoolForms/SchoolFormsDashboard'));
const SF1Dashboard = lazyWithRetry(() => import('./components/forms/SchoolForms/SF1Dashboard'));
const SF2Dashboard = lazyWithRetry(() => import('./components/forms/SchoolForms/SF2Dashboard'));
const SF9Dashboard = lazyWithRetry(() => import('./components/forms/SchoolForms/SF9Dashboard'));
const SF9View = lazyWithRetry(() => import('./components/forms/SF9/SF9View'));
const SF9Print = lazyWithRetry(() => import('./components/forms/SF9/SF9Print'));
const SF8Dashboard = lazyWithRetry(() => import('./components/forms/SchoolForms/SF8Dashboard'));
const SF5ASHSDashboard = lazyWithRetry(() => import('./components/forms/SchoolForms/SF5ASHSDashboard'));
const SF5BSHSDashboard = lazyWithRetry(() => import('./components/forms/SchoolForms/SF5BSHSDashboard'));
const SF1SHSDashboard = lazyWithRetry(() => import('./components/forms/SchoolForms/SF1SHSDashboard'));
const SF2SHSDashboard = lazyWithRetry(() => import('./components/forms/SchoolForms/SF2SHSDashboard'));
const SF9SHSDashboard = lazyWithRetry(() => import('./components/forms/SchoolForms/SF9SHSDashboard'));
const SF10Dashboard = lazyWithRetry(() => import('./components/forms/SF10/SF10Dashboard'));
const ELLNDashboard = lazyWithRetry(() => import('./components/forms/ELLN/ELLNDashboard'));
const ELLNAssessment = lazyWithRetry(() => import('./components/forms/ELLN/ELLNAssessment'));
const ELLNResults = lazyWithRetry(() => import('./components/forms/ELLN/ELLNResults'));
const ELLNReports = lazyWithRetry(() => import('./components/forms/ELLN/ELLNReports'));
const ILMPTemplate = lazyWithRetry(() => import('./components/forms/ELLN/ILMPTemplate'));
const SF3Dashboard = lazyWithRetry(() => import('./src/components/deped-forms/SF3Dashboard'));
const SF4Dashboard = lazyWithRetry(() => import('./src/components/deped-forms/SF4Dashboard'));
const SF5Dashboard = lazyWithRetry(() => import('./src/components/deped-forms/SF5Dashboard'));
const SF5KDashboard = lazyWithRetry(() => import('./src/components/deped-forms/SF5KDashboard'));
const SF6Dashboard = lazyWithRetry(() => import('./src/components/deped-forms/SF6Dashboard'));
const SF7Dashboard = lazyWithRetry(() => import('./src/components/deped-forms/SF7Dashboard'));
const TextbookManagementDashboard = lazyWithRetry(() => import('./src/components/deped-forms/TextbookManagementDashboard'));
const FacilitiesManagementDashboard = lazyWithRetry(() => import('./src/components/deped-forms/FacilitiesManagementDashboard'));
// const GradesReportsDashboard = lazyWithRetry(() => import('./components/GradesReportsDashboard')); // Unused
// const TeacherValidationWizard = lazyWithRetry(() => import('./components/TeacherValidationWizard')); // HIDDEN: Outdated
const ValidationResultsDashboard = lazyWithRetry(() => import('./components/ValidationResultsDashboard'));

// PostgreSQL Migration Test Components
const GradebookViewPostgreSQL = lazyWithRetry(() => import('./components/GradebookViewPostgreSQL'));

// Electronic Class Record (ECR) Components
const ClassRecordView = lazyWithRetry(() => import('./components/ClassRecordView'));
const ClassRecordSelector = lazyWithRetry(() => import('./components/ClassRecordSelector'));

// School Management for Super Admins (Legacy - deprecated)
// const SchoolManagementView = lazyWithRetry(() => import('./components/SchoolManagementView'));

// New SuperAdmin Module
const SuperAdminLayout = lazyWithRetry(() => import('./src/components/superadmin/SuperAdminLayout'));

// Free Tools (public, no auth required)
const FormGeneratorPage = lazyWithRetry(() => import('./src/components/tools/FormGeneratorPage'));

// Personal Workspace (authenticated, simplified)
const PersonalSignupScreen = lazyWithRetry(() => import('./src/components/personal/PersonalSignupScreen'));
const PersonalLayout = lazyWithRetry(() => import('./src/components/personal/PersonalLayout'));
const PersonalDashboard = lazyWithRetry(() => import('./src/components/personal/PersonalDashboard'));
const PersonalStudentListWrapper = lazyWithRetry(() => import('./src/components/personal/PersonalStudentListWrapper'));
const PersonalForms = lazyWithRetry(() => import('./src/components/personal/PersonalForms'));
const PersonalSettings = lazyWithRetry(() => import('./src/components/personal/PersonalSettings'));
const PersonalGradebook = lazyWithRetry(() => import('./src/components/personal/PersonalGradebook'));
const PersonalClassRecordSelector = lazyWithRetry(() => import('./src/components/personal/PersonalClassRecordSelector'));
const PersonalClassRecordView = lazyWithRetry(() => import('./src/components/personal/PersonalClassRecordView'));
const PersonalAnalytics = lazyWithRetry(() => import('./src/components/personal/PersonalAnalytics'));
const PersonalSections = lazyWithRetry(() => import('./src/components/personal/PersonalSections'));
const PersonalAttendance = lazyWithRetry(() => import('./src/components/personal/PersonalAttendance'));
const PersonalCoreValues = lazyWithRetry(() => import('./src/components/personal/PersonalCoreValues'));
const PersonalHomeroomGuidance = lazyWithRetry(() => import('./src/components/personal/PersonalHomeroomGuidance'));

// Enrollment components
const EnrollmentPortal = lazyWithRetry(() => import('./src/components/enrollment/portal/EnrollmentPortal'));
const ApplicationForm = lazyWithRetry(() => import('./src/components/enrollment/forms/ApplicationForm'));
const ApplicationStatus = lazyWithRetry(() => import('./src/components/enrollment/status/ApplicationStatus'));
const AdminEnrollmentDashboard = lazyWithRetry(() => import('./src/components/enrollment/admin/AdminEnrollmentDashboard'));
const ApplicationReview = lazyWithRetry(() => import('./src/components/enrollment/admin/ApplicationReview'));

// Admin components - Using V2 with Cloud Function (no admin password re-entry needed!)
const UserManagementPanel = lazyWithRetry(() => import('./src/components/admin/UserManagementPanelV2'));

// Marketing components
const LandingPage = lazyWithRetry(() => import('./src/components/marketing/LandingPage'));
const LandingPageV2 = lazyWithRetry(() => import('./src/components/marketing/LandingPageV2'));
const TeachersLandingPage = lazyWithRetry(() => import('./src/components/marketing/TeachersLandingPage'));
const PrivacyPolicy = lazyWithRetry(() => import('./src/components/marketing/PrivacyPolicy'));
const TermsOfService = lazyWithRetry(() => import('./src/components/marketing/TermsOfService'));
const NotFoundPage = lazyWithRetry(() => import('./src/components/marketing/NotFoundPage'));

// Division-level components
const DivisionLayout = lazyWithRetry(() => import('./src/components/division/DivisionLayout'));
const DivisionDashboard = lazyWithRetry(() => import('./src/components/division/DivisionDashboard'));
const DivisionSchools = lazyWithRetry(() => import('./src/components/division/DivisionSchools'));
const DivisionPersonnel = lazyWithRetry(() => import('./src/components/division/DivisionPersonnel'));
const DivisionEnrollment = lazyWithRetry(() => import('./src/components/division/DivisionEnrollment'));
const DivisionReports = lazyWithRetry(() => import('./src/components/division/DivisionReports'));
const DivisionSettings = lazyWithRetry(() => import('./src/components/division/DivisionSettingsEnhanced'));
const DivisionUserManagement = lazyWithRetry(() => import('./src/components/division/DivisionUserManagement'));
const DivisionSF5Dashboard = lazyWithRetry(() => import('./src/components/division/DivisionSF5Dashboard'));
const DivisionSF6Dashboard = lazyWithRetry(() => import('./src/components/division/DivisionSF6Dashboard'));
const DivisionSF7Dashboard = lazyWithRetry(() => import('./src/components/division/DivisionSF7Dashboard'));
const DivisionProficiencyDashboard = lazyWithRetry(() => import('./src/components/division/DivisionProficiencyDashboard'));
const DivisionAuditLog = lazyWithRetry(() => import('./src/components/division/DivisionAuditLog'));
const DivisionOnboarding = lazyWithRetry(() => import('./src/components/division/DivisionOnboarding'));
const DivisionSF1Import = lazyWithRetry(() => import('./src/components/division/DivisionSF1Import'));
const DivisionSF5Import = lazyWithRetry(() => import('./src/components/division/DivisionSF5Import'));
const DivisionSF7Import = lazyWithRetry(() => import('./src/components/division/DivisionSF7Import'));
import { DivisionContextProvider } from './src/contexts/DivisionContext';
import DivisionGuard from './src/components/division/DivisionGuard';

// Wrapper components to extract URL params
const Form137ManagerWrapper: React.FC<{ schoolYear: string }> = ({ schoolYear }) => {
  const { studentId } = useParams<{ studentId: string }>();
  return <Form137Manager studentId={studentId || ''} schoolYear={schoolYear} />;
};

const Form137CreateWrapper: React.FC<{ schoolYear: string }> = ({ schoolYear }) => {
  return <Form137Manager studentId="" schoolYear={schoolYear} initialMode="create" />;
};

// Wrapper for ClassRecordView to extract URL params
const ClassRecordViewWrapper: React.FC<{ schoolYear: string; teacherId: string; schoolId: string }> = ({ 
  schoolYear, 
  teacherId, 
  schoolId 
}) => {
  const { sectionId, learningAreaId } = useParams<{ sectionId: string; learningAreaId: string }>();
  return (
    <ClassRecordView 
      sectionId={sectionId || ''} 
      learningAreaId={learningAreaId || ''} 
      schoolYear={schoolYear}
      teacherId={teacherId}
      schoolId={schoolId}
    />
  );
};

const App: React.FC = () => {
  const isDev = import.meta.env.MODE === 'development';
  const devLog = (...args: any[]) => isDev && console.log(...args);
  const devError = (...args: any[]) => isDev && console.error(...args);
  const devWarn = (...args: any[]) => isDev && console.warn(...args);
  
  // Check if we're on a public route FIRST (before any expensive operations)
  // NOTE: /admin is NOT in public routes - it's handled specially below
  // NOTE: / IS public for non-logged-in users (landing page), but becomes dashboard when logged in
  const publicRoutes = ['/', '/home', '/landing', '/teachers', '/privacy', '/terms', '/enrollment', '/enrollment/apply', '/enrollment/status', '/register/parent', '/tools', '/tools/form-generator', '/personal/signup'];
  const isPublicRoute = publicRoutes.some(route => 
    window.location.pathname === route || window.location.pathname.startsWith('/enrollment') || window.location.pathname.startsWith('/register') || window.location.pathname.startsWith('/tools') || window.location.pathname === '/personal/signup' || window.location.pathname === '/teachers'
  );
  // Special handling for /admin route
  const isAdminLoginRoute = window.location.pathname === '/admin';
  // Treat unknown routes as public so the 404 page renders instead of the login screen
  const isKnownPrivateRoute = window.location.pathname.startsWith('/personal') || window.location.pathname.startsWith('/division') || window.location.pathname.startsWith('/dashboard') || window.location.pathname === '/admin';
  const isUnknownRoute = !isPublicRoute && !isKnownPrivateRoute && !isAdminLoginRoute;
  
  // Initialize session from localStorage BEFORE checking if we should skip Firebase operations
  const [session, setSession] = useState<{ user: AuthUser | StudentUser | ParentUser | DivisionAuthUser, type: 'staff' | 'student' | 'parent' | 'division' } | null>(() => {
    try {
      const raw = localStorage.getItem('edusync_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.user && parsed.type) {
          devLog('[App] ðŸ”„ Restored session from localStorage:', parsed.user.email);
          return parsed;
        }
      }
    } catch (e) {
      devError('[App] âŒ Failed to restore session:', e);
    }
    return null;
  });
  
  // Determine if we should skip expensive Firebase operations
  // Skip ONLY if: (1) no session AND (2) on a public route
  // This allows logged-in users on / to load data, while anonymous users skip Firebase
  // NOTE: PostgreSQL mode still needs Firebase Auth for authentication!
  const shouldSkipFirebase = !session && (isPublicRoute || isUnknownRoute);

  // Sync subscription tier for personal workspace users on session restore
  useEffect(() => {
    if (!session) return;
    const u = session.user as any;
    if (u.workspaceType !== 'personal' || !u.firebaseUid) return;

    let cancelled = false;
    getUserSubscription(u.firebaseUid).then((sub) => {
      if (cancelled || !sub?.tier || sub.tier === u.tier) return;
      const updated = { ...session, user: { ...session.user, tier: sub.tier } };
      localStorage.setItem('edusync_session', JSON.stringify(updated));
      setSession(updated as any);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh personal workspace schoolId/teacherId from DB to handle stale session after migration
  const [personalWorkspaceReady, setPersonalWorkspaceReady] = useState(false);
  useEffect(() => {
    if (!session) { setPersonalWorkspaceReady(true); return; }
    const u = session.user as any;
    if (u.workspaceType !== 'personal' || !u.firebaseUid) { setPersonalWorkspaceReady(true); return; }

    let cancelled = false;
    getPersonalWorkspace(u.firebaseUid).then((ws) => {
      if (cancelled || !ws) { if (!cancelled) setPersonalWorkspaceReady(true); return; }
      // Only update if the schoolId or teacherId changed
      if (ws.schoolId !== u.schoolId || ws.teacherId !== (u.id || u.postgresqlId)) {
        const updated = {
          ...session,
          user: { ...session.user, schoolId: ws.schoolId, id: ws.teacherId, _freshSchoolId: ws.schoolId, _freshTeacherId: ws.teacherId }
        };
        localStorage.setItem('edusync_session', JSON.stringify(updated));
        if (!cancelled) setSession(updated as any);
      }
      if (!cancelled) setPersonalWorkspaceReady(true);
    }).catch(() => { if (!cancelled) setPersonalWorkspaceReady(true); });
    return () => { cancelled = true; };
  }, [session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // TIER 1B: Monitor online/offline status and pending writes (only for authenticated routes)
  const { isOnline, wasOffline } = useOnlineStatus();
  // CRITICAL: Always call useFirestoreSyncStatus (can't conditionally call hooks!)
  // Pass skip=true to disable monitoring for public routes without session OR when using PostgreSQL
  const usePostgreSQL = import.meta.env.VITE_USE_POSTGRESQL === 'true';
  const { pendingCount } = useFirestoreSyncStatus(shouldSkipFirebase || isAdminLoginRoute || usePostgreSQL);
  
  // Ensure we have a Firebase Auth user for Firestore writes (rules require request.auth != null)
  // SKIP for public routes without session, /admin login page, AND PostgreSQL mode
  const [authReady, setAuthReady] = useState(shouldSkipFirebase || isAdminLoginRoute);
  const [authError, setAuthError] = useState<string | null>(null);
  
  useEffect(() => {
    // Skip auth for public routes without session and login page - no Firebase needed
    if (shouldSkipFirebase || isAdminLoginRoute) {
      setAuthError(null); // Clear any previous auth errors on public/login routes
      setAuthReady(true);
      return;
    }
    
    let isCurrent = true; // Guard against stale closures from previous effect runs
    
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!isCurrent) return;
      if (!user) {
        // Personal workspace uses Supabase, not Firebase â€” skip anonymous auth entirely
        try {
          const raw = localStorage.getItem('edusync_session');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.user?.workspaceType === 'personal') {
              devLog('[Auth] Personal workspace session found, skipping Firebase auth');
              setAuthReady(true);
              return;
            }
          }
        } catch { /* ignore parse errors */ }

        // Trigger anonymous sign-in; wait for next auth state change before proceeding
        signInAnonymously(auth).catch((e) => {
          if (!isCurrent) return; // Effect was cleaned up (route changed), ignore stale rejection
          devError('[Auth] Anonymous sign-in failed:', e);
          // If offline, don't show error - just set ready to allow offline mode
          if (!navigator.onLine) {
            devLog('[Auth] âš ï¸ Offline mode - skipping anonymous auth');
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
      devLog('[Auth] âœ… Auth ready:', user.uid);
    });
    return () => {
      isCurrent = false;
      unsub();
    };
  }, [devLog, devError, shouldSkipFirebase, isAdminLoginRoute]);
  
  // Persist session changes
  useEffect(() => {
    // devLog('[App] ðŸ“¦ Session changed:', session ? `${session.user.email} (${session.type})` : 'null');
    if (session) {
      localStorage.setItem('edusync_session', JSON.stringify(session));
      // devLog('[App] ðŸ’¾ Session saved to localStorage');
    } else {
      localStorage.removeItem('edusync_session');
      devLog('[App] ðŸ—‘ï¸ Session removed from localStorage');
      // TIER 1B: Clear cached user credentials on logout
      localStorage.removeItem('edusync_cached_user');
      devLog('[App] ðŸ—‘ï¸ Cached user credentials cleared');
    }
  }, [session, devLog]);
  
  // Add timeout mechanism to prevent infinite loading
  // DISABLED: Now using PostgreSQL, Firestore timeout is no longer needed
  const [_loadTimeout] = useState(false);
  useEffect(() => {
    // PostgreSQL migration: Skip Firestore loading timeout
    // Data is now loaded via PostgreSQL hooks, not Firestore subscriptions
    return;
    
    /* LEGACY FIRESTORE CODE - DISABLED
    // Reset timeout when session changes
    setLoadTimeout(false);
    
    // Skip timeout for public routes, login page, or when not logged in
    if (!session || isPublicRoute || isAdminLoginRoute) {
      return; // No timeout needed for public pages or login screen
    }
    
    const timer = setTimeout(() => {
      devWarn('[App] â° Load timeout reached (30 seconds)');
      setLoadTimeout(true);
    }, 30000); // 30 second timeout for mobile compatibility
    
    return () => clearTimeout(timer);
    */
  }, [session, devWarn, isPublicRoute, isAdminLoginRoute]); // Re-run when session or route changes
  
  const [loginType, setLoginType] = useState<'staff' | 'student' | 'parent'>('staff');
  
  // ðŸš€ PERFORMANCE OPTIMIZATION: Route-based lazy loading
  // Only load collections needed for the current route
  // This reduces initial load time from 11s to 2-3s while maintaining offline-first
  // Firestore SDK caches everything, so once loaded, works offline forever
  
  // LEGACY: Route-based collection loading removed after PostgreSQL migration
  // Components now load their own data via PostgreSQL hooks
  
  // Load school settings from PostgreSQL
  const { settings: pgSettings, loading: settingsLoading } = useSchoolDataPostgreSQL({
    schoolId: (session?.user as any)?.schoolId || null,
    enableRealtime: true
  });
  
  // PRODUCTION: PostgreSQL migration complete - components load their own data
  // Create minimal schoolData to satisfy legacy components
  const schoolData = useMemo(() => ({
    settings: pgSettings || { 
      schoolName: 'Zamboanga City National High School',
      region: 'Region IX - Zamboanga Peninsula', 
      division: 'Division of Zamboanga City',
      district: 'Zamboanga City West District',
      schoolYear: '2024-2025'
    },
    loading: settingsLoading,
    error: null,
    students: [],
    teachers: [],
    parents: [],
    grades: [],
    coreValues: [],
    coreValueGrades: [],
    attendanceRecords: [],
    sections: [],
    learningAreas: [],
    substituteAssignments: [],
    classSchedules: [],
    assignments: [],
    studentAssignmentGrades: [],
    lessonPlans: [],
    announcements: [],
    monthlySchoolDaysConfig: {},
    refresh: async () => {},
    addStudent: async () => ({ id: '', lrn: '', firstName: '', lastName: '', middleName: '', gradeLevel: '', sectionId: '', schoolId: '', enrollmentDate: new Date(), status: 'active' as const }),
    updateStudent: async () => {},
    deleteStudent: async () => {},
    addTeacher: async () => ({ id: '', email: '', name: '', role: 'teacher' as const, schoolId: '' }),
    updateTeacher: async () => {},
    deleteTeacher: async () => {}
  }) as unknown as SchoolDataHook, [pgSettings, settingsLoading]);

  // Track selected child for parent sessions
  const [parentSelectedChildId, setParentSelectedChildId] = useState<string | null>(null);
  
  // Get PostgreSQL students and parents for parent child selection
  const parentSchoolId = session?.type === 'parent' ? (session.user as ParentUser).schoolId : undefined;
  const { students: pgStudentsForParent } = useStudentsPostgreSQL({ schoolId: parentSchoolId });
  const { parents: pgParentsForParent } = useParentsPostgreSQL({ schoolId: parentSchoolId });
  
  // Get fresh parent data from PostgreSQL (session data may be stale)
  const currentParentFresh = useMemo(() => {
    if (session?.type !== 'parent') return null;
    const sessionParent = session.user as ParentUser;
    return pgParentsForParent.find(p => p.id === sessionParent.id) || sessionParent;
  }, [session, pgParentsForParent]);
  
  // Auto-select first child for parent sessions (using PostgreSQL data)
  useEffect(() => {
    if (session?.type === 'parent' && currentParentFresh && pgStudentsForParent.length > 0) {
      const studentIds = currentParentFresh.studentIds || [];
      const children = pgStudentsForParent.filter(s => studentIds.includes(s.id));
      if (children.length > 0 && !parentSelectedChildId) {
        setParentSelectedChildId(children[0].id);
      } else if (children.length === 0) {
        setParentSelectedChildId(null);
      }
    } else if (session?.type !== 'parent') {
      setParentSelectedChildId(null);
    }
  }, [session, pgStudentsForParent, currentParentFresh, parentSelectedChildId]);

  const handleLogin = useCallback(async (user: AuthUser | StudentUser | ParentUser | DivisionAuthUser, type: 'staff' | 'student' | 'parent' | 'division') => {
    // Check if this is a division user
    const isDivisionUser = type === 'division' || ('division_id' in user && 'permissions' in user);
    
    devLog('[App] ðŸ” Login successful for:', user.email, 'Type:', type, isDivisionUser ? '(Division User)' : '', 'SchoolID:', (user as AuthUser).schoolId);
    
    // Check if user already has workspaceType set (from signup flow)
    if ((user as any).workspaceType === 'personal') {
      // Always fetch real subscription tier (schools.tier may be stale)
      let personalUser = user;
      if ((user as any).firebaseUid) {
        try {
          const sub = await getUserSubscription((user as any).firebaseUid);
          if (sub?.tier) {
            personalUser = { ...user, tier: sub.tier } as any;
          }
        } catch (err) {
          devLog('[App] Failed to fetch subscription tier for personal user');
        }
      }
      const sessionData = { user: personalUser, type: 'staff' as const };
      localStorage.setItem('edusync_session', JSON.stringify(sessionData));
      window.dispatchEvent(new Event('edusync-session-updated'));
      setSession(sessionData);
      window.history.pushState({}, '', '/personal');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }

    // Check if this staff user has a personal workspace in PostgreSQL
    if (type === 'staff' && !isDivisionUser && (user as any).firebaseUid) {
      try {
        const workspace = await getPersonalWorkspace((user as any).firebaseUid);
        if (workspace) {
          devLog('[App] ðŸ  Personal workspace found, redirecting to /personal');
          // Fetch real subscription tier (workspace.tier from schools table may be stale)
          let subscriptionTier = workspace.tier;
          try {
            const sub = await getUserSubscription((user as any).firebaseUid);
            if (sub?.tier) subscriptionTier = sub.tier;
          } catch { /* fall back to workspace tier */ }
          const personalUser = {
            ...user,
            id: workspace.teacherId,
            schoolId: workspace.schoolId,
            schoolName: workspace.schoolName,
            workspaceType: 'personal' as const,
            tier: subscriptionTier,
          };
          const sessionData = { user: personalUser, type: 'staff' as const };
          localStorage.setItem('edusync_session', JSON.stringify(sessionData));
          window.dispatchEvent(new Event('edusync-session-updated'));
          setSession(sessionData);
          window.history.pushState({}, '', '/personal');
          window.dispatchEvent(new PopStateEvent('popstate'));
          return;
        }
      } catch (err) {
        devLog('[App] Personal workspace check failed, proceeding with normal login');
      }
    }

    // CRITICAL: Save session to localStorage AND React state
    const sessionData = { user, type: (isDivisionUser ? 'division' : type) as 'staff' | 'student' | 'parent' | 'division' };
    localStorage.setItem('edusync_session', JSON.stringify(sessionData));
    devLog('[App] ðŸ’¾ Session saved to localStorage:', sessionData);
    
    // Notify SchoolContext that session was updated
    window.dispatchEvent(new Event('edusync-session-updated'));
    
    // Set React state FIRST (this triggers re-render with session)
    setSession(sessionData);
    devLog('[App] âœ… Session state updated');
    
    // Navigate based on user type
    if (window.location.pathname === '/admin') {
      if (isDivisionUser) {
        // Division users go to /division dashboard
        devLog('[App] ðŸ”„ Navigating from /admin to /division (Division User)');
        window.history.pushState({}, '', '/division');
      } else {
        // Regular users go to / dashboard
        devLog('[App] ðŸ”„ Navigating from /admin to dashboard');
        window.history.pushState({}, '', '/');
      }
      // Force a re-render by dispatching a popstate event
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [devLog]);
  
  const handleLogout = useCallback(async () => {
    try {
      // Sign out from Firebase Auth (required even in PostgreSQL mode)
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

  // devLog('[App] Loading check:', { authReady, loading, studentsCount: students.length, teachersCount: teachers.length, loadTimeout });
  
  // TIER 1 OPTIMIZATION: Simplified initialization logic
  // Show login screen as soon as auth is ready
  // Only wait for data loading AFTER user is logged in AND only on initial mount
  // Once we've loaded at least SOME data (1+ collection), allow navigation
  const hasAnyData = schoolData.students.length > 0 || schoolData.teachers.length > 0 || schoolData.learningAreas.length > 0 || 
                      schoolData.sections.length > 0 || (schoolData.settings?.schoolName !== '' && schoolData.settings !== null);
  const isInitializing = !authReady || (session && schoolData.loading && !_loadTimeout && !hasAnyData);
  
  if (isInitializing) {
    return <FullScreenLoader message="Loading school data..." />;
  }
  
  // NEW: Removed hasMinimalData check - allow app to render with empty data
  // Components will show appropriate empty states
  // This fixes offline-first-visit blank page issue
  if (false && _loadTimeout) { // Disabled timeout error screen
    return (
      <div className="flex items-center justify-center min-h-screen bg-orange-50 dark:bg-slate-900 text-orange-900 dark:text-orange-200">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">âš ï¸</div>
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
            ðŸ”„ Retry Connection
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
          <div className="text-6xl mb-4">ðŸ”’</div>
          <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
          <p className="mb-6">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            ðŸ”„ Retry
          </button>
        </div>
      </div>
    );
  }

  if (schoolData.error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-slate-900 text-red-800 dark:text-red-200">
        <div className="text-center p-8 max-w-2xl">
          <div className="text-6xl mb-4">âŒ</div>
          <h1 className="text-2xl font-bold mb-4">Failed to Load Application Data</h1>
          <p className="mb-4">There was a critical error fetching data from the server.</p>
          <details className="mb-6">
            <summary className="cursor-pointer text-sm font-semibold mb-2">Technical Details</summary>
            <pre className="bg-red-100 dark:bg-red-900/30 p-4 rounded-md text-left text-sm overflow-auto">{String(schoolData.error)}</pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            ðŸ”„ Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Render public routes without authentication (landing page + enrollment)
  // BUT skip if user is already logged in (session exists)
  if (!session && (isPublicRoute || isUnknownRoute)) {
    devLog('[App] ðŸŒ Public route - rendering without auth');
    return (
      <Router>
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
          <Suspense fallback={<FullScreenLoader message="Loading..." />}>
            <Routes>
              <Route path="/" element={<LandingPageV2 />} />
              <Route path="/home" element={<LandingPageV2 />} />
              <Route path="/landing" element={<LandingPageV2 />} />
              <Route path="/landing-v1" element={<LandingPage />} />
              <Route path="/teachers" element={<TeachersLandingPage />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/enrollment" element={<EnrollmentPortal />} />
              <Route path="/enrollment/apply" element={<ApplicationForm />} />
              <Route path="/enrollment/status" element={<ApplicationStatus />} />
              <Route path="/register/parent" element={<ParentRegistration />} />
              <Route path="/tools/form-generator" element={<FormGeneratorPage />} />
              <Route path="/tools" element={<Navigate to="/tools/form-generator" replace />} />
              <Route path="/personal/signup" element={<PersonalSignupScreen onLogin={handleLogin} />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    );
  }
  
  // Handle /admin login route specially (before checking session)
  // Show login screen if not logged in
  if (isAdminLoginRoute && !session) {
    devLog('[App] ðŸ”“ /admin route - rendering LoginScreen');
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
  if (!session && !isPublicRoute && !isAdminLoginRoute && !isUnknownRoute) {
    devLog('[App] ðŸ”“ No session - rendering LoginScreen (NO pre-loaded data)');
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
  if (schoolData.loading) {
    return <FullScreenLoader message="Loading your data..." />;
  }
  
  const staffSession = session as { user: AuthUser, type: 'staff' };
  const studentSession = session as { user: StudentUser, type: 'student' };
  const parentSession = session as { user: ParentUser, type: 'parent' };

  // Check if this is a division user - they get a completely different layout
  const isDivisionSession = (session as any).type === 'division';

  // Check if this is a personal workspace user
  const isPersonalSession = (session.user as any).workspaceType === 'personal';

  // Personal workspace users get their own simplified layout
  if (isPersonalSession && !isDivisionSession) {
    // Block rendering until workspace refresh is complete (prevents stale schoolId from cached session)
    if (!personalWorkspaceReady) {
      return <FullScreenLoader message="Refreshing workspace..." />;
    }
    const pUser = session.user as any;
    const pTier = pUser.tier || 'free';
    // Prefer workspace schoolId from fresh RPC over cached session
    // (handles stale localStorage after database migration)
    const pSchoolId = pUser._freshSchoolId || pUser.schoolId || '';
    // Use postgresqlId as fallback (some sessions store teacher UUID there)
    const pTeacherId = pUser._freshTeacherId || pUser.id || pUser.postgresqlId || pUser.teacherId || '';
    const pMaxStudents = pTier === 'free' ? 50 : 99999;

    return (
      <Router key={session?.user.id || 'personal'}>
        <Suspense fallback={<FullScreenLoader message="Loading workspace..." />}>
          <Routes>
            <Route path="/personal" element={
              <PersonalLayout
                userName={pUser.name || pUser.email}
                tier={pTier}
                onLogout={handleLogout}
              />
            }>
              <Route index element={
                <PersonalDashboard
                  userName={pUser.name || pUser.email}
                  tier={pTier}
                  studentCount={0}
                  maxStudents={pMaxStudents}
                  schoolId={pSchoolId}
                  teacherId={pTeacherId}
                />
              } />
              <Route path="sections" element={
                <PersonalSections
                  schoolId={pSchoolId}
                  teacherId={pTeacherId}
                  tier={pTier}
                />
              } />
              <Route path="students" element={
                <PersonalStudentListWrapper
                  schoolId={pSchoolId}
                  teacherId={pTeacherId}
                  tier={pTier}
                  userName={pUser.name || pUser.email}
                />
              } />
              <Route path="grades" element={
                <PersonalClassRecordSelector
                  schoolId={pSchoolId}
                  teacherId={pTeacherId}
                  tier={pTier}
                />
              } />
              <Route path="grades/quick" element={
                <PersonalGradebook
                  schoolId={pSchoolId}
                  tier={pTier}
                />
              } />
              <Route path="class-record/:sectionId/:learningAreaId" element={
                <PersonalClassRecordView
                  schoolId={pSchoolId}
                  teacherId={pTeacherId}
                  tier={pTier}
                />
              } />
              <Route path="forms" element={
                <PersonalForms
                  schoolId={pSchoolId}
                  teacherId={pTeacherId}
                  tier={pTier}
                />
              } />
              <Route path="settings" element={
                <PersonalSettings
                  userName={pUser.name || pUser.email}
                  email={pUser.email}
                  schoolName={pUser.schoolName || 'My School'}
                  tier={pTier}
                  schoolId={pSchoolId}
                  userId={pUser.firebaseUid || pUser.id || ''}
                />
              } />
              <Route path="analytics" element={
                <PersonalAnalytics
                  schoolId={pSchoolId}
                  tier={pTier}
                />
              } />
              <Route path="attendance" element={
                <PersonalAttendance
                  schoolId={pSchoolId}
                  teacherId={pTeacherId}
                  tier={pTier}
                />
              } />
              <Route path="core-values" element={
                <PersonalCoreValues
                  schoolId={pSchoolId}
                  teacherId={pTeacherId}
                  tier={pTier}
                />
              } />
              <Route path="homeroom-guidance" element={
                <PersonalHomeroomGuidance
                  schoolId={pSchoolId}
                  teacherId={pTeacherId}
                  tier={pTier}
                />
              } />
            </Route>
            {/* Redirect all other routes to personal dashboard */}
            <Route path="*" element={<Navigate to="/personal" replace />} />
          </Routes>
        </Suspense>
      </Router>
    );
  }

  // Division users get their own separate layout
  if (isDivisionSession) {
    return (
      <Router key={session?.user.id || 'no-session'}>
        <DivisionContextProvider>
          {/* PWA Update Notification */}
          <UpdateNotification />
          
          {/* Offline status indicator */}
          <OfflineBanner 
            isOnline={isOnline} 
            wasOffline={wasOffline}
            pendingWrites={pendingCount}
          />
          
          <Suspense fallback={<FullScreenLoader message="Loading division portal..." />}>
            <Routes>
              <Route path="/division" element={
                <DivisionGuard>
                  <DivisionLayout onLogout={handleLogout} />
                </DivisionGuard>
              }>
                <Route index element={<DivisionDashboard />} />
                <Route path="schools" element={<DivisionSchools />} />
                <Route path="personnel" element={<DivisionPersonnel />} />
                <Route path="enrollment" element={<DivisionEnrollment />} />
                <Route path="reports" element={<DivisionReports />} />
                <Route path="reports/sf5" element={<DivisionSF5Dashboard />} />
                <Route path="reports/sf6" element={<DivisionSF6Dashboard />} />
                <Route path="reports/sf7" element={<DivisionSF7Dashboard />} />
                <Route path="reports/proficiency" element={<DivisionProficiencyDashboard />} />
                <Route path="sf1-import" element={<DivisionSF1Import />} />
                <Route path="sf5-import" element={<DivisionSF5Import />} />
                <Route path="sf7-import" element={<DivisionSF7Import />} />
                <Route path="users" element={<DivisionUserManagement />} />
                <Route path="audit-log" element={<DivisionAuditLog />} />
                <Route path="settings" element={<DivisionSettings />} />
              </Route>
              {/* Division Onboarding - Standalone route without layout */}
              <Route path="/division/onboarding" element={
                <DivisionGuard>
                  <DivisionOnboarding />
                </DivisionGuard>
              } />
              {/* Redirect all other routes to division dashboard */}
              <Route path="*" element={<Navigate to="/division" replace />} />
            </Routes>
          </Suspense>
        </DivisionContextProvider>
      </Router>
    );
  }

  return (
    <Router key={session?.user.id || 'no-session'}>
      <DivisionContextProvider>
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
          session={session as any} 
          announcements={schoolData.announcements}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            session={session as any}
            onLogout={handleLogout}
            students={schoolData.students}
            parentSelectedChildId={parentSelectedChildId}
            onParentChildChange={(id) => setParentSelectedChildId(id)}
          />
          <Breadcrumb />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 px-6 pb-6">
            <Suspense fallback={<FullScreenLoader message="Loading page..." />}>
              <Routes>
                {/* Redirect root to dashboard when logged in */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                {/* Redirect logged-in users from /admin to dashboard */}
                <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
                
                {session.type === 'staff' && (
                    <>
                        <Route path="/dashboard" element={<Dashboard schoolData={schoolData} session={staffSession} />} />
                        <Route path="/students" element={<StudentList schoolData={schoolData} session={staffSession} />} />
                        <Route path="/teachers" element={
                          import.meta.env.VITE_USE_POSTGRESQL === 'true'
                            ? <TeachersViewPostgreSQL 
                                schoolId={(session.user as any).schoolId || ''} 
                                learningAreas={schoolData.learningAreas || []} 
                                authUserId={session.user.id}
                                authUserRole={(session.user as AuthUser).role || 'admin'}
                              />
                            : <TeacherList schoolData={schoolData} session={staffSession} />
                        } />
                        <Route path="/parents" element={
                          import.meta.env.VITE_USE_POSTGRESQL === 'true' 
                            ? <ParentsViewPostgreSQL schoolId={(session.user as any).schoolId || ''} />
                            : <ParentsView schoolData={schoolData} session={staffSession} />
                        } />
                        <Route path="/sections" element={<SectionsView session={staffSession} />} />
                        {/* ========== GRADE ENTRY ========== */}
                        <Route path="/grades" element={<GradesDashboard session={staffSession} schoolData={schoolData} />} />
                        <Route path="/grades/overview" element={<GradesSummary session={staffSession} />} />
                        <Route path="/grades/academic" element={<GradebookView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/grades/class-record-selector" element={
                          <ClassRecordSelector 
                            session={staffSession}
                            schoolYear={schoolData.settings.schoolYear}
                          />
                        } />
                        <Route path="/grades/class-record/:sectionId/:learningAreaId" element={
                          <ClassRecordViewWrapper 
                            schoolYear={schoolData.settings.schoolYear}
                            teacherId={(session.user as AuthUser).id || (session.user as any).postgresqlId || ''}
                            schoolId={(session.user as any).schoolId || ''}
                          />
                        } />
                        <Route path="/grades/core-values" element={<CoreValuesGradebookView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/grades/homeroom-guidance" element={<HomeroomGuidanceView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/grades/analytics" element={<UnifiedAssessmentView schoolData={schoolData} session={staffSession} defaultTab="deep-analytics" hideTabNavigation={true} />} />
                        
                        {/* ========== REPORTS & FORMS (NEW STRUCTURE) ========== */}
                        {/* Form 137 - Permanent Record */}
                        <Route path="/reports/form137" element={<Form137Dashboard />} />
                        <Route path="/reports/form137/:studentId" element={<Form137ManagerWrapper schoolYear={schoolData.settings.schoolYear} />} />
                        <Route path="/reports/form137/new" element={<Form137CreateWrapper schoolYear={schoolData.settings.schoolYear} />} />
                        
                        {/* Form 138 - Report Card */}
                        <Route path="/reports/form138" element={<Form138Dashboard session={staffSession} />} />
                        <Route path="/reports/form138/view/:studentId" element={<Form138View />} />
                        <Route path="/reports/form138/print" element={<Form138Print />} />
                        
                        {/* School Forms (SF1, SF2, SF9) */}
                        <Route path="/reports/school-forms" element={<SchoolFormsDashboard session={staffSession} />} />
                        <Route path="/reports/school-forms/sf1" element={<SF1Dashboard session={staffSession} onBack={() => window.history.back()} />} />
                        <Route path="/reports/school-forms/sf2" element={<SF2Dashboard session={staffSession} onBack={() => window.history.back()} />} />
                        <Route path="/reports/school-forms/sf9" element={<SF9Dashboard session={staffSession} onBack={() => window.history.back()} />} />
                        <Route path="/reports/school-forms/sf9/view/:studentId" element={<SF9View />} />
                        <Route path="/reports/school-forms/sf9/print" element={<SF9Print />} />
                        <Route path="/reports/school-forms/sf8" element={<SF8Dashboard session={staffSession} onBack={() => window.history.back()} />} />
                        <Route path="/reports/school-forms/sf5a-shs" element={<SF5ASHSDashboard session={staffSession} onBack={() => window.history.back()} />} />
                        <Route path="/reports/school-forms/sf5b-shs" element={<SF5BSHSDashboard session={staffSession} onBack={() => window.history.back()} />} />
                        <Route path="/reports/school-forms/sf1-shs" element={<SF1SHSDashboard session={staffSession} onBack={() => window.history.back()} />} />
                        <Route path="/reports/school-forms/sf2-shs" element={<SF2SHSDashboard session={staffSession} onBack={() => window.history.back()} />} />
                        <Route path="/reports/school-forms/sf9-shs" element={<SF9SHSDashboard session={staffSession} onBack={() => window.history.back()} />} />
                        <Route path="/reports/school-forms/sf10" element={<SF10Dashboard />} />
                        
                        {/* ELLN Assessment */}
                        <Route path="/reports/elln" element={<ELLNDashboard />} />
                        <Route path="/reports/elln/assessment" element={<ELLNAssessment session={staffSession} />} />
                        <Route path="/reports/elln/results" element={<ELLNResults session={staffSession} />} />
                        <Route path="/reports/elln/reports" element={<ELLNReports />} />
                        <Route path="/reports/elln/ilmp" element={<ILMPTemplate />} />
                        
                        {/* SF4, SF5 & SF5-K - Movement & Promotion Reports */}
                        <Route path="/reports/sf3" element={<SF3Dashboard />} />
                        <Route path="/reports/sf4" element={<SF4Dashboard schoolYear={schoolData.settings.schoolYear} session={staffSession} />} />
                        <Route path="/reports/sf5" element={<SF5Dashboard schoolYear={schoolData.settings.schoolYear} gradingPeriod="final" />} />
                        <Route path="/reports/sf5k" element={<SF5KDashboard schoolYear={schoolData.settings.schoolYear} gradingPeriod="final" />} />
                        <Route path="/reports/sf6" element={<SF6Dashboard />} />
                        <Route path="/reports/sf7" element={<SF7Dashboard />} />
                        <Route path="/management/textbook-ledger" element={<TextbookManagementDashboard />} />
                        <Route path="/management/facilities-inventory" element={<FacilitiesManagementDashboard />} />
                        
                        {/* ========== BACKWARD COMPATIBILITY REDIRECTS ========== */}
                        {/* Old /forms/* paths â†’ /reports/* */}
                        <Route path="/forms" element={<Navigate to="/reports/form137" replace />} />
                        <Route path="/forms/137" element={<Navigate to="/reports/form137" replace />} />
                        <Route path="/forms/137/:studentId" element={<Navigate to="/reports/form137/:studentId" replace />} />
                        <Route path="/forms/138" element={<Navigate to="/reports/form138" replace />} />
                        <Route path="/forms/elln" element={<Navigate to="/reports/elln" replace />} />
                        <Route path="/forms/elln/assessment" element={<Navigate to="/reports/elln/assessment" replace />} />
                        <Route path="/forms/elln/results" element={<Navigate to="/reports/elln/results" replace />} />
                        <Route path="/forms/elln/reports" element={<Navigate to="/reports/elln/reports" replace />} />
                        <Route path="/forms/elln/ilmp" element={<Navigate to="/reports/elln/ilmp" replace />} />
                        
                        {/* Old /grades/form* paths â†’ /reports/* */}
                        <Route path="/grades/entry" element={<Navigate to="/grades" replace />} />
                        <Route path="/grades/form137" element={<Navigate to="/reports/form137" replace />} />
                        <Route path="/grades/form137/:studentId" element={<Navigate to="/reports/form137/:studentId" replace />} />
                        <Route path="/grades/form137/new" element={<Navigate to="/reports/form137/new" replace />} />
                        <Route path="/grades/form138" element={<Navigate to="/reports/form138" replace />} />
                        <Route path="/grades/form138/view/:studentId" element={<Navigate to="/reports/form138/view/:studentId" replace />} />
                        <Route path="/grades/form138/print" element={<Navigate to="/reports/form138/print" replace />} />
                        <Route path="/grades/schoolforms" element={<Navigate to="/reports/school-forms" replace />} />
                        <Route path="/grades/schoolforms/sf1" element={<Navigate to="/reports/school-forms/sf1" replace />} />
                        <Route path="/grades/schoolforms/sf2" element={<Navigate to="/reports/school-forms/sf2" replace />} />
                        <Route path="/grades/schoolforms/sf9" element={<Navigate to="/reports/school-forms/sf9" replace />} />
                        
                        {/* Other legacy grade paths */}
                        <Route path="/gradebook" element={<Navigate to="/grades/academic" replace />} />
                        <Route path="/gradebook-pg-test" element={<GradebookViewPostgreSQL schoolData={schoolData} session={staffSession} />} />
                        <Route path="/core-values" element={<Navigate to="/grades/core-values" replace />} />
                        <Route path="/core-values-gradebook" element={<Navigate to="/grades/core-values" replace />} />
                        <Route path="/attendance" element={<AttendanceView session={staffSession} />} />
                        <Route path="/schedule" element={<SchedulerView schoolData={schoolData} session={staffSession} />} />
                        <Route path="/substitute" element={<SubstituteView />} />
                        <Route path="/assignments" element={<AssignmentsView session={staffSession} />} />
                        <Route path="/lesson-plan" element={<LessonPlanView session={staffSession} />} />
                        <Route path="/announcements" element={<AnnouncementsView session={staffSession} />} />
                        <Route path="/learning-areas" element={<CourseList session={staffSession} />} />
                        
                        {/* School Settings - PostgreSQL */}
                        <Route path="/settings" element={<SchoolSettingsPostgreSQL />} />
                        
                        {/* Old Firestore Settings (deprecated - for reference only) */}
                        <Route path="/settings-legacy" element={<SettingsView schoolData={schoolData} />} />
                        
                        {/* Super Admin Routes - New modular SuperAdmin dashboard */}
                        <Route path="/school-management" element={
                          staffSession.user.role === 'superadmin' 
                            ? <SuperAdminLayout /> 
                            : <Navigate to="/" replace />
                        } />
                        
                        {/* Financial Management Routes */}
                        {(staffSession.user.role === 'admin' || staffSession.user.role === 'registrar') && (
                          <>
                            <Route path="/fee-structures" element={<FeeStructureManager schoolData={schoolData} />} />
                            <Route path="/record-payment" element={<PaymentRecording schoolData={schoolData} session={staffSession} />} />
                            <Route path="/receipts" element={<ReceiptManagement schoolData={schoolData} session={staffSession} />} />
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
                        
                        {/* User Management Routes - Admin and SuperAdmin only */}
                        {(staffSession.user.role === 'admin' || staffSession.user.role === 'superadmin') && (
                          <Route path="/admin/users" element={<UserManagementPanel />} />
                        )}
                        
                        {/* HIDDEN: Teacher Validation (Outdated) */}
                        {/* {staffSession.user.role === 'teacher' && (
                          <Route path="/teacher-validation" element={<TeacherValidationWizard session={staffSession} />} />
                        )} */}
                        {staffSession.user.role === 'admin' && (
                          <Route path="/validation-results" element={<ValidationResultsDashboard />} />
                        )}
                    </>
                )}
        {session.type === 'student' && (
          <>
            <Route path="/dashboard" element={<StudentDashboard schoolData={schoolData} session={studentSession} />} />
            <Route path="/announcements" element={<AnnouncementsView session={studentSession} />} />
            <Route path="/assignments" element={<AssignmentsView session={studentSession} />} />
            <Route path="/grades" element={<GradesDashboard schoolData={schoolData} session={studentSession} />} />
            <Route path="/grades/overview" element={<GradesView schoolData={schoolData} session={studentSession} />} />
            <Route path="/grades/academic" element={<GradebookView schoolData={schoolData} session={studentSession} />} />
            <Route path="/grades/core-values" element={<CoreValuesGradebookView schoolData={schoolData} session={studentSession} />} />
            <Route path="/grades/homeroom-guidance" element={<HomeroomGuidanceView schoolData={schoolData} session={studentSession} />} />
            <Route path="/core-values" element={<Navigate to="/grades/core-values" replace />} />
            <Route path="/attendance" element={<AttendanceView session={studentSession} />} />
            <Route path="/schedule" element={<SchedulerView schoolData={schoolData} session={studentSession} />} />
          </>
        )}
        {session.type === 'parent' && (
           <>
            <Route path="/dashboard" element={<ParentDashboard schoolData={schoolData} session={parentSession} />} />
            <Route path="/profile" element={<ParentProfile schoolData={schoolData} session={parentSession} onSessionUpdate={(updatedUser) => setSession({ user: updatedUser, type: 'parent' })} />} />
            <Route path="/billing" element={<ParentBilling schoolData={schoolData} session={parentSession} selectedChildId={parentSelectedChildId} />} />
            {/* <Route path="/verify-email" element={<EmailVerification />} /> */}
            {/* <Route path="/email-verification" element={<EmailVerification />} /> */}
            <Route path="/announcements" element={<AnnouncementsView session={parentSession} />} />
            <Route path="/assignments" element={<AssignmentsView session={parentSession} forceStudentId={parentSelectedChildId ?? undefined} />} />
            <Route path="/grades" element={<GradesDashboard schoolData={schoolData} session={parentSession} />} />
            <Route path="/grades/overview" element={<GradesView schoolData={schoolData} session={parentSession} forceStudentId={parentSelectedChildId ?? undefined} />} />
            <Route path="/core-values" element={<Navigate to="/grades/overview" replace />} />
            <Route path="/attendance" element={<AttendanceView session={parentSession} forceStudentId={parentSelectedChildId ?? undefined} />} />
            <Route path="/schedule" element={<SchedulerView schoolData={schoolData} session={parentSession} forceStudentId={parentSelectedChildId ?? undefined} />} />
          </>
        )}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            </Suspense>
          </main>
        </div>
      </div>
      </DivisionContextProvider>
    </Router>
  );
};

export default App;
