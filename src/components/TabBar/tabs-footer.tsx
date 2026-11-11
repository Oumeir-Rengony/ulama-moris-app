import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/MiniPlayer';

import { TabBar } from './index';
import { tabBar } from './tokens';

export type MiniPlayerContent = {
  title: string;
  author: string;
  state: 'playing' | 'paused';
  progress: number;
};

type TabsFooterProps = BottomTabBarProps & {
  miniPlayer: MiniPlayerContent;
};

// The tabs layout's footer on every tab screen: the mini player stacked above the tab bar
// (HANDOFF §4.6). The bottom safe-area inset is applied here, once.
export function TabsFooter({ miniPlayer, ...tabBarProps }: TabsFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className={`gap-2 bg-bg px-bar ${tabBar.divider}`} style={{ paddingBottom: insets.bottom }}>
      <View className="mt-2.5">
        <MiniPlayer
          title={miniPlayer.title}
          author={miniPlayer.author}
          state={miniPlayer.state}
          progress={miniPlayer.progress}
        />
      </View>
      <TabBar {...tabBarProps} />
    </View>
  );
}
