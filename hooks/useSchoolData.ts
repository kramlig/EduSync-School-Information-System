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
 * MULTI-TENANT MIGRATION:
 * - Phase 2: Uses SchoolContext to get current user's schoolId
 * - All CRUD operations auto-inject schoolId from context
 * - Queries will be filtered by schoolId in Phase 3
 * 
 * Migration Status: COMPLETE ✅
 * - Day 1 Morning: Students + Teachers (2/16 collections) ✅
 * - Day 1 Afternoon: Add remaining 14 collections ✅
 * - Day 1 Evening: Add all CRUD methods ✅
 * - Day 2 Morning: Switch App.tsx ✅
 * - Day 2 Afternoon: Rename to useSchoolData.ts ✅
 * - Phase 2: Add schoolId to all types and CRUD ✅ IN PROGRESS
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
    limit,
    startAfter,
    QueryDocumentSnapshot,
    DocumentData
} from 'firebase/firestore';
import { getFirestoreInstance, waitForAuthReady } from '../src/services/firestoreService';
import { useSchoolContext } from '../src/contexts/SchoolContext';
import type { 
    Student, LearningArea, Grade, CoreValue, CoreValueGrade, AttendanceRecord, 
    Teacher, Section, SchoolSettings, SubstituteAssignment, ClassSchedule, 
    Assignment, StudentAssignmentGrade, LessonPlan, Parent, Announcement, 
    AttendanceStatus, CoreValueMarking 
} from '../types';

// Import interface from backup (will match exactly)
import type { SchoolDataHook, SchoolDataState } from './useSchoolData.REACT_QUERY_BACKUP';

// PostgreSQL hooks (located in src/hooks/)
import { useStudentsPostgreSQL } from '../src/hooks/useStudentsPostgreSQL';
import { useSectionsPostgreSQL } from '../src/hooks/useSectionsPostgreSQL';
import { useTeachersPostgreSQL } from '../src/hooks/useTeachersPostgreSQL';
import { useGradesPostgreSQL } from '../src/hooks/useGradesPostgreSQL';
import { useCoreValuesPostgreSQL } from '../src/hooks/useCoreValuesPostgreSQL';
import { useLearningAreasPostgreSQL } from '../src/hooks/useLearningAreasPostgreSQL';
import { useSchedulePostgreSQL } from '../src/hooks/useSchedulePostgreSQL';
import { useSchoolSettingsPostgreSQL } from '../src/hooks/useSchoolSettingsPostgreSQL';
import { useSubstituteAssignmentsPostgreSQL } from '../src/hooks/useSubstituteAssignmentsPostgreSQL';
import { useParentsPostgreSQL } from '../src/hooks/useParentsPostgreSQL';
import { useAttendancePostgreSQL } from '../src/hooks/useAttendancePostgreSQL';
import { useAnnouncementsPostgreSQL } from '../src/hooks/useAnnouncementsPostgreSQL';
import { useEnrollmentApplicationsPostgreSQL } from '../src/hooks/useEnrollmentApplicationsPostgreSQL';

// Re-export for external use
export type { SchoolDataHook, SchoolDataState };

// Feature flag: Use PostgreSQL instead of Firestore
const USE_POSTGRESQL = import.meta.env.VITE_USE_POSTGRESQL === 'true';

