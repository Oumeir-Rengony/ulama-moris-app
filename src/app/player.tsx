import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { useLectureQuery } from '@/features/lectures/lectures.queries';
import { playLecture } from '@/features/player/audio-engine';
import { NowPlayingView } from '@/features/player/now-playing-view';
import { selectCurrentLecture, usePlayerStore } from '@/features/player/player.store';

// Now Playing. Opened by open-now-playing.ts (rows, Continue listening, Search, the mini player)
// and by deep links (/player?slug=…, a reminder notification).
export default function PlayerScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const currentLecture = usePlayerStore(selectCurrentLecture);

  // A deep link with nothing loaded: load the linked lecture, paused, so a link never starts
  // sound by surprise.
  let deepLinkSlug: string | undefined = undefined;
  if (currentLecture === null && slug !== undefined && slug !== '') {
    deepLinkSlug = slug;
  }
  const deepLink = useLectureQuery(deepLinkSlug);
  const deepLinkedLecture = deepLink.data;

  useEffect(() => {
    if (currentLecture === null && deepLinkedLecture) {
      playLecture(deepLinkedLecture, [deepLinkedLecture], { kind: 'latest' }, { autoplay: false });
    }
  }, [currentLecture, deepLinkedLecture]);

  const hasNoSlug = slug === undefined || slug === '';
  const deepLinkNotFound = deepLink.isSuccess && deepLinkedLecture === null;
  const hasNothingToShow = currentLecture === null && (hasNoSlug || deepLinkNotFound);

  useEffect(() => {
    if (hasNothingToShow) {
      router.replace('/');
    }
  }, [hasNothingToShow]);

  // Shown for a moment while a deep-linked lecture loads.
  if (currentLecture === null) {
    return <View className="flex-1 bg-bg" />;
  }
  return <NowPlayingView />;
}
