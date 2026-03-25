import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { CoreValueGrade, CoreValueMarking, AuthUser, StudentUser } from '../types';
import { SchoolDataHook } from '../hooks/useSchoolData';
import { useDebounce } from '../hooks/useDebounce';
import { useStudentsPostgreSQL } from '../src/hooks/useStudentsPostgreSQL';
import { useCoreValuesPostgreSQL } from '../src/hooks/useCoreValuesPostgreSQL';
import { useSectionsPostgreSQL } from '../src/hooks/useSectionsPostgreSQL';
import { useSubstituteAssignmentsPostgreSQL } from '../src/hooks/useSubstituteAssignmentsPostgreSQL';
import { useSchedulePostgreSQL } from '../src/hooks/useSchedulePostgreSQL';

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
    const authUser = session.user as AuthUser;
    const schoolId = authUser.schoolId || '';
    
    // Load real data from PostgreSQL
    const { students: pgStudents } = useStudentsPostgreSQL({ schoolId });
    const { coreValues: pgCoreValues, coreValueGrades: pgCoreValueGrades, updateCoreValueGrade } = useCoreValuesPostgreSQL(true, schoolId);
    // Load sections without school year filter to get all sections with students
    const { sections: pgSections } = useSectionsPostgreSQL({ schoolId });
    const { assignments: pgSubstituteAssignments } = useSubstituteAssignmentsPostgreSQL({ schoolId });
    const { schedules: pgClassSchedules } = useSchedulePostgreSQL({ schoolId });
    
    const students = pgStudents || [];
    const coreValues = pgCoreValues || [];
    const coreValueGrades = pgCoreValueGrades || [];
    const sections = pgSections || [];
    const substituteAssignments = pgSubstituteAssignments || [];
    const classSchedules = pgClassSchedules || [];
    
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
    
    const isReadOnly = authUser.role === 'principal';
    const teacherId = (authUser as any).postgresqlId || authUser.id;

    // Adviser gating: only adviser (or admin-like roles) can edit core values for a section
    const canEditCoreValues = useMemo(() => {
      if (['admin', 'principal', 'registrar', 'superadmin'].includes(authUser.role)) {
        // Principal is read-only by isReadOnly, admin/registrar/superadmin can edit
        return !isReadOnly;
      }
      if (!selectedSectionId || selectedSectionId === 'all') return false;
      const section = sections.find(s => s.id === selectedSectionId);
      return section?.adviserId === teacherId;
    }, [authUser.role, isReadOnly, selectedSectionId, sections, teacherId]);

    const effectiveReadOnly = isReadOnly || !canEditCoreValues;
    const [page, setPage] = useState(1);
    const pageSize = 25;

    // New state for enhancements
    const [savingCells, setSavingCells] = useState<Set<string>>(new Set());
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [compactView, setCompactView] = useState(false);
    const [filterByGrade, setFilterByGrade] = useState<CoreValueMarking | 'all' | 'empty'>('all');
    
    // Quick Fill state
    const [quickFillMode, setQuickFillMode] = useState(false);
    const [selectedQuickGrade, setSelectedQuickGrade] = useState<CoreValueMarking>('SO');
    const [showQuickFillPanel, setShowQuickFillPanel] = useState(false);
    
    // CSV Import state
    const [showImportModal, setShowImportModal] = useState(false);
    const [importData, setImportData] = useState<{ headers: string[]; rows: string[][] } | null>(null);
    const [importProgress, setImportProgress] = useState<{ current: number; total: number; status: string } | null>(null);
    const [importErrors, setImportErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Keyboard navigation state (focusedCell tracked for keyboard shortcuts)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [focusedCell, setFocusedCell] = useState<{ studentIdx: number; cvIdx: number; behaviorIdx: number; quarterIdx: number } | null>(null);

    const visibleSections = useMemo(() => {
        if (['admin', 'principal', 'registrar'].includes(authUser.role)) return sections;

        const authorizedSectionIds = new Set<string>();
        const teacherId = (authUser as any).postgresqlId || authUser.id;

        const teacherAdviserSections = sections.filter(s => s.adviserId === teacherId);
        teacherAdviserSections.forEach(section => {
          authorizedSectionIds.add(section.id);
        });

        const today = new Date().toISOString().split('T')[0];
        const activeSubAssignments = substituteAssignments.filter(sub => 
          sub.teacherId === teacherId && today >= sub.startDate && today <= sub.endDate
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
          if (schedule.teacherId === teacherId && schedule.sectionId) {
            authorizedSectionIds.add(schedule.sectionId);
          }
        });

        return sections.filter(s => authorizedSectionIds.has(s.id));
    }, [sections, substituteAssignments, classSchedules, authUser]);

    // Auto-select the first section that has students
    useEffect(() => {
        if (selectedSectionId === 'all' && visibleSections.length > 0 && students.length > 0) {
            // Find sections with students
            const sectionsWithStudents = visibleSections.filter(section => 
                students.some(s => s.sectionId === section.id)
            );
            
            if (sectionsWithStudents.length > 0) {
                // Sort by grade level and pick the first one
                const sorted = [...sectionsWithStudents].sort((a, b) => 
                    normalizeGradeLevel(a.gradeLevel) - normalizeGradeLevel(b.gradeLevel)
                );
                setSelectedSectionId(sorted[0].id);
            } else if (visibleSections.length > 0) {
                // Fallback to first visible section if none have students
                setSelectedSectionId(visibleSections[0].id);
            }
        }
    }, [visibleSections, selectedSectionId, students]);
    
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
    // Only include sections that have enrolled students (active sections)
    const groupedSections = useMemo(() => {
        const groups = {
            elementary: [] as typeof visibleSections,
            juniorHigh: [] as typeof visibleSections,
            seniorHigh: [] as typeof visibleSections
        };
        
        // Calculate student counts first
        const studentCountsMap = new Map<string, number>();
        students.forEach(student => {
            if (student.sectionId) {
                studentCountsMap.set(student.sectionId, (studentCountsMap.get(student.sectionId) || 0) + 1);
            }
        });
        
        // Only include sections that have students (filter out empty/inactive sections)
        const activeSections = visibleSections.filter(section => {
            const studentCount = studentCountsMap.get(section.id) || 0;
            return studentCount > 0;
        });
        
        activeSections.forEach(section => {
            const numericGradeLevel = normalizeGradeLevel(section.gradeLevel);
            if (numericGradeLevel <= 6) {
                groups.elementary.push(section);
            } else if (numericGradeLevel <= 10) {
                groups.juniorHigh.push(section);
            } else {
                groups.seniorHigh.push(section);
            }
        });
        
        // Sort each group by grade level, then by section name
        const sortFn = (a: typeof visibleSections[0], b: typeof visibleSections[0]) => {
            const gradeDiff = normalizeGradeLevel(a.gradeLevel) - normalizeGradeLevel(b.gradeLevel);
            if (gradeDiff !== 0) return gradeDiff;
            return a.name.localeCompare(b.name);
        };
        
        groups.elementary.sort(sortFn);
        groups.juniorHigh.sort(sortFn);
        groups.seniorHigh.sort(sortFn);
        
        return groups;
    }, [visibleSections, students]);

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
        if (effectiveReadOnly) return;
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
        if (effectiveReadOnly) return;
        if (!confirm(`Apply "${grade}" to all ${filteredStudents.length} students for this behavior in ${quarter.toUpperCase()}?`)) return;

        for (const student of filteredStudents) {
            await updateCoreValueGrade(student.id, coreValueId, quarter, behavior, grade);
        }
        alert(`Applied "${grade}" to all students!`);
    };

    // Quick Fill: Apply selected grade to ALL empty cells for current quarter
    const quickFillAllEmpty = async (grade: CoreValueMarking) => {
        if (effectiveReadOnly) return;
        const targetQuarter = selectedQuarter === 'all' ? getCurrentQuarter() : selectedQuarter;
        
        let count = 0;
        for (const student of filteredStudents) {
            for (const cv of coreValues) {
                const gradeRecord = gradeMap.get(`${student.id}-${cv.id}`);
                for (const behavior of (cv.behaviors || [])) {
                    const existing = gradeRecord?.[targetQuarter]?.[behavior];
                    if (!existing) {
                        count++;
                    }
                }
            }
        }
        
        if (count === 0) {
            alert('All cells already have grades!');
            return;
        }
        
        if (!confirm(`Fill ${count} empty cells with "${grade}" for ${targetQuarter.toUpperCase()}?`)) return;
        
        for (const student of filteredStudents) {
            for (const cv of coreValues) {
                const gradeRecord = gradeMap.get(`${student.id}-${cv.id}`);
                for (const behavior of (cv.behaviors || [])) {
                    const existing = gradeRecord?.[targetQuarter]?.[behavior];
                    if (!existing) {
                        await updateCoreValueGrade(student.id, cv.id, targetQuarter, behavior, grade);
                    }
                }
            }
        }
        alert(`Filled ${count} empty cells with "${grade}"!`);
    };

    // Quick Fill: Apply grade to entire column (all students, one behavior, one quarter)
    const quickFillColumn = async (coreValueId: string, behavior: string, quarter: 'q1' | 'q2' | 'q3' | 'q4', grade: CoreValueMarking) => {
        if (effectiveReadOnly) return;
        if (!confirm(`Set all ${filteredStudents.length} students to "${grade}" for this behavior?`)) return;
        
        for (const student of filteredStudents) {
            await updateCoreValueGrade(student.id, coreValueId, quarter, behavior, grade);
        }
    };

    // Fill Down: Copy grade from first student to all below (for a specific column)
    const fillDown = async (coreValueId: string, behavior: string, quarter: 'q1' | 'q2' | 'q3' | 'q4') => {
        if (effectiveReadOnly || filteredStudents.length < 2) return;
        
        const firstStudent = filteredStudents[0];
        const gradeRecord = gradeMap.get(`${firstStudent.id}-${coreValueId}`);
        const sourceGrade = gradeRecord?.[quarter]?.[behavior];
        
        if (!sourceGrade) {
            alert('First student has no grade to copy!');
            return;
        }
        
        if (!confirm(`Copy "${sourceGrade}" from ${firstStudent.name} to all ${filteredStudents.length - 1} students below?`)) return;
        
        for (let i = 1; i < filteredStudents.length; i++) {
            await updateCoreValueGrade(filteredStudents[i].id, coreValueId, quarter, behavior, sourceGrade);
        }
        alert(`Filled down "${sourceGrade}" to ${filteredStudents.length - 1} students!`);
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

    // Download CSV Template for import
    const downloadTemplate = () => {
        const headers = ['Student Name', 'LRN'];
        coreValues.forEach(cv => {
            (cv.behaviors || []).forEach((behavior, idx) => {
                ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
                    // Shorter header: CV Code - Behavior# - Quarter
                    headers.push(`${cv.code || cv.name}-B${idx + 1}-${q}`);
                });
            });
        });

        // Add current students as template rows
        const rows = [headers.join(',')];
        filteredStudents.forEach(student => {
            const row = [`"${student.name}"`, student.lrn || ''];
            coreValues.forEach(cv => {
                (cv.behaviors || []).forEach(() => {
                    ['Q1', 'Q2', 'Q3', 'Q4'].forEach(() => {
                        row.push(''); // Empty cells for grades
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
        a.download = `core-values-template-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Parse CSV file
    const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length === 0) return { headers: [], rows: [] };
        
        // Parse CSV properly handling quoted fields
        const parseLine = (line: string): string[] => {
            const result: string[] = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result;
        };
        
        const headers = parseLine(lines[0]);
        const rows = lines.slice(1).map(line => parseLine(line));
        
        return { headers, rows };
    };

    // Handle file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const parsed = parseCSV(text);
            setImportData(parsed);
            setImportErrors([]);
            setShowImportModal(true);
        };
        reader.readAsText(file);
        
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Build column mapping from headers
    const buildColumnMapping = (headers: string[]) => {
        const mapping: { colIndex: number; coreValueId: string; behaviorIndex: number; quarter: 'q1' | 'q2' | 'q3' | 'q4' }[] = [];
        
        headers.forEach((header, colIndex) => {
            if (colIndex < 2) return; // Skip Student Name and LRN columns
            
            // Try to parse header format: CV_CODE-B#-Q# or full format
            const shortMatch = header.match(/^(\w+)-B(\d+)-(Q[1-4])$/i);
            const quarterMatch = header.match(/(Q[1-4])$/i);
            
            if (shortMatch) {
                const [, cvCode, behaviorNum, quarter] = shortMatch;
                const cv = coreValues.find(c => 
                    c.code?.toUpperCase() === cvCode.toUpperCase() || 
                    c.name.toUpperCase() === cvCode.toUpperCase()
                );
                if (cv) {
                    mapping.push({
                        colIndex,
                        coreValueId: cv.id,
                        behaviorIndex: parseInt(behaviorNum) - 1,
                        quarter: quarter.toLowerCase() as 'q1' | 'q2' | 'q3' | 'q4'
                    });
                }
            } else if (quarterMatch) {
                // Try to match full format: "CV Name - Behavior... - Q#"
                const parts = header.split(' - ');
                if (parts.length >= 3) {
                    const cvName = parts[0].trim();
                    const quarter = parts[parts.length - 1].trim().toLowerCase() as 'q1' | 'q2' | 'q3' | 'q4';
                    const cv = coreValues.find(c => 
                        c.name.toUpperCase().includes(cvName.toUpperCase()) ||
                        cvName.toUpperCase().includes(c.name.toUpperCase())
                    );
                    if (cv) {
                        // Find behavior index based on position in headers
                        const cvHeaders = headers.filter(h => h.includes(cv.name) || h.includes(cv.code || ''));
                        const behaviorIndex = Math.floor(cvHeaders.indexOf(header) / 4);
                        mapping.push({
                            colIndex,
                            coreValueId: cv.id,
                            behaviorIndex: Math.max(0, behaviorIndex),
                            quarter
                        });
                    }
                }
            }
        });
        
        return mapping;
    };

    // Import grades from CSV
    const importGrades = async () => {
        if (!importData) return;
        
        const { headers, rows } = importData;
        const mapping = buildColumnMapping(headers);
        const errors: string[] = [];
        let successCount = 0;
        let skipCount = 0;
        
        setImportProgress({ current: 0, total: rows.length, status: 'Starting import...' });
        
        for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
            const row = rows[rowIdx];
            const studentName = row[0]?.trim();
            const lrn = row[1]?.trim();
            
            setImportProgress({ 
                current: rowIdx + 1, 
                total: rows.length, 
                status: `Processing: ${studentName}` 
            });
            
            // Find student by name or LRN
            const student = filteredStudents.find(s => {
                if (lrn && s.lrn === lrn) return true;
                const normalizedName = s.name?.toLowerCase().replace(/\s+/g, ' ').trim();
                const inputName = studentName?.toLowerCase().replace(/\s+/g, ' ').trim();
                return normalizedName === inputName || 
                       normalizedName?.includes(inputName) || 
                       inputName?.includes(normalizedName || '');
            });
            
            if (!student) {
                errors.push(`Row ${rowIdx + 2}: Student "${studentName}" not found`);
                continue;
            }
            
            // Process each mapped column
            for (const col of mapping) {
                const value = row[col.colIndex]?.trim().toUpperCase();
                
                // Skip empty values
                if (!value) {
                    skipCount++;
                    continue;
                }
                
                // Validate grade value
                if (!['AO', 'SO', 'RO', 'NO'].includes(value)) {
                    errors.push(`Row ${rowIdx + 2}, Col ${col.colIndex + 1}: Invalid grade "${value}" (must be AO/SO/RO/NO)`);
                    continue;
                }
                
                // Get the behavior name
                const cv = coreValues.find(c => c.id === col.coreValueId);
                const behavior = cv?.behaviors?.[col.behaviorIndex];
                
                if (!behavior) {
                    errors.push(`Row ${rowIdx + 2}: Behavior index ${col.behaviorIndex} not found for ${cv?.name}`);
                    continue;
                }
                
                try {
                    await updateCoreValueGrade(
                        student.id, 
                        col.coreValueId, 
                        col.quarter, 
                        behavior, 
                        value as CoreValueMarking
                    );
                    successCount++;
                } catch (err) {
                    errors.push(`Row ${rowIdx + 2}: Failed to save grade for ${student.name}`);
                }
            }
            
            // Small delay to prevent overwhelming the database
            if (rowIdx % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        setImportErrors(errors);
        setImportProgress({ 
            current: rows.length, 
            total: rows.length, 
            status: `Complete! ${successCount} grades imported, ${skipCount} empty cells skipped` 
        });
        
        // Close modal after a delay if no errors
        if (errors.length === 0) {
            setTimeout(() => {
                setShowImportModal(false);
                setImportData(null);
                setImportProgress(null);
            }, 2000);
        }
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
        if (effectiveReadOnly) return;

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

            {/* Adviser-only editing notice */}
            {effectiveReadOnly && !isReadOnly && (
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        {!selectedSectionId || selectedSectionId === 'all'
                            ? 'Select a specific section to edit core values.'
                            : 'Only the class adviser can edit core values for this section. You are viewing in read-only mode.'}
                    </p>
                </div>
            )}
            
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
                            title="Select class"
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
                            title="Select quarter"
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
                            title="Filter by grade"
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

                {/* Bulk Actions - Only for advisers/admins */}
                {!effectiveReadOnly && (
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-3">Bulk Actions</h3>
                        
                        {/* Quick Fill Panel */}
                        <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="font-semibold text-green-800 dark:text-green-300 text-sm">⚡ Quick Fill Empty Cells:</span>
                                <div className="flex gap-1">
                                    {MARKING_OPTIONS.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => quickFillAllEmpty(opt)}
                                            className={`px-3 py-1.5 rounded text-sm font-bold transition-all hover:scale-105 ${
                                                opt === 'AO' ? 'bg-green-500 hover:bg-green-600 text-white' :
                                                opt === 'SO' ? 'bg-lime-500 hover:bg-lime-600 text-white' :
                                                opt === 'RO' ? 'bg-amber-500 hover:bg-amber-600 text-white' :
                                                'bg-red-500 hover:bg-red-600 text-white'
                                            }`}
                                            title={`Fill all empty cells with ${opt}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                                <span className="text-xs text-green-700 dark:text-green-400">
                                    (Click to fill all {analytics.stats.empty} empty cells)
                                </span>
                            </div>
                        </div>
                        
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
                            <button
                                onClick={downloadTemplate}
                                className="px-3 py-1.5 bg-teal-600 text-white rounded text-sm hover:bg-teal-700 transition-colors"
                            >
                                📄 Download Template
                            </button>
                            <label className="px-3 py-1.5 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors cursor-pointer">
                                📤 Import CSV
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </label>
                            <label className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded text-sm cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={quickFillMode}
                                    onChange={(e) => setQuickFillMode(e.target.checked)}
                                    className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                                />
                                🖱️ Click-to-Fill Mode
                            </label>
                        </div>
                        
                        {quickFillMode && (
                            <div className="mt-3 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-300 dark:border-purple-700">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm text-purple-800 dark:text-purple-300 font-medium">Click cells to set:</span>
                                    {MARKING_OPTIONS.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setSelectedQuickGrade(opt)}
                                            className={`px-3 py-1 rounded text-sm font-bold transition-all ${
                                                selectedQuickGrade === opt 
                                                    ? 'ring-2 ring-offset-2 ring-purple-500 scale-110' 
                                                    : 'opacity-70 hover:opacity-100'
                                            } ${
                                                opt === 'AO' ? 'bg-green-500 text-white' :
                                                opt === 'SO' ? 'bg-lime-500 text-white' :
                                                opt === 'RO' ? 'bg-amber-500 text-white' :
                                                'bg-red-500 text-white'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                    <span className="text-xs text-purple-600 dark:text-purple-400 ml-2">
                                        (Click any cell to instantly set to {selectedQuickGrade})
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Spreadsheet Table */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[70vh]">
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
                            
                            {/* Quarter Headers Row with Quick Fill Buttons */}
                            <tr className="bg-slate-200 dark:bg-slate-800">
                                {coreValues.map(cv => 
                                    (cv.behaviors || []).map((behavior, behaviorIdx) => 
                                        (['1st', '2nd', '3rd', '4th'] as const).map((quarter, qIdx) => {
                                            const quarterKey = ['q1', 'q2', 'q3', 'q4'][qIdx] as 'q1' | 'q2' | 'q3' | 'q4';
                                            const shouldShow = selectedQuarter === 'all' || selectedQuarter === quarterKey;
                                            
                                            if (!shouldShow) return null;
                                            
                                            return (
                                                <th 
                                                    key={`${cv.id}-${behaviorIdx}-${quarter}`}
                                                    className={`px-1 text-center font-semibold text-slate-700 dark:text-slate-300 border-l border-slate-300 dark:border-slate-700 min-w-[60px] ${compactView ? 'py-0.5 text-[10px]' : 'py-1 text-xs'}`}
                                                >
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <span>{quarter}</span>
                                                        {/* Quick Fill Column Buttons */}
                                                        {!effectiveReadOnly && (
                                                            <div className="flex gap-0.5">
                                                                {MARKING_OPTIONS.map(opt => (
                                                                    <button
                                                                        key={opt}
                                                                        onClick={() => quickFillColumn(cv.id, behavior, quarterKey, opt)}
                                                                        className={`px-1 py-0 text-[8px] rounded opacity-60 hover:opacity-100 transition-opacity ${
                                                                            opt === 'AO' ? 'bg-green-400 text-white hover:bg-green-500' :
                                                                            opt === 'SO' ? 'bg-lime-400 text-white hover:bg-lime-500' :
                                                                            opt === 'RO' ? 'bg-amber-400 text-white hover:bg-amber-500' :
                                                                            'bg-red-400 text-white hover:bg-red-500'
                                                                        }`}
                                                                        title={`Set all to ${opt}`}
                                                                    >
                                                                        {opt}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
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
                                                
                                                // Quick Fill Mode: Click to instantly set grade
                                                const handleCellClick = () => {
                                                    if (quickFillMode && !effectiveReadOnly) {
                                                        handleMarkingChange(student.id, cv.id, quarter, behavior, selectedQuickGrade);
                                                    }
                                                };
                                                
                                                return (
                                                    <td 
                                                        key={`${cv.id}-${behaviorIdx}-${quarter}`}
                                                        onClick={handleCellClick}
                                                        className={`p-0.5 border-l border-slate-200 dark:border-slate-700 ${
                                                            isEmpty ? 'bg-red-50 dark:bg-red-900/20' : ''
                                                        } ${
                                                            matchesFilter && filterByGrade !== 'all' ? 'ring-2 ring-inset ring-blue-500' : ''
                                                        } ${
                                                            isSaving ? 'opacity-60' : ''
                                                        } ${
                                                            quickFillMode && !effectiveReadOnly ? 'cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30' : ''
                                                        }`}
                                                    >
                                                        <div className="relative">
                                                            {quickFillMode && !effectiveReadOnly ? (
                                                                // Quick Fill Mode: Show clickable button instead of dropdown
                                                                <button
                                                                    type="button"
                                                                    className={`w-full px-1 text-center font-bold border-0 focus:ring-2 focus:ring-purple-500 ${
                                                                        compactView ? 'py-0.5 text-[10px]' : 'py-1 text-xs'
                                                                    } ${getMarkingColor(marking)} hover:opacity-80 transition-opacity`}
                                                                    title={`Click to set ${selectedQuickGrade}`}
                                                                >
                                                                    {marking || '·'}
                                                                </button>
                                                            ) : (
                                                                // Normal Mode: Show dropdown
                                                                <select
                                                                    id={cellId}
                                                                    value={marking ?? ''}
                                                                    onChange={(e) => handleMarkingChange(student.id, cv.id, quarter, behavior, e.target.value)}
                                                                    onKeyDown={(e) => handleKeyDown(e, studentIdx, cvIdx, behaviorIdx, quarterIdx)}
                                                                    disabled={effectiveReadOnly}
                                                                    title="Behavior marking"
                                                                    className={`w-full px-1 text-center font-bold border-0 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer ${
                                                                        compactView ? 'py-0.5 text-[10px]' : 'py-1 text-xs'
                                                                    } ${getMarkingColor(marking)}`}
                                                                >
                                                                    <option value="">-</option>
                                                                    {MARKING_OPTIONS.map(opt => (
                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                    ))}
                                                                </select>
                                                            )}
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

            {/* CSV Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                📤 Import Core Values Grades from CSV
                            </h2>
                            <button
                                onClick={() => {
                                    setShowImportModal(false);
                                    setImportData(null);
                                    setImportProgress(null);
                                    setImportErrors([]);
                                }}
                                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            {importData && (
                                <>
                                    {/* Preview */}
                                    <div className="mb-4">
                                        <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            Preview ({importData.rows.length} students found)
                                        </h3>
                                        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded">
                                            <table className="min-w-full text-xs">
                                                <thead className="bg-slate-100 dark:bg-slate-900">
                                                    <tr>
                                                        {importData.headers.slice(0, 10).map((h, i) => (
                                                            <th key={i} className="px-2 py-1 text-left border-b border-slate-200 dark:border-slate-700 truncate max-w-[150px]">
                                                                {h}
                                                            </th>
                                                        ))}
                                                        {importData.headers.length > 10 && (
                                                            <th className="px-2 py-1 text-slate-500">
                                                                +{importData.headers.length - 10} more...
                                                            </th>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {importData.rows.slice(0, 5).map((row, rowIdx) => (
                                                        <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'}>
                                                            {row.slice(0, 10).map((cell, cellIdx) => (
                                                                <td key={cellIdx} className="px-2 py-1 border-b border-slate-200 dark:border-slate-700 truncate max-w-[150px]">
                                                                    <span className={['AO', 'SO', 'RO', 'NO'].includes(cell.toUpperCase()) 
                                                                        ? `font-bold ${
                                                                            cell.toUpperCase() === 'AO' ? 'text-green-600' :
                                                                            cell.toUpperCase() === 'SO' ? 'text-lime-600' :
                                                                            cell.toUpperCase() === 'RO' ? 'text-amber-600' :
                                                                            'text-red-600'
                                                                        }` 
                                                                        : ''}>
                                                                        {cell}
                                                                    </span>
                                                                </td>
                                                            ))}
                                                            {row.length > 10 && (
                                                                <td className="px-2 py-1 text-slate-400">...</td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                    {importData.rows.length > 5 && (
                                                        <tr>
                                                            <td colSpan={11} className="px-2 py-1 text-center text-slate-500 italic">
                                                                ... and {importData.rows.length - 5} more students
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    
                                    {/* Instructions */}
                                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">📋 Expected Format</h4>
                                        <ul className="text-sm text-blue-700 dark:text-blue-400 list-disc list-inside space-y-1">
                                            <li>Column 1: Student Name (must match exactly)</li>
                                            <li>Column 2: LRN (optional, for better matching)</li>
                                            <li>Grade columns: Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">AO</code>, <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">SO</code>, <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">RO</code>, or <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">NO</code></li>
                                            <li>Headers format: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">MAKADIYOS-B1-Q1</code> or <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">CV Name - Behavior - Q1</code></li>
                                        </ul>
                                    </div>
                                    
                                    {/* Progress */}
                                    {importProgress && (
                                        <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-indigo-800 dark:text-indigo-300 font-medium">
                                                    {importProgress.status}
                                                </span>
                                                <span className="text-indigo-600 dark:text-indigo-400">
                                                    {importProgress.current} / {importProgress.total}
                                                </span>
                                            </div>
                                            <div className="w-full bg-indigo-200 dark:bg-indigo-900 rounded-full h-2">
                                                <div 
                                                    className="bg-indigo-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Errors */}
                                    {importErrors.length > 0 && (
                                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 max-h-[150px] overflow-y-auto">
                                            <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">
                                                ⚠️ Import Errors ({importErrors.length})
                                            </h4>
                                            <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                                                {importErrors.slice(0, 10).map((err, i) => (
                                                    <li key={i}>• {err}</li>
                                                ))}
                                                {importErrors.length > 10 && (
                                                    <li className="italic">... and {importErrors.length - 10} more errors</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                💡 Tip: Use "Download Template" to get a pre-formatted CSV with your students
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setShowImportModal(false);
                                        setImportData(null);
                                        setImportProgress(null);
                                        setImportErrors([]);
                                    }}
                                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={importGrades}
                                    disabled={!importData || importProgress !== null}
                                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {importProgress ? 'Importing...' : '📤 Import Grades'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoreValuesGradebookView;
