/**
 * Analytics Dashboard
 * 
 * Bird's-eye view of all system activity.
 * Shows: active users, page popularity, user distribution (free/pro/school),
 * login trends, where users get stuck, recent sessions, errors, school activity.
 * 
 * Accessible to: superadmin (all schools), admin (own school only).
 */

import React, { useState, useMemo } from 'react';
import { useAnalyticsDashboard } from '../../hooks/useAnalyticsDashboard';
import type { AuthUser } from '../../../types';

interface AnalyticsDashboardProps {
  session: { user: AuthUser; type: 'staff' };
}

// Page name mapping for readability
const PAGE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/students': 'Students',
  '/teachers': 'Teachers',
  '/parents': 'Parents',
  '/sections': 'Classes',
  '/grades': 'Grade Entry',
  '/grades/academic': 'Gradebook',
  '/grades/core-values': 'Core Values',
  '/grades/homeroom-guidance': 'Homeroom Guidance',
  '/grades/analytics': 'Grade Analytics',
  '/attendance': 'Attendance',
  '/schedule': 'Scheduler',
  '/assignments': 'Assignments',
  '/lesson-plan': 'Lesson Plans',
  '/announcements': 'Announcements',
  '/settings': 'Settings',
  '/reports/form137': 'SF10 (Permanent Record)',
  '/reports/form138': 'SF9 (Report Card)',
  '/reports/school-forms': 'School Forms',
  '/reports/elln': 'ELLN Assessment',
  '/school-management': 'School Management',
  '/admin/users': 'User Management',
  '/admin/enrollment': 'Enrollment',
  '/fee-structures': 'Fee Structures',
  '/record-payment': 'Record Payment',
  '/receipts': 'Receipts',
  '/financial-reports': 'Financial Reports',
  '/learning-areas': 'Learning Areas',
  '/substitute': 'Substitutes',
  '/analytics': 'Analytics Dashboard',
};

function getPageLabel(path: string): string {
  return PAGE_LABELS[path] || path;
}

function formatDateTime(date: Date): string {
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Color helpers
const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  teacher: 'bg-blue-100 text-blue-800',
  principal: 'bg-yellow-100 text-yellow-800',
  registrar: 'bg-green-100 text-green-800',
  superadmin: 'bg-red-100 text-red-800',
  student: 'bg-cyan-100 text-cyan-800',
  parent: 'bg-orange-100 text-orange-800',
  unknown: 'bg-gray-100 text-gray-800',
};

const TIER_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  pro: 'bg-amber-100 text-amber-800',
  school: 'bg-blue-100 text-blue-800',
};

