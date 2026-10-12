import type { Exercise } from '../domain/training/Exercise';
import type { UnitSystem } from '../domain/UnitSystem';
import { defaultLoadStepKg } from './defaultLoadStepKg';

/**
 * One step up from `loadKg` for `exercise` (MM-79), or undefined when there
 * is no load to add to: a bodyweight exercise done with none.
 *
 * The step is `stepKg` when the user set one, otherwise
 * `defaultLoadStepKg`. Assisted work, a load below zero, takes twice the
 * default step less help (5 kg or 10 lb), or the user's own step, and
 * never goes past none.
 */
export function nextLoadKg({
  exercise,
  units,
  loadKg,
  stepKg,
}: {
  exercise: Exercise | undefined;
  units: UnitSystem;
  loadKg: number;
  stepKg?: number | undefined;
}): number | undefined {
  const usual = defaultLoadStepKg({ exercise, units });
  if (exercise?.load === 'bodyweight') {
    if (Math.abs(loadKg) < 0.05) return undefined;
    if (loadKg < 0) {
      const less = loadKg + (stepKg ?? usual * 2);
      return less > 0 ? 0 : less;
    }
  }
  return loadKg + (stepKg ?? usual);
}
