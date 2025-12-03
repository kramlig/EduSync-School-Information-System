import React from 'react';
import { useNavigate } from 'react-router-dom';
import EdusyncLogo from '../../../../components/EdusyncLogo';

/**
 * EnrollmentPortal - Parent-facing landing page for starting enrollment
 * 
 * Features:
 * - Generic welcome message (multi-school support)
 * - School selection happens in the enrollment form (first step)
 * - Check if enrollment is generally available
 * - "Start Application" button
 * 
 * NOTE: This is a PUBLIC page. School selection happens AFTER clicking "Start Application"
 */
const EnrollmentPortal: React.FC = () => {
  const navigate = useNavigate();

  const handleStartApplication = () => {
    // Navigate to enrollment form where school selection is the first step
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
          🎓 Welcome to EduSync Enrollment Portal
        </h1>
        <p className="text-blue-100 text-lg">
          Begin your child's educational journey. Complete your online enrollment application today.
        </p>
      </div>

      {/* Status Badge */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="text-green-600 text-3xl">✓</div>
          <div>
            <h2 className="text-xl font-bold text-green-800">Enrollment is Currently Open</h2>
            <p className="text-green-700">School Year 2024-2025</p>
          </div>
        </div>
      </div>
      {/* Status Badge - Removed old code, using new generic version above */}
      
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
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">✓</span>
              <span>Medical records and immunization card</span>
            </li>
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

      {/* Call to Action */}
      <div className="bg-white border-2 border-blue-600 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to Get Started?</h2>
        <p className="text-gray-600 mb-6">
          Click below to begin your enrollment application. You'll select your school in the first step.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleStartApplication}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg w-full sm:w-auto"
          >
            ▶️ Start Application
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
