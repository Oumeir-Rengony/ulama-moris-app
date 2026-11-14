// Development-only gallery: every reusable component in every visual state, filled with mock
// data, on the real ground and gutters. Compare each section with the screen designs in light
// and dark. Nothing here is wired up: no presses, no state.
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Layers from 'lucide-react-native/icons/layers';
import MapPin from 'lucide-react-native/icons/map-pin';
import Play from 'lucide-react-native/icons/play';
import Radio from 'lucide-react-native/icons/radio';
import Search from 'lucide-react-native/icons/search';
import Share from 'lucide-react-native/icons/share';
import { Redirect, router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoverArt } from '@/components/artwork/cover-art';
import { Rosette } from '@/components/artwork/rosette';
import { ContinueListeningCard } from '@/components/ContinueListeningCard';
import { DateTile } from '@/components/DateTile';
import { EventHeroCard } from '@/components/EventHeroCard';
import { EventRow } from '@/components/EventRow';
import { HomeHeader } from '@/components/HomeHeader';
import { LogoBadge } from '@/components/icons/logo-badge';
import { Skip15Icon } from '@/components/icons/skip-15-icon';
import { EventsTabIcon, HomeTabIcon } from '@/components/icons/tab-icons';
import { LatestEventCard } from '@/components/LatestEventCard';
import { LectureRow, type LectureRowState } from '@/components/LectureRow';
import { MiniPlayer } from '@/components/MiniPlayer';
import { miniPlayer } from '@/components/MiniPlayer/tokens';
import { Artwork } from '@/components/NowPlaying/artwork';
import { PlayerControls } from '@/components/NowPlaying/player-controls';
import { TrackInfo } from '@/components/NowPlaying/track-info';
import { NumberedLectureRow } from '@/components/NumberedLectureRow';
import { ScreenTitle } from '@/components/ScreenTitle';
import { ScreenTopBar } from '@/components/ScreenTopBar';
import { HighlightedText } from '@/components/Search/highlighted-text';
import { RecentSearchList } from '@/components/Search/recent-search-list';
import { SearchFieldButton } from '@/components/Search/search-field-button';
import { SearchInput } from '@/components/Search/search-input';
import { SearchResultRow } from '@/components/Search/search-result-row';
import { LoadingFooter, SkeletonRow } from '@/components/Skeleton';
import { tabBar } from '@/components/TabBar/tokens';
import { TabBarItem } from '@/components/TabBar';
import { Chip } from '@/components/ui/chip';
import { Divider } from '@/components/ui/divider';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { IconLabel } from '@/components/ui/icon-label';
import { Pill } from '@/components/ui/pill';
import { PlayPauseButton } from '@/components/ui/play-pause-button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionHeader, SectionHeaderAction, SectionHeaderCount } from '@/components/ui/section-header';
import { SeekBar } from '@/components/ui/seek-bar';
import { Spinner } from '@/components/ui/spinner';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Text } from '@/components/ui/text';
import {
  mockEventDetailRowMeta,
  mockEventStats,
  mockHomeRowMeta,
  mockLatestEventMeta,
  mockPlayback,
  mockSearchResults,
} from '@/data/mock-ui';
import {
  events,
  eventsTotal,
  latestLecturesTotal,
  lectures,
  lectureSeries,
  seedRecentSearches,
  topicLabels,
  topicOrder,
  type Lecture,
} from '@/data/sample';
import { catAt, catForTopic } from '@/theme/tokens';
import { formatVenue } from '@/utils/format-venue';

// ---------- Mock lookups ----------

function findLecture(slug: string): Lecture {
  for (const lecture of lectures) {
    if (lecture.slug === slug) {
      return lecture;
    }
  }
  throw new Error(`Gallery: no mock lecture with slug "${slug}"`);
}

function lectureTopic(lecture: Lecture): string | undefined {
  if (lecture.category.length === 0) {
    return undefined;
  }
  return lecture.category[0];
}

