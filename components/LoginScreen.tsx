import React, { useState } from 'react';
import type { AuthUser } from '../types';
import { ChartPieIcon } from './icons';
import { SchoolDataHook } from '../hooks/useSchoolData';

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
  loginFn: SchoolDataHook['login'];
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, loginFn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await loginFn(email, password);
      if (user) {
        onLogin(user);
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
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
        <div className="text-center">
            <div className="flex items-center justify-center mb-4 text-slate-800 dark:text-white">
                <ChartPieIcon />
                <h1 className="ml-3 text-3xl font-bold">EduSync</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400">Sign in to access the School Information System</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white"
                />
            </div>
            <div>
                <label htmlFor="password"  className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white"
                />
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            
            <div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
            </div>
        </form>
         <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            <p className="font-semibold">Demo Credentials:</p>
            <p>Admin: <span className="font-mono">admin@school.edu</span> / <span className="font-mono">admin123</span></p>
            <p>Teacher: <span className="font-mono">e.vance@school.edu</span> / <span className="font-mono">teacher123</span></p>
         </div>
      </div>
    </div>
  );
};

export default LoginScreen;