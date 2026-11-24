import { act, fireEvent, screen } from '@testing-library/react-native';

import { MiniPlayer } from '@/components/MiniPlayer';
import * as engine from '@/features/player/audio-engine';
import { MiniPlayerBar } from '@/features/player/mini-player-bar';
import * as entryPoint from '@/features/player/open-now-playing';
import { initialPlayerState, usePlayerStore, type MirroredStatus } from '@/features/player/player.store';
import { latestSource, queueOfThree } from '@/test-utils/fixtures';
import { renderWithProviders } from '@/test-utils/render-with-providers';

jest.mock('@/features/player/audio-engine', () => ({
  toggle: jest.fn(),
  skipForward15: jest.fn(),
}));
jest.mock('@/features/player/open-now-playing', () => ({
  openNowPlayingForLoadedLecture: jest.fn(),
  dismissMiniPlayer: jest.fn(),
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

async function renderBar(bottomOffset = 90) {
  await renderWithProviders(<MiniPlayerBar bottomOffset={bottomOffset} />);
}

beforeEach(() => {
  usePlayerStore.setState(initialPlayerState);
  jest.clearAllMocks();
});

describe('MiniPlayerBar', () => {
  it('renders nothing when nothing is loaded', async () => {
    await renderBar();

    expect(screen.queryByRole('button', { name: /Open player/ })).not.toBeOnTheScreen();
  });

  it('shows the loaded lecture', async () => {
    loadFirst();
    await renderBar();

    expect(screen.getByRole('button', { name: openLabel })).toBeOnTheScreen();
  });

  it('waits for the tab bar to be measured', async () => {
    loadFirst();
    await renderBar(0);

    expect(screen.queryByRole('button', { name: openLabel })).not.toBeOnTheScreen();
  });

  it('goes away once the queue has ended', async () => {
    loadFirst();
    await renderBar();

    await act(async () => {
      usePlayerStore.getState().setHasQueueEnded(true);
    });

    expect(screen.queryByRole('button', { name: openLabel })).not.toBeOnTheScreen();
  });

  it('the text area opens Now Playing for the loaded lecture', async () => {
    loadFirst();
    await renderBar();

    await fireEvent.press(screen.getByRole('button', { name: openLabel }));

    expect(entryPoint.openNowPlayingForLoadedLecture).toHaveBeenCalledTimes(1);
  });

  it('play/pause and forward 15 never open Now Playing', async () => {
    loadFirst();
    await renderBar();

    await fireEvent.press(screen.getByRole('button', { name: 'Play' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Skip forward 15 seconds' }));

    expect(engine.toggle).toHaveBeenCalledTimes(1);
    expect(engine.skipForward15).toHaveBeenCalledTimes(1);
    expect(entryPoint.openNowPlayingForLoadedLecture).not.toHaveBeenCalled();
  });

  it('shows "Loading" until the audio has loaded', async () => {
    loadFirst({ ...pausedAndLoaded, isLoaded: false });
    await renderBar();

    expect(screen.getByLabelText('Loading')).toBeOnTheScreen();
  });

  it('the screen-reader dismiss action stops the session', async () => {
    loadFirst();
    await renderBar();

    await fireEvent(screen.getByRole('button', { name: openLabel }), 'accessibilityAction', {
      nativeEvent: { actionName: 'dismiss' },
    });

    expect(entryPoint.dismissMiniPlayer).toHaveBeenCalledTimes(1);
  });

  it('position updates do not re-render the bar', async () => {
    loadFirst();
    await renderBar();
    const barRendersBefore = jest.mocked(MiniPlayer).mock.calls.length;

    await act(async () => {
      usePlayerStore.getState().applyStatus({ ...pausedAndLoaded, positionSec: 1390.5 });
    });

    expect(jest.mocked(MiniPlayer).mock.calls.length).toBe(barRendersBefore);
  });
});
