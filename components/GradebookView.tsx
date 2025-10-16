import React, { useState, useMemo, useEffect } from 'react';
import type { Student, Grade, LearningArea, SubGradeRecord, AuthUser, StudentUser } from '../types';
import { SchoolDataHook } from '../hooks/useSchoolData';
import Modal from './Modal';
import { useDebounce } from '../hooks/useDebounce';

// Shared utility and sub-component
const calculateQuarterAverage = (grade: number | SubGradeRecord | undefined): number | undefined => {
  if (grade === undefined) return undefined;
  if (typeof grade === 'number') return grade;
  const subGrades = Object.values(grade).filter(g => typeof g === 'number');
  if (subGrades.length === 0) return undefined;
  const total = subGrades.reduce((acc, val) => acc + val, 0);
  return Math.round(total / subGrades.length);
};

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

  useEffect(() => {
    setSubGrades((grades?.[quarter] as SubGradeRecord) || {});
  }, [grades, quarter]);

  const handleSubGradeChange = (subSubject: string, value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    if (numValue !== undefined && (isNaN(numValue) || numValue < 0 || numValue > 100)) return;
    
    const newSubGrades = { ...subGrades, [subSubject]: numValue! };
    if(numValue === undefined) delete newSubGrades[subSubject];
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
              id={`${sub}-grade`} type="number" min="0" max="100"
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


const GradebookView: React.FC<{ schoolData: SchoolDataHook; session: { user: AuthUser | StudentUser, type: 'staff' | 'student' }; }> = ({ schoolData, session }) => {
  const { students, grades, learningAreas, sections, substituteAssignments, classSchedules, updateGrade } = schoolData;
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [quarterFilter, setQuarterFilter] = useState<'all' | 'q1' | 'q2' | 'q3' | 'q4'>('all');
  const [mapehModalState, setMapehModalState] = useState<{ isOpen: boolean, student?: Student, quarter?: 'q1'|'q2'|'q3'|'q4', la?: LearningArea }>({ isOpen: false });
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const authUser = session.user as AuthUser;
  const isReadOnly = authUser.role === 'principal';

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
    if (!selectedSectionId && visibleSections.length > 0) {
      setSelectedSectionId(visibleSections[0].id);
    } else if (selectedSectionId && !visibleSections.some(s => s.id === selectedSectionId)) {
      setSelectedSectionId(visibleSections[0]?.id || null);
    }
  }, [visibleSections, selectedSectionId]);

  const studentsInSection = useMemo(() => {
    if (!selectedSectionId) return [];
    return students.filter(s => 
        s.sectionId === selectedSectionId &&
        s.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [students, selectedSectionId, debouncedSearchQuery]);

  const gradeMap = useMemo(() => {
    const map = new Map<string, Map<string, Grade>>();
    grades.forEach(g => {
        if (!map.has(g.studentId)) map.set(g.studentId, new Map());
        map.get(g.studentId)!.set(g.learningAreaId, g);
    });
    return map;
  }, [grades]);

  const columns = useMemo(() => {
    const cols: { id: string; learningArea: LearningArea; quarter: 'q1' | 'q2' | 'q3' | 'q4' }[] = [];
    const quarters: ('q1' | 'q2' | 'q3' | 'q4')[] = quarterFilter === 'all' 
      ? ['q1', 'q2', 'q3', 'q4'] 
      : [quarterFilter];

    quarters.forEach(q => {
        learningAreas.forEach(la => {
            cols.push({ id: `${la.id}-${q}`, learningArea: la, quarter: q });
        });
    });
    return cols;
  }, [learningAreas, quarterFilter]);

  const handleGradeChange = (studentId: string, laId: string, quarter: 'q1'|'q2'|'q3'|'q4', value: string) => {
      const numValue = value === '' ? undefined : parseInt(value, 10);
      if (numValue !== undefined && (isNaN(numValue) || numValue < 0 || numValue > 100)) return;
      updateGrade(studentId, laId, quarter, numValue);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    const numStudents = studentsInSection.length;
    const numCols = columns.length;

    let moveDirection: 'up' | 'down' | 'left' | 'right' | 'enter' | null = null;
    switch (e.key) {
        case 'Enter': moveDirection = 'enter'; break;
        case 'ArrowDown': moveDirection = 'down'; break;
        case 'ArrowUp': moveDirection = 'up'; break;
        case 'ArrowRight': moveDirection = 'right'; break;
        case 'ArrowLeft': moveDirection = 'left'; break;
        default: return;
    }
    e.preventDefault();

    let nextRow = rowIndex;
    let nextCol = colIndex;

    const move = () => {
        switch (moveDirection) {
            case 'enter':
                nextRow++;
                if (nextRow >= numStudents) {
                    nextRow = 0;
                    nextCol++;
                }
                break;
            case 'down':
                nextRow = Math.min(nextRow + 1, numStudents - 1);
                break;
            case 'up':
                nextRow = Math.max(nextRow - 1, 0);
                break;
            case 'right':
                nextCol++;
                break;
            case 'left':
                nextCol--;
                break;
        }
    };
    
    move();

    while (nextRow >= 0 && nextRow < numStudents && nextCol >= 0 && nextCol < numCols) {
        if (!columns[nextCol].learningArea.isComposite) {
            const nextCellId = `cell-${nextRow}-${nextCol}`;
            const nextInput = document.getElementById(nextCellId);
            if (nextInput) {
                (nextInput as HTMLInputElement).focus();
                (nextInput as HTMLInputElement).select();
            }
            return;
        }
        move();
    }
  };


  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Gradebook</h1>
      
      <div className="mb-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
        <div>
          <label htmlFor="section-select" className="font-semibold mr-2">Select Class:</label>
          <select 
              id="section-select"
              value={selectedSectionId ?? ''} 
              onChange={e => setSelectedSectionId(e.target.value)}
              className="p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
          >
              <option value="" disabled>-- Select a Class --</option>
              {visibleSections.map(s => <option key={s.id} value={s.id}>Grade {s.gradeLevel} - {s.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="quarter-filter" className="font-semibold mr-2">Filter Quarter:</label>
          <select 
              id="quarter-filter"
              value={quarterFilter}
              onChange={e => setQuarterFilter(e.target.value as any)}
              className="p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
          >
            <option value="all">All Quarters</option>
            <option value="q1">Quarter 1</option>
            <option value="q2">Quarter 2</option>
            <option value="q3">Quarter 3</option>
            <option value="q4">Quarter 4</option>
          </select>
        </div>
        <div className="flex-grow">
          <input
            type="text"
            placeholder="Search student in this class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-xs p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
          />
        </div>
      </div>

      {!selectedSectionId && (
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
            <p className="text-slate-600 dark:text-slate-300">Please select a class to view the gradebook.</p>
        </div>
      )}

      {selectedSectionId && (
        <div className="overflow-x-auto shadow-md rounded-lg" style={{ maxHeight: '70vh' }}>
          <table className="min-w-full text-sm text-left text-slate-500 dark:text-slate-400 border-collapse">
      <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-20">
              <tr>
        <th rowSpan={2} scope="col" className="px-4 py-3 sticky left-0 z-30 bg-slate-100 dark:bg-slate-900 min-w-[200px] border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Student Name</th>
        {(quarterFilter === 'all' ? ['q1', 'q2', 'q3', 'q4'] as const : [quarterFilter]).map(q => (
          <th key={q} colSpan={learningAreas.length} className="px-4 py-3 text-center border-b-2 border-l border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{q.toUpperCase()}</th>
                ))}
              </tr>
         <tr>
        {(quarterFilter === 'all' ? ['q1', 'q2', 'q3', 'q4'] as const : [quarterFilter]).flatMap(q => 
          learningAreas.map((la, index) => (
            <th key={`${la.id}-${q}`} scope="col" className={`px-4 py-3 text-center whitespace-nowrap border-b-2 border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider ${index === 0 ? 'border-l' : ''}`}>{la.name}</th>
          ))
        )}
              </tr>
            </thead>
            <tbody>
              {studentsInSection.map((student, rowIndex) => (
                <tr key={student.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-2 font-medium text-slate-900 dark:text-white sticky left-0 z-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 whitespace-nowrap">{student.name}</td>
                  {columns.map((col, colIndex) => {
                    const studentGrades = gradeMap.get(student.id);
                    const currentGrade = studentGrades?.get(col.learningArea.id);
                    const gradeValue = (currentGrade?.[col.quarter] as number) ?? '';
                    
                    if (col.learningArea.isComposite) {
                        const quarterAvg = calculateQuarterAverage(currentGrade?.[col.quarter]);
                        return (
                          <td key={col.id} className="px-2 py-1 text-center border-l dark:border-slate-700">
                            <div className="flex items-center justify-center gap-2">
                                <span className={quarterAvg !== undefined ? 'font-semibold' : 'text-slate-400'}>{quarterAvg ?? '-'}</span>
                                <button onClick={() => setMapehModalState({isOpen: true, student, quarter: col.quarter, la: col.learningArea })} disabled={isReadOnly} className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed">Edit</button>
                            </div>
                          </td>
                        );
                    }
                    return (
                      <td key={col.id} className="p-1 border-l dark:border-slate-700">
                        <input
                          id={`cell-${rowIndex}-${colIndex}`}
                          key={`${student.id}-${col.id}`}
                          type="number" min="0" max="100"
                          defaultValue={gradeValue}
                          onBlur={(e) => handleGradeChange(student.id, col.learningArea.id, col.quarter, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                          disabled={isReadOnly}
                          className="w-20 p-1 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 text-center disabled:bg-slate-100 dark:disabled:bg-slate-700/50"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mapehModalState.isOpen && mapehModalState.la && mapehModalState.student && mapehModalState.quarter && (
        <MapehGradeModal 
          isOpen={mapehModalState.isOpen}
          onClose={() => setMapehModalState({isOpen: false})}
          student={mapehModalState.student}
          learningArea={mapehModalState.la}
          quarter={mapehModalState.quarter}
          grades={gradeMap.get(mapehModalState.student.id)?.get(mapehModalState.la.id)}
          updateGrade={updateGrade}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
};

export default GradebookView;