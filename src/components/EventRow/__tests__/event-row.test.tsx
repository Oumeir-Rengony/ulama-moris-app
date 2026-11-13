import { fireEvent, screen } from '@testing-library/react-native';

import { DateTile } from '@/components/DateTile';
import { EventRow } from '@/components/EventRow';
import { renderWithProviders } from '@/test-utils/render-with-providers';

const title = 'The Sahaba Radiyyallahu Anhum';

describe('EventRow', () => {
  it('shows the date tile, title and stats', async () => {
    await renderWithProviders(
      <EventRow
        title={title}
        statsLabel="4 lectures · 2h 34m · 24 Oct – 31 Oct 2026"
        venue="Masjid Muswalla, Highlands"
        day="24"
        month="Oct"
        category={1}
      />,
    );
    expect(screen.getByText('24')).toBeOnTheScreen();
    expect(screen.getByText('Oct')).toBeOnTheScreen();
    expect(screen.getByText(title)).toBeOnTheScreen();
    expect(screen.getByText('4 lectures · 2h 34m · 24 Oct – 31 Oct 2026')).toBeOnTheScreen();
    expect(screen.getByText('Masjid Muswalla, Highlands')).toBeOnTheScreen();
  });

  it('shows the date range instead when there is no venue', async () => {
    await renderWithProviders(
      <EventRow
        title="Jummah"
        statsLabel="8 lectures · 3h 25m"
        dateRangeLabel="17 Nov 2023 – 22 Aug 2025"
        day="22"
        month="Aug"
        category={5}
      />,
    );
    expect(screen.getByText('17 Nov 2023 – 22 Aug 2025')).toBeOnTheScreen();
    expect(screen.queryByText('Masjid Muswalla, Highlands')).not.toBeOnTheScreen();
  });

  it('leaves the last line out when there is neither a venue nor a date range', async () => {
    await renderWithProviders(
      <EventRow title="Jummah" statsLabel="8 lectures · 3h 25m" day="22" month="Aug" category={5} />,
    );
    const row = screen.getByRole('button', { name: 'Open event: Jummah' });
    // Text content joins the text nodes with no separator.
    expect(row).toHaveTextContent('22AugJummah8 lectures · 3h 25m');
  });

  it('is one button labelled "Open event: {title}" that calls onPress', async () => {
    const handlePress = jest.fn();
    await renderWithProviders(
      <EventRow title={title} statsLabel="S" day="24" month="Oct" category={1} onPress={handlePress} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: `Open event: ${title}` }));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });
});

describe('DateTile', () => {
  it('shows the day and month in both sizes', async () => {
    await renderWithProviders(
      <>
        <DateTile day="24" month="Oct" category={1} size="row" />
        <DateTile day="9" month="May" category={2} size="result" />
      </>,
    );
    expect(screen.getByText('24')).toBeOnTheScreen();
    expect(screen.getByText('Oct')).toBeOnTheScreen();
    expect(screen.getByText('9')).toBeOnTheScreen();
    expect(screen.getByText('May')).toBeOnTheScreen();
  });
});
