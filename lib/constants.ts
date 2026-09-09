/** Core Drift mechanics */
export const DISCOVERY_RADIUS_METERS = 15;
export const BASE_DECAY_MS = 24 * 60 * 60 * 1000; // 24h after first read
export const ECHO_EXTENSION_MS = 7 * 24 * 60 * 60 * 1000; // +7 days per echo
export const INITIAL_PAGES = 3;
export const MAX_PAGES = 5;
export const PAGE_REGEN_MS = 12 * 60 * 60 * 1000; // 1 page every 12 hours
export const MAX_NOTE_LENGTH = 280;
export const LOCATION_POLL_MS = 4000;

/** Demo default: a quiet plaza near Union Square, SF */
export const DEMO_ORIGIN = {
  latitude: 37.7879,
  longitude: -122.4075,
} as const;

export const ENV = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
};

export const isDemoMode = !ENV.supabaseUrl || !ENV.supabaseAnonKey;