const playingLecture = findLecture(mockPlayback.lectureSlug);
const playingTopic = lectureTopic(playingLecture) ?? '';
const sahabaEvent = events[0];
const jummahEvent = events[4];
const sahabaEventLectures = lectures.filter((lecture) => lecture.event === sahabaEvent.title);
const threeLineTitleLecture = findLecture('the-treaty-of-hudaybiyyah-how-an-apparent-setback-became-a-clear-victory');
const noDurationLecture = findLecture('a-country-on-fire-analysis-and-lessons');
const homeMockLectures = lectures.slice(0, 6);

// ---------- Gallery layout pieces ----------

function GallerySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mt-10 gap-4">
      <View className="gap-1 border-b border-border pb-2">
        <Text variant="overline" className="text-fg-muted">
          Component
        </Text>
        <Text variant="h2">{title}</Text>
      </View>
      {children}
    </View>
  );
}

function StateLabel({ children }: { children: string }) {
  return (
    <Text variant="caption" className="font-manrope-semibold text-fg-muted">
      {children}
    </Text>
  );
}

function Example({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <StateLabel>{label}</StateLabel>
      {children}
    </View>
  );
}

// The bar's 44 px cover thumbnail. In the app the player surface draws the cover over an empty
// space instead, so the cover can grow into Now Playing's artwork.
const miniPlayerThumbnail = (
  <View className="h-11 w-11 overflow-hidden rounded-[10px] bg-emphasis">
    <CoverArt />
  </View>
);

// The floating mini player above the tab bar footer, drawn statically. In the app the bar is a
// separate layer in the tabs layout, 8px above the tab bar; the footer is the tab bar alone.
function FooterMock({ selectedTab }: { selectedTab: 'home' | 'events' }) {
  return (
    <View className="gap-2">
      <View className="px-bar">
        <MiniPlayer
          title={playingLecture.title}
          author={playingLecture.author}
          playState="paused"
          progressLine={<ProgressBar progress={mockPlayback.progress} variant="miniLine" />}
          thumbnail={miniPlayerThumbnail}
        />
      </View>
      <View className={`flex-row gap-1 bg-bg px-bar pb-6 pt-2 ${tabBar.divider}`}>
        <TabBarItem tab="home" label="Home" isSelected={selectedTab === 'home'} />
        <TabBarItem tab="events" label="Events" isSelected={selectedTab === 'events'} />
      </View>
    </View>
  );
}

// ---------- Sections ----------

function DataSection() {
  return (
    <GallerySection title="Data helpers">
      <Example label="formatVenue: all caps → title case">
        <Text variant="bodySm">{formatVenue('MASJID MUSWALLA, HIGHLANDS')}</Text>
      </Example>
      <Example label="formatVenue: mixed case is left unchanged">
        <Text variant="bodySm">{formatVenue('Nuʿmān Ibn Thābit, Quatre Bornes')}</Text>
      </Example>
      <Example label="topicOrder → catForTopic (rotation, same colour on every screen)">
        <View className="flex-row flex-wrap gap-2">
          {topicOrder.map((topic) => (
            <Pill
              key={topic}
              label={topicLabels[topic] ?? topic}
              variant="category"
              size="lg"
              category={catForTopic(topic, topicOrder)}
            />
          ))}
        </View>
      </Example>
    </GallerySection>
  );
}

