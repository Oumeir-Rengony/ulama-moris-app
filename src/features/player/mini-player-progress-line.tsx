import { ProgressBar } from '@/components/ui/progress-bar';

import { usePlayerStore } from './player.store';

// The mini player's 3px progress line. The only part of the bar that reads the position, which
// changes four times a second, so the rest of the bar doesn't re-render with it.
export function MiniPlayerProgressLine() {
  const positionSec = usePlayerStore((state) => state.positionSec);
  const durationSec = usePlayerStore((state) => state.durationSec);

  let progress = 0;
  if (durationSec > 0) {
    progress = positionSec / durationSec;
  }

  return <ProgressBar progress={progress} variant="miniLine" />;
}
