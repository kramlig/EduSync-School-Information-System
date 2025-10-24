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
 * Migration Status: COMPLETE ✅
 * - Day 1 Morning: Students + Teachers (2/16 collections) ✅
 * - Day 1 Afternoon: Add remaining 14 collections ✅
 * - Day 1 Evening: Add all CRUD methods ✅
 * - Day 2 Morning: Switch App.tsx ✅
 * - Day 2 Afternoon: Rename to useSchoolData.ts ✅
 */

import { useState, useEffect, useCallback } from 'react';
import { 
    collection, 
    onSnapshot, 
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    setDoc,
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
 * Main Hook: useSchoolData
 * 
 * Uses Firestore onSnapshot() for real-time subscriptions
 * All data is cached automatically by Firestore SDK
 * 
 * CRITICAL: Pass collectionsToFetch=[] to prevent any subscriptions (e.g., login screen)
 * This saves resources and prevents unnecessary fetching before authentication
 */
export function useSchoolData(collectionsToFetch?: string[]): SchoolDataHook {
    console.log('[useSchoolData] 🚀 Hook initializing (Firestore subscriptions)...', { collectionsToFetch });

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
        // STRONG FOUNDATION: Don't initialize subscriptions if collectionsToFetch is explicitly []
        // This prevents ANY Firestore operations on login screen before authentication
        const shouldInitialize = collectionsToFetch === undefined || collectionsToFetch.length > 0;
        
        if (!shouldInitialize) {
            console.log('[useSchoolData] ⏸️ Subscriptions skipped - empty collectionsToFetch array (likely login screen)');
            setLoading(false); // Ensure loading is false when not initializing
            return; // Early exit from useEffect (this is allowed!)
        }
        
        console.log('[useSchoolData] 📡 Setting up subscriptions...');
        
        const unsubscribers: (() => void)[] = [];
        let isInitialLoad = true;
        let loadedCollections = 0;
        const totalCollections = 16; // All 16 collections (Day 1 Afternoon)

        const checkAllLoaded = () => {
            loadedCollections++;
            console.log(`[useSchoolData] 📊 Loaded ${loadedCollections}/${totalCollections} collections`);
            if (loadedCollections >= totalCollections && isInitialLoad) {
                setLoading(false);
                isInitialLoad = false;
                console.log('[useSchoolData] ✅ Initial load complete');
            }
        };

        // OFFLINE-FIRST-VISIT FIX: Timeout to prevent infinite loading
        // If subscriptions don't receive data within 5 seconds, assume offline-first-visit
        const loadingTimeout = setTimeout(() => {
            if (isInitialLoad && loadedCollections < totalCollections) {
                console.warn(
                    `[useSchoolData] ⏰ Loading timeout - received ${loadedCollections}/${totalCollections} collections. ` +
                    `Likely offline-first-visit with no cached data. Setting loading=false to show empty states.`
                );
                setLoading(false);
                isInitialLoad = false;
            }
        }, 5000); // 5 seconds timeout

        // Wait for auth before subscribing
        waitForAuthReady().then(() => {
            const db = getFirestoreInstance();

            // ===== STUDENTS SUBSCRIPTION =====
            if (shouldFetch('students')) {
                console.log('[useSchoolData] 👥 Subscribing to students...');
                
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

                        console.log(`[useSchoolData] ✅ Students updated: ${studentsData.length} documents`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useSchoolData] ❌ Students subscription error:', err);
                        setError(`Students error: ${err.message}`);
                        checkAllLoaded();
                    }
                );

                unsubscribers.push(unsubStudents);
            } else {
                console.log('[useSchoolData] ⏭️ Skipping students (not in collectionsToFetch)');
                checkAllLoaded();
            }

            // ===== TEACHERS SUBSCRIPTION =====
            if (shouldFetch('teachers')) {
                console.log('[useSchoolData] 👨‍🏫 Subscribing to teachers...');
                
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
                        console.log(`[useSchoolData] ✅ Teachers updated: ${teachersData.length} documents`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useSchoolData] ❌ Teachers subscription error:', err);
                        setError(`Teachers error: ${err.message}`);
                        checkAllLoaded();
                    }
                );

                unsubscribers.push(unsubTeachers);
            } else {
                console.log('[useSchoolData] ⏭️ Skipping teachers (not in collectionsToFetch)');
                checkAllLoaded();
            }

            // ===== PARENTS SUBSCRIPTION =====
            if (shouldFetch('parents')) {
                console.log('[useSchoolData] 👪 Subscribing to parents...');
                const unsubParents = onSnapshot(
                    collection(db, 'parents'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [parents] CACHE' : '📡 [parents] SERVER');
                        setParents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Parent[]);
                        console.log(`[useSchoolData] ✅ Parents: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useSchoolData] ❌ Parents error:', err);
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
                console.log('[useSchoolData] 📚 Subscribing to sections...');
                const unsubSections = onSnapshot(
                    collection(db, 'sections'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [sections] CACHE' : '📡 [sections] SERVER');
                        setSections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Section[]);
                        console.log(`[useSchoolData] ✅ Sections: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useSchoolData] ❌ Sections error:', err);
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
                console.log('[useSchoolData] 📖 Subscribing to learningAreas...');
                const unsubLearningAreas = onSnapshot(
                    collection(db, 'learningAreas'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [learningAreas] CACHE' : '📡 [learningAreas] SERVER');
                        setLearningAreas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LearningArea[]);
                        console.log(`[useSchoolData] ✅ Learning Areas: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useSchoolData] ❌ Learning Areas error:', err);
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
                console.log('[useSchoolData] 📊 Subscribing to grades...');
                const unsubGrades = onSnapshot(
                    collection(db, 'grades'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [grades] CACHE' : '📡 [grades] SERVER');
                        setGrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Grade[]);
                        console.log(`[useSchoolData] ✅ Grades: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useSchoolData] ❌ Grades error:', err);
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
                console.log('[useSchoolData] 💎 Subscribing to coreValues...');
                const unsubCoreValues = onSnapshot(
                    collection(db, 'coreValues'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [coreValues] CACHE' : '📡 [coreValues] SERVER');
                        setCoreValues(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CoreValue[]);
                        console.log(`[useSchoolData] ✅ Core Values: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useSchoolData] ❌ Core Values error:', err);
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
                console.log('[useSchoolData] 💯 Subscribing to coreValueGrades...');
                const unsubCoreValueGrades = onSnapshot(
                    collection(db, 'coreValueGrades'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [coreValueGrades] CACHE' : '📡 [coreValueGrades] SERVER');
                        setCoreValueGrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CoreValueGrade[]);
                        console.log(`[useSchoolData] ✅ Core Value Grades: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useSchoolData] ❌ Core Value Grades error:', err);
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
                console.log('[useSchoolData] 📅 Subscribing to attendanceRecords...');
                const unsubAttendance = onSnapshot(
                    collection(db, 'attendanceRecords'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [attendanceRecords] CACHE' : '📡 [attendanceRecords] SERVER');
                        const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setAttendanceRecords(records as unknown as AttendanceRecord[]);
                        console.log(`[useSchoolData] ✅ Attendance Records: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useSchoolData] ❌ Attendance Records error:', err);
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
                console.log('[useSchoolData] 🔄 Subscribing to substituteAssignments...');
                const unsubSubstitutes = onSnapshot(
                    collection(db, 'substituteAssignments'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [substituteAssignments] CACHE' : '📡 [substituteAssignments] SERVER');
                        setSubstituteAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SubstituteAssignment[]);
                        console.log(`[useSchoolData] ✅ Substitute Assignments: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useSchoolData] ❌ Substitute Assignments error:', err);
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
                console.log('[useSchoolData] ⏰ Subscribing to classSchedules...');
                const unsubSchedules = onSnapshot(
                    collection(db, 'classSchedules'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [classSchedules] CACHE' : '📡 [classSchedules] SERVER');
                        setClassSchedules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ClassSchedule[]);
                        console.log(`[useSchoolData] ✅ Class Schedules: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useSchoolData] ❌ Class Schedules error:', err);
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
                console.log('[useSchoolData] 📝 Subscribing to assignments...');
                const unsubAssignments = onSnapshot(
                    collection(db, 'assignments'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [assignments] CACHE' : '📡 [assignments] SERVER');
                        setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Assignment[]);
                        console.log(`[useSchoolData] ✅ Assignments: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useSchoolData] ❌ Assignments error:', err);
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
                console.log('[useSchoolData] 📋 Subscribing to studentAssignmentGrades...');
                const unsubStudentGrades = onSnapshot(
                    collection(db, 'studentAssignmentGrades'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [studentAssignmentGrades] CACHE' : '📡 [studentAssignmentGrades] SERVER');
                        setStudentAssignmentGrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StudentAssignmentGrade[]);
                        console.log(`[useSchoolData] ✅ Student Assignment Grades: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useSchoolData] ❌ Student Assignment Grades error:', err);
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
                console.log('[useSchoolData] 📄 Subscribing to lessonPlans...');
                const unsubLessonPlans = onSnapshot(
                    collection(db, 'lessonPlans'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [lessonPlans] CACHE' : '📡 [lessonPlans] SERVER');
                        setLessonPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LessonPlan[]);
                        console.log(`[useSchoolData] ✅ Lesson Plans: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useSchoolData] ❌ Lesson Plans error:', err);
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
                console.log('[useSchoolData] 📢 Subscribing to announcements...');
                const unsubAnnouncements = onSnapshot(
                    collection(db, 'announcements'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [announcements] CACHE' : '📡 [announcements] SERVER');
                        setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Announcement[]);
                        console.log(`[useSchoolData] ✅ Announcements: ${snapshot.docs.length} docs`);
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useSchoolData] ❌ Announcements error:', err);
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
                console.log('[useSchoolData] ⚙️ Subscribing to settings...');
                const unsubSettings = onSnapshot(
                    doc(db, 'settings', 'school'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [settings] CACHE' : '📡 [settings] SERVER');
                        if (snapshot.exists()) {
                            setSettings({ ...MOCK_SETTINGS, ...snapshot.data() } as SchoolSettings);
                            console.log('[useSchoolData] ✅ Settings loaded');
                        }
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useSchoolData] ❌ Settings error:', err);
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
                console.log('[useSchoolData] 📆 Subscribing to monthlySchoolDaysConfig...');
                const unsubMonthlyDays = onSnapshot(
                    doc(db, 'settings', 'monthlySchoolDays'),
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        console.log(snapshot.metadata.fromCache ? '📦 [monthlySchoolDaysConfig] CACHE' : '📡 [monthlySchoolDaysConfig] SERVER');
                        if (snapshot.exists()) {
                            setMonthlySchoolDaysConfig({ ...DEFAULT_MONTHLY_SCHOOL_DAYS_CONFIG, ...snapshot.data() });
                            console.log('[useSchoolData] ✅ Monthly School Days loaded');
                        }
                        checkAllLoaded();
                    },
                    (err) => {
                        console.error('[useSchoolData] ❌ Monthly School Days error:', err);
                        setError(`Monthly School Days error: ${err.message}`);
                        checkAllLoaded();
                    }
                );
                unsubscribers.push(unsubMonthlyDays);
            } else {
                checkAllLoaded();
            }

        }).catch((err) => {
            console.error('[useSchoolData] ❌ Auth error:', err);
            setError(`Auth error: ${err.message}`);
            setLoading(false);
        });

        // ===== CLEANUP =====
        return () => {
            console.log('[useSchoolData] 🧹 Cleaning up subscriptions...');
            clearTimeout(loadingTimeout);
            unsubscribers.forEach(unsub => unsub());
        };
    }, [shouldFetch]); // Re-subscribe if collectionsToFetch changes

    // ===== PAGINATION: Fetch More Students =====
    const fetchMoreStudents = useCallback(async () => {
        if (!hasMoreStudents || isFetchingStudents || !lastStudentDoc) {
            console.log('[useSchoolData] ⏭️ Skip fetchMoreStudents:', { 
                hasMore: hasMoreStudents, 
                isFetching: isFetchingStudents,
                hasLastDoc: !!lastStudentDoc 
            });
            return;
        }

        setIsFetchingStudents(true);
        console.log('[useSchoolData] 📄 Fetching next page of students...');

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
            console.log(`[useSchoolData] ✅ Fetched ${moreStudents.length} more students`);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error fetching more students:', err);
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
            console.log('[useSchoolData] 📦 Returning cached student search results');
            return searchCache.get(`students:${trimmedQuery}`);
        }

        setIsSearching(true);
        console.log('[useSchoolData] 🔍 Searching students for:', trimmedQuery);

        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();

            // Fetch all students for search (this gives us the full database to search from)
            const snapshot = await getDocs(collection(db, 'students'));
            const allStudents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Student[];

            // Client-side filtering - search by name and LRN
            console.log('[useSchoolData] Searching through', allStudents.length, 'students for:', trimmedQuery);
            const results = allStudents.filter(student => {
                // Check both name formats: full name field OR firstName/lastName combo
                const fullName = student.name?.toLowerCase() || '';
                const separateName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase().trim();
                const lrn = student.lrn?.toLowerCase() || '';
                
                const matches = fullName.includes(trimmedQuery) || 
                       separateName.includes(trimmedQuery) || 
                       lrn.includes(trimmedQuery);
                
                if (matches && allStudents.indexOf(student) < 5) {
                    console.log('[useSchoolData] Match found:', { name: student.name, fullName, separateName, lrn, query: trimmedQuery });
                }
                
                return matches;
            });

            // Cache results
            setSearchCache(prev => new Map(prev).set(`students:${trimmedQuery}`, results));
            console.log(`[useSchoolData] ✅ Found ${results.length} matching students (will be filtered by authorized sections in component)`);
            if (results.length > 0) {
                console.log('[useSchoolData] Sample result:', { name: results[0].name, sectionId: results[0].sectionId });
            }
            return results;
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Search error:', err);
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
            console.log('[useSchoolData] 📦 Returning cached teacher search results');
            return searchCache.get(`teachers:${trimmedQuery}`);
        }

        setIsSearching(true);
        console.log('[useSchoolData] 🔍 Searching teachers for:', trimmedQuery);

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
            console.log(`[useSchoolData] ✅ Found ${results.length} matching teachers`);
            return results;
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Search error:', err);
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
            console.log('[useSchoolData] 📦 Returning cached parent search results');
            return searchCache.get(`parents:${trimmedQuery}`);
        }

        setIsSearching(true);
        console.log('[useSchoolData] 🔍 Searching parents for:', trimmedQuery);

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
            console.log(`[useSchoolData] ✅ Found ${results.length} matching parents`);
            return results;
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Search error:', err);
            return parents;
        } finally {
            setIsSearching(false);
        }
    }, [parents, searchCache]);

    // ===== REFRESH (Manual) =====
    const refresh = useCallback(() => {
        console.log('[useSchoolData] 🔄 Manual refresh requested (subscriptions auto-update)');
        // Subscriptions auto-update, but we can clear cache
        setSearchCache(new Map());
    }, []);

    // ===== CRUD METHODS =====
    // All methods use Firestore directly (subscriptions auto-update the state)

    // ===== STUDENT CRUD =====
    const addStudent = useCallback(async (student: Omit<Student, 'id' | 'enrollmentDate'>): Promise<{ success: boolean; message?: string }> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();

            // Validate unique email
            const existingStudent = students.find(s => s.email === student.email);
            if (existingStudent) {
                return { success: false, message: 'A student with this email already exists.' };
            }

            const newStudent = {
                ...student,
                enrollmentDate: serverTimestamp(),
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'students'), newStudent);
            console.log('[useSchoolData] ✅ Student added:', docRef.id);
            return { success: true };
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error adding student:', err);
            return { success: false, message: err.message };
        }
    }, [students]);

    const updateStudent = useCallback(async (student: Student): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            await updateDoc(doc(db, 'students', student.id), {
                ...student,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Student updated:', student.id);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating student:', err);
            throw err;
        }
    }, []);

    const deleteStudent = useCallback(async (studentId: string): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // Delete student and related data
            await deleteDoc(doc(db, 'students', studentId));
            
            // Delete related grades
            const gradesQuery = query(collection(db, 'grades'), where('studentId', '==', studentId));
            const gradesSnapshot = await getDocs(gradesQuery);
            const gradeDeletes = gradesSnapshot.docs.map(d => deleteDoc(d.ref));
            
            // Delete related core value grades
            const cvGradesQuery = query(collection(db, 'coreValueGrades'), where('studentId', '==', studentId));
            const cvGradesSnapshot = await getDocs(cvGradesQuery);
            const cvGradeDeletes = cvGradesSnapshot.docs.map(d => deleteDoc(d.ref));
            
            // Delete attendance records
            const attendanceQuery = query(collection(db, 'attendanceRecords'), where('studentId', '==', studentId));
            const attendanceSnapshot = await getDocs(attendanceQuery);
            const attendanceDeletes = attendanceSnapshot.docs.map(d => deleteDoc(d.ref));
            
            await Promise.all([...gradeDeletes, ...cvGradeDeletes, ...attendanceDeletes]);
            console.log('[useSchoolData] ✅ Student and related data deleted:', studentId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error deleting student:', err);
            throw err;
        }
    }, []);

    // ===== TEACHER CRUD =====
    const addTeacher = useCallback(async (teacher: Omit<Teacher, 'id'>): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            const docRef = await addDoc(collection(db, 'teachers'), {
                ...teacher,
                createdAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Teacher added:', docRef.id);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error adding teacher:', err);
            throw err;
        }
    }, []);

    const updateTeacher = useCallback(async (teacher: Teacher): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            await updateDoc(doc(db, 'teachers', teacher.id), {
                ...teacher,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Teacher updated:', teacher.id);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating teacher:', err);
            throw err;
        }
    }, []);

    const deleteTeacher = useCallback(async (teacherId: string): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            await deleteDoc(doc(db, 'teachers', teacherId));
            console.log('[useSchoolData] ✅ Teacher deleted:', teacherId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error deleting teacher:', err);
            throw err;
        }
    }, []);

    // ===== PARENT CRUD =====
    const addParent = useCallback(async (parent: Omit<Parent, 'id'>): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            const docRef = await addDoc(collection(db, 'parents'), {
                ...parent,
                createdAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Parent added:', docRef.id);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error adding parent:', err);
            throw err;
        }
    }, []);

    const updateParent = useCallback(async (parent: Parent): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            await updateDoc(doc(db, 'parents', parent.id), {
                ...parent,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Parent updated:', parent.id);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating parent:', err);
            throw err;
        }
    }, []);

    const deleteParent = useCallback(async (parentId: string): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            await deleteDoc(doc(db, 'parents', parentId));
            console.log('[useSchoolData] ✅ Parent deleted:', parentId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error deleting parent:', err);
            throw err;
        }
    }, []);

    const assignStudentToParent = useCallback(async (parentId: string, studentId: string): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            const parentRef = doc(db, 'parents', parentId);
            const parentDoc = await getDoc(parentRef);
            
            if (!parentDoc.exists()) {
                throw new Error('Parent not found');
            }
            
            const currentStudentIds = parentDoc.data().studentIds || [];
            const updatedStudentIds = Array.from(new Set([...currentStudentIds, studentId]));
            
            await updateDoc(parentRef, {
                studentIds: updatedStudentIds,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Student assigned to parent:', { parentId, studentId });
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error assigning student to parent:', err);
            throw err;
        }
    }, []);

    const unassignStudentFromParent = useCallback(async (parentId: string, studentId: string): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            const parentRef = doc(db, 'parents', parentId);
            const parentDoc = await getDoc(parentRef);
            
            if (!parentDoc.exists()) {
                throw new Error('Parent not found');
            }
            
            const currentStudentIds = parentDoc.data().studentIds || [];
            const updatedStudentIds = currentStudentIds.filter((id: string) => id !== studentId);
            
            await updateDoc(parentRef, {
                studentIds: updatedStudentIds,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Student unassigned from parent:', { parentId, studentId });
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error unassigning student from parent:', err);
            throw err;
        }
    }, []);

    // ===== SECTION CRUD =====
    const addSection = useCallback(async (section: Omit<Section, 'id'>): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            const docRef = await addDoc(collection(db, 'sections'), {
                ...section,
                createdAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Section added:', docRef.id);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error adding section:', err);
            throw err;
        }
    }, []);

    const updateSection = useCallback(async (section: Section): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            await updateDoc(doc(db, 'sections', section.id), {
                ...section,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Section updated:', section.id);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating section:', err);
            throw err;
        }
    }, []);

    const deleteSection = useCallback(async (sectionId: string): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            await deleteDoc(doc(db, 'sections', sectionId));
            
            // Update students to remove section reference
            const studentsInSection = students.filter(s => s.sectionId === sectionId);
            const updatePromises = studentsInSection.map(student =>
                updateDoc(doc(db, 'students', student.id), {
                    sectionId: null,
                    updatedAt: serverTimestamp()
                })
            );
            await Promise.all(updatePromises);
            
            console.log('[useSchoolData] ✅ Section deleted:', sectionId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error deleting section:', err);
            throw err;
        }
    }, [students]);

    // ===== LEARNING AREA CRUD =====
    const addLearningArea = useCallback(async (area: Omit<LearningArea, 'id'>): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            const docRef = await addDoc(collection(db, 'learningAreas'), {
                ...area,
                createdAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Learning area added:', docRef.id);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error adding learning area:', err);
            throw err;
        }
    }, []);

    const updateLearningArea = useCallback(async (learningAreaId: string, area: Omit<LearningArea, 'id'>): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            await updateDoc(doc(db, 'learningAreas', learningAreaId), {
                ...area,
                id: learningAreaId,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Learning area updated:', learningAreaId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating learning area:', err);
            throw err;
        }
    }, []);

    const deleteLearningArea = useCallback(async (learningAreaId: string): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            await deleteDoc(doc(db, 'learningAreas', learningAreaId));
            
            // Delete related grades
            const gradesQuery = query(collection(db, 'grades'), where('learningAreaId', '==', learningAreaId));
            const gradesSnapshot = await getDocs(gradesQuery);
            const deletePromises = gradesSnapshot.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deletePromises);
            
            console.log('[useSchoolData] ✅ Learning area and related grades deleted:', learningAreaId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error deleting learning area:', err);
            throw err;
        }
    }, []);

    // ===== GRADE CRUD =====
    const updateGrade = useCallback(async (
        studentId: string,
        learningAreaId: string,
        quarter: 'q1' | 'q2' | 'q3' | 'q4',
        value?: number,
        subSubject?: string
    ): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // Find or create grade document
            const gradesQuery = query(
                collection(db, 'grades'),
                where('studentId', '==', studentId),
                where('learningAreaId', '==', learningAreaId)
            );
            const gradesSnapshot = await getDocs(gradesQuery);
            
            let gradeRef;
            let gradeData: any = {};
            
            if (gradesSnapshot.empty) {
                // Create new grade document
                gradeData = {
                    studentId,
                    learningAreaId,
                    [quarter]: subSubject ? { [subSubject]: value } : value,
                    createdAt: serverTimestamp()
                };
                gradeRef = await addDoc(collection(db, 'grades'), gradeData);
            } else {
                // Update existing grade document
                const existingDoc = gradesSnapshot.docs[0];
                gradeRef = existingDoc.ref;
                gradeData = existingDoc.data();
                
                if (subSubject) {
                    const currentQuarter = gradeData[quarter] || {};
                    gradeData[quarter] = { ...currentQuarter, [subSubject]: value };
                } else {
                    gradeData[quarter] = value;
                }
                
                // Calculate final grade and remarks
                const quarters = ['q1', 'q2', 'q3', 'q4'];
                const quarterGrades = quarters.map(q => {
                    const qValue = gradeData[q];
                    if (typeof qValue === 'number') return qValue;
                    if (typeof qValue === 'object' && qValue !== null) {
                        const values = Object.values(qValue).filter(v => typeof v === 'number');
                        return values.length > 0 ? values.reduce((sum: any, v: any) => sum + v, 0) / values.length : undefined;
                    }
                    return undefined;
                }).filter(g => g !== undefined);
                
                if (quarterGrades.length > 0) {
                    gradeData.finalGrade = Math.round(quarterGrades.reduce((sum: any, g: any) => sum + g, 0) / quarterGrades.length);
                    gradeData.remarks = gradeData.finalGrade >= 75 ? 'Passed' : 'Failed';
                }
                
                await updateDoc(gradeRef, {
                    ...gradeData,
                    updatedAt: serverTimestamp()
                });
            }
            
            console.log('[useSchoolData] ✅ Grade updated:', { studentId, learningAreaId, quarter });
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating grade:', err);
            throw err;
        }
    }, []);

    // ===== CORE VALUE GRADE CRUD =====
    const updateCoreValueGrade = useCallback(async (
        studentId: string,
        coreValueId: string,
        quarter: 'q1' | 'q2' | 'q3' | 'q4',
        behavior: string,
        value: CoreValueMarking | ''
    ): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // Find or create core value grade document
            const cvGradesQuery = query(
                collection(db, 'coreValueGrades'),
                where('studentId', '==', studentId),
                where('coreValueId', '==', coreValueId)
            );
            const cvGradesSnapshot = await getDocs(cvGradesQuery);
            
            let cvGradeData: any = {};
            
            if (cvGradesSnapshot.empty) {
                // Create new core value grade
                cvGradeData = {
                    studentId,
                    coreValueId,
                    [quarter]: { [behavior]: value },
                    createdAt: serverTimestamp()
                };
                await addDoc(collection(db, 'coreValueGrades'), cvGradeData);
            } else {
                // Update existing
                const existingDoc = cvGradesSnapshot.docs[0];
                cvGradeData = existingDoc.data();
                
                const currentQuarter = cvGradeData[quarter] || {};
                cvGradeData[quarter] = { ...currentQuarter, [behavior]: value };
                
                await updateDoc(existingDoc.ref, {
                    ...cvGradeData,
                    updatedAt: serverTimestamp()
                });
            }
            
            console.log('[useSchoolData] ✅ Core value grade updated:', { studentId, coreValueId, quarter, behavior });
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating core value grade:', err);
            throw err;
        }
    }, []);

    // ===== ATTENDANCE CRUD =====
    const updateAttendance = useCallback(async (
        studentId: string,
        date: string,
        status: AttendanceStatus
    ): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // Find or create attendance record
            const attendanceQuery = query(
                collection(db, 'attendanceRecords'),
                where('studentId', '==', studentId)
            );
            const attendanceSnapshot = await getDocs(attendanceQuery);
            
            if (attendanceSnapshot.empty) {
                // Create new attendance record
                await addDoc(collection(db, 'attendanceRecords'), {
                    studentId,
                    dailyStatus: { [date]: status },
                    createdAt: serverTimestamp()
                });
            } else {
                // Update existing
                const existingDoc = attendanceSnapshot.docs[0];
                const dailyStatus = existingDoc.data().dailyStatus || {};
                dailyStatus[date] = status;
                
                await updateDoc(existingDoc.ref, {
                    dailyStatus,
                    updatedAt: serverTimestamp()
                });
            }
            
            console.log('[useSchoolData] ✅ Attendance updated:', { studentId, date, status });
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating attendance:', err);
            throw err;
        }
    }, []);

    // ===== SETTINGS CRUD =====
    const updateSettings = useCallback(async (settings: SchoolSettings): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            await setDoc(doc(db, 'settings', 'school'), {
                ...settings,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Settings updated');
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating settings:', err);
            throw err;
        }
    }, []);

    // ===== SUBSTITUTE ASSIGNMENT CRUD =====
    const addSubstituteAssignment = useCallback(async (assignment: Omit<SubstituteAssignment, 'id'>): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            const docRef = await addDoc(collection(db, 'substituteAssignments'), {
                ...assignment,
                createdAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Substitute assignment added:', docRef.id);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error adding substitute assignment:', err);
            throw err;
        }
    }, []);

    const updateSubstituteAssignment = useCallback(async (assignment: SubstituteAssignment): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            await updateDoc(doc(db, 'substituteAssignments', assignment.id), {
                ...assignment,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Substitute assignment updated:', assignment.id);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating substitute assignment:', err);
            throw err;
        }
    }, []);

    const deleteSubstituteAssignment = useCallback(async (assignmentId: string): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            await deleteDoc(doc(db, 'substituteAssignments', assignmentId));
            console.log('[useSchoolData] ✅ Substitute assignment deleted:', assignmentId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error deleting substitute assignment:', err);
            throw err;
        }
    }, []);

    // ===== CLASS SCHEDULE CRUD =====
    const addSchedule = useCallback(async (sched: Omit<ClassSchedule, 'id'>): Promise<{ success: boolean; message?: string }> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // TODO: Add conflict validation if needed
            
            const docRef = await addDoc(collection(db, 'classSchedules'), {
                ...sched,
                createdAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Schedule added:', docRef.id);
            return { success: true };
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error adding schedule:', err);
            return { success: false, message: err.message };
        }
    }, []);

    const updateSchedule = useCallback(async (sched: ClassSchedule): Promise<{ success: boolean; message?: string }> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            await updateDoc(doc(db, 'classSchedules', sched.id), {
                ...sched,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Schedule updated:', sched.id);
            return { success: true };
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating schedule:', err);
            return { success: false, message: err.message };
        }
    }, []);

    const deleteSchedule = useCallback(async (scheduleId: string): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            await deleteDoc(doc(db, 'classSchedules', scheduleId));
            console.log('[useSchoolData] ✅ Schedule deleted:', scheduleId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error deleting schedule:', err);
            throw err;
        }
    }, []);

    // ===== ASSIGNMENT CRUD =====
    const addAssignment = useCallback(async (assignment: Omit<Assignment, 'id'>): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            const docRef = await addDoc(collection(db, 'assignments'), {
                ...assignment,
                createdAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Assignment added:', docRef.id);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error adding assignment:', err);
            throw err;
        }
    }, []);

    const updateAssignment = useCallback(async (assignment: Assignment): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            await updateDoc(doc(db, 'assignments', assignment.id), {
                ...assignment,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Assignment updated:', assignment.id);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating assignment:', err);
            throw err;
        }
    }, []);

    const deleteAssignment = useCallback(async (assignmentId: string): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            await deleteDoc(doc(db, 'assignments', assignmentId));
            
            // Delete related student grades
            const gradesQuery = query(collection(db, 'studentAssignmentGrades'), where('assignmentId', '==', assignmentId));
            const gradesSnapshot = await getDocs(gradesQuery);
            const deletePromises = gradesSnapshot.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deletePromises);
            
            console.log('[useSchoolData] ✅ Assignment and related grades deleted:', assignmentId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error deleting assignment:', err);
            throw err;
        }
    }, []);

    const updateAssignmentGrade = useCallback(async (
        studentId: string,
        assignmentId: string,
        score: number | null,
        feedback: string | null
    ): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // Find existing grade or create new
            const gradesQuery = query(
                collection(db, 'studentAssignmentGrades'),
                where('studentId', '==', studentId),
                where('assignmentId', '==', assignmentId)
            );
            const gradesSnapshot = await getDocs(gradesQuery);
            
            const gradeData = {
                studentId,
                assignmentId,
                score,
                feedback,
            };
            
            if (gradesSnapshot.empty) {
                await addDoc(collection(db, 'studentAssignmentGrades'), {
                    ...gradeData,
                    createdAt: serverTimestamp()
                });
            } else {
                await updateDoc(gradesSnapshot.docs[0].ref, {
                    ...gradeData,
                    updatedAt: serverTimestamp()
                });
            }
            
            console.log('[useSchoolData] ✅ Assignment grade updated:', { studentId, assignmentId, score });
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating assignment grade:', err);
            throw err;
        }
    }, []);

    const submitAssignment = useCallback(async (studentId: string, assignmentId: string, submission: any): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            const gradesQuery = query(
                collection(db, 'studentAssignmentGrades'),
                where('studentId', '==', studentId),
                where('assignmentId', '==', assignmentId)
            );
            const gradesSnapshot = await getDocs(gradesQuery);
            
            if (gradesSnapshot.empty) {
                await addDoc(collection(db, 'studentAssignmentGrades'), {
                    studentId,
                    assignmentId,
                    submission,
                    submittedAt: serverTimestamp(),
                    createdAt: serverTimestamp()
                });
            } else {
                await updateDoc(gradesSnapshot.docs[0].ref, {
                    submission,
                    submittedAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }
            
            console.log('[useSchoolData] ✅ Assignment submitted:', { studentId, assignmentId });
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error submitting assignment:', err);
            throw err;
        }
    }, []);

    // ===== LESSON PLAN CRUD =====
    const addLessonPlan = useCallback(async (lessonPlan: Omit<LessonPlan, 'id'>): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            const docRef = await addDoc(collection(db, 'lessonPlans'), {
                ...lessonPlan,
                createdAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Lesson plan added:', docRef.id);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error adding lesson plan:', err);
            throw err;
        }
    }, []);

    const updateLessonPlan = useCallback(async (lessonPlan: LessonPlan): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            await updateDoc(doc(db, 'lessonPlans', lessonPlan.id), {
                ...lessonPlan,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Lesson plan updated:', lessonPlan.id);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating lesson plan:', err);
            throw err;
        }
    }, []);

    const deleteLessonPlan = useCallback(async (lessonPlanId: string): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            await deleteDoc(doc(db, 'lessonPlans', lessonPlanId));
            console.log('[useSchoolData] ✅ Lesson plan deleted:', lessonPlanId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error deleting lesson plan:', err);
            throw err;
        }
    }, []);

    // ===== ANNOUNCEMENT CRUD =====
    const addAnnouncement = useCallback(async (announcement: Omit<Announcement, 'id'>): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            const docRef = await addDoc(collection(db, 'announcements'), {
                ...announcement,
                createdAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Announcement added:', docRef.id);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error adding announcement:', err);
            throw err;
        }
    }, []);

    const updateAnnouncement = useCallback(async (announcement: Announcement): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            await updateDoc(doc(db, 'announcements', announcement.id), {
                ...announcement,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Announcement updated:', announcement.id);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating announcement:', err);
            throw err;
        }
    }, []);

    const deleteAnnouncement = useCallback(async (announcementId: string): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            await deleteDoc(doc(db, 'announcements', announcementId));
            console.log('[useSchoolData] ✅ Announcement deleted:', announcementId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error deleting announcement:', err);
            throw err;
        }
    }, [])

    // ===== RETURN HOOK INTERFACE =====
    return {
        // Collections (16/16 implemented)
        students,
        teachers,
        parents,
        sections,
        learningAreas,
        grades,
        coreValues,
        coreValueGrades,
        attendanceRecords,
        substituteAssignments,
        classSchedules,
        assignments,
        studentAssignmentGrades,
        lessonPlans,
        announcements,
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

        // Student CRUD
        addStudent,
        updateStudent,
        deleteStudent,

        // Teacher CRUD
        addTeacher,
        updateTeacher,
        deleteTeacher,

        // Parent CRUD
        addParent,
        updateParent,
        deleteParent,
        assignStudentToParent,
        unassignStudentFromParent,

        // Section CRUD
        addSection,
        updateSection,
        deleteSection,

        // Learning Area CRUD
        addLearningArea,
        updateLearningArea,
        deleteLearningArea,

        // Grade CRUD
        updateGrade,
        updateCoreValueGrade,

        // Attendance CRUD
        updateAttendance,

        // Settings CRUD
        updateSettings,

        // Substitute Assignment CRUD
        addSubstituteAssignment,
        updateSubstituteAssignment,
        deleteSubstituteAssignment,

        // Class Schedule CRUD
        addSchedule,
        updateSchedule,
        deleteSchedule,

        // Assignment CRUD
        addAssignment,
        updateAssignment,
        deleteAssignment,
        updateAssignmentGrade,
        submitAssignment,

        // Lesson Plan CRUD
        addLessonPlan,
        updateLessonPlan,
        deleteLessonPlan,

        // Announcement CRUD
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
    };
}
