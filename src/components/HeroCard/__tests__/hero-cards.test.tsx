import { fireEvent, screen } from '@testing-library/react-native';

import { ContinueListeningCard } from '@/components/ContinueListeningCard';
import { EventHeroCard } from '@/components/EventHeroCard';
import { HeroCard } from '@/components/HeroCard';
import { LatestEventCard } from '@/components/LatestEventCard';
import { renderWithProviders } from '@/test-utils/render-with-providers';

const lectureTitle = "Sacrifices of the Şahābā Radiyallāhu 'Anhum for Islam";
const eventTitle = 'The Sahaba Radiyyallahu Anhum';

describe('HeroCard presets', () => {
  it('draws no rosette on Continue listening', async () => {
    await renderWithProviders(<HeroCard preset="continueListening" overline="Continue listening" title="T" />);
    expect(screen.queryByTestId('hero-rosette')).not.toBeOnTheScreen();
  });

  it('draws a rosette on Latest event and the Event hero', async () => {
    await renderWithProviders(<HeroCard preset="latestEvent" overline="Latest event" title="T" />);
    expect(screen.getByTestId('hero-rosette')).toBeOnTheScreen();

    await renderWithProviders(<HeroCard preset="eventHero" overline="Event" title="T" />);
    expect(screen.getByTestId('hero-rosette')).toBeOnTheScreen();
  });

  it('shows the overline, title and subtitle', async () => {
    await renderWithProviders(<HeroCard preset="latestEvent" overline="Latest event" title={eventTitle} subtitle="24 Oct" />);
    expect(screen.getByText('Latest event')).toBeOnTheScreen();
    expect(screen.getByText(eventTitle)).toBeOnTheScreen();
    expect(screen.getByText('24 Oct')).toBeOnTheScreen();
  });
});

describe('ContinueListeningCard', () => {
  it('shows the lecture, the progress and both time labels', async () => {
    await renderWithProviders(
      <ContinueListeningCard
        title={lectureTitle}
        author="Mawlana Zyad Ally Quenette"
        state="paused"
        progress={0.35}
        elapsedLabel="16:05"
        minutesLeftLabel="31 min left"
      />,
    );
    expect(screen.getByText('Continue listening')).toBeOnTheScreen();
    expect(screen.getByText(lectureTitle)).toBeOnTheScreen();
    expect(screen.getByText('Mawlana Zyad Ally Quenette')).toBeOnTheScreen();
    expect(screen.getByText('16:05')).toBeOnTheScreen();
    expect(screen.getByText('31 min left')).toBeOnTheScreen();
    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({ now: 35 });
  });

  it('switches the button between "Play {title}" and "Pause {title}"', async () => {
    const handleToggle = jest.fn();
    await renderWithProviders(
      <ContinueListeningCard
        title={lectureTitle}
        author="A"
        state="paused"
        progress={0}
        elapsedLabel="0:00"
        minutesLeftLabel="46 min left"
        onTogglePress={handleToggle}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: `Play ${lectureTitle}` }));
    expect(handleToggle).toHaveBeenCalledTimes(1);

    await renderWithProviders(
      <ContinueListeningCard
        title={lectureTitle}
        author="A"
        state="playing"
        progress={0}
        elapsedLabel="0:00"
        minutesLeftLabel="46 min left"
      />,
    );
    expect(screen.getByRole('button', { name: `Pause ${lectureTitle}` })).toBeOnTheScreen();
  });
});

describe('LatestEventCard', () => {
  it('shows the event, its meta and both chips', async () => {
    await renderWithProviders(
      <LatestEventCard
        title={eventTitle}
        metaLabel="24 Oct – 31 Oct 2026 · Masjid Muswalla, Highlands"
        lectureCountLabel="4 lectures"
        durationLabel="2h 34m"
      />,
    );
    expect(screen.getByText(eventTitle)).toBeOnTheScreen();
    expect(screen.getByText('24 Oct – 31 Oct 2026 · Masjid Muswalla, Highlands')).toBeOnTheScreen();
    expect(screen.getByText('4 lectures')).toBeOnTheScreen();
    expect(screen.getByText('2h 34m')).toBeOnTheScreen();
  });

  it('is one button labelled "Open event: {title}" that calls onPress', async () => {
    const handlePress = jest.fn();
    await renderWithProviders(
      <LatestEventCard title={eventTitle} metaLabel="M" lectureCountLabel="4 lectures" durationLabel="2h 34m" onPress={handlePress} />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(1);
    await fireEvent.press(screen.getByRole('button', { name: `Open event: ${eventTitle}` }));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });
});

describe('EventHeroCard', () => {
  it('shows the event pill, title, date and info chips', async () => {
    await renderWithProviders(
      <EventHeroCard
        title={eventTitle}
        dateLabel="24 – 31 October 2026"
        lectureCountLabel="4 recorded lectures"
        durationLabel="2h 34m"
        venue="Masjid Muswalla, Highlands"
      />,
    );
    expect(screen.getByText('Event')).toBeOnTheScreen();
    expect(screen.getByText(eventTitle)).toBeOnTheScreen();
    expect(screen.getByText('24 – 31 October 2026')).toBeOnTheScreen();
    expect(screen.getByText('4 recorded lectures')).toBeOnTheScreen();
    expect(screen.getByText('2h 34m')).toBeOnTheScreen();
    expect(screen.getByText('Masjid Muswalla, Highlands')).toBeOnTheScreen();
  });

  it('leaves out the venue chip when there is no venue', async () => {
    await renderWithProviders(
      <EventHeroCard title="Jummah" dateLabel="17 November 2023 – 22 August 2025" lectureCountLabel="8 recorded lectures" durationLabel="3h 25m" />,
    );
    expect(screen.getByText('8 recorded lectures')).toBeOnTheScreen();
    expect(screen.queryByText('Masjid Muswalla, Highlands')).not.toBeOnTheScreen();
  });
});
