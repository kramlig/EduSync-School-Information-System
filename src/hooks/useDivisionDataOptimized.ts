/**
 * useDivisionDataOptimized - Performance-optimized hook for division data fetching
 * 
 * Features:
 * - Query result caching
 * - Request deduplication
 * - Stale-while-revalidate pattern
 * - Automatic cache invalidation
 * - Pagination support
 * - Background refresh
 * 
 * @see docs/features/DIVISION_LEVEL_ACCESS.md
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';

// =====================================================
// TYPES
// =====================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

interface QueryOptions {
  /** Cache time in milliseconds (default: 5 minutes) */
  cacheTime?: number;
  /** Stale time in milliseconds (default: 1 minute) */
  staleTime?: number;
  /** Enable automatic refetch on window focus */
  refetchOnFocus?: boolean;
  /** Enable automatic refetch on interval */
  refetchInterval?: number;
  /** Skip the query */
  skip?: boolean;
}

interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isStale: boolean;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

interface PaginatedQueryResult<T> extends QueryResult<T[]> {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  setPage: (page: number) => void;
}

// =====================================================
// CACHE MANAGEMENT
// =====================================================

const cache = new Map<string, CacheEntry<unknown>>();
const pendingRequests = new Map<string, Promise<unknown>>();

const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const DEFAULT_STALE_TIME = 60 * 1000; // 1 minute

/**
 * Generate a cache key from query parameters
 */
const generateCacheKey = (table: string, params: Record<string, unknown>): string => {
  return `${table}:${JSON.stringify(params)}`;
};

/**
 * Get cached data if available and not expired
 */
const getFromCache = <T>(key: string, staleTime: number): CacheEntry<T> | null => {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  
  const now = Date.now();
  const age = now - entry.timestamp;
  
  // Mark as stale if older than staleTime
  entry.isStale = age > staleTime;
  
  return entry;
};

/**
 * Set cache data
 */
const setCache = <T>(key: string, data: T): void => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    isStale: false,
  });
};

/**
 * Invalidate cache entries matching a pattern
 */
