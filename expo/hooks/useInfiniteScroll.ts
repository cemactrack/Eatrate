import { useState, useCallback, useRef, useEffect } from 'react';
import { APP_CONFIG } from '@/constants/app-config';

interface InfiniteQueryOptions<T> {
  queryKey: string[];
  queryFn: (cursor?: string) => Promise<{ data: T[]; nextCursor?: string }>;
  limit?: number;
  enabled?: boolean;
  staleTime?: number;
}

export function useInfiniteScroll<T>({
  queryKey,
  queryFn,
  limit = 10,
  enabled = true,
  staleTime = APP_CONFIG.api.staleTime,
}: InfiniteQueryOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  
  const lastFetchRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (cursor?: string, isLoadMore = false) => {
    if (!enabled) return;
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      const sanitizedCursor = cursor?.trim();
      const result = await queryFn(sanitizedCursor);
      
      if (isLoadMore) {
        setData(prev => [...prev, ...result.data]);
      } else {
        setData(result.data);
      }
      
      setNextCursor(result.nextCursor);
      setHasMore(!!result.nextCursor);
      lastFetchRef.current = Date.now();
      
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
        console.error(`[useInfiniteScroll] Error fetching ${queryKey.join('.')}:`, err);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [enabled, queryFn, queryKey]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !nextCursor) return;
    await fetchData(nextCursor, true);
  }, [hasMore, isLoadingMore, nextCursor, fetchData]);

  const refresh = useCallback(async () => {
    setNextCursor(undefined);
    await fetchData();
  }, [fetchData]);

  const reset = useCallback(() => {
    setData([]);
    setNextCursor(undefined);
    setHasMore(true);
    setError(null);
  }, []);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, fetchData]);

  return {
    data,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    reset,
  };
}