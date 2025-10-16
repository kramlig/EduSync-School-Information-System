import { collection, getDocs } from 'firebase/firestore';
import type { Student, LearningArea, Grade, CoreValue, CoreValueGrade, AttendanceRecord, Teacher, Section, SchoolSettings, SubstituteAssignment, ClassSchedule, Assignment, StudentAssignmentGrade, LessonPlan, Parent, Announcement } from '../../types';
import { getFirestoreInstance } from './firestoreService';

type AllData = {
    students: Student[];
    learningAreas: LearningArea[];
    grades: Grade[];
    coreValues: CoreValue[];
    coreValueGrades: CoreValueGrade[];
    attendanceRecords: AttendanceRecord[];
    teachers: Teacher[];
    parents: Parent[];
    sections: Section[];
    settings: SchoolSettings[];
    substituteAssignments: SubstituteAssignment[];
    classSchedules: ClassSchedule[];
    assignments: Assignment[];
    studentAssignmentGrades: StudentAssignmentGrade[];
    lessonPlans: LessonPlan[];
    announcements: Announcement[];
    users?: any[]; // optional legacy/migrated collection
};

async function fetchCollection<T>(collectionName: string): Promise<T[]> {
    const db = getFirestoreInstance();
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}

export async function fetchAllData(): Promise<AllData> {
    const [
        students, learningAreas, grades, coreValues, coreValueGrades,
        attendanceRecords, teachers, parents, sections, settings,
        substituteAssignments, classSchedules, assignments,
        studentAssignmentGrades, lessonPlans, announcements, users
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
        // Attempt to fetch optional users collection; ignore errors.
        fetchCollection<any>('users').catch(() => []),
    ]);

    // Fallback: if teachers is empty but users exist with role metadata, map them.
    let effectiveTeachers = teachers;
    if (effectiveTeachers.length === 0 && users && users.length > 0) {
        effectiveTeachers = users
            .filter(u => u.role === 'admin' || u.role === 'teacher' || u.role === 'principal' || u.role === 'registrar')
            .map(u => ({
                id: u.id || u.uid || u.email,
                name: u.name || u.displayName || u.email?.split('@')[0] || 'Unnamed',
                email: u.email,
                role: u.role === 'admin' ? 'admin' : (u.role || 'teacher'),
                assignments: [],
            })) as Teacher[];
        console.log(`[firestoreReader] Fallback mapped ${effectiveTeachers.length} teachers from users collection.`);
    }

    return {
        students, learningAreas, grades, coreValues, coreValueGrades,
        attendanceRecords, teachers: effectiveTeachers, parents, sections, settings,
        substituteAssignments, classSchedules, assignments,
        studentAssignmentGrades, lessonPlans, announcements,
        users,
    };
}
