import React, { useState, useMemo, useCallback } from 'react';
import type { Student, Grade, LearningArea, AuthUser, StudentUser } from '../types';
import { SchoolDataHook } from '../hooks/useSchoolData';

/**
 * CLEAN, SIMPLE GRADEBOOK - PRODUCTION READY
 * 
 * Key Features:
 * - Controlled inputs (no defaultValue issues)
 * - Debounced saves (500ms delay)
 * - K-12 curriculum filtering
 * - Professional styling
 * - No race conditions
 */

interface GradebookViewProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser; type: 'staff' | 'student' };
}

const GradebookViewNew: React.FC<GradebookViewProps> = ({ schoolData, session }) => {
  const { students, grades, learningAreas, sections, updateGrade } = schoolData;

  // State
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedQuarter, setSelectedQuarter] = useState<'q1' | 'q2' | 'q3' | 'q4'>('q2');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [saveTimeouts, setSaveTimeouts] = useState<Record<string, NodeJS.Timeout>>({});

  // Auto-select first section
  React.useEffect(() => {
    if (!selectedSection && sections.length > 0) {
      setSelectedSection(sections[0].id);
    }
  }, [sections, selectedSection]);

  // Filter students by section
  const sectionStudents = useMemo(() => {
    if (!selectedSection) return [];
    return students
      .filter(s => s.sectionId === selectedSection)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedSection]);

  // Filter by search
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return sectionStudents;
    const term = searchTerm.toLowerCase();
    return sectionStudents.filter(s => 
      s.name.toLowerCase().includes(term) ||
      s.id.toLowerCase().includes(term)
    );
  }, [sectionStudents, searchTerm]);

  // Get section's grade level for K-12 filtering
  const sectionGradeLevel = useMemo(() => {
    const section = sections.find(s => s.id === selectedSection);
    return section?.gradeLevel || 1;
  }, [sections, selectedSection]);

  // Filter learning areas by K-12 curriculum
  const applicableLearningAreas = useMemo(() => {
    return learningAreas
      .filter(la => {
        // If no gradeLevel specified, show for all grades
        if (!la.gradeLevel || la.gradeLevel.length === 0) return true;
        // Otherwise, check if section's grade is in the allowed list
        return la.gradeLevel.includes(sectionGradeLevel);
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [learningAreas, sectionGradeLevel]);

  // Get grade value
  const getGradeValue = useCallback((studentId: string, learningAreaId: string): number | undefined => {
    const grade = grades.find(g => g.studentId === studentId && g.learningAreaId === learningAreaId);
    if (!grade) return undefined;
    const value = grade[selectedQuarter];
    return typeof value === 'number' ? value : undefined;
  }, [grades, selectedQuarter]);

  // Handle grade change with debounce
  const handleGradeChange = useCallback((studentId: string, learningAreaId: string, value: string) => {
    const cellKey = `${studentId}-${learningAreaId}`;
    
    // Update local state immediately for instant feedback
    setLocalValues(prev => ({ ...prev, [cellKey]: value }));

    // Clear existing timeout
    if (saveTimeouts[cellKey]) {
      clearTimeout(saveTimeouts[cellKey]);
    }

    // Set new timeout to save after 500ms of no typing
    const timeout = setTimeout(async () => {
      const numValue = value === '' ? undefined : parseInt(value, 10);
      
      // Validate
      if (numValue !== undefined && (isNaN(numValue) || numValue < 0 || numValue > 100)) {
        console.error('[Gradebook] Invalid grade:', numValue);
        return;
      }

      // Save to backend
      try {
        console.log('[Gradebook] 💾 Saving grade:', { studentId, learningAreaId, quarter: selectedQuarter, value: numValue });
        await updateGrade(studentId, learningAreaId, selectedQuarter, numValue);
        console.log('[Gradebook] ✅ Grade saved successfully');
        
        // Clear local state after successful save
        setLocalValues(prev => {
          const next = { ...prev };
          delete next[cellKey];
          return next;
        });
      } catch (error) {
        console.error('[Gradebook] ❌ Failed to save grade:', error);
        alert('Failed to save grade. Please try again.');
      }
    }, 500);

    setSaveTimeouts(prev => ({ ...prev, [cellKey]: timeout }));
  }, [selectedQuarter, updateGrade, saveTimeouts]);

  // Get current value (local or saved)
  const getCurrentValue = useCallback((studentId: string, learningAreaId: string): string => {
    const cellKey = `${studentId}-${learningAreaId}`;
    if (cellKey in localValues) {
      return localValues[cellKey];
    }
    const savedValue = getGradeValue(studentId, learningAreaId);
    return savedValue !== undefined ? String(savedValue) : '';
  }, [localValues, getGradeValue]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const allGrades = filteredStudents.flatMap(student => 
      applicableLearningAreas.map(la => getGradeValue(student.id, la.id))
    ).filter(g => g !== undefined) as number[];

    const total = allGrades.length;
    const filled = allGrades.filter(g => g > 0).length;
    const avg = filled > 0 ? Math.round(allGrades.reduce((a, b) => a + b, 0) / filled) : 0;
    const passed = allGrades.filter(g => g >= 75).length;

    return {
      total,
      filled,
      completion: total > 0 ? Math.round((filled / total) * 100) : 0,
      average: avg,
      passRate: filled > 0 ? Math.round((passed / filled) * 100) : 0
    };
  }, [filteredStudents, applicableLearningAreas, getGradeValue]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Academic Gradebook</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage student grades efficiently
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Section Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              title="Select section"
              className="w-full px-4 py-2.5 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              {sections.map(section => (
                <option key={section.id} value={section.id}>
                  {section.name} - Grade {section.gradeLevel}
                </option>
              ))}
            </select>
          </div>

          {/* Quarter Tabs */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Quarter
            </label>
            <div className="flex gap-2">
              {(['q1', 'q2', 'q3', 'q4'] as const).map(q => (
                <button
                  key={q}
                  onClick={() => setSelectedQuarter(q)}
                  className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
                    selectedQuarter === q
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {q.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Search Student
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name or ID..."
                className="w-full px-4 py-2.5 pr-10 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {filteredStudents.length}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Students</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {statistics.completion}%
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Complete</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {statistics.average}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Average</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {statistics.passRate}%
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Pass Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {applicableLearningAreas.length}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Subjects</div>
          </div>
        </div>
      </div>

      {/* Gradebook Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <th className="sticky left-0 z-20 px-4 py-4 text-left font-bold bg-gradient-to-r from-indigo-600 to-purple-600 min-w-[200px]">
                  Student Name
                </th>
                {applicableLearningAreas.map(la => (
                  <th key={la.id} className="px-4 py-4 text-center font-bold min-w-[120px] border-l-2 border-white/20">
                    <div className="text-sm">{la.name}</div>
                  </th>
                ))}
                <th className="px-4 py-4 text-center font-bold min-w-[100px] border-l-2 border-white/40">
                  Average
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={applicableLearningAreas.length + 2} className="px-4 py-12 text-center text-slate-500">
                    {searchTerm ? 'No students found matching your search' : 'No students in this section'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, rowIndex) => {
                  const studentGrades = applicableLearningAreas.map(la => 
                    getGradeValue(student.id, la.id)
                  ).filter(g => g !== undefined) as number[];
                  const average = studentGrades.length > 0
                    ? Math.round(studentGrades.reduce((a, b) => a + b, 0) / studentGrades.length)
                    : undefined;

                  return (
                    <tr 
                      key={student.id}
                      className={`border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        rowIndex % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'
                      }`}
                    >
                      <td className="sticky left-0 z-10 px-4 py-3 font-medium text-slate-900 dark:text-white bg-inherit">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div>{student.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{student.id}</div>
                          </div>
                        </div>
                      </td>
                      {applicableLearningAreas.map(la => {
                        const cellKey = `${student.id}-${la.id}`;
                        const currentValue = getCurrentValue(student.id, la.id);
                        const isEmpty = currentValue === '';
                        const isEditing = editingCell === cellKey;
                        const hasLocalChange = cellKey in localValues;

                        return (
                          <td 
                            key={la.id}
                            className={`px-3 py-2 border-l border-slate-200 dark:border-slate-700 ${
                              isEmpty ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''
                            } ${hasLocalChange ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                          >
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={currentValue}
                              onChange={(e) => handleGradeChange(student.id, la.id, e.target.value)}
                              onFocus={() => setEditingCell(cellKey)}
                              onBlur={() => setEditingCell(null)}
                              placeholder="—"
                              className={`
                                w-full px-3 py-2 text-center font-semibold rounded-lg transition-all
                                ${isEmpty 
                                  ? 'border-2 border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200' 
                                  : 'border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100'
                                }
                                ${isEditing ? 'ring-2 ring-indigo-500 border-indigo-500 scale-105' : ''}
                                ${hasLocalChange ? 'border-blue-500 ring-1 ring-blue-300' : ''}
                                focus:outline-none hover:border-indigo-400 dark:hover:border-indigo-500
                                placeholder:text-slate-400
                              `}
                            />
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center border-l-2 border-slate-300 dark:border-slate-600">
                        {average !== undefined ? (
                          <span className={`inline-block px-3 py-1 rounded-full font-bold ${
                            average >= 90 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                            average >= 75 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {average}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        Showing {filteredStudents.length} of {sectionStudents.length} students • {applicableLearningAreas.length} subjects for Grade {sectionGradeLevel}
      </div>
    </div>
  );
};

export default GradebookViewNew;
