import React, { useState, useMemo, useEffect } from 'react';
import type { CoreValueGrade, CoreValueMarking, AuthUser, StudentUser } from '../types';
import { SchoolDataHook } from '../hooks/useSchoolData';
import { useDebounce } from '../hooks/useDebounce';

const MARKING_OPTIONS: CoreValueMarking[] = ['AO', 'SO', 'RO', 'NO'];

const getMarkingColor = (marking: CoreValueMarking | undefined) => {
  switch (marking) {
    case 'AO': return 'text-green-600 dark:text-green-400';
    case 'SO': return 'text-lime-600 dark:text-lime-400';
    case 'RO': return 'text-amber-600 dark:text-amber-400';
    case 'NO': return 'text-red-600 dark:text-red-400';
    default: return 'text-slate-500 dark:text-slate-400';
  }
};

const CoreValuesGradebookView: React.FC<{ schoolData: SchoolDataHook; session: { user: AuthUser | StudentUser, type: 'staff' | 'student' }; }> = ({ schoolData, session }) => {
    const { students, coreValues, coreValueGrades, sections, substituteAssignments, classSchedules, updateCoreValueGrade } = schoolData;
    
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [selectedCoreValueId, setSelectedCoreValueId] = useState<string | null>(null);
    const [selectedQuarter, setSelectedQuarter] = useState<'q1' | 'q2' | 'q3' | 'q4'>('q1');
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    
    const authUser = session.user as AuthUser;
    const isReadOnly = authUser.role === 'principal';
    const [page, setPage] = useState(1);
    const pageSize = 25;

    const visibleSections = useMemo(() => {
        if (['admin', 'principal', 'registrar'].includes(authUser.role)) return sections;

        const authorizedSectionIds = new Set<string>();

        const teacherAdviserSection = sections.find(s => s.adviserId === authUser.id);
        if (teacherAdviserSection) authorizedSectionIds.add(teacherAdviserSection.id);

        const today = new Date().toISOString().split('T')[0];
        const activeSubAssignments = substituteAssignments.filter(sub => 
          sub.teacherId === authUser.id && today >= sub.startDate && today <= sub.endDate
        );

        if (activeSubAssignments.length > 0) {
            const originalTeacherIds = activeSubAssignments.map(sub => sub.originalTeacherId);
            sections.forEach(s => {
                if (s.adviserId && originalTeacherIds.includes(s.adviserId)) {
                    authorizedSectionIds.add(s.id);
                }
            });
            classSchedules.forEach(schedule => {
                if (schedule.teacherId && schedule.sectionId && originalTeacherIds.includes(schedule.teacherId)) {
                    authorizedSectionIds.add(schedule.sectionId);
                }
            });
        }

        classSchedules.forEach(schedule => {
          if (schedule.teacherId === authUser.id && schedule.sectionId) {
            authorizedSectionIds.add(schedule.sectionId);
          }
        });

        return sections.filter(s => authorizedSectionIds.has(s.id));
    }, [sections, substituteAssignments, classSchedules, authUser]);

    useEffect(() => {
        if (!selectedSectionId && visibleSections.length > 0) setSelectedSectionId(visibleSections[0].id);
        if (!selectedCoreValueId && coreValues.length > 0) setSelectedCoreValueId(coreValues[0].id);
        if (selectedSectionId && !visibleSections.some(s => s.id === selectedSectionId)) {
          setSelectedSectionId(visibleSections[0]?.id || null);
        }
    }, [visibleSections, coreValues, selectedSectionId, selectedCoreValueId]);
    
    const studentsInSection = useMemo(() => {
        if (!selectedSectionId) return [];
        return students.filter(s => 
            s.sectionId === selectedSectionId &&
            s.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );
    }, [students, selectedSectionId, debouncedSearchQuery]);

    const totalPages = Math.max(1, Math.ceil(studentsInSection.length / pageSize));
    const pagedStudents = useMemo(() => {
        const start = (page - 1) * pageSize;
        return studentsInSection.slice(start, start + pageSize);
    }, [studentsInSection, page]);

    useEffect(() => { setPage(1); }, [selectedSectionId, selectedCoreValueId, selectedQuarter, debouncedSearchQuery]);

    const columns = useMemo(() => {
        if (!selectedCoreValueId) return [];
        const coreValue = coreValues.find(cv => cv.id === selectedCoreValueId);
        return coreValue?.behaviors || [];
    }, [coreValues, selectedCoreValueId]);
    
    const gradeMap = useMemo(() => {
        const map = new Map<string, CoreValueGrade>();
        coreValueGrades.forEach(g => map.set(`${g.studentId}-${g.coreValueId}`, g));
        return map;
    }, [coreValueGrades]);

    const handleMarkingChange = (studentId: string, behavior: string, value: string) => {
        if (!selectedCoreValueId) return;
        updateCoreValueGrade(studentId, selectedCoreValueId, selectedQuarter, behavior, value as CoreValueMarking | '');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>, rowIndex: number, colIndex: number) => {
        let nextRow = rowIndex, nextCol = colIndex;
        
        switch (e.key) {
            case 'ArrowUp': nextRow--; break;
            case 'ArrowDown': nextRow++; break;
            case 'ArrowLeft': nextCol--; break;
            case 'ArrowRight': nextCol++; break;
            case 'Enter': 
                e.preventDefault();
                nextRow++;
                if (nextRow >= studentsInSection.length) {
                    nextRow = 0;
                    nextCol++;
                }
                break;
            default: return;
        }

        e.preventDefault();
        
        if (nextRow >= 0 && nextRow < studentsInSection.length && nextCol >= 0 && nextCol < columns.length) {
            const studentId = studentsInSection[nextRow].id;
            const behavior = columns[nextCol];
            const nextCellId = `cell-${studentId}-${behavior.replace(/\s/g, '-')}`;
            document.getElementById(nextCellId)?.focus();
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Core Values Gradebook</h1>
            
            <div className="mb-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                    <label htmlFor="section-select" className="font-semibold mr-2">Class:</label>
                    <select id="section-select" value={selectedSectionId ?? ''} onChange={e => setSelectedSectionId(e.target.value)} className="input-style">
                        {visibleSections.map(s => <option key={s.id} value={s.id}>Grade {s.gradeLevel} - {s.name}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label htmlFor="cv-select" className="font-semibold mr-2">Core Value:</label>
                    <select id="cv-select" value={selectedCoreValueId ?? ''} onChange={e => setSelectedCoreValueId(e.target.value)} className="input-style">
                        {coreValues.map(cv => <option key={cv.id} value={cv.id}>{cv.name}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                     <label htmlFor="quarter-select" className="font-semibold mr-2">Quarter:</label>
                    <select id="quarter-select" value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value as any)} className="input-style">
                        <option value="q1">Quarter 1</option>
                        <option value="q2">Quarter 2</option>
                        <option value="q3">Quarter 3</option>
                        <option value="q4">Quarter 4</option>
                    </select>
                </div>
                 <div className="flex-1 min-w-[200px]">
                     <label htmlFor="student-search" className="font-semibold mr-2">Student:</label>
                    <input
                        id="student-search"
                        type="text"
                        placeholder="Search student..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-style"
                    />
                </div>
            </div>

            {(!selectedSectionId || !selectedCoreValueId) && (
                <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                    <p className="text-slate-600 dark:text-slate-300">Please select a class and core value to begin.</p>
                </div>
            )}

            {selectedSectionId && selectedCoreValueId && (
                <>
                <div className="overflow-x-auto shadow-md rounded-lg" style={{ maxHeight: '70vh' }}>
                    <table className="min-w-full text-sm text-left border-collapse">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-900 dark:text-slate-300 sticky top-0 z-20">
                            <tr>
                                <th scope="col" className="px-4 py-3 sticky left-0 z-30 bg-slate-100 dark:bg-slate-900 min-w-[200px] border-b border-r border-slate-200 dark:border-slate-700">Student Name</th>
                                {columns.map(behavior => (
                                    <th key={behavior} scope="col" className="px-4 py-3 min-w-[250px] border-b border-slate-200 dark:border-slate-700">{behavior}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {pagedStudents.map((student, rowIndex) => {
                                const gradeRecord = gradeMap.get(`${student.id}-${selectedCoreValueId}`);
                                return (
                                <tr key={student.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-4 py-2 font-medium text-slate-900 dark:text-white sticky left-0 z-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-r dark:border-slate-700">{student.name}</td>
                                    {columns.map((behavior, colIndex) => {
                                        const marking = gradeRecord?.[selectedQuarter]?.[behavior];
                                        return (
                                            <td key={behavior} className="p-1 border-l dark:border-slate-700">
                                                <select
                                                    id={`cell-${student.id}-${behavior.replace(/\s/g, '-')}`}
                                                    value={marking ?? ''}
                                                    onChange={e => handleMarkingChange(student.id, behavior, e.target.value)}
                                                    onKeyDown={e => handleKeyDown(e, rowIndex, colIndex)}
                                                    disabled={isReadOnly}
                                                    className={`w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 text-center font-semibold focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 ${getMarkingColor(marking)}`}
                                                >
                                                    <option value="">-</option>
                                                    {MARKING_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </td>
                                        );
                                    })}
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                        Showing {(pagedStudents.length === 0 ? 0 : (page - 1) * pageSize + 1)}–{(page - 1) * pageSize + pagedStudents.length} of {studentsInSection.length}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Prev
                        </button>
                        <span className="text-sm">Page {page} / {totalPages}</span>
                        <button
                            className="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Next
                        </button>
                    </div>
                </div>
                </>
            )}
            <style>{`.input-style { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid; border-color: #d1d5db; background-color: transparent; padding: 0.5rem 0.75rem; } .dark .input-style { border-color: #4b5563; }`}</style>
        </div>
    );
};

export default CoreValuesGradebookView;