import type { CalendarDate } from '../CalendarDate';
import type { WorkoutExercise } from './WorkoutExercise';

interface WorkoutInit {
  id: number;
  date: CalendarDate;
  startedAt: Date;
  endedAt?: Date | undefined;
  pausedAt?: Date | undefined;
  pausedForMs?: number;
  setStartedAt?: Date | undefined;
  exercises?: readonly WorkoutExercise[];
}

/**
 * What `copyWith` may change. A key that is absent keeps the value;
 * `endedAt`, `pausedAt` and `setStartedAt` are cleared by giving the key
 * with `undefined`.
 */
interface WorkoutChanges {
  id?: number;
  date?: CalendarDate;
  startedAt?: Date;
  endedAt?: Date | undefined;
  pausedAt?: Date | undefined;
  pausedForMs?: number;
  setStartedAt?: Date | undefined;
  exercises?: readonly WorkoutExercise[];
}

/**
 * A training session: its exercises in order, each with its sets (MM-75).
 * Lengths of time are in milliseconds.
 */
export class Workout {
  /** Database id; 0 for one not yet saved. */
  readonly id: number;

  /** The day it counts toward. */
  readonly date: CalendarDate;
  readonly startedAt: Date;

  /** Undefined while the workout is in progress. */
  readonly endedAt: Date | undefined;

  /** When the clock was paused, while it is (MM-191). */
  readonly pausedAt: Date | undefined;

  /**
   * How long the clock has been paused in all, not counting a pause that is
   * still running.
   */
  readonly pausedForMs: number;

  /**
   * When the set timer was started, while a set is being timed (MM-191).
   * The next set logged takes it as its start.
   */
  readonly setStartedAt: Date | undefined;
  readonly exercises: readonly WorkoutExercise[];

  constructor(init: WorkoutInit) {
    this.id = init.id;
    this.date = init.date;
    this.startedAt = init.startedAt;
    this.endedAt = init.endedAt;
    this.pausedAt = init.pausedAt;
    this.pausedForMs = init.pausedForMs ?? 0;
    this.setStartedAt = init.setStartedAt;
    this.exercises = init.exercises ?? [];
  }

  get inProgress(): boolean {
    return this.endedAt === undefined;
  }

  get paused(): boolean {
    return this.pausedAt !== undefined;
  }

  get setCount(): number {
    return this.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  }

  /**
   * How long the workout has run as of `now`, leaving out the time its
   * clock was paused. For a finished workout `now` does not matter.
   */
  activeMs(now: Date): number {
    const until = this.endedAt ?? this.pausedAt ?? now;
    const active = until.getTime() - this.startedAt.getTime() - this.pausedForMs;
    return active < 0 ? 0 : active;
  }

  copyWith(changes: WorkoutChanges): Workout {
    return new Workout({
      id: changes.id ?? this.id,
      date: changes.date ?? this.date,
      startedAt: changes.startedAt ?? this.startedAt,
      endedAt: 'endedAt' in changes ? changes.endedAt : this.endedAt,
      pausedAt: 'pausedAt' in changes ? changes.pausedAt : this.pausedAt,
      pausedForMs: changes.pausedForMs ?? this.pausedForMs,
      setStartedAt: 'setStartedAt' in changes ? changes.setStartedAt : this.setStartedAt,
      exercises: changes.exercises ?? this.exercises,
    });
  }
}
