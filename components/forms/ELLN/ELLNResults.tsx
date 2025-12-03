/**
 * ELLN Results Viewer
 * 
 * View individual student assessment results with quarterly trends,
 * domain breakdowns, proficiency levels, and class comparisons.
 * 
 * ✅ MIGRATED TO POSTGRESQL (November 25, 2025)
 * ✅ OPTIMIZED (November 25, 2025)
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProficiencyLevel } from '../shared/FormTypes';
import { useSchoolContext } from '../../../src/contexts/SchoolContext';
import { useStudentsPostgreSQL } from '../../../src/hooks/useStudentsPostgreSQL';
import { useSectionsPostgreSQL } from '../../../src/hooks/useSectionsPostgreSQL';
import { useELLNPostgreSQL, ELLNAssessment as PostgresELLNAssessment } from '../../../src/hooks/useELLNPostgreSQL';
import { 
  ChartBarIcon,
  AcademicCapIcon,
  TrophyIcon,
  HomeIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

/**
 * Local type for component-level usage (matches Firestore format for backward compatibility)
 */
interface ELLNAssessment {
  id: string;
  studentId: string;
  studentName: string;
  gradeLevel: number;
  schoolYear: string;
  quarter: 'q1' | 'q2' | 'q3' | 'q4';
  literacy: {
    oralLanguage: number;
    phonologicalAwareness: number;
    bookAndPrintKnowledge: number;
    alphabetKnowledge: number;
    phonics: number;
    comprehension: number;
  };
  numeracy: {
    numberSense: number;
    measurement: number;
    geometry: number;
    patterns: number;
    dataAnalysis: number;
  };
  literacyScore: number;
  numeracyScore: number;
  overallScore: number;
  proficiencyLevel: ProficiencyLevel;
  assessedBy: string;
  assessedByName: string;
  assessmentDate: string;
  notes?: string;
  recommendations?: string;
}

/**
 * Convert PostgreSQL format to component format
 */
function mapPostgresToComponent(pgAssessment: PostgresELLNAssessment): ELLNAssessment {
  return {
    id: pgAssessment.id,
    studentId: pgAssessment.student_id,
    studentName: pgAssessment.student_name,
    gradeLevel: pgAssessment.grade_level,
    schoolYear: pgAssessment.school_year,
    quarter: pgAssessment.quarter,
    literacy: pgAssessment.literacy_scores,
    numeracy: pgAssessment.numeracy_scores,
    literacyScore: pgAssessment.literacy_score,
    numeracyScore: pgAssessment.numeracy_score,
    overallScore: pgAssessment.overall_score,
    proficiencyLevel: pgAssessment.proficiency_level,
    assessedBy: pgAssessment.assessed_by,
    assessedByName: pgAssessment.assessed_by_name,
    assessmentDate: pgAssessment.assessment_date,
    notes: pgAssessment.notes,
    recommendations: pgAssessment.recommendations
  };
}

/**
 * Get proficiency level color classes
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

/**
 * Calculate growth rate between two scores
 */
function calculateGrowth(oldScore: number, newScore: number): number {
  if (oldScore === 0) return 0;
  return Math.round(((newScore - oldScore) / oldScore) * 100);
}

/**
 * Get domain names in order
 */
const literacyDomains = [
  { key: 'oralLanguage', label: 'Oral Language' },
  { key: 'phonologicalAwareness', label: 'Phonological Awareness' },
  { key: 'bookAndPrintKnowledge', label: 'Book & Print Knowledge' },
  { key: 'alphabetKnowledge', label: 'Alphabet Knowledge' },
  { key: 'phonics', label: 'Phonics' },
  { key: 'comprehension', label: 'Comprehension' }
];

const numeracyDomains = [
  { key: 'numberSense', label: 'Number Sense' },
  { key: 'measurement', label: 'Measurement' },
  { key: 'geometry', label: 'Geometry' },
  { key: 'patterns', label: 'Patterns & Algebra' },
  { key: 'dataAnalysis', label: 'Data Analysis' }
];

