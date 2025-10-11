import { useState, useEffect, useCallback } from 'react';
import type { Student, LearningArea, Grade, SubGradeRecord, CoreValue, CoreValueGrade, CoreValueMarking, AttendanceRecord, Teacher, Section, AuthUser, SchoolSettings, SubstituteAssignment, ClassSchedule, StudentUser, Assignment, StudentAssignmentGrade, LessonPlan, Parent, ParentUser, Announcement, AttendanceStatus } from '../types';
import * as dbService from '../src/services/dbService';
// FIX: Import StoreName type from dbService to resolve 'Cannot find name' error.
import type { StoreName } from '../src/services/dbService';

// --- DATA GENERATION FOR STRESS TESTING ---

const STRESS_TEST_CONFIG = {
    teachers: 50,
    sections: 40,
    students: 1000,
};

const FIRST_NAMES = ["Liam", "Olivia", "Noah", "Emma", "Oliver", "Ava", "Elijah", "Charlotte", "William", "Sophia", "James", "Amelia", "Benjamin", "Isabella", "Lucas", "Mia", "Henry", "Evelyn", "Alexander", "Harper"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = <T>(arr: T[]): T => arr[rand(0, arr.length - 1)];

// Base data that is always present
const MOCK_LEARNING_AREAS: LearningArea[] = [
  { id: 'la1', name: 'Mother Tongue Based (MTB)', credits: 3 },
  { id: 'la2', name: 'Filipino', credits: 3 },
  { id: 'la3', name: 'English', credits: 4 },
  { id: 'la4', name: 'Math', credits: 4 },
  { id: 'la5', name: 'Araling Panlipunan (AP)', credits: 4 },
  { id: 'la6', name: 'Edukasyon sa Pagpapakatao (EsP)', credits: 2 },
  { id: 'la7', name: 'MAPEH', credits: 4, isComposite: true, subSubjects: ['Music', 'Arts', 'PE', 'Health']},
  { id: 'la8', name: 'Science', credits: 4 },
];

const MOCK_CORE_VALUES: CoreValue[] = [
  { id: 'cv1', name: 'Maka-Diyos', behaviors: ["Expresses one's spiritual beliefs while respecting the spiritual beliefs of others", "Shows adherence to ethical principles by upholding truth"] },
  { id: 'cv2', name: 'Makatao', behaviors: ["Is sensitive to individual, social, and cultural differences", "Demonstrates contributions toward solidarity"] },
  { id: 'cv3', name: 'Makakalikasan', behaviors: ["Cares for the environment and utilizes resources wisely, judiciously, and economically"] },
  { id: 'cv4', name: 'Makabansa', behaviors: ["Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen", "Demonstrates appropriate behavior in carrying out activities in the school, community, and country"] }
];

export const MONTHLY_SCHOOL_DAYS_CONFIG: Record<string, number> = {
  'Jun': 21, 'Jul': 22, 'Aug': 23, 'Sep': 21, 'Oct': 20,
  'Nov': 19, 'Dec': 15, 'Jan': 22, 'Feb': 20, 'Mar': 21, 'Apr': 5,
};

const MOCK_SETTINGS: SchoolSettings = {
    schoolName: 'ENRIQUE URENCIA ELEMENTARY SCHOOL',
    region: 'Region XI',
    division: 'Division of the City of Mati',
    district: 'Governor Generoso North District',
    schoolYear: '2023-2024'
};

const generateData = () => {
    const teachers: Teacher[] = [
      { id: 't0', name: 'Admin User', email: 'admin@school.edu', role: 'admin', password: 'admin123', assignments: [] },
      { id: 't-principal', name: 'Dr. Evelyn Reed', email: 'principal@school.edu', role: 'principal', password: 'teacher123', assignments: [] },
      { id: 't-registrar', name: 'Mr. Samuel Grant', email: 'registrar@school.edu', role: 'registrar', password: 'teacher123', assignments: [] },
      { id: 't-demo', name: 'Maria Dela Cruz', email: 'teacher@school.edu', role: 'teacher', password: 'teacher123', assignments: [] },
    ];
    for (let i = 0; i < STRESS_TEST_CONFIG.teachers; i++) {
        const firstName = getRandomItem(FIRST_NAMES);
        const lastName = getRandomItem(LAST_NAMES);
        teachers.push({
        id: `t${i + 1}`,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@school.edu`,
        role: 'teacher',
        password: 'teacher123',
        assignments: [],
        });
    }

    const sections: Section[] = [];
    const gradeLevels = [1, 2, 3, 4, 5, 6];
    let gradeCounts: Record<number, number> = {};
    const availableAdvisers = teachers.filter(t => t.role === 'teacher');
    for (let i = 0; i < STRESS_TEST_CONFIG.sections; i++) {
        const gradeLevel = gradeLevels[i % gradeLevels.length];
        gradeCounts[gradeLevel] = (gradeCounts[gradeLevel] || 0) + 1;
        sections.push({
        id: `sec${i + 1}`,
        gradeLevel,
        name: String.fromCharCode(64 + gradeCounts[gradeLevel]), // A, B, C...
        adviserId: getRandomItem(availableAdvisers).id,
        });
    }

    const students: Student[] = [];
    for (let i = 0; i < STRESS_TEST_CONFIG.students; i++) {
        const firstName = getRandomItem(FIRST_NAMES);
        const lastName = getRandomItem(LAST_NAMES);
        students.push({
        id: `s${i + 1}`,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@school.edu`,
        enrollmentDate: '2023-09-01',
        lrn: Array.from({ length: 12 }, () => rand(0, 9)).join(''),
        dateOfBirth: `201${rand(4, 5)}-${String(rand(1, 12)).padStart(2, '0')}-${String(rand(1, 28)).padStart(2, '0')}`,
        sex: rand(0, 1) === 0 ? 'Male' : 'Female',
        sectionId: getRandomItem(sections).id,
        password: 'student123',
        });
    }
    students[0].id = 's-test-parent-child';
    students[0].name = 'Alice Johnson';
    students[0].email = 'alice.j@school.edu';

    const parents: Parent[] = [
        { id: 'p1', name: 'Sarah Johnson', email: 's.johnson@family.com', password: 'parent123', studentIds: ['s-test-parent-child'] },
    ];

    const quarters: ('q1' | 'q2' | 'q3' | 'q4')[] = ['q1', 'q2', 'q3', 'q4'];
    const grades: Grade[] = students.flatMap(student => 
        MOCK_LEARNING_AREAS.map(la => {
        const grade: Grade = { id: `g-${student.id}-${la.id}`, studentId: student.id, learningAreaId: la.id };
        let finalGradeSum = 0;
        let quarterCount = 0;
        quarters.forEach(q => {
            if (la.isComposite) {
            const subGrades: SubGradeRecord = {};
            la.subSubjects!.forEach(sub => { subGrades[sub] = rand(70, 98); });
            grade[q] = subGrades;
            const avg = Math.round(Object.values(subGrades).reduce((a, b) => a + b, 0) / la.subSubjects!.length);
            finalGradeSum += avg;
            quarterCount++;
            } else {
            const qGrade = rand(72, 99);
            grade[q] = qGrade;
            finalGradeSum += qGrade;
            quarterCount++;
            }
        });
        const finalGrade = Math.round(finalGradeSum / quarterCount);
        grade.finalGrade = finalGrade;
        grade.remarks = finalGrade >= 75 ? 'Passed' : 'Failed';
        return grade;
        })
    );
    
    const markings: CoreValueMarking[] = ['AO', 'SO', 'RO', 'NO'];
    const coreValueGrades: CoreValueGrade[] = students.flatMap(student =>
        MOCK_CORE_VALUES.map(cv => {
            const grade: CoreValueGrade = { id: `cvg-${student.id}-${cv.id}`, studentId: student.id, coreValueId: cv.id };
            quarters.forEach(q => {
                grade[q] = {};
                cv.behaviors.forEach(b => {
                    grade[q]![b] = markings[rand(0, 3)];
                });
            });
            return grade;
        })
    );
    
    const attendanceRecords: AttendanceRecord[] = students.map(student => {
        const record: AttendanceRecord = { studentId: student.id, dailyStatus: {} };
        const year = new Date().getFullYear();
        const statuses: AttendanceStatus[] = ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'A', 'L', 'E'];
        for (let month = 0; month < 12; month++) {
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                if (date.getDay() >= 1 && date.getDay() <= 5) { // Weekdays only
                    const dateStr = date.toISOString().split('T')[0];
                    record.dailyStatus[dateStr] = getRandomItem(statuses);
                }
            }
        }
        return record;
    });

    const timeSlots = ["08:00-09:00", "09:00-10:00", "10:30-11:30", "13:00-14:00", "14:00-15:00"];
    const days: ClassSchedule['dayOfWeek'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    let scheduleIdCounter = 1;
    const classSchedules: ClassSchedule[] = [];
    days.forEach(day => {
        classSchedules.push({ id: `cs${scheduleIdCounter++}`, title: 'Recess', type: 'extracurricular', scope: 'all', dayOfWeek: day, startTime: '10:00', endTime: '10:30' });
        classSchedules.push({ id: `cs${scheduleIdCounter++}`, title: 'Lunch', type: 'extracurricular', scope: 'all', dayOfWeek: day, startTime: '12:00', endTime: '13:00' });
    });
    const teacherSchedule: Record<string, Set<string>> = {}; // teacherId -> Set of "day-startTime"
    sections.forEach(section => {
        const availableSlotsByDay: Record<string, string[]> = { Monday: [...timeSlots], Tuesday: [...timeSlots], Wednesday: [...timeSlots], Thursday: [...timeSlots], Friday: [...timeSlots] };
        MOCK_LEARNING_AREAS.forEach(la => {
        let scheduled = false;
        for (const day of days) {
            if (availableSlotsByDay[day].length > 0 && !scheduled) {
            const slot = availableSlotsByDay[day].shift()!;
            const [startTime, endTime] = slot.split('-');
            const availableTeacher = teachers.find(t => {
                if (t.role !== 'teacher') return false;
                const scheduleKey = `${day}-${startTime}`;
                if (!teacherSchedule[t.id]) teacherSchedule[t.id] = new Set();
                return !teacherSchedule[t.id].has(scheduleKey);
            });
            if (availableTeacher) {
                classSchedules.push({ id: `cs${scheduleIdCounter++}`, title: la.name, type: 'academic', scope: 'section', sectionId: section.id, learningAreaId: la.id, teacherId: availableTeacher.id, dayOfWeek: day, startTime, endTime });
                teacherSchedule[availableTeacher.id].add(`${day}-${startTime}`);
                scheduled = true;
            }
            }
        }
        });
    });
    
    classSchedules.push({
      id: 'cs-multi',
      title: 'Book Fair Week',
      type: 'extracurricular',
      scope: 'all',
      dayOfWeek: 'Monday',
      endDayOfWeek: 'Friday',
      startTime: '09:00',
      endTime: '15:00',
    });
    
    const substituteAssignments: SubstituteAssignment[] = [
        { id: 'sub1', teacherId: teachers[4].id, originalTeacherId: teachers[5].id, startDate: '2024-10-28', endDate: '2024-10-30' }
    ];

    const studentAssignmentGrades: StudentAssignmentGrade[] = [];

    return {
        teachers, sections, students, parents, grades, coreValueGrades, attendanceRecords, classSchedules, substituteAssignments,
        learningAreas: MOCK_LEARNING_AREAS,
        coreValues: MOCK_CORE_VALUES,
        settings: MOCK_SETTINGS,
        assignments: [],
        studentAssignmentGrades,
        lessonPlans: [],
        announcements: [],
    };
};

