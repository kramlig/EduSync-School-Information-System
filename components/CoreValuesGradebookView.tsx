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

    // Top Reassessment calculation
    const topReassessmentData = useMemo(() => {
        if (!selectedSectionId) return [];
        
        return studentsInSection.map(student => {
            const studentData: any = {
                id: student.id,
                name: student.name,
                lrn: student.lrn || 'N/A'
            };
            
            // For each core value
            coreValues.forEach(cv => {
                const gradeRecord = gradeMap.get(`${student.id}-${cv.id}`);
                
                // For each quarter
                (['q1', 'q2', 'q3', 'q4'] as const).forEach(quarter => {
                    const behaviors = cv.behaviors || [];
                    const markings = behaviors.map(behavior => gradeRecord?.[quarter]?.[behavior]).filter(Boolean);
                    
                    // Calculate predominant marking
                    const aoCount = markings.filter(m => m === 'AO').length;
                    const soCount = markings.filter(m => m === 'SO').length;
                    const roCount = markings.filter(m => m === 'RO').length;
                    const noCount = markings.filter(m => m === 'NO').length;
                    
                    let predominant = '-';
                    if (markings.length > 0) {
                        const max = Math.max(aoCount, soCount, roCount, noCount);
                        if (aoCount === max) predominant = 'AO';
                        else if (soCount === max) predominant = 'SO';
                        else if (roCount === max) predominant = 'RO';
                        else if (noCount === max) predominant = 'NO';
                    }
                    
                    studentData[`${cv.id}-${quarter}`] = predominant;
                });
            });
            
            return studentData;
        });
    }, [studentsInSection, coreValues, gradeMap, selectedSectionId]);

    const [showTopReassessment, setShowTopReassessment] = useState(true);

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Core Values Gradebook</h1>
            
            {/* Toggle Top Reassessment */}
            <div className="mb-4">
                <button
                    onClick={() => setShowTopReassessment(!showTopReassessment)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors shadow-md"
                >
                    <span>{showTopReassessment ? '▼' : '▶'}</span>
                    <span>Top Reassessment Summary</span>
                    <span className="bg-purple-500 px-2 py-0.5 rounded-full text-xs">
                        {studentsInSection.length} students
                    </span>
                </button>
            </div>

            {/* Top Reassessment Spreadsheet */}
            {showTopReassessment && selectedSectionId && (
                <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
                        <h2 className="text-xl font-bold">📊 Top Reassessment - Complete Overview</h2>
                        <p className="text-purple-100 text-sm mt-1">Comprehensive view of all core values across all quarters</p>
                    </div>
                    
                    <div className="overflow-x-auto" style={{ maxHeight: '500px' }}>
                        <table className="min-w-full text-xs border-collapse">
                            <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-20">
                                <tr>
                                    <th rowSpan={2} className="px-3 py-2 sticky left-0 z-30 bg-slate-100 dark:bg-slate-900 border-b-2 border-r-2 border-slate-300 dark:border-slate-700 min-w-[180px]">
                                        <div className="font-bold text-slate-700 dark:text-slate-300">Student Name</div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">LRN</div>
                                    </th>
                                    {coreValues.map(cv => (
                                        <th key={cv.id} colSpan={4} className="px-3 py-2 text-center border-b border-l border-slate-300 dark:border-slate-700 bg-purple-100 dark:bg-purple-900/30">
                                            <div className="font-bold text-purple-700 dark:text-purple-300">{cv.name}</div>
                                        </th>
                                    ))}
                                </tr>
                                <tr>
                                    {coreValues.map(cv => (
                                        <React.Fragment key={cv.id}>
                                            <th className="px-2 py-1 text-center border-b-2 border-l border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold">Q1</th>
                                            <th className="px-2 py-1 text-center border-b-2 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold">Q2</th>
                                            <th className="px-2 py-1 text-center border-b-2 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold">Q3</th>
                                            <th className="px-2 py-1 text-center border-b-2 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold">Q4</th>
                                        </React.Fragment>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {topReassessmentData.map((studentData, index) => (
                                    <tr key={studentData.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'} hover:bg-purple-50 dark:hover:bg-purple-900/20 border-b dark:border-slate-700`}>
                                        <td className="px-3 py-2 sticky left-0 z-10 border-r-2 border-slate-300 dark:border-slate-700 bg-inherit">
                                            <div className="font-medium text-slate-900 dark:text-white">{studentData.name}</div>
                                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{studentData.lrn}</div>
                                        </td>
                                        {coreValues.map(cv => (
                                            <React.Fragment key={cv.id}>
                                                {(['q1', 'q2', 'q3', 'q4'] as const).map(quarter => {
                                                    const marking = studentData[`${cv.id}-${quarter}`];
                                                    return (
                                                        <td key={`${cv.id}-${quarter}`} className={`px-2 py-2 text-center border-l border-slate-200 dark:border-slate-700 font-bold ${getMarkingColor(marking as CoreValueMarking)}`}>
                                                            {marking === '-' ? <span className="text-slate-300 dark:text-slate-600">—</span> : marking}
                                                        </td>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Legend */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Legend:</span>
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-green-600">AO</span>
                                <span className="text-slate-600 dark:text-slate-400">= Always Observed</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-lime-600">SO</span>
                                <span className="text-slate-600 dark:text-slate-400">= Sometimes Observed</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-amber-600">RO</span>
                                <span className="text-slate-600 dark:text-slate-400">= Rarely Observed</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-red-600">NO</span>
                                <span className="text-slate-600 dark:text-slate-400">= Not Observed</span>
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">Note:</span> Values shown are the predominant marking for each core value per quarter based on behavior observations.
                        </div>
                    </div>
                </div>
            )}
            
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