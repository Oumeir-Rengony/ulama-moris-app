import type { ReactNode } from 'react';
import { View } from 'react-native';

type ScreenTopBarProps = {
  // Usually a 44px IconButton. An empty 44px spacer when left out, so the centre stays centred.
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
};

function Spacer() {
  return <View className="h-touch w-touch" />;
}

// Event detail ("Event") and Now Playing ("Playing from …") top bars. The screen adds the top
// safe-area inset; this bar only lays out its three slots.
export function ScreenTopBar({ left, center, right }: ScreenTopBarProps) {
  return (
    <View className="min-h-touch flex-row items-center gap-2 px-bar">
      {left ?? <Spacer />}
      <View className="flex-1 items-center">{center}</View>
      {right ?? <Spacer />}
    </View>
  );
}
