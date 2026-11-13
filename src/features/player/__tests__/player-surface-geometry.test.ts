import { BACKGROUND_BLEED } from '@/features/player/player-motion-config';
import {
  getBackgroundFrame,
  getCoverTransform,
  getOpenness,
  getSwipeRange,
  getThumbRect,
  shouldCollapseAfterSwipe,
  shouldDismissMini,
  type Rect,
} from '@/features/player/player-surface-geometry';

const windowWidth = 390;
const windowHeight = 844;
// A bar floating above the tab bar, and Now Playing's cover, as measured on a 390 × 844 screen.
const miniRect: Rect = { x: 12, y: 690, width: 366, height: 62 };
const coverRect: Rect = { x: 24, y: 120, width: 342, height: 342 };

function centreOf(rect: Rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

describe('getOpenness', () => {
  it('follows the entrance: 0 below the screen, 0.5 halfway, 1 arrived', () => {
    expect(getOpenness(1, windowHeight, windowHeight)).toBe(0);
    expect(getOpenness(1, windowHeight / 2, windowHeight)).toBe(0.5);
    expect(getOpenness(1, 0, windowHeight)).toBe(1);
  });

  it('follows the morph when there is no entrance', () => {
    expect(getOpenness(0.3, 0, windowHeight)).toBeCloseTo(0.3);
  });

  it("treats the spring's overshoot above the top as fully open", () => {
    expect(getOpenness(1, -10, windowHeight)).toBe(1);
  });
});

describe('getCoverTransform', () => {
  it('at expand 0 puts the cover exactly on the thumbnail, with a visible radius of 10', () => {
    const thumbRect = getThumbRect(miniRect);
    const transform = getCoverTransform(0, thumbRect, coverRect);

    const coverCentre = centreOf(coverRect);
    const thumbCentre = centreOf(thumbRect);
    expect(coverCentre.x + transform.translateX).toBeCloseTo(thumbCentre.x);
    expect(coverCentre.y + transform.translateY).toBeCloseTo(thumbCentre.y);
    expect(transform.scale).toBeCloseTo(44 / coverRect.width);
    expect(transform.borderRadius * transform.scale).toBeCloseTo(10);
  });

  it('at expand 1 leaves the cover where Now Playing lays it out, radius 28', () => {
    const transform = getCoverTransform(1, getThumbRect(miniRect), coverRect);
    expect(transform).toEqual({ translateX: 0, translateY: 0, scale: 1, borderRadius: 28 });
  });

  it('puts the thumbnail 8 px inside the bar', () => {
    expect(getThumbRect(miniRect)).toEqual({ x: 20, y: 698, width: 44, height: 44 });
  });
});

describe('getBackgroundFrame', () => {
  it('is the bar at expand 0', () => {
    expect(getBackgroundFrame(0, miniRect, windowWidth, windowHeight)).toEqual({
      left: 12,
      top: 690,
      width: 366,
      height: 62,
      borderRadius: 20,
    });
  });

  it('is the whole window plus the bleed at expand 1', () => {
    expect(getBackgroundFrame(1, miniRect, windowWidth, windowHeight)).toEqual({
      left: 0,
      top: 0,
      width: windowWidth,
      height: windowHeight + BACKGROUND_BLEED,
      borderRadius: 0,
    });
  });
});

describe('swipe', () => {
  it('moves the cover together with the finger', () => {
    const geometry = { windowWidth, windowHeight, miniRect, coverRect };
    const swipeRange = getSwipeRange(geometry);
    const fingerTravel = 100;
    const expandAfterDrag = 1 - fingerTravel / swipeRange;

    const thumbRect = getThumbRect(miniRect);
    const coverMove = getCoverTransform(expandAfterDrag, thumbRect, coverRect).translateY;
    expect(coverMove).toBeCloseTo(fingerTravel);
  });

  it('collapses Now Playing past 18 % of the screen or on a fast flick', () => {
    expect(shouldCollapseAfterSwipe(0.1 * windowHeight, 200, windowHeight)).toBe(false);
    expect(shouldCollapseAfterSwipe(0.3 * windowHeight, 200, windowHeight)).toBe(true);
    expect(shouldCollapseAfterSwipe(40, 1200, windowHeight)).toBe(true);
  });

  it('dismisses the bar past 24 px or on a fast flick', () => {
    expect(shouldDismissMini(20, 100)).toBe(false);
    expect(shouldDismissMini(30, 100)).toBe(true);
    expect(shouldDismissMini(5, 900)).toBe(true);
  });
});
