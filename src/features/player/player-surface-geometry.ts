import {
  BACKGROUND_BLEED,
  COLLAPSE_SWIPE_SHARE,
  COLLAPSE_SWIPE_VELOCITY,
  DISMISS_SWIPE_DISTANCE,
  DISMISS_SWIPE_VELOCITY,
  FULL_COVER_RADIUS,
  MINI_BAR_RADIUS,
  MINI_THUMB_INSET,
  MINI_THUMB_RADIUS,
  MINI_THUMB_SIZE,
} from './player-motion-config';

// Pure functions that turn the three motion values into positions and sizes. Each starts with
// 'worklet', so the animated styles call them on the UI thread, and Jest calls them as plain
// functions. All rectangles are in window coordinates.

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SurfaceGeometry = {
  windowWidth: number;
  windowHeight: number;
  // The floating bar, measured from its own layout. Zero size until it has been laid out.
  miniRect: Rect;
  // The full player's cover, calculated from the measured body. Zero size until then.
  coverRect: Rect;
};

export const emptyRect: Rect = { x: 0, y: 0, width: 0, height: 0 };

function clamp(value: number, min: number, max: number): number {
  'worklet';
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

function mix(from: number, to: number, progress: number): number {
  'worklet';
  return from + (to - from) * progress;
}

// 0 while the fresh entrance sheet is still below the screen, 1 once it has arrived. 1 at all
// other times (enterY is 0 outside an entrance). The spring's overshoot (enterY < 0) counts as 1.
export function getEntranceProgress(enterY: number, windowHeight: number): number {
  'worklet';
  if (windowHeight <= 0) {
    return 1;
  }
  const remainingShare = clamp(enterY / windowHeight, 0, 1);
  return 1 - remainingShare;
}

// How far Now Playing covers the screen behind it, 0 to 1. Drives the tuck. One formula follows
// the entrance spring (expand is 1, enterY moves), the morph (enterY is 0, expand moves) and the
// finger.
export function getOpenness(expand: number, enterY: number, windowHeight: number): number {
  'worklet';
  const entranceProgress = getEntranceProgress(enterY, windowHeight);
  return expand * entranceProgress;
}

// The 44 px thumbnail inside the bar, where the cover lands when collapsed.
export function getThumbRect(miniRect: Rect): Rect {
  'worklet';
  return {
    x: miniRect.x + MINI_THUMB_INSET,
    y: miniRect.y + MINI_THUMB_INSET,
    width: MINI_THUMB_SIZE,
    height: MINI_THUMB_SIZE,
  };
}

export type BackgroundFrame = {
  left: number;
  top: number;
  width: number;
  height: number;
  borderRadius: number;
};

// The background view grows from the bar's rectangle (expand 0) to the whole window plus the
// bleed below it (expand 1).
export function getBackgroundFrame(expand: number, miniRect: Rect, windowWidth: number, windowHeight: number): BackgroundFrame {
  'worklet';
  const fullHeight = windowHeight + BACKGROUND_BLEED;
  return {
    left: mix(miniRect.x, 0, expand),
    top: mix(miniRect.y, 0, expand),
    width: mix(miniRect.width, windowWidth, expand),
    height: mix(miniRect.height, fullHeight, expand),
    borderRadius: mix(MINI_BAR_RADIUS, 0, expand),
  };
}

export type CoverTransform = {
  translateX: number;
  translateY: number;
  scale: number;
  // Applied to the cover view, which is scaled. Divided by the scale so the radius you see goes
  // from the thumbnail's 10 to the full cover's 28.
  borderRadius: number;
};

// The cover is laid out at its full position (coverRect). At expand 0 it is moved and scaled so
// it sits exactly on the bar's thumbnail. Transform order is translate, then scale (around the
// centre), so the translation moves centre onto centre.
export function getCoverTransform(expand: number, thumbRect: Rect, coverRect: Rect): CoverTransform {
  'worklet';
  if (coverRect.width <= 0) {
    return { translateX: 0, translateY: 0, scale: 1, borderRadius: FULL_COVER_RADIUS };
  }

  const coverCentreX = coverRect.x + coverRect.width / 2;
  const coverCentreY = coverRect.y + coverRect.height / 2;
  const thumbCentreX = thumbRect.x + thumbRect.width / 2;
  const thumbCentreY = thumbRect.y + thumbRect.height / 2;

  const collapsedScale = thumbRect.width / coverRect.width;
  const scale = mix(collapsedScale, 1, expand);
  const translateX = mix(thumbCentreX - coverCentreX, 0, expand);
  const translateY = mix(thumbCentreY - coverCentreY, 0, expand);

  const visibleRadius = mix(MINI_THUMB_RADIUS, FULL_COVER_RADIUS, expand);
  return {
    translateX,
    translateY,
    scale,
    borderRadius: visibleRadius / scale,
  };
}

// The distance the finger travels to take Now Playing from open to the bar: how far the cover's
// centre moves on its way down to the thumbnail. So a point on the cover stays under the finger.
// Dividing by the window height instead would make the player lag behind the finger.
export function getSwipeRange(geometry: SurfaceGeometry): number {
  'worklet';
  const thumbRect = getThumbRect(geometry.miniRect);
  const coverCentreY = geometry.coverRect.y + geometry.coverRect.height / 2;
  const thumbCentreY = thumbRect.y + thumbRect.height / 2;
  const coverTravel = thumbCentreY - coverCentreY;
  if (coverTravel > 0) {
    return coverTravel;
  }
  return geometry.windowHeight;
}

export function shouldCollapseAfterSwipe(translationY: number, velocityY: number, windowHeight: number): boolean {
  'worklet';
  const isFarEnough = translationY > COLLAPSE_SWIPE_SHARE * windowHeight;
  const isFastEnough = velocityY > COLLAPSE_SWIPE_VELOCITY;
  return isFarEnough || isFastEnough;
}

export function shouldDismissMini(translationY: number, velocityY: number): boolean {
  'worklet';
  const isFarEnough = translationY > DISMISS_SWIPE_DISTANCE;
  const isFastEnough = velocityY > DISMISS_SWIPE_VELOCITY;
  return isFarEnough || isFastEnough;
}
