import type { WorkoutSet } from '../domain/training/WorkoutSet';
import { checkTimeSpan } from './checkTimeSpan';
import type { TimeSpanProblem } from './TimeSpanProblem';

/**
 * Checks a typed set against the workout bounds and all `otherSets`.
 * The caller excludes the edited set. Missing times never imply an interval.
 */
export function checkSetTimes({
  otherSets,
  start,
  end,
  notBefore,
  notAfter,
}: {
  otherSets: Iterable<WorkoutSet>;
  start?: Date | undefined;
  end?: Date | undefined;
  notBefore?: Date | undefined;
  notAfter?: Date | undefined;
}): TimeSpanProblem | undefined {
  const problem = checkTimeSpan({ start, end, notBefore, notAfter });
  if (problem !== undefined) return problem;
  const at = (time: Date) => time.getTime();
  for (const set of otherSets) {
    const otherStart = set.startedAt;
    const otherEnd = set.endedAt;
    if (start !== undefined && end !== undefined) {
      if (otherStart !== undefined && otherEnd !== undefined) {
        if (at(start) < at(otherEnd) && at(end) > at(otherStart)) {
          return 'overlappingSet';
        }
      } else {
        const known = otherStart ?? otherEnd;
        if (known !== undefined && at(known) > at(start) && at(known) < at(end)) {
          return 'overlappingSet';
        }
      }
    } else if (otherStart !== undefined && otherEnd !== undefined) {
      const known = start ?? end;
      if (known !== undefined && at(known) > at(otherStart) && at(known) < at(otherEnd)) {
        return 'overlappingSet';
      }
    }
  }
  return undefined;
}
