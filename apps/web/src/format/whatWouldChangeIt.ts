import type { ExplanationReason, TargetsExplanation } from '../engine';

/** One sentence on what would change the targets next (MM-138). */
export function whatWouldChangeIt(e: TargetsExplanation): string {
  const has = (r: ExplanationReason) => e.lines.some((l) => l.reason === r);
  if (e.estimateStatus === 'held') {
    return 'More fully logged days and regular weigh-ins would let the app measure your expenditure.';
  }
  if (has('calorieFloor')) return 'The floor stays until your resting energy or body-fat estimate changes.';
  if (has('stepLimit')) return 'The rest of the change arrives over the next weeks, in weekly steps.';
  if (e.excludedPartialDays > 0) return 'More complete days would make this estimate firmer.';
  return 'If your weight trend changes at this intake, expect targets to follow.';
}
