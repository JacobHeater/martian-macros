import type { CoachNarrationRequest } from '../../domain/integration/CoachNarrationRequest';
import type { MealBreakdownAnalysis } from '../../engine/analysis/MealBreakdownAnalysis';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { mealBreakdownArchetypeText } from './mealBreakdownArchetypeText';

const systemPrompt =
  'You are the Martian Macros nutrition coach. Write 2 to 3 concise, direct sentences analyzing this meal from the supplied JSON only. ' +
  'Use only numbers present in the JSON. Never use exclamation marks. Never moralize food. ' +
  'When proteinUnrecoverable is true, state that the remaining protein gap cannot fit inside today calorie cap and advise front-loading protein in the morning.';

/**
 * Builds a `CoachNarrationRequest` from a `MealBreakdownAnalysis` (MM-665,
 * MM-666).
 */
export function mealBreakdownNarrationRequest(analysis: MealBreakdownAnalysis): CoachNarrationRequest {
  const kcalSharePct = roundHalfAwayFromZero(analysis.dailyKcalShare * 100) + 0;
  const proteinSharePct = roundHalfAwayFromZero(analysis.dailyProteinShare * 100) + 0;
  const mealDensityPct = roundHalfAwayFromZero(analysis.mealProteinDensity * 100) + 0;
  const restDensityPct = roundHalfAwayFromZero(analysis.requiredRestOfDayDensity * 100) + 0;

  const allowedNumbers: number[] = [
    analysis.mealKcal,
    analysis.mealProteinG,
    analysis.mealCarbsG,
    analysis.mealFatG,
    kcalSharePct,
    proteinSharePct,
    mealDensityPct,
    restDensityPct,
    Math.abs(analysis.kcalRemaining),
    analysis.proteinRemainingG,
  ];
  if (analysis.outlierItem !== undefined) {
    allowedNumbers.push(
      analysis.outlierItem.kcal,
      analysis.outlierItem.proteinG,
      roundHalfAwayFromZero(analysis.outlierItem.proteinDensity * 100) + 0,
    );
  }
  if (analysis.suggestedSwap !== undefined) {
    if (analysis.suggestedSwap.replacementKcal !== undefined) {
      allowedNumbers.push(analysis.suggestedSwap.replacementKcal);
    }
    if (analysis.suggestedSwap.replacementProteinG !== undefined) {
      allowedNumbers.push(analysis.suggestedSwap.replacementProteinG);
    }
    allowedNumbers.push(
      analysis.suggestedSwap.caloriesSaved,
      analysis.suggestedSwap.proteinGained,
    );
  }
  const payload = {
    meal: analysis.meal,
    protectedPath: analysis.protectedPath,
    proteinUnrecoverable: analysis.proteinUnrecoverable,
    mealKcal: analysis.mealKcal,
    mealProteinG: analysis.mealProteinG,
    dailyKcalSharePercent: kcalSharePct,
    dailyProteinSharePercent: proteinSharePct,
    mealProteinDensityPercent: mealDensityPct,
    kcalRemaining: analysis.kcalRemaining,
    proteinRemainingG: analysis.proteinRemainingG,
    requiredRestOfDayDensityPercent: restDensityPct,
    outlierItem: analysis.outlierItem,
    suggestedSwap: analysis.suggestedSwap,
  };
  return {
    cacheKey: `meal:${analysis.analysisHash}`,
    systemPrompt,
    userPrompt: JSON.stringify(payload),
    fallbackText: mealBreakdownArchetypeText(analysis),
    protectedPath: analysis.protectedPath,
    proteinUnrecoverable: analysis.proteinUnrecoverable,
    allowedNumbers,
  };
}
