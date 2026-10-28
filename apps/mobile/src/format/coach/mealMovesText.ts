import type { MealBreakdownAnalysis } from '../../engine/analysis/MealBreakdownAnalysis';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { Fmt } from '../Fmt';
import { mealLabel } from '../mealLabel';
import { foodInSentence } from './foodInSentence';
import { foodNameIsPlural } from './foodNameIsPlural';
import { mealMoveOrder } from './mealMoveOrder';

const pct = (fraction: number) => `${roundHalfAwayFromZero(fraction * 100) + 0}%`;

/**
 * The built-in words of a meal's breakdown (MM-684), in the lines the
 * owner approved (MM-682): what the meal took, the drag named with its
 * figures, and the one order (`moves.best`); then, after a fix for next
 * time, today's order when protein is still to go.
 */
export function mealMovesText(analysis: MealBreakdownAnalysis): string {
  const meal = mealLabel(analysis.meal);
  const protein = Fmt.grams(analysis.mealProteinG);
  if (analysis.protectedPath) {
    return `${meal} provided ${protein} of protein (${pct(analysis.dailyProteinShare)} of your daily target).`;
  }
  const best = analysis.moves.best;
  const lead =
    best?.kind === 'nextMeal' && !best.fits
      ? `${meal} took ${Fmt.kcal(analysis.mealKcal)}, ${pct(analysis.dailyKcalShare)} of your day, for ${protein} of protein.`
      : best?.kind === 'addProtein'
        ? `${meal} was ${Fmt.kcal(analysis.mealKcal)} for ${protein} of protein, ${pct(analysis.mealProteinDensity)} protein.`
        : `${meal} was ${Fmt.kcal(analysis.mealKcal)} for ${protein} of protein.`;
  const outlier = analysis.outlierItem;
  const drag =
    outlier === undefined
      ? ''
      : ` The ${foodInSentence(outlier.name)} ${foodNameIsPlural(outlier.name) ? 'are' : 'is'} the drag: ${Fmt.kcal(outlier.kcal)} for ${Fmt.grams(outlier.proteinG)}.`;
  if (best === undefined) {
    const rest =
      analysis.kcalRemaining < 0
        ? ` You are ${Fmt.kcal(-analysis.kcalRemaining)} over for the day. Stop here.`
        : analysis.proteinRemainingG <= 0
          ? ` Protein is covered today with ${Fmt.kcal(analysis.kcalRemaining)} left. Hold the line.`
          : '';
    return `${lead}${drag}${rest}`;
  }
  const order = ` ${mealMoveOrder(best, analysis.meal)}`;
  const today = best.kind === 'nextMeal' ? undefined : analysis.moves.moves.find((m) => m.kind === 'nextMeal');
  const rest = today === undefined ? '' : ` ${mealMoveOrder(today, analysis.meal)}`;
  return `${lead}${drag}${order}${rest}`;
}
