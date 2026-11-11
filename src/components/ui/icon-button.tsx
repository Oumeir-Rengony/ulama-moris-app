import type { ReactNode } from 'react';
import { Pressable } from 'react-native';

type IconButtonSize = 'md' | 'lg';
type IconButtonTone = 'surface' | 'ghost' | 'ground' | 'primary';

// md = 44 (the touch minimum), lg = 60 (Now Playing skip buttons).
const sizeClass: Record<IconButtonSize, string> = {
  md: 'h-touch w-touch',
  lg: 'h-[60px] w-[60px]',
};

const toneClass: Record<IconButtonTone, string> = {
  surface: 'bg-surface-2',
  ghost: 'bg-transparent',
  ground: 'bg-bg',
  primary: 'bg-primary',
};

type IconButtonProps = {
  // The icon element, e.g. <Icon icon={ChevronLeft} size={22} /> or <Skip15Icon direction="back" />.
  // Pick its colour to match the tone (primaryFg on the primary tone, fg otherwise).
  children: ReactNode;
  accessibilityLabel: string;
  size?: IconButtonSize;
  tone?: IconButtonTone;
  onPress?: () => void;
};

export function IconButton({ children, accessibilityLabel, size = 'md', tone = 'surface', onPress }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className={`shrink-0 items-center justify-center rounded-full active:opacity-70 ${sizeClass[size]} ${toneClass[tone]}`}
    >
      {children}
    </Pressable>
  );
}
