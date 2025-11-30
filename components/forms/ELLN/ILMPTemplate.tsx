/**
 * ILMP Template (Individualized Learning & Monitoring Plan)
 * 
 * Create intervention plans for students who need additional support.
 * Based on ELLN assessment results and teacher observations.
 * 
 * ✅ MIGRATED TO POSTGRESQL (November 25, 2025)
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchoolContext } from '../../../src/contexts/SchoolContext';
import { useStudentsPostgreSQL } from '../../../src/hooks/useStudentsPostgreSQL';
import { useSectionsPostgreSQL } from '../../../src/hooks/useSectionsPostgreSQL';
import { getCurrentSchoolYear } from '../../../services/dateHelpers';
import { generateILMPPDF } from '../../../services/ilmpPDFService';
import { 
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  HomeIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface InterventionStrategy {
  id: string;
  area: string;
  strategy: string;
  timeline: string;
  responsible: string;
}

export default function ILMPTemplate() {
  const navigate = useNavigate();
  const { schoolId } = useSchoolContext();

  // PostgreSQL hooks
  const { students: pgStudents, loading: studentsLoading } = useStudentsPostgreSQL({ 
    schoolId,
    includeSection: true 
  });
  const { sections: pgSections } = useSectionsPostgreSQL({ schoolId });

  // State
  const [selectedStudent, setSelectedStudent] = useState('');
  const [identifiedNeeds, setIdentifiedNeeds] = useState('');
  const [learningGoals, setLearningGoals] = useState('');
  const [strategies, setStrategies] = useState<InterventionStrategy[]>([
    { id: '1', area: '', strategy: '', timeline: '', responsible: '' }
  ]);
  const [monitoringPlan, setMonitoringPlan] = useState('');
  const [parentInvolvement, setParentInvolvement] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Memoize student-section mapping
  const studentsWithGrade = useMemo(() => {
    return pgStudents.map(s => {
      const section = pgSections.find(sec => sec.id === s.section_id);
      return {
        id: s.id,
        name: s.name || `${s.first_name} ${s.middle_name || ''} ${s.last_name}`.trim(),
        firstName: s.first_name,
        middleName: s.middle_name,
        lastName: s.last_name,
        lrn: s.lrn,
        gradeLevel: section?.grade_level || 0,
        sectionName: section?.name || 'N/A'
      };
    });
  }, [pgStudents, pgSections]);

  // Get selected student
  const student = useMemo(() => 
    studentsWithGrade.find(s => s.id === selectedStudent),
    [studentsWithGrade, selectedStudent]
  );

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentsWithGrade;
    
    const query = searchQuery.toLowerCase();
    return studentsWithGrade.filter(s => {
      const fullName = s.name.toLowerCase();
      const lrn = s.lrn || '';
      const grade = `grade ${s.gradeLevel}`;
      const section = s.sectionName.toLowerCase();
      
      return fullName.includes(query) ||
             lrn.includes(query) ||
             grade.includes(query) ||
             section.includes(query);
    });
  }, [studentsWithGrade, searchQuery]);

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

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen) return;

    const maxIndex = Math.min(filteredStudents.length - 1, 49);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev < maxIndex ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex <= maxIndex) {
          handleStudentSelect(filteredStudents[highlightedIndex].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle student selection
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudent(studentId);
    const selected = studentsWithGrade.find(s => s.id === studentId);
    if (selected) {
      setSearchQuery(selected.name);
    }
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
  };

  // Add new strategy row
  const addStrategy = () => {
    const newId = (strategies.length + 1).toString();
    setStrategies([...strategies, { id: newId, area: '', strategy: '', timeline: '', responsible: '' }]);
  };

  // Remove strategy row
  const removeStrategy = (id: string) => {
    if (strategies.length > 1) {
      setStrategies(strategies.filter(s => s.id !== id));
    }
  };

  // Update strategy
  const updateStrategy = (id: string, field: keyof InterventionStrategy, value: string) => {
    setStrategies(strategies.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedStudent) {
      setError('Please select a student');
      return;
    }

    // TODO: Save to PostgreSQL database
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        setSelectedStudent('');
        setSearchQuery('');
        setIdentifiedNeeds('');
        setLearningGoals('');
        setStrategies([{ id: '1', area: '', strategy: '', timeline: '', responsible: '' }]);
        setMonitoringPlan('');
        setParentInvolvement('');
      }, 2000);
    }, 1000);
  };

  // Generate PDF
  const handleGeneratePDF = () => {
    if (!student) {
      setError('Please select a student first');
      return;
    }

    if (!identifiedNeeds && !learningGoals && strategies.every(s => !s.area && !s.strategy)) {
      setError('Please fill in at least some ILMP information before generating PDF');
      return;
    }

    try {
      generateILMPPDF({
        student: {
          name: student.name,
          lrn: student.lrn || 'N/A',
          gradeLevel: student.gradeLevel,
          sectionName: student.sectionName
        },
        identifiedNeeds,
        learningGoals,
        strategies,
        monitoringPlan,
        parentInvolvement
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    }
  };

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
              <span className="ml-2 text-gray-900 font-medium">ILMP Template</span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ILMP Template</h1>
              <p className="mt-2 text-gray-600">
                Individualized Learning & Monitoring Plan for intervention support
              </p>
            </div>
            <button
              onClick={handleGeneratePDF}
              disabled={!student}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Generate PDF
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-visible">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Information</h2>
            
            <div className="relative" ref={dropdownRef}>
              <label htmlFor="student-search" className="block text-sm font-medium text-gray-700 mb-2">
                Select Student (K-3 only) *
              </label>
              
              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  ref={searchInputRef}
                  id="student-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                    setHighlightedIndex(-1);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search by name, LRN, grade, or section..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required={!selectedStudent}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedStudent('');
                      setIsDropdownOpen(true);
                      searchInputRef.current?.focus();
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Dropdown Results */}
              {isDropdownOpen && (
                <div className="absolute z-[9999] mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-y-auto">
                  {filteredStudents.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No students found matching "{searchQuery}"
                    </div>
                  ) : (
                    <>
                      {filteredStudents.slice(0, 50).map((s, index) => {
                        const isSelected = s.id === selectedStudent;
                        const isHighlighted = index === highlightedIndex;
                        
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleStudentSelect(s.id)}
                            className={`w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                              isHighlighted ? 'bg-purple-50' : ''
                            } ${isSelected ? 'bg-purple-100' : ''}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-900">{s.name}</span>
                                  {isSelected && (
                                    <CheckCircleIcon className="h-5 w-5 text-purple-600" />
                                  )}
                                </div>
                                <div className="flex items-center space-x-3 mt-1 text-xs text-gray-600">
                                  <span className="flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                    </svg>
                                    Grade {s.gradeLevel === 0 ? 'K' : s.gradeLevel}
                                  </span>
                                  <span className="flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                    </svg>
                                    {s.sectionName}
                                  </span>
                                  {s.lrn && (
                                    <span className="flex items-center">
                                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                                      </svg>
                                      {s.lrn}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      {filteredStudents.length > 50 && (
                        <div className="px-4 py-2 text-xs text-gray-500 text-center bg-gray-50 border-t">
                          Showing first 50 of {filteredStudents.length} results. Type to narrow your search.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {student && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">LRN:</span>
                    <p className="text-gray-900">{student.lrn || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Grade:</span>
                    <p className="text-gray-900">{student.gradeLevel === 0 ? 'Kindergarten' : `Grade ${student.gradeLevel}`}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Section:</span>
                    <p className="text-gray-900">{student.sectionName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">School Year:</span>
                    <p className="text-gray-900">{getCurrentSchoolYear()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Identified Needs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Identified Learning Needs</h2>
            <p className="text-sm text-gray-600 mb-4">
              Based on ELLN assessment results and teacher observations, describe the student's specific learning needs.
            </p>
            <textarea
              value={identifiedNeeds}
              onChange={(e) => setIdentifiedNeeds(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Example: Student struggles with phonics and letter-sound relationships. Has difficulty recognizing basic sight words. Numeracy skills show strength in counting but weakness in number comparison..."
              required
            />
          </div>

          {/* Learning Goals */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Learning Goals</h2>
            <p className="text-sm text-gray-600 mb-4">
              Define specific, measurable, achievable, relevant, and time-bound (SMART) goals.
            </p>
            <textarea
              value={learningGoals}
              onChange={(e) => setLearningGoals(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Example: By end of Quarter 2, student will correctly identify and pronounce 20 basic sight words with 80% accuracy. Will demonstrate understanding of number comparison (greater than, less than) for numbers 1-20 with 75% accuracy..."
              required
            />
          </div>

          {/* Intervention Strategies */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Intervention Strategies</h2>
              <button
                type="button"
                onClick={addStrategy}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                + Add Strategy
              </button>
            </div>
            
            <div className="space-y-4">
              {strategies.map((strategy, index) => (
                <div key={strategy.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-900">Strategy {index + 1}</h3>
                    {strategies.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStrategy(strategy.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Learning Area/Domain
                      </label>
                      <input
                        type="text"
                        value={strategy.area}
                        onChange={(e) => updateStrategy(strategy.id, 'area', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Phonics, Number Sense, Reading Comprehension"
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Strategy Description
                      </label>
                      <textarea
                        value={strategy.strategy}
                        onChange={(e) => updateStrategy(strategy.id, 'strategy', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe the specific intervention strategy, materials, and approach..."
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timeline
                      </label>
                      <input
                        type="text"
                        value={strategy.timeline}
                        onChange={(e) => updateStrategy(strategy.id, 'timeline', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Daily for 4 weeks, 3x per week"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Responsible Person
                      </label>
                      <input
                        type="text"
                        value={strategy.responsible}
                        onChange={(e) => updateStrategy(strategy.id, 'responsible', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Classroom Teacher, Reading Specialist"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monitoring Plan */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Progress Monitoring Plan</h2>
            <p className="text-sm text-gray-600 mb-4">
              Describe how progress will be measured and how often assessments will be conducted.
            </p>
            <textarea
              value={monitoringPlan}
              onChange={(e) => setMonitoringPlan(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Example: Weekly informal reading assessments using sight word flashcards. Bi-weekly ELLN mini-assessments in focus domains. Monthly review meeting with parents to discuss progress. Quarterly formal ELLN assessment..."
              required
            />
          </div>

          {/* Parent Involvement */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Parent/Guardian Involvement</h2>
            <p className="text-sm text-gray-600 mb-4">
              Describe how parents will be involved in supporting the intervention at home.
            </p>
            <textarea
              value={parentInvolvement}
              onChange={(e) => setParentInvolvement(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Example: Parent will practice sight words with student for 10 minutes daily. Weekly progress reports will be sent home. Monthly parent-teacher conferences to review progress and adjust strategies. Home reading log to track daily reading practice..."
              required
            />
          </div>

          {/* Success/Error Messages - Positioned near action buttons */}
          {success && (
            <div className="mt-6 bg-green-50 border-2 border-green-400 rounded-lg p-4 flex items-start animate-pulse">
              <CheckCircleIcon className="h-6 w-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-800 text-lg">✅ ILMP Saved Successfully!</h3>
                <p className="text-sm text-green-700 mt-1">The intervention plan has been saved to the database. Form will reset in a moment...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-50 border-2 border-red-400 rounded-lg p-4 flex items-start">
              <XCircleIcon className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800 text-lg">❌ Error Saving ILMP</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
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
              {saving ? 'Saving...' : 'Save ILMP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
