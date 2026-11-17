// Decides when a lecture that stopped mid-way (the connection dropped while it played) counts as
// failed. Pure: PlayerStatusBridge reads the live player every STALL_CHECK_INTERVAL_MS and passes
// the reading in.
//
// Why it's needed: when the connection drops during playback, iOS doesn't report an error. The
// player keeps waiting for data ("waitingToPlayAtSpecifiedRate") and sends no status update, so
// without this the mini player would show its loading spinner forever. Android and web report an
// error instead, which the bridge already handles.

// How long the player may wait for data without moving before the lecture counts as failed.
// Long enough for a slow connection or a tunnel to recover by itself.
export const STALL_LIMIT_MS = 30_000;

// How often the bridge reads the player.
export const STALL_CHECK_INTERVAL_MS = 5_000;

export type StallReading = {
  // The player wants to play but is waiting for data (iOS timeControlStatus).
  isWaitingToPlay: boolean;
  positionSec: number;
};

export type StallTracker = {
  // When the current wait started, or null while the player isn't waiting.
  waitingSinceMs: number | null;
  lastPositionSec: number;
};

export const initialStallTracker: StallTracker = {
  waitingSinceMs: null,
  lastPositionSec: 0,
};

export type StallCheck = {
  tracker: StallTracker;
  hasStalledTooLong: boolean;
};

export function checkForStall(tracker: StallTracker, reading: StallReading, nowMs: number): StallCheck {
  // Playing, paused or not loaded: nothing to watch.
  if (!reading.isWaitingToPlay) {
    return {
      tracker: { waitingSinceMs: null, lastPositionSec: reading.positionSec },
      hasStalledTooLong: false,
    };
  }

  // Waiting, but the position moved since the last check: it's still making progress, so the
  // wait starts again from now.
  const hasMoved = reading.positionSec !== tracker.lastPositionSec;
  let waitingSinceMs = tracker.waitingSinceMs;
  if (waitingSinceMs === null || hasMoved) {
    waitingSinceMs = nowMs;
  }

  const waitedMs = nowMs - waitingSinceMs;
  return {
    tracker: { waitingSinceMs, lastPositionSec: reading.positionSec },
    hasStalledTooLong: waitedMs >= STALL_LIMIT_MS,
  };
}
