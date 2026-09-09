import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Atmosphere } from '@/components/Atmosphere';
import { FadeIn } from '@/components/FadeIn';
import { GhostButton } from '@/components/GhostButton';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { formatRemaining, remainingLifeMs } from '@/lib/decay';
import {
  echoNote,
  fetchNoteById,
  hasEchoed,
  markRead,
  withinDiscovery,
} from '@/lib/notes-service';
import { palette, typography } from '@/lib/theme';
import type { NearbyNote } from '@/lib/types';

export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { coords } = useLocation();
  const [note, setNote] = useState<NearbyNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [echoed, setEchoed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id || !userId) return;
      try {
        const next = await fetchNoteById(id, coords);
        if (!alive) return;
        if (!next) {
          setError('This note has already faded.');
          setLoading(false);
          return;
        }
        if (!withinDiscovery(next.distanceMeters)) {
          setError('Step closer. Notes only open within fifteen meters.');
          setNote(next);
          setLoading(false);
          return;
        }
        const read = await markRead(next.id, userId);
        const merged = { ...next, ...read, is_dormant: false };
        setNote(merged);
        setEchoed(await hasEchoed(next.id, userId));
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Could not open note');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, userId, coords]);

  const onEcho = async () => {
    if (!note || !userId || echoed || busy) return;
    setBusy(true);
    try {
      const updated = await echoNote(note.id, userId);
      setNote({ ...note, ...updated });
      setEchoed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Echo failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Atmosphere>
      <View style={[styles.frame, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Text style={styles.back}>Return</Text>
        </Pressable>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={palette.pulse} />
          </View>
        ) : error && !note?.content ? (
          <View style={styles.center}>
            <Text style={styles.error}>{error}</Text>
            <GhostButton label="Back" variant="ghost" onPress={() => router.back()} />
          </View>
        ) : note && withinDiscovery(note.distanceMeters) ? (
          <>
            <FadeIn style={styles.body}>
              <Text style={styles.kicker}>
                {note.is_dormant ? 'Awakening' : 'Alive'}
                {' · '}
                {formatRemaining(remainingLifeMs(note))}
              </Text>
              <Text style={styles.content}>{note.content}</Text>
              <Text style={styles.echoMeta}>
                {note.echo_count} {note.echo_count === 1 ? 'echo' : 'echoes'} · each adds +7 days
              </Text>
              {error ? <Text style={styles.errorSoft}>{error}</Text> : null}
            </FadeIn>
            <FadeIn delay={180}>
              <GhostButton
                label={echoed ? 'Echoed' : busy ? 'Sending…' : 'Echo'}
                variant="echo"
                onPress={onEcho}
                disabled={echoed || busy}
              />
            </FadeIn>
          </>
        ) : (
          <View style={styles.center}>
            <Text style={styles.error}>{error ?? 'Too far away.'}</Text>
            {note ? (
              <Text style={styles.distance}>{Math.round(note.distanceMeters)}m away</Text>
            ) : null}
            <GhostButton label="Back" variant="ghost" onPress={() => router.back()} />
          </View>
        )}
      </View>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: 28,
  },
  kicker: {
    fontFamily: typography.label,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: palette.echo,
    textAlign: 'center',
  },
  content: {
    fontFamily: typography.displayItalic,
    fontSize: 32,
    lineHeight: 44,
    color: palette.paper,
    textAlign: 'center',
  },
  echoMeta: {
    fontFamily: typography.body,
    fontSize: 13,
    color: palette.mist,
    textAlign: 'center',
  },
  error: {
    fontFamily: typography.displayItalic,
    fontSize: 22,
    color: palette.fog,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  errorSoft: {
    fontFamily: typography.body,
    fontSize: 13,
    color: palette.danger,
    textAlign: 'center',
  },
  distance: {
    fontFamily: typography.body,
    fontSize: 14,
    color: palette.mist,
  },
});