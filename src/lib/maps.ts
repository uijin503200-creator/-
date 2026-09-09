import { resolveGoogleMapsApiKey } from './mapsKey.ts';

export { DEFAULT_GOOGLE_MAPS_API_KEY, resolveGoogleMapsApiKey } from './mapsKey.ts';

export const GOOGLE_MAPS_API_KEY = resolveGoogleMapsApiKey(
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
);
