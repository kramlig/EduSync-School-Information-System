import React, { useState, useMemo, useCallback } from 'react';
import type { Student, Grade, LearningArea, SubGradeRecord, AuthUser, StudentUser, ParentUser } from '../types';
import { SchoolDataHook } from '../hooks/useSchoolData';
import { generateStudentReport } from '../services/geminiService';
import Modal from './Modal';
import Spinner from './Spinner';
import { ChevronDownIcon, ChevronRightIcon, PrinterIcon } from './icons';
import PrintableReport from './PrintableReport';
import { useDebounce } from '../hooks/useDebounce';

interface GradesViewProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
  forceStudentId?: string; // For parent view
}

const getGradeColor = (gradeValue: number) => {
  if (gradeValue >= 90) return 'text-green-500';
  if (gradeValue >= 80) return 'text-lime-500';
  if (gradeValue >= 70) return 'text-yellow-500';
  if (gradeValue >= 60) return 'text-amber-500';
  return 'text-red-500';
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
  updateGrade: SchoolDataHook['updateGrade'],
  isReadOnly: boolean,
}> = React.memo(({ student, learningAreas, grades, updateGrade, isReadOnly }) => {
  const [mapehModalState, setMapehModalState] = useState<{ isOpen: boolean, quarter?: 'q1'|'q2'|'q3'|'q4', la?: LearningArea }>({ isOpen: false });

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
          {learningAreas.map((la, laIndex) => {
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
                  {currentGrade?.finalGrade !== undefined ? <span className={getGradeColor(currentGrade.finalGrade)}>{currentGrade.finalGrade}</span> : '-'}
                </td>
                <td className="py-2 px-3 text-center">
                  {currentGrade?.remarks && <span className={`px-2 py-1 text-xs font-bold rounded-full ${getRemarksColor(currentGrade.remarks)}`}>{currentGrade.remarks}</span>}
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


const GradesView: React.FC<GradesViewProps> = ({ schoolData, session, forceStudentId }) => {
  const { students, grades, learningAreas, sections, substituteAssignments, classSchedules } = schoolData;
  const isStudentView = session.type === 'student';
  const isParentView = session.type === 'parent';

  const initialStudentId = isStudentView ? session.user.id : (isParentView ? forceStudentId : null);
  const initialExpanded = initialStudentId ? new Set([initialStudentId]) : new Set<string>();

  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(initialExpanded);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [selectedStudentForAction, setSelectedStudentForAction] = useState<Student | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | 'all'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 25;
  
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

  const handlePrintReport = (student: Student) => {
    setSelectedStudentForAction(student);
    setIsPrintModalOpen(true);
  };
  
  const filteredStudents = useMemo(() => {
    const base = (isStudentView || isParentView)
      ? visibleStudents
      : visibleStudents.filter(student =>
          student.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          student.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );
    const bySection = selectedSectionId === 'all' ? base : base.filter(s => s.sectionId === selectedSectionId);
    return bySection;
  }, [visibleStudents, debouncedSearchQuery, isStudentView, isParentView, selectedSectionId]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const pagedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, page]);

  // Reset page when filters change
  React.useEffect(() => { setPage(1); }, [debouncedSearchQuery, selectedSectionId]);
  
  const title = isStudentView ? 'My Grades' : (isParentView ? `Grades for ${filteredStudents[0]?.name}` : 'Manage Grades');

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">{title}</h1>

      {!(isStudentView || isParentView) && (
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
      )}
      
      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead className="bg-slate-100 dark:bg-slate-900">
            <tr>
              <th className="w-12 px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider" aria-label="expand" />
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Student Name</th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedStudents.map((student) => (
              <React.Fragment key={student.id}>
                <tr className={`${!(isStudentView || isParentView) && 'cursor-pointer'} hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700`} onClick={() => toggleStudentExpansion(student.id)}>
                  <td className="pl-4 py-4 text-slate-500">
                    {expandedStudents.has(student.id) ? <ChevronDownIcon /> : <ChevronRightIcon />}
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">
                    {student.name}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <div className="flex items-center space-x-4">
                       <button onClick={(e) => { e.stopPropagation(); handleGenerateReport(student); }} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-semibold text-xs">Generate Report</button>
                       <button onClick={(e) => { e.stopPropagation(); handlePrintReport(student); }} className="flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-semibold text-xs">
                         <PrinterIcon />
                         <span className="ml-1">Print Report</span>
                       </button>
                    </div>
                  </td>
                </tr>
                {expandedStudents.has(student.id) && (
                  <tr>
                    <td colSpan={3} className="p-0">
                      <StudentGradeDetails
                        student={student}
                        learningAreas={learningAreas}
                        grades={grades}
                        updateGrade={schoolData.updateGrade}
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

      {selectedStudentForAction && (
        <Modal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} title={`Printable Report for ${selectedStudentForAction.name}`} size="7xl" printable={true}>
          <PrintableReport student={selectedStudentForAction} schoolData={schoolData} />
        </Modal>
      )}
    </div>
  );
};

export default GradesView;