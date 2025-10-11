import type { Student, LearningArea, Grade, CoreValue, CoreValueGrade, AttendanceRecord, Teacher, Section, SchoolSettings, SubstituteAssignment, ClassSchedule, Assignment, StudentAssignmentGrade, LessonPlan, Parent, Announcement } from '../../types';

const DB_NAME = 'EduSyncDB';
const DB_VERSION = 1;

// FIX: Export StoreName to make it accessible in other modules.
export type StoreName = 'students' | 'learningAreas' | 'grades' | 'coreValues' | 'coreValueGrades' | 'attendanceRecords' | 'teachers' | 'parents' | 'sections' | 'settings' | 'substituteAssignments' | 'classSchedules' | 'assignments' | 'studentAssignmentGrades' | 'lessonPlans' | 'announcements';

const STORES: StoreName[] = [
    'students', 'learningAreas', 'grades', 'coreValues', 'coreValueGrades', 'attendanceRecords',
    'teachers', 'parents', 'sections', 'settings', 'substituteAssignments', 'classSchedules',
    'assignments', 'studentAssignmentGrades', 'lessonPlans', 'announcements'
];

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
    if (dbPromise) {
        return dbPromise;
    }
    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const storeConfig: Record<StoreName, IDBObjectStoreParameters> = {
                students: { keyPath: 'id' }, learningAreas: { keyPath: 'id' }, grades: { keyPath: 'id' },
                coreValues: { keyPath: 'id' }, coreValueGrades: { keyPath: 'id' },
                attendanceRecords: { keyPath: 'studentId' },
                teachers: { keyPath: 'id' }, parents: { keyPath: 'id' }, sections: { keyPath: 'id' },
                settings: { keyPath: 'schoolName' },
                substituteAssignments: { keyPath: 'id' }, classSchedules: { keyPath: 'id' },
                assignments: { keyPath: 'id' },
                studentAssignmentGrades: { keyPath: ['assignmentId', 'studentId'] },
                lessonPlans: { keyPath: 'id' }, announcements: { keyPath: 'id' },
            };

            STORES.forEach(storeName => {
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, storeConfig[storeName]);
                }
            });
        };
    });
    return dbPromise;
};

export const get = async <T>(storeName: StoreName, key: IDBValidKey): Promise<T | undefined> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getAll = async <T>(storeName: StoreName): Promise<T[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const put = async <T>(storeName: StoreName, item: T): Promise<IDBValidKey> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const add = async <T>(storeName: StoreName, item: T): Promise<IDBValidKey> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(item);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const remove = async (storeName: StoreName, key: IDBValidKey): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const bulkPut = async <T>(storeName: StoreName, items: T[]): Promise<void> => {
    if(items.length === 0) return Promise.resolve();
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    items.forEach(item => store.put(item));
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const count = async (storeName: StoreName): Promise<number> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};