import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_GOOGLE_MAPS_API_KEY, resolveGoogleMapsApiKey } from './mapsKey.ts';

test('uses the provided env key when it is non-empty', () => {
  assert.equal(resolveGoogleMapsApiKey('AIzaSyTESTKEY'), 'AIzaSyTESTKEY');
});

test('falls back to the Drift Maps key when env is missing or blank', () => {
  assert.equal(resolveGoogleMapsApiKey(undefined), DEFAULT_GOOGLE_MAPS_API_KEY);
  assert.equal(resolveGoogleMapsApiKey(''), DEFAULT_GOOGLE_MAPS_API_KEY);
  assert.equal(resolveGoogleMapsApiKey('   '), DEFAULT_GOOGLE_MAPS_API_KEY);
  assert.match(DEFAULT_GOOGLE_MAPS_API_KEY, /^AIzaSy/);
});
