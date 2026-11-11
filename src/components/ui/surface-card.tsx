import type { ReactNode } from 'react';
import { View } from 'react-native';

// none:    the card's rows bring their own padding (recent searches).
// compact: 20 all round ("Your searches will appear here.").
// roomy:   24 sides, 28 top and bottom (empty series, no results).
type SurfaceCardPadding = 'none' | 'compact' | 'roomy';

const paddingClass: Record<SurfaceCardPadding, string> = {
  none: '',
  compact: 'p-5',
  roomy: 'px-6 py-7',
};

type SurfaceCardProps = {
  children: ReactNode;
  padding?: SurfaceCardPadding;
};

export function SurfaceCard({ children, padding = 'compact' }: SurfaceCardProps) {
  return <View className={`overflow-hidden rounded-row bg-surface-1 ${paddingClass[padding]}`}>{children}</View>;
}
