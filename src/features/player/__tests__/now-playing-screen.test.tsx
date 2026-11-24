import { fireEvent, screen } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import PlayerScreen from '@/app/player';
import { useLectureQuery } from '@/features/lectures/lectures.queries';
import * as engine from '@/features/player/audio-engine';
import * as entryPoint from '@/features/player/open-now-playing';
import { initialPlayerState, usePlayerStore } from '@/features/player/player.store';
import { latestSource, queueOfThree } from '@/test-utils/fixtures';
import { renderWithProviders } from '@/test-utils/render-with-providers';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));
jest.mock('@/features/lectures/lectures.queries', () => ({
  useLectureQuery: jest.fn(),
}));
jest.mock('@/features/player/audio-engine', () => ({
  playLecture: jest.fn(),
  toggle: jest.fn(),
  seek: jest.fn(),
  skipBack15: jest.fn(),
  skipForward15: jest.fn(),
}));
jest.mock('@/features/player/open-now-playing', () => ({
  closeNowPlaying: jest.fn(),
  openEventFromNowPlaying: jest.fn(),
}));

const [first] = queueOfThree;
const searchParams = jest.mocked(useLocalSearchParams);
const lectureQuery = jest.mocked(useLectureQuery);

// The query hook's result, reduced to what the screen reads.
function lectureQueryResult(lecture: typeof first | null | undefined, isSuccess: boolean) {
  return { data: lecture, isSuccess } as unknown as ReturnType<typeof useLectureQuery>;
}

function loadFirst() {
  usePlayerStore.getState().startQueue(queueOfThree, 0, latestSource);
}

beforeEach(() => {
  usePlayerStore.setState(initialPlayerState);
  jest.clearAllMocks();
  searchParams.mockReturnValue({});
  lectureQuery.mockReturnValue(lectureQueryResult(first, true));
});

describe('Now Playing screen', () => {
  it('shows the loaded lecture', async () => {
    loadFirst();
    await renderWithProviders(<PlayerScreen />);

    expect(screen.getByRole('button', { name: 'Minimise player' })).toBeOnTheScreen();
    expect(screen.getByText(first.title)).toBeOnTheScreen();
  });

  it('the chevron closes Now Playing', async () => {
    loadFirst();
    await renderWithProviders(<PlayerScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Minimise player' }));

    expect(entryPoint.closeNowPlaying).toHaveBeenCalledTimes(1);
  });

  it('a deep link with nothing loaded loads the linked lecture, paused', async () => {
    searchParams.mockReturnValue({ slug: first.slug });
    await renderWithProviders(<PlayerScreen />);

    expect(engine.playLecture).toHaveBeenCalledWith(first, [first], { kind: 'latest' }, { autoplay: false });
  });

  it('a deep link never replaces the loaded lecture', async () => {
    loadFirst();
    searchParams.mockReturnValue({ slug: queueOfThree[2].slug });
    await renderWithProviders(<PlayerScreen />);

    expect(engine.playLecture).not.toHaveBeenCalled();
  });

  it('goes to the tabs when there is nothing to show', async () => {
    lectureQuery.mockReturnValue(lectureQueryResult(undefined, false));
    await renderWithProviders(<PlayerScreen />);

    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('goes to the tabs when the linked lecture does not exist', async () => {
    searchParams.mockReturnValue({ slug: 'no-such-lecture' });
    lectureQuery.mockReturnValue(lectureQueryResult(null, true));
    await renderWithProviders(<PlayerScreen />);

    expect(router.replace).toHaveBeenCalledWith('/');
  });
});
