import type { CardioActivity } from '../domain/training/CardioActivity';

/** One week's cardio, as `buildCardioWeek` totals it. */
export interface CardioWeekTotals {
  /** Minutes of cardio in all. */
  readonly minutes: number;
  readonly sessions: number;
  /** By activity, most minutes first; an activity with no session is left out. */
  readonly byActivity: readonly { readonly activity: CardioActivity; readonly minutes: number; readonly sessions: number }[];
  /** Steps a day on average over the days with a total, rounded; undefined with none. */
  readonly stepsPerDay: number | undefined;
  /** How many of the seven days had a steps total. */
  readonly stepsDays: number;
}