function IconsSection() {
  return (
    <GallerySection title="Icons and artwork">
      <Example label="Icon (lucide, semantic colours; Play filled)">
        <View className="flex-row items-center gap-4">
          <Icon icon={Search} />
          <Icon icon={MapPin} color="fgMuted" />
          <Icon icon={Radio} color="primary" />
          <Icon icon={Play} color="primary" filled />
          <Icon icon={ArrowRight} color="secondaryStrong" strokeWidth={2.4} />
        </View>
      </Example>
      <Example label="Skip15Icon back / forward (26 and 22)">
        <View className="flex-row items-center gap-4">
          <Skip15Icon direction="back" size={26} />
          <Skip15Icon direction="forward" size={26} />
          <Skip15Icon direction="back" size={22} color="fgMuted" />
          <Skip15Icon direction="forward" size={22} color="fgMuted" />
        </View>
      </Example>
      <Example label="Tab icons: filled (active) and outline">
        <View className="flex-row items-center gap-4">
          <HomeTabIcon filled color="primarySubtleFg" />
          <HomeTabIcon filled={false} color="fgMuted" />
          <EventsTabIcon filled color="primarySubtleFg" />
          <EventsTabIcon filled={false} color="fgMuted" />
        </View>
      </Example>
      <Example label="LogoBadge (fixed palette)">
        <LogoBadge size={40} />
      </Example>
      <Example label="Rosette (fixed palette, on emphasis)">
        <View className="h-40 w-40 items-center justify-center overflow-hidden rounded-card bg-emphasis">
          <Rosette size={140} />
        </View>
      </Example>
      <Example label="CoverArt (square crop of the portrait image)">
        <View className="h-40 w-40 overflow-hidden rounded-card">
          <CoverArt />
        </View>
      </Example>
    </GallerySection>
  );
}

function ButtonsSection() {
  return (
    <GallerySection title="IconButton and PlayPauseButton">
      <Example label="IconButton md: surface / ghost / ground / primary">
        <View className="flex-row items-center gap-3 rounded-row bg-surface-1 p-3">
          <IconButton accessibilityLabel="Back" tone="surface">
            <Icon icon={ChevronLeft} size={22} strokeWidth={2.2} />
          </IconButton>
          <IconButton accessibilityLabel="Minimise player" tone="ghost">
            <Icon icon={ChevronDown} size={24} />
          </IconButton>
          <IconButton accessibilityLabel="Share event" tone="ground">
            <Icon icon={Share} size={20} />
          </IconButton>
          <IconButton accessibilityLabel="Search events" tone="primary">
            <Icon icon={Search} size={20} color="primaryFg" />
          </IconButton>
        </View>
      </Example>
      <Example label="IconButton lg (Now Playing skip)">
        <View className="flex-row gap-3">
          <IconButton accessibilityLabel="Back 15 seconds" size="lg">
            <Skip15Icon direction="back" />
          </IconButton>
          <IconButton accessibilityLabel="Forward 15 seconds" size="lg">
            <Skip15Icon direction="forward" />
          </IconButton>
        </View>
      </Example>
      <Example label="PlayPauseButton row / rowActive (play and pause)">
        <View className="flex-row items-center gap-3 rounded-row bg-surface-2 p-3">
          <PlayPauseButton state="play" variant="row" accessibilityLabel="Play" />
          <PlayPauseButton state="pause" variant="row" accessibilityLabel="Pause" />
          <PlayPauseButton state="play" variant="rowActive" accessibilityLabel="Play" />
          <PlayPauseButton state="pause" variant="rowActive" accessibilityLabel="Pause" />
        </View>
      </Example>
      <Example label="PlayPauseButton hero (on emphasis)">
        <View className="flex-row items-center gap-3 rounded-card bg-emphasis p-4">
          <PlayPauseButton state="play" variant="hero" accessibilityLabel="Play" />
          <PlayPauseButton state="pause" variant="hero" accessibilityLabel="Pause" />
        </View>
      </Example>
      <Example label="PlayPauseButton mini (on the mini player bar)">
        <View className={`flex-row items-center gap-3 self-start rounded-mini p-2 ${miniPlayer.bg} ${miniPlayer.outline}`}>
          <PlayPauseButton state="play" variant="mini" accessibilityLabel="Play" />
          <PlayPauseButton state="pause" variant="mini" accessibilityLabel="Pause" />
        </View>
      </Example>
      <Example label="PlayPauseButton nowPlaying: paused (radius 38) / playing (radius 26)">
        <View className="flex-row items-center gap-6 py-2">
          <PlayPauseButton state="play" variant="nowPlaying" accessibilityLabel="Play" />
          <PlayPauseButton state="pause" variant="nowPlaying" accessibilityLabel="Pause" />
        </View>
      </Example>
    </GallerySection>
  );
}

