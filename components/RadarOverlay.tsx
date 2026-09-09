import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  presenceDetected: boolean;
  onOpenEnvelope?: () => void;
};

/**
 * Full-screen cinematic radar chrome: crosshair, detection ring, presence prompt.
 * Decorative layer uses pointerEvents="none"; the envelope circle remains tappable.
 */
export function RadarOverlay({ presenceDetected, onOpenEnvelope }: Props) {
  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={styles.chrome} pointerEvents="none">
        <View style={styles.vLine} />
        <View style={styles.hLine} />
        <View style={styles.detectionCircle} />
      </View>

      {presenceDetected ? (
        <View style={styles.presenceWrap} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open detected note"
            onPress={onOpenEnvelope}
            style={({ pressed }) => [styles.mailCircle, pressed && styles.mailCirclePressed]}>
            <Ionicons name="mail-outline" size={36} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.presenceTitle}>PRESENCE DETECTED</Text>
          <Text style={styles.presenceBody}>A note has drifted within 15 meters.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
  },
  chrome: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vLine: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: '#222222',
  },
  hLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#222222',
  },
  detectionCircle: {
    width: 400,
    height: 400,
    borderRadius: 200,
    borderWidth: 1,
    borderColor: '#222222',
    backgroundColor: 'transparent',
  },
  presenceWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mailCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mailCirclePressed: {
    opacity: 0.75,
  },
  presenceTitle: {
    marginTop: 18,
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  presenceBody: {
    marginTop: 8,
    fontFamily: 'Outfit_300Light',
    fontSize: 13,
    color: '#777777',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
