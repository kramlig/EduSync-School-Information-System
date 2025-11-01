import React, { useState, useMemo, useRef, useEffect } from 'react';
import { SchoolDataState } from '../hooks/useSchoolData';
import type { Student, AuthUser, StudentUser } from '../types';
import Modal from './Modal';
import StudentProfile from './StudentProfile';
import { UserCircleIcon, PencilIcon, TrashIcon } from './icons';
import { useDebounce } from '../hooks/useDebounce';
import { uploadStudentPhoto, deleteStudentPhoto, getPlaceholderAvatar } from '../src/services/studentPhotoService';
import WebcamCapture from './WebcamCapture';
import ImageCropModal from './ImageCropModal';

interface StudentListProps {
  schoolData: SchoolDataState & { 
    loading: boolean;
    error: string | null;
    refresh: () => void; // Added refresh
    addStudent: (student: Omit<Student, 'id' | 'enrollmentDate'>) => Promise<{ success: boolean; message?: string; }>;
    updateStudent: (student: Student) => void;
    deleteStudent: (studentId: string) => void;
    fetchMoreStudents: () => Promise<void>; // Added pagination functions
    hasMoreStudents: boolean; // Added pagination state
    isFetchingStudents: boolean; // Added pagination state
    searchStudents: (query: string) => Promise<Student[]>; // Added search function
    isSearching: boolean; // Added search state
  };
  session: { user: AuthUser | StudentUser, type: 'staff' | 'student' };
}

