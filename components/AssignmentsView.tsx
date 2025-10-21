import React, { useState, useMemo, useEffect } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import type { Assignment, StudentAssignmentGrade, AuthUser, StudentUser, ParentUser, Student } from '../types';
import Modal from './Modal';
import { PencilIcon, TrashIcon, DocumentArrowDownIcon, DocumentArrowUpIcon } from './icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFirestoreInstance } from '../src/services/firestoreService';

const getStatus = (assignment: Assignment, grade: StudentAssignmentGrade | undefined) => {
    const today = new Date().toISOString().split('T')[0];
    if (grade?.score !== null && grade?.score !== undefined) return { text: 'Graded', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    if (grade?.submissionDate) return { text: 'Submitted', color: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200' };
    if (today > assignment.dueDate) return { text: 'Late', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' };
    return { text: 'Not Submitted', color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200' };
};

// Main Component
const AssignmentsView: React.FC<{ 
    schoolData: SchoolDataHook, 
    session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' },
    forceStudentId?: string,
}> = ({ schoolData, session, forceStudentId }) => {
    const {
        assignments, studentAssignmentGrades, sections, learningAreas, students,
        addAssignment, updateAssignment, deleteAssignment, updateAssignmentGrade, submitAssignment
    } = schoolData;
    
    // Determine user role and relevant student
    const isStaff = session.type === 'staff';
    const isStudent = session.type === 'student';
    const isParent = session.type === 'parent';
    const studentForPortal = useMemo(() => {
        if (isStudent) return session.user as StudentUser;
        if (isParent) return students.find(s => s.id === forceStudentId);
        return null;
    }, [session, students, forceStudentId, isStudent, isParent]);


    // Teacher-specific state
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [selectedLearningAreaId, setSelectedLearningAreaId] = useState<string | null>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [assignmentToEdit, setAssignmentToEdit] = useState<Partial<Assignment> | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [feedbackToEdit, setFeedbackToEdit] = useState<{ studentId: string, feedback: string | null } | null>(null);
    
    // Student-specific state
    const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
    const [assignmentToSubmit, setAssignmentToSubmit] = useState<Assignment | null>(null);
    const [fileName, setFileName] = useState('');
    
    // Students for the selected assignment's section
    const [sectionStudents, setSectionStudents] = useState<Student[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    const authUser = session.user as AuthUser;
    const isReadOnly = isStaff && authUser.role === 'principal';
    
    // Teacher View Logic
    const visibleSections = useMemo(() => {
        if (!isStaff) return [];
        if (['admin', 'principal', 'registrar'].includes(authUser.role)) return sections;
    // const teacherAdviserSectionId = sections.find(s => s.adviserId === authUser.id)?.id;
        const assignedLearningAreaIds = new Set(authUser.assignments?.map(a => a.learningAreaId));
        return sections.filter(s => s.adviserId === authUser.id || assignedLearningAreaIds.size > 0);
    }, [sections, authUser, isStaff]);
    
    useEffect(() => {
        if (isStaff && !selectedSectionId && visibleSections.length > 0) {
            setSelectedSectionId(visibleSections[0].id);
        }
    }, [visibleSections, selectedSectionId, isStaff]);
    
    const learningAreasForSection = useMemo(() => {
        if (!isStaff || !selectedSectionId) return [];
        if (['admin', 'principal', 'registrar'].includes(authUser.role)) return learningAreas;
        const section = sections.find(s => s.id === selectedSectionId);
        if (!section) return [];
        const teacherAssignments = authUser.assignments?.filter(a => a.gradeLevel === section.gradeLevel).map(a => a.learningAreaId) || [];
        return learningAreas.filter(la => teacherAssignments.includes(la.id));
    }, [learningAreas, selectedSectionId, sections, authUser, isStaff]);
    
    useEffect(() => {
        if (isStaff && selectedSectionId && !learningAreasForSection.some(la => la.id === selectedLearningAreaId)) {
            setSelectedLearningAreaId(learningAreasForSection[0]?.id || null);
        }
    }, [selectedSectionId, learningAreasForSection, selectedLearningAreaId, isStaff]);

    const filteredAssignments = useMemo(() => {
        if (isStaff) {
            if (!selectedSectionId || !selectedLearningAreaId) return [];
            return assignments.filter(a => a.sectionId === selectedSectionId && a.learningAreaId === selectedLearningAreaId);
        }
        if (studentForPortal) {
            return assignments.filter(a => a.sectionId === studentForPortal.sectionId);
        }
        return [];
    }, [assignments, selectedSectionId, selectedLearningAreaId, studentForPortal, isStaff]);
    
    useEffect(() => {
        if (isStaff && !filteredAssignments.some(a => a.id === selectedAssignment?.id)) {
            setSelectedAssignment(null);
        }
    }, [filteredAssignments, selectedAssignment, isStaff]);
    
    // Fetch students for the selected assignment's section
    useEffect(() => {
        if (!selectedAssignment || !isStaff) {
            setSectionStudents([]);
            return;
        }
        
        const fetchSectionStudents = async () => {
            setLoadingStudents(true);
            try {
                const db = getFirestoreInstance();
                const studentsCol = collection(db, 'students');
                const q = query(studentsCol, where('sectionId', '==', selectedAssignment.sectionId));
                const snapshot = await getDocs(q);
                const studentsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Student[];
                console.log(`[AssignmentsView] Fetched ${studentsData.length} students for section ${selectedAssignment.sectionId}`);
                setSectionStudents(studentsData);
            } catch (error) {
                console.error('[AssignmentsView] Error fetching section students:', error);
                setSectionStudents([]);
            } finally {
                setLoadingStudents(false);
            }
        };
        
        fetchSectionStudents();
    }, [selectedAssignment, isStaff]);

    // Portal (Student/Parent) Logic
    const studentAssignmentsByLA = useMemo(() => {
        if (isStaff) return new Map();
        const map = new Map<string, Assignment[]>();
        filteredAssignments.forEach(assignment => {
            if (!map.has(assignment.learningAreaId)) map.set(assignment.learningAreaId, []);
            map.get(assignment.learningAreaId)!.push(assignment);
        });
        return map;
    }, [filteredAssignments, isStaff]);

    const studentGradeMap = useMemo(() => {
        if (isStaff) return new Map();
        const map = new Map<string, StudentAssignmentGrade>();
        studentAssignmentGrades
            .filter(sg => sg.studentId === studentForPortal?.id)
            .forEach(sg => map.set(sg.assignmentId, sg));
        return map;
    }, [studentAssignmentGrades, studentForPortal, isStaff]);

    // Teacher Handlers
    const handleOpenAssignmentModal = (assignment: Assignment | null = null) => {
        setAssignmentToEdit(assignment ? { ...assignment } : { sectionId: selectedSectionId!, learningAreaId: selectedLearningAreaId!, totalPoints: 100 });
        setIsAssignmentModalOpen(true);
    };

    const handleSaveAssignment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignmentToEdit) return;
        
    const { id, title, totalPoints, dueDate, sectionId, learningAreaId } = assignmentToEdit;
        if (!title || !totalPoints || !dueDate || !sectionId || !learningAreaId) {
            alert('Please fill all fields'); return;
        }

        try {
            if (id) {
                await updateAssignment(assignmentToEdit as Assignment);
            } else {
                await addAssignment(assignmentToEdit as Omit<Assignment, 'id'>);
            }
            setIsAssignmentModalOpen(false);
        } catch (error) {
            console.error('Failed to save assignment:', error);
            alert(`Failed to save assignment: ${error}`);
        }
    };

    const handleDeleteAssignment = async () => {
        if (selectedAssignment) {
            await deleteAssignment(selectedAssignment.id);
            setIsDeleteModalOpen(false);
            setSelectedAssignment(null);
        }
    };
    
    const handleScoreChange = async (studentId: string, score: number | null, feedback: string | null) => {
        if (!selectedAssignment) return;
        await updateAssignmentGrade(studentId, selectedAssignment.id, score, feedback);
    };

    // Student Handlers
    const handleOpenSubmissionModal = (assignment: Assignment) => {
        setAssignmentToSubmit(assignment);
        setFileName('');
        setSubmissionModalOpen(true);
    };
    
    const handleFileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (assignmentToSubmit && studentForPortal && fileName) {
            await submitAssignment(studentForPortal.id, assignmentToSubmit.id, fileName);
            setSubmissionModalOpen(false);
        }
    };
    
    // Common
    const title = isStudent ? 'My Assignments' : isParent ? `Assignments for ${studentForPortal?.name}` : 'Assignments';
    
    // RENDER STAFF VIEW
    if (isStaff) return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Assignments</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md space-y-4">
                    {/* Filters and List Here */}
                    <div>
                        <label className="font-semibold block mb-1">Class</label>
                        <select value={selectedSectionId ?? ''} onChange={e => setSelectedSectionId(e.target.value)} className="w-full input-style">
                            <option value="">Select a class...</option>
                            {visibleSections.map(s => <option key={s.id} value={s.id}>Grade {s.gradeLevel} - {s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">Learning Area</label>
                        <select value={selectedLearningAreaId ?? ''} onChange={e => setSelectedLearningAreaId(e.target.value)} className="w-full input-style" disabled={!selectedSectionId}>
                            <option value="">Select a learning area...</option>
                            {learningAreasForSection.map(la => <option key={la.id} value={la.id}>{la.name}</option>)}
                        </select>
                    </div>
                    <hr className="dark:border-slate-600"/>
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold">Assignments</h2>
                        {!isReadOnly && <button onClick={() => handleOpenAssignmentModal()} disabled={!selectedLearningAreaId} className="bg-indigo-600 text-white font-semibold py-2 px-3 rounded-lg text-sm hover:bg-indigo-700 disabled:bg-slate-400">New</button>}
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredAssignments.map(a => (
                            <div key={a.id} onClick={() => setSelectedAssignment(a)} className={`p-3 rounded-lg cursor-pointer ${selectedAssignment?.id === a.id ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>
                                <h3 className="font-bold">{a.title}</h3>
                                <p className="text-xs text-slate-500">Due: {a.dueDate} | Points: {a.totalPoints}</p>
                            </div>
                        ))}
                         {filteredAssignments.length === 0 && <p className="text-center text-sm text-slate-500 py-4">No assignments found.</p>}
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
                    {/* Grading Sheet Here */}
                    {selectedAssignment ? (
                        <>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold">{selectedAssignment.title}</h2>
                                    <p className="text-slate-500">{selectedAssignment.description}</p>
                                </div>
                                {!isReadOnly && <div className="flex items-center space-x-2">
                                    <button onClick={() => handleOpenAssignmentModal(selectedAssignment)} className="p-2 text-sky-600 hover:text-sky-800"><PencilIcon/></button>
                                    <button onClick={() => setIsDeleteModalOpen(true)} className="p-2 text-red-600 hover:text-red-800"><TrashIcon/></button>
                                </div>}
                            </div>
                             <div className="overflow-y-auto" style={{maxHeight: '60vh'}}>
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 z-10">
                                        <tr>
                                            <th className="p-2 text-left font-semibold">Student Name</th>
                                            <th className="p-2 text-left font-semibold">Status</th>
                                            <th className="p-2 text-center font-semibold">Score</th>
                                            <th className="p-2 text-center font-semibold">Feedback</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingStudents ? (
                                            <tr><td colSpan={4} className="p-4 text-center text-slate-500">Loading students...</td></tr>
                                        ) : sectionStudents.length === 0 ? (
                                            <tr><td colSpan={4} className="p-4 text-center text-slate-500">No students found in this section</td></tr>
                                        ) : (
                                            sectionStudents.map((student) => {
                                                const grade = studentAssignmentGrades.find(g => g.assignmentId === selectedAssignment.id && g.studentId === student.id);
                                                const status = getStatus(selectedAssignment, grade);
                                                return (
                                                    <tr key={student.id} className="border-t dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                        <td className="p-2 font-medium">{student.name}</td>
                                                        <td className="p-2">
                                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${status.color}`}>{status.text}</span>
                                                            {grade?.filePath && <a href="#" onClick={(e) => e.preventDefault()} title={grade.filePath} className="ml-2 inline-block align-middle text-slate-500"><DocumentArrowDownIcon/></a>}
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <input
                                                                key={`${selectedAssignment.id}-${student.id}-${grade?.score ?? ''}`}
                                                                type="number"
                                                                defaultValue={grade?.score ?? ''}
                                                                onBlur={(e) => handleScoreChange(student.id, e.target.value === '' ? null : parseInt(e.target.value), grade?.feedback ?? null)}
                                                                disabled={isReadOnly}
                                                                className="w-20 p-1 text-center border rounded-md dark:bg-slate-700 dark:border-slate-600"
                                                            />
                                                            <span className="ml-2 text-slate-500">/ {selectedAssignment.totalPoints}</span>
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <button onClick={() => setFeedbackToEdit({studentId: student.id, feedback: grade?.feedback ?? null})} className="text-indigo-600 font-semibold text-xs">
                                                                {grade?.feedback ? 'Edit Feedback' : 'Add Feedback'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : ( <div className="flex items-center justify-center h-full text-slate-500"><p>Select an assignment to view and enter grades.</p></div> )}
                </div>
            </div>
            {/* Modals */}
            <Modal isOpen={isAssignmentModalOpen} onClose={() => setIsAssignmentModalOpen(false)} title={assignmentToEdit?.id ? 'Edit Assignment' : 'Create Assignment'}>
                <form onSubmit={handleSaveAssignment} className="space-y-4">
                    <div><label className="font-semibold block mb-1">Title</label><input type="text" value={assignmentToEdit?.title ?? ''} onChange={e => setAssignmentToEdit(p => ({...p, title: e.target.value}))} className="w-full input-style" required/></div>
                    <div><label className="font-semibold block mb-1">Description</label><textarea value={assignmentToEdit?.description ?? ''} onChange={e => setAssignmentToEdit(p => ({...p, description: e.target.value}))} className="w-full input-style"/></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="font-semibold block mb-1">Total Points</label><input type="number" value={assignmentToEdit?.totalPoints ?? ''} onChange={e => setAssignmentToEdit(p => ({...p, totalPoints: parseInt(e.target.value)}))} className="w-full input-style" required/></div>
                        <div><label className="font-semibold block mb-1">Due Date</label><input type="date" value={assignmentToEdit?.dueDate ?? ''} onChange={e => setAssignmentToEdit(p => ({...p, dueDate: e.target.value}))} className="w-full input-style" required/></div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={() => setIsAssignmentModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 font-semibold py-2 px-4 rounded-lg">Cancel</button>
                        <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg">Save</button>
                    </div>
                </form>
            </Modal>
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
                <p>Are you sure you want to delete the assignment <span className="font-bold">{selectedAssignment?.title}</span>? All associated grades will be lost. This cannot be undone.</p>
                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 font-semibold py-2 px-4 rounded-lg">Cancel</button>
                    <button onClick={handleDeleteAssignment} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg">Delete</button>
                </div>
            </Modal>
             <Modal isOpen={!!feedbackToEdit} onClose={() => setFeedbackToEdit(null)} title={`Feedback for ${sectionStudents.find(s => s.id === feedbackToEdit?.studentId)?.name || students.find(s => s.id === feedbackToEdit?.studentId)?.name}`}>
                <textarea
                    value={feedbackToEdit?.feedback ?? ''}
                    onChange={(e) => setFeedbackToEdit(p => p ? {...p, feedback: e.target.value} : null)}
                    className="w-full input-style"
                    rows={5}
                />
                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={() => setFeedbackToEdit(null)} className="bg-slate-200 dark:bg-slate-600 font-semibold py-2 px-4 rounded-lg">Cancel</button>
                    <button onClick={() => {
                        if(feedbackToEdit && selectedAssignment) {
                            const grade = studentAssignmentGrades.find(g => g.assignmentId === selectedAssignment.id && g.studentId === feedbackToEdit.studentId);
                            handleScoreChange(feedbackToEdit.studentId, grade?.score ?? null, feedbackToEdit.feedback);
                        }
                        setFeedbackToEdit(null);
                    }} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg">Save Feedback</button>
                </div>
            </Modal>
            <style>{`.input-style { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid; border-color: #d1d5db; background-color: transparent; padding: 0.5rem 0.75rem; } .dark .input-style { border-color: #4b5563; }`}</style>
        </div>
    );
    
    // RENDER STUDENT/PARENT VIEW
    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">{title}</h1>
            <div className="space-y-6">
                {Array.from(studentAssignmentsByLA.entries()).map(([laId, laAssignments]) => (
                    <div key={laId}>
                        <h2 className="text-xl font-bold mb-2">{learningAreas.find(la => la.id === laId)?.name}</h2>
                        <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden">
                            <table className="min-w-full">
                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="p-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Assignment</th>
                                        <th className="p-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Due Date</th>
                                        <th className="p-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Status</th>
                                        <th className="p-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Score</th>
                                        <th className="p-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Action / Feedback</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {laAssignments.map((assignment: Assignment) => {
                                        const grade = studentGradeMap.get(assignment.id);
                                        const status = getStatus(assignment, grade);
                                        return (
                                            <tr key={assignment.id} className="border-t dark:border-slate-700">
                                                <td className="p-3 font-medium">{assignment.title}</td>
                                                <td className="p-3 text-slate-500">{assignment.dueDate}</td>
                                                <td className="p-3 text-center"><span className={`px-2 py-1 text-xs font-bold rounded-full ${status.color}`}>{status.text}</span></td>
                                                <td className="p-3 text-center font-semibold">{grade?.score !== null && grade?.score !== undefined ? `${grade.score} / ${assignment.totalPoints}` : '-'}</td>
                                                <td className="p-3">
                                                    {isStudent && status.text !== 'Graded' && status.text !== 'Submitted' && <button onClick={() => handleOpenSubmissionModal(assignment)} className="bg-indigo-600 text-white font-semibold py-1 px-3 rounded-lg text-sm flex items-center"><DocumentArrowUpIcon/><span className="ml-1">Submit Work</span></button>}
                                                    {grade?.feedback && <p className="text-sm italic text-slate-600 dark:text-slate-400">"{grade.feedback}"</p>}
                                                    {grade?.filePath && <p className="text-sm text-slate-500">Submitted: {grade.filePath}</p>}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={submissionModalOpen} onClose={() => setSubmissionModalOpen(false)} title={`Submit: ${assignmentToSubmit?.title}`}>
                <form onSubmit={handleFileSubmit} className="space-y-4">
                    <p className="text-sm text-slate-500">Simulate file upload by providing a filename.</p>
                    <div>
                        <label className="font-semibold">Filename</label>
                        <input type="text" value={fileName} onChange={e => setFileName(e.target.value)} placeholder="e.g., my_homework.pdf" className="w-full input-style" required/>
                    </div>
                     <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={() => setSubmissionModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 font-semibold py-2 px-4 rounded-lg">Cancel</button>
                        <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg">Submit</button>
                    </div>
                </form>
            </Modal>
             <style>{`.input-style { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid; border-color: #d1d5db; background-color: transparent; padding: 0.5rem 0.75rem; } .dark .input-style { border-color: #4b5563; }`}</style>
        </div>
    );
};

export default AssignmentsView;