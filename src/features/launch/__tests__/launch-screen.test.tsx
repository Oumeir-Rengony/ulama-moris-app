import { fireEvent, screen } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';

import { LaunchScreen } from '@/features/launch/launch-screen';
import { renderWithProviders } from '@/test-utils/render-with-providers';

jest.mock('expo-splash-screen', () => ({ hide: jest.fn() }));

// The launch screen is hidden from screen readers, so its text is found with hidden elements included.
const includeHidden = { includeHiddenElements: true };

const contentLayout = { nativeEvent: { layout: { x: 0, y: 200, width: 390, height: 440 } } };

beforeEach(() => {
  jest.mocked(SplashScreen.hide).mockClear();
});

describe('LaunchScreen', () => {
  it('shows the name, the tagline and the loading caption', async () => {
    await renderWithProviders(<LaunchScreen onFinished={jest.fn()} />);

    expect(screen.getByText('Ulama Moris', includeHidden)).toBeTruthy();
    expect(screen.getByText('An audio library rooted in knowledge.', includeHidden)).toBeTruthy();
    expect(screen.getByText('Preparing your listening space', includeHidden)).toBeTruthy();
  });

  it('keeps the native splash up until its content has been laid out', async () => {
    const onFinished = jest.fn();
    await renderWithProviders(<LaunchScreen onFinished={onFinished} />);

    expect(SplashScreen.hide).not.toHaveBeenCalled();
    expect(onFinished).not.toHaveBeenCalled();
  });

  it('hides the native splash once laid out, then reports when it has finished', async () => {
    const onFinished = jest.fn();
    await renderWithProviders(<LaunchScreen onFinished={onFinished} />);

    const contentColumn = screen.getByTestId('launch-screen-content', includeHidden);
    await fireEvent(contentColumn, 'layout', contentLayout);

    expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
    // The test Reanimated stand-in finishes every animation at once.
    expect(onFinished).toHaveBeenCalledTimes(1);
  });
});
