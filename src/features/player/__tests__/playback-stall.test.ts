import { checkForStall, initialStallTracker, STALL_LIMIT_MS } from '@/features/player/playback-stall';

const waiting = { isWaitingToPlay: true, positionSec: 100 };

describe('checkForStall', () => {
  it('gives up once the player has waited the limit without moving', () => {
    const first = checkForStall(initialStallTracker, waiting, 0);
    expect(first.hasStalledTooLong).toBe(false);

    const almost = checkForStall(first.tracker, waiting, STALL_LIMIT_MS - 1);
    expect(almost.hasStalledTooLong).toBe(false);

    const atLimit = checkForStall(almost.tracker, waiting, STALL_LIMIT_MS);
    expect(atLimit.hasStalledTooLong).toBe(true);
  });

  it('starts the wait again when the position moves', () => {
    const first = checkForStall(initialStallTracker, waiting, 0);
    const moved = checkForStall(first.tracker, { isWaitingToPlay: true, positionSec: 101 }, 25_000);

    const later = checkForStall(moved.tracker, { isWaitingToPlay: true, positionSec: 101 }, 50_000);

    expect(later.hasStalledTooLong).toBe(false);
  });

  it('never gives up while the player is not waiting (playing, paused, not loaded)', () => {
    const first = checkForStall(initialStallTracker, { isWaitingToPlay: false, positionSec: 100 }, 0);
    const later = checkForStall(first.tracker, { isWaitingToPlay: false, positionSec: 100 }, STALL_LIMIT_MS * 10);

    expect(later.hasStalledTooLong).toBe(false);
  });

  it('forgets an earlier wait once the player stops waiting', () => {
    const waited = checkForStall(initialStallTracker, waiting, 0);
    const resumed = checkForStall(waited.tracker, { isWaitingToPlay: false, positionSec: 100 }, 20_000);

    const waitingAgain = checkForStall(resumed.tracker, waiting, 40_000);

    expect(waitingAgain.hasStalledTooLong).toBe(false);
  });
});
