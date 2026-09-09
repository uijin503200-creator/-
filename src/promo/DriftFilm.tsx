import { useEffect, useMemo, useState } from 'react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { Hexagon, Mail } from 'lucide-react';
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
  { id: 'c1', lat: 51.5084, lng: -0.1169, at: 34800 },
  { id: 'c2', lat: 51.50815, lng: -0.11755, at: 35200 },
  { id: 'c3', lat: 51.50872, lng: -0.11625, at: 35600 },
  { id: 'c4', lat: 51.50795, lng: -0.11640, at: 36000 },
  { id: 'c5', lat: 51.50888, lng: -0.11790, at: 36400 },
  { id: 's1', lat: 51.5258, lng: -0.0804, at: 37200 },
  { id: 's2', lat: 51.5264, lng: -0.0816, at: 37600 },
  { id: 's3', lat: 51.5252, lng: -0.0791, at: 38000 },
  { id: 'n1', lat: 51.5130, lng: -0.3048, at: 38400 },
  { id: 'n2', lat: 51.5552, lng: -0.1784, at: 38800 },
  { id: 'n3', lat: 51.4220, lng: -0.2085, at: 39200 },
  { id: 'n4', lat: 51.4613, lng: -0.3038, at: 39600 },
  { id: 'n5', lat: 51.5432, lng: -0.0035, at: 40000 },
  { id: 'n6', lat: 51.4826, lng: -0.0077, at: 40400 },
  { id: 'n7', lat: 51.5054, lng: -0.0235, at: 40800 },
  { id: 'n8', lat: 51.3762, lng: -0.0982, at: 41200 },
  { id: 'n9', lat: 51.5904, lng: -0.0195, at: 41600 },
  { id: 'n10', lat: 51.5079, lng: -0.0877, at: 42000 },
  { id: 'n11', lat: 51.4451, lng: -0.0204, at: 42400 },
  { id: 'n12', lat: 51.5308, lng: -0.1238, at: 42800 },
  { id: 'n13', lat: 51.4874, lng: -0.1682, at: 43200 },
  { id: 'n14', lat: 51.6530, lng: -0.2004, at: 43600 },
  { id: 'n15', lat: 51.4740, lng: -0.0694, at: 44000 },
  { id: 'n16', lat: 51.4994, lng: -0.1276, at: 44400 },
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
    const seek = Number(new URLSearchParams(window.location.search).get('seek') || 0);
    const origin = performance.now() - seek;
    let frame = 0;
    const tick = (now: number) => {
      setT(now - origin);
      if (now - origin < 94000) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [hold]);

  useEffect(() => {
    if (t < 58500) return undefined;
    const ambience = startWeatherAmbience('Rain', 'Night');
    return () => ambience.stop();
  }, [t >= 58500]);

  const showTablet = t < 20500;
  const showAuth = t >= 16800 && t < 30500;
  const showMap = t >= 20000 && t < 60500;
  const showRadar = t >= 50500 && t < 60500;
  const showReader = t >= 58500 && t < 79000;
  const showEnd = t >= 76500;

  const tabletY = lerp(0, 4.2, easeInOut(span(t, 400, 16000)));
  const tabletScale = t < 14500 ? 1 : lerp(1, 1.38, easeInOut(span(t, 14500, 18800)));
  const feedProgress = easeInCubic(span(t, 500, 16800));
  const feedY = lerp(0, 1680, feedProgress);
  const feedBlur = lerp(0, 5.5, span(t, 11000, 16800));
  const tabletOpacity = 1 - span(t, 16800, 19800);
  const authOpacity = span(t, 17200, 19600) * (1 - span(t, 28800, 30400));
  const authZoom = lerp(1, 1.12, easeInOut(span(t, 22800, 27200)));
  const enterHot = t >= 26800 && t < 29600;

  const mapOpacity = span(t, 29200, 30800) * (1 - span(t, 58800, 60400));
  const mapZoom =
    t < 32800 ? 16.7 :
    t < 40200 ? lerp(16.7, 10.55, easeInOut(span(t, 32800, 40200))) :
    t < 45800 ? 10.55 :
    lerp(10.55, 16.4, easeInOut(span(t, 45800, 50800)));
  const pinOpacity = 1 - span(t, 50800, 52800);
  const mapWash = showRadar ? lerp(1, 0.55, span(t, 50500, 52800)) : 1;

  const readerOpacity = span(t, 58800, 60400) * (1 - span(t, 76500, 78600));
  const radarOpacity = span(t, 51200, 53200) * (1 - span(t, 58800, 60400));
  const endOpacity = span(t, 77200, 79800);
  const mailHot = t >= 54800 && t < 58200;

  const cursorVisible = (t >= 23800 && t < 29800) || (t >= 53800 && t < 59000);
  const cursorDown = (t >= 27800 && t < 28700) || (t >= 56400 && t < 57600);
  const cursor = useMemo(() => {
    if (t >= 23800 && t < 29800) {
      const u = easeInOut(span(t, 23800, 27400));
      return { x: lerp(66, 50, u), y: lerp(76, 71.4, u) };
    }
    if (t >= 53800 && t < 59000) {
      const u = easeInOut(span(t, 53800, 56000));
      return { x: lerp(72, 50, u), y: lerp(26, 42.5, u) };
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
    t < 50000 ? 'Notes wait within 15 meters.' :
    t < 58800 ? '' :
    t < 68000 ? '' :
    t < 76500 ? 'You are never alone here.' :
    '';

  const noteText = t > 70000
    ? 'You are never alone here. The world is filled with unseen thoughts.'
    : 'If you found this, you were looking. Stay a little longer.';

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
          <div className="absolute inset-0" style={{ opacity: mapWash }}>
            <APIProvider apiKey={mapKey}>
              <Map
                style={{ width: '100%', height: '100%' }}
                defaultCenter={BRIDGE}
                center={BRIDGE}
                defaultZoom={16.7}
                zoom={mapZoom}
                styles={MAP_STYLES}
                disableDefaultUI
                gestureHandling="none"
                keyboardShortcuts={false}
              >
                {NOTES.filter((note) => t >= note.at && pinOpacity > 0.02).map((note) => (
                  <Marker
                    key={note.id}
                    position={{ lat: note.lat, lng: note.lng }}
                    icon="/promo/pin.svg"
                  />
                ))}
              </Map>
            </APIProvider>
          </div>
          <div className="film-vignette" />
        </div>
      )}

      {showRadar && (
        <div className="film-layer film-radar" style={{ opacity: radarOpacity }}>
          <div className="film-radar-core">
            <span className="film-radar-ring" />
            <span className="film-radar-ring" style={{ animationDelay: '2s' }} />
            <div className={`film-mail-orb ${mailHot ? 'hot' : ''}`}>
              <Mail size={32} strokeWidth={1} className="text-zinc-200" />
            </div>
          </div>
          <div className="film-radar-copy">
            <h2>Presence Detected</h2>
            <p>A note has drifted within 15 meters.</p>
            <span>51.50840, -0.11690 · gps</span>
          </div>
          <div className="film-drop-btn">Drop</div>
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
          {t > 62800 && <p className="film-whisper">left in the rain, after dark</p>}
          <div className="film-letter">
            <span className="film-handle" />
            <p className="film-paper">“{noteText}”</p>
            {t > 71800 && (
              <div className="film-echo-row">
                <em>Echo</em>
              </div>
            )}
          </div>
          {t > 71800 && <p className="film-walk">Walk Away</p>}
        </div>
      )}

      {showEnd && (
        <div className="film-layer film-end" style={{ opacity: endOpacity }}>
          <h1>DRIFT</h1>
          <p>Unseen stories, waiting where you left them.</p>
        </div>
      )}

      {caption && t < 76500 && (
        <div className="film-caption" style={{ opacity: (showReader && t > 62800) || showRadar ? 0 : 1 }}>
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
