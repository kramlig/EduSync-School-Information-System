/**
 * PHASE 1: SIMPLIFIED useSchoolData Hook
 * 
 * Key Changes:
 * - NO real-time listeners (except announcements - optional)
 * - Simple fetch on mount
 * - Manual refresh capability
 * - Direct Firestore reads (no IndexedDB complexity)
 * - Optimistic updates for writes
 * 
 * This removes the infinite loop issues and makes the data flow predictable.
 */

import { useState, useEffect, useCallback } from 'react';
import type { 
    Student, LearningArea, Grade, CoreValue, CoreValueGrade, AttendanceRecord, 
    Teacher, Section, SchoolSettings, SubstituteAssignment, ClassSchedule, 
    Assignment, StudentAssignmentGrade, LessonPlan, Parent, Announcement, 
    AttendanceStatus, CoreValueMarking 
} from '../types';
import { getFirestoreInstance, auth } from '../src/services/firestoreService';
import { 
    collection, getDocs, doc, setDoc, deleteDoc, 
    serverTimestamp, onSnapshot 
} from 'firebase/firestore';

const MOCK_SETTINGS: SchoolSettings = {
    schoolName: 'ENRIQUE URENCIA ELEMENTARY SCHOOL',
    region: 'Region XI',
    division: 'Division of the City of Mati',
    district: 'Governor Generoso North District',
    schoolYear: '2023-2024'
};

const DEFAULT_MONTHLY_SCHOOL_DAYS_CONFIG: Record<string, number> = {
    Jan: 22, Feb: 20, Mar: 22, Apr: 10, May: 0, Jun: 10, Jul: 22, Aug: 22, Sep: 21, Oct: 22, Nov: 21, Dec: 10,
};

export type SchoolDataState = {
    students: Student[];
    learningAreas: LearningArea[];
    grades: Grade[];
    coreValues: CoreValue[];
    coreValueGrades: CoreValueGrade[];
    attendanceRecords: AttendanceRecord[];
    teachers: Teacher[];
    parents: Parent[];
    sections: Section[];
    settings: SchoolSettings;
    substituteAssignments: SubstituteAssignment[];
    classSchedules: ClassSchedule[];
    assignments: Assignment[];
    studentAssignmentGrades: StudentAssignmentGrade[];
    lessonPlans: LessonPlan[];
    announcements: Announcement[];
    monthlySchoolDaysConfig: Record<string, number>;
};

// Helper: Fetch a single collection from Firestore
async function fetchCollection<T>(collectionName: string): Promise<T[]> {
    try {
        const db = getFirestoreInstance();
        const snapshot = await getDocs(collection(db, collectionName));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (error) {
        console.error(`Failed to fetch ${collectionName}:`, error);
        return [];
    }
}

// Helper: Write to Firestore with metadata
async function writeToFirestore(collectionName: string, id: string, data: any) {
    try {
        const db = getFirestoreInstance();
        const docRef = doc(db, collectionName, id);
        await setDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser?.uid || 'anon'
        });
    } catch (error) {
        console.error(`Failed to write to ${collectionName}:`, error);
    }
}

// Helper: Delete from Firestore
async function deleteFromFirestore(collectionName: string, id: string) {
    try {
        const db = getFirestoreInstance();
        await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
        console.error(`Failed to delete from ${collectionName}:`, error);
    }
}

