import React, { useState, useMemo, useEffect } from 'react';
import type { CoreValueGrade, CoreValueMarking, AuthUser, StudentUser } from '../types';
import { SchoolDataHook } from '../hooks/useSchoolData';
import { useDebounce } from '../hooks/useDebounce';

// Helper: Convert gradeLevel string to numeric value
const normalizeGradeLevel = (gradeLevel: string | number): number => {
  if (typeof gradeLevel === 'number') return gradeLevel;
  if (gradeLevel === 'Kindergarten') return 0;
  const match = gradeLevel.match(/Grade (\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

const MARKING_OPTIONS: CoreValueMarking[] = ['AO', 'SO', 'RO', 'NO'];

const getMarkingColor = (marking: CoreValueMarking | undefined) => {
  switch (marking) {
    case 'AO': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'SO': return 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300';
    case 'RO': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    case 'NO': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default: return 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
  }
};

// Determine current quarter based on Philippine school year calendar
const getCurrentQuarter = (): 'q1' | 'q2' | 'q3' | 'q4' => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  
  // Philippine school year typically runs June to March
  // Q1: June - August (months 6-8)
  // Q2: September - November (months 9-11)
  // Q3: December - February (months 12, 1-2)
  // Q4: March - May (months 3-5)
  
  if (month >= 6 && month <= 8) return 'q1';      // June-August
  if (month >= 9 && month <= 11) return 'q2';     // September-November
  if (month === 12 || month <= 2) return 'q3';    // December-February
  return 'q4';                                     // March-May
};

const CoreValuesGradebookView: React.FC<{ 
  schoolData: SchoolDataHook; 
  session: { user: AuthUser | StudentUser, type: 'staff' | 'student' };
  selectedSectionId?: string;
  onSectionChange?: (sectionId: string) => void;
  selectedQuarter?: 'all' | 'q1' | 'q2' | 'q3' | 'q4';
  onQuarterChange?: (quarter: 'all' | 'q1' | 'q2' | 'q3' | 'q4') => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}> = ({ schoolData, session, selectedSectionId: propSectionId, onSectionChange, selectedQuarter: propQuarter, onQuarterChange, searchQuery: propSearchQuery, onSearchChange }) => {
    const { students, coreValues, coreValueGrades, sections, substituteAssignments, classSchedules, updateCoreValueGrade } = schoolData;
    
    // Use props if provided (unified mode), otherwise use local state (standalone mode)
    const [localSectionId, setLocalSectionId] = useState<string | 'all'>('all');
    const [localQuarter, setLocalQuarter] = useState<'all' | 'q1' | 'q2' | 'q3' | 'q4'>(getCurrentQuarter());
    const [localSearchQuery, setLocalSearchQuery] = useState('');
    
    const selectedSectionId = propSectionId !== undefined ? propSectionId : localSectionId;
    const selectedQuarter = propQuarter !== undefined ? propQuarter : localQuarter;
    const searchQuery = propSearchQuery !== undefined ? propSearchQuery : localSearchQuery;
    
    const setSelectedSectionId = onSectionChange || setLocalSectionId;
    const setSelectedQuarter = onQuarterChange || setLocalQuarter;
    const setSearchQuery = onSearchChange || setLocalSearchQuery;
    
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    
    const authUser = session.user as AuthUser;
    const isReadOnly = authUser.role === 'principal';
    const [page, setPage] = useState(1);
    const pageSize = 25;

    // New state for enhancements
    const [savingCells, setSavingCells] = useState<Set<string>>(new Set());
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [compactView, setCompactView] = useState(false);
    const [filterByGrade, setFilterByGrade] = useState<CoreValueMarking | 'all' | 'empty'>('all');

    // Keyboard navigation state (focusedCell tracked for keyboard shortcuts)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [focusedCell, setFocusedCell] = useState<{ studentIdx: number; cvIdx: number; behaviorIdx: number; quarterIdx: number } | null>(null);

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
        // If student is logged in, only show their own data
        if (session.type === 'student') {
            const studentUser = session.user as StudentUser;
            const studentData = students.find(s => s.id === studentUser.id);
            return studentData ? [studentData] : [];
        }
        
        // Staff view - filter by section
        const base = selectedSectionId === 'all' 
            ? students 
            : students.filter(s => s.sectionId === selectedSectionId);
        
        return base.filter(student => {
            const name = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim();
            const email = student.email || '';
            return name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                   email.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
        });
    }, [students, selectedSectionId, debouncedSearchQuery, session]);

    // Group sections by grade level for better organization
    const groupedSections = useMemo(() => {
        const groups = {
            elementary: [] as typeof visibleSections,
            juniorHigh: [] as typeof visibleSections,
            seniorHigh: [] as typeof visibleSections
        };
        
        visibleSections.forEach(section => {
            const numericGradeLevel = normalizeGradeLevel(section.gradeLevel);
            if (numericGradeLevel <= 6) {
                groups.elementary.push(section);
            } else if (numericGradeLevel <= 10) {
                groups.juniorHigh.push(section);
            } else {
                groups.seniorHigh.push(section);
            }
        });
        
        // Sort each group by grade level
        groups.elementary.sort((a, b) => normalizeGradeLevel(a.gradeLevel) - normalizeGradeLevel(b.gradeLevel));
        groups.juniorHigh.sort((a, b) => normalizeGradeLevel(a.gradeLevel) - normalizeGradeLevel(b.gradeLevel));
        groups.seniorHigh.sort((a, b) => normalizeGradeLevel(a.gradeLevel) - normalizeGradeLevel(b.gradeLevel));
        
        return groups;
    }, [visibleSections]);

    // Calculate student counts per section
    const sectionStudentCounts = useMemo(() => {
        const counts = new Map<string, number>();
        students.forEach(student => {
            if (student.sectionId) {
                counts.set(student.sectionId, (counts.get(student.sectionId) || 0) + 1);
            }
        });
        return counts;
    }, [students]);

    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
    const pagedStudents = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredStudents.slice(start, start + pageSize);
    }, [filteredStudents, page]);

    useEffect(() => { setPage(1); }, [debouncedSearchQuery, selectedSectionId]);
    
    const gradeMap = useMemo(() => {
        const map = new Map<string, CoreValueGrade>();
        coreValueGrades.forEach(g => map.set(`${g.studentId}-${g.coreValueId}`, g));
        return map;
    }, [coreValueGrades]);

    // Analytics calculations
    const analytics = useMemo(() => {
        const stats = { AO: 0, SO: 0, RO: 0, NO: 0, empty: 0, total: 0 };
        const studentProgress = new Map<string, { graded: number; total: number }>();

        filteredStudents.forEach(student => {
            let graded = 0;
            let total = 0;

            coreValues.forEach(cv => {
                const gradeRecord = gradeMap.get(`${student.id}-${cv.id}`);
                (cv.behaviors || []).forEach(behavior => {
                    (['q1', 'q2', 'q3', 'q4'] as const).forEach(quarter => {
                        total++;
                        const marking = gradeRecord?.[quarter]?.[behavior];
                        if (marking) {
                            stats[marking]++;
                            graded++;
                        } else {
                            stats.empty++;
                        }
                        stats.total++;
                    });
                });
            });

            studentProgress.set(student.id, { graded, total });
        });

        return { stats, studentProgress };
    }, [filteredStudents, coreValues, gradeMap]);

    // Bulk action handlers
    const copyQuarterGrades = async (fromQuarter: 'q1' | 'q2' | 'q3' | 'q4', toQuarter: 'q1' | 'q2' | 'q3' | 'q4') => {
        if (isReadOnly) return;
        if (!confirm(`Copy all grades from ${fromQuarter.toUpperCase()} to ${toQuarter.toUpperCase()}?`)) return;

        for (const student of filteredStudents) {
            for (const cv of coreValues) {
                const gradeRecord = gradeMap.get(`${student.id}-${cv.id}`);
                if (gradeRecord?.[fromQuarter]) {
                    for (const behavior of (cv.behaviors || [])) {
                        const value = gradeRecord[fromQuarter][behavior];
                        if (value) {
                            await updateCoreValueGrade(student.id, cv.id, toQuarter, behavior, value);
                        }
                    }
                }
            }
        }
        alert(`Grades copied from ${fromQuarter.toUpperCase()} to ${toQuarter.toUpperCase()}!`);
    };

    const applyGradeToAll = async (quarter: 'q1' | 'q2' | 'q3' | 'q4', coreValueId: string, behavior: string, grade: CoreValueMarking) => {
        if (isReadOnly) return;
        if (!confirm(`Apply "${grade}" to all ${filteredStudents.length} students for this behavior in ${quarter.toUpperCase()}?`)) return;

        for (const student of filteredStudents) {
            await updateCoreValueGrade(student.id, coreValueId, quarter, behavior, grade);
        }
        alert(`Applied "${grade}" to all students!`);
    };

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['Student Name'];
        coreValues.forEach(cv => {
            (cv.behaviors || []).forEach(behavior => {
                ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
                    headers.push(`${cv.name} - ${behavior.substring(0, 30)}... - ${q}`);
                });
            });
        });

        const rows = [headers.join(',')];
        
        filteredStudents.forEach(student => {
            const row = [student.name];
            coreValues.forEach(cv => {
                const gradeRecord = gradeMap.get(`${student.id}-${cv.id}`);
                (cv.behaviors || []).forEach(behavior => {
                    (['q1', 'q2', 'q3', 'q4'] as const).forEach(quarter => {
                        row.push(gradeRecord?.[quarter]?.[behavior] || '');
                    });
                });
            });
            rows.push(row.join(','));
        });

        const csv = rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `core-values-grades-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleMarkingChange = (studentId: string, coreValueId: string, quarter: 'q1' | 'q2' | 'q3' | 'q4', behavior: string, value: string) => {
        const cellKey = `${studentId}-${coreValueId}-${quarter}-${behavior}`;
        setSavingCells(prev => new Set(prev).add(cellKey));
        
        updateCoreValueGrade(studentId, coreValueId, quarter, behavior, value as CoreValueMarking | '');
        
        setTimeout(() => {
            setSavingCells(prev => {
                const newSet = new Set(prev);
                newSet.delete(cellKey);
                return newSet;
            });
        }, 500);
    };

    // Keyboard navigation handler
    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLSelectElement>,
        studentIdx: number,
        cvIdx: number,
        behaviorIdx: number,
        quarterIdx: number
    ) => {
        if (isReadOnly) return;

        let newStudentIdx = studentIdx;
        let newCvIdx = cvIdx;
        let newBehaviorIdx = behaviorIdx;
        let newQuarterIdx = quarterIdx;

        const currentCv = coreValues[cvIdx];
        const currentBehaviorCount = currentCv?.behaviors?.length || 0;

        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault();
                // Move to next quarter
                if (newQuarterIdx < 3) {
                    newQuarterIdx++;
                } else {
                    // Move to next behavior
                    newQuarterIdx = 0;
                    if (newBehaviorIdx < currentBehaviorCount - 1) {
                        newBehaviorIdx++;
                    } else {
                        // Move to next core value
                        newBehaviorIdx = 0;
                        if (newCvIdx < coreValues.length - 1) {
                            newCvIdx++;
                        }
                    }
                }
                break;

            case 'ArrowLeft':
                e.preventDefault();
                // Move to previous quarter
                if (newQuarterIdx > 0) {
                    newQuarterIdx--;
                } else {
                    // Move to previous behavior
                    newQuarterIdx = 3;
                    if (newBehaviorIdx > 0) {
                        newBehaviorIdx--;
                    } else {
                        // Move to previous core value
                        if (newCvIdx > 0) {
                            newCvIdx--;
                            const prevCv = coreValues[newCvIdx];
                            newBehaviorIdx = (prevCv?.behaviors?.length || 1) - 1;
                        }
                    }
                }
                break;

            case 'ArrowDown':
                e.preventDefault();
                // Move to same cell in next student
                if (newStudentIdx < pagedStudents.length - 1) {
                    newStudentIdx++;
                } else if (page < totalPages) {
                    // Move to next page
                    setPage(p => p + 1);
                    newStudentIdx = 0;
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                // Move to same cell in previous student
                if (newStudentIdx > 0) {
                    newStudentIdx--;
                } else if (page > 1) {
                    // Move to previous page
                    setPage(p => p - 1);
                    newStudentIdx = pageSize - 1;
                }
                break;

            case 'Enter':
                e.preventDefault();
                // Move to next row (same column)
                if (newStudentIdx < pagedStudents.length - 1) {
                    newStudentIdx++;
                } else if (page < totalPages) {
                    setPage(p => p + 1);
                    newStudentIdx = 0;
                }
                break;

            default:
                return; // Don't update focus for other keys
        }

        setFocusedCell({ studentIdx: newStudentIdx, cvIdx: newCvIdx, behaviorIdx: newBehaviorIdx, quarterIdx: newQuarterIdx });

        // Focus the new cell after state update
        setTimeout(() => {
            const cellId = `cell-${newStudentIdx}-${newCvIdx}-${newBehaviorIdx}-${newQuarterIdx}`;
            const element = document.getElementById(cellId);
            if (element) {
                (element as HTMLSelectElement).focus();
            }
        }, 0);
    };

    return (
        <div className="space-y-4">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Core Values Gradebook</h1>
            
            {/* Progress Overview */}
            {filteredStudents.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg shadow-md p-4 border border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h3 className="font-bold text-indigo-800 dark:text-indigo-300 text-sm mb-2">Grading Progress</h3>
                            <div className="flex items-center gap-4 text-sm">
                                <div>
                                    <span className="text-slate-600 dark:text-slate-400">Total Entries: </span>
                                    <span className="font-bold text-slate-900 dark:text-white">{analytics.stats.total}</span>
                                </div>
                                <div>
                                    <span className="text-slate-600 dark:text-slate-400">Graded: </span>
                                    <span className="font-bold text-green-600">{analytics.stats.total - analytics.stats.empty}</span>
                                </div>
                                <div>
                                    <span className="text-slate-600 dark:text-slate-400">Empty: </span>
                                    <span className="font-bold text-red-600">{analytics.stats.empty}</span>
                                </div>
                                <div>
                                    <span className="text-slate-600 dark:text-slate-400">Completion: </span>
                                    <span className="font-bold text-indigo-600">
                                        {analytics.stats.total > 0 ? Math.round(((analytics.stats.total - analytics.stats.empty) / analytics.stats.total) * 100) : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAnalytics(!showAnalytics)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                            {showAnalytics ? 'Hide' : 'Show'} Analytics
                        </button>
                    </div>
                    {showAnalytics && (
                        <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-800">
                            <h4 className="font-semibold text-indigo-800 dark:text-indigo-300 text-sm mb-3">Grade Distribution</h4>
                            <div className="grid grid-cols-4 gap-3">
                                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                                    <div className="text-green-800 dark:text-green-300 font-bold text-lg">{analytics.stats.AO}</div>
                                    <div className="text-green-600 dark:text-green-400 text-xs">Always Observed</div>
                                    <div className="text-green-700 dark:text-green-500 text-xs mt-1">
                                        {analytics.stats.total > 0 ? Math.round((analytics.stats.AO / analytics.stats.total) * 100) : 0}%
                                    </div>
                                </div>
                                <div className="bg-lime-100 dark:bg-lime-900/30 p-3 rounded-lg">
                                    <div className="text-lime-800 dark:text-lime-300 font-bold text-lg">{analytics.stats.SO}</div>
                                    <div className="text-lime-600 dark:text-lime-400 text-xs">Sometimes Observed</div>
                                    <div className="text-lime-700 dark:text-lime-500 text-xs mt-1">
                                        {analytics.stats.total > 0 ? Math.round((analytics.stats.SO / analytics.stats.total) * 100) : 0}%
                                    </div>
                                </div>
                                <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg">
                                    <div className="text-amber-800 dark:text-amber-300 font-bold text-lg">{analytics.stats.RO}</div>
                                    <div className="text-amber-600 dark:text-amber-400 text-xs">Rarely Observed</div>
                                    <div className="text-amber-700 dark:text-amber-500 text-xs mt-1">
                                        {analytics.stats.total > 0 ? Math.round((analytics.stats.RO / analytics.stats.total) * 100) : 0}%
                                    </div>
                                </div>
                                <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                                    <div className="text-red-800 dark:text-red-300 font-bold text-lg">{analytics.stats.NO}</div>
                                    <div className="text-red-600 dark:text-red-400 text-xs">Not Observed</div>
                                    <div className="text-red-700 dark:text-red-500 text-xs mt-1">
                                        {analytics.stats.total > 0 ? Math.round((analytics.stats.NO / analytics.stats.total) * 100) : 0}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {/* Filters and Actions */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Class:</label>
                        <select
                            value={selectedSectionId}
                            onChange={(e) => setSelectedSectionId(e.target.value as any)}
                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white"
                        >
                            <option value="all">All Classes</option>
                            
                            {/* Elementary Section Group */}
                            {groupedSections.elementary.length > 0 && (
                                <optgroup label="📚 ELEMENTARY (Grades 1-6)">
                                    {groupedSections.elementary.map(s => {
                                        const studentCount = sectionStudentCounts.get(s.id) || 0;
                                        const sectionName = s.name.replace(`Grade ${s.gradeLevel} - `, '');
                                        return (
                                            <option key={s.id} value={s.id}>
                                                Grade {s.gradeLevel} {sectionName} ({studentCount} students)
                                            </option>
                                        );
                                    })}
                                </optgroup>
                            )}
                            
                            {/* Junior High Section Group */}
                            {groupedSections.juniorHigh.length > 0 && (
                                <optgroup label="🎓 JUNIOR HIGH (Grades 7-10)">
                                    {groupedSections.juniorHigh.map(s => {
                                        const studentCount = sectionStudentCounts.get(s.id) || 0;
                                        const sectionName = s.name.replace(`Grade ${s.gradeLevel} - `, '');
                                        return (
                                            <option key={s.id} value={s.id}>
                                                Grade {s.gradeLevel} {sectionName} ({studentCount} students)
                                            </option>
                                        );
                                    })}
                                </optgroup>
                            )}
                            
                            {/* Senior High Section Group */}
                            {groupedSections.seniorHigh.length > 0 && (
                                <optgroup label="🏆 SENIOR HIGH (Grades 11-12)">
                                    {groupedSections.seniorHigh.map(s => {
                                        const studentCount = sectionStudentCounts.get(s.id) || 0;
                                        // Extract track from section name (e.g., "Grade 11 - STEM" -> "STEM")
                                        const sectionName = s.name.replace(`Grade ${s.gradeLevel} - `, '');
                                        return (
                                            <option key={s.id} value={s.id}>
                                                Grade {s.gradeLevel} {sectionName} ({studentCount} students)
                                            </option>
                                        );
                                    })}
                                </optgroup>
                            )}
                        </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Quarter:</label>
                        <select
                            value={selectedQuarter}
                            onChange={(e) => setSelectedQuarter(e.target.value as any)}
                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white"
                        >
                            <option value="all">All Quarters</option>
                            <option value="q1">1st Quarter</option>
                            <option value="q2">2nd Quarter</option>
                            <option value="q3">3rd Quarter</option>
                            <option value="q4">4th Quarter</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Filter:</label>
                        <select
                            value={filterByGrade}
                            onChange={(e) => setFilterByGrade(e.target.value as any)}
                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white"
                        >
                            <option value="all">All Grades</option>
                            <option value="empty">Empty Only</option>
                            <option value="AO">AO Only</option>
                            <option value="SO">SO Only</option>
                            <option value="RO">RO Only</option>
                            <option value="NO">NO Only</option>
                        </select>
                    </div>
                    
                    <input
                        type="text"
                        placeholder="Search students by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 max-w-sm px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                    />

                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <input
                            type="checkbox"
                            checked={compactView}
                            onChange={(e) => setCompactView(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Compact View
                    </label>
                </div>

                {/* Bulk Actions - Only for teachers */}
                {!isReadOnly && (
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-3">Bulk Actions</h3>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => copyQuarterGrades('q1', 'q2')}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                                📋 Copy Q1 → Q2
                            </button>
                            <button
                                onClick={() => copyQuarterGrades('q2', 'q3')}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                                📋 Copy Q2 → Q3
                            </button>
                            <button
                                onClick={() => copyQuarterGrades('q3', 'q4')}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                                📋 Copy Q3 → Q4
                            </button>
                            <button
                                onClick={exportToCSV}
                                className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                            >
                                📥 Export to CSV
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Spreadsheet Table */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto" style={{ maxHeight: '70vh' }}>
                    <table className={`min-w-full border-collapse ${compactView ? 'text-[10px]' : 'text-xs'}`}>
                        <thead className="sticky top-0 z-20">
                            {/* Core Values Header Row - One header per behavior */}
                            <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                                <th rowSpan={3} className="sticky left-0 z-30 bg-indigo-700 px-4 py-3 text-left font-bold border-r-2 border-white min-w-[200px]">
                                    NAME OF LEARNER
                                </th>
                                {coreValues.map(cv => {
                                    let bgColor = 'bg-yellow-400';
                                    if (cv.name === 'MAKATAO') bgColor = 'bg-orange-300';
                                    else if (cv.name === 'MAKAKALIKASAN') bgColor = 'bg-pink-300';
                                    else if (cv.name === 'MAKABANSA') bgColor = 'bg-cyan-400';
                                    
                                    // Calculate colspan based on selected quarter
                                    const quarterColspan = selectedQuarter === 'all' ? 4 : 1;
                                    
                                    return (cv.behaviors || []).map((_behavior, idx) => (
                                        <th 
                                            key={`${cv.id}-${idx}`} 
                                            colSpan={quarterColspan}
                                            className={`${bgColor} text-slate-900 px-2 py-2 text-center font-bold border-l border-r border-white text-xs`}
                                        >
                                            {cv.name}
                                        </th>
                                    ));
                                })}
                            </tr>
                            
                            {/* Behaviors Header Row - Full behavior text */}
                            <tr className="bg-slate-100 dark:bg-slate-900">
                                {coreValues.map(cv => {
                                    let bgColor = 'bg-yellow-200';
                                    let textColor = 'text-slate-900';
                                    if (cv.name === 'MAKATAO') { bgColor = 'bg-orange-100'; }
                                    else if (cv.name === 'MAKAKALIKASAN') { bgColor = 'bg-pink-100'; }
                                    else if (cv.name === 'MAKABANSA') { bgColor = 'bg-cyan-200'; }
                                    
                                    // Calculate colspan based on selected quarter
                                    const quarterColspan = selectedQuarter === 'all' ? 4 : 1;
                                    
                                    return (cv.behaviors || []).map((behavior, idx) => (
                                        <th 
                                            key={`${cv.id}-${idx}`} 
                                            colSpan={quarterColspan}
                                            className={`${bgColor} ${textColor} px-2 py-2 text-center text-[9px] font-normal border-l border-slate-300 dark:border-slate-700 max-w-[180px]`}
                                        >
                                            <div className="line-clamp-2 leading-tight">{behavior}</div>
                                        </th>
                                    ));
                                })}
                            </tr>
                            
                            {/* Quarter Headers Row */}
                            <tr className="bg-slate-200 dark:bg-slate-800">
                                {coreValues.map(cv => 
                                    (cv.behaviors || []).map((_behavior, behaviorIdx) => 
                                        (['1st', '2nd', '3rd', '4th'] as const).map((quarter, qIdx) => {
                                            const quarterKey = ['q1', 'q2', 'q3', 'q4'][qIdx] as 'q1' | 'q2' | 'q3' | 'q4';
                                            const shouldShow = selectedQuarter === 'all' || selectedQuarter === quarterKey;
                                            
                                            if (!shouldShow) return null;
                                            
                                            return (
                                                <th 
                                                    key={`${cv.id}-${behaviorIdx}-${quarter}`}
                                                    className={`px-2 text-center font-semibold text-slate-700 dark:text-slate-300 border-l border-slate-300 dark:border-slate-700 min-w-[60px] ${compactView ? 'py-0.5 text-[10px]' : 'py-1 text-xs'}`}
                                                >
                                                    {quarter}
                                                </th>
                                            );
                                        })
                                    )
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {pagedStudents.map((student, studentIdx) => (
                                <tr 
                                    key={student.id}
                                    className={`${studentIdx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'} hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-b border-slate-200 dark:border-slate-700`}
                                >
                                    {/* Student Name - Sticky Column */}
                                    <td className="sticky left-0 z-10 bg-inherit px-4 py-2 font-medium text-slate-900 dark:text-white border-r-2 border-slate-300 dark:border-slate-700">
                                        <div className="flex items-center justify-between gap-2">
                                            <span>{student.name}</span>
                                            {(() => {
                                                const progress = analytics.studentProgress.get(student.id);
                                                if (progress && progress.graded === progress.total && progress.total > 0) {
                                                    return <span className="text-green-500 text-sm" title="All behaviors graded">✓</span>;
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </td>
                                    
                                    {/* Core Value Grades */}
                                    {coreValues.map((cv, cvIdx) => 
                                        (cv.behaviors || []).map((behavior, behaviorIdx) => {
                                            const gradeRecord = gradeMap.get(`${student.id}-${cv.id}`);
                                            
                                            return (['q1', 'q2', 'q3', 'q4'] as const).map((quarter, quarterIdx) => {
                                                // Quarter filter
                                                const shouldShow = selectedQuarter === 'all' || selectedQuarter === quarter;
                                                if (!shouldShow) return null;
                                                
                                                const marking = gradeRecord?.[quarter]?.[behavior];
                                                const cellId = `cell-${studentIdx}-${cvIdx}-${behaviorIdx}-${quarterIdx}`;
                                                const cellKey = `${student.id}-${cv.id}-${quarter}-${behavior}`;
                                                const isSaving = savingCells.has(cellKey);
                                                const isEmpty = !marking;
                                                
                                                // Grade filter
                                                const matchesFilter = filterByGrade === 'all' || 
                                                    (filterByGrade === 'empty' && isEmpty) ||
                                                    (filterByGrade === marking);
                                                
                                                return (
                                                    <td 
                                                        key={`${cv.id}-${behaviorIdx}-${quarter}`}
                                                        className={`p-0.5 border-l border-slate-200 dark:border-slate-700 ${
                                                            isEmpty ? 'bg-red-50 dark:bg-red-900/20' : ''
                                                        } ${
                                                            matchesFilter && filterByGrade !== 'all' ? 'ring-2 ring-inset ring-blue-500' : ''
                                                        } ${
                                                            isSaving ? 'opacity-60' : ''
                                                        }`}
                                                    >
                                                        <div className="relative">
                                                            <select
                                                                id={cellId}
                                                                value={marking ?? ''}
                                                                onChange={(e) => handleMarkingChange(student.id, cv.id, quarter, behavior, e.target.value)}
                                                                onKeyDown={(e) => handleKeyDown(e, studentIdx, cvIdx, behaviorIdx, quarterIdx)}
                                                                disabled={isReadOnly}
                                                                className={`w-full px-1 text-center font-bold border-0 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer ${
                                                                    compactView ? 'py-0.5 text-[10px]' : 'py-1 text-xs'
                                                                } ${getMarkingColor(marking)}`}
                                                            >
                                                                <option value="">-</option>
                                                                {MARKING_OPTIONS.map(opt => (
                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                ))}
                                                            </select>
                                                            {isSaving && (
                                                                <span className="absolute -top-1 -right-1 text-[8px]" title="Saving...">💾</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            });
                                        })
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
                <div className="text-sm text-slate-600 dark:text-slate-300">
                    Showing {(pagedStudents.length === 0 ? 0 : (page - 1) * pageSize + 1)}–{(page - 1) * pageSize + pagedStudents.length} of {filteredStudents.length} students
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </button>
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
                <h3 className="font-bold text-slate-800 dark:text-white mb-3">Marking Guide:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">AO</span>
                        <span className="text-slate-600 dark:text-slate-400">Always Observed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded font-bold bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300">SO</span>
                        <span className="text-slate-600 dark:text-slate-400">Sometimes Observed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">RO</span>
                        <span className="text-slate-600 dark:text-slate-400">Rarely Observed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">NO</span>
                        <span className="text-slate-600 dark:text-slate-400">Not Observed</span>
                    </div>
                </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-lg shadow-md p-4 border border-indigo-200 dark:border-indigo-800">
                <h3 className="font-bold text-indigo-800 dark:text-indigo-300 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Keyboard Shortcuts
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded shadow-sm font-mono text-xs">→</kbd>
                        <span className="text-slate-700 dark:text-slate-300">Next cell</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded shadow-sm font-mono text-xs">←</kbd>
                        <span className="text-slate-700 dark:text-slate-300">Previous cell</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded shadow-sm font-mono text-xs">↓</kbd>
                        <span className="text-slate-700 dark:text-slate-300">Next student</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded shadow-sm font-mono text-xs">↑</kbd>
                        <span className="text-slate-700 dark:text-slate-300">Previous student</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded shadow-sm font-mono text-xs">Enter</kbd>
                        <span className="text-slate-700 dark:text-slate-300">Next student (same column)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded shadow-sm font-mono text-xs">Tab</kbd>
                        <span className="text-slate-700 dark:text-slate-300">Next field</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoreValuesGradebookView;
