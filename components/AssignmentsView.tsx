import React, { useState, useMemo, useEffect } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import type { Assignment, Section, LearningArea, Student, StudentAssignmentGrade, AuthUser, StudentUser } from '../types';
import Modal from './Modal';
import { PencilIcon, TrashIcon } from './icons';

const AssignmentsView: React.FC<{ schoolData: SchoolDataHook, session: { user: AuthUser | StudentUser, type: 'staff' | 'student' } }> = ({ schoolData, session }) => {
    const {
        assignments, studentAssignmentGrades, sections, learningAreas, students,
        addAssignment, updateAssignment, deleteAssignment, updateStudentAssignmentScore
    } = schoolData;

    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [selectedLearningAreaId, setSelectedLearningAreaId] = useState<string | null>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [assignmentToEdit, setAssignmentToEdit] = useState<Partial<Assignment> | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const authUser = session.user as AuthUser;
    const isReadOnly = authUser.role === 'principal';

    const visibleSections = useMemo(() => {
        if (['admin', 'principal', 'registrar'].includes(authUser.role)) return sections;
        const teacherAdviserSectionId = sections.find(s => s.adviserId === authUser.id)?.id;
        const assignedLearningAreaIds = new Set(authUser.assignments?.map(a => a.learningAreaId));
        return sections.filter(s => s.adviserId === authUser.id || assignedLearningAreaIds.size > 0);
    }, [sections, authUser]);
    
    useEffect(() => {
        if (!selectedSectionId && visibleSections.length > 0) {
            setSelectedSectionId(visibleSections[0].id);
        }
    }, [visibleSections, selectedSectionId]);
    
    const learningAreasForSection = useMemo(() => {
        if (!selectedSectionId) return [];
        if (['admin', 'principal', 'registrar'].includes(authUser.role)) return learningAreas;
        
        const section = sections.find(s => s.id === selectedSectionId);
        if (!section) return [];
        
        const teacherAssignments = authUser.assignments?.filter(a => a.gradeLevel === section.gradeLevel).map(a => a.learningAreaId) || [];
        
        return learningAreas.filter(la => teacherAssignments.includes(la.id));
    }, [learningAreas, selectedSectionId, sections, authUser]);
    
    useEffect(() => {
        if (selectedSectionId && !learningAreasForSection.some(la => la.id === selectedLearningAreaId)) {
            setSelectedLearningAreaId(learningAreasForSection[0]?.id || null);
        }
    }, [selectedSectionId, learningAreasForSection, selectedLearningAreaId]);

    const filteredAssignments = useMemo(() => {
        if (!selectedSectionId || !selectedLearningAreaId) return [];
        return assignments.filter(a => a.sectionId === selectedSectionId && a.learningAreaId === selectedLearningAreaId);
    }, [assignments, selectedSectionId, selectedLearningAreaId]);
    
    useEffect(() => {
        if (!filteredAssignments.some(a => a.id === selectedAssignment?.id)) {
            setSelectedAssignment(null);
        }
    }, [filteredAssignments, selectedAssignment]);

    const studentsForGrading = useMemo(() => {
        if (!selectedAssignment) return [];
        return students.filter(s => s.sectionId === selectedAssignment.sectionId);
    }, [students, selectedAssignment]);

    const assignmentGradeMap = useMemo(() => {
        const map = new Map<string, number | null>();
        studentAssignmentGrades
            .filter(sg => sg.assignmentId === selectedAssignment?.id)
            .forEach(sg => { map.set(sg.studentId, sg.score); });
        return map;
    }, [studentAssignmentGrades, selectedAssignment]);

    const handleOpenAssignmentModal = (assignment: Assignment | null = null) => {
        setAssignmentToEdit(assignment ? { ...assignment } : { sectionId: selectedSectionId!, learningAreaId: selectedLearningAreaId!, totalPoints: 100 });
        setIsAssignmentModalOpen(true);
    };

    const handleSaveAssignment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignmentToEdit) return;
        
        const { id, title, description, totalPoints, dueDate, sectionId, learningAreaId } = assignmentToEdit;
        if (!title || !totalPoints || !dueDate || !sectionId || !learningAreaId) {
            alert('Please fill all fields'); return;
        }

        if (id) {
            updateAssignment(assignmentToEdit as Assignment);
        } else {
            addAssignment(assignmentToEdit as Omit<Assignment, 'id'>);
        }
        setIsAssignmentModalOpen(false);
    };

    const handleDeleteAssignment = () => {
        if (selectedAssignment) {
            deleteAssignment(selectedAssignment.id);
            setIsDeleteModalOpen(false);
            setSelectedAssignment(null);
        }
    };

    const handleScoreChange = (studentId: string, value: string) => {
        if (!selectedAssignment) return;
        const numValue = value === '' ? null : parseInt(value, 10);
        if (numValue !== null && (isNaN(numValue) || numValue < 0 || numValue > selectedAssignment.totalPoints)) return;
        updateStudentAssignmentScore(studentId, selectedAssignment.id, numValue);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent, studentIndex: number) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
            e.preventDefault();
            const nextStudent = studentsForGrading[studentIndex + 1];
            if (nextStudent) {
                document.getElementById(`score-input-${nextStudent.id}`)?.focus();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevStudent = studentsForGrading[studentIndex - 1];
            if (prevStudent) {
                document.getElementById(`score-input-${prevStudent.id}`)?.focus();
            }
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Assignments</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Filters and Assignment List */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md space-y-4">
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

                {/* Right Panel: Grading Sheet */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
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
                                            <th className="p-2 text-center font-semibold">Score</th>
                                            <th className="p-2 text-center font-semibold">Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentsForGrading.map((student, index) => {
                                            const score = assignmentGradeMap.get(student.id);
                                            const percentage = score !== null && score !== undefined
                                                ? ((score / selectedAssignment.totalPoints) * 100).toFixed(0) + '%'
                                                : '-';
                                            return (
                                                <tr key={student.id} className="border-t dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                    <td className="p-2 font-medium">{student.name}</td>
                                                    <td className="p-2 text-center">
                                                        <input
                                                            id={`score-input-${student.id}`}
                                                            type="number"
                                                            defaultValue={score ?? ''}
                                                            onBlur={(e) => handleScoreChange(student.id, e.target.value)}
                                                            onKeyDown={(e) => handleKeyDown(e, index)}
                                                            disabled={isReadOnly}
                                                            className="w-20 p-1 text-center border rounded-md dark:bg-slate-700 dark:border-slate-600"
                                                        />
                                                        <span className="ml-2 text-slate-500">/ {selectedAssignment.totalPoints}</span>
                                                    </td>
                                                    <td className="p-2 text-center font-semibold">{percentage}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            <p>Select an assignment to view and enter grades.</p>
                        </div>
                    )}
                </div>
            </div>
            
             {/* Assignment Add/Edit Modal */}
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
            
            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
                <p>Are you sure you want to delete the assignment <span className="font-bold">{selectedAssignment?.title}</span>? All associated grades will be lost. This cannot be undone.</p>
                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 font-semibold py-2 px-4 rounded-lg">Cancel</button>
                    <button onClick={handleDeleteAssignment} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg">Delete</button>
                </div>
            </Modal>
            <style>{`.input-style { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid; border-color: #d1d5db; background-color: transparent; padding: 0.5rem 0.75rem; } .dark .input-style { border-color: #4b5563; }`}</style>
        </div>
    );
};

export default AssignmentsView;
