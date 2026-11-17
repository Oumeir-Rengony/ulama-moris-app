import CircleAlert from 'lucide-react-native/icons/circle-alert';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

type AudioErrorRowProps = {
  // "Check your internet connection, then open the lecture again."
  message: string;
};

// Now Playing: takes the seek bar's place when the lecture's audio didn't load.
// danger-subtle, radius 18, padding 12/14. Read out as an alert.
export function AudioErrorRow({ message }: AudioErrorRowProps) {
  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`This lecture didn’t load. ${message}`}
      className="flex-row items-center gap-3 rounded-[18px] bg-danger-subtle px-3.5 py-3"
    >
      <Icon icon={CircleAlert} size={22} color="dangerSubtleFg" />
      <View className="flex-1 gap-0.5">
        <Text variant="bodySm" className="font-manrope-extrabold text-danger-subtle-fg">
          This lecture didn’t load
        </Text>
        <Text variant="meta" className="font-manrope text-danger-subtle-fg">
          {message}
        </Text>
      </View>
    </View>
  );
}
