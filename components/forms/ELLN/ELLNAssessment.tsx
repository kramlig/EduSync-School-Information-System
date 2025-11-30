/**
 * ELLN Assessment Component
 * 
 * Early Language, Literacy & Numeracy assessment tool for K-3 students.
 * Evaluates literacy and numeracy domains with proficiency level calculation.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ProficiencyLevel } from '../shared/FormTypes';
import { getCurrentSchoolYear, formatDepEdDate } from '../../../services/dateHelpers';
import { useSchoolContext } from '../../../src/contexts/SchoolContext';
import { useStudentsPostgreSQL } from '../../../src/hooks/useStudentsPostgreSQL';
import { useSectionsPostgreSQL } from '../../../src/hooks/useSectionsPostgreSQL';
import { useELLNPostgreSQL } from '../../../src/hooks/useELLNPostgreSQL';
import { auth } from '../../../src/services/firestoreService';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, HomeIcon, ChevronRightIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface LiteracyScores {
  oralLanguage: number;
  phonologicalAwareness: number;
  bookAndPrintKnowledge: number;
  alphabetKnowledge: number;
  phonics: number;
  comprehension: number;
}

interface NumeracyScores {
  numberSense: number;
  measurement: number;
  geometry: number;
  patterns: number;
  dataAnalysis: number;
}

const INITIAL_LITERACY: LiteracyScores = {
  oralLanguage: 0,
  phonologicalAwareness: 0,
  bookAndPrintKnowledge: 0,
  alphabetKnowledge: 0,
  phonics: 0,
  comprehension: 0,
};

const INITIAL_NUMERACY: NumeracyScores = {
  numberSense: 0,
  measurement: 0,
  geometry: 0,
  patterns: 0,
  dataAnalysis: 0,
};

/**
 * Calculate proficiency level based on overall score
 */
function calculateProficiencyLevel(score: number): ProficiencyLevel {
  if (score >= 90) return 'Advanced';
  if (score >= 80) return 'Proficient';
  if (score >= 65) return 'Approaching';
  if (score >= 50) return 'Developing';
  return 'Beginning';
}

/**
 * Calculate average of domain scores
 */
function calculateAverage(scores: LiteracyScores | NumeracyScores): number {
  const values = Object.values(scores);
  const sum = values.reduce((acc, val) => acc + val, 0);
  return values.length > 0 ? Math.round((sum / values.length) * 10) / 10 : 0;
}

/**
 * Get proficiency level color
 */
function getProficiencyColor(level: ProficiencyLevel): string {
  switch (level) {
    case 'Advanced': return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'Proficient': return 'text-green-600 bg-green-50 border-green-200';
    case 'Approaching': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'Developing': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'Beginning': return 'text-orange-600 bg-orange-50 border-orange-200';
  }
}

