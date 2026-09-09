import assert from 'node:assert/strict';

import {
  BASE_DECAY_MS,
  DISCOVERY_RADIUS_METERS,
  ECHO_EXTENSION_MS,
  INITIAL_PAGES,
  MAX_DRIFT_LENGTH,
  MAX_PAGES,
} from '../lib/constants';
import { formatRemaining, getExpiryMs, isNoteExpired, remainingLifeMs } from '../lib/decay';
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

// --- Dormancy & decay ---
const dormant = { first_read_at: null, echo_count: 0 };
assert.equal(getExpiryMs(dormant), null);
assert.equal(isNoteExpired(dormant), false);
assert.equal(formatRemaining(null), 'dormant');

const t0 = Date.parse('2026-01-01T00:00:00.000Z');
const awakened = { first_read_at: new Date(t0).toISOString(), echo_count: 0 };
assert.equal(getExpiryMs(awakened), t0 + BASE_DECAY_MS);
assert.equal(isNoteExpired(awakened, t0 + BASE_DECAY_MS - 1), false);
assert.equal(isNoteExpired(awakened, t0 + BASE_DECAY_MS), true);

// --- Echo survival (+7d each) ---
const loved = { first_read_at: new Date(t0).toISOString(), echo_count: 2 };
assert.equal(getExpiryMs(loved), t0 + BASE_DECAY_MS + 2 * ECHO_EXTENSION_MS);
assert.equal(remainingLifeMs(loved, t0), BASE_DECAY_MS + 2 * ECHO_EXTENSION_MS);
assert.equal(formatRemaining(0), 'faded');
assert.match(formatRemaining(2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), /2d 3h/);

const oneEcho = { first_read_at: new Date(t0).toISOString(), echo_count: 1 };
assert.equal(getExpiryMs(oneEcho)! - getExpiryMs(awakened)!, ECHO_EXTENSION_MS);

// --- Scarcity constants ---
assert.equal(INITIAL_PAGES, 3);
assert.equal(MAX_PAGES, 5);
assert.equal(MAX_DRIFT_LENGTH, 150);
assert.equal(DISCOVERY_RADIUS_METERS, 15);

console.log('ok — haversine, discovery, dormancy, decay, echo, scarcity');
