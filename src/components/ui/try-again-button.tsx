import RotateCw from 'lucide-react-native/icons/rotate-cw';
import { Pressable } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Text, type TextVariant } from '@/components/ui/text';
import type { SemanticColor } from '@/theme/tokens';

// primary:    48 high, bg-primary. The error card ("Lectures didn’t load").
// onDanger:   44 high, ivory (bg-bg). The "More lectures didn’t load" footer, on danger-subtle.
export type TryAgainButtonVariant = 'primary' | 'onDanger';

type VariantStyle = {
  pressableClass: string;
  textVariant: TextVariant;
  textClass: string;
  iconColor: SemanticColor;
  iconSize: number;
};

const variantStyles: Record<TryAgainButtonVariant, VariantStyle> = {
  primary: {
    pressableClass: 'min-h-12 bg-primary px-6',
    textVariant: 'title',
    textClass: 'font-manrope-bold text-primary-fg',
    iconColor: 'primaryFg',
    iconSize: 18,
  },
  onDanger: {
    // Narrower sides than the card's button, so the footer's title keeps to one line at 390.
    pressableClass: 'min-h-11 bg-bg px-4',
    textVariant: 'title',
    textClass: 'font-manrope-bold text-fg',
    iconColor: 'fg',
    iconSize: 18,
  },
};

type TryAgainButtonProps = {
  variant: TryAgainButtonVariant;
  // While true: a spinner in the icon's place, announced as busy, and presses are ignored. The
  // label stays "Try again" so the button doesn't change width.
  isRetrying: boolean;
  onPress?: () => void;
};

// The one "Try again" every error state has.
export function TryAgainButton({ variant, isRetrying, onPress }: TryAgainButtonProps) {
  const style = variantStyles[variant];

  // A second press while it's already trying would start a second load.
  function handlePress() {
    if (isRetrying) {
      return;
    }
    onPress?.();
  }

  const label = 'Try again';
  let leading = <Icon icon={RotateCw} size={style.iconSize} color={style.iconColor} strokeWidth={2.4} />;
  if (isRetrying) {
    leading = <Spinner size={style.iconSize} color={style.iconColor} />;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: isRetrying }}
      onPress={handlePress}
      className={`flex-row items-center justify-center gap-2 self-center rounded-full py-2 active:opacity-80 ${style.pressableClass}`}
    >
      {leading}
      <Text variant={style.textVariant} numberOfLines={1} className={style.textClass}>
        {label}
      </Text>
    </Pressable>
  );
}
