import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { palette, typography } from '@/lib/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'echo';
  style?: ViewStyle;
};

export function GhostButton({ label, onPress, disabled, variant = 'primary', style }: Props) {
  const pressed = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({
    opacity: withTiming(disabled ? 0.35 : 1 - pressed.value * 0.25, { duration: 120 }),
    transform: [{ scale: withTiming(1 - pressed.value * 0.02, { duration: 120 }) }],
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        pressed.value = 1;
      }}
      onPressOut={() => {
        pressed.value = 0;
      }}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'ghost' && styles.ghost,
        variant === 'echo' && styles.echo,
        style,
        anim,
      ]}>
      <Text
        style={[
          styles.label,
          variant === 'primary' && styles.labelPrimary,
          variant === 'ghost' && styles.labelGhost,
          variant === 'echo' && styles.labelEcho,
        ]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.paper,
  },
  ghost: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.line,
  },
  echo: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.echo,
  },
  label: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  labelPrimary: {
    color: palette.paper,
  },
  labelGhost: {
    color: palette.mist,
  },
  labelEcho: {
    color: palette.echo,
  },
});