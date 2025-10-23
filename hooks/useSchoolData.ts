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

import { useCallback, useState, useEffect, useMemo } from 'react';
import { useQuery, useQueries, useQueryClient, QueryKey } from '@tanstack/react-query';
import type { 
    Student, LearningArea, Grade, CoreValue, CoreValueGrade, AttendanceRecord, 
    Teacher, Section, SchoolSettings, SubstituteAssignment, ClassSchedule, 
    Assignment, StudentAssignmentGrade, LessonPlan, Parent, Announcement, 
    AttendanceStatus, CoreValueMarking 
} from '../types';
import { getFirestoreInstance, auth, waitForAuthReady } from '../src/services/firestoreService';
import { 
    collection, getDocs, getDocsFromCache, getDocsFromServer, doc, getDoc, setDoc, updateDoc, deleteDoc, 
    serverTimestamp, onSnapshot, query, orderBy, limit, startAfter, where, QueryDocumentSnapshot, DocumentData, QuerySnapshot
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
        console.log(`[Firestore] 🔍 Fetching paginated collection: ${collectionName}, limit: ${limitCount}`);
        
        // Wait for auth before fetching
        await waitForAuthReady();
        
        const db = getFirestoreInstance();
        
        // Simple query without orderBy to avoid index requirements  
        let q = query(collection(db, collectionName), limit(limitCount));
        
        console.log(`[Firestore] ⏱️ Executing getDocs() for ${collectionName}...`);
        
        // OFFLINE FIX: Try cache first, fallback to server
        let snapshot: QuerySnapshot<DocumentData>;
        try {
            console.log(`[Firestore] 📦 Trying cache for ${collectionName}...`);
            snapshot = await getDocsFromCache(q);
            console.log(`[Firestore] ✅ Cache hit for ${collectionName}: ${snapshot.docs.length} documents`);
        } catch (cacheError) {
            console.log(`[Firestore] 📡 Cache miss, fetching from server for ${collectionName}...`);
            snapshot = await getDocsFromServer(q);
            console.log(`[Firestore] ✅ Server fetch for ${collectionName}: ${snapshot.docs.length} documents`);
        }
        
        const data = snapshot.docs.map((doc: any) => {
            return { id: doc.id, ...doc.data() } as T;
        });
        
        const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
        return { data, lastDoc: newLastDoc };
    } catch (error) {
        console.error(`[Firestore] ❌ Failed to fetch paginated ${collectionName}:`, error);
        return { data: [], lastDoc: null };
    }
}

