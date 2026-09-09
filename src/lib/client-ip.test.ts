import { describe, expect, it } from 'vitest';
import { clientIpFromRequest, coordsFromGeoPayload } from './client-ip.ts';

describe('clientIpFromRequest', () => {
  it('prefers the first X-Forwarded-For hop over the socket address', () => {
    expect(clientIpFromRequest({
      headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' },
      socket: { remoteAddress: '10.0.0.5' },
    })).toBe('203.0.113.10');
  });

  it('strips IPv4-mapped IPv6 prefixes', () => {
    expect(clientIpFromRequest({
      headers: { 'x-real-ip': '::ffff:198.51.100.20' },
      socket: { remoteAddress: '::1' },
    })).toBe('198.51.100.20');
  });

  it('ignores loopback so local fallback can use egress lookup', () => {
    expect(clientIpFromRequest({
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
    })).toBeNull();
  });
});

describe('coordsFromGeoPayload', () => {
  it('reads lat/lng from the app geo endpoint and loc from ipinfo', () => {
    expect(coordsFromGeoPayload({ lat: 39.96, lng: -83.0 })).toEqual({ lat: 39.96, lng: -83.0 });
    expect(coordsFromGeoPayload({ loc: '37.77,-122.41' })).toEqual({ lat: 37.77, lng: -122.41 });
    expect(coordsFromGeoPayload({})).toBeNull();
  });
});
