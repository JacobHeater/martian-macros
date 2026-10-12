import type { MmIconName } from './MmIconName';

/** One option of an `MmSegmented` control. */
export interface MmSegment<T> {
  readonly value: T;
  readonly label: string;
  readonly icon?: MmIconName | undefined;
}
