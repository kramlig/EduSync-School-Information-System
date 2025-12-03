/**
 * AssignmentsView - PostgreSQL-based Assignments Management
 * 
 * Optimized and cleaned: Nov 28, 2025
 * - Extracted reusable components
 * - Improved type safety
 * - Removed console.log statements
 * - Better memoization
 * 
 * PostgreSQL Migration: ✅ COMPLETE (Nov 27, 2025)
 * - Uses useAssignmentsPostgreSQL hook
 * - Uses useStudentsPostgreSQL for section students
 * - No Firestore dependencies
 */

import React, { useState, useMemo, useEffect, memo } from 'react';
import type { Assignment, StudentAssignmentGrade, AuthUser, StudentUser, ParentUser } from '../types';
import Modal from './Modal';
import { PencilIcon, TrashIcon, DocumentArrowDownIcon, DocumentArrowUpIcon } from './icons';
import { useSchoolContext } from '../src/contexts/SchoolContext';
import { useAssignmentsPostgreSQL } from '../src/hooks/useAssignmentsPostgreSQL';
import { useStudentsPostgreSQL } from '../src/hooks/useStudentsPostgreSQL';
import { useSectionsPostgreSQL } from '../src/hooks/useSectionsPostgreSQL';
import { useLearningAreasPostgreSQL } from '../src/hooks/useLearningAreasPostgreSQL';

// ============================================================================
// TYPES
// ============================================================================

interface AssignmentStatus {
  text: 'Graded' | 'Submitted' | 'Late' | 'Not Submitted';
  color: string;
}

// ============================================================================
// ICON COMPONENTS
// ============================================================================

const SearchIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
));
SearchIcon.displayName = 'SearchIcon';

const ClockIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
));
ClockIcon.displayName = 'ClockIcon';

const CheckCircleIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
));
CheckCircleIcon.displayName = 'CheckCircleIcon';

const ExclamationIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  </svg>
));
ExclamationIcon.displayName = 'ExclamationIcon';

const StarIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
));
StarIcon.displayName = 'StarIcon';

const PlusIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
));
PlusIcon.displayName = 'PlusIcon';

const EmptyAssignmentsIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-slate-300 mx-auto">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
  </svg>
));
EmptyAssignmentsIcon.displayName = 'EmptyAssignmentsIcon';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getStatus = (assignment: Assignment, grade: StudentAssignmentGrade | undefined): AssignmentStatus => {
  const today = new Date().toISOString().split('T')[0];
  if (grade?.score !== null && grade?.score !== undefined) {
    return { text: 'Graded', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
  }
  if (grade?.submissionDate) {
    return { text: 'Submitted', color: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200' };
  }
  if (today > assignment.dueDate) {
    return { text: 'Late', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' };
  }
  return { text: 'Not Submitted', color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200' };
};

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

/** Styled input component for forms */
const FormInput: React.FC<{
  label: string;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}> = memo(({ label, type = 'text', value, onChange, required, placeholder }) => (
  <div>
    <label className="font-semibold block mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500"
      required={required}
      placeholder={placeholder}
    />
  </div>
));
FormInput.displayName = 'FormInput';

/** Styled textarea component for forms */
const FormTextarea: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}> = memo(({ label, value, onChange, rows = 3, placeholder }) => (
  <div>
    <label className="font-semibold block mb-1">{label}</label>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500"
      rows={rows}
      placeholder={placeholder}
      title={label}
    />
  </div>
));
FormTextarea.displayName = 'FormTextarea';

/** Styled select component for forms */
const FormSelect: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}> = memo(({ label, value, onChange, options, placeholder, disabled }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
));
FormSelect.displayName = 'FormSelect';

/** Stat card component for assignment statistics */
const StatCard: React.FC<{
  value: number;
  label: string;
  variant?: 'default' | 'success' | 'info' | 'danger' | 'muted';
  icon?: React.ReactNode;
}> = memo(({ value, label, variant = 'default', icon }) => {
  const variantClasses = {
    default: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
    info: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400',
    danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
    muted: 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300',
  };

  const labelClasses = {
    default: 'text-slate-600 dark:text-slate-400',
    success: 'text-green-600 dark:text-green-500',
    info: 'text-sky-600 dark:text-sky-500',
    danger: 'text-red-600 dark:text-red-500',
    muted: 'text-slate-600 dark:text-slate-400',
  };

  return (
    <div className={`rounded-lg p-3 border ${variantClasses[variant]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className={`text-xs font-medium flex items-center gap-1 ${labelClasses[variant]}`}>
        {icon}
        {label}
      </div>
    </div>
  );
});
StatCard.displayName = 'StatCard';

/** Loading spinner component */
const LoadingSpinner: React.FC<{ title: string }> = memo(({ title }) => (
  <div>
    <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">{title}</h1>
    <div className="flex items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-lg shadow-md">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500 mb-4" />
        <p className="text-slate-600 dark:text-slate-300">Loading assignments...</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          {navigator.onLine ? 'Fetching data from server...' : 'Loading cached data...'}
        </p>
      </div>
    </div>
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

/** Status badge component */
const StatusBadge: React.FC<{ status: AssignmentStatus }> = memo(({ status }) => (
  <span className={`px-2 py-1 text-xs font-bold rounded-full ${status.color}`}>
    {status.text}
  </span>
));
StatusBadge.displayName = 'StatusBadge';

// Main Component
const AssignmentsView: React.FC<{ 
    session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' },
    forceStudentId?: string,
}> = ({ session, forceStudentId }) => {
    const { schoolId } = useSchoolContext();
    const authUser = session.user as AuthUser;
    const teacherId = session.type === 'staff' ? ((authUser as any).postgresqlId || authUser.id) : undefined;
    
    // Memoize hook options to prevent unnecessary re-renders
    const studentOptions = useMemo(() => ({ schoolId: schoolId || undefined }), [schoolId]);
    const sectionOptions = useMemo(() => ({ schoolId: schoolId || undefined }), [schoolId]);
    
    // Fetch data from PostgreSQL
    const {
        assignments,
        studentAssignmentGrades,
        loading: assignmentsLoading,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        updateAssignmentGrade,
        submitAssignment
    } = useAssignmentsPostgreSQL(teacherId);
    
    const { students, loading: studentsLoading } = useStudentsPostgreSQL(studentOptions);
    const { sections, loading: sectionsLoading } = useSectionsPostgreSQL(sectionOptions);
    const { learningAreas, loading: learningAreasLoading } = useLearningAreasPostgreSQL(schoolId || undefined);
    
    // Safety check for offline mode - ensure data is available
    const isDataLoading = assignmentsLoading || studentsLoading || sectionsLoading || learningAreasLoading;
    
    // Determine user role and relevant student
    const isStaff = session.type === 'staff';
    const isStudent = session.type === 'student';
    const isParent = session.type === 'parent';
    const studentForPortal = useMemo(() => {
        if (isStudent) return session.user as StudentUser;
        if (isParent) return students.find(s => s.id === forceStudentId);
        return null;
    }, [session, students, forceStudentId, isStudent, isParent]);


    // Teacher-specific state
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [selectedLearningAreaId, setSelectedLearningAreaId] = useState<string | null>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'dueDate' | 'title' | 'status'>('dueDate');
    
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [assignmentToEdit, setAssignmentToEdit] = useState<Partial<Assignment> | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [feedbackToEdit, setFeedbackToEdit] = useState<{ studentId: string, feedback: string | null } | null>(null);
    
    // Student-specific state
    const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
    const [assignmentToSubmit, setAssignmentToSubmit] = useState<Assignment | null>(null);
    const [fileName, setFileName] = useState('');

    const isReadOnly = isStaff && authUser.role === 'principal';
    
    // MIGRATED TO POSTGRESQL: Filter sections by adviser
    const visibleSections = useMemo(() => {
        if (!isStaff) return [];
        // Admin, principal, registrar see all sections
        if (['admin', 'principal', 'registrar'].includes(authUser.role)) return sections;
        
        // Teachers see sections they advise
        return sections.filter(s => s.adviserId === teacherId);
    }, [sections, teacherId, isStaff]);
    
    useEffect(() => {
        if (isStaff && !selectedSectionId && visibleSections.length > 0) {
            setSelectedSectionId(visibleSections[0].id);
        }
    }, [visibleSections, selectedSectionId, isStaff]);
    
    const learningAreasForSection = useMemo(() => {
        if (!isStaff || !selectedSectionId) return [];
        // Admin, principal, registrar see all learning areas
        if (['admin', 'principal', 'registrar'].includes(authUser.role)) return learningAreas;
        
        // Get the selected section to check grade level
        const section = sections.find(s => s.id === selectedSectionId);
        if (!section) return [];
        
        // MIGRATED TO POSTGRESQL: Show all learning areas for this grade level
        // gradeLevel is an array like [1,2,3,4,5,6]
        return learningAreas.filter(la => 
            Array.isArray(la.gradeLevel) && la.gradeLevel.includes(section.gradeLevel)
        );
    }, [learningAreas, selectedSectionId, sections, isStaff]);
    
    useEffect(() => {
        if (isStaff && selectedSectionId && !learningAreasForSection.some(la => la.id === selectedLearningAreaId)) {
            setSelectedLearningAreaId(learningAreasForSection[0]?.id || null);
        }
    }, [selectedSectionId, learningAreasForSection, selectedLearningAreaId, isStaff]);

    const filteredAssignments = useMemo(() => {
        if (isStaff) {
            if (!selectedSectionId || !selectedLearningAreaId) return [];
            return assignments.filter((a: Assignment) => a.sectionId === selectedSectionId && a.learningAreaId === selectedLearningAreaId);
        }
        if (studentForPortal) {
            return assignments.filter((a: Assignment) => a.sectionId === studentForPortal.sectionId);
        }
        return [];
    }, [assignments, selectedSectionId, selectedLearningAreaId, studentForPortal, isStaff]);
    
    // Search and sort assignments
    const searchedAndSortedAssignments = useMemo(() => {
        let result = [...filteredAssignments];
        
        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter((a: Assignment) => 
                a.title.toLowerCase().includes(query) ||
                a.description?.toLowerCase().includes(query)
            );
        }
        
        // Apply sorting
        result.sort((a: Assignment, b: Assignment) => {
            if (sortBy === 'dueDate') {
                return a.dueDate.localeCompare(b.dueDate);
            } else if (sortBy === 'title') {
                return a.title.localeCompare(b.title);
            }
            // Status sorting would require calculating status for each
            return 0;
        });
        
        return result;
    }, [filteredAssignments, searchQuery, sortBy]);
    
    // Compute section students from loaded students (no separate fetch needed)
    // IMPORTANT: Define this BEFORE assignmentStats which depends on it
    const sectionStudents = useMemo(() => {
        if (!selectedAssignment || !isStaff) return [];
        return students.filter(s => s.sectionId === selectedAssignment.sectionId);
    }, [selectedAssignment, isStaff, students]);
    
    // Assignment statistics for teacher view
    const assignmentStats = useMemo(() => {
        if (!isStaff || !selectedAssignment || sectionStudents.length === 0) {
            return { total: 0, graded: 0, submitted: 0, late: 0, pending: 0 };
        }
        
        const today = new Date().toISOString().split('T')[0];
        let graded = 0, submitted = 0, late = 0, pending = 0;
        
        sectionStudents.forEach((student) => {
            const grade = studentAssignmentGrades.find((g: StudentAssignmentGrade) => 
                g.assignmentId === selectedAssignment.id && g.studentId === student.id
            );
            
            if (grade?.score !== null && grade?.score !== undefined) {
                graded++;
            } else if (grade?.submissionDate) {
                submitted++;
            } else if (today > selectedAssignment.dueDate) {
                late++;
            } else {
                pending++;
            }
        });
        
        return { total: sectionStudents.length, graded, submitted, late, pending };
    }, [isStaff, selectedAssignment, sectionStudents, studentAssignmentGrades]);
    
    useEffect(() => {
        if (isStaff && !filteredAssignments.some(a => a.id === selectedAssignment?.id)) {
            setSelectedAssignment(null);
        }
    }, [filteredAssignments, selectedAssignment, isStaff]);
    
    // Reset selected assignment when it no longer matches filters
    // (Debug logging removed for production)

    // Portal (Student/Parent) Logic
    const studentAssignmentsByLA = useMemo(() => {
        if (isStaff) return new Map();
        const map = new Map<string, Assignment[]>();
        filteredAssignments.forEach(assignment => {
            if (!map.has(assignment.learningAreaId)) map.set(assignment.learningAreaId, []);
            map.get(assignment.learningAreaId)!.push(assignment);
        });
        return map;
    }, [filteredAssignments, isStaff]);

    const studentGradeMap = useMemo(() => {
        if (isStaff) return new Map();
        const map = new Map<string, StudentAssignmentGrade>();
        studentAssignmentGrades
            .filter(sg => sg.studentId === studentForPortal?.id)
            .forEach(sg => map.set(sg.assignmentId, sg));
        return map;
    }, [studentAssignmentGrades, studentForPortal, isStaff]);

    // Teacher Handlers
    const handleOpenAssignmentModal = (assignment: Assignment | null = null) => {
        setAssignmentToEdit(assignment ? { ...assignment } : { sectionId: selectedSectionId!, learningAreaId: selectedLearningAreaId!, totalPoints: 100 });
        setIsAssignmentModalOpen(true);
    };

    const handleSaveAssignment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignmentToEdit) return;
        
    const { id, title, totalPoints, dueDate, sectionId, learningAreaId } = assignmentToEdit;
        if (!title || !totalPoints || !dueDate || !sectionId || !learningAreaId) {
            alert('Please fill all fields'); return;
        }

        try {
            if (id) {
                await updateAssignment(assignmentToEdit as Assignment);
            } else {
                await addAssignment(assignmentToEdit as Omit<Assignment, 'id'>);
            }
            setIsAssignmentModalOpen(false);
        } catch (error) {
            console.error('Failed to save assignment:', error);
            alert(`Failed to save assignment: ${error}`);
        }
    };

    const handleDeleteAssignment = async () => {
        if (selectedAssignment) {
            await deleteAssignment(selectedAssignment.id);
            setIsDeleteModalOpen(false);
            setSelectedAssignment(null);
        }
    };
    
    const handleScoreChange = async (studentId: string, score: number | null, feedback: string | null) => {
        if (!selectedAssignment) return;
        await updateAssignmentGrade(studentId, selectedAssignment.id, score, feedback);
    };

    // Student Handlers
    const handleOpenSubmissionModal = (assignment: Assignment) => {
        setAssignmentToSubmit(assignment);
        setFileName('');
        setSubmissionModalOpen(true);
    };
    
    const handleFileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (assignmentToSubmit && studentForPortal && fileName) {
            await submitAssignment(studentForPortal.id, assignmentToSubmit.id, fileName);
            setSubmissionModalOpen(false);
        }
    };
    
    // Common
    const title = isStudent ? 'My Assignments' : isParent ? `Assignments for ${studentForPortal?.name}` : 'Assignments';
    
    // Show loading state while data is initializing (important for offline mode)
    if (isDataLoading) {
        return (
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">{title}</h1>
                <div className="flex items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500 mb-4"></div>
                        <p className="text-slate-600 dark:text-slate-300">Loading assignments...</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            {navigator.onLine ? 'Fetching data from server...' : 'Loading cached data...'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    
    // RENDER STAFF VIEW
    if (isStaff) return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Assignments</h1>
                {!isReadOnly && selectedLearningAreaId && (
                    <button 
                        onClick={() => handleOpenAssignmentModal()} 
                        className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Create Assignment
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT SIDEBAR - Filters and Assignment List */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
                    {/* Filters Section */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">Filters</h2>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Class</label>
                                <select 
                                    value={selectedSectionId ?? ''} 
                                    onChange={e => setSelectedSectionId(e.target.value)} 
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    title="Select class"
                                >
                                    <option value="">Select a class...</option>
                                    {visibleSections.map((s: any) => <option key={s.id} value={s.id}>Grade {s.gradeLevel} - {s.name}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Learning Area</label>
                                <select 
                                    value={selectedLearningAreaId ?? ''} 
                                    onChange={e => setSelectedLearningAreaId(e.target.value)} 
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed" 
                                    disabled={!selectedSectionId}
                                    title="Select learning area"
                                >
                                    <option value="">Select a learning area...</option>
                                    {learningAreasForSection.map((la: any) => <option key={la.id} value={la.id}>{la.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    {/* Search and Sort */}
                    {selectedLearningAreaId && filteredAssignments.length > 0 && (
                        <div className="p-4 border-b dark:border-slate-700 space-y-3">
                            <div className="relative">
                                <SearchIcon />
                                <input
                                    type="text"
                                    placeholder="Search assignments..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Sort By</label>
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value as 'dueDate' | 'title' | 'status')}
                                    className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    title="Sort assignments"
                                >
                                    <option value="dueDate">Due Date</option>
                                    <option value="title">Title (A-Z)</option>
                                </select>
                            </div>
                        </div>
                    )}
                    
                    {/* Assignment List */}
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                {searchedAndSortedAssignments.length} Assignment{searchedAndSortedAssignments.length !== 1 ? 's' : ''}
                            </h2>
                        </div>
                        
                        <div className="space-y-2 overflow-y-auto max-h-[500px]">
                            {!selectedSectionId || !selectedLearningAreaId ? (
                                <div className="text-center py-12">
                                    <EmptyAssignmentsIcon />
                                    <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm">
                                        Select a class and learning area to view assignments
                                    </p>
                                </div>
                            ) : searchedAndSortedAssignments.length === 0 ? (
                                <div className="text-center py-12">
                                    <EmptyAssignmentsIcon />
                                    <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm font-medium">
                                        {searchQuery ? 'No assignments match your search' : 'No assignments yet'}
                                    </p>
                                    {!searchQuery && !isReadOnly && (
                                        <button
                                            onClick={() => handleOpenAssignmentModal()}
                                            className="mt-4 text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
                                        >
                                            + Create your first assignment
                                        </button>
                                    )}
                                </div>
                            ) : (
                                searchedAndSortedAssignments.map((a: Assignment) => {
                                    const today = new Date().toISOString().split('T')[0];
                                    const isLate = today > a.dueDate;
                                    const daysUntilDue = Math.ceil((new Date(a.dueDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
                                    
                                    return (
                                        <div 
                                            key={a.id} 
                                            onClick={() => setSelectedAssignment(a)} 
                                            className={`p-3 rounded-lg cursor-pointer border-2 transition-all ${
                                                selectedAssignment?.id === a.id 
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' 
                                                    : 'bg-white dark:bg-slate-700/50 border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-slate-900 dark:text-white text-sm pr-2">{a.title}</h3>
                                                {isLate && (
                                                    <span className="flex-shrink-0 px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
                                                        LATE
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <ClockIcon />
                                                    {isLate ? (
                                                        <span className="text-red-600 dark:text-red-400 font-medium">
                                                            {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) !== 1 ? 's' : ''} overdue
                                                        </span>
                                                    ) : daysUntilDue === 0 ? (
                                                        <span className="text-amber-600 dark:text-amber-400 font-medium">Due today</span>
                                                    ) : daysUntilDue <= 3 ? (
                                                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                                                            Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
                                                        </span>
                                                    ) : (
                                                        <span>Due {a.dueDate}</span>
                                                    )}
                                                </span>
                                                <span className="font-semibold">{a.totalPoints} pts</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
                {/* RIGHT PANEL - Assignment Details and Grading */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
                    {selectedAssignment ? (
                        <>
                            {/* Assignment Header */}
                            <div className="p-6 border-b dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{selectedAssignment.title}</h2>
                                        {selectedAssignment.description && (
                                            <p className="text-slate-600 dark:text-slate-300">{selectedAssignment.description}</p>
                                        )}
                                    </div>
                                    {!isReadOnly && (
                                        <div className="flex items-center gap-2 ml-4">
                                            <button 
                                                onClick={() => handleOpenAssignmentModal(selectedAssignment)} 
                                                className="p-2 text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/30 rounded-lg transition-colors"
                                                title="Edit assignment"
                                                aria-label="Edit assignment"
                                            >
                                                <PencilIcon/>
                                            </button>
                                            <button 
                                                onClick={() => setIsDeleteModalOpen(true)} 
                                                className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                title="Delete assignment"
                                                aria-label="Delete assignment"
                                            >
                                                <TrashIcon/>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <ClockIcon />
                                        <span className="text-slate-700 dark:text-slate-300">
                                            Due: <span className="font-semibold">{selectedAssignment.dueDate}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                        </svg>
                                        <span className="text-slate-700 dark:text-slate-300">
                                            Total: <span className="font-semibold">{selectedAssignment.totalPoints} points</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Statistics Cards */}
                            {assignmentStats.total > 0 && (
                                <div className="grid grid-cols-5 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50">
                                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{assignmentStats.total}</div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Total Students</div>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                                        <div className="text-2xl font-bold text-green-700 dark:text-green-400">{assignmentStats.graded}</div>
                                        <div className="text-xs text-green-600 dark:text-green-500 font-medium flex items-center gap-1">
                                            <CheckCircleIcon />
                                            Graded
                                        </div>
                                    </div>
                                    <div className="bg-sky-50 dark:bg-sky-900/20 rounded-lg p-3 border border-sky-200 dark:border-sky-800">
                                        <div className="text-2xl font-bold text-sky-700 dark:text-sky-400">{assignmentStats.submitted}</div>
                                        <div className="text-xs text-sky-600 dark:text-sky-500 font-medium">Submitted</div>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                                        <div className="text-2xl font-bold text-red-700 dark:text-red-400">{assignmentStats.late}</div>
                                        <div className="text-xs text-red-600 dark:text-red-500 font-medium flex items-center gap-1">
                                            <ExclamationIcon />
                                            Late
                                        </div>
                                    </div>
                                    <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3 border border-slate-300 dark:border-slate-600">
                                        <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{assignmentStats.pending}</div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Pending</div>
                                    </div>
                                </div>
                            )}
                             <div className="overflow-y-auto max-h-[60vh]">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 z-10">
                                        <tr>
                                            <th className="p-2 text-left font-semibold">Student Name</th>
                                            <th className="p-2 text-left font-semibold">Status</th>
                                            <th className="p-2 text-center font-semibold">Score</th>
                                            <th className="p-2 text-center font-semibold">Feedback</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentsLoading ? (
                                            <tr><td colSpan={4} className="p-4 text-center text-slate-500">Loading students...</td></tr>
                                        ) : sectionStudents.length === 0 ? (
                                            <tr><td colSpan={4} className="p-4 text-center text-slate-500">No students found in this section</td></tr>
                                        ) : (
                                            sectionStudents.map((student) => {
                                                const grade = studentAssignmentGrades.find(g => g.assignmentId === selectedAssignment.id && g.studentId === student.id);
                                                const status = getStatus(selectedAssignment, grade);
                                                return (
                                                    <tr key={student.id} className="border-t dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                        <td className="p-2 font-medium">{student.name}</td>
                                                        <td className="p-2">
                                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${status.color}`}>{status.text}</span>
                                                            {grade?.filePath && <a href="#" onClick={(e) => e.preventDefault()} title={grade.filePath} className="ml-2 inline-block align-middle text-slate-500"><DocumentArrowDownIcon/></a>}
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <input
                                                                key={`${selectedAssignment.id}-${student.id}-${grade?.score ?? ''}`}
                                                                type="number"
                                                                defaultValue={grade?.score ?? ''}
                                                                onBlur={(e) => handleScoreChange(student.id, e.target.value === '' ? null : parseInt(e.target.value), grade?.feedback ?? null)}
                                                                disabled={isReadOnly}
                                                                className="w-20 p-1 text-center border rounded-md dark:bg-slate-700 dark:border-slate-600"
                                                                title={`Score for ${student.name}`}
                                                                placeholder="0"
                                                                aria-label={`Score for ${student.name}`}
                                                            />
                                                            <span className="ml-2 text-slate-500">/ {selectedAssignment.totalPoints}</span>
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <button onClick={() => setFeedbackToEdit({studentId: student.id, feedback: grade?.feedback ?? null})} className="text-indigo-600 font-semibold text-xs">
                                                                {grade?.feedback ? 'Edit Feedback' : 'Add Feedback'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : ( <div className="flex items-center justify-center h-full text-slate-500"><p>Select an assignment to view and enter grades.</p></div> )}
                </div>
            </div>
            {/* Modals */}
            <Modal isOpen={isAssignmentModalOpen} onClose={() => setIsAssignmentModalOpen(false)} title={assignmentToEdit?.id ? 'Edit Assignment' : 'Create Assignment'}>
                <form onSubmit={handleSaveAssignment} className="space-y-4">
                    <div>
                        <label className="font-semibold block mb-1">Title</label>
                        <input 
                            type="text" 
                            value={assignmentToEdit?.title ?? ''} 
                            onChange={e => setAssignmentToEdit(p => ({...p, title: e.target.value}))} 
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-transparent dark:text-white" 
                            required
                            title="Assignment title"
                            placeholder="Enter assignment title"
                        />
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">Description</label>
                        <textarea 
                            value={assignmentToEdit?.description ?? ''} 
                            onChange={e => setAssignmentToEdit(p => ({...p, description: e.target.value}))} 
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-transparent dark:text-white"
                            title="Assignment description"
                            placeholder="Enter assignment description (optional)"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="font-semibold block mb-1">Total Points</label>
                            <input 
                                type="number" 
                                value={assignmentToEdit?.totalPoints ?? ''} 
                                onChange={e => setAssignmentToEdit(p => ({...p, totalPoints: parseInt(e.target.value)}))} 
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-transparent dark:text-white" 
                                required
                                title="Total points"
                                placeholder="100"
                            />
                        </div>
                        <div>
                            <label className="font-semibold block mb-1">Due Date</label>
                            <input 
                                type="date" 
                                value={assignmentToEdit?.dueDate ?? ''} 
                                onChange={e => setAssignmentToEdit(p => ({...p, dueDate: e.target.value}))} 
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-transparent dark:text-white" 
                                required
                                title="Due date"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={() => setIsAssignmentModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 font-semibold py-2 px-4 rounded-lg">Cancel</button>
                        <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg">Save</button>
                    </div>
                </form>
            </Modal>
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
                <p>Are you sure you want to delete the assignment <span className="font-bold">{selectedAssignment?.title}</span>? All associated grades will be lost. This cannot be undone.</p>
                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 font-semibold py-2 px-4 rounded-lg">Cancel</button>
                    <button onClick={handleDeleteAssignment} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg">Delete</button>
                </div>
            </Modal>
             <Modal isOpen={!!feedbackToEdit} onClose={() => setFeedbackToEdit(null)} title={`Feedback for ${sectionStudents.find(s => s.id === feedbackToEdit?.studentId)?.name || students.find(s => s.id === feedbackToEdit?.studentId)?.name}`}>
                <textarea
                    value={feedbackToEdit?.feedback ?? ''}
                    onChange={(e) => setFeedbackToEdit(p => p ? {...p, feedback: e.target.value} : null)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-transparent dark:text-white"
                    rows={5}
                    title="Feedback"
                    placeholder="Enter feedback for the student..."
                />
                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={() => setFeedbackToEdit(null)} className="bg-slate-200 dark:bg-slate-600 font-semibold py-2 px-4 rounded-lg">Cancel</button>
                    <button onClick={() => {
                        if(feedbackToEdit && selectedAssignment) {
                            const grade = studentAssignmentGrades.find(g => g.assignmentId === selectedAssignment.id && g.studentId === feedbackToEdit.studentId);
                            handleScoreChange(feedbackToEdit.studentId, grade?.score ?? null, feedbackToEdit.feedback);
                        }
                        setFeedbackToEdit(null);
                    }} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg">Save Feedback</button>
                </div>
            </Modal>
        </div>
    );
    
    // RENDER STUDENT/PARENT VIEW
    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">{title}</h1>
            <div className="space-y-6">
                {Array.from(studentAssignmentsByLA.entries()).map(([laId, laAssignments]) => (
                    <div key={laId}>
                        <h2 className="text-xl font-bold mb-2">{learningAreas.find(la => la.id === laId)?.name}</h2>
                        <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden">
                            <table className="min-w-full">
                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="p-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Assignment</th>
                                        <th className="p-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Due Date</th>
                                        <th className="p-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Status</th>
                                        <th className="p-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Score</th>
                                        <th className="p-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Action / Feedback</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {laAssignments.map((assignment: Assignment) => {
                                        const grade = studentGradeMap.get(assignment.id);
                                        const status = getStatus(assignment, grade);
                                        return (
                                            <tr key={assignment.id} className="border-t dark:border-slate-700">
                                                <td className="p-3 font-medium">{assignment.title}</td>
                                                <td className="p-3 text-slate-500">{assignment.dueDate}</td>
                                                <td className="p-3 text-center"><span className={`px-2 py-1 text-xs font-bold rounded-full ${status.color}`}>{status.text}</span></td>
                                                <td className="p-3 text-center font-semibold">{grade?.score !== null && grade?.score !== undefined ? `${grade.score} / ${assignment.totalPoints}` : '-'}</td>
                                                <td className="p-3">
                                                    {isStudent && status.text !== 'Graded' && status.text !== 'Submitted' && <button onClick={() => handleOpenSubmissionModal(assignment)} className="bg-indigo-600 text-white font-semibold py-1 px-3 rounded-lg text-sm flex items-center"><DocumentArrowUpIcon/><span className="ml-1">Submit Work</span></button>}
                                                    {grade?.feedback && <p className="text-sm italic text-slate-600 dark:text-slate-400">"{grade.feedback}"</p>}
                                                    {grade?.filePath && <p className="text-sm text-slate-500">Submitted: {grade.filePath}</p>}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={submissionModalOpen} onClose={() => setSubmissionModalOpen(false)} title={`Submit: ${assignmentToSubmit?.title}`}>
                <form onSubmit={handleFileSubmit} className="space-y-4">
                    <p className="text-sm text-slate-500">Simulate file upload by providing a filename.</p>
                    <div>
                        <label className="font-semibold block mb-1">Filename</label>
                        <input 
                            type="text" 
                            value={fileName} 
                            onChange={e => setFileName(e.target.value)} 
                            placeholder="e.g., my_homework.pdf" 
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-transparent dark:text-white" 
                            required
                            title="Filename"
                        />
                    </div>
                     <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={() => setSubmissionModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 font-semibold py-2 px-4 rounded-lg">Cancel</button>
                        <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg">Submit</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AssignmentsView;