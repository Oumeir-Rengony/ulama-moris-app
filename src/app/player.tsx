import ChevronDown from 'lucide-react-native/icons/chevron-down';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Artwork } from '@/components/NowPlaying/artwork';
import { PlayerControls } from '@/components/NowPlaying/player-controls';
import { TrackInfo } from '@/components/NowPlaying/track-info';
import { ScreenTopBar } from '@/components/ScreenTopBar';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { SeekBar } from '@/components/ui/seek-bar';
import { Text } from '@/components/ui/text';
import type { Lecture } from '@/data/sample';
import { useEventQuery } from '@/features/events/events.queries';
import { useLectureQuery } from '@/features/lectures/lectures.queries';
import { fitArtworkSize, nowPlayingSeekBar, nowPlayingTrackInfo } from '@/features/player/now-playing-content';

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

// Now Playing: a full-screen modal. Visual only until the player stage: the slider and the
// controls don't do anything yet. Only "Minimise player" works, so there is a way out.
export default function NowPlayingScreen() {
  const insets = useSafeAreaInsets();
  const { slug, fromEventSlug } = useLocalSearchParams<{ slug?: string; fromEventSlug?: string }>();
  const { data: lecture, isSuccess } = useLectureQuery(slug);
  const { data: sourceEvent } = useEventQuery(fromEventSlug);

  // A cold deep link to /player, or an unknown slug: there is nothing to show, so go home.
  const hasNoSlug = slug === undefined || slug === '';
  const lectureNotFound = isSuccess && lecture === null;
  if (hasNoSlug || lectureNotFound) {
    return <Redirect href="/" />;
  }

  // Where the lecture was opened from (HANDOFF §4.4.1). TODO(search stage): the query in quotes.
  let sourceLabel = 'Latest lectures';
  if (sourceEvent) {
    sourceLabel = sourceEvent.event.title;
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
  const seekBar = nowPlayingSeekBar(lecture);

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
          <View className="mt-[18px]">
            <SeekBar
              progress={seekBar.progress}
              elapsed={seekBar.elapsed}
              remaining={seekBar.remaining}
              accessibilityValue={seekBar.accessibilityValue}
            />
          </View>
          {/* TODO(player stage): the real play state; for now always the paused look. */}
          <View className="mt-[18px]">
            <PlayerControls state="paused" />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
