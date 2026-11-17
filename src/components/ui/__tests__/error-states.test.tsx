import { fireEvent, screen } from '@testing-library/react-native';

import { ErrorCard } from '@/components/ui/error-card';
import { LoadMoreError } from '@/components/ui/load-more-error';
import { TryAgainButton } from '@/components/ui/try-again-button';
import { renderWithProviders } from '@/test-utils/render-with-providers';

describe('TryAgainButton', () => {
  it('is a "Try again" button that calls onPress', async () => {
    const handlePress = jest.fn();
    await renderWithProviders(<TryAgainButton variant="primary" isRetrying={false} onPress={handlePress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('keeps saying "Try again", is busy, and ignores presses while retrying', async () => {
    const handlePress = jest.fn();
    await renderWithProviders(<TryAgainButton variant="onDanger" isRetrying onPress={handlePress} />);

    const button = screen.getByRole('button', { name: 'Try again' });
    expect(button).toBeBusy();

    await fireEvent.press(button);
    expect(handlePress).not.toHaveBeenCalled();
  });
});

describe('ErrorCard', () => {
  it('shows the title as a heading, the message and the retry', async () => {
    const handleRetry = jest.fn();
    await renderWithProviders(
      <ErrorCard
        title="Lectures didn’t load"
        message="Check your internet connection, then try again."
        isRetrying={false}
        onRetryPress={handleRetry}
      />,
    );

    expect(screen.getByRole('header', { name: 'Lectures didn’t load' })).toBeOnTheScreen();
    expect(screen.getByText('Check your internet connection, then try again.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});

describe('LoadMoreError', () => {
  it('shows what failed, the message and the retry', async () => {
    const handleRetry = jest.fn();
    await renderWithProviders(
      <LoadMoreError
        title="More events didn’t load"
        message="Check your connection."
        isRetrying={false}
        onRetryPress={handleRetry}
      />,
    );

    expect(screen.getByText('More events didn’t load')).toBeOnTheScreen();
    expect(screen.getByText('Check your connection.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
