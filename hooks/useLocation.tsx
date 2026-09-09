import * as Location from 'expo-location';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';

import { DEMO_ORIGIN, LOCATION_POLL_MS } from '@/lib/constants';
import { offsetCoords } from '@/lib/haversine';
import type { Coords } from '@/lib/types';

type LocationState = {
  coords: Coords | null;
  permission: Location.PermissionStatus | null;
  usingDemoLocation: boolean;
  error: string | null;
  walkToward: (target: Coords, meters?: number) => void;
  teleportTo: (coords: Coords) => void;
  resetToOrigin: () => void;
};

const LocationContext = createContext<LocationState | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [permission, setPermission] = useState<Location.PermissionStatus | null>(null);
  const [usingDemoLocation, setUsingDemoLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overrideRef = useRef<Coords | null>(null);

  const applyCoords = useCallback((next: Coords, demo: boolean) => {
    if (overrideRef.current) {
      setCoords(overrideRef.current);
      setUsingDemoLocation(true);
      return;
    }
    setCoords(next);
    setUsingDemoLocation(demo);
  }, []);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!alive) return;
        setPermission(status);

        if (status !== Location.PermissionStatus.GRANTED || Platform.OS === 'web') {
          // Web / denied → cinematic demo origin so the product remains walkable.
          overrideRef.current = null;
          applyCoords(DEMO_ORIGIN, true);
          setError(
            status !== Location.PermissionStatus.GRANTED
              ? 'Location denied — drifting in demo space.'
              : 'Web preview uses a simulated plaza.'
          );
          return;
        }

        const tick = async () => {
          try {
            const pos = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });
            if (!alive) return;
            applyCoords(
              { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
              false
            );
            setError(null);
          } catch (e) {
            if (!alive) return;
            applyCoords(DEMO_ORIGIN, true);
            setError(e instanceof Error ? e.message : 'Location unavailable');
          }
        };

        await tick();
        timer = setInterval(tick, LOCATION_POLL_MS);
      } catch (e) {
        if (!alive) return;
        applyCoords(DEMO_ORIGIN, true);
        setError(e instanceof Error ? e.message : 'Location unavailable');
      }
    })();

    return () => {
      alive = false;
      if (timer) clearInterval(timer);
    };
  }, [applyCoords]);

  const teleportTo = useCallback((next: Coords) => {
    overrideRef.current = next;
    setCoords(next);
    setUsingDemoLocation(true);
  }, []);

  const walkToward = useCallback((target: Coords, _meters = 12) => {
    // Place the walker ~8m from the note so the 15m discovery radius fires.
    const near = offsetCoords(target, 8, 0);
    overrideRef.current = near;
    setCoords(near);
    setUsingDemoLocation(true);
  }, []);

  const resetToOrigin = useCallback(() => {
    overrideRef.current = DEMO_ORIGIN;
    setCoords(DEMO_ORIGIN);
    setUsingDemoLocation(true);
  }, []);

  const value = useMemo(
    () => ({
      coords,
      permission,
      usingDemoLocation,
      error,
      walkToward,
      teleportTo,
      resetToOrigin,
    }),
    [coords, permission, usingDemoLocation, error, walkToward, teleportTo, resetToOrigin]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation(): LocationState {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}