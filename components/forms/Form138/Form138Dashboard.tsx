/**
 * Form 138 Dashboard
 * 
 * Landing page for Form 138 (Report Card/Quarterly Assessment)
 * Shows list of students and allows:
 * - Bulk selection for report card generation
 * - Filtering by grade level, section, quarter, performance
 * - Print individual or multiple report cards
 * - Quick access to student report cards
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Memoized teachers array to prevent infinite loops
 * - Efficient data fetching with PostgreSQL hooks
 * - Lazy loading of PrintableReport component
 * - Optimized filtering and calculations with useMemo
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentsPostgreSQL } from '../../../src/hooks/useStudentsPostgreSQL';
import { useGradesPostgreSQL } from '../../../src/hooks/useGradesPostgreSQL';
import { useSectionsPostgreSQL } from '../../../src/hooks/useSectionsPostgreSQL';
import { useCoreValuesPostgreSQL } from '../../../src/hooks/useCoreValuesPostgreSQL';
import { useAttendancePostgreSQL } from '../../../src/hooks/useAttendancePostgreSQL';
import { useSchoolContext } from '../../../src/contexts/SchoolContext';
import { auth, getFirestoreInstance } from '../../../src/services/firestoreService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { supabase } from '../../../src/lib/supabase';
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
  const { schoolId } = useSchoolContext();
  
  // Get current logged-in user
  const currentUser = auth.currentUser;
  const userEmail = currentUser?.email || '';
  
  // Filter states - MUST be declared before hooks that use them
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [performanceFilter, setPerformanceFilter] = useState<FilterType>('all');
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('all');
  
  // Use PostgreSQL hooks with optimized filtering
  // Only fetch students for selected section if filtered (reduces initial load)
  const studentFetchOptions = useMemo(() => {
    const options: any = { schoolId, includeSection: true };
    
    // If section is selected, only fetch those students
    if (selectedSectionId !== 'all') {
      options.sectionId = selectedSectionId;
    }
    // If grade level is selected (but not section), fetch all students and filter client-side
    // This is a trade-off: fetching all vs multiple queries
    
    return options;
  }, [schoolId, selectedSectionId]);
  
  const { students, loading: studentsLoading } = useStudentsPostgreSQL(studentFetchOptions);
  const { grades, loading: gradesLoading } = useGradesPostgreSQL({ schoolId, includeLearningArea: true });
  const { sections, loading: sectionsLoading } = useSectionsPostgreSQL({ schoolId });
  
  // Fetch core values and core value grades from PostgreSQL
  const { coreValues, coreValueGrades, loading: coreValuesLoading } = useCoreValuesPostgreSQL(true, schoolId);
  
  // Fetch attendance records from PostgreSQL
  const { attendanceRecords, loading: attendanceLoading } = useAttendancePostgreSQL({ 
    schoolId
  });
  
  // State for additional data needed by PrintableReport
  const [learningAreas, setLearningAreas] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ schoolYear: '2024-2025' });
  const [additionalDataLoading, setAdditionalDataLoading] = useState(true);
  
  const loading = studentsLoading || gradesLoading || sectionsLoading || coreValuesLoading || attendanceLoading || additionalDataLoading;
  const error = null;
  
  // Memoize empty teachers array to prevent infinite loops
  const teachers = useMemo(() => [], []); // TODO: Load teachers if needed for filtering
  
  // Fetch additional data from PostgreSQL (settings and learning areas only)
  // Memoized to prevent unnecessary re-fetches
  const fetchAdditionalData = useCallback(async () => {
    setAdditionalDataLoading(true);
    
    try {
      const db = getFirestoreInstance();
      let fetchedLearningAreas: any[] = [];
      
      // Skip PostgreSQL queries if schoolId is "default" (not a valid UUID)
      if (schoolId !== 'default') {
          // Fetch school settings from PostgreSQL
          const { data: schoolData, error: schoolError } = await supabase
            .from('schools')
            .select('current_school_year, settings, name, division, region, principal_name')
            .eq('id', schoolId)
            .single();
          
          if (!schoolError && schoolData) {
            setSettings({
              schoolYear: schoolData.current_school_year,
              schoolName: schoolData.name,
              division: schoolData.division,
              region: schoolData.region,
              principalName: schoolData.principal_name,
              ...schoolData.settings
            });
          }
          
          // Try to fetch learning areas from PostgreSQL
          const { data: learningAreasData, error: learningAreasError } = await supabase
            .from('learning_areas')
            .select('*')
            .eq('school_id', schoolId)
            .is('deleted_at', null);
          
          if (!learningAreasError && learningAreasData && learningAreasData.length > 0) {
            // Transform learning areas to camelCase for compatibility with PrintableReport
            fetchedLearningAreas = learningAreasData.map((row: any) => ({
              id: row.id,
              schoolId: row.school_id,
              name: row.name,
              credits: row.credits || 0,
              isComposite: row.is_composite || false,
              subSubjects: row.sub_subjects || row.components || [],
              components: row.components || [],
              category: row.category,
              gradeLevel: row.grade_level,
              isActive: row.is_active !== false,
              department: row.department,
              order: row.display_order || row.order,
              kToTwelveCode: row.k_to_twelve_code,
              semesterBased: row.semester_based,
              semester: row.semester,
              trackRequired: row.track_required,
              prerequisite: row.prerequisite,
              description: row.description,
              hoursPerWeek: row.hours_per_week
            }));
          }
        }
        
        // Fallback to Firestore if PostgreSQL returned no data or schoolId is "default"
        if (fetchedLearningAreas.length === 0) {
          const learningAreasSnapshot = await getDocs(
            query(collection(db, 'learningAreas'), where('schoolId', '==', schoolId))
          );
          fetchedLearningAreas = learningAreasSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        }
        
        setLearningAreas(fetchedLearningAreas);
        
      } catch (err) {
        console.error('[Form138Dashboard] Error fetching additional data:', err);
      } finally {
        setAdditionalDataLoading(false);
      }
    }, [schoolId]);
  
  useEffect(() => {
    if (schoolId) {
      fetchAdditionalData();
    }
  }, [schoolId, fetchAdditionalData]);
  
  // Create schoolData object for PrintableReport component (matches SchoolDataHook interface)
  const schoolData = useMemo(() => ({
    students,
    grades,
    sections,
    teachers,
    settings,
    learningAreas,
    coreValues,
    coreValueGrades,
    attendanceRecords,
    monthlySchoolDaysConfig: [], // TODO: Load from settings if needed
    loading,
    error
  }), [students, grades, sections, teachers, settings, learningAreas, coreValues, coreValueGrades, attendanceRecords, loading, error]);
  
  // Find current teacher record
  const currentTeacher = useMemo(() => {
    return teachers.find(t => t.email === userEmail);
  }, [teachers, userEmail]);

  // Selection state for bulk operations
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  // Pagination state for performance with large datasets
  const [currentPage, setCurrentPage] = useState(1);
  const STUDENTS_PER_PAGE = 30; // Show 30 students per page
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<any>(null);

  // Filter and process students
  const filteredStudents = useMemo(() => {
    let filtered = [...students];

    // TEACHER FILTER: If logged in as teacher, only show their students
    // Detect teacher accounts by email pattern (teacher-*, *@teach*, etc.)
    const isTeacher = currentUser?.email?.includes('teacher') || currentUser?.email?.includes('@teach');
    
    if (currentTeacher && currentTeacher.id) {
      // Teacher has record in teachers collection - filter by advised sections
      filtered = filtered.filter(student => {
        // Find the section this student belongs to
        const studentSection = sections.find(s => s.id === student.sectionId);
        if (!studentSection) return false;
        
        // Check if current teacher is the adviser of this section
        return studentSection.adviserId === currentTeacher.id;
      });
    } else if (isTeacher && !currentTeacher) {
      // Teacher account exists but no teacher record in Firestore
      // Default to showing NO students (safe default until teacher profile is created)
      filtered = [];
    }

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
  }, [students, searchQuery, selectedGradeLevel, selectedSectionId, sections, currentTeacher]);
  
  // Paginated students for rendering
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * STUDENTS_PER_PAGE;
    const endIndex = startIndex + STUDENTS_PER_PAGE;
    return filteredStudents.slice(startIndex, endIndex);
  }, [filteredStudents, currentPage]);
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGradeLevel, selectedSectionId, performanceFilter, selectedQuarter]);

  // Get available grade levels
  const availableGradeLevels = useMemo(() => {
    const grades = new Set(sections.map(s => s.gradeLevel.toString()));
    return Array.from(grades).sort((a, b) => parseInt(a) - parseInt(b));
  }, [sections]);

  // Get sections for selected grade (filtered by teacher if applicable)
  const availableSections = useMemo(() => {
    let sectionsToShow = sections;
    
    // TEACHER FILTER: If logged in as teacher, only show their sections
    if (currentTeacher && currentTeacher.id) {
      sectionsToShow = sections.filter(s => s.adviserId === currentTeacher.id);
    }
    
    if (selectedGradeLevel === 'all') return sectionsToShow;
    return sectionsToShow.filter(s => s.gradeLevel.toString() === selectedGradeLevel);
  }, [sections, selectedGradeLevel, currentTeacher]);

  // Bulk operations - Memoized to prevent unnecessary re-renders
  const handleSelectAll = useCallback(() => {
    setSelectedStudents(filteredStudents.map(s => s.id));
  }, [filteredStudents]);

  const handleDeselectAll = useCallback(() => {
    setSelectedStudents([]);
  }, []);

  const handleStudentToggle = useCallback((studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  }, []);

  const handlePrintSelected = useCallback(() => {
    if (selectedStudents.length === 0) return;
    const studentIds = selectedStudents.join(',');
    navigate(`/reports/form138/print?students=${studentIds}`);
  }, [selectedStudents, navigate]);

  const handlePrintSingleStudent = useCallback((studentId: string) => {
    navigate(`/reports/form138/print?students=${studentId}`);
  }, [navigate]);
  
  // Alias for backward compatibility
  const handlePrintStudent = handlePrintSingleStudent;

  const handleViewStudent = useCallback((studentId: string) => {
    // Navigate to print page instead of showing modal
    navigate(`/reports/form138/print?students=${studentId}`);
  }, [navigate]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedGradeLevel('all');
    setSelectedSectionId('all');
    setPerformanceFilter('all');
    setSelectedQuarter('all');
  }, []);

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
              {currentTeacher && (
                <span className="bg-blue-500/30 px-3 py-1 rounded-full">
                  👨‍🏫 Viewing your students only
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-6xl font-bold opacity-90">{statistics.totalStudents}</div>
            <div className="text-blue-200 text-sm">
              {currentTeacher ? 'Your Students' : 'Students Available'}
            </div>
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
          
          {/* Pagination Info */}
          {filteredStudents.length > STUDENTS_PER_PAGE && (
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * STUDENTS_PER_PAGE) + 1} - {Math.min(currentPage * STUDENTS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length}
            </div>
          )}
        </div>

        {/* Student List */}
        {filteredStudents.length === 0 ? (
          currentUser?.email?.includes('teacher') && !currentTeacher ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Teacher Profile Not Set Up</h3>
              <p className="text-gray-700 mb-4">
                Your teacher account has been created, but your profile hasn't been added to the system yet.
              </p>
              <p className="text-sm text-gray-600">
                Please contact your administrator to:
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• Create your teacher profile in the system</li>
                <li>• Assign you as an adviser to a section</li>
              </ul>
              <p className="text-xs text-gray-500 mt-4">
                Once set up, you'll be able to view and manage report cards for your students.
              </p>
            </div>
          ) : (
            <EmptyState 
              title="No Students Found"
              message="No students match your current filters. Try adjusting your search criteria."
            />
          )
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedStudents.map(student => {
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
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <div className="text-sm text-gray-700">
                Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 text-sm border rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
              
              <div className="text-sm text-gray-600">
                {filteredStudents.length} total students
              </div>
            </div>
          )}
          </>
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