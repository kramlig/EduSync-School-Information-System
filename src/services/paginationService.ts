/**
 * Firestore Pagination Service
 * Provides efficient pagination for large collections (7K+ records)
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs,
  DocumentSnapshot,
  QueryConstraint,
  getCountFromServer
} from 'firebase/firestore';
import { getFirestoreInstance } from './firestoreService';

export interface PaginationParams {
  pageSize?: number;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  searchField?: string;
  searchValue?: string;
  lastDoc?: DocumentSnapshot | null;
}

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
  totalCount?: number;
}

/**
 * Fetch paginated data from Firestore collection
 */
export async function getPaginatedCollection<T>(
  collectionName: string,
  params: PaginationParams = {}
): Promise<PaginatedResult<T>> {
  const {
    pageSize = 100,
    orderByField = 'name',
    orderDirection = 'asc',
    searchField,
    searchValue,
    lastDoc = null
  } = params;

  const db = getFirestoreInstance();
  const collectionRef = collection(db, collectionName);

  // Build query constraints
  const constraints: QueryConstraint[] = [];

  // Add search filter if provided (prefix search)
  if (searchField && searchValue) {
    const searchTerm = searchValue.trim();
    if (searchTerm) {
      // Firestore prefix search: field >= value AND field <= value + '\uf8ff'
      constraints.push(where(searchField, '>=', searchTerm));
      constraints.push(where(searchField, '<=', searchTerm + '\uf8ff'));
    }
  }

  // Add ordering
  constraints.push(orderBy(orderByField, orderDirection));

  // Add pagination cursor
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  // Add limit (fetch one extra to check if there's more)
  constraints.push(limit(pageSize + 1));

  // Execute query
  const q = query(collectionRef, ...constraints);
  const snapshot = await getDocs(q);

  // Check if there are more results
  const hasMore = snapshot.docs.length > pageSize;
  const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;

  // Map documents to data
  const data = docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as T));

  // Get last document for next page
  const lastDocument = docs.length > 0 ? docs[docs.length - 1] : null;

  return {
    data,
    lastDoc: lastDocument,
    hasMore
  };
}

/**
 * Get total count of documents in a collection
 * (Efficient - doesn't download documents)
 */
export async function getCollectionCount(
  collectionName: string,
  searchField?: string,
  searchValue?: string
): Promise<number> {
  const db = getFirestoreInstance();
  const collectionRef = collection(db, collectionName);

  const constraints: QueryConstraint[] = [];

  // Add search filter if provided
  if (searchField && searchValue) {
    const searchTerm = searchValue.trim();
    if (searchTerm) {
      constraints.push(where(searchField, '>=', searchTerm));
      constraints.push(where(searchField, '<=', searchTerm + '\uf8ff'));
    }
  }

  const q = constraints.length > 0 
    ? query(collectionRef, ...constraints)
    : collectionRef;

  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

/**
 * Search students by name (prefix search)
 */
export async function searchStudents(
  searchTerm: string,
  pageSize: number = 50
): Promise<PaginatedResult<any>> {
  return getPaginatedCollection('students', {
    pageSize,
    orderByField: 'name',
    orderDirection: 'asc',
    searchField: 'name',
    searchValue: searchTerm
  });
}

/**
 * Get students for a specific section
 */
export async function getStudentsBySection(
  sectionId: string,
  pageSize: number = 100,
  lastDoc: DocumentSnapshot | null = null
): Promise<PaginatedResult<any>> {
  const db = getFirestoreInstance();
  const collectionRef = collection(db, 'students');

  const constraints: QueryConstraint[] = [
    where('sectionId', '==', sectionId),
    orderBy('name', 'asc')
  ];

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  constraints.push(limit(pageSize + 1));

  const q = query(collectionRef, ...constraints);
  const snapshot = await getDocs(q);

  const hasMore = snapshot.docs.length > pageSize;
  const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;

  const data = docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  const lastDocument = docs.length > 0 ? docs[docs.length - 1] : null;

  return {
    data,
    lastDoc: lastDocument,
    hasMore
  };
}
