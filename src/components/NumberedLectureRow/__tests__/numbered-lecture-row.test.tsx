import { fireEvent, screen } from '@testing-library/react-native';

import { NumberedLectureRow } from '@/components/NumberedLectureRow';
import { threeLineTitle } from '@/test-utils/fixtures';
import { renderWithProviders } from '@/test-utils/render-with-providers';

const title = 'Who were the ṣaḥābā Radiyallāhu ’Anhum';

describe('NumberedLectureRow', () => {
  it('shows the number, title and author', async () => {
    await renderWithProviders(
      <NumberedLectureRow number="01" title={title} author="Mufti Yasin Doomah" metaLabel="24 Oct · 39:37" state="idle" />,
    );
    expect(screen.getByText('01')).toBeOnTheScreen();
    expect(screen.getByText(title)).toBeOnTheScreen();
    expect(screen.getByText('Mufti Yasin Doomah')).toBeOnTheScreen();
  });

  it('shows the meta line for each state', async () => {
    await renderWithProviders(
      <NumberedLectureRow number="01" title={title} author="A" metaLabel="31 Oct · 35:48" state="idle" />,
    );
    expect(screen.getByText('31 Oct · 35:48')).toBeOnTheScreen();

    await renderWithProviders(
      <NumberedLectureRow number="02" title={title} author="A" metaLabel="Paused · 16:05 / 46:21" state="active-paused" />,
    );
    expect(screen.getByText('Paused · 16:05 / 46:21')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: `Play ${title}` })).toBeOnTheScreen();

    await renderWithProviders(
      <NumberedLectureRow
        number="02"
        title={title}
        author="A"
        metaLabel="Now playing · 16:05 / 46:21"
        state="active-playing"
      />,
    );
    expect(screen.getByText('Now playing · 16:05 / 46:21')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: `Pause ${title}` })).toBeOnTheScreen();
  });

  it('lets a long title use up to three lines', async () => {
    await renderWithProviders(
      <NumberedLectureRow number="03" title={threeLineTitle} author="A" metaLabel="M" state="idle" />,
    );
    expect(screen.getByText(threeLineTitle)).toHaveProp('numberOfLines', 3);
  });

  it('calls onPress for the row and onPlayPress for the play button', async () => {
    const handleRowPress = jest.fn();
    const handlePlayPress = jest.fn();
    await renderWithProviders(
      <NumberedLectureRow
        number="01"
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

    await fireEvent.press(screen.getByRole('button', { name: `Play ${title}` }));
    expect(handlePlayPress).toHaveBeenCalledTimes(1);
  });
});
