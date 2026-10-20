import type { CalendarDate } from '../domain/CalendarDate';
import type { GoalMode } from '../domain/GoalMode';
import type { TrainingLapseKind } from './TrainingLapseKind';

/** Where training stands against a goal that needs it (MM-134). */
export interface TrainingLapse {
  readonly kind: TrainingLapseKind;
  readonly goal: GoalMode;
  /** Days since the last finished workout; undefined when none was ever logged. */
  readonly daysSince: number | undefined;
  readonly lastTrainedOn: CalendarDate | undefined;
  /** The training-days setting is zero: on a gain, the surplus is suspended whatever the log says. */
  readonly noTrainingDays: boolean;
}
