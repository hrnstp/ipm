import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

interface UseDataFetchingOptions<T> {
  // Query builder function
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>;
  // Dependencies array for useEffect
  dependencies?: any[];
  // Transform data after fetching
  transform?: (data: T) => T;
  // Should fetch on mount
  fetchOnMount?: boolean;
  // Error handler
  onError?: (error: Error) => void;
}

interface UseDataFetchingReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for data fetching with loading and error states
 * Eliminates code duplication across components
 *
 * @example
 * ```typescript
 * const { data: solutions, loading, error, refetch } = useDataFetching({
 *   queryFn: async () => supabase.from('smart_solutions').select('*'),
 *   dependencies: [filter],
 * });
 * ```
 */
export function useDataFetching<T>({
  queryFn,
  dependencies = [],
  transform,
  fetchOnMount = true,
  onError,
}: UseDataFetchingOptions<T>): UseDataFetchingReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(fetchOnMount);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: fetchedData, error: fetchError } = await queryFn();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const finalData = transform && fetchedData ? transform(fetchedData) : fetchedData;
      setData(finalData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);

      if (onError) {
        onError(error);
      } else {
        console.error('Data fetching error:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [queryFn, transform, onError]);

  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
