import { useState, useMemo } from 'react';
import { useSchoolContext } from '../../../contexts/SchoolContext';
import { useStudentsPostgreSQL } from '../../../hooks/useStudentsPostgreSQL';
import { useSectionsPostgreSQL } from '../../../hooks/useSectionsPostgreSQL';
import type { AuthUser, StudentUser, ParentUser, Student, Section } from '../../../types';
import BackButton from '../../BackButton';
import { 
  AcademicCapIcon, 
  ClipboardDocumentListIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon
} from '../../icons';

interface SF1DashboardProps {
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
  onBack: () => void;
}

interface EnrollmentStats {
  totalEnrolled: number;
  byGradeLevel: { [key: number]: number };
  bySection: { [key: string]: { name: string; count: number } };
  byGender: { male: number; female: number; unspecified: number };
  newEnrollees: number;
  transferees: number;
}

// Utility function to export data as CSV
const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
        ? `"${value.replace(/"/g, '""')}"` 
        : value;
    }).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const SF1Dashboard: React.FC<SF1DashboardProps> = ({ session: _session, onBack: _onBack }) => {
  const { schoolId } = useSchoolContext();
  const { students, loading: studentsLoading } = useStudentsPostgreSQL({ schoolId });
  const { sections, loading: sectionsLoading } = useSectionsPostgreSQL({ schoolId });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Student>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [savedStudentData, setSavedStudentData] = useState<Partial<Student> | null>(null);

  const loading = studentsLoading || sectionsLoading;

  // Calculate enrollment statistics
  const enrollmentStats = useMemo((): EnrollmentStats => {
    const activeStudents = students.filter((student: Student) => 
      student.status !== 'transferred' && student.status !== 'dropped' && student.status !== 'graduated'
    );

    const stats: EnrollmentStats = {
      totalEnrolled: activeStudents.length,
      byGradeLevel: {},
      bySection: {},
      byGender: { male: 0, female: 0, unspecified: 0 },
      newEnrollees: 0,
      transferees: 0
    };

    // Calculate current school year for new enrollees
    const currentYear = new Date().getFullYear();
    const currentSchoolYear = new Date().getMonth() >= 6 ? currentYear : currentYear - 1;

    activeStudents.forEach((student: Student) => {
      // Count by section and derive grade level
      const section = sections.find((s: Section) => s.id === student.sectionId);
      if (section) {
        const gradeLevel = section.gradeLevel;
        
        // By grade level
        stats.byGradeLevel[gradeLevel] = (stats.byGradeLevel[gradeLevel] || 0) + 1;
        
        // By section
        const sectionKey = `${gradeLevel}-${section.name}`;
        if (!stats.bySection[sectionKey]) {
          stats.bySection[sectionKey] = { name: `Grade ${gradeLevel} - ${section.name}`, count: 0 };
        }
        stats.bySection[sectionKey].count++;
      }

      // By gender
      if (student.sex === 'Male') {
        stats.byGender.male++;
      } else if (student.sex === 'Female') {
        stats.byGender.female++;
      } else {
        stats.byGender.unspecified++;
      }

      // New enrollees vs transferees
      const enrollmentYear = new Date(student.enrollmentDate).getFullYear();
      if (enrollmentYear === currentSchoolYear) {
        if (student.previousSchool) {
          stats.transferees++;
        } else {
          stats.newEnrollees++;
        }
      }
    });

    return stats;
  }, [students, sections]);

  // Filter students based on search and filters
  const filteredStudents = useMemo(() => {
    return students.filter((student: Student) => {
      // Filter by active status
      if (student.status === 'transferred' || student.status === 'dropped' || student.status === 'graduated') {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          student.name.toLowerCase().includes(query) ||
          student.lrn?.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Grade level filter
      if (selectedGradeLevel !== null) {
        const section = sections.find((s: Section) => s.id === student.sectionId);
        if (!section || section.gradeLevel !== selectedGradeLevel) return false;
      }

      // Section filter
      if (selectedSection && student.sectionId !== selectedSection) return false;

      return true;
    });
  }, [students, sections, searchQuery, selectedGradeLevel, selectedSection]);

  const gradeLevels = [...new Set(sections.map((s: Section) => s.gradeLevel))].sort() as number[];

  // Export SF1 data function
  const exportSF1Data = () => {
    const exportData = filteredStudents.map(student => {
      const section = sections.find((s: Section) => s.id === student.sectionId);
      return {
        'Student Name': student.name,
        'LRN': student.lrn || 'Not set',
        'Email': student.email,
        'Gender': student.sex || 'Not specified',
        'Grade Level': section?.gradeLevel || 'Unassigned',
        'Section': section?.name || 'Unassigned',
        'Enrollment Date': student.enrollmentDate,
        'Status': student.status || 'active',
        'Date of Birth': student.dateOfBirth || 'Not set',
        'Contact Number': student.contactNumber || 'Not set',
        'Address': student.address || 'Not set'
      };
    });

    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `SF1_Enrollment_Record_${currentDate}.csv`;
    
    exportToCSV(exportData, filename);
  };

  // View student details function
  const viewStudentDetails = (student: Student) => {
    setSelectedStudent(student);
    setEditForm(student);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (field: keyof Student, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle save student changes
  const handleSaveStudent = () => {
    if (!selectedStudent || !editForm) return;
    
    // Store the saved student data for success modal
    const updatedStudent = { ...selectedStudent, ...editForm };
    setSavedStudentData(updatedStudent);
    setSuccessMessage(`Student "${editForm.name || selectedStudent.name}" updated successfully!`);
    
    // In a real application, you would make an API call to update the student
    // For now, we'll show a premium success modal
    
    // Reset edit mode and close edit modal
    setIsEditMode(false);
    setIsModalOpen(false);
    
    // Show success modal
    setShowSuccessModal(true);
    
    // Auto-close success modal after 4 seconds
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 4000);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    if (!selectedStudent) return;
    
    // Reset form to original student data
    setEditForm(selectedStudent);
    setIsEditMode(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading enrollment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackButton />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  SF1 - School Register (Enrollment)
                </h1>
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  EBEIS-compliant student enrollment records and statistics
                </p>
              </div>
            </div>
          </div>


        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Enrolled */}
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Enrolled</p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {enrollmentStats.totalEnrolled.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 text-white">
                  <UsersIcon />
                </div>
              </div>
            </div>
          </div>

          {/* New Enrollees */}
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">New Enrollees</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {enrollmentStats.newEnrollees.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Transferees */}
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Transferees</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {enrollmentStats.transferees.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 text-white">
                  <AcademicCapIcon />
                </div>
              </div>
            </div>
          </div>

          {/* Gender Distribution */}
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Gender Split</p>
                <div className="flex space-x-4 mt-1">
                  <span className="text-lg font-semibold text-blue-600">M: {enrollmentStats.byGender.male}</span>
                  <span className="text-lg font-semibold text-pink-600">F: {enrollmentStats.byGender.female}</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-pink-600 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 text-white">
                  <ChartBarIcon />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grade Level Breakdown */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
            <div className="w-5 h-5 mr-2">
              <AcademicCapIcon />
            </div>
            Enrollment by Grade Level
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {gradeLevels.map((gradeLevel: number) => (
              <div key={gradeLevel} className="text-center p-4 bg-slate-50/50 dark:bg-slate-700/50 rounded-xl">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {enrollmentStats.byGradeLevel[gradeLevel] || 0}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">Grade {gradeLevel}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">
                <MagnifyingGlassIcon />
              </div>
              <input
                type="text"
                placeholder="Search by name, LRN, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <select
                aria-label="Filter by grade level"
                value={selectedGradeLevel || ''}
                onChange={(e) => setSelectedGradeLevel(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <option value="">All Grades</option>
                {gradeLevels.map((grade: number) => (
                  <option key={grade} value={grade}>Grade {grade}</option>
                ))}
              </select>

              <select
                aria-label="Filter by section"
                value={selectedSection || ''}
                onChange={(e) => setSelectedSection(e.target.value || null)}
                className="px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <option value="">All Sections</option>
                {sections
                  .filter(section => !selectedGradeLevel || section.gradeLevel === selectedGradeLevel)
                  .map(section => (
                    <option key={section.id} value={section.id}>
                      Grade {section.gradeLevel} - {section.name}
                    </option>
                  ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'cards'
                      ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100'
                  }`}
                >
                  Table
                </button>
              </div>

              {/* Export Button */}
              <button
                onClick={exportSF1Data}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <div className="w-4 h-4">
                  <ArrowDownTrayIcon />
                </div>
                <span>Export SF1</span>
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
            <span>Showing {filteredStudents.length} of {enrollmentStats.totalEnrolled} enrolled students</span>
            {(searchQuery || selectedGradeLevel || selectedSection) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGradeLevel(null);
                  setSelectedSection(null);
                }}
                className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Student List */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map(student => {
              const section = sections.find(s => s.id === student.sectionId);
              return (
                <div key={student.id} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        {student.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        LRN: {student.lrn || 'Not set'}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      student.status === 'active' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                    }`}>
                      {student.status || 'Active'}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Section:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {section ? `Grade ${section.gradeLevel} - ${section.name}` : 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Gender:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {student.sex || 'Not specified'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Enrollment:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {new Date(student.enrollmentDate).toLocaleDateString()}
                      </span>
                    </div>
                    {student.previousSchool && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-300">From:</span>
                        <span className="font-medium text-orange-600 dark:text-orange-400 text-xs">
                          {student.previousSchool}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                    <button 
                      onClick={() => viewStudentDetails(student)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-800/30 dark:hover:to-purple-800/30 transition-all duration-200"
                    >
                      <div className="w-4 h-4">
                        <DocumentTextIcon />
                      </div>
                      <span className="text-sm font-medium">View Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl border border-white/20 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Student Information
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Section
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Enrollment Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                  {filteredStudents.map(student => {
                    const section = sections.find(s => s.id === student.sectionId);
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                              {student.name}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-300">
                              LRN: {student.lrn || 'Not set'} • {student.sex || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {section ? `Grade ${section.gradeLevel} - ${section.name}` : 'Unassigned'}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${
                            student.status === 'active' 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                          }`}>
                            {student.status || 'Active'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {new Date(student.enrollmentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => viewStudentDetails(student)}
                            aria-label={`View details for ${student.name}`}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800/30 transition-all duration-200 text-sm"
                          >
                            <div className="w-4 h-4">
                              <DocumentTextIcon />
                            </div>
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredStudents.length === 0 && (
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-12 border border-white/20 shadow-lg text-center">
            <div className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4">
              <ClipboardDocumentListIcon />
            </div>
            <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
              No students found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {searchQuery || selectedGradeLevel || selectedSection
                ? 'Try adjusting your search criteria or filters.'
                : 'No enrolled students in the system.'}
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Student Details Modal */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Modal Container */}
          <div className="flex items-center justify-center min-h-screen px-4 py-6">
            <div 
              className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full mx-auto transform transition-all duration-300 scale-100 opacity-100 border border-slate-200/50 dark:border-slate-700/50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 px-8 py-6">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-4 -translate-x-4" />
                
                {/* Close Button */}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 flex items-center justify-center text-white hover:scale-110"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {/* Header Content */}
                <div className="relative">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-1">{selectedStudent.name}</h2>
                      <p className="text-indigo-100/80 text-sm">
                        {isEditMode ? 'Edit Student Information' : 'Student Enrollment Details'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                        LRN: {selectedStudent.lrn || 'Not set'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-8 py-6 space-y-6">
                {(() => {
                  const section = sections.find((s: Section) => s.id === selectedStudent.sectionId);
                  
                  return (
                    <>
                      {/* Personal Information Card */}
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-700/30 dark:to-slate-800/30 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-600/30">
                        <div className="flex items-center mb-4">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Personal Information</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Full Name</p>
                            {isEditMode ? (
                              <input
                                type="text"
                                value={editForm.name || ''}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Enter student name"
                                aria-label="Student full name"
                                className="w-full px-3 py-2 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                              />
                            ) : (
                              <p className="text-slate-800 dark:text-slate-200 font-medium">{selectedStudent.name}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Gender</p>
                            {isEditMode ? (
                              <select
                                value={editForm.sex || ''}
                                onChange={(e) => handleInputChange('sex', e.target.value)}
                                aria-label="Student gender"
                                className="w-full px-3 py-2 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                              >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                              </select>
                            ) : (
                              <p className="text-slate-800 dark:text-slate-200">{selectedStudent.sex || 'Not specified'}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date of Birth</p>
                            {isEditMode ? (
                              <input
                                type="date"
                                value={editForm.dateOfBirth || ''}
                                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                aria-label="Student date of birth"
                                className="w-full px-3 py-2 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                              />
                            ) : (
                              <p className="text-slate-800 dark:text-slate-200">{selectedStudent.dateOfBirth || 'Not set'}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Email Address</p>
                            {isEditMode ? (
                              <input
                                type="email"
                                value={editForm.email || ''}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="Enter email address"
                                aria-label="Student email address"
                                className="w-full px-3 py-2 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                              />
                            ) : (
                              <p className="text-slate-800 dark:text-slate-200 break-all">{selectedStudent.email}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Contact Number</p>
                            {isEditMode ? (
                              <input
                                type="tel"
                                value={editForm.contactNumber || ''}
                                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                                placeholder="Enter contact number"
                                aria-label="Student contact number"
                                className="w-full px-3 py-2 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                              />
                            ) : (
                              <p className="text-slate-800 dark:text-slate-200">{selectedStudent.contactNumber || 'Not set'}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Address</p>
                            {isEditMode ? (
                              <textarea
                                value={editForm.address || ''}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                rows={2}
                                placeholder="Enter student address"
                                aria-label="Student address"
                                className="w-full px-3 py-2 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none"
                              />
                            ) : (
                              <p className="text-slate-800 dark:text-slate-200">{selectedStudent.address || 'Not set'}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Academic Information Card */}
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-2xl p-6 border border-emerald-200/50 dark:border-emerald-600/30">
                        <div className="flex items-center mb-4">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10V9a1 1 0 011-1h4a1 1 0 011 1v12M9 7h1m-1 4h1" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Academic Information</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Grade Level</p>
                            <p className="text-slate-800 dark:text-slate-200 font-medium">Grade {section?.gradeLevel || 'Unassigned'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Section</p>
                            <p className="text-slate-800 dark:text-slate-200">{section?.name || 'Unassigned'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Enrollment Date</p>
                            <p className="text-slate-800 dark:text-slate-200">{selectedStudent.enrollmentDate}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</p>
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                selectedStudent.status === 'active' ? 'bg-green-500' : 
                                selectedStudent.status === 'inactive' ? 'bg-red-500' : 'bg-yellow-500'
                              }`} />
                              <span className={`text-sm font-medium capitalize ${
                                selectedStudent.status === 'active' ? 'text-green-600 dark:text-green-400' : 
                                selectedStudent.status === 'inactive' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                              }`}>
                                {selectedStudent.status || 'active'}
                              </span>
                            </div>
                          </div>
                          {selectedStudent.parentIds && selectedStudent.parentIds.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Parent Contacts</p>
                              <p className="text-slate-800 dark:text-slate-200">{selectedStudent.parentIds.length} registered</p>
                            </div>
                          )}
                          {selectedStudent.remarks && (
                            <div className="space-y-1 md:col-span-2">
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Remarks</p>
                              <p className="text-slate-800 dark:text-slate-200">{selectedStudent.remarks}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-700/30 rounded-b-3xl border-t border-slate-200/50 dark:border-slate-600/30">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all duration-200 shadow-sm"
                  >
                    Close
                  </button>
                  {!isEditMode ? (
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Edit Student
                    </button>
                  ) : (
                    <div className="flex space-x-3">
                      <button
                        onClick={handleCancelEdit}
                        className="px-6 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all duration-200 shadow-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveStudent}
                        className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Success Confirmation Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full transform transition-all duration-300 ease-out scale-100"
            onClick={e => e.stopPropagation()}
          >
            {/* Animated Progress Bar */}
            <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-t-2xl animate-shrink-width"></div>
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Animated Success Icon */}
                  <div className="flex-shrink-0 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center animate-pulse">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Update Successful!</h3>
                    <p className="text-green-100 text-sm opacity-90">Student record has been updated</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="text-white hover:text-green-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-10"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Success Message */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-800 dark:text-green-300 font-medium">{successMessage}</p>
                </div>
              </div>

              {/* Student Information Summary */}
              {savedStudentData && (
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Updated Student Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Name:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{savedStudentData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">LRN:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{savedStudentData.lrn || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Email:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{savedStudentData.email || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        savedStudentData.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {savedStudentData.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Development Note */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-blue-800 dark:text-blue-300 text-sm font-medium">Development Mode</p>
                    <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">In production, this would save to the database and update all related records.</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    // Could navigate to student list or perform another action
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes shrink-width {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shrink-width {
          animation: shrink-width 4s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default SF1Dashboard;