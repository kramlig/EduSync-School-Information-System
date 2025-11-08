import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../../services/firestoreService';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { getFirestoreInstance } from '../../../services/firestoreService';
import { useSchoolContext } from '../../../contexts/SchoolContext';
import type { EnrollmentApplication } from '../../../../types';

// Import step components (we'll create these)
import { StudentInfoStep } from './steps/StudentInfoStep';
import { GuardianDetailsStep } from './steps/GuardianDetailsStep';
import { AddressStep } from './steps/AddressStep';
import { AcademicHistoryStep } from './steps/AcademicHistoryStep';
import { HealthInfoStep } from './steps/HealthInfoStep';
import { DocumentsStep } from './steps/DocumentsStep';
import { ReviewStep } from './steps/ReviewStep';

interface StepConfig {
  id: number;
  title: string;
  subtitle: string;
  component: React.ComponentType<StepProps>;
}

interface StepProps {
  data: Partial<EnrollmentApplication>;
  updateData: (updates: Partial<EnrollmentApplication>) => void;
  errors: Record<string, string>;
}

const STEPS: StepConfig[] = [
  {
    id: 1,
    title: 'Student Information',
    subtitle: 'Basic details about the student',
    component: StudentInfoStep
  },
  {
    id: 2,
    title: 'Guardian Details',
    subtitle: 'Parent or guardian information',
    component: GuardianDetailsStep
  },
  {
    id: 3,
    title: 'Address',
    subtitle: 'Residential address information',
    component: AddressStep
  },
  {
    id: 4,
    title: 'Academic History',
    subtitle: 'Previous school and education details',
    component: AcademicHistoryStep
  },
  {
    id: 5,
    title: 'Health Information',
    subtitle: 'Medical history and emergency contacts',
    component: HealthInfoStep
  },
  {
    id: 6,
    title: 'Documents',
    subtitle: 'Upload required documents',
    component: DocumentsStep
  },
  {
    id: 7,
    title: 'Review & Submit',
    subtitle: 'Review your application before submitting',
    component: ReviewStep
  }
];

/**
 * ApplicationForm - Multi-step enrollment application form
 * 
 * Features:
 * - 7 steps with progress tracking
 * - Auto-save to localStorage
 * - Form validation per step
 * - Navigation between steps
 * - Final submission to Firestore
 */
