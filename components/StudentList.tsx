import React, { useState, useMemo } from 'react';
import { SchoolDataState } from '../hooks/useSchoolData';
import type { Student, AuthUser, StudentUser } from '../types';
import Modal from './Modal';
import StudentProfile from './StudentProfile';
import { UserCircleIcon, PencilIcon, TrashIcon } from './icons';
import { useDebounce } from '../hooks/useDebounce';

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
  const { students, teachers, sections, addStudent, settings, updateStudent, deleteStudent, grades, attendanceRecords, coreValueGrades, substituteAssignments, classSchedules } = schoolData;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [addStudentError, setAddStudentError] = useState<string | null>(null);
  
  const [newStudent, setNewStudent] = useState<Omit<Student, 'id' | 'enrollmentDate'>>({ name: '', email: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  const authUser = session.user as AuthUser;

  const visibleStudents = useMemo(() => {
    if (['admin', 'principal', 'registrar'].includes(authUser.role)) {
      return students;
    }
    
    const authorizedSectionIds = new Set<string>();

    // 1. Sections where the user is the adviser
    const teacherAdviserSection = sections.find(s => s.adviserId === authUser.id);
    if (teacherAdviserSection) {
        authorizedSectionIds.add(teacherAdviserSection.id);
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
        
        // Find sections where original teachers are advisers
        sections.forEach(s => {
            if (s.adviserId && originalTeacherIds.includes(s.adviserId)) {
                authorizedSectionIds.add(s.id);
            }
        });

        // Find sections where original teachers have classes scheduled
        classSchedules.forEach(schedule => {
            if (schedule.teacherId && schedule.sectionId && originalTeacherIds.includes(schedule.teacherId)) {
                authorizedSectionIds.add(schedule.sectionId);
            }
        });
    }

    // 3. Sections where the user is assigned as a subject teacher
    classSchedules.forEach(schedule => {
      if (schedule.teacherId === authUser.id && schedule.sectionId) {
        authorizedSectionIds.add(schedule.sectionId);
      }
    });
    
    if (authorizedSectionIds.size === 0) return [];
    
    return students.filter(s => s.sectionId && authorizedSectionIds.has(s.sectionId));
  }, [students, sections, substituteAssignments, classSchedules, authUser]);


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
    setIsEditModalOpen(true);
  };
  
  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentToEdit) {
      updateStudent(studentToEdit);
      setIsEditModalOpen(false);
      setStudentToEdit(null);
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
    }
  };

  const filteredStudents = useMemo(() => visibleStudents.filter(student =>
    student.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    (student.lrn && student.lrn.includes(debouncedSearchQuery))
  ), [visibleStudents, debouncedSearchQuery]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredStudents.slice(startIndex, endIndex);
  }, [filteredStudents, currentPage]);

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
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.map((student) => {
              const section = sections.find(s => s.id === student.sectionId);
              return (
              <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm"><p className="text-slate-900 dark:text-white whitespace-nowrap">{student.name}</p></td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm"><p className="text-slate-600 dark:text-slate-300 whitespace-nowrap">{student.lrn ?? 'N/A'}</p></td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm"><p className="text-slate-600 dark:text-slate-300 whitespace-nowrap">{section ? `Grade ${section.gradeLevel} - ${section.name}` : 'N/A'}</p></td>
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
        {totalPages > 1 && (
          <div className="px-5 py-3 bg-white dark:bg-slate-800 border-t flex flex-col xs:flex-row items-center xs:justify-between">
            <span className="text-xs xs:text-sm text-slate-600 dark:text-slate-300">
              Showing {Math.min(1 + (currentPage-1)*ITEMS_PER_PAGE, filteredStudents.length)} to {Math.min(currentPage*ITEMS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length} Students
            </span>
            <div className="inline-flex mt-2 xs:mt-0">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold py-2 px-4 rounded-l disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold py-2 px-4 rounded-r disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={closeAddModal} title="Add New Student" size="2xl">
        <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label htmlFor="name" className="block text-sm font-medium">Full Name</label><input type="text" name="name" id="name" value={newStudent.name} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500" required /></div>
          <div className="md:col-span-2"><label htmlFor="email" className="block text-sm font-medium">Email Address</label><input type="email" name="email" id="email" value={newStudent.email} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500" required /></div>
          <div className="md:col-span-2"><label htmlFor="sectionId" className="block text-sm font-medium">Assign to Class</label><select name="sectionId" id="sectionId" value={newStudent.sectionId ?? ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500" required><option value="">Select a Class...</option>{sections.map(s => (<option key={s.id} value={s.id}>Grade {s.gradeLevel} - {s.name}</option>))}</select></div>
          <div><label htmlFor="lrn" className="block text-sm font-medium">LRN</label><input type="text" name="lrn" id="lrn" value={newStudent.lrn ?? ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500" /></div>
          <div className="md:col-span-1"><label htmlFor="dateOfBirth" className="block text-sm font-medium">Date of Birth</label><input type="date" name="dateOfBirth" id="dateOfBirth" value={newStudent.dateOfBirth ?? ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500" /></div>
          <div className="md:col-span-2"><label htmlFor="sex" className="block text-sm font-medium">Sex</label><select name="sex" id="sex" value={newStudent.sex ?? ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500"><option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
          
          {addStudentError && (
            <div className="md:col-span-2 p-3 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-slate-900 dark:text-red-400" role="alert">
              <span className="font-medium">Error:</span> {addStudentError}
            </div>
          )}

          <div className="md:col-span-2 flex justify-end space-x-2 mt-4"><button type="button" onClick={closeAddModal} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button><button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Add Student</button></div>
        </form>
      </Modal>
      
       <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Student Profile" size="2xl">
        <form onSubmit={handleUpdateStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label htmlFor="name" className="block text-sm font-medium">Full Name</label><input type="text" name="name" id="name" value={studentToEdit?.name ?? ''} onChange={handleEditInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500" required /></div>
          <div className="md:col-span-2"><label htmlFor="email" className="block text-sm font-medium">Email Address</label><input type="email" name="email" id="email" value={studentToEdit?.email ?? ''} onChange={handleEditInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500" required /></div>
          <div className="md:col-span-2"><label htmlFor="sectionId" className="block text-sm font-medium">Assign to Class</label><select name="sectionId" id="sectionId" value={studentToEdit?.sectionId ?? ''} onChange={handleEditInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500" required><option value="">Select a Class...</option>{sections.map(s => (<option key={s.id} value={s.id}>Grade {s.gradeLevel} - {s.name}</option>))}</select></div>
          <div><label htmlFor="lrn" className="block text-sm font-medium">LRN</label><input type="text" name="lrn" id="lrn" value={studentToEdit?.lrn ?? ''} onChange={handleEditInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500" /></div>
          <div className="md:col-span-1"><label htmlFor="dateOfBirth" className="block text-sm font-medium">Date of Birth</label><input type="date" name="dateOfBirth" id="dateOfBirth" value={studentToEdit?.dateOfBirth ?? ''} onChange={handleEditInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500" /></div>
          <div className="md:col-span-2"><label htmlFor="sex" className="block text-sm font-medium">Sex</label><select name="sex" id="sex" value={studentToEdit?.sex ?? ''} onChange={handleEditInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500"><option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
          <div className="md:col-span-2 flex justify-end space-x-2 mt-4"><button type="button" onClick={() => setIsEditModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button><button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Save Changes</button></div>
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
          onClose={() => setIsViewModalOpen(false)}
        />
      )}
    </div>
  );
};

export default StudentList;