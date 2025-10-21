import React, { useState, useMemo, useEffect } from 'react';
import type { CoreValueGrade, CoreValueMarking, AuthUser, StudentUser, Student } from '../types';
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

// Sub-component for displaying a student's core value grades
const StudentCoreValueDetails: React.FC<{
  student: Student;
  coreValues: SchoolDataHook['coreValues'];
  coreValueGrades: CoreValueGrade[];
  updateCoreValueGrade: SchoolDataHook['updateCoreValueGrade'];
  isReadOnly: boolean;
}> = ({ student, coreValues, coreValueGrades, updateCoreValueGrade, isReadOnly }) => {

  const gradeMap = useMemo(() => {
    const map = new Map<string, CoreValueGrade>();
    coreValueGrades.filter(g => g.studentId === student.id).forEach(g => {
      map.set(g.coreValueId, g);
    });
    return map;
  }, [coreValueGrades, student.id]);
  
  const handleMarkingChange = (
    cvId: string, 
    quarter: 'q1'|'q2'|'q3'|'q4', 
    behavior: string, 
    value: string
  ) => {
    updateCoreValueGrade(student.id, cvId, quarter, behavior, value as CoreValueMarking | '');
  };

  const totalBehaviors = useMemo(() => coreValues.reduce((sum, cv) => sum + (cv.behaviors?.length || 0), 0), [coreValues]);
  let behaviorCounter = 0;

  return (
    <div className="overflow-x-auto bg-slate-50 dark:bg-slate-800/50 p-4">
      <table className="min-w-full table-fixed">
        <thead>
          <tr className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
            <th className="py-2 px-3 text-left w-2/5">Behavior Statements</th>
            <th className="py-2 px-3 text-center w-[15%]">Q1</th>
            <th className="py-2 px-3 text-center w-[15%]">Q2</th>
            <th className="py-2 px-3 text-center w-[15%]">Q3</th>
            <th className="py-2 px-3 text-center w-[15%]">Q4</th>
          </tr>
        </thead>
        <tbody>
          {coreValues.map(cv => (
            <React.Fragment key={cv.id}>
              <tr className="bg-slate-100 dark:bg-slate-900/80">
                <td colSpan={5} className="py-2 px-3 font-bold text-sm text-slate-800 dark:text-slate-200">
                  {cv.name}
                </td>
              </tr>
              {(cv.behaviors || []).map(behavior => {
                const currentGrade = gradeMap.get(cv.id);
                const currentBehaviorIndex = behaviorCounter;
                behaviorCounter++;
                return (
                   <tr key={behavior} className="border-b border-slate-200 dark:border-slate-700">
                     <td className="py-3 px-3 text-sm text-slate-700 dark:text-slate-300">{behavior}</td>
                     {(['q1', 'q2', 'q3', 'q4'] as const).map((q, qIndex) => (
                       <td key={q} className="py-2 px-3">
                         <select
                           value={currentGrade?.[q]?.[behavior] ?? ''}
                           onChange={(e) => handleMarkingChange(cv.id, q, behavior, e.target.value)}
                           tabIndex={(qIndex * totalBehaviors) + currentBehaviorIndex + 1}
                           disabled={isReadOnly}
                           className={`w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 text-center text-sm font-semibold focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-700/50 ${getMarkingColor(currentGrade?.[q]?.[behavior] as CoreValueMarking)}`}
                         >
                            <option value="">-</option>
                            {MARKING_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                         </select>
                       </td>
                     ))}
                   </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CoreValuesGradebookView: React.FC<{ schoolData: SchoolDataHook; session: { user: AuthUser | StudentUser, type: 'staff' | 'student' }; }> = ({ schoolData, session }) => {
    const { students, coreValues, coreValueGrades, sections, substituteAssignments, classSchedules, updateCoreValueGrade } = schoolData;
    
    // Debug logging
    useEffect(() => {
        console.log('[CoreValuesGradebook] 📦 Data received:', {
            studentsCount: students.length,
            coreValuesCount: coreValues.length,
            coreValueGradesCount: coreValueGrades.length,
            sectionsCount: sections.length,
            coreValueGradesSample: coreValueGrades.slice(0, 3)
        });
    }, [students, coreValues, coreValueGrades, sections]);
    
    const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
    const [selectedSectionId, setSelectedSectionId] = useState<string | 'all'>('all');
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
        if (selectedSectionId === 'all' && visibleSections.length > 0) {
            setSelectedSectionId(visibleSections[0].id);
        }
    }, [visibleSections, selectedSectionId]);
    
    const filteredStudents = useMemo(() => {
        const base = selectedSectionId === 'all' 
            ? students 
            : students.filter(s => s.sectionId === selectedSectionId);
        
        return base.filter(student =>
            student.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            (student.email && student.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
        );
    }, [students, selectedSectionId, debouncedSearchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
    const pagedStudents = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredStudents.slice(start, start + pageSize);
    }, [filteredStudents, page]);

    useEffect(() => { setPage(1); }, [debouncedSearchQuery, selectedSectionId]);
    
    const toggleStudentExpansion = (studentId: string) => {
        setExpandedStudents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };


    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Evaluate Core Values</h1>
            
            {/* Filters */}
            <div className="mb-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <label className="font-semibold">Class:</label>
                    <select
                        value={selectedSectionId}
                        onChange={(e) => setSelectedSectionId(e.target.value as any)}
                        className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700"
                    >
                        <option value="all">All</option>
                        {visibleSections.map(s => (
                            <option key={s.id} value={s.id}>{`Grade ${s.gradeLevel} - ${s.name}`}</option>
                        ))}
                    </select>
                </div>
                <input
                    type="text"
                    placeholder="Search students by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full max-w-sm px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                />
            </div>

            {/* Student List */}
            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full leading-normal">
                    <thead className="bg-slate-100 dark:bg-slate-900">
                        <tr>
                            <th className="w-12"></th>
                            <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Student Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagedStudents.map((student) => (
                            <React.Fragment key={student.id}>
                                <tr 
                                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700" 
                                    onClick={() => toggleStudentExpansion(student.id)}
                                >
                                    <td className="pl-4 py-4 text-slate-500">
                                        {expandedStudents.has(student.id) ? (
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">
                                        {student.name}
                                    </td>
                                </tr>
                                {expandedStudents.has(student.id) && (
                                    <tr>
                                        <td colSpan={2} className="p-0">
                                            <StudentCoreValueDetails 
                                                student={student} 
                                                coreValues={coreValues} 
                                                coreValueGrades={coreValueGrades} 
                                                updateCoreValueGrade={updateCoreValueGrade} 
                                                isReadOnly={isReadOnly} 
                                            />
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-slate-600 dark:text-slate-300">
                    Showing {(pagedStudents.length === 0 ? 0 : (page - 1) * pageSize + 1)}–{(page - 1) * pageSize + pagedStudents.length} of {filteredStudents.length}
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
        </div>
    );
};

export default CoreValuesGradebookView;

