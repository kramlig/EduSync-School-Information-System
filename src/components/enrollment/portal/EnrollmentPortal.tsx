import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../../services/firestoreService';
import { useSchoolData } from '../../../../hooks/useSchoolData';
import { useEnrollmentFeatures, useFinancialFeatures } from '../../../../services/featureFlags';
import EdusyncLogo from '../../../../components/EdusyncLogo';

/**
 * EnrollmentPortal - Parent-facing landing page for starting enrollment
 * 
 * Features:
 * - Welcome message and requirements overview
 * - Check if enrollment is open
 * - "Start Application" button
 * - Application status tracker for existing applications
 * 
 * IMPORTANT: Feature flag hooks are memoized to prevent infinite render loops
 * caused by settings object reference changes from useSchoolData
 */
const EnrollmentPortal: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const { settings, loading } = useSchoolData(['settings']);
  
  // Memoize feature flags to prevent infinite loops
  const enrollmentFeatures = useMemo(() => useEnrollmentFeatures(settings), [settings]);
  const financialFeatures = useMemo(() => useFinancialFeatures(settings), [settings]);

  // Show loading state while settings load
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading enrollment information...</p>
        </div>
      </div>
    );
  }

  // Check if enrollment features are enabled
  if (!enrollmentFeatures.requiresApplication) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-yellow-800 mb-2">
            📋 Enrollment System Not Enabled
          </h2>
          <p className="text-yellow-700">
            Online enrollment applications are not currently configured for this school.
            Please contact the school administration for enrollment information.
          </p>
        </div>
      </div>
    );
  }

  const handleStartApplication = () => {
    // Allow anyone to start application (no auth required for public enrollment)
    navigate('/enrollment/apply');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Logo Bar */}
      <div className="flex justify-center mb-6">
        <EdusyncLogo size="lg" showText={true} />
      </div>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-lg p-8 mb-6 shadow-xl">
        <h1 className="text-3xl font-bold mb-3">
          🎓 Welcome to {settings?.schoolName || 'EduSync'} Enrollment
        </h1>
        <p className="text-blue-100 text-lg">
          Begin your child's educational journey with us. Complete your online enrollment application today.
        </p>
      </div>

      {/* Status Badge */}
      <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-6 flex items-center gap-3">
        <div className="text-3xl">✅</div>
        <div>
          <p className="font-bold text-green-800 text-lg">Enrollment is Currently Open</p>
          <p className="text-green-700">School Year {settings?.schoolYear || '2023-2024'}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Requirements Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            📋 Application Requirements
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">✓</span>
              <span>Valid email address for account creation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">✓</span>
              <span>Student's birth certificate (PSA copy)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">✓</span>
              <span>Report card (Form 138) from previous school</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">✓</span>
              <span>Certificate of Good Moral Character</span>
            </li>
            {enrollmentFeatures.requiresDocuments && (
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Medical records and immunization card</span>
              </li>
            )}
          </ul>
        </div>

        {/* Process Timeline Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            🕐 Enrollment Process
          </h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <p className="font-semibold">Complete Online Form</p>
                <p className="text-sm text-gray-600">Fill out the multi-step application (15-20 minutes)</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <p className="font-semibold">Upload Documents</p>
                <p className="text-sm text-gray-600">Submit required documents digitally</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <p className="font-semibold">Application Review</p>
                <p className="text-sm text-gray-600">School admin reviews within 3-5 business days</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <p className="font-semibold">Receive Confirmation</p>
                <p className="text-sm text-gray-600">Email notification with next steps</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Info (if applicable) */}
      {settings && financialFeatures.enabled && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            💰 Enrollment Fees
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-gray-700">
            <div>
              <p className="font-semibold mb-1">Payment Options:</p>
              <ul className="text-sm space-y-1">
                {financialFeatures.allowsPartial && (
                  <li>• Partial payment accepted (minimum 50%)</li>
                )}
                <li>• Full payment upon enrollment</li>
                <li>• Grace period: {financialFeatures.gracePeriod} days</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-1">Accepted Payment Methods:</p>
              <ul className="text-sm space-y-1">
                <li>• Cash payment at school office</li>
                <li>• Bank deposit/transfer</li>
                <li>• GCash/PayMaya (online)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="bg-white border-2 border-blue-600 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to Get Started?</h2>
        <p className="text-gray-600 mb-6">
          {!currentUser && 'Create an account or login to begin your enrollment application.'}
          {currentUser && 'Click below to start your enrollment application.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleStartApplication}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg w-full sm:w-auto"
          >
            {!currentUser && '🔐 Login to Start Application'}
            {currentUser && '▶️ Start Application'}
          </button>
          <button
            onClick={() => navigate('/enrollment/status')}
            className="bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600 font-bold py-3 px-8 rounded-lg transition-colors text-lg w-full sm:w-auto"
          >
            📋 Track Application Status
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Need help? Contact us at enrollment@edusync.local
        </p>
      </div>

      {/* FAQ Section */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">❓ Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-gray-800">How long does the application take?</p>
            <p className="text-gray-600 text-sm">The online form typically takes 15-20 minutes to complete.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-800">Can I save my progress and continue later?</p>
            <p className="text-gray-600 text-sm">Yes! Your progress is automatically saved. You can log in anytime to continue.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-800">What if I don't have all documents ready?</p>
            <p className="text-gray-600 text-sm">You can submit your application and upload documents later before the deadline.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-800">How will I know if my application is approved?</p>
            <p className="text-gray-600 text-sm">You'll receive an email notification with the decision and next steps.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentPortal;
