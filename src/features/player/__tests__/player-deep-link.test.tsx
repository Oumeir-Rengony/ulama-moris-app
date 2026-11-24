import { router, useLocalSearchParams } from 'expo-router';

import PlayerDeepLink from '@/app/player';
import { useLectureQuery } from '@/features/lectures/lectures.queries';
import * as engine from '@/features/player/audio-engine';
import * as entryPoint from '@/features/player/open-now-playing';
import { initialPlayerState, usePlayerStore } from '@/features/player/player.store';
import { latestSource, queueOfThree } from '@/test-utils/fixtures';
import { renderWithProviders } from '@/test-utils/render-with-providers';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));
jest.mock('@/features/lectures/lectures.queries', () => ({
  useLectureQuery: jest.fn(),
}));
jest.mock('@/features/player/audio-engine', () => ({
  playLecture: jest.fn(),
}));
jest.mock('@/features/player/open-now-playing', () => ({
  showNowPlayingFromDeepLink: jest.fn(),
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
  jest.mocked(router.canGoBack).mockReturnValue(true);
});

// The /player route is only the deep-link (and reminder-tap) entry: Now Playing itself is the panel
// in the tabs layout, tested in now-playing-panel.test.tsx.
describe('/player deep link', () => {
  it('with a lecture loaded: opens Now Playing, then steps out of the way', async () => {
    loadFirst();
    await renderWithProviders(<PlayerDeepLink />);

    expect(entryPoint.showNowPlayingFromDeepLink).toHaveBeenCalledTimes(1);
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('opened cold (nothing to go back to): leaves for the tabs', async () => {
    jest.mocked(router.canGoBack).mockReturnValue(false);
    loadFirst();
    await renderWithProviders(<PlayerDeepLink />);

    expect(entryPoint.showNowPlayingFromDeepLink).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('a deep link with nothing loaded loads the linked lecture, paused', async () => {
    searchParams.mockReturnValue({ slug: first.slug });
    await renderWithProviders(<PlayerDeepLink />);

    expect(engine.playLecture).toHaveBeenCalledWith(first, [first], { kind: 'latest' }, { autoplay: false });
  });

  it('a deep link never replaces the loaded lecture', async () => {
    loadFirst();
    searchParams.mockReturnValue({ slug: queueOfThree[2].slug });
    await renderWithProviders(<PlayerDeepLink />);

    expect(engine.playLecture).not.toHaveBeenCalled();
  });

  it('goes to the tabs when there is nothing to show', async () => {
    lectureQuery.mockReturnValue(lectureQueryResult(undefined, false));
    await renderWithProviders(<PlayerDeepLink />);

    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('goes to the tabs when the linked lecture does not exist', async () => {
    searchParams.mockReturnValue({ slug: 'no-such-lecture' });
    lectureQuery.mockReturnValue(lectureQueryResult(null, true));
    await renderWithProviders(<PlayerDeepLink />);

    expect(router.replace).toHaveBeenCalledWith('/');
  });
});
