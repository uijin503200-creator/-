import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, PenLine, Navigation, Mail } from 'lucide-react';
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { Note, User } from '../types.ts';

interface RadarProps {
  user: User;
  token: string;
  onCompose: () => void;
  onRead: (note: Note) => void;
}

const mapStyles = [
  { "elementType": "geometry", "stylers": [{ "color": "#090a0f" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#181b24" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#040508" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "visibility": "off" }] }
];

export default function RadarScreen({ user, token, onCompose, onRead }: RadarProps) {
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [error, setError] = useState<string>('');
  const [nearbyNotes, setNearbyNotes] = useState<Note[]>([]);
  const [scanning, setScanning] = useState(true);
  
  const knownNoteIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    let watchId: number;

    const scanForNotes = async (lat: number, lng: number) => {
      try {
        const res = await fetch(`/api/notes/nearby?lat=${lat}&lng=${lng}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const notes: Note[] = await res.json();
          
          let hasNewNote = false;
          notes.forEach(note => {
            if (!knownNoteIds.current.has(note.id)) {
              hasNewNote = true;
              knownNoteIds.current.add(note.id);
            }
          });

          if (hasNewNote) {
            // Trigger double heartbeat haptic vibration
            if ('vibrate' in navigator) {
              navigator.vibrate([100, 100, 100]);
            }
          }
          
          setNearbyNotes(notes);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const demoLat = Number(import.meta.env.VITE_DEV_DEFAULT_LAT);
    const demoLng = Number(import.meta.env.VITE_DEV_DEFAULT_LNG);
    const useDemoLocation = Number.isFinite(demoLat) && Number.isFinite(demoLng);

    if (useDemoLocation) {
      setLocation({ lat: demoLat, lng: demoLng });
      setError('');
      scanForNotes(demoLat, demoLng);
    } else if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          setError('');
          scanForNotes(latitude, longitude);
        },
        () => {
          setError('Location access required for Drift to function.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }

    const interval = setInterval(() => {
      if (location) {
        scanForNotes(location.lat, location.lng);
      }
    }, 10000); // Poll every 10s as a fallback

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      clearInterval(interval);
    };
  }, [token, location?.lat, location?.lng]);

  const hasNotes = nearbyNotes.length > 0;
  const mapKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  return (
    <APIProvider apiKey={mapKey}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden bg-zinc-950"
      >
        {/* The Map Background */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
          {location && (
            <Map
              defaultZoom={17}
              defaultCenter={location}
              center={location}
              styles={mapStyles}
              disableDefaultUI={true}
              keyboardShortcuts={false}
              gestureHandling="none"
              internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            />
          )}
        </div>

        {/* Background Pulse */}
      <AnimatePresence>
        {scanning && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 2, opacity: [0, 0.1, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
            className={`absolute w-96 h-96 rounded-full border ${hasNotes ? 'border-zinc-300' : 'border-zinc-800'}`}
          />
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full max-w-sm">
        {error ? (
          <div className="text-center text-zinc-500 font-light text-sm tracking-wide">
            {error}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-12 w-full">
            
            <div className="relative">
              {hasNotes ? (
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }} 
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-32 h-32 flex items-center justify-center rounded-full bg-zinc-950 border border-zinc-700 shadow-[0_0_50px_rgba(255,255,255,0.1)] cursor-pointer"
                  onClick={() => onRead(nearbyNotes[0])}
                >
                  <Mail size={32} className="text-zinc-200 stroke-1" />
                </motion.div>
              ) : (
                <div className="w-32 h-32 flex items-center justify-center rounded-full border border-zinc-800/50">
                  <Compass size={24} className="text-zinc-700 stroke-1" />
                </div>
              )}
            </div>
            
            <div className="text-center space-y-2 h-16">
              <h2 className="text-zinc-400 text-sm tracking-widest uppercase">
                {hasNotes ? 'Presence Detected' : 'Scanning'}
              </h2>
              <p className="text-zinc-600 text-xs font-light tracking-wide">
                {hasNotes ? 'A note has drifted within 15 meters.' : 'Walk to discover dormant notes.'}
              </p>
            </div>

          </div>
        )}
      </div>

      <div className="absolute bottom-12 w-full flex justify-center z-10">
        <button 
          onClick={onCompose}
          disabled={user.pagesLeft <= 0}
          className="flex flex-col items-center justify-center w-20 h-20 rounded-full bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-md hover:bg-zinc-900 transition-all disabled:opacity-20 shadow-[0_0_40px_rgba(0,0,0,0.8)]"
        >
          <span className="text-xs text-zinc-300 tracking-[0.2em] uppercase mt-1 font-light">Drop</span>
        </button>
      </div>

      </motion.div>
    </APIProvider>
  );
}
