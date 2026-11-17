import { ProgressBar } from '@/components/ui/progress-bar';

import { selectHasAudioFailed, usePlayerStore } from './player.store';

// The mini player's 3px progress line. The only part of the bar that reads the position, which
// changes four times a second, so the rest of the bar doesn't re-render with it.
// In the error colour while the lecture's audio didn't load.
export function MiniPlayerProgressLine() {
  const positionSec = usePlayerStore((state) => state.positionSec);
  const durationSec = usePlayerStore((state) => state.durationSec);
  const hasAudioFailed = usePlayerStore(selectHasAudioFailed);

  let progress = 0;
  if (durationSec > 0) {
    progress = positionSec / durationSec;
  }

  if (hasAudioFailed) {
    return <ProgressBar progress={progress} variant="miniErrorLine" />;
  }
  return <ProgressBar progress={progress} variant="miniLine" />;
}
