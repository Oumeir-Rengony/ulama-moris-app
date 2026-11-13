import { fireEvent, screen } from '@testing-library/react-native';

import { Skip15Icon } from '@/components/icons/skip-15-icon';
import { Chip } from '@/components/ui/chip';
import { IconButton } from '@/components/ui/icon-button';
import { PlayPauseButton } from '@/components/ui/play-pause-button';
import { renderWithProviders } from '@/test-utils/render-with-providers';

describe('IconButton', () => {
  it('is a button with its label', async () => {
    await renderWithProviders(
      <IconButton accessibilityLabel="Back 15 seconds">
        <Skip15Icon direction="back" size={26} />
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: 'Back 15 seconds' })).toBeOnTheScreen();
  });

  it('calls onPress when pressed', async () => {
    const handlePress = jest.fn();
    await renderWithProviders(
      <IconButton accessibilityLabel="Back 15 seconds" onPress={handlePress}>
        <Skip15Icon direction="back" size={26} />
      </IconButton>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Back 15 seconds' }));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('can be pressed without an onPress', async () => {
    await renderWithProviders(
      <IconButton accessibilityLabel="Share event">
        <Skip15Icon direction="forward" size={22} />
      </IconButton>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Share event' }));
  });
});

describe('PlayPauseButton', () => {
  it('is a button with the label it is given', async () => {
    await renderWithProviders(<PlayPauseButton state="play" variant="row" accessibilityLabel="Play Rights of Parents" />);
    expect(screen.getByRole('button', { name: 'Play Rights of Parents' })).toBeOnTheScreen();
  });

  it('renders every variant in both states', async () => {
    const variants = ['row', 'rowActive', 'hero', 'mini', 'nowPlaying'] as const;
    for (const variant of variants) {
      await renderWithProviders(<PlayPauseButton state="play" variant={variant} accessibilityLabel={`Play ${variant}`} />);
      expect(screen.getByRole('button', { name: `Play ${variant}` })).toBeOnTheScreen();

      await renderWithProviders(<PlayPauseButton state="pause" variant={variant} accessibilityLabel={`Pause ${variant}`} />);
      expect(screen.getByRole('button', { name: `Pause ${variant}` })).toBeOnTheScreen();
    }
  });

  it('calls onPress when pressed', async () => {
    const handlePress = jest.fn();
    await renderWithProviders(
      <PlayPauseButton state="pause" variant="mini" accessibilityLabel="Pause" onPress={handlePress} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('can be pressed without an onPress', async () => {
    await renderWithProviders(<PlayPauseButton state="play" variant="hero" accessibilityLabel="Play" />);
    await fireEvent.press(screen.getByRole('button', { name: 'Play' }));
  });
});

describe('Chip', () => {
  it('is a button named by its label', async () => {
    await renderWithProviders(<Chip label="Guest" selected={false} />);
    expect(screen.getByRole('button', { name: 'Guest' })).toBeOnTheScreen();
  });

  it('marks the selected chip as selected', async () => {
    await renderWithProviders(
      <>
        <Chip label="Local" selected />
        <Chip label="Guest" selected={false} />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Local' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Guest' })).not.toBeSelected();
  });

  it('calls onPress when pressed', async () => {
    const handlePress = jest.fn();
    await renderWithProviders(<Chip label="Guest" selected={false} onPress={handlePress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Guest' }));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });
});
