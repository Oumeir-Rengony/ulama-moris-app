import { renderHook } from '@testing-library/react-native';
import { usePathname } from 'expo-router';

import { useOutsideTabsProgress } from '@/features/player/use-outside-tabs-progress';

jest.mock('expo-router', () => ({
  usePathname: jest.fn(),
}));

const mockedUsePathname = jest.mocked(usePathname);

async function progressFor(pathname: string): Promise<number> {
  mockedUsePathname.mockReturnValue(pathname);
  const { result } = await renderHook(() => useOutsideTabsProgress());
  return result.current.get();
}

describe('useOutsideTabsProgress', () => {
  it('is 0 on the tab screens, where the tab bar shows', async () => {
    expect(await progressFor('/')).toBe(0);
    expect(await progressFor('/events')).toBe(0);
    expect(await progressFor('/events/the-sahaba')).toBe(0);
  });

  it('is 1 on Search, where the tab bar slides away and the mini player takes its place', async () => {
    expect(await progressFor('/search')).toBe(1);
  });

  it('follows the path when Search opens and closes', async () => {
    mockedUsePathname.mockReturnValue('/');
    const { result, rerender } = await renderHook(() => useOutsideTabsProgress());
    expect(result.current.get()).toBe(0);

    mockedUsePathname.mockReturnValue('/search');
    await rerender({});
    expect(result.current.get()).toBe(1);

    mockedUsePathname.mockReturnValue('/');
    await rerender({});
    expect(result.current.get()).toBe(0);
  });
});
