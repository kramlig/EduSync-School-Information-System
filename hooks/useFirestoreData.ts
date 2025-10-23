/**
 * FIRESTORE SUBSCRIPTIONS HOOK (Option C Refactor)
 * 
 * Replaces React Query with direct Firestore onSnapshot() subscriptions
 * 
 * Key Benefits:
 * - Real-time updates automatic
 * - Cache-first by default (Firestore SDK handles it)
 * - No dual caching systems (single source of truth)
 * - Simpler code (no React Query abstractions)
 * - Works offline-first (no blank pages)
 * 
 * Migration Status: IN PROGRESS
 * - Day 1 Morning: Students + Teachers (2/16 collections) ✅
 * - Day 1 Afternoon: Add remaining 14 collections
 * - Day 1 Evening: Add all CRUD methods
 */

import { useState, useEffect, useCallback } from 'react';
import { 
    collection, 
    onSnapshot, 
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    where,
    getDocs,
    getDocsFromCache,
    getDocsFromServer,
    limit,
    startAfter,
    QueryDocumentSnapshot,
    DocumentData
} from 'firebase/firestore';
import { getFirestoreInstance, auth, waitForAuthReady } from '../src/services/firestoreService';
import type { 
    Student, LearningArea, Grade, CoreValue, CoreValueGrade, AttendanceRecord, 
    Teacher, Section, SchoolSettings, SubstituteAssignment, ClassSchedule, 
    Assignment, StudentAssignmentGrade, LessonPlan, Parent, Announcement, 
    AttendanceStatus, CoreValueMarking 
} from '../types';

// Import interface from backup (will match exactly)
import type { SchoolDataHook } from './useSchoolData.REACT_QUERY_BACKUP';

// Mock settings (same as React Query version)
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

/**
 * Main Hook: useFirestoreData
 * 
 * Uses Firestore onSnapshot() for real-time subscriptions
 * All data is cached automatically by Firestore SDK
 */
