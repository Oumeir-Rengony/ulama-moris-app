import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBar } from './index';
import { tabBar } from './tokens';

type TabsFooterProps = BottomTabBarProps & {
  // Reports the footer's height (including the bottom inset), so the tabs layout can float the
  // mini player just above it.
  onHeightChange?: (height: number) => void;
};

// The tabs layout's footer on every tab screen: the tab bar, with the bottom safe-area inset
// applied here, once. The mini player floats above it (src/app/(tabs)/_layout.tsx).
export function TabsFooter({ onHeightChange, ...tabBarProps }: TabsFooterProps) {
  const insets = useSafeAreaInsets();

  function handleLayout(event: LayoutChangeEvent) {
    if (onHeightChange) {
      onHeightChange(event.nativeEvent.layout.height);
    }
  }

  return (
    <View
      onLayout={handleLayout}
      className={`bg-bg px-bar pt-2 ${tabBar.divider}`}
      style={{ paddingBottom: insets.bottom }}
    >
      <TabBar {...tabBarProps} />
    </View>
  );
}
