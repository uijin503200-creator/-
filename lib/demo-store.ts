import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEMO_ORIGIN, INITIAL_PAGES, MAX_PAGES, PAGE_REGEN_MS } from './constants';
import { isNoteExpired } from './decay';
import { offsetCoords } from './haversine';
import type { Coords, Note, UserProfile } from './types';

const NOTES_KEY = 'drift:demo:notes';
const PROFILE_KEY = 'drift:demo:profile';
const READS_KEY = 'drift:demo:reads';
const ECHOES_KEY = 'drift:demo:echoes';
const USER_KEY = 'drift:demo:user';

function uid(): string {
  return `demo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

const SEED_MESSAGES = [
  'I stood here once and felt the city breathe.',
  'If you found this, keep walking. The night is listening.',
  'Someone left kindness at these coordinates.',
  'The rain erased my name. The note remains.',
  'Look up. The buildings are taller when you are small.',
];

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function ensureDemoUser(): Promise<string> {
  let userId = await AsyncStorage.getItem(USER_KEY);
  if (!userId) {
    userId = uid();
    await AsyncStorage.setItem(USER_KEY, userId);
  }

  const profile = await readJson<UserProfile | null>(PROFILE_KEY, null);
  if (!profile) {
    await writeJson(PROFILE_KEY, {
      id: userId,
      pages: INITIAL_PAGES,
      pages_updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    } satisfies UserProfile);
  }

  const notes = await readJson<Note[]>(NOTES_KEY, []);
  if (notes.length === 0) {
    const seeded: Note[] = SEED_MESSAGES.map((content, i) => {
      // Place seeds ~25–55m out so the plaza starts quiet; walk-toward brings them in.
      const bearing = (i / SEED_MESSAGES.length) * Math.PI * 2;
      const distance = 25 + i * 7;
      const offset = offsetCoords(
        DEMO_ORIGIN,
        Math.cos(bearing) * distance,
        Math.sin(bearing) * distance
      );
      return {
        id: uid(),
        user_id: 'seed_wanderer',
        latitude: offset.latitude,
        longitude: offset.longitude,
        content,
        created_at: new Date(Date.now() - i * 3600_000).toISOString(),
        first_read_at: null,
        echo_count: i === 0 ? 2 : 0,
        is_dormant: true,
      };
    });
    await writeJson(NOTES_KEY, seeded);
  }

  return userId;
}

export async function getDemoProfile(): Promise<UserProfile> {
  await ensureDemoUser();
  let profile = (await readJson<UserProfile | null>(PROFILE_KEY, null))!;
  const elapsed = Date.now() - new Date(profile.pages_updated_at).getTime();
  const gained = Math.floor(elapsed / PAGE_REGEN_MS);
  if (gained > 0 && profile.pages < MAX_PAGES) {
    profile = {
      ...profile,
      pages: Math.min(MAX_PAGES, profile.pages + gained),
      pages_updated_at: new Date(
        new Date(profile.pages_updated_at).getTime() + gained * PAGE_REGEN_MS
      ).toISOString(),
    };
    await writeJson(PROFILE_KEY, profile);
  }
  return profile;
}

export async function listDemoNotes(): Promise<Note[]> {
  const notes = await readJson<Note[]>(NOTES_KEY, []);
  const alive = notes.filter((n) => !isNoteExpired(n));
  if (alive.length !== notes.length) {
    await writeJson(NOTES_KEY, alive);
  }
  return alive;
}

export async function createDemoNote(
  userId: string,
  coords: Coords,
  content: string
): Promise<Note> {
  const profile = await getDemoProfile();
  if (profile.pages <= 0) {
    throw new Error('No pages left. Wait for one to return.');
  }

  const note: Note = {
    id: uid(),
    user_id: userId,
    latitude: coords.latitude,
    longitude: coords.longitude,
    content: content.trim(),
    created_at: new Date().toISOString(),
    first_read_at: null,
    echo_count: 0,
    is_dormant: true,
  };

  const notes = await listDemoNotes();
  notes.push(note);
  await writeJson(NOTES_KEY, notes);
  await writeJson(PROFILE_KEY, {
    ...profile,
    pages: profile.pages - 1,
    pages_updated_at: new Date().toISOString(),
  } satisfies UserProfile);

  return note;
}

/** Awaken a dormant drift: is_dormant → false, stamp exact first_read_at. */
export async function awakenDemoDrift(noteId: string): Promise<Note> {
  const notes = await listDemoNotes();
  const idx = notes.findIndex((n) => n.id === noteId);
  if (idx < 0) throw new Error('Note faded away.');

  const note = { ...notes[idx] };
  if (note.is_dormant === true) {
    note.is_dormant = false;
    note.first_read_at = new Date().toISOString();
    notes[idx] = note;
    await writeJson(NOTES_KEY, notes);
  }
  return note;
}

export async function markDemoRead(noteId: string, userId: string): Promise<Note> {
  const note = await awakenDemoDrift(noteId);

  const reads = await readJson<Record<string, string[]>>(READS_KEY, {});
  const list = new Set(reads[userId] ?? []);
  list.add(noteId);
  reads[userId] = [...list];
  await writeJson(READS_KEY, reads);

  return note;
}

export async function echoDemoNote(noteId: string, userId: string): Promise<Note> {
  const echoes = await readJson<Record<string, string[]>>(ECHOES_KEY, {});
  const mine = new Set(echoes[userId] ?? []);
  if (mine.has(noteId)) {
    const notes = await listDemoNotes();
    const existing = notes.find((n) => n.id === noteId);
    if (!existing) throw new Error('Note faded away.');
    return existing;
  }

  mine.add(noteId);
  echoes[userId] = [...mine];
  await writeJson(ECHOES_KEY, echoes);

  const notes = await listDemoNotes();
  const idx = notes.findIndex((n) => n.id === noteId);
  if (idx < 0) throw new Error('Note faded away.');
  notes[idx] = { ...notes[idx], echo_count: notes[idx].echo_count + 1, is_dormant: false };
  if (!notes[idx].first_read_at) {
    notes[idx].first_read_at = new Date().toISOString();
  }
  await writeJson(NOTES_KEY, notes);
  return notes[idx];
}

export async function hasDemoEchoed(noteId: string, userId: string): Promise<boolean> {
  const echoes = await readJson<Record<string, string[]>>(ECHOES_KEY, {});
  return (echoes[userId] ?? []).includes(noteId);
}

export async function hasDemoRead(noteId: string, userId: string): Promise<boolean> {
  const reads = await readJson<Record<string, string[]>>(READS_KEY, {});
  return (reads[userId] ?? []).includes(noteId);
}

export async function getDemoReadIds(userId: string): Promise<Set<string>> {
  const reads = await readJson<Record<string, string[]>>(READS_KEY, {});
  return new Set(reads[userId] ?? []);
}

export async function resetDemoWorld(): Promise<void> {
  await AsyncStorage.multiRemove([NOTES_KEY, PROFILE_KEY, READS_KEY, ECHOES_KEY, USER_KEY]);
  await ensureDemoUser();
}

/** Dev helper: wipe local demo storage (used by web “reset plaza”). */
export async function clearDemoStorage(): Promise<void> {
  await AsyncStorage.multiRemove([NOTES_KEY, PROFILE_KEY, READS_KEY, ECHOES_KEY, USER_KEY]);
}