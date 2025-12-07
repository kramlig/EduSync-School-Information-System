/**
 * DivisionSettings - Division settings and configuration
 * 
 * Displays division information, user account details, and permissions.
 * Provides access level visibility for the current user.
 */

import React, { useMemo } from 'react';
import { useDivisionContext } from '../../contexts/DivisionContext';
import { BuildingOfficeIcon, CheckBadgeIcon, UserGroupIcon, AcademicCapIcon } from '../../../components/icons';

const ROLE_LABELS: Record<string, string> = {
  division_superintendent: 'Division Superintendent',
  asst_superintendent: 'Assistant Superintendent',
  division_admin: 'Division Administrator',
  curriculum_supervisor: 'Curriculum Supervisor',
  psds: 'Public Schools District Supervisor',
  education_program_supervisor: 'Education Program Supervisor',
  division_it: 'IT Administrator',
  division_viewer: 'Read-Only Viewer',
};

const PERMISSION_AREAS: Array<{ key: 'enrollment' | 'personnel' | 'reports' | 'settings' | 'users'; label: string }> = [
  { key: 'enrollment', label: 'Enrollment Data' },
  { key: 'personnel', label: 'Personnel Data' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' },
  { key: 'users', label: 'User Management' },
];

const DivisionSettings: React.FC = () => {
  const { division, divisionUser, accessibleSchools, hasPermission, loading } = useDivisionContext();

  const canWrite = hasPermission('settings', 'write');

  // Calculate permissions summary
  const permissions = useMemo(() => {
    return PERMISSION_AREAS.map(area => ({
      ...area,
      read: hasPermission(area.key, 'read'),
      write: hasPermission(area.key, 'write'),
      export: hasPermission(area.key, 'export'),
      generate: area.key === 'reports' ? hasPermission('reports', 'generate') : false,
    }));
  }, [hasPermission]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 animate-spin border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Division Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          View division configuration and your access permissions
        </p>
      </div>

      {/* Division Info */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-5 h-5 text-blue-600 dark:text-blue-400"><BuildingOfficeIcon /></span>
          <h2 className="font-semibold text-slate-900 dark:text-white">Division Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Division Name
            </label>
            <p className="text-slate-900 dark:text-white">{division?.name || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Division Code
            </label>
            <p className="text-slate-900 dark:text-white font-mono">{division?.code || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Region
            </label>
            <p className="text-slate-900 dark:text-white">{division?.region || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Contact Email
            </label>
            <p className="text-slate-900 dark:text-white">{division?.contact_email || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Superintendent
            </label>
            <p className="text-slate-900 dark:text-white">{division?.superintendent_name || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Asst. Superintendent
            </label>
            <p className="text-slate-900 dark:text-white">{division?.asst_superintendent_name || '-'}</p>
          </div>
        </div>
      </div>

      {/* Your Account */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-5 h-5 text-purple-600 dark:text-purple-400"><CheckBadgeIcon /></span>
          <h2 className="font-semibold text-slate-900 dark:text-white">Your Account</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Name
            </label>
            <p className="text-slate-900 dark:text-white">{divisionUser?.name || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Email
            </label>
            <p className="text-slate-900 dark:text-white">{divisionUser?.email || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Role
            </label>
            <p className="text-slate-900 dark:text-white">
              {divisionUser?.role ? ROLE_LABELS[divisionUser.role] || divisionUser.role.replace(/_/g, ' ') : '-'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Position
            </label>
            <p className="text-slate-900 dark:text-white">{divisionUser?.position_title || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Last Login
            </label>
            <p className="text-slate-900 dark:text-white">
              {divisionUser?.last_login_at 
                ? new Date(divisionUser.last_login_at).toLocaleDateString()
                : 'Never'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Status
            </label>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              divisionUser?.is_active
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              {divisionUser?.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Access Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-5 h-5 text-amber-600 dark:text-amber-400"><AcademicCapIcon /></span>
          <h2 className="font-semibold text-slate-900 dark:text-white">Access Summary</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
              <span className="w-4 h-4"><AcademicCapIcon /></span>
              Accessible Schools
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {accessibleSchools.length}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
              <span className="w-4 h-4"><UserGroupIcon /></span>
              Assigned Districts
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {divisionUser?.assigned_district_ids?.length || (divisionUser?.assigned_district_id ? 1 : 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">Your Permissions</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Based on your role: {ROLE_LABELS[divisionUser?.role || ''] || divisionUser?.role}
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Area</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Read</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Write</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {permissions.map(perm => (
                <tr key={perm.key}>
                  <td className="px-4 py-3 text-slate-900 dark:text-white">{perm.label}</td>
                  <td className="px-4 py-3 text-center">
                    {perm.read ? (
                      <span className="inline-flex w-5 h-5 text-green-600">✓</span>
                    ) : (
                      <span className="inline-flex w-5 h-5 text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {perm.write ? (
                      <span className="inline-flex w-5 h-5 text-green-600">✓</span>
                    ) : (
                      <span className="inline-flex w-5 h-5 text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {perm.export || perm.generate ? (
                      <span className="inline-flex w-5 h-5 text-green-600">✓</span>
                    ) : (
                      <span className="inline-flex w-5 h-5 text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!canWrite && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ You have read-only access to settings. Contact your division administrator to make changes.
          </p>
        </div>
      )}
    </div>
  );
};

export default DivisionSettings;
