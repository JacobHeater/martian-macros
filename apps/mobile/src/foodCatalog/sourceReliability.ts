import type { CatalogFood } from './CatalogFood';
import { disagreementReason } from './disagreementReason';
import { SourceReliabilityRule } from './SourceReliabilityRule';

/**
 * How far a food's numbers can be relied on, 0 to 100 (MM-383): the
 * source's base, less the disagreement penalty when the pack marked the
 * record for disagreeing with another source's, plus what the record
 * states. The modifiers never cross a source: they order within one.
 */
export function sourceReliability(food: CatalogFood): number {
  const rule = SourceReliabilityRule;
  const base = rule.bases[food.source] ?? rule.basesByTier[food.tier];
  let score = base - (food.tierReason === disagreementReason ? rule.disagreementPenalty : 0);
  if (food.fiberG !== undefined && food.sodiumMg !== undefined) score += rule.fiberAndSodiumBonus;
  if (food.micros.sugars !== undefined && food.micros.saturatedFat !== undefined) score += rule.sugarsAndSaturatedFatBonus;
  return Math.min(100, Math.max(0, score));
}
