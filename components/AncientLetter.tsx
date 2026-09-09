import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, typography } from '@/lib/theme';

type Props = {
  visible: boolean;
  content: string;
  onClose: () => void;
};

/** Ancient typed letter — message fades in, centered in the dark. */
export function AncientLetter({ visible, content, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const ink = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      ink.value = 0;
      ink.value = withDelay(
        180,
        withTiming(1, { duration: 1600, easing: Easing.out(Easing.cubic) })
      );
    } else {
      ink.value = 0;
    }
  }, [visible, content, ink]);

  const letterStyle = useAnimatedStyle(() => ({
    opacity: ink.value,
    transform: [{ translateY: (1 - ink.value) * 10 }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close letter" />

        {visible ? (
          <Animated.View entering={FadeIn.duration(400)} style={styles.stage}>
            <Text style={styles.kicker}>A Drift found you</Text>
            <Animated.View style={[styles.letter, letterStyle]}>
              <Text style={styles.body}>{content}</Text>
            </Animated.View>
            <Pressable onPress={onClose} hitSlop={16} style={styles.closeHit}>
              <Text style={styles.close}>Let it rest</Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.void,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  stage: {
    alignItems: 'center',
    gap: 36,
  },
  kicker: {
    fontFamily: typography.label,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: palette.mist,
    textAlign: 'center',
  },
  letter: {
    width: '100%',
    maxWidth: 360,
    paddingVertical: 28,
    paddingHorizontal: 8,
  },
  body: {
    fontFamily: 'SpaceMono',
    fontSize: 17,
    lineHeight: 30,
    letterSpacing: 0.6,
    color: palette.paper,
    textAlign: 'center',
  },
  closeHit: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  close: {
    fontFamily: typography.label,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: palette.mist,
  },
});
