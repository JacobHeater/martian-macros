import type { GoalMode } from '../domain/GoalMode';
import type { Exercise } from '../domain/training/Exercise';
import type { ExerciseProgression } from '../domain/training/ExerciseProgression';
import type { Workout } from '../domain/training/Workout';
import type { UnitSystem } from '../domain/UnitSystem';
import { clamp } from '../lang/clamp';
import { defaultRepRange } from './defaultRepRange';
import { nextLoadKg } from './nextLoadKg';
import type { ProgressionKind } from './ProgressionKind';
import type { ProgressionSuggestion } from './ProgressionSuggestion';

/**
 * Loads closer than this are the same load: a difference of rounding
 * between units, not of plates.
 */
const sameLoadKg = 0.05;

/**
 * How far apart sessions may be and still be compared for a stall, as
 * for the strength trend (MM-77).
 */
const stallWindowMs = 28 * 24 * 60 * 60 * 1000;

/** A session of the exercise: when, its top load, and the reps of each set at it. */
type Session = readonly [at: Date, loadKg: number, reps: readonly number[]];

/**
 * What to try for `exerciseId` next (MM-79), by double progression: more
 * reps at the same load until every set reaches the top of the rep range,
 * then more load at the bottom of it. Undefined when the exercise has never
 * been done in a finished workout started before `before`.
 *
 * A session is the sets of the exercise, with reps, in one finished
 * workout. Its top load is the heaviest logged, and only the sets at that
 * load count, so warm-up sets, which are logged as ordinary sets, do not.
 *
 * - Every such set at the top of the range: add load.
 * - Losing fat: match last time; holding strength is the aim, and nothing
 *   is said about a stall.
 * - The last three sessions at one top load, no more than 28 days
 *   apart, and neither of the last two with more reps than the first: hold.
 * - Otherwise: the same load, for last time's first set's reps or more.
 *
 * It never suggests less load.
 */
export function suggestProgression({
  exerciseId,
  exercise,
  workouts,
  before,
  goal,
  units,
  settings,
}: {
  exerciseId: string;
  exercise: Exercise | undefined;
  workouts: Iterable<Workout>;
  before: Date;
  goal: GoalMode;
  units: UnitSystem;
  settings?: ExerciseProgression | undefined;
}): ProgressionSuggestion | undefined {
  const finished = [...workouts]
    .filter((w) => !w.inProgress && w.startedAt.getTime() < before.getTime())
    .sort((a, b) => {
      const date = b.date.compareTo(a.date);
      if (date !== 0) return date;
      const time = b.startedAt.getTime() - a.startedAt.getTime();
      return time !== 0 ? time : b.id - a.id;
    });

  // The last three sessions, newest first.
  const sessions: Session[] = [];
  for (const workout of finished) {
    const sets = workout.exercises
      .filter((entry) => entry.exerciseId === exerciseId)
      .flatMap((entry) => entry.sets)
      .filter((set) => set.reps > 0);
    if (sets.length === 0) continue;
    const topLoad = Math.max(...sets.map((s) => s.loadKg));
    sessions.push([
      workout.startedAt,
      topLoad,
      sets.filter((set) => Math.abs(set.loadKg - topLoad) < sameLoadKg).map((set) => set.reps),
    ]);
    if (sessions.length === 3) break;
  }
  const latest = sessions[0];
  if (latest === undefined) return undefined;
  const [, load, reps] = latest;
  const firstReps = reps[0] as number;

  // The user's own range and step, where they set them.
  const [bottom, top] = settings === undefined ? defaultRepRange(exercise) : [settings.repsLow, settings.repsHigh];

  const suggest = (kind: ProgressionKind, loadKg: number, n: number): ProgressionSuggestion => ({
    kind,
    loadKg,
    reps: n,
    lastLoadKg: load,
    lastReps: reps,
    rangeTop: top,
  });

  const more = nextLoadKg({ exercise, units, loadKg: load, stepKg: settings?.loadStepKg });
  if (goal === 'fatLoss') {
    return suggest('match', load, firstReps);
  }
  if (more !== undefined && reps.every((n) => n >= top)) {
    return suggest('addLoad', more, bottom);
  }

  const stalled = (): boolean => {
    const [newest, middle, oldest] = sessions;
    if (newest === undefined || middle === undefined || oldest === undefined) return false;
    const total = (sessionReps: readonly number[]) => sessionReps.reduce((sum, n) => sum + n, 0);
    const three = [newest, middle, oldest];
    for (let i = 0; i < 3; i++) {
      const [at, sessionLoad] = three[i] as Session;
      if (Math.abs(sessionLoad - load) >= sameLoadKg) return false;
      if (i > 0 && (three[i - 1] as Session)[0].getTime() - at.getTime() > stallWindowMs) {
        return false;
      }
    }
    const first = total(oldest[2]);
    return total(newest[2]) <= first && total(middle[2]) <= first;
  };
  if (stalled()) {
    return suggest('hold', load, firstReps);
  }
  // With no load to add to, the reps are not capped by the range.
  const aim = more === undefined ? firstReps : clamp(firstReps, bottom, top);
  return suggest('addReps', load, aim);
}
