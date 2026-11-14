import { act, fireEvent, screen } from '@testing-library/react-native';

import { lectures } from '@/data/sample';
import * as engine from '@/features/player/audio-engine';
import { ContinueListeningSection } from '@/features/player/continue-listening-section';
import { initialListeningHistoryState, useListeningHistoryStore } from '@/features/player/listening-history.store';
import * as openNowPlayingFlows from '@/features/player/open-now-playing';
import { initialPlayerState, usePlayerStore } from '@/features/player/player.store';
import { clockToSeconds } from '@/utils/format-time';
import { renderWithProviders } from '@/test-utils/render-with-providers';

jest.mock('@/features/player/audio-engine', () => ({
  toggle: jest.fn(),
}));

jest.mock('@/features/player/open-now-playing', () => ({
  openNowPlaying: jest.fn(),
}));

const lecture = lectures[0];

beforeEach(() => {
  usePlayerStore.setState(initialPlayerState);
  useListeningHistoryStore.setState(initialListeningHistoryState);
  jest.clearAllMocks();
});

function makeLectureActive(isPlaying: boolean, positionSec: number) {
  usePlayerStore.getState().startQueue([lecture], 0, { kind: 'latest' });
  usePlayerStore.setState({ isPlaying, positionSec });
}

describe('ContinueListeningSection', () => {
  it('shows nothing before any lecture has been played', async () => {
    await renderWithProviders(<ContinueListeningSection queue={lectures} />);

    expect(screen.queryByText('Continue listening')).toBeNull();
  });

  it('shows the saved progress of the last played lecture', async () => {
    useListeningHistoryStore.getState().saveProgress(lecture.slug, 965);

    await renderWithProviders(<ContinueListeningSection queue={lectures} />);

    expect(await screen.findByText(lecture.title)).toBeOnTheScreen();
    expect(screen.getByText('16:05')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: `Play ${lecture.title}` })).toBeOnTheScreen();
  });

  it('follows the live position while its lecture plays', async () => {
    useListeningHistoryStore.getState().saveProgress(lecture.slug, 965);
    makeLectureActive(true, 965);
    await renderWithProviders(<ContinueListeningSection queue={lectures} />);
    expect(await screen.findByText('16:05')).toBeOnTheScreen();

    // Between checkpoints: the saved point hasn't moved, the live position has.
    await act(async () => {
      usePlayerStore.setState({ positionSec: 970 });
    });

    expect(screen.getByText('16:10')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: `Pause ${lecture.title}` })).toBeOnTheScreen();
  });

  it('hides once its lecture has been finished', async () => {
    useListeningHistoryStore.getState().saveProgress(lecture.slug, 965);
    await renderWithProviders(<ContinueListeningSection queue={lectures} />);
    expect(await screen.findByText(lecture.title)).toBeOnTheScreen();

    await act(async () => {
      useListeningHistoryStore.getState().markFinished(lecture.slug);
    });

    expect(screen.queryByText(lecture.title)).toBeNull();
  });

  it('opens a lecture that is not loaded, so it resumes from the saved point', async () => {
    useListeningHistoryStore.getState().saveProgress(lecture.slug, 965);
    await renderWithProviders(<ContinueListeningSection queue={lectures} />);

    await fireEvent.press(await screen.findByRole('button', { name: `Play ${lecture.title}` }));

    expect(openNowPlayingFlows.openNowPlaying).toHaveBeenCalledWith(
      expect.objectContaining({ lecture: expect.objectContaining({ slug: lecture.slug }), resumeIfPaused: true }),
    );
    expect(engine.toggle).not.toHaveBeenCalled();
  });

  it('plays or pauses in place when its lecture is the loaded one', async () => {
    useListeningHistoryStore.getState().saveProgress(lecture.slug, 965);
    makeLectureActive(false, 965);
    await renderWithProviders(<ContinueListeningSection queue={lectures} />);

    await fireEvent.press(await screen.findByRole('button', { name: `Play ${lecture.title}` }));

    expect(engine.toggle).toHaveBeenCalledTimes(1);
    expect(openNowPlayingFlows.openNowPlaying).not.toHaveBeenCalled();
  });
});

// The sample lecture must be long enough for the times above.
it('the sample lecture is longer than 16:10', () => {
  expect(clockToSeconds(lectures[0].duration) ?? 0).toBeGreaterThan(970);
});
