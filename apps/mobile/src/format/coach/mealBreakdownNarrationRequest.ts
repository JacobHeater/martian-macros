import type { CoachNarrationRequest } from '../../domain/integration/CoachNarrationRequest';
import type { MealBreakdownAnalysis } from '../../engine/analysis/MealBreakdownAnalysis';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { mealBreakdownArchetypeText } from './mealBreakdownArchetypeText';

const systemPrompt =
  'You are the Martian Macros nutrition coach. Write 2 to 3 concise, direct sentences analyzing this meal from the supplied JSON only. ' +
  'Use only numbers present in the JSON, written as they are given, as whole numbers. Never use exclamation marks. Never moralize food. ' +
  'Speak in plain words: never say a JSON field name (a camelCase word) or a true or false value. ' +
  'When the JSON marks the protein left as unable to fit inside the calories left today, say that the remaining protein gap cannot fit inside today’s calorie cap and tell the person to front-load protein in the morning.';

/**
 * Builds a `CoachNarrationRequest` from a `MealBreakdownAnalysis` (MM-665,
 * MM-666).
 */
export function mealBreakdownNarrationRequest(analysis: MealBreakdownAnalysis): CoachNarrationRequest {
  // Every figure goes to the model whole, as the brief's do (MM-671); the engine's figures stay as they are.
  const whole = (value: number) => roundHalfAwayFromZero(value) + 0;
  const wholeOr = (value: number | undefined) => (value === undefined ? undefined : whole(value));
  const kcalSharePct = whole(analysis.dailyKcalShare * 100);
  const proteinSharePct = whole(analysis.dailyProteinShare * 100);
  const mealDensityPct = whole(analysis.mealProteinDensity * 100);
  const restDensityPct = whole(analysis.requiredRestOfDayDensity * 100);
  const outlierItem =
    analysis.outlierItem === undefined
      ? undefined
      : {
          name: analysis.outlierItem.name,
          kcal: whole(analysis.outlierItem.kcal),
          proteinG: whole(analysis.outlierItem.proteinG),
          fatG: whole(analysis.outlierItem.fatG),
          proteinDensityPercent: whole(analysis.outlierItem.proteinDensity * 100),
        };
  const suggestedSwap =
    analysis.suggestedSwap === undefined
      ? undefined
      : {
          originalName: analysis.suggestedSwap.originalName,
          replacementName: analysis.suggestedSwap.replacementName,
          replacementKcal: wholeOr(analysis.suggestedSwap.replacementKcal),
          replacementProteinG: wholeOr(analysis.suggestedSwap.replacementProteinG),
          caloriesSaved: whole(analysis.suggestedSwap.caloriesSaved),
          proteinGained: whole(analysis.suggestedSwap.proteinGained),
        };
  const payload = {
    meal: analysis.meal,
    protectedPath: analysis.protectedPath,
    proteinUnrecoverable: analysis.proteinUnrecoverable,
    mealKcal: whole(analysis.mealKcal),
    mealProteinG: whole(analysis.mealProteinG),
    dailyKcalSharePercent: kcalSharePct,
    dailyProteinSharePercent: proteinSharePct,
    mealProteinDensityPercent: mealDensityPct,
    kcalRemaining: whole(analysis.kcalRemaining),
    proteinRemainingG: whole(analysis.proteinRemainingG),
    requiredRestOfDayDensityPercent: restDensityPct,
    outlierItem,
    suggestedSwap,
  };
  const allowedNumbers: number[] = [
    payload.mealKcal,
    payload.mealProteinG,
    whole(analysis.mealCarbsG),
    whole(analysis.mealFatG),
    kcalSharePct,
    proteinSharePct,
    mealDensityPct,
    restDensityPct,
    Math.abs(payload.kcalRemaining),
    payload.proteinRemainingG,
  ];
  if (outlierItem !== undefined) {
    allowedNumbers.push(outlierItem.kcal, outlierItem.proteinG, outlierItem.fatG, outlierItem.proteinDensityPercent);
  }
  if (suggestedSwap !== undefined) {
    if (suggestedSwap.replacementKcal !== undefined) allowedNumbers.push(suggestedSwap.replacementKcal);
    if (suggestedSwap.replacementProteinG !== undefined) allowedNumbers.push(suggestedSwap.replacementProteinG);
    allowedNumbers.push(suggestedSwap.caloriesSaved, suggestedSwap.proteinGained);
  }
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
