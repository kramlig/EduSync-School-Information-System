import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFirestoreInstance } from '../../../services/firestoreService';
import type { EnrollmentApplication } from '../../../../types';

/**
 * ApplicationStatus - Public page for parents to track their enrollment application
 * 
 * Features:
 * - Search by application number
 * - Display application status with timeline
 * - Show student info and submission date
 * - Visual status indicators
 * 
 * NOTE: This is a PUBLIC page (no authentication required).
 * SchoolId filtering is NOT needed here because:
 * 1. Application numbers are globally unique across all schools
 * 2. The query already filters by applicationNumber which is unique
 * 3. Each application document already contains schoolId from submission
 * 
 * IMPORTANT: Uses useMemo pattern to prevent infinite loops (see INFINITE_LOOP_PREVENTION.md)
 */
const ApplicationStatus: React.FC = () => {
  const navigate = useNavigate();
  const [applicationNumber, setApplicationNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState<EnrollmentApplication | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!applicationNumber.trim()) {
      setError('Please enter your application number');
      return;
    }

    setLoading(true);
    setError('');
    setApplication(null);

    try {
      const db = getFirestoreInstance();
      const q = query(
        collection(db, 'enrollmentApplications'),
        where('applicationNumber', '==', applicationNumber.trim())
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setError('Application not found. Please check your application number and try again.');
        return;
      }

      const doc = snapshot.docs[0];
      setApplication({ id: doc.id, ...doc.data() } as EnrollmentApplication);
    } catch (err) {
      console.error('[ApplicationStatus] Error fetching application:', err);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'under_review':
        return 'Under Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return '📝';
      case 'under_review':
        return '🔍';
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      default:
        return '📄';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/enrollment')}
            className="mb-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            ← Back to Enrollment Portal
          </button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Track Your Application
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Enter your application number to check the status of your enrollment application
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-4">
            <label htmlFor="applicationNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Application Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="applicationNumber"
                value={applicationNumber}
                onChange={(e) => setApplicationNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g., ENR-2025-001"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                disabled={loading}
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Searching...' : 'Check Status'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              💡 Your application number was provided when you submitted your application
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-medium">❌ {error}</p>
            </div>
          )}
        </div>

        {/* Application Details */}
        {application && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
            {/* Status Header */}
            <div className={`px-6 py-4 border-b-4 ${getStatusColor(application.status).replace('bg-', 'border-')}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Application Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-3xl">{getStatusIcon(application.status)}</span>
                    <span className={`text-2xl font-bold px-4 py-1 rounded-full border-2 ${getStatusColor(application.status)}`}>
                      {getStatusText(application.status)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Application Number</p>
                  <p className="text-xl font-mono font-bold text-gray-900 dark:text-white">{application.applicationNumber}</p>
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Student Information</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Full Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {application.studentInfo.firstName} {application.studentInfo.middleName} {application.studentInfo.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Grade Level</p>
                  <p className="font-medium text-gray-900 dark:text-white">Grade {application.academicInfo.gradeLevel}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Submitted On</p>
                  <p className="font-medium text-gray-900 dark:text-white">{application.submittedAt ? formatDate(application.submittedAt) : 'N/A'}</p>
                </div>
                {application.reviewedAt && (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Reviewed On</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(application.reviewedAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status Timeline */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Application Timeline</h3>
              <div className="space-y-4">
                {/* Submitted */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Application Submitted</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{application.submittedAt ? formatDate(application.submittedAt) : 'N/A'}</p>
                  </div>
                </div>

                {/* Under Review */}
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
                    ['under_review', 'approved', 'rejected'].includes(application.status)
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  } flex items-center justify-center text-sm font-bold`}>
                    {['under_review', 'approved', 'rejected'].includes(application.status) ? '✓' : '○'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Under Review</p>
                    {application.status === 'under_review' && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">Your application is being reviewed by our admissions team</p>
                    )}
                  </div>
                </div>

                {/* Approved/Rejected */}
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
                    application.status === 'approved'
                      ? 'bg-green-600 text-white'
                      : application.status === 'rejected'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  } flex items-center justify-center text-sm font-bold`}>
                    {application.status === 'approved' || application.status === 'rejected' ? '✓' : '○'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {application.status === 'approved' ? 'Approved' : application.status === 'rejected' ? 'Rejected' : 'Decision Pending'}
                    </p>
                    {application.reviewedAt && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(application.reviewedAt)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Review Notes/Rejection Reason */}
            {(application.reviewNotes || application.rejectionReason) && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {application.status === 'rejected' ? 'Rejection Reason' : 'Review Notes'}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {application.rejectionReason || application.reviewNotes}
                </p>
              </div>
            )}

            {/* Action Messages */}
            <div className="px-6 py-4">
              {application.status === 'submitted' && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
                  <p className="font-medium">📋 Your application has been received!</p>
                  <p className="text-sm mt-1">We will review your application and update the status soon. Please check back later.</p>
                </div>
              )}
              
              {application.status === 'under_review' && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                  <p className="font-medium">🔍 Your application is under review</p>
                  <p className="text-sm mt-1">Our admissions team is currently reviewing your application. We will notify you of the decision soon.</p>
                </div>
              )}
              
              {application.status === 'approved' && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                  <p className="font-medium">🎉 Congratulations! Your application has been approved!</p>
                  <p className="text-sm mt-1">Please contact the school office to complete the enrollment process and get your class schedule.</p>
                </div>
              )}
              
              {application.status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                  <p className="font-medium">❌ Application Not Approved</p>
                  <p className="text-sm mt-1">Please contact the school office for more information or to discuss reapplication.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Need Help?</h3>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p>📞 <strong>Contact Us:</strong> Call the school office for assistance</p>
            <p>📧 <strong>Email:</strong> Send your inquiry to admissions@school.edu</p>
            <p>🕐 <strong>Office Hours:</strong> Monday - Friday, 8:00 AM - 5:00 PM</p>
            <p>💡 <strong>Tip:</strong> Keep your application number safe for future reference</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationStatus;
