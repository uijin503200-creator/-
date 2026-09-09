import * as Location from 'expo-location';

import { DISCOVERY_RADIUS_METERS, MAX_DRIFT_LENGTH } from '@/lib/constants';
import { isNoteExpired } from '@/lib/decay';
import { awakenDemoDrift, createDemoNote, listDemoNotes } from '@/lib/demo-store';
import { haversineMeters } from '@/lib/haversine';
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

/**
 * Awakening: when the reader opens the envelope on a dormant drift,
 * flip is_dormant → false and stamp first_read_at to the exact open time.
 * Already-awake drifts are left unchanged (decay clock stays put).
 */
export async function awakenDrift(driftId: string): Promise<Drift> {
  if (isDemoMode) {
    return noteToDrift(await awakenDemoDrift(driftId));
  }

  const supabase = getSupabase()!;
  const { data, error } = await supabase.rpc('awaken_drift', { p_drift_id: driftId });
  if (!error && data) return data as Drift;

  // Fallback when awaken_drift RPC is not yet migrated on the project.
  const missingFn =
    !!error &&
    (error.code === 'PGRST202' || /awaken_drift|Could not find the function/i.test(error.message ?? ''));
  if (missingFn) return awakenDriftDirect(driftId);
  if (error) throw error;
  return awakenDriftDirect(driftId);
}

async function awakenDriftDirect(driftId: string): Promise<Drift> {
  const supabase = getSupabase()!;
  const { data: existing, error: fetchErr } = await supabase
    .from('drifts')
    .select('*')
    .eq('id', driftId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!existing) throw new Error('Drift not found');

  if (existing.is_dormant !== true) {
    return existing as Drift;
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('drifts')
    .update({ is_dormant: false, first_read_at: now })
    .eq('id', driftId)
    .eq('is_dormant', true)
    .select('*')
    .maybeSingle();
  if (error) throw error;

  // Keep notes dual-write in sync when present.
  await supabase
    .from('notes')
    .update({ is_dormant: false, first_read_at: now })
    .eq('id', driftId)
    .eq('is_dormant', true);

  return (data ?? existing) as Drift;
}

/**
 * Location poll for nearby living drifts.
 * Decayed (now > first_read_at + 24h [+ Echo]) are excluded — no vibration.
 */
export async function fetchNearbyDrifts(
  coords: Coords,
  radiusMeters = DISCOVERY_RADIUS_METERS
): Promise<Drift[]> {
  if (isDemoMode) {
    const notes = await listDemoNotes();
    return notes
      .filter((n) => !isNoteExpired(n))
      .map((n) => ({
        note: n,
        distance: haversineMeters(coords, { latitude: n.latitude, longitude: n.longitude }),
      }))
      .filter((x) => x.distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance)
      .map((x) => noteToDrift(x.note));
  }

  const supabase = getSupabase()!;
  void supabase.rpc('purge_expired_drifts');

  const { data, error } = await supabase.rpc('nearby_drifts', {
    lat: coords.latitude,
    lon: coords.longitude,
    radius_m: radiusMeters,
  });
  if (error) throw error;

  return ((data ?? []) as Drift[]).filter((d) => !isNoteExpired(d));
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
