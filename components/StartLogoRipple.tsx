import { MaterialCommunityIcons } from '@expo/vector-icons';
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

type Props = {
  size?: number;
  color?: string;
};

function Ripple({ delayMs, size }: { delayMs: number; size: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withRepeat(withTiming(1, { duration: 3200, easing: Easing.out(Easing.cubic) }), -1, false)
    );
  }, [delayMs, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.15, 1], [0, 0.45, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.55, 2.4]) }],
  }));

  return (
    <Animated.View
      style={[
        styles.ripple,
        {
          width: size * 1.35,
          height: size * 1.35,
          borderRadius: size,
        },
        style,
      ]}
    />
  );
}

/** Subtle outlined hexagon with circular thin-border ripples. */
export function StartLogoRipple({ size = 60, color = '#555555' }: Props) {
  return (
    <View style={[styles.wrap, { width: size * 3.2, height: size * 3.2 }]} accessibilityElementsHidden>
      <Ripple delayMs={0} size={size} />
      <Ripple delayMs={1100} size={size} />
      <Ripple delayMs={2200} size={size} />
      <MaterialCommunityIcons name="hexagon-outline" size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(85, 85, 85, 0.7)',
    backgroundColor: 'transparent',
  },
});
