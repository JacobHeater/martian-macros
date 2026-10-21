import type { WeightLossMedicationAnswer } from '../domain/WeightLossMedicationAnswer';
import { Fmt } from './Fmt';

/**
 * The calorie card's line for someone on a weight-loss medication (MM-113):
 * the target is a level to reach, not a limit, said without pressure. Over
 * the target, or without the answer, undefined: the usual wording stays.
 * Wording pending MM-29 and the owner.
 */
export function calorieAimText(
  answer: WeightLossMedicationAnswer,
  loggedKcal: number,
  targetKcal: number,
): string | undefined {
  if (!answer.weightLossMedication || loggedKcal > targetKcal) return undefined;
  return `${Fmt.whole(loggedKcal)} so far, aiming for about ${Fmt.kcal(targetKcal)}`;
}
