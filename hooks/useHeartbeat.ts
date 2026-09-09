import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { DISCOVERY_RADIUS_METERS } from '@/lib/constants';
import type { NearbyNote } from '@/lib/types';

/** Heartbeat haptic when crossing into a note's 15m radius for the first time. */
export function useHeartbeat(nearby: NearbyNote[]) {
  const triggered = useRef<Set<string>>(new Set());

  useEffect(() => {
    const inRange = nearby.filter((n) => n.distanceMeters <= DISCOVERY_RADIUS_METERS);
    for (const note of inRange) {
      if (triggered.current.has(note.id)) continue;
      triggered.current.add(note.id);
      void pulseHeartbeat();
    }

    // Clear triggers for notes we walked away from so re-entry can pulse again.
    for (const id of [...triggered.current]) {
      const stillNear = nearby.some(
        (n) => n.id === id && n.distanceMeters <= DISCOVERY_RADIUS_METERS * 2
      );
      if (!stillNear) triggered.current.delete(id);
    }
  }, [nearby]);
}

async function pulseHeartbeat() {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await delay(180);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await delay(220);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics unavailable — silent fail.
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}