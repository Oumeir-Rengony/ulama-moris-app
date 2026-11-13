import { SeekBar } from '@/components/ui/seek-bar';

import { seek, skipBack15, skipForward15 } from './audio-engine';
import { nowPlayingSeekBar } from './now-playing-content';
import { usePlayerStore } from './player.store';

type NowPlayingSeekBarProps = {
  // The data's clock string ("46:21"), shown until the audio reports its own length.
  dataDuration: string | undefined;
};

function handleAccessibilityStep(direction: 'increment' | 'decrement') {
  if (direction === 'increment') {
    skipForward15();
    return;
  }
  skipBack15();
}

// Now Playing's seek bar and times, connected to the player. One of the few parts that read the
// position, which changes four times a second, so the artwork and track info don't re-render.
export function NowPlayingSeekBar({ dataDuration }: NowPlayingSeekBarProps) {
  const positionSec = usePlayerStore((state) => state.positionSec);
  const durationSec = usePlayerStore((state) => state.durationSec);

  const content = nowPlayingSeekBar({ positionSec, durationSec, dataDuration });

  function handleSeek(fraction: number) {
    seek(fraction * durationSec);
  }

  return (
    <SeekBar
      progress={content.progress}
      elapsed={content.elapsed}
      remaining={content.remaining}
      accessibilityValue={content.accessibilityValue}
      onSeek={handleSeek}
      onAccessibilityStep={handleAccessibilityStep}
    />
  );
}
