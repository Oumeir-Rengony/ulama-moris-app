import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { useLectureQuery } from '@/features/lectures/lectures.queries';
import { playLecture } from '@/features/player/audio-engine';
import { showNowPlayingFromDeepLink } from '@/features/player/open-now-playing';
import { selectCurrentLecture, usePlayerStore } from '@/features/player/player.store';

// Only for deep links (/player?slug=…). Nothing in the app navigates here: Now Playing is an
// overlay in the tabs layout (PlayerSurface). This route loads the lecture if needed, shows the
// overlay without an entrance (a cold start), and steps out of the way.
function leaveToTabs() {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/');
}

export default function PlayerDeepLink() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const currentLecture = usePlayerStore(selectCurrentLecture);

  // Nothing loaded: load the linked lecture, paused, so a link never starts sound by surprise.
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
  const isReadyToShow = currentLecture !== null;

  useEffect(() => {
    if (hasNothingToShow) {
      router.replace('/');
      return;
    }
    if (isReadyToShow) {
      showNowPlayingFromDeepLink();
      leaveToTabs();
    }
  }, [hasNothingToShow, isReadyToShow]);

  // Shown for a frame or two while the lecture loads.
  return <View className="flex-1 bg-bg" />;
}
