import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AncientLetter } from '@/components/AncientLetter';
import { DriftMap } from '@/components/DriftMap';
import { DropDriftModal } from '@/components/DropDriftModal';
import { FadeIn } from '@/components/FadeIn';
import { GhostButton } from '@/components/GhostButton';
import { RadarOverlay } from '@/components/RadarOverlay';
import { useAuth } from '@/hooks/useAuth';
import { useDiscovery } from '@/hooks/useDiscovery';
import { useLocation } from '@/hooks/useLocation';
import { useNotes } from '@/hooks/useNotes';
import { dropDrift } from '@/lib/drifts';
import { palette, typography } from '@/lib/theme';

export default function MapScreen() {
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
  const { notes, refresh } = useNotes();
  const { envelope, letterOpen, openEnvelope, closeLetter, senseNow } = useDiscovery();

  const [asking, setAsking] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);

  const closest = notes[0] ?? null;
  const granted = permission === Location.PermissionStatus.GRANTED;
  const denied = permission === Location.PermissionStatus.DENIED;
  const pagesLeft = profile?.pages ?? 0;
  const presenceDetected = !!envelope && !letterOpen;

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
      <DriftMap
        coords={coords}
        notes={notes}
        onNotePress={(id) => router.push(`/note/${id}`)}
      />

      <RadarOverlay presenceDetected={presenceDetected} onOpenEnvelope={openEnvelope} />

      <View
        style={[styles.hud, { paddingBottom: Math.max(insets.bottom, 16) + 20, paddingTop: insets.top + 12 }]}
        pointerEvents="box-none">
        <View style={styles.topHud} pointerEvents="box-none">
          {(demoMode || usingDemoLocation) && closest && !presenceDetected ? (
            <Pressable
              onPress={() => {
                walkToward(closest);
                void senseNow();
              }}
              hitSlop={10}
              style={styles.ghostLink}>
              <Text style={styles.ghostLinkText}>WALK TOWARD</Text>
            </Pressable>
          ) : null}
          {!granted ? (
            <Pressable onPress={onAllowLocation} hitSlop={10} style={styles.ghostLink}>
              <Text style={styles.ghostLinkText}>ALLOW LOCATION</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.bottomHud} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Drop a Drift"
            disabled={pagesLeft <= 0}
            onPress={() => {
              setDropError(null);
              setDropOpen(true);
            }}
            style={({ pressed }) => [
              styles.dropButton,
              (pagesLeft <= 0 || pressed) && styles.dropButtonDim,
            ]}>
            <Text style={styles.dropLabel}>DROP</Text>
          </Pressable>

          {usingDemoLocation ? (
            <Pressable
              onPress={async () => {
                await hardResetDemo();
                if (typeof window !== 'undefined') window.location.reload();
              }}
              hitSlop={12}
              style={styles.demoReset}>
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

      <AncientLetter
        visible={letterOpen && !!envelope}
        content={envelope?.content ?? ''}
        onClose={() => {
          closeLetter();
          void refresh();
          void senseNow();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050505',
  },
  boot: {
    flex: 1,
    backgroundColor: '#050505',
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
  hud: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topHud: {
    alignItems: 'center',
    gap: 10,
  },
  bottomHud: {
    alignItems: 'center',
    gap: 14,
  },
  ghostLink: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  ghostLinkText: {
    fontFamily: typography.label,
    fontSize: 11,
    letterSpacing: 3,
    color: '#555555',
  },
  dropButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropButtonDim: {
    opacity: 0.35,
  },
  dropLabel: {
    fontFamily: typography.body,
    fontSize: 11,
    letterSpacing: 2,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  demoReset: {
    marginTop: 2,
  },
  demoHint: {
    fontFamily: typography.body,
    fontSize: 11,
    color: '#555555',
    textAlign: 'center',
  },
});
