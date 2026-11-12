import { useEffect, useState } from 'react';

// Returns `value`, but only once it has stopped changing for `delayMs`. Search uses it so a
// fetch runs after the user pauses typing, not on every keystroke.
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    // A new value before the delay is up cancels the pending update.
    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
