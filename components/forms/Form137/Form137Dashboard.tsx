/**
 * Form 137 Dashboard
 * 
 * Landing page for Form 137 (Permanent Academic Record)
 * Shows list of students and allows:
 * - Viewing existing Form 137 records
 * - Creating new records
 * - Filtering by grade level, section, school year
 * - Quick access to student records
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form137Service } from '../../../services/formsService';
import { getCurrentSchoolYear, getSchoolYearOptions } from '../../../services/dateHelpers';
import { generateForm137FromSystemData } from '../../../services/form137Generator';
import { useSchoolContext } from '../../../src/contexts/SchoolContext';
import { useStudentsPostgreSQL } from '../../../src/hooks/useStudentsPostgreSQL';
import { useSectionsPostgreSQL } from '../../../src/hooks/useSectionsPostgreSQL';
import type { Student } from '../../../types';
import {
  SectionHeader,
  Badge,
  EmptyState
} from '../shared/FormComponents';
import {
  ErrorState,
  CardSkeleton
} from '../shared/LoadingStates';
import { 
  AcademicCapIcon, 
  UsersIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon
} from '../../icons';

// Eye icon for viewing records
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Plus icon for creating records
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

// Sparkles icon for auto-generate
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

interface StudentRecord {
  studentId: string;
  studentName: string;
  lrn?: string;
  gradeLevel: number;
  section: string;
  recordCount: number;
  latestSchoolYear: string;
  generalAverage?: number;
  promotionStatus?: string;
}

export const Form137Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { schoolId } = useSchoolContext();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]); // All students from database
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(getCurrentSchoolYear());
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<number | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'missing' | 'has'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAutoGenerateModal, setShowAutoGenerateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewWarnings, setPreviewWarnings] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, status: '' });
  const [batchResults, setBatchResults] = useState<{ success: string[], failed: Array<{ student: string, error: string }>, warnings: Array<{ student: string, warning: string }> }>({ success: [], failed: [], warnings: [] });

  // Use PostgreSQL hooks instead of Firestore
  const { students: allStudentsFromDB, loading: studentsLoading } = useStudentsPostgreSQL({ 
    schoolId,
    gradeLevel: selectedGradeLevel === 'all' ? undefined : selectedGradeLevel,
    includeSection: true 
  });
  const { sections, loading: sectionsLoading } = useSectionsPostgreSQL({ schoolId });

  useEffect(() => {
    loadStudentRecords();
  }, [selectedSchoolYear, selectedGradeLevel, schoolId]);

  // Update allStudents when PostgreSQL data changes
  useEffect(() => {
    if (!studentsLoading && allStudentsFromDB.length > 0) {
      // Add computed grade level for compatibility
      const studentsWithGradeLevel = allStudentsFromDB.map(student => {
        const section = sections.find(s => s.id === student.sectionId);
        return {
          ...student,
          _gradeLevel: section?.gradeLevel as number | undefined
        };
      });
      setAllStudents(studentsWithGradeLevel);
    }
  }, [allStudentsFromDB, studentsLoading, sections]);

  const loadStudentRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all Form 137 records (now one per student)
      const allRecords = await Form137Service.getAll();
      
      // Convert cumulative records to display format
      const studentList: StudentRecord[] = allRecords.map(record => {
        // Find the latest year's data or filter by selected school year
        let displayYear = record.schoolYears[record.schoolYears.length - 1]; // Default to latest
        
        // If a specific school year is selected, try to find it
        if (selectedSchoolYear !== getCurrentSchoolYear()) {
          const yearData = record.schoolYears.find(yr => yr.schoolYear === selectedSchoolYear);
          if (yearData) {
            displayYear = yearData;
          }
        }
        
        return {
          studentId: record.studentId,
          studentName: record.studentName,
          lrn: record.lrn,
          gradeLevel: displayYear.gradeLevel,
          section: displayYear.section,
          recordCount: record.schoolYears.length, // Number of years recorded
          latestSchoolYear: displayYear.schoolYear,
          generalAverage: displayYear.generalAverage,
          promotionStatus: displayYear.promotionStatus
        };
      });

      // Filter by grade level if selected
      let filteredList = studentList;
      if (selectedGradeLevel !== 'all') {
        filteredList = studentList.filter(s => s.gradeLevel === selectedGradeLevel);
      }

      // Sort by name
      filteredList.sort((a, b) => a.studentName.localeCompare(b.studentName));

      setStudents(filteredList);
    } catch (err: any) {
      console.error('Error loading student records:', err);
      const errorMessage = err?.message || 'Failed to load student records. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecord = (studentId: string) => {
    navigate(`/reports/form137/${studentId}`);
  };

  const handleCreateRecord = () => {
    navigate('/reports/form137/new');
  };

  const handleAutoGenerate = () => {
    setShowAutoGenerateModal(true);
  };

  const handleGenerateForStudent = async (studentId: string) => {
    try {
      setGenerating(true);
      console.log('Generating Form 137 for student:', studentId);
      
      const result = await generateForm137FromSystemData({
        studentId,
        schoolYear: selectedSchoolYear
      });

      console.log('Generation result:', result);

      if (result.success) {
        // Generator returns different structures based on whether Form 137 exists
        // Store the entire result for handleConfirmSave to process
        setPreviewData(result);
        setPreviewWarnings(result.warnings || []);
        setShowAutoGenerateModal(false);
        setShowPreviewModal(true);
      } else {
        console.error('Generation failed:', result.error);
        alert(`❌ Failed to generate Form 137:\n${result.error}`);
      }
    } catch (error: any) {
      console.error('Error generating Form 137:', error);
      alert(`❌ Error: ${error.message || 'Failed to generate Form 137'}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!previewData) return;
    
    try {
      setGenerating(true);
      
      // Debug logging
      console.log('=== SAVE DEBUG ===');
      console.log('previewData:', JSON.stringify(previewData, null, 2));
      console.log('previewData.isUpdate:', previewData.isUpdate);
      console.log('previewData.data:', previewData.data);
      console.log('previewData.schoolYearData:', previewData.schoolYearData);
      console.log('previewData.studentId:', previewData.studentId);
      console.log('==================');
      
      // Check if this is an update (adding year) or create (new Form 137)
      const isUpdate = previewData.isUpdate === true;
      const studentId = previewData.studentId || previewData.data?.studentId || previewData.existingRecord?.studentId;
      
      console.log('Determined isUpdate:', isUpdate);
      console.log('Determined studentId:', studentId);
      
      if (!studentId) {
        throw new Error('Student ID not found in preview data');
      }
      
      if (isUpdate && previewData.schoolYearData) {
        // Add new year to existing Form 137
        console.log('Calling addSchoolYear...');
        await Form137Service.addSchoolYear(studentId, previewData.schoolYearData);
        console.log('✅ Added school year to existing Form 137');
      } else if (previewData.data) {
        // Create new Form 137 with first year
        console.log('Calling create with data:', previewData.data);
        const docId = await Form137Service.create(previewData.data);
        console.log('✅ Created new Form 137 with ID:', docId);
      } else {
        throw new Error('Invalid preview data structure - missing both data and schoolYearData');
      }
      
      // Show success message
      const warningsText = previewWarnings.length > 0 
        ? '\n\nWarnings:\n' + previewWarnings.join('\n') 
        : '';
      const actionText = isUpdate ? 'School year added' : 'Form 137 created';
      alert(`✅ ${actionText} successfully!${warningsText}`);
      
      // Close modal first
      setShowPreviewModal(false);
      setPreviewData(null);
      setPreviewWarnings([]);
      
      // Give Firestore a moment to propagate, then navigate
      console.log(`Navigating to /reports/form137/${studentId}...`);
      setTimeout(() => {
        navigate(`/reports/form137/${studentId}`);
      }, 500); // Increased to 500ms
    } catch (error: any) {
      console.error('❌ Error saving Form 137:', error);
      alert(`❌ Error: ${error.message || 'Failed to save Form 137'}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleCancelPreview = () => {
    setShowPreviewModal(false);
    setPreviewData(null);
    setPreviewWarnings([]);
    setShowAutoGenerateModal(true); // Go back to student selection
  };

  const handleBatchGenerate = () => {
    setShowBatchModal(true);
    setSelectedStudents(new Set());
    setBatchResults({ success: [], failed: [], warnings: [] });
  };

  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  const selectAllStudents = () => {
    const allIds = new Set(allStudents.map(s => s.id));
    setSelectedStudents(allIds);
  };

  const deselectAllStudents = () => {
    setSelectedStudents(new Set());
  };

  // Get students without Form 137
  const getStudentsWithoutForm137 = () => {
    const studentIdsWithForm = new Set(students.map(s => s.studentId));
    return allStudents.filter(s => !studentIdsWithForm.has(s.id));
  };

  // Select students based on status filter
  const selectByStatus = (status: 'all' | 'missing' | 'has') => {
    if (status === 'missing') {
      const studentsWithoutForm = getStudentsWithoutForm137();
      setSelectedStudents(new Set(studentsWithoutForm.map(s => s.id)));
    } else if (status === 'has') {
      setSelectedStudents(new Set(students.map(s => s.studentId)));
    } else {
      selectAllStudents();
    }
  };

  const handleStartBatchGeneration = async () => {
    if (selectedStudents.size === 0) {
      alert('Please select at least one student');
      return;
    }

    setGenerating(true);
    const studentIds = Array.from(selectedStudents);
    const results = { 
      success: [] as string[], 
      failed: [] as Array<{ student: string, error: string }>,
      warnings: [] as Array<{ student: string, warning: string }>
    };
    
    setBatchProgress({ current: 0, total: studentIds.length, status: 'Starting...' });

    for (let i = 0; i < studentIds.length; i++) {
      const studentId = studentIds[i];
      const student = allStudents.find(s => s.id === studentId);
      const studentName = student?.name || studentId;

      setBatchProgress({ 
        current: i + 1, 
        total: studentIds.length, 
        status: `Generating for ${studentName}...` 
      });

      try {
        const result = await generateForm137FromSystemData({
          studentId,
          schoolYear: selectedSchoolYear
        });

        if (result.success) {
          // Check if this is an update (adding year) or create (new Form 137)
          if (result.isUpdate && result.schoolYearData) {
            await Form137Service.addSchoolYear(studentId, result.schoolYearData);
            results.success.push(studentName);
          } else if (result.data) {
            await Form137Service.create(result.data);
            results.success.push(studentName);
          } else {
            results.failed.push({ student: studentName, error: 'Invalid generation result' });
          }
          
          // Capture warnings
          if (result.warnings && result.warnings.length > 0) {
            result.warnings.forEach((warning: string) => {
              results.warnings.push({ student: studentName, warning });
            });
          }
        } else {
          results.failed.push({ student: studentName, error: result.error || 'Unknown error' });
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Failed to generate';
        results.failed.push({ student: studentName, error: errorMsg });
      }

      // Small delay to prevent overwhelming Firestore
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setBatchResults(results);
    setBatchProgress({ current: studentIds.length, total: studentIds.length, status: 'Complete!' });
    setGenerating(false);

    // Reload the list to show new records
    await loadStudentRecords();
  };

  // Filter students by search query
  const filteredStudents = students.filter(student => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.studentName.toLowerCase().includes(query) ||
      student.lrn?.toLowerCase().includes(query) ||
      student.section.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Form 137 - Permanent Academic Record
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Loading student records...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <ErrorState
          title="Failed to Load Records"
          message={error}
          onRetry={loadStudentRecords}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 p-8 shadow-2xl mb-8">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/50 w-12 h-12 flex items-center justify-center">
                  <ClipboardDocumentListIcon />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                    Form 137
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Permanent Academic Record</p>
                </div>
              </div>
              <p className="text-base text-slate-700 dark:text-slate-300 font-medium ml-1">
                Manage learner's permanent academic records
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAutoGenerate}
                className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/50 hover:scale-105 transition-all duration-300 font-semibold relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center gap-2">
                  <SparklesIcon />
                  <span>Auto-Generate</span>
                </div>
              </button>
              <button
                onClick={handleBatchGenerate}
                className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/50 hover:scale-105 transition-all duration-300 font-semibold relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center gap-2">
                  <UsersIcon />
                  <span>Batch Generate</span>
                </div>
              </button>
              <button
                onClick={handleCreateRecord}
                className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-300 font-semibold relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center gap-2">
                  <PlusIcon />
                  <span>Create Manual</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Premium Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/60 to-white/40 dark:from-slate-800/60 dark:to-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-full blur-2xl -z-10"></div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                <UsersIcon />
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Students</div>
            </div>
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{students.length}</div>
          </div>
          
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/60 to-white/40 dark:from-slate-800/60 dark:to-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-full blur-2xl -z-10"></div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <CalendarDaysIcon />
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">School Year</div>
            </div>
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">{selectedSchoolYear}</div>
          </div>
          
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/60 to-white/40 dark:from-slate-800/60 dark:to-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full blur-2xl -z-10"></div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                <ClipboardDocumentListIcon />
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Records</div>
            </div>
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              {students.reduce((sum, s) => sum + s.recordCount, 0)}
            </div>
          </div>
          
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/60 to-white/40 dark:from-slate-800/60 dark:to-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-full blur-2xl -z-10"></div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                <AcademicCapIcon />
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Average Grade</div>
            </div>
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
              {students.length > 0
                ? Math.round(
                    students.reduce((sum, s) => sum + (s.generalAverage || 0), 0) / students.length
                  )
                : 0}
            </div>
          </div>
        </div>

        {/* Premium Filters */}
        <div className="rounded-2xl bg-gradient-to-br from-white/60 to-white/40 dark:from-slate-800/60 dark:to-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 p-6 shadow-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                🔍 Search Students
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, LRN, or Section"
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

          {/* School Year */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              📅 School Year
            </label>
            <select
              aria-label="Select school year"
              value={selectedSchoolYear}
              onChange={(e) => setSelectedSchoolYear(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-indigo-500 transition-all"
            >
              {getSchoolYearOptions(5).map(sy => (
                <option key={sy} value={sy}>{sy}</option>
              ))}
            </select>
          </div>

          {/* Grade Level */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              🎓 Grade Level
            </label>
            <select
              aria-label="Select grade level"
              value={selectedGradeLevel}
              onChange={(e) => setSelectedGradeLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-indigo-500 transition-all"
            >
              <option value="all">All Grades</option>
              <option value={0}>Kinder</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                <option key={grade} value={grade}>Grade {grade}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              📊 Status
            </label>
            <select
              aria-label="Select status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'missing' | 'has')}
              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-indigo-500 transition-all"
            >
              <option value="all">All Students ({allStudents.length})</option>
              <option value="missing">Missing Form 137 ({getStudentsWithoutForm137().length})</option>
              <option value="has">Has Form 137 ({students.length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student List */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={<div className="w-16 h-16"><ClipboardDocumentListIcon /></div>}
          title="No Records Found"
          message={searchQuery ? `No students found matching "${searchQuery}"` : `No Form 137 records found for school year ${selectedSchoolYear}`}
          action={{
            label: 'Create First Record',
            onClick: handleCreateRecord
          }}
        />
      ) : (
        <>
          <SectionHeader 
            title="Student Records"
            subtitle={`${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''}`}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map(student => (
              <div
                key={student.studentId}
                className="group relative cursor-pointer"
                onClick={() => handleViewRecord(student.studentId)}
              >
                {/* Glassmorphism Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/60 to-white/40 dark:from-slate-800/60 dark:to-slate-800/40 backdrop-blur-xl border-2 border-white/40 dark:border-slate-700/50 p-6 shadow-lg hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300">
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
                  
                  {/* Student Info */}
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 dark:group-hover:from-indigo-400 dark:group-hover:to-purple-400 transition-all duration-300 truncate">
                        {student.studentName}
                      </h3>
                      {student.lrn && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          LRN: {student.lrn}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                      <AcademicCapIcon />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 mb-4 relative z-10">
                    <div className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/30">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Grade Level:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {student.gradeLevel === 0 ? 'Kinder' : `Grade ${student.gradeLevel}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/30">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Section:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {student.section}
                      </span>
                    </div>
                    {student.generalAverage && (
                      <div className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Gen. Average:</span>
                        <span className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                          {student.generalAverage}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t-2 border-slate-200/50 dark:border-slate-700/50 relative z-10">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        label={`${student.recordCount} record${student.recordCount !== 1 ? 's' : ''}`}
                        color="gray"
                        size="sm"
                      />
                      {student.promotionStatus && (
                        <Badge 
                          label={student.promotionStatus}
                          color={
                            student.promotionStatus === 'PROMOTED' ? 'green' :
                            student.promotionStatus === 'RETAINED' ? 'red' : 'yellow'
                          }
                          size="sm"
                        />
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewRecord(student.studentId);
                      }}
                      className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400 hover:from-indigo-500/30 hover:to-purple-500/30 hover:scale-110 transition-all duration-300"
                      aria-label={`View ${student.studentName}'s Form 137 record`}
                    >
                      <EyeIcon />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Auto-Generate Modal */}
      {showAutoGenerateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <SparklesIcon />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Auto-Generate Form 137</h2>
                    <p className="text-amber-100 text-sm">Generate from existing grades, attendance, and core values</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAutoGenerateModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  disabled={generating}
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">✨ How Auto-Generation Works:</h3>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                  <li>• Pulls quarterly grades from the grades module</li>
                  <li>• Calculates attendance from attendance records</li>
                  <li>• Includes core values assessments</li>
                  <li>• Computes general average and promotion status automatically</li>
                  <li>• Saves time - no manual data entry needed!</li>
                </ul>
              </div>

              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Select a student to generate Form 137:</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allStudents.map(student => {
                  // Check if student already has a Form 137 record
                  const existingRecord = students.find(s => s.studentId === student.id);
                  
                  return (
                    <button
                      key={student.id}
                      onClick={() => handleGenerateForStudent(student.id)}
                      disabled={generating}
                      className="text-left p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-semibold text-slate-900 dark:text-white">{student.name}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {student.lrn && <div>LRN: {student.lrn}</div>}
                        {student.sectionId && <div>Section ID: {student.sectionId}</div>}
                        {existingRecord && (
                          <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            ⚠️ Already has {existingRecord.recordCount} record(s) for {existingRecord.latestSchoolYear}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {allStudents.length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No students found in database. Please add students first.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-slate-900 p-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowAutoGenerateModal(false)}
                disabled={generating}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewData && (() => {
        // Extract display data from the result structure
        const isUpdate = previewData.isUpdate === true;
        const yearData = previewData.schoolYearData;
        const existingRecord = previewData.existingRecord;
        const newRecord = previewData.data;
        
        // Get student info and year data to display
        const studentInfo = isUpdate ? existingRecord : newRecord;
        const displayData = yearData || (newRecord?.schoolYears?.[0]);
        
        return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {isUpdate ? 'Preview New School Year' : 'Preview New Form 137'}
                  </h2>
                  <p className="text-indigo-100 text-sm">
                    {isUpdate 
                      ? 'Adding a new year to existing Form 137' 
                      : 'Creating a new Form 137 with first year'}
                  </p>
                </div>
                <button
                  onClick={handleCancelPreview}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  disabled={generating}
                  aria-label="Close preview"
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body - Preview Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
              {/* Warnings */}
              {previewWarnings.length > 0 && (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">⚠️ Warnings:</h3>
                  <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                    {previewWarnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Student Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Student Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Student Name</div>
                    <div className="font-semibold text-slate-900 dark:text-white">{studentInfo?.studentName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">LRN</div>
                    <div className="font-semibold text-slate-900 dark:text-white">{studentInfo?.lrn || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Grade Level</div>
                    <div className="font-semibold text-slate-900 dark:text-white">Grade {displayData?.gradeLevel}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Section</div>
                    <div className="font-semibold text-slate-900 dark:text-white">{displayData?.section}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">School Year</div>
                    <div className="font-semibold text-slate-900 dark:text-white">{displayData?.schoolYear}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">General Average</div>
                    <div className="font-semibold text-slate-900 dark:text-white">{displayData?.generalAverage?.toFixed(2) || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Grades Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Grades ({displayData?.grades?.length || 0} subjects)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-900">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">Subject</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">Q1</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">Q2</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">Q3</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">Q4</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">Final</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {displayData?.grades?.map((grade: any, index: number) => (
                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                          <td className="px-3 py-2 text-slate-900 dark:text-white">{grade.learningAreaName}</td>
                          <td className="px-3 py-2 text-center text-slate-700 dark:text-slate-300">{grade.q1 || '-'}</td>
                          <td className="px-3 py-2 text-center text-slate-700 dark:text-slate-300">{grade.q2 || '-'}</td>
                          <td className="px-3 py-2 text-center text-slate-700 dark:text-slate-300">{grade.q3 || '-'}</td>
                          <td className="px-3 py-2 text-center text-slate-700 dark:text-slate-300">{grade.q4 || '-'}</td>
                          <td className="px-3 py-2 text-center font-semibold text-slate-900 dark:text-white">{grade.finalGrade || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Attendance */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Attendance</h3>
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Days of School</div>
                    <div className="font-semibold text-slate-900 dark:text-white">{displayData?.daysOfSchool || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Days Present</div>
                    <div className="font-semibold text-slate-900 dark:text-white">{displayData?.daysPresent || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Attendance Rate</div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {displayData?.daysOfSchool && displayData.daysOfSchool > 0 
                        ? ((displayData.daysPresent / displayData.daysOfSchool) * 100).toFixed(1) + '%'
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Core Values */}
              {displayData?.coreValues && displayData.coreValues.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Core Values ({displayData.coreValues.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {displayData.coreValues.map((cv: any, index: number) => (
                      <div key={index} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div className="text-xs text-slate-500 dark:text-slate-400">{cv.valueName}</div>
                        <div className="font-semibold text-slate-900 dark:text-white">{cv.rating}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Promotion Status */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Promotion Status</h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    Status: <span className={`font-semibold ${displayData?.promotionStatus === 'Promoted' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {displayData?.promotionStatus || 'Not Set'}
                    </span>
                  </div>
                  {displayData?.remarks && (
                    <div className="text-sm text-slate-700 dark:text-slate-300 mt-2">
                      Remarks: {displayData.remarks}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-slate-900 p-6 flex justify-between gap-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleCancelPreview}
                disabled={generating}
                className="px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors disabled:opacity-50"
              >
                ← Back to Student Selection
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setPreviewData(null);
                    setPreviewWarnings([]);
                  }}
                  disabled={generating}
                  className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSave}
                  disabled={generating}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 font-semibold shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      ✓ Confirm & Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Batch Generate Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <UsersIcon />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Batch Generate Form 137</h2>
                    <p className="text-green-100 text-sm">Generate for multiple students at once</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowBatchModal(false);
                    setSelectedStudents(new Set());
                    setBatchResults({ success: [], failed: [], warnings: [] });
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  disabled={generating}
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Progress Section */}
              {generating && (
                <div className="mb-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-green-900 dark:text-green-100">
                      {batchProgress.status}
                    </span>
                    <span className="text-sm text-green-700 dark:text-green-300">
                      {batchProgress.current} / {batchProgress.total}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-green-200 dark:bg-green-900 rounded-full h-3 overflow-hidden mb-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 transition-all duration-300"
                      style={{ width: (batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : 0) + '%' }}
                    />
                  </div>

                  {/* Progress Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-700 dark:text-green-300 font-medium">
                        Success Rate:
                      </span>
                      <span className="ml-2 text-green-900 dark:text-green-100 font-semibold">
                        {batchProgress.current > 0 
                          ? `${Math.round((batchResults.success.length / batchProgress.current) * 100)}%`
                          : '0%'
                        }
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-green-700 dark:text-green-300 font-medium">
                        Remaining:
                      </span>
                      <span className="ml-2 text-green-900 dark:text-green-100 font-semibold">
                        {batchProgress.total - batchProgress.current}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Section */}
              {!generating && (batchResults.success.length > 0 || batchResults.failed.length > 0 || batchResults.warnings.length > 0) && (
                <div className="mb-6 space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {batchResults.success.length}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Success
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
                      <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                        {batchResults.warnings.length}
                      </div>
                      <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        Warnings
                      </div>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                        {batchResults.failed.length}
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                        Failed
                      </div>
                    </div>
                  </div>

                  {batchResults.success.length > 0 && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                        ✅ Successfully Generated ({batchResults.success.length})
                      </h3>
                      <div className="text-sm text-green-800 dark:text-green-200 max-h-32 overflow-y-auto">
                        {batchResults.success.map((name, idx) => (
                          <div key={idx}>• {name}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {batchResults.warnings.length > 0 && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                        ⚠️ Generated with Warnings ({batchResults.warnings.length})
                      </h3>
                      <div className="text-sm text-amber-800 dark:text-amber-200 max-h-32 overflow-y-auto space-y-1">
                        {batchResults.warnings.map((item, idx) => (
                          <div key={idx}>
                            <strong>• {item.student}:</strong> {item.warning}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {batchResults.failed.length > 0 && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                        ❌ Failed ({batchResults.failed.length})
                      </h3>
                      <div className="text-sm text-red-800 dark:text-red-200 max-h-32 overflow-y-auto space-y-1">
                        {batchResults.failed.map((item, idx) => (
                          <div key={idx}>
                            <strong>• {item.student}:</strong> {item.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        // Generate CSV report
                        const csvData = [
                          ['Student Name', 'Status', 'Message', 'Timestamp'],
                          ...batchResults.success.map(name => [name, 'Success', 'Form 137 generated successfully', new Date().toLocaleString()]),
                          ...batchResults.warnings.map(item => [item.student, 'Warning', item.warning, new Date().toLocaleString()]),
                          ...batchResults.failed.map(item => [item.student, 'Failed', item.error, new Date().toLocaleString()])
                        ];
                        
                        const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        const url = URL.createObjectURL(blob);
                        link.setAttribute('href', url);
                        link.setAttribute('download', `form137_batch_report_${new Date().toISOString().split('T')[0]}.csv`);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="flex-1 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 font-medium transition-colors"
                    >
                      📥 Download CSV Report
                    </button>
                    <button
                      onClick={() => {
                        setShowBatchModal(false);
                        setSelectedStudents(new Set());
                        setBatchResults({ success: [], failed: [], warnings: [] });
                      }}
                      className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 font-medium transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Student Selection */}
              {!generating && batchResults.success.length === 0 && batchResults.failed.length === 0 && (
                <>
                  <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">📋 How Batch Generation Works:</h3>
                    <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                      <li>• Select multiple students or use "Select All"</li>
                      <li>• Click "Start Batch Generation" to begin</li>
                      <li>• System will generate Form 137 for each student automatically</li>
                      <li>• View progress and results in real-time</li>
                      <li>• Duplicates are automatically skipped</li>
                    </ul>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Select Students ({selectedStudents.size} selected)
                    </h3>
                    <div className="flex gap-2">
                      <select
                        onChange={(e) => selectByStatus(e.target.value as 'all' | 'missing' | 'has')}
                        className="px-3 py-1.5 text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 font-medium transition-colors border-none cursor-pointer"
                        value=""
                        aria-label="Quick select students by status"
                      >
                        <option value="">⚡ Quick Select...</option>
                        <option value="all">All Students ({allStudents.length})</option>
                        <option value="missing">Missing Form 137 ({getStudentsWithoutForm137().length})</option>
                        <option value="has">Has Form 137 ({students.length})</option>
                      </select>
                      <button
                        onClick={selectAllStudents}
                        className="px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 font-medium transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        onClick={deselectAllStudents}
                        className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 font-medium transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-2">
                    {allStudents.map(student => {
                      const isSelected = selectedStudents.has(student.id);
                      const existingRecord = students.find(s => s.studentId === student.id);
                      
                      return (
                        <button
                          key={student.id}
                          onClick={() => toggleStudentSelection(student.id)}
                          className={`text-left p-4 border-2 rounded-lg transition-all duration-200 ${
                            isSelected
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-green-300 hover:bg-green-50/50 dark:hover:bg-green-900/10'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected 
                                ? 'bg-green-500 border-green-500' 
                                : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-slate-900 dark:text-white truncate">{student.name}</div>
                              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-0.5">
                                {student.lrn && <div>LRN: {student.lrn}</div>}
                                {student.sectionId && <div>Section: {student.sectionId}</div>}
                                {existingRecord && (
                                  <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                    ⚠️ Has {existingRecord.recordCount} record(s)
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {allStudents.length === 0 && (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                      No students found in database. Please add students first.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!generating && batchResults.success.length === 0 && batchResults.failed.length === 0 && (
              <div className="bg-slate-50 dark:bg-slate-900 p-6 flex justify-between gap-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setShowBatchModal(false);
                    setSelectedStudents(new Set());
                  }}
                  className="px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartBatchGeneration}
                  disabled={selectedStudents.size === 0}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <SparklesIcon />
                  Start Batch Generation ({selectedStudents.size})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Form137Dashboard;
