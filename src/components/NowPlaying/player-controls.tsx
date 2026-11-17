import { View } from 'react-native';

import { Skip15Icon } from '@/components/icons/skip-15-icon';
import { IconButton } from '@/components/ui/icon-button';
import { PlayPauseButton } from '@/components/ui/play-pause-button';

// failed: the lecture's audio didn't load. Every control is disabled; opening the lecture again
// loads it again.
export type PlayerControlsState = 'playing' | 'paused' | 'failed';

type PlayerControlsProps = {
  state: PlayerControlsState;
  onBackPress?: () => void;
  onTogglePress?: () => void;
  onForwardPress?: () => void;
};

// Now Playing: back 15, play/pause, forward 15. Centred, gap 28.
export function PlayerControls({ state, onBackPress, onTogglePress, onForwardPress }: PlayerControlsProps) {
  const hasAudioFailed = state === 'failed';

  let buttonState: 'play' | 'pause' = 'play';
  let buttonLabel = 'Play';
  if (state === 'playing') {
    buttonState = 'pause';
    buttonLabel = 'Pause';
  }

  return (
    <View className="flex-row items-center justify-center gap-7">
      <IconButton
        accessibilityLabel="Back 15 seconds"
        size="lg"
        tone="surface"
        disabled={hasAudioFailed}
        onPress={onBackPress}
      >
        <Skip15Icon direction="back" size={26} />
      </IconButton>
      <PlayPauseButton
        state={buttonState}
        variant="nowPlaying"
        accessibilityLabel={buttonLabel}
        disabled={hasAudioFailed}
        onPress={onTogglePress}
      />
      <IconButton
        accessibilityLabel="Forward 15 seconds"
        size="lg"
        tone="surface"
        disabled={hasAudioFailed}
        onPress={onForwardPress}
      >
        <Skip15Icon direction="forward" size={26} />
      </IconButton>
    </View>
  );
}
