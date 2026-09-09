import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StartLogoRipple } from '@/components/StartLogoRipple';

/**
 * Starting screen — brand first, then enter the map.
 */
export default function StartingScreen() {
  return (
    <View style={styles.root}>
      <View style={styles.center}>
        <StartLogoRipple size={60} color="#555555" />

        <Text style={styles.title}>DRIFT</Text>

        <Text style={styles.subtitle}>
          {'Leave pieces of yourself in physical spaces.\nFind pieces of others.'}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enter Drift"
          onPress={() => router.push('/map')}
          style={({ pressed }) => [styles.enter, pressed && styles.enterPressed]}>
          <Text style={styles.enterLabel}>ENTER</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05070D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  center: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 28,
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 42,
    color: '#EDEDED',
    letterSpacing: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  subtitle: {
    marginTop: 18,
    fontFamily: 'Outfit_300Light',
    fontSize: 14,
    lineHeight: 24,
    color: '#777777',
    textAlign: 'center',
  },
  enter: {
    marginTop: 72,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 30,
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#333333',
  },
  enterPressed: {
    opacity: 0.65,
  },
  enterLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    letterSpacing: 6,
    textTransform: 'uppercase',
    color: '#888888',
    textAlign: 'center',
  },
});
