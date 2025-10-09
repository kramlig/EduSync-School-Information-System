
import React, { useState, useMemo } from 'react';
import type { Student } from '../types';
import { SchoolDataHook } from '../hooks/useSchoolData';
import { generateStudentReport } from '../services/geminiService';
import Modal from './Modal';
import Spinner from './Spinner';

interface GradesViewProps {
  schoolData: SchoolDataHook;
}

const GradesView: React.FC<GradesViewProps> = ({ schoolData }) => {
  const { students, courses, grades, addGrade, getStudentById, getCourseById } = schoolData;
  const [selectedStudent, setSelectedStudent] = useState<string>(students[0]?.id || '');
  const [selectedCourse, setSelectedCourse] = useState<string>(courses[0]?.id || '');
  const [grade, setGrade] = useState<number>(85);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);

  const gradeMap = useMemo(() => {
    const map = new Map<string, number>();
    grades.forEach(g => {
      map.set(`${g.studentId}-${g.courseId}`, g.grade);
    });
    return map;
  }, [grades]);

  const handleAddGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudent && selectedCourse && grade >= 0 && grade <= 100) {
      addGrade({ studentId: selectedStudent, courseId: selectedCourse, grade });
    }
  };

  const handleGenerateReport = async (student: Student) => {
    setSelectedStudentForReport(student);
    setIsReportModalOpen(true);
    setIsGeneratingReport(true);
    const report = await generateStudentReport(student, grades, courses);
    setReportContent(report);
    setIsGeneratingReport(false);
  };
  
  const getGradeColor = (gradeValue: number) => {
    if (gradeValue >= 90) return 'text-green-500';
    if (gradeValue >= 80) return 'text-lime-500';
    if (gradeValue >= 70) return 'text-yellow-500';
    if (gradeValue >= 60) return 'text-amber-500';
    return 'text-red-500';
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Manage Grades</h1>
      
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Add/Update Grade</h2>
        <form onSubmit={handleAddGrade} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student</label>
            <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700">
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Course</label>
            <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700">
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Grade (%)</label>
            <input type="number" value={grade} onChange={e => setGrade(Number(e.target.value))} min="0" max="100" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700" />
          </div>
          <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors h-10">Save Grade</button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider sticky left-0 z-10 bg-slate-100 dark:bg-slate-900">Student Name</th>
              {courses.map(course => (
                <th key={course.id} className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{course.name}</th>
              ))}
              <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50">{student.name}</td>
                {courses.map(course => {
                  const currentGrade = gradeMap.get(`${student.id}-${course.id}`);
                  return (
                    <td key={course.id} className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm text-center">
                      {currentGrade !== undefined ? <span className={`font-bold ${getGradeColor(currentGrade)}`}>{currentGrade}%</span> : <span className="text-slate-400">-</span>}
                    </td>
                  );
                })}
                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                  <button onClick={() => handleGenerateReport(student)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-semibold text-xs">Generate Report</button>
                </td>
              </tr>
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
