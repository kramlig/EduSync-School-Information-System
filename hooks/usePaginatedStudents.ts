/**
 * Custom Hook for Paginated Student Loading
 * Optimized for large datasets (7K+ records)
 * FIXED: Proper dependency management to prevent infinite loops
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import { getPaginatedCollection, getCollectionCount, PaginatedResult } from '../src/services/paginationService';
import type { Student } from '../types';

interface UsePaginatedStudentsOptions {
  pageSize?: number;
  searchQuery?: string;
  sectionId?: string;
  enabled?: boolean; // Only load when enabled (for role-based access)
}

interface UsePaginatedStudentsReturn {
  students: Student[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  loadNextPage: () => Promise<void>;
  loadPrevPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  refreshStudents: () => Promise<void>;
}

export function usePaginatedStudents(
  options: UsePaginatedStudentsOptions = {}
): UsePaginatedStudentsReturn {
  const {
    pageSize = 100,
    searchQuery = '',
    sectionId,
    enabled = true
  } = options;

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageHistory, setPageHistory] = useState<(DocumentSnapshot | null)[]>([null]);
  
  // Use refs to track if initial load has happened
  const initialLoadDone = useRef(false);
  const lastSearchQuery = useRef(searchQuery);
  const lastSectionId = useRef(sectionId);

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  // Load total count - STABLE with all dependencies
  const loadTotalCount = useCallback(async () => {
    if (!enabled) return; // Exit early if disabled

    try {
      const count = await getCollectionCount(
        'students',
        searchQuery.trim() ? 'name' : undefined,
        searchQuery.trim() || undefined
      );
      setTotalCount(count);
    } catch (err) {
      // console.warn('[usePaginatedStudents] Failed to load count:', err);
      setTotalCount(0);
    }
  }, [enabled, searchQuery]); // All dependencies included

  // Load students with pagination - STABLE with all dependencies
  const loadStudents = useCallback(async (
    pageNumber: number,
    lastDoc: DocumentSnapshot | null = null
  ) => {
    if (!enabled) {
      return; // Exit early if disabled - don't even clear students
    }

    setLoading(true);
    setError(null);

    try {
      // Build pagination params
      const params: any = {
        pageSize,
        orderByField: 'name',
        orderDirection: 'asc',
        lastDoc
      };

      // Add search if provided
      if (searchQuery.trim()) {
        params.searchField = 'name';
        params.searchValue = searchQuery.trim();
      }

      // Add section filter if provided
      // Note: Firestore limitations - can't combine where + orderBy on different fields
      // So section filtering will need to be done client-side or with composite index
      
      const result: PaginatedResult<Student> = await getPaginatedCollection<Student>(
        'students',
        params
      );

      // Filter by section if needed (client-side for now)
      let filteredStudents = result.data;
      if (sectionId) {
        filteredStudents = filteredStudents.filter((s: Student) => s.sectionId === sectionId);
      }

      setStudents(filteredStudents);
      setHasMore(result.hasMore);
      setCurrentPage(pageNumber);

      // Update page history for backward navigation
      if (result.lastDoc && pageNumber > pageHistory.length - 1) {
        setPageHistory(prev => [...prev, result.lastDoc]);
      }

    } catch (err: any) {
      // console.error('[usePaginatedStudents] Error loading students:', err);
      setError(err.message || 'Failed to load students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, pageSize, searchQuery, sectionId, pageHistory.length]); // All dependencies included

  // Initial load and search change detection
  useEffect(() => {
    // CRITICAL: Early return if disabled, don't even check anything else
    if (!enabled) {
      return;
    }

    // Check if search or section changed
    const searchChanged = lastSearchQuery.current !== searchQuery;
    const sectionChanged = lastSectionId.current !== sectionId;

    if (!initialLoadDone.current || searchChanged || sectionChanged) {
      // Reset page history when search/section changes
      if (searchChanged || sectionChanged) {
        setPageHistory([null]);
        setCurrentPage(1);
      }

      // Update refs
      lastSearchQuery.current = searchQuery;
      lastSectionId.current = sectionId;
      initialLoadDone.current = true;

      // Load data
      loadTotalCount();
      loadStudents(1, null);
    }
  }, [enabled, searchQuery, sectionId, loadStudents, loadTotalCount]);

  // Navigation functions - NOW STABLE
  const loadNextPage = useCallback(async () => {
    if (!hasMore || loading) return;

    const lastDoc = pageHistory[currentPage] || null;
    await loadStudents(currentPage + 1, lastDoc);
  }, [hasMore, loading, pageHistory, currentPage, loadStudents]);

  const loadPrevPage = useCallback(async () => {
    if (currentPage <= 1 || loading) return;

    const lastDoc = pageHistory[currentPage - 2] || null;
    await loadStudents(currentPage - 1, lastDoc);
  }, [currentPage, loading, pageHistory, loadStudents]);

  const goToPage = useCallback(async (page: number) => {
    if (page < 1 || page > totalPages || loading) return;
    if (page === currentPage) return;

    // For now, can only navigate forward/backward one page at a time
    // due to cursor-based pagination limitations
    if (page === currentPage + 1) {
      await loadNextPage();
    } else if (page === currentPage - 1) {
      await loadPrevPage();
    } else {
      // Jump to arbitrary page - need to reset and paginate from start
      // This is less efficient but necessary for page jumping
      setPageHistory([null]);
      let cursor: DocumentSnapshot | null = null;
      
      for (let i = 1; i < page; i++) {
        const result: PaginatedResult<Student> = await getPaginatedCollection<Student>('students', {
          pageSize,
          orderByField: 'name',
          orderDirection: 'asc',
          lastDoc: cursor
        });
        cursor = result.lastDoc;
      }

      await loadStudents(page, cursor);
    }
  }, [totalPages, loading, currentPage, loadNextPage, loadPrevPage, loadStudents, pageSize]);

  const refreshStudents = useCallback(async () => {
    setPageHistory([null]);
    initialLoadDone.current = false; // Force reload
    await loadTotalCount();
    await loadStudents(1, null);
  }, [loadStudents, loadTotalCount]);

  return {
    students,
    loading,
    error,
    hasMore,
    totalCount,
    currentPage,
    totalPages,
    loadNextPage,
    loadPrevPage,
    goToPage,
    refreshStudents
  };
}
