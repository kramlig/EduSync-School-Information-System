/**
 * DivisionOnboarding - Onboarding wizard for new division users
 * 
 * Features:
 * - Welcome introduction
 * - Division overview
 * - Feature walkthrough
 * - Quick actions guide
 * - Profile completion check
 * 
 * @see docs/features/DIVISION_LEVEL_ACCESS.md
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDivisionContext } from '../../contexts/DivisionContext';
import { logView } from '../../services/divisionAuditService';
import {
  BuildingOffice2Icon,
  AcademicCapIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

// =====================================================
// CONSTANTS
// =====================================================

const ROLE_DESCRIPTIONS: Record<string, string> = {
  division_superintendent: 'Full oversight of all division operations, schools, and personnel',
  asst_superintendent: 'Support the superintendent with division-wide administrative duties',
  division_admin: 'Manage division users, settings, and day-to-day operations',
  division_supervisor: 'Supervise and validate school-level data and reports',
  division_data_manager: 'Handle data management, exports, and report generation',
  curriculum_supervisor: 'Oversee curriculum implementation across schools',
  psds: 'Supervise schools within assigned districts',
  eps: 'Monitor and support education programs',
  division_it: 'Manage technical infrastructure and user access',
  division_viewer: 'View reports and data in read-only mode',
};

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

// =====================================================
// STEP COMPONENTS
// =====================================================

/**
 * Welcome Step
 */
const WelcomeStep: React.FC<{ userName: string; roleName: string; roleDescription: string }> = ({
  userName,
  roleName,
  roleDescription,
}) => (
  <div className="text-center py-8">
    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <RocketLaunchIcon className="w-10 h-10 text-blue-600" />
    </div>
    <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome, {userName}!</h2>
    <p className="text-lg text-gray-600 mb-6">
      You're now part of the DepEd Division-Level Access Portal.
    </p>
    <div className="bg-blue-50 rounded-xl p-6 max-w-md mx-auto">
      <p className="text-sm text-blue-600 font-medium mb-1">Your Role</p>
      <p className="text-xl font-bold text-blue-900">{roleName}</p>
      <p className="text-sm text-gray-600 mt-2">{roleDescription}</p>
    </div>
  </div>
);

/**
 * Division Overview Step
 */
const DivisionOverviewStep: React.FC<{
  divisionName: string;
  schoolCount: number;
  region: string;
}> = ({ divisionName, schoolCount, region }) => (
  <div className="py-8">
    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <BuildingOffice2Icon className="w-8 h-8 text-green-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Your Division</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <BuildingOffice2Icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Division</p>
        <p className="font-bold text-gray-900">{divisionName}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <AcademicCapIcon className="w-8 h-8 text-green-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Schools</p>
        <p className="font-bold text-gray-900">{schoolCount} schools</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <ChartBarIcon className="w-8 h-8 text-purple-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Region</p>
        <p className="font-bold text-gray-900">{region}</p>
      </div>
    </div>
    
    <p className="text-center text-gray-600 mt-6">
      You have access to view and manage data across all schools in your division.
    </p>
  </div>
);

/**
 * Features Step
 */
