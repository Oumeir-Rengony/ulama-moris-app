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
import { NavigationBar } from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useColorScheme } from 'nativewind';
import { useCallback, useEffect, useState } from 'react';

import { LaunchScreen } from '@/features/launch/launch-screen';
import { OfflineGate } from '@/features/offline/offline-gate';
import { PlayerStatusBridge } from '@/features/player/player-status-bridge';
import { setupAudio } from '@/features/player/setup-audio';
import { RemindersBridge } from '@/features/reminders/reminders-bridge';
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

  // The branded launch screen covers the app on every cold start, then removes itself.
  const [isLaunchScreenVisible, setIsLaunchScreenVisible] = useState(true);
  const hideLaunchScreen = useCallback(() => {
    setIsLaunchScreenVisible(false);
  }, []);

  useEffect(() => {
    if (fontError) {
      console.error('Manrope failed to load. Falling back to system fonts.', fontError);
    }
  }, [fontError]);

  // The audio mode is global and set once, when the app starts (in the browser, not on the
  // web server render).
  useEffect(() => {
    setupAudio();
  }, []);

  // The root view shows between the splash and the first screen, and behind transitions.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg);
  }, [colors.bg]);

  // The native splash stays up until the launch screen has drawn its first frame (the launch
  // screen hides it), so nothing shows before the fonts are ready.
  if (!fontsAreSettled) {
    return null;
  }

  return (
    <AppProviders>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="auto" />
        {/* Android draws a translucent contrast scrim over the 3-button navigation bar unless
            the plugin sets enforceContrast: false (app.json), so the tab bar's colour shows
            through. With the scrim gone, "auto" keeps the buttons readable in both themes. */}
        <NavigationBar style="auto" />
        <PlayerStatusBridge />
        {/* After PlayerStatusBridge, so the resume point is saved before reminders are planned. */}
        <RemindersBridge />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="search" options={{ animation: 'slide_from_right' }} />
          {/* Now Playing. Singular: pushing it while it is open doesn't stack a second copy.
              No animation and no swipe: the chevron and Android back close it. */}
          <Stack.Screen
            name="player"
            dangerouslySingular
            options={{ presentation: 'fullScreenModal', animation: 'none', gestureEnabled: false }}
          />
        </Stack>
        {isLaunchScreenVisible && <LaunchScreen onFinished={hideLaunchScreen} />}
        {/* Above everything, the launch screen included: with no connection the app is blocked. */}
        <OfflineGate />
      </ThemeProvider>
    </AppProviders>
  );
}