// Simple bar chart component
const BarChart: React.FC<{ data: { label: string; value: number; color?: string }[]; maxBars?: number }> = ({ data, maxBars = 10 }) => {
  const sliced = data.slice(0, maxBars);
  const max = Math.max(...sliced.map(d => d.value), 1);
  return (
    <div className="space-y-2">
      {sliced.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-24 truncate text-right" title={d.label}>{d.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${d.color || 'bg-blue-500'}`}
              style={{ width: `${Math.max((d.value / max) * 100, 2)}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-700 w-10 text-right">{d.value}</span>
        </div>
      ))}
    </div>
  );
};

// Activity timeline (hourly)
const HourlyTimeline: React.FC<{ data: { hour: number; pageViews: number; logins: number; uniqueUsers: number }[] }> = ({ data }) => {
  const maxViews = Math.max(...data.map(d => d.pageViews), 1);
  const currentHour = new Date().getHours();
  return (
    <div className="flex items-end gap-[2px] h-28">
      {data.map((d) => (
        <div key={d.hour} className="flex-1 flex flex-col items-center group relative">
          <div className="w-full flex flex-col items-center">
            <div
              className={`w-full rounded-t transition-all ${
                d.hour === currentHour ? 'bg-blue-500' : d.pageViews > 0 ? 'bg-blue-300' : 'bg-gray-200'
              }`}
              style={{ height: `${Math.max((d.pageViews / maxViews) * 80, 2)}px` }}
            />
          </div>
          {d.hour % 3 === 0 && (
            <span className="text-[9px] text-gray-400 mt-1">{d.hour}h</span>
          )}
          {/* Tooltip */}
          <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
            <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
              <div>{d.hour}:00 - {d.hour + 1}:00</div>
              <div>{d.pageViews} views, {d.uniqueUsers} users</div>
              {d.logins > 0 && <div>{d.logins} logins</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Stat card
const StatCard: React.FC<{ label: string; value: string | number; sublabel?: string; color?: string; icon?: React.ReactNode }> = ({ label, value, sublabel, color = 'bg-white', icon }) => (
  <div className={`${color} rounded-xl border border-gray-200 p-4 shadow-sm`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
      </div>
      {icon && <div className="text-gray-400">{icon}</div>}
    </div>
  </div>
);

// Date range presets
type DatePreset = 'today' | '7days' | '30days' | 'custom';

function getDateRange(preset: DatePreset): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  switch (preset) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case '7days':
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case '30days':
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start.setHours(0, 0, 0, 0);
  }
  return { start, end };
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ session }) => {
  const isSuperAdmin = session.user.role === 'superadmin';
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'pages' | 'schools' | 'errors'>('overview');

  const dateRange = useMemo(() => getDateRange(datePreset), [datePreset]);

  const { summary, loading, error, refetch } = useAnalyticsDashboard({
    schoolId: isSuperAdmin ? undefined : session.user.schoolId,
    dateRange,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-medium">Failed to load analytics</p>
        <p className="text-red-400 text-sm mt-1">{error}</p>
        <button onClick={refetch} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isSuperAdmin ? 'System-wide activity across all schools' : `Activity for ${(session.user as any).schoolName || session.user.schoolId}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date presets */}
          {(['today', '7days', '30days'] as DatePreset[]).map(preset => (
            <button
              key={preset}
              onClick={() => setDatePreset(preset)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                datePreset === preset
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {preset === 'today' ? 'Today' : preset === '7days' ? '7 Days' : '30 Days'}
            </button>
          ))}
          <button onClick={refetch} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" title="Refresh">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="Active Now"
          value={summary.activeUsersNow}
          sublabel="Last 15 minutes"
          icon={<div className={`w-3 h-3 rounded-full ${summary.activeUsersNow > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />}
        />
        <StatCard label="Unique Users" value={summary.uniqueUsersToday} sublabel={datePreset === 'today' ? 'Today' : `Last ${datePreset}`} />
        <StatCard label="Page Views" value={summary.totalPageViewsToday.toLocaleString()} sublabel={datePreset === 'today' ? 'Today' : `Last ${datePreset}`} />
        <StatCard label="Logins" value={summary.totalLoginsToday} sublabel={datePreset === 'today' ? 'Today' : `Last ${datePreset}`} />
        <StatCard label="Avg Pages/Session" value={summary.averageSessionPages} sublabel="Pages per visit" />
        <StatCard 
          label="Errors" 
          value={summary.totalErrorsToday} 
          sublabel={datePreset === 'today' ? 'Today' : `Last ${datePreset}`}
          color={summary.totalErrorsToday > 0 ? 'bg-red-50' : 'bg-white'}
        />
      </div>

      {/* Tab Nav */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'users', label: 'Users' },
            { key: 'pages', label: 'Pages' },
            ...(isSuperAdmin ? [{ key: 'schools', label: 'Schools' }] : []),
            { key: 'errors', label: `Errors${summary.totalErrorsToday > 0 ? ` (${summary.totalErrorsToday})` : ''}` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Today's Activity (Hourly)</h3>
            <HourlyTimeline data={summary.hourlyActivity} />
          </div>

          {/* Top Pages */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Most Visited Pages</h3>
            <BarChart
              data={summary.topPages.map(p => ({
                label: getPageLabel(p.page),
                value: p.views,
                color: 'bg-blue-400',
              }))}
              maxBars={8}
            />
          </div>

          {/* User Distribution by Role */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Users by Role</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.usersByRole).sort((a, b) => b[1] - a[1]).map(([role, count]) => (
                <div key={role} className={`px-3 py-1.5 rounded-full text-sm font-medium ${ROLE_COLORS[role] || ROLE_COLORS.unknown}`}>
                  {role}: {count}
                </div>
              ))}
              {Object.keys(summary.usersByRole).length === 0 && (
                <p className="text-sm text-gray-400">No user data yet</p>
              )}
            </div>
          </div>

          {/* User Distribution by Tier */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Users by Plan</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.usersByTier).sort((a, b) => b[1] - a[1]).map(([tier, count]) => (
                <div key={tier} className={`px-3 py-1.5 rounded-full text-sm font-medium ${TIER_COLORS[tier] || TIER_COLORS.school}`}>
                  {tier === 'school' ? 'School Plan' : tier === 'pro' ? 'Pro' : 'Free'}: {count}
                </div>
              ))}
              {Object.keys(summary.usersByTier).length === 0 && (
                <p className="text-sm text-gray-400">No plan data yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Recent User Activity</h3>
            <p className="text-xs text-gray-400 mt-0.5">Last seen sessions sorted by most recent</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Last Page</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Pages</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summary.recentSessions.map((s, i) => {
                  const isOnline = (Date.now() - s.lastSeen.getTime()) < 15 * 60 * 1000;
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{s.userName}</div>
                            <div className="text-xs text-gray-400">{s.userEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[s.userRole] || ROLE_COLORS.unknown}`}>
                          {s.userRole}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-600">{s.schoolName}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-600">{getPageLabel(s.lastPage)}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-600">{s.pageCount}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{timeAgo(s.lastSeen)}</td>
                    </tr>
                  );
                })}
                {summary.recentSessions.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No user sessions recorded yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'pages' && (
        <div className="space-y-6">
          {/* Full page list */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Page Performance</h3>
              <p className="text-xs text-gray-400 mt-0.5">Pages ordered by total views. Low unique users with high views may indicate users getting stuck.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Unique Users</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Views/User</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Engagement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.topPages.map((p, i) => {
                    const viewsPerUser = p.uniqueUsers > 0 ? Math.round((p.views / p.uniqueUsers) * 10) / 10 : 0;
                    const isStuck = viewsPerUser > 5; // High repeat views might mean user is stuck
                    return (
                      <tr key={i} className={`hover:bg-gray-50 ${isStuck ? 'bg-amber-50' : ''}`}>
                        <td className="px-4 py-2.5">
                          <span className="font-medium text-gray-900">{getPageLabel(p.page)}</span>
                          <span className="ml-2 text-xs text-gray-400">{p.page}</span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{p.views}</td>
                        <td className="px-4 py-2.5 text-gray-600">{p.uniqueUsers}</td>
                        <td className="px-4 py-2.5">
                          <span className={viewsPerUser > 5 ? 'text-amber-600 font-medium' : 'text-gray-600'}>
                            {viewsPerUser}
                            {isStuck && <span className="ml-1 text-xs" title="High views/user ratio may indicate users getting stuck">⚠️</span>}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="w-24 bg-gray-100 rounded-full h-2">
                            <div
                              className={`h-full rounded-full ${isStuck ? 'bg-amber-400' : 'bg-blue-400'}`}
                              style={{ width: `${Math.min((p.views / Math.max(summary.topPages[0]?.views || 1, 1)) * 100, 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {summary.topPages.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No page view data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schools' && isSuperAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">School Activity</h3>
            <p className="text-xs text-gray-400 mt-0.5">Activity breakdown per school</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Events</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Unique Users</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summary.schoolActivity.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-gray-900">{s.schoolName}</div>
                      <div className="text-xs text-gray-400">{s.schoolId}</div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{s.events}</td>
                    <td className="px-4 py-2.5 text-gray-600">{s.uniqueUsers}</td>
                    <td className="px-4 py-2.5">
                      <div className="w-32 bg-gray-100 rounded-full h-2">
                        <div
                          className="h-full rounded-full bg-blue-400"
                          style={{ width: `${Math.min((s.events / Math.max(summary.schoolActivity[0]?.events || 1, 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {summary.schoolActivity.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No school activity data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'errors' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Recent Errors</h3>
            <p className="text-xs text-gray-400 mt-0.5">Client-side errors reported by users</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summary.recentErrors.map((e, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-xs text-gray-500">{formatDateTime(e.timestamp)}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-700">{e.userName}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-600">{getPageLabel(e.page)}</td>
                    <td className="px-4 py-2.5 text-xs text-red-600 font-mono max-w-xs truncate" title={e.error}>{e.error}</td>
                  </tr>
                ))}
                {summary.recentErrors.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-green-500">No errors recorded</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="text-xs text-gray-400 text-center py-2">
        Showing {summary.events.length.toLocaleString()} events
        {datePreset === 'today' ? ' from today' : ` from last ${datePreset}`}
        {' · '}Data refreshes on page load or click the refresh button
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