const FeaturesStep: React.FC = () => (
  <div className="py-8">
    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <SparklesIcon className="w-8 h-8 text-purple-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Key Features</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
      <div className="flex items-start gap-4 bg-white rounded-lg shadow p-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <AcademicCapIcon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">School Management</h3>
          <p className="text-sm text-gray-500">View and monitor all schools in your division</p>
        </div>
      </div>
      
      <div className="flex items-start gap-4 bg-white rounded-lg shadow p-4">
        <div className="p-2 bg-green-100 rounded-lg">
          <UserGroupIcon className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Enrollment Data</h3>
          <p className="text-sm text-gray-500">Track enrollment across all schools in real-time</p>
        </div>
      </div>
      
      <div className="flex items-start gap-4 bg-white rounded-lg shadow p-4">
        <div className="p-2 bg-purple-100 rounded-lg">
          <DocumentChartBarIcon className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">DepEd Reports</h3>
          <p className="text-sm text-gray-500">Generate SF5, SF6, SF7 and consolidated reports</p>
        </div>
      </div>
      
      <div className="flex items-start gap-4 bg-white rounded-lg shadow p-4">
        <div className="p-2 bg-yellow-100 rounded-lg">
          <ClipboardDocumentCheckIcon className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Personnel Records</h3>
          <p className="text-sm text-gray-500">View personnel data across all schools</p>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Quick Actions Step
 */
const QuickActionsStep: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => (
  <div className="py-8">
    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <Cog6ToothIcon className="w-8 h-8 text-yellow-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Quick Actions</h2>
    
    <p className="text-center text-gray-600 mb-6">
      Here are some quick actions to help you get started:
    </p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
      <button
        onClick={() => onNavigate('/division/schools')}
        className="flex items-center gap-4 bg-white rounded-lg shadow p-4 hover:bg-gray-50 transition text-left"
      >
        <div className="p-2 bg-blue-100 rounded-lg">
          <AcademicCapIcon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">View Schools</h3>
          <p className="text-sm text-gray-500">Browse all schools in your division</p>
        </div>
        <ArrowRightIcon className="w-5 h-5 text-gray-400 ml-auto" />
      </button>
      
      <button
        onClick={() => onNavigate('/division/reports/sf5')}
        className="flex items-center gap-4 bg-white rounded-lg shadow p-4 hover:bg-gray-50 transition text-left"
      >
        <div className="p-2 bg-green-100 rounded-lg">
          <DocumentChartBarIcon className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">SF5 Report</h3>
          <p className="text-sm text-gray-500">View enrollment summary</p>
        </div>
        <ArrowRightIcon className="w-5 h-5 text-gray-400 ml-auto" />
      </button>
      
      <button
        onClick={() => onNavigate('/division/enrollment')}
        className="flex items-center gap-4 bg-white rounded-lg shadow p-4 hover:bg-gray-50 transition text-left"
      >
        <div className="p-2 bg-purple-100 rounded-lg">
          <UserGroupIcon className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Enrollment Data</h3>
          <p className="text-sm text-gray-500">Track student enrollment</p>
        </div>
        <ArrowRightIcon className="w-5 h-5 text-gray-400 ml-auto" />
      </button>
      
      <button
        onClick={() => onNavigate('/division/settings')}
        className="flex items-center gap-4 bg-white rounded-lg shadow p-4 hover:bg-gray-50 transition text-left"
      >
        <div className="p-2 bg-yellow-100 rounded-lg">
          <Cog6ToothIcon className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Settings</h3>
          <p className="text-sm text-gray-500">Configure your preferences</p>
        </div>
        <ArrowRightIcon className="w-5 h-5 text-gray-400 ml-auto" />
      </button>
    </div>
  </div>
);

/**
 * Complete Step
 */
const CompleteStep: React.FC<{ onFinish: () => void }> = ({ onFinish }) => (
  <div className="text-center py-8">
    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <CheckCircleIcon className="w-10 h-10 text-green-600" />
    </div>
    <h2 className="text-3xl font-bold text-gray-900 mb-4">You're All Set!</h2>
    <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
      You've completed the onboarding. Start exploring the division portal and access data across all your schools.
    </p>
    <button
      onClick={onFinish}
      className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition text-lg"
    >
      Go to Dashboard
      <ArrowRightIcon className="w-5 h-5" />
    </button>
  </div>
);

// =====================================================
// MAIN COMPONENT
// =====================================================

const DivisionOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { division, divisionUser, accessibleSchools } = useDivisionContext();
  
  const [currentStep, setCurrentStep] = useState(0);

  // Get role info
  const roleName = useMemo(() => {
    const roleLabels: Record<string, string> = {
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
    return roleLabels[divisionUser?.role || ''] || 'Division User';
  }, [divisionUser?.role]);

  const roleDescription = useMemo(() => {
    return ROLE_DESCRIPTIONS[divisionUser?.role || ''] || 'Access division-level data and reports';
  }, [divisionUser?.role]);

  // Handle navigation to specific routes
  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  // Handle finish onboarding
  const handleFinish = useCallback(async () => {
    // Log the completion
    if (division?.id && divisionUser?.id && divisionUser?.name) {
      await logView(
        division.id,
        divisionUser.id,
        divisionUser.name,
        'division',
        'Onboarding Complete',
        'dashboard'
      );
    }
    
    // Save that user completed onboarding
    localStorage.setItem('edusync_division_onboarding_complete', 'true');
    
    // Navigate to dashboard
    navigate('/division');
  }, [division?.id, divisionUser?.id, divisionUser?.name, navigate]);

  // Define steps
  const steps: OnboardingStep[] = useMemo(() => [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Introduction to the portal',
      icon: <RocketLaunchIcon className="w-5 h-5" />,
      content: (
        <WelcomeStep
          userName={divisionUser?.name || 'User'}
          roleName={roleName}
          roleDescription={roleDescription}
        />
      ),
    },
    {
      id: 'division',
      title: 'Your Division',
      description: 'Division overview',
      icon: <BuildingOffice2Icon className="w-5 h-5" />,
      content: (
        <DivisionOverviewStep
          divisionName={division?.name || 'Division'}
          schoolCount={accessibleSchools.length}
          region={division?.region || 'Region'}
        />
      ),
    },
    {
      id: 'features',
      title: 'Features',
      description: 'Key capabilities',
      icon: <SparklesIcon className="w-5 h-5" />,
      content: <FeaturesStep />,
    },
    {
      id: 'actions',
      title: 'Quick Actions',
      description: 'Get started',
      icon: <Cog6ToothIcon className="w-5 h-5" />,
      content: <QuickActionsStep onNavigate={handleNavigate} />,
    },
    {
      id: 'complete',
      title: 'Complete',
      description: 'All done!',
      icon: <CheckCircleIcon className="w-5 h-5" />,
      content: <CompleteStep onFinish={handleFinish} />,
    },
  ], [divisionUser?.name, roleName, roleDescription, division?.name, division?.region, accessibleSchools.length, handleNavigate, handleFinish]);

  // Navigation handlers
  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    localStorage.setItem('edusync_division_onboarding_complete', 'true');
    navigate('/division');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <BuildingOffice2Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">EduSync Division Portal</h1>
              <p className="text-xs text-gray-500">Getting Started Guide</p>
            </div>
          </div>
          <button
            onClick={skipOnboarding}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Skip Tour
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center gap-2 ${
                    index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index < currentStep
                        ? 'bg-blue-600 text-white'
                        : index === currentStep
                        ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span className="hidden md:inline text-sm font-medium">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 md:w-24 h-0.5 mx-2 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8">
          {steps[currentStep].content}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="bg-white border-t">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={currentStep === 0}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
              currentStep === 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition ${
                  index === currentStep ? 'bg-blue-600 w-4' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
          
          {currentStep < steps.length - 1 && (
            <button
              onClick={goNext}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          )}
          {currentStep === steps.length - 1 && (
            <div className="w-20" /> // Spacer for last step
          )}
        </div>
      </div>
    </div>
  );
};

export default DivisionOnboarding;
