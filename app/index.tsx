import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DriftMap } from '@/components/DriftMap';
import { FadeIn } from '@/components/FadeIn';
import { GhostButton } from '@/components/GhostButton';
import { PagesMeter } from '@/components/PagesMeter';
import { useAuth } from '@/hooks/useAuth';
import { useHeartbeat } from '@/hooks/useHeartbeat';
import { useLocation } from '@/hooks/useLocation';
import { useNotes } from '@/hooks/useNotes';
import { formatRemaining, remainingLifeMs } from '@/lib/decay';
import { withinDiscovery } from '@/lib/notes-service';
import { palette, typography } from '@/lib/theme';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile, loading: authLoading, demoMode } = useAuth();
  const {
    coords,
    permission,
    permissionReady,
    usingDemoLocation,
    error: locError,
    requestPermission,
    walkToward,
    hardResetDemo,
  } = useLocation();
  const { notes, loading: notesLoading } = useNotes();
  useHeartbeat(notes);

  const [asking, setAsking] = useState(false);

  const discoverable = useMemo(
    () => notes.filter((n) => withinDiscovery(n.distanceMeters)),
    [notes]
  );
  const closest = notes[0] ?? null;
  const inRange = discoverable.length > 0;
  const granted = permission === Location.PermissionStatus.GRANTED;
  const denied = permission === Location.PermissionStatus.DENIED;

  const onAllowLocation = async () => {
    setAsking(true);
    try {
      await requestPermission();
    } finally {
      setAsking(false);
    }
  };

  if (authLoading || !permissionReady) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={palette.pulse} />
        <Text style={styles.bootCopy}>Finding your place in the dark…</Text>
      </View>
    );
  }

  // Permission gate — ask on the main screen before showing the map.
  if (!granted && !coords) {
    return (
      <View style={[styles.boot, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}>
        <FadeIn>
          <Text style={styles.brand}>Drift</Text>
        </FadeIn>
        <FadeIn delay={120} style={styles.permissionBlock}>
          <Text style={styles.permissionTitle}>Where are you standing?</Text>
          <Text style={styles.permissionBody}>
            Drift needs your location to place you on the map and wake notes within fifteen meters.
            Nothing is shared publicly — only your place in the dark.
          </Text>
        </FadeIn>
        <FadeIn delay={220}>
          <GhostButton
            label={asking ? 'Listening…' : 'Allow location'}
            onPress={onAllowLocation}
            disabled={asking}
          />
          {denied ? (
            <Text style={styles.deniedHint}>
              Location is blocked. Enable it in system settings, or continue in demo space.
            </Text>
          ) : null}
          {denied ? (
            <GhostButton
              label="Continue in demo"
              variant="ghost"
              onPress={onAllowLocation}
              style={styles.demoCta}
            />
          ) : null}
        </FadeIn>
      </View>
    );
  }

  // If still no coords after grant/demo, wait briefly.
  if (!coords) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={palette.pulse} />
        <Text style={styles.bootCopy}>Centering the map…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <DriftMap coords={coords} />

      <View
        style={[styles.overlay, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
        pointerEvents="box-none">
        <FadeIn>
          <Text style={styles.brandOverlay}>Drift</Text>
        </FadeIn>

        <View style={styles.middle} pointerEvents="box-none">
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
            <Text style={styles.status}>
              {notesLoading
                ? 'Listening…'
                : closest
                  ? `${Math.round(closest.distanceMeters)}m to the nearest whisper`
                  : 'Empty geography. Walk to wake a note.'}
            </Text>
          )}
        </View>

        <FadeIn delay={160} style={styles.footer}>
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
          {!granted ? (
            <GhostButton label="Allow location" variant="ghost" onPress={onAllowLocation} />
          ) : null}
          {usingDemoLocation ? (
            <Pressable
              onPress={async () => {
                await hardResetDemo();
                if (typeof window !== 'undefined') window.location.reload();
              }}
              hitSlop={12}>
              <Text style={styles.demoHint}>{locError ?? 'Demo location'} · reset plaza</Text>
            </Pressable>
          ) : null}
        </FadeIn>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.void,
  },
  boot: {
    flex: 1,
    backgroundColor: palette.void,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 18,
  },
  bootCopy: {
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
    marginBottom: 28,
  },
  brandOverlay: {
    fontFamily: typography.display,
    fontSize: 42,
    color: palette.paper,
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  permissionBlock: {
    gap: 14,
    marginBottom: 36,
  },
  permissionTitle: {
    fontFamily: typography.displayItalic,
    fontSize: 26,
    color: palette.paper,
    textAlign: 'center',
  },
  permissionBody: {
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 24,
    color: palette.fog,
    textAlign: 'center',
  },
  deniedHint: {
    marginTop: 16,
    fontFamily: typography.body,
    fontSize: 13,
    color: palette.mist,
    textAlign: 'center',
  },
  demoCta: {
    marginTop: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  middle: {
    alignItems: 'center',
  },
  status: {
    fontFamily: typography.body,
    fontSize: 14,
    color: palette.fog,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  discoverList: {
    gap: 14,
  },
  discoverRow: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
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
    gap: 18,
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
    opacity: 0.75,
    textAlign: 'center',
  },
});