function ChipsAndPillsSection() {
  return (
    <GallerySection title="Chip and Pill">
      <Example label="Chip: selected / not selected">
        <View className="flex-row flex-wrap gap-2">
          {lectureSeries.map((series, index) => (
            <Chip key={series.key} label={series.label} selected={index === 0} />
          ))}
        </View>
      </Example>
      <Example label="Pill category md (Events count chip, fixed cat-1)">
        <Pill label={`${eventsTotal} events`} variant="category" size="md" category={1} icon={Radio} />
      </Example>
      <Example label="Pill on emphasis: sm (EVENT), md, md with icon">
        <View className="flex-row flex-wrap items-center gap-2 rounded-card bg-emphasis p-4">
          <Pill label="Event" variant="onEmphasis" size="sm" icon={Radio} />
          <Pill label="4 lectures" variant="onEmphasis" />
          <Pill label="Masjid Muswalla, Highlands" variant="onEmphasis" icon={MapPin} />
        </View>
      </Example>
      <Example label="Pill category lg (topic) + outline lg (event link, ellipsised)">
        <View className="flex-row gap-2">
          <Pill
            label={topicLabels[playingTopic] ?? playingTopic}
            variant="category"
            size="lg"
            category={catForTopic(playingTopic, topicOrder)}
          />
          <Pill
            label={sahabaEvent.title}
            variant="outline"
            size="lg"
            icon={Layers}
            accessibilityLabel={`Open event: ${sahabaEvent.title}`}
          />
        </View>
      </Example>
    </GallerySection>
  );
}

function SurfacesSection() {
  return (
    <GallerySection title="SurfaceCard, EmptyState, SectionHeader, Divider, IconLabel">
      <Example label="SurfaceCard compact">
        <SurfaceCard>
          <Text variant="bodySm">Lowest raised surface (surface-1), radius 22.</Text>
        </SurfaceCard>
      </Example>
      <Example label="EmptyState with title (empty series)">
        <EmptyState title="No Guest lectures yet" message="New recordings from this series will appear here." />
      </Example>
      <Example label="EmptyState with title (no results)">
        <EmptyState title="No results for “fire”" message="Try a topic, such as Ṣaḥābā, Finance or Fire." />
      </Example>
      <Example label="EmptyState without title (no recents)">
        <EmptyState message="Your searches will appear here." />
      </Example>
      <Example label="SectionHeader section + count">
        <SectionHeader title="Latest lectures" trailing={<SectionHeaderCount label={`${latestLecturesTotal} lectures`} />} />
      </Example>
      <Example label="SectionHeader small + action">
        <SectionHeader title="Recent searches" size="small" trailing={<SectionHeaderAction label="Clear all" />} />
      </Example>
      <Example label="Divider">
        <Divider />
      </Example>
      <Example label="IconLabel md (Now Playing) and sm (Event row)">
        <View className="gap-2">
          <IconLabel icon={MapPin} label="Masjid Muswalla, Highlands" />
          <IconLabel icon={MapPin} label="Masjid Muswalla, Highlands" size="sm" />
        </View>
      </Example>
    </GallerySection>
  );
}

function ProgressSection() {
  return (
    <GallerySection title="ProgressBar, SeekBar, Spinner">
      <Example label="ProgressBar onEmphasis (35%)">
        <View className="rounded-card bg-emphasis p-4">
          <ProgressBar progress={mockPlayback.progress} variant="onEmphasis" />
        </View>
      </Example>
      <Example label="ProgressBar miniLine (inside a positioned bar)">
        <View className="h-12 overflow-hidden rounded-mini bg-inverse dark:bg-emphasis">
          <ProgressBar progress={mockPlayback.progress} variant="miniLine" />
        </View>
      </Example>
      <Example label="SeekBar (visual only)">
        <SeekBar
          progress={mockPlayback.progress}
          elapsed={mockPlayback.elapsed}
          remaining={mockPlayback.remaining}
          accessibilityValue={{ min: 0, max: 2781, now: 965, text: `${mockPlayback.elapsed} of ${mockPlayback.total}` }}
        />
      </Example>
      <Example label="Spinner (static)">
        <Spinner size={18} />
      </Example>
    </GallerySection>
  );
}

