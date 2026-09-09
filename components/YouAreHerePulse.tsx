import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { palette } from '@/lib/theme';

type Props = {
  size?: number;
  active?: boolean;
};

/** Small, subtle location pulse — for map markers / overlays. */
export function YouAreHerePulse({ size = 14, active = true }: Props) {
  const breath = useSharedValue(0.85);
  const ring = useSharedValue(0);

  useEffect(() => {
    if (!active) return;
    breath.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    ring.value = withRepeat(
      withDelay(200, withTiming(1, { duration: 2400, easing: Easing.out(Easing.cubic) })),
      -1,
      false
    );
  }, [active, breath, ring]);

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value }],
    opacity: interpolate(breath.value, [0.85, 1], [0.7, 1]),
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ring.value, [0, 0.2, 1], [0, 0.35, 0]),
    transform: [{ scale: interpolate(ring.value, [0, 1], [0.6, 2.8]) }],
  }));

  return (
    <View style={[styles.wrap, { width: size * 4, height: size * 4 }]} pointerEvents="none">
      <Animated.View
        style={[
          styles.ring,
          { width: size * 1.6, height: size * 1.6, borderRadius: size },
          ringStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.core,
          { width: size, height: size, borderRadius: size / 2 },
          coreStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.pulseSoft,
    backgroundColor: 'transparent',
  },
  core: {
    backgroundColor: palette.pulse,
    shadowColor: palette.pulse,
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
});
