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
import { clearDemoStorage } from '@/lib/demo-store';
import { offsetCoords } from '@/lib/haversine';
import type { Coords } from '@/lib/types';

type LocationState = {
  coords: Coords | null;
  permission: Location.PermissionStatus | null;
  permissionReady: boolean;
  usingDemoLocation: boolean;
  error: string | null;
  requestPermission: () => Promise<Location.PermissionStatus>;
  walkToward: (target: Coords, meters?: number) => void;
  teleportTo: (coords: Coords) => void;
  resetToOrigin: () => void;
  hardResetDemo: () => Promise<void>;
};

const LocationContext = createContext<LocationState | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [permission, setPermission] = useState<Location.PermissionStatus | null>(null);
  const [permissionReady, setPermissionReady] = useState(false);
  const [usingDemoLocation, setUsingDemoLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overrideRef = useRef<Coords | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyCoords = useCallback((next: Coords, demo: boolean) => {
    if (overrideRef.current) {
      setCoords(overrideRef.current);
      setUsingDemoLocation(true);
      return;
    }
    setCoords(next);
    setUsingDemoLocation(demo);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startGpsPolling = useCallback(async () => {
    stopPolling();
    const tick = async () => {
      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        applyCoords(
          { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
          false
        );
        setError(null);
      } catch (e) {
        applyCoords(DEMO_ORIGIN, true);
        setError(e instanceof Error ? e.message : 'Location unavailable');
      }
    };
    await tick();
    pollRef.current = setInterval(() => void tick(), LOCATION_POLL_MS);
  }, [applyCoords, stopPolling]);

  const useDemoCoords = useCallback(
    (message: string) => {
      stopPolling();
      overrideRef.current = null;
      applyCoords(DEMO_ORIGIN, true);
      setError(message);
    },
    [applyCoords, stopPolling]
  );

  // Read existing permission on mount — do not prompt until the main screen asks.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const current = await Location.getForegroundPermissionsAsync();
        if (!alive) return;
        setPermission(current.status);
        if (current.status === Location.PermissionStatus.GRANTED && Platform.OS !== 'web') {
          await startGpsPolling();
        } else if (current.status === Location.PermissionStatus.GRANTED && Platform.OS === 'web') {
          useDemoCoords('Web preview uses a simulated plaza.');
        }
      } finally {
        if (alive) setPermissionReady(true);
      }
    })();
    return () => {
      alive = false;
      stopPolling();
    };
  }, [startGpsPolling, stopPolling, useDemoCoords]);

  const requestPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermission(status);
    setPermissionReady(true);

    if (status === Location.PermissionStatus.GRANTED) {
      if (Platform.OS === 'web') {
        useDemoCoords('Web preview uses a simulated plaza.');
      } else {
        overrideRef.current = null;
        await startGpsPolling();
      }
    } else {
      useDemoCoords('Location denied — drifting in demo space.');
    }
    return status;
  }, [startGpsPolling, useDemoCoords]);

  const teleportTo = useCallback((next: Coords) => {
    overrideRef.current = next;
    setCoords(next);
    setUsingDemoLocation(true);
  }, []);

  const walkToward = useCallback((target: Coords, _meters = 12) => {
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

  const hardResetDemo = useCallback(async () => {
    await clearDemoStorage();
    overrideRef.current = DEMO_ORIGIN;
    setCoords({ ...DEMO_ORIGIN });
    setUsingDemoLocation(true);
  }, []);

  const value = useMemo(
    () => ({
      coords,
      permission,
      permissionReady,
      usingDemoLocation,
      error,
      requestPermission,
      walkToward,
      teleportTo,
      resetToOrigin,
      hardResetDemo,
    }),
    [
      coords,
      permission,
      permissionReady,
      usingDemoLocation,
      error,
      requestPermission,
      walkToward,
      teleportTo,
      resetToOrigin,
      hardResetDemo,
    ]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation(): LocationState {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
