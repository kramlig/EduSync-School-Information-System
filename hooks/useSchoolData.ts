import { useState, useEffect } from 'react';
import type { Student, LearningArea, Grade, CoreValue, CoreValueGrade, AttendanceRecord, Teacher, Section, SchoolSettings, SubstituteAssignment, ClassSchedule, Assignment, StudentAssignmentGrade, LessonPlan, Parent, Announcement, AttendanceStatus } from '../types';
import * as dbService from '../src/services/dbService';
import * as firestoreReader from '../src/services/firestoreReader';
import type { StoreName } from '../src/services/dbService';
import { enqueueWrite, startAutoSync } from '../src/services/firestoreSync';

const MOCK_SETTINGS: SchoolSettings = {
    schoolName: 'ENRIQUE URENCIA ELEMENTARY SCHOOL',
    region: 'Region XI',
    division: 'Division of the City of Mati',
    district: 'Governor Generoso North District',
    schoolYear: '2023-2024'
};

export type SchoolDataState = {
    students: Student[]; learningAreas: LearningArea[]; grades: Grade[]; coreValues: CoreValue[];
    coreValueGrades: CoreValueGrade[]; attendanceRecords: AttendanceRecord[]; teachers: Teacher[];
    parents: Parent[]; sections: Section[]; settings: SchoolSettings; substituteAssignments: SubstituteAssignment[];
    classSchedules: ClassSchedule[]; assignments: Assignment[]; studentAssignmentGrades: StudentAssignmentGrade[];
    lessonPlans: LessonPlan[]; announcements: Announcement[];
    monthlySchoolDaysConfig: Record<string, number>;
};

