import Clock from 'lucide-react-native/icons/clock';
import X from 'lucide-react-native/icons/x';
import { Fragment } from 'react';
import { Pressable, View } from 'react-native';

import { Divider } from '@/components/ui/divider';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Text } from '@/components/ui/text';

type RecentSearchRowProps = {
  query: string;
  onPress?: () => void;
  onRemovePress?: () => void;
};

function RecentSearchRow({ query, onPress, onRemovePress }: RecentSearchRowProps) {
  return (
    <View className="flex-row items-center">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Search for ${query}`}
        onPress={onPress}
        className="min-h-[52px] flex-1 flex-row items-center gap-3 py-3 pl-4 active:opacity-70"
      >
        <Icon icon={Clock} size={18} color="fgMuted" />
        <Text variant="body" numberOfLines={1} className="shrink font-manrope-semibold">
          {query}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove “${query}” from recent searches`}
        onPress={onRemovePress}
        className="mr-1 h-touch w-touch items-center justify-center rounded-full active:opacity-70"
      >
        <Icon icon={X} size={16} color="fgMuted" strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

type RecentSearchListProps = {
  // Newest first. An empty list shows "Your searches will appear here."
  queries: string[];
  onQueryPress?: (query: string) => void;
  onRemovePress?: (query: string) => void;
};

// The card of recent searches. The "Recent searches" + "Clear all" header is a SectionHeader
// the screen puts above it.
export function RecentSearchList({ queries, onQueryPress, onRemovePress }: RecentSearchListProps) {
  if (queries.length === 0) {
    return <EmptyState message="Your searches will appear here." />;
  }

  return (
    <SurfaceCard padding="none">
      {queries.map((query, index) => {
        const isFirstRow = index === 0;

        function handleQueryPress() {
          onQueryPress?.(query);
        }

        function handleRemovePress() {
          onRemovePress?.(query);
        }

        return (
          <Fragment key={query}>
            {isFirstRow ? null : <Divider />}
            <RecentSearchRow query={query} onPress={handleQueryPress} onRemovePress={handleRemovePress} />
          </Fragment>
        );
      })}
    </SurfaceCard>
  );
}
