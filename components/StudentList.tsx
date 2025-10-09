import React, { useState, useMemo } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import type { Student, AuthUser } from '../types';
import Modal from './Modal';
import { UserCircleIcon } from './icons';

interface StudentListProps {
  schoolData: SchoolDataHook;
  authUser: AuthUser;
}

const calculateAge = (dateOfBirth?: string): number | string => {
  if (!dateOfBirth) return 'N/A';
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const StudentList: React.FC<StudentListProps> = ({ schoolData, authUser }) => {
  const { students, teachers, sections, addStudent } = schoolData;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const [newStudent, setNewStudent] = useState<Omit<Student, 'id' | 'enrollmentDate'>>({ name: '', email: '' });
  const [searchQuery, setSearchQuery] = useState('');
  
  const visibleStudents = useMemo(() => {
    if (authUser.role === 'admin') {
      return students;
    }
    const teacherSection = sections.find(s => s.adviserId === authUser.id);
    if (!teacherSection) return [];
    return students.filter(s => s.sectionId === teacherSection.id);
  }, [students, sections, authUser]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStudent(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudent.name && newStudent.email && newStudent.sectionId) {
      addStudent(newStudent);
      setNewStudent({ name: '', email: '' });
      setIsAddModalOpen(false);
    }
  };
  
  const handleViewProfile = (student: Student) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  }

  const filteredStudents = visibleStudents.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.lrn?.includes(searchQuery)
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Students</h1>
        {authUser.role === 'admin' && (
          <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Add Student</button>
        )}
      </div>
      
      <div className="mb-4">
        <input type="text" placeholder="Search by name, email, or LRN..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full max-w-sm px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"/>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden">
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
            {filteredStudents.map((student) => {
              const section = sections.find(s => s.id === student.sectionId);
              return (
              <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm"><p className="text-slate-900 dark:text-white whitespace-no-wrap">{student.name}</p></td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm"><p className="text-slate-600 dark:text-slate-300 whitespace-no-wrap">{student.lrn ?? 'N/A'}</p></td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm"><p className="text-slate-600 dark:text-slate-300 whitespace-no-wrap">{section ? `Grade ${section.gradeLevel} - ${section.name}` : 'N/A'}</p></td>
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                  <button onClick={() => handleViewProfile(student)} className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold text-xs">
                    <UserCircleIcon /><span className="ml-1">View Profile</span>
                  </button>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Student" size="2xl">
        <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label htmlFor="name" className="block text-sm font-medium">Full Name</label><input type="text" name="name" id="name" value={newStudent.name} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500" required /></div>
          <div className="md:col-span-2"><label htmlFor="email" className="block text-sm font-medium">Email Address</label><input type="email" name="email" id="email" value={newStudent.email} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500" required /></div>
          <div className="md:col-span-2"><label htmlFor="sectionId" className="block text-sm font-medium">Assign to Class</label><select name="sectionId" id="sectionId" value={newStudent.sectionId ?? ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500" required><option value="">Select a Class...</option>{sections.map(s => (<option key={s.id} value={s.id}>Grade {s.gradeLevel} - {s.name}</option>))}</select></div>
          <div><label htmlFor="lrn" className="block text-sm font-medium">LRN</label><input type="text" name="lrn" id="lrn" value={newStudent.lrn ?? ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500" /></div>
          <div><label htmlFor="dateOfBirth" className="block text-sm font-medium">Date of Birth</label><input type="date" name="dateOfBirth" id="dateOfBirth" value={newStudent.dateOfBirth ?? ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500" /></div>
          <div><label htmlFor="sex" className="block text-sm font-medium">Sex</label><select name="sex" id="sex" value={newStudent.sex ?? ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500"><option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
          <div><label htmlFor="schoolYear" className="block text-sm font-medium">School Year</label><input type="text" name="schoolYear" id="schoolYear" placeholder="e.g. 2023-2024" value={newStudent.schoolYear ?? ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500" /></div>
          <div className="md:col-span-2 flex justify-end space-x-2 mt-4"><button type="button" onClick={() => setIsAddModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button><button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Add Student</button></div>
        </form>
      </Modal>

       {selectedStudent && (() => {
          const section = sections.find(s => s.id === selectedStudent.sectionId);
          const adviser = teachers.find(t => t.id === section?.adviserId);
          return (
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Student Profile" size="lg">
              <div className="space-y-3">
                <div className="flex justify-between"><span className="font-semibold text-slate-500">Name:</span> <span className="text-slate-800 dark:text-slate-200">{selectedStudent.name}</span></div>
                <div className="flex justify-between"><span className="font-semibold text-slate-500">Email:</span> <span className="text-slate-800 dark:text-slate-200">{selectedStudent.email}</span></div>
                <div className="flex justify-between"><span className="font-semibold text-slate-500">LRN:</span> <span className="text-slate-800 dark:text-slate-200">{selectedStudent.lrn ?? 'N/A'}</span></div>
                <div className="flex justify-between"><span className="font-semibold text-slate-500">Class:</span> <span className="text-slate-800 dark:text-slate-200">{section ? `Grade ${section.gradeLevel} - ${section.name}` : 'N/A'}</span></div>
                <div className="flex justify-between"><span className="font-semibold text-slate-500">Class Adviser:</span> <span className="text-slate-800 dark:text-slate-200">{adviser?.name ?? 'N/A'}</span></div>
                <div className="flex justify-between"><span className="font-semibold text-slate-500">Age:</span> <span className="text-slate-800 dark:text-slate-200">{calculateAge(selectedStudent.dateOfBirth)}</span></div>
                <div className="flex justify-between"><span className="font-semibold text-slate-500">Sex:</span> <span className="text-slate-800 dark:text-slate-200">{selectedStudent.sex ?? 'N/A'}</span></div>
                <div className="flex justify-between"><span className="font-semibold text-slate-500">School Year:</span> <span className="text-slate-800 dark:text-slate-200">{selectedStudent.schoolYear ?? 'N/A'}</span></div>
                <div className="flex justify-between"><span className="font-semibold text-slate-500">Enrollment Date:</span> <span className="text-slate-800 dark:text-slate-200">{selectedStudent.enrollmentDate}</span></div>
              </div>
              <div className="flex justify-end mt-6"><button onClick={() => setIsViewModalOpen(false)} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Close</button></div>
            </Modal>
          )
       })()}
    </div>
  );
};

export default StudentList;