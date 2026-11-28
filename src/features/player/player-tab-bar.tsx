import { router, usePathname, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import type { TabKey } from '@/components/TabBar';
import { TabsFooter } from '@/components/TabBar/tabs-footer';

import { usePlayerStore } from './player.store';

type PlayerTabBarProps = {
  // The player sheet's live index: 0 = the bar, 1 = the full player.
  sheetIndex: SharedValue<number>;
  // 0 on a tab screen, 1 on a screen outside the tabs (Search), where the tab bar slides away.
  outsideTabsProgress: SharedValue<number>;
  // Reports the tab bar's height (bottom inset included). The bar's place and the screens' bottom
  // padding are worked out from it.
  onHeightChange: (height: number) => void;
};

// Which tab a path belongs to, or null for a screen outside the tabs (Search, /player).
export function pickTabForPath(pathname: string): TabKey | null {
  if (pathname === '/') {
    return 'home';
  }
  if (pathname === '/events' || pathname.startsWith('/events/')) {
    return 'events';
  }
  return null;
}

// Each tab's first screen.
const rootPathByTab: Record<TabKey, Href> = {
  home: '/',
  events: '/events',
};

// The tab bar, drawn by PlayerShell over the player sheet instead of by the navigator (which
// would draw it under the sheet, where the sheet would take its taps). As the player grows into
// Now Playing, the tab bar slides down out of the way, driven by the same index as the morph. It
// slides away too on a screen outside the tabs (Search), where the mini player takes its place.
export function PlayerTabBar({ sheetIndex, outsideTabsProgress, onHeightChange }: PlayerTabBarProps) {
  const isNowPlayingOpen = usePlayerStore((state) => state.nowPlayingPresentation === 'open');
  const [height, setHeight] = useState(0);

  // While Search (a screen over the tabs) opens or closes, the path is Search's. Keep showing the
  // last tab meanwhile, so the highlight doesn't blink. Set during render (React's pattern for
  // state that follows a prop), so no frame shows the stale value.
  const pathname = usePathname();
  const tabFromPath = pickTabForPath(pathname);
  const [lastTab, setLastTab] = useState<TabKey>(tabFromPath ?? 'home');
  if (tabFromPath !== null && tabFromPath !== lastTab) {
    setLastTab(tabFromPath);
  }
  let selectedTab = lastTab;
  if (tabFromPath !== null) {
    selectedTab = tabFromPath;
  }

  // The last screen shown in each tab, so switching back to a tab shows that screen again (an
  // event's page stays open while you visit Home), as the navigator's own tab bar did.
  const lastPathByTab = useRef<Record<TabKey, Href>>({ ...rootPathByTab });
  useEffect(() => {
    if (tabFromPath !== null) {
      // usePathname returns a plain string; it is a route the router has just shown.
      lastPathByTab.current[tabFromPath] = pathname as Href;
    }
  }, [pathname, tabFromPath]);

  // Another tab: back to where it was. The selected tab again: back to its first screen (the
  // Events list from an event's page).
  function handleTabPress(tab: TabKey) {
    if (tab === selectedTab) {
      router.navigate(rootPathByTab[tab]);
      return;
    }
    router.navigate(lastPathByTab.current[tab]);
  }

  function handleLayout(event: LayoutChangeEvent) {
    const measuredHeight = event.nativeEvent.layout.height;
    setHeight(measuredHeight);
    onHeightChange(measuredHeight);
  }

  // Whichever pushes it further down wins: Now Playing growing, or a screen outside the tabs.
  const slideAwayStyle = useAnimatedStyle(() => {
    const slideForNowPlaying = interpolate(sheetIndex.get(), [0, 1], [0, height], Extrapolation.CLAMP);
    const slideOutsideTabs = outsideTabsProgress.get() * height;
    let translateY = slideForNowPlaying;
    if (slideOutsideTabs > translateY) {
      translateY = slideOutsideTabs;
    }
    return { transform: [{ translateY }] };
  });

  // While Now Playing is open, or a screen outside the tabs is showing, the tab bar is off-screen:
  // screen readers skip it, and it can't be touched.
  const isOffScreen = isNowPlayingOpen || tabFromPath === null;
  return (
    <Animated.View
      testID="player-tab-bar"
      onLayout={handleLayout}
      pointerEvents={isOffScreen ? 'none' : 'auto'}
      accessibilityElementsHidden={isOffScreen}
      importantForAccessibility={isOffScreen ? 'no-hide-descendants' : 'auto'}
      style={[{ position: 'absolute', left: 0, right: 0, bottom: 0 }, slideAwayStyle]}
    >
      <TabsFooter selectedTab={selectedTab} onTabPress={handleTabPress} />
    </Animated.View>
  );
}
