import { BASE_DECAY_MS, ECHO_EXTENSION_MS } from './constants';
import type { Note } from './types';

/** Expiry = first_read_at + 24h + (echo_count * 7 days). Dormant notes never expire. */
export function getExpiryMs(note: Pick<Note, 'first_read_at' | 'echo_count'>): number | null {
  if (!note.first_read_at) return null;
  const first = new Date(note.first_read_at).getTime();
  return first + BASE_DECAY_MS + note.echo_count * ECHO_EXTENSION_MS;
}

/** Dead / decayed: current time is past first_read_at + 24h (Echo extends). */
export function isNoteExpired(
  note: Pick<Note, 'first_read_at' | 'echo_count'>,
  now = Date.now()
): boolean {
  const expiry = getExpiryMs(note);
  if (expiry == null) return false;
  return now >= expiry;
}

/** Alias: treat as dead so discovery must not fetch / vibrate. */
export const isDecayed = isNoteExpired;

export function remainingLifeMs(
  note: Pick<Note, 'first_read_at' | 'echo_count'>,
  now = Date.now()
): number | null {
  const expiry = getExpiryMs(note);
  if (expiry == null) return null;
  return Math.max(0, expiry - now);
}

export function formatRemaining(ms: number | null): string {
  if (ms == null) return 'dormant';
  if (ms <= 0) return 'faded';
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days}d ${hours % 24}h`;
  const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours >= 1) return `${hours}h ${mins}m`;
  return `${Math.max(1, mins)}m`;
}