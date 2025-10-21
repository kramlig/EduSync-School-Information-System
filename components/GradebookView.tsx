import React, { useState, useMemo, useEffect } from 'react';
import type { Student, Grade, LearningArea, SubGradeRecord, AuthUser, StudentUser } from '../types';
import { SchoolDataHook } from '../hooks/useSchoolData';
import Modal from './Modal';
import Toast, { ToastType } from './Toast';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
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

// Auto-detect current quarter based on Philippine school year calendar
const getCurrentQuarter = (): 'all' | 'q1' | 'q2' | 'q3' | 'q4' => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  
  // Philippine School Year: June - March
  // Q1: June - August (months 6, 7, 8)
  // Q2: September - November (months 9, 10, 11)
  // Q3: December - February (months 12, 1, 2)
  // Q4: March - May (months 3, 4, 5)
  
  if (month >= 6 && month <= 8) return 'q1';
  if (month >= 9 && month <= 11) return 'q2';
  if (month === 12 || month === 1 || month === 2) return 'q3';
  if (month >= 3 && month <= 5) return 'q4';
  
  return 'all'; // fallback
};

const GradebookView: React.FC<{ schoolData: SchoolDataHook; session: { user: AuthUser | StudentUser, type: 'staff' | 'student' }; }> = ({ schoolData, session }) => {
  const { students, grades, learningAreas, sections, substituteAssignments, classSchedules, updateGrade } = schoolData;
  
  // Debug logging to check data
  console.log('[GradebookView] 📊 Data received:', {
    students: students?.length || 0,
    grades: grades?.length || 0,
    learningAreas: learningAreas?.length || 0,
    sections: sections?.length || 0
  });
  
  // Debug: Check first few students and grades
  if (students?.length > 0) {
    console.log('[GradebookView] 📝 ALL student sectionIds:', students.map(s => s.sectionId));
    console.log('[GradebookView] Sample students:', students.slice(0, 5).map(s => ({ id: s.id, name: s.name, sectionId: s.sectionId })));
  }
  if (grades?.length > 0) {
    console.log('[GradebookView] Sample grades:', grades.slice(0, 5).map(g => ({ id: g.id, studentId: g.studentId, learningAreaId: g.learningAreaId })));
  }
  if (sections?.length > 0) {
    console.log('[GradebookView] 📋 ALL section IDs:', sections.map(s => s.id));
    console.log('[GradebookView] Sample sections:', sections.slice(0, 5).map(s => ({ id: s.id, name: s.name })));
  }
  
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [quarterFilter, setQuarterFilter] = useState<'all' | 'q1' | 'q2' | 'q3' | 'q4'>(getCurrentQuarter());
  const [mapehModalState, setMapehModalState] = useState<{ isOpen: boolean, student?: Student, quarter?: 'q1'|'q2'|'q3'|'q4', la?: LearningArea }>({ isOpen: false });
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [showStats, setShowStats] = useState(true);
  
  // Priority 1: Toast notifications
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Priority 2: Advanced filters
  const [gradeFilter, setGradeFilter] = useState<'all' | 'missing' | 'failing' | 'excellent'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'average' | 'completion'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Priority 3: Bulk operations
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [bulkGradeValue, setBulkGradeValue] = useState<string>('');
  
  // Keyboard shortcuts modal
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

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
  
  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+? or F1 to show shortcuts
      if ((e.ctrlKey && e.key === '?') || e.key === 'F1') {
        e.preventDefault();
        setShowShortcutsModal(true);
      }
      // Escape to clear bulk selection
      if (e.key === 'Escape' && selectedStudents.size > 0) {
        setSelectedStudents(new Set());
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStudents]);

  // Move gradeMap before studentsInSection since it's a dependency
  const gradeMap = useMemo(() => {
    const map = new Map<string, Map<string, Grade>>();
    grades.forEach(g => {
        if (!map.has(g.studentId)) map.set(g.studentId, new Map());
        map.get(g.studentId)!.set(g.learningAreaId, g);
    });
    
    // DEBUG: Log gradeMap contents
    console.log('[GradebookView] 🗺️ GradeMap built with', map.size, 'students');
    if (map.size > 0) {
      const firstStudentId = Array.from(map.keys())[0];
      const firstStudentGrades = map.get(firstStudentId);
      console.log('[GradebookView] Sample student grades for', firstStudentId, ':', 
        Array.from(firstStudentGrades?.entries() || []).map(([laId, grade]) => ({
          learningAreaId: laId,
          q1: grade.q1,
          q2: grade.q2,
          q3: grade.q3,
          q4: grade.q4
        }))
      );
    }
    
    return map;
  }, [grades]);

  // Group sections by level for better UX
  const groupedSections = useMemo(() => {
    const groups = {
      elementary: [] as typeof visibleSections,
      juniorHigh: [] as typeof visibleSections,
      seniorHigh: [] as typeof visibleSections
    };

    visibleSections.forEach(section => {
      if (section.gradeLevel <= 6) groups.elementary.push(section);
      else if (section.gradeLevel <= 10) groups.juniorHigh.push(section);
      else groups.seniorHigh.push(section);
    });

    // Sort within each group by grade level
    groups.elementary.sort((a, b) => a.gradeLevel - b.gradeLevel);
    groups.juniorHigh.sort((a, b) => a.gradeLevel - b.gradeLevel);
    groups.seniorHigh.sort((a, b) => a.gradeLevel - b.gradeLevel);

    return groups;
  }, [visibleSections]);

  // Calculate student count per section
  const sectionStudentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    students.forEach(student => {
      if (student.sectionId) {
        counts.set(student.sectionId, (counts.get(student.sectionId) || 0) + 1);
      }
    });
    return counts;
  }, [students]);

  const studentsInSection = useMemo(() => {
    if (!selectedSectionId) return [];
    
    console.log('[GradebookView] 🔍 Filtering students for section:', selectedSectionId);
    console.log('[GradebookView] Total students:', students.length);
    
    let filtered = students.filter(s => 
        s.sectionId === selectedSectionId &&
        s.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
    
    console.log('[GradebookView] Students in selected section:', filtered.length);
    if (filtered.length > 0) {
      console.log('[GradebookView] Sample filtered students:', filtered.slice(0, 3).map(s => ({ id: s.id, name: s.name, sectionId: s.sectionId })));
    }
    
    // Priority 2: Advanced filtering
    if (gradeFilter !== 'all') {
      filtered = filtered.filter(student => {
        const studentGrades = gradeMap.get(student.id);
        if (!studentGrades) return gradeFilter === 'missing';
        
        let hasFailingGrade = false;
        let hasExcellentGrade = false;
        let hasMissingGrade = false;
        let totalGrades = 0;
        let gradeCount = 0;
        
        learningAreas.forEach(la => {
          const grade = studentGrades.get(la.id);
          ['q1', 'q2', 'q3', 'q4'].forEach(q => {
            const qGrade = calculateQuarterAverage(grade?.[q as 'q1' | 'q2' | 'q3' | 'q4']);
            if (qGrade === undefined) {
              hasMissingGrade = true;
            } else {
              totalGrades += qGrade;
              gradeCount++;
              if (qGrade < 75) hasFailingGrade = true;
              if (qGrade >= 90) hasExcellentGrade = true;
            }
          });
        });
        
        switch (gradeFilter) {
          case 'missing': return hasMissingGrade;
          case 'failing': return hasFailingGrade;
          case 'excellent': return hasExcellentGrade;
          default: return true;
        }
      });
    }
    
    // Priority 2: Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'average') {
        const aGrades = gradeMap.get(a.id);
        const bGrades = gradeMap.get(b.id);
        
        let aSum = 0, aCount = 0, bSum = 0, bCount = 0;
        
        learningAreas.forEach(la => {
          const aGrade = aGrades?.get(la.id);
          const bGrade = bGrades?.get(la.id);
          
          ['q1', 'q2', 'q3', 'q4'].forEach(q => {
            const aQ = calculateQuarterAverage(aGrade?.[q as 'q1' | 'q2' | 'q3' | 'q4']);
            const bQ = calculateQuarterAverage(bGrade?.[q as 'q1' | 'q2' | 'q3' | 'q4']);
            if (aQ !== undefined) { aSum += aQ; aCount++; }
            if (bQ !== undefined) { bSum += bQ; bCount++; }
          });
        });
        
        const aAvg = aCount > 0 ? aSum / aCount : 0;
        const bAvg = bCount > 0 ? bSum / bCount : 0;
        comparison = aAvg - bAvg;
      } else if (sortBy === 'completion') {
        const aGrades = gradeMap.get(a.id);
        const bGrades = gradeMap.get(b.id);
        
        let aComplete = 0, bComplete = 0;
        const totalPossible = learningAreas.length * 4;
        
        learningAreas.forEach(la => {
          const aGrade = aGrades?.get(la.id);
          const bGrade = bGrades?.get(la.id);
          
          ['q1', 'q2', 'q3', 'q4'].forEach(q => {
            if (calculateQuarterAverage(aGrade?.[q as 'q1' | 'q2' | 'q3' | 'q4']) !== undefined) aComplete++;
            if (calculateQuarterAverage(bGrade?.[q as 'q1' | 'q2' | 'q3' | 'q4']) !== undefined) bComplete++;
          });
        });
        
        comparison = aComplete - bComplete;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [students, selectedSectionId, debouncedSearchQuery, gradeFilter, sortBy, sortOrder, gradeMap, learningAreas]);

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

  // Enhanced grade change with toast notifications
  const handleGradeChange = async (studentId: string, laId: string, quarter: 'q1'|'q2'|'q3'|'q4', value: string) => {
      const numValue = value === '' ? undefined : parseInt(value, 10);
      if (numValue !== undefined && (isNaN(numValue) || numValue < 0 || numValue > 100)) {
        setToast({ message: 'Grade must be between 0 and 100', type: 'error' });
        return;
      }
      
      setIsSaving(true);
      try {
        await updateGrade(studentId, laId, quarter, numValue);
        setLastSaved(new Date());
        // Don't show toast for every grade change to avoid spam
        // setToast({ message: 'Grade saved successfully', type: 'success' });
      } catch (error) {
        setToast({ message: 'Failed to save grade', type: 'error' });
      } finally {
        setIsSaving(false);
      }
  };
  
  // Bulk grade application
  const handleBulkGradeApply = async () => {
    if (selectedStudents.size === 0 || !bulkGradeValue) {
      setToast({ message: 'Please select students and enter a grade', type: 'error' });
      return;
    }
    
    const numValue = parseInt(bulkGradeValue, 10);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      setToast({ message: 'Grade must be between 0 and 100', type: 'error' });
      return;
    }
    
    setIsSaving(true);
    try {
      // Apply to all selected students for current quarter and first subject
      const quarter = quarterFilter === 'all' ? 'q1' : quarterFilter;
      const laId = learningAreas[0]?.id;
      
      if (!laId) return;
      
      for (const studentId of selectedStudents) {
        await updateGrade(studentId, laId, quarter, numValue);
      }
      
      setToast({ message: `Grade ${numValue} applied to ${selectedStudents.size} students`, type: 'success' });
      setSelectedStudents(new Set());
      setBulkGradeValue('');
    } catch (error) {
      setToast({ message: 'Failed to apply bulk grades', type: 'error' });
    } finally {
      setIsSaving(false);
    }
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


  // Calculate statistics for the selected section
  const statistics = useMemo(() => {
    if (!selectedSectionId) return null;
    
    const totalStudents = studentsInSection.length;
    const quartersToCheck = quarterFilter === 'all' ? ['q1', 'q2', 'q3', 'q4'] : [quarterFilter];
    const totalPossibleGrades = totalStudents * learningAreas.length * quartersToCheck.length;
    
    let totalGradesEntered = 0;
    let totalGradeSum = 0;
    let gradeCount = 0;
    let missingGrades: { student: string; subject: string; quarter: string }[] = [];
    
    studentsInSection.forEach(student => {
      const studentGrades = gradeMap.get(student.id);
      learningAreas.forEach(la => {
        const currentGrade = studentGrades?.get(la.id);
        quartersToCheck.forEach(q => {
          const qGrade = calculateQuarterAverage(currentGrade?.[q as 'q1' | 'q2' | 'q3' | 'q4']);
          if (qGrade !== undefined) {
            totalGradesEntered++;
            totalGradeSum += qGrade;
            gradeCount++;
          } else {
            missingGrades.push({
              student: student.name,
              subject: la.name,
              quarter: q.toUpperCase()
            });
          }
        });
      });
    });
    
    const completionPercentage = totalPossibleGrades > 0 ? (totalGradesEntered / totalPossibleGrades) * 100 : 0;
    const classAverage = gradeCount > 0 ? totalGradeSum / gradeCount : 0;
    
    return {
      totalStudents,
      totalGradesEntered,
      totalPossibleGrades,
      completionPercentage,
      classAverage,
      missingCount: missingGrades.length,
      missingGrades: missingGrades.slice(0, 10), // Show first 10
    };
  }, [selectedSectionId, studentsInSection, learningAreas, gradeMap, quarterFilter]);

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Gradebook</h1>
        
        <div className="flex items-center gap-4">
          {/* Keyboard Shortcuts Help Button */}
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Keyboard Shortcuts (Ctrl+? or F1)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden md:inline">Shortcuts</span>
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-200 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">?</kbd>
          </button>
          
          {/* Save Status Indicator */}
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </div>
          )}
          {!isSaving && lastSaved && (
            <div className="text-sm text-green-600 dark:text-green-400">
              ✓ Saved {new Date(lastSaved).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
      
      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
      
      {/* Statistics Dashboard */}
      {selectedSectionId && statistics && showStats && (
        <div className="mb-4 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-md p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Class Statistics</h2>
            <button
              onClick={() => setShowStats(false)}
              className="text-indigo-100 hover:text-white text-sm font-medium"
            >
              Hide
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Students */}
            <div className="bg-indigo-400/30 rounded-lg p-4">
              <p className="text-indigo-100 text-sm">Total Students</p>
              <p className="text-2xl font-bold mt-1">{statistics.totalStudents}</p>
            </div>
            
            {/* Completion Rate */}
            <div className="bg-indigo-400/30 rounded-lg p-4">
              <p className="text-indigo-100 text-sm">Completion Rate</p>
              <p className="text-2xl font-bold mt-1">{statistics.completionPercentage.toFixed(1)}%</p>
              <div className="mt-2 bg-indigo-300/30 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-white h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, statistics.completionPercentage)}%` }}
                />
              </div>
            </div>
            
            {/* Class Average */}
            <div className="bg-indigo-400/30 rounded-lg p-4">
              <p className="text-indigo-100 text-sm">Class Average</p>
              <p className="text-2xl font-bold mt-1">
                {statistics.classAverage > 0 ? statistics.classAverage.toFixed(1) : '--'}
              </p>
              <p className="text-indigo-100 text-xs mt-1">
                {statistics.classAverage >= 90 ? '🌟 Excellent' : statistics.classAverage >= 80 ? '👍 Good' : statistics.classAverage >= 75 ? '✓ Fair' : statistics.classAverage >= 60 ? '⚠ Passing' : '⚠ Low'}
              </p>
            </div>
            
            {/* Missing Grades */}
            <div className="bg-indigo-400/30 rounded-lg p-4">
              <p className="text-indigo-100 text-sm">Missing Grades</p>
              <p className="text-2xl font-bold mt-1 text-amber-300">{statistics.missingCount}</p>
              <p className="text-indigo-100 text-xs mt-1">
                {statistics.totalGradesEntered} / {statistics.totalPossibleGrades} entered
              </p>
            </div>
          </div>
          
          {/* Missing Grades Details */}
          {statistics.missingCount > 0 && (
            <div className="mt-4 pt-4 border-t border-indigo-400/30">
              <p className="text-sm font-medium text-indigo-100 mb-2">Recent Missing Grades (showing max 10):</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {statistics.missingGrades.map((missing, idx) => (
                  <div key={idx} className="bg-indigo-400/20 rounded px-2 py-1">
                    <span className="font-medium">{missing.student}</span> - {missing.subject} ({missing.quarter})
                  </div>
                ))}
              </div>
              {statistics.missingCount > 10 && (
                <p className="text-xs text-indigo-100 mt-2">...and {statistics.missingCount - 10} more</p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Show Stats Button (when hidden) */}
      {selectedSectionId && !showStats && (
        <div className="mb-4">
          <button
            onClick={() => setShowStats(true)}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Show Class Statistics
          </button>
        </div>
      )}
      
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
      
      {/* Priority 2: Advanced Filters & Sorting */}
      {selectedSectionId && (
        <div className="mb-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {/* Grade Filter Chips */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Filter:</span>
              <button
                onClick={() => setGradeFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  gradeFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                All Students
              </button>
              <button
                onClick={() => setGradeFilter('missing')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  gradeFilter === 'missing'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                Missing Grades
              </button>
              <button
                onClick={() => setGradeFilter('failing')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  gradeFilter === 'failing'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                Below 75
              </button>
              <button
                onClick={() => setGradeFilter('excellent')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  gradeFilter === 'excellent'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                Above 90
              </button>
            </div>
            
            {/* Sort Options */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white"
              >
                <option value="name">Name</option>
                <option value="average">Average</option>
                <option value="completion">Completion</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {sortOrder === 'asc' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Priority 3: Bulk Operations Toolbar */}
      {selectedStudents.size > 0 && !isReadOnly && (
        <div className="mb-4 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-800 p-4 rounded-lg shadow-sm animate-fade-in">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-indigo-900 dark:text-indigo-100">
                {selectedStudents.size} student{selectedStudents.size > 1 ? 's' : ''} selected
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Grade"
                value={bulkGradeValue}
                onChange={(e) => setBulkGradeValue(e.target.value)}
                className="w-20 px-2 py-1 text-sm border border-indigo-300 dark:border-indigo-700 rounded-md dark:bg-slate-700 dark:text-white"
              />
              <button
                onClick={handleBulkGradeApply}
                disabled={isSaving}
                className="px-4 py-1 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Apply to Selected
              </button>
            </div>
            
            <button
              onClick={() => setSelectedStudents(new Set())}
              className="ml-auto text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

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
        {/* Checkbox column for bulk selection */}
        {!isReadOnly && (
          <th rowSpan={2} scope="col" className="px-3 py-3 sticky left-0 z-30 bg-slate-100 dark:bg-slate-900 w-12 border-b-2 border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              checked={selectedStudents.size === studentsInSection.length && studentsInSection.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedStudents(new Set(studentsInSection.map(s => s.id)));
                } else {
                  setSelectedStudents(new Set());
                }
              }}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
          </th>
        )}
        <th rowSpan={2} scope="col" className={`px-4 py-3 sticky ${isReadOnly ? 'left-0' : 'left-12'} z-30 bg-slate-100 dark:bg-slate-900 min-w-[200px] border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider`}>Student Name</th>
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
                  {/* Checkbox cell */}
                  {!isReadOnly && (
                    <td className="px-3 py-2 sticky left-0 z-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedStudents);
                          if (e.target.checked) {
                            newSelected.add(student.id);
                          } else {
                            newSelected.delete(student.id);
                          }
                          setSelectedStudents(newSelected);
                        }}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                    </td>
                  )}
                  <td className={`px-4 py-2 font-medium text-slate-900 dark:text-white sticky ${isReadOnly ? 'left-0' : 'left-12'} z-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 whitespace-nowrap`}>{student.name}</td>
                  {columns.map((col, colIndex) => {
                    const studentGrades = gradeMap.get(student.id);
                    const currentGrade = studentGrades?.get(col.learningArea.id);
                    const gradeValue: number | string = (currentGrade?.[col.quarter] as number) ?? '';
                    
                    // DEBUG: Log first student's first column only to avoid spam
                    if (rowIndex === 0 && colIndex === 0) {
                      console.log('[GradebookView] 🎯 First cell render:', {
                        studentId: student.id,
                        studentName: student.name,
                        learningAreaId: col.learningArea.id,
                        learningAreaName: col.learningArea.name,
                        quarter: col.quarter,
                        currentGrade: currentGrade,
                        gradeValue: gradeValue,
                        hasStudentGrades: !!studentGrades,
                        studentGradesSize: studentGrades?.size
                      });
                    }
                    
                    if (col.learningArea.isComposite) {
                        const quarterAvg = calculateQuarterAverage(currentGrade?.[col.quarter]);
                        return (
                          <td key={col.id} className="px-2 py-1 text-center border-l dark:border-slate-700">
                            <div className="flex items-center justify-center gap-2">
                                <span className={quarterAvg !== undefined ? 'font-semibold' : 'text-slate-400'}>{quarterAvg ?? '-'}</span>
                                <button onClick={() => setMapehModalState({isOpen: true, student, quarter: col.quarter, la: col.learningArea })} disabled={isReadOnly} className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Edit</button>
                            </div>
                          </td>
                        );
                    }
                    
                    const isEmpty = gradeValue === undefined || gradeValue === '';
                    
                    return (
                      <td key={col.id} className={`p-1 border-l dark:border-slate-700 ${isEmpty ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}>
                        <input
                          id={`cell-${rowIndex}-${colIndex}`}
                          key={`${student.id}-${col.id}`}
                          type="number" min="0" max="100"
                          defaultValue={gradeValue}
                          onBlur={(e) => handleGradeChange(student.id, col.learningArea.id, col.quarter, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                          disabled={isReadOnly}
                          placeholder="--"
                          className={`
                            w-24 p-2 border-2 rounded-md text-center font-medium transition-all
                            ${isEmpty 
                              ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20' 
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                            }
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:scale-105
                            hover:border-indigo-400 dark:hover:border-indigo-500
                            disabled:bg-slate-100 dark:disabled:bg-slate-700/50 disabled:cursor-not-allowed disabled:opacity-60
                          `}
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