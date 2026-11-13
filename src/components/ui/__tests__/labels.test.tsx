import { fireEvent, screen } from '@testing-library/react-native';
import Layers from 'lucide-react-native/icons/layers';
import MapPin from 'lucide-react-native/icons/map-pin';

import { EmptyState } from '@/components/ui/empty-state';
import { IconLabel } from '@/components/ui/icon-label';
import { Pill } from '@/components/ui/pill';
import { SectionHeader, SectionHeaderAction, SectionHeaderCount } from '@/components/ui/section-header';
import { renderWithProviders } from '@/test-utils/render-with-providers';

describe('Pill', () => {
  it('shows its label as plain text in the info and category variants', async () => {
    await renderWithProviders(
      <>
        <Pill label="4 lectures" variant="onEmphasis" />
        <Pill label="Ṣaḥābā r.a" variant="category" category={2} />
      </>,
    );
    expect(screen.getByText('4 lectures')).toBeOnTheScreen();
    expect(screen.getByText('Ṣaḥābā r.a')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('is a button with its own label in the outline variant', async () => {
    const handlePress = jest.fn();
    await renderWithProviders(
      <Pill
        label="The Sahaba Radiyyallahu Anhum"
        variant="outline"
        icon={Layers}
        accessibilityLabel="Open event: The Sahaba Radiyyallahu Anhum"
        onPress={handlePress}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Open event: The Sahaba Radiyyallahu Anhum' }));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('falls back to the label as the outline button name', async () => {
    await renderWithProviders(<Pill label="Jummah" variant="outline" />);
    expect(screen.getByRole('button', { name: 'Jummah' })).toBeOnTheScreen();
  });
});

describe('IconLabel', () => {
  it('shows its label in both sizes', async () => {
    await renderWithProviders(
      <>
        <IconLabel icon={MapPin} label="Masjid Muswalla, Highlands" size="sm" />
        <IconLabel icon={MapPin} label="Belle Rose Sunnee Mosque" size="md" />
      </>,
    );
    expect(screen.getByText('Masjid Muswalla, Highlands')).toBeOnTheScreen();
    expect(screen.getByText('Belle Rose Sunnee Mosque')).toBeOnTheScreen();
  });
});

describe('SectionHeader', () => {
  it('shows the title as a header', async () => {
    await renderWithProviders(<SectionHeader title="Latest lectures" />);
    expect(screen.getByRole('header', { name: 'Latest lectures' })).toBeOnTheScreen();
  });

  it('shows a count when one is given', async () => {
    await renderWithProviders(<SectionHeader title="Latest lectures" trailing={<SectionHeaderCount label="81 lectures" />} />);
    expect(screen.getByText('81 lectures')).toBeOnTheScreen();
  });

  it('has no trailing part when none is given', async () => {
    await renderWithProviders(<SectionHeader title="Recent searches" size="small" />);
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('shows an action button that calls onPress', async () => {
    const handlePress = jest.fn();
    await renderWithProviders(
      <SectionHeader
        title="Recent searches"
        size="small"
        trailing={<SectionHeaderAction label="Clear all" onPress={handlePress} />}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Clear all' }));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });
});

describe('EmptyState', () => {
  it('shows the title and the message', async () => {
    await renderWithProviders(<EmptyState title="No results for “zzz”" message="Try another lecture title." />);
    expect(screen.getByText('No results for “zzz”')).toBeOnTheScreen();
    expect(screen.getByText('Try another lecture title.')).toBeOnTheScreen();
  });

  it('shows only the message when there is no title', async () => {
    await renderWithProviders(<EmptyState message="Your searches will appear here." />);
    expect(screen.getByText('Your searches will appear here.')).toBeOnTheScreen();
    expect(screen.queryByText('No results for “zzz”')).not.toBeOnTheScreen();
  });
});