export default function ELLNAssessmentComponent() {
  const navigate = useNavigate();
  const { schoolId } = useSchoolContext();
  const { students, loading: studentsLoading } = useStudentsPostgreSQL({ schoolId });
  const { sections, loading: sectionsLoading } = useSectionsPostgreSQL({ schoolId });
  const { createAssessment } = useELLNPostgreSQL({ schoolId });

  // Form state
  const [selectedStudent, setSelectedStudent] = useState('');
  const [quarter, setQuarter] = useState<'q1' | 'q2' | 'q3' | 'q4'>('q1');
  const [literacyScores, setLiteracyScores] = useState<LiteracyScores>(INITIAL_LITERACY);
  const [numeracyScores, setNumeracyScores] = useState<NumeracyScores>(INITIAL_NUMERACY);
  const [notes, setNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [assessorName, setAssessorName] = useState('');
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Searchable dropdown state
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Create student-section mapping for grade levels
  const studentsWithGrade = students.map(s => {
    const section = sections.find(sec => sec.id === s.sectionId);
    return {
      ...s,
      gradeLevel: section?.gradeLevel || 0,
      sectionName: section?.name || 'N/A'
    };
  });

  // Filter K-3 students only (for demo, showing all students since test data is Grade 7-8)
  // TODO: In production, ensure only K-3 students are shown
  const k3Students = studentsWithGrade; // .filter(s => s.gradeLevel >= 0 && s.gradeLevel <= 3);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return k3Students;
    
    const query = searchQuery.toLowerCase();
    return k3Students.filter(s => {
      const name = s.name || `${s.firstName} ${s.middleName || ''} ${s.lastName}`.trim();
      const lrn = s.lrn || '';
      const grade = `grade ${s.gradeLevel}`;
      const section = s.sectionName || '';
      
      return name.toLowerCase().includes(query) ||
             lrn.includes(query) ||
             grade.includes(query) ||
             section.toLowerCase().includes(query);
    });
  }, [searchQuery, k3Students]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsDropdownOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredStudents.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredStudents[highlightedIndex]) {
          handleStudentSelect(filteredStudents[highlightedIndex].id);
        }
        break;
      case 'Escape':
        setIsDropdownOpen(false);
        break;
    }
  };

  // Handle student selection
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudent(studentId);
    setIsDropdownOpen(false);
    setSearchQuery('');
    setHighlightedIndex(0);
  };

  // Calculate scores
  const literacyScore = calculateAverage(literacyScores);
  const numeracyScore = calculateAverage(numeracyScores);
  const overallScore = Math.round(((literacyScore + numeracyScore) / 2) * 10) / 10;
  const proficiencyLevel = calculateProficiencyLevel(overallScore);

  // Get selected student details
  const student = k3Students.find(s => s.id === selectedStudent);

  /**
   * Handle literacy score change
   */
  const handleLiteracyChange = (domain: keyof LiteracyScores, value: string) => {
    const numValue = Math.min(100, Math.max(0, parseInt(value) || 0));
    setLiteracyScores(prev => ({ ...prev, [domain]: numValue }));
  };

  /**
   * Handle numeracy score change
   */
  const handleNumeracyChange = (domain: keyof NumeracyScores, value: string) => {
    const numValue = Math.min(100, Math.max(0, parseInt(value) || 0));
    setNumeracyScores(prev => ({ ...prev, [domain]: numValue }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!selectedStudent) {
      setError('Please select a student');
      return;
    }

    if (!student) {
      setError('Selected student not found');
      return;
    }

    try {
      setSaving(true);

      const currentUser = auth.currentUser;
      const displayName = assessorName || currentUser?.displayName || 'Unknown Teacher';

      const assessmentData = {
        school_id: schoolId,
        student_id: student.id,
        student_name: student.name || `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim(),
        grade_level: student.gradeLevel || 0,
        school_year: getCurrentSchoolYear(),
        quarter,
        literacy_scores: literacyScores,
        numeracy_scores: numeracyScores,
        literacy_score: literacyScore,
        numeracy_score: numeracyScore,
        overall_score: overallScore,
        proficiency_level: proficiencyLevel,
        assessed_by: currentUser?.uid || 'system',
        assessed_by_name: displayName,
        assessment_date: formatDepEdDate(new Date()),
        notes,
        recommendations,
      };

      await createAssessment(assessmentData);
      
      // Force immediate state update and render
      flushSync(() => {
        setSaving(false);
        setError('');
        setSuccess(true);
      });
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSelectedStudent('');
        setLiteracyScores(INITIAL_LITERACY);
        setNumeracyScores(INITIAL_NUMERACY);
        setNotes('');
        setRecommendations('');
        setAssessorName('');
        setSuccess(false);
      }, 3000);

    } catch (err) {
      setSaving(false);
      setSuccess(false);
      setError(err instanceof Error ? err.message : 'Failed to save assessment. Please try again.');
    }
  };

  const loading = studentsLoading || sectionsLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700"
                title="Home"
              >
                <HomeIcon className="h-5 w-5" />
              </button>
            </li>
            <li className="flex items-center">
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              <button
                onClick={() => navigate('/grades')}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                Grades & Reports
              </button>
            </li>
            <li className="flex items-center">
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              <button
                onClick={() => navigate('/reports/elln')}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                ELLN Assessment
              </button>
            </li>
            <li className="flex items-center">
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              <span className="ml-2 text-gray-900 font-medium">Conduct Assessment</span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">ELLN Assessment</h1>
          <p className="mt-2 text-gray-600">
            Early Language, Literacy & Numeracy assessment for K-3 students
          </p>
        </div>

        {/* Success/Error Messages - Top banner (legacy, can be removed if bottom message works) */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-green-800">Assessment saved successfully!</h3>
              <p className="text-sm text-green-700 mt-1">Form will reset in a moment...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <XCircleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student & Quarter Selection */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-visible">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
              <h2 className="text-xl font-bold text-white">Student Information</h2>
              <p className="text-blue-100 text-sm mt-1">Select student and assessment period</p>
            </div>
            
            {/* Selection Form */}
            <div className="p-6 overflow-visible">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Student Selector - Searchable */}
                <div className="space-y-2 relative z-50" ref={dropdownRef}>
                  <label htmlFor="student-search" className="flex items-center text-sm font-semibold text-gray-700">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Student *
                  </label>
                  
                  {/* Search Input */}
                  <div className="relative z-50">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        ref={searchInputRef}
                        type="text"
                        id="student-search"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setIsDropdownOpen(true);
                          setHighlightedIndex(0);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search by name, LRN, grade, or section..."
                        className="w-full pl-10 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 font-medium bg-white hover:border-blue-400"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            searchInputRef.current?.focus();
                          }}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-700"
                          aria-label="Clear search"
                        >
                          <XMarkIcon className="h-5 w-5 text-gray-400" />
                        </button>
                      )}
                    </div>

                    {/* Dropdown Results */}
                    {isDropdownOpen && (
                      <div className="absolute z-[9999] w-full mt-2 bg-white border-2 border-blue-200 rounded-lg shadow-2xl max-h-80 overflow-y-auto">
                        {filteredStudents.length > 0 ? (
                          <ul className="py-1">
                            {filteredStudents.slice(0, 50).map((s, index) => {
                              const isSelected = s.id === selectedStudent;
                              const isHighlighted = index === highlightedIndex;
                              const studentName = s.name || `${s.firstName} ${s.middleName || ''} ${s.lastName}`.trim();
                              
                              return (
                                <li key={s.id}>
                                  <button
                                    type="button"
                                    onClick={() => handleStudentSelect(s.id)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                                      isHighlighted ? 'bg-blue-50' : ''
                                    } ${isSelected ? 'bg-blue-100 border-l-4 border-blue-600' : ''}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-semibold text-gray-900">{studentName}</span>
                                          {isSelected && (
                                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                          )}
                                        </div>
                                        <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
                                          <span className="inline-flex items-center">
                                            <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                            </svg>
                                            Grade {s.gradeLevel === 0 ? 'K' : s.gradeLevel}
                                          </span>
                                          <span className="inline-flex items-center">
                                            <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                            </svg>
                                            {s.sectionName}
                                          </span>
                                          {s.lrn && (
                                            <span className="inline-flex items-center text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                                              LRN: {s.lrn}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                </li>
                              );
                            })}
                            {filteredStudents.length > 50 && (
                              <li className="px-4 py-3 text-sm text-gray-600 bg-gray-50 border-t border-gray-200">
                                Showing first 50 of {filteredStudents.length} results. Type to refine your search.
                              </li>
                            )}
                          </ul>
                        ) : (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                            <p className="font-medium">No students found</p>
                            <p className="text-sm mt-1">Try adjusting your search terms</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex items-center justify-between mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      {k3Students.length} students available
                    </span>
                    <span className="text-xs text-gray-500">
                      Use ↑↓ to navigate, Enter to select
                    </span>
                  </div>

                  {/* Hidden required input for form validation */}
                  <input
                    type="hidden"
                    value={selectedStudent}
                    required
                  />
                </div>

                {/* Quarter Selector */}
                <div className="space-y-2">
                  <label htmlFor="quarter-select" className="flex items-center text-sm font-semibold text-gray-700">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Assessment Period *
                  </label>
                  <div className="relative">
                    <select
                      id="quarter-select"
                      value={quarter}
                      onChange={(e) => setQuarter(e.target.value as any)}
                      className="w-full pl-4 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 font-medium appearance-none bg-white hover:border-blue-400"
                      required
                    >
                      <option value="q1">Quarter 1 (June - August)</option>
                      <option value="q2">Quarter 2 (September - November)</option>
                      <option value="q3">Quarter 3 (December - February)</option>
                      <option value="q4">Quarter 4 (March - May)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Select the current quarter for this assessment
                  </p>
                </div>
              </div>

              {/* Student Details Card */}
              {student && (
                <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {student.name || `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim()}
                        </h3>
                        <p className="text-sm text-gray-600">Learner Reference Number: <span className="font-semibold text-gray-800">{student.lrn || 'N/A'}</span></p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Grade Level</p>
                      <p className="text-lg font-bold text-gray-900">
                        {student.gradeLevel === 0 ? 'Kindergarten' : `Grade ${student.gradeLevel}`}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Section</p>
                      <p className="text-lg font-bold text-gray-900">{student.sectionName || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">School Year</p>
                      <p className="text-lg font-bold text-gray-900">{getCurrentSchoolYear()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Literacy Domains */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Literacy Domains</h2>
              <div className="text-right">
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-blue-600">{literacyScore}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(literacyScores).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(e) => handleLiteracyChange(key as keyof LiteracyScores, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0-100"
                    />
                    <span className="text-gray-500 font-medium w-12">/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Numeracy Domains */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Numeracy Domains</h2>
              <div className="text-right">
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-green-600">{numeracyScore}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(numeracyScores).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(e) => handleNumeracyChange(key as keyof NumeracyScores, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0-100"
                    />
                    <span className="text-gray-500 font-medium w-12">/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overall Score & Proficiency */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Assessment Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Overall Score */}
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Overall Score</p>
                <p className="text-4xl font-bold text-purple-600">{overallScore}</p>
                <p className="text-xs text-gray-500 mt-1">Average of Literacy & Numeracy</p>
              </div>

              {/* Proficiency Level */}
              <div className="text-center p-4">
                <p className="text-sm text-gray-600 mb-2">Proficiency Level</p>
                <div className={`inline-block px-4 py-2 rounded-full border-2 font-semibold ${getProficiencyColor(proficiencyLevel)}`}>
                  {proficiencyLevel}
                </div>
                <div className="mt-3 text-xs text-gray-500 space-y-1">
                  <p>90-100: Advanced</p>
                  <p>80-89: Proficient</p>
                  <p>65-79: Approaching</p>
                  <p>50-64: Developing</p>
                  <p>0-49: Beginning</p>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Literacy</span>
                  <span className="text-lg font-bold text-blue-600">{literacyScore}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Numeracy</span>
                  <span className="text-lg font-bold text-green-600">{numeracyScore}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Recommendations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes & Recommendations</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assessor Name
                </label>
                <input
                  type="text"
                  value={assessorName}
                  onChange={(e) => setAssessorName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Teacher or assessor name (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observations & Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter observations about the student's performance, behavior, engagement, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommendations for Improvement
                </label>
                <textarea
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter recommended interventions, strategies, or areas for focus..."
                />
              </div>
            </div>
          </div>

          {/* Success/Error Messages - Positioned near action buttons */}
          {success && (
            <div className="mt-6 bg-green-50 border-2 border-green-400 rounded-lg p-4 flex items-start animate-pulse">
              <CheckCircleIcon className="h-6 w-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-800 text-lg">✅ Assessment Saved Successfully!</h3>
                <p className="text-sm text-green-700 mt-1">The assessment has been saved to the database. Form will reset in a moment...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-50 border-2 border-red-400 rounded-lg p-4 flex items-start">
              <XCircleIcon className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800 text-lg">❌ Error Saving Assessment</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={() => navigate('/reports/elln')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !selectedStudent}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
