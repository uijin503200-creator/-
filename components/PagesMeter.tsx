import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MAX_PAGES } from '@/lib/constants';
import { palette, typography } from '@/lib/theme';

export function PagesMeter({ pages }: { pages: number }) {
  return (
    <View style={styles.wrap} accessibilityLabel={`${pages} pages remaining`}>
      <Text style={styles.label}>Pages</Text>
      <View style={styles.row}>
        {Array.from({ length: MAX_PAGES }).map((_, i) => (
          <View key={i} style={[styles.leaf, i < pages ? styles.leafLive : styles.leafGone]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontFamily: typography.label,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: palette.mist,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  leaf: {
    width: 18,
    height: 3,
  },
  leafLive: {
    backgroundColor: palette.paper,
    opacity: 0.9,
  },
  leafGone: {
    backgroundColor: palette.line,
  },
});