import ChevronDown from 'lucide-react-native/icons/chevron-down';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ScrollView, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Artwork } from '@/components/NowPlaying/artwork';
import { TrackInfo } from '@/components/NowPlaying/track-info';
import { ScreenTopBar } from '@/components/ScreenTopBar';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import type { Lecture } from '@/data/sample';
import { useLectureQuery } from '@/features/lectures/lectures.queries';
import { playLecture } from '@/features/player/audio-engine';
import { fitArtworkSize, nowPlayingTrackInfo } from '@/features/player/now-playing-content';
import { NowPlayingControls } from '@/features/player/now-playing-controls';
import { NowPlayingSeekBar } from '@/features/player/now-playing-seek-bar';
import { selectCurrentLecture, selectSourceLabel, usePlayerStore } from '@/features/player/player.store';
import { useNowPlayingPresentation } from '@/features/player/use-now-playing-presentation';

const contentMaxWidth = 600;
// px-gutter on each side of the content column.
const sideGutters = 48;
// mt-2.5 above the artwork.
const artworkTopMargin = 10;
// Open ground left below the controls when the artwork has to shrink.
const spaceBelowControls = 16;

function closePlayer() {
  router.back();
}

function NowPlayingTopBar({ sourceLabel }: { sourceLabel: string }) {
  return (
    <ScreenTopBar
      left={
        <IconButton accessibilityLabel="Minimise player" tone="ghost" onPress={closePlayer}>
          <Icon icon={ChevronDown} size={24} />
        </IconButton>
      }
      center={
        <View className="items-center gap-0.5">
          <Text variant="caption" className="font-manrope-semibold text-fg-muted">
            Playing from
          </Text>
          <Text variant="bodySm" numberOfLines={1} className="font-manrope-bold">
            {sourceLabel}
          </Text>
        </View>
      }
    />
  );
}

// Now Playing: a full-screen modal showing the lecture loaded in the player. Minimising it
// (router.back) never stops playback.
export default function NowPlayingScreen() {
  useNowPlayingPresentation();

  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const currentLecture = usePlayerStore(selectCurrentLecture);
  const sourceLabel = usePlayerStore(selectSourceLabel);

  // A deep link (/player?slug=…) with nothing loaded: load that lecture, paused, so a link never
  // starts sound by surprise.
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

  // The detail record (topic, event) of the loaded lecture. The queue holds list summaries.
  const { data: lecture } = useLectureQuery(currentLecture?.slug);

  // Nothing loaded and nothing to load (no slug, or an unknown one): go home.
  const hasNoSlug = slug === undefined || slug === '';
  const deepLinkNotFound = deepLink.isSuccess && deepLinkedLecture === null;
  if (currentLecture === null && (hasNoSlug || deepLinkNotFound)) {
    return <Redirect href="/" />;
  }

  // No header covers the notch and there is no tab bar, so this screen owns both insets.
  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <StatusBar style="auto" />
      <View className="w-full self-center" style={{ maxWidth: contentMaxWidth }}>
        <NowPlayingTopBar sourceLabel={sourceLabel} />
      </View>
      {lecture ? <NowPlayingBody lecture={lecture} /> : null}
    </View>
  );
}

type Size = {
  width: number;
  height: number;
};

function NowPlayingBody({ lecture }: { lecture: Lecture }) {
  const trackInfo = nowPlayingTrackInfo(lecture);

  // The artwork's size depends on how much room the screen has, so two things are measured:
  // the scroll area, and the block under the artwork (whose height doesn't depend on it).
  const [scrollArea, setScrollArea] = useState<Size | null>(null);
  const [belowArtworkHeight, setBelowArtworkHeight] = useState<number | null>(null);

  function handleScrollAreaLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setScrollArea({ width, height });
  }

  function handleBelowArtworkLayout(event: LayoutChangeEvent) {
    setBelowArtworkHeight(event.nativeEvent.layout.height);
  }

  let artworkSize: number | null = null;
  if (scrollArea !== null && belowArtworkHeight !== null) {
    const columnWidth = Math.min(scrollArea.width, contentMaxWidth) - sideGutters;
    artworkSize = fitArtworkSize({
      availableWidth: columnWidth,
      availableHeight: scrollArea.height,
      heightOfEverythingElse: artworkTopMargin + belowArtworkHeight + spaceBelowControls,
    });
  }

  return (
    <ScrollView className="flex-1" onLayout={handleScrollAreaLayout}>
      <View className="w-full self-center px-gutter" style={{ maxWidth: contentMaxWidth }}>
        {/* Until both sizes are measured (the first frame), the artwork keeps its space empty. */}
        <View className="mt-2.5 items-center">
          {artworkSize !== null ? <Artwork size={artworkSize} /> : null}
        </View>

        <View onLayout={handleBelowArtworkLayout}>
          <View className="mt-5">
            <TrackInfo
              title={lecture.title}
              author={lecture.author}
              venue={trackInfo.venue}
              dateLabel={trackInfo.dateLabel}
              topicLabel={trackInfo.topicLabel}
              topicCategory={trackInfo.topicCategory}
              eventTitle={trackInfo.eventTitle}
            />
          </View>
          {/* Only the seek bar and the controls follow the player, so the artwork and the track
              info don't re-render with the position. */}
          <View className="mt-[18px]">
            <NowPlayingSeekBar dataDuration={lecture.duration} />
          </View>
          <View className="mt-[18px]">
            <NowPlayingControls />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
