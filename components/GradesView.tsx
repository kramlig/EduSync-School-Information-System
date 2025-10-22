import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Student, Grade, LearningArea, SubGradeRecord, AuthUser, StudentUser, ParentUser } from '../types';
import { SchoolDataHook } from '../hooks/useSchoolData';
import { generateStudentReport } from '../services/geminiService';
import Modal from './Modal';
import Spinner from './Spinner';
import { ChevronDownIcon, ChevronRightIcon, PrinterIcon } from './icons';
import { useDebounce } from '../hooks/useDebounce';
import Toast from './Toast';

interface GradesViewProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
  forceStudentId?: string; // For parent view
  // Optional lifted filter props (for controlled mode from UnifiedAssessmentView)
  selectedSectionId?: string;
  onSectionChange?: (id: string) => void;
  performanceFilter?: FilterType;
  onPerformanceChange?: (filter: FilterType) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

type ToastType = 'success' | 'error' | 'info';
type FilterType = 'all' | 'honor' | 'needs-improvement' | 'incomplete';
type SortType = 'name' | 'average' | 'completion';

const getGradeColor = (gradeValue: number) => {
  if (gradeValue >= 90) return 'text-green-500';
  if (gradeValue >= 80) return 'text-lime-500';
  if (gradeValue >= 70) return 'text-yellow-500';
  if (gradeValue >= 60) return 'text-amber-500';
  return 'text-red-500';
};

const getGradeBgColor = (gradeValue: number) => {
  if (gradeValue >= 90) return 'bg-green-500';
  if (gradeValue >= 80) return 'bg-lime-500';
  if (gradeValue >= 70) return 'bg-yellow-500';
  if (gradeValue >= 60) return 'bg-amber-500';
  return 'bg-red-500';
};

const getRemarksColor = (remarks: 'Passed' | 'Failed') => {
  return remarks === 'Passed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
}

const calculateQuarterAverage = (grade: number | SubGradeRecord | undefined): number | undefined => {
  if (grade === undefined) return undefined;
  if (typeof grade === 'number') return grade;
  const subGrades = Object.values(grade).filter(g => typeof g === 'number');
  if (subGrades.length === 0) return undefined;
  const total = subGrades.reduce((acc, val) => acc + val, 0);
  return Math.round(total / subGrades.length);
};