// Helper: Fetch a single collection from Firestore (non-paginated)
async function fetchCollection<T>(collectionName: string): Promise<T[]> {
    try {
        console.log(`[Firestore] 🔍 Fetching collection: ${collectionName}`);
        
        // Wait for auth to be ready before fetching
        await waitForAuthReady();
        
        const db = getFirestoreInstance();
        const collectionRef = collection(db, collectionName);
        
        // OFFLINE FIX: Try cache first, fallback to server
        let snapshot: QuerySnapshot<DocumentData>;
        try {
            console.log(`[Firestore] 📦 Trying cache for ${collectionName}...`);
            snapshot = await getDocsFromCache(collectionRef);
            console.log(`[Firestore] ✅ Cache hit for ${collectionName}: ${snapshot.docs.length} documents`);
        } catch (cacheError) {
            console.log(`[Firestore] 📡 Cache miss, fetching from server for ${collectionName}...`);
            snapshot = await getDocsFromServer(collectionRef);
            console.log(`[Firestore] ✅ Server fetch for ${collectionName}: ${snapshot.docs.length} documents`);
        }
        
        console.log(`[Firestore] ✅ Fetched ${collectionName}: ${snapshot.docs.length} documents`);
        
        const data = snapshot.docs.map(doc => {
            const docData = { id: doc.id, ...doc.data() } as T;
            return docData;
        });
        
        return data;
    } catch (error) {
        console.error(`[Firestore] ❌ Failed to fetch ${collectionName}:`, error);
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
        console.log(`[Firestore] ✅ Write successful: ${collectionName}/${id}`);
    } catch (error) {
        console.error(`[Firestore] ❌ Failed to write to ${collectionName}:`, error);
        throw error; // Re-throw so caller knows it failed
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
export function useSchoolData(collectionsToFetch?: string[]): SchoolDataHook {
    const queryClient = useQueryClient();
    const STUDENTS_PER_PAGE = 100; // Increased to 100 to show full sections in gradebook (was 10)

    // Memoize shouldFetch to prevent excessive re-computation
    const shouldFetch = useCallback((collectionName: string) => {
        // TIER 1 FIX: If collectionsToFetch is an empty array, fetch NOTHING
        // If undefined, fetch everything (backward compatibility)
        if (collectionsToFetch !== undefined && collectionsToFetch.length === 0) {
            return false; // Empty array = fetch nothing
        }
        // If undefined or includes this collection, fetch it
        const result = !collectionsToFetch || collectionsToFetch.includes(collectionName);
        return result;
    }, [collectionsToFetch]);

    // State for paginated students
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [lastStudentDoc, setLastStudentDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMoreStudents, setHasMoreStudents] = useState(true);
    
    // Search cache and state to avoid redundant searches
    const [searchCache, setSearchCache] = useState<Map<string, any>>(new Map());
    const [isSearching, setIsSearching] = useState<boolean>(false);

    // Other collections (including students for now - we'll add pagination later if needed)
    const collectionConfigs = [
        { name: 'students', fetchFn: async () => {
            console.log('[useSchoolData] 🚀 Students fetchFn EXECUTING!');
            try {
                // Fetch initial students with pagination support
                await waitForAuthReady();
                const db = getFirestoreInstance();
                console.log('[Firestore] 🔍 Fetching initial students with limit...');
                
                const studentsCol = collection(db, 'students');
                // Simple query without orderBy to test
                const q = query(studentsCol, limit(STUDENTS_PER_PAGE));
                
                console.log('[Firestore] ⏱️ Calling getDocs...');
                const snapshot = await getDocs(q);
                console.log('[Firestore] ✅ SUCCESS! Fetched', snapshot.docs.length, 'students');
                
                // Save the last document for pagination
                if (snapshot.docs.length > 0) {
                    setLastStudentDoc(snapshot.docs[snapshot.docs.length - 1]);
                    setHasMoreStudents(snapshot.docs.length === STUDENTS_PER_PAGE);
                } else {
                    setHasMoreStudents(false);
                }
                
                const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
                return data;
            } catch (error) {
                console.error('[Firestore] ❌ Students fetch error:', error);
                return [];
            }
        }},
        { name: 'learningAreas', fetchFn: () => fetchCollection<LearningArea>('learningAreas') },
        { name: 'grades', fetchFn: () => fetchCollection<Grade>('grades') },
        { name: 'coreValues', fetchFn: () => fetchCollection<CoreValue>('coreValues') },
        { name: 'coreValueGrades', fetchFn: () => fetchCollection<CoreValueGrade>('coreValueGrades') },
        { name: 'attendanceRecords', fetchFn: () => fetchCollection<AttendanceRecord>('attendanceRecords') },
        { name: 'teachers', fetchFn: () => fetchCollection<Teacher>('teachers') },
        { name: 'parents', fetchFn: () => fetchCollection<Parent>('parents') },
        { name: 'sections', fetchFn: () => fetchCollection<Section>('sections') },
        { name: 'settings', fetchFn: async () => {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            const docRef = doc(db, 'settings', 'default');
            const docSnap = await getDoc(docRef);
            console.log('[Firestore] ✅ Fetched settings:', docSnap.exists());
            return docSnap.exists() ? [docSnap.data() as SchoolSettings] : [];
        }},
        { name: 'substituteAssignments', fetchFn: () => fetchCollection<SubstituteAssignment>('substituteAssignments') },
        { name: 'classSchedules', fetchFn: () => fetchCollection<ClassSchedule>('classSchedules') },
        { name: 'assignments', fetchFn: () => fetchCollection<Assignment>('assignments') },
        { name: 'studentAssignmentGrades', fetchFn: () => fetchCollection<StudentAssignmentGrade>('studentAssignmentGrades') },
        { name: 'lessonPlans', fetchFn: () => fetchCollection<LessonPlan>('lessonPlans') },
        { name: 'announcements', fetchFn: () => fetchCollection<Announcement>('announcements') },
    ];

    const queries = useQueries({
      queries: collectionConfigs
        .filter(config => shouldFetch(config.name))
        .map(config => ({
          queryKey: [config.name, 'v2'], // Cache buster - increment when data structure changes
          queryFn: config.fetchFn,
          enabled: shouldFetch(config.name), // TIER 1 FIX: Only run query if collection should be fetched
          staleTime: Infinity, // Data is fresh until we manually invalidate
          cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes to support optimistic updates
          refetchOnMount: false, // Don't refetch on mount - trust cache
          refetchOnWindowFocus: false, // Don't refetch on window focus
        }))
    });

    // Log query states after they potentially update
    useEffect(() => {
        const queryStates = queries.map((q, index) => ({
            collection: collectionConfigs[index]?.name || 'unknown',
            isLoading: q.isLoading,
            isFetching: q.isFetching,
            isSuccess: q.isSuccess,
            isError: q.isError,
            error: q.error ? String(q.error) : null,
            dataLength: Array.isArray(q.data) ? q.data.length : 'not-array'
        }));
        
        console.log('[useSchoolData] 📊 Queries state update:', queryStates);
        
        // Log any errors
        queryStates.forEach(state => {
            if (state.isError) {
                console.error(`[useSchoolData] ❌ ${state.collection} query error:`, state.error);
            }
        });
    }, [queries]);

    // Extract students query (first one in collectionConfigs)
    const studentsQuery = queries[0];
    const isLoadingStudents = studentsQuery?.isLoading || false;
    const isFetchingStudents = studentsQuery?.isFetching || false;
    const studentsError = studentsQuery?.error as string | null;
    const initialStudentsData = studentsQuery?.data as Student[] | undefined;

    // Update student state when data changes
    useEffect(() => {
        if (initialStudentsData) {
            console.log(`[useSchoolData] ✅ Setting allStudents to ${initialStudentsData.length} items`);
            setAllStudents(initialStudentsData);
            setHasMoreStudents(initialStudentsData.length === STUDENTS_PER_PAGE);
        }
    }, [initialStudentsData, STUDENTS_PER_PAGE]);

    // Fetch more students (pagination)
    const fetchMoreStudents = useCallback(async () => {
        if (!hasMoreStudents || isFetchingStudents || !lastStudentDoc) {
            console.log('[useSchoolData] ⚠️ Cannot fetch more:', { hasMoreStudents, isFetchingStudents, hasLastDoc: !!lastStudentDoc });
            return;
        }
        
        try {
            console.log('[useSchoolData] 📄 Fetching next page of students...');
            await waitForAuthReady();
            const db = getFirestoreInstance();
            
            const studentsCol = collection(db, 'students');
            // Use same ordering as initial query
            const q = query(studentsCol, orderBy('enrollmentDate', 'desc'), startAfter(lastStudentDoc), limit(STUDENTS_PER_PAGE));
            
            const snapshot = await getDocs(q);
            console.log('[useSchoolData] ✅ Fetched', snapshot.docs.length, 'more students');
            
            const newStudents = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Student[];
            
            // Update state
            setAllStudents(prev => [...prev, ...newStudents]);
            
            if (snapshot.docs.length > 0) {
                setLastStudentDoc(snapshot.docs[snapshot.docs.length - 1]);
            }
            
            setHasMoreStudents(snapshot.docs.length === STUDENTS_PER_PAGE);
        } catch (error) {
            console.error('[useSchoolData] ❌ Error fetching more students:', error);
        }
    }, [hasMoreStudents, isFetchingStudents, lastStudentDoc, STUDENTS_PER_PAGE]);

    /**
     * Server-side search function
     * Searches ALL students in Firestore by name, email, or LRN
     * Uses caching to avoid redundant queries
     */
    const searchStudents = useCallback(async (searchQuery: string): Promise<Student[]> => {
        const trimmedQuery = searchQuery.trim().toLowerCase();
        
        // Return all loaded students if query is empty
        if (!trimmedQuery) {
            return allStudents;
        }
        
        // Check cache first
        if (searchCache.has(trimmedQuery)) {
            console.log(`[useSchoolData] 📦 Using cached search results for: "${trimmedQuery}"`);
            return searchCache.get(trimmedQuery)!;
        }
        
        setIsSearching(true);
        console.log(`[useSchoolData] 🔍 Server-side search for: "${trimmedQuery}"`);
        
        try {
            await waitForAuthReady();
            const db = getFirestoreInstance();
            const studentsCol = collection(db, 'students');
            
            // Fetch ALL students for client-side filtering
            // This is acceptable for 7,496 students and provides best search UX
            // Alternative: Use multiple queries with where() for exact field matches
            const snapshot = await getDocs(studentsCol);
            const allStudentsData = snapshot.docs.map((doc: any) => ({ 
                id: doc.id, 
                ...doc.data() 
            })) as Student[];
            
            console.log(`[useSchoolData] ✅ Fetched ${allStudentsData.length} students for search`);
            
            // Client-side fuzzy search across name, email, and LRN
            const results = allStudentsData.filter(student => {
                const name = student.name?.toLowerCase() || '';
                const email = student.email?.toLowerCase() || '';
                const lrn = student.lrn?.toLowerCase() || '';
                
                return name.includes(trimmedQuery) || 
                       email.includes(trimmedQuery) || 
                       lrn.includes(trimmedQuery);
            });
            
            console.log(`[useSchoolData] ✅ Found ${results.length} matching students`);
            
            // Cache the results
            setSearchCache(prev => new Map(prev).set(trimmedQuery, results));
            
            return results;
        } catch (error) {
            console.error('[useSchoolData] ❌ Error searching students:', error);
            return [];
        } finally {
            setIsSearching(false);
        }
    }, [allStudents, searchCache]);

    // Server-side search for Teachers (search ALL teachers, not just paginated)
    const searchTeachers = useCallback(async (searchQuery: string): Promise<Teacher[]> => {
        const trimmedQuery = searchQuery.trim().toLowerCase();
        
        if (!trimmedQuery) {
            return [];
        }
        
        // Check cache first
        const cacheKey = `teachers_${trimmedQuery}`;
        if (searchCache.has(cacheKey)) {
            console.log(`[useSchoolData] 📦 Returning cached teacher search results for: "${trimmedQuery}"`);
            return searchCache.get(cacheKey) as Teacher[];
        }
        
        setIsSearching(true);
        console.log(`[useSchoolData] 🔍 Searching ALL teachers for: "${trimmedQuery}"`);
        
        try {
            const db = getFirestoreInstance();
            // Fetch ALL teachers from Firestore
            const teachersCollection = collection(db, 'teachers');
            const snapshot = await getDocs(teachersCollection);
            
            const allTeachersData: Teacher[] = [];
            snapshot.forEach(doc => {
                allTeachersData.push({ id: doc.id, ...doc.data() } as Teacher);
            });
            
            console.log(`[useSchoolData] 📚 Fetched ${allTeachersData.length} total teachers from Firestore`);
            
            // Client-side fuzzy filter
            const results = allTeachersData.filter(teacher => {
                const name = (teacher.name || '').toLowerCase();
                const email = (teacher.email || '').toLowerCase();
                const contactNumber = (teacher.contactNumber || '').toLowerCase();
                const query = trimmedQuery;
                
                return name.includes(query) || 
                       email.includes(query) || 
                       contactNumber.includes(query);
            });
            
            console.log(`[useSchoolData] ✅ Found ${results.length} teachers matching "${trimmedQuery}"`);
            
            // Cache the results
            setSearchCache(prev => new Map(prev).set(cacheKey, results));
            
            return results;
        } catch (error) {
            console.error('[useSchoolData] ❌ Error searching teachers:', error);
            return [];
        } finally {
            setIsSearching(false);
        }
    }, [searchCache]);

    // Server-side search for Parents (search ALL parents, not just paginated)
    const searchParents = useCallback(async (searchQuery: string): Promise<Parent[]> => {
        const trimmedQuery = searchQuery.trim().toLowerCase();
        
        if (!trimmedQuery) {
            return [];
        }
        
        // Check cache first
        const cacheKey = `parents_${trimmedQuery}`;
        if (searchCache.has(cacheKey)) {
            console.log(`[useSchoolData] 📦 Returning cached parent search results for: "${trimmedQuery}"`);
            return searchCache.get(cacheKey) as Parent[];
        }
        
        setIsSearching(true);
        console.log(`[useSchoolData] 🔍 Searching ALL parents for: "${trimmedQuery}"`);
        
        try {
            const db = getFirestoreInstance();
            // Fetch ALL parents from Firestore
            const parentsCollection = collection(db, 'parents');
            const snapshot = await getDocs(parentsCollection);
            
            const allParentsData: Parent[] = [];
            snapshot.forEach(doc => {
                allParentsData.push({ id: doc.id, ...doc.data() } as Parent);
            });
            
            console.log(`[useSchoolData] 📚 Fetched ${allParentsData.length} total parents from Firestore`);
            
            // Client-side fuzzy filter
            const results = allParentsData.filter(parent => {
                const name = (parent.name || '').toLowerCase();
                const email = (parent.email || '').toLowerCase();
                const query = trimmedQuery;
                
                return name.includes(query) || email.includes(query);
            });
            
            console.log(`[useSchoolData] ✅ Found ${results.length} parents matching "${trimmedQuery}"`);
            
            // Cache the results
            setSearchCache(prev => new Map(prev).set(cacheKey, results));
            
            return results;
        } catch (error) {
            console.error('[useSchoolData] ❌ Error searching parents:', error);
            return [];
        } finally {
            setIsSearching(false);
        }
    }, [searchCache]);

    const loading = queries.some(q => q.isLoading);
    const error = queries.find(q => q.error)?.error as string | null;
    
    // Log which queries are still loading
    useEffect(() => {
        const stillLoading = queries
            .map((q, index) => ({ name: collectionConfigs[index]?.name, isLoading: q.isLoading }))
            .filter(q => q.isLoading);
        
        if (stillLoading.length > 0) {
            console.log('[useSchoolData] ⏳ Still loading:', stillLoading.map(q => q.name));
        }
    }, [loading]);

    const queryResultsMap = useMemo(() => {
        // Don't build map while still loading - return empty to avoid premature empty arrays
        if (loading) {
            return {};
        }

        
        const map = collectionConfigs
            .filter(config => shouldFetch(config.name))
            .reduce((acc, config, index) => {
                const queryResult = queries[index];
                if (queryResult) {
                    acc[config.name] = queryResult.data || [];
                }
                return acc;
            }, {} as Record<string, any>);
        
        console.log('[useSchoolData] ✅ Data loaded - Teachers:', map.teachers?.length, 'Parents:', map.parents?.length, 'Students:', allStudents.length, 'Assignments:', map.assignments?.length, 'Sections:', map.sections?.length);
        return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queries.map(q => q.data).join(','), collectionConfigs, shouldFetch, loading, allStudents.length]);
    
    const refresh = useCallback(() => {
      // Refetch students by triggering the query
      studentsQuery?.refetch();
      // Refetch all other queries
      queries.forEach(q => q.refetch && q.refetch());
    }, [studentsQuery, queries]);

    // Helper to invalidate and refetch a query after mutation
    const invalidate = async (key: QueryKey) => {
        // Use predicate to match keys with version suffix
        await queryClient.invalidateQueries({ 
            predicate: (query) => {
                const queryKey = query.queryKey;
                if (Array.isArray(key) && Array.isArray(queryKey)) {
                    return queryKey[0] === key[0]; // Match first element (collection name)
                }
                return false;
            }
        });
        await queryClient.refetchQueries({ 
            predicate: (query) => {
                const queryKey = query.queryKey;
                if (Array.isArray(key) && Array.isArray(queryKey)) {
                    return queryKey[0] === key[0];
                }
                return false;
            }
        });
    };

    // === CRUD OPERATIONS ===
    // Students
    const addStudent = useCallback(async (student: Omit<Student, 'id' | 'enrollmentDate'>) => {
        const newStudent: Student = {
            ...student,
            id: `s_${Date.now()}`,
            enrollmentDate: new Date().toISOString().split('T')[0],
        };
        
        // Optimistically add to local state so it appears immediately
        setAllStudents(prev => [newStudent, ...prev]); // Add to beginning since we order by date desc
        
        await writeToFirestore('students', newStudent.id, newStudent);
        await invalidate(['students']); // Invalidate the general 'students' key
        await invalidate(['students', 'initial']); // Invalidate the specific initial students query
        return { success: true };
    }, []);

    const updateStudent = useCallback(async (student: Student) => {
        // Optimistically update local state
        setAllStudents(prev => prev.map(s => s.id === student.id ? student : s));
        
        await writeToFirestore('students', student.id, student);
        await invalidate(['students']);
    }, []);

    const deleteStudent = useCallback(async (studentId: string) => {
        // Optimistically remove from local state
        setAllStudents(prev => prev.filter(s => s.id !== studentId));
        
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
        const grades: Grade[] = queryClient.getQueryData(['grades', 'v2']) || [];
        const learningAreas: LearningArea[] = queryClient.getQueryData(['learningAreas', 'v2']) || DEFAULT_LEARNING_AREAS;
        const learningArea = learningAreas.find(la => la.id === learningAreaId);
        
        let existing = grades.find(g => g.studentId === studentId && g.learningAreaId === learningAreaId);
        if (!existing) {
            existing = { id: `grade_${studentId}_${learningAreaId}`, studentId, learningAreaId } as Grade;
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
        
        // Optimistically update cache IMMEDIATELY using updater function to avoid race conditions
        queryClient.setQueryData(['grades', 'v2'], (oldGrades: Grade[] = []) => {
            const existingIndex = oldGrades.findIndex(g => g.studentId === studentId && g.learningAreaId === learningAreaId);
            if (existingIndex >= 0) {
                // Update existing grade
                return oldGrades.map((g, i) => i === existingIndex ? existing! : g);
            } else {
                // Add new grade
                return [...oldGrades, existing!];
            }
        });
        
        // Write to Firestore in background - revert optimistic update on failure
        try {
            await writeToFirestore('grades', existing.id, existing);
            console.log(`✅ SAVED: ${existing.id} → ${quarter.toUpperCase()} = ${value || 'cleared'}`);
        } catch (error) {
            console.error('❌ SAVE FAILED:', existing.id, error);
            // Revert to original grades on failure
            queryClient.setQueryData(['grades', 'v2'], grades);
            throw error; // Re-throw so UI can show error
        }
    }, []);

    // Core Values
    const updateCoreValueGrade = useCallback(async (
        studentId: string, 
        coreValueId: string, 
        quarter: 'q1'|'q2'|'q3'|'q4', 
        behavior: string, 
        value: CoreValueMarking | ''
    ) => {
        const coreValueGrades: CoreValueGrade[] = queryClient.getQueryData(['coreValueGrades', 'v2']) || [];
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
        const attendanceRecords: AttendanceRecord[] = queryClient.getQueryData(['attendanceRecords', 'v2']) || [];
        let existing = attendanceRecords.find(ar => ar.studentId === studentId);
        
        // Optimistically update the cache IMMEDIATELY using updater function to avoid race conditions
        queryClient.setQueryData(['attendanceRecords', 'v2'], (oldRecords: AttendanceRecord[] = []) => {
            const existingRecord = oldRecords.find(ar => ar.studentId === studentId);
            const updatedRecord = existingRecord 
                ? { ...existingRecord, dailyStatus: { ...existingRecord.dailyStatus, [date]: status } }
                : { studentId, dailyStatus: { [date]: status } };
            
            return existingRecord
                ? oldRecords.map(ar => ar.studentId === studentId ? updatedRecord : ar)
                : [...oldRecords, updatedRecord];
        });
        
        // Then write to Firestore using field-level update to prevent data loss
        const db = getFirestoreInstance();
        const docRef = doc(db, 'attendanceRecords', studentId);
        
        try {
            if (existing) {
                // Use updateDoc with field path to update only the specific date
                await updateDoc(docRef, {
                    [`dailyStatus.${date}`]: status,
                    updatedAt: serverTimestamp(),
                    updatedBy: auth.currentUser?.uid || 'anon'
                });
            } else {
                // Create new document if it doesn't exist
                await setDoc(docRef, {
                    studentId,
                    dailyStatus: { [date]: status },
                    updatedAt: serverTimestamp(),
                    updatedBy: auth.currentUser?.uid || 'anon'
                });
            }
            console.log(`[Firestore] ✅ Attendance updated: ${studentId} - ${date} = ${status}`);
        } catch (error) {
            console.error('[Firestore] ❌ Attendance update failed:', error);
            // Rollback optimistic update on error
            queryClient.setQueryData(['attendanceRecords', 'v2'], attendanceRecords);
            throw error;
        }
        
        // No refetch needed - cache is already updated and Firestore write is complete
        // Data is consistent between cache and server
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
        const parents: Parent[] = queryClient.getQueryData(['parents', 'v2']) || [];
        const parent = parents.find(p => p.id === parentId);
        if (parent) {
            const updated = { ...parent, studentIds: [...(parent.studentIds || []), studentId] };
            await writeToFirestore('parents', parentId, updated);
            await invalidate(['parents']);
        }
    }, []);

    const unassignStudentFromParent = useCallback(async (parentId: string, studentId: string) => {
        const parents: Parent[] = queryClient.getQueryData(['parents', 'v2']) || [];
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
        const studentAssignmentGrades: StudentAssignmentGrade[] = queryClient.getQueryData(['studentAssignmentGrades', 'v2']) || [];
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
        const studentAssignmentGrades: StudentAssignmentGrade[] = queryClient.getQueryData(['studentAssignmentGrades', 'v2']) || [];
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
        learningAreas: queryResultsMap.learningAreas ?? [],
        grades: queryResultsMap.grades ?? [],
        coreValues: queryResultsMap.coreValues ?? [],
        coreValueGrades: queryResultsMap.coreValueGrades ?? [],
        attendanceRecords: queryResultsMap.attendanceRecords ?? [],
        teachers: queryResultsMap.teachers ?? [],
        parents: queryResultsMap.parents ?? [],
        sections: queryResultsMap.sections ?? [],
        settings: queryResultsMap.settings?.[0] || MOCK_SETTINGS,
        substituteAssignments: queryResultsMap.substituteAssignments ?? [],
        classSchedules: queryResultsMap.classSchedules ?? [],
        assignments: queryResultsMap.assignments ?? [],
        studentAssignmentGrades: queryResultsMap.studentAssignmentGrades ?? [],
        lessonPlans: queryResultsMap.lessonPlans ?? [],
        announcements: queryResultsMap.announcements ?? [],
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
        // New search exports
        searchStudents,
        searchTeachers,
        searchParents,
        isSearching,
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
    // New search exports
    searchStudents: (query: string) => Promise<Student[]>;
    searchTeachers: (query: string) => Promise<Teacher[]>;
    searchParents: (query: string) => Promise<Parent[]>;
    isSearching: boolean;
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
    },
    // ====== MOTHER TONGUE (MTB-MLE) - Elementary Grades 1-3 ======
    {
        id: 'la_mtb_elem',
        name: 'Mother Tongue',
        credits: 3,
        category: 'core',
        gradeLevel: [1, 2, 3],
        department: 'Language',
        kToTwelveCode: 'MTB-MLE',
        isActive: true,
        order: 0,
        description: 'Mother Tongue-Based Multilingual Education (MTB-MLE) - Grades 1-3'
    },
    // ====== EPP/TLE - Elementary Grades 4-6 ======
    {
        id: 'la_epp_elem',
        name: 'EPP/TLE',
        credits: 2,
        category: 'specialized',
        gradeLevel: [4, 5, 6],
        department: 'Technical Education',
        kToTwelveCode: 'EPP',
        isActive: true,
        order: 8,
        description: 'Edukasyong Pantahanan at Pangkabuhayan for Elementary Grades 4-6'
    },
    // ====== JUNIOR HIGH SCHOOL (Grades 7-10) ======
    {
        id: 'la_filipino_jhs',
        name: 'Filipino',
        credits: 5,
        category: 'core',
        gradeLevel: [7, 8, 9, 10],
        department: 'Language',
        kToTwelveCode: 'FIL-JHS',
        isActive: true,
        order: 1,
        description: 'Filipino for Junior High School'
    },
    {
        id: 'la_english_jhs',
        name: 'English',
        credits: 5,
        category: 'core',
        gradeLevel: [7, 8, 9, 10],
        department: 'Language',
        kToTwelveCode: 'ENG-JHS',
        isActive: true,
        order: 2,
        description: 'English for Junior High School'
    },
    {
        id: 'la_math_jhs',
        name: 'Mathematics',
        credits: 5,
        category: 'core',
        gradeLevel: [7, 8, 9, 10],
        department: 'STEM',
        kToTwelveCode: 'MATH-JHS',
        isActive: true,
        order: 3,
        description: 'Mathematics for Junior High School'
    },
    {
        id: 'la_science_jhs',
        name: 'Science',
        credits: 5,
        category: 'core',
        gradeLevel: [7, 8, 9, 10],
        department: 'STEM',
        kToTwelveCode: 'SCI-JHS',
        isActive: true,
        order: 4,
        description: 'Science for Junior High School'
    },
    {
        id: 'la_ap_jhs',
        name: 'Araling Panlipunan',
        credits: 5,
        category: 'core',
        gradeLevel: [7, 8, 9, 10],
        department: 'Humanities',
        kToTwelveCode: 'AP-JHS',
        isActive: true,
        order: 5,
        description: 'Araling Panlipunan for Junior High School'
    },
    {
        id: 'la_esp_jhs',
        name: 'Edukasyon sa Pagpapakatao',
        credits: 5,
        category: 'core',
        gradeLevel: [7, 8, 9, 10],
        department: 'Values Education',
        kToTwelveCode: 'ESP-JHS',
        isActive: true,
        order: 6,
        description: 'Values Education for Junior High School'
    },
    {
        id: 'la_mapeh_jhs',
        name: 'MAPEH',
        credits: 5,
        isComposite: true,
        subSubjects: ['Music', 'Arts', 'PE', 'Health'],
        category: 'specialized',
        gradeLevel: [7, 8, 9, 10],
        department: 'Arts & Sports',
        kToTwelveCode: 'MAPEH-JHS',
        isActive: true,
        order: 7,
        description: 'Music, Arts, Physical Education, Health for Junior High School'
    },
    {
        id: 'la_tle_jhs',
        name: 'Technology and Livelihood Education',
        credits: 5,
        category: 'specialized',
        gradeLevel: [7, 8, 9, 10],
        department: 'Technical Education',
        kToTwelveCode: 'TLE-JHS',
        isActive: true,
        order: 8,
        description: 'TLE for Junior High School'
    },
    // ====== SENIOR HIGH SCHOOL - CORE SUBJECTS (All Tracks) ======
    {
        id: 'la_oral_comm_shs',
        name: 'Oral Communication',
        credits: 3,
        category: 'core',
        gradeLevel: [11],
        department: 'Language',
        kToTwelveCode: 'ORALCOM',
        semesterBased: true,
        semester: 1,
        isActive: true,
        order: 1
    },
    {
        id: 'la_reading_writing_shs',
        name: 'Reading and Writing',
        credits: 3,
        category: 'core',
        gradeLevel: [11],
        department: 'Language',
        kToTwelveCode: 'READWRIT',
        semesterBased: true,
        semester: 2,
        isActive: true,
        order: 2
    },
    {
        id: 'la_gen_math_shs',
        name: 'General Mathematics',
        credits: 3,
        category: 'core',
        gradeLevel: [11],
        department: 'STEM',
        kToTwelveCode: 'GENMATH',
        semesterBased: true,
        semester: 1,
        isActive: true,
        order: 3
    },
    {
        id: 'la_stats_prob_shs',
        name: 'Statistics and Probability',
        credits: 3,
        category: 'core',
        gradeLevel: [11],
        department: 'STEM',
        kToTwelveCode: 'STATPROB',
        semesterBased: true,
        semester: 2,
        isActive: true,
        order: 4
    },
    {
        id: 'la_earth_science_shs',
        name: 'Earth Science',
        credits: 3,
        category: 'core',
        gradeLevel: [11],
        department: 'STEM',
        kToTwelveCode: 'EARTHSCI',
        semesterBased: true,
        semester: 1,
        isActive: true,
        order: 5
    },
    {
        id: 'la_physical_science_shs',
        name: 'Physical Science',
        credits: 3,
        category: 'core',
        gradeLevel: [11],
        department: 'STEM',
        kToTwelveCode: 'PHYSCI',
        semesterBased: true,
        semester: 2,
        isActive: true,
        order: 6
    },
    // ====== SENIOR HIGH SCHOOL - STEM TRACK ======
    {
        id: 'la_precalc_stem',
        name: 'Pre-Calculus',
        credits: 3,
        category: 'specialized',
        gradeLevel: [11],
        department: 'STEM',
        kToTwelveCode: 'PRECALC',
        trackRequired: ['STEM'],
        semesterBased: true,
        isActive: true,
        order: 1
    },
    {
        id: 'la_basic_calc_stem',
        name: 'Basic Calculus',
        credits: 3,
        category: 'specialized',
        gradeLevel: [11, 12],
        department: 'STEM',
        kToTwelveCode: 'BASICCALC',
        trackRequired: ['STEM'],
        semesterBased: true,
        isActive: true,
        order: 2
    },
    {
        id: 'la_gen_bio_stem',
        name: 'General Biology',
        credits: 3,
        category: 'specialized',
        gradeLevel: [11, 12],
        department: 'STEM',
        kToTwelveCode: 'GENBIO',
        trackRequired: ['STEM'],
        semesterBased: true,
        isActive: true,
        order: 3
    },
    {
        id: 'la_gen_chem_stem',
        name: 'General Chemistry',
        credits: 3,
        category: 'specialized',
        gradeLevel: [11, 12],
        department: 'STEM',
        kToTwelveCode: 'GENCHEM',
        trackRequired: ['STEM'],
        semesterBased: true,
        isActive: true,
        order: 4
    },
    {
        id: 'la_gen_physics_stem',
        name: 'General Physics',
        credits: 3,
        category: 'specialized',
        gradeLevel: [12],
        department: 'STEM',
        kToTwelveCode: 'GENPHYS',
        trackRequired: ['STEM'],
        semesterBased: true,
        isActive: true,
        order: 5
    },
    // ====== SENIOR HIGH SCHOOL - ABM TRACK ======
    {
        id: 'la_fund_abm',
        name: 'Fundamentals of Accountancy, Business and Management',
        credits: 3,
        category: 'specialized',
        gradeLevel: [11, 12],
        department: 'Business',
        kToTwelveCode: 'FUNDABM',
        trackRequired: ['ABM'],
        semesterBased: true,
        isActive: true,
        order: 1
    },
    {
        id: 'la_bus_math_abm',
        name: 'Business Mathematics',
        credits: 3,
        category: 'specialized',
        gradeLevel: [11],
        department: 'Business',
        kToTwelveCode: 'BUSMATH',
        trackRequired: ['ABM'],
        semesterBased: true,
        isActive: true,
        order: 2
    },
    {
        id: 'la_bus_finance_abm',
        name: 'Business Finance',
        credits: 3,
        category: 'specialized',
        gradeLevel: [12],
        department: 'Business',
        kToTwelveCode: 'BUSFIN',
        trackRequired: ['ABM'],
        semesterBased: true,
        isActive: true,
        order: 3
    },
    {
        id: 'la_org_mgmt_abm',
        name: 'Organization and Management',
        credits: 3,
        category: 'specialized',
        gradeLevel: [11],
        department: 'Business',
        kToTwelveCode: 'ORGMGMT',
        trackRequired: ['ABM'],
        semesterBased: true,
        isActive: true,
        order: 4
    },
    {
        id: 'la_prin_marketing_abm',
        name: 'Principles of Marketing',
        credits: 3,
        category: 'specialized',
        gradeLevel: [12],
        department: 'Business',
        kToTwelveCode: 'PRINMKT',
        trackRequired: ['ABM'],
        semesterBased: true,
        isActive: true,
        order: 5
    },
    // ====== SENIOR HIGH SCHOOL - HUMSS TRACK ======
    {
        id: 'la_creative_writing_humss',
        name: 'Creative Writing',
        credits: 3,
        category: 'specialized',
        gradeLevel: [11],
        department: 'Humanities',
        kToTwelveCode: 'CREWRIT',
        trackRequired: ['HUMSS'],
        semesterBased: true,
        isActive: true,
        order: 1
    },
    {
        id: 'la_creative_nonfic_humss',
        name: 'Creative Nonfiction',
        credits: 3,
        category: 'specialized',
        gradeLevel: [12],
        department: 'Humanities',
        kToTwelveCode: 'CRENON',
        trackRequired: ['HUMSS'],
        semesterBased: true,
        isActive: true,
        order: 2
    },
    {
        id: 'la_world_religions_humss',
        name: 'World Religions and Belief Systems',
        credits: 3,
        category: 'specialized',
        gradeLevel: [11],
        department: 'Humanities',
        kToTwelveCode: 'WORLDREL',
        trackRequired: ['HUMSS'],
        semesterBased: true,
        isActive: true,
        order: 3
    },
    {
        id: 'la_phil_politics_humss',
        name: 'Philippine Politics and Governance',
        credits: 3,
        category: 'specialized',
        gradeLevel: [11],
        department: 'Humanities',
        kToTwelveCode: 'PHILPOL',
        trackRequired: ['HUMSS'],
        semesterBased: true,
        isActive: true,
        order: 4
    },
    {
        id: 'la_trends_networks_humss',
        name: 'Trends, Networks and Critical Thinking',
        credits: 3,
        category: 'specialized',
        gradeLevel: [12],
        department: 'Humanities',
        kToTwelveCode: 'TRENDS',
        trackRequired: ['HUMSS'],
        semesterBased: true,
        isActive: true,
        order: 5
    },
    // ====== SENIOR HIGH SCHOOL - GAS TRACK ======
    {
        id: 'la_humanities_gas',
        name: 'Humanities 1',
        credits: 3,
        category: 'elective',
        gradeLevel: [11],
        department: 'Humanities',
        kToTwelveCode: 'HUM1',
        trackRequired: ['GAS'],
        semesterBased: true,
        isActive: true,
        order: 1
    },
    {
        id: 'la_social_science_gas',
        name: 'Social Science 1',
        credits: 3,
        category: 'elective',
        gradeLevel: [11],
        department: 'Humanities',
        kToTwelveCode: 'SOCSCI1',
        trackRequired: ['GAS'],
        semesterBased: true,
        isActive: true,
        order: 2
    },
    {
        id: 'la_applied_subjects_gas',
        name: 'Applied Subjects',
        credits: 3,
        category: 'elective',
        gradeLevel: [11, 12],
        department: 'Applied',
        kToTwelveCode: 'APPSUB',
        trackRequired: ['GAS'],
        semesterBased: true,
        isActive: true,
        order: 3
    }
];