function CardsSection() {
  return (
    <GallerySection title="Hero cards">
      <Example label="ContinueListeningCard paused (no rosette, deliberate)">
        <ContinueListeningCard
          title={playingLecture.title}
          author={playingLecture.author}
          state="paused"
          progress={mockPlayback.progress}
          elapsedLabel={mockPlayback.elapsed}
          minutesLeftLabel={mockPlayback.minutesLeft}
        />
      </Example>
      <Example label="ContinueListeningCard playing">
        <ContinueListeningCard
          title={playingLecture.title}
          author={playingLecture.author}
          state="playing"
          progress={mockPlayback.progress}
          elapsedLabel={mockPlayback.elapsed}
          minutesLeftLabel={mockPlayback.minutesLeft}
        />
      </Example>
      <Example label="LatestEventCard (the whole card is one button)">
        <LatestEventCard
          title={sahabaEvent.title}
          metaLabel={mockLatestEventMeta}
          lectureCountLabel={`${sahabaEvent.total} lectures`}
          durationLabel={sahabaEvent.duration}
        />
      </Example>
      <Example label="EventHeroCard with venue">
        <EventHeroCard
          title={sahabaEvent.title}
          dateLabel={sahabaEvent.dateRangeLong}
          lectureCountLabel={`${sahabaEvent.total} recorded lectures`}
          durationLabel={sahabaEvent.duration}
          venue={formatVenue(sahabaEvent.location ?? '')}
        />
      </Example>
      <Example label="EventHeroCard without venue">
        <EventHeroCard
          title={jummahEvent.title}
          dateLabel={jummahEvent.dateRangeLong}
          lectureCountLabel={`${jummahEvent.total} recorded lectures`}
          durationLabel={jummahEvent.duration}
        />
      </Example>
    </GallerySection>
  );
}

const lectureRowStates: { state: LectureRowState; label: string }[] = [
  { state: 'idle', label: 'idle' },
  { state: 'active-paused', label: 'active, paused' },
  { state: 'active-playing', label: 'active, playing' },
];

function RowsSection() {
  return (
    <GallerySection title="Rows">
      {lectureRowStates.map((entry) => (
        <Example key={entry.state} label={`LectureRow ${entry.label}`}>
          <LectureRow
            title={playingLecture.title}
            author={playingLecture.author}
            metaLabel={mockHomeRowMeta[playingLecture.slug]}
            state={entry.state}
          />
        </Example>
      ))}
      <Example label="LectureRow: long title clamped to 2 lines">
        <LectureRow
          title={threeLineTitleLecture.title}
          author={threeLineTitleLecture.author}
          metaLabel={mockHomeRowMeta[threeLineTitleLecture.slug]}
          state="idle"
        />
      </Example>
      <Example label="LectureRow: missing duration">
        <LectureRow
          title={noDurationLecture.title}
          author={noDurationLecture.author}
          metaLabel={mockHomeRowMeta[noDurationLecture.slug]}
          state="idle"
        />
      </Example>

      <Example label="NumberedLectureRow idle">
        <NumberedLectureRow
          number="01"
          title={sahabaEventLectures[0].title}
          author={sahabaEventLectures[0].author}
          metaLabel={mockEventDetailRowMeta[sahabaEventLectures[0].slug]}
          state="idle"
        />
      </Example>
      <Example label="NumberedLectureRow active, paused">
        <NumberedLectureRow
          number="02"
          title={playingLecture.title}
          author={playingLecture.author}
          metaLabel={`Paused · ${mockPlayback.elapsed} / ${mockPlayback.total}`}
          state="active-paused"
        />
      </Example>
      <Example label="NumberedLectureRow active, playing">
        <NumberedLectureRow
          number="02"
          title={playingLecture.title}
          author={playingLecture.author}
          metaLabel={`Now playing · ${mockPlayback.elapsed} / ${mockPlayback.total}`}
          state="active-playing"
        />
      </Example>
      <Example label="NumberedLectureRow: long title clamped to 3 lines">
        <NumberedLectureRow
          number="05"
          title={threeLineTitleLecture.title}
          author={threeLineTitleLecture.author}
          metaLabel="9 Oct · 51:07"
          state="idle"
        />
      </Example>

      <Example label="DateTile row (by position, catAt: wraps after cat-5) and result">
        <View className="flex-row flex-wrap gap-2">
          {events.slice(0, 6).map((event, index) => (
            <DateTile key={event.slug} day={event.day} month={event.month} category={catAt(index)} size="row" />
          ))}
          <DateTile day="24" month="Oct" category={1} size="result" />
        </View>
      </Example>
      <Example label="EventRow with venue">
        <EventRow
          title={sahabaEvent.title}
          statsLabel={mockEventStats[sahabaEvent.slug]}
          venue={formatVenue(sahabaEvent.location ?? '')}
          day={sahabaEvent.day}
          month={sahabaEvent.month}
          category={catAt(0)}
        />
      </Example>
      <Example label="EventRow without venue (date range instead)">
        <EventRow
          title={jummahEvent.title}
          statsLabel={mockEventStats[jummahEvent.slug]}
          dateRangeLabel={jummahEvent.dateRange}
          day={jummahEvent.day}
          month={jummahEvent.month}
          category={catAt(2)}
        />
      </Example>

      <Example label="SkeletonRow lecture + LoadingFooter">
        <View className="gap-2.5">
          <SkeletonRow variant="lecture" />
          <LoadingFooter label="Loading more lectures" />
        </View>
      </Example>
      <Example label="SkeletonRow event + LoadingFooter">
        <View className="gap-2.5">
          <SkeletonRow variant="event" />
          <LoadingFooter label="Loading more events" />
        </View>
      </Example>
    </GallerySection>
  );
}

