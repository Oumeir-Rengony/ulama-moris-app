import '@/global.css';

import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';

import { PlayerStatusBridge } from '@/features/player/player-status-bridge';
import { setupAudio } from '@/features/player/setup-audio';
import { AppProviders } from '@/providers/app-providers';
import { useNavigationTheme } from '@/theme/navigation-theme';
import { useThemeColors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

// A deep link straight to /search or /player still gets the tabs underneath to go back to.
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useThemeColors();
  const navigationTheme = useNavigationTheme(isDark);

  const fontsAreSettled = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (fontError) {
      console.error('Manrope failed to load. Falling back to system fonts.', fontError);
    }
  }, [fontError]);

  useEffect(() => {
    if (fontsAreSettled) {
      SplashScreen.hideAsync();
    }
  }, [fontsAreSettled]);

  // The audio mode is global and set once, when the app starts (in the browser, not on the
  // web server render).
  useEffect(() => {
    setupAudio();
  }, []);

  // The root view shows between the splash and the first screen, and behind transitions.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg);
  }, [colors.bg]);

  if (!fontsAreSettled) {
    return null;
  }

  return (
    <AppProviders>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="auto" />
        <PlayerStatusBridge />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="search" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen
            name="player"
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
              gestureEnabled: true,
              gestureDirection: 'vertical',
            }}
          />
        </Stack>
      </ThemeProvider>
    </AppProviders>
  );
}
