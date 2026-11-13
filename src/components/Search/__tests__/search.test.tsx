import { fireEvent, screen } from '@testing-library/react-native';

import { HighlightedText } from '@/components/Search/highlighted-text';
import { RecentSearchList } from '@/components/Search/recent-search-list';
import { SearchInput } from '@/components/Search/search-input';
import { SearchResultRow } from '@/components/Search/search-result-row';
import { renderWithProviders } from '@/test-utils/render-with-providers';

const sacrificesParts = [
  { text: 'Sacrifices of the ', highlighted: false },
  { text: 'Şahābā', highlighted: true },
  { text: " Radiyallāhu 'Anhum for Islam", highlighted: false },
];

describe('SearchInput', () => {
  it('shows the placeholder it is given', async () => {
    await renderWithProviders(<SearchInput value="" placeholder="Search events by name" />);
    expect(screen.getByPlaceholderText('Search events by name')).toBeOnTheScreen();
  });

  it('shows the mic, and no clear button, while empty', async () => {
    await renderWithProviders(<SearchInput value="" placeholder="Search by topic" />);
    expect(screen.getByRole('button', { name: 'Voice search' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeOnTheScreen();
  });

  it('shows the clear button, and no mic, once there is text', async () => {
    const handleClear = jest.fn();
    await renderWithProviders(<SearchInput value="sahaba" placeholder="Search by topic" onClearPress={handleClear} />);
    expect(screen.queryByRole('button', { name: 'Voice search' })).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it('shows its value and reports typing through onChangeText', async () => {
    const handleChangeText = jest.fn();
    await renderWithProviders(<SearchInput value="sah" placeholder="Search by topic" onChangeText={handleChangeText} />);

    const input = screen.getByLabelText('Search');
    expect(input).toHaveDisplayValue('sah');

    await fireEvent.changeText(input, 'saha');
    expect(handleChangeText).toHaveBeenCalledWith('saha');
  });
});

describe('RecentSearchList', () => {
  const queries = ['Ṣaḥābā', 'Islamic finance', 'Fire'];

  it('shows the searches in the order given', async () => {
    await renderWithProviders(<RecentSearchList queries={queries} />);
    const searchButtons = screen.getAllByRole('button', { name: /^Search for / });
    const labels = searchButtons.map((button) => button.props.accessibilityLabel);
    expect(labels).toEqual(['Search for Ṣaḥābā', 'Search for Islamic finance', 'Search for Fire']);
  });

  it('gives each search a remove button', async () => {
    await renderWithProviders(<RecentSearchList queries={queries} />);
    expect(screen.getByRole('button', { name: 'Remove “Ṣaḥābā” from recent searches' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Remove “Fire” from recent searches' })).toBeOnTheScreen();
  });

  it('passes the pressed search to its handlers', async () => {
    const handleQueryPress = jest.fn();
    const handleRemovePress = jest.fn();
    await renderWithProviders(
      <RecentSearchList queries={queries} onQueryPress={handleQueryPress} onRemovePress={handleRemovePress} />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Search for Islamic finance' }));
    expect(handleQueryPress).toHaveBeenCalledWith('Islamic finance');

    await fireEvent.press(screen.getByRole('button', { name: 'Remove “Fire” from recent searches' }));
    expect(handleRemovePress).toHaveBeenCalledWith('Fire');
  });

  it('shows a message when there are no searches', async () => {
    await renderWithProviders(<RecentSearchList queries={[]} />);
    expect(screen.getByText('Your searches will appear here.')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });
});

describe('HighlightedText', () => {
  it('puts the highlighted part in its own text node', async () => {
    await renderWithProviders(<HighlightedText parts={sacrificesParts} />);
    expect(screen.getByText('Şahābā')).toBeOnTheScreen();
  });

  it('still reads as the whole title', async () => {
    await renderWithProviders(<HighlightedText parts={sacrificesParts} />);
    expect(screen.getByText("Sacrifices of the Şahābā Radiyallāhu 'Anhum for Islam")).toBeOnTheScreen();
  });
});

describe('SearchResultRow', () => {
  it('shows a lecture result with its author and an audio tile, not a date', async () => {
    await renderWithProviders(
      <SearchResultRow
        kind="lecture"
        titleParts={sacrificesParts}
        author="Mawlana Zyad Ally Quenette"
        metaLabel="31 Oct · Masjid Muswalla, Highlands"
        category={1}
        accessibilityLabel="Play Sacrifices of the Şahābā"
      />,
    );
    expect(screen.getByText('Mawlana Zyad Ally Quenette')).toBeOnTheScreen();
    expect(screen.getByText('31 Oct · Masjid Muswalla, Highlands')).toBeOnTheScreen();
    expect(screen.queryByText('Oct')).not.toBeOnTheScreen();
  });

  it('shows an event result with a date tile and no author', async () => {
    await renderWithProviders(
      <SearchResultRow
        kind="event"
        titleParts={[{ text: 'Jummah', highlighted: true }]}
        day="22"
        month="Aug"
        metaLabel="17 Nov 2023 – 22 Aug 2025"
        category={2}
        accessibilityLabel="Open event: Jummah"
      />,
    );
    expect(screen.getByText('22')).toBeOnTheScreen();
    expect(screen.getByText('Aug')).toBeOnTheScreen();
    expect(screen.queryByText('Mawlana Zyad Ally Quenette')).not.toBeOnTheScreen();
  });

  it('is one button with the given label that calls onPress', async () => {
    const handlePress = jest.fn();
    await renderWithProviders(
      <SearchResultRow
        kind="event"
        titleParts={[{ text: 'Jummah', highlighted: true }]}
        day="22"
        month="Aug"
        metaLabel="M"
        category={2}
        accessibilityLabel="Open event: Jummah"
        onPress={handlePress}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Open event: Jummah' }));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });
});
