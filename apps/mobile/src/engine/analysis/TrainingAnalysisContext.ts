import type { CalendarDate } from '../../domain/CalendarDate';
import type { Exercise } from '../../domain/training/Exercise';
import type { Workout } from '../../domain/training/Workout';
import type { StrengthTrend } from '../StrengthTrend';
import type { TrendSpan } from '../trends/TrendSpan';
import type { TrainingAnalysisInput } from './TrainingAnalysisInput';

/** What every training signal reads (MM-609), worked out once by `analyseTrainingSpan`. */
export interface TrainingAnalysisContext {
  readonly input: TrainingAnalysisInput;
  readonly span: TrendSpan;
  /** Yesterday: the span's last day. */
  readonly asOf: CalendarDate;
  /** The span's first day. */
  readonly spanStart: CalendarDate;
  /** Finished workouts on or before `asOf` with at least one hard set: the sessions. */
  readonly sessions: readonly Workout[];
  /** The days trained, by epoch day: two sessions on one day are one day trained. */
  readonly trainedDays: ReadonlySet<number>;
  readonly exercisesById: ReadonlyMap<string, Exercise>;
  /** Every lift's strength trend as of `asOf` (MM-77). */
  readonly trends: readonly StrengthTrend[];
  /** An eating-disorder history or under-eating: no "train more", no held line, no water line. */
  readonly restricted: boolean;
}
