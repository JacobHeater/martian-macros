import { atwaterKcal } from '../domain/atwaterKcal';
import type { CandidateFood } from './CandidateFood';
import { CommunityReviewRule } from './CommunityReviewRule';

/**
 * Why a community record should be checked against its package, in one
 * sentence, or undefined when it is complete and comfortably consistent
 * (MM-153). `asOfSeconds` is when the data it came with was current: the
 * newest record of the build's export, or now for an online answer.
 */
export function communityCheckThisReason(food: CandidateFood, asOfSeconds: number): string | undefined {
  const rule = CommunityReviewRule;
  const kcal = food.kcal ?? 0;
  const implied = atwaterKcal({ proteinG: food.proteinG ?? 0, carbsG: food.carbsG ?? 0, fatG: food.fatG ?? 0 }) + 7 * (food.alcoholG ?? 0);
  const fiber = food.fiberG ?? 0;
  const off = Math.min(...[implied, implied - 2 * fiber, implied + 2 * fiber].map((c) => Math.abs(kcal - c)));
  const base = Math.max(implied, 1);
  if (off > rule.nearToleranceKcal && off / base > rule.nearToleranceFraction) {
    return 'Its calories and macros only just agree. Compare it with the package.';
  }
  if (food.fiberG === undefined || food.sodiumMg === undefined) {
    return 'Its record leaves out fiber or sodium. Compare it with the package.';
  }
  if (food.updatedAt > 0 && asOfSeconds - food.updatedAt > rule.staleSeconds) {
    return 'Its record has not changed in more than five years, and labels change. Compare it with the package.';
  }
  return undefined;
}
