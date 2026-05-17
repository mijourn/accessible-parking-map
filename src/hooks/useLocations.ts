import { useEffect, useState } from 'react';
import type { LocationsSnapshot } from '../types/space.ts';

export interface UseLocationsResult {
  data: LocationsSnapshot | null;
  loading: boolean;
  error: string | null;
}

export function useLocations(): UseLocationsResult {
  const [data, setData] = useState<LocationsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = `${import.meta.env.BASE_URL}data/spaces.json`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status.toString()}`);
        return res.json() as Promise<LocationsSnapshot>;
      })
      .then((snapshot) => {
        if (cancelled) return;
        setData(snapshot);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
