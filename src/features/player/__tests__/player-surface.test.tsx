import { act, fireEvent, screen } from '@testing-library/react-native';
import { BackHandler } from 'react-native';

import { MiniPlayer } from '@/components/MiniPlayer';
import * as engine from '@/features/player/audio-engine';
import * as entryPoint from '@/features/player/open-now-playing';
import { PlayerSurface } from '@/features/player/player-surface';
import {
  initialPlayerState,
  usePlayerStore,
  type MirroredStatus,
  type NowPlayingPresentation,
} from '@/features/player/player.store';
import { latestSource, queueOfThree } from '@/test-utils/fixtures';
import { renderWithProviders } from '@/test-utils/render-with-providers';

jest.mock('@/features/player/audio-engine', () => ({
  toggle: jest.fn(),
  skipForward15: jest.fn(),
  skipBack15: jest.fn(),
  seek: jest.fn(),
}));
jest.mock('@/features/player/open-now-playing', () => ({
  openNowPlayingForLoadedLecture: jest.fn(),
  closeNowPlaying: jest.fn(),
  dismissMiniPlayer: jest.fn(),
  beginCloseAfterSwipe: jest.fn(),
  finishCloseAfterSwipe: jest.fn(),
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

function setPresentation(presentation: NowPlayingPresentation) {
  usePlayerStore.getState().setNowPlayingPresentation(presentation);
}

async function renderSurface() {
  await renderWithProviders(<PlayerSurface bottomOffset={90} />);
}

beforeEach(() => {
  usePlayerStore.setState(initialPlayerState);
  jest.clearAllMocks();
});

describe('PlayerSurface', () => {
  it('renders nothing when nothing is loaded', async () => {
    await renderSurface();

    expect(screen.queryByRole('button', { name: /Open player/ })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Minimise player' })).not.toBeOnTheScreen();
  });

  it('closed: the bar is reachable, Now Playing is hidden from screen readers', async () => {
    loadFirst();
    await renderSurface();

    expect(screen.getByRole('button', { name: openLabel })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Minimise player' })).not.toBeOnTheScreen();
  });

  it('open: Now Playing is reachable, the bar is hidden from screen readers', async () => {
    loadFirst();
    setPresentation('open');
    await renderSurface();

    expect(await screen.findByRole('button', { name: 'Minimise player' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: openLabel })).not.toBeOnTheScreen();
  });

  it('the chevron collapses Now Playing', async () => {
    loadFirst();
    setPresentation('open');
    await renderSurface();

    await fireEvent.press(await screen.findByRole('button', { name: 'Minimise player' }));

    expect(entryPoint.closeNowPlaying).toHaveBeenCalledTimes(1);
  });

  it('Android back collapses Now Playing while it is open, and is not handled while closed', async () => {
    const addListener = jest.spyOn(BackHandler, 'addEventListener');
    loadFirst();
    await renderSurface();
    expect(addListener).not.toHaveBeenCalled();

    await act(async () => {
      setPresentation('open');
    });
    expect(addListener).toHaveBeenCalledTimes(1);

    // The handler ignores its argument; the type asks for the back-press event.
    const onBackPress = addListener.mock.calls[0][1] as () => boolean;
    const wasHandled = onBackPress();
    expect(wasHandled).toBe(true);
    expect(entryPoint.closeNowPlaying).toHaveBeenCalledTimes(1);
    addListener.mockRestore();
  });

  it('the text area opens Now Playing for the loaded lecture', async () => {
    loadFirst();
    await renderSurface();
    await fireEvent.press(screen.getByRole('button', { name: openLabel }));

    expect(entryPoint.openNowPlayingForLoadedLecture).toHaveBeenCalledTimes(1);
  });

  it('the bar keeps rendering while the bar drops away, so the drop is visible', async () => {
    loadFirst();
    await renderSurface();
    await act(async () => {
      setPresentation('miniLeaving');
    });

    // Still mounted (hidden from screen readers while it falls).
    expect(screen.getByRole('button', { name: openLabel, hidden: true })).toBeOnTheScreen();
  });

  it('play/pause and forward 15 never open Now Playing', async () => {
    loadFirst();
    await renderSurface();
    await fireEvent.press(screen.getByRole('button', { name: 'Play' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Skip forward 15 seconds' }));

    expect(engine.toggle).toHaveBeenCalledTimes(1);
    expect(engine.skipForward15).toHaveBeenCalledTimes(1);
    expect(entryPoint.openNowPlayingForLoadedLecture).not.toHaveBeenCalled();
  });

  it('shows "Loading" until the audio has loaded', async () => {
    loadFirst({ ...pausedAndLoaded, isLoaded: false });
    await renderSurface();

    expect(screen.getByLabelText('Loading')).toBeOnTheScreen();
  });

  it('the screen-reader dismiss action drops the bar and stops the session', async () => {
    loadFirst();
    await renderSurface();
    await fireEvent(screen.getByRole('button', { name: openLabel }), 'accessibilityAction', {
      nativeEvent: { actionName: 'dismiss' },
    });

    expect(entryPoint.dismissMiniPlayer).toHaveBeenCalledTimes(1);
  });

  it('position updates do not re-render the bar', async () => {
    loadFirst();
    await renderSurface();
    const barRendersBefore = jest.mocked(MiniPlayer).mock.calls.length;

    await act(async () => {
      usePlayerStore.getState().applyStatus({ ...pausedAndLoaded, positionSec: 1390.5 });
    });

    expect(jest.mocked(MiniPlayer).mock.calls.length).toBe(barRendersBefore);
  });
});
