import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { fetchNearbyNotes } from '@/lib/notes-service';
import type { NearbyNote } from '@/lib/types';

export function useNotes() {
  const { userId } = useAuth();
  const { coords } = useLocation();
  const [notes, setNotes] = useState<NearbyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!coords) return;
    try {
      setError(null);
      const next = await fetchNearbyNotes(coords);
      setNotes(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sense notes');
    } finally {
      setLoading(false);
    }
  }, [coords]);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 4000);
    return () => clearInterval(id);
  }, [refresh, userId]);

  return { notes, loading, error, refresh };
}