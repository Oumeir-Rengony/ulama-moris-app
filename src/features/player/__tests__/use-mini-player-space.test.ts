import { renderHook } from '@testing-library/react-native';

import { MINI_PLAYER_SPACE } from '@/components/MiniPlayer/tokens';
import { initialPlayerState, usePlayerStore } from '@/features/player/player.store';
import { useMiniPlayerSpace } from '@/features/player/use-mini-player-space';
import { latestSource, queueOfThree } from '@/test-utils/fixtures';

beforeEach(() => {
  usePlayerStore.setState(initialPlayerState);
});

async function readSpace(): Promise<number> {
  const { result } = await renderHook(() => useMiniPlayerSpace());
  return result.current;
}

describe('useMiniPlayerSpace', () => {
  it('is 0 when nothing is loaded', async () => {
    expect(await readSpace()).toBe(0);
  });

  it("is the bar's space while a lecture is active", async () => {
    usePlayerStore.getState().startQueue(queueOfThree, 0, latestSource);
    expect(await readSpace()).toBe(MINI_PLAYER_SPACE);
  });

  it('keeps the space while Now Playing hides the bar, so the list does not jump', async () => {
    usePlayerStore.getState().startQueue(queueOfThree, 0, latestSource);
    usePlayerStore.getState().setIsNowPlayingOnScreen(true);
    expect(await readSpace()).toBe(MINI_PLAYER_SPACE);
  });

  it('is 0 once the queue has ended', async () => {
    usePlayerStore.getState().startQueue(queueOfThree, 0, latestSource);
    usePlayerStore.getState().setHasQueueEnded(true);
    expect(await readSpace()).toBe(0);
  });
});
