import DepEdLogo from './DepEdLogo';
import React, { useState } from 'react';
import type { AuthUser, StudentUser, ParentUser } from '../types';

interface LoginScreenProps {
  onLogin: (user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent') => void;
  users: (AuthUser | StudentUser | ParentUser)[];
  loginType: 'staff' | 'student' | 'parent';
  setLoginType: (type: 'staff' | 'student' | 'parent') => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, users, loginType, setLoginType }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Debug flags (could later be wired to env)
  const allowAnyPassword = true; // DEBUG ONLY
  const enableQuickLogin = true; // DEBUG ONLY

  console.log(`[LoginScreen] 🖥️ RENDERING LoginScreen component - users: ${users.length}, type: "${loginType}"`);
  if (users.length && (window as any).__dumpedUsers !== true) {
    console.log('[AuthDebug] First 10 user emails:', users.slice(0,10).map(u => u.email));
    (window as any).__dumpedUsers = true;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log(`[LoginScreen] 🔐 Attempting login with type: "${loginType}", email: "${email}"`);
    console.log(`[LoginScreen] 📋 Available users count: ${users.length}`);

    // This is a simplified, mock authentication.
    const user = users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());

    console.log(`[LoginScreen] 🔍 User found: ${!!user}`);
    
    if (user && (allowAnyPassword || password === 'password')) {
      console.log('[LoginScreen] ✅ Login success for', user.email, 'type', loginType);
      console.log('[LoginScreen] 🚀 Calling onLogin callback...');
      onLogin(user, loginType);
      console.log('[LoginScreen] ✅ onLogin callback completed');
    } else {
      console.log('[LoginScreen] ❌ Login failed - user:', !!user, 'passwordCheck:', allowAnyPassword || password === 'password');
      setError('Invalid email or password.');
    }
    setIsLoading(false);
  };

  const handleQuickLogin = () => {
    if (!enableQuickLogin) return;
    const user = users[0];
    if (user) {
      console.log('[AuthDebug] Quick login as', user.email);
      onLogin(user, loginType);
    }
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
                {enableQuickLogin && users.length > 0 && (
                  <button
                    type="button"
                    onClick={handleQuickLogin}
                    className="w-full flex justify-center py-1.5 px-4 border border-slate-300 dark:border-slate-600 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600"
                  >Quick Login (debug)</button>
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
