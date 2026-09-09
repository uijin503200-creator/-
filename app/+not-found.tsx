import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Atmosphere } from '@/components/Atmosphere';
import { palette, typography } from '@/lib/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Missing', headerShown: false }} />
      <Atmosphere>
        <View style={styles.container}>
          <Text style={styles.title}>This place has no note.</Text>
          <Link href="/" style={styles.link}>
            <Text style={styles.linkText}>Return to Drift</Text>
          </Link>
        </View>
      </Atmosphere>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 20,
  },
  title: {
    fontFamily: typography.displayItalic,
    fontSize: 28,
    color: palette.paper,
    textAlign: 'center',
  },
  link: {
    paddingVertical: 12,
  },
  linkText: {
    fontFamily: typography.label,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: palette.echo,
  },
});