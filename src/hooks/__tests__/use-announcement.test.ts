import { renderHook } from '@testing-library/react-native';
import { AccessibilityInfo, Platform } from 'react-native';

import { useAnnouncement } from '@/hooks/use-announcement';

let announceSpy: jest.SpyInstance;

beforeEach(() => {
  announceSpy = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
});

afterEach(() => {
  announceSpy.mockRestore();
});

describe('useAnnouncement', () => {
  it('announces nothing while there is no message', async () => {
    await renderHook(() => useAnnouncement(null));

    expect(announceSpy).not.toHaveBeenCalled();
  });

  it('announces a message on iOS when it appears, and again when it changes', async () => {
    expect(Platform.OS).toBe('ios');
    const { rerender } = await renderHook(({ message }: { message: string | null }) => useAnnouncement(message), {
      initialProps: { message: null as string | null },
    });

    await rerender({ message: 'Lectures didn’t load.' });
    expect(announceSpy).toHaveBeenLastCalledWith('Lectures didn’t load.');

    await rerender({ message: 'More lectures didn’t load.' });
    expect(announceSpy).toHaveBeenLastCalledWith('More lectures didn’t load.');
    expect(announceSpy).toHaveBeenCalledTimes(2);
  });

  it('does not announce the same message twice', async () => {
    const { rerender } = await renderHook(({ message }: { message: string }) => useAnnouncement(message), {
      initialProps: { message: 'Lectures didn’t load.' },
    });

    await rerender({ message: 'Lectures didn’t load.' });

    expect(announceSpy).toHaveBeenCalledTimes(1);
  });
});
