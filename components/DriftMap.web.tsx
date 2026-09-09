import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { YouAreHerePulse } from '@/components/YouAreHerePulse';
import { DISCOVERY_RADIUS_METERS } from '@/lib/constants';
import { palette } from '@/lib/theme';
import type { Coords, NearbyNote } from '@/lib/types';

type Props = {
  coords: Coords;
  notes?: NearbyNote[];
  onNotePress?: (noteId: string) => void;
};

/**
 * Web fallback — react-native-maps has no reliable web MapView.
 * Empty dark geography with user pulse + relative nearby note dots.
 */
export function DriftMap({ coords, notes = [], onNotePress }: Props) {
  const projected = useMemo(() => {
    const metersPerPx = 0.55;
    return notes.slice(0, 12).map((n) => {
      const north = (n.latitude - coords.latitude) * 111_320;
      const east =
        (n.longitude - coords.longitude) * 111_320 * Math.cos((coords.latitude * Math.PI) / 180);
      return {
        id: n.id,
        hot: n.distanceMeters <= DISCOVERY_RADIUS_METERS,
        x: east / metersPerPx,
        y: -north / metersPerPx,
      };
    });
  }, [coords, notes]);

  return (
    <View
      style={styles.root}
      accessibilityLabel={`Map centered at ${coords.latitude}, ${coords.longitude}`}>
      <LinearGradient
        colors={['#050505', '#0A0A0A', '#121212', '#050505']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.band, styles.bandA]} />
      <View style={[styles.band, styles.bandB]} />
      <View style={[styles.band, styles.bandC]} />

      <View style={styles.center}>
        <View style={styles.radiusRing} />
        {projected.map((p) => (
          <Pressable
            key={p.id}
            disabled={!p.hot}
            onPress={() => onNotePress?.(p.id)}
            style={[
              styles.noteDot,
              p.hot && styles.noteDotHot,
              { transform: [{ translateX: p.x }, { translateY: p.y }] },
            ]}
          />
        ))}
        <YouAreHerePulse size={12} />
      </View>
      <View style={[styles.vignette, styles.noPointer]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#050505',
  },
  band: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(34, 34, 34, 0.55)',
  },
  bandA: {
    width: '140%',
    height: '55%',
    top: '10%',
    left: '-20%',
    backgroundColor: 'rgba(21, 21, 21, 0.45)',
  },
  bandB: {
    width: '90%',
    height: '35%',
    bottom: '18%',
    right: '-15%',
    backgroundColor: 'rgba(10, 10, 10, 0.65)',
  },
  bandC: {
    width: '70%',
    height: '28%',
    top: '42%',
    left: '-10%',
    backgroundColor: 'rgba(21, 21, 21, 0.28)',
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusRing: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(34, 34, 34, 0.9)',
  },
  noteDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(168, 180, 200, 0.35)',
  },
  noteDotHot: {
    width: 10,
    height: 10,
    backgroundColor: palette.echo,
  },
  vignette: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 5, 5, 0.2)',
  },
  noPointer: {
    pointerEvents: 'none',
  },
});
