import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import type { AuthUser, StudentUser, ClassSchedule, ParentUser } from '../types';
import Modal from './Modal';
import { TrashIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { useSchedulePostgreSQL } from '../src/hooks/useSchedulePostgreSQL';
import { useSectionsPostgreSQL } from '../src/hooks/useSectionsPostgreSQL';
import { useTeachersPostgreSQL } from '../src/hooks/useTeachersPostgreSQL';
import { useLearningAreasPostgreSQL } from '../src/hooks/useLearningAreasPostgreSQL';
import { useStudentsPostgreSQL } from '../src/hooks/useStudentsPostgreSQL';
import { useSchoolContext } from '../src/contexts/SchoolContext';

// --- UTILITY FUNCTIONS ---
const getScheduleColor = (schedule: ClassSchedule) => {
  if (schedule.type === 'extracurricular') {
    return 'bg-slate-200 border-slate-400 text-slate-800 dark:bg-slate-700 dark:border-slate-500 dark:text-slate-200';
  }
  const id = schedule.learningAreaId || schedule.id;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-red-200 border-red-400 text-red-800 dark:bg-red-900/50 dark:border-red-700 dark:text-red-200',
    'bg-sky-200 border-sky-400 text-sky-800 dark:bg-sky-900/50 dark:border-sky-700 dark:text-sky-200',
    'bg-emerald-200 border-emerald-400 text-emerald-800 dark:bg-emerald-900/50 dark:border-emerald-700 dark:text-emerald-200',
    'bg-amber-200 border-amber-400 text-amber-800 dark:bg-amber-900/50 dark:border-amber-700 dark:text-amber-200',
    'bg-violet-200 border-violet-400 text-violet-800 dark:bg-violet-900/50 dark:border-violet-700 dark:text-violet-200',
    'bg-rose-200 border-rose-400 text-rose-800 dark:bg-rose-900/50 dark:border-rose-700 dark:text-rose-200',
  ];
  return colors[Math.abs(hash % colors.length)];
};

