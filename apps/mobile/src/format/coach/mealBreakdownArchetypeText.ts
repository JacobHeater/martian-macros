import type { MealBreakdownAnalysis } from '../../engine/analysis/MealBreakdownAnalysis';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { Fmt } from '../Fmt';
import { mealLabel } from '../mealLabel';
import { foodInSentence } from './foodInSentence';

/**
 * Synthesizes a deterministic coaching paragraph for the on-demand
 * "Coach breakdown" meal sheet (MM-663, MM-666).
 */
export function mealBreakdownArchetypeText(analysis: MealBreakdownAnalysis): string {
  const mealName = mealLabel(analysis.meal);
  const pct = (fraction: number) => `${roundHalfAwayFromZero(fraction * 100) + 0}%`;

  if (analysis.protectedPath) {
    return `${mealName} provided ${Fmt.grams(analysis.mealProteinG)} of protein (${pct(analysis.dailyProteinShare)} of your daily target).`;
  }

  const impact = `${mealName} used ${pct(analysis.dailyKcalShare)} of your daily calorie budget (${Fmt.kcal(analysis.mealKcal)}) for ${pct(analysis.dailyProteinShare)} of your protein target (${Fmt.grams(analysis.mealProteinG)}, ${pct(analysis.mealProteinDensity)} protein density).`;

  let outlierText = '';
  if (analysis.outlierItem !== undefined) {
    const item = analysis.outlierItem;
    const itemName = foodInSentence(item.name);
    if (analysis.suggestedSwap !== undefined) {
      const swap = analysis.suggestedSwap;
      const savings: string[] = [];
      if (swap.caloriesSaved >= 10) savings.push(`saves ${Fmt.kcal(swap.caloriesSaved)}`);
      if (swap.proteinGained >= 3) savings.push(`adds ${Fmt.grams(swap.proteinGained)} protein`);
      const delta = savings.length > 0 ? ` (${savings.join(', ')})` : '';
      outlierText = ` Highest calorie drag: ${itemName} (${Fmt.kcal(item.kcal)}, ${Fmt.grams(item.proteinG)} protein). Swap it for ${swap.replacementName} next time${delta}.`;
    } else if (item.proteinDensity < analysis.targetProteinDensity * 0.75 && item.kcal >= 150) {
      outlierText = ` Highest calorie drag: ${itemName} (${Fmt.kcal(item.kcal)}, ${Fmt.grams(item.proteinG)} protein). Pair or replace it with a leaner protein source next time.`;
    }
  }

  let runwayText: string;
  if (analysis.kcalRemaining < 0) {
    runwayText = ` You are ${Fmt.kcal(-analysis.kcalRemaining)} over target for the day; keep any remaining food to lean protein and vegetables.`;
  } else if (analysis.proteinUnrecoverable) {
    runwayText = ` With ${Fmt.kcal(analysis.kcalRemaining)} left and ${Fmt.grams(analysis.proteinRemainingG)} protein remaining, the protein gap cannot fit tonight. Protect your calorie cap today and front-load protein in the morning.`;
  } else if (analysis.proteinRemainingG <= 0) {
    runwayText = ` Your protein target is met for the day with ${Fmt.kcal(analysis.kcalRemaining)} remaining.`;
  } else {
    runwayText = ` You have ${Fmt.kcal(analysis.kcalRemaining)} left to cover ${Fmt.grams(analysis.proteinRemainingG)} of protein (${pct(analysis.requiredRestOfDayDensity)} protein density needed across remaining meals).`;
  }

  return `${impact}${outlierText}${runwayText}`;
}
