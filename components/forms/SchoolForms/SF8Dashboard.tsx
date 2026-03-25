/**
 * SF8 Dashboard - Learner's Basic Health and Nutrition Report
 * 
 * Official DepEd Form SF8 for tracking student health data including:
 * - Height and weight measurements
 * - BMI and nutritional status
 * - Health screenings (vision, hearing, oral health)
 * - Deworming program status
 * - Feeding program enrollment
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSchoolContext } from '../../../src/contexts/SchoolContext';
import { useSchoolSettingsPostgreSQL } from '../../../src/hooks/useSchoolSettingsPostgreSQL';
import { useStudentsPostgreSQL } from '../../../src/hooks/useStudentsPostgreSQL';
import { useSectionsPostgreSQL } from '../../../src/hooks/useSectionsPostgreSQL';
import { 
  useStudentHealthPostgreSQL, 
  calculateBMI, 
  getBMICategory,
  type StudentHealthRecord,
  type HealthRecordInput 
} from '../../../src/hooks/useStudentHealthPostgreSQL';
import type { AuthUser, StudentUser, ParentUser, Student } from '../../../types';
import BackButton from '../../BackButton';
import { 
  HeartIcon,
  UsersIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  PencilIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ArrowPathIcon
} from '../../icons';

interface SF8DashboardProps {
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
  onBack: () => void;
}

// Grade level display helper
const getGradeLevelDisplay = (gradeLevel: number | string | undefined): string => {
  if (gradeLevel === undefined || gradeLevel === null) return 'N/A';
  if (gradeLevel === 0) return 'Kinder';
  return `Grade ${gradeLevel}`;
};

// Nutritional status color coding
const getNutritionalStatusColor = (status: string | undefined): string => {
  switch (status) {
    case 'Severely Wasted':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Wasted':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Normal':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Overweight':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Obese':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// CSV Export helper
const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
        ? `"${value.replace(/"/g, '""')}"` 
        : value ?? '';
    }).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const SF8Dashboard: React.FC<SF8DashboardProps> = ({ onBack: _onBack }) => {
  const { schoolId } = useSchoolContext();
  const { settings } = useSchoolSettingsPostgreSQL({ schoolId: schoolId || undefined });
  const currentSchoolYear = settings?.schoolYear || '2025-2026';
  
  // Pagination constants
  const PAGE_SIZE = 50;
  
  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>(currentSchoolYear);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [assessmentPeriod, setAssessmentPeriod] = useState<'beginning' | 'end'>('beginning');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'statistics' | 'entry'>('list');
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingRecord, setEditingRecord] = useState<StudentHealthRecord | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  
  // Hooks
  const { students, loading: studentsLoading } = useStudentsPostgreSQL({ schoolId: schoolId || undefined });
  const { sections, loading: sectionsLoading } = useSectionsPostgreSQL({ schoolId: schoolId || undefined });
  const { 
    healthRecords, 
    loading: healthLoading, 
    statistics,
    createHealthRecord,
    updateHealthRecord,
    deleteHealthRecord: _deleteHealthRecord,
    refresh
  } = useStudentHealthPostgreSQL({
    schoolId: schoolId || undefined,
    schoolYear: selectedSchoolYear,
    assessmentPeriod,
    gradeLevel: selectedGradeLevel || undefined,
    sectionId: selectedSection || undefined,
    includeStudentData: true
  });

  const loading = studentsLoading || sectionsLoading || healthLoading;

  // Filter students based on selection
  const filteredStudents = useMemo(() => {
    let result = students.filter(s => (s as any).status === 'active' || !(s as any).status);
    
    if (selectedGradeLevel !== null) {
      result = result.filter(s => s.gradeLevel === selectedGradeLevel);
    }
    
    if (selectedSection) {
      result = result.filter(s => s.sectionId === selectedSection);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name?.toLowerCase().includes(query) ||
        s.lrn?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [students, selectedGradeLevel, selectedSection, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredStudents.slice(start, start + PAGE_SIZE);
  }, [filteredStudents, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGradeLevel, selectedSection, searchQuery]);

  // Get health record for a specific student
  const getStudentHealthRecord = useCallback((studentId: string): StudentHealthRecord | undefined => {
    return healthRecords.find(r => r.student_id === studentId);
  }, [healthRecords]);

  // Students with and without health records
  const studentsWithRecords = useMemo(() => {
    return filteredStudents.filter(s => getStudentHealthRecord(s.id));
  }, [filteredStudents, getStudentHealthRecord]);

  const studentsWithoutRecords = useMemo(() => {
    return filteredStudents.filter(s => !getStudentHealthRecord(s.id));
  }, [filteredStudents, getStudentHealthRecord]);

  // Available grade levels
  // Available grade levels (for future use)
  // const _gradeLevels = useMemo(() => {
  //   const levels = new Set(students.map(s => s.gradeLevel).filter(Boolean));
  //   return Array.from(levels).sort((a, b) => Number(a) - Number(b)) as number[];
  // }, [students]);

  // Filtered sections based on grade level
  const filteredSections = useMemo(() => {
    if (!selectedGradeLevel) return sections;
    return sections.filter(s => s.gradeLevel === selectedGradeLevel);
  }, [sections, selectedGradeLevel]);

  // Handle opening entry modal
  const handleOpenEntryModal = (student: Student, existingRecord?: StudentHealthRecord) => {
    setSelectedStudent(student);
    setEditingRecord(existingRecord || null);
    setShowEntryModal(true);
  };

  // Handle export
  const handleExport = () => {
    const exportData = healthRecords.map(record => ({
      'LRN': record.student?.lrn || '',
      'Student Name': record.student?.name || '',
      'Sex': record.student?.sex || '',
      'Grade Level': getGradeLevelDisplay(record.student?.grade_level),
      'Section': record.student?.section_name || '',
      'Height (cm)': record.height_cm || '',
      'Weight (kg)': record.weight_kg || '',
      'BMI': record.bmi || '',
      'Nutritional Status': record.nutritional_status || '',
      'Vision': record.vision_screening || '',
      'Hearing': record.hearing_screening || '',
      'Oral Health': record.oral_health_screening || '',
      'Deworming Status': record.deworming_status || '',
      'Feeding Program': record.feeding_program_enrolled ? 'Yes' : 'No',
      'Assessment Date': record.assessment_date || '',
    }));

    const filename = `SF8_Health_Report_${selectedSchoolYear}_${assessmentPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(exportData, filename);
  };

  // School years for filter
  const schoolYears = ['2025-2026', '2024-2025', '2023-2024'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <HeartIcon className="h-8 w-8 text-rose-600" />
                SF8 - Health & Nutrition Report
              </h1>
              <p className="text-slate-600 mt-1">
                Learner's Basic Health and Nutrition Report for {selectedSchoolYear}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleExport}
              disabled={healthRecords.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Students</p>
                <p className="text-2xl font-bold text-slate-800">{filteredStudents.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Assessed</p>
                <p className="text-2xl font-bold text-green-600">{studentsWithRecords.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Not Assessed</p>
                <p className="text-2xl font-bold text-orange-600">{studentsWithoutRecords.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Completion Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {filteredStudents.length > 0 
                    ? Math.round((studentsWithRecords.length / filteredStudents.length) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Nutritional Status Summary */}
        {statistics && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Nutritional Status Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Severely Wasted', count: statistics.byNutritionalStatus.severely_wasted, color: 'bg-red-500' },
                { label: 'Wasted', count: statistics.byNutritionalStatus.wasted, color: 'bg-orange-500' },
                { label: 'Normal', count: statistics.byNutritionalStatus.normal, color: 'bg-green-500' },
                { label: 'Overweight', count: statistics.byNutritionalStatus.overweight, color: 'bg-yellow-500' },
                { label: 'Obese', count: statistics.byNutritionalStatus.obese, color: 'bg-red-600' },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className={`h-2 ${item.color} rounded-full mb-2`}></div>
                  <p className="text-2xl font-bold text-slate-800">{item.count}</p>
                  <p className="text-xs text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
            
            {/* Additional Stats */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-800">{statistics.averageHeight.toFixed(1)} cm</p>
                <p className="text-xs text-slate-500">Avg. Height</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-800">{statistics.averageWeight.toFixed(1)} kg</p>
                <p className="text-xs text-slate-500">Avg. Weight</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-800">{statistics.averageBMI.toFixed(1)}</p>
                <p className="text-xs text-slate-500">Avg. BMI</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-800">{statistics.byDeworming.completed}</p>
                <p className="text-xs text-slate-500">Dewormed</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* School Year */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">School Year</label>
              <select
                value={selectedSchoolYear}
                onChange={(e) => setSelectedSchoolYear(e.target.value)}
                title="School Year"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {schoolYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            {/* Assessment Period */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">Assessment Period</label>
              <select
                value={assessmentPeriod}
                onChange={(e) => setAssessmentPeriod(e.target.value as 'beginning' | 'end')}
                title="Assessment Period"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="beginning">Beginning of SY</option>
                <option value="end">End of SY</option>
              </select>
            </div>
            
            {/* Grade Level */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">Grade Level</label>
              <select
                value={selectedGradeLevel ?? ''}
                onChange={(e) => {
                  setSelectedGradeLevel(e.target.value ? Number(e.target.value) : null);
                  setSelectedSection(null);
                }}
                title="Grade Level"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Grades</option>
                <option value="0">Kindergarten</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(level => (
                  <option key={level} value={level}>Grade {level}</option>
                ))}
              </select>
            </div>
            
            {/* Section */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">Section</label>
              <select
                value={selectedSection ?? ''}
                onChange={(e) => setSelectedSection(e.target.value || null)}
                title="Section"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Sections</option>
                {filteredSections.map(section => (
                  <option key={section.id} value={section.id}>
                    {section.name} ({getGradeLevelDisplay(section.gradeLevel)})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by name or LRN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          {[
            { id: 'list', label: 'Student List', icon: UsersIcon },
            { id: 'statistics', label: 'Statistics', icon: ChartBarIcon },
            { id: 'entry', label: 'Data Entry', icon: PencilIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                viewMode === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-320px)]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : viewMode === 'list' ? (
            /* Student List View */
            <>
              {/* Table Header with Count */}
              <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    Students ({filteredStudents.length})
                  </span>
                  <span className="text-xs text-slate-500">
                    {healthRecords.length} assessed
                  </span>
                </div>
              </div>
              <div className="overflow-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left text-slate-600 font-medium">Student</th>
                    <th className="px-3 py-2 text-left text-slate-600 font-medium">Grade/Section</th>
                    <th className="px-3 py-2 text-center text-slate-600 font-medium">Ht (cm)</th>
                    <th className="px-3 py-2 text-center text-slate-600 font-medium">Wt (kg)</th>
                    <th className="px-3 py-2 text-center text-slate-600 font-medium">BMI</th>
                    <th className="px-3 py-2 text-center text-slate-600 font-medium">Status</th>
                    <th className="px-3 py-2 text-center text-slate-600 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                        No students found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student) => {
                      const record = getStudentHealthRecord(student.id);
                      const section = sections.find(s => s.id === student.sectionId);
                      
                      return (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="px-3 py-1.5">
                            <span className="font-medium text-slate-800">{student.name}</span>
                            <span className="text-xs text-slate-400 ml-2">({student.lrn})</span>
                          </td>
                          <td className="px-3 py-1.5 text-slate-600">
                            {getGradeLevelDisplay(student.gradeLevel)}
                            {section && ` - ${section.name}`}
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            {record?.height_cm ? (
                              <span className="font-medium text-slate-800">{record.height_cm}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            {record?.weight_kg ? (
                              <span className="font-medium text-slate-800">{record.weight_kg}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            {record?.bmi ? (
                              <span className="font-medium text-slate-800">{record.bmi.toFixed(1)}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            {record?.nutritional_status ? (
                              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getNutritionalStatusColor(record.nutritional_status)}`}>
                                {record.nutritional_status}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            <button
                              onClick={() => handleOpenEntryModal(student, record)}
                              className={`p-1.5 rounded transition-colors ${
                                record
                                  ? 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                                  : 'text-blue-600 hover:bg-blue-50'
                              }`}
                              title={record ? 'Edit health record' : 'Add health assessment'}
                            >
                              {record ? (
                                <PencilIcon className="h-4 w-4" />
                              ) : (
                                <PlusIcon className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              </div>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
                  <span className="text-xs text-slate-500">
                    Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredStudents.length)} of {filteredStudents.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      title="Previous page"
                      className="p-1 text-slate-600 hover:bg-slate-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                    <span className="px-2 text-sm text-slate-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      title="Next page"
                      className="p-1 text-slate-600 hover:bg-slate-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : viewMode === 'statistics' ? (
            /* Statistics View */
            <div className="p-6 space-y-6">
              {statistics ? (
                <>
                  {/* Health Screening Stats */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Health Screening Results</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="text-sm font-medium text-slate-600 mb-3">Vision Screening</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Normal</span>
                            <span className="font-medium text-green-600">{statistics.byVision.normal}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">With Defect</span>
                            <span className="font-medium text-orange-600">{statistics.byVision.with_defect}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="text-sm font-medium text-slate-600 mb-3">Hearing Screening</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Normal</span>
                            <span className="font-medium text-green-600">{statistics.byHearing.normal}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">With Defect</span>
                            <span className="font-medium text-orange-600">{statistics.byHearing.with_defect}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="text-sm font-medium text-slate-600 mb-3">Oral Health</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">No Cavities</span>
                            <span className="font-medium text-green-600">{statistics.byOralHealth.no_cavities}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">With Cavities</span>
                            <span className="font-medium text-orange-600">{statistics.byOralHealth.with_cavities}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Programs Stats */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Health Programs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="text-sm font-medium text-slate-600 mb-3">Deworming Program</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Completed</span>
                            <span className="font-medium text-green-600">{statistics.byDeworming.completed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Partial</span>
                            <span className="font-medium text-yellow-600">{statistics.byDeworming.partial}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Not Administered</span>
                            <span className="font-medium text-slate-500">{statistics.byDeworming.not_administered}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="text-sm font-medium text-slate-600 mb-3">Feeding Program</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Enrolled</span>
                            <span className="font-medium text-green-600">{statistics.byFeedingProgram.enrolled}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Not Enrolled</span>
                            <span className="font-medium text-slate-500">{statistics.byFeedingProgram.not_enrolled}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  No health data available for the selected filters.
                </div>
              )}
            </div>
          ) : (
            /* Data Entry View */
            <div className="p-6">
              <div className="text-center py-12">
                <PencilIcon className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-4 text-lg font-medium text-slate-800">Data Entry Mode</h3>
                <p className="mt-2 text-slate-500">
                  Click on a student in the list view or use the "Assess" button to enter health data.
                </p>
                <button
                  onClick={() => setViewMode('list')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Student List
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Health Entry Modal */}
        {showEntryModal && selectedStudent && (
          <HealthEntryModal
            student={selectedStudent}
            existingRecord={editingRecord}
            schoolId={schoolId || ''}
            schoolYear={selectedSchoolYear}
            assessmentPeriod={assessmentPeriod}
            onSave={async (data) => {
              try {
                let success = false;
                if (editingRecord) {
                  success = await updateHealthRecord(editingRecord.id, data);
                  if (success) {
                    setToast({ message: `✓ Health record for ${selectedStudent.name} updated successfully!`, type: 'success' });
                  } else {
                    setToast({ message: `✗ Failed to update health record for ${selectedStudent.name}`, type: 'error' });
                  }
                } else {
                  const result = await createHealthRecord({
                    ...data,
                    school_id: schoolId || '',
                    student_id: selectedStudent.id,
                    school_year: selectedSchoolYear,
                    assessment_period: assessmentPeriod,
                    assessment_date: new Date().toISOString().split('T')[0],
                  });
                  if (result) {
                    setToast({ message: `✓ Health record for ${selectedStudent.name} saved successfully!`, type: 'success' });
                  } else {
                    setToast({ message: `✗ Failed to save health record for ${selectedStudent.name}`, type: 'error' });
                  }
                }
                setShowEntryModal(false);
                setSelectedStudent(null);
                setEditingRecord(null);
              } catch (err) {
                console.error('Error saving health record:', err);
                setToast({ message: `✗ Error: ${err instanceof Error ? err.message : 'Failed to save health record'}`, type: 'error' });
              }
            }}
            onClose={() => {
              setShowEntryModal(false);
              setSelectedStudent(null);
              setEditingRecord(null);
            }}
          />
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            <span className="flex-1">{toast.message}</span>
            <button 
              onClick={() => setToast(null)} 
              title="Dismiss"
              className="p-1 hover:bg-white/20 rounded"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Health Entry Modal Component
interface HealthEntryModalProps {
  student: Student;
  existingRecord: StudentHealthRecord | null;
  schoolId: string;
  schoolYear: string;
  assessmentPeriod: 'beginning' | 'end';
  onSave: (data: Partial<HealthRecordInput>) => Promise<void>;
  onClose: () => void;
}

const HealthEntryModal: React.FC<HealthEntryModalProps> = ({
  student,
  existingRecord,
  schoolId: _schoolId,
  schoolYear: _schoolYear,
  assessmentPeriod: _assessmentPeriod,
  onSave,
  onClose
}) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    height_cm: existingRecord?.height_cm?.toString() || '',
    weight_kg: existingRecord?.weight_kg?.toString() || '',
    vision_screening: existingRecord?.vision_screening || 'Normal',
    hearing_screening: existingRecord?.hearing_screening || 'Normal',
    oral_health_screening: existingRecord?.oral_health_screening || 'No Cavities',
    skin_screening: existingRecord?.skin_screening || 'Normal',
    deworming_status: existingRecord?.deworming_status || 'Not Administered',
    deworming_1st_dose: existingRecord?.deworming_1st_dose || '',
    deworming_2nd_dose: existingRecord?.deworming_2nd_dose || '',
    feeding_program_enrolled: existingRecord?.feeding_program_enrolled || false,
    feeding_program_type: existingRecord?.feeding_program_type || '',
    immunization_complete: existingRecord?.immunization_complete || false,
    menarche_status: existingRecord?.menarche_status || 'N/A',
    remarks: existingRecord?.remarks || '',
  });

  // Calculate BMI preview
  const bmiPreview = useMemo(() => {
    const height = parseFloat(formData.height_cm);
    const weight = parseFloat(formData.weight_kg);
    if (height > 0 && weight > 0) {
      const bmi = calculateBMI(height, weight);
      const category = getBMICategory(bmi);
      return { bmi, category };
    }
    return null;
  }, [formData.height_cm, formData.weight_kg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await onSave({
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : undefined,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : undefined,
        vision_screening: formData.vision_screening,
        hearing_screening: formData.hearing_screening,
        oral_health_screening: formData.oral_health_screening,
        skin_screening: formData.skin_screening,
        deworming_status: formData.deworming_status,
        deworming_1st_dose: formData.deworming_1st_dose || undefined,
        deworming_2nd_dose: formData.deworming_2nd_dose || undefined,
        feeding_program_enrolled: formData.feeding_program_enrolled,
        feeding_program_type: formData.feeding_program_type || undefined,
        immunization_complete: formData.immunization_complete,
        menarche_status: formData.menarche_status,
        remarks: formData.remarks || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                {existingRecord ? 'Edit Health Record' : 'New Health Assessment'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {student.name} • LRN: {student.lrn}
              </p>
            </div>
            <button
              onClick={onClose}
              title="Close"
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Physical Measurements */}
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">Physical Measurements</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.height_cm}
                    onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 145.5"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 42.0"
                  />
                </div>
              </div>
              
              {/* BMI Preview */}
              {bmiPreview && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-sm text-slate-600">Calculated BMI:</span>
                    <span className="ml-2 font-semibold text-slate-800">{bmiPreview.bmi.toFixed(1)}</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getNutritionalStatusColor(bmiPreview.category)}`}>
                    {bmiPreview.category}
                  </span>
                </div>
              )}
            </div>
            
            {/* Health Screenings */}
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">Health Screenings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Vision</label>
                  <select
                    value={formData.vision_screening}
                    onChange={(e) => setFormData({ ...formData, vision_screening: e.target.value })}
                    title="Vision Screening"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Normal">Normal</option>
                    <option value="With Defect">With Defect</option>
                    <option value="With Correction">With Correction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Hearing</label>
                  <select
                    value={formData.hearing_screening}
                    onChange={(e) => setFormData({ ...formData, hearing_screening: e.target.value })}
                    title="Hearing Screening"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Normal">Normal</option>
                    <option value="With Defect">With Defect</option>
                    <option value="With Correction">With Correction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Oral Health</label>
                  <select
                    value={formData.oral_health_screening}
                    onChange={(e) => setFormData({ ...formData, oral_health_screening: e.target.value })}
                    title="Oral Health Screening"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="No Cavities">No Cavities</option>
                    <option value="With Cavities">With Cavities</option>
                    <option value="Decayed">Decayed</option>
                    <option value="Missing">Missing</option>
                    <option value="Filled">Filled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Skin</label>
                  <select
                    value={formData.skin_screening}
                    onChange={(e) => setFormData({ ...formData, skin_screening: e.target.value })}
                    title="Skin Screening"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Normal">Normal</option>
                    <option value="With Skin Disease">With Skin Disease</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Deworming */}
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">Deworming Program</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Status</label>
                  <select
                    value={formData.deworming_status}
                    onChange={(e) => setFormData({ ...formData, deworming_status: e.target.value as 'Completed' | 'Partial' | 'Not Administered' })}
                    title="Deworming Status"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Not Administered">Not Administered</option>
                    <option value="Partial">Partial (1 dose)</option>
                    <option value="Completed">Completed (2 doses)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">1st Dose Date</label>
                  <input
                    type="date"
                    value={formData.deworming_1st_dose}
                    onChange={(e) => setFormData({ ...formData, deworming_1st_dose: e.target.value })}
                    title="1st Dose Date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">2nd Dose Date</label>
                  <input
                    type="date"
                    value={formData.deworming_2nd_dose}
                    onChange={(e) => setFormData({ ...formData, deworming_2nd_dose: e.target.value })}
                    title="2nd Dose Date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Programs */}
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">Health Programs</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.feeding_program_enrolled}
                    onChange={(e) => setFormData({ ...formData, feeding_program_enrolled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">Enrolled in Feeding Program (SBFP)</span>
                </label>
                
                {formData.feeding_program_enrolled && (
                  <div className="ml-7">
                    <label className="block text-xs text-slate-500 mb-1">Program Type</label>
                    <input
                      type="text"
                      value={formData.feeding_program_type}
                      onChange={(e) => setFormData({ ...formData, feeding_program_type: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., SBFP, Milk Feeding"
                    />
                  </div>
                )}
                
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.immunization_complete}
                    onChange={(e) => setFormData({ ...formData, immunization_complete: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">Immunization Complete</span>
                </label>
              </div>
            </div>
            
            {/* Menarche (for female students) */}
            {student.sex === 'Female' && (
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-3">Menarche (Female Students)</h3>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Menarche Status</label>
                  <select
                    value={formData.menarche_status}
                    onChange={(e) => setFormData({ ...formData, menarche_status: e.target.value as 'N/A' | 'Yes' | 'No' })}
                    title="Menarche Status"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="N/A">N/A</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            )}
            
            {/* Remarks */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Remarks / Notes</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional notes about the student's health..."
              />
            </div>
            
            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    Save Record
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SF8Dashboard;
