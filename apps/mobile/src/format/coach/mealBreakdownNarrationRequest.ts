import type { CoachNarrationRequest } from '../../domain/integration/CoachNarrationRequest';
import type { CoachToolbox } from '../../domain/integration/CoachToolbox';
import type { MealBreakdownAnalysis } from '../../engine/analysis/MealBreakdownAnalysis';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { mealBreakdownArchetypeText } from './mealBreakdownArchetypeText';
import { mealMoveFigures } from './mealMoveFigures';

const systemPrompt =
  'You are the Martian Macros coach: direct, specific and accountable, a real coach, never a page of numbers. The person logs their food and you hold them to their targets. ' +
  'Write 2 to 4 short sentences on this meal from the supplied JSON: what the meal took, the one food that is the drag with its calories and protein, and one order, the best move. ' +
  'The JSON carries the meal, the day and the meal’s moves, ranked by the day’s gap, with the one the built-in coach orders: give one order, in the names of the foods as given. ' +
  'Use only numbers present in the JSON, written as they are given, as whole numbers. Never use exclamation marks. Never moralize food. Do not soften an order with "maybe" or "try to". ' +
  'Speak in plain words: never say a JSON field name (a camelCase word) or a true or false value. ' +
  'When the JSON marks the protein left as unable to fit inside the calories left today, say that the remaining protein gap cannot fit inside today’s calorie cap, tell the person to hold the cap and spend it on lean protein, and to front-load protein in the morning.';

/** What the model is told when it has tools (MM-685): look, price, then order; every number from what it was given or looked up. */
const toolGuidance =
  ' You have tools. Before you order, read meal_and_day and moves; when the moves lack a food you want, search_catalog for one; price any move you propose with price_move, and give only a move it allows. ' +
  'You may pick a different move than the first, but every number you say must come from the JSON or a tool’s answer. Then answer in words alone, with no tool call.';

/**
 * Builds a `CoachNarrationRequest` from a `MealBreakdownAnalysis` (MM-665,
 * MM-666), with the meal's tools when a toolbox is given (MM-685).
 */
export function mealBreakdownNarrationRequest(analysis: MealBreakdownAnalysis, toolbox?: CoachToolbox): CoachNarrationRequest {
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
  const moves = analysis.moves.moves.map(mealMoveFigures);
  const best = analysis.moves.best === undefined ? undefined : mealMoveFigures(analysis.moves.best).figures;
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
    // The meal's moves, ranked, and the one the built-in coach orders (MM-684).
    moves: moves.map((m) => m.figures),
    bestMove: best,
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
  for (const move of moves) allowedNumbers.push(...move.numbers);
  return {
    cacheKey: `meal:${analysis.analysisHash}`,
    systemPrompt: toolbox === undefined ? systemPrompt : `${systemPrompt}${toolGuidance}`,
    userPrompt: JSON.stringify(payload),
    fallbackText: mealBreakdownArchetypeText(analysis),
    protectedPath: analysis.protectedPath,
    proteinUnrecoverable: analysis.proteinUnrecoverable,
    allowedNumbers,
    ...(toolbox === undefined ? {} : { toolbox }),
  };
}
