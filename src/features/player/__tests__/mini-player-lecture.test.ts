import { mockPlaybackLecture } from '@/data/mock-ui';
import { pickMiniPlayerLecture } from '@/features/player/mini-player-lecture';
import { fullLecture } from '@/test-utils/fixtures';

describe('pickMiniPlayerLecture', () => {
  it("shows the event's first lecture on Event detail", () => {
    expect(pickMiniPlayerLecture(fullLecture)).toBe(fullLecture);
  });

  it('shows the mock playback lecture everywhere else', () => {
    expect(pickMiniPlayerLecture(undefined)).toBe(mockPlaybackLecture);
  });
});
