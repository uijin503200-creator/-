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
function easeInCubic(u: number) {
  const t = clamp(u);
  return t * t * t;
}
function easeInOut(u: number) {
  const t = clamp(u);
  return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
}

export default function DriftFilm() {
  const [t, setT] = useState(0);
  const mapKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [hold, setHold] = useState(() => new URLSearchParams(window.location.search).has('hold'));

  useEffect(() => {
    if (!hold) return undefined;
    const release = () => setHold(false);
    window.addEventListener('keydown', release, { once: true });
    window.addEventListener('pointerdown', release, { once: true });
    return () => {
      window.removeEventListener('keydown', release);
      window.removeEventListener('pointerdown', release);
    };
  }, [hold]);

  useEffect(() => {
    if (hold) return undefined;
    unlockWeatherAudio();
    const origin = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      setT(now - origin);
      if (now - origin < 82000) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [hold]);

  useEffect(() => {
    if (t < 47800) return undefined;
    const ambience = startWeatherAmbience('Rain', 'Night');
    return () => ambience.stop();
  }, [t >= 47800]);

  const showTablet = t < 20500;
  const showAuth = t >= 16800 && t < 30500;
  const showMap = t >= 20000 && t < 49000;
  const showReader = t >= 46800 && t < 68000;
  const showEnd = t >= 65500;

  const tabletY = lerp(0, 4.2, easeInOut(span(t, 400, 16000)));
  const tabletScale = t < 14500 ? 1 : lerp(1, 1.38, easeInOut(span(t, 14500, 18800)));
  const feedProgress = easeInCubic(span(t, 500, 16800));
  const feedY = lerp(0, 1680, feedProgress);
  const feedBlur = lerp(0, 5.5, span(t, 11000, 16800));
  const tabletOpacity = 1 - span(t, 16800, 19800);
  const authOpacity = span(t, 17200, 19600) * (1 - span(t, 28800, 30400));
  const authZoom = lerp(1, 1.12, easeInOut(span(t, 22800, 27200)));
  const enterHot = t >= 26800 && t < 29600;

  const mapOpacity = span(t, 29200, 30800) * (1 - span(t, 46800, 48600));
  const mapZoom =
    t < 32800 ? 16.7 :
    t < 38800 ? lerp(16.7, 12.85, easeInOut(span(t, 32800, 38800))) :
    t < 41800 ? 12.85 :
    lerp(12.85, 16.55, easeInOut(span(t, 41800, 45800)));
  const mapLat = t < 41800 ? BRIDGE.lat : lerp(BRIDGE.lat, BRIDGE.lat + 0.00032, span(t, 41800, 45800));
  const visiblePins = t < 34800
    ? 0
    : t < 41800
      ? Math.min(NOTES.length, 1 + Math.floor(span(t, 34800, 40800) * NOTES.length))
      : NOTES.length;

  const readerOpacity = span(t, 47200, 48800) * (1 - span(t, 65500, 67600));
  const endOpacity = span(t, 66200, 68800);

  const cursorVisible = (t >= 23800 && t < 29800) || (t >= 43200 && t < 47800);
  const cursorDown = (t >= 27800 && t < 28700) || (t >= 45800 && t < 47000);
  const cursor = useMemo(() => {
    if (t >= 23800 && t < 29800) {
      const u = easeInOut(span(t, 23800, 27400));
      return { x: lerp(66, 50, u), y: lerp(76, 71.4, u) };
    }
    if (t >= 43200 && t < 47800) {
      const u = easeInOut(span(t, 43200, 45600));
      return { x: lerp(78, 50, u), y: lerp(28, 49.5, u) };
    }
    return { x: 50, y: 50 };
  }, [t]);

  const drops = useMemo(
    () => Array.from({ length: 78 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2.2,
      duration: 0.55 + Math.random() * 0.75,
      height: 11 + Math.random() * 18,
    })),
    [],
  );

  const caption =
    t < 6500 ? '' :
    t < 11500 ? 'The modern internet is loud.' :
    t < 16500 ? 'Fast. Endless. Cheap.' :
    t < 23500 ? '' :
    t < 29200 ? 'Unseen stories, waiting where you left them.' :
    t < 34800 ? 'Physical space is the only feed.' :
    t < 43000 ? 'Notes wait within 15 meters.' :
    t < 47800 ? '' :
    t < 56000 ? '' :
    t < 65500 ? 'You are never alone here.' :
    '';

  if (hold) {
    return <div className="film-root" />;
  }

  return (
    <div className="film-root">
      {showTablet && (
        <div className="film-layer" style={{ opacity: tabletOpacity }}>
          <div className="film-tablet-stage">
            <div
              className="film-tablet-frame"
              style={{ transform: `translateY(${-tabletY}%) scale(${tabletScale})` }}
            >
              <img src="/promo/tablet.png" alt="" className="film-tablet-photo" />
              <div className="film-feed-mask">
                <div
                  className="film-feed-track"
                  style={{
                    transform: `translateY(${-feedY}px)`,
                    filter: feedBlur > 0.2 ? `blur(${feedBlur}px)` : undefined,
                  }}
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <img key={i} src="/promo/tablet-feed.jpg" alt="" className="film-feed-slice" />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="film-vignette" />
        </div>
      )}

      {showAuth && (
        <div
          className="film-layer film-auth"
          style={{ opacity: authOpacity, transform: `scale(${authZoom})` }}
        >
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

      {showMap && mapKey && (
        <div className="film-layer" style={{ opacity: mapOpacity }}>
          <APIProvider apiKey={mapKey}>
            <Map
              style={{ width: '100%', height: '100%' }}
              defaultCenter={BRIDGE}
              center={{ lat: mapLat, lng: BRIDGE.lng }}
              defaultZoom={16.7}
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
                  icon={note.id === 'focus' && t > 43800 ? '/promo/mail-pin.svg' : '/promo/pin.svg'}
                />
              ))}
            </Map>
          </APIProvider>
          <div className="film-vignette" />
        </div>
      )}

      {showReader && (
        <div className="film-layer film-reader" style={{ opacity: readerOpacity }}>
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
          {t > 51200 && <p className="film-whisper">left in the rain, after dark</p>}
          <div className="film-letter">
            <span className="film-handle" />
            <p className="film-paper">
              {t > 59000
                ? 'You are never alone here. The world is filled with unseen thoughts.'
                : 'If you found this, you were looking. Stay a little longer.'}
            </p>
            {t > 61800 && (
              <div className="film-echo">
                <span>1</span>
                <em>Echo</em>
              </div>
            )}
          </div>
          {t > 63200 && <p className="film-walk">Walk Away</p>}
        </div>
      )}

      {showEnd && (
        <div className="film-layer film-end" style={{ opacity: endOpacity }}>
          <h1>DRIFT</h1>
          <p>Unseen stories, waiting where you left them.</p>
        </div>
      )}

      {caption && t < 65500 && (
        <div className="film-caption" style={{ opacity: showReader && t > 51800 ? 0 : 1 }}>
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
