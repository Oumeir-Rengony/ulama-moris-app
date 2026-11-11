import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

type IconLabelProps = {
  icon: LucideIcon;
  label: string;
  // sm: Event row venue (13 icon, 12 text). md: Now Playing venue and date (16 icon, 14 text).
  size?: 'sm' | 'md';
};

// One line of muted text with a small icon in front. Always one line, ellipsised.
export function IconLabel({ icon, label, size = 'md' }: IconLabelProps) {
  if (size === 'sm') {
    return (
      <View className="flex-row items-center gap-1">
        <Icon icon={icon} size={13} color="fgMuted" strokeWidth={2.2} />
        <Text variant="caption" numberOfLines={1} className="shrink text-fg-muted">
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-2">
      <View className="h-[18px] w-[18px] items-center justify-center">
        <Icon icon={icon} size={16} color="fgMuted" strokeWidth={2.1} />
      </View>
      <Text variant="bodySm" numberOfLines={1} className="shrink text-fg-muted">
        {label}
      </Text>
    </View>
  );
}
