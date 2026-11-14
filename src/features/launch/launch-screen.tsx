import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/theme/tokens';

import {
  BAR_FILL_DELAY_MS,
  BAR_FILL_MS,
  ENTRANCE_MS,
  EXIT_DELAY_MS,
  EXIT_MS,
  LOGO_HEIGHT,
  LOGO_WIDTH,
} from './launch-motion-config';

// The branded launch screen, drawn over the app once the fonts have loaded.
//
// The native splash (app.json, expo-splash-screen) can only show the logo centred on the
// background. This screen starts from exactly that picture, so the hand-over is invisible: the
// logo begins at the centre of the screen at the same size, then rises into its place while the
// name, tagline and progress bar fade in. When the bar is full, the whole screen fades away and
// reveals the app, which has been rendering underneath the whole time.
//
// The bar is timed, not tied to real loading work: everything the first screen needs (the
// fonts) is already loaded when this screen appears.
//
// With Reduce Motion on, Reanimated finishes every animation at once, so this screen gets out of
// the way immediately.

const logoSource = require('@/assets/images/splash-logo.png');

type LaunchScreenProps = {
  onFinished: () => void;
};

export function LaunchScreen({ onFinished }: LaunchScreenProps) {
  const colors = useThemeColors();
  const [hasMeasuredContent, setHasMeasuredContent] = useState(false);

  // How far the logo sits below its final place, so it starts where the native splash drew it.
  const logoOffsetY = useSharedValue(0);
  // 0 → 1: the name, tagline and progress bar fading in.
  const detailsOpacity = useSharedValue(0);
  // 0 → 1: how much of the progress bar is filled.
  const barProgress = useSharedValue(0);
  // 1 → 0: the whole screen fading away at the end.
  const screenOpacity = useSharedValue(1);

  function handleContentLayout(event: LayoutChangeEvent) {
    if (hasMeasuredContent) {
      return;
    }

    // The content column is centred on the screen, and the logo is its first child. So the
    // logo's centre sits half the column's height above the screen's centre, plus half the
    // logo's own height. Moving it down by that distance puts it at the screen's centre.
    const columnHeight = event.nativeEvent.layout.height;
    const distanceFromScreenCentre = columnHeight / 2 - LOGO_HEIGHT / 2;
    logoOffsetY.set(distanceFromScreenCentre);

    setHasMeasuredContent(true);
    // The logo now sits where the native splash drew it, so the native splash can go.
    SplashScreen.hide();
  }

  useEffect(() => {
    if (!hasMeasuredContent) {
      return;
    }

    const entranceTiming = { duration: ENTRANCE_MS, easing: Easing.out(Easing.cubic) };
    logoOffsetY.set(withTiming(0, entranceTiming));
    detailsOpacity.set(withTiming(1, entranceTiming));

    const barTiming = { duration: BAR_FILL_MS, easing: Easing.inOut(Easing.quad) };
    barProgress.set(withDelay(BAR_FILL_DELAY_MS, withTiming(1, barTiming)));

    const exitDelayMs = BAR_FILL_DELAY_MS + BAR_FILL_MS + EXIT_DELAY_MS;
    const exitTiming = { duration: EXIT_MS, easing: Easing.out(Easing.quad) };
    screenOpacity.set(
      withDelay(
        exitDelayMs,
        withTiming(0, exitTiming, (finished) => {
          if (finished) {
            scheduleOnRN(onFinished);
          }
        }),
      ),
    );
  }, [hasMeasuredContent, logoOffsetY, detailsOpacity, barProgress, screenOpacity, onFinished]);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.get(),
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: logoOffsetY.get() }],
  }));

  const detailsStyle = useAnimatedStyle(() => ({
    opacity: detailsOpacity.get(),
  }));

  const barFillStyle = useAnimatedStyle(() => ({
    width: `${barProgress.get() * 100}%`,
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, screenStyle]}
      // The launch screen is decoration: screen readers go straight to the app underneath.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View className="flex-1 items-center justify-center bg-bg px-6">
        <View
          testID="launch-screen-content"
          className="w-full max-w-[600px] items-center"
          onLayout={handleContentLayout}
        >
          <Animated.View style={logoStyle}>
            <Image source={logoSource} contentFit="contain" style={styles.logo} />
          </Animated.View>

          <Animated.View style={[styles.details, detailsStyle]}>
            <Text
              variant="display"
              className="mt-10 text-center text-[44px] leading-[50px]"
              maxFontSizeMultiplier={1.3}
            >
              Ulama Moris
            </Text>
            <Text
              variant="title"
              className="mt-4 text-center font-manrope-bold text-fg-muted text-[18px] leading-[24px]"
            >
              An audio library rooted in knowledge.
            </Text>

            <View className="mt-[70px] h-1 w-32 overflow-hidden rounded-full bg-fg/10">
              {/* NativeWind classes don't reach Animated.View, so the fill takes plain styles. */}
              <Animated.View
                style={[styles.barFill, { backgroundColor: colors.primary }, barFillStyle]}
              />
            </View>
            <Text variant="bodySm" className="mt-3 text-center font-manrope-semibold text-fg-muted">
              Preparing your listening space
            </Text>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
  },
  details: {
    width: '100%',
    alignItems: 'center',
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
});
