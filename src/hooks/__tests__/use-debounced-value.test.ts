import { act, renderHook } from '@testing-library/react-native';

import { useDebouncedValue } from '@/hooks/use-debounced-value';

const searchDelayMs = 150;

function useSearchDebounce({ value }: { value: string }) {
  return useDebouncedValue(value, searchDelayMs);
}

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts with the first value', async () => {
    const { result } = await renderHook(useSearchDebounce, { initialProps: { value: 'sa' } });
    expect(result.current).toBe('sa');
  });

  it('updates only after the value has stopped changing for 150 ms', async () => {
    const { result, rerender } = await renderHook(useSearchDebounce, { initialProps: { value: '' } });

    await rerender({ value: 'sahaba' });
    await act(async () => {
      jest.advanceTimersByTime(searchDelayMs - 1);
    });
    expect(result.current).toBe('');

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('sahaba');
  });

  it('restarts the wait on every change', async () => {
    const { result, rerender } = await renderHook(useSearchDebounce, { initialProps: { value: '' } });

    await rerender({ value: 'sah' });
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    await rerender({ value: 'sahaba' });
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('');

    await act(async () => {
      jest.advanceTimersByTime(50);
    });
    expect(result.current).toBe('sahaba');
  });

  it('clears the pending timer on unmount', async () => {
    // React schedules timers of its own, so look for the hook's timer by its 150 ms delay.
    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');
    const clearTimeoutSpy = jest.spyOn(globalThis, 'clearTimeout');

    const { rerender, unmount } = await renderHook(useSearchDebounce, { initialProps: { value: '' } });
    await rerender({ value: 'sahaba' });

    let pendingTimerId: unknown = undefined;
    for (let callIndex = 0; callIndex < setTimeoutSpy.mock.calls.length; callIndex++) {
      const delay = setTimeoutSpy.mock.calls[callIndex][1];
      if (delay === searchDelayMs) {
        pendingTimerId = setTimeoutSpy.mock.results[callIndex].value;
      }
    }
    expect(pendingTimerId).toBeDefined();

    await unmount();
    expect(clearTimeoutSpy).toHaveBeenCalledWith(pendingTimerId);

    setTimeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });
});