interface ELLNResultsProps {
  session: { user: any; type: 'staff' };
}

export default function ELLNResults({ session }: ELLNResultsProps) {
  const navigate = useNavigate();
  const { schoolId } = useSchoolContext();
  
  // Get teacher ID from session
  const authUser = session.user;
  const teacherId = (authUser as any).postgresqlId || authUser.id;
  const isStaff = ['admin', 'principal', 'registrar'].includes(authUser.role);

  // State
  const [selectedStudent, setSelectedStudent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // PostgreSQL data hooks
  const { students: pgStudents, loading: studentsLoading } = useStudentsPostgreSQL({ 
    schoolId,
    includeSection: true 
  });
  const { sections: pgSections } = useSectionsPostgreSQL({ schoolId });
  const { 
    assessments: pgAssessments, 
    loading: assessmentsLoading,
    error: assessmentsError
  } = useELLNPostgreSQL({ 
    schoolId,
    studentId: selectedStudent || undefined
  });
  
  // TEACHER FILTER: Get teacher's sections
  const teacherSections = useMemo(() => {
    if (isStaff) return pgSections; // Admins see all
    return pgSections.filter(s => s.adviserId === teacherId);
  }, [pgSections, teacherId, isStaff]);
  
  const teacherSectionIds = useMemo(() => 
    teacherSections.map(s => s.id),
    [teacherSections]
  );
  
  // Filter students to teacher's sections
  const teacherStudents = useMemo(() => {
    if (isStaff) return pgStudents; // Admins see all
    return pgStudents.filter(s => teacherSectionIds.includes(s.sectionId));
  }, [pgStudents, teacherSectionIds, isStaff]);

  // Memoize student-section mapping
  const studentsWithGrade = useMemo(() => {
    return teacherStudents.map(s => {
      const section = pgSections.find(sec => sec.id === s.sectionId);
      return {
        id: s.id,
        name: s.name || `${s.first_name} ${s.middle_name || ''} ${s.last_name}`.trim(),
        lrn: s.lrn,
        gradeLevel: section?.grade_level || 0,
        sectionName: section?.name || 'N/A'
      };
    });
  }, [teacherStudents, pgSections]);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentsWithGrade;
    
    const query = searchQuery.toLowerCase();
    return studentsWithGrade.filter(s => {
      const name = s.name.toLowerCase();
      const lrn = s.lrn || '';
      const grade = `grade ${s.gradeLevel}`;
      const section = s.sectionName.toLowerCase();
      
      return name.includes(query) ||
             lrn.includes(query) ||
             grade.includes(query) ||
             section.includes(query);
    });
  }, [searchQuery, studentsWithGrade]);

  // Convert and sort assessments
  const assessments = useMemo(() => {
    if (!selectedStudent || !pgAssessments.length) return [];
    
    const converted = pgAssessments.map(mapPostgresToComponent);
    return converted.sort((a, b) => {
      const quarterOrder = { q1: 1, q2: 2, q3: 3, q4: 4 };
      return quarterOrder[a.quarter] - quarterOrder[b.quarter];
    });
  }, [selectedStudent, pgAssessments]);

  // Get selected student
  const student = useMemo(() => 
    studentsWithGrade.find(s => s.id === selectedStudent),
    [studentsWithGrade, selectedStudent]
  );

  // Calculate quarter-over-quarter growth
  const quarterlyGrowth = useMemo(() => {
    if (assessments.length < 2) return 0;
    return calculateGrowth(
      assessments[0].overallScore, 
      assessments[assessments.length - 1].overallScore
    );
  }, [assessments]);

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

  // Handle student selection
  const handleStudentSelect = useCallback((studentId: string) => {
    setSelectedStudent(studentId);
    setIsDropdownOpen(false);
    setSearchQuery('');
    setHighlightedIndex(0);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
  }, [isDropdownOpen, filteredStudents, highlightedIndex, handleStudentSelect]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <span className="ml-2 text-gray-900 font-medium">View Results</span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">ELLN Results Viewer</h1>
          <p className="mt-2 text-gray-600">
            View student assessment results and track progress over time
          </p>
        </div>

        {/* Student Selector - Searchable */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-visible p-6 mb-6">
          <div className="space-y-2 relative z-50" ref={dropdownRef}>
            <label htmlFor="student-search" className="flex items-center text-sm font-semibold text-gray-700">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Select Student
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
                {studentsWithGrade.length} students available
              </span>
              <span className="text-xs text-gray-500">
                Use ↑↓ to navigate, Enter to select
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {assessmentsError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Failed to load assessment data</p>
          </div>
        )}

        {/* Loading State */}
        {(studentsLoading || assessmentsLoading) && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading assessment data...</p>
          </div>
        )}

        {/* Student Profile & Results */}
        {student && !studentsLoading && !assessmentsLoading && (
          <>
            {/* No Assessments State */}
            {assessments.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments found</h3>
                <p className="text-gray-600 mb-6">
                  This student has not been assessed yet. Conduct an assessment to see results here.
                </p>
                <button
                  onClick={() => navigate('/reports/elln/assessment')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Conduct Assessment
                </button>
              </div>
            )}

            {/* Student Profile Card */}
            {assessments.length > 0 && (
              <>
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        <AcademicCapIcon className="h-10 w-10 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {student.name || `${student.firstName} ${student.middleName || ''} ${student.lastName}`}
                        </h2>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">LRN:</span> {student.lrn || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Grade:</span> {student.gradeLevel === 0 ? 'Kindergarten' : `Grade ${student.gradeLevel}`}
                          </div>
                          <div>
                            <span className="font-medium">Section:</span> {student.sectionName}
                          </div>
                          <div>
                            <span className="font-medium">Assessments:</span> {assessments.length} quarter{assessments.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Latest Proficiency Badge */}
                    {assessments.length > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-gray-600 mb-2">Current Level</p>
                        <div className={`inline-block px-4 py-2 rounded-full border-2 font-semibold ${getProficiencyColor(assessments[assessments.length - 1].proficiencyLevel)}`}>
                          {assessments[assessments.length - 1].proficiencyLevel}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  {/* Latest Overall Score */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Overall Score</p>
                        <p className="text-3xl font-bold text-purple-600 mt-1">
                          {assessments[assessments.length - 1].overallScore}
                        </p>
                      </div>
                      <TrophyIcon className="h-8 w-8 text-purple-400" />
                    </div>
                  </div>

                  {/* Latest Literacy Score */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Literacy</p>
                        <p className="text-3xl font-bold text-blue-600 mt-1">
                          {assessments[assessments.length - 1].literacyScore}
                        </p>
                      </div>
                      <ChartBarIcon className="h-8 w-8 text-blue-400" />
                    </div>
                  </div>

                  {/* Latest Numeracy Score */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Numeracy</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">
                          {assessments[assessments.length - 1].numeracyScore}
                        </p>
                      </div>
                      <ChartBarIcon className="h-8 w-8 text-green-400" />
                    </div>
                  </div>

                  {/* Growth Rate */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Growth Rate</p>
                        <p className={`text-3xl font-bold mt-1 ${
                          quarterlyGrowth > 0 ? 'text-green-600' : quarterlyGrowth < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {quarterlyGrowth > 0 ? '+' : ''}{quarterlyGrowth}%
                        </p>
                      </div>
                      <svg className={`h-8 w-8 ${
                        quarterlyGrowth > 0 ? 'text-green-400' : quarterlyGrowth < 0 ? 'text-red-400' : 'text-gray-400'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {quarterlyGrowth > 0 ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        ) : quarterlyGrowth < 0 ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                        )}
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Quarterly Progress Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quarterly Progress</h3>
                  
                  <div className="space-y-6">
                    {/* Overall Score Trend */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Overall Score</span>
                        <span className="text-sm text-gray-500">Higher is better</span>
                      </div>
                      <div className="space-y-2">
                        {/* Chart Area */}
                        <div className="flex items-end justify-around space-x-4 h-48 border-l-2 border-b-2 border-gray-300 pl-2">
                          {['q1', 'q2', 'q3', 'q4'].map((quarter) => {
                            const assessment = assessments.find(a => a.quarter === quarter);
                            const score = assessment?.overallScore || 0;
                            const maxHeight = 176; // Chart height in px
                            const heightPx = score > 0 ? (score / 100) * maxHeight : 4;
                            
                            return (
                              <div key={quarter} className="flex-1 flex items-end justify-center relative group">
                                <div 
                                  className={`w-full rounded-t transition-all duration-300 hover:opacity-80 cursor-pointer ${
                                    assessment ? 'bg-gradient-to-t from-purple-600 to-purple-400' : 'bg-gray-200'
                                  }`}
                                  style={{ height: `${heightPx}px` }}
                                  title={assessment ? `Score: ${score}` : 'No data'}
                                >
                                  {assessment && score > 20 && (
                                    <div className="text-white text-xs font-bold text-center pt-2">
                                      {score}
                                    </div>
                                  )}
                                </div>
                                {assessment && score <= 20 && (
                                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                    {score}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Labels Below Chart */}
                        <div className="flex justify-around space-x-4 pl-2">
                          {['q1', 'q2', 'q3', 'q4'].map((quarter) => {
                            const assessment = assessments.find(a => a.quarter === quarter);
                            return (
                              <div key={quarter} className="flex-1 flex flex-col items-center">
                                <div className="text-sm font-semibold text-gray-700 uppercase mb-1">
                                  {quarter.toUpperCase()}
                                </div>
                                {assessment && (
                                  <div className="text-xs text-gray-500 text-center">
                                    {assessment.proficiencyLevel}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Literacy vs Numeracy Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Literacy Trend */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-semibold text-blue-700">📚 Literacy Score</span>
                        </div>
                        <div className="space-y-2">
                          {/* Chart */}
                          <div className="flex items-end justify-around space-x-2 h-32 border-l-2 border-b-2 border-gray-300 pl-1">
                            {['q1', 'q2', 'q3', 'q4'].map((quarter) => {
                              const assessment = assessments.find(a => a.quarter === quarter);
                              const score = assessment?.literacyScore || 0;
                              const maxHeight = 120;
                              const heightPx = score > 0 ? (score / 100) * maxHeight : 2;
                              
                              return (
                                <div key={quarter} className="flex-1 flex items-end justify-center">
                                  <div 
                                    className={`w-full rounded-t transition-all ${assessment ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-200'}`}
                                    style={{ height: `${heightPx}px` }}
                                    title={assessment ? `${score}` : 'No data'}
                                  />
                                </div>
                              );
                            })}
                          </div>
                          {/* Labels */}
                          <div className="flex justify-around space-x-2 pl-1">
                            {['q1', 'q2', 'q3', 'q4'].map((quarter) => {
                              const assessment = assessments.find(a => a.quarter === quarter);
                              const score = assessment?.literacyScore || 0;
                              return (
                                <div key={quarter} className="flex-1 flex flex-col items-center">
                                  <div className="text-xs font-medium text-gray-600">{quarter.toUpperCase()}</div>
                                  {assessment && (
                                    <div className="text-xs font-semibold text-blue-600">{score}</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Numeracy Trend */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-semibold text-green-700">🔢 Numeracy Score</span>
                        </div>
                        <div className="space-y-2">
                          {/* Chart */}
                          <div className="flex items-end justify-around space-x-2 h-32 border-l-2 border-b-2 border-gray-300 pl-1">
                            {['q1', 'q2', 'q3', 'q4'].map((quarter) => {
                              const assessment = assessments.find(a => a.quarter === quarter);
                              const score = assessment?.numeracyScore || 0;
                              const maxHeight = 120;
                              const heightPx = score > 0 ? (score / 100) * maxHeight : 2;
                              
                              return (
                                <div key={quarter} className="flex-1 flex items-end justify-center">
                                  <div 
                                    className={`w-full rounded-t transition-all ${assessment ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-200'}`}
                                    style={{ height: `${heightPx}px` }}
                                    title={assessment ? `${score}` : 'No data'}
                                  />
                                </div>
                              );
                            })}
                          </div>
                          {/* Labels */}
                          <div className="flex justify-around space-x-2 pl-1">
                            {['q1', 'q2', 'q3', 'q4'].map((quarter) => {
                              const assessment = assessments.find(a => a.quarter === quarter);
                              const score = assessment?.numeracyScore || 0;
                              return (
                                <div key={quarter} className="flex-1 flex flex-col items-center">
                                  <div className="text-xs font-medium text-gray-600">{quarter.toUpperCase()}</div>
                                  {assessment && (
                                    <div className="text-xs font-semibold text-green-600">{score}</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Latest Domain Breakdown */}
                {assessments.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Literacy Domains */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                        Literacy Domains
                      </h3>
                      <div className="space-y-3">
                        {literacyDomains.map(domain => {
                          const latestAssessment = assessments[assessments.length - 1];
                          const score = (latestAssessment as any)[domain.key] || 0;
                          return (
                            <div key={domain.key}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700">{domain.label}</span>
                                <span className="font-medium text-blue-600">{score}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all"
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Numeracy Domains */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                        Numeracy Domains
                      </h3>
                      <div className="space-y-3">
                        {numeracyDomains.map(domain => {
                          const latestAssessment = assessments[assessments.length - 1];
                          const score = (latestAssessment as any)[domain.key] || 0;
                          return (
                            <div key={domain.key}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700">{domain.label}</span>
                                <span className="font-medium text-green-600">{score}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all"
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Assessment History */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment History</h3>
                  <div className="space-y-4">
                    {assessments.map((assessment, index) => (
                      <div 
                        key={assessment.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-sm font-medium text-gray-900 uppercase">
                                Quarter {assessment.quarter.replace('q', '')}
                              </span>
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getProficiencyColor(assessment.proficiencyLevel)}`}>
                                {assessment.proficiencyLevel}
                              </span>
                              {index === assessments.length - 1 && (
                                <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-700">
                                  Latest
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Overall:</span>
                                <span className="font-semibold text-purple-600 ml-2">{assessment.overallScore}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Literacy:</span>
                                <span className="font-semibold text-blue-600 ml-2">{assessment.literacyScore}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Numeracy:</span>
                                <span className="font-semibold text-green-600 ml-2">{assessment.numeracyScore}</span>
                              </div>
                            </div>
                            {assessment.notes && (
                              <div className="mt-2 text-sm text-gray-600">
                                <span className="font-medium">Notes:</span> {assessment.notes}
                              </div>
                            )}
                            {assessment.recommendations && (
                              <div className="mt-1 text-sm text-gray-600">
                                <span className="font-medium">Recommendations:</span> {assessment.recommendations}
                              </div>
                            )}
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            <div>
                              {(() => {
                                const date = (assessment as any).assessmentDate;
                                if (date && typeof date === 'object' && date.toDate) {
                                  return new Date(date.toDate()).toLocaleDateString();
                                } else if (date && typeof date === 'string') {
                                  return new Date(date).toLocaleDateString();
                                } else if (date instanceof Date) {
                                  return date.toLocaleDateString();
                                }
                                return 'N/A';
                              })()}
                            </div>
                            <div className="mt-1">By: {(assessment as any).assessedByName || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
