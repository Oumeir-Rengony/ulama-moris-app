import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';

import { EventsTabIcon, HomeTabIcon } from '@/components/icons/tab-icons';
import { Text } from '@/components/ui/text';

import { tabBar } from './tokens';

type TabKey = 'home' | 'events';

// The two tab routes in src/app/(tabs)/. Anything else is not shown as a tab.
const tabsByRouteName: Record<string, { key: TabKey; label: string }> = {
  index: { key: 'home', label: 'Home' },
  events: { key: 'events', label: 'Events' },
};

type TabBarItemProps = {
  tab: TabKey;
  label: string;
  isSelected: boolean;
  onPress?: () => void;
};

// Active: filled icon on a 60 × 32 pill, ExtraBold label. Inactive: outline icon, muted label.
export function TabBarItem({ tab, label, isSelected, onPress }: TabBarItemProps) {
  let pillClass = '';
  let labelClass = `font-manrope-semibold ${tabBar.inactiveFg}`;
  let iconColor: 'primarySubtleFg' | 'fgMuted' = 'fgMuted';
  if (isSelected) {
    pillClass = tabBar.activeBg;
    labelClass = 'font-manrope-extrabold text-fg';
    iconColor = 'primarySubtleFg';
  }

  let icon = <HomeTabIcon filled={isSelected} color={iconColor} />;
  if (tab === 'events') {
    icon = <EventsTabIcon filled={isSelected} color={iconColor} />;
  }

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      className="min-h-touch flex-1 items-center gap-1 pt-1"
    >
      <View className={`h-8 w-[60px] items-center justify-center rounded-full ${pillClass}`}>{icon}</View>
      {/* The tab bar can't grow much, so its label is capped (AGENTS.md "Text & font scaling"). */}
      <Text variant="caption" maxFontSizeMultiplier={1.3} numberOfLines={1} className={labelClass}>
        {label}
      </Text>
    </Pressable>
  );
}

// The row of tabs. TabsFooter puts it under the mini player and owns the bottom inset.
export function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  return (
    <View accessibilityRole="tablist" className="flex-row gap-1">
      {state.routes.map((route, index) => {
        const tab = tabsByRouteName[route.name];
        if (tab === undefined) {
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
          <TabBarItem key={route.key} tab={tab.key} label={tab.label} isSelected={isSelected} onPress={handlePress} />
        );
      })}
    </View>
  );
}
