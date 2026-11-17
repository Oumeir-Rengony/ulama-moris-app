import { AudioErrorRow } from '@/components/NowPlaying/audio-error-row';
import { audioErrorMessage, errorAnnouncement } from '@/features/errors/error-copy';
import { useAnnouncement } from '@/hooks/use-announcement';

import { NowPlayingSeekBar } from './now-playing-seek-bar';
import { usePlayerStore } from './player.store';

type NowPlayingProgressProps = {
  // The data's clock string ("46:21"), shown until the audio reports its own length.
  dataDuration: string | undefined;
};

// The row between the track info and the controls: the seek bar, or, when the lecture's audio
// didn't load, the "This lecture didn’t load" row. The seek bar comes back when the lecture is
// opened again and loads.
export function NowPlayingProgress({ dataDuration }: NowPlayingProgressProps) {
  const audioLoadState = usePlayerStore((state) => state.audioLoadState);

  const hasAudioFailed = audioLoadState === 'failed';
  const message = audioErrorMessage;

  let announcement: string | null = null;
  if (hasAudioFailed) {
    announcement = errorAnnouncement('This lecture didn’t load', message);
  }
  useAnnouncement(announcement);

  if (hasAudioFailed) {
    return <AudioErrorRow message={message} />;
  }
  return <NowPlayingSeekBar dataDuration={dataDuration} />;
}
