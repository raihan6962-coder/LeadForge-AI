import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(path: string, fallback: T, deps: unknown[] = []) {
  const [state, setState] = useState<UseApiState<T>>({ data: null, loading: true, error: null });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.get<T>(path);
      setState({ data, loading: false, error: null });
    } catch {
      // Fall back to provided mock data when API is unavailable
      setState({ data: fallback, loading: false, error: null });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, JSON.stringify(fallback), ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

export function useApiMutation<TInput, TOutput>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (path: string, data?: TInput, method = 'POST'): Promise<TOutput | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = method === 'POST'
        ? await api.post<TOutput>(path, data)
        : await api.put<TOutput>(path, data);
      setLoading(false);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      setLoading(false);
      return null;
    }
  }, []);

  return { mutate, loading, error };
}
