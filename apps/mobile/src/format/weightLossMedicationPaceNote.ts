import type { WeightLossMedicationAnswer } from '../domain/WeightLossMedicationAnswer';
import type { TargetFlag } from '../engine/TargetFlag';

/**
 * The line added to the too-fast-loss message for someone on a weight-loss
 * medication (MM-113, MM-115). Targets rise as usual; the pace is for the
 * prescriber, and a dose is never mentioned. Wording pending MM-29.
 */
export function weightLossMedicationPaceNote(
  answer: WeightLossMedicationAnswer,
  flags: ReadonlySet<TargetFlag>,
): string | undefined {
  if (!answer.weightLossMedication || !flags.has('raisedForSafePace')) return undefined;
  return 'This pace is faster than the app would set, and faster loss can cost more muscle. It is worth raising with your prescriber.';
}
