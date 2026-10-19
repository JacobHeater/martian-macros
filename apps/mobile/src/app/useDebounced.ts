import { useEffect, useState } from 'react';

/**
 * `value` once it has held still for `ms`: the first value at once, each
 * later one `ms` after the last change. For work that should wait for the
 * person to pause, as a search of the food packs while they type (MM-408).
 */
export function useDebounced<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return settled;
}
