import { act, fireEvent, screen } from '@testing-library/react-native';

import * as engine from '@/features/player/audio-engine';
import { NowPlayingControls } from '@/features/player/now-playing-controls';
import { NowPlayingSeekBar } from '@/features/player/now-playing-seek-bar';
import { initialPlayerState, usePlayerStore } from '@/features/player/player.store';
import { renderWithProviders } from '@/test-utils/render-with-providers';

jest.mock('@/features/player/audio-engine', () => ({
  toggle: jest.fn(),
  seek: jest.fn(),
  skipBack15: jest.fn(),
  skipForward15: jest.fn(),
}));

beforeEach(() => {
  usePlayerStore.setState(initialPlayerState);
  jest.clearAllMocks();
});

describe('NowPlayingControls', () => {
  it('shows what the player reports, not what was pressed', async () => {
    usePlayerStore.setState({ isPlaying: true });
    await renderWithProviders(<NowPlayingControls />);

    await fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
    expect(engine.toggle).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Pause' })).toBeOnTheScreen();

    await act(async () => {
      usePlayerStore.setState({ isPlaying: false });
    });
    expect(screen.getByRole('button', { name: 'Play' })).toBeOnTheScreen();
  });

  it('back and forward skip 15 seconds', async () => {
    await renderWithProviders(<NowPlayingControls />);
    await fireEvent.press(screen.getByRole('button', { name: 'Back 15 seconds' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Forward 15 seconds' }));

    expect(engine.skipBack15).toHaveBeenCalledTimes(1);
    expect(engine.skipForward15).toHaveBeenCalledTimes(1);
  });
});

describe('NowPlayingSeekBar', () => {
  it('shows the live elapsed and remaining times', async () => {
    usePlayerStore.setState({ positionSec: 965, durationSec: 2781 });
    await renderWithProviders(<NowPlayingSeekBar dataDuration="46:21" />);

    expect(screen.getByText('16:05')).toBeOnTheScreen();
    expect(screen.getByText('-30:16')).toBeOnTheScreen();
    expect(screen.getByRole('adjustable', { name: 'Seek position' })).toHaveAccessibilityValue({
      min: 0,
      max: 2781,
      now: 965,
      text: '16:05 of 46:21',
    });
  });

  it("shows the data's duration as the remaining time before the audio has loaded", async () => {
    await renderWithProviders(<NowPlayingSeekBar dataDuration="46:21" />);
    expect(screen.getByText('0:00')).toBeOnTheScreen();
    expect(screen.getByText('-46:21')).toBeOnTheScreen();
  });

  it('screen readers step by 15 seconds', async () => {
    usePlayerStore.setState({ positionSec: 965, durationSec: 2781 });
    await renderWithProviders(<NowPlayingSeekBar dataDuration="46:21" />);
    const seekBar = screen.getByRole('adjustable', { name: 'Seek position' });

    await fireEvent(seekBar, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    await fireEvent(seekBar, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });

    expect(engine.skipForward15).toHaveBeenCalledTimes(1);
    expect(engine.skipBack15).toHaveBeenCalledTimes(1);
  });
});