export function useFirestoreData(collectionsToFetch?: string[]): SchoolDataHook {
    console.log('[useFirestoreData] 🚀 Hook initializing...', { collectionsToFetch });

    // ===== STATE MANAGEMENT =====
    // Collections state
    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [parents, setParents] = useState<Parent[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [learningAreas, setLearningAreas] = useState<LearningArea[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [coreValues, setCoreValues] = useState<CoreValue[]>([]);
    const [coreValueGrades, setCoreValueGrades] = useState<CoreValueGrade[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [substituteAssignments, setSubstituteAssignments] = useState<SubstituteAssignment[]>([]);
    const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [studentAssignmentGrades, setStudentAssignmentGrades] = useState<StudentAssignmentGrade[]>([]);
    const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [settings, setSettings] = useState<SchoolSettings>(MOCK_SETTINGS);
    const [monthlySchoolDaysConfig, setMonthlySchoolDaysConfig] = useState<Record<string, number>>(DEFAULT_MONTHLY_SCHOOL_DAYS_CONFIG);

    // Loading & error state
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination state (for students)
    const [lastStudentDoc, setLastStudentDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMoreStudents, setHasMoreStudents] = useState<boolean>(true);
    const [isFetchingStudents, setIsFetchingStudents] = useState<boolean>(false);

    // Search state
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [searchCache, setSearchCache] = useState<Map<string, any>>(new Map());

    // ===== HELPER: Should Fetch Collection =====
    const shouldFetch = useCallback((collectionName: string) => {
        if (collectionsToFetch !== undefined && collectionsToFetch.length === 0) {
            return false; // Empty array = fetch nothing
        }
        return !collectionsToFetch || collectionsToFetch.includes(collectionName);
    }, [collectionsToFetch]);

    // ===== FIRESTORE SUBSCRIPTIONS =====
    useEffect(() => {
        console.log('[useFirestoreData] 📡 Setting up subscriptions...');
        
        const unsubscribers: (() => void)[] = [];
        let isInitialLoad = true;
        let loadedCollections = 0;
        const totalCollections = 16; // All 16 collections (Day 1 Afternoon)

        const checkAllLoaded = () => {
            loadedCollections++;
            console.log(`[useFirestoreData] 📊 Loaded ${loadedCollections}/${totalCollections} collections`);
            if (loadedCollections >= totalCollections && isInitialLoad) {
                setLoading(false);
                isInitialLoad = false;
                console.log('[useFirestoreData] ✅ Initial load complete');
            }
        };

        // Wait for auth before subscribing
        waitForAuthReady().then(() => {
            const db = getFirestoreInstance();

            // ===== STUDENTS SUBSCRIPTION =====
            if (shouldFetch('students')) {
                console.log('[useFirestoreData] 👥 Subscribing to students...');
                
                const studentsQuery = query(
                    collection(db, 'students'),
                    limit(100) // Initial page
                );

                const unsubStudents = onSnapshot(
                    studentsQuery,
                    { includeMetadataChanges: true }, // CRITICAL: Detect cache vs server
                    (snapshot) => {
                        const fromCache = snapshot.metadata.fromCache;
                        console.log(
                            fromCache 
                                ? '📦 [students] Data from CACHE' 
                                : '📡 [students] Data from SERVER'
                        );

                        const studentsData = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        })) as Student[];

                        setStudents(studentsData);
                        
                        // Update pagination state
                        if (snapshot.docs.length > 0) {
                            setLastStudentDoc(snapshot.docs[snapshot.docs.length - 1]);
                            setHasMoreStudents(snapshot.docs.length === 100);
                        } else {
                            setHasMoreStudents(false);
                        }

                        console.log(`[useFirestoreData] ✅ Students updated: ${studentsData.length} documents`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useFirestoreData] ❌ Students subscription error:', err);
                        setError(`Students error: ${err.message}`);
                        checkAllLoaded();
                    }
                );

                unsubscribers.push(unsubStudents);
            } else {
                console.log('[useFirestoreData] ⏭️ Skipping students (not in collectionsToFetch)');
                checkAllLoaded();
            }

            // ===== TEACHERS SUBSCRIPTION =====
            if (shouldFetch('teachers')) {
                console.log('[useFirestoreData] 👨‍🏫 Subscribing to teachers...');
                
                const unsubTeachers = onSnapshot(
                    collection(db, 'teachers'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        const fromCache = snapshot.metadata.fromCache;
                        console.log(
                            fromCache 
                                ? '📦 [teachers] Data from CACHE' 
                                : '📡 [teachers] Data from SERVER'
                        );

                        const teachersData = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        })) as Teacher[];

                        setTeachers(teachersData);
                        console.log(`[useFirestoreData] ✅ Teachers updated: ${teachersData.length} documents`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useFirestoreData] ❌ Teachers subscription error:', err);
                        setError(`Teachers error: ${err.message}`);
                        checkAllLoaded();
                    }
                );

                unsubscribers.push(unsubTeachers);
            } else {
                console.log('[useFirestoreData] ⏭️ Skipping teachers (not in collectionsToFetch)');
                checkAllLoaded();
            }

            // ===== PARENTS SUBSCRIPTION =====
            if (shouldFetch('parents')) {
                console.log('[useFirestoreData] 👪 Subscribing to parents...');
                const unsubParents = onSnapshot(
                    collection(db, 'parents'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [parents] CACHE' : '📡 [parents] SERVER');
                        setParents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Parent[]);
                        console.log(`[useFirestoreData] ✅ Parents: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useFirestoreData] ❌ Parents error:', err);
                        setError(`Parents error: ${err.message}`);
                        checkAllLoaded();
                    }
                );
                unsubscribers.push(unsubParents);
            } else {
                checkAllLoaded();
            }

            // ===== SECTIONS SUBSCRIPTION =====
            if (shouldFetch('sections')) {
                console.log('[useFirestoreData] 📚 Subscribing to sections...');
                const unsubSections = onSnapshot(
                    collection(db, 'sections'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [sections] CACHE' : '📡 [sections] SERVER');
                        setSections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Section[]);
                        console.log(`[useFirestoreData] ✅ Sections: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useFirestoreData] ❌ Sections error:', err);
                        setError(`Sections error: ${err.message}`);
                        checkAllLoaded();
                    }
                );
                unsubscribers.push(unsubSections);
            } else {
                checkAllLoaded();
            }

            // ===== LEARNING AREAS SUBSCRIPTION =====
            if (shouldFetch('learningAreas')) {
                console.log('[useFirestoreData] 📖 Subscribing to learningAreas...');
                const unsubLearningAreas = onSnapshot(
                    collection(db, 'learningAreas'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [learningAreas] CACHE' : '📡 [learningAreas] SERVER');
                        setLearningAreas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LearningArea[]);
                        console.log(`[useFirestoreData] ✅ Learning Areas: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useFirestoreData] ❌ Learning Areas error:', err);
                        setError(`Learning Areas error: ${err.message}`);
                        checkAllLoaded();
                    }
                );
                unsubscribers.push(unsubLearningAreas);
            } else {
                checkAllLoaded();
            }

            // ===== GRADES SUBSCRIPTION =====
            if (shouldFetch('grades')) {
                console.log('[useFirestoreData] 📊 Subscribing to grades...');
                const unsubGrades = onSnapshot(
                    collection(db, 'grades'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [grades] CACHE' : '📡 [grades] SERVER');
                        setGrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Grade[]);
                        console.log(`[useFirestoreData] ✅ Grades: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useFirestoreData] ❌ Grades error:', err);
                        setError(`Grades error: ${err.message}`);
                        checkAllLoaded();
                    }
                );
                unsubscribers.push(unsubGrades);
            } else {
                checkAllLoaded();
            }

            // ===== CORE VALUES SUBSCRIPTION =====
            if (shouldFetch('coreValues')) {
                console.log('[useFirestoreData] 💎 Subscribing to coreValues...');
                const unsubCoreValues = onSnapshot(
                    collection(db, 'coreValues'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [coreValues] CACHE' : '📡 [coreValues] SERVER');
                        setCoreValues(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CoreValue[]);
                        console.log(`[useFirestoreData] ✅ Core Values: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useFirestoreData] ❌ Core Values error:', err);
                        setError(`Core Values error: ${err.message}`);
                        checkAllLoaded();
                    }
                );
                unsubscribers.push(unsubCoreValues);
            } else {
                checkAllLoaded();
            }

            // ===== CORE VALUE GRADES SUBSCRIPTION =====
            if (shouldFetch('coreValueGrades')) {
                console.log('[useFirestoreData] 💯 Subscribing to coreValueGrades...');
                const unsubCoreValueGrades = onSnapshot(
                    collection(db, 'coreValueGrades'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [coreValueGrades] CACHE' : '📡 [coreValueGrades] SERVER');
                        setCoreValueGrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CoreValueGrade[]);
                        console.log(`[useFirestoreData] ✅ Core Value Grades: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useFirestoreData] ❌ Core Value Grades error:', err);
                        setError(`Core Value Grades error: ${err.message}`);
                        checkAllLoaded();
                    }
                );
                unsubscribers.push(unsubCoreValueGrades);
            } else {
                checkAllLoaded();
            }

            // ===== ATTENDANCE RECORDS SUBSCRIPTION =====
            if (shouldFetch('attendanceRecords')) {
                console.log('[useFirestoreData] 📅 Subscribing to attendanceRecords...');
                const unsubAttendance = onSnapshot(
                    collection(db, 'attendanceRecords'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [attendanceRecords] CACHE' : '📡 [attendanceRecords] SERVER');
                        const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setAttendanceRecords(records as unknown as AttendanceRecord[]);
                        console.log(`[useFirestoreData] ✅ Attendance Records: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useFirestoreData] ❌ Attendance Records error:', err);
                        setError(`Attendance Records error: ${err.message}`);
                        checkAllLoaded();
                    }
                );
                unsubscribers.push(unsubAttendance);
            } else {
                checkAllLoaded();
            }

            // ===== SUBSTITUTE ASSIGNMENTS SUBSCRIPTION =====
            if (shouldFetch('substituteAssignments')) {
                console.log('[useFirestoreData] 🔄 Subscribing to substituteAssignments...');
                const unsubSubstitutes = onSnapshot(
                    collection(db, 'substituteAssignments'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [substituteAssignments] CACHE' : '📡 [substituteAssignments] SERVER');
                        setSubstituteAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SubstituteAssignment[]);
                        console.log(`[useFirestoreData] ✅ Substitute Assignments: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useFirestoreData] ❌ Substitute Assignments error:', err);
                        setError(`Substitute Assignments error: ${err.message}`);
                        checkAllLoaded();
                    }
                );
                unsubscribers.push(unsubSubstitutes);
            } else {
                checkAllLoaded();
            }

            // ===== CLASS SCHEDULES SUBSCRIPTION =====
            if (shouldFetch('classSchedules')) {
                console.log('[useFirestoreData] ⏰ Subscribing to classSchedules...');
                const unsubSchedules = onSnapshot(
                    collection(db, 'classSchedules'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [classSchedules] CACHE' : '📡 [classSchedules] SERVER');
                        setClassSchedules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ClassSchedule[]);
                        console.log(`[useFirestoreData] ✅ Class Schedules: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useFirestoreData] ❌ Class Schedules error:', err);
                        setError(`Class Schedules error: ${err.message}`);
                        checkAllLoaded();
                    }
                );
                unsubscribers.push(unsubSchedules);
            } else {
                checkAllLoaded();
            }

            // ===== ASSIGNMENTS SUBSCRIPTION =====
            if (shouldFetch('assignments')) {
                console.log('[useFirestoreData] 📝 Subscribing to assignments...');
                const unsubAssignments = onSnapshot(
                    collection(db, 'assignments'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [assignments] CACHE' : '📡 [assignments] SERVER');
                        setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Assignment[]);
                        console.log(`[useFirestoreData] ✅ Assignments: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useFirestoreData] ❌ Assignments error:', err);
                        setError(`Assignments error: ${err.message}`);
                        checkAllLoaded();
                    }
                );
                unsubscribers.push(unsubAssignments);
            } else {
                checkAllLoaded();
            }

            // ===== STUDENT ASSIGNMENT GRADES SUBSCRIPTION =====
            if (shouldFetch('studentAssignmentGrades')) {
                console.log('[useFirestoreData] 📋 Subscribing to studentAssignmentGrades...');
                const unsubStudentGrades = onSnapshot(
                    collection(db, 'studentAssignmentGrades'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [studentAssignmentGrades] CACHE' : '📡 [studentAssignmentGrades] SERVER');
                        setStudentAssignmentGrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StudentAssignmentGrade[]);
                        console.log(`[useFirestoreData] ✅ Student Assignment Grades: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useFirestoreData] ❌ Student Assignment Grades error:', err);
                        setError(`Student Assignment Grades error: ${err.message}`);
                        checkAllLoaded();
                    }
                );
                unsubscribers.push(unsubStudentGrades);
            } else {
                checkAllLoaded();
            }

            // ===== LESSON PLANS SUBSCRIPTION =====
            if (shouldFetch('lessonPlans')) {
                console.log('[useFirestoreData] 📄 Subscribing to lessonPlans...');
                const unsubLessonPlans = onSnapshot(
                    collection(db, 'lessonPlans'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [lessonPlans] CACHE' : '📡 [lessonPlans] SERVER');
                        setLessonPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LessonPlan[]);
                        console.log(`[useFirestoreData] ✅ Lesson Plans: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useFirestoreData] ❌ Lesson Plans error:', err);
                        setError(`Lesson Plans error: ${err.message}`);
                        checkAllLoaded();
                    }
                );
                unsubscribers.push(unsubLessonPlans);
            } else {
                checkAllLoaded();
            }

            // ===== ANNOUNCEMENTS SUBSCRIPTION =====
            if (shouldFetch('announcements')) {
                console.log('[useFirestoreData] 📢 Subscribing to announcements...');
                const unsubAnnouncements = onSnapshot(
                    collection(db, 'announcements'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [announcements] CACHE' : '📡 [announcements] SERVER');
                        setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Announcement[]);
                        console.log(`[useFirestoreData] ✅ Announcements: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useFirestoreData] ❌ Announcements error:', err);
                        setError(`Announcements error: ${err.message}`);
                        checkAllLoaded();
                    }
                );
                unsubscribers.push(unsubAnnouncements);
            } else {
                checkAllLoaded();
            }

            // ===== SETTINGS SUBSCRIPTION =====
            if (shouldFetch('settings')) {
                console.log('[useFirestoreData] ⚙️ Subscribing to settings...');
                const unsubSettings = onSnapshot(
                    doc(db, 'settings', 'school'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [settings] CACHE' : '📡 [settings] SERVER');
                        if (snapshot.exists()) {
                            setSettings({ ...MOCK_SETTINGS, ...snapshot.data() } as SchoolSettings);
                            console.log('[useFirestoreData] ✅ Settings loaded');
                        }
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useFirestoreData] ❌ Settings error:', err);
                        setError(`Settings error: ${err.message}`);
                        checkAllLoaded();
                    }
                );
                unsubscribers.push(unsubSettings);
            } else {
                checkAllLoaded();
            }

            // ===== MONTHLY SCHOOL DAYS CONFIG SUBSCRIPTION =====
            if (shouldFetch('monthlySchoolDaysConfig')) {
                console.log('[useFirestoreData] 📆 Subscribing to monthlySchoolDaysConfig...');
                const unsubMonthlyDays = onSnapshot(
                    doc(db, 'settings', 'monthlySchoolDays'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [monthlySchoolDaysConfig] CACHE' : '📡 [monthlySchoolDaysConfig] SERVER');
                        if (snapshot.exists()) {
                            setMonthlySchoolDaysConfig({ ...DEFAULT_MONTHLY_SCHOOL_DAYS_CONFIG, ...snapshot.data() });
                            console.log('[useFirestoreData] ✅ Monthly School Days loaded');
                        }
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useFirestoreData] ❌ Monthly School Days error:', err);
                        setError(`Monthly School Days error: ${err.message}`);
                        checkAllLoaded();
                    }
                );
                unsubscribers.push(unsubMonthlyDays);
            } else {
                checkAllLoaded();
            }

        }).catch((err) => {
            console.error('[useFirestoreData] ❌ Auth error:', err);
            setError(`Auth error: ${err.message}`);
            setLoading(false);
        });

        // ===== CLEANUP =====
        return () => {
            console.log('[useFirestoreData] 🧹 Cleaning up subscriptions...');
            unsubscribers.forEach(unsub => unsub());
        };
    }, [shouldFetch]); // Re-subscribe if collectionsToFetch changes

    // ===== PAGINATION: Fetch More Students =====
    const fetchMoreStudents = useCallback(async () => {
        if (!hasMoreStudents || isFetchingStudents || !lastStudentDoc) {
            console.log('[useFirestoreData] ⏭️ Skip fetchMoreStudents:', { 
                hasMore: hasMoreStudents, 
                isFetching: isFetchingStudents,
                hasLastDoc: !!lastStudentDoc 
            });
            return;
        }

        setIsFetchingStudents(true);
        console.log('[useFirestoreData] 📄 Fetching next page of students...');

        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();

            const nextQuery = query(
                collection(db, 'students'),
                startAfter(lastStudentDoc),
                limit(100)
            );

            const snapshot = await getDocs(nextQuery);
            const moreStudents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Student[];

            setStudents(prev => [...prev, ...moreStudents]);
            
            if (snapshot.docs.length > 0) {
                setLastStudentDoc(snapshot.docs[snapshot.docs.length - 1]);
            }
            
            setHasMoreStudents(snapshot.docs.length === 100);
            console.log(`[useFirestoreData] ✅ Fetched ${moreStudents.length} more students`);
        } catch (err: any) {
            console.error('[useFirestoreData] ❌ Error fetching more students:', err);
            setError(`Pagination error: ${err.message}`);
        } finally {
            setIsFetchingStudents(false);
        }
    }, [hasMoreStudents, isFetchingStudents, lastStudentDoc]);

    // ===== SEARCH: Students =====
    const searchStudents = useCallback(async (searchQuery: string): Promise<Student[]> => {
        const trimmedQuery = searchQuery.trim().toLowerCase();
        if (!trimmedQuery) return students;

        // Check cache
        if (searchCache.has(`students:${trimmedQuery}`)) {
            console.log('[useFirestoreData] 📦 Returning cached student search results');
            return searchCache.get(`students:${trimmedQuery}`);
        }

        setIsSearching(true);
        console.log('[useFirestoreData] 🔍 Searching students for:', trimmedQuery);

        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();

            // Fetch all students (client-side search)
            const snapshot = await getDocs(collection(db, 'students'));
            const allStudents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Student[];

            // Client-side filtering
            const results = allStudents.filter(student => {
                const fullName = `${student.lastName} ${student.firstName}`.toLowerCase();
                const lrn = student.lrn?.toLowerCase() || '';
                return fullName.includes(trimmedQuery) || lrn.includes(trimmedQuery);
            });

            // Cache results
            setSearchCache(prev => new Map(prev).set(`students:${trimmedQuery}`, results));
            console.log(`[useFirestoreData] ✅ Found ${results.length} matching students`);
            return results;
        } catch (err: any) {
            console.error('[useFirestoreData] ❌ Search error:', err);
            return students;
        } finally {
            setIsSearching(false);
        }
    }, [students, searchCache]);

    // ===== SEARCH: Teachers =====
    const searchTeachers = useCallback(async (searchQuery: string): Promise<Teacher[]> => {
        const trimmedQuery = searchQuery.trim().toLowerCase();
        if (!trimmedQuery) return teachers;

        if (searchCache.has(`teachers:${trimmedQuery}`)) {
            console.log('[useFirestoreData] 📦 Returning cached teacher search results');
            return searchCache.get(`teachers:${trimmedQuery}`);
        }

        setIsSearching(true);
        console.log('[useFirestoreData] 🔍 Searching teachers for:', trimmedQuery);

        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();

            const snapshot = await getDocs(collection(db, 'teachers'));
            const allTeachers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Teacher[];

            const results = allTeachers.filter(teacher => {
                const fullName = `${(teacher as any).lastName || ''} ${(teacher as any).firstName || ''}`.toLowerCase();
                const email = (teacher as any).email?.toLowerCase() || '';
                return fullName.includes(trimmedQuery) || email.includes(trimmedQuery);
            });

            setSearchCache(prev => new Map(prev).set(`teachers:${trimmedQuery}`, results));
            console.log(`[useFirestoreData] ✅ Found ${results.length} matching teachers`);
            return results;
        } catch (err: any) {
            console.error('[useFirestoreData] ❌ Search error:', err);
            return teachers;
        } finally {
            setIsSearching(false);
        }
    }, [teachers, searchCache]);

    // ===== SEARCH: Parents =====
    const searchParents = useCallback(async (searchQuery: string): Promise<Parent[]> => {
        const trimmedQuery = searchQuery.trim().toLowerCase();
        if (!trimmedQuery) return parents;

        if (searchCache.has(`parents:${trimmedQuery}`)) {
            console.log('[useFirestoreData] 📦 Returning cached parent search results');
            return searchCache.get(`parents:${trimmedQuery}`);
        }

        setIsSearching(true);
        console.log('[useFirestoreData] 🔍 Searching parents for:', trimmedQuery);

        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();

            const snapshot = await getDocs(collection(db, 'parents'));
            const allParents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Parent[];

            const results = allParents.filter(parent => {
                const fullName = `${(parent as any).lastName || ''} ${(parent as any).firstName || ''}`.toLowerCase();
                const email = (parent as any).email?.toLowerCase() || '';
                return fullName.includes(trimmedQuery) || email.includes(trimmedQuery);
            });

            setSearchCache(prev => new Map(prev).set(`parents:${trimmedQuery}`, results));
            console.log(`[useFirestoreData] ✅ Found ${results.length} matching parents`);
            return results;
        } catch (err: any) {
            console.error('[useFirestoreData] ❌ Search error:', err);
            return parents;
        } finally {
            setIsSearching(false);
        }
    }, [parents, searchCache]);

    // ===== REFRESH (Manual) =====
    const refresh = useCallback(() => {
        console.log('[useFirestoreData] 🔄 Manual refresh requested (subscriptions auto-update)');
        // Subscriptions auto-update, but we can clear cache
        setSearchCache(new Map());
    }, []);

    // ===== TODO: ADD CRUD METHODS (Day 1 Evening) =====
    // Placeholder stubs to satisfy SchoolDataHook interface
    const addStudent = async (student: Omit<Student, 'id' | 'enrollmentDate'>) => {
        console.log('[useFirestoreData] TODO: addStudent', student);
        return { success: true };
    };

    const updateStudent = async (student: Student) => {
        console.log('[useFirestoreData] TODO: updateStudent', student);
    };

    const deleteStudent = async (studentId: string) => {
        console.log('[useFirestoreData] TODO: deleteStudent', studentId);
    };

    // ... TODO: Add all remaining CRUD methods to match SchoolDataHook interface

    // ===== RETURN HOOK INTERFACE =====
    return {
        // Collections (2/16 implemented)
        students,
        teachers,
        parents, // Empty for now
        sections, // Empty for now
        learningAreas, // Empty for now
        grades, // Empty for now
        coreValues, // Empty for now
        coreValueGrades, // Empty for now
        attendanceRecords, // Empty for now
        substituteAssignments, // Empty for now
        classSchedules, // Empty for now
        assignments, // Empty for now
        studentAssignmentGrades, // Empty for now
        lessonPlans, // Empty for now
        announcements, // Empty for now
        settings,
        monthlySchoolDaysConfig,

        // State
        loading,
        error,

        // Pagination
        fetchMoreStudents,
        hasMoreStudents,
        isFetchingStudents,

        // Search
        searchStudents,
        searchTeachers,
        searchParents,
        isSearching,

        // Actions
        refresh,

        // CRUD (stubbed - TODO: implement Day 1 Evening)
        addStudent,
        updateStudent,
        deleteStudent,
        updateGrade: async () => {},
        updateCoreValueGrade: async () => {},
        addLearningArea: async () => {},
        updateLearningArea: async () => {},
        deleteLearningArea: async () => {},
        updateSettings: async () => {},
        updateAttendance: async () => {},
        addParent: async () => {},
        updateParent: async () => {},
        deleteParent: async () => {},
        assignStudentToParent: async () => {},
        unassignStudentFromParent: async () => {},
        addTeacher: async () => {},
        updateTeacher: async () => {},
        deleteTeacher: async () => {},
        addSection: async () => {},
        updateSection: async () => {},
        deleteSection: async () => {},
        addSubstituteAssignment: async () => {},
        updateSubstituteAssignment: async () => {},
        deleteSubstituteAssignment: async () => {},
        addSchedule: async () => ({ success: true }),
        updateSchedule: async () => ({ success: true }),
        deleteSchedule: async () => {},
        addAssignment: async () => {},
        updateAssignment: async () => {},
        deleteAssignment: async () => {},
        updateAssignmentGrade: async () => {},
        submitAssignment: async () => {},
        addLessonPlan: async () => {},
        updateLessonPlan: async () => {},
        deleteLessonPlan: async () => {},
        addAnnouncement: async () => {},
        updateAnnouncement: async () => {},
        deleteAnnouncement: async () => {},
    };
}
