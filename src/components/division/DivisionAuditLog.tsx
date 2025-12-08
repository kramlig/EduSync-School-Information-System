/**
 * DivisionAuditLog - Audit log viewer for division-level actions
 * 
 * Features:
 * - View all audit logs with filters
 * - Search by user, action, or resource
 * - Export to CSV
 * - Statistics dashboard
 * 
 * @see docs/features/DIVISION_LEVEL_ACCESS.md
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDivisionContext } from '../../contexts/DivisionContext';
import {
  getAuditLogs,
  getAuditLogStats,
  downloadAuditLogsCSV,
  type DivisionAuditLog,
  type AuditLogFilters,
  type AuditLogStats,
  type AuditActionType,
  type AuditActionCategory,
} from '../../services/divisionAuditService';
import {
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ChartBarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  DocumentArrowDownIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';

// =====================================================
// CONSTANTS
// =====================================================

const ACTION_TYPE_LABELS: Record<AuditActionType, { label: string; icon: React.ReactNode; color: string }> = {
  login: { label: 'Login', icon: <ArrowRightOnRectangleIcon className="w-4 h-4" />, color: 'text-blue-600 bg-blue-100' },
  logout: { label: 'Logout', icon: <ArrowRightOnRectangleIcon className="w-4 h-4 rotate-180" />, color: 'text-gray-600 bg-gray-100' },
  view: { label: 'View', icon: <EyeIcon className="w-4 h-4" />, color: 'text-green-600 bg-green-100' },
  create: { label: 'Create', icon: <CheckCircleIcon className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-100' },
  update: { label: 'Update', icon: <PencilIcon className="w-4 h-4" />, color: 'text-yellow-600 bg-yellow-100' },
  delete: { label: 'Delete', icon: <TrashIcon className="w-4 h-4" />, color: 'text-red-600 bg-red-100' },
  export: { label: 'Export', icon: <DocumentArrowDownIcon className="w-4 h-4" />, color: 'text-purple-600 bg-purple-100' },
  generate: { label: 'Generate', icon: <DocumentChartBarIcon className="w-4 h-4" />, color: 'text-indigo-600 bg-indigo-100' },
};

const CATEGORY_LABELS: Record<AuditActionCategory, string> = {
  auth: 'Authentication',
  user_management: 'User Management',
  settings: 'Settings',
  reports: 'Reports',
  schools: 'Schools',
  enrollment: 'Enrollment',
  personnel: 'Personnel',
  dashboard: 'Dashboard',
};

const STATUS_STYLES: Record<string, string> = {
  success: 'text-green-600 bg-green-100',
  failed: 'text-red-600 bg-red-100',
  partial: 'text-yellow-600 bg-yellow-100',
};

// =====================================================
// SUB-COMPONENTS
// =====================================================

/**
 * Statistics Cards Component
 */