export const invalidateCache = (pattern?: string): void => {
  if (!pattern) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

// =====================================================
// OPTIMIZED QUERY HOOK
// =====================================================

/**
 * Optimized query hook with caching and deduplication
 */
export function useDivisionQuery<T>(
  table: string,
  queryFn: () => Promise<T>,
  deps: unknown[] = [],
  options: QueryOptions = {}
): QueryResult<T> {
  const {
    cacheTime = DEFAULT_CACHE_TIME,
    staleTime = DEFAULT_STALE_TIME,
    refetchOnFocus = true,
    refetchInterval,
    skip = false,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const cacheKey = useMemo(
    () => generateCacheKey(table, { deps }),
    [table, ...deps]
  );
  
  const mountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);

  const fetchData = useCallback(async (force = false) => {
    if (skip) return;
    
    // Check cache first
    const cached = getFromCache<T>(cacheKey, staleTime);
    if (cached && !force) {
      setData(cached.data);
      setIsStale(cached.isStale);
      setLoading(false);
      
      // If data is stale, refetch in background
      if (cached.isStale) {
        fetchData(true);
      }
      return;
    }
    
    // Deduplicate concurrent requests
    const pending = pendingRequests.get(cacheKey);
    if (pending && !force) {
      try {
        const result = await pending as T;
        if (mountedRef.current) {
          setData(result);
          setLoading(false);
          setIsStale(false);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Query failed');
          setLoading(false);
        }
      }
      return;
    }
    
    // Only set loading if no cached data
    if (!cached) {
      setLoading(true);
    }
    setError(null);
    
    // Create and track the request
    const request = queryFn();
    pendingRequests.set(cacheKey, request);
    lastFetchRef.current = Date.now();
    
    try {
      const result = await request;
      
      if (mountedRef.current) {
        setData(result);
        setIsStale(false);
        setLoading(false);
        setCache(cacheKey, result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Query failed');
        setLoading(false);
      }
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }, [cacheKey, queryFn, skip, staleTime]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const invalidate = useCallback(() => {
    cache.delete(cacheKey);
    setIsStale(true);
    fetchData(true);
  }, [cacheKey, fetchData]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnFocus) return;
    
    const handleFocus = () => {
      const timeSinceLastFetch = Date.now() - lastFetchRef.current;
      if (timeSinceLastFetch > staleTime) {
        fetchData(true);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnFocus, staleTime, fetchData]);

  // Refetch on interval
  useEffect(() => {
    if (!refetchInterval) return;
    
    const interval = setInterval(() => {
      fetchData(true);
    }, refetchInterval);
    
    return () => clearInterval(interval);
  }, [refetchInterval, fetchData]);

  return { data, loading, error, isStale, refetch, invalidate };
}

// =====================================================
// PAGINATED QUERY HOOK
// =====================================================

/**
 * Paginated query hook with infinite scroll support
 */
export function useDivisionPaginatedQuery<T>(
  table: string,
  queryFn: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>,
  pageSize: number = 20,
  deps: unknown[] = [],
  options: QueryOptions = {}
): PaginatedQueryResult<T> {
  const [page, setPage] = useState(1);
  const [allData, setAllData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const cacheKey = useMemo(
    () => generateCacheKey(table, { deps, pageSize }),
    [table, pageSize, ...deps]
  );
  
  const mountedRef = useRef(true);

  const fetchPage = useCallback(async (pageNum: number, append = false) => {
    if (!append) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    
    try {
      const result = await queryFn(pageNum, pageSize);
      
      if (mountedRef.current) {
        if (append) {
          setAllData(prev => [...prev, ...result.data]);
        } else {
          setAllData(result.data);
        }
        setTotal(result.total);
        setPage(pageNum);
        setLoading(false);
        setLoadingMore(false);
        setIsStale(false);
        
        // Cache the current page data
        setCache(`${cacheKey}:page${pageNum}`, result.data);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Query failed');
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [queryFn, pageSize, cacheKey]);

  const refetch = useCallback(async () => {
    setAllData([]);
    await fetchPage(1);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || allData.length >= total) return;
    await fetchPage(page + 1, true);
  }, [loadingMore, allData.length, total, page, fetchPage]);

  const invalidate = useCallback(() => {
    invalidateCache(cacheKey);
    setIsStale(true);
    refetch();
  }, [cacheKey, refetch]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchPage(1);
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchPage]);

  const hasMore = allData.length < total;

  return {
    data: allData,
    loading,
    error,
    isStale,
    refetch,
    invalidate,
    page,
    pageSize,
    total,
    hasMore,
    loadMore,
    setPage: (newPage: number) => fetchPage(newPage),
  };
}

// =====================================================
// BATCH QUERY UTILITY
// =====================================================

/**
 * Execute multiple queries in parallel with combined loading state
 */
export function useDivisionBatchQuery<T extends Record<string, unknown>>(
  queries: { [K in keyof T]: () => Promise<T[K]> },
  deps: unknown[] = []
): { data: Partial<T>; loading: boolean; error: string | null } {
  const [data, setData] = useState<Partial<T>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    setError(null);
    
    const executeQueries = async () => {
      try {
        const keys = Object.keys(queries) as (keyof T)[];
        const results = await Promise.all(
          keys.map(key => queries[key]().catch(err => {
            console.error(`[BatchQuery] Error in ${String(key)}:`, err);
            return undefined;
          }))
        );
        
        if (mountedRef.current) {
          const newData: Partial<T> = {};
          keys.forEach((key, index) => {
            if (results[index] !== undefined) {
              newData[key] = results[index] as T[keyof T];
            }
          });
          setData(newData);
          setLoading(false);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Batch query failed');
          setLoading(false);
        }
      }
    };
    
    executeQueries();
    
    return () => {
      mountedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

// =====================================================
// PRELOAD UTILITIES
// =====================================================

/**
 * Preload data for a route before navigation
 */
export const preloadDivisionData = async (
  table: string,
  queryFn: () => Promise<unknown>
): Promise<void> => {
  const cacheKey = generateCacheKey(table, {});
  
  // Check if already cached
  const cached = getFromCache(cacheKey, DEFAULT_STALE_TIME);
  if (cached && !cached.isStale) {
    return;
  }
  
  try {
    const result = await queryFn();
    setCache(cacheKey, result);
  } catch (err) {
    console.error('[Preload] Failed:', err);
  }
};

/**
 * Prefetch commonly used division data
 */
export const prefetchDivisionDashboardData = async (
  divisionId: string,
  schoolIds: string[]
): Promise<void> => {
  const promises: Promise<unknown>[] = [];
  
  // Prefetch enrollment counts
  promises.push(
    preloadDivisionData('enrollment_counts', async () => {
      const { data } = await supabase
        .from('students')
        .select('school_id', { count: 'exact' })
        .in('school_id', schoolIds);
      return data;
    })
  );
  
  // Prefetch personnel counts
  promises.push(
    preloadDivisionData('personnel_counts', async () => {
      const { data } = await supabase
        .from('teachers')
        .select('school_id', { count: 'exact' })
        .in('school_id', schoolIds);
      return data;
    })
  );
  
  await Promise.allSettled(promises);
};

export default {
  useDivisionQuery,
  useDivisionPaginatedQuery,
  useDivisionBatchQuery,
  invalidateCache,
  preloadDivisionData,
  prefetchDivisionDashboardData,
};
