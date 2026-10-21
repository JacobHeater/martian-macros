import type { WeightLossMedicationAnswer } from '../domain/WeightLossMedicationAnswer';

/**
 * The Coach screen's note for someone on a weight-loss medication with no
 * training days set (MM-113, MM-134). The evidence is early, so it says
 * "best-supported", not "the only" or "the main". Wording pending MM-29.
 */
export function weightLossMedicationTrainingNote(
  answer: WeightLossMedicationAnswer,
  trainingDaysPerWeek: number,
): string | undefined {
  if (!answer.weightLossMedication || trainingDaysPerWeek > 0) return undefined;
  return 'Resistance training, with enough protein, is the best-supported way to keep muscle while losing weight on this medication.';
}