function HeadersSection() {
  return (
    <GallerySection title="Headers">
      <Example label="ScreenTopBar: Event detail">
        <View className="-mx-gutter">
          <ScreenTopBar
            left={
              <IconButton accessibilityLabel="Back to events" tone="surface">
                <Icon icon={ChevronLeft} size={22} strokeWidth={2.2} />
              </IconButton>
            }
            center={<Text variant="title">Event</Text>}
            right={
              <IconButton accessibilityLabel="Share event" tone="surface">
                <Icon icon={Share} size={20} />
              </IconButton>
            }
          />
        </View>
      </Example>
      <Example label="ScreenTopBar: Now Playing (right spacer keeps the centre centred)">
        <View className="-mx-gutter">
          <ScreenTopBar
            left={
              <IconButton accessibilityLabel="Minimise player" tone="ghost">
                <Icon icon={ChevronDown} size={24} />
              </IconButton>
            }
            center={
              <View className="items-center gap-0.5">
                <Text variant="caption" className="font-manrope-semibold text-fg-muted">
                  Playing from
                </Text>
                <Text variant="bodySm" numberOfLines={1} className="font-manrope-bold">
                  {mockPlayback.sourceLabel}
                </Text>
              </View>
            }
          />
        </View>
      </Example>
      <Example label="HomeHeader">
        <View className="-mx-gutter">
          <HomeHeader />
        </View>
      </Example>
      <Example label="ScreenTitle with trailing search button">
        <View className="-mx-gutter">
          <ScreenTitle
            title="Events"
            subtitle="Conferences, programmes and gatherings we have recorded."
            trailing={
              <IconButton accessibilityLabel="Search events" tone="surface">
                <Icon icon={Search} size={20} />
              </IconButton>
            }
          />
        </View>
      </Example>
    </GallerySection>
  );
}

