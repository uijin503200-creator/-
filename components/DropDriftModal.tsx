import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_DRIFT_LENGTH } from '@/lib/constants';
import { palette, typography } from '@/lib/theme';

type Props = {
  visible: boolean;
  pagesLeft: number;
  submitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (content: string) => void | Promise<void>;
};

export function DropDriftModal({
  visible,
  pagesLeft,
  submitting = false,
  error = null,
  onClose,
  onSubmit,
}: Props) {
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState('');
  const veil = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setContent('');
      veil.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    } else {
      veil.value = withTiming(0, { duration: 280 });
    }
  }, [visible, veil]);

  const remaining = MAX_DRIFT_LENGTH - content.length;
  const canSubmit =
    content.trim().length > 0 && pagesLeft > 0 && !submitting && remaining >= 0;

  const veilStyle = useAnimatedStyle(() => ({
    opacity: veil.value,
  }));

  const handleSubmit = () => {
    if (!canSubmit) return;
    void onSubmit(content.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.veil, veilStyle]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheet, { paddingTop: insets.top + 36, paddingBottom: insets.bottom + 28 }]}>
          {visible ? (
            <Animated.View entering={FadeIn.duration(500)} exiting={FadeOut.duration(200)} style={styles.inner}>
              <Pressable onPress={onClose} hitSlop={16}>
                <Text style={styles.dismiss}>Close</Text>
              </Pressable>

              <Text style={styles.whisper}>Leave a Drift</Text>
              <Text style={styles.hint}>It will sleep here until someone walks within fifteen meters.</Text>

              <TextInput
                value={content}
                onChangeText={(t) => setContent(t.slice(0, MAX_DRIFT_LENGTH))}
                placeholder="Write into the dark…"
                placeholderTextColor="rgba(168, 180, 200, 0.35)"
                multiline
                autoFocus
                maxLength={MAX_DRIFT_LENGTH}
                style={[styles.input, styles.inputWeb]}
                textAlignVertical="top"
                selectionColor={palette.pulse}
              />

              <View style={styles.meta}>
                <Text style={styles.metaText}>{remaining}</Text>
                <Text style={styles.metaText}>{pagesLeft} pages</Text>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                accessibilityRole="button"
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={({ pressed }) => [
                  styles.submit,
                  (!canSubmit || pressed) && styles.submitDim,
                ]}>
                <Text style={styles.submitLabel}>{submitting ? 'Settling…' : 'Submit'}</Text>
              </Pressable>
            </Animated.View>
          ) : null}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  veil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: palette.void,
  },
  sheet: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  dismiss: {
    fontFamily: typography.label,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: palette.mist,
    alignSelf: 'flex-start',
  },
  whisper: {
    marginTop: 48,
    fontFamily: typography.display,
    fontSize: 40,
    color: palette.paper,
  },
  hint: {
    marginTop: 12,
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 24,
    color: palette.fog,
  },
  input: {
    flexGrow: 1,
    marginTop: 36,
    minHeight: 160,
    fontFamily: typography.displayItalic,
    fontSize: 28,
    lineHeight: 40,
    color: palette.paper,
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  inputWeb: Platform.select({
    web: {
      outlineWidth: 0,
      outlineStyle: 'none',
      boxShadow: 'none',
      borderWidth: 0,
    } as object,
    default: {},
  }),
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 28,
  },
  metaText: {
    fontFamily: typography.body,
    fontSize: 12,
    letterSpacing: 1,
    color: palette.mist,
  },
  error: {
    fontFamily: typography.body,
    fontSize: 13,
    color: palette.danger,
    marginBottom: 16,
    textAlign: 'center',
  },
  submit: {
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.paper,
  },
  submitDim: {
    opacity: 0.35,
  },
  submitLabel: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: palette.paper,
  },
});
