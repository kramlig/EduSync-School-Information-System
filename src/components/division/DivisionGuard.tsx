/**
 * DivisionGuard - Route guard for Division-level access
 * 
 * This component:
 * - Checks if user is a division user
 * - Redirects to school dashboard if not
 * - Shows loading state while checking
 * - Optionally checks specific permissions
 * 
 * IMPORTANT: Uses a stabilized redirect to prevent infinite loops
 * when the division user query fails.
 * 
 * Usage:
 * ```tsx
 * <Route 
 *   path="/division/*" 
 *   element={
 *     <DivisionGuard>
 *       <DivisionLayout />
 *     </DivisionGuard>
 *   } 
 * />
 * ```
 * 
 * @see docs/features/DIVISION_LEVEL_ACCESS.md
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDivisionContext } from '../../contexts/DivisionContext';
import type { ModulePermissions, PermissionAction } from '../../types/division';

interface DivisionGuardProps {
  children: React.ReactNode;
  /** Optional: Require specific module permission */
  requiredModule?: keyof ModulePermissions;
  /** Optional: Require specific action permission */
  requiredAction?: PermissionAction;
  /** Redirect path if access denied (default: /) */
  redirectTo?: string;
}

const DivisionGuard: React.FC<DivisionGuardProps> = ({
  children,
  requiredModule,
  requiredAction,
  redirectTo = '/',
}) => {
  const location = useLocation();
  const { isDivisionUser, hasPermission, loading, error } = useDivisionContext();
  
  // Track if we've already attempted a redirect to prevent loops
  const [hasAttemptedRedirect, setHasAttemptedRedirect] = useState(false);
  
  // Reset redirect state when location changes (user navigated manually)
  useEffect(() => {
    setHasAttemptedRedirect(false);
  }, [location.pathname]);

  // Show loading state while checking division user status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show error state if there was an error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Access Error
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {error}
          </p>
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Not a division user - redirect to school dashboard
  // Use hasAttemptedRedirect to prevent infinite loops
  if (!isDivisionUser) {
    if (hasAttemptedRedirect) {
      // Already tried to redirect - show error instead of looping
      console.error('[DivisionGuard] Prevented infinite redirect loop');
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
          <div className="text-center max-w-md p-6">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Division Access Error
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Unable to verify your division access. This may be a database configuration issue.
              Please contact your system administrator.
            </p>
            <button
              onClick={() => {
                // Clear session and reload
                localStorage.removeItem('edusync_session');
                localStorage.removeItem('edusync_cached_user');
                window.location.href = '/';
              }}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Login
            </button>
            <button
              onClick={() => {
                // Just go back to dashboard (stay logged in)
                window.location.href = '/dashboard';
              }}
              className="inline-block ml-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
    
    console.log('[DivisionGuard] User is not a division user, redirecting to:', redirectTo);
    setHasAttemptedRedirect(true);
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check specific permission if required
  if (requiredModule && requiredAction) {
    const hasRequiredPermission = hasPermission(requiredModule, requiredAction);
    
    if (!hasRequiredPermission) {
      console.log('[DivisionGuard] User lacks required permission:', requiredModule, requiredAction);
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
          <div className="text-center max-w-md p-6">
            <div className="text-yellow-500 text-5xl mb-4">🔒</div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Access Restricted
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              You don't have permission to access this page.
              Please contact your division administrator.
            </p>
            <a
              href="/division"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Division Dashboard
            </a>
          </div>
        </div>
      );
    }
  }

  // Access granted - render children
  return <>{children}</>;
};

export default DivisionGuard;
