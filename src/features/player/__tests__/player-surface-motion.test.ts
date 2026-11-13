// The test Reanimated stand-in (src/test-utils/reanimated-mock.ts) finishes every animation at
// once, so these tests check where each command ends and what it reports, not the timing.
import {
  collapseToMini,
  dropMini,
  enterFresh,
  enterY,
  expand,
  expandFromMini,
  miniDrop,
  riseMini,
  setPrefersReducedMotion,
  surfaceOpacity,
  windowSizeValue,
} from '@/features/player/player-surface-motion';

beforeEach(() => {
  setPrefersReducedMotion(false);
  expand.set(0);
  enterY.set(0);
  miniDrop.set(0);
  surfaceOpacity.set(1);
  windowSizeValue.set({ width: 390, height: 844 });
});

describe('player surface motion', () => {
  it('enterFresh: the full player, arrived, reported once as finished', () => {
    miniDrop.set(1);
    const onFinished = jest.fn();

    enterFresh({ onFinished });

    expect(expand.get()).toBe(1);
    expect(enterY.get()).toBe(0);
    expect(miniDrop.get()).toBe(0);
    expect(onFinished).toHaveBeenCalledTimes(1);
    expect(onFinished).toHaveBeenCalledWith(true);
  });

  it('collapseToMini and expandFromMini end at the bar and at the full player', () => {
    const onCollapsed = jest.fn();
    const onExpanded = jest.fn();
    expand.set(1);

    collapseToMini({ onFinished: onCollapsed });
    expect(expand.get()).toBe(0);
    expect(onCollapsed).toHaveBeenCalledWith(true);

    expandFromMini({ onFinished: onExpanded });
    expect(expand.get()).toBe(1);
    expect(onExpanded).toHaveBeenCalledWith(true);
  });

  it('dropMini ends with the bar gone; riseMini brings it back', () => {
    dropMini();
    expect(miniDrop.get()).toBe(1);

    riseMini();
    expect(miniDrop.get()).toBe(0);
    expect(expand.get()).toBe(0);
  });

  it('dropMini after a swipe keeps falling from where the finger left it', () => {
    miniDrop.set(0.6);

    dropMini();

    expect(miniDrop.get()).toBe(1);
  });

  it('with Reduce Motion the entrance never slides: enterY stays 0, the surface ends visible', () => {
    setPrefersReducedMotion(true);
    const onFinished = jest.fn();

    enterFresh({ onFinished });

    expect(enterY.get()).toBe(0);
    expect(expand.get()).toBe(1);
    expect(surfaceOpacity.get()).toBe(1);
    expect(onFinished).toHaveBeenCalledWith(true);
  });
});
