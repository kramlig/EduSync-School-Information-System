import React, { useState, useMemo } from 'react';
import type { Student, Grade, LearningArea, SubGradeRecord } from '../types';
import { SchoolDataHook } from '../hooks/useSchoolData';
import { generateStudentReport } from '../services/geminiService';
import Modal from './Modal';
import Spinner from './Spinner';
import { ChevronDownIcon, ChevronRightIcon } from './icons';

interface GradesViewProps {
  schoolData: SchoolDataHook;
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
}> = ({ isOpen, onClose, student, learningArea, quarter, grades, updateGrade }) => {
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
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 text-center"
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


// Sub-component for displaying a student's grades
const StudentGradeDetails: React.FC<{
  student: Student,
  learningAreas: LearningArea[],
  grades: Grade[],
  updateGrade: SchoolDataHook['updateGrade'],
}> = ({ student, learningAreas, grades, updateGrade }) => {
  const [mapehModalState, setMapehModalState] = useState<{ isOpen: boolean, quarter?: 'q1'|'q2'|'q3'|'q4', la?: LearningArea }>({ isOpen: false });

  const gradeMap = useMemo(() => {
    const map = new Map<string, Grade>();
    grades.filter(g => g.studentId === student.id).forEach(g => {
      map.set(g.learningAreaId, g);
    });
    return map;
  }, [grades, student.id]);

  const handleGradeChange = (laId: string, quarter: 'q1'|'q2'|'q3'|'q4', value: string) => {
      const numValue = value === '' ? undefined : parseInt(value, 10);
      if (numValue !== undefined && (isNaN(numValue) || numValue < 0 || numValue > 100)) return;
      updateGrade(student.id, laId, quarter, numValue);
  };

  return (
    <div className="overflow-x-auto bg-slate-50 dark:bg-slate-800/50 p-4">
      <table className="min-w-full">
        <thead>
          <tr className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
            <th className="py-2 px-3 text-left">Learning Area</th>
            <th className="py-2 px-3 text-center">Q1</th>
            <th className="py-2 px-3 text-center">Q2</th>
            <th className="py-2 px-3 text-center">Q3</th>
            <th className="py-2 px-3 text-center">Q4</th>
            <th className="py-2 px-3 text-center">Final Grade</th>
            <th className="py-2 px-3 text-center">Remarks</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {learningAreas.map(la => {
            const currentGrade = gradeMap.get(la.id);
            return (
              <tr key={la.id} className="border-b border-slate-200 dark:border-slate-700">
                <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">{la.name}</td>
                {(['q1', 'q2', 'q3', 'q4'] as const).map(q => {
                  if (la.isComposite) {
                    const quarterAvg = calculateQuarterAverage(currentGrade?.[q]);
                    return (
                      <td key={q} className="py-2 px-3 text-center align-middle">
                        <div className="flex items-center justify-center gap-2">
                          <span className={quarterAvg !== undefined ? 'font-semibold' : 'text-slate-400'}>
                            {quarterAvg ?? '-'}
                          </span>
                          <button onClick={() => setMapehModalState({isOpen: true, quarter: q, la: la })} className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold">Edit</button>
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td key={q} className="py-2 px-3">
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={(currentGrade?.[q] as number) ?? ''}
                        onChange={(e) => handleGradeChange(la.id, q, e.target.value)}
                        className="w-full p-1 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 text-center"
                      />
                    </td>
                  );
                })}
                <td className="py-2 px-3 text-center font-bold">
                  {currentGrade?.finalGrade !== undefined ? <span className={getGradeColor(currentGrade.finalGrade)}>{currentGrade.finalGrade}%</span> : '-'}
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
        />
      )}
    </div>
  );
};


const GradesView: React.FC<GradesViewProps> = ({ schoolData }) => {
  const { students, learningAreas, grades, updateGrade } = schoolData;
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);

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

  const handleGenerateReport = async (student: Student) => {
    setSelectedStudentForReport(student);
    setIsReportModalOpen(true);
    setIsGeneratingReport(true);
    const report = await generateStudentReport(student, grades, learningAreas);
    setReportContent(report);
    setIsGeneratingReport(false);
  };
  
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Manage Grades</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search students by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
        />
      </div>
      
      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead className="bg-slate-100 dark:bg-slate-900">
            <tr>
              <th className="w-12"></th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Student Name</th>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <React.Fragment key={student.id}>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-200 dark:border-slate-700" onClick={() => toggleStudentExpansion(student.id)}>
                  <td className="pl-4 py-4 text-slate-500">
                    {expandedStudents.has(student.id) ? <ChevronDownIcon /> : <ChevronRightIcon />}
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">
                    {student.name}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <button onClick={(e) => { e.stopPropagation(); handleGenerateReport(student); }} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-semibold text-xs">Generate Report</button>
                  </td>
                </tr>
                {expandedStudents.has(student.id) && (
                  <tr>
                    <td colSpan={3} className="p-0">
                      <StudentGradeDetails student={student} learningAreas={learningAreas} grades={grades} updateGrade={updateGrade} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title={`Performance Report for ${selectedStudentForReport?.name}`}>
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