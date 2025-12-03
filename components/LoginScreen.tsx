import DepEdLogo from './DepEdLogo';
import EdusyncLogo from './EdusyncLogo';
import React, { useState } from 'react';
import type { AuthUser, StudentUser, ParentUser } from '../types';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { supabase } from '../src/lib/supabase';

interface LoginScreenProps {
  onLogin: (user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent') => void;
  loginType: 'staff' | 'student' | 'parent';
  setLoginType: (type: 'staff' | 'student' | 'parent') => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, loginType, setLoginType }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 🔒 SECURITY: Environment-based feature flags
  // - Development: All debug features enabled
  // - UAT/Staging: Quick login enabled, password optional
  // - Production: All debug features DISABLED
  const isDevelopment = import.meta.env.MODE === 'development';
  const isProduction = import.meta.env.MODE === 'production';
  
  // Allow any password (for demo/UAT, disable in production)
  const allowAnyPassword = !isProduction;
  
  // Show quick login button (dev only, hide in UAT and production)
  const enableQuickLogin = isDevelopment;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LoginScreen] 🔵 Login attempt started:', { email, loginType });
    setError('');
    setIsLoading(true);

    try {
      console.log('[LoginScreen] Step 1: Authenticating with Firebase Auth...');
      // Step 1: Authenticate with Firebase Auth
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
      const firebaseUser = userCredential.user;
      console.log('[LoginScreen] ✅ Firebase Auth successful, UID:', firebaseUser.uid);
      
      console.log('[LoginScreen] Step 2: Fetching user data from PostgreSQL...');
      // Step 2: Fetch from PostgreSQL based on firebase_uid
      let userData: AuthUser | StudentUser | ParentUser | null = null;
      let userRole: string | null = null;

      // Try teachers table
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('firebase_uid', firebaseUser.uid)
        .single();

      if (teacher && !teacherError) {
        console.log('[LoginScreen] ✅ Found teacher:', teacher.email);
        userData = {
          id: teacher.id,
          postgresqlId: teacher.id,
          firebaseUid: teacher.firebase_uid,
          email: teacher.email,
          name: teacher.name,
          role: teacher.role || 'teacher',
          schoolId: teacher.school_id,
          contactNumber: teacher.contact_number
        } as AuthUser;
        userRole = teacher.role || 'teacher';
      }

      // Try students table if not teacher
      if (!userData) {
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('firebase_uid', firebaseUser.uid)
          .single();

        if (student && !studentError) {
          console.log('[LoginScreen] ✅ Found student:', student.email);
          userData = {
            id: student.id,
            postgresqlId: student.id,
            firebaseUid: student.firebase_uid,
            email: student.email,
            firstName: student.first_name,
            lastName: student.last_name,
            name: `${student.first_name} ${student.last_name}`.trim(),
            role: 'student',
            schoolId: student.school_id,
            gradeLevel: student.grade_level,
            sectionId: student.section_id
          } as StudentUser;
          userRole = 'student';
        }
      }

      // Try parents table if not teacher or student
      if (!userData) {
        const { data: parent, error: parentError } = await supabase
          .from('parents')
          .select('*')
          .eq('firebase_uid', firebaseUser.uid)
          .single();

        if (parent && !parentError) {
          console.log('[LoginScreen] ✅ Found parent:', parent.email);
          userData = {
            id: parent.id,
            postgresqlId: parent.id,
            firebaseUid: parent.firebase_uid,
            email: parent.email,
            name: parent.name,
            role: 'parent',
            schoolId: parent.school_id,
            contactNumber: parent.contact_number,
            children: parent.children || []
          } as ParentUser;
          userRole = 'parent';
        }
      }

      if (!userData || !userRole) {
        console.error('[LoginScreen] No user found in PostgreSQL for UID:', firebaseUser.uid);
        setError(`No ${loginType} account found. Please contact your administrator.`);
        setIsLoading(false);
        return;
      }
      
      // Verify the role matches the login type
      const expectedRole = loginType === 'staff' ? ['admin', 'principal', 'registrar', 'teacher', 'superadmin'] : [loginType];
      if (!expectedRole.includes(userRole)) {
        console.error('[LoginScreen] Role mismatch. Expected:', expectedRole, 'Got:', userRole);
        
        // User-friendly error message
        const roleToTabMap: { [key: string]: string } = {
          'admin': 'Staff',
          'principal': 'Staff',
          'registrar': 'Staff',
          'teacher': 'Staff',
          'superadmin': 'Staff',
          'student': 'Student',
          'parent': 'Parent'
        };
        const correctTab = roleToTabMap[userRole] || userRole;
        setError(`Please use the ${correctTab} login tab.`);
        setIsLoading(false);
        return;
      }
      
      console.log('[LoginScreen] ✅ Login successful with PostgreSQL data');
      
      // Cache user for offline login
      localStorage.setItem('edusync_cached_user', JSON.stringify({
        email: email.toLowerCase(),
        type: loginType,
        userData: userData,
        cachedAt: Date.now()
      }));
      
      console.log('[LoginScreen] ✅ Calling onLogin callback');
      onLogin(userData, loginType);
    } catch (err) {
      console.error('[LoginScreen] ❌ Login error:', err);
      console.error('[LoginScreen] Error details:', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
      
      // Offline fallback with first-login detection
      if (!navigator.onLine) {
        const cachedStr = localStorage.getItem('edusync_cached_user');
        
        if (cachedStr) {
          try {
            const cached = JSON.parse(cachedStr);
            const CACHE_EXPIRY_DAYS = 7;
            const cacheAge = Date.now() - cached.cachedAt;
            const cacheExpired = cacheAge > (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
            
            if (cacheExpired) {
              setError('Cached credentials expired. Please connect to internet to login.');
              setIsLoading(false);
              return;
            }
            
            if (cached.email === email.toLowerCase() && cached.type === loginType) {
              onLogin(cached.userData, loginType);
              setIsLoading(false);
              return;
            } else {
              setError(
                `No cached credentials for ${email} as ${loginType}. ` +
                `Last login was ${cached.email} as ${cached.type}.`
              );
              setIsLoading(false);
              return;
            }
          } catch (parseErr) {
            if (isDevelopment) {
              console.error('[LoginScreen] Error parsing cached user:', parseErr);
            }
          }
        }
        
        setError(
          '⚠️ First login requires internet connection. ' +
          'Please connect to WiFi to set up your account. ' +
          'After first login, you can work offline anytime.'
        );
      } else {
        setError('Unable to login. Please check your credentials and try again.');
      }
      
      setIsLoading(false);
    }
  };

  // Quick login for demo purposes
  const handleQuickLogin = async () => {
    setEmail('admin@school.edu');
    setPassword('password');
    // Wait for state update then submit
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
      }
    }, 100);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
        <div className="text-center">
            <div className="flex flex-col items-center justify-center mb-4">
                {/* EduSync logo with landing page styling */}
                <EdusyncLogo size="xl" showText={true} className="mb-2" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">School Information System Portal</p>
        </div>

        <div>
            <div className="flex border-b border-slate-200 dark:border-slate-600">
                <button 
                    onClick={() => setLoginType('staff')}
                    className={`flex-1 py-2 text-sm font-semibold text-center transition-colors ${loginType === 'staff' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    Staff
                </button>
                <button 
                    onClick={() => setLoginType('student')}
                    className={`flex-1 py-2 text-sm font-semibold text-center transition-colors ${loginType === 'student' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    Student
                </button>
                 <button 
                    onClick={() => setLoginType('parent')}
                    className={`flex-1 py-2 text-sm font-semibold text-center transition-colors ${loginType === 'parent' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    Parent
                </button>
            </div>
        </div>
        
        {loginType === 'staff' && (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
                <input
                    id="email" name="email" type="email" autoComplete="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white"
                />
            </div>
            <div>
                <label htmlFor="password"  className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <input
                    id="password" name="password" type="password" autoComplete="current-password" required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white"
                />
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            
            <div className="space-y-2">
                <button
                    type="submit" 
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
                {enableQuickLogin && (
                  <button
                    type="button"
                    onClick={handleQuickLogin}
                    className="w-full flex justify-center py-1.5 px-4 border border-slate-300 dark:border-slate-600 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600"
                  >Quick Login as Admin (debug)</button>
                )}
            </div>
          </form>
        )}

        {loginType === 'student' && (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
                <input
                    id="email" name="email" type="email" autoComplete="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white"
                />
            </div>
            <div>
                <label htmlFor="password"  className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <input
                    id="password" name="password" type="password" autoComplete="current-password" required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white"
                />
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            
            <div className="space-y-2">
                <button
                    type="submit" 
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
                {enableQuickLogin && (
                  <button
                    type="button"
                    onClick={handleQuickLogin}
                    className="w-full flex justify-center py-1.5 px-4 border border-slate-300 dark:border-slate-600 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600"
                  >Quick Login as Admin (debug)</button>
                )}
            </div>
          </form>
        )}

        {loginType === 'parent' && (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
                <input
                    id="email" name="email" type="email" autoComplete="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white"
                />
            </div>
            <div>
                <label htmlFor="password"  className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <input
                    id="password" name="password" type="password" autoComplete="current-password" required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white"
                />
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            
            <div className="space-y-2">
                <button
                    type="submit" 
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
                {enableQuickLogin && (
                  <button
                    type="button"
                    onClick={handleQuickLogin}
                    className="w-full flex justify-center py-1.5 px-4 border border-slate-300 dark:border-slate-600 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600"
                  >Quick Login as Admin (debug)</button>
                )}
            </div>
          </form>
        )}
        
        {/* Parent Registration Link */}
        {loginType === 'parent' && (
          <div className="text-center mt-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <a 
                href="/register/parent" 
                className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Register here
              </a>
            </p>
          </div>
        )}
        {!isProduction && (
          <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            <p className="font-semibold">Demo Credentials:</p>
            <p>Email: admin@school.edu / Pass: {allowAnyPassword ? 'any password accepted' : 'password'}</p>
            <p className="text-[10px] mt-1 text-amber-600 dark:text-amber-400">
              ⚠️ {isDevelopment ? 'Development' : 'UAT'} Mode - Debug features enabled
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
