import type { Workout } from '../domain/training/Workout';
import { checkSetTimes } from '../engine/checkSetTimes';
import { timeSpanProblemMessage } from '../format/timeSpanProblemMessage';

/**
 * Why a typed start and end cannot be right for set `setIndex` of the
 * exercise at `index` (MM-191, MM-196), in words, or undefined when they
 * can. A clash names the set it is with (MM-222).
 */
export function setTimesRefusal({
  workout,
  index,
  setIndex,
  start,
  end,
  notAfter,
  nameOf,
}: {
  workout: Workout;
  index: number;
  setIndex: number;
  start: Date | undefined;
  end: Date | undefined;
  notAfter: Date;
  nameOf: (exerciseId: string) => string;
}): string | undefined {
  const others = workout.exercises.flatMap((exercise, e) =>
    exercise.sets.flatMap((set, t) => (e === index && t === setIndex ? [] : [{ set, number: t + 1, exerciseId: exercise.exerciseId }])),
  );
  const problem = checkSetTimes({ start, end, notBefore: workout.startedAt, notAfter, otherSets: others.map((o) => o.set) });
  if (problem === undefined) return undefined;
  if (problem !== 'overlappingSet') return timeSpanProblemMessage(problem);
  const clash = others.find((o) => checkSetTimes({ start, end, otherSets: [o.set] }) === 'overlappingSet');
  return clash === undefined ? timeSpanProblemMessage(problem) : `That overlaps set ${clash.number} of ${nameOf(clash.exerciseId)}.`;
}
