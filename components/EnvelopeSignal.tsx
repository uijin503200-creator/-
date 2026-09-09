import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { palette } from '@/lib/theme';

type Props = {
  onPress: () => void;
};

/** Mysterious sealed envelope — appears when an unread Drift is within 15m. */
export function EnvelopeSignal({ onPress }: Props) {
  const pulse = useSharedValue(0);
  const float = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    float.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [pulse, float]);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.55, 1]),
    transform: [
      { translateY: interpolate(float.value, [0, 1], [0, -6]) },
      { scale: interpolate(pulse.value, [0, 1], [0.96, 1.04]) },
    ],
  }));

  const auraStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.08, 0.28]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.85, 1.25]) }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="An unread Drift is near. Open the envelope."
      onPress={onPress}
      hitSlop={20}
      style={styles.hit}>
      <Animated.View style={[styles.aura, auraStyle]} />
      <Animated.View style={[styles.envelope, wrapStyle]}>
        <View style={styles.body} />
        <View style={styles.flap} />
        <View style={styles.seal} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aura: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: palette.pulse,
  },
  envelope: {
    width: 44,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    position: 'absolute',
    width: 44,
    height: 28,
    bottom: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 238, 247, 0.55)',
    backgroundColor: 'rgba(14, 26, 51, 0.85)',
  },
  flap: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 22,
    borderRightWidth: 22,
    borderTopWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(168, 180, 200, 0.45)',
  },
  seal: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: palette.pulse,
    opacity: 0.85,
    top: 12,
  },
});
