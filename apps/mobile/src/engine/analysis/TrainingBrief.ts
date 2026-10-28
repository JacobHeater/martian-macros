import type { GoalMode } from '../../domain/GoalMode';

/**
 * The training part of the coach's brief (MM-681): what the person is held
 * to this week in lifting, cardio and steps, as figures. The words are
 * `format/coach/trainingBriefText`; the model is given the same figures.
 */
export interface TrainingBrief {
  readonly goal: GoalMode;
  /** Cardio and steps are held to their floors on fat loss and recomp only (the owner, MM-678). */
  readonly cardioHeld: boolean;
  /** Finished workouts with a hard set in the last seven days through today. */
  readonly sessionsThisWeek: number;
  /** The days a week the person said they train. */
  readonly sessionsTarget: number;
  /** Days since the last session; undefined with none ever. */
  readonly daysSinceSession: number | undefined;
  /** Whether the wearable has ever given a session or a day of steps (MM-677). */
  readonly wearableInUse: boolean;
  readonly cardioMinutes: number;
  readonly cardioFloorMinutes: number;
  /** Steps a day over the days with a total in the last seven; undefined with none. */
  readonly stepsPerDay: number | undefined;
  readonly stepsDays: number;
  readonly stepsFloor: number;
}
