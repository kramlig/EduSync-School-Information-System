/**
 * SuperAdmin Module - Platform Administration
 * 
 * This module provides superadmin-level access to:
 * - Manage all schools across all divisions
 * - Manage all divisions
 * - Create users for any school or division
 * - View platform-wide analytics
 * 
 * @module superadmin
 */

export { default as SuperAdminLayout } from './SuperAdminLayout';
export { default as SuperAdminGuard } from './SuperAdminGuard';

// Tabs
export { default as SchoolsTab } from './tabs/SchoolsTab';
export { default as DivisionsTab } from './tabs/DivisionsTab';
export { default as GlobalUsersTab } from './tabs/GlobalUsersTab';

// Services
export * from './services/superAdminService';

// Types
export * from './types';