export const useSchoolData = (): SchoolDataState & { 
  loading: boolean;
  error: string | null;
  addStudent: (student: Omit<Student, 'id' | 'enrollmentDate'>) => { success: boolean; message?: string; };
  updateStudent: (student: Student) => void;
  deleteStudent: (studentId: string) => void;
        // Class scheduler CRUD
        addSchedule: (sched: Omit<ClassSchedule, 'id'>) => { success: boolean; message?: string };
        updateSchedule: (sched: ClassSchedule) => { success: boolean; message?: string };
        deleteSchedule: (scheduleId: string) => void;
    updateGrade: (studentId: string, learningAreaId: string, quarter: 'q1'|'q2'|'q3'|'q4', value?: number, subSubject?: string) => void;
    updateCoreValueGrade: (studentId: string, coreValueId: string, quarter: 'q1'|'q2'|'q3'|'q4', behavior: string, value: import('../types').CoreValueMarking | '') => void;
    addLearningArea: (area: Omit<LearningArea, 'id'>) => void;
    deleteLearningArea: (learningAreaId: string) => void;
        updateSettings: (settings: SchoolSettings) => void;
        updateAttendance: (studentId: string, date: string, status: AttendanceStatus) => void;
    addParent: (parent: Omit<Parent, 'id'>) => void;
    updateParent: (parent: Parent) => void;
    deleteParent: (parentId: string) => void;
    assignStudentToParent: (parentId: string, studentId: string) => void;
    unassignStudentFromParent: (parentId: string, studentId: string) => void;
    addTeacher: (teacher: Omit<Teacher, 'id'>) => void;
    updateTeacher: (teacher: Teacher) => void;
    deleteTeacher: (teacherId: string) => void;
    addSection: (section: Omit<Section, 'id'>) => void;
    updateSection: (section: Section) => void;
    deleteSection: (sectionId: string) => void;
    addSubstituteAssignment: (assignment: Omit<SubstituteAssignment, 'id'>) => void;
    updateSubstituteAssignment: (assignment: SubstituteAssignment) => void;
    deleteSubstituteAssignment: (assignmentId: string) => void;
} => {
    const [state, setState] = useState<SchoolDataState & { loading: boolean; error: string | null }>({
        loading: true,
        error: null,
        students: [], learningAreas: [], grades: [], coreValues: [], coreValueGrades: [],
        attendanceRecords: [], teachers: [], parents: [], sections: [], settings: MOCK_SETTINGS,
        substituteAssignments: [], classSchedules: [], assignments: [], studentAssignmentGrades: [],
        lessonPlans: [], announcements: [],
        monthlySchoolDaysConfig: DEFAULT_MONTHLY_SCHOOL_DAYS_CONFIG,
    });

    const addStudent = (student: Omit<Student, 'id' | 'enrollmentDate'>): { success: boolean; message?: string } => {
        // Basic validation
        if (state.students.some(s => s.email === student.email)) {
            return { success: false, message: 'A student with this email already exists.' };
        }

        const newStudent: Student = {
            ...student,
            id: `s_${Date.now()}`, // Simple unique ID generation
            enrollmentDate: new Date().toISOString().split('T')[0],
        };

        const newStudents = [...state.students, newStudent];
        setState(prevState => ({ ...prevState, students: newStudents }));
    dbService.put('students', newStudent); // Add to IndexedDB
    enqueueWrite('students', newStudent).catch(() => {});

        return { success: true };
    };

    const updateStudent = (student: Student) => {
        const newStudents = state.students.map(s => s.id === student.id ? student : s);
        setState(prevState => ({ ...prevState, students: newStudents }));
    dbService.put('students', student); // Update in IndexedDB
    enqueueWrite('students', student).catch(() => {});
    };

    const deleteStudent = (studentId: string) => {
        const newStudents = state.students.filter(s => s.id !== studentId);
        // Also delete related data
        const newGrades = state.grades.filter(g => g.studentId !== studentId);
        const newCoreValueGrades = state.coreValueGrades.filter(cvg => cvg.studentId !== studentId);
        const newAttendance = state.attendanceRecords.filter(ar => ar.studentId !== studentId);

        setState(prevState => ({
            ...prevState,
            students: newStudents,
            grades: newGrades,
            coreValueGrades: newCoreValueGrades,
            attendanceRecords: newAttendance,
        }));

        dbService.remove('students', studentId);
        // Also remove related data from IndexedDB
        dbService.deleteGradesForStudent(studentId);
        dbService.deleteCoreValueGradesForStudent(studentId);
        dbService.deleteAttendanceForStudent(studentId);
        enqueueWrite('students', { id: studentId, __delete: true } as any).catch(() => {});
    };

    const computeFinalAndRemarks = (g: Grade): { finalGrade?: number; remarks?: 'Passed'|'Failed' } => {
        const quarters: (keyof Pick<Grade,'q1'|'q2'|'q3'|'q4'>)[] = ['q1','q2','q3','q4'];
        const values: number[] = [];
        for (const q of quarters) {
            const v = g[q];
            if (typeof v === 'number') values.push(v);
            else if (v && typeof v === 'object') {
                const nums = Object.values(v as any).filter(n => typeof n === 'number') as number[];
                if (nums.length) values.push(Math.round(nums.reduce((a,b)=>a+b,0)/nums.length));
            }
        }
        if (!values.length) return {};
        const finalGrade = Math.round(values.reduce((a,b)=>a+b,0)/values.length);
        const remarks = finalGrade >= 75 ? 'Passed' : 'Failed';
        return { finalGrade, remarks };
    };

    const updateGrade = (studentId: string, learningAreaId: string, quarter: 'q1'|'q2'|'q3'|'q4', value?: number, subSubject?: string) => {
        setState(prev => {
            const learningArea = prev.learningAreas.find(la => la.id === learningAreaId);
            let existing = prev.grades.find(g => g.studentId === studentId && g.learningAreaId === learningAreaId);
            if (!existing) existing = { id: `g_${studentId}_${learningAreaId}`, studentId, learningAreaId } as Grade;
            else existing = { ...existing };

            if (learningArea?.isComposite && subSubject) {
                const current = (existing[quarter] as Record<string, number | undefined>) || {};
                const next = { ...current } as any;
                if (value === undefined) delete next[subSubject]; else next[subSubject] = value;
                (existing as any)[quarter] = next;
            } else {
                (existing as any)[quarter] = value as any;
            }

            const calc = computeFinalAndRemarks(existing);
            existing.finalGrade = calc.finalGrade;
            existing.remarks = calc.remarks;

            const nextGrades = [...prev.grades.filter(g => !(g.studentId === studentId && g.learningAreaId === learningAreaId)), existing];
            dbService.put('grades', existing);
            enqueueWrite('grades', existing).catch(() => {});
            return { ...prev, grades: nextGrades };
        });
    };

    const addLearningArea = (area: Omit<LearningArea, 'id'>) => {
        const newArea: LearningArea = { id: `la_${Date.now()}`, ...area };
        setState(prev => ({ ...prev, learningAreas: [...prev.learningAreas, newArea] }));
        dbService.put('learningAreas', newArea);
        enqueueWrite('learningAreas', newArea).catch(() => {});
    };

    const deleteLearningArea = (learningAreaId: string) => {
        setState(prev => {
            const nextAreas = prev.learningAreas.filter(la => la.id !== learningAreaId);
            const nextGrades = prev.grades.filter(g => g.learningAreaId !== learningAreaId);
            dbService.remove('learningAreas', learningAreaId);
            if ((dbService as any).deleteGradesForLearningArea) {
                (dbService as any).deleteGradesForLearningArea(learningAreaId);
            }
            enqueueWrite('learningAreas', { id: learningAreaId, __delete: true } as any).catch(() => {});
            return { ...prev, learningAreas: nextAreas, grades: nextGrades };
        });
    };

    const updateSettings = (next: SchoolSettings) => {
        setState(prev => ({ ...prev, settings: next }));
        // If key changed, remove old key to avoid duplicates
        try {
            const prevKey = state.settings?.schoolName;
            if (prevKey && prevKey !== next.schoolName) {
                dbService.remove('settings', prevKey).catch(() => {});
            }
        } catch {}
        dbService.put('settings', next).catch(() => {});
        // Use deterministic id for remote settings document
        enqueueWrite('settings', { id: 'default', ...next }).catch(() => {});
    };

    const updateCoreValueGrade = (studentId: string, coreValueId: string, quarter: 'q1'|'q2'|'q3'|'q4', behavior: string, value: import('../types').CoreValueMarking | '') => {
        setState(prev => {
            const existing = prev.coreValueGrades.find(r => r.studentId === studentId && r.coreValueId === coreValueId);
            let nextRecord: CoreValueGrade;
            if (!existing) {
                nextRecord = { id: `cvg_${studentId}_${coreValueId}`, studentId, coreValueId, q1: {}, q2: {}, q3: {}, q4: {} } as CoreValueGrade;
            } else {
                nextRecord = { ...existing, [quarter]: { ...(existing as any)[quarter] } } as any;
            }

            if (value === '' || value == null) {
                delete (nextRecord as any)[quarter][behavior];
            } else {
                (nextRecord as any)[quarter][behavior] = value;
            }

            let replaced = false;
            const updatedList = prev.coreValueGrades.map(r => {
                if (r.studentId === studentId && r.coreValueId === coreValueId) { replaced = true; return nextRecord; }
                return r;
            });
            const next = replaced ? updatedList : [...prev.coreValueGrades, nextRecord];
            try { dbService.put('coreValueGrades', nextRecord); } catch {}
            enqueueWrite('coreValueGrades', nextRecord as any).catch(() => {});
            return { ...prev, coreValueGrades: next };
        });
    };

    const updateAttendance = (studentId: string, date: string, status: AttendanceStatus) => {
        setState(prev => {
            let record = prev.attendanceRecords.find(r => r.studentId === studentId);
            if (!record) {
                record = { studentId, dailyStatus: {} };
            } else {
                record = { ...record, dailyStatus: { ...record.dailyStatus } };
            }
            record.dailyStatus[date] = status;

            const nextRecords = [
                ...prev.attendanceRecords.filter(r => r.studentId !== studentId),
                record,
            ];
            try { dbService.put('attendanceRecords', record); } catch {}
            enqueueWrite('attendanceRecords', record as any).catch(() => {});
            return { ...prev, attendanceRecords: nextRecords };
        });
    };

    // Parents CRUD and child assignments
    const addParent = (parent: Omit<Parent, 'id'>) => {
        const newParent: Parent = { id: `p_${Date.now()}`, ...parent };
        setState(prev => ({ ...prev, parents: [...prev.parents, newParent] }));
        try { dbService.put('parents', newParent); } catch {}
        enqueueWrite('parents', newParent as any).catch(() => {});
    };

    const updateParent = (parent: Parent) => {
        setState(prev => ({
            ...prev,
            parents: prev.parents.map(p => p.id === parent.id ? parent : p)
        }));
        try { dbService.put('parents', parent); } catch {}
        enqueueWrite('parents', parent as any).catch(() => {});
    };

    const deleteParent = (parentId: string) => {
        setState(prev => ({ ...prev, parents: prev.parents.filter(p => p.id !== parentId) }));
        try { dbService.remove('parents', parentId); } catch {}
        enqueueWrite('parents', { id: parentId, __delete: true } as any).catch(() => {});
    };

    const assignStudentToParent = (parentId: string, studentId: string) => {
        setState(prev => {
            const target = prev.parents.find(p => p.id === parentId);
            if (!target) return prev;
            const nextParent: Parent = {
                ...target,
                studentIds: Array.from(new Set([...(target.studentIds || []), studentId]))
            };
            const nextParents = prev.parents.map(p => p.id === parentId ? nextParent : p);
            try { dbService.put('parents', nextParent); } catch {}
            enqueueWrite('parents', nextParent as any).catch(() => {});
            return { ...prev, parents: nextParents };
        });
    };

    const unassignStudentFromParent = (parentId: string, studentId: string) => {
        setState(prev => {
            const target = prev.parents.find(p => p.id === parentId);
            if (!target) return prev;
            const nextParent: Parent = {
                ...target,
                studentIds: (target.studentIds || []).filter(id => id !== studentId)
            };
            const nextParents = prev.parents.map(p => p.id === parentId ? nextParent : p);
            try { dbService.put('parents', nextParent); } catch {}
            enqueueWrite('parents', nextParent as any).catch(() => {});
            return { ...prev, parents: nextParents };
        });
    };

    // Teacher CRUD
    const addTeacher = (teacher: Omit<Teacher, 'id'>) => {
        const newTeacher: Teacher = { id: `t_${Date.now()}`, ...teacher } as Teacher;
        setState(prev => ({ ...prev, teachers: [...prev.teachers, newTeacher] }));
        try { dbService.put('teachers', newTeacher); } catch {}
        enqueueWrite('teachers', newTeacher as any).catch(() => {});
    };

    const updateTeacher = (teacher: Teacher) => {
        setState(prev => ({ ...prev, teachers: prev.teachers.map(t => t.id === teacher.id ? teacher : t) }));
        try { dbService.put('teachers', teacher); } catch {}
        enqueueWrite('teachers', teacher as any).catch(() => {});
    };

    const deleteTeacher = (teacherId: string) => {
        setState(prev => ({ ...prev, teachers: prev.teachers.filter(t => t.id !== teacherId) }));
        try { dbService.remove('teachers', teacherId); } catch {}
        enqueueWrite('teachers', { id: teacherId, __delete: true } as any).catch(() => {});
    };

    // Section CRUD
    const addSection = (section: Omit<Section, 'id'>) => {
        const newSection: Section = { id: `sec_${Date.now()}`, ...section } as Section;
        setState(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
        try { dbService.put('sections', newSection); } catch {}
        enqueueWrite('sections', newSection as any).catch(() => {});
    };

    const updateSection = (section: Section) => {
        setState(prev => ({ ...prev, sections: prev.sections.map(s => s.id === section.id ? section : s) }));
        try { dbService.put('sections', section); } catch {}
        enqueueWrite('sections', section as any).catch(() => {});
    };

    const deleteSection = (sectionId: string) => {
        setState(prev => {
            const nextSections = prev.sections.filter(s => s.id !== sectionId);
            const updatedStudents = prev.students.map(stu => stu.sectionId === sectionId ? { ...stu, sectionId: undefined } : stu);
            // Persist updates
            try { dbService.remove('sections', sectionId); } catch {}
            updatedStudents.forEach(stu => { try { dbService.put('students', stu); } catch {} });
            enqueueWrite('sections', { id: sectionId, __delete: true } as any).catch(() => {});
            return { ...prev, sections: nextSections, students: updatedStudents };
        });
    };

    // SubstituteAssignment CRUD
    const addSubstituteAssignment = (assignment: Omit<SubstituteAssignment, 'id'>) => {
        const newAssignment: SubstituteAssignment = { id: `sub_${Date.now()}`, ...assignment } as SubstituteAssignment;
        setState(prev => ({ ...prev, substituteAssignments: [newAssignment, ...prev.substituteAssignments] }));
        try { dbService.put('substituteAssignments', newAssignment); } catch {}
        enqueueWrite('substituteAssignments', newAssignment as any).catch(() => {});
    };

    const updateSubstituteAssignment = (assignment: SubstituteAssignment) => {
        setState(prev => ({ ...prev, substituteAssignments: prev.substituteAssignments.map(sa => sa.id === assignment.id ? assignment : sa) }));
        try { dbService.put('substituteAssignments', assignment); } catch {}
        enqueueWrite('substituteAssignments', assignment as any).catch(() => {});
    };

    const deleteSubstituteAssignment = (assignmentId: string) => {
        setState(prev => ({ ...prev, substituteAssignments: prev.substituteAssignments.filter(sa => sa.id !== assignmentId) }));
        try { dbService.remove('substituteAssignments', assignmentId); } catch {}
        enqueueWrite('substituteAssignments', { id: assignmentId, __delete: true } as any).catch(() => {});
    };

    // --- Class Schedule CRUD ---
    const DAYS: ClassSchedule['dayOfWeek'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeToMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const scheduleOverlaps = (a: Omit<ClassSchedule, 'id'> | ClassSchedule, b: ClassSchedule): boolean => {
        // Determine overlapping days
        const aStartIdx = DAYS.indexOf(a.dayOfWeek);
        const aEndIdx = a.endDayOfWeek ? DAYS.indexOf(a.endDayOfWeek) : aStartIdx;
        const bStartIdx = DAYS.indexOf(b.dayOfWeek);
        const bEndIdx = b.endDayOfWeek ? DAYS.indexOf(b.endDayOfWeek) : bStartIdx;
        const dayOverlap = !(aEndIdx < bStartIdx || bEndIdx < aStartIdx);
        if (!dayOverlap) return false;
        // Overlapping time window (treat as [start, end))
        const aStart = timeToMinutes(a.startTime);
        const aEnd = timeToMinutes(a.endTime);
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        const timeOverlap = aStart < bEnd && bStart < aEnd;
        return timeOverlap;
    };

    const validateSchedule = (sched: Omit<ClassSchedule, 'id'> | ClassSchedule, ignoreId?: string): { ok: boolean; message?: string } => {
        // Basic validation
        if (!sched.title || !sched.dayOfWeek || !sched.startTime || !sched.endTime) {
            return { ok: false, message: 'Missing required schedule fields.' };
        }
        if (sched.startTime >= sched.endTime) {
            return { ok: false, message: 'End time must be after start time.' };
        }
        if (sched.endDayOfWeek) {
            const startIdx = DAYS.indexOf(sched.dayOfWeek);
            const endIdx = DAYS.indexOf(sched.endDayOfWeek);
            if (endIdx < startIdx) return { ok: false, message: 'End day cannot be before start day.' };
        }

        // Minimal conflict checks: prevent same teacher or same section overlapping academic classes on same day/time
        for (const existing of state.classSchedules) {
            if (ignoreId && existing.id === ignoreId) continue;
            // Compare only when overlapping in time/day
            if (!scheduleOverlaps(sched, existing)) continue;
            // Academic-specific: teacher or section conflicts
            if (sched.type === 'academic' && existing.type === 'academic') {
                if (sched.teacherId && existing.teacherId && sched.teacherId === existing.teacherId) {
                    return { ok: false, message: 'Teacher has a conflicting class at that time.' };
                }
                if (sched.sectionId && existing.sectionId && sched.sectionId === existing.sectionId) {
                    return { ok: false, message: 'Section already has a class at that time.' };
                }
            }
        }
        return { ok: true };
    };

    const addSchedule = (sched: Omit<ClassSchedule, 'id'>): { success: boolean; message?: string } => {
        const v = validateSchedule(sched);
        if (!v.ok) return { success: false, message: v.message };
        const newSchedule: ClassSchedule = { id: `sch_${Date.now()}`, ...sched } as ClassSchedule;
        setState(prev => ({ ...prev, classSchedules: [...prev.classSchedules, newSchedule] }));
        try { dbService.put('classSchedules', newSchedule); } catch {}
        enqueueWrite('classSchedules', newSchedule as any).catch(() => {});
        return { success: true };
    };

    const updateSchedule = (sched: ClassSchedule): { success: boolean; message?: string } => {
        const v = validateSchedule(sched, sched.id);
        if (!v.ok) return { success: false, message: v.message };
        setState(prev => ({ ...prev, classSchedules: prev.classSchedules.map(s => s.id === sched.id ? { ...sched } : s) }));
        try { dbService.put('classSchedules', sched); } catch {}
        enqueueWrite('classSchedules', sched as any).catch(() => {});
        return { success: true };
    };

    const deleteSchedule = (scheduleId: string) => {
        setState(prev => ({ ...prev, classSchedules: prev.classSchedules.filter(s => s.id !== scheduleId) }));
        try { dbService.remove('classSchedules', scheduleId); } catch {}
        enqueueWrite('classSchedules', { id: scheduleId, __delete: true } as any).catch(() => {});
    };


    useEffect(() => {
        const loadData = async () => {
            try {
                const studentCount = await dbService.count('students');
                if (studentCount > 0) {
                    console.log("Loading data from IndexedDB...");
                    let [ students, learningAreas, grades, coreValues, coreValueGrades, attendanceRecords, teachers, parents, sections, settings, substituteAssignments, classSchedules, assignments, studentAssignmentGrades, lessonPlans, announcements ] = await Promise.all([
                        dbService.getAll<Student>('students'), dbService.getAll<LearningArea>('learningAreas'),
                        dbService.getAll<Grade>('grades'), dbService.getAll<CoreValue>('coreValues'),
                        dbService.getAll<CoreValueGrade>('coreValueGrades'), dbService.getAll<AttendanceRecord>('attendanceRecords'),
                        dbService.getAll<Teacher>('teachers'), dbService.getAll<Parent>('parents'),
                        dbService.getAll<Section>('sections'), dbService.getAll<SchoolSettings>('settings'),
                        dbService.getAll<SubstituteAssignment>('substituteAssignments'), dbService.getAll<ClassSchedule>('classSchedules'),
                        dbService.getAll<Assignment>('assignments'), dbService.getAll<StudentAssignmentGrade>('studentAssignmentGrades'),
                        dbService.getAll<LessonPlan>('lessonPlans'), dbService.getAll<Announcement>('announcements'),
                    ]);

                    if (teachers.length === 0) {
                        console.warn('[DataSync] No teachers found in IndexedDB. Attempting Firestore backfill.');
                        try {
                            const remote = await firestoreReader.fetchAllData();
                            if (remote.teachers && remote.teachers.length > 0) {
                                teachers = remote.teachers;
                                await dbService.bulkPut('teachers', teachers);
                                console.log(`[DataSync] Backfilled ${teachers.length} teachers from Firestore.`);
                            } else if ((remote as any).users && (remote as any).users.length > 0 && teachers.length === 0) {
                                // users->teachers fallback already handled in reader, but just in case
                                teachers = (remote as any).users.filter((u: any) => ['admin','teacher','principal','registrar'].includes(u.role)).map((u: any) => ({
                                    id: u.id || u.uid || u.email,
                                    name: u.name || u.displayName || u.email?.split('@')[0] || 'Unnamed',
                                    email: u.email,
                                    role: u.role === 'admin' ? 'admin' : (u.role || 'teacher'),
                                    assignments: [],
                                }));
                                if (teachers.length) {
                                    await dbService.bulkPut('teachers', teachers);
                                    console.log(`[DataSync] Backfilled ${teachers.length} teachers from users fallback.`);
                                }
                            } else {
                                console.warn('[DataSync] Firestore backfill produced no teachers.');
                                // Dev convenience: if running with emulator, seed a default admin so local login works.
                                const useEmu = String((import.meta as any).env?.VITE_USE_FIREBASE_EMULATOR || '').toLowerCase() === 'true';
                                if (useEmu) {
                                    const seedAdmin = {
                                        id: 'admin-user',
                                        name: 'System Admin',
                                        email: 'admin@school.edu',
                                        role: 'admin' as const,
                                        assignments: [] as any[],
                                        createdAt: new Date().toISOString(),
                                    };
                                    try {
                                        await dbService.bulkPut('teachers', [seedAdmin as any]);
                                        // also enqueue to remote emulator for visibility
                                        enqueueWrite('teachers', seedAdmin as any).catch(() => {});
                                        enqueueWrite('users', { ...seedAdmin } as any).catch(() => {});
                                        teachers = [seedAdmin as any];
                                        console.info('[DataSync] Seeded default admin into Firestore emulator and local cache.');
                                    } catch (e) {
                                        console.warn('[DataSync] Failed to seed default admin into emulator:', e);
                                    }
                                }
                            }
                        } catch (e) {
                            console.error('[DataSync] Teacher backfill failed:', e);
                        }
                    } else {
                        // Incremental merge: detect new remote teachers (e.g., newly provisioned admin) not yet in cache
                        try {
                            const remote = await firestoreReader.fetchAllData();
                            const remoteTeachers = remote.teachers || [];
                            if (remoteTeachers.length) {
                                const existingIds = new Set(teachers.map(t => t.id));
                                const newTeachers = remoteTeachers.filter(rt => rt.id && !existingIds.has(rt.id));
                                if (newTeachers.length) {
                                    await dbService.bulkPut('teachers', newTeachers);
                                    teachers = [...teachers, ...newTeachers];
                                    console.log(`[DataSync] Merged ${newTeachers.length} new teachers from Firestore (incremental).`);
                                }
                            }
                        } catch (e) {
                            console.warn('[DataSync] Incremental teacher merge skipped due to error:', e);
                        }
                    }

                    // Ensure Core Values and Core Value Grades are present even when IndexedDB already has students
                    try {
                        const remote = await firestoreReader.fetchAllData();

                        // Merge Core Values if local is empty
                        if (coreValues.length === 0 && remote.coreValues && remote.coreValues.length) {
                            await dbService.bulkPut('coreValues', remote.coreValues);
                            coreValues = remote.coreValues;
                            console.log(`[DataSync] Backfilled ${coreValues.length} core values from Firestore.`);
                        }

                        // Merge Core Value Grades: if local is empty, take all remote; else, add only missing IDs
                        if (remote.coreValueGrades && remote.coreValueGrades.length) {
                            if (coreValueGrades.length === 0) {
                                await dbService.bulkPut('coreValueGrades', remote.coreValueGrades);
                                coreValueGrades = remote.coreValueGrades;
                                console.log(`[DataSync] Backfilled ${coreValueGrades.length} core value grade records from Firestore.`);
                            } else {
                                const existingIds = new Set(coreValueGrades.map(r => r.id));
                                const newOnes = remote.coreValueGrades.filter(r => r.id && !existingIds.has(r.id));
                                if (newOnes.length) {
                                    await dbService.bulkPut('coreValueGrades', newOnes);
                                    coreValueGrades = [...coreValueGrades, ...newOnes];
                                    console.log(`[DataSync] Merged ${newOnes.length} new core value grade records from Firestore.`);
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('[DataSync] Core Values merge skipped due to error:', e);
                    }

                    setState({ loading: false, error: null, students, learningAreas, grades, coreValues, coreValueGrades, attendanceRecords, teachers, parents, sections, settings: settings[0] || MOCK_SETTINGS, substituteAssignments, classSchedules, assignments, studentAssignmentGrades, lessonPlans, announcements, monthlySchoolDaysConfig: DEFAULT_MONTHLY_SCHOOL_DAYS_CONFIG });
                } else {
                    console.log("IndexedDB is empty. Fetching from Firestore...");
                    const firestoreData = await firestoreReader.fetchAllData();
                    
                    // --- DEFINITIVE FIX START ---

                    // 1. Validate and sanitize all data before saving to IndexedDB
                    const validate = (item: any, key: string | string[]): boolean => {
                        if (Array.isArray(key)) {
                            return key.every(k => item.hasOwnProperty(k) && item[k] !== undefined);
                        }
                        return item.hasOwnProperty(key) && item[key] !== undefined;
                    };

                    const sanitizedData = {
                        students: firestoreData.students.filter(item => validate(item, 'id')),
                        learningAreas: firestoreData.learningAreas.filter(item => validate(item, 'id')),
                        grades: firestoreData.grades.filter(item => validate(item, 'id')),
                        coreValues: firestoreData.coreValues.filter(item => validate(item, 'id')),
                        coreValueGrades: firestoreData.coreValueGrades.filter(item => validate(item, 'id')),
                        attendanceRecords: firestoreData.attendanceRecords.filter(item => validate(item, 'studentId')),
                        teachers: firestoreData.teachers.filter(item => validate(item, 'id')),
                        parents: firestoreData.parents.filter(item => validate(item, 'id')),
                        sections: firestoreData.sections.filter(item => validate(item, 'id')),
                        substituteAssignments: firestoreData.substituteAssignments.filter(item => validate(item, 'id')),
                        classSchedules: firestoreData.classSchedules.filter(item => validate(item, 'id')),
                        assignments: firestoreData.assignments.filter(item => validate(item, 'id')),
                        studentAssignmentGrades: firestoreData.studentAssignmentGrades.filter(item => validate(item, ['assignmentId', 'studentId'])),
                        lessonPlans: firestoreData.lessonPlans.filter(item => validate(item, 'id')),
                        announcements: firestoreData.announcements.filter(item => validate(item, 'id')),
                        settings: firestoreData.settings?.[0] || MOCK_SETTINGS,
                    };

                    // Log if any data was filtered out
                    Object.keys(sanitizedData).forEach(key => {
                        const originalCount = (firestoreData as any)[key].length;
                        const sanitizedCount = (sanitizedData as any)[key].length;
                        if (originalCount > 0 && originalCount !== sanitizedCount) {
                            console.warn(`[Data Sanitization] Filtered ${originalCount - sanitizedCount} invalid records from '${key}'`);
                        }
                    });
                    
                    // --- DEFINITIVE FIX END ---


                    // If learning areas are missing, seed defaults
                    if (sanitizedData.learningAreas.length === 0) {
                        sanitizedData.learningAreas = DEFAULT_LEARNING_AREAS;
                        console.warn('[DataSync] Seeded default learning areas (none found in Firestore).');
                    }

                    // Incremental, instrumented writes so one failure doesn't abort all.
                    const storeWritePlan: Array<{name: StoreName | 'settings'; action: () => Promise<any>; count: number}> = [
                        { name: 'students', action: () => dbService.bulkPut('students', sanitizedData.students), count: sanitizedData.students.length },
                        { name: 'learningAreas', action: () => dbService.bulkPut('learningAreas', sanitizedData.learningAreas), count: sanitizedData.learningAreas.length },
                        { name: 'grades', action: () => dbService.bulkPut('grades', sanitizedData.grades), count: sanitizedData.grades.length },
                        { name: 'coreValues', action: () => dbService.bulkPut('coreValues', sanitizedData.coreValues), count: sanitizedData.coreValues.length },
                        { name: 'coreValueGrades', action: () => dbService.bulkPut('coreValueGrades', sanitizedData.coreValueGrades), count: sanitizedData.coreValueGrades.length },
                        { name: 'attendanceRecords', action: () => dbService.bulkPut('attendanceRecords', sanitizedData.attendanceRecords), count: sanitizedData.attendanceRecords.length },
                        { name: 'teachers', action: () => dbService.bulkPut('teachers', sanitizedData.teachers), count: sanitizedData.teachers.length },
                        { name: 'parents', action: () => dbService.bulkPut('parents', sanitizedData.parents), count: sanitizedData.parents.length },
                        { name: 'sections', action: () => dbService.bulkPut('sections', sanitizedData.sections), count: sanitizedData.sections.length },
                        { name: 'settings', action: () => dbService.put('settings', sanitizedData.settings), count: 1 },
                        { name: 'substituteAssignments', action: () => dbService.bulkPut('substituteAssignments', sanitizedData.substituteAssignments), count: sanitizedData.substituteAssignments.length },
                        { name: 'classSchedules', action: () => dbService.bulkPut('classSchedules', sanitizedData.classSchedules), count: sanitizedData.classSchedules.length },
                        { name: 'assignments', action: () => dbService.bulkPut('assignments', sanitizedData.assignments), count: sanitizedData.assignments.length },
                        { name: 'studentAssignmentGrades', action: () => dbService.bulkPut('studentAssignmentGrades', sanitizedData.studentAssignmentGrades), count: sanitizedData.studentAssignmentGrades.length },
                        { name: 'lessonPlans', action: () => dbService.bulkPut('lessonPlans', sanitizedData.lessonPlans), count: sanitizedData.lessonPlans.length },
                        { name: 'announcements', action: () => dbService.bulkPut('announcements', sanitizedData.announcements), count: sanitizedData.announcements.length },
                    ];

                    const writeErrors: string[] = [];
                    for (const plan of storeWritePlan) {
                        const start = performance.now();
                        try {
                            console.log(`[DataSync] Writing ${plan.count} records to store '${plan.name}'...`);
                            await plan.action();
                            const dur = (performance.now() - start).toFixed(1);
                            console.log(`[DataSync] ✅ Store '${plan.name}' saved (${plan.count}) in ${dur}ms.`);
                        } catch (e) {
                            const msg = e instanceof Error ? e.message : String(e);
                            console.error(`[DataSync] ❌ Failed writing store '${plan.name}': ${msg}`);
                            writeErrors.push(`${plan.name}: ${msg}`);
                        }
                    }

                    if (writeErrors.length) {
                        console.warn('[DataSync] Completed with errors:', writeErrors);
                    } else {
                        console.log('Data fetched from Firestore and fully saved to IndexedDB.');
                    }
                    
                    // Set the state from the data we just fetched
                    setState({
                        loading: false,
                        error: null,
                        students: sanitizedData.students,
                        learningAreas: sanitizedData.learningAreas,
                        grades: sanitizedData.grades,
                        coreValues: sanitizedData.coreValues,
                        coreValueGrades: sanitizedData.coreValueGrades,
                        attendanceRecords: sanitizedData.attendanceRecords,
                        teachers: sanitizedData.teachers,
                        parents: sanitizedData.parents,
                        sections: sanitizedData.sections,
                        settings: sanitizedData.settings,
                        substituteAssignments: sanitizedData.substituteAssignments,
                        classSchedules: sanitizedData.classSchedules,
                        assignments: sanitizedData.assignments,
                        studentAssignmentGrades: sanitizedData.studentAssignmentGrades,
                        lessonPlans: sanitizedData.lessonPlans,
                        announcements: sanitizedData.announcements,
                        monthlySchoolDaysConfig: DEFAULT_MONTHLY_SCHOOL_DAYS_CONFIG,
                    });
                }
            } catch (error) {
                console.error("Failed to load school data:", error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                setState(prevState => ({ ...prevState, loading: false, error: errorMessage }));
            }
        };

        startAutoSync(60_000);
        loadData();
    }, []);

    return { ...state, addStudent, updateStudent, deleteStudent, addSchedule, updateSchedule, deleteSchedule, updateGrade, updateCoreValueGrade, addLearningArea, deleteLearningArea, updateSettings, updateAttendance, addParent, updateParent, deleteParent, assignStudentToParent, unassignStudentFromParent, addTeacher, updateTeacher, deleteTeacher, addSection, updateSection, deleteSection, addSubstituteAssignment, updateSubstituteAssignment, deleteSubstituteAssignment };
};

export type SchoolDataHook = ReturnType<typeof useSchoolData>;

const DEFAULT_LEARNING_AREAS: LearningArea[] = [
    { id: 'la_filipino', name: 'Filipino', credits: 3 },
    { id: 'la_english', name: 'English', credits: 3 },
    { id: 'la_math', name: 'Mathematics', credits: 3 },
    { id: 'la_science', name: 'Science', credits: 3 },
    { id: 'la_ap', name: 'Araling Panlipunan', credits: 3 },
    { id: 'la_epp', name: 'EPP/TLE', credits: 2 },
    { id: 'la_mapeh', name: 'MAPEH', credits: 4, isComposite: true, subSubjects: ['Music', 'Arts', 'PE', 'Health'] },
];

// Default number of school days per month (Jun to Apr)
const DEFAULT_MONTHLY_SCHOOL_DAYS_CONFIG: Record<string, number> = {
    Jan: 22, Feb: 20, Mar: 22, Apr: 10, May: 0, Jun: 10, Jul: 22, Aug: 22, Sep: 21, Oct: 22, Nov: 21, Dec: 10,
};