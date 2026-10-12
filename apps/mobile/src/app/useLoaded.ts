import type { Cell } from '../state/Cell';
import { Loadable } from '../state/Loadable';
import { useCell } from './useCell';

/** The value of a cell that loads, kept current; undefined until it has loaded. */
export function useLoaded<T>(cell: Cell<Loadable<T>>): T | undefined {
  return Loadable.valueOf(useCell(cell));
}
