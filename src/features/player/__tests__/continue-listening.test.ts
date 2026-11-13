import { buildContinueListeningContent } from '@/features/player/continue-listening';
import { bareLecture, fullLecture } from '@/test-utils/fixtures';

describe('buildContinueListeningContent', () => {
  it('is empty when there is nothing to continue', () => {
    expect(
      buildContinueListeningContent({ lecture: undefined, savedPositionSec: 0, isActive: false, isPlaying: false }),
    ).toBeUndefined();
    expect(
      buildContinueListeningContent({ lecture: null, savedPositionSec: 0, isActive: false, isPlaying: false }),
    ).toBeUndefined();
  });

  it('shows the saved position and the time left', () => {
    const content = buildContinueListeningContent({
      lecture: fullLecture,
      savedPositionSec: 965,
      isActive: false,
      isPlaying: false,
    });
    expect(content?.title).toBe(fullLecture.title);
    expect(content?.author).toBe(fullLecture.author);
    expect(content?.state).toBe('paused');
    expect(content?.progress).toBeCloseTo(965 / 2781, 5);
    expect(content?.elapsedLabel).toBe('16:05');
    expect(content?.minutesLeftLabel).toBe('31 min left');
  });

  it('shows "playing" only when it is the loaded lecture and it plays', () => {
    const playingElsewhere = buildContinueListeningContent({
      lecture: fullLecture,
      savedPositionSec: 0,
      isActive: false,
      isPlaying: true,
    });
    expect(playingElsewhere?.state).toBe('paused');

    const playingHere = buildContinueListeningContent({
      lecture: fullLecture,
      savedPositionSec: 0,
      isActive: true,
      isPlaying: true,
    });
    expect(playingHere?.state).toBe('playing');
  });

  it('shows no progress or time left when the duration is unknown', () => {
    const content = buildContinueListeningContent({
      lecture: bareLecture,
      savedPositionSec: 120,
      isActive: false,
      isPlaying: false,
    });
    expect(content?.progress).toBe(0);
    expect(content?.minutesLeftLabel).toBe('');
    expect(content?.elapsedLabel).toBe('2:00');
  });
});
