import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Atmosphere } from '@/components/Atmosphere';
import { FadeIn } from '@/components/FadeIn';
import { GhostButton } from '@/components/GhostButton';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { MAX_NOTE_LENGTH } from '@/lib/constants';
import { dropNote } from '@/lib/notes-service';
import { palette, typography } from '@/lib/theme';

export default function DropScreen() {
  const insets = useSafeAreaInsets();
  const { userId, profile, refreshProfile } = useAuth();
  const { coords } = useLocation();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_NOTE_LENGTH - content.length;
  const canDrop =
    !!userId && !!coords && content.trim().length > 0 && (profile?.pages ?? 0) > 0 && !submitting;

  const onDrop = async () => {
    if (!userId || !coords || !canDrop) return;
    setSubmitting(true);
    setError(null);
    try {
      await dropNote(userId, coords, content);
      await refreshProfile();
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The note slipped away.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Atmosphere>
      <KeyboardAvoidingView
        style={[styles.frame, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FadeIn>
          <Pressable onPress={() => router.back()} hitSlop={16}>
            <Text style={styles.back}>Close</Text>
          </Pressable>
        </FadeIn>

        <FadeIn delay={100} style={styles.body}>
          <Text style={styles.title}>Leave a note</Text>
          <Text style={styles.sub}>
            It will sleep here until someone walks within fifteen meters. One page, one note.
          </Text>
          <TextInput
            value={content}
            onChangeText={(t) => setContent(t.slice(0, MAX_NOTE_LENGTH))}
            placeholder="Write something that belongs to this place…"
            placeholderTextColor={palette.mist}
            multiline
            autoFocus
            style={[styles.input, styles.inputWeb]}
            textAlignVertical="top"
          />
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{remaining}</Text>
            <Text style={styles.meta}>{profile?.pages ?? 0} pages left</Text>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </FadeIn>

        <FadeIn delay={200}>
          <GhostButton
            label={submitting ? 'Settling…' : 'Drop here'}
            onPress={onDrop}
            disabled={!canDrop}
          />
        </FadeIn>
      </KeyboardAvoidingView>
    </Atmosphere>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  back: {
    fontFamily: typography.label,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: palette.mist,
  },
  body: {
    flex: 1,
    paddingTop: 36,
    gap: 18,
  },
  title: {
    fontFamily: typography.display,
    fontSize: 40,
    color: palette.paper,
  },
  sub: {
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 24,
    color: palette.fog,
  },
  input: {
    flexGrow: 1,
    minHeight: 180,
    fontFamily: typography.displayItalic,
    fontSize: 26,
    lineHeight: 36,
    color: palette.paper,
    padding: 0,
    borderWidth: 0,
  },
  inputWeb: Platform.select({
    web: { outlineWidth: 0 } as object,
    default: {},
  }),
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    fontFamily: typography.body,
    fontSize: 12,
    color: palette.mist,
    letterSpacing: 1,
  },
  error: {
    fontFamily: typography.body,
    fontSize: 13,
    color: palette.danger,
  },
});