export const useSchoolData = () => {
    const [state, setState] = useState<SchoolDataState & { loading: boolean; error: string | null }>({
        loading: true,
        error: null,
        students: [],
        learningAreas: [],
        grades: [],
        coreValues: [],
        coreValueGrades: [],
        attendanceRecords: [],
        teachers: [],
        parents: [],
        sections: [],
        settings: MOCK_SETTINGS,
        substituteAssignments: [],
        classSchedules: [],
        assignments: [],
        studentAssignmentGrades: [],
        lessonPlans: [],
        announcements: [],
        monthlySchoolDaysConfig: DEFAULT_MONTHLY_SCHOOL_DAYS_CONFIG,
    });

    // Load all data from Firestore
    const loadData = useCallback(async () => {
        console.log('[useSchoolData] Loading data from Firestore...');
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            // Fetch all collections in parallel
            const [
                students,
                learningAreas,
                grades,
                coreValues,
                coreValueGrades,
                attendanceRecords,
                teachers,
                parents,
                sections,
                settingsArray,
                substituteAssignments,
                classSchedules,
                assignments,
                studentAssignmentGrades,
                lessonPlans,
                announcements,
            ] = await Promise.all([
                fetchCollection<Student>('students'),
                fetchCollection<LearningArea>('learningAreas'),
                fetchCollection<Grade>('grades'),
                fetchCollection<CoreValue>('coreValues'),
                fetchCollection<CoreValueGrade>('coreValueGrades'),
                fetchCollection<AttendanceRecord>('attendanceRecords'),
                fetchCollection<Teacher>('teachers'),
                fetchCollection<Parent>('parents'),
                fetchCollection<Section>('sections'),
                fetchCollection<SchoolSettings>('settings'),
                fetchCollection<SubstituteAssignment>('substituteAssignments'),
                fetchCollection<ClassSchedule>('classSchedules'),
                fetchCollection<Assignment>('assignments'),
                fetchCollection<StudentAssignmentGrade>('studentAssignmentGrades'),
                fetchCollection<LessonPlan>('lessonPlans'),
                fetchCollection<Announcement>('announcements'),
            ]);

            console.log(`✅ Loaded: ${students.length} students, ${teachers.length} teachers, ${grades.length} grades`);

            setState({
                loading: false,
                error: null,
                students,
                learningAreas: learningAreas.length > 0 ? learningAreas : DEFAULT_LEARNING_AREAS,
                grades,
                coreValues,
                coreValueGrades,
                attendanceRecords,
                teachers,
                parents,
                sections,
                settings: settingsArray[0] || MOCK_SETTINGS,
                substituteAssignments,
                classSchedules,
                assignments,
                studentAssignmentGrades,
                lessonPlans,
                announcements,
                monthlySchoolDaysConfig: DEFAULT_MONTHLY_SCHOOL_DAYS_CONFIG,
            });
        } catch (error) {
            console.error('[useSchoolData] Failed to load data:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to load data'
            }));
        }
    }, []);

    // Initial load on mount
    useEffect(() => {
        console.log('[useSchoolData] Component mounted');
        loadData();

        // Optional: Real-time announcements (low volume, high value)
        // Uncomment if you want announcements to update in real-time
        /*
        const db = getFirestoreInstance();
        const unsubscribe = onSnapshot(collection(db, 'announcements'), (snapshot) => {
            const announcements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
            setState(prev => ({ ...prev, announcements }));
        });
        return () => unsubscribe();
        */
    }, [loadData]);

    // Manual refresh function - exposed to components
    const refresh = useCallback(() => {
        console.log('[useSchoolData] Manual refresh triggered');
        return loadData();
    }, [loadData]);

    // === CRUD OPERATIONS ===

    // Students
    const addStudent = useCallback((student: Omit<Student, 'id' | 'enrollmentDate'>) => {
        if (state.students.some(s => s.email === student.email)) {
            return { success: false, message: 'A student with this email already exists.' };
        }

        const newStudent: Student = {
            ...student,
            id: `s_${Date.now()}`,
            enrollmentDate: new Date().toISOString().split('T')[0],
        };

        // Optimistic update
        setState(prev => ({ ...prev, students: [...prev.students, newStudent] }));
        
        // Write to Firestore
        writeToFirestore('students', newStudent.id, newStudent);

        return { success: true };
    }, [state.students]);

    const updateStudent = useCallback((student: Student) => {
        setState(prev => ({
            ...prev,
            students: prev.students.map(s => s.id === student.id ? student : s)
        }));
        writeToFirestore('students', student.id, student);
    }, []);

    const deleteStudent = useCallback((studentId: string) => {
        setState(prev => ({
            ...prev,
            students: prev.students.filter(s => s.id !== studentId),
            grades: prev.grades.filter(g => g.studentId !== studentId),
            coreValueGrades: prev.coreValueGrades.filter(cvg => cvg.studentId !== studentId),
            attendanceRecords: prev.attendanceRecords.filter(ar => ar.studentId !== studentId),
        }));
        deleteFromFirestore('students', studentId);
    }, []);

    // Grades
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

    const updateGrade = useCallback((
        studentId: string, 
        learningAreaId: string, 
        quarter: 'q1'|'q2'|'q3'|'q4', 
        value?: number, 
        subSubject?: string
    ) => {
        setState(prev => {
            const learningArea = prev.learningAreas.find(la => la.id === learningAreaId);
            let existing = prev.grades.find(g => g.studentId === studentId && g.learningAreaId === learningAreaId);
            
            if (!existing) {
                existing = { 
                    id: `g_${studentId}_${learningAreaId}`, 
                    studentId, 
                    learningAreaId 
                } as Grade;
            } else {
                existing = { ...existing };
            }

            if (learningArea?.isComposite && subSubject) {
                const current = (existing[quarter] as Record<string, number | undefined>) || {};
                const next = { ...current } as any;
                if (value === undefined) delete next[subSubject];
                else next[subSubject] = value;
                (existing as any)[quarter] = next;
            } else {
                (existing as any)[quarter] = value as any;
            }

            const calc = computeFinalAndRemarks(existing);
            existing.finalGrade = calc.finalGrade;
            existing.remarks = calc.remarks;

            // Write to Firestore
            writeToFirestore('grades', existing.id, existing);

            const nextGrades = [
                ...prev.grades.filter(g => !(g.studentId === studentId && g.learningAreaId === learningAreaId)),
                existing
            ];

            return { ...prev, grades: nextGrades };
        });
    }, [state.learningAreas]);

    // Core Values
    const updateCoreValueGrade = useCallback((
        studentId: string, 
        coreValueId: string, 
        quarter: 'q1'|'q2'|'q3'|'q4', 
        behavior: string, 
        value: CoreValueMarking | ''
    ) => {
        setState(prev => {
            const existing = prev.coreValueGrades.find(r => r.studentId === studentId && r.coreValueId === coreValueId);
            let nextRecord: CoreValueGrade;
            
            if (!existing) {
                nextRecord = { 
                    id: `cvg_${studentId}_${coreValueId}`, 
                    studentId, 
                    coreValueId, 
                    q1: {}, q2: {}, q3: {}, q4: {} 
                } as CoreValueGrade;
            } else {
                nextRecord = { ...existing, [quarter]: { ...(existing as any)[quarter] } } as any;
            }

            if (value === '' || value == null) {
                delete (nextRecord as any)[quarter][behavior];
            } else {
                (nextRecord as any)[quarter][behavior] = value;
            }

            writeToFirestore('coreValueGrades', nextRecord.id, nextRecord);

            const updatedList = prev.coreValueGrades.map(r => 
                (r.studentId === studentId && r.coreValueId === coreValueId) ? nextRecord : r
            );
            const next = updatedList.some(r => r.id === nextRecord.id) 
                ? updatedList 
                : [...prev.coreValueGrades, nextRecord];

            return { ...prev, coreValueGrades: next };
        });
    }, []);

    // Attendance
    const updateAttendance = useCallback((studentId: string, date: string, status: AttendanceStatus) => {
        setState(prev => {
            const existing = prev.attendanceRecords.find(ar => ar.studentId === studentId);
            
            if (existing) {
                const updated = { 
                    ...existing, 
                    dailyStatus: { ...existing.dailyStatus, [date]: status }
                };
                writeToFirestore('attendanceRecords', studentId, updated);
                return {
                    ...prev,
                    attendanceRecords: prev.attendanceRecords.map(ar => 
                        ar.studentId === studentId ? updated : ar
                    )
                };
            } else {
                const newRecord: AttendanceRecord = {
                    studentId,
                    dailyStatus: { [date]: status }
                };
                writeToFirestore('attendanceRecords', studentId, newRecord);
                return {
                    ...prev,
                    attendanceRecords: [...prev.attendanceRecords, newRecord]
                };
            }
        });
    }, []);

    // Learning Areas
    const addLearningArea = useCallback((area: Omit<LearningArea, 'id'>) => {
        const newArea: LearningArea = { id: `la_${Date.now()}`, ...area };
        setState(prev => ({ ...prev, learningAreas: [...prev.learningAreas, newArea] }));
        writeToFirestore('learningAreas', newArea.id, newArea);
    }, []);

    const updateLearningArea = useCallback((learningAreaId: string, area: Omit<LearningArea, 'id'>) => {
        const updatedArea: LearningArea = { id: learningAreaId, ...area };
        setState(prev => ({
            ...prev,
            learningAreas: prev.learningAreas.map(la => la.id === learningAreaId ? updatedArea : la)
        }));
        writeToFirestore('learningAreas', learningAreaId, updatedArea);
    }, []);

    const deleteLearningArea = useCallback((learningAreaId: string) => {
        setState(prev => ({
            ...prev,
            learningAreas: prev.learningAreas.filter(la => la.id !== learningAreaId),
            grades: prev.grades.filter(g => g.learningAreaId !== learningAreaId),
        }));
        deleteFromFirestore('learningAreas', learningAreaId);
    }, []);

    // Teachers
    const addTeacher = useCallback((teacher: Omit<Teacher, 'id'>) => {
        const newTeacher: Teacher = { id: `t_${Date.now()}`, ...teacher };
        setState(prev => ({ ...prev, teachers: [...prev.teachers, newTeacher] }));
        writeToFirestore('teachers', newTeacher.id, newTeacher);
    }, []);

    const updateTeacher = useCallback((teacher: Teacher) => {
        setState(prev => ({
            ...prev,
            teachers: prev.teachers.map(t => t.id === teacher.id ? teacher : t)
        }));
        writeToFirestore('teachers', teacher.id, teacher);
    }, []);

    const deleteTeacher = useCallback((teacherId: string) => {
        setState(prev => ({ ...prev, teachers: prev.teachers.filter(t => t.id !== teacherId) }));
        deleteFromFirestore('teachers', teacherId);
    }, []);

    // Parents
    const addParent = useCallback((parent: Omit<Parent, 'id'>) => {
        const newParent: Parent = { id: `p_${Date.now()}`, ...parent };
        setState(prev => ({ ...prev, parents: [...prev.parents, newParent] }));
        writeToFirestore('parents', newParent.id, newParent);
    }, []);

    const updateParent = useCallback((parent: Parent) => {
        setState(prev => ({
            ...prev,
            parents: prev.parents.map(p => p.id === parent.id ? parent : p)
        }));
        writeToFirestore('parents', parent.id, parent);
    }, []);

    const deleteParent = useCallback((parentId: string) => {
        setState(prev => ({ ...prev, parents: prev.parents.filter(p => p.id !== parentId) }));
        deleteFromFirestore('parents', parentId);
    }, []);

    const assignStudentToParent = useCallback((parentId: string, studentId: string) => {
        setState(prev => ({
            ...prev,
            parents: prev.parents.map(p => 
                p.id === parentId 
                    ? { ...p, studentIds: [...(p.studentIds || []), studentId] }
                    : p
            )
        }));
        const parent = state.parents.find(p => p.id === parentId);
        if (parent) {
            const updated = { ...parent, studentIds: [...(parent.studentIds || []), studentId] };
            writeToFirestore('parents', parentId, updated);
        }
    }, [state.parents]);

    const unassignStudentFromParent = useCallback((parentId: string, studentId: string) => {
        setState(prev => ({
            ...prev,
            parents: prev.parents.map(p => 
                p.id === parentId 
                    ? { ...p, studentIds: (p.studentIds || []).filter(id => id !== studentId) }
                    : p
            )
        }));
        const parent = state.parents.find(p => p.id === parentId);
        if (parent) {
            const updated = { ...parent, studentIds: (parent.studentIds || []).filter(id => id !== studentId) };
            writeToFirestore('parents', parentId, updated);
        }
    }, [state.parents]);

    // Sections
    const addSection = useCallback((section: Omit<Section, 'id'>) => {
        const newSection: Section = { id: `sec_${Date.now()}`, ...section };
        setState(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
        writeToFirestore('sections', newSection.id, newSection);
    }, []);

    const updateSection = useCallback((section: Section) => {
        setState(prev => ({
            ...prev,
            sections: prev.sections.map(s => s.id === section.id ? section : s)
        }));
        writeToFirestore('sections', section.id, section);
    }, []);

    const deleteSection = useCallback((sectionId: string) => {
        setState(prev => ({ ...prev, sections: prev.sections.filter(s => s.id !== sectionId) }));
        deleteFromFirestore('sections', sectionId);
    }, []);

    // Settings
    const updateSettings = useCallback((settings: SchoolSettings) => {
        setState(prev => ({ ...prev, settings }));
        writeToFirestore('settings', 'default', settings);
    }, []);

    // Substitute Assignments
    const addSubstituteAssignment = useCallback((assignment: Omit<SubstituteAssignment, 'id'>) => {
        const newAssignment: SubstituteAssignment = { id: `sa_${Date.now()}`, ...assignment };
        setState(prev => ({ ...prev, substituteAssignments: [...prev.substituteAssignments, newAssignment] }));
        writeToFirestore('substituteAssignments', newAssignment.id, newAssignment);
    }, []);

    const updateSubstituteAssignment = useCallback((assignment: SubstituteAssignment) => {
        setState(prev => ({
            ...prev,
            substituteAssignments: prev.substituteAssignments.map(a => a.id === assignment.id ? assignment : a)
        }));
        writeToFirestore('substituteAssignments', assignment.id, assignment);
    }, []);

    const deleteSubstituteAssignment = useCallback((assignmentId: string) => {
        setState(prev => ({ 
            ...prev, 
            substituteAssignments: prev.substituteAssignments.filter(a => a.id !== assignmentId) 
        }));
        deleteFromFirestore('substituteAssignments', assignmentId);
    }, []);

    // Class Schedules
    const addSchedule = useCallback((sched: Omit<ClassSchedule, 'id'>) => {
        const newSchedule: ClassSchedule = { id: `cs_${Date.now()}`, ...sched };
        setState(prev => ({ ...prev, classSchedules: [...prev.classSchedules, newSchedule] }));
        writeToFirestore('classSchedules', newSchedule.id, newSchedule);
        return { success: true };
    }, []);

    const updateSchedule = useCallback((sched: ClassSchedule) => {
        setState(prev => ({
            ...prev,
            classSchedules: prev.classSchedules.map(s => s.id === sched.id ? sched : s)
        }));
        writeToFirestore('classSchedules', sched.id, sched);
        return { success: true };
    }, []);

    const deleteSchedule = useCallback((scheduleId: string) => {
        setState(prev => ({ ...prev, classSchedules: prev.classSchedules.filter(s => s.id !== scheduleId) }));
        deleteFromFirestore('classSchedules', scheduleId);
    }, []);

    // Assignments
    const addAssignment = useCallback((assignment: Omit<Assignment, 'id'>) => {
        const newAssignment: Assignment = { id: `a_${Date.now()}`, ...assignment };
        setState(prev => ({ ...prev, assignments: [...prev.assignments, newAssignment] }));
        writeToFirestore('assignments', newAssignment.id, newAssignment);
    }, []);

    const updateAssignment = useCallback((assignment: Assignment) => {
        setState(prev => ({
            ...prev,
            assignments: prev.assignments.map(a => a.id === assignment.id ? assignment : a)
        }));
        writeToFirestore('assignments', assignment.id, assignment);
    }, []);

    const deleteAssignment = useCallback((assignmentId: string) => {
        setState(prev => ({
            ...prev,
            assignments: prev.assignments.filter(a => a.id !== assignmentId),
            studentAssignmentGrades: prev.studentAssignmentGrades.filter(g => g.assignmentId !== assignmentId),
        }));
        deleteFromFirestore('assignments', assignmentId);
    }, []);

    const updateAssignmentGrade = useCallback((
        studentId: string, 
        assignmentId: string, 
        score: number | null, 
        feedback: string | null
    ) => {
        setState(prev => {
            const existing = prev.studentAssignmentGrades.find(
                g => g.studentId === studentId && g.assignmentId === assignmentId
            );

            if (existing) {
                const updated = { ...existing, score, feedback, updatedAt: Date.now() };
                writeToFirestore('studentAssignmentGrades', existing.id!, updated);
                return {
                    ...prev,
                    studentAssignmentGrades: prev.studentAssignmentGrades.map(g => 
                        g.id === existing.id ? updated : g
                    )
                };
            } else {
                const newGrade: StudentAssignmentGrade = {
                    id: `sag_${studentId}_${assignmentId}`,
                    studentId,
                    assignmentId,
                    score,
                    feedback,
                    submissionDate: null,
                    filePath: null,
                    updatedAt: Date.now()
                };
                writeToFirestore('studentAssignmentGrades', newGrade.id!, newGrade);
                return {
                    ...prev,
                    studentAssignmentGrades: [...prev.studentAssignmentGrades, newGrade]
                };
            }
        });
    }, []);

    const submitAssignment = useCallback((studentId: string, assignmentId: string, filePath: string) => {
        setState(prev => {
            const existing = prev.studentAssignmentGrades.find(
                g => g.studentId === studentId && g.assignmentId === assignmentId
            );

            if (existing) {
                const updated = { 
                    ...existing, 
                    submissionDate: new Date().toISOString(), 
                    filePath,
                    updatedAt: Date.now()
                };
                writeToFirestore('studentAssignmentGrades', existing.id!, updated);
                return {
                    ...prev,
                    studentAssignmentGrades: prev.studentAssignmentGrades.map(g => 
                        g.id === existing.id ? updated : g
                    )
                };
            } else {
                const newGrade: StudentAssignmentGrade = {
                    id: `sag_${studentId}_${assignmentId}`,
                    studentId,
                    assignmentId,
                    submissionDate: new Date().toISOString(),
                    filePath,
                    score: null,
                    feedback: null,
                    updatedAt: Date.now()
                };
                writeToFirestore('studentAssignmentGrades', newGrade.id!, newGrade);
                return {
                    ...prev,
                    studentAssignmentGrades: [...prev.studentAssignmentGrades, newGrade]
                };
            }
        });
    }, []);

    // Lesson Plans
    const addLessonPlan = useCallback((plan: Omit<LessonPlan, 'id'>) => {
        const newPlan: LessonPlan = { id: `lp_${Date.now()}`, ...plan };
        setState(prev => ({ ...prev, lessonPlans: [...prev.lessonPlans, newPlan] }));
        writeToFirestore('lessonPlans', newPlan.id, newPlan);
    }, []);

    const updateLessonPlan = useCallback((plan: LessonPlan) => {
        setState(prev => ({
            ...prev,
            lessonPlans: prev.lessonPlans.map(p => p.id === plan.id ? plan : p)
        }));
        writeToFirestore('lessonPlans', plan.id, plan);
    }, []);

    const deleteLessonPlan = useCallback((planId: string) => {
        setState(prev => ({ ...prev, lessonPlans: prev.lessonPlans.filter(p => p.id !== planId) }));
        deleteFromFirestore('lessonPlans', planId);
    }, []);

    // Announcements
    const addAnnouncement = useCallback((announcement: Omit<Announcement, 'id'>) => {
        const newAnnouncement: Announcement = { id: `ann_${Date.now()}`, ...announcement };
        setState(prev => ({ ...prev, announcements: [...prev.announcements, newAnnouncement] }));
        writeToFirestore('announcements', newAnnouncement.id, newAnnouncement);
    }, []);

    const updateAnnouncement = useCallback((announcement: Announcement) => {
        setState(prev => ({
            ...prev,
            announcements: prev.announcements.map(a => a.id === announcement.id ? announcement : a)
        }));
        writeToFirestore('announcements', announcement.id, announcement);
    }, []);

    const deleteAnnouncement = useCallback((id: string) => {
        setState(prev => ({ ...prev, announcements: prev.announcements.filter(a => a.id !== id) }));
        deleteFromFirestore('announcements', id);
    }, []);

    // Return state and all operations
    return {
        ...state,
        refresh, // NEW: Manual refresh function
        addStudent,
        updateStudent,
        deleteStudent,
        updateGrade,
        updateCoreValueGrade,
        addLearningArea,
        updateLearningArea,
        deleteLearningArea,
        updateSettings,
        updateAttendance,
        addParent,
        updateParent,
        deleteParent,
        assignStudentToParent,
        unassignStudentFromParent,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addSection,
        updateSection,
        deleteSection,
        addSubstituteAssignment,
        updateSubstituteAssignment,
        deleteSubstituteAssignment,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        updateAssignmentGrade,
        submitAssignment,
        addLessonPlan,
        updateLessonPlan,
        deleteLessonPlan,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
    };
};

export type SchoolDataHook = ReturnType<typeof useSchoolData>;

// Default learning areas (same as original)
const DEFAULT_LEARNING_AREAS: LearningArea[] = [
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
        gradeLevel: [3, 4, 5, 6],
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
];
