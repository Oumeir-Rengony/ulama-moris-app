import type { ComponentProps, ReactNode } from 'react';
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
  // Shown at 35% and not pressable: the skip buttons while a lecture's audio didn't load.
  disabled?: boolean;
  // Lets a screen move screen-reader focus to this button (Now Playing's chevron on open).
  ref?: ComponentProps<typeof Pressable>['ref'];
};

export function IconButton({
  children,
  accessibilityLabel,
  size = 'md',
  tone = 'surface',
  onPress,
  disabled = false,
  ref,
}: IconButtonProps) {
  let opacityClass = 'active:opacity-70';
  if (disabled) {
    opacityClass = 'opacity-[0.35]';
  }

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`shrink-0 items-center justify-center rounded-full ${opacityClass} ${sizeClass[size]} ${toneClass[tone]}`}
    >
      {children}
    </Pressable>
  );
}
