import { decidePanelRelease, shouldDismissBar, shouldOpenFromBar } from '@/features/player/panel-rules';
import {
  BAR_DISMISS_VELOCITY,
  BAR_OPEN_VELOCITY,
  PANEL_CLOSE_DISTANCE_SHARE,
  PANEL_CLOSE_VELOCITY,
} from '@/features/player/player-motion-config';

const screenHeight = 844;
const closeDistance = screenHeight * PANEL_CLOSE_DISTANCE_SHARE;

describe('decidePanelRelease (Now Playing let go)', () => {
  it('a small drag down springs back open', () => {
    expect(decidePanelRelease({ offset: 40, velocityY: 100, height: screenHeight })).toBe('open');
  });

  it('a drag past the close distance closes it', () => {
    expect(decidePanelRelease({ offset: closeDistance + 1, velocityY: 0, height: screenHeight })).toBe('closed');
  });

  it('exactly at the close distance stays open', () => {
    expect(decidePanelRelease({ offset: closeDistance, velocityY: 0, height: screenHeight })).toBe('open');
  });

  it('a flick down closes it, however little it moved', () => {
    expect(decidePanelRelease({ offset: 10, velocityY: PANEL_CLOSE_VELOCITY + 1, height: screenHeight })).toBe(
      'closed',
    );
  });

  it('the hardest flick down still only closes it', () => {
    expect(decidePanelRelease({ offset: 200, velocityY: 20000, height: screenHeight })).toBe('closed');
  });

  it('a flick up re-opens it, even from low down (grabbed while closing)', () => {
    expect(
      decidePanelRelease({ offset: screenHeight * 0.8, velocityY: -PANEL_CLOSE_VELOCITY - 1, height: screenHeight }),
    ).toBe('open');
  });

  it('let go slowly low down: closes', () => {
    expect(decidePanelRelease({ offset: screenHeight * 0.8, velocityY: -50, height: screenHeight })).toBe('closed');
  });
});

describe('shouldDismissBar (the mini player let go)', () => {
  const barHeight = 62;

  it('a small drag springs back', () => {
    expect(shouldDismissBar({ translationY: 10, velocityY: 50, barHeight })).toBe(false);
  });

  it('past half its height dismisses it', () => {
    expect(shouldDismissBar({ translationY: barHeight / 2 + 1, velocityY: 0, barHeight })).toBe(true);
  });

  it('a flick down dismisses it, however little it moved', () => {
    expect(shouldDismissBar({ translationY: 5, velocityY: BAR_DISMISS_VELOCITY + 1, barHeight })).toBe(true);
  });

  it('dragged far but flicked back up: springs back', () => {
    expect(shouldDismissBar({ translationY: barHeight, velocityY: -BAR_DISMISS_VELOCITY - 1, barHeight })).toBe(false);
  });
});

describe('shouldOpenFromBar (the mini player swiped up and let go)', () => {
  const barHeight = 62;

  it('a short, slow swipe up does nothing', () => {
    expect(shouldOpenFromBar({ translationY: -10, velocityY: -50, barHeight })).toBe(false);
  });

  it('up past half its height opens Now Playing', () => {
    expect(shouldOpenFromBar({ translationY: -(barHeight / 2 + 1), velocityY: 0, barHeight })).toBe(true);
  });

  it('a flick up opens it, however little it moved', () => {
    expect(shouldOpenFromBar({ translationY: -9, velocityY: -BAR_OPEN_VELOCITY - 1, barHeight })).toBe(true);
  });

  it('swiped up far but flicked back down at the end: does nothing', () => {
    expect(shouldOpenFromBar({ translationY: -barHeight, velocityY: BAR_OPEN_VELOCITY + 1, barHeight })).toBe(false);
  });
});
