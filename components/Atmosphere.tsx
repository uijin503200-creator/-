import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { palette } from '@/lib/theme';

/** Full-bleed midnight atmosphere — no flat single-color backdrop. */
export function Atmosphere({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[palette.void, palette.abyss, palette.midnight, '#0B1528']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.haze} pointerEvents="none" />
      <View style={styles.vignette} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.void,
  },
  haze: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(61, 126, 255, 0.04)',
  },
  vignette: {
    ...StyleSheet.absoluteFill,
    borderWidth: 0,
    shadowColor: '#000',
    backgroundColor: 'transparent',
    // soft edge darkening via layered opacity ring approximation
    borderColor: 'transparent',
  },
});