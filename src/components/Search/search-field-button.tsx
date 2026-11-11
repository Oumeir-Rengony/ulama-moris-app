import Search from 'lucide-react-native/icons/search';
import { Pressable } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

type SearchFieldButtonProps = {
  // "Search by topic".
  label: string;
  onPress?: () => void;
};

// Home: looks like a search field, but it is a button that opens the Search screen.
export function SearchFieldButton({ label, onPress }: SearchFieldButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="min-h-[52px] flex-row items-center gap-2.5 rounded-full bg-surface-2 px-[18px] py-3 active:opacity-80"
    >
      <Icon icon={Search} size={20} color="fgMuted" />
      <Text variant="body" numberOfLines={1} className="shrink text-fg-muted">
        {label}
      </Text>
    </Pressable>
  );
}
