import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { BehindNowPlaying } from './behind-now-playing';
import { NowPlayingPanel } from './now-playing-panel';
import { PlayerTabBar } from './player-tab-bar';
import { TabBarHeightContext } from './tab-bar-height';
import { useOutsideTabsProgress } from './use-outside-tabs-progress';

// Drawn by the root layout around the whole navigator, so the mini player stays on every screen,
// Search included.
//
// The draw order matters, bottom to top:
//   1. the screens (the tabs, and Search over them), which never move. BehindNowPlaying hides
//      them from screen readers while Now Playing is open.
//   2. the player: one sheet that is the mini player at its small size and grows into Now
//      Playing, covering the whole screen.
//   3. the tab bar, over the sheet. It slides down out of the way as the player grows, and on a
//      screen outside the tabs (Search), where the mini player drops into its place.
export function PlayerShell({ children }: { children: ReactNode }) {
  // The player sheet's live index (0 = the bar, 1 = the full player, −1 = gone). The sheet writes
  // it; the tab bar reads it.
  const sheetIndex = useSharedValue(-1);
  const outsideTabsProgress = useOutsideTabsProgress();
  // 0 until the tab bar has been laid out; the player waits for it.
  const [tabBarHeight, setTabBarHeight] = useState(0);

  return (
    <TabBarHeightContext value={tabBarHeight}>
      <View className="flex-1 bg-bg">
        <BehindNowPlaying>{children}</BehindNowPlaying>
        <NowPlayingPanel sheetIndex={sheetIndex} tabBarHeight={tabBarHeight} outsideTabsProgress={outsideTabsProgress} />
        <PlayerTabBar
          sheetIndex={sheetIndex}
          outsideTabsProgress={outsideTabsProgress}
          onHeightChange={setTabBarHeight}
        />
      </View>
    </TabBarHeightContext>
  );
}
