import type { MmIconName } from './MmIconName';

/** One place the drawer goes to (MM-711): its id, its label and its icon. */
export interface MmNavDestination<Id extends string> {
  id: Id;
  label: string;
  icon: MmIconName;
}
