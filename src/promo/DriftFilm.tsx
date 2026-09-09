import { useEffect, useMemo, useState } from 'react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { Hexagon } from 'lucide-react';
import { unlockWeatherAudio, startWeatherAmbience } from '../lib/weather-audio.ts';
import './film.css';

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#090a0f' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#181b24' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#040508' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
];

const BRIDGE = { lat: 51.5084, lng: -0.1169 };
const NOTES = [
  { id: 'focus', ...BRIDGE },
  { id: 'n1', lat: 51.5062, lng: -0.1235 },
  { id: 'n2', lat: 51.5114, lng: -0.1198 },
  { id: 'n3', lat: 51.5071, lng: -0.1098 },
  { id: 'n4', lat: 51.5108, lng: -0.1126 },
  { id: 'n5', lat: 51.5049, lng: -0.1188 },
  { id: 'n6', lat: 51.5099, lng: -0.1264 },
];

function clamp(v: number, a = 0, b = 1) {
  return Math.min(b, Math.max(a, v));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * clamp(t);
}
function span(t: number, start: number, end: number) {
  return clamp((t - start) / (end - start));
}

export default function DriftFilm() {
  const [t, setT] = useState(0);
  const mapKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    unlockWeatherAudio();
    const origin = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      setT(now - origin);
      if (now - origin < 80000) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (t < 46800) return undefined;
    const ambience = startWeatherAmbience('Rain', 'Night');
    return () => ambience.stop();
  }, [t >= 46800]);

  const scene =
    t < 18500 ? 'tablet' :
    t < 29000 ? 'auth' :
    t < 47000 ? 'map' :
    t < 64000 ? 'reader' :
    'end';

  const tabletY = t < 8000 ? lerp(0, 3.5, span(t, 600, 8000)) : lerp(3.5, 18, span(t, 8000, 15500));
  const tabletScale = t < 15500 ? 1 : lerp(1, 1.28, span(t, 15500, 18200));
  const feedY = t < 8000 ? lerp(0, 70, span(t, 400, 8000)) : lerp(70, 920, span(t, 8000, 16500));
  const tabletFade = 1 - span(t, 17200, 19200);
  const authZoom = lerp(1, 1.1, span(t, 23000, 26800));
  const enterHot = t >= 26500 && t < 29000;

  const mapZoom =
    t < 31800 ? 16.6 :
    t < 37200 ? lerp(16.6, 12.9, span(t, 31800, 37200)) :
    t < 41000 ? 12.9 :
    lerp(12.9, 16.5, span(t, 41000, 45200));

  const mapLat = t < 41000 ? BRIDGE.lat : lerp(BRIDGE.lat, BRIDGE.lat + 0.00035, span(t, 41000, 45200));
  const visiblePins = t < 33800 ? 0 : t < 41000 ? Math.min(NOTES.length, 1 + Math.floor(span(t, 33800, 40000) * NOTES.length)) : NOTES.length;

  const cursorVisible = (t >= 24000 && t < 29100) || (t >= 42800 && t < 47200);
  const cursorDown = (t >= 27600 && t < 28400) || (t >= 45400 && t < 46400);
  const cursor = useMemo(() => {
    if (t >= 24000 && t < 29100) {
      const u = span(t, 24000, 27200);
      return { x: lerp(64, 50, u), y: lerp(74, 71.2, u) };
    }
    if (t >= 42800 && t < 47200) {
      const u = span(t, 42800, 45000);
      return { x: lerp(76, 50, u), y: lerp(30, 49, u) };
    }
    return { x: 50, y: 50 };
  }, [t]);

  const drops = useMemo(
    () => Array.from({ length: 70 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2.2,
      duration: 0.55 + Math.random() * 0.75,
      height: 11 + Math.random() * 18,
    })),
    [],
  );

  const caption =
    t < 7000 ? '' :
    t < 12000 ? 'The modern internet is loud.' :
    t < 17000 ? 'Fast. Endless. Cheap.' :
    t < 24000 ? '' :
    t < 29000 ? 'Unseen stories, waiting where you left them.' :
    t < 34000 ? 'Physical space is the only feed.' :
    t < 42000 ? 'Notes wait within 15 meters.' :
    t < 47000 ? '' :
    t < 56000 ? '' :
    t < 64000 ? 'You are never alone here.' :
    '';

  return (
    <div className="film-root">
      {scene === 'tablet' && (
        <div className="film-layer" style={{ opacity: tabletFade }}>
          <div className="film-tablet-stage">
            <div
              className="film-tablet-frame"
              style={{ transform: `translateY(${-tabletY}%) scale(${tabletScale})` }}
            >
              <img src="/promo/tablet.png" alt="" className="film-tablet-photo" />
              <div className="film-feed-mask">
                <div className="film-feed-track" style={{ transform: `translateY(${-feedY}px)` }}>
                  {Array.from({ length: 16 }, (_, i) => <div key={i} className="film-card" />)}
                </div>
              </div>
            </div>
          </div>
          <div className="film-vignette" />
        </div>
      )}

      {scene === 'auth' && (
        <div className="film-layer film-auth" style={{ transform: `scale(${authZoom})` }}>
          <div className="relative w-16 h-16 flex items-center justify-center mb-2">
            <span className="film-pulse" />
            <span className="film-pulse" style={{ animationDelay: '2s' }} />
            <Hexagon size={64} className="text-zinc-400" strokeWidth={1} />
          </div>
          <h1 className="film-title">DRIFT</h1>
          <p className="film-tag">Leave pieces of yourself in physical spaces. Find pieces of others.</p>
          <div className={`film-enter ${enterHot ? 'hot' : ''}`}>Enter</div>
        </div>
      )}

      {scene === 'map' && mapKey && (
        <div className="film-layer">
          <APIProvider apiKey={mapKey}>
            <Map
              style={{ width: '100%', height: '100%' }}
              defaultCenter={BRIDGE}
              center={{ lat: mapLat, lng: BRIDGE.lng }}
              defaultZoom={16.6}
              zoom={mapZoom}
              styles={MAP_STYLES}
              disableDefaultUI
              gestureHandling="none"
              keyboardShortcuts={false}
            >
              {NOTES.slice(0, visiblePins).map((note) => (
                <Marker
                  key={note.id}
                  position={{ lat: note.lat, lng: note.lng }}
                  icon={note.id === 'focus' && t > 43000 ? '/promo/mail-pin.svg' : '/promo/pin.svg'}
                />
              ))}
            </Map>
          </APIProvider>
          <div className="film-vignette" />
        </div>
      )}

      {scene === 'reader' && (
        <div className="film-layer film-reader">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(30,48,92,0.28)_0%,_rgba(4,6,16,0.92)_70%)]" />
          {drops.map((drop) => (
            <span
              key={drop.id}
              className="film-drop"
              style={{
                left: `${drop.left}%`,
                height: drop.height,
                animationDelay: `${drop.delay}s`,
                animationDuration: `${drop.duration}s`,
              }}
            />
          ))}
          {t > 50500 && <p className="film-whisper">left in the rain, after dark</p>}
          <p className="film-paper">
            {t > 57500
              ? 'You are never alone here. The world is filled with unseen thoughts.'
              : 'If you found this, you were looking. Stay a little longer.'}
          </p>
        </div>
      )}

      {scene === 'end' && (
        <div className="film-layer film-end">
          <h1>DRIFT</h1>
          <p>Unseen stories, waiting where you left them.</p>
        </div>
      )}

      {caption && scene !== 'end' && (
        <div className="film-caption" style={{ opacity: scene === 'reader' && t > 51000 ? 0 : 1 }}>
          {caption}
        </div>
      )}

      {cursorVisible && (
        <div
          className={`film-cursor ${cursorDown ? 'down' : ''}`}
          style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
        />
      )}
    </div>
  );
}