function SearchSection() {
  const sahabaTopicCategory = catForTopic('sahaba r.a', topicOrder);

  return (
    <GallerySection title="Search">
      <Example label="SearchFieldButton (Home)">
        <SearchFieldButton label="Search by topic" />
      </Example>
      <Example label="SearchInput empty: lectures scope (mic)">
        <SearchInput value="" placeholder="Search by topic" />
      </Example>
      <Example label="SearchInput empty: events scope">
        <SearchInput value="" placeholder="Search events by name" />
      </Example>
      <Example label="SearchInput with text (clear ✕)">
        <SearchInput value={mockSearchResults.query} placeholder="Search by topic" />
      </Example>
      <Example label="RecentSearchList: 5 rows">
        <View className="gap-1">
          <SectionHeader title="Recent searches" size="small" trailing={<SectionHeaderAction label="Clear all" />} />
          <RecentSearchList queries={seedRecentSearches.lectures} />
        </View>
      </Example>
      <Example label="RecentSearchList: empty">
        <RecentSearchList queries={[]} />
      </Example>
      <Example label="HighlightedText with / without a highlight">
        <View className="gap-2">
          <HighlightedText parts={mockSearchResults.lectures[0].titleParts} />
          <HighlightedText parts={[{ text: 'Mauritius – Islamic Finance Hub', highlighted: false }]} />
        </View>
      </Example>
      <Example label="Results heading + SearchResultRow (lectures)">
        <View className="gap-2">
          <Text variant="bodySm" className="font-manrope-bold text-fg-muted">
            {mockSearchResults.lectures.length} lectures found
          </Text>
          {mockSearchResults.lectures.map((result) => (
            <SearchResultRow
              key={result.slug}
              kind="lecture"
              titleParts={result.titleParts}
              author={result.author}
              metaLabel={result.metaLabel}
              category={catForTopic(result.topic, topicOrder)}
              accessibilityLabel={`Play ${findLecture(result.slug).title}`}
            />
          ))}
        </View>
      </Example>
      <Example label="SearchResultRow (events, date tile by position)">
        <View className="gap-2">
          {mockSearchResults.events.map((result, index) => (
            <SearchResultRow
              key={result.slug}
              kind="event"
              titleParts={result.titleParts}
              metaLabel={result.metaLabel}
              day={result.day}
              month={result.month}
              category={catAt(index)}
              accessibilityLabel={`Open event: ${sahabaEvent.title}`}
            />
          ))}
        </View>
      </Example>
      <StateLabel>{`(Ṣaḥābā topic colour: cat-${sahabaTopicCategory})`}</StateLabel>
    </GallerySection>
  );
}

function NowPlayingSection() {
  const playingVenue = formatVenue(playingLecture.masjid ?? '');

  return (
    <GallerySection title="Now Playing parts">
      <Example label="Artwork (shadow in light, none in dark)">
        <Artwork />
      </Example>
      <Example label="TrackInfo: full">
        <TrackInfo
          title={playingLecture.title}
          author={playingLecture.author}
          venue={playingVenue}
          dateLabel={mockPlayback.longDate}
          topicLabel={topicLabels[playingTopic]}
          topicCategory={catForTopic(playingTopic, topicOrder)}
          eventTitle={playingLecture.event}
        />
      </Example>
      <Example label="TrackInfo: no venue, no event, no topic">
        <TrackInfo title="Guarding the Tongue in the Age of Social Media" author="Mufti Yasin Doomah" dateLabel="Friday, 2 October 2026" />
      </Example>
      <Example label="SeekBar + PlayerControls paused">
        <View className="gap-[18px]">
          <SeekBar
            progress={mockPlayback.progress}
            elapsed={mockPlayback.elapsed}
            remaining={mockPlayback.remaining}
            accessibilityValue={{ min: 0, max: 2781, now: 965, text: `${mockPlayback.elapsed} of ${mockPlayback.total}` }}
          />
          <PlayerControls state="paused" />
        </View>
      </Example>
      <Example label="PlayerControls playing">
        <PlayerControls state="playing" />
      </Example>
    </GallerySection>
  );
}