// Mock settings (same as React Query version)
const MOCK_SETTINGS: SchoolSettings = {
    schoolName: 'ENRIQUE URENCIA ELEMENTARY SCHOOL',
    region: 'Region XI',
    division: 'Division of the City of Mati',
    district: 'Governor Generoso North District',
    schoolYear: '2024-2025'
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
// Control logging level for performance - DISABLE ALL to stop infinite logging
const ENABLE_CACHE_LOGS = false;        // Cache/Server logs (📦/📡)
const ENABLE_SUCCESS_LOGS = false;      // Collection success logs (✅)
const ENABLE_SUBSCRIPTION_LOGS = false; // Subscription setup logs (📡 Setting up)
const ENABLE_DEBUG_LOGS = false;        // Debug and progress logs (📊)

export function useSchoolData(collectionsToFetch?: string[]): SchoolDataHook {
    // console.log('[useSchoolData] 🚀 Hook initializing (Firestore subscriptions)...', { collectionsToFetch });

    // MULTI-TENANT: Get current user's schoolId from context
    const { schoolId, loading: schoolContextLoading } = useSchoolContext();
    
    // SchoolContext state updated

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

    // ===== POSTGRESQL INTEGRATION =====
    // Use PostgreSQL hooks if feature flag is enabled (with proper memoization)
    const postgresStudents = useStudentsPostgreSQL(
        USE_POSTGRESQL && shouldFetch('students') 
            ? { schoolId, includeSection: true, status: 'enrolled' } 
            : {}
    );
    const postgresSections = useSectionsPostgreSQL(
        USE_POSTGRESQL && shouldFetch('sections') 
            ? { schoolId, includeAdviser: true, includeStudentCount: false } 
            : {}
    );
    const postgresTeachers = useTeachersPostgreSQL(
        USE_POSTGRESQL && shouldFetch('teachers') 
            ? { schoolId: schoolId || undefined, enableRealtime: false } 
            : {}
    );
    const postgresGrades = useGradesPostgreSQL(
        USE_POSTGRESQL && shouldFetch('grades') 
            ? { schoolId: schoolId || undefined }
            : { skip: true }
    );
    
    const postgresCoreValues = useCoreValuesPostgreSQL(
        USE_POSTGRESQL && (shouldFetch('coreValues') || shouldFetch('coreValueGrades')), 
        schoolId,
        false  // Load grades (needed for display)
    );
    const postgresLearningAreas = useLearningAreasPostgreSQL(USE_POSTGRESQL && shouldFetch('learningAreas') ? schoolId : undefined);
    const postgresSchedules = useSchedulePostgreSQL(
        USE_POSTGRESQL && shouldFetch('classSchedules')
            ? { schoolId: schoolId || undefined, enablePolling: true }
            : {}
    );
    
    // DIAGNOSTIC: Log PostgreSQL hook initialization
    console.log('[useSchoolData] 🔍 PostgreSQL hooks initialized:', {
        USE_POSTGRESQL,
        shouldFetchSchedules: shouldFetch('classSchedules'),
        schoolId,
        schedulesLoading: postgresSchedules.loading,
        schedulesCount: postgresSchedules.schedules.length
    });
    const postgresSettings = useSchoolSettingsPostgreSQL({
        schoolId: USE_POSTGRESQL && shouldFetch('settings') ? (schoolId || undefined) : undefined,
        enableRealtime: true
    });
    const postgresSubstitutes = useSubstituteAssignmentsPostgreSQL();
    const postgresParents = useParentsPostgreSQL(
        USE_POSTGRESQL && shouldFetch('parents')
            ? { schoolId: schoolId || undefined }
            : {}
    );
    const postgresAttendance = useAttendancePostgreSQL(
        USE_POSTGRESQL && shouldFetch('attendanceRecords') && schoolId
            ? { schoolId }
            : { schoolId: '' }
    );
    const postgresAnnouncements = useAnnouncementsPostgreSQL(
        USE_POSTGRESQL && shouldFetch('announcements') && schoolId
            ? { schoolId }
            : {}
    );
    const postgresEnrollmentApplications = useEnrollmentApplicationsPostgreSQL(
        USE_POSTGRESQL && schoolId
            ? { schoolId, enableRealtime: true }
            : {}
    );

    // Use PostgreSQL data directly (no Firestore override needed)
    useEffect(() => {
        if (!USE_POSTGRESQL) return;
        
        console.log('[useSchoolData] 🐘 PostgreSQL mode active - using ONLY PostgreSQL data');
        
        // Set data directly from PostgreSQL hooks (cast to match Firestore types)
        // Only update if not loading to avoid flickering
        if (!postgresStudents.loading) setStudents(postgresStudents.students as any);
        if (!postgresSections.loading) setSections(postgresSections.sections as any);
        if (!postgresTeachers.loading) setTeachers(postgresTeachers.teachers as any);
        if (!postgresParents.loading) setParents(postgresParents.parents as any);
        if (!postgresGrades.loading) setGrades(postgresGrades.grades);
        if (!postgresCoreValues.loading) {
            setCoreValues(postgresCoreValues.coreValues);
            setCoreValueGrades(postgresCoreValues.coreValueGrades as any);
        }
        if (!postgresLearningAreas.loading) setLearningAreas(postgresLearningAreas.learningAreas as any);
        
        // Sync schedules in real-time (optimistic updates + polling)
        if (!postgresSchedules.loading) {
            setClassSchedules(postgresSchedules.schedules as any);
        }
        
        // Load school settings from database instead of using mock
        if (!postgresSettings.loading && postgresSettings.settings) {
            setSettings(postgresSettings.settings);
        }
        
        // Sync substitute assignments from PostgreSQL
        if (!postgresSubstitutes.loading) {
            setSubstituteAssignments(postgresSubstitutes.assignments as any);
        }
        
        // Sync attendance records from PostgreSQL
        if (!postgresAttendance.loading) {
            setAttendanceRecords(postgresAttendance.attendanceRecords as any);
        }
        
        // Sync announcements from PostgreSQL
        if (!postgresAnnouncements.loading) {
            setAnnouncements(postgresAnnouncements.announcements as any);
        }
        
        // Calculate loading state
        const isPostgresLoading = 
            postgresStudents.loading ||
            postgresSections.loading ||
            postgresTeachers.loading ||
            postgresParents.loading ||
            postgresGrades.loading ||
            postgresCoreValues.loading ||
            postgresLearningAreas.loading ||
            postgresSchedules.loading ||
            postgresSettings.loading ||
            postgresSubstitutes.loading ||
            postgresAttendance.loading ||
            postgresAnnouncements.loading;
        
        setLoading(isPostgresLoading);
        
        if (!isPostgresLoading) {
            console.log('[useSchoolData] 🐘 PostgreSQL loaded:', {
                students: postgresStudents.students.length,
                sections: postgresSections.sections.length,
                teachers: postgresTeachers.teachers.length,
                parents: postgresParents.parents.length,
                grades: postgresGrades.grades.length,
                coreValues: postgresCoreValues.coreValues.length,
                coreValueGrades: postgresCoreValues.coreValueGrades.length,
                learningAreas: postgresLearningAreas.learningAreas.length,
                classSchedules: postgresSchedules.schedules.length,
                settings: postgresSettings.settings?.schoolYear || 'N/A',
                substituteAssignments: postgresSubstitutes.assignments.length,
                attendanceRecords: postgresAttendance.attendanceRecords.length,
                announcements: postgresAnnouncements.announcements.length
            });
        }
        // Include schedules and substitutes in deps to enable real-time updates from optimistic updates
    }, [
        USE_POSTGRESQL,
        postgresStudents.loading,
        postgresSections.loading,
        postgresTeachers.loading,
        postgresGrades.loading,
        postgresCoreValues.loading,
        postgresLearningAreas.loading,
        postgresSchedules.loading,
        postgresSchedules.schedules,
        postgresSettings.loading,
        postgresSettings.settings,
        postgresSubstitutes.loading,
        postgresSubstitutes.assignments,
        postgresAttendance.loading,
        postgresAttendance.attendanceRecords,
        postgresAnnouncements.loading,
        postgresAnnouncements.announcements
    ]);

    // ===== FIRESTORE SUBSCRIPTIONS =====
    useEffect(() => {
        // CRITICAL: Wait for SchoolContext to load before subscribing
        // Otherwise schoolId will be null and we'll fetch ALL schools' data!
        if (schoolContextLoading) {
            console.log('[useSchoolData] ⏸️ Waiting for SchoolContext to load...');
            return;
        }
        
        console.log('[useSchoolData] ✅ SchoolContext loaded, schoolId:', schoolId);
        
        // STRONG FOUNDATION: Don't initialize subscriptions if collectionsToFetch is explicitly []
        // This prevents ANY Firestore operations on login screen before authentication
        const shouldInitialize = collectionsToFetch === undefined || collectionsToFetch.length > 0;
        
        if (!shouldInitialize) {
            if (ENABLE_DEBUG_LOGS) {
                console.log('[useSchoolData] ⏸️ Subscriptions skipped - empty collectionsToFetch array (likely login screen)');
            }
            setLoading(false); // Ensure loading is false when not initializing
            return; // Early exit from useEffect (this is allowed!)
        }
        
        if (ENABLE_SUBSCRIPTION_LOGS) {
            console.log('[useSchoolData] 📡 Setting up subscriptions...');
        }
        
        const unsubscribers: (() => void)[] = [];
        let isInitialLoad = true;
        let loadedCollections = 0;
        const totalCollections = 16; // All 16 collections (Day 1 Afternoon)

        const checkAllLoaded = () => {
            loadedCollections++;
            if (ENABLE_DEBUG_LOGS) {
                console.log(`[useSchoolData] 📊 Loaded ${loadedCollections}/${totalCollections} collections`);
            }
            if (loadedCollections >= totalCollections && isInitialLoad) {
                setLoading(false);
                isInitialLoad = false;
                if (ENABLE_DEBUG_LOGS) {
                    console.log('[useSchoolData] ✅ Initial load complete');
                }
            }
        };

        // PERFORMANCE FIX: Increased timeout from 5s to 60s for production
        // Production Firestore with large datasets can take 30-50s initially
        const loadingTimeout = setTimeout(() => {
            if (isInitialLoad && loadedCollections < totalCollections) {
                console.warn(
                    `[useSchoolData] ⏰ Loading timeout (60s) - received ${loadedCollections}/${totalCollections} collections. ` +
                    `This may indicate slow network or missing Firestore indexes. Setting loading=false.`
                );
                setLoading(false);
                isInitialLoad = false;
            }
        }, 60000); // 60 seconds timeout for production

        // PERFORMANCE FIX: Remove waitForAuthReady() - user is already authenticated
        const db = getFirestoreInstance();

            // ===== STUDENTS SUBSCRIPTION =====
            if (shouldFetch('students') && !USE_POSTGRESQL) {
                console.log('[useSchoolData] 👥 Subscribing to students with schoolId:', schoolId);
                
                // MULTI-TENANT: Filter by schoolId
                // DEMO FIX: Removed limit(100) to show accurate total count on dashboard
                const studentsQuery = schoolId
                    ? query(
                        collection(db, 'students'),
                        where('schoolId', '==', schoolId)
                    )
                    : query(
                        collection(db, 'students')
                    );

                const unsubStudents = onSnapshot(
                    studentsQuery,
                    { includeMetadataChanges: true }, // CRITICAL: Detect cache vs server
                    (snapshot) => {
                        const fromCache = snapshot.metadata.fromCache;
                        if (ENABLE_CACHE_LOGS) {
                            console.log(
                                fromCache 
                                    ? '📦 [students] Data from CACHE' 
                                    : '📡 [students] Data from SERVER'
                            );
                        }

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

                        if (ENABLE_SUCCESS_LOGS) {
                            console.log(`[useSchoolData] ✅ Students updated: ${studentsData.length} documents`);
                        }
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
                if (ENABLE_SUBSCRIPTION_LOGS) {
                    console.log('[useSchoolData] ⏭️ Skipping students (not in collectionsToFetch)');
                }
                checkAllLoaded();
            }

            // ===== TEACHERS SUBSCRIPTION =====
            if (shouldFetch('teachers')) {
                if (ENABLE_SUBSCRIPTION_LOGS) {
                    console.log('[useSchoolData] 👨‍🏫 Subscribing to teachers...');
                }
                
                // MULTI-TENANT: Filter by schoolId
                const teachersQuery = schoolId
                    ? query(
                        collection(db, 'teachers'),
                        where('schoolId', '==', schoolId)
                    )
                    : collection(db, 'teachers');
                    
                const unsubTeachers = onSnapshot(
                    teachersQuery,
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        const fromCache = snapshot.metadata.fromCache;
                        if (ENABLE_CACHE_LOGS) {
                            console.log(
                                fromCache 
                                    ? '📦 [teachers] Data from CACHE' 
                                    : '📡 [teachers] Data from SERVER'
                            );
                        }

                        const teachersData = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        })) as Teacher[];

                        setTeachers(teachersData);
                        if (ENABLE_SUCCESS_LOGS) {
                            console.log(`[useSchoolData] ✅ Teachers updated: ${teachersData.length} documents`);
                        }
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
                if (ENABLE_SUBSCRIPTION_LOGS) {
                    console.log('[useSchoolData] ⏭️ Skipping teachers (not in collectionsToFetch)');
                }
                checkAllLoaded();
            }

            // ===== PARENTS SUBSCRIPTION =====
            if (shouldFetch('parents')) {
                if (ENABLE_SUBSCRIPTION_LOGS) {
                    console.log('[useSchoolData] 👪 Subscribing to parents...');
                }
                
                // MULTI-TENANT: Filter by schoolId
                const parentsQuery = schoolId
                    ? query(
                        collection(db, 'parents'),
                        where('schoolId', '==', schoolId)
                    )
                    : collection(db, 'parents');
                    
                const unsubParents = onSnapshot(
                    parentsQuery,
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        if (ENABLE_CACHE_LOGS) {
                            console.log(snapshot.metadata.fromCache ? '📦 [parents] CACHE' : '📡 [parents] SERVER');
                        }
                        setParents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Parent[]);
                        if (ENABLE_SUCCESS_LOGS) {
                            console.log(`[useSchoolData] ✅ Parents: ${snapshot.docs.length} docs`);
                        }
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
            if (shouldFetch('sections') && !USE_POSTGRESQL) {
                if (ENABLE_SUBSCRIPTION_LOGS) {
                    console.log('[useSchoolData] 📚 Subscribing to sections...');
                }
                
                // MULTI-TENANT: Filter by schoolId
                const sectionsQuery = schoolId
                    ? query(
                        collection(db, 'sections'),
                        where('schoolId', '==', schoolId)
                    )
                    : collection(db, 'sections');
                    
                const unsubSections = onSnapshot(
                    sectionsQuery,
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        if (ENABLE_CACHE_LOGS) {
                            console.log(snapshot.metadata.fromCache ? '📦 [sections] CACHE' : '📡 [sections] SERVER');
                        }
                        setSections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Section[]);
                        if (ENABLE_SUCCESS_LOGS) {
                            console.log(`[useSchoolData] ✅ Sections: ${snapshot.docs.length} docs`);
                        }
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
                if (ENABLE_SUBSCRIPTION_LOGS) {
                    console.log('[useSchoolData] 📖 Subscribing to learningAreas...');
                }
                
                // MULTI-TENANT: Filter by schoolId
                const learningAreasQuery = schoolId
                    ? query(
                        collection(db, 'learningAreas'),
                        where('schoolId', '==', schoolId)
                    )
                    : collection(db, 'learningAreas');
                    
                const unsubLearningAreas = onSnapshot(
                    learningAreasQuery,
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        if (ENABLE_CACHE_LOGS) {
                            console.log(snapshot.metadata.fromCache ? '📦 [learningAreas] CACHE' : '📡 [learningAreas] SERVER');
                        }
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
            if (shouldFetch('grades') && !USE_POSTGRESQL) {
                console.log('[useSchoolData] 📊 Subscribing to grades...');
                console.log('[useSchoolData] 📊 SchoolId for grades query:', schoolId);
                
                // MULTI-TENANT: Filter by schoolId
                const gradesQuery = schoolId
                    ? query(
                        collection(db, 'grades'),
                        where('schoolId', '==', schoolId)
                    )
                    : collection(db, 'grades');
                    
                const unsubGrades = onSnapshot(
                    gradesQuery,
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        if (ENABLE_CACHE_LOGS) {
                            console.log(snapshot.metadata.fromCache ? '📦 [grades] CACHE' : '📡 [grades] SERVER');
                        }
                        const gradesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Grade[];
                        setGrades(gradesData);
                        console.log(`[useSchoolData] ✅ Grades: ${snapshot.docs.length} docs`);
                        if (snapshot.docs.length > 0) {
                            console.log('[useSchoolData] 📊 Sample grade doc:', gradesData[0]);
                        }
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
                console.log('[useSchoolData] ⏭️ SKIPPING grades subscription (not in requested collections)');
                checkAllLoaded();
            }

            // ===== CORE VALUES SUBSCRIPTION =====
            if (shouldFetch('coreValues') && !USE_POSTGRESQL) {
                console.log('[useSchoolData] 💎 Subscribing to coreValues...');
                
                // MULTI-TENANT: Filter by schoolId
                const coreValuesQuery = schoolId
                    ? query(
                        collection(db, 'coreValues'),
                        where('schoolId', '==', schoolId)
                    )
                    : collection(db, 'coreValues');
                    
                const unsubCoreValues = onSnapshot(
                    coreValuesQuery,
                    { includeMetadataChanges: true },
                    (snapshot) => {
                        if (ENABLE_CACHE_LOGS) {
                            console.log(snapshot.metadata.fromCache ? '📦 [coreValues] CACHE' : '📡 [coreValues] SERVER');
                        }
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
            if (shouldFetch('coreValueGrades') && !USE_POSTGRESQL) {
                console.log('[useSchoolData] 💯 Subscribing to coreValueGrades...');
                
                // MULTI-TENANT: Filter by schoolId
                const coreValueGradesQuery = schoolId
                    ? query(
                        collection(db, 'coreValueGrades'),
                        where('schoolId', '==', schoolId)
                    )
                    : collection(db, 'coreValueGrades');
                    
                const unsubCoreValueGrades = onSnapshot(
                    coreValueGradesQuery,
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
                
                // MULTI-TENANT: Filter by schoolId
                const attendanceQuery = schoolId
                    ? query(
                        collection(db, 'attendanceRecords'),
                        where('schoolId', '==', schoolId)
                    )
                    : collection(db, 'attendanceRecords');
                    
                const unsubAttendance = onSnapshot(
                    attendanceQuery,
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
                
                // MULTI-TENANT: Filter by schoolId
                const substitutesQuery = schoolId
                    ? query(
                        collection(db, 'substituteAssignments'),
                        where('schoolId', '==', schoolId)
                    )
                    : collection(db, 'substituteAssignments');
                    
                const unsubSubstitutes = onSnapshot(
                    substitutesQuery,
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
                
                // MULTI-TENANT: Filter by schoolId
                const schedulesQuery = schoolId
                    ? query(
                        collection(db, 'classSchedules'),
                        where('schoolId', '==', schoolId)
                    )
                    : collection(db, 'classSchedules');
                    
                const unsubSchedules = onSnapshot(
                    schedulesQuery,
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
                
                // MULTI-TENANT: Filter by schoolId
                const assignmentsQuery = schoolId
                    ? query(
                        collection(db, 'assignments'),
                        where('schoolId', '==', schoolId)
                    )
                    : collection(db, 'assignments');
                    
                const unsubAssignments = onSnapshot(
                    assignmentsQuery,
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
                
                // MULTI-TENANT: Filter by schoolId
                const studentGradesQuery = schoolId
                    ? query(
                        collection(db, 'studentAssignmentGrades'),
                        where('schoolId', '==', schoolId)
                    )
                    : collection(db, 'studentAssignmentGrades');
                    
                const unsubStudentGrades = onSnapshot(
                    studentGradesQuery,
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
                
                // MULTI-TENANT: Filter by schoolId
                const lessonPlansQuery = schoolId
                    ? query(
                        collection(db, 'lessonPlans'),
                        where('schoolId', '==', schoolId)
                    )
                    : collection(db, 'lessonPlans');
                    
                const unsubLessonPlans = onSnapshot(
                    lessonPlansQuery,
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
                
                // MULTI-TENANT: Filter by schoolId
                const announcementsQuery = schoolId
                    ? query(
                        collection(db, 'announcements'),
                        where('schoolId', '==', schoolId)
                    )
                    : collection(db, 'announcements');
                    
                const unsubAnnouncements = onSnapshot(
                    announcementsQuery,
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
            // MULTI-TENANT: Load settings from schools/{schoolId} document
            if (shouldFetch('settings')) {
                console.log('[useSchoolData] ⚙️ Subscribing to settings...');
                
                if (schoolId) {
                    // Load from schools/{schoolId} document for multi-tenant
                    const unsubSettings = onSnapshot(
                        doc(db, 'schools', schoolId),
                        { includeMetadataChanges: true },
                        (snapshot) => {
                            console.log(snapshot.metadata.fromCache ? '📦 [settings] CACHE (from schools)' : '📡 [settings] SERVER (from schools)');
                            if (snapshot.exists()) {
                                const schoolData = snapshot.data();
                                // Extract settings from school document
                                const schoolSettings: SchoolSettings = {
                                    schoolName: schoolData.name || MOCK_SETTINGS.schoolName,
                                    region: schoolData.region || MOCK_SETTINGS.region,
                                    division: schoolData.division || MOCK_SETTINGS.division,
                                    district: schoolData.district || MOCK_SETTINGS.district,
                                    schoolYear: schoolData.currentSchoolYear || MOCK_SETTINGS.schoolYear,
                                    schoolType: schoolData.schoolType,
                                    financialConfig: schoolData.settings?.financialConfig,
                                    enrollmentConfig: schoolData.settings?.enrollmentConfig,
                                };
                                setSettings(schoolSettings);
                                console.log('[useSchoolData] ✅ Settings loaded from school:', schoolId);
                            } else {
                                console.warn('[useSchoolData] ⚠️ School document not found:', schoolId, '- using mock settings');
                                setSettings(MOCK_SETTINGS);
                            }
                            checkAllLoaded();
                        },
                        (err) => {
                            console.error('[useSchoolData] ❌ Settings error:', err);
                            setError(`Settings error: ${err.message}`);
                            // Fallback to mock settings on error
                            setSettings(MOCK_SETTINGS);
                            checkAllLoaded();
                        }
                    );
                    unsubscribers.push(unsubSettings);
                } else {
                    // Fallback: Load from legacy settings/school for backward compatibility
                    console.warn('[useSchoolData] ⚠️ No schoolId - loading from legacy settings/school');
                    const unsubSettings = onSnapshot(
                        doc(db, 'settings', 'school'),
                        { includeMetadataChanges: true },
                        (snapshot) => {
                            console.log(snapshot.metadata.fromCache ? '📦 [settings] CACHE (legacy)' : '📡 [settings] SERVER (legacy)');
                            if (snapshot.exists()) {
                                setSettings({ ...MOCK_SETTINGS, ...snapshot.data() } as SchoolSettings);
                                console.log('[useSchoolData] ✅ Settings loaded (legacy mode)');
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
                }
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

        // ===== CLEANUP =====
        return () => {
            console.log('[useSchoolData] 🧹 Cleaning up subscriptions...');
            clearTimeout(loadingTimeout);
            unsubscribers.forEach(unsub => unsub());
        };
    }, [collectionsToFetch, schoolId, schoolContextLoading]); // CRITICAL: Re-subscribe when schoolId changes for multi-tenant isolation

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
        console.log('[useSchoolData] 📄 Fetching next page of students with schoolId:', schoolId);

        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();

            // MULTI-TENANT: CRITICAL - Must filter by schoolId in pagination too!
            const nextQuery = schoolId
                ? query(
                    collection(db, 'students'),
                    where('schoolId', '==', schoolId),
                    startAfter(lastStudentDoc),
                    limit(100)
                )
                : query(
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
            console.log(`[useSchoolData] ✅ Fetched ${moreStudents.length} more students (schoolId: ${schoolId})`);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error fetching more students:', err);
            setError(`Pagination error: ${err.message}`);
        } finally {
            setIsFetchingStudents(false);
        }
    }, [hasMoreStudents, isFetchingStudents, lastStudentDoc, schoolId]); // Added schoolId dependency

    // ===== SEARCH: Students =====
    const searchStudents = useCallback(async (searchQuery: string): Promise<Student[]> => {
        const trimmedQuery = searchQuery.trim().toLowerCase();
        console.log('[useSchoolData] 🔍 searchStudents called with:', searchQuery, '→ trimmed:', trimmedQuery);
        
        if (!trimmedQuery) {
            console.log('[useSchoolData] Empty query, returning all students:', students.length);
            return students;
        }

        // Check cache (v2: includes email field)
        const cacheKey = `students:v2:${trimmedQuery}`;
        if (searchCache.has(cacheKey)) {
            const cached = searchCache.get(cacheKey)!;
            console.log('[useSchoolData] 📦 Returning cached student search results:', cached.length, 'students');
            return cached;
        }

        setIsSearching(true);

        try {
            // Use PostgreSQL search if enabled
            if (USE_POSTGRESQL) {
                console.log('[useSchoolData] 🔍 Using PostgreSQL search for:', trimmedQuery);
                
                // Client-side filtering of already-loaded students
                const results = students.filter(student => {
                    const fullName = student.name?.toLowerCase() || '';
                    const separateName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase().trim();
                    const email = student.email?.toLowerCase() || '';
                    const lrn = student.lrn?.toLowerCase() || '';
                    
                    return fullName.includes(trimmedQuery) || 
                           separateName.includes(trimmedQuery) || 
                           email.includes(trimmedQuery) ||
                           lrn.includes(trimmedQuery);
                });
                
                // Cache results
                setSearchCache(prev => new Map(prev).set(cacheKey, results));
                console.log(`[useSchoolData] ✅ PostgreSQL search found ${results.length} students`);
                return results;
            }

            // Fallback to Firestore search
            await waitForAuthReady();
            const db = getFirestoreInstance();

            // MULTI-TENANT: CRITICAL - Only fetch students from current school!
            const studentsQuery = schoolId
                ? query(collection(db, 'students'), where('schoolId', '==', schoolId))
                : collection(db, 'students');
            
            const snapshot = await getDocs(studentsQuery);
            const allStudents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Student[];
            
            console.log(`[useSchoolData] 🔍 Fetched ${allStudents.length} students from school: ${schoolId || 'all'}`);
            
            const results = allStudents.filter(student => {
                // Check all possible name formats
                const fullName = student.name?.toLowerCase() || '';
                const separateName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase().trim();
                const email = student.email?.toLowerCase() || '';
                const lrn = student.lrn?.toLowerCase() || '';
                
                return fullName.includes(trimmedQuery) || 
                       separateName.includes(trimmedQuery) || 
                       email.includes(trimmedQuery) ||
                       lrn.includes(trimmedQuery);
            });

            // Cache results (v2: includes email field)
            setSearchCache(prev => new Map(prev).set(`students:v2:${trimmedQuery}`, results));
            console.log(`[useSchoolData] ✅ Search found ${results.length} students matching "${trimmedQuery}" in school: ${schoolId}`);
            return results;
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Search error:', err);
            return students;
        } finally {
            setIsSearching(false);
        }
    }, [students, searchCache, schoolId]); // Added schoolId dependency

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
            if (USE_POSTGRESQL) {
                console.log('[useSchoolData] 🐘 PostgreSQL: Searching teachers');
                const results = await postgresTeachers.searchTeachers(searchQuery);
                setSearchCache(prev => new Map(prev).set(`teachers:${trimmedQuery}`, results));
                if (ENABLE_SUCCESS_LOGS) {
                    console.log(`[useSchoolData] ✅ Found ${results.length} matching teachers via PostgreSQL`);
                }
                return results;
            }
            
            await waitForAuthReady();
            const db = getFirestoreInstance();

            // MULTI-TENANT FIX: Filter by schoolId
            const teachersQuery = schoolId
                ? query(collection(db, 'teachers'), where('schoolId', '==', schoolId))
                : collection(db, 'teachers');

            const snapshot = await getDocs(teachersQuery);
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
            if (ENABLE_SUCCESS_LOGS) {
                console.log(`[useSchoolData] ✅ Found ${results.length} matching teachers in school: ${schoolId}`);
            }
            return results;
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Search error:', err);
            return teachers;
        } finally {
            setIsSearching(false);
        }
    }, [USE_POSTGRESQL, postgresTeachers, teachers, searchCache, schoolId]); // Added PostgreSQL dependencies

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

            // MULTI-TENANT FIX: Filter by schoolId
            const parentsQuery = schoolId
                ? query(collection(db, 'parents'), where('schoolId', '==', schoolId))
                : collection(db, 'parents');

            const snapshot = await getDocs(parentsQuery);
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
            if (ENABLE_SUCCESS_LOGS) {
                console.log(`[useSchoolData] ✅ Found ${results.length} matching parents in school: ${schoolId}`);
            }
            return results;
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Search error:', err);
            return parents;
        } finally {
            setIsSearching(false);
        }
    }, [parents, searchCache, schoolId]); // Added schoolId dependency

    // ===== REFRESH (Manual) =====
    const refresh = useCallback(() => {
        if (ENABLE_DEBUG_LOGS) {
            console.log('[useSchoolData] 🔄 Manual refresh requested (subscriptions auto-update)');
        }
        // Subscriptions auto-update, but we can clear cache
        setSearchCache(new Map());
    }, []);

    // ===== CRUD METHODS =====
    // All methods use Firestore directly (subscriptions auto-update the state)

    // ===== STUDENT CRUD =====
    const addStudent = useCallback(async (student: Omit<Student, 'id' | 'enrollmentDate'>): Promise<{ success: boolean; message?: string }> => {
        try {
            // Use PostgreSQL if enabled
            if (USE_POSTGRESQL) {
                console.log('[useSchoolData] 🐘 Adding student via PostgreSQL');
                const newStudent = await postgresStudents.createStudent(student, sections);
                console.log('[useSchoolData] ✅ Student added via PostgreSQL:', newStudent.id);
                await postgresStudents.refetch(); // Refresh list
                return { success: true };
            }

            // Fallback to Firestore
            await waitForAuthReady();
            const db = getFirestoreInstance();

            // Validate unique email
            const existingStudent = students.find(s => s.email === student.email);
            if (existingStudent) {
                return { success: false, message: 'A student with this email already exists.' };
            }

            // MULTI-TENANT: Auto-inject schoolId from context (if not provided)
            // During migration, accept schoolId from parameter OR use context
            const finalSchoolId = student.schoolId || schoolId || 'default';

            const newStudent = {
                ...student,
                schoolId: finalSchoolId,  // MULTI-TENANT: Ensure schoolId is set
                enrollmentDate: serverTimestamp(),
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'students'), newStudent);
            console.log('[useSchoolData] ✅ Student added:', docRef.id, 'schoolId:', finalSchoolId);
            return { success: true };
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error adding student:', err);
            return { success: false, message: err.message };
        }
    }, [students, schoolId, USE_POSTGRESQL, postgresStudents]);

    const updateStudent = useCallback(async (student: Student): Promise<void> => {
        try {
            // Use PostgreSQL if enabled
            if (USE_POSTGRESQL) {
                console.log('[useSchoolData] 🐘 Updating student via PostgreSQL:', student.id);
                await postgresStudents.updateStudent(student.id, student);
                console.log('[useSchoolData] ✅ Student updated via PostgreSQL');
                await postgresStudents.refetch(); // Refresh list
                return;
            }

            // Fallback to Firestore
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Preserve schoolId, ensure it matches context
            const finalSchoolId = student.schoolId || schoolId || 'default';
            
            // Filter out undefined values to prevent Firestore errors
            const studentData: Record<string, any> = { schoolId: finalSchoolId };
            Object.keys(student).forEach(key => {
                const value = (student as any)[key];
                if (value !== undefined) {
                    studentData[key] = value;
                }
            });
            
            await updateDoc(doc(db, 'students', student.id), {
                ...studentData,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Student updated:', student.id, 'schoolId:', finalSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating student:', err);
            throw err;
        }
    }, [schoolId, USE_POSTGRESQL, postgresStudents]);

    const deleteStudent = useCallback(async (studentId: string): Promise<void> => {
        try {
            // Use PostgreSQL if enabled
            if (USE_POSTGRESQL) {
                console.log('[useSchoolData] 🐘 Deleting student via PostgreSQL:', studentId);
                await postgresStudents.deleteStudent(studentId);
                console.log('[useSchoolData] ✅ Student deleted via PostgreSQL');
                await postgresStudents.refetch(); // Refresh list
                return;
            }

            // Fallback to Firestore
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Verify schoolId before deletion
            const studentDoc = await getDoc(doc(db, 'students', studentId));
            if (!studentDoc.exists()) {
                throw new Error('Student not found');
            }
            
            const studentData = studentDoc.data();
            const studentSchoolId = studentData.schoolId || 'default';
            const currentSchoolId = schoolId || 'default';
            
            if (studentSchoolId !== currentSchoolId) {
                throw new Error(`Cannot delete student from different school (student: ${studentSchoolId}, current: ${currentSchoolId})`);
            }
            
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
            console.log('[useSchoolData] ✅ Student and related data deleted:', studentId, 'schoolId:', studentSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error deleting student:', err);
            throw err;
        }
    }, [schoolId, USE_POSTGRESQL, postgresStudents]);

    // ===== TEACHER CRUD =====
    const addTeacher = useCallback(async (teacher: Omit<Teacher, 'id'>): Promise<void> => {
        try {
            if (USE_POSTGRESQL) {
                console.log('[useSchoolData] 🐘 PostgreSQL: Creating teacher');
                await postgresTeachers.createTeacher(teacher);
                console.log('[useSchoolData] ✅ Teacher created via PostgreSQL');
                return;
            }
            
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Auto-inject schoolId
            const finalSchoolId = teacher.schoolId || schoolId || 'default';
            
            const docRef = await addDoc(collection(db, 'teachers'), {
                ...teacher,
                schoolId: finalSchoolId,
                createdAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Teacher added:', docRef.id, 'schoolId:', finalSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error adding teacher:', err);
            throw err;
        }
    }, [USE_POSTGRESQL, postgresTeachers, schoolId]);

    const updateTeacher = useCallback(async (teacher: Teacher): Promise<void> => {
        try {
            if (USE_POSTGRESQL) {
                console.log('[useSchoolData] 🐘 PostgreSQL: Updating teacher', teacher.id);
                const { id, ...updates } = teacher;
                await postgresTeachers.updateTeacher(id, updates);
                console.log('[useSchoolData] ✅ Teacher updated via PostgreSQL');
                return;
            }
            
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Preserve schoolId
            const finalSchoolId = teacher.schoolId || schoolId || 'default';
            
            await updateDoc(doc(db, 'teachers', teacher.id), {
                ...teacher,
                schoolId: finalSchoolId,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Teacher updated:', teacher.id, 'schoolId:', finalSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating teacher:', err);
            throw err;
        }
    }, [USE_POSTGRESQL, postgresTeachers, schoolId]);

    const deleteTeacher = useCallback(async (teacherId: string): Promise<void> => {
        try {
            if (USE_POSTGRESQL) {
                console.log('[useSchoolData] 🐘 PostgreSQL: Deleting teacher', teacherId);
                await postgresTeachers.deleteTeacher(teacherId);
                console.log('[useSchoolData] ✅ Teacher deleted via PostgreSQL');
                return;
            }
            
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Verify schoolId before deletion
            const teacherDoc = await getDoc(doc(db, 'teachers', teacherId));
            if (!teacherDoc.exists()) {
                throw new Error('Teacher not found');
            }
            
            const teacherData = teacherDoc.data();
            const teacherSchoolId = teacherData.schoolId || 'default';
            const currentSchoolId = schoolId || 'default';
            
            if (teacherSchoolId !== currentSchoolId) {
                throw new Error(`Cannot delete teacher from different school (teacher: ${teacherSchoolId}, current: ${currentSchoolId})`);
            }
            
            await deleteDoc(doc(db, 'teachers', teacherId));
            console.log('[useSchoolData] ✅ Teacher deleted:', teacherId, 'schoolId:', teacherSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error deleting teacher:', err);
            throw err;
        }
    }, [USE_POSTGRESQL, postgresTeachers, schoolId]);

    // ===== PARENT CRUD =====
    const addParent = useCallback(async (parent: Omit<Parent, 'id'>): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Auto-inject schoolId
            const finalSchoolId = parent.schoolId || schoolId || 'default';
            
            const docRef = await addDoc(collection(db, 'parents'), {
                ...parent,
                schoolId: finalSchoolId,
                createdAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Parent added:', docRef.id, 'schoolId:', finalSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error adding parent:', err);
            throw err;
        }
    }, [schoolId]);

    const updateParent = useCallback(async (parent: Parent): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Preserve schoolId
            const finalSchoolId = parent.schoolId || schoolId || 'default';
            
            await updateDoc(doc(db, 'parents', parent.id), {
                ...parent,
                schoolId: finalSchoolId,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Parent updated:', parent.id, 'schoolId:', finalSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating parent:', err);
            throw err;
        }
    }, [schoolId]);

    const deleteParent = useCallback(async (parentId: string): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Verify schoolId before deletion
            const parentDoc = await getDoc(doc(db, 'parents', parentId));
            if (!parentDoc.exists()) {
                throw new Error('Parent not found');
            }
            
            const parentData = parentDoc.data();
            const parentSchoolId = parentData.schoolId || 'default';
            const currentSchoolId = schoolId || 'default';
            
            if (parentSchoolId !== currentSchoolId) {
                throw new Error(`Cannot delete parent from different school (parent: ${parentSchoolId}, current: ${currentSchoolId})`);
            }
            
            await deleteDoc(doc(db, 'parents', parentId));
            console.log('[useSchoolData] ✅ Parent deleted:', parentId, 'schoolId:', parentSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error deleting parent:', err);
            throw err;
        }
    }, [schoolId]);

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
            
            // MULTI-TENANT: Auto-inject schoolId from context (if not provided)
            const finalSchoolId = section.schoolId || schoolId || 'default';
            
            const docRef = await addDoc(collection(db, 'sections'), {
                ...section,
                schoolId: finalSchoolId,  // MULTI-TENANT: Ensure schoolId is set
                createdAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Section added:', docRef.id, 'schoolId:', finalSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error adding section:', err);
            throw err;
        }
    }, [schoolId]);

    const updateSection = useCallback(async (section: Section): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Preserve schoolId
            const finalSchoolId = section.schoolId || schoolId || 'default';
            
            await updateDoc(doc(db, 'sections', section.id), {
                ...section,
                schoolId: finalSchoolId,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Section updated:', section.id, 'schoolId:', finalSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating section:', err);
            throw err;
        }
    }, [schoolId]);

    const deleteSection = useCallback(async (sectionId: string): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Verify schoolId before deletion
            const sectionDoc = await getDoc(doc(db, 'sections', sectionId));
            if (!sectionDoc.exists()) {
                throw new Error('Section not found');
            }
            
            const sectionData = sectionDoc.data();
            const sectionSchoolId = sectionData.schoolId || 'default';
            const currentSchoolId = schoolId || 'default';
            
            if (sectionSchoolId !== currentSchoolId) {
                throw new Error(`Cannot delete section from different school (section: ${sectionSchoolId}, current: ${currentSchoolId})`);
            }
            
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
            
            console.log('[useSchoolData] ✅ Section deleted:', sectionId, 'schoolId:', sectionSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error deleting section:', err);
            throw err;
        }
    }, [students, schoolId]);

    // ===== LEARNING AREA CRUD =====
    const addLearningArea = useCallback(async (area: Omit<LearningArea, 'id'>): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Auto-inject schoolId
            const finalSchoolId = area.schoolId || schoolId || 'default';
            
            const docRef = await addDoc(collection(db, 'learningAreas'), {
                ...area,
                schoolId: finalSchoolId,
                createdAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Learning area added:', docRef.id, 'schoolId:', finalSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error adding learning area:', err);
            throw err;
        }
    }, []);

    const updateLearningArea = useCallback(async (learningAreaId: string, area: Omit<LearningArea, 'id'>): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Preserve schoolId
            const finalSchoolId = area.schoolId || schoolId || 'default';
            
            await updateDoc(doc(db, 'learningAreas', learningAreaId), {
                ...area,
                id: learningAreaId,
                schoolId: finalSchoolId,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Learning area updated:', learningAreaId, 'schoolId:', finalSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating learning area:', err);
            throw err;
        }
    }, [schoolId]);

    const deleteLearningArea = useCallback(async (learningAreaId: string): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Verify schoolId before deletion
            const learningAreaDoc = await getDoc(doc(db, 'learningAreas', learningAreaId));
            if (!learningAreaDoc.exists()) {
                throw new Error('Learning area not found');
            }
            
            const learningAreaData = learningAreaDoc.data();
            const learningAreaSchoolId = learningAreaData.schoolId || 'default';
            const currentSchoolId = schoolId || 'default';
            
            if (learningAreaSchoolId !== currentSchoolId) {
                throw new Error(`Cannot delete learning area from different school (learningArea: ${learningAreaSchoolId}, current: ${currentSchoolId})`);
            }
            
            await deleteDoc(doc(db, 'learningAreas', learningAreaId));
            
            // Delete related grades
            const gradesQuery = query(collection(db, 'grades'), where('learningAreaId', '==', learningAreaId));
            const gradesSnapshot = await getDocs(gradesQuery);
            const deletePromises = gradesSnapshot.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deletePromises);
            
            console.log('[useSchoolData] ✅ Learning area and related grades deleted:', learningAreaId, 'schoolId:', learningAreaSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error deleting learning area:', err);
            throw err;
        }
    }, [schoolId]);

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
                // MULTI-TENANT: Create new grade document with schoolId
                gradeData = {
                    studentId,
                    learningAreaId,
                    schoolId: schoolId || 'default',
                    [quarter]: subSubject ? { [subSubject]: value } : value,
                    createdAt: serverTimestamp()
                };
                gradeRef = await addDoc(collection(db, 'grades'), gradeData);
            } else {
                // Update existing grade document
                const existingDoc = gradesSnapshot.docs[0];
                gradeRef = existingDoc.ref;
                gradeData = existingDoc.data();
                
                // MULTI-TENANT: Preserve schoolId
                gradeData.schoolId = gradeData.schoolId || schoolId || 'default';
                
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
    }, [schoolId]);

    // ===== CORE VALUE GRADE CRUD =====
    const updateCoreValueGrade = useCallback(async (
        studentId: string,
        coreValueId: string,
        quarter: 'q1' | 'q2' | 'q3' | 'q4',
        behavior: string,
        value: CoreValueMarking | ''
    ): Promise<void> => {
        try {
            // POSTGRESQL: Use PostgreSQL for updates
            if (USE_POSTGRESQL) {
                const { supabase } = await import('../src/hooks/useSupabase');
                
                // Find existing core value grade
                const { data: existingGrades, error: fetchError } = await supabase
                    .from('core_value_grades')
                    .select('*')
                    .eq('student_id', studentId)
                    .eq('core_value_id', coreValueId)
                    .limit(1);
                
                if (fetchError) throw fetchError;
                
                if (!existingGrades || existingGrades.length === 0) {
                    // Create new record
                    const newIndicatorRatings = {
                        [quarter]: { [behavior]: value }
                    };
                    
                    const { error: insertError } = await supabase
                        .from('core_value_grades')
                        .insert({
                            school_id: schoolId || 'default',
                            student_id: studentId,
                            core_value_id: coreValueId,
                            school_year: '2024-2025',
                            indicator_ratings: newIndicatorRatings
                        });
                    
                    if (insertError) throw insertError;
                } else {
                    // Update existing record
                    const existing = existingGrades[0];
                    const currentRatings = existing.indicator_ratings || {};
                    const currentQuarter = currentRatings[quarter] || {};
                    
                    const updatedRatings = {
                        ...currentRatings,
                        [quarter]: { ...currentQuarter, [behavior]: value }
                    };
                    
                    const { error: updateError } = await supabase
                        .from('core_value_grades')
                        .update({ indicator_ratings: updatedRatings })
                        .eq('id', existing.id);
                    
                    if (updateError) throw updateError;
                }
                
                console.log('[useSchoolData] 🐘 PostgreSQL core value grade updated:', { studentId, coreValueId, quarter, behavior });
                
                // Trigger refetch by updating state directly
                // Since we don't have a direct refetch mechanism, we'll refetch manually
                const { supabase: supabaseRefetch } = await import('../src/hooks/useSupabase');
                const { data: updatedGrades } = await supabaseRefetch
                    .from('core_value_grades')
                    .select('*')
                    .eq('student_id', studentId);
                
                if (updatedGrades && updatedGrades.length > 0) {
                    // Update the specific grade in state
                    setCoreValueGrades(prev => {
                        const updated = prev.filter(g => g.studentId !== studentId || g.coreValueId !== coreValueId);
                        const newGrade = updatedGrades.find((g: any) => g.core_value_id === coreValueId);
                        if (newGrade) {
                            const indicatorRatings = newGrade.indicator_ratings || {};
                            updated.push({
                                id: newGrade.id,
                                schoolId: newGrade.school_id,
                                studentId: newGrade.student_id,
                                coreValueId: newGrade.core_value_id,
                                schoolYear: newGrade.school_year,
                                q1: indicatorRatings.q1 || {},
                                q2: indicatorRatings.q2 || {},
                                q3: indicatorRatings.q3 || {},
                                q4: indicatorRatings.q4 || {},
                                gradedBy: newGrade.graded_by,
                                createdAt: newGrade.created_at,
                                updatedAt: newGrade.updated_at
                            });
                        }
                        return updated;
                    });
                }
                
                return;
            }
            
            // FIRESTORE: Original Firestore logic
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
                // MULTI-TENANT: Create new core value grade with schoolId
                cvGradeData = {
                    studentId,
                    coreValueId,
                    schoolId: schoolId || 'default',
                    [quarter]: { [behavior]: value },
                    createdAt: serverTimestamp()
                };
                await addDoc(collection(db, 'coreValueGrades'), cvGradeData);
            } else {
                // Update existing
                const existingDoc = cvGradesSnapshot.docs[0];
                cvGradeData = existingDoc.data();
                
                // MULTI-TENANT: Preserve schoolId
                cvGradeData.schoolId = cvGradeData.schoolId || schoolId || 'default';
                
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
    }, [schoolId]);

    // ===== ATTENDANCE CRUD =====
    // Firestore-only version (legacy)
    const updateAttendanceFirestore = useCallback(async (
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
                // MULTI-TENANT: Create new attendance record with schoolId
                await addDoc(collection(db, 'attendanceRecords'), {
                    studentId,
                    schoolId: schoolId || 'default',
                    dailyStatus: { [date]: status },
                    createdAt: serverTimestamp()
                });
            } else {
                // Update existing
                const existingDoc = attendanceSnapshot.docs[0];
                const existingData = existingDoc.data();
                
                // MULTI-TENANT: Preserve schoolId
                const finalSchoolId = existingData.schoolId || schoolId || 'default';
                
                const dailyStatus = existingData.dailyStatus || {};
                dailyStatus[date] = status;
                
                await updateDoc(existingDoc.ref, {
                    dailyStatus,
                    schoolId: finalSchoolId,
                    updatedAt: serverTimestamp()
                });
            }
            
            console.log('[useSchoolData] ✅ Attendance updated:', { studentId, date, status });
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating attendance:', err);
            throw err;
        }
    }, [schoolId]);

    // Smart wrapper: Use PostgreSQL in PostgreSQL mode, Firestore otherwise
    const updateAttendance = USE_POSTGRESQL 
        ? postgresAttendance.updateAttendance 
        : updateAttendanceFirestore;


    // ===== SETTINGS CRUD =====
    const updateSettings = useCallback(async (settings: SchoolSettings): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Update settings in schools/{schoolId} document
            if (!schoolId) {
                throw new Error('Cannot update settings: schoolId is required');
            }
            
            await setDoc(doc(db, 'schools', schoolId), {
                name: settings.schoolName,
                region: settings.region,
                division: settings.division,
                district: settings.district,
                currentSchoolYear: settings.schoolYear,
                schoolType: settings.schoolType,
                settings: {
                    financialConfig: settings.financialConfig,
                    enrollmentConfig: settings.enrollmentConfig,
                },
                updatedAt: serverTimestamp()
            }, { merge: true }); // Use merge to preserve other school fields
            
            console.log('[useSchoolData] ✅ Settings updated for school:', schoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating settings:', err);
            throw err;
        }
    }, [schoolId]);

    // ===== SUBSTITUTE ASSIGNMENT CRUD =====
    const addSubstituteAssignment = useCallback(async (assignment: Omit<SubstituteAssignment, 'id'>): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Auto-inject schoolId
            const finalSchoolId = assignment.schoolId || schoolId || 'default';
            
            const docRef = await addDoc(collection(db, 'substituteAssignments'), {
                ...assignment,
                schoolId: finalSchoolId,
                createdAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Substitute assignment added:', docRef.id, 'schoolId:', finalSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error adding substitute assignment:', err);
            throw err;
        }
    }, [schoolId]);

    const updateSubstituteAssignment = useCallback(async (assignment: SubstituteAssignment): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Preserve schoolId
            const finalSchoolId = assignment.schoolId || schoolId || 'default';
            
            await updateDoc(doc(db, 'substituteAssignments', assignment.id), {
                ...assignment,
                schoolId: finalSchoolId,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Substitute assignment updated:', assignment.id, 'schoolId:', finalSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating substitute assignment:', err);
            throw err;
        }
    }, [schoolId]);

    const deleteSubstituteAssignment = useCallback(async (assignmentId: string): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Verify schoolId before deletion
            const assignmentDoc = await getDoc(doc(db, 'substituteAssignments', assignmentId));
            if (!assignmentDoc.exists()) {
                throw new Error('Substitute assignment not found');
            }
            
            const assignmentData = assignmentDoc.data();
            const assignmentSchoolId = assignmentData.schoolId || 'default';
            const currentSchoolId = schoolId || 'default';
            
            if (assignmentSchoolId !== currentSchoolId) {
                throw new Error(`Cannot delete substitute assignment from different school (assignment: ${assignmentSchoolId}, current: ${currentSchoolId})`);
            }
            
            await deleteDoc(doc(db, 'substituteAssignments', assignmentId));
            console.log('[useSchoolData] ✅ Substitute assignment deleted:', assignmentId, 'schoolId:', assignmentSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error deleting substitute assignment:', err);
            throw err;
        }
    }, [schoolId]);

    // ===== CLASS SCHEDULE CRUD =====
    const addSchedule = useCallback(async (sched: Omit<ClassSchedule, 'id'>): Promise<{ success: boolean; message?: string }> => {
        try {
            // Use PostgreSQL if enabled
            if (USE_POSTGRESQL && postgresSchedules) {
                console.log('[useSchoolData] 🐘 PostgreSQL: Adding schedule');
                await postgresSchedules.addSchedule(sched as any);
                console.log('[useSchoolData] ✅ Schedule added via PostgreSQL');
                return { success: true };
            }

            // Fallback to Firestore
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Auto-inject schoolId
            const finalSchoolId = sched.schoolId || schoolId || 'default';
            
            // TODO: Add conflict validation if needed
            
            const docRef = await addDoc(collection(db, 'classSchedules'), {
                ...sched,
                schoolId: finalSchoolId,
                createdAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Schedule added:', docRef.id, 'schoolId:', finalSchoolId);
            return { success: true };
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error adding schedule:', err);
            return { success: false, message: err.message };
        }
    }, [schoolId]);

    const updateSchedule = useCallback(async (sched: ClassSchedule): Promise<{ success: boolean; message?: string }> => {
        try {
            // Use PostgreSQL if enabled
            if (USE_POSTGRESQL && postgresSchedules) {
                console.log('[useSchoolData] 🐘 PostgreSQL: Updating schedule', sched.id);
                await postgresSchedules.updateSchedule(sched.id, sched as any);
                console.log('[useSchoolData] ✅ Schedule updated via PostgreSQL');
                return { success: true };
            }

            // Fallback to Firestore
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Preserve schoolId
            const finalSchoolId = sched.schoolId || schoolId || 'default';
            
            await updateDoc(doc(db, 'classSchedules', sched.id), {
                ...sched,
                schoolId: finalSchoolId,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Schedule updated:', sched.id, 'schoolId:', finalSchoolId);
            return { success: true };
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating schedule:', err);
            return { success: false, message: err.message };
        }
    }, [schoolId, USE_POSTGRESQL, postgresSchedules]);

    const deleteSchedule = useCallback(async (scheduleId: string): Promise<void> => {
        try {
            // Use PostgreSQL if enabled
            if (USE_POSTGRESQL && postgresSchedules) {
                console.log('[useSchoolData] 🐘 PostgreSQL: Deleting schedule', scheduleId);
                await postgresSchedules.deleteSchedule(scheduleId);
                console.log('[useSchoolData] ✅ Schedule deleted via PostgreSQL');
                return;
            }

            // Fallback to Firestore
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Verify schoolId before deletion
            const scheduleDoc = await getDoc(doc(db, 'classSchedules', scheduleId));
            if (!scheduleDoc.exists()) {
                throw new Error('Schedule not found');
            }
            
            const scheduleData = scheduleDoc.data();
            const scheduleSchoolId = scheduleData.schoolId || 'default';
            const currentSchoolId = schoolId || 'default';
            
            if (scheduleSchoolId !== currentSchoolId) {
                throw new Error(`Cannot delete schedule from different school (schedule: ${scheduleSchoolId}, current: ${currentSchoolId})`);
            }
            
            await deleteDoc(doc(db, 'classSchedules', scheduleId));
            console.log('[useSchoolData] ✅ Schedule deleted:', scheduleId, 'schoolId:', scheduleSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error deleting schedule:', err);
            throw err;
        }
    }, [schoolId, USE_POSTGRESQL, postgresSchedules]);

    // ===== ASSIGNMENT CRUD =====
    const addAssignment = useCallback(async (assignment: Omit<Assignment, 'id'>): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Auto-inject schoolId
            const finalSchoolId = assignment.schoolId || schoolId || 'default';
            
            const docRef = await addDoc(collection(db, 'assignments'), {
                ...assignment,
                schoolId: finalSchoolId,
                createdAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Assignment added:', docRef.id, 'schoolId:', finalSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error adding assignment:', err);
            throw err;
        }
    }, [schoolId]);

    const updateAssignment = useCallback(async (assignment: Assignment): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Preserve schoolId
            const finalSchoolId = assignment.schoolId || schoolId || 'default';
            
            await updateDoc(doc(db, 'assignments', assignment.id), {
                ...assignment,
                schoolId: finalSchoolId,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Assignment updated:', assignment.id, 'schoolId:', finalSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating assignment:', err);
            throw err;
        }
    }, [schoolId]);

    const deleteAssignment = useCallback(async (assignmentId: string): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Verify schoolId before deletion
            const assignmentDoc = await getDoc(doc(db, 'assignments', assignmentId));
            if (!assignmentDoc.exists()) {
                throw new Error('Assignment not found');
            }
            
            const assignmentData = assignmentDoc.data();
            const assignmentSchoolId = assignmentData.schoolId || 'default';
            const currentSchoolId = schoolId || 'default';
            
            if (assignmentSchoolId !== currentSchoolId) {
                throw new Error(`Cannot delete assignment from different school (assignment: ${assignmentSchoolId}, current: ${currentSchoolId})`);
            }
            
            await deleteDoc(doc(db, 'assignments', assignmentId));
            
            // Delete related student grades
            const gradesQuery = query(collection(db, 'studentAssignmentGrades'), where('assignmentId', '==', assignmentId));
            const gradesSnapshot = await getDocs(gradesQuery);
            const deletePromises = gradesSnapshot.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deletePromises);
            
            console.log('[useSchoolData] ✅ Assignment and related grades deleted:', assignmentId, 'schoolId:', assignmentSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error deleting assignment:', err);
            throw err;
        }
    }, [schoolId]);

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
            
            const gradeData: any = {
                studentId,
                assignmentId,
                score,
                feedback,
            };
            
            if (gradesSnapshot.empty) {
                // MULTI-TENANT: Create new with schoolId
                await addDoc(collection(db, 'studentAssignmentGrades'), {
                    ...gradeData,
                    schoolId: schoolId || 'default',
                    createdAt: serverTimestamp()
                });
            } else {
                // MULTI-TENANT: Preserve schoolId
                const existingData = gradesSnapshot.docs[0].data();
                const finalSchoolId = existingData.schoolId || schoolId || 'default';
                
                await updateDoc(gradesSnapshot.docs[0].ref, {
                    ...gradeData,
                    schoolId: finalSchoolId,
                    updatedAt: serverTimestamp()
                });
            }
            
            console.log('[useSchoolData] ✅ Assignment grade updated:', { studentId, assignmentId, score });
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating assignment grade:', err);
            throw err;
        }
    }, [schoolId]);

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
            
            // MULTI-TENANT: Auto-inject schoolId
            const finalSchoolId = lessonPlan.schoolId || schoolId || 'default';
            
            const docRef = await addDoc(collection(db, 'lessonPlans'), {
                ...lessonPlan,
                schoolId: finalSchoolId,
                createdAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Lesson plan added:', docRef.id, 'schoolId:', finalSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error adding lesson plan:', err);
            throw err;
        }
    }, [schoolId]);

    const updateLessonPlan = useCallback(async (lessonPlan: LessonPlan): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Preserve schoolId
            const finalSchoolId = lessonPlan.schoolId || schoolId || 'default';
            
            await updateDoc(doc(db, 'lessonPlans', lessonPlan.id), {
                ...lessonPlan,
                schoolId: finalSchoolId,
                updatedAt: serverTimestamp()
            });
            console.log('[useSchoolData] ✅ Lesson plan updated:', lessonPlan.id, 'schoolId:', finalSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating lesson plan:', err);
            throw err;
        }
    }, [schoolId]);

    const deleteLessonPlan = useCallback(async (lessonPlanId: string): Promise<void> => {
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            // MULTI-TENANT: Verify schoolId before deletion
            const lessonPlanDoc = await getDoc(doc(db, 'lessonPlans', lessonPlanId));
            if (!lessonPlanDoc.exists()) {
                throw new Error('Lesson plan not found');
            }
            
            const lessonPlanData = lessonPlanDoc.data();
            const lessonPlanSchoolId = lessonPlanData.schoolId || 'default';
            const currentSchoolId = schoolId || 'default';
            
            if (lessonPlanSchoolId !== currentSchoolId) {
                throw new Error(`Cannot delete lesson plan from different school (lessonPlan: ${lessonPlanSchoolId}, current: ${currentSchoolId})`);
            }
            
            await deleteDoc(doc(db, 'lessonPlans', lessonPlanId));
            console.log('[useSchoolData] ✅ Lesson plan deleted:', lessonPlanId, 'schoolId:', lessonPlanSchoolId);
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error deleting lesson plan:', err);
            throw err;
        }
    }, [schoolId]);

    // ===== ANNOUNCEMENT CRUD =====
    const addAnnouncement = useCallback(async (announcement: Omit<Announcement, 'id'>): Promise<void> => {
        try {
            if (USE_POSTGRESQL) {
                // MULTI-TENANT: Auto-inject schoolId for PostgreSQL
                const finalSchoolId = announcement.schoolId || schoolId;
                if (!finalSchoolId) {
                    throw new Error('schoolId is required to add announcement');
                }
                
                await postgresAnnouncements.addAnnouncement({
                    ...announcement,
                    schoolId: finalSchoolId
                });
            } else {
                await waitForAuthReady();
                const db = getFirestoreInstance();
                
                // MULTI-TENANT: Auto-inject schoolId
                const finalSchoolId = announcement.schoolId || schoolId || 'default';
                
                const docRef = await addDoc(collection(db, 'announcements'), {
                    ...announcement,
                    schoolId: finalSchoolId,
                    createdAt: serverTimestamp()
                });
                console.log('[useSchoolData] ✅ Announcement added:', docRef.id, 'schoolId:', finalSchoolId);
            }
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error adding announcement:', err);
            throw err;
        }
    }, [USE_POSTGRESQL, postgresAnnouncements, schoolId]);

    const updateAnnouncement = useCallback(async (announcement: Announcement): Promise<void> => {
        try {
            if (USE_POSTGRESQL) {
                await postgresAnnouncements.updateAnnouncement(announcement.id, announcement);
            } else {
                await waitForAuthReady();
                const db = getFirestoreInstance();
                
                // MULTI-TENANT: Preserve schoolId
                const finalSchoolId = announcement.schoolId || schoolId || 'default';
                
                await updateDoc(doc(db, 'announcements', announcement.id), {
                    ...announcement,
                    schoolId: finalSchoolId,
                    updatedAt: serverTimestamp()
                });
                console.log('[useSchoolData] ✅ Announcement updated:', announcement.id, 'schoolId:', finalSchoolId);
            }
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error updating announcement:', err);
            throw err;
        }
    }, [USE_POSTGRESQL, postgresAnnouncements, schoolId]);

    const deleteAnnouncement = useCallback(async (announcementId: string): Promise<void> => {
        try {
            if (USE_POSTGRESQL) {
                await postgresAnnouncements.deleteAnnouncement(announcementId);
            } else {
                await waitForAuthReady();
                const db = getFirestoreInstance();
                
                // MULTI-TENANT: Verify schoolId before deletion
                const announcementDoc = await getDoc(doc(db, 'announcements', announcementId));
                if (!announcementDoc.exists()) {
                    throw new Error('Announcement not found');
                }
                
                const announcementData = announcementDoc.data();
                const announcementSchoolId = announcementData.schoolId || 'default';
                const currentSchoolId = schoolId || 'default';
                
                if (announcementSchoolId !== currentSchoolId) {
                    throw new Error(`Cannot delete announcement from different school (announcement: ${announcementSchoolId}, current: ${currentSchoolId})`);
                }
                
                await deleteDoc(doc(db, 'announcements', announcementId));
                console.log('[useSchoolData] ✅ Announcement deleted:', announcementId, 'schoolId:', announcementSchoolId);
            }
        } catch (err: any) {
            console.error('[useSchoolData] ❌ Error deleting announcement:', err);
            throw err;
        }
    }, [USE_POSTGRESQL, postgresAnnouncements, schoolId])

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

