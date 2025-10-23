import DepEdLogo from './DepEdLogo';
import React, { useState } from 'react';
import type { AuthUser, StudentUser, ParentUser } from '../types';
import { getFirestoreInstance } from '../src/services/firestoreService';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
  // Debug flags (could later be wired to env)
  const allowAnyPassword = true; // DEBUG ONLY
  const enableQuickLogin = true; // DEBUG ONLY

  console.log(`[LoginScreen] 🖥️ RENDERING LoginScreen component - type: "${loginType}"`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('[LoginScreen] 🔍 Looking up user:', email, 'in', loginType, 'collection');
      
      // Determine which collection to query
      const collectionName = loginType === 'staff' ? 'teachers' : 
                            loginType === 'student' ? 'students' : 'parents';
      
      // Query Firestore for user
      const db = getFirestoreInstance();
      const usersCol = collection(db, collectionName);
      const q = query(usersCol, where('email', '==', email.toLowerCase()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setError(`No ${loginType} account found with that email`);
        setIsLoading(false);
        return;
      }
      
      const userDoc = snapshot.docs[0];
      const userData = { id: userDoc.id, ...userDoc.data() } as AuthUser | StudentUser | ParentUser;
      
      // ✅ TIER 1B: Cache user for offline login
      console.log('[LoginScreen] 💾 Caching user credentials for offline use');
      localStorage.setItem('edusync_cached_user', JSON.stringify({
        email: email.toLowerCase(),
        type: loginType,
        userData: userData,
        cachedAt: Date.now()
      }));
      
      // Note: In production, use proper Firebase Auth with password verification
      // For now, in debug mode we accept any password
      console.log('[LoginScreen] ✅ User found, logging in');
      onLogin(userData, loginType);
    } catch (err) {
      console.error('[LoginScreen] ❌ Login error:', err);
      
      // ✅ TIER 1B: Offline fallback with first-login detection
      if (!navigator.onLine) {
        console.log('[LoginScreen] 🔴 Offline detected, checking for cached credentials...');
        
        const cachedStr = localStorage.getItem('edusync_cached_user');
        
        if (cachedStr) {
          try {
            const cached = JSON.parse(cachedStr);
            const CACHE_EXPIRY_DAYS = 7;
            const cacheAge = Date.now() - cached.cachedAt;
            const cacheExpired = cacheAge > (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
            
            if (cacheExpired) {
              console.log('[LoginScreen] ⚠️ Cached credentials expired');
              setError('Cached credentials expired. Please connect to internet to login.');
              setIsLoading(false);
              return;
            }
            
            // Check if cached user matches current login attempt
            if (cached.email === email.toLowerCase() && cached.type === loginType) {
              console.log('[LoginScreen] ✅ Using cached credentials (offline mode)');
              onLogin(cached.userData, loginType);
              setIsLoading(false);
              return;
            } else {
              console.log('[LoginScreen] ⚠️ Cached user mismatch');
              setError(
                `No cached credentials for ${email} as ${loginType}. ` +
                `Last login was ${cached.email} as ${cached.type}.`
              );
              setIsLoading(false);
              return;
            }
          } catch (parseErr) {
            console.error('[LoginScreen] ❌ Error parsing cached user:', parseErr);
          }
        }
        
        // No cache exists - first-time user offline
        console.log('[LoginScreen] ⚠️ First-time login attempt while offline');
        setError(
          '⚠️ First login requires internet connection. ' +
          'Please connect to WiFi to set up your account. ' +
          'After first login, you can work offline anytime.'
        );
      } else {
        // Online but other error
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
            <div className="flex flex-col items-center justify-center mb-4 text-slate-800 dark:text-white">
                {/* Use bundled DepEd logo to avoid network/CORS issues */}
                <DepEdLogo className="w-48 h-48 mb-3" />
                <h1 className="text-3xl font-bold">EduSync</h1>
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
         <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            <p className="font-semibold">Demo Credentials:</p>
            <p>Email: (any staff email) / Pass: password{allowAnyPassword ? ' (any password accepted in debug)' : ''}</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
