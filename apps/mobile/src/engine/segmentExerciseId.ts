import { builtInExercises } from '../domain/training/builtInExercises';
import type { Exercise } from '../domain/training/Exercise';
import { HealthConnectSegment } from '../domain/training/HealthConnectSegment';

/**
 * Segment types the library does not write, and the exercise each is read
 * as (MM-188): the log records no side, and the double-arm extension is the
 * same movement as the two-arm one.
 */
const readAs: Partial<Record<HealthConnectSegment, string>> = {
  dumbbellCurlLeftArm: 'dumbbell-curl',
  dumbbellCurlRightArm: 'dumbbell-curl',
  dumbbellTricepsExtensionLeftArm: 'dumbbell-overhead-triceps-extension',
  dumbbellTricepsExtensionRightArm: 'dumbbell-overhead-triceps-extension',
  doubleArmTricepsExtension: 'dumbbell-overhead-triceps-extension',
};

/**
 * The library exercise a Health Connect segment of type `segmentId` is
 * imported as (MM-189): the movement's anchor, the first built-in exercise
 * that maps to it. Undefined where the library has none, which makes it
 * "Other exercise". A user's own exercise is never an anchor, so nothing
 * maps to it by default.
 */
export function segmentExerciseId(segmentId: number, library: readonly Exercise[] = builtInExercises): string | undefined {
  const segment = HealthConnectSegment.fromPlatformId(segmentId);
  if (segment === undefined) return undefined;
  const builtIn = library.filter((exercise) => !exercise.isCustom);
  const named = readAs[segment];
  if (named !== undefined) return builtIn.find((exercise) => exercise.id === named)?.id;
  return builtIn.find((exercise) => exercise.healthConnect === segment)?.id;
}
