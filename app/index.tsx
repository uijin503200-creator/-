import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DriftMap } from '@/components/DriftMap';
import { DropDriftModal } from '@/components/DropDriftModal';
import { FadeIn } from '@/components/FadeIn';
import { GhostButton } from '@/components/GhostButton';
import { PagesMeter } from '@/components/PagesMeter';
import { useAuth } from '@/hooks/useAuth';
import { useHeartbeat } from '@/hooks/useHeartbeat';
import { useLocation } from '@/hooks/useLocation';
import { useNotes } from '@/hooks/useNotes';
import { dropDrift } from '@/lib/drifts';
import { formatRemaining, remainingLifeMs } from '@/lib/decay';
import { withinDiscovery } from '@/lib/notes-service';
import { palette, typography } from '@/lib/theme';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userId, profile, loading: authLoading, demoMode, refreshProfile } = useAuth();
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
  const { notes, loading: notesLoading, refresh } = useNotes();
  useHeartbeat(notes);

  const [asking, setAsking] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);

  const discoverable = useMemo(
    () => notes.filter((n) => withinDiscovery(n.distanceMeters)),
    [notes]
  );
  const closest = notes[0] ?? null;
  const inRange = discoverable.length > 0;
  const granted = permission === Location.PermissionStatus.GRANTED;
  const denied = permission === Location.PermissionStatus.DENIED;
  const pagesLeft = profile?.pages ?? 0;

  const onAllowLocation = async () => {
    setAsking(true);
    try {
      await requestPermission();
    } finally {
      setAsking(false);
    }
  };

  const onSubmitDrift = async (content: string) => {
    if (!userId) return;
    setSubmitting(true);
    setDropError(null);
    try {
      await dropDrift(userId, content, coords);
      await refreshProfile();
      await refresh();
      setDropOpen(false);
    } catch (e) {
      setDropError(e instanceof Error ? e.message : 'The Drift slipped away.');
    } finally {
      setSubmitting(false);
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
        style={[styles.overlay, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 28 }]}
        pointerEvents="box-none">
        <FadeIn>
          <Text style={styles.brandOverlay}>Drift</Text>
          <View style={styles.pagesTop}>
            <PagesMeter pages={pagesLeft} />
          </View>
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

        <View style={styles.footer} pointerEvents="box-none">
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

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Drop a Drift"
            disabled={pagesLeft <= 0}
            onPress={() => {
              setDropError(null);
              setDropOpen(true);
            }}
            style={({ pressed }) => [
              styles.dropFab,
              (pagesLeft <= 0 || pressed) && styles.dropFabDim,
            ]}>
            <Text style={styles.dropLabel}>Drop</Text>
          </Pressable>

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
        </View>
      </View>

      <DropDriftModal
        visible={dropOpen}
        pagesLeft={pagesLeft}
        submitting={submitting}
        error={dropError}
        onClose={() => {
          if (!submitting) setDropOpen(false);
        }}
        onSubmit={onSubmitDrift}
      />
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
  pagesTop: {
    marginTop: 14,
    alignItems: 'center',
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
    gap: 16,
  },
  demoBtn: {
    minWidth: 220,
  },
  dropFab: {
    minWidth: 120,
    paddingVertical: 16,
    paddingHorizontal: 36,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.paper,
  },
  dropFabDim: {
    opacity: 0.35,
  },
  dropLabel: {
    fontFamily: typography.bodyMedium,
    fontSize: 15,
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: palette.paper,
  },
  demoHint: {
    fontFamily: typography.body,
    fontSize: 11,
    color: palette.mist,
    opacity: 0.75,
    textAlign: 'center',
  },
});
