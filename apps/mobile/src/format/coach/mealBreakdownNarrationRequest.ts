import type { CoachNarrationRequest } from '../../domain/integration/CoachNarrationRequest';
import type { CoachToolbox } from '../../domain/integration/CoachToolbox';
import type { Meal } from '../../domain/Meal';
import type { MealBreakdownAnalysis } from '../../engine/analysis/MealBreakdownAnalysis';
import type { MealVerdict } from '../../engine/analysis/MealVerdict';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { mealBreakdownArchetypeText } from './mealBreakdownArchetypeText';
import { mealMoveFigures } from '../../engine/analysis/moves/mealMoveFigures';

/** The sheet's sentences and words at most (MM-713): the approved line A (MM-682) is five sentences and 64 words. */
const maxSentences = 5;
const maxWords = 80;

const systemPrompt =
  'You are the Martian Macros coach: direct, specific and accountable, a real coach, never a page of numbers. The person logs their food and you hold them to their targets. ' +
  `Answer in at most ${maxSentences} short sentences and ${maxWords} words on this meal, from what you were given. The verdict on the meal comes first, in the verdict’s own words. ` +
  'A meal that is fine has nothing to fix: say so in one or two sentences, name no food as a drag, give no move and no totals, and say which meal carries the protein when protein is still to go today. Never call a fine meal a problem, a drag, tight or a squeeze. ' +
  'A meal built wrong: say what the meal took, name the one food that is the drag with its calories and protein, and give one order, the best move, in the names of the foods as given. ' +
  'A meal fine in itself on a day that needs its order: say the meal is fine, then give the day’s order. ' +
  'Use only numbers present in what you were given, written as they are given, as whole numbers, and only the ones the order needs. Never use exclamation marks. Never moralize food. Do not soften an order with "maybe" or "try to". ' +
  'Speak in plain words: never say a field name (a camelCase word) or a true or false value. ' +
  'Speak as the coach who looked at the day: never mention figures, JSON, instructions or tools, never say what you are about to do, and never say that something is marked or flagged. ' +
  'When the protein left cannot fit inside the calories left today, say that it does not fit, tell the person to hold the cap and spend it on lean protein, and to front-load protein in the morning.';

/** What the model is told when it has tools (MM-685): look, price, then order; every number from what it was given or looked up. */
const toolGuidance =
  ' You have tools. Before you order, read meal_and_day and moves; when the moves lack a food you want, search_catalog for one; price any move you propose with price_move, and give only a move it allows. ' +
  'You may pick a different move than the first, but every number you say must come from what you were given or a tool’s answer. Then answer in words alone, with no tool call, and without a word about the tools.';

/** The verdict in plain words (MM-713), never a camelCase value the model could read aloud. */
const verdictWords: Record<MealVerdict, string> = {
  fine: 'fine: nothing to fix',
  drag: 'built wrong: a drag and a move',
  order: 'fine in itself; the day needs its order',
};

/** Where the protein still to go today comes from, after `meal`. */
function proteinComesAt(meal: Meal): string {
  switch (meal) {
    case 'breakfast':
      return 'lunch and dinner';
    case 'lunch':
      return 'dinner';
    case 'dinner':
      return 'before bed';
    case 'snack':
      return 'your next meal';
  }
}

/**
 * Builds a `CoachNarrationRequest` from a `MealBreakdownAnalysis` (MM-665,
 * MM-666), with the meal's tools when a toolbox is given (MM-685). A fine
 * meal (MM-713) is asked plainly, without the day's totals, without tools,
 * and with no number allowed back: there is nothing to order.
 */
export function mealBreakdownNarrationRequest(analysis: MealBreakdownAnalysis, toolbox?: CoachToolbox): CoachNarrationRequest {
  // Every figure goes to the model whole, as the brief's do (MM-671); the engine's figures stay as they are.
  const whole = (value: number) => roundHalfAwayFromZero(value) + 0;
  const carrier = analysis.proteinRemainingG > 0 ? { proteinComesAt: proteinComesAt(analysis.meal) } : {};
  const fine = analysis.verdict === 'fine' && !analysis.protectedPath;
  if (fine) {
    return {
      cacheKey: `meal:${analysis.analysisHash}`,
      systemPrompt,
      userPrompt: JSON.stringify({ meal: analysis.meal, verdict: verdictWords.fine, ...carrier, protectedPath: false, proteinUnrecoverable: false }),
      fallbackText: mealBreakdownArchetypeText(analysis),
      protectedPath: false,
      proteinUnrecoverable: false,
      allowedNumbers: [],
      maxSentences,
      maxWords,
    };
  }
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
    verdict: verdictWords[analysis.verdict],
    ...carrier,
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
    maxSentences,
    maxWords,
    ...(toolbox === undefined ? {} : { toolbox }),
  };
}