const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const minutesToTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const START_HOUR = 7;
const END_HOUR = 17;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const DAYS: ClassSchedule['dayOfWeek'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const SchedulerView: React.FC<{ schoolData: SchoolDataHook; session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' }; forceStudentId?: string; }> = ({ schoolData, session, forceStudentId }) => {
    // Get schoolId from context for PostgreSQL hooks
    const { schoolId } = useSchoolContext();
    
    console.log('[SchedulerView] 🚀 Component mounted with schoolId:', schoolId);
    
    // Load data directly from PostgreSQL hooks
    const { schedules: classSchedules, loading: schedulesLoading, addSchedule, updateSchedule, deleteSchedule } = useSchedulePostgreSQL({
        schoolId: schoolId || undefined,
        enablePolling: true
    });
    
    const { sections, loading: sectionsLoading } = useSectionsPostgreSQL({
        schoolId: schoolId || undefined,
        includeAdviser: true
    });
    
    const { teachers, loading: teachersLoading } = useTeachersPostgreSQL({
        schoolId: schoolId || undefined
    });
    
    const { learningAreas, loading: areasLoading } = useLearningAreasPostgreSQL({
        schoolId: schoolId || undefined
    });
    
    const { students, loading: studentsLoading } = useStudentsPostgreSQL({
        schoolId: schoolId || undefined,
        status: 'enrolled'
    });
    
    // Use substitute assignments from props (if needed)
    const { substituteAssignments } = schoolData;
    
    const authUser = session.user as AuthUser;
    const isStudentView = session.type === 'student';
    const isParentView = session.type === 'parent';
    const isRegularTeacher = session.type === 'staff' && authUser.role === 'teacher';
    const isReadOnly = isStudentView || isParentView || (session.type === 'staff' && authUser.role === 'principal');
    
    // DIAGNOSTIC: Log when component mounts and when data changes
    useEffect(() => {
        console.log('[SchedulerView] 🔍 Data received:', {
            schoolId,
            classSchedules: classSchedules.length,
            sections: sections.length,
            teachers: teachers.length,
            learningAreas: learningAreas.length,
            students: students.length,
            loading: {
                schedules: schedulesLoading,
                sections: sectionsLoading,
                teachers: teachersLoading,
                areas: areasLoading,
                students: studentsLoading
            },
            session: session.type,
            user: authUser.name || 'Unknown'
        });
    }, [schoolId, classSchedules.length, sections.length, teachers.length, learningAreas.length, students.length, schedulesLoading, sectionsLoading, teachersLoading, areasLoading, studentsLoading]);

    const getInitialViewType = (): 'section' | 'teacher' => {
        if (isRegularTeacher) return 'teacher';
        return 'section';
    };

    const getInitialSelectedId = (): string | null => {
        if (isRegularTeacher) return authUser.id;
        if (isStudentView) return (session.user as StudentUser).sectionId ?? null;
        if (isParentView) return students.find(s => s.id === forceStudentId)?.sectionId ?? null;
        return sections[0]?.id || null;
    };

    const [viewType, setViewType] = useState<'section' | 'teacher'>(getInitialViewType());
    const [selectedId, setSelectedId] = useState<string | null>(getInitialSelectedId());
    
    // FIX: Auto-select first section when sections are loaded (for admin/principal)
    useEffect(() => {
        console.log('[SchedulerView] selectedId:', selectedId, 'sections.length:', sections.length, 'viewType:', viewType);
        if (!selectedId && sections.length > 0 && viewType === 'section') {
            console.log('[SchedulerView] Auto-selecting first section:', sections[0].id, sections[0].name);
            setSelectedId(sections[0].id);
        }
    }, [sections, selectedId, viewType]);
    
    // --- FILTER STATE ---
    type FilterType = 'all' | 'academic' | 'extracurricular';
    type FilterState = {
        type: FilterType;
        daySet: Set<ClassSchedule['dayOfWeek']>; // empty = all days
        teacherIds: Set<string>; // empty = all
        q?: string; // text search
    };
    const [filters, setFilters] = useState<FilterState>({ type: 'all', daySet: new Set(), teacherIds: new Set(), q: '' });

    // Section view selectors
    const [selectedGradeLevel, setSelectedGradeLevel] = useState<number | ''>(() => {
        const sid = getInitialSelectedId();
        const sec = sid ? sections.find(s => s.id === sid) : undefined;
        return sec?.gradeLevel ?? '';
    });
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<Partial<ClassSchedule> & { isEditing?: boolean }>({});
    const [modalError, setModalError] = useState<string | null>(null);

    const timeSlots = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => `${String(i + START_HOUR).padStart(2, '0')}:00`);
    
    const gridRef = useRef<HTMLDivElement>(null);
    const [activeInteraction, setActiveInteraction] = useState<{ type: 'drag' | 'resize-v' | 'resize-left' | 'resize-right'; schedule: ClassSchedule; } | null>(null);
    const [indicator, setIndicator] = useState<{ top: number; left: number; width: number; height: number; startDay: string; endDay: string; startTime: string; endTime: string; } | null>(null);
    const [notification, setNotification] = useState<string | null>(null);

    const [viewDate, setViewDate] = useState(new Date());

    const { weekDates, weekLabel } = useMemo(() => {
        const startOfWeek = new Date(viewDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        startOfWeek.setDate(diff);

        const dates: Date[] = [];
        for (let i = 0; i < 5; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            dates.push(d);
        }
        
        const start = dates[0];
        const end = dates[4];
        const label = `${start.toLocaleString('default', { month: 'long', day: 'numeric' })} - ${end.toLocaleString('default', { month: 'long', day: 'numeric' })}, ${end.getFullYear()}`;
        
        return { weekDates: dates, weekLabel: label };
    }, [viewDate]);

    const goToPreviousWeek = () => setViewDate(d => new Date(d.setDate(d.getDate() - 7)));
    const goToNextWeek = () => setViewDate(d => new Date(d.setDate(d.getDate() + 7)));

    useEffect(() => {
        if(notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // --- Pre-index schedules for efficient filtering ---
    const scheduleIndexes = useMemo(() => {
        const bySection = new Map<string, ClassSchedule[]>();
        const byTeacher = new Map<string, ClassSchedule[]>();
        const byGradeLevel = new Map<number, ClassSchedule[]>();
        const all: ClassSchedule[] = [];

        const push = (map: Map<any, any[]>, key: any, s: ClassSchedule) => {
            const arr = map.get(key);
            if (arr) arr.push(s); else map.set(key, [s]);
        };

        for (const s of classSchedules) {
            if (s.scope === 'all') all.push(s);
            if (s.scope === 'section' && s.sectionId) push(bySection, s.sectionId, s);
            if (s.scope === 'gradeLevel' && typeof s.gradeLevel === 'number') push(byGradeLevel, s.gradeLevel, s);
            if (s.type === 'academic' && s.teacherId) push(byTeacher, s.teacherId, s);
        }
        
        console.log('[SchedulerView] Indexed schedules:', {
            totalSchedules: classSchedules.length,
            allSchool: all.length,
            bySectionCount: bySection.size,
            byGradeLevelCount: byGradeLevel.size,
            byTeacherCount: byTeacher.size,
            sampleSectionIds: Array.from(bySection.keys()).slice(0, 5)
        });
        
        return { bySection, byTeacher, byGradeLevel, all };
    }, [classSchedules]);

    const sectionGradeMap = useMemo(() => new Map(sections.map(s => [s.id, s.gradeLevel])), [sections]);

    const baseList = useMemo(() => {
        // TEMPORARY DEBUG: Show all schedules if no section selected
        if (!selectedId) {
            console.warn('[SchedulerView] ⚠️ No selectedId - showing ALL schedules as fallback');
            // Return first 50 schedules for debugging
            return classSchedules.slice(0, 50);
        }
        if (viewType === 'teacher') {
            const teacherSchedules = scheduleIndexes.byTeacher.get(selectedId) ?? [];
            console.log(`[SchedulerView] Teacher view - found ${teacherSchedules.length} schedules for teacher ${selectedId}`);
            return teacherSchedules;
        }
        const gl = sectionGradeMap.get(selectedId);
        const a = scheduleIndexes.all;
        const b = gl != null ? (scheduleIndexes.byGradeLevel.get(gl) ?? []) : [];
        const c = scheduleIndexes.bySection.get(selectedId) ?? [];
        console.log(`[SchedulerView] Section view - selectedId: ${selectedId}, gradeLevel: ${gl}`);
        console.log(`[SchedulerView]   - All-school schedules: ${a.length}`);
        console.log(`[SchedulerView]   - Grade-level schedules: ${b.length}`);
        console.log(`[SchedulerView]   - Section schedules: ${c.length}`);
        const seen = new Set<string>();
        const out: ClassSchedule[] = [];
        for (const arr of [a,b,c]) {
            for (const s of arr) {
                if (!seen.has(s.id)) { seen.add(s.id); out.push(s); }
            }
        }
        console.log(`[SchedulerView] Total baseList: ${out.length} schedules`);
        return out;
    }, [viewType, selectedId, scheduleIndexes, sectionGradeMap, classSchedules]);

    // no time filter

    const filteredSchedules = useMemo(() => {
        const { type, daySet, teacherIds, q } = filters;
        const qlc = (q || '').trim().toLowerCase();
        const dayIndex = (d: ClassSchedule['dayOfWeek']) => DAYS.indexOf(d);
        return baseList.filter(s => {
            if (type !== 'all' && s.type !== type) return false;
            if (daySet.size) {
                const d0 = s.dayOfWeek; const d1 = s.endDayOfWeek ?? s.dayOfWeek;
                const i0 = dayIndex(d0), i1 = dayIndex(d1);
                let ok = false;
                for (let i=i0;i<=i1;i++) { if (daySet.has(DAYS[i])) { ok = true; break; } }
                if (!ok) return false;
            }
            if (teacherIds.size) {
                if (!s.teacherId || !teacherIds.has(s.teacherId)) return false;
            }
            if (qlc) {
                const sectionName = sections.find(sec => sec.id === s.sectionId)?.name || '';
                const teacherName = teachers.find(t => t.id === s.teacherId)?.name || '';
                const hay = `${s.title} ${sectionName} ${teacherName}`.toLowerCase();
                if (!hay.includes(qlc)) return false;
            }
            return true;
        });
    }, [baseList, filters.type, filters.q, sections, teachers, Array.from(filters.daySet).join('|'), Array.from(filters.teacherIds).join('|')]);
    
    // --- Interaction Handlers ---
    const handleInteractionStart = (e: React.MouseEvent, type: 'drag' | 'resize-v' | 'resize-left' | 'resize-right', schedule: ClassSchedule) => {
        if (isReadOnly) return;
        e.preventDefault();
        e.stopPropagation();
        setActiveInteraction({ type, schedule });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!activeInteraction || !gridRef.current) return;
            e.preventDefault();

            const gridRect = gridRef.current.getBoundingClientRect();
            const y = e.clientY - gridRect.top;
            const x = e.clientX - gridRect.left;
            
            const dayIndex = Math.min(DAYS.length - 1, Math.max(0, Math.floor(x / (gridRect.width / DAYS.length))));
            const totalMinutesInView = TOTAL_HOURS * 60;
            const minutesFromTop = (y / gridRect.height) * totalMinutesInView;
            
            const originalSchedule = activeInteraction.schedule;
            const originalStartMinutes = timeToMinutes(originalSchedule.startTime);
            const originalEndMinutes = timeToMinutes(originalSchedule.endTime);
            const originalDurationMinutes = originalEndMinutes - originalStartMinutes;
            const originalStartDayIndex = DAYS.indexOf(originalSchedule.dayOfWeek);
            const originalEndDayIndex = originalSchedule.endDayOfWeek ? DAYS.indexOf(originalSchedule.endDayOfWeek) : originalStartDayIndex;
            const originalDurationDays = originalEndDayIndex - originalStartDayIndex + 1;

            let newIndicator: typeof indicator = null;

            switch (activeInteraction.type) {
                case 'drag': {
                    const snappedMinutes = START_HOUR * 60 + Math.round(minutesFromTop / 15) * 15;
                    const newStartTime = minutesToTime(snappedMinutes);
                    const newEndTime = minutesToTime(snappedMinutes + originalDurationMinutes);
                    const newStartDayIndex = Math.min(dayIndex, DAYS.length - originalDurationDays);
                    const newStartDay = DAYS[newStartDayIndex];
                    const newEndDay = DAYS[newStartDayIndex + originalDurationDays - 1];

                    newIndicator = {
                        startTime: newStartTime, endTime: newEndTime, startDay: newStartDay, endDay: newEndDay,
                        top: (snappedMinutes - (START_HOUR * 60)) / totalMinutesInView * 100,
                        left: (newStartDayIndex / DAYS.length) * 100,
                        width: (originalDurationDays / DAYS.length) * 100,
                        height: (originalDurationMinutes / totalMinutesInView) * 100
                    };
                    break;
                }
                case 'resize-v': {
                    const snappedEndTimeMinutes = START_HOUR * 60 + Math.round(minutesFromTop / 15) * 15;
                    const newDuration = Math.max(15, snappedEndTimeMinutes - originalStartMinutes);
                    const newEndTime = minutesToTime(originalStartMinutes + newDuration);
                    
                    newIndicator = {
                        startTime: originalSchedule.startTime, endTime: newEndTime, startDay: originalSchedule.dayOfWeek, endDay: originalSchedule.endDayOfWeek || originalSchedule.dayOfWeek,
                        top: (originalStartMinutes - (START_HOUR * 60)) / totalMinutesInView * 100,
                        left: (originalStartDayIndex / DAYS.length) * 100,
                        width: (originalDurationDays / DAYS.length) * 100,
                        height: (newDuration / totalMinutesInView) * 100
                    };
                    break;
                }
                 case 'resize-right': {
                    const newEndDayIndex = Math.max(originalStartDayIndex, dayIndex);
                    const newDurationDays = newEndDayIndex - originalStartDayIndex + 1;
                    
                    newIndicator = {
                        startTime: originalSchedule.startTime, endTime: originalSchedule.endTime, startDay: originalSchedule.dayOfWeek, endDay: DAYS[newEndDayIndex],
                        top: (originalStartMinutes - (START_HOUR * 60)) / totalMinutesInView * 100,
                        left: (originalStartDayIndex / DAYS.length) * 100,
                        width: (newDurationDays / DAYS.length) * 100,
                        height: (originalDurationMinutes / totalMinutesInView) * 100
                    };
                    break;
                }
                case 'resize-left': {
                    const newStartDayIndex = Math.min(originalEndDayIndex, dayIndex);
                    const newDurationDays = originalEndDayIndex - newStartDayIndex + 1;
                    
                    newIndicator = {
                        startTime: originalSchedule.startTime, endTime: originalSchedule.endTime, startDay: DAYS[newStartDayIndex], endDay: DAYS[originalEndDayIndex],
                        top: (originalStartMinutes - (START_HOUR * 60)) / totalMinutesInView * 100,
                        left: (newStartDayIndex / DAYS.length) * 100,
                        width: (newDurationDays / DAYS.length) * 100,
                        height: (originalDurationMinutes / totalMinutesInView) * 100
                    };
                    break;
                }
            }
            setIndicator(newIndicator);
        };

        const handleMouseUp = async () => {
            if (!activeInteraction || !indicator) {
                setActiveInteraction(null);
                setIndicator(null);
                return;
            }
            
            // Create partial updates object (only the fields that changed)
            const updates: Partial<ClassSchedule> = {
                dayOfWeek: indicator.startDay as ClassSchedule['dayOfWeek'],
                startTime: indicator.startTime,
                endTime: indicator.endTime,
            };
            
            // Only add endDayOfWeek if it's different from startDay
            if (indicator.endDay !== indicator.startDay) {
                updates.endDayOfWeek = indicator.endDay as ClassSchedule['dayOfWeek'];
            }
            
            // Create full schedule object for conflict checking
            const updatedSchedule: ClassSchedule = {
                ...activeInteraction.schedule,
                ...updates
            };

            // Check for conflicts before updating
            const conflict = checkScheduleConflict(updatedSchedule, updatedSchedule.id);
            if (conflict.hasConflict) {
                const conflictInfo = conflict.conflictingSchedule!;
                const conflictSection = sections.find(s => s.id === conflictInfo.sectionId);
                const conflictTeacher = teachers.find(t => t.id === conflictInfo.teacherId);
                
                // Build detailed conflict message
                let conflictMessage = `Cannot move here! Time slot conflicts with "${conflictInfo.title}"`;
                
                // Add resource details
                if (conflictSection) {
                    conflictMessage += ` (${conflictSection.name})`;
                } else if (conflictTeacher) {
                    conflictMessage += ` (Teacher: ${conflictTeacher.name})`;
                } else if (conflictInfo.gradeLevel) {
                    conflictMessage += ` (Grade ${conflictInfo.gradeLevel})`;
                }
                
                // Add time details
                conflictMessage += ` at ${conflictInfo.dayOfWeek} ${conflictInfo.startTime}-${conflictInfo.endTime}`;
                
                // Add scope explanation for school-wide conflicts
                if (updatedSchedule.scope === 'all' && conflictInfo.scope === 'section') {
                    conflictMessage += '. School-wide events cannot overlap with any section classes.';
                } else if (updatedSchedule.scope === 'section' && conflictInfo.scope === 'all') {
                    conflictMessage += '. Section classes cannot overlap with school-wide events.';
                }
                
                setNotification(conflictMessage);
                setActiveInteraction(null);
                setIndicator(null);
                return;
            }

            try {
                // Call updateSchedule with id and partial updates
                await updateSchedule(activeInteraction.schedule.id, updates);
            } catch (err) {
                console.error('[SchedulerView] Failed to update schedule:', err);
                setNotification('Failed to update schedule.');
            }
            
            setActiveInteraction(null);
            setIndicator(null);
        };

        if (activeInteraction) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp, { once: true });
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [activeInteraction, indicator, updateSchedule]);
    
    // --- Modal Logic ---
    const handleCellClick = (day: ClassSchedule['dayOfWeek'], time: string) => {
        if (isReadOnly) return;
        setModalError(null);
        const startTime = time;
        const endTime = `${String(Number(time.split(':')[0]) + 1).padStart(2, '0')}:00`;
        const initialData: Partial<ClassSchedule> = {
            dayOfWeek: day,
            startTime,
            endTime,
            type: 'academic',
            scope: 'section',
        };
        if (viewType === 'section') initialData.sectionId = selectedId!;
        if (viewType === 'teacher') initialData.teacherId = selectedId!;
        setModalData(initialData);
        setIsModalOpen(true);
    };

    const handleScheduleClick = (schedule: ClassSchedule) => {
        if (isReadOnly) return;
        setModalError(null);
        setModalData({ ...schedule, isEditing: true });
        setIsModalOpen(true);
    };

    // Check if a schedule conflicts with existing schedules
    const checkScheduleConflict = (scheduleToCheck: any, excludeId?: string): { hasConflict: boolean; conflictingSchedule?: ClassSchedule } => {
        const checkStartTime = timeToMinutes(scheduleToCheck.startTime);
        const checkEndTime = timeToMinutes(scheduleToCheck.endTime);
        const checkStartDay = scheduleToCheck.dayOfWeek;
        const checkEndDay = scheduleToCheck.endDayOfWeek || scheduleToCheck.dayOfWeek;
        
        // Get the day indices
        const checkStartDayIndex = DAYS.indexOf(checkStartDay);
        const checkEndDayIndex = DAYS.indexOf(checkEndDay);
        
        for (const existing of classSchedules) {
            // Skip if checking against itself (when editing)
            if (excludeId && existing.id === excludeId) continue;
            
            const existingStartTime = timeToMinutes(existing.startTime);
            const existingEndTime = timeToMinutes(existing.endTime);
            const existingStartDay = existing.dayOfWeek;
            const existingEndDay = existing.endDayOfWeek || existing.dayOfWeek;
            
            const existingStartDayIndex = DAYS.indexOf(existingStartDay);
            const existingEndDayIndex = DAYS.indexOf(existingEndDay);
            
            // Check if days overlap
            const daysOverlap = !(checkEndDayIndex < existingStartDayIndex || checkStartDayIndex > existingEndDayIndex);
            
            if (!daysOverlap) continue;
            
            // Check if times overlap
            const timesOverlap = !(checkEndTime <= existingStartTime || checkStartTime >= existingEndTime);
            
            if (!timesOverlap) continue;
            
            // Check if they share the same resource (section, teacher, or grade level)
            let resourceConflict = false;
            
            // If BOTH are 'all' scope (school-wide events), they conflict with each other
            if (scheduleToCheck.scope === 'all' && existing.scope === 'all') {
                resourceConflict = true;
            }
            
            // If one is 'all' and the other is 'gradeLevel', check if they share the same grade level
            if (scheduleToCheck.scope === 'all' && existing.scope === 'gradeLevel' && existing.gradeLevel) {
                // School-wide event conflicts with grade-level activities
                resourceConflict = true;
            }
            if (existing.scope === 'all' && scheduleToCheck.scope === 'gradeLevel' && scheduleToCheck.gradeLevel) {
                resourceConflict = true;
            }
            
            // If one is 'all' and the other is 'section', they conflict (school-wide blocks all sections)
            if ((scheduleToCheck.scope === 'all' && existing.scope === 'section') ||
                (existing.scope === 'all' && scheduleToCheck.scope === 'section')) {
                resourceConflict = true;
            }
            
            // If both are for the same section
            if (scheduleToCheck.sectionId && existing.sectionId && scheduleToCheck.sectionId === existing.sectionId) {
                resourceConflict = true;
            }
            
            // If both are for the same teacher
            if (scheduleToCheck.teacherId && existing.teacherId && scheduleToCheck.teacherId === existing.teacherId) {
                resourceConflict = true;
            }
            
            // If both are for the same grade level
            if (scheduleToCheck.gradeLevel && existing.gradeLevel && scheduleToCheck.gradeLevel === existing.gradeLevel) {
                resourceConflict = true;
            }
            
            if (resourceConflict) {
                return { hasConflict: true, conflictingSchedule: existing };
            }
        }
        
        return { hasConflict: false };
    };

    const handleModalSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!schoolId) {
            setModalError('School ID is missing. Please refresh the page and try again.');
            return;
        }
        
        const dataToSave: any = {
            schoolId: schoolId, // CRITICAL: Add schoolId for PostgreSQL
            title: modalData.title!, 
            type: modalData.type!, 
            scope: modalData.scope!,
            dayOfWeek: modalData.dayOfWeek!, 
            startTime: modalData.startTime!, 
            endTime: modalData.endTime!,
        };
        
        // Only add endDayOfWeek if it's different from dayOfWeek
        if (modalData.endDayOfWeek && modalData.endDayOfWeek !== modalData.dayOfWeek) {
            dataToSave.endDayOfWeek = modalData.endDayOfWeek;
        }
        
        // Add optional fields only if they have values
        if (modalData.scope === 'section' && modalData.sectionId) {
            dataToSave.sectionId = modalData.sectionId;
        }
        if (modalData.scope === 'gradeLevel' && modalData.gradeLevel) {
            dataToSave.gradeLevel = modalData.gradeLevel;
        }
        if (modalData.type === 'academic' && modalData.learningAreaId) {
            dataToSave.learningAreaId = modalData.learningAreaId;
        }
        if (modalData.type === 'academic' && modalData.teacherId) {
            dataToSave.teacherId = modalData.teacherId;
        }
        if (modalData.room) {
            dataToSave.room = modalData.room;
        }
        
        if (!dataToSave.title || (dataToSave.type === 'academic' && (!dataToSave.learningAreaId || !dataToSave.teacherId || !dataToSave.sectionId))) {
            setModalError('Please fill all required fields for the selected event type.'); return;
        }
        if (dataToSave.startTime >= dataToSave.endTime) {
            setModalError('End time must be after start time.'); return;
        }
        if (dataToSave.dayOfWeek && dataToSave.endDayOfWeek && DAYS.indexOf(dataToSave.endDayOfWeek) < DAYS.indexOf(dataToSave.dayOfWeek)) {
            setModalError('End day cannot be before start day.'); return;
        }
        
        // Check for scheduling conflicts
        const conflict = checkScheduleConflict(dataToSave, modalData.isEditing ? modalData.id : undefined);
        if (conflict.hasConflict) {
            const conflictInfo = conflict.conflictingSchedule!;
            const conflictSection = sections.find(s => s.id === conflictInfo.sectionId);
            const conflictTeacher = teachers.find(t => t.id === conflictInfo.teacherId);
            const conflictResource = conflictSection?.name || conflictTeacher?.name || `Grade ${conflictInfo.gradeLevel}` || 'Unknown';
            setModalError(`Schedule conflict! This time slot is already occupied by "${conflictInfo.title}" for ${conflictResource} on ${conflictInfo.dayOfWeek} at ${conflictInfo.startTime}-${conflictInfo.endTime}.`);
            return;
        }
        
        try {
            if (modalData.isEditing && modalData.id) {
                // Update existing schedule - only send changed fields
                const updates = { ...dataToSave };
                delete updates.schoolId; // Don't send schoolId in updates
                await updateSchedule(modalData.id, updates);
            } else {
                // Add new schedule - send full object including schoolId
                await addSchedule(dataToSave);
            }
            setIsModalOpen(false);
            setModalError(null);
        } catch (err) {
            console.error('[SchedulerView] Error saving schedule:', err);
            setModalError(err instanceof Error ? err.message : 'An error occurred while saving the schedule.');
        }
    };
    
    const handleModalDelete = () => {
        if (modalData.isEditing && modalData.id) { deleteSchedule(modalData.id); setIsModalOpen(false); }
    };
    
    // --- Side Effects ---
    const options = useMemo(() => viewType === 'section' ? sections : teachers, [viewType, sections, teachers]);
    const gradeLevels = useMemo(() => Array.from(new Set(sections.map(s => s.gradeLevel))).sort(), [sections]);
    
    useEffect(() => {
        // For a regular teacher, the view is fixed and should not change.
        if (isRegularTeacher) {
            if (viewType !== 'teacher' || selectedId !== authUser.id) {
                setViewType('teacher');
                setSelectedId(authUser.id);
            }
            return;
        }

        // For student/parent view, ensure correct section is selected
        if (isStudentView) {
            const studentSectionId = (session.user as StudentUser).sectionId;
            if(selectedId !== studentSectionId) setSelectedId(studentSectionId || null);
            return;
        }
        if (isParentView) {
            const childSectionId = students.find(s => s.id === forceStudentId)?.sectionId;
            if(selectedId !== childSectionId) setSelectedId(childSectionId || null);
            return;
        }

        // For admin/registrar/principal, ensure a valid option is always selected
        const currentSelectionExists = options.some(o => o.id === selectedId);
        if (!currentSelectionExists && options.length > 0) {
            // When view type changes, select a sensible default.
            if (viewType === 'teacher') {
                const firstActualTeacher = teachers.find(t => t.role === 'teacher');
                setSelectedId(firstActualTeacher?.id || options[0].id);
            } else { // viewType is 'section'
                setSelectedId(options[0].id);
            }
        } else if (options.length === 0) {
            setSelectedId(null);
        }
    }, [options, selectedId, isRegularTeacher, authUser.id, isStudentView, isParentView, forceStudentId, session.user, students, viewType, teachers]);
    
    useEffect(() => {
        if (modalData.type === 'academic' && modalData.learningAreaId) {
            const la = learningAreas.find(l => l.id === modalData.learningAreaId);
            if (la) setModalData(p => ({...p, title: la.name}));
        }
    }, [modalData.type, modalData.learningAreaId, learningAreas]);

    const currentStudent = students.find(s => s.id === forceStudentId);
    const title = isStudentView ? 'My Class Schedule' : isParentView ? `Schedule for ${currentStudent?.name}` : 'Class Scheduler';

    // DIAGNOSTIC: Check if we have any data at all
    const hasNoData = classSchedules.length === 0 && sections.length === 0;
    const hasSchedulesData = classSchedules.length > 0;

    // --- RENDER ---
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">{title}</h1>
            
            {/* DIAGNOSTIC: Show alert when no data is available */}
            {hasNoData && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                No Schedule Data Available
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                                <p>The schedule could not be loaded. This may be due to:</p>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    <li>School ID not configured in your session</li>
                                    <li>Database connection issue</li>
                                    <li>No schedules created yet</li>
                                </ul>
                                <p className="mt-2">
                                    <strong>Debug Info:</strong> Open browser console (F12) and check for:
                                    <code className="ml-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-800 rounded">
                                        [useSchedulePostgreSQL] No schoolId provided
                                    </code>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* DIAGNOSTIC: Show message when sections loaded but no schedules */}
            {!hasNoData && !hasSchedulesData && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 mb-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                No Schedules Created Yet
                            </h3>
                            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                                <p>Classes are loaded ({sections.length} sections found), but no class schedules have been created.</p>
                                {!isReadOnly && <p className="mt-1">Click "Add Schedule" below to create your first schedule.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {notification && (
                <div className="fixed top-20 right-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 animate-pulse">
                    <strong className="font-bold">Conflict!</strong>
                    <span className="block sm:inline ml-2">{notification}</span>
                </div>
            )}
            
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 overflow-x-auto">
                    {/* LEFT GROUP: View By + Filters */}
                    <div className="flex items-center gap-3 flex-wrap">
                                        {!isStudentView && !isParentView && !isRegularTeacher && (
                                            <>
                                                <div className="flex items-center space-x-2 whitespace-nowrap">
                                                        <label className="text-sm font-semibold whitespace-nowrap">View by:</label>
                                                        <select value={viewType} onChange={e => { setViewType(e.target.value as 'section' | 'teacher'); }} className="input-style text-sm">
                                                                <option value="section">Class</option>
                                                                <option value="teacher">Teacher</option>
                                                        </select>
                                                </div>
                                                {viewType === 'teacher' ? (
                                                    <div className="flex items-center space-x-2">
                                                        <label htmlFor="view-teacher" className="font-semibold">Teacher:</label>
                                                        <select id="view-teacher" value={selectedId ?? ''} onChange={e => setSelectedId(e.target.value)} className="input-style min-w-[220px]">
                                                             {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                        </select>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center space-x-2">
                                                                <label className="text-sm font-semibold">Grade:</label>
                                                                <select value={selectedGradeLevel === '' ? '' : String(selectedGradeLevel)} onChange={e => {
                                                                        const gl = e.target.value ? Number(e.target.value) : '';
                                                                        setSelectedGradeLevel(gl);
                                                                        if (gl === '') return;
                                                                        const firstInGrade = sections.find(s => s.gradeLevel === gl);
                                                                        setSelectedId(firstInGrade?.id || null);
                                                                }} className="input-style text-sm min-w-[100px]">
                                                                        <option value="">All</option>
                                                                        {gradeLevels.map(gl => <option key={gl} value={gl}>Grade {gl}</option>)}
                                                                </select>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                                <label htmlFor="view-section" className="text-sm font-semibold">Section:</label>
                                                                <select id="view-section" value={selectedId ?? ''} onChange={e => setSelectedId(e.target.value)} className="input-style text-sm min-w-[180px]">
                                                                     {sections.filter(s => selectedGradeLevel === '' || s.gradeLevel === selectedGradeLevel).map(s => (
                                                                            <option key={s.id} value={s.id}>{`${s.gradeLevel} - ${s.name}`}</option>
                                                                     ))}
                                                                </select>
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        )}
                    </div>
                    
                    {/* Search and Clear */}
                    <div className="flex items-center gap-2">
                        <input type="text" className="input-style text-sm w-48" placeholder="Search..." value={filters.q ?? ''} onChange={e => setFilters(prev => ({ ...prev, q: e.target.value }))}/>
                        <button type="button" className="text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap" onClick={() => setFilters({ type: 'all', daySet: new Set(), teacherIds: new Set(), q: '' })}>Clear</button>
                    </div>
                </div>
                
                {/* RIGHT: Date navigator */}
                <div className="flex items-center gap-2 lg:gap-4">
                    <button onClick={goToPreviousWeek} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Previous week"><ChevronLeftIcon /></button>
                    <h2 className="text-sm lg:text-base font-bold text-center whitespace-nowrap">{weekLabel}</h2>
                    <button onClick={goToNextWeek} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Next week"><ChevronRightIcon /></button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-3 relative grid grid-cols-[auto_1fr] text-sm" style={{ height: 'calc(100vh - 320px)', minHeight: '500px' }}>
                {/* Time Column */}
                <div className="pr-2 text-right text-xs text-slate-500 dark:text-slate-400">
                    <div className="h-10"></div> {/* Spacer for day headers */}
                    {timeSlots.slice(0, -1).map(time => (
                        <div key={time} className="h-[60px] flex items-start -translate-y-2 justify-end">{time}</div>
                    ))}
                </div>

                {/* Grid */}
                <div ref={gridRef} className="relative grid grid-cols-5 h-full">
                    {/* Day Headers */}
                    {weekDates.map(date => (
                        <div key={date.toISOString()} className="text-center font-bold p-2 border-b border-l border-slate-200 dark:border-slate-700 h-10">
                            {date.toLocaleDateString(undefined, { weekday: 'short' })}
                            <span className="ml-2 font-normal text-slate-500">{date.getDate()}</span>
                        </div>
                    ))}

                    {/* Background Grid Cells */}
                    {DAYS.map(day => (
                      <div key={day} className="border-l border-slate-200 dark:border-slate-700">
                          {timeSlots.slice(0, -1).map(time => (
                              <div key={time} className="h-[60px] border-t border-slate-100 dark:border-slate-700/50" onClick={() => handleCellClick(day, time)}></div>
                          ))}
                      </div>
                    ))}

                    {/* Scheduled Items */}
                    {filteredSchedules.map(schedule => {
                        const startMinutes = timeToMinutes(schedule.startTime);
                        const endMinutes = timeToMinutes(schedule.endTime);
                        const durationMinutes = endMinutes - startMinutes;
                        
                        const dayIndex = DAYS.indexOf(schedule.dayOfWeek);
                        const endDayIndex = schedule.endDayOfWeek ? DAYS.indexOf(schedule.endDayOfWeek) : dayIndex;
                        const durationDays = endDayIndex - dayIndex + 1;

                        if (dayIndex === -1 || durationMinutes <= 0 || durationDays <= 0) return null;

                        const scheduleDate = weekDates[dayIndex];
                        if (!scheduleDate) return null;
                        
                        const scheduleDateStr = scheduleDate.toISOString().split('T')[0];

                        const substituteAssignment = substituteAssignments.find(sub => 
                            sub.originalTeacherId === schedule.teacherId &&
                            scheduleDateStr >= sub.startDate &&
                            scheduleDateStr <= sub.endDate
                        );
                        const isSubstituted = !!substituteAssignment;
                        const originalTeacher = teachers.find(t => t.id === schedule.teacherId);
                        const displayTeacher = isSubstituted 
                            ? teachers.find(t => t.id === substituteAssignment.teacherId)
                            : originalTeacher;

                        const totalMinutesInView = TOTAL_HOURS * 60;
                        const top = ((startMinutes - START_HOUR * 60) / totalMinutesInView) * 100;
                        const height = (durationMinutes / totalMinutesInView) * 100;
                        const left = (dayIndex / DAYS.length) * 100;
                        const width = (durationDays / DAYS.length) * 100;
                        
                        const section = sections.find(s => s.id === schedule.sectionId);
                        const isInteracting = activeInteraction?.schedule.id === schedule.id;

                        const tooltip = isSubstituted ? `Sub: ${displayTeacher?.name} (for ${originalTeacher?.name})` : schedule.title;
                        const substitutedStyle = isSubstituted ? { backgroundImage: 'linear-gradient(45deg, rgba(0, 0, 0, 0.08) 25%, transparent 25%, transparent 50%, rgba(0, 0, 0, 0.08) 50%, rgba(0, 0, 0, 0.08) 75%, transparent 75%, transparent)' } : {};

                        return (
                            <div key={schedule.id}
                                title={tooltip}
                                onClick={() => handleScheduleClick(schedule)}
                                onMouseDown={(e) => handleInteractionStart(e, 'drag', schedule)}
                                className={`absolute p-2 rounded-lg border overflow-hidden flex flex-col group ${!isReadOnly && 'cursor-grab'} ${getScheduleColor(schedule)} ${isInteracting ? 'opacity-50' : ''}`}
                                style={{ top: `${top}%`, height: `${height}%`, left: `${left}%`, width: `calc(${width}% - 4px)`, transition: 'opacity 0.2s', ...substitutedStyle }}>
                                <p className="font-bold text-xs truncate">{schedule.title}</p>
                                {schedule.type === 'academic' && <p className="text-xs truncate">{viewType === 'section' ? displayTeacher?.name : section?.name}</p>}
                                <p className="text-xs opacity-75 mt-auto">{`${schedule.startTime} - ${schedule.endTime}`}</p>
                                {!isReadOnly && (
                                    <>
                                        <div onMouseDown={(e) => handleInteractionStart(e, 'resize-left', schedule)} className="absolute top-0 bottom-0 left-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-black/10 hover:bg-black/20"/>
                                        <div onMouseDown={(e) => handleInteractionStart(e, 'resize-right', schedule)} className="absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-black/10 hover:bg-black/20"/>
                                        <div onMouseDown={(e) => handleInteractionStart(e, 'resize-v', schedule)} className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-black/10 hover:bg-black/20"/>
                                    </>
                                )}
                            </div>
                        );
                    })}

                    {/* Drag/Resize Indicator */}
                    {indicator && (
                         <div className={`absolute p-2 rounded-lg border-2 border-dashed border-indigo-500 bg-indigo-500/10 z-20 pointer-events-none flex flex-col`}
                            style={{ top: `${indicator.top}%`, height: `${indicator.height}%`, left: `${indicator.left}%`, width: `calc(${indicator.width}% - 4px)` }}>
                            <p className="font-bold text-xs truncate text-indigo-800 dark:text-indigo-200">{activeInteraction?.schedule.title}</p>
                            <p className="text-xs opacity-75 text-indigo-800 dark:text-indigo-200 mt-auto">{`${indicator.startTime} - ${indicator.endTime}`}</p>
                        </div>
                    )}
                </div>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalData.isEditing ? 'Edit Schedule' : 'Add Schedule'} size="lg">
                 <form onSubmit={handleModalSave}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium">Event Type</label>
                            <select value={modalData.type ?? 'academic'} onChange={e => setModalData(p => ({...p, type: e.target.value as any, scope: e.target.value === 'academic' ? 'section' : 'all'}))} className="mt-1 w-full input-style">
                                <option value="academic">Academic Class</option>
                                <option value="extracurricular">Extracurricular Activity</option>
                            </select>
                        </div>
                        <div/>

                        {modalData.type === 'extracurricular' && (
                            <>
                            <div className="md:col-span-2"><label htmlFor="title" className="block text-sm font-medium">Title</label><input type="text" name="title" value={modalData.title ?? ''} onChange={e => setModalData(p => ({...p, title: e.target.value}))} className="mt-1 w-full input-style" required/></div>
                            <div><label className="block text-sm font-medium">Applies To (Scope)</label>
                                <select value={modalData.scope ?? 'all'} onChange={e => setModalData(p => ({...p, scope: e.target.value as any}))} className="mt-1 w-full input-style">
                                    <option value="all">Whole School</option>
                                    <option value="gradeLevel">Grade Level</option>
                                    <option value="section">Specific Section</option>
                                </select>
                            </div>
                             {modalData.scope === 'gradeLevel' && <div><label className="block text-sm font-medium">Grade Level</label><select value={modalData.gradeLevel ?? ''} onChange={e => setModalData(p => ({...p, gradeLevel: Number(e.target.value)}))} className="mt-1 w-full input-style"><option value="">Select...</option>{gradeLevels.map(gl => <option key={gl} value={gl}>{gl}</option>)}</select></div>}
                             {modalData.scope === 'section' && <div><label className="block text-sm font-medium">Section</label><select value={modalData.sectionId ?? ''} onChange={e => setModalData(p => ({...p, sectionId: e.target.value}))} className="mt-1 w-full input-style"><option value="">Select...</option>{sections.map(s => <option key={s.id} value={s.id}>Grade {s.gradeLevel} - {s.name}</option>)}</select></div>}
                            </>
                        )}
                        
                        {modalData.type === 'academic' && (
                           <>
                            <div className="md:col-span-2"><label className="block text-sm font-medium">Class</label><select name="sectionId" value={modalData.sectionId ?? ''} disabled={viewType==='section'} onChange={e => setModalData(p => ({...p, sectionId: e.target.value}))} className="mt-1 w-full input-style" required><option value="">Select...</option>{sections.map(s => <option key={s.id} value={s.id}>Grade {s.gradeLevel} - {s.name}</option>)}</select></div>
                            <div className="md:col-span-2"><label className="block text-sm font-medium">Learning Area</label><select name="learningAreaId" value={modalData.learningAreaId ?? ''} onChange={e => setModalData(p => ({...p, learningAreaId: e.target.value}))} className="mt-1 w-full input-style" required><option value="">Select...</option>{learningAreas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
                            <div className="md:col-span-2"><label className="block text-sm font-medium">Teacher</label><select name="teacherId" value={modalData.teacherId ?? ''} disabled={viewType==='teacher'} onChange={e => setModalData(p => ({...p, teacherId: e.target.value}))} className="mt-1 w-full input-style" required><option value="">Select...</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                           </>
                        )}

                        <hr className="md:col-span-2 my-2"/>

                        <div><label className="block text-sm font-medium">Start Day</label><select name="dayOfWeek" value={modalData.dayOfWeek ?? ''} onChange={e => setModalData(p => ({...p, dayOfWeek: e.target.value as any, endDayOfWeek: e.target.value as any }))} className="mt-1 w-full input-style" required><option value="">Select...</option>{DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                        <div><label className="block text-sm font-medium">End Day</label><select name="endDayOfWeek" value={modalData.endDayOfWeek ?? modalData.dayOfWeek ?? ''} onChange={e => setModalData(p => ({...p, endDayOfWeek: e.target.value as any}))} className="mt-1 w-full input-style" required><option value="">Select...</option>{DAYS.slice(DAYS.indexOf(modalData.dayOfWeek!)).map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                        <div><label className="block text-sm font-medium">Start Time</label><input type="time" name="startTime" step="900" value={modalData.startTime ?? ''} onChange={e => setModalData(p => ({...p, startTime: e.target.value}))} className="mt-1 w-full input-style" required/></div>
                        <div><label className="block text-sm font-medium">End Time</label><input type="time" name="endTime" step="900" value={modalData.endTime ?? ''} onChange={e => setModalData(p => ({...p, endTime: e.target.value}))} className="mt-1 w-full input-style" required/></div>
                     </div>
                     {modalError && <p className="text-red-500 text-sm mt-4">{modalError}</p>}
                     <div className="flex justify-between items-center mt-6">
                        <div>{modalData.isEditing && <button type="button" onClick={handleModalDelete} className="flex items-center text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-semibold"><TrashIcon/> <span className="ml-1">Delete</span></button>}</div>
                        <div className="space-x-2 ml-auto">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
                            <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Save</button>
                        </div>
                     </div>
                 </form>
            </Modal>
            <style>{`.input-style { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid; border-color: #d1d5db; background-color: transparent; padding: 0.5rem 0.75rem; } .dark .input-style { border-color: #4b5563; }`}</style>
        </div>
    );
};

export default SchedulerView;