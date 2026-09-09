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
  intensity?: number;
  discovered?: boolean;
};

function Ring({ delay, scaleTo, discovered }: { delay: number; scaleTo: number; discovered: boolean }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: discovered ? 2200 : 3200, easing: Easing.out(Easing.cubic) }),
        -1,
        false
      )
    );
  }, [delay, discovered, t]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.15, 1], [0, discovered ? 0.45 : 0.22, 0]),
    transform: [{ scale: interpolate(t.value, [0, 1], [0.35, scaleTo]) }],
  }));

  return <Animated.View style={[styles.ring, discovered && styles.ringHot, style]} />;
}

export function PulseField({ intensity = 1, discovered = false }: Props) {
  const core = useSharedValue(0.85);

  useEffect(() => {
    core.value = withRepeat(
      withTiming(1, { duration: discovered ? 900 : 1600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [core, discovered]);

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: core.value * (0.9 + intensity * 0.15) }],
    opacity: interpolate(core.value, [0.85, 1], [0.55, 0.95]),
  }));

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Ring delay={0} scaleTo={2.4} discovered={discovered} />
      <Ring delay={700} scaleTo={2.1} discovered={discovered} />
      <Ring delay={1400} scaleTo={1.8} discovered={discovered} />
      <Animated.View style={[styles.core, discovered && styles.coreHot, coreStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.pulseSoft,
  },
  ringHot: {
    borderColor: 'rgba(94, 200, 255, 0.55)',
  },
  core: {
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: palette.pulse,
    shadowColor: palette.pulse,
    shadowOpacity: 0.8,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  coreHot: {
    backgroundColor: palette.echo,
    shadowColor: palette.echo,
  },
});