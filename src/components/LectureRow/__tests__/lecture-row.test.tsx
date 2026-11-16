import { fireEvent, screen } from '@testing-library/react-native';

import { LectureRow } from '@/components/LectureRow';
import { renderWithProviders } from '@/test-utils/render-with-providers';

const title = 'Rights of Parents in Old Age';

describe('LectureRow', () => {
  it('shows the title, author and meta line', async () => {
    await renderWithProviders(
      <LectureRow
        title={title}
        author="Mufti Houzeifa Mamoojee"
        metaLabel="31 Oct · 36 min · Masjid Muswalla, Highlands"
        state="idle"
      />,
    );
    expect(screen.getByText(title)).toBeOnTheScreen();
    expect(screen.getByText('Mufti Houzeifa Mamoojee')).toBeOnTheScreen();
    expect(screen.getByText('31 Oct · 36 min · Masjid Muswalla, Highlands')).toBeOnTheScreen();
  });

  it('leaves out the author line when the lecture has no author', async () => {
    await renderWithProviders(<LectureRow title={title} metaLabel="31 Oct" state="idle" />);
    expect(screen.getByText(title)).toBeOnTheScreen();
    expect(screen.getByText('31 Oct')).toBeOnTheScreen();
    expect(screen.queryByText('undefined')).toBeNull();
  });

  it('labels the play button "Play {title}" when idle or paused', async () => {
    await renderWithProviders(<LectureRow title={title} author="A" metaLabel="M" state="idle" />);
    expect(screen.getByRole('button', { name: `Play ${title}` })).toBeOnTheScreen();

    await renderWithProviders(<LectureRow title={title} author="A" metaLabel="M" state="active-paused" />);
    expect(screen.getByRole('button', { name: `Play ${title}` })).toBeOnTheScreen();
  });

  it('labels the button "Pause {title}" while playing', async () => {
    await renderWithProviders(<LectureRow title={title} author="A" metaLabel="M" state="active-playing" />);
    expect(screen.getByRole('button', { name: `Pause ${title}` })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: `Play ${title}` })).not.toBeOnTheScreen();
  });

  it('exposes only the play button to screen readers, not the row around it', async () => {
    await renderWithProviders(<LectureRow title={title} author="A" metaLabel="M" state="idle" />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('calls onPress for a tap on the row and onPlayPress for the play button', async () => {
    const handleRowPress = jest.fn();
    const handlePlayPress = jest.fn();
    await renderWithProviders(
      <LectureRow
        title={title}
        author="A"
        metaLabel="M"
        state="idle"
        onPress={handleRowPress}
        onPlayPress={handlePlayPress}
      />,
    );

    await fireEvent.press(screen.getByText(title));
    expect(handleRowPress).toHaveBeenCalledTimes(1);
    expect(handlePlayPress).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('button', { name: `Play ${title}` }));
    expect(handlePlayPress).toHaveBeenCalledTimes(1);
    expect(handleRowPress).toHaveBeenCalledTimes(1);
  });
});
