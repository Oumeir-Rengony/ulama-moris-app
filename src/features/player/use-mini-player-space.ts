import { MINI_PLAYER_SPACE } from '@/components/MiniPlayer/tokens';

import { selectActiveLectureSlug, usePlayerStore, type PlayerState } from './player.store';

function selectHasActiveLecture(state: PlayerState): boolean {
  return selectActiveLectureSlug(state) !== null;
}

// Extra bottom padding for a tab screen's list, so its last row scrolls clear of the floating
// mini player. It follows "a lecture is active", not whether the bar is visible right now: while
// Now Playing is open the bar is hidden but the space stays, so the list doesn't jump when Now
// Playing closes and the bar comes back.
export function useMiniPlayerSpace(): number {
  const hasActiveLecture = usePlayerStore(selectHasActiveLecture);
  if (!hasActiveLecture) {
    return 0;
  }
  return MINI_PLAYER_SPACE;
}
