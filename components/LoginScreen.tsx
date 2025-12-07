import DepEdLogo from './DepEdLogo';
import EdusyncLogo from './EdusyncLogo';
import React, { useState } from 'react';
import type { AuthUser, StudentUser, ParentUser } from '../types';
import { login, type LoginType, type DivisionAuthUser } from '../src/services/authService';

interface LoginScreenProps {
  onLogin: (user: AuthUser | StudentUser | ParentUser | DivisionAuthUser, type: 'staff' | 'student' | 'parent' | 'division') => void;
  loginType: 'staff' | 'student' | 'parent';
  setLoginType: (type: 'staff' | 'student' | 'parent') => void;
}

/**
 * LoginScreen - Enterprise-grade authentication UI
 * 
 * Features:
 * - Rate limiting protection (5 attempts / 15 min window)
 * - Audit logging for security compliance
 * - Optimized single-query user lookup
 * - Offline support with secure session caching
 * - Device fingerprint validation
 */
const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, loginType, setLoginType }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null);
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
    setAttemptsRemaining(null);
    setBlockedUntil(null);
    setIsLoading(true);

    try {
      // Use the new enterprise-grade auth service
      const result = await login(email, password, loginType as LoginType);
      
      if (result.success && result.user) {
        console.log('[LoginScreen] ✅ Login successful, userType:', result.userType);
        
        // Division users get a special login type for proper routing
        const effectiveType = result.userType === 'division' ? 'division' : loginType;
        onLogin(result.user, effectiveType);
      } else {
        // Handle login failure
        const err = result.error;
        
        if (err?.isRateLimited && err?.blockedUntil) {
          setBlockedUntil(err.blockedUntil);
          const minutesLeft = Math.ceil((err.blockedUntil.getTime() - Date.now()) / 60000);
          setError(`⛔ Too many failed attempts. Please try again in ${minutesLeft} minutes.`);
        } else {
          setError(err?.message || 'Unable to login. Please check your credentials.');
          if (err?.attemptsRemaining !== undefined) {
            setAttemptsRemaining(err.attemptsRemaining);
          }
        }
      }
    } catch (err) {
      console.error('[LoginScreen] ❌ Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
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

            {error && (
              <div className="text-center">
                <p className="text-sm text-red-600">{error}</p>
                {attemptsRemaining !== null && attemptsRemaining > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining before lockout
                  </p>
                )}
                {blockedUntil && (
                  <p className="text-xs text-red-500 mt-1">
                    🔒 Account temporarily locked
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
                <button
                    type="submit" 
                    disabled={isLoading || !!blockedUntil}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {isLoading ? 'Signing in...' : blockedUntil ? '🔒 Locked' : 'Sign in'}
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

            {error && (
              <div className="text-center">
                <p className="text-sm text-red-600">{error}</p>
                {attemptsRemaining !== null && attemptsRemaining > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining before lockout
                  </p>
                )}
                {blockedUntil && (
                  <p className="text-xs text-red-500 mt-1">
                    🔒 Account temporarily locked
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
                <button
                    type="submit" 
                    disabled={isLoading || !!blockedUntil}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {isLoading ? 'Signing in...' : blockedUntil ? '🔒 Locked' : 'Sign in'}
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

            {error && (
              <div className="text-center">
                <p className="text-sm text-red-600">{error}</p>
                {attemptsRemaining !== null && attemptsRemaining > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining before lockout
                  </p>
                )}
                {blockedUntil && (
                  <p className="text-xs text-red-500 mt-1">
                    🔒 Account temporarily locked
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
                <button
                    type="submit" 
                    disabled={isLoading || !!blockedUntil}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {isLoading ? 'Signing in...' : blockedUntil ? '🔒 Locked' : 'Sign in'}
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
