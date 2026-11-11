import type { LucideIcon } from 'lucide-react-native';

import { useThemeColors, type SemanticColor } from '@/theme/tokens';

type IconProps = {
  // A lucide icon, imported one by one: `import Play from 'lucide-react-native/icons/play'`.
  // Importing from the package root would pull every lucide icon into the bundle.
  icon: LucideIcon;
  size?: number;
  // A semantic colour name, so callers never pass hex and the icon follows the theme.
  color?: SemanticColor;
  // Play and Pause are drawn filled (HANDOFF §1).
  filled?: boolean;
  strokeWidth?: number;
};

export function Icon({ icon: LucideGlyph, size = 20, color = 'fg', filled = false, strokeWidth = 2 }: IconProps) {
  const colors = useThemeColors();
  const colorValue = colors[color];

  let fill = 'none';
  if (filled) {
    fill = colorValue;
  }

  return (
    <LucideGlyph
      size={size}
      color={colorValue}
      fill={fill}
      strokeWidth={strokeWidth}
    />
  );
}
