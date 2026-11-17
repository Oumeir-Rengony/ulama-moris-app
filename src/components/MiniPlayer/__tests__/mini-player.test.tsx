import { fireEvent, screen } from '@testing-library/react-native';

import { MiniPlayer } from '@/components/MiniPlayer';
import { ProgressBar } from '@/components/ui/progress-bar';
import { renderWithProviders } from '@/test-utils/render-with-providers';

const title = "Sacrifices of the Şahābā Radiyallāhu 'Anhum for Islam";
const author = 'Mawlana Zyad Ally Quenette';
const openLabel = `Open player: ${title}, ${author}`;
const progressLine = <ProgressBar progress={0.35} variant="miniLine" />;

describe('MiniPlayer', () => {
  it('shows the title and author', async () => {
    await renderWithProviders(<MiniPlayer title={title} author={author} playState="paused" progressLine={progressLine} />);
    expect(screen.getByText(title)).toBeOnTheScreen();
    expect(screen.getByText(author)).toBeOnTheScreen();
  });

  it('has no cover art or thumbnail', async () => {
    await renderWithProviders(<MiniPlayer title={title} author={author} playState="paused" progressLine={progressLine} />);
    expect(screen.queryByRole('image')).not.toBeOnTheScreen();

    // No image element of any kind, labelled or not.
    const imageElements = screen.container.queryAll((element) => element.type === 'Image');
    expect(imageElements).toHaveLength(0);
  });

  it('has the open button, play/pause and "Skip forward 15 seconds"', async () => {
    await renderWithProviders(<MiniPlayer title={title} author={author} playState="playing" progressLine={progressLine} />);
    expect(screen.getByRole('button', { name: openLabel })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Skip forward 15 seconds' })).toBeOnTheScreen();
  });

  it('labels the toggle "Play" while paused', async () => {
    await renderWithProviders(<MiniPlayer title={title} author={author} playState="paused" progressLine={progressLine} />);
    expect(screen.getByRole('button', { name: 'Play' })).toBeOnTheScreen();
  });

  it('shows "Loading" in place of play/pause while the audio loads', async () => {
    await renderWithProviders(<MiniPlayer title={title} author={author} playState="loading" progressLine={progressLine} />);
    expect(screen.getByLabelText('Loading')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Play' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeOnTheScreen();
  });

  it('renders the progress line it is given', async () => {
    await renderWithProviders(<MiniPlayer title={title} author={author} playState="paused" progressLine={progressLine} />);
    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({ now: 35 });
  });

  it('calls the handler of each button', async () => {
    const handleOpen = jest.fn();
    const handleToggle = jest.fn();
    const handleSkip = jest.fn();
    await renderWithProviders(
      <MiniPlayer
        title={title}
        author={author}
        playState="paused"
        progressLine={progressLine}
        onOpenPress={handleOpen}
        onTogglePress={handleToggle}
        onSkipForwardPress={handleSkip}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: openLabel }));
    await fireEvent.press(screen.getByRole('button', { name: 'Play' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Skip forward 15 seconds' }));

    expect(handleOpen).toHaveBeenCalledTimes(1);
    expect(handleToggle).toHaveBeenCalledTimes(1);
    expect(handleSkip).toHaveBeenCalledTimes(1);
  });

  it('offers "Stop and close player" to screen readers, which calls onDismiss', async () => {
    const handleDismiss = jest.fn();
    await renderWithProviders(
      <MiniPlayer title={title} author={author} playState="paused" progressLine={progressLine} onDismiss={handleDismiss} />,
    );

    const openButton = screen.getByRole('button', { name: openLabel });
    expect(openButton).toHaveProp('accessibilityActions', [{ name: 'dismiss', label: 'Stop and close player' }]);

    await fireEvent(openButton, 'accessibilityAction', { nativeEvent: { actionName: 'dismiss' } });
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  describe('when the lecture did not load', () => {
    it('says so instead of the author and disables play and forward 15, with no "Try again"', async () => {
      const handleToggle = jest.fn();
      await renderWithProviders(
        <MiniPlayer
          title={title}
          author={author}
          playState="failed"
          progressLine={progressLine}
          onTogglePress={handleToggle}
        />,
      );

      expect(screen.getByText('Didn’t load. Tap to open again.')).toBeOnTheScreen();
      expect(screen.queryByText(author)).toBeNull();
      expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Skip forward 15 seconds' })).toBeDisabled();

      const playButton = screen.getByRole('button', { name: 'Play' });
      expect(playButton).toBeDisabled();
      await fireEvent.press(playButton);
      expect(handleToggle).not.toHaveBeenCalled();
    });

    it('still opens the player when the text is pressed', async () => {
      const handleOpen = jest.fn();
      await renderWithProviders(
        <MiniPlayer
          title={title}
          author={author}
          playState="failed"
          progressLine={progressLine}
          onOpenPress={handleOpen}
        />,
      );

      await fireEvent.press(screen.getByRole('button', { name: `Open player: ${title}, ${author}` }));
      expect(handleOpen).toHaveBeenCalledTimes(1);
    });
  });
});
