import * as Location from 'expo-location';

import { MAX_DRIFT_LENGTH } from '@/lib/constants';
import { createDemoNote } from '@/lib/demo-store';
import { fetchProfile } from '@/lib/notes-service';
import { getSupabase, isDemoMode } from '@/lib/supabase';
import type { Coords, Note } from '@/lib/types';

export type Drift = {
  id: string;
  user_id: string;
  content: string;
  latitude: number;
  longitude: number;
  created_at: string;
  first_read_at: string | null;
  echo_count: number;
  is_dormant: boolean;
};

/** Grab the freshest GPS fix available (falls back to provided coords). */
export async function getExactCoords(fallback?: Coords | null): Promise<Coords> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === Location.PermissionStatus.GRANTED) {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
    }
  } catch {
    // Fall through to fallback / demo.
  }
  if (fallback) return fallback;
  throw new Error('Could not sense your place in the dark.');
}

/**
 * Drop a Drift at the caller's exact coordinates.
 * Live mode: Supabase RPC `drop_drift` sets PostGIS `location` via ST_MakePoint.
 * Demo mode: local AsyncStorage note (same cinematic UX).
 */
export async function dropDrift(userId: string, content: string, fallbackCoords?: Coords | null): Promise<Drift> {
  const cleaned = content.trim();
  if (!cleaned || cleaned.length > MAX_DRIFT_LENGTH) {
    throw new Error(`Drift must be 1–${MAX_DRIFT_LENGTH} characters.`);
  }

  const coords = await getExactCoords(fallbackCoords);

  if (isDemoMode) {
    const note = await createDemoNote(userId, coords, cleaned);
    return noteToDrift(note);
  }

  const supabase = getSupabase()!;
  const profile = await fetchProfile(userId);
  if (profile.pages <= 0) {
    throw new Error('No pages left. Wait for one to return.');
  }

  const { data, error } = await supabase.rpc('drop_drift', {
    p_content: cleaned,
    p_lat: coords.latitude,
    p_lon: coords.longitude,
  });

  if (error) throw error;
  return data as Drift;
}

function noteToDrift(note: Note): Drift {
  return {
    id: note.id,
    user_id: note.user_id,
    content: note.content,
    latitude: note.latitude,
    longitude: note.longitude,
    created_at: note.created_at,
    first_read_at: note.first_read_at,
    echo_count: note.echo_count,
    is_dormant: note.is_dormant,
  };
}