// Priority 1: Visual grade progress bar component
const GradeProgressBar: React.FC<{ grade: number; max?: number }> = ({ grade, max = 100 }) => {
  const percentage = (grade / max) * 100;
  const color = getGradeBgColor(grade);
  
  return (
    <div className="relative w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div 
        className={`absolute left-0 top-0 h-full ${color} transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

// Priority 1: Performance badge component
const PerformanceBadge: React.FC<{ average: number }> = ({ average }) => {
  if (average >= 95) {
    return <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">🏆 With Highest Honors</span>;
  }
  if (average >= 90) {
    return <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">⭐ With High Honors</span>;
  }
  if (average >= 85) {
    return <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">✨ With Honors</span>;
  }
  if (average >= 75) {
    return <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200 rounded-full">✓ Passed</span>;
  }
  return <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">⚠ Needs Attention</span>;
};

// Priority 1: Mini sparkline chart for grade trends
const GradeTrendSparkline: React.FC<{ studentId: string; grades: Grade[]; learningAreas: LearningArea[] }> = ({ studentId, grades }) => {
  const studentGrades = grades.filter(g => g.studentId === studentId);
  if (studentGrades.length === 0) return <span className="text-slate-400 text-xs">No data</span>;
  
  // Calculate average grade for each quarter across all subjects
  const quarterAverages: (number | undefined)[] = ['q1', 'q2', 'q3', 'q4'].map(quarter => {
    const quarterGrades = studentGrades
      .map(g => {
        const gradeValue = g[quarter as keyof Grade];
        if (typeof gradeValue === 'number') return gradeValue;
        if (gradeValue && typeof gradeValue === 'object') {
          // SubGradeRecord - calculate average
          const subGrades = Object.values(gradeValue).filter(sg => typeof sg === 'number') as number[];
          if (subGrades.length === 0) return undefined;
          return Math.round(subGrades.reduce((sum, val) => sum + val, 0) / subGrades.length);
        }
        return undefined;
      })
      .filter(g => g !== undefined) as number[];
    
    if (quarterGrades.length === 0) return undefined;
    return Math.round(quarterGrades.reduce((sum, val) => sum + val, 0) / quarterGrades.length);
  });
  
  const validGrades = quarterAverages.filter(g => g !== undefined) as number[];
  if (validGrades.length === 0) return <span className="text-slate-400 text-xs">No data</span>;
  
  const max = Math.max(...validGrades);
  const min = Math.min(...validGrades);
  const range = max - min || 1;
  
  return (
    <div className="flex items-end gap-0.5 h-6">
      {quarterAverages.map((grade, i) => {
        if (grade === undefined) {
          return <div key={i} className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />;
        }
        const height = ((grade - min) / range) * 100;
        const color = getGradeBgColor(grade);
        return <div key={i} className={`w-1.5 ${color} rounded-t`} style={{ height: `${Math.max(height, 20)}%` }} title={`Q${i+1}: ${grade}%`} />;
      })}
    </div>
  );
};

// Sub-component for MAPEH grade entry modal
const MapehGradeModal: React.FC<{
  isOpen: boolean,
  onClose: () => void,
  student: Student,
  learningArea: LearningArea,
  quarter: 'q1' | 'q2' | 'q3' | 'q4',
  grades: Grade | undefined,
  updateGrade: SchoolDataHook['updateGrade'],
  isReadOnly: boolean,
}> = ({ isOpen, onClose, student, learningArea, quarter, grades, updateGrade, isReadOnly }) => {
  const [subGrades, setSubGrades] = useState<SubGradeRecord>(
    (grades?.[quarter] as SubGradeRecord) || {}
  );

  const handleSubGradeChange = (subSubject: string, value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    if (numValue !== undefined && (isNaN(numValue) || numValue < 0 || numValue > 100)) return;

    const newSubGrades = { ...subGrades };
    if (numValue === undefined) {
      delete newSubGrades[subSubject];
    } else {
      newSubGrades[subSubject] = numValue;
    }
    setSubGrades(newSubGrades);
    updateGrade(student.id, learningArea.id, quarter, numValue, subSubject);
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit MAPEH Grades for ${student.name} (${quarter.toUpperCase()})`}>
      <div className="space-y-4">
        {learningArea.subSubjects?.map(sub => (
          <div key={sub} className="grid grid-cols-2 items-center">
            <label htmlFor={`${sub}-grade`} className="font-medium text-slate-700 dark:text-slate-300">{sub}</label>
            <input
              id={`${sub}-grade`}
              type="number"
              min="0"
              max="100"
              value={subGrades[sub] ?? ''}
              onChange={(e) => handleSubGradeChange(sub, e.target.value)}
              disabled={isReadOnly}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 text-center disabled:bg-slate-100 dark:disabled:bg-slate-700/50"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-6">
        <button onClick={onClose} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Done</button>
      </div>
    </Modal>
  );
};


// Uncontrolled, memoized grade input cell
const GradeCell: React.FC<{
  value: number | '';
  tabIndex?: number;
  disabled?: boolean;
  onCommit: (next: number | undefined) => void;
}> = React.memo(({ value, tabIndex, disabled, onCommit }) => {
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const v = e.target.value;
    const numValue = v === '' ? undefined : parseInt(v, 10);
    if (numValue !== undefined && (isNaN(numValue) || numValue < 0 || numValue > 100)) return;
    onCommit(numValue);
  }, [onCommit]);

  return (
    <input
      type="number"
      min={0}
      max={100}
      defaultValue={value as any}
      onBlur={handleBlur}
      tabIndex={tabIndex}
      disabled={disabled}
      className="w-full p-1 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 text-center disabled:bg-slate-100 dark:disabled:bg-slate-700/50"
    />
  );
});
GradeCell.displayName = 'GradeCell';

// Sub-component for displaying a student's grades (memoized)
const StudentGradeDetails: React.FC<{
  student: Student,
  learningAreas: LearningArea[],
  grades: Grade[],
  sections: any[],
  updateGrade: SchoolDataHook['updateGrade'],
  isReadOnly: boolean,
}> = React.memo(({ student, learningAreas, grades, sections, updateGrade, isReadOnly }) => {
  const [mapehModalState, setMapehModalState] = useState<{ isOpen: boolean, quarter?: 'q1'|'q2'|'q3'|'q4', la?: LearningArea }>({ isOpen: false });

  // Filter learning areas by student's grade level
  const applicableLearningAreas = useMemo(() => {
    const studentSection = sections?.find(s => s.id === student.sectionId);
    const studentGradeLevel = studentSection?.gradeLevel;

    if (!studentGradeLevel) {
      // If we can't determine grade level, show all subjects (fallback)
      return learningAreas;
    }

    return learningAreas.filter(la => {
      // If learning area has no gradeLevel array, include it (legacy subjects or all-grade subjects)
      if (!la.gradeLevel || !Array.isArray(la.gradeLevel)) {
        return true;
      }
      // Only include if student's grade level is in the learning area's applicable grades
      return la.gradeLevel.includes(studentGradeLevel);
    });
  }, [learningAreas, sections, student.sectionId]);

  const gradeMap = useMemo(() => {
    const map = new Map<string, Grade>();
    grades.filter(g => g.studentId === student.id).forEach(g => {
      map.set(g.learningAreaId, g);
    });
    return map;
  }, [grades, student.id]);

  const handleGradeCommit = useCallback((laId: string, quarter: 'q1'|'q2'|'q3'|'q4', numValue: number | undefined) => {
    updateGrade(student.id, laId, quarter, numValue);
  }, [student.id, updateGrade]);

  // Calculate final grade dynamically if not stored in database
  const getFinalGrade = useCallback((grade: Grade | undefined): number | undefined => {
    if (!grade) return undefined;
    
    // If stored finalGrade exists, use it
    if (grade.finalGrade !== undefined) return grade.finalGrade;
    
    // Otherwise calculate it on-the-fly from quarterly grades
    const quarters: ('q1' | 'q2' | 'q3' | 'q4')[] = ['q1', 'q2', 'q3', 'q4'];
    const values: number[] = [];
    
    for (const q of quarters) {
      const v = grade[q];
      if (typeof v === 'number') {
        values.push(v);
      } else if (v && typeof v === 'object') {
        // Handle composite subjects (e.g., MAPEH with sub-subjects)
        const nums = Object.values(v as Record<string, any>).filter(n => typeof n === 'number') as number[];
        if (nums.length) {
          values.push(Math.round(nums.reduce((a, b) => a + b, 0) / nums.length));
        }
      }
    }
    
    if (!values.length) return undefined;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, []);

  // Calculate remarks based on final grade
  const getRemarks = useCallback((finalGrade: number | undefined): 'Passed' | 'Failed' | undefined => {
    if (finalGrade === undefined) return undefined;
    return finalGrade >= 75 ? 'Passed' : 'Failed';
  }, []);

  return (
    <div className="overflow-x-auto bg-white dark:bg-slate-800 p-4 rounded-lg shadow-inner">
      <table className="min-w-full leading-normal">
        <thead className="bg-slate-100 dark:bg-slate-900">
          <tr>
            <th className="py-3 px-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Learning Area</th>
            <th className="py-3 px-3 border-b-2 border-slate-200 dark:border-slate-700 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Q1</th>
            <th className="py-3 px-3 border-b-2 border-slate-200 dark:border-slate-700 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Q2</th>
            <th className="py-3 px-3 border-b-2 border-slate-200 dark:border-slate-700 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Q3</th>
            <th className="py-3 px-3 border-b-2 border-slate-200 dark:border-slate-700 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Q4</th>
            <th className="py-3 px-3 border-b-2 border-slate-200 dark:border-slate-700 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Final Grade</th>
            <th className="py-3 px-3 border-b-2 border-slate-200 dark:border-slate-700 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Remarks</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {applicableLearningAreas.map((la, laIndex) => {
            const currentGrade = gradeMap.get(la.id);
            return (
              <tr key={la.id} className="border-b border-slate-200 dark:border-slate-700">
                <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">{la.name}</td>
                {(['q1', 'q2', 'q3', 'q4'] as const).map((q, qIndex) => {
                  if (la.isComposite) {
                    const quarterAvg = calculateQuarterAverage(currentGrade?.[q]);
                    return (
                      <td key={q} className="py-2 px-3 text-center align-middle">
                        <div className="flex items-center justify-center gap-2">
                          <span className={quarterAvg !== undefined ? 'font-semibold' : 'text-slate-400'}>
                            {quarterAvg ?? '-'}
                          </span>
                          <button onClick={() => setMapehModalState({isOpen: true, quarter: q, la: la })} disabled={isReadOnly} className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed">Edit</button>
                        </div>
                      </td>
                    );
                  }
                  const rawVal = currentGrade?.[q] as number | undefined;
                  const value = rawVal ?? '';
                  return (
                    <td key={q} className="py-2 px-3">
                      <GradeCell
                        key={`${student.id}-${la.id}-${q}-${rawVal ?? ''}`}
                        value={value as any}
                        tabIndex={(qIndex * learningAreas.length) + laIndex + 1}
                        disabled={isReadOnly}
                        onCommit={(num) => handleGradeCommit(la.id, q, num)}
                      />
                    </td>
                  );
                })}
                <td className="py-2 px-3 text-center font-bold">
                  {(() => {
                    const finalGrade = getFinalGrade(currentGrade);
                    return finalGrade !== undefined ? (
                      <span className={getGradeColor(finalGrade)}>{finalGrade}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    );
                  })()}
                </td>
                <td className="py-2 px-3 text-center">
                  {(() => {
                    const finalGrade = getFinalGrade(currentGrade);
                    const remarks = currentGrade?.remarks || getRemarks(finalGrade);
                    return remarks ? (
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${getRemarksColor(remarks)}`}>
                        {remarks}
                      </span>
                    ) : null;
                  })()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {mapehModalState.isOpen && mapehModalState.la && mapehModalState.quarter && (
        <MapehGradeModal 
          isOpen={mapehModalState.isOpen}
          onClose={() => setMapehModalState({isOpen: false})}
          student={student}
          learningArea={mapehModalState.la}
          quarter={mapehModalState.quarter}
          grades={gradeMap.get(mapehModalState.la.id)}
          updateGrade={updateGrade}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
});
StudentGradeDetails.displayName = 'StudentGradeDetails';


const GradesView: React.FC<GradesViewProps> = ({ 
  schoolData, 
  session, 
  forceStudentId,
  selectedSectionId: externalSectionId,
  onSectionChange,
  performanceFilter: externalPerformanceFilter,
  onPerformanceChange,
  searchQuery: externalSearchQuery,
  onSearchChange
}) => {
  const { students, grades, learningAreas, sections, substituteAssignments, classSchedules } = schoolData;
  const isStudentView = session.type === 'student';
  const isParentView = session.type === 'parent';

  const initialStudentId = isStudentView ? session.user.id : (isParentView ? forceStudentId : null);
  const initialExpanded = initialStudentId ? new Set([initialStudentId]) : new Set<string>();

  // Determine if this component is in controlled mode (receiving filter props from parent)
  const isControlled = externalSectionId !== undefined;

  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(initialExpanded);
  
  // Internal state (used when NOT controlled)
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [internalSelectedSectionId, setInternalSelectedSectionId] = useState<string | 'all'>('all');
  const [internalPerformanceFilter, setInternalPerformanceFilter] = useState<FilterType>('all');
  
  // Use external props if controlled, otherwise use internal state
  const searchQuery = isControlled ? (externalSearchQuery || '') : internalSearchQuery;
  const setSearchQuery = isControlled && onSearchChange ? onSearchChange : setInternalSearchQuery;
  const selectedSectionId = isControlled ? (externalSectionId || 'all') : internalSelectedSectionId;
  const setSelectedSectionId = isControlled && onSectionChange ? onSectionChange : setInternalSelectedSectionId;
  const performanceFilter = isControlled ? (externalPerformanceFilter || 'all') : internalPerformanceFilter;
  const setPerformanceFilter = isControlled && onPerformanceChange ? onPerformanceChange : setInternalPerformanceFilter;
  
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [selectedStudentForAction, setSelectedStudentForAction] = useState<Student | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  
  // Priority 2: Advanced filtering and sorting
  const [sortBy, setSortBy] = useState<SortType>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Priority 3: Bulk selection
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Priority 1 & 4: Toast notifications
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  
  const isReadOnly = isStudentView || isParentView || (session.user as AuthUser).role === 'principal';

  const visibleStudents = useMemo(() => {
    if (isStudentView) return students.filter(s => s.id === session.user.id);
    if (isParentView) return students.filter(s => s.id === forceStudentId);

    const authUser = session.user as AuthUser;
    if (['admin', 'principal', 'registrar'].includes(authUser.role)) return students;
    
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

    if (authorizedSectionIds.size === 0) return [];
    const scoped = students.filter(s => s.sectionId && authorizedSectionIds.has(s.sectionId));
    return scoped;
  }, [students, sections, substituteAssignments, classSchedules, session, forceStudentId]);

  const visibleSections = useMemo(() => {
    // Derive the sections that current user can access from visibleStudents
    const ids = new Set<string>();
    visibleStudents.forEach(s => { if (s.sectionId) ids.add(s.sectionId); });
    return sections.filter(sec => ids.has(sec.id));
  }, [visibleStudents, sections]);

  const toggleStudentExpansion = (studentId: string) => {
    if (isStudentView || isParentView) return;
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

  const handleGenerateReport = async (student: Student) => {
    setSelectedStudentForAction(student);
    setIsReportModalOpen(true);
    setIsGeneratingReport(true);
    const report = await generateStudentReport(student, grades, learningAreas);
    setReportContent(report);
    setIsGeneratingReport(false);
  };
  
  // Helper: Calculate student's overall average and completion rate
  const calculateStudentStats = useCallback((student: Student) => {
    const studentGrades = grades.filter(g => g.studentId === student.id);
    if (studentGrades.length === 0) return { average: 0, completion: 0, hasIncomplete: true };
    
    // Get student's grade level to filter applicable subjects
    const studentSection = sections?.find(s => s.id === student.sectionId);
    const studentGradeLevel = studentSection?.gradeLevel;
    
    // Filter learning areas by student's grade level (same logic as display)
    const applicableLearningAreas = learningAreas.filter(la => {
      if (!studentGradeLevel || !la.gradeLevel || !Array.isArray(la.gradeLevel)) {
        return true; // Fallback: include all if grade level data is missing
      }
      return la.gradeLevel.includes(studentGradeLevel);
    });
    
    let totalGrades = 0;
    let gradeCount = 0;
    let totalQuarters = applicableLearningAreas.length * 4; // Use filtered list
    let completedQuarters = 0;
    
    applicableLearningAreas.forEach(la => { // Use filtered list
      const grade = studentGrades.find(g => g.learningAreaId === la.id);
      (['q1', 'q2', 'q3', 'q4'] as const).forEach(q => {
        const qGrade = calculateQuarterAverage(grade?.[q]);
        if (qGrade !== undefined) {
          totalGrades += qGrade;
          gradeCount++;
          completedQuarters++;
        }
      });
    });
    
    const average = gradeCount > 0 ? Math.round(totalGrades / gradeCount) : 0;
    const completion = totalQuarters > 0 ? Math.round((completedQuarters / totalQuarters) * 100) : 0;
    const hasIncomplete = completion < 100;
    
    return { average, completion, hasIncomplete };
  }, [grades, learningAreas, sections]);
  
  const filteredStudents = useMemo(() => {
    let base = (isStudentView || isParentView)
      ? visibleStudents
      : visibleStudents.filter(student =>
          student.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          student.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );
    
    // Filter by section
    const bySection = selectedSectionId === 'all' ? base : base.filter(s => s.sectionId === selectedSectionId);
    
    // Priority 2: Performance filter
    let filtered = bySection;
    if (performanceFilter !== 'all') {
      filtered = bySection.filter(student => {
        const stats = calculateStudentStats(student);
        switch (performanceFilter) {
          case 'honor':
            return stats.average >= 90;
          case 'needs-improvement':
            return stats.average < 75 && stats.average > 0;
          case 'incomplete':
            return stats.hasIncomplete;
          default:
            return true;
        }
      });
    }
    
    // Priority 2: Sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'average') {
        const statsA = calculateStudentStats(a);
        const statsB = calculateStudentStats(b);
        comparison = statsA.average - statsB.average;
      } else if (sortBy === 'completion') {
        const statsA = calculateStudentStats(a);
        const statsB = calculateStudentStats(b);
        comparison = statsA.completion - statsB.completion;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [visibleStudents, debouncedSearchQuery, isStudentView, isParentView, selectedSectionId, performanceFilter, sortBy, sortOrder, calculateStudentStats]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const pagedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, page]);

  // Reset page when filters change
  React.useEffect(() => { setPage(1); }, [debouncedSearchQuery, selectedSectionId, performanceFilter, sortBy]);
  
  // Priority 1: Calculate class statistics
  const classStats = useMemo(() => {
    const allStats = filteredStudents.map(s => calculateStudentStats(s));
    const withGrades = allStats.filter(s => s.average > 0);
    
    return {
      total: filteredStudents.length,
      honors: allStats.filter(s => s.average >= 90).length,
      passed: allStats.filter(s => s.average >= 75 && s.average < 90).length,
      needsImprovement: allStats.filter(s => s.average < 75 && s.average > 0).length,
      incomplete: allStats.filter(s => s.hasIncomplete).length,
      avgGrade: withGrades.length > 0 ? Math.round(withGrades.reduce((sum, s) => sum + s.average, 0) / withGrades.length) : 0,
      avgCompletion: allStats.length > 0 ? Math.round(allStats.reduce((sum, s) => sum + s.completion, 0) / allStats.length) : 0,
    };
  }, [filteredStudents, calculateStudentStats]);
  
  // Priority 3: Bulk actions handlers
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };
  
  const toggleSelectAll = () => {
    if (selectedStudentIds.size === pagedStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(pagedStudents.map(s => s.id)));
    }
  };
  
  const handleBulkPrint = () => {
    setToast({ message: `Preparing to print ${selectedStudentIds.size} reports...`, type: 'info' });
    
    // Get selected students
    const selectedStudents = filteredStudents.filter(s => selectedStudentIds.has(s.id));
    
    // Create a printable view with all selected student reports
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setToast({ message: 'Please allow popups to print reports', type: 'error' });
      return;
    }
    
    // Build HTML with proper DepEd Form 138 format
    let printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Grade Reports - Bulk Print</title>
        <style>
          @page { size: landscape; margin: 0.5in; }
          @media print {
            .page-break { page-break-before: always; break-before: page; }
            body { margin: 0; padding: 0; }
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Times New Roman', serif; font-size: 10px; line-height: 1.3; background: white; }
          .report-page { width: 100%; max-width: 11in; min-height: 8.5in; padding: 0.5in; margin: 0 auto; background: white; }
          .header { text-align: center; margin-bottom: 15px; }
          .header-grid { display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px; }
          .header-left { font-size: 9px; text-align: left; width: 20%; }
          .header-center { text-align: center; width: 50%; font-size: 10px; }
          .header-center .school-name { font-weight: bold; font-size: 11px; margin-top: 4px; }
          .header-right { width: 25%; text-align: right; }
          .student-info { margin: 15px 0; }
          .info-row { display: flex; margin-bottom: 5px; align-items: baseline; }
          .info-label { font-weight: bold; margin-right: 5px; }
          .info-value { flex: 1; border-bottom: 1px solid black; text-align: center; font-weight: 600; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          
          table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9px; }
          th, td { border: 1px solid black; padding: 4px; text-align: center; }
          th { background-color: #f0f0f0; font-weight: bold; }
          td.text-left { text-align: left; padding-left: 6px; }
          td.grade-cell { font-weight: 600; }
          .section-title { font-weight: bold; text-align: center; font-size: 10px; margin: 15px 0 8px; }
          .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; text-align: center; }
          .signature-line { border-bottom: 1px solid black; margin: 20px auto 5px; width: 80%; font-weight: bold; padding-top: 2px; }
          .remarks { font-size: 9px; margin-top: 10px; padding: 8px; background: #f9f9f9; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
    `;
    
    selectedStudents.forEach((student, index) => {
      const studentGrades = grades.filter(g => g.studentId === student.id);
      const section = sections.find(s => s.id === student.sectionId);
      const adviser = schoolData.teachers.find(t => t.id === section?.adviserId);
      const principal = schoolData.teachers.find(t => t.role === 'principal');
      const stats = calculateStudentStats(student);
      
      // Calculate age
      const age = student.dateOfBirth ? (() => {
        const birthDate = new Date(student.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
      })() : '';
      
      printContent += `
        ${index > 0 ? '<div class="page-break"></div>' : ''}
        <div class="report-page">
          <!-- Header Section -->
          <div class="header-grid">
            <div class="header-left">DepEd FORM 138</div>
            <div class="header-center">
              <div>Republic of the Philippines</div>
              <div>Department of Education</div>
              <div>${schoolData.settings.region || 'Region'}</div>
              <div>${schoolData.settings.division || 'Division'}</div>
              <div>${schoolData.settings.district || 'District'}</div>
              <div class="school-name">${schoolData.settings.schoolName || 'School Name'}</div>
            </div>
            <div class="header-right">
              ${student.photoURL ? 
                `<img src="${student.photoURL}" style="width: 80px; height: 80px; border: 2px solid #ccc; border-radius: 4px; object-fit: cover;" />` : 
                '<div style="width: 80px; height: 80px; border: 2px solid #ccc; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 36px; color: #999;">👤</div>'
              }
            </div>
          </div>
          
          <!-- Student Information -->
          <div class="student-info">
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value">${student.name}</span>
            </div>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Age:</span>
                <span class="info-value">${age}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Sex:</span>
                <span class="info-value">${student.sex || 'N/A'}</span>
              </div>
            </div>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Grade:</span>
                <span class="info-value">${section?.gradeLevel || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Section:</span>
                <span class="info-value">${section?.name || 'N/A'}</span>
              </div>
            </div>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">School Year:</span>
                <span class="info-value">${schoolData.settings.schoolYear || new Date().getFullYear()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">LRN:</span>
                <span class="info-value">${student.lrn || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <!-- Grades Table -->
          <div class="section-title">REPORT ON LEARNING PROGRESS AND ACHIEVEMENT</div>
          <table>
            <thead>
              <tr>
                <th rowspan="2" style="width: 35%;">Learning Areas</th>
                <th colspan="4">Quarter</th>
                <th rowspan="2">Final Grade</th>
                <th rowspan="2">Remarks</th>
              </tr>
              <tr>
                <th>1</th>
                <th>2</th>
                <th>3</th>
                <th>4</th>
              </tr>
            </thead>
            <tbody>
              ${learningAreas.map(la => {
                const grade = studentGrades.find(g => g.learningAreaId === la.id);
                const q1 = calculateQuarterAverage(grade?.q1);
                const q2 = calculateQuarterAverage(grade?.q2);
                const q3 = calculateQuarterAverage(grade?.q3);
                const q4 = calculateQuarterAverage(grade?.q4);
                const final = grade?.finalGrade || (q1 && q2 && q3 && q4 ? Math.round((Number(q1) + Number(q2) + Number(q3) + Number(q4)) / 4) : '');
                const remarks = final ? (Number(final) >= 75 ? 'Passed' : 'Failed') : 'Incomplete';
                
                return `
                  <tr>
                    <td class="text-left">${la.name}</td>
                    <td class="grade-cell">${q1 || '-'}</td>
                    <td class="grade-cell">${q2 || '-'}</td>
                    <td class="grade-cell">${q3 || '-'}</td>
                    <td class="grade-cell">${q4 || '-'}</td>
                    <td class="grade-cell" style="background: #e8f4f8;">${final || '-'}</td>
                    <td><strong>${remarks}</strong></td>
                  </tr>
                `;
              }).join('')}
              <tr style="background: #f0f0f0;">
                <td class="text-left"><strong>General Average</strong></td>
                <td colspan="5"></td>
                <td class="grade-cell"><strong>${stats.average > 0 ? stats.average : '-'}</strong></td>
              </tr>
            </tbody>
          </table>
          
          <!-- Dear Parent Note -->
          <div class="remarks">
            <p style="font-weight: bold; margin-bottom: 5px;">Dear Parent:</p>
            <p style="text-align: justify; text-indent: 20px;">
              This report card shows the ability and progress your child has made in the different learning areas. 
              Overall Average: <strong>${stats.average}%</strong> | Completion: <strong>${stats.completion}%</strong>
            </p>
          </div>
          
          <!-- Signatures -->
          <div class="signature-section">
            <div>
              <div class="signature-line">${principal?.name || ''}</div>
              <div>School Principal</div>
            </div>
            <div>
              <div class="signature-line">${adviser?.name || ''}</div>
              <div>Class Adviser</div>
            </div>
          </div>
        </div>
      `;
    });
    
    printContent += `
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    setTimeout(() => {
      printWindow.print();
      setToast({ message: `${selectedStudentIds.size} reports ready to print!`, type: 'success' });
      setSelectedStudentIds(new Set());
      setShowBulkActions(false);
    }, 500);
  };
  
  const handleBulkReports = async () => {
    setToast({ message: `Generating ${selectedStudentIds.size} AI reports...`, type: 'info' });
    
    try {
      const selectedStudents = filteredStudents.filter(s => selectedStudentIds.has(s.id));
      let successCount = 0;
      
      // Generate reports sequentially to avoid rate limits
      for (const student of selectedStudents) {
        try {
          await handleGenerateReport(student);
          successCount++;
        } catch (error) {
          console.error(`Failed to generate report for ${student.name}:`, error);
        }
      }
      
      if (successCount === selectedStudentIds.size) {
        setToast({ message: `Successfully generated ${successCount} reports!`, type: 'success' });
      } else {
        setToast({ message: `Generated ${successCount}/${selectedStudentIds.size} reports (some failed)`, type: 'error' });
      }
      setSelectedStudentIds(new Set());
      setShowBulkActions(false);
    } catch (error) {
      setToast({ message: 'Failed to generate bulk reports', type: 'error' });
    }
  };
  
  // Priority 4: Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only for admin/teacher view with bulk actions enabled
      if (isStudentView || isParentView || !showBulkActions) return;
      
      // Ctrl/Cmd + A: Select all visible students
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        toggleSelectAll();
      }
      
      // Escape: Clear selection
      if (e.key === 'Escape' && selectedStudentIds.size > 0) {
        setSelectedStudentIds(new Set());
      }
      
      // Ctrl/Cmd + P: Bulk print
      if ((e.ctrlKey || e.metaKey) && e.key === 'p' && selectedStudentIds.size > 0) {
        e.preventDefault();
        handleBulkPrint();
      }
      
      // Ctrl/Cmd + R: Bulk generate reports
      if ((e.ctrlKey || e.metaKey) && e.key === 'r' && selectedStudentIds.size > 0) {
        e.preventDefault();
        handleBulkReports();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showBulkActions, selectedStudentIds, isStudentView, isParentView, toggleSelectAll, handleBulkPrint, handleBulkReports]);
  
  const title = isStudentView ? 'My Grades' : (isParentView ? `Grades for ${filteredStudents[0]?.name}` : 'Manage Grades');

  return (
    <div>
      {/* Priority 1 & 4: Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">{title}</h1>

      {/* Priority 2 & 3: Enhanced Filters and Controls (only show when not controlled) */}
      {!(isStudentView || isParentView) && !isControlled && (
        <div className="mb-4 space-y-4">
          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Filter:</span>
            <button
              onClick={() => setPerformanceFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                performanceFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              All ({filteredStudents.length})
            </button>
            <button
              onClick={() => setPerformanceFilter('honor')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                performanceFilter === 'honor'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              🏆 Honor Roll ({classStats.honors})
            </button>
            <button
              onClick={() => setPerformanceFilter('needs-improvement')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                performanceFilter === 'needs-improvement'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              ⚠️ Needs Attention ({classStats.needsImprovement})
            </button>
            <button
              onClick={() => setPerformanceFilter('incomplete')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                performanceFilter === 'incomplete'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              📝 Incomplete ({classStats.incomplete})
            </button>
          </div>

          {/* Section, Search, and Sort Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Class:</label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
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
              className="flex-1 min-w-[250px] px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
            />

            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="name">Name</option>
                <option value="average">Average Grade</option>
                <option value="completion">Completion</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-white transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            {/* Priority 3: Bulk Selection Toggle */}
            <button
              onClick={() => {
                setShowBulkActions(!showBulkActions);
                if (showBulkActions) setSelectedStudentIds(new Set());
              }}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                showBulkActions
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              {showBulkActions ? '✓ Bulk Mode' : 'Bulk Actions'}
            </button>
          </div>

          {/* Priority 3: Bulk Action Toolbar */}
          {showBulkActions && selectedStudentIds.size > 0 && (
            <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-indigo-900 dark:text-indigo-100">
                  {selectedStudentIds.size} student{selectedStudentIds.size !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedStudentIds(new Set())}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 font-medium"
                >
                  Clear
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkReports}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  Generate Reports
                </button>
                <button
                  onClick={handleBulkPrint}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md font-medium transition-colors flex items-center gap-2"
                >
                  <PrinterIcon />
                  Print All
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead className="bg-slate-100 dark:bg-slate-900">
            <tr>
              {/* Priority 3: Bulk Selection Checkbox */}
              {showBulkActions && !(isStudentView || isParentView) && (
                <th className="w-12 px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.size === pagedStudents.length && pagedStudents.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 cursor-pointer"
                  />
                </th>
              )}
              <th className="w-12 px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider" aria-label="expand" />
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Student Name</th>
              {/* Priority 1: Performance Column */}
              {!(isStudentView || isParentView) && (
                <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Performance</th>
              )}
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedStudents.map((student) => {
              const stats = calculateStudentStats(student);
              return (
                <React.Fragment key={student.id}>
                  <tr className={`${!(isStudentView || isParentView) && 'cursor-pointer'} hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700`} onClick={() => toggleStudentExpansion(student.id)}>
                    {/* Priority 3: Student Checkbox */}
                    {showBulkActions && !(isStudentView || isParentView) && (
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.has(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                          className="w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="pl-4 py-4 text-slate-500">
                      {expandedStudents.has(student.id) ? <ChevronDownIcon /> : <ChevronRightIcon />}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">
                      {student.name}
                    </td>
                    {/* Priority 1: Performance Indicators */}
                    {!(isStudentView || isParentView) && (
                      <td className="px-5 py-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <PerformanceBadge average={stats.average} />
                            <span className="text-slate-600 dark:text-slate-400 font-medium">
                              {stats.average > 0 ? `${stats.average}%` : 'No grades'}
                            </span>
                          </div>
                          {stats.average > 0 && (
                            <>
                              <div className="space-y-1">
                                <GradeProgressBar grade={stats.completion} max={100} />
                                <span className="text-xs text-slate-500 dark:text-slate-400">{stats.completion}% complete</span>
                              </div>
                              <GradeTrendSparkline studentId={student.id} grades={grades} learningAreas={learningAreas} />
                            </>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-5 py-4 text-sm">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleGenerateReport(student); 
                        }} 
                        className="flex items-center gap-1.5 px-3 py-1.5 text-indigo-600 dark:text-indigo-400 hover:text-white hover:bg-indigo-600 dark:hover:bg-indigo-500 border border-indigo-600 dark:border-indigo-400 rounded-md font-medium text-xs transition-colors"
                      >
                        <span>🤖</span>
                        <span>Generate AI Report</span>
                      </button>
                    </td>
                  </tr>
                  {expandedStudents.has(student.id) && (
                    <tr>
                      <td colSpan={showBulkActions && !(isStudentView || isParentView) ? 5 : 4} className="p-0">
                        <StudentGradeDetails
                          student={student}
                          learningAreas={learningAreas}
                          grades={grades}
                          sections={sections}
                          updateGrade={schoolData.updateGrade}
                          isReadOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!(isStudentView || isParentView) && (
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
      )}

      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title={`Performance Report for ${selectedStudentForAction?.name}`}>
        {isGeneratingReport ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Spinner />
            <p className="mt-4 text-slate-600 dark:text-slate-300">Generating AI report...</p>
          </div>
        ) : (
          <div>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{reportContent}</p>
            <div className="flex justify-end mt-6">
              <button onClick={() => setIsReportModalOpen(false)} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GradesView;