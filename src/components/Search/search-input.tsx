import Mic from 'lucide-react-native/icons/mic';
import Search from 'lucide-react-native/icons/search';
import X from 'lucide-react-native/icons/x';
import { useColorScheme } from 'nativewind';
import { Pressable, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { useThemeColors } from '@/theme/tokens';

type SearchInputProps = {
  value: string;
  // "Search by topic" (lectures) or "Search events by name" (events).
  placeholder: string;
  // The Search screen focuses the input as it opens, so the keyboard is already up.
  autoFocus?: boolean;
  onChangeText?: (text: string) => void;
  onClearPress?: () => void;
  onMicPress?: () => void;
};

// The Search screen's input pill. Controlled by its props. Trailing button: mic while empty (visual only), clear ✕ once there is text.
export function SearchInput({
  value,
  placeholder,
  autoFocus = false,
  onChangeText,
  onClearPress,
  onMicPress,
}: SearchInputProps) {
  const colors = useThemeColors();
  const { colorScheme } = useColorScheme();
  const hasText = value.length > 0;

  let keyboardAppearance: 'light' | 'dark' = 'light';
  if (colorScheme === 'dark') {
    keyboardAppearance = 'dark';
  }

  return (
    <View className="min-h-12 flex-1 flex-row items-center gap-2 rounded-full bg-surface-2 pl-4 pr-1">
      <Icon icon={Search} size={18} color="fgMuted" strokeWidth={2.2} />
      <TextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.fgMuted}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        accessibilityLabel="Search"
        returnKeyType="search"
        keyboardAppearance={keyboardAppearance}
        autoCorrect={false}
        className="min-h-12 flex-1 py-2 font-manrope-semibold text-[15px] text-fg"
      />
      {hasText ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={onClearPress}
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
        >
          <Icon icon={X} size={18} strokeWidth={2.2} />
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voice search"
          onPress={onMicPress}
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
        >
          <Icon icon={Mic} size={18} strokeWidth={2.2} />
        </Pressable>
      )}
    </View>
  );
}
