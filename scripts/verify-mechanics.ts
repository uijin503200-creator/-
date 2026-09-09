import assert from 'node:assert/strict';

import {
  BASE_DECAY_MS,
  DISCOVERY_RADIUS_METERS,
  ECHO_EXTENSION_MS,
  INITIAL_PAGES,
  MAX_DRIFT_LENGTH,
  MAX_PAGES,
} from '../lib/constants';
import { formatRemaining, getExpiryMs, isDecayed, isNoteExpired, remainingLifeMs } from '../lib/decay';
import { haversineMeters, offsetCoords } from '../lib/haversine';

// --- Haversine / 15m trigger ---
const a = { latitude: 37.7879, longitude: -122.4075 };
const b = offsetCoords(a, 15, 0);
const d = haversineMeters(a, b);
assert.ok(Math.abs(d - 15) < 0.5, `expected ~15m, got ${d}`);
assert.ok(d <= DISCOVERY_RADIUS_METERS);
assert.ok(!(DISCOVERY_RADIUS_METERS + 0.1 <= DISCOVERY_RADIUS_METERS));

const far = offsetCoords(a, 100, 0);
assert.ok(haversineMeters(a, far) > 90);
assert.ok(haversineMeters(a, far) > DISCOVERY_RADIUS_METERS);

// --- Dormancy & Awakening ---
const dormant = { first_read_at: null as string | null, echo_count: 0, is_dormant: true };
assert.equal(getExpiryMs(dormant), null);
assert.equal(isNoteExpired(dormant), false);
assert.equal(isDecayed(dormant), false);
assert.equal(formatRemaining(null), 'dormant');

// Awaken: only while dormant → stamp first_read_at, flip is_dormant.
function awakenOnce(
  note: { first_read_at: string | null; is_dormant: boolean; echo_count: number },
  at: number
) {
  if (note.is_dormant === true) {
    return {
      ...note,
      is_dormant: false,
      first_read_at: new Date(at).toISOString(),
    };
  }
  return note;
}

const t0 = Date.parse('2026-01-01T00:00:00.000Z');
const awakened = awakenOnce(dormant, t0);
assert.equal(awakened.is_dormant, false);
assert.equal(awakened.first_read_at, new Date(t0).toISOString());
// Second open must not move first_read_at.
const reopened = awakenOnce(awakened, t0 + 60_000);
assert.equal(reopened.first_read_at, awakened.first_read_at);

assert.equal(getExpiryMs(awakened), t0 + BASE_DECAY_MS);
assert.equal(isNoteExpired(awakened, t0 + BASE_DECAY_MS - 1), false);
assert.equal(isNoteExpired(awakened, t0 + BASE_DECAY_MS), true);
assert.equal(isDecayed(awakened, t0 + BASE_DECAY_MS), true);

// Location poll must drop decayed notes (no vibration).
function pollLiving(
  notes: Array<{ id: string; first_read_at: string | null; echo_count: number }>,
  now: number
) {
  return notes.filter((n) => !isDecayed(n, now));
}
const poll = pollLiving(
  [
    { id: 'dormant', first_read_at: null, echo_count: 0 },
    { id: 'alive', first_read_at: new Date(t0).toISOString(), echo_count: 0 },
    { id: 'dead', first_read_at: new Date(t0).toISOString(), echo_count: 0 },
  ],
  t0 + BASE_DECAY_MS
);
assert.deepEqual(
  poll.map((n) => n.id),
  ['dormant']
);

// --- Echo survival (+7d each) ---
const loved = { first_read_at: new Date(t0).toISOString(), echo_count: 2 };
assert.equal(getExpiryMs(loved), t0 + BASE_DECAY_MS + 2 * ECHO_EXTENSION_MS);
assert.equal(remainingLifeMs(loved, t0), BASE_DECAY_MS + 2 * ECHO_EXTENSION_MS);
assert.equal(formatRemaining(0), 'faded');
assert.match(formatRemaining(2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), /2d 3h/);

const oneEcho = { first_read_at: new Date(t0).toISOString(), echo_count: 1 };
assert.equal(getExpiryMs(oneEcho)! - getExpiryMs(awakened)!, ECHO_EXTENSION_MS);
assert.equal(isDecayed(oneEcho, t0 + BASE_DECAY_MS), false);
assert.equal(isDecayed(oneEcho, t0 + BASE_DECAY_MS + ECHO_EXTENSION_MS), true);

// --- Scarcity constants ---
assert.equal(INITIAL_PAGES, 3);
assert.equal(MAX_PAGES, 5);
assert.equal(MAX_DRIFT_LENGTH, 150);
assert.equal(DISCOVERY_RADIUS_METERS, 15);

console.log('ok — haversine, discovery, awakening, decay poll, echo, scarcity');