const StudentList: React.FC<StudentListProps> = ({ schoolData, session }) => {
  const { students, teachers, sections, addStudent, settings, updateStudent, deleteStudent, grades, attendanceRecords, coreValueGrades, substituteAssignments, classSchedules, parents, fetchMoreStudents, hasMoreStudents, isFetchingStudents, searchStudents, isSearching } = schoolData;
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [addStudentError, setAddStudentError] = useState<string | null>(null);
  const [editTab, setEditTab] = useState<'basic' | 'contact' | 'guardian' | 'academic' | 'health'>('basic');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  
  const [newStudent, setNewStudent] = useState<Omit<Student, 'id' | 'enrollmentDate'>>({ name: '', email: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [searchResults, setSearchResults] = useState<Student[] | null>(null);
  
  // New UI state
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'lrn' | 'grade'>('name');
  
  const authUser = session.user as AuthUser;

  // Feature flag: Server-side pagination is now ENABLED
  const USE_SERVER_PAGINATION = true;

  // Determine authorized section IDs for teachers
  const authorizedSectionIds = useMemo(() => {
    if (['admin', 'principal', 'registrar'].includes(authUser.role)) {
      return null; // null means all sections
    }

    const sectionIds = new Set<string>();
    
    // 1. Sections where the user is the adviser
    const teacherAdviserSection = sections.find(s => s.adviserId === authUser.id);
    if (teacherAdviserSection) {
      sectionIds.add(teacherAdviserSection.id);
    }
    
    // 2. Sections where the user is a substitute
    const today = new Date().toISOString().split('T')[0];
    const activeSubAssignments = substituteAssignments.filter(sub => 
      sub.teacherId === authUser.id &&
      today >= sub.startDate &&
      today <= sub.endDate
    );

    if (activeSubAssignments.length > 0) {
      const originalTeacherIds = activeSubAssignments.map(sub => sub.originalTeacherId);
      sections.forEach(s => {
        if (s.adviserId && originalTeacherIds.includes(s.adviserId)) {
          sectionIds.add(s.id);
        }
      });
      classSchedules.forEach(schedule => {
        if (schedule.teacherId && schedule.sectionId && originalTeacherIds.includes(schedule.teacherId)) {
          sectionIds.add(schedule.sectionId);
        }
      });
    }

    // 3. Sections where the user is assigned as a subject teacher
    classSchedules.forEach(schedule => {
      if (schedule.teacherId === authUser.id && schedule.sectionId) {
        sectionIds.add(schedule.sectionId);
      }
    });

    return sectionIds.size > 0 ? sectionIds : new Set<string>();
  }, [authUser, sections, substituteAssignments, classSchedules]);

  // Server-side search effect
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchQuery.trim()) {
        console.log(`[StudentList] 🔍 Triggering server-side search: "${debouncedSearchQuery}"`);
        const results = await searchStudents(debouncedSearchQuery);
        setSearchResults(results);
      } else {
        // Clear search results when query is empty
        setSearchResults(null);
      }
    };

    performSearch();
  }, [debouncedSearchQuery, searchStudents]);

  // Now directly use students from schoolData, which is paginated
  const visibleStudents = useMemo(() => {
    // If searching, use search results instead of paginated students
    const sourceStudents = searchResults !== null ? searchResults : students;
    
    console.log(`[StudentList] visibleStudents calc: searchResults=${searchResults?.length || 'null'}, students=${students.length}, authorizedSections=${authorizedSectionIds?.size || 'all'}`);
    
    // Apply section filtering for teachers
    if (authorizedSectionIds && authorizedSectionIds.size > 0) {
      const filtered = sourceStudents.filter(s => s.sectionId && authorizedSectionIds.has(s.sectionId));
      console.log(`[StudentList] After section filter: ${filtered.length} students (from ${sourceStudents.length})`);
      if (searchResults !== null && filtered.length === 0 && sourceStudents.length > 0) {
        console.warn(`[StudentList] ⚠️ Search found ${sourceStudents.length} students, but none are in authorized sections!`);
        console.warn(`[StudentList] Authorized section IDs:`, Array.from(authorizedSectionIds));
        console.warn(`[StudentList] Student section IDs:`, sourceStudents.map(s => s.sectionId));
      }
      return filtered;
    }
    return sourceStudents;
  }, [students, authorizedSectionIds, searchResults]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStudent(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStudentError(null);
    if (newStudent.name && newStudent.email && newStudent.sectionId) {
      try {
        const result = await addStudent(newStudent);
        if (result.success) {
          setNewStudent({ name: '', email: '' });
          setIsAddModalOpen(false);
          // Refresh paginated data
          schoolData.refresh();
        } else {
          setAddStudentError(result.message || 'An unknown error occurred.');
        }
      } catch (err: any) {
        setAddStudentError(err?.message || 'An unknown error occurred.');
      }
    }
  };
  
  const handleViewProfile = (student: Student) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  }
  
  const handleEditProfile = (student: Student) => {
    setStudentToEdit({ ...student });
    setEditTab('basic'); // Reset to first tab
    setIsEditModalOpen(true);
  };
  
  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentToEdit) {
      updateStudent(studentToEdit);
      setIsEditModalOpen(false);
      setStudentToEdit(null);
      // Refresh paginated data
      schoolData.refresh();
    }
  };
  
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (studentToEdit) {
      const { name, value } = e.target;
      setStudentToEdit({ ...studentToEdit, [name]: value });
    }
  };

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };
  
  const confirmDeleteStudent = () => {
    if (studentToDelete) {
      deleteStudent(studentToDelete.id);
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
      // Refresh paginated data
      schoolData.refresh();
    }
  };

  // Photo removal handler
  const handleRemovePhoto = async () => {
    if (!studentToEdit || !studentToEdit.photoPath) return;

    if (!confirm('Are you sure you want to remove this photo?')) return;

    setPhotoError(null);
    setPhotoUploading(true);

    try {
      await deleteStudentPhoto(studentToEdit.photoPath);
      
      // Update student to remove photo
      const updatedStudent = {
        ...studentToEdit,
        photoURL: undefined,
        photoPath: undefined,
        photoUploadedAt: undefined,
      };
      setStudentToEdit(updatedStudent);
      
      // Persist to Firestore
      await updateStudent(updatedStudent);
      
      // Update search results if we're currently showing search results
      if (searchResults) {
        setSearchResults(prevResults => 
          prevResults ? prevResults.map(s => s.id === updatedStudent.id ? updatedStudent : s) : null
        );
      }
    } catch (error: any) {
      setPhotoError(error.message || 'Failed to remove photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  // Webcam capture handler
  const handleWebcamCapture = (blob: Blob) => {
    setShowWebcam(false);
    // Convert blob to URL for cropping
    const imageUrl = URL.createObjectURL(blob);
    setImageToCrop(imageUrl);
    setCapturedBlob(blob);
    setShowCropModal(true);
  };

  // Cropped image handler
  const handleCroppedImage = async (croppedBlob: Blob) => {
    if (!studentToEdit) return;

    setShowCropModal(false);
    setImageToCrop(null);
    setPhotoError(null); // Clear previous errors
    setPhotoUploading(true);

    try {
      // Convert blob to file
      const file = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' }); // Ensure consistent filename
      console.log('[StudentList] 📤 Uploading photo for student:', studentToEdit.id);
      const { url, path } = await uploadStudentPhoto(studentToEdit.id, file);
      console.log('[StudentList] ✅ Photo uploaded. URL:', url);
      
      // Update student with new photo
      const updatedStudent = {
        ...studentToEdit,
        photoURL: url,
        photoPath: path,
        photoUploadedAt: new Date().toISOString(),
      };
      
      console.log('[StudentList] 💾 Saving student with photo to Firestore...');
      // IMPORTANT: Persist the photoURL and photoPath to Firestore
      await updateStudent(updatedStudent);
      console.log('[StudentList] ✅ Photo saved to Firestore successfully');
      
      // Update local state AFTER successful Firestore save
      setStudentToEdit(updatedStudent);
      
      // Force refresh school data to get updated student from Firestore
      await schoolData.refresh();
      
      // Update search results if we're currently showing search results
      if (searchResults) {
        setSearchResults(prevResults => 
          prevResults ? prevResults.map(s => s.id === updatedStudent.id ? updatedStudent : s) : null
        );
      }

      // Clear captured blob
      setCapturedBlob(null);
      
      alert('✅ Photo uploaded successfully!');
    } catch (error: any) {
      console.error('[StudentList] ❌ Error uploading student photo:', error); // Log error for debugging
      setPhotoError(error.message || 'Failed to upload photo. Please try again.');
      alert(`❌ Failed to upload photo: ${error.message}`);
    } finally {
      setPhotoUploading(false);
    }
  };

  // File upload with crop option
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null); // Clear previous errors on new file selection

    // Create URL for cropping
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setCapturedBlob(file);
    setShowCropModal(true);
    
    // Reset file input
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  // Pagination Logic - now fully server-side
  const filteredAndPaginatedStudents = useMemo(() => {
    // Start with visible students (already filtered by server-side search if applicable)
    // Don't apply client-side search filter again - server already did that
    let filtered = visibleStudents;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => (s.status || 'active') === statusFilter);
    }

    // Apply grade filter
    if (gradeFilter !== 'all') {
      filtered = filtered.filter(s => {
        const section = sections.find(sec => sec.id === s.sectionId);
        return section && section.gradeLevel.toString() === gradeFilter;
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'lrn') {
        return (a.lrn || '').localeCompare(b.lrn || '');
      } else if (sortBy === 'grade') {
        const sectionA = sections.find(s => s.id === a.sectionId);
        const sectionB = sections.find(s => s.id === b.sectionId);
        return (sectionA?.gradeLevel || 0) - (sectionB?.gradeLevel || 0);
      }
      return 0;
    });

    return sorted;
  }, [visibleStudents, statusFilter, gradeFilter, sortBy, sections]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const allStudents = visibleStudents;
    const activeCount = allStudents.filter(s => (s.status || 'active') === 'active').length;
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const newThisMonth = allStudents.filter(s => {
      const enrollDate = new Date(s.enrollmentDate);
      return enrollDate >= thisMonth;
    }).length;

    return {
      total: allStudents.length,
      active: activeCount,
      newThisMonth,
      filtered: filteredAndPaginatedStudents.length,
    };
  }, [visibleStudents, filteredAndPaginatedStudents]);

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setAddStudentError(null);
  }

  const canManageStudents = ['admin', 'registrar'].includes(authUser.role);

  // Get unique grade levels for filter - ONLY from authorized sections
  const availableGrades = useMemo(() => {
    // Filter sections based on authorization
    let authorizedSections = sections;
    if (authorizedSectionIds !== null) {
      authorizedSections = sections.filter(s => authorizedSectionIds.has(s.id));
    }
    
    const grades = new Set(authorizedSections.map(s => s.gradeLevel.toString()));
    return Array.from(grades).sort((a, b) => parseInt(a) - parseInt(b));
  }, [sections, authorizedSectionIds]);

  return (
    <div className="space-y-6 pb-6">
      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Students</h1>
              <p className="text-indigo-100 text-sm mt-1">Manage and track student information</p>
            </div>
          </div>
          {canManageStudents && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-white text-indigo-600 font-semibold py-2.5 px-6 rounded-lg hover:bg-indigo-50 transition-all shadow-lg flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Student
            </button>
          )}
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Total Students</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">{statistics.total}</p>
            </div>
            <div className="bg-blue-200 dark:bg-blue-800 p-3 rounded-lg">
              <svg className="h-8 w-8 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Students */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30 border-2 border-green-200 dark:border-green-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Active</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">{statistics.active}</p>
            </div>
            <div className="bg-green-200 dark:bg-green-800 p-3 rounded-lg">
              <svg className="h-8 w-8 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* New This Month */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/30 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">New This Month</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">{statistics.newThisMonth}</p>
            </div>
            <div className="bg-purple-200 dark:bg-purple-800 p-3 rounded-lg">
              <svg className="h-8 w-8 text-purple-600 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Filtered Results */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/30 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Showing</p>
              <p className="text-3xl font-bold text-amber-900 dark:text-amber-100 mt-2">{statistics.filtered}</p>
            </div>
            <div className="bg-amber-200 dark:bg-amber-800 p-3 rounded-lg">
              <svg className="h-8 w-8 text-amber-600 dark:text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Box */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Search Students</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or LRN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                </div>
              )}
              {searchQuery && !isSearching && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors z-10"
                  title="Clear search"
                  type="button"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              title="Filter by student status"
              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="transferred">Transferred</option>
              <option value="graduated">Graduated</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>

          {/* Grade Filter */}
          <div className="w-full lg:w-48">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Grade Level</label>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              title="Filter by grade level"
              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
            >
              <option value="all">All Grades</option>
              {availableGrades.map(grade => (
                <option key={grade} value={grade}>Grade {grade}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="w-full lg:w-48">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'lrn' | 'grade')}
              title="Sort students by"
              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
            >
              <option value="name">Name</option>
              <option value="lrn">LRN</option>
              <option value="grade">Grade Level</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="w-full lg:w-auto">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">View</label>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`p-3 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
                title="Table View"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
                title="Grid View"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                <th className="px-6 py-4 border-b-2 border-slate-200 dark:border-slate-600 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Name
                  </div>
                </th>
                <th className="px-6 py-4 border-b-2 border-slate-200 dark:border-slate-600 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    LRN
                  </div>
                </th>
                <th className="px-6 py-4 border-b-2 border-slate-200 dark:border-slate-600 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Grade & Section
                  </div>
                </th>
                <th className="px-6 py-4 border-b-2 border-slate-200 dark:border-slate-600 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Status
                  </div>
                </th>
                <th className="px-6 py-4 border-b-2 border-slate-200 dark:border-slate-600 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndPaginatedStudents.length === 0 && !schoolData.loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                      {!navigator.onLine ? (
                        <>
                          <div className="bg-slate-100 dark:bg-slate-700 p-6 rounded-full mb-4">
                            <svg className="w-16 h-16 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Cached Student Data</h3>
                          <p className="text-sm max-w-md text-slate-600 dark:text-slate-400">
                            You're offline and haven't visited this page online yet. Please connect to the internet to load student data, then it will be available offline.
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-6 rounded-full mb-4">
                            <svg className="w-16 h-16 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Students Found</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            {searchQuery || statusFilter !== 'all' || gradeFilter !== 'all' 
                              ? 'Try adjusting your filters or search terms.' 
                              : 'Start by adding your first student.'}
                          </p>
                          {canManageStudents && !searchQuery && statusFilter === 'all' && gradeFilter === 'all' && (
                            <button
                              onClick={() => setIsAddModalOpen(true)}
                              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Add Your First Student
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
              </tr>
            ) : (
              filteredAndPaginatedStudents.map((student) => {
              const section = sections.find(s => s.id === student.sectionId);
              
              const status = student.status || 'active';
              const statusColors = {
                active: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-200 border border-green-200 dark:border-green-800',
                inactive: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 dark:from-gray-900/30 dark:to-slate-900/30 dark:text-gray-200 border border-gray-200 dark:border-gray-800',
                transferred: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-200 border border-blue-200 dark:border-blue-800',
                graduated: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-200 border border-purple-200 dark:border-purple-800',
                dropped: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-200 border border-red-200 dark:border-red-800'
              };
              
              const statusIcons = {
                active: <svg className="h-3 w-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="5" /></svg>,
                inactive: <svg className="h-3 w-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>,
                transferred: <svg className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
                graduated: <svg className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>,
                dropped: <svg className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              };

              return (
              <tr key={student.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group">
                <td className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 border-2 border-indigo-200 dark:border-indigo-700 flex-shrink-0 ring-2 ring-transparent group-hover:ring-indigo-300 dark:group-hover:ring-indigo-600 transition-all">
                      {student.photoURL ? (
                        <img 
                          src={student.photoURL} 
                          alt={student.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img 
                          src={getPlaceholderAvatar(student.name)} 
                          alt={student.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${
                        status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <div>
                      <p className="text-slate-900 dark:text-white font-semibold">{student.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{student.email || 'No email'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-slate-700 dark:text-slate-300 font-mono text-sm">{student.lrn ?? 'N/A'}</p>
                </td>
                <td className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-1.5 rounded-lg">
                      <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {section ? `Grade ${section.gradeLevel} - ${section.name}` : 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <span className={`px-3 py-1.5 text-xs font-bold rounded-lg inline-flex items-center ${statusColors[status]}`}>
                    {statusIcons[status]}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewProfile(student)}
                      className="p-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                      title="View Profile"
                    >
                      <UserCircleIcon />
                    </button>
                     {canManageStudents && (<>
                        <button
                          onClick={() => handleEditProfile(student)}
                          className="p-2 text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-lg transition-all"
                          title="Edit Student"
                        >
                            <PencilIcon />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(student)}
                          className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                          title="Delete Student"
                        >
                            <TrashIcon />
                        </button>
                    </>)}
                  </div>
                </td>
              </tr>
            )
            })
            )}
          </tbody>
        </table>
        {(schoolData.loading || hasMoreStudents) && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-col xs:flex-row items-center xs:justify-between">
            {schoolData.loading ? (
              <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Loading students...</span>
            ) : (
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Showing <span className="font-bold text-slate-900 dark:text-white">{filteredAndPaginatedStudents.length}</span> students
              </span>
            )}
            <div className="inline-flex mt-2 xs:mt-0">
              <button
                onClick={fetchMoreStudents}
                disabled={!hasMoreStudents || isFetchingStudents}
                className="text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-2"
              >
                {isFetchingStudents ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Loading More...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Load More
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndPaginatedStudents.length === 0 && !schoolData.loading ? (
            <div className="col-span-full">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-16 text-center">
                <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 p-6 rounded-full mb-4">
                    <svg className="w-16 h-16 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Students Found</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {searchQuery || statusFilter !== 'all' || gradeFilter !== 'all' 
                      ? 'Try adjusting your filters or search terms.' 
                      : 'Start by adding your first student.'}
                  </p>
                  {canManageStudents && !searchQuery && statusFilter === 'all' && gradeFilter === 'all' && (
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Your First Student
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            filteredAndPaginatedStudents.map(student => {
              const section = sections.find(s => s.id === student.sectionId);
              const status = student.status || 'active';
              
              const statusColors = {
                active: 'border-green-400 dark:border-green-600',
                inactive: 'border-gray-400 dark:border-gray-600',
                transferred: 'border-blue-400 dark:border-blue-600',
                graduated: 'border-purple-400 dark:border-purple-600',
                dropped: 'border-red-400 dark:border-red-600'
              };
              
              const statusBadges = {
                active: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-200 border border-green-200 dark:border-green-800',
                inactive: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 dark:from-gray-900/30 dark:to-slate-900/30 dark:text-gray-200 border border-gray-200 dark:border-gray-800',
                transferred: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-200 border border-blue-200 dark:border-blue-800',
                graduated: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-200 border border-purple-200 dark:border-purple-800',
                dropped: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-200 border border-red-200 dark:border-red-800'
              };

              return (
                <div
                  key={student.id}
                  className={`bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl transition-all p-6 border-t-4 ${statusColors[status]} group cursor-pointer`}
                  onClick={() => handleViewProfile(student)}
                >
                  {/* Student Photo & Status */}
                  <div className="flex flex-col items-center mb-4">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 border-4 border-indigo-200 dark:border-indigo-700 mb-3 ring-4 ring-transparent group-hover:ring-indigo-300 dark:group-hover:ring-indigo-600 transition-all">
                      {student.photoURL ? (
                        <img 
                          src={student.photoURL} 
                          alt={student.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img 
                          src={getPlaceholderAvatar(student.name)} 
                          alt={student.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 ${
                        status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold rounded-lg ${statusBadges[status]}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>

                  {/* Student Info */}
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{student.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-1">{student.email || 'No email'}</p>
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      <span className="font-mono">{student.lrn ?? 'N/A'}</span>
                    </div>
                  </div>

                  {/* Section Info */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-center gap-2 text-sm text-indigo-700 dark:text-indigo-300">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="font-semibold">{section ? `Grade ${section.gradeLevel} - ${section.name}` : 'No Section'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleViewProfile(student); }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                    >
                      <UserCircleIcon />
                      View
                    </button>
                    {canManageStudents && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditProfile(student); }}
                          className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                        >
                          <PencilIcon />
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteClick(student); }}
                          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg transition-all text-sm flex items-center justify-center"
                          title="Delete"
                        >
                          <TrashIcon />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <Modal isOpen={isAddModalOpen} onClose={closeAddModal} title="Add New Student" size="2xl">
        <form onSubmit={handleAddStudent} className="space-y-6">
          {/* Student Information Section */}
          <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="name" 
                  id="name" 
                  value={newStudent.name} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                  required 
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email" 
                  name="email" 
                  id="email" 
                  value={newStudent.email} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                  required 
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="sectionId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Assign to Section <span className="text-red-500">*</span>
                </label>
                <select 
                  name="sectionId" 
                  id="sectionId" 
                  value={newStudent.sectionId ?? ''} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                  required
                >
                  <option value="">Select a Section...</option>
                  {sections.map(s => (
                    <option key={s.id} value={s.id}>Grade {s.gradeLevel} - {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="lrn" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  LRN (Learner Reference Number)
                </label>
                <input 
                  type="text" 
                  name="lrn" 
                  id="lrn" 
                  value={newStudent.lrn ?? ''} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                />
              </div>
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Date of Birth
                </label>
                <input 
                  type="date" 
                  name="dateOfBirth" 
                  id="dateOfBirth" 
                  value={newStudent.dateOfBirth ?? ''} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                />
              </div>
              <div>
                <label htmlFor="sex" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Sex
                </label>
                <select 
                  name="sex" 
                  id="sex" 
                  value={newStudent.sex ?? ''} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Student Status
                </label>
                <select 
                  name="status" 
                  id="status" 
                  value={newStudent.status ?? 'active'} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="transferred">Transferred</option>
                </select>
              </div>
            </div>
          </div>

          {/* Guardian/Emergency Contact Section */}
          <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Guardian / Emergency Contact</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              Required for emergency situations. Complete details can be added later via Edit.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="guardianName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Guardian Full Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="guardianName" 
                  id="guardianName" 
                  value={newStudent.guardianName ?? ''} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                  placeholder="e.g., Juan Dela Cruz"
                  required
                />
              </div>
              <div>
                <label htmlFor="guardianRelationship" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Relationship <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="guardianRelationship" 
                  id="guardianRelationship" 
                  value={newStudent.guardianRelationship ?? ''} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                  placeholder="Mother, Father, Grandparent, etc."
                  required
                />
              </div>
              <div>
                <label htmlFor="guardianContactNumber" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input 
                  type="tel" 
                  name="guardianContactNumber" 
                  id="guardianContactNumber" 
                  value={newStudent.guardianContactNumber ?? ''} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                  placeholder="+63 XXX XXX XXXX"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="guardianEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Guardian Email (Optional)
                </label>
                <input 
                  type="email" 
                  name="guardianEmail" 
                  id="guardianEmail" 
                  value={newStudent.guardianEmail ?? ''} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                  placeholder="guardian@example.com"
                />
              </div>
            </div>
          </div>

          {/* Additional Notes Section */}
          <div className="pb-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Additional Notes (Optional)</h3>
            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Initial Remarks
              </label>
              <textarea 
                name="remarks" 
                id="remarks" 
                value={newStudent.remarks ?? ''} 
                onChange={(e) => {
                  const { name, value } = e.target;
                  setNewStudent(prev => ({ ...prev, [name]: value }));
                }}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                placeholder="Any special notes during enrollment..."
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                💡 Complete student profile (address, health info, previous school) can be added later via the Edit button.
              </p>
            </div>
          </div>
          
          {addStudentError && (
            <div className="p-3 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-slate-900 dark:text-red-400" role="alert">
              <span className="font-medium">Error:</span> {addStudentError}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button 
              type="button" 
              onClick={closeAddModal} 
              className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Student
            </button>
          </div>
        </form>
      </Modal>
      
       <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Student Profile" size="2xl">
        {/* Tab Navigation */}
        <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
          <nav className="flex space-x-4" aria-label="Tabs">
            <button
              type="button"
              onClick={() => setEditTab('basic')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                editTab === 'basic'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Basic Info
            </button>
            <button
              type="button"
              onClick={() => setEditTab('contact')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                editTab === 'contact'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Contact & Address
            </button>
            <button
              type="button"
              onClick={() => setEditTab('guardian')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                editTab === 'guardian'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Guardian Info
            </button>
            <button
              type="button"
              onClick={() => setEditTab('academic')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                editTab === 'academic'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Academic Details
            </button>
            <button
              type="button"
              onClick={() => setEditTab('health')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                editTab === 'health'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Health & Other
            </button>
          </nav>
        </div>

        <form onSubmit={handleUpdateStudent} className="space-y-4">
          {/* Basic Info Tab */}
          {editTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="edit-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="name" 
                    id="edit-name" 
                    value={studentToEdit?.name ?? ''} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                    required 
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="edit-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="email" 
                    name="email" 
                    id="edit-email" 
                    value={studentToEdit?.email ?? ''} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                    required 
                  />
                </div>
                <div>
                  <label htmlFor="edit-lrn" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    LRN
                  </label>
                  <input 
                    type="text" 
                    name="lrn" 
                    id="edit-lrn" 
                    value={studentToEdit?.lrn ?? ''} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                  />
                </div>
                <div>
                  <label htmlFor="edit-dateOfBirth" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Date of Birth
                  </label>
                  <input 
                    type="date" 
                    name="dateOfBirth" 
                    id="edit-dateOfBirth" 
                    value={studentToEdit?.dateOfBirth ?? ''} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                  />
                </div>
                <div>
                  <label htmlFor="edit-sex" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Sex
                  </label>
                  <select 
                    name="sex" 
                    id="edit-sex" 
                    value={studentToEdit?.sex ?? ''} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-placeOfBirth" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Place of Birth
                  </label>
                  <input 
                    type="text" 
                    name="placeOfBirth" 
                    id="edit-placeOfBirth" 
                    value={studentToEdit?.placeOfBirth ?? ''} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                  />
                </div>
                <div>
                  <label htmlFor="edit-nationality" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nationality
                  </label>
                  <input 
                    type="text" 
                    name="nationality" 
                    id="edit-nationality" 
                    value={studentToEdit?.nationality ?? ''} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                    placeholder="e.g., Filipino"
                  />
                </div>
                <div>
                  <label htmlFor="edit-religion" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Religion
                  </label>
                  <input 
                    type="text" 
                    name="religion" 
                    id="edit-religion" 
                    value={studentToEdit?.religion ?? ''} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                  />
                </div>
                <div>
                  <label htmlFor="edit-motherTongue" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Mother Tongue
                  </label>
                  <input 
                    type="text" 
                    name="motherTongue" 
                    id="edit-motherTongue" 
                    value={studentToEdit?.motherTongue ?? ''} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                    placeholder="e.g., Tagalog, Bisaya"
                  />
                </div>
              </div>

              {/* Student Photo Section */}
              <div className="md:col-span-2 pt-6 border-t border-slate-200 dark:border-slate-700">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Student Photo
                </label>
                <div className="flex items-start space-x-6">
                  {/* Photo Preview */}
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 border-4 border-slate-300 dark:border-slate-600 shadow-lg">
                      {studentToEdit?.photoURL ? (
                        <img 
                          src={studentToEdit.photoURL} 
                          alt={studentToEdit.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img 
                          src={getPlaceholderAvatar(studentToEdit?.name || 'Student')} 
                          alt={studentToEdit?.name || 'Student'}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Upload Controls */}
                  <div className="flex-1">
                    <div className="flex flex-col space-y-3">
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          disabled={photoUploading}
                          className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                        >
                          {photoUploading ? 'Uploading...' : (studentToEdit?.photoURL ? 'Change Photo' : 'Upload Photo')}
                        </button>
                        <button 
                          type="button"
                          onClick={() => setShowWebcam(true)}
                          disabled={photoUploading}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                        >
                          📷 Take Photo
                        </button>
                      </div>
                      {studentToEdit?.photoURL && (
                        <button 
                          type="button"
                          onClick={handleRemovePhoto}
                          disabled={photoUploading}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                        >
                          Remove Photo
                        </button>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        📸 JPG or PNG, max 5MB. Photos will be cropped and compressed automatically.
                      </p>
                      {photoError && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          ⚠️ {photoError}
                        </p>
                      )}
                      {studentToEdit?.photoUploadedAt && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Last updated: {new Date(studentToEdit.photoUploadedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Hidden file input */}
                  <input 
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Contact & Address Tab */}
          {editTab === 'contact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-contactNumber" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Contact Number
                  </label>
                  <input 
                    type="tel" 
                    name="contactNumber" 
                    id="edit-contactNumber" 
                    value={studentToEdit?.contactNumber ?? ''} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                    placeholder="+63 XXX XXX XXXX"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="edit-address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Complete Address
                  </label>
                  <input 
                    type="text" 
                    name="address" 
                    id="edit-address" 
                    value={studentToEdit?.address ?? ''} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                    placeholder="House No., Street, Subdivision"
                  />
                </div>
                <div>
                  <label htmlFor="edit-barangay" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Barangay
                  </label>
                  <input 
                    type="text" 
                    name="barangay" 
                    id="edit-barangay" 
                    value={studentToEdit?.barangay ?? ''} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                  />
                </div>
                <div>
                  <label htmlFor="edit-city" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    City/Municipality
                  </label>
                  <input 
                    type="text" 
                    name="city" 
                    id="edit-city" 
                    value={studentToEdit?.city ?? ''} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                  />
                </div>
                <div>
                  <label htmlFor="edit-province" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Province
                  </label>
                  <input 
                    type="text" 
                    name="province" 
                    id="edit-province" 
                    value={studentToEdit?.province ?? ''} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                  />
                </div>
                <div>
                  <label htmlFor="edit-zipCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ZIP Code
                  </label>
                  <input 
                    type="text" 
                    name="zipCode" 
                    id="edit-zipCode" 
                    value={studentToEdit?.zipCode ?? ''} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                    placeholder="4 digits"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Guardian Info Tab */}
          {editTab === 'guardian' && (
            <div className="space-y-6">
              {/* Primary Guardian */}
              <div>
                <h4 className="text-md font-semibold text-slate-800 dark:text-white mb-3">Primary Guardian</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="edit-guardianName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input 
                      type="text" 
                      name="guardianName" 
                      id="edit-guardianName" 
                      value={studentToEdit?.guardianName ?? ''} 
                      onChange={handleEditInputChange} 
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-guardianRelationship" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Relationship
                    </label>
                    <input 
                      type="text" 
                      name="guardianRelationship" 
                      id="edit-guardianRelationship" 
                      value={studentToEdit?.guardianRelationship ?? ''} 
                      onChange={handleEditInputChange} 
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                      placeholder="Mother, Father, etc."
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-guardianContactNumber" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Contact Number
                    </label>
                    <input 
                      type="tel" 
                      name="guardianContactNumber" 
                      id="edit-guardianContactNumber" 
                      value={studentToEdit?.guardianContactNumber ?? ''} 
                      onChange={handleEditInputChange} 
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-guardianEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      name="guardianEmail" 
                      id="edit-guardianEmail" 
                      value={studentToEdit?.guardianEmail ?? ''} 
                      onChange={handleEditInputChange} 
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-guardianOccupation" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Occupation
                    </label>
                    <input 
                      type="text" 
                      name="guardianOccupation" 
                      id="edit-guardianOccupation" 
                      value={studentToEdit?.guardianOccupation ?? ''} 
                      onChange={handleEditInputChange} 
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="edit-guardianAddress" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Address (if different from student)
                    </label>
                    <input 
                      type="text" 
                      name="guardianAddress" 
                      id="edit-guardianAddress" 
                      value={studentToEdit?.guardianAddress ?? ''} 
                      onChange={handleEditInputChange} 
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                    />
                  </div>
                </div>
              </div>

              {/* Secondary Guardian */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-md font-semibold text-slate-800 dark:text-white mb-3">Secondary Guardian (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="edit-guardian2Name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input 
                      type="text" 
                      name="guardian2Name" 
                      id="edit-guardian2Name" 
                      value={studentToEdit?.guardian2Name ?? ''} 
                      onChange={handleEditInputChange} 
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-guardian2Relationship" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Relationship
                    </label>
                    <input 
                      type="text" 
                      name="guardian2Relationship" 
                      id="edit-guardian2Relationship" 
                      value={studentToEdit?.guardian2Relationship ?? ''} 
                      onChange={handleEditInputChange} 
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-guardian2ContactNumber" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Contact Number
                    </label>
                    <input 
                      type="tel" 
                      name="guardian2ContactNumber" 
                      id="edit-guardian2ContactNumber" 
                      value={studentToEdit?.guardian2ContactNumber ?? ''} 
                      onChange={handleEditInputChange} 
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-guardian2Email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      name="guardian2Email" 
                      id="edit-guardian2Email" 
                      value={studentToEdit?.guardian2Email ?? ''} 
                      onChange={handleEditInputChange} 
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                    />
                  </div>
                </div>
              </div>

              {/* Linked Parent Accounts */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-md font-semibold text-slate-800 dark:text-white mb-3">Linked Parent Portal Accounts</h4>
                <div>
                  <label htmlFor="edit-parentIds" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Parent Accounts
                  </label>
                  <select 
                    name="parentIds" 
                    id="edit-parentIds" 
                    multiple
                    value={studentToEdit?.parentIds ?? []} 
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                      if (studentToEdit) {
                        setStudentToEdit({ ...studentToEdit, parentIds: selectedOptions });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                    size={4}
                  >
                    {parents && parents.length > 0 ? (
                      parents.map(parent => (
                        <option key={parent.id} value={parent.id}>
                          {parent.name} ({parent.email})
                        </option>
                      ))
                    ) : (
                      <option disabled>No parent accounts available</option>
                    )}
                  </select>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Hold Ctrl (Windows) or Cmd (Mac) to select multiple parents
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Academic Details Tab */}
          {editTab === 'academic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="edit-sectionId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Section <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="sectionId" 
                    id="edit-sectionId" 
                    value={studentToEdit?.sectionId ?? ''} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                    required
                  >
                    <option value="">Select a Section...</option>
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>Grade {s.gradeLevel} - {s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-enrollmentDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Enrollment Date
                  </label>
                  <input 
                    type="date" 
                    name="enrollmentDate" 
                    id="edit-enrollmentDate" 
                    value={studentToEdit?.enrollmentDate ?? ''} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                  />
                </div>
                <div>
                  <label htmlFor="edit-status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Student Status
                  </label>
                  <select 
                    name="status" 
                    id="edit-status" 
                    value={studentToEdit?.status ?? 'active'} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="transferred">Transferred</option>
                    <option value="graduated">Graduated</option>
                    <option value="dropped">Dropped</option>
                  </select>
                </div>
                
                {/* Previous School Information */}
                <div className="md:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-md font-semibold text-slate-800 dark:text-white mb-3">Previous School Information</h4>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="edit-previousSchool" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Previous School Name
                  </label>
                  <input 
                    type="text" 
                    name="previousSchool" 
                    id="edit-previousSchool" 
                    value={studentToEdit?.previousSchool ?? ''} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="edit-previousSchoolAddress" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Previous School Address
                  </label>
                  <input 
                    type="text" 
                    name="previousSchoolAddress" 
                    id="edit-previousSchoolAddress" 
                    value={studentToEdit?.previousSchoolAddress ?? ''} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                  />
                </div>
                <div>
                  <label htmlFor="edit-yearLastAttended" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Year Last Attended
                  </label>
                  <input 
                    type="text" 
                    name="yearLastAttended" 
                    id="edit-yearLastAttended" 
                    value={studentToEdit?.yearLastAttended ?? ''} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white" 
                    placeholder="e.g., 2023-2024"
                  />
                </div>
                
                {/* Remarks */}
                <div className="md:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <label htmlFor="edit-remarks" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    General Remarks / Notes
                  </label>
                  <textarea 
                    name="remarks" 
                    id="edit-remarks" 
                    value={studentToEdit?.remarks ?? ''} 
                    onChange={(e) => {
                      if (studentToEdit) {
                        setStudentToEdit({ ...studentToEdit, remarks: e.target.value });
                      }
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                    placeholder="Any additional notes about the student..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Health & Other Tab */}
          {editTab === 'health' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-bloodType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Blood Type
                  </label>
                  <select 
                    name="bloodType" 
                    id="edit-bloodType" 
                    value={studentToEdit?.bloodType ?? ''} 
                    onChange={handleEditInputChange} 
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="">Select...</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="edit-healthNotes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Health Notes (Medical Conditions, Allergies, etc.)
                  </label>
                  <textarea 
                    name="healthNotes" 
                    id="edit-healthNotes" 
                    value={studentToEdit?.healthNotes ?? ''} 
                    onChange={(e) => {
                      if (studentToEdit) {
                        setStudentToEdit({ ...studentToEdit, healthNotes: e.target.value });
                      }
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                    placeholder="List any medical conditions, allergies, medications..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="edit-specialNeeds" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Special Needs / Accommodations
                  </label>
                  <textarea 
                    name="specialNeeds" 
                    id="edit-specialNeeds" 
                    value={studentToEdit?.specialNeeds ?? ''} 
                    onChange={(e) => {
                      if (studentToEdit) {
                        setStudentToEdit({ ...studentToEdit, specialNeeds: e.target.value });
                      }
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                    placeholder="Learning disabilities, physical accommodations needed..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button 
              type="button" 
              onClick={() => setIsEditModalOpen(false)} 
              className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <p>Are you sure you want to delete the student <span className="font-bold">{studentToDelete?.name}</span>? This will also delete all of their associated grades, attendance, and core value records. This action cannot be undone.</p>
        <div className="flex justify-end space-x-2 mt-6">
            <button onClick={() => setIsDeleteModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
            <button onClick={confirmDeleteStudent} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">Delete Student</button>
        </div>
      </Modal>

      {/* Enhanced Student Profile */}
      {isViewModalOpen && selectedStudent && (
        <StudentProfile
          student={selectedStudent}
          grades={grades}
          attendanceRecords={attendanceRecords}
          coreValueGrades={coreValueGrades}
          sections={sections}
          teachers={teachers}
          schoolYear={settings.schoolYear}
          schoolData={schoolData as any}
          onClose={() => setIsViewModalOpen(false)}
        />
      )}

      {/* Webcam Capture Modal */}
      {showWebcam && (
        <WebcamCapture 
          onCapture={handleWebcamCapture}
          onClose={() => setShowWebcam(false)}
        />
      )}

      {/* Image Crop Modal */}
      {showCropModal && imageToCrop && (
        <ImageCropModal 
          imageUrl={imageToCrop}
          onCrop={handleCroppedImage}
          onCancel={() => {
            setShowCropModal(false);
            setImageToCrop(null);
            setCapturedBlob(null);
          }}
        />
      )}
    </div>
  );
};

export default StudentList;
