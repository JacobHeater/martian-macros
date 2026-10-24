import type { GoalMode } from '../../../domain/GoalMode';
import type { TrendDirection } from '../../trends/TrendDirection';
import type { CoachFindingKind } from '../CoachFindingKind';
import type { FoodLimits } from './FoodLimits';

const protein: readonly string[] = ['proteinMinimum', 'proteinTarget', 'proteinByMeal'];
const morePro: readonly string[] = [...protein, 'proteinDensity', 'mealBalance'];
const adds: readonly string[] = [...protein, 'fiber'];
const fatOrDensity: readonly string[] = ['fatAgainstTarget', 'fatShare', 'macroSplit', 'proteinDensity', 'calorieDensity', 'mealBalance'];

/**
 * Whether the safeguards let a food finding be said (MM-606, MM-612). Filters
 * run before ranking, so a finding left out displaces nothing (MM-605).
 *
 * - Bariatric surgery: nothing.
 * - Under 18 or paused: on a span, adds only (protein, fiber); on 1d, nothing.
 * - The under-eating finding: adds only.
 * - An eating-disorder history: protein (N1–N3) only; on 1d nothing about
 *   calories or fat either. Foods are left out by the caller.
 * - Pregnancy, breastfeeding, underweight, low body weight: no fat, density
 *   or calorie-lowering line (calories over target, intake around
 *   maintenance on fat loss).
 * - Kidney disease: no line for more protein, holding up included.
 * - Insulin or a sulfonylurea: no split that points at carbohydrate.
 *
 * What is left today ('left') and data quality are said under every
 * safeguard but the first.
 */
export function foodFindingAllowed({
  limits,
  signal,
  kind,
  direction,
  goal,
  figures,
  day,
}: {
  limits: FoodLimits;
  signal: string;
  kind: CoachFindingKind;
  direction: TrendDirection | undefined;
  goal: GoalMode | undefined;
  figures: Readonly<Record<string, number>>;
  /** 1d (MM-612), where under 18 or paused leaves nothing. */
  day: boolean;
}): boolean {
  if (limits.nothing) return false;
  if (day && limits.minorOrPaused) return false;
  if (kind === 'dataQuality' || kind === 'left') return true;
  if (limits.proteinOnly && !protein.includes(signal)) return false;
  if ((limits.minorOrPaused || limits.underEating) && !adds.includes(signal)) return false;
  if (limits.noMoreProtein && morePro.includes(signal)) return false;
  if (limits.noLowering) {
    if (fatOrDensity.includes(signal)) return false;
    if (signal === 'calories' && kind === 'fix' && direction === 'up') return false;
    if (signal === 'energyUse' && goal === 'fatLoss') return false;
  }
  if (limits.noCarbLowering && signal === 'macroSplit' && figures['largest'] === 1 && (figures['largestOff'] ?? 0) > 0) return false;
  return true;
}
