import {
  BAR_DISMISS_DISTANCE_SHARE,
  BAR_DISMISS_VELOCITY,
  BAR_OPEN_DISTANCE_SHARE,
  BAR_OPEN_VELOCITY,
  PANEL_CLOSE_DISTANCE_SHARE,
  PANEL_CLOSE_VELOCITY,
} from './player-motion-config';

// The decisions a released finger makes, as plain functions, so Jest can test them directly
// even though the drags themselves can only be checked on a device. They are worklets because
// the gestures call them on the UI thread; called from JS (in tests), they are ordinary functions.

export type PanelDecision = 'open' | 'closed';

type PanelReleaseInput = {
  // Where the panel is when the finger lets go: 0 = fully open, `height` = fully closed.
  offset: number;
  // Positive = moving down, in pt/s.
  velocityY: number;
  // The panel's full travel (the screen's height).
  height: number;
};

// Now Playing was let go: does it close to the bar, or spring back open? A flick wins over the
// distance, in either direction, so a quick flick up from low down still re-opens it.
export function decidePanelRelease({ offset, velocityY, height }: PanelReleaseInput): PanelDecision {
  'worklet';
  const isFlickDown = velocityY > PANEL_CLOSE_VELOCITY;
  if (isFlickDown) {
    return 'closed';
  }
  const isFlickUp = velocityY < -PANEL_CLOSE_VELOCITY;
  if (isFlickUp) {
    return 'open';
  }
  const isPastCloseDistance = offset > height * PANEL_CLOSE_DISTANCE_SHARE;
  if (isPastCloseDistance) {
    return 'closed';
  }
  return 'open';
}

type BarReleaseInput = {
  // How far the bar has been dragged down (never negative: the bar doesn't move up).
  translationY: number;
  // Positive = moving down, in pt/s.
  velocityY: number;
  barHeight: number;
};

// The mini player was let go: is it dismissed (playback stops), or does it spring back?
export function shouldDismissBar({ translationY, velocityY, barHeight }: BarReleaseInput): boolean {
  'worklet';
  const isFlickDown = velocityY > BAR_DISMISS_VELOCITY;
  if (isFlickDown) {
    return true;
  }
  const isFlickUp = velocityY < -BAR_DISMISS_VELOCITY;
  if (isFlickUp) {
    return false;
  }
  const isPastDismissDistance = translationY > barHeight * BAR_DISMISS_DISTANCE_SHARE;
  return isPastDismissDistance;
}

type BarSwipeUpInput = {
  // How far the finger moved, negative = up.
  translationY: number;
  // Positive = moving down, in pt/s.
  velocityY: number;
  barHeight: number;
};

// The mini player was swiped up and let go: does it open Now Playing? Only upward swipes count;
// a flick back down at the end cancels it.
export function shouldOpenFromBar({ translationY, velocityY, barHeight }: BarSwipeUpInput): boolean {
  'worklet';
  const isFlickUp = velocityY < -BAR_OPEN_VELOCITY;
  if (isFlickUp) {
    return true;
  }
  const isFlickDown = velocityY > BAR_OPEN_VELOCITY;
  if (isFlickDown) {
    return false;
  }
  const distanceUp = -translationY;
  const isPastOpenDistance = distanceUp > barHeight * BAR_OPEN_DISTANCE_SHARE;
  return isPastOpenDistance;
}
