import React, { useState } from 'react';
import type { AuthUser, StudentUser, ParentUser } from '../types';
import { SchoolDataHook } from '../hooks/useSchoolData';

interface LoginScreenProps {
  onLogin: (session: { user: AuthUser | StudentUser | ParentUser; type: 'staff' | 'student' | 'parent' }) => void;
  loginFn: SchoolDataHook['login'];
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, loginFn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState<'staff' | 'student' | 'parent'>('staff');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const session = await loginFn(email, password, loginType);
      if (session) {
        onLogin(session);
      } else {
        setError('Invalid email or password.');
      }
    } catch (e) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
        <div className="text-center">
            <div className="flex flex-col items-center justify-center mb-4 text-slate-800 dark:text-white">
                <img src="https://depedph.com/wp-content/uploads/2024/01/deped-logo-symbol-philippines-1024x1024.png" alt="School Logo" className="w-48 h-48 mb-3" />
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
            
            <div>
                <button
                    type="submit" disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
            </div>
        </form>
         <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            <p className="font-semibold">Demo Credentials:</p>
            <p>Admin: <span className="font-mono">admin@school.edu</span> / <span className="font-mono">admin123</span></p>
            <p>Teacher: <span className="font-mono">teacher@school.edu</span> / <span className="font-mono">teacher123</span></p>
            <p>Parent: <span className="font-mono">s.johnson@family.com</span> / <span className="font-mono">parent123</span></p>
         </div>
      </div>
    </div>
  );
};

export default LoginScreen;