import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { YouAreHerePulse } from '@/components/YouAreHerePulse';
import { palette } from '@/lib/theme';
import type { Coords } from '@/lib/types';

type Props = {
  coords: Coords;
};

/**
 * Web fallback — react-native-maps has no reliable web MapView.
 * Renders empty dark geography with a centered pulse at the user's coords.
 */
export function DriftMap({ coords }: Props) {
  return (
    <View style={styles.root} accessibilityLabel={`Map centered at ${coords.latitude}, ${coords.longitude}`}>
      <LinearGradient
        colors={['#05070D', '#0B1524', '#121926', '#0A1220']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Soft terrain bands — empty geography, no labels */}
      <View style={[styles.band, styles.bandA]} />
      <View style={[styles.band, styles.bandB]} />
      <View style={[styles.band, styles.bandC]} />
      <View style={styles.center}>
        <YouAreHerePulse size={12} />
      </View>
      <View style={styles.vignette} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: palette.void,
  },
  band: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(61, 126, 255, 0.06)',
  },
  bandA: {
    width: '140%',
    height: '55%',
    top: '10%',
    left: '-20%',
    backgroundColor: 'rgba(18, 25, 38, 0.55)',
  },
  bandB: {
    width: '90%',
    height: '35%',
    bottom: '18%',
    right: '-15%',
    backgroundColor: 'rgba(7, 16, 28, 0.7)',
  },
  bandC: {
    width: '70%',
    height: '28%',
    top: '42%',
    left: '-10%',
    backgroundColor: 'rgba(22, 32, 48, 0.35)',
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vignette: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 7, 13, 0.22)',
  },
});
