import { View } from 'react-native';

import { Skip15Icon } from '@/components/icons/skip-15-icon';
import { IconButton } from '@/components/ui/icon-button';
import { PlayPauseButton } from '@/components/ui/play-pause-button';

type PlayerControlsProps = {
  state: 'playing' | 'paused';
  onBackPress?: () => void;
  onTogglePress?: () => void;
  onForwardPress?: () => void;
};

// Now Playing: back 15, play/pause, forward 15. Centred, gap 28.
export function PlayerControls({ state, onBackPress, onTogglePress, onForwardPress }: PlayerControlsProps) {
  let buttonState: 'play' | 'pause' = 'play';
  let buttonLabel = 'Play';
  if (state === 'playing') {
    buttonState = 'pause';
    buttonLabel = 'Pause';
  }

  return (
    <View className="flex-row items-center justify-center gap-7">
      <IconButton accessibilityLabel="Back 15 seconds" size="lg" tone="surface" onPress={onBackPress}>
        <Skip15Icon direction="back" size={26} />
      </IconButton>
      <PlayPauseButton state={buttonState} variant="nowPlaying" accessibilityLabel={buttonLabel} onPress={onTogglePress} />
      <IconButton accessibilityLabel="Forward 15 seconds" size="lg" tone="surface" onPress={onForwardPress}>
        <Skip15Icon direction="forward" size={26} />
      </IconButton>
    </View>
  );
}
