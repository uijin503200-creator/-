/**
 * Runtime proof of Awakening + Decay poll exclusion (no Expo UI required).
 * Simulates envelope open + location poll the way discovery does.
 */
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';

import { BASE_DECAY_MS, DISCOVERY_RADIUS_METERS } from '../lib/constants';
import { isDecayed } from '../lib/decay';
import { haversineMeters, offsetCoords } from '../lib/haversine';

type Drift = {
  id: string;
  latitude: number;
  longitude: number;
  first_read_at: string | null;
  echo_count: number;
  is_dormant: boolean;
  content: string;
};

const origin = { latitude: 37.7879, longitude: -122.4075 };
const log: string[] = [];
function line(s: string) {
  log.push(s);
  console.log(s);
}

function awaken(d: Drift, at: number): Drift {
  if (d.is_dormant === true) {
    return { ...d, is_dormant: false, first_read_at: new Date(at).toISOString() };
  }
  return d;
}

function pollNearby(notes: Drift[], coords: typeof origin, now: number) {
  return notes.filter((n) => {
    if (isDecayed(n, now)) return false;
    const dist = haversineMeters(coords, { latitude: n.latitude, longitude: n.longitude });
    return dist <= DISCOVERY_RADIUS_METERS;
  });
}

const t0 = Date.parse('2026-09-09T12:00:00.000Z');
let drift: Drift = {
  id: 'drift-1',
  latitude: origin.latitude,
  longitude: origin.longitude,
  first_read_at: null,
  echo_count: 0,
  is_dormant: true,
  content: 'a quiet thing left for a stranger',
};

line('=== Awakening / Decay proof ===');
line(`t0 dormant: is_dormant=${drift.is_dormant} first_read_at=${drift.first_read_at}`);

const nearOpen = pollNearby([drift], origin, t0);
assert.equal(nearOpen.length, 1, 'dormant drift must vibrate / be fetchable');
line(`poll @ t0: fetched ${nearOpen.length} (expect 1 — dormant still living)`);

drift = awaken(drift, t0);
line(`envelope open: is_dormant=${drift.is_dormant} first_read_at=${drift.first_read_at}`);
assert.equal(drift.is_dormant, false);
assert.equal(drift.first_read_at, new Date(t0).toISOString());

const again = awaken(drift, t0 + 3_600_000);
assert.equal(again.first_read_at, drift.first_read_at, 're-open must not move first_read_at');
line('second open: first_read_at unchanged ✓');

const tAlive = t0 + BASE_DECAY_MS - 1;
assert.equal(pollNearby([drift], origin, tAlive).length, 1);
line(`poll @ +24h-1ms: fetched 1 (still alive) ✓`);

const tDead = t0 + BASE_DECAY_MS;
const deadPoll = pollNearby([drift], origin, tDead);
assert.equal(deadPoll.length, 0, 'decayed drift must NOT be fetched — no vibration');
line(`poll @ +24h: fetched 0 (decayed — no vibration) ✓`);

const far = {
  ...drift,
  id: 'far',
  is_dormant: true,
  first_read_at: null,
  ...offsetCoords(origin, 50, 0),
};
assert.equal(pollNearby([far], origin, t0).length, 0);
line('far dormant (>15m) not fetched ✓');

mkdirSync('/opt/cursor/artifacts', { recursive: true });
const out = '/opt/cursor/artifacts/awakening-decay-proof.log';
writeFileSync(out, log.join('\n') + '\n');
line(`wrote ${out}`);
line('PASS');
