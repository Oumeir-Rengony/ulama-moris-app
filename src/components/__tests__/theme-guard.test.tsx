// Renders every component in light and in dark mode. A component that reads a theme value
// that doesn't exist, or that breaks in one scheme only, makes this test fail.
import { act, screen } from '@testing-library/react-native';
import MapPin from 'lucide-react-native/icons/map-pin';
import { colorScheme } from 'nativewind';
import type { ReactElement } from 'react';

import { Rosette } from '@/components/artwork/rosette';
import { ContinueListeningCard } from '@/components/ContinueListeningCard';
import { DateTile } from '@/components/DateTile';
import { EventDetailHeader } from '@/components/EventDetailHeader';
import { EventHeroCard } from '@/components/EventHeroCard';
import { EventRow } from '@/components/EventRow';
import { EventsListHeader } from '@/components/EventsListHeader';
import { HeroCard } from '@/components/HeroCard';
import { HomeHeader } from '@/components/HomeHeader';
import { HomeListHeader } from '@/components/HomeListHeader';
import { LogoBadge } from '@/components/icons/logo-badge';
import { Skip15Icon } from '@/components/icons/skip-15-icon';
import { EventsTabIcon, HomeTabIcon } from '@/components/icons/tab-icons';
import { LatestEventCard } from '@/components/LatestEventCard';
import { LectureRow } from '@/components/LectureRow';
import { MiniPlayer } from '@/components/MiniPlayer';
import { AudioErrorRow } from '@/components/NowPlaying/audio-error-row';
import { PlayerControls } from '@/components/NowPlaying/player-controls';
import { TrackInfo } from '@/components/NowPlaying/track-info';
import { NumberedLectureRow } from '@/components/NumberedLectureRow';
import { OfflineSheet } from '@/components/OfflineSheet';
import { ScreenTitle } from '@/components/ScreenTitle';
import { ScreenTopBar } from '@/components/ScreenTopBar';
import { HighlightedText } from '@/components/Search/highlighted-text';
import { RecentSearchList } from '@/components/Search/recent-search-list';
import { SearchFieldButton } from '@/components/Search/search-field-button';
import { SearchInput } from '@/components/Search/search-input';
import { SearchResultRow } from '@/components/Search/search-result-row';
import { LoadingFooter, SkeletonRow } from '@/components/Skeleton';
import { TabBarItem } from '@/components/TabBar';
import { Chip } from '@/components/ui/chip';
import { Divider } from '@/components/ui/divider';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorCard } from '@/components/ui/error-card';
import { IconButton } from '@/components/ui/icon-button';
import { IconLabel } from '@/components/ui/icon-label';
import { LoadMoreError } from '@/components/ui/load-more-error';
import { Pill } from '@/components/ui/pill';
import { PlayPauseButton } from '@/components/ui/play-pause-button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { SeekBar } from '@/components/ui/seek-bar';
import { Spinner } from '@/components/ui/spinner';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Text } from '@/components/ui/text';
import { TryAgainButton } from '@/components/ui/try-again-button';
import { renderWithProviders } from '@/test-utils/render-with-providers';

const titleParts = [
  { text: 'Sacrifices of the ', highlighted: false },
  { text: 'Şahābā', highlighted: true },
];

const continueListening = {
  title: 'Sacrifices',
  author: 'Mawlana Zyad Ally Quenette',
  state: 'paused' as const,
  progress: 0.35,
  elapsedLabel: '16:05',
  minutesLeftLabel: '31 min left',
};

const latestEvent = {
  title: 'The Sahaba Radiyyallahu Anhum',
  metaLabel: '24 Oct – 31 Oct 2026',
  lectureCountLabel: '4 lectures',
  durationLabel: '2h 34m',
};

