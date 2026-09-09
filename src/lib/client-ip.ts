type RequestLike = {
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
};

function firstHeader(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return String(raw || '').split(',')[0].trim();
}

function normalizeIp(value: string): string {
  return value.replace(/^::ffff:/i, '').trim();
}

function isLoopback(ip: string): boolean {
  return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';
}

export function clientIpFromRequest(req: RequestLike): string | null {
  const forwarded = firstHeader(req.headers['x-forwarded-for']);
  const realIp = firstHeader(req.headers['x-real-ip']);
  const socketIp = req.socket?.remoteAddress || '';
  const ip = normalizeIp(forwarded || realIp || socketIp);
  if (!ip || isLoopback(ip)) return null;
  return ip;
}

export function ipinfoUrl(clientIp: string | null): string {
  return clientIp ? `https://ipinfo.io/${clientIp}/json` : 'https://ipinfo.io/json';
}

export function coordsFromGeoPayload(data: { lat?: unknown; lng?: unknown; loc?: unknown }): { lat: number; lng: number } | null {
  let lat = Number(data.lat);
  let lng = Number(data.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    const [fromLocLat, fromLocLng] = String(data.loc || '').split(',').map(Number);
    lat = fromLocLat;
    lng = fromLocLng;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
