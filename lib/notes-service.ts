import { DISCOVERY_RADIUS_METERS } from './constants';
import { getExpiryMs, isNoteExpired } from './decay';
import {
  createDemoNote,
  echoDemoNote,
  ensureDemoUser,
  getDemoProfile,
  hasDemoEchoed,
  listDemoNotes,
  markDemoRead,
} from './demo-store';
import { haversineMeters } from './haversine';
import { getSupabase, isDemoMode } from './supabase';
import type { Coords, NearbyNote, Note, UserProfile } from './types';

function decorate(note: Note, coords: Coords | null): NearbyNote {
  const distanceMeters = coords
    ? haversineMeters(coords, { latitude: note.latitude, longitude: note.longitude })
    : Number.POSITIVE_INFINITY;
  const expiry = getExpiryMs(note);
  return {
    ...note,
    distanceMeters,
    expiresAt: expiry != null ? new Date(expiry).toISOString() : null,
    isExpired: isNoteExpired(note),
  };
}

export async function ensureSession(): Promise<string> {
  if (isDemoMode) return ensureDemoUser();

  const supabase = getSupabase()!;
  const { data } = await supabase.auth.getSession();
  if (data.session?.user?.id) return data.session.user.id;

  const { data: anon, error } = await supabase.auth.signInAnonymously();
  if (error || !anon.user) {
    throw error ?? new Error('Unable to start anonymous session');
  }
  return anon.user.id;
}

export async function fetchProfile(userId: string): Promise<UserProfile> {
  if (isDemoMode) return getDemoProfile();

  const supabase = getSupabase()!;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data as UserProfile;
}

export async function fetchNearbyNotes(coords: Coords): Promise<NearbyNote[]> {
  if (isDemoMode) {
    const notes = await listDemoNotes();
    return notes
      .map((n) => decorate(n, coords))
      .filter((n) => !n.isExpired)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  const supabase = getSupabase()!;
  // Best-effort purge of decayed notes/drifts on each sense cycle.
  void supabase.rpc('purge_expired_notes');

  const { data, error } = await supabase.rpc('nearby_notes', {
    lat: coords.latitude,
    lon: coords.longitude,
    radius_m: 500, // fetch a wider ring; client filters discovery radius for heartbeat
  });
  if (error) throw error;
  return ((data ?? []) as Note[])
    .map((n) => decorate(n, coords))
    .filter((n) => !n.isExpired)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export async function fetchNoteById(id: string, coords: Coords | null): Promise<NearbyNote | null> {
  if (isDemoMode) {
    const notes = await listDemoNotes();
    const note = notes.find((n) => n.id === id);
    return note ? decorate(note, coords) : null;
  }

  const supabase = getSupabase()!;
  const { data, error } = await supabase.from('notes').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return decorate(data as Note, coords);
}

export async function dropNote(userId: string, coords: Coords, content: string): Promise<Note> {
  if (isDemoMode) return createDemoNote(userId, coords, content);

  const supabase = getSupabase()!;
  const profile = await fetchProfile(userId);
  if (profile.pages <= 0) throw new Error('No pages left. Wait for one to return.');

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      latitude: coords.latitude,
      longitude: coords.longitude,
      content: content.trim(),
      is_dormant: true,
    })
    .select('*')
    .single();
  if (error) throw error;

  await supabase
    .from('profiles')
    .update({ pages: profile.pages - 1, pages_updated_at: new Date().toISOString() })
    .eq('id', userId);

  return data as Note;
}

export async function markRead(noteId: string, userId: string): Promise<Note> {
  if (isDemoMode) return markDemoRead(noteId, userId);

  const supabase = getSupabase()!;
  const { data, error } = await supabase.rpc('mark_note_read', { p_note_id: noteId });
  if (error) throw error;
  return data as Note;
}

export async function echoNote(noteId: string, userId: string): Promise<Note> {
  if (isDemoMode) return echoDemoNote(noteId, userId);

  const supabase = getSupabase()!;
  const { data, error } = await supabase.rpc('echo_note', { p_note_id: noteId });
  if (error) throw error;
  return data as Note;
}

export async function hasEchoed(noteId: string, userId: string): Promise<boolean> {
  if (isDemoMode) return hasDemoEchoed(noteId, userId);

  const supabase = getSupabase()!;
  const { data, error } = await supabase
    .from('echoes')
    .select('note_id')
    .eq('note_id', noteId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export function withinDiscovery(distanceMeters: number): boolean {
  return distanceMeters <= DISCOVERY_RADIUS_METERS;
}