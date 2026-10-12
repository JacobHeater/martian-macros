import type { Exercise } from '../domain/training/Exercise';
import type { UnitSystem } from '../domain/UnitSystem';
import { Units } from '../domain/Units';

/**
 * The step a load goes up by when the user has set none (MM-79): a round
 * number in their own `units`, since that is what plates and stacks come
 * in. 2.5 kg or 5 lb, except a dumbbell (2 kg or 5 lb) and a machine
 * (5 kg or 10 lb); weight added to the body goes up by 2.5 kg or 5 lb
 * whatever it hangs from. Equipment conventions, not tested thresholds.
 */
export function defaultLoadStepKg({ exercise, units }: { exercise: Exercise | undefined; units: UnitSystem }): number {
  const step = (kg: number, lb: number) => (units === 'imperial' ? Units.lbToKg(lb) : kg);
  if (exercise?.load === 'bodyweight') return step(2.5, 5);
  switch (exercise?.equipment) {
    case 'dumbbell':
      return step(2, 5);
    case 'machine':
      return step(5, 10);
    default:
      return step(2.5, 5);
  }
}