const StatsCards: React.FC<{ stats: AuditLogStats }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-500">Total Logs</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_logs.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <ClockIcon className="w-6 h-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-500">Today</p>
            <p className="text-2xl font-bold text-gray-900">{stats.logs_today.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <ChartBarIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-500">This Week</p>
            <p className="text-2xl font-bold text-gray-900">{stats.logs_this_week.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <UserGroupIcon className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-500">Active Users</p>
            <p className="text-2xl font-bold text-gray-900">{stats.unique_users}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Action Badge Component
 */
const ActionBadge: React.FC<{ actionType: AuditActionType }> = ({ actionType }) => {
  const config = ACTION_TYPE_LABELS[actionType] || { label: actionType, icon: null, color: 'text-gray-600 bg-gray-100' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

/**
 * Log Detail Modal
 */
const LogDetailModal: React.FC<{
  log: DivisionAuditLog;
  onClose: () => void;
}> = ({ log, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Audit Log Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Timestamp</p>
              <p className="font-medium">{new Date(log.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[log.status]}`}>
                {log.status}
              </span>
            </div>
          </div>
          
          {/* User Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">User</p>
              <p className="font-medium">{log.user_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium">{log.user_role || 'N/A'}</p>
            </div>
          </div>
          
          {/* Action Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Action</p>
              <ActionBadge actionType={log.action_type} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-medium">{CATEGORY_LABELS[log.action_category] || log.action_category}</p>
            </div>
          </div>
          
          {/* Description */}
          <div>
            <p className="text-sm text-gray-500">Description</p>
            <p className="font-medium">{log.action_description}</p>
          </div>
          
          {/* Resource Info */}
          {log.resource_type && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Resource Type</p>
                <p className="font-medium">{log.resource_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Resource Name</p>
                <p className="font-medium">{log.resource_name || 'N/A'}</p>
              </div>
            </div>
          )}
          
          {/* School Info */}
          {log.school_name && (
            <div>
              <p className="text-sm text-gray-500">School</p>
              <p className="font-medium">{log.school_name}</p>
            </div>
          )}
          
          {/* Data Changes */}
          {(log.old_data || log.new_data) && (
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Data Changes</p>
              <div className="grid grid-cols-2 gap-4">
                {log.old_data && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Previous Data</p>
                    <pre className="bg-red-50 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(log.old_data, null, 2)}
                    </pre>
                  </div>
                )}
                {log.new_data && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">New Data</p>
                    <pre className="bg-green-50 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(log.new_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Error Message */}
          {log.error_message && (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-red-700 mb-1">Error</p>
              <p className="text-sm text-red-600">{log.error_message}</p>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const DivisionAuditLogComponent: React.FC = () => {
  const { division, divisionUser, hasPermission, loading: contextLoading, accessibleSchools } = useDivisionContext();
  
  // State
  const [logs, setLogs] = useState<DivisionAuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<DivisionAuditLog | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState<AuditActionType | ''>('');
  const [category, setCategory] = useState<AuditActionCategory | ''>('');
  const [schoolId, setSchoolId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const canView = useMemo(() => hasPermission('settings', 'read'), [hasPermission]);
  const canExport = useMemo(() => hasPermission('settings', 'export'), [hasPermission]);
  const pageSize = 25;

  // Load audit logs
  const loadLogs = useCallback(async () => {
    if (!division?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const filters: AuditLogFilters = {
        division_id: division.id,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      };
      
      if (search) filters.search = search;
      if (actionType) filters.action_type = actionType;
      if (category) filters.action_category = category;
      if (schoolId) filters.school_id = schoolId;
      if (startDate) filters.start_date = new Date(startDate).toISOString();
      if (endDate) filters.end_date = new Date(endDate + 'T23:59:59').toISOString();
      
      const response = await getAuditLogs(filters);
      setLogs(response.logs);
      setTotal(response.total);
    } catch (err) {
      console.error('[DivisionAuditLog] Error loading logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [division?.id, page, search, actionType, category, schoolId, startDate, endDate]);

  // Load stats
  const loadStats = useCallback(async () => {
    if (!division?.id) return;
    
    try {
      const statsData = await getAuditLogStats(division.id);
      setStats(statsData);
    } catch (err) {
      console.error('[DivisionAuditLog] Error loading stats:', err);
    }
  }, [division?.id]);

  // Initial load
  useEffect(() => {
    if (canView && division?.id) {
      loadLogs();
      loadStats();
    }
  }, [canView, division?.id, loadLogs, loadStats]);

  // Handle export
  const handleExport = () => {
    if (logs.length === 0) return;
    const filename = `audit_logs_${division?.code || 'division'}_${new Date().toISOString().split('T')[0]}.csv`;
    downloadAuditLogsCSV(logs, filename);
  };

  // Clear filters
  const clearFilters = () => {
    setSearch('');
    setActionType('');
    setCategory('');
    setSchoolId('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // Calculate pagination
  const totalPages = Math.ceil(total / pageSize);

  // Loading state
  if (contextLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <ArrowPathIcon className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Permission check
  if (!canView) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <ExclamationTriangleIcon className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium">Access Denied</p>
        <p className="text-sm">You don't have permission to view audit logs.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardDocumentListIcon className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-sm text-gray-500">Track all division-level user actions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { loadLogs(); loadStats(); }}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {canExport && logs.length > 0 && (
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && <StatsCards stats={stats} />}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        {/* Search Bar */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by user, description, or resource..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg ${showFilters ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}
          >
            <FunnelIcon className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
              <select
                value={actionType}
                onChange={(e) => { setActionType(e.target.value as AuditActionType | ''); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                {Object.entries(ACTION_TYPE_LABELS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value as AuditActionCategory | ''); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
              <select
                value={schoolId}
                onChange={(e) => { setSchoolId(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Schools</option>
                {accessibleSchools.map((school) => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-5 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
          <ExclamationTriangleIcon className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <ArrowPathIcon className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">Loading audit logs...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <ClipboardDocumentListIcon className="w-12 h-12 text-gray-300 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">No audit logs found</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{log.user_name}</div>
                        <div className="text-xs text-gray-500">{log.user_role}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ActionBadge actionType={log.action_type} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {log.action_description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.resource_name || log.resource_type || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[log.status]}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
};

export default DivisionAuditLogComponent;
