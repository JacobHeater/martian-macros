import { useCallback, useSyncExternalStore } from 'react';
import type { Cell } from '../state/Cell';

/** The value of a cell, kept current: the screen is drawn again when it changes. */
export function useCell<T>(cell: Cell<T>): T {
  const subscribe = useCallback((changed: () => void) => cell.subscribe(() => changed()), [cell]);
  const read = useCallback(() => cell.peek(), [cell]);
  return useSyncExternalStore(subscribe, read);
}
