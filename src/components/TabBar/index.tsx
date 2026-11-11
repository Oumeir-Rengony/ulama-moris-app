import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';

import { tabBar } from './tokens';

// Labels for the two tab routes in src/app/(tabs)/. Anything else is not shown as a tab.
const tabLabels: Record<string, string> = {
  index: 'Home',
  events: 'Events',
};

type TabBarItemProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
};

function TabBarItem({ label, isSelected, onPress }: TabBarItemProps) {
  let pillClassName = '';
  let labelClassName = `font-manrope-semibold ${tabBar.inactiveFg}`;
  if (isSelected) {
    pillClassName = tabBar.activeBg;
    labelClassName = 'font-manrope-extrabold text-fg';
  }

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      className="min-h-touch flex-1 items-center justify-center pt-1"
    >
      {/* TODO(stage 3): icon inside a 60 × 32 pill, styled from the tabBar tokens. */}
      <View className={`min-h-8 min-w-[60px] items-center justify-center rounded-full px-3 ${pillClassName}`}>
        <Text variant="caption" maxFontSizeMultiplier={1.3} className={labelClassName}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className={`bg-bg px-bar ${tabBar.divider}`} style={{ paddingBottom: insets.bottom }}>
      {/* TODO: MiniPlayer goes here */}
      <View className="flex-row gap-1">
        {state.routes.map((route, index) => {
          const label = tabLabels[route.name];
          if (label === undefined) {
            return null;
          }

          const isSelected = state.index === index;

          function handlePress() {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isSelected && !event.defaultPrevented) {
              navigateToTab(route.key);
            }
          }

          return (
            <TabBarItem key={route.key} label={label} isSelected={isSelected} onPress={handlePress} />
          );
        })}
      </View>
    </View>
  );
}
