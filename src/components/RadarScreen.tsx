import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Mail } from 'lucide-react';
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY } from '../lib/maps.ts';
import { Note, User } from '../types.ts';

const FALLBACK_LOCATION = { lat: 37.5665, lng: 126.9780 };

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
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "visibility": "off" }] },
  { "featureType": "landscape.man_made", "elementType": "geometry.fill", "stylers": [{ "color": "#0c0e14" }] },
  { "featureType": "landscape.man_made", "elementType": "geometry.stroke", "stylers": [{ "color": "#1a1d26" }] }
];

export default function RadarScreen({ user, token, onCompose, onRead }: RadarProps) {
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [error, setError] = useState<string>('');
  const [nearbyNotes, setNearbyNotes] = useState<Note[]>([]);
  const [scanning, setScanning] = useState(true);
  const [isSonarActive, setIsSonarActive] = useState(false);
  
  const knownNoteIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    let watchId: number;

    const scanForNotes = async (lat: number, lng: number) => {
      try {
        if (token === 'demo') return;
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

    const useFallbackLocation = () => {
      setLocation(FALLBACK_LOCATION);
      scanForNotes(FALLBACK_LOCATION.lat, FALLBACK_LOCATION.lng);
    };

    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          setError('');
          scanForNotes(latitude, longitude);
        },
        () => {
          useFallbackLocation();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    } else {
      useFallbackLocation();
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [token]);

  // Use a separate effect for the polling to avoid resetting watchPosition
  useEffect(() => {
    const scanForNotes = async (lat: number, lng: number) => {
      try {
        if (token === 'demo') return;
        const res = await fetch(`/api/notes/nearby?lat=${lat}&lng=${lng}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const notes: Note[] = await res.json();
          setNearbyNotes(notes);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const interval = setInterval(() => {
      if (location) {
        scanForNotes(location.lat, location.lng);
      }
    }, 10000); 

    return () => clearInterval(interval);
  }, [token, location]);

  const hasNotes = nearbyNotes.length > 0;

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden bg-zinc-950"
      >
        {/* The Map Background */}
        <div className="absolute inset-0 z-0 opacity-60">
          {location && (
            <Map
              defaultZoom={16}
              center={location}
              styles={mapStyles}
              disableDefaultUI={true}
              keyboardShortcuts={false}
              gestureHandling="greedy"
              internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            />
          )}
          {isSonarActive && (
            <div className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none">
              <div className="relative flex items-center justify-center w-0 h-0">
                {[0, 1].map(delay => (
                  <div
                    key={delay}
                    className={`absolute w-32 h-32 rounded-full border-[3px] border-zinc-200 bg-zinc-100/20 pointer-events-none opacity-0 animate-ping-sonar ${delay === 1 ? 'delay-1000' : ''}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Background Pulse */}
      <AnimatePresence>
        {scanning && (
          <div
            className={`absolute w-96 h-96 rounded-full border pointer-events-none opacity-0 animate-ping-radar ${hasNotes ? 'border-zinc-300 bg-zinc-300/5' : 'border-zinc-700 bg-zinc-700/5'}`}
          />
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full max-w-sm pointer-events-none">
        {error ? (
          <div className="text-center text-zinc-500 font-light text-sm tracking-wide">
            {error}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-12 w-full">
            
            <div className="relative pointer-events-auto">
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
            
            <div className="text-center space-y-2 h-16 pointer-events-auto">
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

      <div className="absolute bottom-12 w-full flex justify-center z-10 pointer-events-none">
        <button 
          onClick={onCompose}
          disabled={user.pagesLeft <= 0}
          className="pointer-events-auto flex flex-col items-center justify-center w-20 h-20 rounded-full bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-md hover:bg-zinc-900 transition-all disabled:opacity-20 shadow-[0_0_40px_rgba(0,0,0,0.8)]"
        >
          <span className="text-xs text-zinc-300 tracking-[0.2em] uppercase mt-1 font-light">Drop</span>
        </button>
      </div>

      <div className="absolute bottom-12 right-12 z-10">
        <button
          onPointerDown={() => setIsSonarActive(true)}
          onPointerUp={() => setIsSonarActive(false)}
          onPointerLeave={() => setIsSonarActive(false)}
          className={`flex items-center justify-center w-16 h-16 rounded-full border transition-all shadow-[0_0_30px_rgba(255,255,255,0.05)] ${
            isSonarActive 
              ? 'bg-zinc-800 border-zinc-400 scale-95 shadow-[0_0_50px_rgba(255,255,255,0.2)]' 
              : 'bg-zinc-950/80 border-zinc-800/80 backdrop-blur-md hover:bg-zinc-900'
          }`}
        >
           <span className={`text-[10px] tracking-[0.2em] uppercase font-light ${isSonarActive ? 'text-zinc-200' : 'text-zinc-500'}`}>
             Sonar
           </span>
        </button>
      </div>

      </motion.div>
    </APIProvider>
  );
}
