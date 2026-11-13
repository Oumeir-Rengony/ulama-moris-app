import { fireEvent, screen } from '@testing-library/react-native';

import { MiniPlayer } from '@/components/MiniPlayer';
import { renderWithProviders } from '@/test-utils/render-with-providers';

const title = "Sacrifices of the Şahābā Radiyallāhu 'Anhum for Islam";
const author = 'Mawlana Zyad Ally Quenette';

describe('MiniPlayer', () => {
  it('shows the title and author', async () => {
    await renderWithProviders(<MiniPlayer title={title} author={author} state="paused" progress={0.35} />);
    expect(screen.getByText(title)).toBeOnTheScreen();
    expect(screen.getByText(author)).toBeOnTheScreen();
  });

  it('has no cover art or thumbnail', async () => {
    await renderWithProviders(<MiniPlayer title={title} author={author} state="paused" progress={0.35} />);
    expect(screen.queryByRole('image')).not.toBeOnTheScreen();

    // No image element of any kind, labelled or not.
    const imageElements = screen.container.queryAll((element) => element.type === 'Image');
    expect(imageElements).toHaveLength(0);
  });

  it('has "Open player", play/pause and "Skip forward 15 seconds" buttons', async () => {
    await renderWithProviders(<MiniPlayer title={title} author={author} state="playing" progress={0.35} />);
    expect(screen.getByRole('button', { name: 'Open player' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Skip forward 15 seconds' })).toBeOnTheScreen();
  });

  it('labels the toggle "Play" while paused', async () => {
    await renderWithProviders(<MiniPlayer title={title} author={author} state="paused" progress={0.35} />);
    expect(screen.getByRole('button', { name: 'Play' })).toBeOnTheScreen();
  });

  it('tells screen readers what is playing through the open button hint', async () => {
    await renderWithProviders(<MiniPlayer title={title} author={author} state="paused" progress={0.35} />);
    expect(screen.getByRole('button', { name: 'Open player' })).toHaveProp('accessibilityHint', `${title}, ${author}`);
  });

  it('shows the progress', async () => {
    await renderWithProviders(<MiniPlayer title={title} author={author} state="paused" progress={0.35} />);
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
        state="paused"
        progress={0.35}
        onOpenPress={handleOpen}
        onTogglePress={handleToggle}
        onSkipForwardPress={handleSkip}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Open player' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Play' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Skip forward 15 seconds' }));

    expect(handleOpen).toHaveBeenCalledTimes(1);
    expect(handleToggle).toHaveBeenCalledTimes(1);
    expect(handleSkip).toHaveBeenCalledTimes(1);
  });
});
