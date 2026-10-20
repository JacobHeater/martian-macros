import type { CalendarDate } from '../CalendarDate';

/** What a backup holds, said before a restore replaces anything (MM-63). */
export interface BackupContents {
  readonly weighIns: number;
  readonly foodDays: number;
  readonly workouts: number;
  readonly customFoods: number;
  /** The first and last day with a weigh-in or food, when there is one. */
  readonly from: CalendarDate | undefined;
  readonly to: CalendarDate | undefined;
  readonly hasSetup: boolean;
}
