import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Atmosphere } from '@/components/Atmosphere';
import { FadeIn } from '@/components/FadeIn';
import { GhostButton } from '@/components/GhostButton';
import { PagesMeter } from '@/components/PagesMeter';
import { PulseField } from '@/components/PulseField';
import { useAuth } from '@/hooks/useAuth';
import { useHeartbeat } from '@/hooks/useHeartbeat';
import { useLocation } from '@/hooks/useLocation';
import { useNotes } from '@/hooks/useNotes';
import { DISCOVERY_RADIUS_METERS } from '@/lib/constants';
import { formatRemaining, remainingLifeMs } from '@/lib/decay';
import { withinDiscovery } from '@/lib/notes-service';
import { palette, typography } from '@/lib/theme';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile, loading: authLoading, demoMode } = useAuth();
  const { coords, usingDemoLocation, error: locError, walkToward, hardResetDemo } = useLocation();
  const { notes, loading: notesLoading } = useNotes();
  useHeartbeat(notes);

  const discoverable = useMemo(
    () => notes.filter((n) => withinDiscovery(n.distanceMeters)),
    [notes]
  );
  const closest = notes[0] ?? null;
  const inRange = discoverable.length > 0;

  if (authLoading || !coords) {
    return (
      <Atmosphere>
        <View style={styles.center}>
          <ActivityIndicator color={palette.pulse} />
          <Text style={styles.loadingCopy}>Finding your place in the dark…</Text>
        </View>
      </Atmosphere>
    );
  }

  return (
    <Atmosphere>
      <View style={[styles.frame, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24 }]}>
        <FadeIn>
          <Text style={styles.brand}>Drift</Text>
        </FadeIn>

        <FadeIn delay={120} style={styles.pulseBlock}>
          <PulseField intensity={inRange ? 1.4 : 1} discovered={inRange} />
          <Text style={styles.pulseCaption}>
            {inRange
              ? 'A note is breathing near you'
              : notesLoading
                ? 'Listening…'
                : closest
                  ? `${Math.round(closest.distanceMeters)}m to the nearest whisper`
                  : 'No notes within reach'}
          </Text>
        </FadeIn>

        <FadeIn delay={240} style={styles.middle}>
          {inRange ? (
            <View style={styles.discoverList}>
              {discoverable.map((note) => (
                <Pressable
                  key={note.id}
                  onPress={() => router.push(`/note/${note.id}`)}
                  style={styles.discoverRow}>
                  <Text style={styles.discoverTitle}>Open note</Text>
                  <Text style={styles.discoverMeta}>
                    {note.is_dormant ? 'dormant' : formatRemaining(remainingLifeMs(note))}
                    {' · '}
                    {Math.round(note.distanceMeters)}m
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.verse}>
              Notes wait in the world.{'\n'}Walk within {DISCOVERY_RADIUS_METERS} meters to wake them.
            </Text>
          )}
        </FadeIn>

        <FadeIn delay={360} style={styles.footer}>
          <PagesMeter pages={profile?.pages ?? 0} />
          <GhostButton
            label="Leave a note"
            onPress={() => router.push('/drop')}
            disabled={(profile?.pages ?? 0) <= 0}
            style={styles.cta}
          />
          {(demoMode || usingDemoLocation) && closest && !inRange ? (
            <GhostButton
              label="Walk toward nearest"
              variant="ghost"
              onPress={() => walkToward(closest)}
              style={styles.demoBtn}
            />
          ) : null}
          {usingDemoLocation ? (
            <Pressable
              onPress={async () => {
                await hardResetDemo();
                // Full reload so demo seeds rehydrate cleanly in web preview.
                if (typeof window !== 'undefined') window.location.reload();
              }}
              hitSlop={12}>
              <Text style={styles.demoHint}>
                {locError ?? 'Demo location'} · reset plaza
              </Text>
            </Pressable>
          ) : null}
        </FadeIn>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingCopy: {
    fontFamily: typography.body,
    color: palette.mist,
    fontSize: 14,
  },
  brand: {
    fontFamily: typography.display,
    fontSize: 56,
    color: palette.paper,
    letterSpacing: 1,
    textAlign: 'center',
  },
  pulseBlock: {
    alignItems: 'center',
    gap: 22,
  },
  pulseCaption: {
    fontFamily: typography.body,
    fontSize: 15,
    color: palette.fog,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  middle: {
    minHeight: 88,
    justifyContent: 'center',
  },
  verse: {
    fontFamily: typography.displayItalic,
    fontSize: 22,
    lineHeight: 32,
    color: palette.mist,
    textAlign: 'center',
  },
  discoverList: {
    gap: 18,
  },
  discoverRow: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  discoverTitle: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: palette.echo,
  },
  discoverMeta: {
    fontFamily: typography.body,
    fontSize: 13,
    color: palette.mist,
  },
  footer: {
    alignItems: 'center',
    gap: 22,
  },
  cta: {
    minWidth: 200,
  },
  demoBtn: {
    minWidth: 220,
  },
  demoHint: {
    fontFamily: typography.body,
    fontSize: 11,
    color: palette.mist,
    opacity: 0.7,
    textAlign: 'center',
  },
});