// One entry per component, each in its default state.
const everyComponent: { name: string; element: ReactElement }[] = [
  { name: 'Text', element: <Text>Text</Text> },
  { name: 'Chip', element: <Chip label="Local" selected /> },
  { name: 'Divider', element: <Divider /> },
  { name: 'EmptyState', element: <EmptyState title="No results" message="Try again." /> },
  {
    name: 'IconButton',
    element: (
      <IconButton accessibilityLabel="Back">
        <Skip15Icon direction="back" />
      </IconButton>
    ),
  },
  { name: 'IconLabel', element: <IconLabel icon={MapPin} label="Venue" /> },
  { name: 'Pill', element: <Pill label="Topic" variant="category" category={3} /> },
  { name: 'PlayPauseButton', element: <PlayPauseButton state="play" variant="nowPlaying" accessibilityLabel="Play" /> },
  { name: 'ProgressBar', element: <ProgressBar progress={0.5} variant="onEmphasis" /> },
  { name: 'SectionHeader', element: <SectionHeader title="Latest lectures" /> },
  {
    name: 'SeekBar',
    element: <SeekBar progress={0.5} elapsed="1:00" remaining="-1:00" accessibilityValue={{ min: 0, max: 120, now: 60 }} />,
  },
  { name: 'Spinner', element: <Spinner /> },
  { name: 'Spinner on primary', element: <Spinner color="primaryFg" /> },
  { name: 'TryAgainButton primary', element: <TryAgainButton variant="primary" isRetrying={false} /> },
  { name: 'AudioErrorRow', element: <AudioErrorRow message="Check your connection." /> },
  { name: 'OfflineSheet', element: <OfflineSheet status="checking" seriesLabels={['Local', 'Guest']} /> },
  { name: 'TryAgainButton onDanger retrying', element: <TryAgainButton variant="onDanger" isRetrying /> },
  {
    name: 'ErrorCard',
    element: <ErrorCard title="Lectures didn’t load" message="Check your connection." isRetrying={false} />,
  },
  {
    name: 'LoadMoreError',
    element: <LoadMoreError title="More lectures didn’t load" message="Check your connection." isRetrying />,
  },
  {
    name: 'SurfaceCard',
    element: (
      <SurfaceCard>
        <Text>Card</Text>
      </SurfaceCard>
    ),
  },
  { name: 'Rosette', element: <Rosette size={220} /> },
  { name: 'LogoBadge', element: <LogoBadge /> },
  { name: 'HomeTabIcon', element: <HomeTabIcon filled color="primarySubtleFg" /> },
  { name: 'EventsTabIcon', element: <EventsTabIcon filled={false} color="fgMuted" /> },
  { name: 'DateTile', element: <DateTile day="24" month="Oct" category={4} size="row" /> },
  { name: 'HeroCard', element: <HeroCard preset="eventHero" overline="Event" title="Title" /> },
  { name: 'ContinueListeningCard', element: <ContinueListeningCard {...continueListening} /> },
  { name: 'LatestEventCard', element: <LatestEventCard {...latestEvent} /> },
  {
    name: 'EventHeroCard',
    element: <EventHeroCard title="Title" dateLabel="24 – 31 October 2026" lectureCountLabel="4" durationLabel="2h" venue="Venue" />,
  },
  { name: 'LectureRow', element: <LectureRow title="Title" author="Author" metaLabel="Meta" state="active-paused" /> },
  {
    name: 'NumberedLectureRow',
    element: <NumberedLectureRow number="01" title="Title" author="Author" metaLabel="Meta" state="active-playing" />,
  },
  {
    name: 'EventRow',
    element: <EventRow title="Title" statsLabel="Stats" venue="Venue" day="24" month="Oct" category={2} />,
  },
  {
    name: 'MiniPlayer',
    element: (
      <MiniPlayer
        title="Title"
        author="Author"
        playState="playing"
        progressLine={<ProgressBar progress={0.35} variant="miniLine" />}
      />
    ),
  },
  {
    name: 'MiniPlayer loading',
    element: (
      <MiniPlayer
        title="Title"
        author="Author"
        playState="loading"
        progressLine={<ProgressBar progress={0} variant="miniLine" />}
      />
    ),
  },
  { name: 'TabBarItem', element: <TabBarItem tab="events" label="Events" isSelected /> },
  { name: 'SkeletonRow', element: <SkeletonRow variant="lecture" /> },
  { name: 'LoadingFooter', element: <LoadingFooter label="Loading more lectures" /> },
  { name: 'TrackInfo', element: <TrackInfo title="Title" author="Author" topicLabel="Topic" eventTitle="Event" /> },
  { name: 'PlayerControls', element: <PlayerControls state="playing" /> },
  { name: 'ScreenTitle', element: <ScreenTitle title="Events" subtitle="11 events" /> },
  { name: 'ScreenTopBar', element: <ScreenTopBar center={<Text>Event</Text>} /> },
  { name: 'HomeHeader', element: <HomeHeader /> },
  {
    name: 'HomeListHeader',
    element: (
      <HomeListHeader
        continueListening={<ContinueListeningCard {...continueListening} />}
        lectureCountLabel="81 lectures"
        seriesLabels={['Local', 'Guest']}
        selectedSeriesLabel="Local"
      />
    ),
  },
  { name: 'EventsListHeader', element: <EventsListHeader eventCountLabel="11 events" latestEvent={latestEvent} /> },
  {
    name: 'EventDetailHeader',
    element: (
      <EventDetailHeader
        hero={{ title: 'Title', dateLabel: 'Date', lectureCountLabel: '4', durationLabel: '2h' }}
        lectureCount="4"
      />
    ),
  },
  { name: 'SearchFieldButton', element: <SearchFieldButton label="Search by topic" /> },
  { name: 'SearchInput', element: <SearchInput value="sahaba" placeholder="Search by topic" /> },
  { name: 'RecentSearchList', element: <RecentSearchList queries={['Fire']} /> },
  { name: 'HighlightedText', element: <HighlightedText parts={titleParts} /> },
  {
    name: 'SearchResultRow',
    element: (
      <SearchResultRow kind="lecture" titleParts={titleParts} author="Author" metaLabel="Meta" category={5} accessibilityLabel="Open" />
    ),
  },
];

const schemes = ['light', 'dark'] as const;

describe.each(schemes)('every component in %s mode', (scheme) => {
  beforeEach(async () => {
    await act(async () => {
      colorScheme.set(scheme);
    });
  });

  afterAll(async () => {
    await act(async () => {
      colorScheme.set('light');
    });
  });

  it.each(everyComponent)('renders $name', async ({ element }) => {
    await renderWithProviders(element);
    expect(screen.root).toBeOnTheScreen();
  });
});
