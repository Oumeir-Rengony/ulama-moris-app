import { mockPlaybackLecture } from '@/data/mock-ui';
import type { Lecture } from '@/data/sample';

// Which lecture the mini player shows.
// TODO(player stage): replace with "whatever lecture is loaded in the player", from the store.
// Until then: on Event detail, that event's first lecture (so the bar agrees with the active
// row there); everywhere else, the mockPlayback lecture.
export function pickMiniPlayerLecture(eventFirstLecture: Lecture | undefined): Lecture {
  if (eventFirstLecture) {
    return eventFirstLecture;
  }
  return mockPlaybackLecture;
}