function SharedBarSection() {
  return (
    <GallerySection title="MiniPlayer and TabBar">
      <Example label="MiniPlayer paused (light: inverse; dark: emphasis + outline)">
        <MiniPlayer
          title={playingLecture.title}
          author={playingLecture.author}
          playState="paused"
          progressLine={<ProgressBar progress={mockPlayback.progress} variant="miniLine" />}
          thumbnail={miniPlayerThumbnail}
        />
      </Example>
      <Example label="MiniPlayer playing">
        <MiniPlayer
          title={playingLecture.title}
          author={playingLecture.author}
          playState="playing"
          progressLine={<ProgressBar progress={0.62} variant="miniLine" />}
          thumbnail={miniPlayerThumbnail}
        />
      </Example>
      <Example label="MiniPlayer loading (TODO(design): not designed)">
        <MiniPlayer
          title={playingLecture.title}
          author={playingLecture.author}
          playState="loading"
          progressLine={<ProgressBar progress={0} variant="miniLine" />}
          thumbnail={miniPlayerThumbnail}
        />
      </Example>
      <Example label="Footer: mini player + tabs (Home active)">
        <View className="-mx-gutter">
          <FooterMock selectedTab="home" />
        </View>
      </Example>
      <Example label="Footer: Events active">
        <View className="-mx-gutter">
          <FooterMock selectedTab="events" />
        </View>
      </Example>
    </GallerySection>
  );
}

// The components stacked in Home's order with the mock data, to compare with the Home design
// and catch spacing problems between components.
function HomeScreenMock() {
  return (
    <View nativeID="home-screen-mock" className="-mx-gutter bg-bg pt-11">
      <HomeHeader />
      <View className="mt-6 gap-1.5 px-gutter">
        <Text variant="bodySm" className="font-manrope-bold text-primary">
          Assalāmu ’alaykum
        </Text>
        <Text variant="h1" accessibilityRole="header">
          Nurture your heart with today’s reminders
        </Text>
      </View>
      <View className="mt-[18px] px-gutter">
        <SearchFieldButton label="Search by topic" />
      </View>
      <View className="mt-6 px-gutter">
        <ContinueListeningCard
          title={playingLecture.title}
          author={playingLecture.author}
          state="paused"
          progress={mockPlayback.progress}
          elapsedLabel={mockPlayback.elapsed}
          minutesLeftLabel={mockPlayback.minutesLeft}
        />
      </View>
      <View className="mt-[34px] px-gutter">
        <SectionHeader title="Latest lectures" trailing={<SectionHeaderCount label={`${latestLecturesTotal} lectures`} />} />
      </View>
      <View className="mt-2 flex-row gap-2 px-gutter">
        {lectureSeries.map((series, index) => (
          <Chip key={series.key} label={series.label} selected={index === 0} />
        ))}
      </View>
      <View className="mt-3.5 gap-2.5 px-gutter">
        {homeMockLectures.map((lecture) => {
          let rowState: LectureRowState = 'idle';
          if (lecture.slug === mockPlayback.lectureSlug) {
            rowState = 'active-paused';
          }
          return (
            <LectureRow
              key={lecture.slug}
              title={lecture.title}
              author={lecture.author}
              metaLabel={mockHomeRowMeta[lecture.slug]}
              state={rowState}
            />
          );
        })}
        <SkeletonRow variant="lecture" />
        <LoadingFooter label="Loading more lectures" />
      </View>
      <View className="mt-6">
        <FooterMock selectedTab="home" />
      </View>
    </View>
  );
}

export default function ComponentsGalleryScreen() {
  const insets = useSafeAreaInsets();

  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerClassName="px-gutter"
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}
    >
      <View className="flex-row items-center justify-between">
        <Text variant="display">Components</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close component gallery"
          onPress={() => router.back()}
          className="h-touch min-w-touch items-center justify-center rounded-full bg-surface-2 px-4"
        >
          <Text variant="bodySm" className="font-manrope-bold">
            Close
          </Text>
        </Pressable>
      </View>
      <Text variant="bodySm" className="mt-1.5 text-fg-muted">
        Static presentation components with mock data. Nothing responds to taps yet.
      </Text>

      <DataSection />
      <IconsSection />
      <ButtonsSection />
      <ChipsAndPillsSection />
      <SurfacesSection />
      <ProgressSection />
      <CardsSection />
      <RowsSection />
      <HeadersSection />
      <SearchSection />
      <NowPlayingSection />
      <SharedBarSection />

      <GallerySection title="Screen mock: Home">
        <HomeScreenMock />
      </GallerySection>
    </ScrollView>
  );
}
