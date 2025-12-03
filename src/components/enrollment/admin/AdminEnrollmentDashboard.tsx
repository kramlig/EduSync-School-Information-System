import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnrollmentApplicationsPostgreSQL } from '../../../hooks/useEnrollmentApplicationsPostgreSQL';
// import { useSchoolData } from '../../../../hooks/useSchoolData'; // REMOVED: Production uses PostgreSQL only
import type { EnrollmentApplication } from '../../../../types';

type FilterStatus = 'all' | 'submitted' | 'under_review' | 'approved' | 'rejected';

/**
 * AdminEnrollmentDashboard - Admin interface for reviewing enrollment applications
 * 
 * Features:
 * - Real-time list of all applications
 * - Filter by status (submitted, under review, approved, rejected)
 * - Search by student name or application number
 * - Click to view detailed application
 * - Statistics cards
 * 
 * MIGRATION: Now uses useEnrollmentApplicationsPostgreSQL hook
 */
const AdminEnrollmentDashboard: React.FC = () => {
  const navigate = useNavigate();
  // const { settings } = useSchoolData(['settings']); // REMOVED: Production PostgreSQL
  const schoolId = ''; // TEMPORARY: Will be loaded from PostgreSQL context
  
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch applications using PostgreSQL hook
  const { applications, loading } = useEnrollmentApplicationsPostgreSQL({
    schoolId,
    status: filterStatus === 'all' ? undefined : filterStatus,
    enableRealtime: true,
  });

  // Filter applications by search query (memoized to prevent re-calculations)
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      const studentName = `${app.studentInfo?.firstName} ${app.studentInfo?.lastName}`.toLowerCase();
      const appNumber = app.applicationNumber?.toLowerCase() || '';
      
      return studentName.includes(query) || appNumber.includes(query);
    });
  }, [applications, searchQuery]);

  // Calculate statistics (memoized)
  const stats = useMemo(() => ({
    total: applications.length,
    submitted: applications.filter(a => a.status === 'submitted').length,
    underReview: applications.filter(a => a.status === 'under_review').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  }), [applications]);

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-700',
      submitted: 'bg-blue-100 text-blue-700',
      under_review: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      enrolled: 'bg-purple-100 text-purple-700'
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📋 Enrollment Applications
          </h1>
          <p className="text-gray-600">
            Review and manage student enrollment applications
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">New Submissions</p>
            <p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Under Review</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.underReview}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                aria-label="Filter by status"
              >
                <option value="all">All Applications ({stats.total})</option>
                <option value="submitted">Submitted ({stats.submitted})</option>
                <option value="under_review">Under Review ({stats.underReview})</option>
                <option value="approved">Approved ({stats.approved})</option>
                <option value="rejected">Rejected ({stats.rejected})</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Search by student name or application number"
              />
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredApplications.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">
                {searchQuery ? 'No applications match your search' : 'No applications found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Application #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Grade Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredApplications.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/enrollment/${app.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {app.applicationNumber || app.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {app.studentInfo?.firstName} {app.studentInfo?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {app.guardian1?.contactNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        Grade {app.academicInfo?.gradeLevel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(app.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(app.status)}`}>
                          {app.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/enrollment/${app.id}`);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Review →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600 text-center">
          Showing {filteredApplications.length} of {applications.length} applications
        </div>
      </div>
    </div>
  );
};

export default AdminEnrollmentDashboard;
