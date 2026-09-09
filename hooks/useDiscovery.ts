import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { DISCOVERY_POLL_MS, DISCOVERY_RADIUS_METERS } from '@/lib/constants';
import { discoverUnreadNotes, markRead } from '@/lib/notes-service';
import type { Coords, NearbyNote } from '@/lib/types';

/**
 * Discovery mechanic: every 10s, sense GPS + nearby_notes (15m).
 * Unread notes trigger a double heartbeat and surface as an envelope.
 */
export function useDiscovery() {
  const { userId } = useAuth();
  const { coords: liveCoords } = useLocation();
  const [envelope, setEnvelope] = useState<NearbyNote | null>(null);
  const [letterOpen, setLetterOpen] = useState(false);
  const [sensing, setSensing] = useState(false);
  const alerted = useRef<Set<string>>(new Set());

  const sense = useCallback(async () => {
    if (!userId) return;
    setSensing(true);
    try {
      const coords = await resolveCoords(liveCoords);
      if (!coords) return;

      const unread = await discoverUnreadNotes(coords, userId);
      if (unread.length === 0) {
        setEnvelope(null);
        return;
      }

      const next = unread[0];
      setEnvelope(next);

      if (!alerted.current.has(next.id)) {
        alerted.current.add(next.id);
        await doubleHeartbeat();
      }
    } catch {
      // Silent — discovery is best-effort.
    } finally {
      setSensing(false);
    }
  }, [userId, liveCoords]);

  useEffect(() => {
    void sense();
    const id = setInterval(() => void sense(), DISCOVERY_POLL_MS);
    return () => clearInterval(id);
  }, [sense]);

  // If location jumps (walk-toward), sense immediately.
  useEffect(() => {
    void sense();
  }, [liveCoords?.latitude, liveCoords?.longitude, sense]);

  const openEnvelope = useCallback(async () => {
    if (!envelope || !userId) return;
    try {
      await markRead(envelope.id, userId);
    } catch {
      // Still show the letter even if stamp fails.
    }
    setLetterOpen(true);
  }, [envelope, userId]);

  const closeLetter = useCallback(() => {
    setLetterOpen(false);
    setEnvelope(null);
  }, []);

  return {
    envelope,
    letterOpen,
    sensing,
    radiusMeters: DISCOVERY_RADIUS_METERS,
    openEnvelope,
    closeLetter,
    senseNow: sense,
  };
}

async function resolveCoords(fallback: Coords | null): Promise<Coords | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === Location.PermissionStatus.GRANTED) {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
    }
  } catch {
    // fall through
  }
  return fallback;
}

/** Double heartbeat: thud… thud */
export async function doubleHeartbeat() {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await delay(220);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {
    // Haptics unavailable.
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
