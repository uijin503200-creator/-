export const DEFAULT_GOOGLE_MAPS_API_KEY =
  'AIzaSyBRfS4Qncv7e3z71w_WeQFiwhgWq5Bt-o8';

export function resolveGoogleMapsApiKey(envKey?: string): string {
  const trimmed = envKey?.trim();
  return trimmed ? trimmed : DEFAULT_GOOGLE_MAPS_API_KEY;
}
