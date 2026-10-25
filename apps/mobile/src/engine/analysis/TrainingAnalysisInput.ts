import type { CalendarDate } from '../../domain/CalendarDate';
import type { IntakeDay } from '../../domain/IntakeDay';
import type { Pause } from '../../domain/Pause';
import type { SleepNight } from '../../domain/SleepNight';
import type { Exercise } from '../../domain/training/Exercise';
import type { ExerciseProgression } from '../../domain/training/ExerciseProgression';
import type { Workout } from '../../domain/training/Workout';
import type { UserSetup } from '../../domain/UserSetup';
import type { WaterEntry } from '../../domain/water/WaterEntry';
import type { WaterGoal } from '../../domain/water/WaterGoal';
import type { WeightObservation } from '../../domain/WeightObservation';
import type { InsightSafeguards } from '../InsightSafeguards';
import type { TargetsRecord } from '../TargetsRecord';

/** What the training, water and sleep signals read (MM-609). Days after the analysis's `asOf` are never read. */
export interface TrainingAnalysisInput {
  /** The goal (`goalMode`), the training-days setting, the units and the pace chosen. */
  readonly setup: UserSetup;
  /** Every workout: at least the 6 weeks before `asOf`, and more for a 3m span. */
  readonly workouts: readonly Workout[];
  /** The exercise library, built-in and the person's own. */
  readonly exercises: readonly Exercise[];
  /** The rep range and step chosen per exercise (MM-79); the defaults without one. */
  readonly progressions?: ReadonlyMap<string, ExerciseProgression> | undefined;
  /** Weigh-ins, which a bodyweight lift's estimate carries. */
  readonly weights: readonly WeightObservation[];
  readonly pauses: readonly Pause[];
  /** The targets history: the goal and the protein minimum of each day, and the deficit's start. */
  readonly history: readonly TargetsRecord[];
  /** When a gap or a pause restarted the deficit count (MM-147, MM-148). */
  readonly deficitRestartOn: CalendarDate | undefined;
  /** Weight progress is assessed as stalled (MM-140): strength on fat loss says nothing then (MM-377). */
  readonly progressStalled: boolean;
  /** The nights of sleep recorded (MM-250). */
  readonly sleep: readonly SleepNight[];
  /** The water logged over at least the 14 days before `asOf`. */
  readonly water: readonly WaterEntry[];
  readonly waterGoal: WaterGoal | undefined;
  /** The whole days of eating (`usableIntakeDays`) of at least the 14 days before `asOf`. */
  readonly wholeDays: readonly IntakeDay[];
  /** An eating-disorder history or the under-eating finding holds: no "train more", no held line, no water line. */
  readonly safeguards: Pick<InsightSafeguards, 'eatingDisorderHistory' | 'underEating'>;
}
