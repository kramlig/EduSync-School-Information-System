/**
 * DivisionSettings - Enhanced Division settings and configuration
 * 
 * Features:
 * - Division profile editing (name, contact, leadership)
 * - Module configuration
 * - Reporting deadline settings
 * - User permissions overview
 * - Tabbed interface
 * 
 * @see docs/features/DIVISION_LEVEL_ACCESS.md
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useDivisionContext } from '../../contexts/DivisionContext';
import { updateDivision } from '../../services/divisionService';
import { logUpdate } from '../../services/divisionAuditService';
import type { Division, DivisionModule, DivisionSettings as DivisionSettingsType } from '../../types/division';
import {
  BuildingOfficeIcon,
  CheckBadgeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  Cog6ToothIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// =====================================================
// CONSTANTS
// =====================================================

const ROLE_LABELS: Record<string, string> = {
  division_superintendent: 'Division Superintendent',
  asst_superintendent: 'Assistant Superintendent',
  division_admin: 'Division Administrator',
  division_supervisor: 'Division Supervisor',
  division_data_manager: 'Data Manager',
  curriculum_supervisor: 'Curriculum Supervisor',
  psds: 'Public Schools District Supervisor',
  eps: 'Education Program Supervisor',
  division_it: 'IT Administrator',
  division_viewer: 'Read-Only Viewer',
};

const PERMISSION_AREAS: Array<{ key: 'enrollment' | 'personnel' | 'reports' | 'settings' | 'users' | 'schools'; label: string }> = [
  { key: 'schools', label: 'Schools' },
  { key: 'enrollment', label: 'Enrollment Data' },
  { key: 'personnel', label: 'Personnel Data' },
  { key: 'reports', label: 'Reports' },
  { key: 'users', label: 'User Management' },
  { key: 'settings', label: 'Settings' },
];

const MODULE_OPTIONS: { value: DivisionModule; label: string; description: string }[] = [
  { value: 'sf1_enrollment', label: 'SF1 - Enrollment', description: 'School Form 1: School Register and Enrollment' },
  { value: 'sf2_attendance', label: 'SF2 - Attendance', description: 'School Form 2: Daily Attendance Report' },
  { value: 'sf7_personnel', label: 'SF7 - Personnel', description: 'School Form 7: School Personnel Assignment List' },
  { value: 'sf10_learner_profile', label: 'SF10 - Learner Profile', description: 'School Form 10: Learner Permanent Record' },
  { value: 'reports_consolidated', label: 'Consolidated Reports', description: 'Division-wide aggregated reports' },
  { value: 'analytics_dashboard', label: 'Analytics Dashboard', description: 'Data visualization and insights' },
  { value: 'school_management', label: 'School Management', description: 'View and manage school profiles' },
  { value: 'personnel_management', label: 'Personnel Management', description: 'Manage division personnel data' },
  { value: 'data_export', label: 'Data Export', description: 'Export data to CSV/Excel/PDF' },
];

type TabKey = 'profile' | 'modules' | 'deadlines' | 'permissions';

// =====================================================
// MAIN COMPONENT
// =====================================================

const DivisionSettingsEnhanced: React.FC = () => {
  const { division, divisionUser, accessibleSchools, hasPermission, loading, refreshData } = useDivisionContext();

  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // Tabs
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profile', icon: <BuildingOfficeIcon className="w-4 h-4" /> },
    { key: 'modules', label: 'Modules', icon: <Cog6ToothIcon className="w-4 h-4" /> },
    { key: 'deadlines', label: 'Deadlines', icon: <CalendarDaysIcon className="w-4 h-4" /> },
    { key: 'permissions', label: 'Permissions', icon: <CheckBadgeIcon className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 animate-spin border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Division Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {canWrite ? 'Manage division configuration and settings' : 'View division configuration and your access permissions'}
        </p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          saveMessage.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          {saveMessage.type === 'success' ? (
            <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
          <span className={saveMessage.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
            {saveMessage.text}
          </span>
          <button
            onClick={() => setSaveMessage(null)}
            className="ml-auto p-1 hover:bg-black/5 rounded"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex gap-4 -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <ProfileTab
          division={division}
          divisionUser={divisionUser}
          canWrite={canWrite}
          onSave={async (data) => {
            setSaving(true);
            setSaveMessage(null);
            try {
              const oldData = { name: division?.name, contact_email: division?.contact_email, contact_phone: division?.contact_phone };
              await updateDivision({ id: division!.id, ...data });
              await refreshData();
              
              // Log audit event
              if (division?.id && divisionUser) {
                await logUpdate(
                  division.id,
                  divisionUser.id,
                  divisionUser.name,
                  'division_settings',
                  division.id,
                  'Division Profile',
                  'settings',
                  oldData,
                  data
                );
              }
              
              setSaveMessage({ type: 'success', text: 'Division profile updated successfully' });
              setIsEditing(false);
            } catch (err) {
              setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
            } finally {
              setSaving(false);
            }
          }}
          saving={saving}
        />
      )}

      {activeTab === 'modules' && (
        <ModulesTab
          division={division}
          canWrite={canWrite}
          onSave={async (enabledModules) => {
            setSaving(true);
            setSaveMessage(null);
            try {
              const oldModules = division?.settings?.enabledModules || [];
              await updateDivision({
                id: division!.id,
                settings: { ...division?.settings, enabledModules },
              });
              await refreshData();
              
              // Log audit event
              if (division?.id && divisionUser) {
                await logUpdate(
                  division.id,
                  divisionUser.id,
                  divisionUser.name,
                  'division_settings',
                  division.id,
                  'Module Settings',
                  'settings',
                  { enabledModules: oldModules },
                  { enabledModules }
                );
              }
              
              setSaveMessage({ type: 'success', text: 'Module settings updated successfully' });
            } catch (err) {
              setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
            } finally {
              setSaving(false);
            }
          }}
          saving={saving}
        />
      )}

      {activeTab === 'deadlines' && (
        <DeadlinesTab
          division={division}
          canWrite={canWrite}
          onSave={async (deadlines) => {
            setSaving(true);
            setSaveMessage(null);
            try {
              const oldDeadlines = division?.settings?.reportingDeadlines;
              await updateDivision({
                id: division!.id,
                settings: { ...division?.settings, reportingDeadlines: deadlines },
              });
              await refreshData();
              
              // Log audit event
              if (division?.id && divisionUser) {
                await logUpdate(
                  division.id,
                  divisionUser.id,
                  divisionUser.name,
                  'division_settings',
                  division.id,
                  'Reporting Deadlines',
                  'settings',
                  { reportingDeadlines: oldDeadlines },
                  { reportingDeadlines: deadlines }
                );
              }
              
              setSaveMessage({ type: 'success', text: 'Reporting deadlines updated successfully' });
            } catch (err) {
              setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
            } finally {
              setSaving(false);
            }
          }}
          saving={saving}
        />
      )}

      {activeTab === 'permissions' && (
        <PermissionsTab
          divisionUser={divisionUser}
          permissions={permissions}
          accessibleSchools={accessibleSchools}
        />
      )}
    </div>
  );
};

// =====================================================
// PROFILE TAB
// =====================================================

interface ProfileTabProps {
  division: Division | null;
  divisionUser: any;
  canWrite: boolean;
  onSave: (data: Partial<Division>) => Promise<void>;
  saving: boolean;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ division, divisionUser, canWrite, onSave, saving }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: division?.name || '',
    contact_email: division?.contact_email || '',
    contact_phone: division?.contact_phone || '',
    address: division?.address || '',
    superintendent_name: division?.superintendent_name || '',
    asst_superintendent_name: division?.asst_superintendent_name || '',
  });

  const handleSave = async () => {
    await onSave(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: division?.name || '',
      contact_email: division?.contact_email || '',
      contact_phone: division?.contact_phone || '',
      address: division?.address || '',
      superintendent_name: division?.superintendent_name || '',
      asst_superintendent_name: division?.asst_superintendent_name || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Division Info */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BuildingOfficeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Division Information</h2>
          </div>
          {canWrite && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Division Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
              />
            ) : (
              <p className="text-slate-900 dark:text-white">{division?.name || '-'}</p>
            )}
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
            {isEditing ? (
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
              />
            ) : (
              <p className="text-slate-900 dark:text-white">{division?.contact_email || '-'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Contact Phone
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
              />
            ) : (
              <p className="text-slate-900 dark:text-white">{division?.contact_phone || '-'}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Address
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
              />
            ) : (
              <p className="text-slate-900 dark:text-white">{division?.address || '-'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Superintendent
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.superintendent_name}
                onChange={(e) => setFormData(prev => ({ ...prev, superintendent_name: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
              />
            ) : (
              <p className="text-slate-900 dark:text-white">{division?.superintendent_name || '-'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Asst. Superintendent
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.asst_superintendent_name}
                onChange={(e) => setFormData(prev => ({ ...prev, asst_superintendent_name: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
              />
            ) : (
              <p className="text-slate-900 dark:text-white">{division?.asst_superintendent_name || '-'}</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Your Account */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckBadgeIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Your Account</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Name</label>
            <p className="text-slate-900 dark:text-white">{divisionUser?.name || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
            <p className="text-slate-900 dark:text-white">{divisionUser?.email || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Role</label>
            <p className="text-slate-900 dark:text-white">
              {divisionUser?.role ? ROLE_LABELS[divisionUser.role] || divisionUser.role.replace(/_/g, ' ') : '-'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Position</label>
            <p className="text-slate-900 dark:text-white">{divisionUser?.position_title || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// MODULES TAB
// =====================================================

interface ModulesTabProps {
  division: Division | null;
  canWrite: boolean;
  onSave: (enabledModules: DivisionModule[]) => Promise<void>;
  saving: boolean;
}

const ModulesTab: React.FC<ModulesTabProps> = ({ division, canWrite, onSave, saving }) => {
  const [enabledModules, setEnabledModules] = useState<DivisionModule[]>(
    division?.settings?.enabledModules || []
  );
  const [hasChanges, setHasChanges] = useState(false);

  const toggleModule = (module: DivisionModule) => {
    setEnabledModules(prev => {
      const newModules = prev.includes(module)
        ? prev.filter(m => m !== module)
        : [...prev, module];
      setHasChanges(true);
      return newModules;
    });
  };

  const handleSave = async () => {
    await onSave(enabledModules);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Cog6ToothIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Enabled Modules</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Select which modules are available to division users
        </p>

        <div className="space-y-3">
          {MODULE_OPTIONS.map(module => (
            <label
              key={module.value}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                enabledModules.includes(module.value)
                  ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              } ${!canWrite ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input
                type="checkbox"
                checked={enabledModules.includes(module.value)}
                onChange={() => canWrite && toggleModule(module.value)}
                disabled={!canWrite}
                className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{module.label}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{module.description}</p>
              </div>
            </label>
          ))}
        </div>

        {canWrite && hasChanges && (
          <div className="flex justify-end mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================================
// DEADLINES TAB
// =====================================================

interface DeadlinesTabProps {
  division: Division | null;
  canWrite: boolean;
  onSave: (deadlines: DivisionSettingsType['reportingDeadlines']) => Promise<void>;
  saving: boolean;
}

const DeadlinesTab: React.FC<DeadlinesTabProps> = ({ division, canWrite, onSave, saving }) => {
  const [deadlines, setDeadlines] = useState({
    sf1_monthly: division?.settings?.reportingDeadlines?.sf1_monthly || 5,
    sf2_monthly: division?.settings?.reportingDeadlines?.sf2_monthly || 5,
    sf7_yearly: division?.settings?.reportingDeadlines?.sf7_yearly || 'June-30',
  });
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: number | string) => {
    setDeadlines(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onSave(deadlines);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <CalendarDaysIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Reporting Deadlines</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Set the submission deadlines for school forms
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              SF1 Monthly Deadline
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Day</span>
              <input
                type="number"
                min="1"
                max="28"
                value={deadlines.sf1_monthly}
                onChange={(e) => handleChange('sf1_monthly', parseInt(e.target.value) || 5)}
                disabled={!canWrite}
                className="w-20 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm disabled:opacity-60"
              />
              <span className="text-sm text-slate-500">of each month</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              SF2 Monthly Deadline
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Day</span>
              <input
                type="number"
                min="1"
                max="28"
                value={deadlines.sf2_monthly}
                onChange={(e) => handleChange('sf2_monthly', parseInt(e.target.value) || 5)}
                disabled={!canWrite}
                className="w-20 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm disabled:opacity-60"
              />
              <span className="text-sm text-slate-500">of each month</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              SF7 Yearly Deadline
            </label>
            <input
              type="text"
              value={deadlines.sf7_yearly}
              onChange={(e) => handleChange('sf7_yearly', e.target.value)}
              disabled={!canWrite}
              placeholder="e.g., June-30"
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm disabled:opacity-60"
            />
          </div>
        </div>

        {canWrite && hasChanges && (
          <div className="flex justify-end mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================================
// PERMISSIONS TAB
// =====================================================

interface PermissionsTabProps {
  divisionUser: any;
  permissions: Array<{
    key: string;
    label: string;
    read: boolean;
    write: boolean;
    export: boolean;
    generate: boolean;
  }>;
  accessibleSchools: any[];
}

const PermissionsTab: React.FC<PermissionsTabProps> = ({ divisionUser, permissions, accessibleSchools }) => {
  return (
    <div className="space-y-6">
      {/* Access Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <AcademicCapIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Access Summary</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Your Role</div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              {ROLE_LABELS[divisionUser?.role] || divisionUser?.role?.replace(/_/g, ' ') || '-'}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Accessible Schools</div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{accessibleSchools.length}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Assigned Districts</div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              {divisionUser?.assigned_district_ids?.length || (divisionUser?.assigned_district_id ? 1 : 'All')}
            </p>
          </div>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">Permissions Matrix</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Based on your role: {ROLE_LABELS[divisionUser?.role] || divisionUser?.role}
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
    </div>
  );
};

export default DivisionSettingsEnhanced;
