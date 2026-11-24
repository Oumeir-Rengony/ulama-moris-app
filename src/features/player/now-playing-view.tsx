import ChevronDown from 'lucide-react-native/icons/chevron-down';
import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoverArt } from '@/components/artwork/cover-art';
import { TrackInfo } from '@/components/NowPlaying/track-info';
import { ScreenTopBar } from '@/components/ScreenTopBar';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import type { Lecture } from '@/features/lectures/lecture.types';
import { useLectureQuery } from '@/features/lectures/lectures.queries';

import { fitArtworkSize, nowPlayingTrackInfo } from './now-playing-content';
import { NowPlayingControls } from './now-playing-controls';
import { NowPlayingProgress } from './now-playing-progress';
import { closeNowPlaying, openEventFromNowPlaying } from './open-now-playing';
import { selectCurrentLecture, selectSourceLabel, usePlayerStore } from './player.store';

const contentMaxWidth = 600;
// px-gutter on each side of the content column.
const sideGutters = 48;
// mt-2.5 above the artwork.
const artworkTopMargin = 10;
// Open ground left below the controls when the artwork has to shrink.
const spaceBelowControls = 16;

function NowPlayingTopBar() {
  const sourceLabel = usePlayerStore(selectSourceLabel);

  return (
    <ScreenTopBar
      left={
        <IconButton accessibilityLabel="Minimise player" tone="ghost" onPress={closeNowPlaying}>
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

// Now Playing's content: the top bar, the artwork, the track info, the seek bar and the controls.
// The Now Playing panel renders it and paints the card colour behind it. It covers the whole
// screen, notch included, so it owns both insets.
export function NowPlayingView() {
  const insets = useSafeAreaInsets();
  const currentLecture = usePlayerStore(selectCurrentLecture);
  // The detail record (topic, event) of the loaded lecture. The queue holds list summaries.
  const { data: lecture } = useLectureQuery(currentLecture?.slug);

  return (
    <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="w-full self-center" style={{ maxWidth: contentMaxWidth }}>
        <NowPlayingTopBar />
      </View>
      {lecture ? <NowPlayingBody lecture={lecture} /> : null}
    </View>
  );
}

type BodyArea = {
  width: number;
  height: number;
};

function NowPlayingBody({ lecture }: { lecture: Lecture }) {
  const trackInfo = nowPlayingTrackInfo(lecture);

  let handleEventPress: (() => void) | undefined = undefined;
  const eventSlug = trackInfo.eventSlug;
  if (eventSlug !== undefined) {
    handleEventPress = () => {
      openEventFromNowPlaying(eventSlug);
    };
  }

  // The artwork's size depends on how much room the screen has, so two things are measured:
  // the body area, and the block under the artwork (whose height doesn't depend on it).
  const [bodyArea, setBodyArea] = useState<BodyArea | null>(null);
  const [belowArtworkHeight, setBelowArtworkHeight] = useState<number | null>(null);

  function handleBodyLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setBodyArea({ width, height });
  }

  function handleBelowArtworkLayout(event: LayoutChangeEvent) {
    setBelowArtworkHeight(event.nativeEvent.layout.height);
  }

  let artworkSize: number | null = null;
  if (bodyArea !== null && belowArtworkHeight !== null) {
    const columnWidth = Math.min(bodyArea.width, contentMaxWidth) - sideGutters;
    artworkSize = fitArtworkSize({
      availableWidth: columnWidth,
      availableHeight: bodyArea.height,
      heightOfEverythingElse: artworkTopMargin + belowArtworkHeight + spaceBelowControls,
    });
  }

  // A plain View, not a ScrollView: the artwork shrinks so everything fits.
  return (
    <View className="flex-1 overflow-hidden" onLayout={handleBodyLayout}>
      <View className="w-full self-center px-gutter" style={{ maxWidth: contentMaxWidth }}>
        <View className="mt-2.5 items-center">
          {artworkSize !== null ? (
            <View className="overflow-hidden rounded-card bg-emphasis" style={{ width: artworkSize, height: artworkSize }}>
              <CoverArt />
            </View>
          ) : null}
        </View>

        <View onLayout={handleBelowArtworkLayout}>
          <View style={{ marginTop: 20 }}>
            <TrackInfo
              title={lecture.title}
              author={lecture.author}
              venue={trackInfo.venue}
              dateLabel={trackInfo.dateLabel}
              topicLabel={trackInfo.topicLabel}
              topicCategory={trackInfo.topicCategory}
              eventTitle={trackInfo.eventTitle}
              onEventPress={handleEventPress}
            />
          </View>
          {/* Only the seek bar (or its error row) and the controls follow the player, so the rest
              doesn't re-render with the position. */}
          <View className="mt-[18px]">
            <NowPlayingProgress dataDuration={lecture.duration} />
          </View>
          <View className="mt-[18px]">
            <NowPlayingControls />
          </View>
        </View>
      </View>
    </View>
  );
}
