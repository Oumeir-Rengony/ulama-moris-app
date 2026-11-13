import { fireEvent, screen } from '@testing-library/react-native';

import { PlayerControls } from '@/components/NowPlaying/player-controls';
import { TrackInfo } from '@/components/NowPlaying/track-info';
import { renderWithProviders } from '@/test-utils/render-with-providers';

const title = "Sacrifices of the Şahābā Radiyallāhu 'Anhum for Islam";
const eventTitle = 'The Sahaba Radiyyallahu Anhum';

describe('TrackInfo', () => {
  it('shows every line and pill a complete lecture has', async () => {
    await renderWithProviders(
      <TrackInfo
        title={title}
        author="Mawlana Zyad Ally Quenette"
        venue="Masjid Muswalla, Highlands"
        dateLabel="Saturday, 31 October 2026"
        topicLabel="Ṣaḥābā r.a"
        topicCategory={1}
        eventTitle={eventTitle}
      />,
    );
    expect(screen.getByRole('header', { name: title })).toBeOnTheScreen();
    expect(screen.getByText('Mawlana Zyad Ally Quenette')).toBeOnTheScreen();
    expect(screen.getByText('Masjid Muswalla, Highlands')).toBeOnTheScreen();
    expect(screen.getByText('Saturday, 31 October 2026')).toBeOnTheScreen();
    expect(screen.getByText('Ṣaḥābā r.a')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: `Open event: ${eventTitle}` })).toBeOnTheScreen();
  });

  it('leaves out the venue, date and pills when the data is missing', async () => {
    await renderWithProviders(<TrackInfo title="Guarding the Tongue" author="Mufti Yasin Doomah" />);
    expect(screen.getByText('Guarding the Tongue')).toBeOnTheScreen();
    expect(screen.queryByText('Masjid Muswalla, Highlands')).not.toBeOnTheScreen();
    expect(screen.queryByText('Ṣaḥābā r.a')).not.toBeOnTheScreen();
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('shows the date without a venue', async () => {
    await renderWithProviders(<TrackInfo title="T" author="A" dateLabel="Friday, 2 October 2026" />);
    expect(screen.getByText('Friday, 2 October 2026')).toBeOnTheScreen();
  });

  it('calls onEventPress from the event pill', async () => {
    const handleEventPress = jest.fn();
    await renderWithProviders(<TrackInfo title="T" author="A" eventTitle={eventTitle} onEventPress={handleEventPress} />);
    await fireEvent.press(screen.getByRole('button', { name: `Open event: ${eventTitle}` }));
    expect(handleEventPress).toHaveBeenCalledTimes(1);
  });
});

describe('PlayerControls', () => {
  it('has back 15, play and forward 15 buttons while paused', async () => {
    await renderWithProviders(<PlayerControls state="paused" />);
    expect(screen.getByRole('button', { name: 'Back 15 seconds' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Play' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Forward 15 seconds' })).toBeOnTheScreen();
  });

  it('labels the middle button "Pause" while playing', async () => {
    await renderWithProviders(<PlayerControls state="playing" />);
    expect(screen.getByRole('button', { name: 'Pause' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Play' })).not.toBeOnTheScreen();
  });

  it('calls the handler of each button', async () => {
    const handleBack = jest.fn();
    const handleToggle = jest.fn();
    const handleForward = jest.fn();
    await renderWithProviders(
      <PlayerControls
        state="paused"
        onBackPress={handleBack}
        onTogglePress={handleToggle}
        onForwardPress={handleForward}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Back 15 seconds' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Play' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Forward 15 seconds' }));

    expect(handleBack).toHaveBeenCalledTimes(1);
    expect(handleToggle).toHaveBeenCalledTimes(1);
    expect(handleForward).toHaveBeenCalledTimes(1);
  });
});
