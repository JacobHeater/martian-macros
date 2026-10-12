import type { MmIconName } from './MmIconName';

/** One place in the navigation bar. */
export interface MmNavDestination<Id extends string> {
  id: Id;
  label: string;
  icon: MmIconName;
}
