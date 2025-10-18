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

import { useCallback, useState, useEffect } from 'react';
import { useQuery, useQueries, useQueryClient, QueryKey } from '@tanstack/react-query';
import type { 
    Student, LearningArea, Grade, CoreValue, CoreValueGrade, AttendanceRecord, 
    Teacher, Section, SchoolSettings, SubstituteAssignment, ClassSchedule, 
    Assignment, StudentAssignmentGrade, LessonPlan, Parent, Announcement, 
    AttendanceStatus, CoreValueMarking 
} from '../types';
import { getFirestoreInstance, auth } from '../src/services/firestoreService';
import { 
    collection, getDocs, doc, setDoc, deleteDoc, 
    serverTimestamp, onSnapshot, query, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData
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

// Helper: Fetch a single collection from Firestore with pagination
async function fetchPaginatedCollection<T>(
    collectionName: string, 
    limitCount: number, 
    lastDoc: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<{ data: T[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
    try {
        console.log(`[Firestore] Fetching paginated collection: ${collectionName}, limit: ${limitCount}, lastDoc: ${lastDoc ? 'present' : 'null'}`);
        const db = getFirestoreInstance();
        console.log(`[Firestore] Inside fetchPaginatedCollection, db instance:`, db);
        console.log(`[Firestore] Querying collection: ${collectionName}`);
        let q = query(collection(db, collectionName), orderBy('id', 'desc'), limit(limitCount)); // Order by ID descending to show new students first
        const snapshot = await getDocs(q);
        console.log(`[Firestore] Snapshot for ${collectionName}: empty=${snapshot.empty}, docs.length=${snapshot.docs.length}`);
        const data = snapshot.docs.map(doc => {
            const docData = doc.data();
            console.log(`[Firestore] Raw document data for ${collectionName} (ID: ${doc.id}):`, docData);
            const typedData = { id: doc.id, ...docData } as T;
            console.log(`[Firestore] Mapped document data for ${collectionName} (ID: ${doc.id}):`, typedData);
            return typedData;
        });
        const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
        console.log(`[Firestore] Finished fetching paginated collection: ${collectionName}, fetched ${data.length} documents.`);
        return { data, lastDoc: newLastDoc };
    } catch (error) {
        console.error(`[Firestore] Failed to fetch paginated ${collectionName}:`, error);
        return { data: [], lastDoc: null };
    }
}

// Helper: Fetch a single collection from Firestore (non-paginated)
async function fetchCollection<T>(collectionName: string): Promise<T[]> {
    try {
        console.log(`[Firestore] Fetching collection: ${collectionName}`);
        const db = getFirestoreInstance();
        const snapshot = await getDocs(collection(db, collectionName));
        console.log(`[Firestore] Snapshot for ${collectionName}: empty=${snapshot.empty}, docs.length=${snapshot.docs.length}`);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        console.log(`[Firestore] Finished fetching collection: ${collectionName}, fetched ${data.length} documents.`);
        return data;
    } catch (error) {
        console.error(`[Firestore] Failed to fetch ${collectionName}:`, error);
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
    }  catch (error) {
        console.error(`Failed to delete from ${collectionName}:`, error);
    }
}


// Main hook function
export function useSchoolData(): SchoolDataHook {
    const queryClient = useQueryClient();
    const STUDENTS_PER_PAGE = 50; // Define pagination limit

    // State for paginated students
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [lastStudentDoc, setLastStudentDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMoreStudents, setHasMoreStudents] = useState(true);

    // Fetch initial students
    const { 
        data: initialStudentsData, 
        isLoading: isLoadingStudents, 
        isFetching: isFetchingStudents, 
        error: studentsError, 
        refetch: refetchStudents 
    } = useQuery({
        queryKey: ['students', 'initial'],
        queryFn: () => fetchPaginatedCollection<Student>('students', STUDENTS_PER_PAGE),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    console.log("[useSchoolData] useQuery result - data:", initialStudentsData, "isLoading:", isLoadingStudents, "isFetching:", isFetchingStudents, "error:", studentsError);

    // Update student state when initialStudentsData changes
    useEffect(() => {
        console.log("[useSchoolData] useEffect triggered. initialStudentsData:", initialStudentsData, "studentsError:", studentsError);
        if (initialStudentsData) {
            console.log("[useSchoolData] Processing initialStudentsData.data:", initialStudentsData.data);
            setAllStudents(initialStudentsData.data);
            setLastStudentDoc(initialStudentsData.lastDoc);
            setHasMoreStudents(initialStudentsData.data.length === STUDENTS_PER_PAGE);
            if (initialStudentsData.data.length === 0) {
                console.error("[useSchoolData] Initial student data fetch returned empty results.");
            }
        } else if (studentsError) {
            console.error("[useSchoolData] Error fetching initial students:", studentsError);
        } else {
            console.error("[useSchoolData] initialStudentsData is null/undefined after fetch attempt.");
        }
    }, [initialStudentsData, STUDENTS_PER_PAGE, studentsError]);

    // Fetch more students
    const fetchMoreStudents = useCallback(async () => {
        if (!hasMoreStudents || isFetchingStudents) return;

        const { data, lastDoc: newLastDoc } = await fetchPaginatedCollection<Student>('students', STUDENTS_PER_PAGE, lastStudentDoc);
        setAllStudents(prev => [...prev, ...data]);
        setLastStudentDoc(newLastDoc);
        setHasMoreStudents(data.length === STUDENTS_PER_PAGE);
    }, [hasMoreStudents, isFetchingStudents, lastStudentDoc, STUDENTS_PER_PAGE]);

    // Other collections (non-paginated for now)
    const queries = useQueries({
      queries: [
        // { queryKey: ['students'], queryFn: () => fetchCollection<Student>('students') }, // Commented out to isolate student pagination
        { queryKey: ['learningAreas'], queryFn: () => fetchCollection<LearningArea>('learningAreas') },
        { queryKey: ['grades'], queryFn: () => fetchCollection<Grade>('grades') },
        { queryKey: ['coreValues'], queryFn: () => fetchCollection<CoreValue>('coreValues') },
        { queryKey: ['coreValueGrades'], queryFn: () => fetchCollection<CoreValueGrade>('coreValueGrades') },
        { queryKey: ['attendanceRecords'], queryFn: () => fetchCollection<AttendanceRecord>('attendanceRecords') },
        { queryKey: ['teachers'], queryFn: () => fetchCollection<Teacher>('teachers') },
        { queryKey: ['parents'], queryFn: () => fetchCollection<Parent>('parents') },
        { queryKey: ['sections'], queryFn: () => fetchCollection<Section>('sections') },
        { queryKey: ['settings'], queryFn: () => fetchCollection<SchoolSettings>('settings') },
        { queryKey: ['substituteAssignments'], queryFn: () => fetchCollection<SubstituteAssignment>('substituteAssignments') },
        { queryKey: ['classSchedules'], queryFn: () => fetchCollection<ClassSchedule>('classSchedules') },
        { queryKey: ['assignments'], queryFn: () => fetchCollection<Assignment>('assignments') },
        { queryKey: ['studentAssignmentGrades'], queryFn: () => fetchCollection<StudentAssignmentGrade>('studentAssignmentGrades') },
        { queryKey: ['lessonPlans'], queryFn: () => fetchCollection<LessonPlan>('lessonPlans') },
        { queryKey: ['announcements'], queryFn: () => fetchCollection<Announcement>('announcements') },
      ]
    });

    const loading = isLoadingStudents || queries.some(q => q.isLoading);
    const error = studentsError || queries.find(q => q.error)?.error as string | null;
    
    const refresh = useCallback(() => {
      refetchStudents();
      queries.forEach(q => q.refetch && q.refetch());
    }, [refetchStudents, queries]);

    // Helper to invalidate a query after mutation
    const invalidate = (key: QueryKey) => queryClient.invalidateQueries({ queryKey: key });

    // === CRUD OPERATIONS ===
    // Students
    const addStudent = useCallback(async (student: Omit<Student, 'id' | 'enrollmentDate'>) => {
        const newStudent: Student = {
            ...student,
            id: `s_${Date.now()}`,
            enrollmentDate: new Date().toISOString().split('T')[0],
        };
        await writeToFirestore('students', newStudent.id, newStudent);
        await invalidate(['students']); // Invalidate the general 'students' key
        await invalidate(['students', 'initial']); // Invalidate the specific initial students query
        return { success: true };
    }, []);

    const updateStudent = useCallback(async (student: Student) => {
        await writeToFirestore('students', student.id, student);
        await invalidate(['students']);
    }, []);

    const deleteStudent = useCallback(async (studentId: string) => {
        await deleteFromFirestore('students', studentId);
        await invalidate(['students']);
        await invalidate(['grades']);
        await invalidate(['coreValueGrades']);
        await invalidate(['attendanceRecords']);
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

    const updateGrade = useCallback(async (
        studentId: string, 
        learningAreaId: string, 
        quarter: 'q1'|'q2'|'q3'|'q4', 
        value?: number, 
        subSubject?: string
    ) => {
        const grades: Grade[] = queryClient.getQueryData(['grades']) || [];
        const learningAreas: LearningArea[] = queryClient.getQueryData(['learningAreas']) || DEFAULT_LEARNING_AREAS;
        const learningArea = learningAreas.find(la => la.id === learningAreaId);
        let existing = grades.find(g => g.studentId === studentId && g.learningAreaId === learningAreaId);
        if (!existing) {
            existing = { id: `g_${studentId}_${learningAreaId}`, studentId, learningAreaId } as Grade;
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
        await writeToFirestore('grades', existing.id, existing);
        await invalidate(['grades']);
    }, []);

    // Core Values
    const updateCoreValueGrade = useCallback(async (
        studentId: string, 
        coreValueId: string, 
        quarter: 'q1'|'q2'|'q3'|'q4', 
        behavior: string, 
        value: CoreValueMarking | ''
    ) => {
        const coreValueGrades: CoreValueGrade[] = queryClient.getQueryData(['coreValueGrades']) || [];
        let existing = coreValueGrades.find(r => r.studentId === studentId && r.coreValueId === coreValueId);
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
        await writeToFirestore('coreValueGrades', nextRecord.id, nextRecord);
        await invalidate(['coreValueGrades']);
    }, []);

    // Attendance
    const updateAttendance = useCallback(async (studentId: string, date: string, status: AttendanceStatus) => {
        const attendanceRecords: AttendanceRecord[] = queryClient.getQueryData(['attendanceRecords']) || [];
        let existing = attendanceRecords.find(ar => ar.studentId === studentId);
        if (existing) {
            const updated = { ...existing, dailyStatus: { ...existing.dailyStatus, [date]: status } };
            await writeToFirestore('attendanceRecords', studentId, updated);
        } else {
            const newRecord: AttendanceRecord = { studentId, dailyStatus: { [date]: status } };
            await writeToFirestore('attendanceRecords', studentId, newRecord);
        }
        await invalidate(['attendanceRecords']);
    }, []);

    // Learning Areas
    const addLearningArea = useCallback(async (area: Omit<LearningArea, 'id'>) => {
        const newArea: LearningArea = { id: `la_${Date.now()}`, ...area };
        await writeToFirestore('learningAreas', newArea.id, newArea);
        await invalidate(['learningAreas']);
    }, []);

    const updateLearningArea = useCallback(async (learningAreaId: string, area: Omit<LearningArea, 'id'>) => {
        const updatedArea: LearningArea = { id: learningAreaId, ...area };
        await writeToFirestore('learningAreas', learningAreaId, updatedArea);
        await invalidate(['learningAreas']);
    }, []);

    const deleteLearningArea = useCallback(async (learningAreaId: string) => {
        await deleteFromFirestore('learningAreas', learningAreaId);
        await invalidate(['learningAreas']);
        await invalidate(['grades']);
    }, []);

    // Teachers
    const addTeacher = useCallback(async (teacher: Omit<Teacher, 'id'>) => {
        const newTeacher: Teacher = { id: `t_${Date.now()}`, ...teacher };
        await writeToFirestore('teachers', newTeacher.id, newTeacher);
        await invalidate(['teachers']);
    }, []);

    const updateTeacher = useCallback(async (teacher: Teacher) => {
        await writeToFirestore('teachers', teacher.id, teacher);
        await invalidate(['teachers']);
    }, []);

    const deleteTeacher = useCallback(async (teacherId: string) => {
        await deleteFromFirestore('teachers', teacherId);
        await invalidate(['teachers']);
    }, []);

    // Parents
    const addParent = useCallback(async (parent: Omit<Parent, 'id'>) => {
        const newParent: Parent = { id: `p_${Date.now()}`, ...parent };
        await writeToFirestore('parents', newParent.id, newParent);
        await invalidate(['parents']);
    }, []);

    const updateParent = useCallback(async (parent: Parent) => {
        await writeToFirestore('parents', parent.id, parent);
        await invalidate(['parents']);
    }, []);

    const deleteParent = useCallback(async (parentId: string) => {
        await deleteFromFirestore('parents', parentId);
        await invalidate(['parents']);
    }, []);

    const assignStudentToParent = useCallback(async (parentId: string, studentId: string) => {
        const parents: Parent[] = queryClient.getQueryData(['parents']) || [];
        const parent = parents.find(p => p.id === parentId);
        if (parent) {
            const updated = { ...parent, studentIds: [...(parent.studentIds || []), studentId] };
            await writeToFirestore('parents', parentId, updated);
            await invalidate(['parents']);
        }
    }, []);

    const unassignStudentFromParent = useCallback(async (parentId: string, studentId: string) => {
        const parents: Parent[] = queryClient.getQueryData(['parents']) || [];
        const parent = parents.find(p => p.id === parentId);
        if (parent) {
            const updated = { ...parent, studentIds: (parent.studentIds || []).filter(id => id !== studentId) };
            await writeToFirestore('parents', parentId, updated);
            await invalidate(['parents']);
        }
    }, []);

    // Sections
    const addSection = useCallback(async (section: Omit<Section, 'id'>) => {
        const newSection: Section = { id: `sec_${Date.now()}`, ...section };
        await writeToFirestore('sections', newSection.id, newSection);
        await invalidate(['sections']);
    }, []);

    const updateSection = useCallback(async (section: Section) => {
        await writeToFirestore('sections', section.id, section);
        await invalidate(['sections']);
    }, []);

    const deleteSection = useCallback(async (sectionId: string) => {
        await deleteFromFirestore('sections', sectionId);
        await invalidate(['sections']);
    }, []);

    // Settings
    const updateSettings = useCallback(async (settings: SchoolSettings) => {
        await writeToFirestore('settings', 'default', settings);
        await invalidate(['settings']);
    }, []);

    // Substitute Assignments
    const addSubstituteAssignment = useCallback(async (assignment: Omit<SubstituteAssignment, 'id'>) => {
        const newAssignment: SubstituteAssignment = { id: `sa_${Date.now()}`, ...assignment };
        await writeToFirestore('substituteAssignments', newAssignment.id, newAssignment);
        await invalidate(['substituteAssignments']);
    }, []);

    const updateSubstituteAssignment = useCallback(async (assignment: SubstituteAssignment) => {
        await writeToFirestore('substituteAssignments', assignment.id, assignment);
        await invalidate(['substituteAssignments']);
    }, []);

    const deleteSubstituteAssignment = useCallback(async (assignmentId: string) => {
        await deleteFromFirestore('substituteAssignments', assignmentId);
        await invalidate(['substituteAssignments']);
    }, []);

    // Class Schedules
    const addSchedule = useCallback(async (sched: Omit<ClassSchedule, 'id'>) => {
        const newSchedule: ClassSchedule = { id: `cs_${Date.now()}`, ...sched };
        await writeToFirestore('classSchedules', newSchedule.id, newSchedule);
        await invalidate(['classSchedules']);
        return { success: true };
    }, []);

    const updateSchedule = useCallback(async (sched: ClassSchedule) => {
        await writeToFirestore('classSchedules', sched.id, sched);
        await invalidate(['classSchedules']);
        return { success: true };
    }, []);

    const deleteSchedule = useCallback(async (scheduleId: string) => {
        await deleteFromFirestore('classSchedules', scheduleId);
        await invalidate(['classSchedules']);
    }, []);

    // Assignments
    const addAssignment = useCallback(async (assignment: Omit<Assignment, 'id'>) => {
        const newAssignment: Assignment = { id: `a_${Date.now()}`, ...assignment };
        await writeToFirestore('assignments', newAssignment.id, newAssignment);
        await invalidate(['assignments']);
    }, []);

    const updateAssignment = useCallback(async (assignment: Assignment) => {
        await writeToFirestore('assignments', assignment.id, assignment);
        await invalidate(['assignments']);
    }, []);

    const deleteAssignment = useCallback(async (assignmentId: string) => {
        await deleteFromFirestore('assignments', assignmentId);
        await invalidate(['assignments']);
        await invalidate(['studentAssignmentGrades']);
    }, []);

    const updateAssignmentGrade = useCallback(async (
        studentId: string, 
        assignmentId: string, 
        score: number | null, 
        feedback: string | null
    ) => {
        const studentAssignmentGrades: StudentAssignmentGrade[] = queryClient.getQueryData(['studentAssignmentGrades']) || [];
        let existing = studentAssignmentGrades.find(g => g.studentId === studentId && g.assignmentId === assignmentId);
        if (existing) {
            const updated = { ...existing, score, feedback, updatedAt: Date.now() };
            await writeToFirestore('studentAssignmentGrades', existing.id!, updated);
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
            await writeToFirestore('studentAssignmentGrades', newGrade.id!, newGrade);
        }
        await invalidate(['studentAssignmentGrades']);
    }, []);

    const submitAssignment = useCallback(async (studentId: string, assignmentId: string, filePath: string) => {
        const studentAssignmentGrades: StudentAssignmentGrade[] = queryClient.getQueryData(['studentAssignmentGrades']) || [];
        let existing = studentAssignmentGrades.find(g => g.studentId === studentId && g.assignmentId === assignmentId);
        if (existing) {
            const updated = { 
                ...existing, 
                submissionDate: new Date().toISOString(), 
                filePath,
                updatedAt: Date.now()
            };
            await writeToFirestore('studentAssignmentGrades', existing.id!, updated);
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
            await writeToFirestore('studentAssignmentGrades', newGrade.id!, newGrade);
        }
        await invalidate(['studentAssignmentGrades']);
    }, []);

    // Lesson Plans
    const addLessonPlan = useCallback(async (plan: Omit<LessonPlan, 'id'>) => {
        const newPlan: LessonPlan = { id: `lp_${Date.now()}`, ...plan };
        await writeToFirestore('lessonPlans', newPlan.id, newPlan);
        await invalidate(['lessonPlans']);
    }, []);

    const updateLessonPlan = useCallback(async (plan: LessonPlan) => {
        await writeToFirestore('lessonPlans', plan.id, plan);
        await invalidate(['lessonPlans']);
    }, []);

    const deleteLessonPlan = useCallback(async (planId: string) => {
        await deleteFromFirestore('lessonPlans', planId);
        await invalidate(['lessonPlans']);
    }, []);

    // Announcements
    const addAnnouncement = useCallback(async (announcement: Omit<Announcement, 'id'>) => {
        const newAnnouncement: Announcement = { id: `ann_${Date.now()}`, ...announcement };
        await writeToFirestore('announcements', newAnnouncement.id, newAnnouncement);
        await invalidate(['announcements']);
    }, []);

    const updateAnnouncement = useCallback(async (announcement: Announcement) => {
        await writeToFirestore('announcements', announcement.id, announcement);
        await invalidate(['announcements']);
    }, []);

    const deleteAnnouncement = useCallback(async (id: string) => {
        await deleteFromFirestore('announcements', id);
        await invalidate(['announcements']);
    }, []);

    // Compose the state from queries and return from the hook
    return {
        students: allStudents, // Now using paginated students
        learningAreas: (queries[0]?.data?.length ? queries[0].data : DEFAULT_LEARNING_AREAS) ?? [],
        grades: queries[1]?.data ?? [],
        coreValues: queries[2]?.data ?? [],
        coreValueGrades: queries[3]?.data ?? [],
        attendanceRecords: queries[4]?.data ?? [],
        teachers: queries[5]?.data ?? [],
        parents: queries[6]?.data ?? [],
        sections: queries[7]?.data ?? [],
        settings: queries[8]?.data?.[0] ?? MOCK_SETTINGS,
        substituteAssignments: queries[9]?.data ?? [],
        classSchedules: queries[10]?.data ?? [],
        assignments: queries[11]?.data ?? [],
        studentAssignmentGrades: queries[12]?.data ?? [],
        lessonPlans: queries[13]?.data ?? [],
        announcements: queries[14]?.data ?? [],
        monthlySchoolDaysConfig: DEFAULT_MONTHLY_SCHOOL_DAYS_CONFIG,
        loading,
        error: error ? (typeof error === 'string' ? error : JSON.stringify(error)) : null,
        refresh,
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
        // New pagination exports
        fetchMoreStudents,
        hasMoreStudents,
        isFetchingStudents,
    }
}

// Explicit type for consumers (matches the return shape of useSchoolData)
export interface SchoolDataHook {
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
    loading: boolean;
    error: string | null;
    refresh: () => void;
    addStudent: (student: Omit<Student, 'id' | 'enrollmentDate'>) => Promise<{ success: boolean }>;
    updateStudent: (student: Student) => Promise<void>;
    deleteStudent: (studentId: string) => Promise<void>;
    updateGrade: (studentId: string, learningAreaId: string, quarter: 'q1' | 'q2' | 'q3' | 'q4', value?: number, subSubject?: string) => Promise<void>;
    updateCoreValueGrade: (studentId: string, coreValueId: string, quarter: 'q1' | 'q2' | 'q3' | 'q4', behavior: string, value: CoreValueMarking | '') => Promise<void>;
    addLearningArea: (area: Omit<LearningArea, 'id'>) => Promise<void>;
    updateLearningArea: (learningAreaId: string, area: Omit<LearningArea, 'id'>) => Promise<void>;
    deleteLearningArea: (learningAreaId: string) => Promise<void>;
    updateSettings: (settings: SchoolSettings) => Promise<void>;
    updateAttendance: (studentId: string, date: string, status: AttendanceStatus) => Promise<void>;
    addParent: (parent: Omit<Parent, 'id'>) => Promise<void>;
    updateParent: (parent: Parent) => Promise<void>;
    deleteParent: (parentId: string) => Promise<void>;
    assignStudentToParent: (parentId: string, studentId: string) => Promise<void>;
    unassignStudentFromParent: (parentId: string, studentId: string) => Promise<void>;
    addTeacher: (teacher: Omit<Teacher, 'id'>) => Promise<void>;
    updateTeacher: (teacher: Teacher) => Promise<void>;
    deleteTeacher: (teacherId: string) => Promise<void>;
    addSection: (section: Omit<Section, 'id'>) => Promise<void>;
    updateSection: (section: Section) => Promise<void>;
    deleteSection: (sectionId: string) => Promise<void>;
    addSubstituteAssignment: (assignment: Omit<SubstituteAssignment, 'id'>) => Promise<void>;
    updateSubstituteAssignment: (assignment: SubstituteAssignment) => Promise<void>;
    deleteSubstituteAssignment: (assignmentId: string) => Promise<void>;
    addSchedule: (sched: Omit<ClassSchedule, 'id'>) => Promise<{ success: boolean }>;
    updateSchedule: (sched: ClassSchedule) => Promise<{ success: boolean }>;
    deleteSchedule: (scheduleId: string) => Promise<void>;
    addAssignment: (assignment: Omit<Assignment, 'id'>) => Promise<void>;
    updateAssignment: (assignment: Assignment) => Promise<void>;
    deleteAssignment: (assignmentId: string) => Promise<void>;
    updateAssignmentGrade: (studentId: string, assignmentId: string, score: number | null, feedback: string | null) => Promise<void>;
    submitAssignment: (studentId: string, assignmentId: string, filePath: string) => Promise<void>;
    addLessonPlan: (plan: Omit<LessonPlan, 'id'>) => Promise<void>;
    updateLessonPlan: (plan: LessonPlan) => Promise<void>;
    deleteLessonPlan: (planId: string) => Promise<void>;
    addAnnouncement: (announcement: Omit<Announcement, 'id'>) => Promise<void>;
    updateAnnouncement: (announcement: Announcement) => Promise<void>;
    deleteAnnouncement: (id: string) => Promise<void>;
    // New pagination exports
    fetchMoreStudents: () => Promise<void>;
    hasMoreStudents: boolean;
    isFetchingStudents: boolean;
}

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
    }
];
