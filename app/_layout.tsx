import {
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium,
} from '@expo-google-fonts/cormorant-garamond';
import { Outfit_300Light, Outfit_400Regular, Outfit_500Medium } from '@expo-google-fonts/outfit';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider } from '@/hooks/useAuth';
import { LocationProvider } from '@/hooks/useLocation';
import { palette } from '@/lib/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const driftTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: palette.void,
    card: palette.abyss,
    text: palette.paper,
    border: palette.line,
    primary: palette.pulse,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_500Medium,
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_700Bold,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider value={driftTheme}>
      <AuthProvider>
        <LocationProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: styles.screen,
              animation: 'fade',
            }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="map" options={{ animation: 'fade' }} />
            <Stack.Screen name="drop" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="note/[id]" options={{ animation: 'fade' }} />
          </Stack>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: palette.void,
  },
});
