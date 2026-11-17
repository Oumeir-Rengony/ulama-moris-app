import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { act, fireEvent, screen } from '@testing-library/react-native';

import { OfflineGate } from '@/features/offline/offline-gate';
import { renderWithProviders } from '@/test-utils/render-with-providers';

function connection(isConnected: boolean | null): NetInfoState {
  return { isConnected } as NetInfoState;
}

let sendConnection: (state: NetInfoState) => void = () => {};

beforeEach(() => {
  jest.mocked(NetInfo.fetch).mockResolvedValue(connection(true));
  jest.mocked(NetInfo.refresh).mockResolvedValue(connection(true));
  jest.mocked(NetInfo.addEventListener).mockImplementation((listener) => {
    sendConnection = listener;
    return jest.fn();
  });
});

describe('OfflineGate', () => {
  it('shows nothing when the app opens with a connection', async () => {
    await renderWithProviders(<OfflineGate />);

    expect(screen.queryByRole('header', { name: 'No internet connection' })).toBeNull();
  });

  it('does not block the app while NetInfo does not know yet', async () => {
    jest.mocked(NetInfo.fetch).mockResolvedValue(connection(null));

    await renderWithProviders(<OfflineGate />);

    expect(screen.queryByRole('header', { name: 'No internet connection' })).toBeNull();
  });

  it('blocks the app when it opens with no connection', async () => {
    jest.mocked(NetInfo.fetch).mockResolvedValue(connection(false));

    await renderWithProviders(<OfflineGate />);

    expect(await screen.findByRole('header', { name: 'No internet connection' })).toBeOnTheScreen();
    expect(screen.getByText(/needs the internet to load and play lectures/)).toBeOnTheScreen();
  });

  it('stays, with the same message, when "Try again" finds no connection either', async () => {
    jest.mocked(NetInfo.fetch).mockResolvedValue(connection(false));
    jest.mocked(NetInfo.refresh).mockResolvedValue(connection(false));
    await renderWithProviders(<OfflineGate />);
    await screen.findByRole('header', { name: 'No internet connection' });

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('button', { name: 'Try again' })).toBeOnTheScreen();
    expect(screen.getByText(/needs the internet to load and play lectures/)).toBeOnTheScreen();
  });

  it('closes when "Try again" finds a connection', async () => {
    jest.mocked(NetInfo.fetch).mockResolvedValue(connection(false));
    await renderWithProviders(<OfflineGate />);
    await screen.findByRole('header', { name: 'No internet connection' });

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.queryByRole('header', { name: 'No internet connection' })).toBeNull();
  });

  it('closes by itself when the connection comes back', async () => {
    jest.mocked(NetInfo.fetch).mockResolvedValue(connection(false));
    await renderWithProviders(<OfflineGate />);
    await screen.findByRole('header', { name: 'No internet connection' });

    await act(async () => {
      sendConnection(connection(true));
    });

    expect(screen.queryByRole('header', { name: 'No internet connection' })).toBeNull();
  });

  it('blocks the app as soon as the connection drops while it is open', async () => {
    await renderWithProviders(<OfflineGate />);
    expect(screen.queryByRole('header', { name: 'No internet connection' })).toBeNull();

    await act(async () => {
      sendConnection(connection(false));
    });

    expect(await screen.findByRole('header', { name: 'No internet connection' })).toBeOnTheScreen();
  });

  it('does not block the app when NetInfo stops knowing while it is open', async () => {
    await renderWithProviders(<OfflineGate />);

    await act(async () => {
      sendConnection(connection(null));
    });

    expect(screen.queryByRole('header', { name: 'No internet connection' })).toBeNull();
  });
});