const calculateQuarterAverage = (grade: number | SubGradeRecord | undefined): number | undefined => {
  if (grade === undefined) return undefined; if (typeof grade === 'number') return grade;
  const subGrades = Object.values(grade).filter(g => typeof g === 'number'); if (subGrades.length === 0) return undefined;
  const total = subGrades.reduce((acc, val) => acc + val, 0); return Math.round(total / subGrades.length);
};

type SchoolDataState = {
    students: Student[]; learningAreas: LearningArea[]; grades: Grade[]; coreValues: CoreValue[];
    coreValueGrades: CoreValueGrade[]; attendanceRecords: AttendanceRecord[]; teachers: Teacher[];
    parents: Parent[]; sections: Section[]; settings: SchoolSettings; substituteAssignments: SubstituteAssignment[];
    classSchedules: ClassSchedule[]; assignments: Assignment[]; studentAssignmentGrades: StudentAssignmentGrade[];
    lessonPlans: LessonPlan[]; announcements: Announcement[];
};

export const useSchoolData = (isOnline: boolean) => {
    const [state, setState] = useState<SchoolDataState & { loading: boolean }>({
        loading: true, students: [], learningAreas: [], grades: [], coreValues: [], coreValueGrades: [],
        attendanceRecords: [], teachers: [], parents: [], sections: [], settings: MOCK_SETTINGS,
        substituteAssignments: [], classSchedules: [], assignments: [], studentAssignmentGrades: [],
        lessonPlans: [], announcements: [],
    });

    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const studentCount = await dbService.count('students');
                if (studentCount > 0) {
                    console.log("Loading data from IndexedDB...");
                    const [ students, learningAreas, grades, coreValues, coreValueGrades, attendanceRecords, teachers, parents, sections, settings, substituteAssignments, classSchedules, assignments, studentAssignmentGrades, lessonPlans, announcements ] = await Promise.all([
                        dbService.getAll<Student>('students'), dbService.getAll<LearningArea>('learningAreas'),
                        dbService.getAll<Grade>('grades'), dbService.getAll<CoreValue>('coreValues'),
                        dbService.getAll<CoreValueGrade>('coreValueGrades'), dbService.getAll<AttendanceRecord>('attendanceRecords'),
                        dbService.getAll<Teacher>('teachers'), dbService.getAll<Parent>('parents'),
                        dbService.getAll<Section>('sections'), dbService.getAll<SchoolSettings>('settings'),
                        dbService.getAll<SubstituteAssignment>('substituteAssignments'), dbService.getAll<ClassSchedule>('classSchedules'),
                        dbService.getAll<Assignment>('assignments'), dbService.getAll<StudentAssignmentGrade>('studentAssignmentGrades'),
                        dbService.getAll<LessonPlan>('lessonPlans'), dbService.getAll<Announcement>('announcements'),
                    ]);
                    setState({ loading: false, students, learningAreas, grades, coreValues, coreValueGrades, attendanceRecords, teachers, parents, sections, settings: settings[0] || MOCK_SETTINGS, substituteAssignments, classSchedules, assignments, studentAssignmentGrades, lessonPlans, announcements });
                } else {
                    console.log("No data in DB, generating new dataset...");
                    const generated = generateData();
                    await Promise.all([
                        dbService.bulkPut('students', generated.students), dbService.bulkPut('learningAreas', generated.learningAreas),
                        dbService.bulkPut('grades', generated.grades), dbService.bulkPut('coreValues', generated.coreValues),
                        dbService.bulkPut('coreValueGrades', generated.coreValueGrades), dbService.bulkPut('attendanceRecords', generated.attendanceRecords),
                        dbService.bulkPut('teachers', generated.teachers), dbService.bulkPut('parents', generated.parents),
                        dbService.bulkPut('sections', generated.sections), dbService.bulkPut('settings', [generated.settings]),
                        dbService.bulkPut('substituteAssignments', generated.substituteAssignments), dbService.bulkPut('classSchedules', generated.classSchedules),
                        // No need to bulk put empty arrays
                    ]);
                    setState({ loading: false, ...generated });
                }
            } catch (error) {
                console.error("Failed to load data from IndexedDB, error:", error);
                setState(prevState => ({ ...prevState, loading: false }));
            }
        };
        loadData();
    }, []);

  useEffect(() => {
    if (isOnline) { setIsSyncing(true); const timer = setTimeout(() => { console.log("Data synced with server."); setIsSyncing(false); }, 1500); return () => clearTimeout(timer); }
  }, [isOnline]);

  const login = useCallback(async (email: string, password: string, type: 'staff' | 'student' | 'parent'): Promise<{ user: AuthUser | StudentUser | ParentUser; type: 'staff' | 'student' | 'parent' } | null> => {
    if (state.loading) return null;
    const lowerEmail = email.toLowerCase();
    if (type === 'staff') {
        const user = state.teachers.find(t => t.email.toLowerCase() === lowerEmail);
        if (user && user.password === password) { const { password: _, ...authUser } = user; return { user: authUser, type: 'staff' }; }
    } else if (type === 'student') {
        const user = state.students.find(s => s.email.toLowerCase() === lowerEmail);
        if (user && user.password === password) { const { password: _, ...studentUser } = user; return { user: studentUser, type: 'student' }; }
    } else {
        const user = state.parents.find(p => p.email.toLowerCase() === lowerEmail);
        if (user && user.password === password) { const { password: _, ...parentUser } = user; return { user: parentUser, type: 'parent' }; }
    }
    return null;
  }, [state.loading, state.teachers, state.students, state.parents]);

  const createMutation = <T extends any[]>(dbAction: (...args: T) => Promise<any>, stateUpdate: (...args: T) => void) => {
    return useCallback(async (...args: T) => {
        stateUpdate(...args); // Optimistic UI update
        try {
            await dbAction(...args);
        } catch (error) {
            console.error("Failed to persist change to DB:", error);
            // Here you could implement a rollback mechanism if needed
        }
    }, [stateUpdate, dbAction]);
  };
  
    // FIX: Update addStudent to return a success/error object for validation feedback in the UI.
    const addStudent = useCallback((student: Omit<Student, 'id' | 'enrollmentDate'>): { success: boolean; message?: string } => {
        if (state.students.some(s => s.email.toLowerCase() === student.email.toLowerCase())) {
            return { success: false, message: 'A student with this email already exists.' };
        }
        const newStudent: Student = { ...student, id: `s${Date.now()}`, enrollmentDate: new Date().toISOString().split('T')[0], password: 'student123' };
        dbService.add('students', newStudent).catch(console.error);
        setState(prev => ({ ...prev, students: [...prev.students, newStudent] }));
        return { success: true };
    }, [state.students]);

    const updateStudent = useCallback((updatedStudent: Student) => {
        dbService.put('students', updatedStudent).catch(console.error);
        setState(prev => ({ ...prev, students: prev.students.map(s => s.id === updatedStudent.id ? updatedStudent : s) }));
    }, []);
    const deleteStudent = useCallback((studentId: string) => {
        // This is complex, involving multiple stores. Handle carefully.
        dbService.remove('students', studentId).catch(console.error);
        // Fire-and-forget deletion of related items
        state.grades.filter(g => g.studentId === studentId).forEach(g => dbService.remove('grades', g.id).catch(console.error));
        state.coreValueGrades.filter(cvg => cvg.studentId === studentId).forEach(cvg => dbService.remove('coreValueGrades', cvg.id).catch(console.error));
        dbService.remove('attendanceRecords', studentId).catch(console.error);
        
        setState(prev => ({
            ...prev,
            students: prev.students.filter(s => s.id !== studentId),
            grades: prev.grades.filter(g => g.studentId !== studentId),
            coreValueGrades: prev.coreValueGrades.filter(cvg => cvg.studentId !== studentId),
            attendanceRecords: prev.attendanceRecords.filter(ar => ar.studentId !== studentId),
            parents: prev.parents.map(p => ({ ...p, studentIds: p.studentIds.filter(id => id !== studentId) })),
        }));
    }, [state.grades, state.coreValueGrades]);

    const addParent = useCallback((parent: Omit<Parent, 'id'>) => {
        const newParent: Parent = { ...parent, id: `p${Date.now()}`, password: 'parent123' };
        dbService.add('parents', newParent).catch(console.error);
        setState(prev => ({ ...prev, parents: [...prev.parents, newParent] }));
    }, []);
    const updateParent = useCallback((updatedParent: Parent) => {
        dbService.put('parents', updatedParent).catch(console.error);
        setState(prev => ({ ...prev, parents: prev.parents.map(p => p.id === updatedParent.id ? updatedParent : p) }));
    }, []);
    const deleteParent = useCallback((parentId: string) => {
        dbService.remove('parents', parentId).catch(console.error);
        setState(prev => ({ ...prev, parents: prev.parents.filter(p => p.id !== parentId) }));
    }, []);
    const assignStudentToParent = useCallback((parentId: string, studentId: string) => {
        const parent = state.parents.find(p => p.id === parentId);
        if(parent && !parent.studentIds.includes(studentId)) {
            const updatedParent = { ...parent, studentIds: [...parent.studentIds, studentId] };
            dbService.put('parents', updatedParent).catch(console.error);
            setState(prev => ({...prev, parents: prev.parents.map(p => p.id === parentId ? updatedParent : p)}));
        }
    }, [state.parents]);
    const unassignStudentFromParent = useCallback((parentId: string, studentId: string) => {
        const parent = state.parents.find(p => p.id === parentId);
        if(parent) {
            const updatedParent = { ...parent, studentIds: parent.studentIds.filter(id => id !== studentId) };
            dbService.put('parents', updatedParent).catch(console.error);
            setState(prev => ({...prev, parents: prev.parents.map(p => p.id === parentId ? updatedParent : p)}));
        }
    }, [state.parents]);

    const updateGrade = useCallback((studentId: string, learningAreaId: string, quarter: 'q1'|'q2'|'q3'|'q4', gradeValue: number|undefined, subSubject?: string) => {
        let updatedGrade: Grade | undefined;
        const newGrades = [...state.grades];
        let gradeIndex = newGrades.findIndex(g => g.studentId === studentId && g.learningAreaId === learningAreaId);
        if (gradeIndex === -1) { 
            const newGradeEntry: Grade = { id: `g-${studentId}-${learningAreaId}`, studentId, learningAreaId };
            newGrades.push(newGradeEntry);
            gradeIndex = newGrades.length - 1;
        }
        updatedGrade = { ...newGrades[gradeIndex] };
        const learningArea = state.learningAreas.find(la => la.id === learningAreaId);
        if (learningArea?.isComposite && subSubject) {
            const currentQuarterGrade = updatedGrade[quarter]; let newSubGrades: SubGradeRecord = {};
            if (typeof currentQuarterGrade === 'object' && currentQuarterGrade !== null) { newSubGrades = { ...currentQuarterGrade }; }
            if (gradeValue === undefined) { delete newSubGrades[subSubject]; } else { newSubGrades[subSubject] = gradeValue; }
            updatedGrade[quarter] = newSubGrades;
        } else if (!learningArea?.isComposite) {
            if (gradeValue === undefined) { delete updatedGrade[quarter]; } else { updatedGrade[quarter] = gradeValue; }
        }
        const quarterAverages = [calculateQuarterAverage(updatedGrade.q1), calculateQuarterAverage(updatedGrade.q2), calculateQuarterAverage(updatedGrade.q3), calculateQuarterAverage(updatedGrade.q4)].filter(g => g !== undefined) as number[];
        if (quarterAverages.length > 0) { const total = quarterAverages.reduce((acc, val) => acc + val, 0); const finalGrade = Math.round(total / quarterAverages.length); updatedGrade.finalGrade = finalGrade; updatedGrade.remarks = finalGrade >= 75 ? 'Passed' : 'Failed'; } else { delete updatedGrade.finalGrade; delete updatedGrade.remarks; }
        newGrades[gradeIndex] = updatedGrade;

        dbService.put('grades', updatedGrade).catch(console.error);
        setState(prev => ({...prev, grades: newGrades}));
    }, [state.grades, state.learningAreas]);

    const updateAttendance = useCallback((studentId: string, date: string, status: AttendanceStatus) => {
        const newRecords = [...state.attendanceRecords];
        let recordIndex = newRecords.findIndex(r => r.studentId === studentId);
        if (recordIndex === -1) { 
            const newRecordEntry: AttendanceRecord = { studentId, dailyStatus: {} };
            newRecords.push(newRecordEntry); 
            recordIndex = newRecords.length - 1; 
        }
        const updatedRecord = { ...newRecords[recordIndex], dailyStatus: { ...newRecords[recordIndex].dailyStatus, [date]: status } };
        newRecords[recordIndex] = updatedRecord;

        dbService.put('attendanceRecords', updatedRecord).catch(console.error);
        setState(prev => ({ ...prev, attendanceRecords: newRecords }));
    }, [state.attendanceRecords]);
    
    // Simplified wrappers for other mutations
    const createGenericMutations = <T extends {id: string}>(storeName: StoreName, stateKey: keyof SchoolDataState) => {
        const add = (item: Omit<T, 'id'>) => {
            const newItem = { ...item, id: `${storeName.slice(0,3)}-${Date.now()}` } as T;
            dbService.add(storeName, newItem).catch(console.error);
            // FIX: The type `prev[stateKey]` is a wide union. Cast to `unknown` first to satisfy TypeScript's strict checks.
            setState(prev => ({ ...prev, [stateKey]: [...(prev[stateKey] as unknown as T[]), newItem] }));
        };
        const update = (updatedItem: T) => {
            dbService.put(storeName, updatedItem).catch(console.error);
            // FIX: The type `prev[stateKey]` is a wide union. Cast to `unknown` first to satisfy TypeScript's strict checks.
            setState(prev => ({ ...prev, [stateKey]: (prev[stateKey] as unknown as T[]).map(i => i.id === updatedItem.id ? updatedItem : i) }));
        };
        const remove = (itemId: string) => {
            dbService.remove(storeName, itemId).catch(console.error);
            // FIX: The type `prev[stateKey]` is a wide union. Cast to `unknown` first to satisfy TypeScript's strict checks.
            setState(prev => ({ ...prev, [stateKey]: (prev[stateKey] as unknown as T[]).filter(i => i.id !== itemId) }));
        };
        return { add, update, remove };
    };

    const { add: addLearningArea, remove: deleteLearningArea } = createGenericMutations<LearningArea>('learningAreas', 'learningAreas');
    const { add: addTeacher, update: updateTeacher, remove: deleteTeacher } = createGenericMutations<Teacher>('teachers', 'teachers');
    const { add: addSection, update: updateSection, remove: deleteSection } = createGenericMutations<Section>('sections', 'sections');
    const { add: addSubstituteAssignment, update: updateSubstituteAssignment, remove: deleteSubstituteAssignment } = createGenericMutations<SubstituteAssignment>('substituteAssignments', 'substituteAssignments');
    const { add: addSchedule, update: updateSchedule, remove: deleteSchedule } = createGenericMutations<ClassSchedule>('classSchedules', 'classSchedules');
    const { add: addAssignment, update: updateAssignment, remove: deleteAssignment } = createGenericMutations<Assignment>('assignments', 'assignments');
    const { add: addLessonPlan, update: updateLessonPlan, remove: deleteLessonPlan } = createGenericMutations<LessonPlan>('lessonPlans', 'lessonPlans');
    const { add: addAnnouncement, update: updateAnnouncement, remove: deleteAnnouncement } = createGenericMutations<Announcement>('announcements', 'announcements');

    // Custom mutations that don't fit the generic pattern
    const updateCoreValueGrade = useCallback((studentId: string, coreValueId: string, quarter: 'q1'|'q2'|'q3'|'q4', behavior: string, marking: CoreValueMarking|'') => {
        const newGrades = [...state.coreValueGrades];
        let gradeIndex = newGrades.findIndex(g => g.studentId === studentId && g.coreValueId === coreValueId);
        if (gradeIndex === -1) { newGrades.push({ id: `cvg-${studentId}-${coreValueId}`, studentId, coreValueId }); gradeIndex = newGrades.length - 1; }
        const updatedGrade = { ...newGrades[gradeIndex] };
        const newQuarterMarkings = { ...(updatedGrade[quarter] ?? {}) };
        if (marking === '') { delete newQuarterMarkings[behavior]; } else { newQuarterMarkings[behavior] = marking; }
        updatedGrade[quarter] = newQuarterMarkings;
        newGrades[gradeIndex] = updatedGrade;
        
        dbService.put('coreValueGrades', updatedGrade).catch(console.error);
        setState(prev => ({...prev, coreValueGrades: newGrades}));
    }, [state.coreValueGrades]);

    const updateSettings = useCallback((newSettings: SchoolSettings) => {
        dbService.put('settings', newSettings).catch(console.error);
        setState(prev => ({ ...prev, settings: newSettings }));
    }, []);
    
    const updateAssignmentGrade = useCallback((studentId: string, assignmentId: string, score: number | null, feedback: string | null) => {
        const newGrades = [...state.studentAssignmentGrades];
        const gradeIndex = newGrades.findIndex(g => g.studentId === studentId && g.assignmentId === assignmentId);
        const newGrade = gradeIndex > -1 ? { ...newGrades[gradeIndex], score, feedback } : { studentId, assignmentId, score, feedback, submissionDate: null, filePath: null };
        if (gradeIndex > -1) { newGrades[gradeIndex] = newGrade; } else { newGrades.push(newGrade); }

        dbService.put('studentAssignmentGrades', newGrade).catch(console.error);
        setState(prev => ({ ...prev, studentAssignmentGrades: newGrades }));
    }, [state.studentAssignmentGrades]);

    const submitAssignment = useCallback((studentId: string, assignmentId: string, filePath: string) => {
        const newGrades = [...state.studentAssignmentGrades];
        const gradeIndex = newGrades.findIndex(g => g.studentId === studentId && g.assignmentId === assignmentId);
        const submissionDate = new Date().toISOString().split('T')[0];
        const newGrade = gradeIndex > -1 ? { ...newGrades[gradeIndex], filePath, submissionDate } : { studentId, assignmentId, score: null, feedback: null, submissionDate, filePath };
        if (gradeIndex > -1) { newGrades[gradeIndex] = newGrade; } else { newGrades.push(newGrade); }

        dbService.put('studentAssignmentGrades', newGrade).catch(console.error);
        setState(prev => ({ ...prev, studentAssignmentGrades: newGrades }));
    }, [state.studentAssignmentGrades]);
    
    // Custom logic for add/update schedule due to conflict checking
    const addScheduleWithConflictCheck = useCallback((schedule: Omit<ClassSchedule, 'id'>): { success: boolean, message?: string } => {
        const conflict = checkScheduleConflict(schedule, state.classSchedules);
        if (conflict) return { success: false, message: conflict };
        const newSchedule: ClassSchedule = { ...schedule, id: `cs${Date.now()}` };
        dbService.add('classSchedules', newSchedule).catch(console.error);
        setState(prev => ({ ...prev, classSchedules: [...prev.classSchedules, newSchedule] }));
        return { success: true };
    }, [state.classSchedules, state.teachers, state.sections]);
    
    const updateScheduleWithConflictCheck = useCallback((updatedSchedule: ClassSchedule): { success: boolean, message?: string } => {
        const conflict = checkScheduleConflict(updatedSchedule, state.classSchedules, updatedSchedule.id);
        if (conflict) return { success: false, message: conflict };
        dbService.put('classSchedules', updatedSchedule).catch(console.error);
        setState(prev => ({ ...prev, classSchedules: prev.classSchedules.map(s => s.id === updatedSchedule.id ? updatedSchedule : s) }));
        return { success: true };
    }, [state.classSchedules, state.teachers, state.sections]);

    const checkScheduleConflict = (newSchedule: Omit<ClassSchedule, 'id'>, existingSchedules: ClassSchedule[], scheduleIdToIgnore?: string): string | null => {
        const DAYS_ORDER: ClassSchedule['dayOfWeek'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const getDayIndex = (day: ClassSchedule['dayOfWeek']) => DAYS_ORDER.indexOf(day);
        const { startTime: newStart, endTime: newEnd, dayOfWeek: newStartDay, endDayOfWeek: newEndDay, type, scope, sectionId, gradeLevel, teacherId } = newSchedule;
        const newStartIndex = getDayIndex(newStartDay);
        const newEndIndex = newEndDay ? getDayIndex(newEndDay) : newStartIndex;
        if (newEndIndex < newStartIndex) { return "End day cannot be before start day."; }
        const newScheduleSection = state.sections.find(s => s.id === sectionId);
        for (const existing of existingSchedules) {
            if (scheduleIdToIgnore && existing.id === scheduleIdToIgnore) continue;
            const existingStartIndex = getDayIndex(existing.dayOfWeek);
            const existingEndIndex = existing.endDayOfWeek ? getDayIndex(existing.endDayOfWeek) : existingStartIndex;
            const daysOverlap = newStartIndex <= existingEndIndex && existingStartIndex <= newEndIndex;
            if (!daysOverlap) continue;
            const timesOverlap = newStart < existing.endTime && existing.startTime < newEnd;
            if (!timesOverlap) continue;
            if (type === 'academic' && existing.type === 'academic' && teacherId && existing.teacherId === teacherId) {
                const teacher = state.teachers.find(t => t.id === teacherId);
                return `Conflict: ${teacher?.name || 'Teacher'} is already scheduled at this time.`;
            }
            const existingSection = state.sections.find(s => s.id === existing.sectionId);
            if (scope === 'all' || existing.scope === 'all') return `Conflict: A school-wide event is scheduled at this time.`;
            if (scope === 'gradeLevel' && existing.scope === 'gradeLevel' && gradeLevel === existing.gradeLevel) return `Conflict: An event for Grade ${gradeLevel} is already scheduled.`;
            if (scope === 'section' && existing.scope === 'section' && sectionId === existing.sectionId) {
                const section = state.sections.find(s => s.id === sectionId);
                return `Conflict: Section ${section?.name || ''} already has an event scheduled.`;
            }
            if (scope === 'gradeLevel' && existing.scope === 'section' && existingSection && gradeLevel === existingSection.gradeLevel) return `Conflict: Section ${existingSection.name} (Grade ${gradeLevel}) has a class, which conflicts with the grade-level event.`;
            if (scope === 'section' && existing.scope === 'gradeLevel' && newScheduleSection && newScheduleSection.gradeLevel === existing.gradeLevel) return `Conflict: A grade-level event for Grade ${newScheduleSection.gradeLevel} is scheduled, which conflicts with this section's class.`;
        }
        return null;
    };

  return { 
      ...state, login, addStudent, updateStudent, deleteStudent, 
      addLearningArea, deleteLearningArea, addTeacher, updateTeacher, deleteTeacher, 
      addSection, updateSection, deleteSection, updateGrade, updateCoreValueGrade, 
      updateAttendance, updateSettings, addSubstituteAssignment, updateSubstituteAssignment, 
      deleteSubstituteAssignment, addSchedule: addScheduleWithConflictCheck, updateSchedule: updateScheduleWithConflictCheck, 
      deleteSchedule, addAssignment, updateAssignment, deleteAssignment, updateAssignmentGrade, 
      submitAssignment, addLessonPlan, updateLessonPlan, deleteLessonPlan, addAnnouncement, 
      updateAnnouncement, deleteAnnouncement, isSyncing, monthlySchoolDaysConfig: MONTHLY_SCHOOL_DAYS_CONFIG, 
      addParent, updateParent, deleteParent, assignStudentToParent, unassignStudentFromParent 
    };
};

export type SchoolDataHook = ReturnType<typeof useSchoolData>;