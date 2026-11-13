import { act, fireEvent, screen } from '@testing-library/react-native';

import { MiniPlayer } from '@/components/MiniPlayer';
import * as engine from '@/features/player/audio-engine';
import { MiniPlayerSlot } from '@/features/player/mini-player-slot';
import * as entryPoint from '@/features/player/open-now-playing';
import { initialPlayerState, usePlayerStore, type MirroredStatus } from '@/features/player/player.store';
import { latestSource, queueOfThree } from '@/test-utils/fixtures';
import { renderWithProviders } from '@/test-utils/render-with-providers';

jest.mock('@/features/player/audio-engine', () => ({
  toggle: jest.fn(),
  skipForward15: jest.fn(),
  stopAndClear: jest.fn(),
}));
jest.mock('@/features/player/open-now-playing', () => ({
  openNowPlayingForLoadedLecture: jest.fn(),
}));
// The real MiniPlayer, wrapped so a test can count how often it renders.
jest.mock('@/components/MiniPlayer', () => {
  const actual = jest.requireActual('@/components/MiniPlayer');
  return { MiniPlayer: jest.fn(actual.MiniPlayer) };
});

const [first] = queueOfThree;
const openLabel = `Open player: ${first.title}, ${first.author}`;

const pausedAndLoaded: MirroredStatus = {
  isPlaying: false,
  isBuffering: false,
  isLoaded: true,
  positionSec: 965,
  durationSec: 2781,
};

function loadFirst(status: MirroredStatus = pausedAndLoaded) {
  usePlayerStore.getState().startQueue(queueOfThree, 0, latestSource);
  usePlayerStore.getState().applyStatus(status);
}

async function renderSlot() {
  await renderWithProviders(<MiniPlayerSlot bottomOffset={90} />);
}

beforeEach(() => {
  usePlayerStore.setState(initialPlayerState);
  jest.clearAllMocks();
});

describe('MiniPlayerSlot', () => {
  it('renders nothing when nothing is loaded', async () => {
    await renderSlot();
    expect(screen.queryByRole('button', { name: /Open player/ })).not.toBeOnTheScreen();
  });

  it('shows the loaded lecture', async () => {
    loadFirst();
    await renderSlot();

    expect(screen.getByRole('button', { name: openLabel })).toBeOnTheScreen();
    expect(screen.getByText(first.title)).toBeOnTheScreen();
    expect(screen.getByText(first.author)).toBeOnTheScreen();
  });

  it('waits for the tab bar to be measured before showing', async () => {
    loadFirst();
    await renderWithProviders(<MiniPlayerSlot bottomOffset={0} />);
    expect(screen.queryByRole('button', { name: openLabel })).not.toBeOnTheScreen();
  });

  it('is hidden while Now Playing is on screen, and when the queue has ended', async () => {
    loadFirst();
    usePlayerStore.getState().setIsNowPlayingOnScreen(true);
    await renderSlot();
    expect(screen.queryByRole('button', { name: openLabel })).not.toBeOnTheScreen();

    await act(async () => {
      usePlayerStore.getState().setIsNowPlayingOnScreen(false);
    });
    expect(screen.getByRole('button', { name: openLabel })).toBeOnTheScreen();

    await act(async () => {
      usePlayerStore.getState().setHasQueueEnded(true);
    });
    expect(screen.queryByRole('button', { name: openLabel })).not.toBeOnTheScreen();
  });

  it('the text area opens Now Playing for the loaded lecture', async () => {
    loadFirst();
    await renderSlot();
    await fireEvent.press(screen.getByRole('button', { name: openLabel }));

    expect(entryPoint.openNowPlayingForLoadedLecture).toHaveBeenCalledTimes(1);
  });

  it('play/pause and forward 15 never open Now Playing', async () => {
    loadFirst();
    await renderSlot();
    await fireEvent.press(screen.getByRole('button', { name: 'Play' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Skip forward 15 seconds' }));

    expect(engine.toggle).toHaveBeenCalledTimes(1);
    expect(engine.skipForward15).toHaveBeenCalledTimes(1);
    expect(entryPoint.openNowPlayingForLoadedLecture).not.toHaveBeenCalled();
  });

  it('shows what the player reports, not what was pressed', async () => {
    loadFirst({ ...pausedAndLoaded, isPlaying: true });
    await renderSlot();

    await fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
    expect(engine.toggle).toHaveBeenCalledTimes(1);
    // Still "Pause": only the next status update changes it.
    expect(screen.getByRole('button', { name: 'Pause' })).toBeOnTheScreen();

    await act(async () => {
      usePlayerStore.getState().applyStatus(pausedAndLoaded);
    });
    expect(screen.getByRole('button', { name: 'Play' })).toBeOnTheScreen();
  });

  it('shows "Loading" until the audio has loaded', async () => {
    loadFirst({ ...pausedAndLoaded, isLoaded: false });
    await renderSlot();
    expect(screen.getByLabelText('Loading')).toBeOnTheScreen();
  });

  it('the screen-reader dismiss action stops and clears the session', async () => {
    loadFirst();
    await renderSlot();
    await fireEvent(screen.getByRole('button', { name: openLabel }), 'accessibilityAction', {
      nativeEvent: { actionName: 'dismiss' },
    });

    expect(engine.stopAndClear).toHaveBeenCalledTimes(1);
  });

  it('position updates move the progress line without re-rendering the bar', async () => {
    loadFirst();
    await renderSlot();
    const barRendersBefore = jest.mocked(MiniPlayer).mock.calls.length;

    await act(async () => {
      usePlayerStore.getState().applyStatus({ ...pausedAndLoaded, positionSec: 1390.5 });
    });

    expect(jest.mocked(MiniPlayer).mock.calls.length).toBe(barRendersBefore);
    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({ now: 50 });
  });
});
