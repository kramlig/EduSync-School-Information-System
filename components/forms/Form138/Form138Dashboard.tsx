/**
 * Form 138 Dashboard
 * 
 * Landing page for Form 138 (Report Card/Quarterly Assessment)
 * Shows list of students and allows:
 * - Bulk selection for report card generation
 * - Filtering by grade level, section, quarter, performance
 * - Print individual or multiple report cards
 * - Quick access to student report cards
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchoolData } from '../../../hooks/useSchoolData';
import PrintableReport from '../../PrintableReport';
import {
  SectionHeader,
  Badge,
  EmptyState
} from '../shared/FormComponents';
import {
  ErrorState,
  CardSkeleton
} from '../shared/LoadingStates';

type FilterType = 'all' | 'honor' | 'needs-improvement' | 'incomplete';
type QuarterType = 'all' | 'q1' | 'q2' | 'q3' | 'q4';

// Move array outside component to prevent re-creation on every render
// Include all collections needed for PrintableReport component
const REQUIRED_COLLECTIONS = [
  'students', 
  'grades', 
  'sections', 
  'teachers',
  'learningAreas',
  'coreValues',
  'coreValueGrades',
  'attendanceRecords',
  'parents'
];

// Helper function to get student display name
const getStudentDisplayName = (student: any): string => {
  // Priority: 1. Full name field, 2. First + Last names, 3. Fallback
  if (student.name && student.name.trim()) {
    return student.name.trim();
  }
  
  const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
  if (fullName) {
    return fullName;
  }
  
  return 'Unnamed Student';
};

// Calculate final grade dynamically if not stored in database
const getFinalGrade = (grade: any): number | undefined => {
  if (!grade) return undefined;
  
  // If stored finalGrade exists, use it
  if (grade.finalGrade !== undefined) return grade.finalGrade;
  
  // Otherwise calculate it on-the-fly from quarterly grades
  const quarters: ('q1' | 'q2' | 'q3' | 'q4')[] = ['q1', 'q2', 'q3', 'q4'];
  const values: number[] = [];
  
  for (const q of quarters) {
    const v = grade[q];
    if (typeof v === 'number') {
      values.push(v);
    } else if (v && typeof v === 'object') {
      // Handle composite subjects (e.g., MAPEH with sub-subjects)
      const nums = Object.values(v as Record<string, any>).filter(n => typeof n === 'number') as number[];
      if (nums.length) {
        values.push(Math.round(nums.reduce((a, b) => a + b, 0) / nums.length));
      }
    }
  }
  
  if (!values.length) return undefined;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
};

const Form138Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Get school data
  const schoolData = useSchoolData(REQUIRED_COLLECTIONS);
  const { students, grades, sections, settings, teachers, loading, error } = schoolData;

  // Filter states
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [performanceFilter, setPerformanceFilter] = useState<FilterType>('all');
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('all');

  // Selection state for bulk operations
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<any>(null);

  // Filter and process students
  const filteredStudents = useMemo(() => {
    let filtered = [...students];

    // Filter by search query (name and LRN)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(student =>
        getStudentDisplayName(student).toLowerCase().includes(query) ||
        (student.lrn || '').toLowerCase().includes(query)
      );
    }

    // Filter by grade level
    if (selectedGradeLevel !== 'all') {
      filtered = filtered.filter(student => {
        const section = sections.find(s => s.id === student.sectionId);
        return section && section.gradeLevel.toString() === selectedGradeLevel;
      });
    }

    // Filter by section
    if (selectedSectionId !== 'all') {
      filtered = filtered.filter(student => student.sectionId === selectedSectionId);
    }

    return filtered;
  }, [students, searchQuery, selectedGradeLevel, selectedSectionId, sections]);

  // Get available grade levels
  const availableGradeLevels = useMemo(() => {
    const grades = new Set(sections.map(s => s.gradeLevel.toString()));
    return Array.from(grades).sort((a, b) => parseInt(a) - parseInt(b));
  }, [sections]);

  // Get sections for selected grade
  const availableSections = useMemo(() => {
    if (selectedGradeLevel === 'all') return sections;
    return sections.filter(s => s.gradeLevel.toString() === selectedGradeLevel);
  }, [sections, selectedGradeLevel]);

  // Bulk operations
  const handleSelectAll = () => {
    setSelectedStudents(filteredStudents.map(s => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedStudents([]);
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handlePrintSelected = () => {
    if (selectedStudents.length === 0) return;
    const studentIds = selectedStudents.join(',');
    navigate(`/grades/form138/print?students=${studentIds}`);
  };

  const handlePrintStudent = (studentId: string) => {
    navigate(`/grades/form138/print?students=${studentId}`);
  };

  const handleViewStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setViewingStudent(student);
      setShowViewModal(true);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGradeLevel('all');
    setSelectedSectionId('all');
    setPerformanceFilter('all');
    setSelectedQuarter('all');
  };

  const statistics = useMemo(() => {
    const total = filteredStudents.length;
    const honorStudents = filteredStudents.filter(s => {
      const studentGrades = grades.filter(g => g.studentId === s.id);
      if (studentGrades.length === 0) return false;
      const finalGrades = studentGrades.map(g => getFinalGrade(g)).filter((g): g is number => typeof g === 'number');
      if (finalGrades.length === 0) return false;
      const average = finalGrades.reduce((acc, g) => acc + g, 0) / finalGrades.length;
      return average >= 90;
    }).length;
    
    return {
      totalStudents: total,
      honorStudents,
      selectedCount: selectedStudents.length,
      currentQuarter: selectedQuarter === 'all' ? 'All Quarters' : `Quarter ${selectedQuarter.substring(1)}`
    };
  }, [filteredStudents, grades, selectedStudents, selectedQuarter]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState 
          title="Failed to Load Students"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              📋 Report Cards (DepEd Form 138)
            </h1>
            <p className="text-blue-100 text-lg">
              Generate and print quarterly report cards for students
            </p>
            <div className="mt-4 flex items-center gap-4 text-sm text-blue-200">
              <span>📊 {statistics.totalStudents} Students Available</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-6xl font-bold opacity-90">{statistics.totalStudents}</div>
            <div className="text-blue-200 text-sm">Students Available</div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalStudents}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              👥
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Honor Students</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.honorStudents}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              🏆
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Selected</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.selectedCount}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              ✅
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Quarter</p>
              <p className="text-lg font-bold text-gray-900">{statistics.currentQuarter}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              📅
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Student Report Cards</h2>
          
          {selectedStudents.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{selectedStudents.length} selected</span>
              <button
                onClick={handlePrintSelected}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                🖨️ Print Selected
              </button>
              <button
                onClick={handleDeselectAll}
                className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700 mb-1">
              Grade Level
            </label>
            <select
              id="gradeLevel"
              value={selectedGradeLevel}
              onChange={(e) => setSelectedGradeLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Grades</option>
              {availableGradeLevels.map(grade => (
                <option key={grade} value={grade}>Grade {grade}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">
              Section
            </label>
            <select
              id="section"
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Sections</option>
              {availableSections.map(section => (
                <option key={section.id} value={section.id}>{section.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="quarter" className="block text-sm font-medium text-gray-700 mb-1">
              Quarter
            </label>
            <select
              id="quarter"
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value as QuarterType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Quarters</option>
              <option value="q1">Quarter 1</option>
              <option value="q2">Quarter 2</option>
              <option value="q3">Quarter 3</option>
              <option value="q4">Quarter 4</option>
            </select>
          </div>

          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Students
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by name or LRN"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              disabled={filteredStudents.length === 0}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Select All ({filteredStudents.length})
            </button>
            <button
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Student List */}
        {filteredStudents.length === 0 ? (
          <EmptyState 
            title="No Students Found"
            message="No students match your current filters. Try adjusting your search criteria."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map(student => {
              const section = sections.find(s => s.id === student.sectionId);
              const studentGrades = grades.filter(g => g.studentId === student.id);
              const hasGrades = studentGrades.length > 0;
              const finalGrades = studentGrades.map(g => getFinalGrade(g)).filter((g): g is number => typeof g === 'number');
              const average = finalGrades.length > 0 
                ? finalGrades.reduce((acc, g) => acc + g, 0) / finalGrades.length
                : 0;

              return (
                <div key={student.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-gray-300 transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {getStudentDisplayName(student)}
                          </h3>
                          <p className="text-sm text-gray-600 font-medium">
                            LRN: {student.lrn || 'Not Assigned'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {section ? `${section.name} (Grade ${section.gradeLevel})` : 'No Section'}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          student.status === 'active' || !student.status ? 'bg-green-100 text-green-700' :
                          student.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                          student.status === 'transferred' ? 'bg-blue-100 text-blue-700' :
                          student.status === 'graduated' ? 'bg-purple-100 text-purple-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {student.status === 'active' || !student.status ? '✓ Active' :
                           student.status === 'inactive' ? '⏸️ Inactive' :
                           student.status === 'transferred' ? '📤 Transferred' :
                           student.status === 'graduated' ? '🎓 Graduated' :
                           '🚫 Dropped'}
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleStudentToggle(student.id)}
                      className="mt-1"
                      title="Select student for bulk operations"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {hasGrades ? (
                        <>
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold ${
                            average >= 90 ? 'bg-green-100 text-green-800 border border-green-200' :
                            average >= 80 ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            average >= 75 ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                            'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {average.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {average >= 90 ? '🏆 With Honors' :
                             average >= 85 ? '⭐ Good' :
                             average >= 75 ? '✓ Satisfactory' :
                             '⚠️ Needs Improvement'}
                          </span>
                        </>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          📋 No Grades
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewStudent(student.id)}
                        className="flex items-center gap-1 px-2 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-medium border border-blue-200"
                        title="Preview report card in modal"
                      >
                        👁️ Preview
                      </button>
                      
                      <button
                        onClick={() => handlePrintStudent(student.id)}
                        className="flex items-center gap-1 px-2 py-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-xs font-medium border border-green-200"
                        title="Open print page & generate PDF"
                      >
                        🖨️ Print
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* View Modal */}
      {showViewModal && viewingStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-auto">
          <div className="min-h-screen p-4">
            <div className="max-w-[95vw] lg:max-w-[1200px] mx-auto bg-white rounded-lg shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center rounded-t-lg z-10">
                <h3 className="text-lg font-semibold text-slate-800">
                  📋 Form 138 - Report Card: {getStudentDisplayName(viewingStudent)}
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePrintStudent(viewingStudent.id)}
                    className="group flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span className="text-sm">Print PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setViewingStudent(null);
                    }}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
              <div className="max-h-[80vh] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading report data...</p>
                    </div>
                  </div>
                ) : (
                  <PrintableReport
                    student={viewingStudent}
                    schoolData={schoolData}
                    hideDownloadButton={true}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Form138Dashboard;