import React, { useState, useMemo, useEffect } from 'react';
import type { Student, Grade, LearningArea, SubGradeRecord, AuthUser, StudentUser } from '../types';
import { SchoolDataHook } from '../hooks/useSchoolData';
import Modal from './Modal';
import Toast, { ToastType } from './Toast';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import { useDebounce } from '../hooks/useDebounce';
import { useGradesPostgreSQL } from '../src/hooks/useGradesPostgreSQL';
import { useStudentsPostgreSQL } from '../src/hooks/useStudentsPostgreSQL';
import { useSectionsPostgreSQL } from '../src/hooks/useSectionsPostgreSQL';
import { useLearningAreasPostgreSQL } from '../src/hooks/useLearningAreasPostgreSQL';
import { useSubstituteAssignmentsPostgreSQL } from '../src/hooks/useSubstituteAssignmentsPostgreSQL';
import { useSchedulePostgreSQL } from '../src/hooks/useSchedulePostgreSQL';

// Feature flag for PostgreSQL migration
const USE_POSTGRESQL = import.meta.env.VITE_USE_POSTGRESQL === 'true';

// Helper: Convert gradeLevel string to numeric value (for filtering)
const normalizeGradeLevel = (gradeLevel: string | number): number | null => {
  if (typeof gradeLevel === 'number') return gradeLevel;
  if (gradeLevel === 'Kindergarten') return 0;
  const match = gradeLevel.match(/Grade (\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

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

  // Only sync initial state when modal opens, not on every grade update
  useEffect(() => {
    if (isOpen) {
      setSubGrades((grades?.[quarter] as SubGradeRecord) || {});
    }
  }, [isOpen, quarter]);

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
  };

  const handleSave = () => {
    // Save all component grades as a single composite grade object
    if (Object.keys(subGrades).length > 0) {
      // Pass the entire subGrades object, not individual components
      Object.keys(subGrades).forEach((component, index) => {
        if (index === 0) {
          // First component: create/update the grade document with all subgrades
          updateGrade(student.id, learningArea.id, quarter, subGrades[component], component);
        } else {
          // Subsequent components: just trigger update (the first call should handle it)
          updateGrade(student.id, learningArea.id, quarter, subGrades[component], component);
        }
      });
    }
    onClose();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit MAPEH Grades for ${student.name} (${quarter.toUpperCase()})`}>
      <div className="space-y-4">
        {(learningArea.components || learningArea.subSubjects)?.map(sub => (
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
        <button onClick={handleSave} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Done</button>
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

const GradebookView: React.FC<{ 
  schoolData: SchoolDataHook; 
  session: { user: AuthUser | StudentUser, type: 'staff' | 'student' };
  selectedSectionId?: string;
  onSectionChange?: (sectionId: string) => void;
  selectedQuarter?: 'all' | 'q1' | 'q2' | 'q3' | 'q4';
  onQuarterChange?: (quarter: 'all' | 'q1' | 'q2' | 'q3' | 'q4') => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}> = ({ schoolData, session, selectedSectionId: propSectionId, onSectionChange, selectedQuarter: propQuarter, onQuarterChange, searchQuery: propSearchQuery, onSearchChange }) => {
  const { students: firestoreStudents, grades, learningAreas, sections: firestoreSections, substituteAssignments, classSchedules, updateGrade } = schoolData;
  
  // Compute local section state first (needed for PostgreSQL hooks)
  const [localSectionId, setLocalSectionId] = useState<string | null>(null);
  const [localQuarterFilter, setLocalQuarterFilter] = useState<'all' | 'q1' | 'q2' | 'q3' | 'q4'>(getCurrentQuarter());
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  
  // Determine the actual selectedSectionId early (for PostgreSQL filtering)
  const activeSectionIdForHook = propSectionId !== undefined ? propSectionId : (localSectionId || undefined);
  
  // PostgreSQL data hooks (if enabled via feature flag)
  // Skip fetching grades when no section selected for performance
  const { 
    grades: pgGrades, 
    loading: pgGradesLoading, 
    updateGrade: updatePgGrade 
  } = useGradesPostgreSQL({
    sectionId: activeSectionIdForHook,
    skip: !activeSectionIdForHook || activeSectionIdForHook === 'all' // Don't fetch all grades at once
  });
  
  const {
    students: pgStudents,
    loading: pgStudentsLoading
  } = useStudentsPostgreSQL({
    sectionId: activeSectionIdForHook && activeSectionIdForHook !== 'all' ? activeSectionIdForHook : undefined,
    includeSection: true,
    status: 'enrolled' // Only show enrolled students
  });
  
  const {
    sections: pgSections,
    loading: pgSectionsLoading
  } = useSectionsPostgreSQL({
    includeAdviser: true,
    includeStudentCount: true
  });
  
  const { learningAreas: pgLearningAreas } = useLearningAreasPostgreSQL();
  const { assignments: pgSubstituteAssignments } = useSubstituteAssignmentsPostgreSQL();
  const { schedules: pgClassSchedules } = useSchedulePostgreSQL();
  
  // Use PostgreSQL data if feature flag is enabled, otherwise use Firestore
  const activeGrades = USE_POSTGRESQL ? pgGrades : grades;
  const activeUpdateGrade = USE_POSTGRESQL ? updatePgGrade : updateGrade;
  const activeStudents = USE_POSTGRESQL ? pgStudents : firestoreStudents;
  const activeSections = USE_POSTGRESQL ? pgSections : firestoreSections;
  const activeLearningAreas = USE_POSTGRESQL ? (pgLearningAreas || []) : learningAreas;
  const activeSubstituteAssignments = USE_POSTGRESQL ? (pgSubstituteAssignments || []) : substituteAssignments;
  const activeClassSchedules = USE_POSTGRESQL ? (pgClassSchedules || []) : classSchedules;
  const isLoading = USE_POSTGRESQL 
    ? (pgGradesLoading || pgStudentsLoading || pgSectionsLoading)
    : false;
  
  // CRITICAL FIX: Validate that selectedSectionId exists in activeSections
  // If the stored ID doesn't exist (e.g., after re-seeding database), reset to null
  const validatedLocalSectionId = useMemo(() => {
    if (!localSectionId) return null;
    const sectionExists = activeSections.some(s => s.id === localSectionId);
    if (!sectionExists) {
      console.warn('[GradebookView] ⚠️ Selected section ID not found, resetting to null:', localSectionId);
      return null;
    }
    return localSectionId;
  }, [localSectionId, activeSections]);
  
  const selectedSectionId = propSectionId !== undefined ? propSectionId : validatedLocalSectionId;
  const quarterFilter = propQuarter !== undefined ? propQuarter : localQuarterFilter;
  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : localSearchQuery;
  
  const setSelectedSectionId = onSectionChange || setLocalSectionId;
  const setQuarterFilter = onQuarterChange || setLocalQuarterFilter;
  const setSearchQuery = onSearchChange || setLocalSearchQuery;
  
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  const [mapehModalState, setMapehModalState] = useState<{ isOpen: boolean, student?: Student, quarter?: 'q1'|'q2'|'q3'|'q4', la?: LearningArea }>({ isOpen: false });
  const [showStats, setShowStats] = useState(false);
  
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
  
  // Phase 1: Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const authUser = session.user as AuthUser;
  const isReadOnly = authUser.role === 'principal';
  const teacherId = (authUser as any).postgresqlId || authUser.id;

  // Determine if teacher is the adviser for the currently selected section
  const isAdviserForSection = useMemo(() => {
    if (['admin', 'principal', 'registrar'].includes(authUser.role)) return false;
    if (!selectedSectionId || selectedSectionId === 'all') return false;
    const section = activeSections.find(s => s.id === selectedSectionId);
    return section?.adviserId === teacherId;
  }, [authUser.role, selectedSectionId, activeSections, teacherId]);

  // Get set of learning area IDs this teacher is assigned to for the selected section
  const teacherAssignedLearningAreaIds = useMemo(() => {
    if (['admin', 'principal', 'registrar'].includes(authUser.role)) return null; // null = no restriction
    if (!authUser.assignments || authUser.assignments.length === 0) return null;
    if (!selectedSectionId || selectedSectionId === 'all') return null;
    // Advisers can edit all subjects for their section
    if (isAdviserForSection) return null;
    const ids = new Set<string>();
    authUser.assignments.forEach(a => {
      if (a.sectionId === selectedSectionId && a.learningAreaId) {
        ids.add(a.learningAreaId);
      }
    });
    return ids.size > 0 ? ids : null;
  }, [authUser.role, authUser.assignments, selectedSectionId, isAdviserForSection]);

  const visibleSections = useMemo(() => {
    if (['admin', 'principal', 'registrar'].includes(authUser.role)) return activeSections;

    const authorizedSectionIds = new Set<string>();

    // PRIORITY 1: Check user.assignments (most reliable for teachers)
    if (authUser.assignments && authUser.assignments.length > 0) {
      authUser.assignments.forEach(assignment => {
        if (assignment.sectionId) {
          authorizedSectionIds.add(assignment.sectionId);
        }
      });
    }

    // PRIORITY 2: Check adviser status
    const teacherId = (authUser as any).postgresqlId || authUser.id;
    
    // 1. Sections where the user is the adviser
    const teacherAdviserSections = activeSections.filter(s => s.adviserId === teacherId);
    teacherAdviserSections.forEach(section => {
      authorizedSectionIds.add(section.id);
    });

    // PRIORITY 3: Check substitute assignments
    const today = new Date().toISOString().split('T')[0];
    const activeSubAssignments = activeSubstituteAssignments.filter(sub => 
      sub.teacherId === teacherId && today >= sub.startDate && today <= sub.endDate
    );

    if (activeSubAssignments.length > 0) {
        const originalTeacherIds = activeSubAssignments.map(sub => sub.originalTeacherId);
        activeSections.forEach(s => {
            if (s.adviserId && originalTeacherIds.includes(s.adviserId)) {
                authorizedSectionIds.add(s.id);
            }
        });
        activeClassSchedules.forEach((schedule: any) => {
            if (schedule.teacherId && schedule.sectionId && originalTeacherIds.includes(schedule.teacherId)) {
                authorizedSectionIds.add(schedule.sectionId);
            }
        });
    }

    // PRIORITY 4: Check class schedules (fallback)
    activeClassSchedules.forEach((schedule: any) => {
      if (schedule.teacherId === teacherId && schedule.sectionId) {
        authorizedSectionIds.add(schedule.sectionId);
      }
    });

    return activeSections.filter(s => authorizedSectionIds.has(s.id));
  }, [activeSections, activeSubstituteAssignments, activeClassSchedules, authUser]);

  useEffect(() => {
    // Only auto-select first section if no section is selected AND we're not in "all" mode
    if (!selectedSectionId && visibleSections.length > 0) {
      setSelectedSectionId(visibleSections[0].id);
    }
    // REMOVED: Don't override "all" selection from parent
    // This was causing the bug where switching tabs changed the filter
  }, [visibleSections]);
  
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
    activeGrades.forEach(g => {
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
  }, [activeGrades]);

  // Group sections by level for better UX
  const groupedSections = useMemo(() => {
    const groups = {
      elementary: [] as typeof visibleSections,
      juniorHigh: [] as typeof visibleSections,
      seniorHigh: [] as typeof visibleSections
    };

    visibleSections.forEach(section => {
      if (Number(section.gradeLevel) <= 6) groups.elementary.push(section);
      else if (Number(section.gradeLevel) <= 10) groups.juniorHigh.push(section);
      else groups.seniorHigh.push(section);
    });

    // Sort within each group by grade level
    groups.elementary.sort((a, b) => Number(a.gradeLevel) - Number(b.gradeLevel));
    groups.juniorHigh.sort((a, b) => Number(a.gradeLevel) - Number(b.gradeLevel));
    groups.seniorHigh.sort((a, b) => Number(a.gradeLevel) - Number(b.gradeLevel));

    return groups;
  }, [visibleSections]);

  // Calculate student count per section
  const sectionStudentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    activeStudents.forEach(student => {
      if (student.sectionId) {
        counts.set(student.sectionId, (counts.get(student.sectionId) || 0) + 1);
      }
    });
    return counts;
  }, [activeStudents]);

  // K-12 COMPLIANCE: Filter learning areas by grade level
  const applicableLearningAreas = useMemo(() => {
    const selectedSection = activeSections.find(s => s.id === selectedSectionId);
    if (!selectedSection) {
      return activeLearningAreas;
    }
    
    const sectionGradeLevel = selectedSection.gradeLevel;
    const numericGradeLevel = normalizeGradeLevel(sectionGradeLevel);
    
    // Filter learning areas that are applicable to this grade level
    const filtered = activeLearningAreas.filter(la => {
      // If no gradeLevel metadata, show it (backward compatibility)
      if (!la.gradeLevel || !Array.isArray(la.gradeLevel)) {
        return true;
      }
      
      // Check if this grade level is in the learning area's applicable grades (both numeric now)
      return numericGradeLevel !== null && la.gradeLevel.includes(numericGradeLevel);
    });
    
    // Sort by order field (DepEd-compliant subject ordering)
    return filtered.sort((a, b) => (a.order || 999) - (b.order || 999));
  }, [activeLearningAreas, selectedSectionId, activeSections]);

  const studentsInSection = useMemo(() => {
    // Support "all" sections or null/undefined
    if (!selectedSectionId || selectedSectionId === 'all') {
      // Show all students (no section filter)
      let filtered = activeStudents.filter(s => {
        const name = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim();
        return name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      });
      
      console.log('[GradebookView] Showing ALL sections:', filtered.length, 'students');
      
      // Apply advanced filters (same logic as before)
      if (gradeFilter !== 'all') {
        filtered = filtered.filter(student => {
          const studentGrades = gradeMap.get(student.id);
          if (!studentGrades) return gradeFilter === 'missing';
          
          let hasFailingGrade = false;
          let hasExcellentGrade = false;
          let hasMissingGrade = false;
          
          applicableLearningAreas.forEach(la => {
            const grade = studentGrades.get(la.id);
            ['q1', 'q2', 'q3', 'q4'].forEach(q => {
              const qGrade = calculateQuarterAverage(grade?.[q as 'q1' | 'q2' | 'q3' | 'q4']);
              if (qGrade === undefined) {
                hasMissingGrade = true;
              } else {
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
      
      return filtered;
    }
    
    // Specific section selected
    let filtered = activeStudents.filter(s => {
        const name = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim();
        return s.sectionId === selectedSectionId &&
               name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    });
    
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
        
        applicableLearningAreas.forEach(la => {
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
        const nameA = a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim();
        const nameB = b.name || `${b.firstName || ''} ${b.lastName || ''}`.trim();
        comparison = nameA.localeCompare(nameB);
      } else if (sortBy === 'average') {
        const aGrades = gradeMap.get(a.id);
        const bGrades = gradeMap.get(b.id);
        
        let aSum = 0, aCount = 0, bSum = 0, bCount = 0;
        
        applicableLearningAreas.forEach(la => {
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
        
        applicableLearningAreas.forEach(la => {
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
  }, [activeStudents, selectedSectionId, debouncedSearchQuery, gradeFilter, sortBy, sortOrder, gradeMap, applicableLearningAreas]);

  // Phase 1: Paginated students
  const totalPages = Math.max(1, Math.ceil(studentsInSection.length / pageSize));
  const pagedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return studentsInSection.slice(start, start + pageSize);
  }, [studentsInSection, page, pageSize]);
  
  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, selectedSectionId, gradeFilter, sortBy, sortOrder, pageSize]);

  const columns = useMemo(() => {
    const cols: { id: string; learningArea: LearningArea; quarter: 'q1' | 'q2' | 'q3' | 'q4' }[] = [];
    const quarters: ('q1' | 'q2' | 'q3' | 'q4')[] = quarterFilter === 'all' 
      ? ['q1', 'q2', 'q3', 'q4'] 
      : [quarterFilter];

    quarters.forEach(q => {
        applicableLearningAreas.forEach(la => {
            cols.push({ id: `${la.id}-${q}`, learningArea: la, quarter: q });
        });
    });
    return cols;
  }, [applicableLearningAreas, quarterFilter]);

  // Enhanced grade change with toast notifications
  const handleGradeChange = async (studentId: string, laId: string, quarter: 'q1'|'q2'|'q3'|'q4', value: string) => {
      const numValue = value === '' ? undefined : parseInt(value, 10);
      if (numValue !== undefined && (isNaN(numValue) || numValue < 0 || numValue > 100)) {
        setToast({ message: 'Grade must be between 0 and 100', type: 'error' });
        return;
      }
      
      setIsSaving(true);
      try {
        await activeUpdateGrade(studentId, laId, quarter, numValue);
        setLastSaved(new Date());
        
        // Show success toast but don't spam - only show every 3 seconds
        const now = Date.now();
        const timeSinceLastToast = lastSaved ? now - lastSaved.getTime() : Infinity;
        if (timeSinceLastToast > 3000) {
          setToast({ message: '✓ Grade saved', type: 'success' });
        }
      } catch (error) {
        setToast({ message: `Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`, type: 'error' });
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
      const laId = applicableLearningAreas[0]?.id;
      
      if (!laId) return;
      
      for (const studentId of selectedStudents) {
        await activeUpdateGrade(studentId, laId, quarter, numValue);
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
    const totalPossibleGrades = totalStudents * applicableLearningAreas.length * quartersToCheck.length;
    
    let totalGradesEntered = 0;
    let totalGradeSum = 0;
    let gradeCount = 0;
    let missingGrades: { student: string; subject: string; quarter: string }[] = [];
    
    studentsInSection.forEach(student => {
      const studentGrades = gradeMap.get(student.id);
      applicableLearningAreas.forEach(la => {
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
  }, [selectedSectionId, studentsInSection, applicableLearningAreas, gradeMap, quarterFilter]);

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading gradebook...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Deprecation Warning Banner */}
      <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              This page is deprecated
            </h3>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Please use the <strong>Electronic Class Record (ECR)</strong> for grade entry. ECR follows DepEd Order No. 8, s. 2015 and automatically computes quarterly grades from Written Work, Performance Task, and Quarterly Assessment scores.
            </p>
            <a 
              href="/grades/class-record-selector" 
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 underline"
            >
              Go to Electronic Class Record →
            </a>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Subject restriction notice for teachers */}
      {teacherAssignedLearningAreaIds !== null && (
        <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            You can only edit grades for your assigned subjects. Other subjects are shown as read-only.
          </p>
        </div>
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
          
          {/* PostgreSQL Loading Indicator */}
          {USE_POSTGRESQL && isLoading && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading PostgreSQL...
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
        
        {/* Phase 2: Quarter Tabs (replaces dropdown) */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300 mr-2">Quarter:</span>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setQuarterFilter('all')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                quarterFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All
            </button>
            {(['q1', 'q2', 'q3', 'q4'] as const).map((q) => (
              <button
                key={q}
                onClick={() => setQuarterFilter(q)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  quarterFilter === q
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {q.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-grow">
          <div className="relative">
            <input
              type="text"
              placeholder="Search student in this class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 pr-8 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
            />
            {/* Phase 2: Search clear button */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xl leading-none"
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
          </div>
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
                title="Sort by"
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
        <div className="overflow-x-auto shadow-md rounded-lg max-h-[70vh]">
          <table className="min-w-full text-sm text-left text-slate-500 dark:text-slate-400 border-collapse">
      <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-20">
              <tr>
        {/* Checkbox column for bulk selection */}
        {!isReadOnly && (
          <th rowSpan={2} scope="col" className="px-3 py-3 sticky left-0 z-30 bg-slate-100 dark:bg-slate-900 w-12 border-b-2 border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              aria-label="Select all students on page"
              checked={selectedStudents.size === pagedStudents.length && pagedStudents.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedStudents(new Set(pagedStudents.map(s => s.id)));
                } else {
                  setSelectedStudents(new Set());
                }
              }}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
          </th>
        )}
        <th rowSpan={2} scope="col" className={`px-3 py-2 sticky ${isReadOnly ? 'left-0' : 'left-12'} z-30 bg-slate-100 dark:bg-slate-900 min-w-[200px] border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider`}>Student Name</th>
        {(quarterFilter === 'all' ? ['q1', 'q2', 'q3', 'q4'] as const : [quarterFilter]).map(q => (
          <th key={q} colSpan={applicableLearningAreas.length} className="px-3 py-2 text-center border-b-2 border-l border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{q.toUpperCase()}</th>
                ))}
              </tr>
         <tr>
        {(quarterFilter === 'all' ? ['q1', 'q2', 'q3', 'q4'] as const : [quarterFilter]).flatMap(q => 
          applicableLearningAreas.map((la, index) => (
            <th 
              key={`${la.id}-${q}`} 
              scope="col" 
              className={`
                px-3 py-2 text-center whitespace-nowrap border-b-2 border-slate-200 dark:border-slate-700 
                text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider
                bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900
                min-w-[100px]
                ${index === 0 ? 'border-l-2 border-l-slate-300 dark:border-l-slate-600' : 'border-l border-slate-200 dark:border-slate-700'}
              `}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="font-semibold">{la.name}</span>
                {la.kToTwelveCode && (
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">
                    {la.kToTwelveCode}
                  </span>
                )}
              </div>
            </th>
          ))
        )}
              </tr>
            </thead>
            <tbody>
              {pagedStudents.map((student, rowIndex) => (
                <tr key={student.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  {/* Checkbox cell */}
                  {!isReadOnly && (
                    <td className="px-2 py-2 sticky left-0 z-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <input
                        type="checkbox"
                        title="Select student"
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
                  <td className={`px-3 py-2 font-medium text-slate-900 dark:text-white sticky ${isReadOnly ? 'left-0' : 'left-12'} z-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 whitespace-nowrap`}>{student.name}</td>
                  {columns.map((col, colIndex) => {
                    const studentGrades = gradeMap.get(student.id);
                    const currentGrade = studentGrades?.get(col.learningArea.id);
                    const gradeValue: number | string = (currentGrade?.[col.quarter] as number) ?? '';
                    // Per-cell read-only: principal OR teacher not assigned to this subject
                    const cellReadOnly = isReadOnly || (teacherAssignedLearningAreaIds !== null && !teacherAssignedLearningAreaIds.has(col.learningArea.id));
                    
                    if (col.learningArea.isComposite) {
                        const quarterAvg = calculateQuarterAverage(currentGrade?.[col.quarter]);
                        return (
                          <td key={col.id} className="px-2 py-1.5 text-center border-l-2 border-l-slate-200 dark:border-l-slate-700 bg-slate-50/50 dark:bg-slate-800/50 min-w-[100px]">
                            <div className="flex items-center justify-center gap-2">
                                <span className={`font-bold text-base ${quarterAvg !== undefined ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                                  {quarterAvg ?? '—'}
                                </span>
                                <button 
                                  onClick={() => setMapehModalState({isOpen: true, student, quarter: col.quarter, la: col.learningArea })} 
                                  disabled={cellReadOnly} 
                                  className="px-2 py-1 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-400"
                                >
                                  Edit
                                </button>
                            </div>
                          </td>
                        );
                    }
                    
                    const isEmpty = gradeValue === undefined || gradeValue === '' as any || (typeof gradeValue === 'number' && isNaN(gradeValue));
                    
                    return (
                      <td 
                        key={col.id} 
                        className={`
                          p-1.5 border-l-2 border-l-slate-200 dark:border-l-slate-700 relative min-w-[100px]
                          ${isEmpty 
                            ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10' 
                            : 'bg-white dark:bg-slate-800'
                          }
                        `}
                      >
                        {/* Phase 2: Empty state helper text */}
                        {isEmpty && !cellReadOnly && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Click to enter</span>
                          </div>
                        )}
                        <input
                          id={`cell-${rowIndex}-${colIndex}`}
                          key={`${student.id}-${col.id}-${gradeValue}`}
                          type="number" min="0" max="100"
                          defaultValue={gradeValue}
                          onBlur={(e) => handleGradeChange(student.id, col.learningArea.id, col.quarter, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                          disabled={cellReadOnly}
                          placeholder="—"
                          className={`
                            w-full px-2 py-1.5 border-2 rounded-lg text-center font-bold text-sm transition-all
                            ${isEmpty 
                              ? 'border-amber-300 dark:border-amber-700 bg-transparent text-slate-700 dark:text-slate-200' 
                              : 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100'
                            }
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:scale-105 focus:shadow-lg
                            hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md
                            disabled:bg-slate-100 dark:disabled:bg-slate-700/50 disabled:cursor-not-allowed disabled:opacity-60
                            placeholder:text-slate-400 dark:placeholder:text-slate-500
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

      {/* Phase 1: Pagination Controls */}
      {selectedSectionId && studentsInSection.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{pagedStudents.length}</span> of{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{studentsInSection.length}</span> students
            </span>
            
            <div className="flex items-center gap-2">
              <label htmlFor="page-size-select" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Per page:
              </label>
              <select
                id="page-size-select"
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
                className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-3 py-1 text-sm rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-300">
              Page {page} of {totalPages}
            </span>
            
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
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
          updateGrade={activeUpdateGrade}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
};

export default GradebookView;