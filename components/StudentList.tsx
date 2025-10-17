import React, { useState, useMemo, useRef } from 'react';
import { SchoolDataState } from '../hooks/useSchoolData';
import type { Student, AuthUser, StudentUser } from '../types';
import Modal from './Modal';
import StudentProfile from './StudentProfile';
import { UserCircleIcon, PencilIcon, TrashIcon } from './icons';
import { useDebounce } from '../hooks/useDebounce';
import { uploadStudentPhoto, deleteStudentPhoto, getPlaceholderAvatar } from '../src/services/studentPhotoService';
import WebcamCapture from './WebcamCapture';
import ImageCropModal from './ImageCropModal';
import { usePaginatedStudents } from '../hooks/usePaginatedStudents';

interface StudentListProps {
  schoolData: SchoolDataState & { 
    loading: boolean;
    addStudent: (student: Omit<Student, 'id' | 'enrollmentDate'>) => { success: boolean; message?: string; };
    updateStudent: (student: Student) => void;
    deleteStudent: (studentId: string) => void;
  };
  session: { user: AuthUser | StudentUser, type: 'staff' | 'student' };
}

const ITEMS_PER_PAGE = 25;

const StudentList: React.FC<StudentListProps> = ({ schoolData, session }) => {
  const { students, teachers, sections, addStudent, settings, updateStudent, deleteStudent, grades, attendanceRecords, coreValueGrades, substituteAssignments, classSchedules, parents } = schoolData;
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
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  const authUser = session.user as AuthUser;

  // Feature flag: Server-side pagination temporarily disabled
  // Issue: Causing infinite re-render loop and log spamming
  // TODO: Fix pagination hook dependencies before re-enabling
  // When enabled, should only work for admin/principal/registrar roles
  const USE_SERVER_PAGINATION = false;

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

  // Use server-side pagination for large datasets
  const paginatedData = usePaginatedStudents({
    pageSize: 100,
    searchQuery: debouncedSearchQuery,
    enabled: USE_SERVER_PAGINATION
  });

  // Original client-side filtering logic (for small datasets or as fallback)
  const visibleStudents = useMemo(() => {
    // If using server pagination, return paginated students
    if (USE_SERVER_PAGINATION) {
      // Apply section filtering for teachers (server doesn't support this yet)
      if (authorizedSectionIds && authorizedSectionIds.size > 0) {
        return paginatedData.students.filter(s => s.sectionId && authorizedSectionIds.has(s.sectionId));
      }
      return paginatedData.students;
    }

    // Traditional client-side filtering
    if (['admin', 'principal', 'registrar'].includes(authUser.role)) {
      return students;
    }
    
    if (!authorizedSectionIds || authorizedSectionIds.size === 0) return [];
    return students.filter(s => s.sectionId && authorizedSectionIds.has(s.sectionId));
  }, [USE_SERVER_PAGINATION, paginatedData.students, students, authUser, authorizedSectionIds]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStudent(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setAddStudentError(null);
    if (newStudent.name && newStudent.email && newStudent.sectionId) {
      const result = addStudent(newStudent);
      if (result.success) {
        setNewStudent({ name: '', email: '' });
        setIsAddModalOpen(false);
        // Refresh paginated data if using server pagination
        if (USE_SERVER_PAGINATION) {
          paginatedData.refreshStudents();
        }
      } else {
        setAddStudentError(result.message || 'An unknown error occurred.');
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
      // Refresh paginated data if using server pagination
      if (USE_SERVER_PAGINATION) {
        paginatedData.refreshStudents();
      }
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
      // Refresh paginated data if using server pagination
      if (USE_SERVER_PAGINATION) {
        paginatedData.refreshStudents();
      }
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
      setStudentToEdit({
        ...studentToEdit,
        photoURL: undefined,
        photoPath: undefined,
        photoUploadedAt: undefined,
      });
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
    setPhotoError(null);
    setPhotoUploading(true);

    try {
      // Convert blob to file
      const file = new File([croppedBlob], 'photo.jpg', { type: 'image/jpeg' });
      const { url, path } = await uploadStudentPhoto(studentToEdit.id, file);
      
      // Update student with new photo
      setStudentToEdit({
        ...studentToEdit,
        photoURL: url,
        photoPath: path,
        photoUploadedAt: new Date().toISOString(),
      });

      // Clear captured blob
      setCapturedBlob(null);
    } catch (error: any) {
      setPhotoError(error.message || 'Failed to upload photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  // File upload with crop option
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  // Pagination Logic - works with both server-side and client-side modes
  const filteredStudents = useMemo(() => {
    // For server pagination, search is already handled by the hook
    if (USE_SERVER_PAGINATION) {
      return visibleStudents; // Already filtered and paginated
    }
    
    // Client-side search filtering
    return visibleStudents.filter(student =>
      student.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (student.lrn && student.lrn.includes(debouncedSearchQuery))
    );
  }, [USE_SERVER_PAGINATION, visibleStudents, debouncedSearchQuery]);

  const totalPages = USE_SERVER_PAGINATION ? paginatedData.totalPages : Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const totalCount = USE_SERVER_PAGINATION ? paginatedData.totalCount : filteredStudents.length;
  
  const paginatedStudents = useMemo(() => {
    if (USE_SERVER_PAGINATION) {
      return filteredStudents; // Already paginated from server
    }
    
    // Client-side pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredStudents.slice(startIndex, endIndex);
  }, [USE_SERVER_PAGINATION, filteredStudents, currentPage]);

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setAddStudentError(null);
  }

  const canManageStudents = ['admin', 'registrar'].includes(authUser.role);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Students</h1>
        {canManageStudents && (
          <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Add Student</button>
        )}
      </div>
      
      <div className="mb-4">
        <input type="text" placeholder="Search by name, email, or LRN..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full max-w-sm px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"/>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Name</th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">LRN</th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Grade & Section</th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.map((student) => {
              const section = sections.find(s => s.id === student.sectionId);
              const status = student.status || 'active';
              const statusColors = {
                active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
                transferred: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                graduated: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
                dropped: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              };
              return (
              <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 flex-shrink-0">
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
                    </div>
                    <p className="text-slate-900 dark:text-white font-medium">{student.name}</p>
                  </div>
                </td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                  <p className="text-slate-600 dark:text-slate-300 whitespace-nowrap">{student.lrn ?? 'N/A'}</p>
                </td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                  <p className="text-slate-600 dark:text-slate-300 whitespace-nowrap">{section ? `Grade ${section.gradeLevel} - ${section.name}` : 'N/A'}</p>
                </td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status]}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                  <div className="flex items-center space-x-3">
                    <button onClick={() => handleViewProfile(student)} className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold text-xs">
                      <UserCircleIcon /><span className="ml-1">View</span>
                    </button>
                     {canManageStudents && (<>
                        <button onClick={() => handleEditProfile(student)} className="flex items-center text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 font-semibold text-xs">
                            <PencilIcon /><span className="ml-1">Edit</span>
                        </button>
                        <button onClick={() => handleDeleteClick(student)} className="flex items-center text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-semibold text-xs">
                            <TrashIcon /><span className="ml-1">Delete</span>
                        </button>
                    </>)}
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
        {(paginatedData.loading || totalPages > 1) && (
          <div className="px-5 py-3 bg-white dark:bg-slate-800 border-t flex flex-col xs:flex-row items-center xs:justify-between">
            {paginatedData.loading ? (
              <span className="text-xs xs:text-sm text-slate-600 dark:text-slate-300">Loading students...</span>
            ) : (
              <span className="text-xs xs:text-sm text-slate-600 dark:text-slate-300">
                {USE_SERVER_PAGINATION ? (
                  // Server pagination - show page-based info
                  <>Page {paginatedData.currentPage} of {totalPages} ({totalCount} total students)</>
                ) : (
                  // Client pagination - show item-based info
                  <>Showing {Math.min(1 + (currentPage-1)*ITEMS_PER_PAGE, filteredStudents.length)} to {Math.min(currentPage*ITEMS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length} Students</>
                )}
              </span>
            )}
            <div className="inline-flex mt-2 xs:mt-0">
              <button
                onClick={() => USE_SERVER_PAGINATION ? paginatedData.loadPrevPage() : setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={paginatedData.loading || (USE_SERVER_PAGINATION ? paginatedData.currentPage === 1 : currentPage === 1)}
                className="text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold py-2 px-4 rounded-l disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => USE_SERVER_PAGINATION ? paginatedData.loadNextPage() : setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={paginatedData.loading || (USE_SERVER_PAGINATION ? !paginatedData.hasMore && paginatedData.currentPage === totalPages : currentPage === totalPages)}
                className="text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold py-2 px-4 rounded-r disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

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