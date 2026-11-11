import type { LucideIcon } from 'lucide-react-native';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { catClasses, catFgColorKey, type Category, type SemanticColor } from '@/theme/tokens';

// onEmphasis: info chips on the forest cards ("4 lectures", "2h 34m", "EVENT").
// category:   a coloured tag (Events count chip, Now Playing topic pill).
// outline:    the Now Playing event link. It is always a link, so it always renders as a button.
type PillVariant = 'onEmphasis' | 'category' | 'outline';

// sm 28 is only the "EVENT" tag, which uses the overline type; md 32 and lg 34 use 13 Bold.
type PillSize = 'sm' | 'md' | 'lg';

const sizeClass: Record<PillSize, string> = {
  sm: 'min-h-7 px-2.5',
  md: 'min-h-8 px-3',
  lg: 'min-h-[34px] px-3',
};

type PillProps = {
  label: string;
  variant: PillVariant;
  size?: PillSize;
  icon?: LucideIcon;
  // Required for the category variant: which cat-N pair to use.
  category?: Category;
  // The outline variant's accessibility label, e.g. "Open event: The Sahaba Radiyyallahu Anhum".
  accessibilityLabel?: string;
  onPress?: () => void;
};

type PillColors = {
  containerClass: string;
  textClass: string;
  iconColor: SemanticColor;
};

function getPillColors(variant: PillVariant, category: Category): PillColors {
  if (variant === 'onEmphasis') {
    return { containerClass: 'bg-emphasis-fg/[0.12]', textClass: 'text-emphasis-fg', iconColor: 'emphasisFg' };
  }
  if (variant === 'category') {
    const classes = catClasses[category];
    return { containerClass: classes.bg, textClass: classes.fg, iconColor: catFgColorKey[category] };
  }
  return { containerClass: 'border-[1.5px] border-border-strong', textClass: 'text-fg', iconColor: 'fg' };
}

export function Pill({ label, variant, size = 'md', icon, category = 1, accessibilityLabel, onPress }: PillProps) {
  const colors = getPillColors(variant, category);

  let labelVariant: 'meta' | 'overline' = 'meta';
  if (size === 'sm') {
    labelVariant = 'overline';
  }

  // The Events count chip's radio icon is 16; every other pill icon is 14.
  let iconSize = 14;
  if (variant === 'category') {
    iconSize = 16;
  }

  const content = (
    <>
      {icon ? <Icon icon={icon} size={iconSize} color={colors.iconColor} strokeWidth={2.2} /> : null}
      <Text variant={labelVariant} numberOfLines={1} className={`shrink font-manrope-bold ${colors.textClass}`}>
        {label}
      </Text>
    </>
  );

  const containerClass = `flex-row items-center gap-1.5 rounded-full ${sizeClass[size]} ${colors.containerClass}`;

  if (variant === 'outline') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        onPress={onPress}
        className={`shrink pr-2 active:opacity-70 ${containerClass}`}
      >
        {content}
        <Icon icon={ChevronRight} size={14} color={colors.iconColor} strokeWidth={2.4} />
      </Pressable>
    );
  }

  return <View className={`self-start ${containerClass}`}>{content}</View>;
}
