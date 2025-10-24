import React, { useState, useEffect } from 'react';
import { useSchoolData } from '../hooks/useSchoolData';
import type { AuthUser } from '../types';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestoreInstance } from '../src/services/firestoreService';

const db = getFirestoreInstance();

// Simple icon components
const Check = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const AlertCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  </svg>
);

const ArrowLeft = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

const ArrowRight = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

const Send = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

interface TeacherValidationWizardProps {
  session: { user: AuthUser, type: 'staff' };
}

interface ValidationStep {
  id: number;
  title: string;
  description: string;
  instructions: string[];
  validationType: 'auto' | 'manual' | 'hybrid';
  autoCheck?: (data: any) => { passed: boolean; message: string };
  question?: string;
  options?: { value: string; label: string; isCorrect: boolean }[];
  whyMatters: string;
}

const TeacherValidationWizard: React.FC<TeacherValidationWizardProps> = ({ session }) => {
  const schoolData = useSchoolData();
  const { students = [], sections = [], learningAreas = [] } = schoolData;
  
  const [currentStep, setCurrentStep] = useState(-1); // Start at -1 for tester info screen
  const [answers, setAnswers] = useState<Record<number, { answer: string; passed: boolean; autoChecked: boolean }>>({});
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Tester identity (for shared test accounts)
  const [testerName, setTesterName] = useState('');
  const [testerEmail, setTesterEmail] = useState('');
  const [testerSchool, setTesterSchool] = useState('');

  // Get teacher details
  const teacher = session.user;
  const teacherAssignments = teacher.assignments || [];
  const teacherGradeLevels = teacherAssignments.map(a => a.gradeLevel);
  const teacherLearningAreaIds = teacherAssignments.map(a => a.learningAreaId);

  // Calculate auto-validation data
  const teacherStudents = students.filter(s => {
    const studentSection = sections.find(sec => sec.id === s.sectionId);
    return studentSection && teacherGradeLevels.includes(studentSection.gradeLevel);
  });

  const teacherSections = sections.filter(s => teacherGradeLevels.includes(s.gradeLevel));
  const teacherLearningAreas = learningAreas.filter(la => teacherLearningAreaIds.includes(la.id));

  // Define validation steps
  const steps: ValidationStep[] = [
    {
      id: 1,
      title: 'Login Successful',
      description: 'Verify you can access the system',
      instructions: [
        'You\'re already logged in! ✅',
        'Your account is active and working',
      ],
      validationType: 'auto',
      autoCheck: () => ({
        passed: true,
        message: `Welcome, ${teacher.name}! Your login is working perfectly.`
      }),
      whyMatters: 'If you can see this page, your login credentials are working correctly.'
    },
    {
      id: 2,
      title: 'Student Count Check',
      description: 'Verify you see the correct number of students',
      instructions: [
        'Click on "Grades & Reports" in the sidebar',
        'Look at the "Overview & Analytics" tab',
        'Check the total number of students shown',
      ],
      validationType: 'hybrid',
      autoCheck: () => ({
        passed: teacherStudents.length > 0,
        message: `✅ You have ${teacherStudents.length} students assigned to you.`
      }),
      question: 'Does the number match what you see on the screen?',
      options: [
        { value: 'yes', label: '✅ Yes, the count matches', isCorrect: true },
        { value: 'no', label: '❌ No, I see a different number', isCorrect: false },
      ],
      whyMatters: 'You should only see YOUR students, not all students in the school.'
    },
    {
      id: 3,
      title: 'Section Filtering',
      description: 'Check if you see only your assigned sections',
      instructions: [
        'Stay on "Grades & Reports"',
        'Look at the "Section" dropdown menu',
        'Check which grade levels appear',
      ],
      validationType: 'hybrid',
      autoCheck: () => {
        const gradeLevels = [...new Set(teacherSections.map(s => s.gradeLevel))];
        return {
          passed: gradeLevels.length > 0,
          message: `✅ You should see Grade ${gradeLevels.join(', ')} sections only.`
        };
      },
      question: 'Do you see ONLY your assigned grade level sections?',
      options: [
        { value: 'yes', label: '✅ Yes, only my grade levels', isCorrect: true },
        { value: 'no', label: '❌ No, I see other grade levels too', isCorrect: false },
      ],
      whyMatters: 'Teachers should only access sections they teach for privacy and security.'
    },
    {
      id: 4,
      title: 'Enter a Grade',
      description: 'Test if you can add grades for students',
      instructions: [
        'Go to "Grades & Reports"',
        'Click "Academic Gradebook" tab',
        'Try entering a test grade for any student',
        'Click outside the field to save',
      ],
      validationType: 'manual',
      question: 'Were you able to enter and save a grade?',
      options: [
        { value: 'yes', label: '✅ Yes, it saved successfully', isCorrect: true },
        { value: 'partial', label: '⚠️ Entered but not sure if saved', isCorrect: false },
        { value: 'no', label: '❌ No, couldn\'t enter or save', isCorrect: false },
      ],
      whyMatters: 'Entering grades is your most frequent task. It must work reliably.'
    },
    {
      id: 5,
      title: 'Edit a Grade',
      description: 'Test if you can modify existing grades',
      instructions: [
        'Stay in "Academic Gradebook"',
        'Find the grade you just entered',
        'Click on it and change the value',
        'Click outside to save the change',
      ],
      validationType: 'manual',
      question: 'Could you edit and update the grade?',
      options: [
        { value: 'yes', label: '✅ Yes, changes saved', isCorrect: true },
        { value: 'no', label: '❌ No, couldn\'t edit', isCorrect: false },
      ],
      whyMatters: 'You need to correct mistakes or update grades as students improve.'
    },
    {
      id: 6,
      title: 'Report Cards Access',
      description: 'Verify Report Cards filtering works',
      instructions: [
        'Click "Report Cards" tab',
        'Check the "Section" dropdown',
        'Try selecting different sections',
      ],
      validationType: 'manual',
      question: 'Does the Report Cards section dropdown show only your sections?',
      options: [
        { value: 'yes', label: '✅ Yes, only my sections', isCorrect: true },
        { value: 'no', label: '❌ No, I see other sections', isCorrect: false },
      ],
      whyMatters: 'Report cards contain private student data - access must be restricted.'
    },
    {
      id: 7,
      title: 'Subject Filtering',
      description: 'Check if you see only your teaching subjects',
      instructions: [
        'Stay on "Grades & Reports"',
        'Look at any subject/learning area filters or columns',
        'Note which subjects appear',
      ],
      validationType: 'hybrid',
      autoCheck: () => ({
        passed: teacherLearningAreas.length > 0,
        message: `✅ You should see ${teacherLearningAreas.length} subject(s): ${teacherLearningAreas.map(la => la.name).join(', ')}`
      }),
      question: 'Do you see only the subjects you teach?',
      options: [
        { value: 'yes', label: '✅ Yes, only my subjects', isCorrect: true },
        { value: 'no', label: '❌ No, I see other subjects', isCorrect: false },
      ],
      whyMatters: 'You should only grade subjects you\'re assigned to teach.'
    },
    {
      id: 8,
      title: 'Overall Performance',
      description: 'Rate your experience with the system',
      instructions: [
        'Think about your overall experience',
        'Consider speed, ease of use, and reliability',
      ],
      validationType: 'manual',
      question: 'How fast and responsive does the system feel?',
      options: [
        { value: 'fast', label: '🚀 Fast and smooth', isCorrect: true },
        { value: 'okay', label: '👍 Acceptable speed', isCorrect: true },
        { value: 'slow', label: '🐌 Slow or laggy', isCorrect: false },
      ],
      whyMatters: 'The system should be fast enough for daily use without frustration.'
    },
  ];

  // Auto-check current step on mount/change
  useEffect(() => {
    const step = steps[currentStep];
    if (step.validationType === 'auto' && step.autoCheck) {
      const result = step.autoCheck(null);
      setAnswers(prev => ({
        ...prev,
        [step.id]: {
          answer: 'auto',
          passed: result.passed,
          autoChecked: true
        }
      }));
    }
  }, [currentStep]);

  const handleAnswer = (stepId: number, value: string, isCorrect: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [stepId]: {
        answer: value,
        passed: isCorrect,
        autoChecked: false
      }
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Save validation results to Firestore
      await addDoc(collection(db, 'validationResults'), {
        teacherId: teacher.id,
        teacherName: teacher.name,
        teacherEmail: teacher.email,
        // Actual tester info (for shared test accounts)
        actualTesterName: testerName,
        actualTesterEmail: testerEmail,
        actualTesterSchool: testerSchool,
        timestamp: serverTimestamp(),
        answers,
        feedback,
        totalSteps: steps.length,
        passedSteps: Object.values(answers).filter(a => a.passed).length,
        autoValidations: {
          studentCount: teacherStudents.length,
          sectionCount: teacherSections.length,
          learningAreaCount: teacherLearningAreas.length,
        },
      });
      
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting validation:', error);
      alert('Failed to submit validation. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const completedSteps = Object.keys(answers).length;
  const passedSteps = Object.values(answers).filter(a => a.passed).length;
  const currentStepData = steps[currentStep];
  const currentAnswer = answers[currentStepData.id];
  const canProceed = currentAnswer !== undefined;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Thank You! 🎉
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Your validation has been submitted successfully.
            </p>
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">Your Results:</h2>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-600">Steps Completed</p>
                  <p className="text-2xl font-bold text-blue-600">{completedSteps}/{steps.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Passed Checks</p>
                  <p className="text-2xl font-bold text-green-600">{passedSteps}/{completedSteps}</p>
                </div>
              </div>
            </div>
            {passedSteps < completedSteps && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <AlertCircle className="inline w-4 h-4 mr-1" />
                  Some checks didn't pass. Our team will review your feedback and reach out if needed.
                </p>
              </div>
            )}
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tester Info Screen (Step -1)
  if (currentStep === -1) {
    const canProceed = testerName.trim().length > 0 && testerEmail.trim().length > 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-blue-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Welcome to Teacher Validation! 🎓
              </h1>
              <p className="text-gray-600">
                Before we start, please tell us who you are
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You're logged in as <strong>{teacher.name}</strong>. 
                If you're testing with a shared account, please enter YOUR actual information below so we can track individual feedback.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={testerName}
                  onChange={(e) => setTesterName(e.target.value)}
                  placeholder="e.g., Juan Dela Cruz"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={testerEmail}
                  onChange={(e) => setTesterEmail(e.target.value)}
                  placeholder="e.g., juan@myschool.edu.ph"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your School Name <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={testerSchool}
                  onChange={(e) => setTesterSchool(e.target.value)}
                  placeholder="e.g., Manila Science High School"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 mt-6">
              <h3 className="font-semibold text-purple-900 mb-2">💡 Why do we need this?</h3>
              <p className="text-purple-800 text-sm">
                Multiple teachers may test using the same account. Your information helps us:
              </p>
              <ul className="text-purple-800 text-sm mt-2 space-y-1 list-disc list-inside">
                <li>Track individual feedback</li>
                <li>Contact you if we have follow-up questions</li>
                <li>Identify which schools are testing</li>
              </ul>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={() => setCurrentStep(0)}
                disabled={!canProceed}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                Start Validation
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Teacher Account Validation 🎓
          </h1>
          <p className="text-gray-600 mb-4">
            Welcome, {teacher.name}! Let's verify your account is set up correctly.
          </p>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
              <div
                className={`bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out absolute left-0 top-0`}
                style={{ width: `${progress}%` } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between items-center overflow-x-auto pb-2">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex flex-col items-center min-w-[60px]">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    idx < currentStep
                      ? 'bg-green-500 text-white'
                      : idx === currentStep
                      ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {idx < currentStep ? <Check className="w-5 h-5" /> : idx + 1}
                </div>
                <span className={`text-xs mt-1 text-center ${idx === currentStep ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>
                  {step.title.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-gray-600">{currentStepData.description}</p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4 md:p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">📋 What to do:</h3>
            <ol className="space-y-2">
              {currentStepData.instructions.map((instruction, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="font-semibold text-blue-600 mr-2">{idx + 1}.</span>
                  <span className="text-gray-700">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Auto Check Result */}
          {currentStepData.autoCheck && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-green-800">{currentStepData.autoCheck(null).message}</p>
              </div>
            </div>
          )}

          {/* Question & Options */}
          {currentStepData.question && currentStepData.options && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">{currentStepData.question}</h3>
              <div className="space-y-3">
                {currentStepData.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(currentStepData.id, option.value, option.isCorrect)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      currentAnswer?.answer === option.value
                        ? option.isCorrect
                          ? 'border-green-500 bg-green-50'
                          : 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                          currentAnswer?.answer === option.value
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {currentAnswer?.answer === option.value && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Why This Matters */}
          <div className="bg-purple-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-purple-900 mb-2">💡 Why this matters:</h3>
            <p className="text-purple-800 text-sm">{currentStepData.whyMatters}</p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>

            {currentStep === steps.length - 1 ? (
              <button
                onClick={() => {
                  // Show feedback form before final submit
                  if (currentAnswer) {
                    const shouldSubmit = window.confirm(
                      'Ready to submit your validation?\n\nYou can add additional comments on the next screen.'
                    );
                    if (shouldSubmit) {
                      handleNext();
                    }
                  }
                }}
                disabled={!canProceed}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                Continue to Submit
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                Next Step
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            )}
          </div>
        </div>

        {/* Feedback Form (shown after last step) */}
        {currentStep === steps.length && (
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Final Step: Your Feedback
            </h2>
            <p className="text-gray-600 mb-4">
              Thank you for completing the validation! Please share any additional comments or issues you encountered:
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Optional: Any problems, suggestions, or things we should know..."
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end mt-6">
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 mr-4"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Validation
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherValidationWizard;
