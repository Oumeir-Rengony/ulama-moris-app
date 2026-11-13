import { fireEvent, screen } from '@testing-library/react-native';

import { ProgressBar } from '@/components/ui/progress-bar';
import { fractionAlongTrack, SeekBar } from '@/components/ui/seek-bar';
import { renderWithProviders } from '@/test-utils/render-with-providers';

// The filled part of the bar is the first child of the given element.
function filledPart(element: ReturnType<typeof screen.getByRole>) {
  const firstChild = element.children[0];
  if (typeof firstChild === 'string') {
    throw new Error('Expected the bar to contain a View, not text');
  }
  return firstChild;
}

describe('ProgressBar', () => {
  it('reports its progress as a percentage', async () => {
    await renderWithProviders(<ProgressBar progress={0.35} variant="onEmphasis" />);
    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({ min: 0, max: 100, now: 35 });
  });

  it('fills the bar to the progress', async () => {
    await renderWithProviders(<ProgressBar progress={0.35} variant="onEmphasis" />);
    expect(filledPart(screen.getByRole('progressbar'))).toHaveStyle({ width: '35%' });
  });

  it('clamps progress above 1 and below 0', async () => {
    await renderWithProviders(<ProgressBar progress={1.5} variant="miniLine" />);
    expect(screen.getByRole('progressbar')).toHaveStyle({ width: '100%' });
    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({ now: 100 });

    await renderWithProviders(<ProgressBar progress={-0.2} variant="onEmphasis" />);
    expect(filledPart(screen.getByRole('progressbar'))).toHaveStyle({ width: '0%' });
    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({ now: 0 });
  });
});

describe('SeekBar', () => {
  const accessibilityValue = { min: 0, max: 2781, now: 965, text: '16:05 of 46:21' };

  it('is an adjustable element with the position as its value', async () => {
    await renderWithProviders(
      <SeekBar progress={0.35} elapsed="16:05" remaining="-30:16" accessibilityValue={accessibilityValue} />,
    );
    const slider = screen.getByRole('adjustable', { name: 'Seek position' });
    expect(slider).toHaveAccessibilityValue(accessibilityValue);
  });

  it('shows the elapsed and remaining times', async () => {
    await renderWithProviders(
      <SeekBar progress={0.35} elapsed="16:05" remaining="-30:16" accessibilityValue={accessibilityValue} />,
    );
    expect(screen.getByText('16:05')).toBeOnTheScreen();
    expect(screen.getByText('-30:16')).toBeOnTheScreen();
  });

  it('clamps the fill to 0–100%', async () => {
    await renderWithProviders(
      <SeekBar progress={2} elapsed="46:21" remaining="-0:00" accessibilityValue={accessibilityValue} />,
    );
    const track = filledPart(screen.getByRole('adjustable'));
    expect(filledPart(track)).toHaveStyle({ width: '100%' });
  });
});

describe('fractionAlongTrack', () => {
  it('is the touch position over the track width', () => {
    expect(fractionAlongTrack(225, 300)).toBe(0.75);
  });

  it('stays between 0 and 1 when the finger leaves the track', () => {
    expect(fractionAlongTrack(-20, 300)).toBe(0);
    expect(fractionAlongTrack(340, 300)).toBe(1);
  });

  it('is 0 before the track has been measured', () => {
    expect(fractionAlongTrack(100, 0)).toBe(0);
  });
});

describe('SeekBar accessibility actions', () => {
  it('reports increment and decrement', async () => {
    const handleStep = jest.fn();
    await renderWithProviders(
      <SeekBar
        progress={0.35}
        elapsed="16:05"
        remaining="-30:16"
        accessibilityValue={{ min: 0, max: 2781, now: 965, text: '16:05 of 46:21' }}
        onAccessibilityStep={handleStep}
      />,
    );
    const seekBar = screen.getByRole('adjustable', { name: 'Seek position' });

    await fireEvent(seekBar, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    await fireEvent(seekBar, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });

    expect(handleStep).toHaveBeenNthCalledWith(1, 'increment');
    expect(handleStep).toHaveBeenNthCalledWith(2, 'decrement');
  });
});
