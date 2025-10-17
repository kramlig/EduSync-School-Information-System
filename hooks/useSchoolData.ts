import { useState, useEffect, useRef } from 'react';
import type { Student, LearningArea, Grade, CoreValue, CoreValueGrade, AttendanceRecord, Teacher, Section, SchoolSettings, SubstituteAssignment, ClassSchedule, Assignment, StudentAssignmentGrade, LessonPlan, Parent, Announcement, AttendanceStatus } from '../types';
import * as dbService from '../src/services/dbService';
import * as firestoreReader from '../src/services/firestoreReader';
import type { StoreName } from '../src/services/dbService';
import { getFirestoreInstance, auth } from '../src/services/firestoreService';
import { collection as fsCollection, onSnapshot, getDocs, doc as fsDoc, setDoc as fsSetDoc, deleteDoc as fsDeleteDoc, serverTimestamp as fsServerTimestamp } from 'firebase/firestore';
import { subscribeCollection, unsubscribeAll } from '../src/services/realtimeStore';
import { subscribe as bcSubscribe } from '../src/services/broadcast';

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
    // Assignments CRUD and grading
    addAssignment: (assignment: Omit<Assignment, 'id'>) => void;
    updateAssignment: (assignment: Assignment) => void;
    deleteAssignment: (assignmentId: string) => void;
    updateAssignmentGrade: (studentId: string, assignmentId: string, score: number | null, feedback: string | null) => void;
    submitAssignment: (studentId: string, assignmentId: string, filePath: string) => void;
        // Lesson Plans CRUD
        addLessonPlan: (plan: Omit<LessonPlan, 'id'>) => void;
        updateLessonPlan: (plan: LessonPlan) => void;
        deleteLessonPlan: (planId: string) => void;
    updateGrade: (studentId: string, learningAreaId: string, quarter: 'q1'|'q2'|'q3'|'q4', value?: number, subSubject?: string) => void;
    updateCoreValueGrade: (studentId: string, coreValueId: string, quarter: 'q1'|'q2'|'q3'|'q4', behavior: string, value: import('../types').CoreValueMarking | '') => void;
    addLearningArea: (area: Omit<LearningArea, 'id'>) => void;
    updateLearningArea: (learningAreaId: string, area: Omit<LearningArea, 'id'>) => void;
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
    // Announcements CRUD
    addAnnouncement: (a: Omit<Announcement, 'id'>) => void;
    updateAnnouncement: (a: Announcement) => void;
    deleteAnnouncement: (id: string) => void;
    refreshStores: (stores: StoreName[] | 'all') => Promise<{ updated: Record<string, number> }>;
} => {
    // Track local optimistic edits to avoid being overwritten by polling or snapshots
    const dirtyGradesRef = useRef<Map<string, number>>(new Map());
    const dirtySAGRef = useRef<Map<string, number>>(new Map());

    const mergeGrades = (prev: Grade[], incoming: Grade[]): Grade[] => {
        const prevById = new Map(prev.map(g => [g.id, g] as const));
        const dirty = dirtyGradesRef.current;
        const merged = incoming.map(g => dirty.has(g.id) ? (prevById.get(g.id) || g) : g);
        // include any prev-only docs not present in incoming (defensive)
        const incomingIds = new Set(incoming.map(g => g.id));
        for (const g of prev) { if (!incomingIds.has(g.id)) merged.push(g); }
        return merged;
    };

    const mergeSAG = (prev: StudentAssignmentGrade[], incoming: StudentAssignmentGrade[]): StudentAssignmentGrade[] => {
        const prevById = new Map(prev.map(g => [g.id as string, g] as const));
        const dirty = dirtySAGRef.current;
        const merged = incoming.map(g => dirty.has(g.id as string) ? (prevById.get(g.id as string) || g) : g);
        const incomingIds = new Set(incoming.map(g => g.id as string));
        for (const g of prev) { const id = g.id as string; if (!incomingIds.has(id)) merged.push(g); }
        return merged;
    };
    try {
        // Mount-time visibility log for debugging
        const env = (import.meta as any).env || {};
        console.log('[useSchoolData] mounted', {
            VITE_USE_FIREBASE_EMULATOR: String(env?.VITE_USE_FIREBASE_EMULATOR || ''),
            VITE_POLL_SAG: String(env?.VITE_POLL_SAG || ''),
            VITE_FIRESTORE_FORCE_LONG_POLLING: String(env?.VITE_FIRESTORE_FORCE_LONG_POLLING || ''),
            DEV: String(env?.DEV || ''),
        });
    } catch {}
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
    try {
        const db = getFirestoreInstance();
        const toWrite = { ...newStudent, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any;
        fsSetDoc(fsDoc(db as any, 'students', newStudent.id) as any, toWrite).catch(() => {});
    } catch {}

        return { success: true };
    };

    const updateStudent = (student: Student) => {
        const newStudents = state.students.map(s => s.id === student.id ? student : s);
        setState(prevState => ({ ...prevState, students: newStudents }));
    dbService.put('students', student); // Update in IndexedDB
    try {
        const db = getFirestoreInstance();
        const toWrite = { ...student, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any;
        fsSetDoc(fsDoc(db as any, 'students', student.id) as any, toWrite).catch(() => {});
    } catch {}
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
    try { const db = getFirestoreInstance(); fsDeleteDoc(fsDoc(db as any, 'students', studentId) as any).catch(() => {}); } catch {}
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
            (existing as any).updatedAt = Date.now();

            const nextGrades = [...prev.grades.filter(g => !(g.studentId === studentId && g.learningAreaId === learningAreaId)), existing];
            try { dirtyGradesRef.current.set(existing.id, Date.now()); } catch {}
            dbService.put('grades', existing);
            // Direct Firestore write with serverTimestamp and updatedBy
            try {
                const db = getFirestoreInstance();
                const toWrite = { ...existing, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any;
                fsSetDoc(fsDoc(db as any, 'grades', existing.id) as any, toWrite).catch(() => {});
            } catch {}
            return { ...prev, grades: nextGrades };
        });
    };

    const addLearningArea = (area: Omit<LearningArea, 'id'>) => {
        const newArea: LearningArea = { id: `la_${Date.now()}`, ...area };
        setState(prev => ({ ...prev, learningAreas: [...prev.learningAreas, newArea] }));
    dbService.put('learningAreas', newArea);
    try { const db = getFirestoreInstance(); const toWrite = { ...newArea, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'learningAreas', newArea.id) as any, toWrite).catch(() => {}); } catch {}
    };

    const updateLearningArea = (learningAreaId: string, area: Omit<LearningArea, 'id'>) => {
        const updatedArea: LearningArea = { id: learningAreaId, ...area };
        setState(prev => ({
            ...prev,
            learningAreas: prev.learningAreas.map(la => la.id === learningAreaId ? updatedArea : la)
        }));
        dbService.put('learningAreas', updatedArea);
        try { 
            const db = getFirestoreInstance(); 
            const toWrite = { ...updatedArea, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; 
            fsSetDoc(fsDoc(db as any, 'learningAreas', learningAreaId) as any, toWrite).catch(() => {}); 
        } catch {}
    };

    const deleteLearningArea = (learningAreaId: string) => {
        setState(prev => {
            const nextAreas = prev.learningAreas.filter(la => la.id !== learningAreaId);
            const nextGrades = prev.grades.filter(g => g.learningAreaId !== learningAreaId);
            dbService.remove('learningAreas', learningAreaId);
            if ((dbService as any).deleteGradesForLearningArea) {
                (dbService as any).deleteGradesForLearningArea(learningAreaId);
            }
            try { const db = getFirestoreInstance(); fsDeleteDoc(fsDoc(db as any, 'learningAreas', learningAreaId) as any).catch(() => {}); } catch {}
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
    try { const db = getFirestoreInstance(); const toWrite = { id: 'default', ...next, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'settings', 'default') as any, toWrite).catch(() => {}); } catch {}
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
            try { const db = getFirestoreInstance(); const toWrite = { ...nextRecord, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'coreValueGrades', nextRecord.id) as any, toWrite).catch(() => {}); } catch {}
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
            try { const db = getFirestoreInstance(); const toWrite = { ...record, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'attendanceRecords', record.studentId) as any, toWrite).catch(() => {}); } catch {}
            return { ...prev, attendanceRecords: nextRecords };
        });
    };

    // Parents CRUD and child assignments
    const addParent = (parent: Omit<Parent, 'id'>) => {
        const newParent: Parent = { id: `p_${Date.now()}`, ...parent };
        setState(prev => ({ ...prev, parents: [...prev.parents, newParent] }));
    try { dbService.put('parents', newParent); } catch {}
    try { const db = getFirestoreInstance(); const toWrite = { ...newParent, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'parents', newParent.id) as any, toWrite).catch(() => {}); } catch {}
    };

    const updateParent = (parent: Parent) => {
        setState(prev => ({
            ...prev,
            parents: prev.parents.map(p => p.id === parent.id ? parent : p)
        }));
    try { dbService.put('parents', parent); } catch {}
    try { const db = getFirestoreInstance(); const toWrite = { ...parent, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'parents', parent.id) as any, toWrite).catch(() => {}); } catch {}
    };

    const deleteParent = (parentId: string) => {
        setState(prev => ({ ...prev, parents: prev.parents.filter(p => p.id !== parentId) }));
    try { dbService.remove('parents', parentId); } catch {}
    try { const db = getFirestoreInstance(); fsDeleteDoc(fsDoc(db as any, 'parents', parentId) as any).catch(() => {}); } catch {}
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
            try { const db = getFirestoreInstance(); const toWrite = { ...nextParent, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'parents', nextParent.id) as any, toWrite).catch(() => {}); } catch {}
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
            try { const db = getFirestoreInstance(); const toWrite = { ...nextParent, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'parents', nextParent.id) as any, toWrite).catch(() => {}); } catch {}
            return { ...prev, parents: nextParents };
        });
    };

    // Teacher CRUD
    const addTeacher = (teacher: Omit<Teacher, 'id'>) => {
        const newTeacher: Teacher = { id: `t_${Date.now()}`, ...teacher } as Teacher;
        setState(prev => ({ ...prev, teachers: [...prev.teachers, newTeacher] }));
    try { dbService.put('teachers', newTeacher); } catch {}
    try { const db = getFirestoreInstance(); const toWrite = { ...newTeacher, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'teachers', newTeacher.id) as any, toWrite).catch(() => {}); } catch {}
    };

    const updateTeacher = (teacher: Teacher) => {
        setState(prev => ({ ...prev, teachers: prev.teachers.map(t => t.id === teacher.id ? teacher : t) }));
    try { dbService.put('teachers', teacher); } catch {}
    try { const db = getFirestoreInstance(); const toWrite = { ...teacher, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'teachers', teacher.id) as any, toWrite).catch(() => {}); } catch {}
    };

    const deleteTeacher = (teacherId: string) => {
        setState(prev => ({ ...prev, teachers: prev.teachers.filter(t => t.id !== teacherId) }));
    try { dbService.remove('teachers', teacherId); } catch {}
    try { const db = getFirestoreInstance(); fsDeleteDoc(fsDoc(db as any, 'teachers', teacherId) as any).catch(() => {}); } catch {}
    };

    // Section CRUD
    const addSection = (section: Omit<Section, 'id'>) => {
        const newSection: Section = { id: `sec_${Date.now()}`, ...section } as Section;
        setState(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
    try { dbService.put('sections', newSection); } catch {}
    try { const db = getFirestoreInstance(); const toWrite = { ...newSection, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'sections', newSection.id) as any, toWrite).catch(() => {}); } catch {}
    };

    const updateSection = (section: Section) => {
        setState(prev => ({ ...prev, sections: prev.sections.map(s => s.id === section.id ? section : s) }));
    try { dbService.put('sections', section); } catch {}
    try { const db = getFirestoreInstance(); const toWrite = { ...section, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'sections', section.id) as any, toWrite).catch(() => {}); } catch {}
    };

    const deleteSection = (sectionId: string) => {
        setState(prev => {
            const nextSections = prev.sections.filter(s => s.id !== sectionId);
            const updatedStudents = prev.students.map(stu => stu.sectionId === sectionId ? { ...stu, sectionId: undefined } : stu);
            // Persist updates
            try { dbService.remove('sections', sectionId); } catch {}
            updatedStudents.forEach(stu => { try { dbService.put('students', stu); } catch {} });
            try { const db = getFirestoreInstance(); fsDeleteDoc(fsDoc(db as any, 'sections', sectionId) as any).catch(() => {}); } catch {}
            return { ...prev, sections: nextSections, students: updatedStudents };
        });
    };

    // Assignments CRUD and grading
    const addAssignment = (assignment: Omit<Assignment, 'id'>) => {
        const newAssignment: Assignment = { id: `asg_${Date.now()}`, ...assignment } as Assignment;
        setState(prev => ({ ...prev, assignments: [...prev.assignments, newAssignment] }));
    try { dbService.put('assignments', newAssignment); } catch {}
    try { const db = getFirestoreInstance(); const toWrite = { ...newAssignment, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'assignments', newAssignment.id) as any, toWrite).catch(() => {}); } catch {}
    };

    const updateAssignment = (assignment: Assignment) => {
        setState(prev => ({ ...prev, assignments: prev.assignments.map(a => a.id === assignment.id ? { ...assignment } : a) }));
    try { dbService.put('assignments', assignment); } catch {}
    try { const db = getFirestoreInstance(); const toWrite = { ...assignment, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'assignments', assignment.id) as any, toWrite).catch(() => {}); } catch {}
    };

    const deleteAssignment = (assignmentId: string) => {
        setState(prev => {
            const nextAssignments = prev.assignments.filter(a => a.id !== assignmentId);
            const nextGrades = prev.studentAssignmentGrades.filter(sg => sg.assignmentId !== assignmentId);
            // Persist
            try { dbService.remove('assignments', assignmentId); } catch {}
            // Attempt to remove per-student grades for this assignment
            for (const sg of prev.studentAssignmentGrades) {
                if (sg.assignmentId === assignmentId) {
                    try { (dbService as any).remove('studentAssignmentGrades', [assignmentId, sg.studentId] as any); } catch {}
                }
            }
            try { const db = getFirestoreInstance(); fsDeleteDoc(fsDoc(db as any, 'assignments', assignmentId) as any).catch(() => {}); } catch {}
            return { ...prev, assignments: nextAssignments, studentAssignmentGrades: nextGrades };
        });
    };

    const updateAssignmentGrade = (studentId: string, assignmentId: string, score: number | null, feedback: string | null) => {
        setState(prev => {
            const existing = prev.studentAssignmentGrades.find(g => g.assignmentId === assignmentId && g.studentId === studentId);
            const nextRecord: StudentAssignmentGrade = {
                id: `sag_${assignmentId}_${studentId}` as any,
                assignmentId,
                studentId,
                score: score ?? null,
                feedback: feedback ?? null,
                submissionDate: existing?.submissionDate ?? null,
                filePath: existing?.filePath ?? null,
                // client-side timestamp for ordering; can be replaced with serverTimestamp in future
                updatedAt: Date.now() as any,
            };
            const updated = existing
                ? prev.studentAssignmentGrades.map(g => (g.assignmentId === assignmentId && g.studentId === studentId) ? nextRecord : g)
                : [...prev.studentAssignmentGrades, nextRecord];
            try { dirtySAGRef.current.set(nextRecord.id as string, Date.now()); } catch {}
            try { dbService.put('studentAssignmentGrades', nextRecord as any); } catch {}
            try {
                const db = getFirestoreInstance();
                const toWrite = { ...nextRecord, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any;
                fsSetDoc(fsDoc(db as any, 'studentAssignmentGrades', String(nextRecord.id)) as any, toWrite).catch(() => {});
            } catch {}
            return { ...prev, studentAssignmentGrades: updated };
        });
    };

    const submitAssignment = (studentId: string, assignmentId: string, filePath: string) => {
        setState(prev => {
            const existing = prev.studentAssignmentGrades.find(g => g.assignmentId === assignmentId && g.studentId === studentId);
            const today = new Date().toISOString().split('T')[0];
            const nextRecord: StudentAssignmentGrade = {
                id: `sag_${assignmentId}_${studentId}` as any,
                assignmentId,
                studentId,
                score: existing?.score ?? null,
                feedback: existing?.feedback ?? null,
                submissionDate: today,
                filePath: filePath || existing?.filePath || null,
                updatedAt: Date.now() as any,
            };
            const updated = existing
                ? prev.studentAssignmentGrades.map(g => (g.assignmentId === assignmentId && g.studentId === studentId) ? nextRecord : g)
                : [...prev.studentAssignmentGrades, nextRecord];
            try { dirtySAGRef.current.set(nextRecord.id as string, Date.now()); } catch {}
            try { dbService.put('studentAssignmentGrades', nextRecord as any); } catch {}
            try {
                const db = getFirestoreInstance();
                const toWrite = { ...nextRecord, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any;
                fsSetDoc(fsDoc(db as any, 'studentAssignmentGrades', String(nextRecord.id)) as any, toWrite).catch(() => {});
            } catch {}
            return { ...prev, studentAssignmentGrades: updated };
        });
    };

    // Lesson Plans CRUD
    const addLessonPlan = (plan: Omit<LessonPlan, 'id'>) => {
        const newPlan: LessonPlan = { id: `lp_${Date.now()}`, ...plan } as LessonPlan;
        setState(prev => ({ ...prev, lessonPlans: [newPlan, ...prev.lessonPlans] }));
    try { dbService.put('lessonPlans', newPlan); } catch {}
    try { const db = getFirestoreInstance(); const toWrite = { ...newPlan, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'lessonPlans', newPlan.id) as any, toWrite).catch(() => {}); } catch {}
    };

    const updateLessonPlan = (plan: LessonPlan) => {
        setState(prev => ({ ...prev, lessonPlans: prev.lessonPlans.map(p => p.id === plan.id ? { ...plan } : p) }));
    try { dbService.put('lessonPlans', plan); } catch {}
    try { const db = getFirestoreInstance(); const toWrite = { ...plan, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'lessonPlans', plan.id) as any, toWrite).catch(() => {}); } catch {}
    };

    const deleteLessonPlan = (planId: string) => {
        setState(prev => ({ ...prev, lessonPlans: prev.lessonPlans.filter(p => p.id !== planId) }));
    try { dbService.remove('lessonPlans', planId); } catch {}
    try { const db = getFirestoreInstance(); fsDeleteDoc(fsDoc(db as any, 'lessonPlans', planId) as any).catch(() => {}); } catch {}
    };

    // SubstituteAssignment CRUD
    const addSubstituteAssignment = (assignment: Omit<SubstituteAssignment, 'id'>) => {
        const newAssignment: SubstituteAssignment = { id: `sub_${Date.now()}`, ...assignment } as SubstituteAssignment;
        setState(prev => ({ ...prev, substituteAssignments: [newAssignment, ...prev.substituteAssignments] }));
    try { dbService.put('substituteAssignments', newAssignment); } catch {}
    try { const db = getFirestoreInstance(); const toWrite = { ...newAssignment, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'substituteAssignments', newAssignment.id) as any, toWrite).catch(() => {}); } catch {}
    };

    const updateSubstituteAssignment = (assignment: SubstituteAssignment) => {
        setState(prev => ({ ...prev, substituteAssignments: prev.substituteAssignments.map(sa => sa.id === assignment.id ? assignment : sa) }));
    try { dbService.put('substituteAssignments', assignment); } catch {}
    try { const db = getFirestoreInstance(); const toWrite = { ...assignment, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'substituteAssignments', assignment.id) as any, toWrite).catch(() => {}); } catch {}
    };

    const deleteSubstituteAssignment = (assignmentId: string) => {
        setState(prev => ({ ...prev, substituteAssignments: prev.substituteAssignments.filter(sa => sa.id !== assignmentId) }));
    try { dbService.remove('substituteAssignments', assignmentId); } catch {}
    try { const db = getFirestoreInstance(); fsDeleteDoc(fsDoc(db as any, 'substituteAssignments', assignmentId) as any).catch(() => {}); } catch {}
    };

    // --- Announcements CRUD ---
    const addAnnouncement = (a: Omit<Announcement, 'id'>) => {
        const newAnnouncement: Announcement = {
            id: `ann_${Date.now()}`,
            title: a.title,
            content: a.content,
            authorId: a.authorId,
            date: a.date || new Date().toISOString().split('T')[0],
            target: a.target,
        };
        setState(prev => ({ ...prev, announcements: [newAnnouncement, ...prev.announcements] }));
    try { dbService.put('announcements', newAnnouncement); } catch {}
    try { const db = getFirestoreInstance(); const toWrite = { ...newAnnouncement, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'announcements', newAnnouncement.id) as any, toWrite).catch(() => {}); } catch {}
    };

    const updateAnnouncement = (a: Announcement) => {
        setState(prev => ({ ...prev, announcements: prev.announcements.map(x => x.id === a.id ? { ...a } : x) }));
    try { dbService.put('announcements', a); } catch {}
    try { const db = getFirestoreInstance(); const toWrite = { ...a, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'announcements', a.id) as any, toWrite).catch(() => {}); } catch {}
    };

    const deleteAnnouncement = (id: string) => {
        setState(prev => ({ ...prev, announcements: prev.announcements.filter(x => x.id !== id) }));
    try { dbService.remove('announcements', id); } catch {}
    try { const db = getFirestoreInstance(); fsDeleteDoc(fsDoc(db as any, 'announcements', id) as any).catch(() => {}); } catch {}
    };

    // --- Manual selective refresh from Firestore ---
    const refreshStores = async (stores: StoreName[] | 'all'): Promise<{ updated: Record<string, number> }> => {
        const remote = await firestoreReader.fetchAllData();
        const validate = (item: any, key: string | string[]): boolean => {
            if (Array.isArray(key)) return key.every(k => item.hasOwnProperty(k) && item[k] !== undefined);
            return item.hasOwnProperty(key) && item[key] !== undefined;
        };
        const sanitized = {
            students: remote.students.filter(i => validate(i,'id')),
            learningAreas: remote.learningAreas.filter(i => validate(i,'id')),
            grades: remote.grades.filter(i => validate(i,'id')),
            coreValues: remote.coreValues.filter(i => validate(i,'id')),
            coreValueGrades: remote.coreValueGrades.filter(i => validate(i,'id')),
            attendanceRecords: remote.attendanceRecords.filter(i => validate(i,'studentId')),
            teachers: remote.teachers.filter(i => validate(i,'id')),
            parents: remote.parents.filter(i => validate(i,'id')),
            sections: remote.sections.filter(i => validate(i,'id')),
            settings: remote.settings?.[0] || state.settings,
            substituteAssignments: remote.substituteAssignments.filter(i => validate(i,'id')),
            classSchedules: remote.classSchedules.filter(i => validate(i,'id')),
            assignments: remote.assignments.filter(i => validate(i,'id')),
            studentAssignmentGrades: remote.studentAssignmentGrades.filter(i => validate(i,['assignmentId','studentId'])),
            lessonPlans: remote.lessonPlans.filter(i => validate(i,'id')),
            announcements: remote.announcements.filter(i => validate(i,'id')),
        } as const;

        const names: StoreName[] = stores === 'all' ? [
            'students','learningAreas','grades','coreValues','coreValueGrades','attendanceRecords','teachers','parents','sections','settings','substituteAssignments','classSchedules','assignments','studentAssignmentGrades','lessonPlans','announcements'
        ] : stores;

        const updated: Record<string, number> = {};
        for (const name of names) {
            try {
                const value = (sanitized as any)[name];
                if (name === 'settings') {
                    await dbService.put('settings', value);
                    setState(prev => ({ ...prev, settings: value }));
                    updated[name] = 1;
                } else {
                    await dbService.bulkPut(name as any, value);
                    setState(prev => ({ ...prev, [name]: value } as any));
                    updated[name] = Array.isArray(value) ? value.length : 0;
                }
            } catch (e) {
                console.warn(`[Refresh] Failed updating '${name}':`, e);
            }
        }
        return { updated };
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
    try { const db = getFirestoreInstance(); const toWrite = { ...newSchedule, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'classSchedules', newSchedule.id) as any, toWrite).catch(() => {}); } catch {}
        return { success: true };
    };

    const updateSchedule = (sched: ClassSchedule): { success: boolean; message?: string } => {
        const v = validateSchedule(sched, sched.id);
        if (!v.ok) return { success: false, message: v.message };
        setState(prev => ({ ...prev, classSchedules: prev.classSchedules.map(s => s.id === sched.id ? { ...sched } : s) }));
    try { dbService.put('classSchedules', sched); } catch {}
    try { const db = getFirestoreInstance(); const toWrite = { ...sched, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'anon' } as any; fsSetDoc(fsDoc(db as any, 'classSchedules', sched.id) as any, toWrite).catch(() => {}); } catch {}
        return { success: true };
    };

    const deleteSchedule = (scheduleId: string) => {
        setState(prev => ({ ...prev, classSchedules: prev.classSchedules.filter(s => s.id !== scheduleId) }));
    try { dbService.remove('classSchedules', scheduleId); } catch {}
    try { const db = getFirestoreInstance(); fsDeleteDoc(fsDoc(db as any, 'classSchedules', scheduleId) as any).catch(() => {}); } catch {}
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
                                        // also write to remote emulator for visibility
                                        try {
                                            const db = getFirestoreInstance();
                                            const toWrite = { ...seedAdmin, updatedAt: fsServerTimestamp(), updatedBy: auth.currentUser?.uid || 'seeder' } as any;
                                            fsSetDoc(fsDoc(db as any, 'teachers', seedAdmin.id) as any, toWrite).catch(() => {});
                                            fsSetDoc(fsDoc(db as any, 'users', seedAdmin.id) as any, { ...toWrite }).catch(() => {});
                                        } catch {}
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
                        // Incremental merge: detect new remote teachers and announcements not yet in cache
                        try {
                            const remote = await firestoreReader.fetchAllData();
                            // Teachers merge
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
                            // Announcements merge
                            const remoteAnnouncements = remote.announcements || [];
                            if (remoteAnnouncements.length) {
                                const existingAnnIds = new Set(announcements.map(a => a.id));
                                const newAnns = remoteAnnouncements.filter(ra => ra.id && !existingAnnIds.has(ra.id));
                                if (newAnns.length) {
                                    await dbService.bulkPut('announcements', newAnns);
                                    announcements = [...announcements, ...newAnns];
                                    console.log(`[DataSync] Merged ${newAnns.length} new announcements from Firestore (incremental).`);
                                }
                            }
                        } catch (e) {
                            console.warn('[DataSync] Incremental merge (teachers/announcements) skipped due to error:', e);
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

                    // Ensure Announcements are merged from Firestore when local cache exists
                    try {
                        const remote = await firestoreReader.fetchAllData();
                        const remoteAnnouncements = remote.announcements || [];
                        if (remoteAnnouncements.length) {
                            const existingIds = new Set(announcements.map(a => a.id));
                            const newOnes = remoteAnnouncements.filter(a => a.id && !existingIds.has(a.id));
                            if (newOnes.length) {
                                await dbService.bulkPut('announcements', newOnes);
                                announcements = [...announcements, ...newOnes];
                                console.log(`[DataSync] Merged ${newOnes.length} new announcements from Firestore.`);
                            }
                        }
                    } catch (e) {
                        console.warn('[DataSync] Announcement merge skipped due to error:', e);
                    }

                    // MIGRATION: Fix grade levels for existing learning areas in IndexedDB
                    const gradeLevelMigrationMap: Record<string, number[]> = {
                        'la_filipino': [7, 8, 9, 10],
                        'la_filipino_elem': [1, 2, 3, 4, 5, 6],
                        'la_filipino_jhs': [7, 8, 9, 10],
                        'la_english': [7, 8, 9, 10],
                        'la_english_elem': [1, 2, 3, 4, 5, 6],
                        'la_english_jhs': [7, 8, 9, 10],
                        'la_math': [7, 8, 9, 10],
                        'la_math_elem': [1, 2, 3, 4, 5, 6],
                        'la_math_jhs': [7, 8, 9, 10],
                        'la_science': [7, 8, 9, 10],
                        'la_science_elem': [3, 4, 5, 6], // Science starts Grade 3
                        'la_science_jhs': [7, 8, 9, 10],
                        'la_ap': [7, 8, 9, 10],
                        'la_ap_elem': [1, 2, 3, 4, 5, 6],
                        'la_ap_jhs': [7, 8, 9, 10],
                        'la_epp': [7, 8, 9, 10],
                        'la_tle_jhs': [7, 8, 9, 10],
                        'la_mapeh': [7, 8, 9, 10],
                        'la_mapeh_elem': [1, 2, 3, 4, 5, 6],
                        'la_mapeh_jhs': [7, 8, 9, 10],
                        'la_esp_elem': [1, 2, 3, 4, 5, 6],
                        'la_esp_jhs': [7, 8, 9, 10],
                        'la_mtb_elem': [1, 2, 3], // MTB only Grades 1-3
                    };
                    
                    let migratedCount = 0;
                    const migratedAreas: LearningArea[] = [];
                    for (const area of learningAreas) {
                        if (gradeLevelMigrationMap[area.id]) {
                            const correctGradeLevels = gradeLevelMigrationMap[area.id];
                            const currentGradeLevels = area.gradeLevel || [];
                            const needsMigration = JSON.stringify(currentGradeLevels.sort()) !== JSON.stringify(correctGradeLevels.sort());
                            
                            if (needsMigration) {
                                migratedCount++;
                                const migratedArea = { ...area, gradeLevel: correctGradeLevels };
                                migratedAreas.push(migratedArea);
                                console.log(`[Migration] Fixing grade levels for "${area.name}" (${area.id}): ${currentGradeLevels.join(', ')} → ${correctGradeLevels.join(', ')}`);
                            }
                        }
                    }
                    
                    if (migratedCount > 0) {
                        console.warn(`[Migration] Fixed grade levels for ${migratedCount} learning areas. Updating IndexedDB and Firestore...`);
                        // Update IndexedDB
                        try {
                            await dbService.bulkPut('learningAreas', migratedAreas);
                        } catch (e) {
                            console.error('[Migration] Failed to update IndexedDB:', e);
                        }
                        // Update Firestore
                        try {
                            const db = getFirestoreInstance();
                            for (const area of migratedAreas) {
                                const toWrite = { ...area, updatedAt: fsServerTimestamp(), updatedBy: 'migration' } as any;
                                await fsSetDoc(fsDoc(db as any, 'learningAreas', area.id) as any, toWrite);
                            }
                        } catch (e) {
                            console.error('[Migration] Failed to update Firestore:', e);
                        }
                        // Update local state
                        learningAreas = learningAreas.map(area => {
                            const migrated = migratedAreas.find(m => m.id === area.id);
                            return migrated || area;
                        });
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

                    // MIGRATION: Fix grade levels for existing learning areas
                    const gradeLevelMigrationMap: Record<string, number[]> = {
                        'la_filipino': [7, 8, 9, 10],
                        'la_filipino_elem': [1, 2, 3, 4, 5, 6],
                        'la_filipino_jhs': [7, 8, 9, 10],
                        'la_english': [7, 8, 9, 10],
                        'la_english_elem': [1, 2, 3, 4, 5, 6],
                        'la_english_jhs': [7, 8, 9, 10],
                        'la_math': [7, 8, 9, 10],
                        'la_math_elem': [1, 2, 3, 4, 5, 6],
                        'la_math_jhs': [7, 8, 9, 10],
                        'la_science': [7, 8, 9, 10],
                        'la_science_elem': [3, 4, 5, 6], // Science starts Grade 3
                        'la_science_jhs': [7, 8, 9, 10],
                        'la_ap': [7, 8, 9, 10],
                        'la_ap_elem': [1, 2, 3, 4, 5, 6],
                        'la_ap_jhs': [7, 8, 9, 10],
                        'la_epp': [7, 8, 9, 10],
                        'la_tle_jhs': [7, 8, 9, 10],
                        'la_mapeh': [7, 8, 9, 10],
                        'la_mapeh_elem': [1, 2, 3, 4, 5, 6],
                        'la_mapeh_jhs': [7, 8, 9, 10],
                        'la_esp_elem': [1, 2, 3, 4, 5, 6],
                        'la_esp_jhs': [7, 8, 9, 10],
                        'la_mtb_elem': [1, 2, 3], // MTB only Grades 1-3
                    };
                    
                    let migratedCount = 0;
                    sanitizedData.learningAreas = sanitizedData.learningAreas.map(area => {
                        if (gradeLevelMigrationMap[area.id]) {
                            const correctGradeLevels = gradeLevelMigrationMap[area.id];
                            const currentGradeLevels = area.gradeLevel || [];
                            const needsMigration = JSON.stringify(currentGradeLevels.sort()) !== JSON.stringify(correctGradeLevels.sort());
                            
                            if (needsMigration) {
                                migratedCount++;
                                console.log(`[Migration] Fixing grade levels for "${area.name}" (${area.id}): ${currentGradeLevels.join(', ')} → ${correctGradeLevels.join(', ')}`);
                                return { ...area, gradeLevel: correctGradeLevels };
                            }
                        }
                        return area;
                    });
                    
                    if (migratedCount > 0) {
                        console.warn(`[Migration] Fixed grade levels for ${migratedCount} learning areas. Updating database...`);
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

    loadData();
        // Cross-tab broadcast listener: refresh affected stores when another tab flushes writes
        const offBc = bcSubscribe(async (evt) => {
            try { console.log('[Broadcast] event received in useSchoolData:', evt); } catch {}
            if (evt.type === 'writeFlushed') {
                const col = evt.payload.collection as StoreName | string;
                try {
                    const db = getFirestoreInstance();
                    if (col === 'studentAssignmentGrades') {
                        const snap = await getDocs(fsCollection(db as any, 'studentAssignmentGrades') as any);
                        const latest = (snap.docs as any[]).map(d => ({ id: d.id, ...(d.data()||{}) })) as StudentAssignmentGrade[];
                        // Clear dirty flags if ids provided
                        try { (evt.payload.ids || []).forEach(id => dirtySAGRef.current.delete(id)); } catch {}
                        setState(prev => ({ ...prev, studentAssignmentGrades: mergeSAG(prev.studentAssignmentGrades, latest) }));
                        try { await dbService.bulkPut('studentAssignmentGrades', latest as any); } catch {}
                    } else if (col === 'grades') {
                        const snap = await getDocs(fsCollection(db as any, 'grades') as any);
                        const latest = (snap.docs as any[]).map(d => ({ id: d.id, ...(d.data()||{}) })) as Grade[];
                        try { (evt.payload.ids || []).forEach(id => dirtyGradesRef.current.delete(id)); } catch {}
                        setState(prev => ({ ...prev, grades: mergeGrades(prev.grades, latest) }));
                        try { await dbService.bulkPut('grades', latest as any); } catch {}
                    }
                } catch (e) {
                    console.warn('[Broadcast] refresh failed for', col, e);
                }
            }
        });
        // Realtime: subject grades live updates across users
        try {
            const key = 'grades:all';
            const stopGrades = subscribeCollection<Grade>(key, 'grades', async (items) => {
                setState(prev => ({ ...prev, grades: mergeGrades(prev.grades, items) }));
                try { await dbService.bulkPut('grades', items as any); } catch {}
            });
            (window as any).__rt_cleanup_grades = () => { try { stopGrades(); } catch {} };
        } catch (e) {
            console.warn('[Realtime] grades onSnapshot failed:', e);
        }
        // Realtime: studentAssignmentGrades live updates across users
        try {
            const key = 'studentAssignmentGrades:all';
            const stop = subscribeCollection<StudentAssignmentGrade>(key, 'studentAssignmentGrades', async (items) => {
                // Deduplicate by composite key in case of older cached docs
                const map = new Map<string, StudentAssignmentGrade>();
                for (const it of items) {
                    const k = `${it.assignmentId}|${it.studentId}`;
                    const prev = map.get(k);
                    if (!prev || (it.updatedAt ?? 0) >= (prev.updatedAt ?? 0)) {
                        map.set(k, it);
                    }
                }
                const merged = Array.from(map.values());
                setState(prev => ({ ...prev, studentAssignmentGrades: mergeSAG(prev.studentAssignmentGrades, merged) }));
                try { await dbService.bulkPut('studentAssignmentGrades', merged as any); } catch {}
            });
            // Ensure cleanup on unmount
            const cleanup = () => { try { stop(); } catch {} };
            // We'll return a composite cleanup below; keep reference
            (window as any).__rt_cleanup_sag = cleanup;
        } catch (e) {
            console.warn('[Realtime] studentAssignmentGrades onSnapshot failed:', e);
        }
        // Realtime subscription for announcements (low volume, high freshness UX)
        let annUnsub: undefined | (() => void);
        try {
            const db = getFirestoreInstance();
            const col = fsCollection(db as any, 'announcements');
            const unsub = onSnapshot(col as any, async (snap: any) => {
                const remote = (snap.docs as any[]).map((d: any) => ({ id: d.id, ...(d.data() || {}) }));
                if (Array.isArray(remote) && remote.length >= 0) {
                    // Merge new/updated docs
                    const mapLocal = new Map(state.announcements.map(a => [a.id, a]));
                    let changed = false;
                    for (const doc of remote) {
                        const prev = mapLocal.get(doc.id);
                        if (!prev || JSON.stringify(prev) !== JSON.stringify(doc)) {
                            mapLocal.set(doc.id, doc as any);
                            changed = true;
                        }
                    }
                    if (changed) {
                        const merged = Array.from(mapLocal.values());
                        setState(prev => ({ ...prev, announcements: merged }));
                        try { await dbService.bulkPut('announcements', merged); } catch {}
                    }
                }
            });
            annUnsub = () => { try { unsub(); } catch {} };
        } catch (e) {
            console.warn('[Realtime] Announcements onSnapshot failed:', e);
        }
        // Optional dev fallback: poll Firestore for grades/SAG if snapshots are blocked (ad blockers)
        // Removed dev polling: rely on Firestore onSnapshot for real-time updates
        // Final overall cleanup (unsub all realtimeStore listeners we created)
        return () => {
            try { const f = (window as any).__rt_cleanup_sag; if (typeof f === 'function') f(); } catch {}
            try { const f2 = (window as any).__rt_cleanup_grades; if (typeof f2 === 'function') f2(); } catch {}
            try { unsubscribeAll(); } catch {}
            try { offBc && offBc(); } catch {}
            try { annUnsub && annUnsub(); } catch {}
        };
    }, []);

    return { ...state, addStudent, updateStudent, deleteStudent, addSchedule, updateSchedule, deleteSchedule, addAssignment, updateAssignment, deleteAssignment, updateAssignmentGrade, submitAssignment, addLessonPlan, updateLessonPlan, deleteLessonPlan, updateGrade, updateCoreValueGrade, addLearningArea, updateLearningArea, deleteLearningArea, updateSettings, updateAttendance, addParent, updateParent, deleteParent, assignStudentToParent, unassignStudentFromParent, addTeacher, updateTeacher, deleteTeacher, addSection, updateSection, deleteSection, addSubstituteAssignment, updateSubstituteAssignment, deleteSubstituteAssignment, addAnnouncement, updateAnnouncement, deleteAnnouncement, refreshStores };
};

export type SchoolDataHook = ReturnType<typeof useSchoolData>;

const DEFAULT_LEARNING_AREAS: LearningArea[] = [
    // ELEMENTARY (Grades 1-6)
    { 
        id: 'la_filipino_elem', 
        name: 'Filipino', 
        credits: 3,
        category: 'core',
        gradeLevel: [1, 2, 3, 4, 5, 6],
        department: 'Language',
        kToTwelveCode: 'FIL',
        isActive: true,
        order: 1,
        description: 'Filipino for Elementary'
    },
    { 
        id: 'la_english_elem', 
        name: 'English', 
        credits: 3,
        category: 'core',
        gradeLevel: [1, 2, 3, 4, 5, 6],
        department: 'Language',
        kToTwelveCode: 'ENG',
        isActive: true,
        order: 2,
        description: 'English for Elementary'
    },
    { 
        id: 'la_math_elem', 
        name: 'Mathematics', 
        credits: 3,
        category: 'core',
        gradeLevel: [1, 2, 3, 4, 5, 6],
        department: 'STEM',
        kToTwelveCode: 'MATH',
        isActive: true,
        order: 3,
        description: 'Mathematics for Elementary'
    },
    { 
        id: 'la_science_elem', 
        name: 'Science', 
        credits: 3,
        category: 'core',
        gradeLevel: [3, 4, 5, 6], // Science starts at Grade 3
        department: 'STEM',
        kToTwelveCode: 'SCI',
        isActive: true,
        order: 4,
        description: 'Science for Elementary (Grades 3-6 only)'
    },
    { 
        id: 'la_ap_elem', 
        name: 'Araling Panlipunan', 
        credits: 3,
        category: 'core',
        gradeLevel: [1, 2, 3, 4, 5, 6],
        department: 'Humanities',
        kToTwelveCode: 'AP',
        isActive: true,
        order: 5,
        description: 'Araling Panlipunan for Elementary'
    },
    { 
        id: 'la_esp_elem', 
        name: 'Edukasyon sa Pagpapakatao (EsP)', 
        credits: 2,
        category: 'core',
        gradeLevel: [1, 2, 3, 4, 5, 6],
        department: 'Values Education',
        kToTwelveCode: 'ESP',
        isActive: true,
        order: 6,
        description: 'Values Education for Elementary'
    },
    { 
        id: 'la_mapeh_elem', 
        name: 'MAPEH', 
        credits: 4, 
        isComposite: true, 
        subSubjects: ['Music', 'Arts', 'PE', 'Health'],
        category: 'specialized',
        gradeLevel: [1, 2, 3, 4, 5, 6],
        department: 'Arts & Sports',
        kToTwelveCode: 'MAPEH',
        isActive: true,
        order: 7,
        description: 'Music, Arts, Physical Education, Health for Elementary'
    },
    { 
        id: 'la_mtb_elem', 
        name: 'Mother Tongue-Based Multilingual Education (MTB-MLE)', 
        credits: 3,
        category: 'core',
        gradeLevel: [1, 2, 3], // MTB only for Grades 1-3
        department: 'Language',
        kToTwelveCode: 'MTB',
        isActive: true,
        order: 8,
        description: 'Mother Tongue instruction for Grades 1-3'
    },

    // JUNIOR HIGH (Grades 7-10)
    { 
        id: 'la_filipino_jhs', 
        name: 'Filipino', 
        credits: 3,
        category: 'core',
        gradeLevel: [7, 8, 9, 10],
        department: 'Language',
        kToTwelveCode: 'FIL',
        isActive: true,
        order: 11,
        description: 'Filipino for Junior High School'
    },
    { 
        id: 'la_english_jhs', 
        name: 'English', 
        credits: 3,
        category: 'core',
        gradeLevel: [7, 8, 9, 10],
        department: 'Language',
        kToTwelveCode: 'ENG',
        isActive: true,
        order: 12,
        description: 'English for Junior High School'
    },
    { 
        id: 'la_math_jhs', 
        name: 'Mathematics', 
        credits: 3,
        category: 'core',
        gradeLevel: [7, 8, 9, 10],
        department: 'STEM',
        kToTwelveCode: 'MATH',
        isActive: true,
        order: 13,
        description: 'Mathematics for Junior High School'
    },
    { 
        id: 'la_science_jhs', 
        name: 'Science', 
        credits: 3,
        category: 'core',
        gradeLevel: [7, 8, 9, 10],
        department: 'STEM',
        kToTwelveCode: 'SCI',
        isActive: true,
        order: 14,
        description: 'Science for Junior High School'
    },
    { 
        id: 'la_ap_jhs', 
        name: 'Araling Panlipunan', 
        credits: 3,
        category: 'core',
        gradeLevel: [7, 8, 9, 10],
        department: 'Humanities',
        kToTwelveCode: 'AP',
        isActive: true,
        order: 15,
        description: 'Araling Panlipunan for Junior High School'
    },
    { 
        id: 'la_tle_jhs', 
        name: 'Technology and Livelihood Education (TLE)', 
        credits: 2,
        category: 'tle',
        gradeLevel: [7, 8, 9, 10],
        department: 'Technical-Vocational',
        kToTwelveCode: 'TLE',
        isActive: true,
        order: 16,
        description: 'TLE for Junior High School'
    },
    { 
        id: 'la_mapeh_jhs', 
        name: 'MAPEH', 
        credits: 4, 
        isComposite: true, 
        subSubjects: ['Music', 'Arts', 'PE', 'Health'],
        category: 'specialized',
        gradeLevel: [7, 8, 9, 10],
        department: 'Arts & Sports',
        kToTwelveCode: 'MAPEH',
        isActive: true,
        order: 17,
        description: 'Music, Arts, Physical Education, Health for Junior High School'
    },
    { 
        id: 'la_esp_jhs', 
        name: 'Edukasyon sa Pagpapakatao (EsP)', 
        credits: 2,
        category: 'core',
        gradeLevel: [7, 8, 9, 10],
        department: 'Values Education',
        kToTwelveCode: 'ESP',
        isActive: true,
        order: 18,
        description: 'Values Education for Junior High School'
    }
];

// Default number of school days per month (Jun to Apr)
const DEFAULT_MONTHLY_SCHOOL_DAYS_CONFIG: Record<string, number> = {
    Jan: 22, Feb: 20, Mar: 22, Apr: 10, May: 0, Jun: 10, Jul: 22, Aug: 22, Sep: 21, Oct: 22, Nov: 21, Dec: 10,
};