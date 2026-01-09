/**
 * SuperAdminGuard - Route guard for SuperAdmin access
 * 
 * NOTE: Primary protection is done at App.tsx routing level.
 * This component is kept for optional additional checks or future use.
 * Currently acts as a pass-through wrapper.
 */

import React from 'react';

interface SuperAdminGuardProps {
  children: React.ReactNode;
}

/**
 * SuperAdmin route guard.
 * Primary access control is handled at App.tsx routing level.
 * This wrapper is provided for structural consistency.
 */
const SuperAdminGuard: React.FC<SuperAdminGuardProps> = ({ children }) => {
  // App.tsx already verifies staffSession.user.role === 'superadmin'
  // This component is a pass-through for now
  return <>{children}</>;
};

export default SuperAdminGuard;
