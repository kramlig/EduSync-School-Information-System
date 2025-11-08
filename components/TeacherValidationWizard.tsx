import React, { useState, useEffect } from 'react';
import { useSchoolData } from '../hooks/useSchoolData';
import type { AuthUser } from '../types';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestoreInstance } from '../src/services/firestoreService';
import { useSchoolContext } from '../src/contexts/SchoolContext';

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
  const { schoolId } = useSchoolContext();
  
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

  // Define validation steps - Comprehensive UAT covering CRUD, offline, and real-world scenarios
  const steps: ValidationStep[] = [
    // ========== SECTION 1: AUTHENTICATION & AUTHORIZATION ==========
    {
      id: 1,
      title: '🔐 Login & Authentication',
      description: 'Verify secure access to the system',
      instructions: [
        'You\'re already logged in! ✅',
        'Your account credentials have been validated',
        'Session is active and secure',
      ],
      validationType: 'auto',
      autoCheck: () => ({
        passed: true,
        message: `✅ Welcome, ${teacher.name}! Authentication successful. Your role: ${teacher.role}`
      }),
      whyMatters: 'Secure authentication prevents unauthorized access to sensitive student data. Your session is encrypted and tracked for audit purposes.'
    },
    {
      id: 2,
      title: '👥 Role-Based Access Control',
      description: 'Verify you see only what you\'re authorized to access',
      instructions: [
        'Look at the sidebar navigation menu',
        'Note which options are available to you',
        'You should NOT see admin-only features (User Management, System Settings)',
      ],
      validationType: 'manual',
      question: 'Do you see only Teacher-appropriate menu items (Dashboard, Students, Grades, Attendance, Lessons)?',
      options: [
        { value: 'yes', label: '✅ Yes, only teacher features visible', isCorrect: true },
        { value: 'admin-visible', label: '⚠️ I see admin features too', isCorrect: false },
        { value: 'missing', label: '❌ Some teacher features are missing', isCorrect: false },
      ],
      whyMatters: 'Role-based access prevents teachers from accidentally accessing admin functions or other teachers\' data, ensuring data privacy and system integrity.'
    },

    // ========== SECTION 2: DATA FILTERING & PRIVACY ==========
    {
      id: 3,
      title: '📊 Student Data Filtering',
      description: 'Verify you see ONLY your assigned students',
      instructions: [
        'Click "Students" in the sidebar',
        'Count the total number of students displayed',
        'Check if you recognize all students as yours',
      ],
      validationType: 'hybrid',
      autoCheck: () => ({
        passed: teacherStudents.length > 0,
        message: `✅ Expected: ${teacherStudents.length} students (from your assigned grade levels).`
      }),
      question: 'Do you see ONLY students from YOUR sections? (Not the entire school)',
      options: [
        { value: 'yes', label: '✅ Yes, only my students', isCorrect: true },
        { value: 'more', label: '⚠️ I see students from other sections too', isCorrect: false },
        { value: 'less', label: '❌ Some of my students are missing', isCorrect: false },
      ],
      whyMatters: 'Data isolation ensures DepEd privacy compliance. Teachers should never access student records outside their teaching assignments.'
    },
    {
      id: 4,
      title: '🏫 Section-Based Filtering',
      description: 'Test section dropdown shows only your assigned sections',
      instructions: [
        'Go to "Grades & Reports" in sidebar',
        'Click on "Section" dropdown filter',
        'Check which grade levels and sections appear',
      ],
      validationType: 'hybrid',
      autoCheck: () => {
        const gradeLevels = [...new Set(teacherSections.map(s => s.gradeLevel))];
        return {
          passed: gradeLevels.length > 0,
          message: `✅ You should see Grade ${gradeLevels.join(', ')} sections only (${teacherSections.length} sections total).`
        };
      },
      question: 'Does the dropdown show ONLY your assigned sections?',
      options: [
        { value: 'yes', label: '✅ Yes, only my sections', isCorrect: true },
        { value: 'other-grades', label: '❌ I see sections from other grade levels', isCorrect: false },
        { value: 'all-sections', label: '❌ I see ALL school sections', isCorrect: false },
      ],
      whyMatters: 'Section filtering prevents cross-contamination of grades and maintains clear teaching boundaries per DepEd guidelines.'
    },
    {
      id: 5,
      title: '📚 Subject/Learning Area Filtering',
      description: 'Verify you see only subjects you teach',
      instructions: [
        'Stay on "Grades & Reports"',
        'Look at subject columns or subject filter dropdown',
        'Note which learning areas appear',
      ],
      validationType: 'hybrid',
      autoCheck: () => ({
        passed: teacherLearningAreas.length > 0,
        message: `✅ Expected subjects: ${teacherLearningAreas.map(la => la.name).join(', ')} (${teacherLearningAreas.length} total)`
      }),
      question: 'Can you grade ONLY the subjects you\'re assigned to teach?',
      options: [
        { value: 'yes', label: '✅ Yes, only my subjects', isCorrect: true },
        { value: 'all-subjects', label: '❌ I see all subjects', isCorrect: false },
        { value: 'wrong-subjects', label: '❌ I see wrong subjects', isCorrect: false },
      ],
      whyMatters: 'Subject specialization is critical - you should only grade subjects where you have domain expertise and teaching authority.'
    },

    // ========== SECTION 3: CRUD OPERATIONS - CREATE ==========
    {
      id: 6,
      title: '✏️ CREATE: Add New Grade',
      description: 'Test ability to enter fresh grades for students',
      instructions: [
        'Go to "Grades & Reports" → "Academic Gradebook"',
        'Find a student with an empty grade cell',
        'Click the cell and enter a test score (e.g., 85)',
        'Press Enter or click outside to save',
        'Wait 2 seconds for confirmation',
      ],
      validationType: 'manual',
      question: 'Were you able to CREATE a new grade entry?',
      options: [
        { value: 'success', label: '✅ Yes, saved instantly with confirmation', isCorrect: true },
        { value: 'delayed', label: '⚠️ Saved but took more than 3 seconds', isCorrect: false },
        { value: 'no-feedback', label: '⚠️ Saved but no visual confirmation', isCorrect: false },
        { value: 'failed', label: '❌ Could not save or got error', isCorrect: false },
      ],
      whyMatters: 'Creating grades is the most frequent teacher action. Instant saves prevent data loss if connection drops unexpectedly.'
    },
    {
      id: 7,
      title: '📝 CREATE: Add Attendance Record',
      description: 'Test marking student attendance',
      instructions: [
        'Click "Attendance" in sidebar',
        'Select today\'s date',
        'Choose one of your sections',
        'Mark a student as "Present" or "Absent"',
        'Observe if it saves automatically',
      ],
      validationType: 'manual',
      question: 'Could you CREATE attendance records successfully?',
      options: [
        { value: 'instant', label: '✅ Yes, saved instantly with visual feedback', isCorrect: true },
        { value: 'slow', label: '⚠️ Saved but felt slow (>2 seconds)', isCorrect: false },
        { value: 'error', label: '❌ Got error or couldn\'t save', isCorrect: false },
      ],
      whyMatters: 'Attendance must be quick - teachers mark 30-40 students daily. Any delay multiplies frustration during morning rush.'
    },

    // ========== SECTION 4: CRUD OPERATIONS - READ ==========
    {
      id: 8,
      title: '👀 READ: View Student Profile',
      description: 'Test accessing complete student information',
      instructions: [
        'Go to "Students" page',
        'Click on any student\'s name',
        'Review the profile page that opens',
        'Check if you see grades, attendance, and personal info',
      ],
      validationType: 'manual',
      question: 'Can you READ complete student data without errors?',
      options: [
        { value: 'complete', label: '✅ Yes, all data loaded quickly and completely', isCorrect: true },
        { value: 'partial', label: '⚠️ Some sections missing or slow to load', isCorrect: false },
        { value: 'error', label: '❌ Error loading or missing critical data', isCorrect: false },
      ],
      whyMatters: 'Quick access to student profiles is essential for parent meetings, guidance counseling, and academic intervention planning.'
    },
    {
      id: 9,
      title: '📈 READ: View Grade Reports',
      description: 'Test reading report cards and grade summaries',
      instructions: [
        'Go to "Grades & Reports" → "Report Cards"',
        'Select a section and grading period',
        'Try to view a student\'s report card',
        'Check if calculations (averages, GPA) are correct',
      ],
      validationType: 'manual',
      question: 'Can you READ report cards with correct calculations?',
      options: [
        { value: 'correct', label: '✅ Yes, all calculations correct and clear', isCorrect: true },
        { value: 'slow', label: '⚠️ Correct but very slow to generate', isCorrect: false },
        { value: 'wrong-calc', label: '❌ Calculations seem incorrect', isCorrect: false },
        { value: 'error', label: '❌ Cannot generate report card', isCorrect: false },
      ],
      whyMatters: 'Report cards are official documents. Calculation errors can affect student promotions, honors eligibility, and academic records.'
    },

    // ========== SECTION 5: CRUD OPERATIONS - UPDATE ==========
    {
      id: 10,
      title: '🔄 UPDATE: Edit Existing Grade',
      description: 'Test modifying previously entered grades',
      instructions: [
        'Return to "Academic Gradebook"',
        'Find the grade you entered in Step 6',
        'Click on it and change to a different value (e.g., 85 → 90)',
        'Press Enter to save',
        'Refresh the page and verify the change persisted',
      ],
      validationType: 'manual',
      question: 'Could you UPDATE the grade and see it persist after refresh?',
      options: [
        { value: 'success', label: '✅ Yes, updated instantly and persisted', isCorrect: true },
        { value: 'reverted', label: '❌ Changed but reverted after refresh', isCorrect: false },
        { value: 'error', label: '❌ Could not update or got error', isCorrect: false },
      ],
      whyMatters: 'Teachers frequently correct grading errors. Updates must be reliable - lost corrections mean inaccurate permanent records.'
    },
    {
      id: 11,
      title: '✏️ UPDATE: Modify Attendance',
      description: 'Test changing attendance records',
      instructions: [
        'Go to "Attendance"',
        'Find the attendance record you created in Step 7',
        'Change it (e.g., Present → Absent or vice versa)',
        'Observe if change saves automatically',
      ],
      validationType: 'manual',
      question: 'Were you able to UPDATE attendance successfully?',
      options: [
        { value: 'yes', label: '✅ Yes, updated with visual confirmation', isCorrect: true },
        { value: 'no-feedback', label: '⚠️ Updated but unclear if saved', isCorrect: false },
        { value: 'failed', label: '❌ Could not update', isCorrect: false },
      ],
      whyMatters: 'Attendance corrections are common (late arrivals marked absent). Reliable updates prevent reporting errors to DepEd.'
    },

    // ========== SECTION 6: CRUD OPERATIONS - DELETE (Soft Delete) ==========
    {
      id: 12,
      title: '🗑️ DELETE: Remove Grade Entry',
      description: 'Test clearing or deleting grades (soft delete)',
      instructions: [
        'In "Academic Gradebook", find a test grade',
        'Try to clear it (backspace/delete key or clear button)',
        'Verify if the system allows removal',
        'Note: Real grades shouldn\'t be easily deleted for audit reasons',
      ],
      validationType: 'manual',
      question: 'What happened when you tried to DELETE a grade?',
      options: [
        { value: 'confirmed', label: '✅ System asked for confirmation before deleting', isCorrect: true },
        { value: 'no-confirm', label: '⚠️ Deleted instantly without confirmation', isCorrect: false },
        { value: 'cant-delete', label: '✅ System prevented deletion (good for audit trail)', isCorrect: true },
        { value: 'error', label: '❌ Got error when trying to delete', isCorrect: false },
      ],
      whyMatters: 'Grade deletion should be restricted or logged. DepEd requires audit trails for all grade changes to prevent fraud.'
    },

    // ========== SECTION 7: OFFLINE-FIRST FUNCTIONALITY ==========
    {
      id: 13,
      title: '📡 Offline Detection',
      description: 'Test if system detects when you go offline',
      instructions: [
        'Turn OFF your WiFi or disconnect internet',
        'Wait 5 seconds',
        'Look for an offline indicator (banner, icon, or message)',
        'Turn WiFi back ON when done',
      ],
      validationType: 'manual',
      question: 'Did the system detect and notify you of offline status?',
      options: [
        { value: 'clear-indicator', label: '✅ Yes, clear offline indicator appeared', isCorrect: true },
        { value: 'subtle', label: '⚠️ Indicator present but hard to notice', isCorrect: false },
        { value: 'none', label: '❌ No offline indicator at all', isCorrect: false },
      ],
      whyMatters: 'Many Philippine schools have unreliable internet. Teachers need clear feedback on connection status to know if their work is being saved.'
    },
    {
      id: 14,
      title: '💾 Offline Data Entry',
      description: 'Test entering data while offline',
      instructions: [
        'Make sure you\'re OFFLINE (WiFi off)',
        'Go to "Academic Gradebook"',
        'Try entering a new grade for any student',
        'Note if you see a "pending sync" or "offline" indicator',
      ],
      validationType: 'manual',
      question: 'Could you enter grades while offline?',
      options: [
        { value: 'works-queued', label: '✅ Yes, works with "pending sync" indicator', isCorrect: true },
        { value: 'works-no-indicator', label: '⚠️ Works but no indicator it\'s queued', isCorrect: false },
        { value: 'blocked', label: '❌ Blocked from entering data offline', isCorrect: false },
      ],
      whyMatters: 'Offline-first design lets teachers continue working during internet outages. Data queues locally and syncs when connection returns.'
    },
    {
      id: 15,
      title: '🔄 Offline-to-Online Sync',
      description: 'Test automatic sync when connection returns',
      instructions: [
        'Turn WiFi back ON',
        'Wait 10 seconds',
        'Check if offline data syncs automatically',
        'Look for sync success confirmation or any errors',
      ],
      validationType: 'manual',
      question: 'Did offline data sync automatically when back online?',
      options: [
        { value: 'auto-success', label: '✅ Yes, synced automatically with confirmation', isCorrect: true },
        { value: 'auto-no-confirm', label: '⚠️ Synced but no confirmation shown', isCorrect: false },
        { value: 'manual-required', label: '⚠️ Had to manually refresh to sync', isCorrect: false },
        { value: 'failed', label: '❌ Data lost or sync failed', isCorrect: false },
      ],
      whyMatters: 'Automatic background sync prevents data loss and reduces teacher burden. Manual syncing is error-prone and often forgotten.'
    },

    // ========== SECTION 8: PERFORMANCE & RESPONSIVENESS ==========
    {
      id: 16,
      title: '⚡ Page Load Speed',
      description: 'Evaluate initial page load and navigation speed',
      instructions: [
        'Navigate between pages: Dashboard → Students → Grades → Attendance',
        'Note how fast each page loads',
        'Refresh the browser and observe reload speed',
      ],
      validationType: 'manual',
      question: 'How would you rate the overall page load speed?',
      options: [
        { value: 'instant', label: '🚀 Instant (<1 second)', isCorrect: true },
        { value: 'fast', label: '✅ Fast (1-2 seconds)', isCorrect: true },
        { value: 'acceptable', label: '⚠️ Acceptable (2-4 seconds)', isCorrect: false },
        { value: 'slow', label: '❌ Slow (>4 seconds)', isCorrect: false },
      ],
      whyMatters: 'Teachers have limited time between classes. Every second counts. Slow systems reduce actual teaching time.'
    },
    {
      id: 17,
      title: '📊 Large Dataset Handling',
      description: 'Test performance with many students',
      instructions: [
        'Go to "Grades & Reports" → "Academic Gradebook"',
        'Select your largest section (most students)',
        'Scroll through the entire grade table',
        'Note if scrolling is smooth or laggy',
      ],
      validationType: 'manual',
      question: 'How did the system handle a full class roster?',
      options: [
        { value: 'smooth', label: '✅ Smooth scrolling, no lag', isCorrect: true },
        { value: 'slight-lag', label: '⚠️ Slight lag but usable', isCorrect: false },
        { value: 'very-laggy', label: '❌ Very laggy or freezes', isCorrect: false },
      ],
      whyMatters: 'Classes can have 40+ students with multiple grading periods. Poor performance with large datasets makes grading painful.'
    },

    // ========== SECTION 9: USER EXPERIENCE & USABILITY ==========
    {
      id: 18,
      title: '🎨 Visual Feedback & Clarity',
      description: 'Evaluate if actions provide clear visual feedback',
      instructions: [
        'Think about all the actions you\'ve performed',
        'Did buttons show hover states?',
        'Were success/error messages clear?',
        'Could you always tell what was happening?',
      ],
      validationType: 'manual',
      question: 'Did the system provide clear visual feedback for your actions?',
      options: [
        { value: 'excellent', label: '✅ Excellent - always knew what was happening', isCorrect: true },
        { value: 'good', label: '👍 Good - mostly clear', isCorrect: true },
        { value: 'confusing', label: '⚠️ Sometimes confusing or unclear', isCorrect: false },
        { value: 'poor', label: '❌ Poor - often didn\'t know if actions worked', isCorrect: false },
      ],
      whyMatters: 'Clear feedback reduces errors and anxiety. Teachers shouldn\'t have to guess if their grade entries were saved.'
    },
    {
      id: 19,
      title: '📱 Mobile Responsiveness (if applicable)',
      description: 'Test mobile device compatibility',
      instructions: [
        'If you have a smartphone or tablet, try accessing the system',
        'If not, resize your browser window to phone size',
        'Try key actions: viewing students, entering grades',
      ],
      validationType: 'manual',
      question: 'How well does the system work on mobile devices?',
      options: [
        { value: 'excellent', label: '✅ Excellent - fully responsive', isCorrect: true },
        { value: 'usable', label: '👍 Usable but not ideal', isCorrect: true },
        { value: 'difficult', label: '⚠️ Difficult to use on mobile', isCorrect: false },
        { value: 'broken', label: '❌ Broken or unusable on mobile', isCorrect: false },
        { value: 'not-tested', label: '➖ Did not test on mobile', isCorrect: true },
      ],
      whyMatters: 'Many teachers only have smartphones. Mobile accessibility ensures equitable access regardless of device availability.'
    },

    // ========== SECTION 10: ERROR HANDLING & EDGE CASES ==========
    {
      id: 20,
      title: '🚨 Error Messages Quality',
      description: 'Evaluate if errors are helpful and user-friendly',
      instructions: [
        'Think about any errors you encountered during testing',
        'Were error messages in plain English/Filipino?',
        'Did they tell you HOW to fix the problem?',
        'If no errors, that\'s excellent!',
      ],
      validationType: 'manual',
      question: 'If you saw errors, were they helpful?',
      options: [
        { value: 'no-errors', label: '✅ No errors encountered - perfect!', isCorrect: true },
        { value: 'helpful', label: '✅ Errors were clear and helpful', isCorrect: true },
        { value: 'cryptic', label: '⚠️ Errors were technical/cryptic', isCorrect: false },
        { value: 'unhelpful', label: '❌ Errors gave no guidance', isCorrect: false },
      ],
      whyMatters: 'Good error messages help teachers self-solve issues. Bad errors require support tickets, wasting everyone\'s time.'
    },
  ];

  // Auto-check current step on mount/change
  useEffect(() => {
    if (currentStep < 0) return; // Skip for tester info screen
    
    const step = steps[currentStep];
    if (step && step.validationType === 'auto' && step.autoCheck) {
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
    if (currentStep < steps.length) {
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
        schoolId: schoolId || 'default'
      });
      
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting validation:', error);
      alert('Failed to submit validation. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = currentStep >= 0 ? ((currentStep + 1) / steps.length) * 100 : 0;
  const completedSteps = Object.keys(answers).length;
  const passedSteps = Object.values(answers).filter(a => a.passed).length;
  const currentStepData = currentStep >= 0 ? steps[currentStep] : null;
  const currentAnswer = currentStepData ? answers[currentStepData.id] : undefined;
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
        {currentStepData && (
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
        )}

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