const ApplicationForm: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const { schoolId } = useSchoolContext(); // Get current school
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Initialize application data
  const [applicationData, setApplicationData] = useState<Partial<EnrollmentApplication>>(() => {
    // Try to load from localStorage first (auto-save feature)
    const savedData = localStorage.getItem('enrollment-draft');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error('Failed to parse saved application data:', e);
      }
    }
    
    // Default empty application
    return {
      studentInfo: {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        sex: 'Male' as 'Male' | 'Female',
        nationality: 'Filipino'
      },
      guardian1: {
        fullName: '',
        relationship: 'Father',
        contactNumber: '',
        email: ''
      },
      currentAddress: {
        barangay: '',
        city: '',
        province: ''
      },
      sameAsCurrent: true,
      academicInfo: {
        gradeLevel: 1
      },
      documents: {},
      status: 'draft'
    };
  });

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('enrollment-draft', JSON.stringify(applicationData));
      console.log('[ApplicationForm] Auto-saved to localStorage');
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timer);
  }, [applicationData]);

  // Check authentication
  useEffect(() => {
    if (!currentUser) {
      console.log('[ApplicationForm] No user logged in, redirecting to login');
      navigate('/login?returnTo=/enrollment/apply');
    }
  }, [currentUser, navigate]);

  const updateData = (updates: Partial<EnrollmentApplication>) => {
    setApplicationData(prev => ({ ...prev, ...updates }));
    // Clear errors for updated fields
    setErrors({});
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1: // Student Info
        if (!applicationData.studentInfo?.firstName?.trim()) {
          newErrors.firstName = 'First name is required';
        }
        if (!applicationData.studentInfo?.lastName?.trim()) {
          newErrors.lastName = 'Last name is required';
        }
        if (!applicationData.studentInfo?.dateOfBirth) {
          newErrors.dateOfBirth = 'Birthdate is required';
        }
        if (!applicationData.studentInfo?.sex) {
          newErrors.sex = 'Sex is required';
        }
        break;

      case 2: // Guardian Details
        const guardian1 = applicationData.guardian1;
        
        // At least guardian1 must be filled
        if (!guardian1?.fullName?.trim() || !guardian1?.contactNumber?.trim()) {
          newErrors.guardian = 'Primary guardian information is required';
        }
        break;

      case 3: // Address
        if (!applicationData.currentAddress?.barangay?.trim()) {
          newErrors.barangay = 'Barangay is required';
        }
        if (!applicationData.currentAddress?.city?.trim()) {
          newErrors.city = 'City/Municipality is required';
        }
        if (!applicationData.currentAddress?.province?.trim()) {
          newErrors.province = 'Province is required';
        }
        break;

      case 4: // Academic History
        if (!applicationData.academicInfo?.gradeLevel) {
          newErrors.gradeLevel = 'Grade level is required';
        }
        break;

      case 5: // Health Info (optional, no validation)
        break;

      case 6: // Documents (optional for now)
        break;

      case 7: // Review (final validation)
        // Re-validate all critical fields
        if (!applicationData.studentInfo?.firstName?.trim()) {
          newErrors.student = 'Student information is incomplete';
        }
        if (!applicationData.guardian1?.fullName?.trim()) {
          newErrors.guardian = 'Guardian information is incomplete';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < STEPS.length) {
        setCurrentStep(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (!currentUser) {
      alert('You must be logged in to submit an application');
      return;
    }

    setIsSubmitting(true);

    try {
      const db = getFirestoreInstance();
      
      // Generate unique application number (ENR-YYYY-XXX format)
      const year = new Date().getFullYear();
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const applicationNumber = `ENR-${year}-${randomSuffix}`;
      
      // Prepare final application data
      const finalApplication: Partial<EnrollmentApplication> = {
        ...applicationData,
        schoolId: schoolId || 'default', // Add schoolId for multi-tenant isolation
        applicationNumber,
        submittedBy: currentUser.email || '',
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'enrollmentApplications'), finalApplication);
      
      console.log('[ApplicationForm] ✅ Application submitted:', docRef.id, 'Application Number:', applicationNumber);

      // Clear localStorage draft
      localStorage.removeItem('enrollment-draft');

      // Show success message with application number
      alert(`🎉 Application submitted successfully!\n\nYour Application Number: ${applicationNumber}\n\nPlease save this number to track your application status.\n\nYou will receive an email notification once your application has been reviewed.`);

      // Redirect to enrollment portal or status page
      navigate('/enrollment/status');
    } catch (error) {
      console.error('[ApplicationForm] ❌ Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;
  const progressPercentage = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <button
            onClick={() => navigate('/enrollment')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back to Enrollment Portal
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Enrollment Application
          </h1>
          <p className="text-gray-600">
            Complete all steps to submit your enrollment application
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-700">
              Step {currentStep} of {STEPS.length}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-between mt-6">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  step.id === currentStep ? 'text-blue-600' : 
                  step.id < currentStep ? 'text-green-600' : 
                  'text-gray-400'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 ${
                    step.id === currentStep
                      ? 'bg-blue-600 text-white'
                      : step.id < currentStep
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.id < currentStep ? '✓' : step.id}
                </div>
                <span className="text-xs text-center hidden sm:block">
                  {step.title.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {STEPS[currentStep - 1].title}
          </h2>
          <p className="text-gray-600 mb-6">
            {STEPS[currentStep - 1].subtitle}
          </p>

          {/* Render current step component */}
          <CurrentStepComponent
            data={applicationData}
            updateData={updateData}
            errors={errors}
          />
        </div>

        {/* Navigation Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-6 py-2 rounded-lg font-semibold ${
                currentStep === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ← Previous
            </button>

            <div className="text-sm text-gray-500">
              Auto-saving your progress...
            </div>

            {currentStep < STEPS.length ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-8 py-2 rounded-lg font-semibold ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {isSubmitting ? 'Submitting...' : '✓ Submit Application'}
              </button>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Need help? Contact us at enrollment@edusync.local</p>
          <p className="mt-2">Your progress is automatically saved</p>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;
