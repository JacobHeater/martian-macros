import type { Exercise } from '../domain/training/Exercise';
import { ArgumentError } from '../lang/ArgumentError';
import type { StrengthPoint } from './StrengthPoint';

interface StrengthTrendInit {
  exercise: Exercise | undefined;
  exerciseId: string;
  points: readonly StrengthPoint[];
  loggedSessions: number;
  recentSessions: number;
}

/** Session points in chronological order, including lifts with no usable sets. */
export class StrengthTrend {
  readonly exerciseId: string;
  readonly exercise: Exercise | undefined;
  readonly points: readonly StrengthPoint[];
  readonly loggedSessions: number;
  readonly recentSessions: number;

  constructor(init: StrengthTrendInit) {
    this.exercise = init.exercise;
    this.exerciseId = init.exerciseId;
    this.points = init.points;
    this.loggedSessions = init.loggedSessions;
    this.recentSessions = init.recentSessions;
  }

  get name(): string {
    return this.exercise?.name ?? `Deleted exercise (${this.exerciseId})`;
  }

  /**
   * Comparison ending at the latest recorded session, not an invented value
   * for today. A baseline needs a point within the preceding seven days.
   */
  changeOverDays(days: number): number | undefined {
    if (days <= 0) throw new ArgumentError(`Invalid days (${days}): Must be positive.`);
    const last = this.points[this.points.length - 1];
    if (last === undefined) return undefined;
    const target = last.date.addDays(-days);
    let baseline: StrengthPoint | undefined;
    for (const point of this.points) {
      if (!point.date.isAfter(target)) baseline = point;
    }
    if (baseline === undefined || baseline.date.daysUntil(target) > 7) return undefined;
    return last.trendKg - baseline.trendKg;
  }
}
