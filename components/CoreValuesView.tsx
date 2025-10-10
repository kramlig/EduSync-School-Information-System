import React, { useState, useMemo } from 'react';
import type { Student, CoreValue, CoreValueGrade, CoreValueMarking, AuthUser, StudentUser } from '../types';
import { SchoolDataHook } from '../hooks/useSchoolData';
import { ChevronDownIcon, ChevronRightIcon } from './icons';

interface CoreValuesViewProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser, type: 'staff' | 'student' };
}

const MARKING_OPTIONS: { value: CoreValueMarking; label: string }[] = [
  { value: 'AO', label: 'Always Observed' },
  { value: 'SO', label: 'Sometimes Observed' },
  { value: 'RO', label: 'Rarely Observed' },
  { value: 'NO', label: 'Not Observed' },
];

const getMarkingColor = (marking: CoreValueMarking) => {
  switch (marking) {
    case 'AO': return 'text-green-600 dark:text-green-400';
    case 'SO': return 'text-lime-600 dark:text-lime-400';
    case 'RO': return 'text-amber-600 dark:text-amber-400';
    case 'NO': return 'text-red-600 dark:text-red-400';
    default: return 'text-slate-500';
  }
}

// Sub-component for displaying a student's core value grades
const StudentCoreValueDetails: React.FC<{
  student: Student;
  coreValues: CoreValue[];
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

  const totalBehaviors = useMemo(() => coreValues.reduce((sum, cv) => sum + cv.behaviors.length, 0), [coreValues]);
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
              {cv.behaviors.map(behavior => {
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
                              <option key={opt.value} value={opt.value}>{opt.value}</option>
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


const CoreValuesView: React.FC<CoreValuesViewProps> = ({ schoolData, session }) => {
  const { students, coreValues, coreValueGrades, updateCoreValueGrade, sections, substituteAssignments } = schoolData;
  const isStudentView = session.type === 'student';
  const initialExpanded = isStudentView ? new Set([session.user.id]) : new Set<string>();

  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(initialExpanded);
  const [searchQuery, setSearchQuery] = useState('');
  
  const isReadOnly = isStudentView || (session.user as AuthUser).role === 'principal';
  
  const visibleStudents = useMemo(() => {
    if (isStudentView) {
      return students.filter(s => s.id === session.user.id);
    }

    const authUser = session.user as AuthUser;
    if (['admin', 'principal', 'registrar'].includes(authUser.role)) {
      return students;
    }
    
    const teacherAdviserSection = sections.find(s => s.adviserId === authUser.id);
    const today = new Date().toISOString().split('T')[0];
    const activeSubAssignments = substituteAssignments.filter(sub => 
      sub.teacherId === authUser.id &&
      today >= sub.startDate &&
      today <= sub.endDate
    );

    const authorizedSectionIds = new Set<string>();
    if (teacherAdviserSection) {
      authorizedSectionIds.add(teacherAdviserSection.id);
    }
    activeSubAssignments.forEach(sub => authorizedSectionIds.add(sub.sectionId));
    
    if (authorizedSectionIds.size === 0) return [];
    
    return students.filter(s => s.sectionId && authorizedSectionIds.has(s.sectionId));
  }, [students, sections, substituteAssignments, session]);

  const toggleStudentExpansion = (studentId: string) => {
    if (isStudentView) return;
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

  const filteredStudents = isStudentView 
    ? visibleStudents
    : visibleStudents.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">{isStudentView ? 'My Core Values' : 'Evaluate Core Values'}</h1>
      
      {!isStudentView && (
        <div className="mb-4">
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
              <th className="w-12"></th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Student Name</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <React.Fragment key={student.id}>
                <tr className={`${!isStudentView && 'cursor-pointer'} hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700`} onClick={() => toggleStudentExpansion(student.id)}>
                  <td className="pl-4 py-4 text-slate-500">
                    {expandedStudents.has(student.id) ? <ChevronDownIcon /> : <ChevronRightIcon />}
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">
                    {student.name}
                  </td>
                </tr>
                {expandedStudents.has(student.id) && (
                  <tr>
                    <td colSpan={2} className="p-0">
                      <StudentCoreValueDetails student={student} coreValues={coreValues} coreValueGrades={coreValueGrades} updateCoreValueGrade={updateCoreValueGrade} isReadOnly={isReadOnly} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoreValuesView;