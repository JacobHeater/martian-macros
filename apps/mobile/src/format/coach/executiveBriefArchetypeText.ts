import type { ExecutiveBrief } from '../../engine/analysis/ExecutiveBrief';
import { Fmt } from '../Fmt';
import { mealLabel } from '../mealLabel';
import { briefMoveOrder } from './briefMoveOrder';
import { foodInSentence } from './foodInSentence';
import { foodNameIsPlural } from './foodNameIsPlural';
import { phrasingIndex } from './phrasingIndex';
import { trainingBriefText } from './trainingBriefText';

/**
 * Synthesizes a cohesive, whole-situation coaching paragraph from an
 * `ExecutiveBrief` (MM-663), in the owner's shape (MM-693): the verdict on
 * the day, the drag, the order, one training line; at most four sentences.
 * A day on track is told so, with which meals carry the protein and not
 * a number (MM-713): the rows under the words hold the figures.
 *
 * Used immediately in offline mode or when no BYOK key is configured, and as
 * the guaranteed fallback whenever a remote narration fails verification.
 */
export function executiveBriefArchetypeText(brief: ExecutiveBrief): string {
  // The food first, then what the person is held to in training (MM-681).
  const food = foodBriefText(brief);
  return brief.training === undefined ? food : `${food} ${trainingBriefText(brief.training)}`;
}

/** The food end of the brief: the runway and the week's consistency. */
function foodBriefText(brief: ExecutiveBrief): string {
  const seed = (slot: string, length: number) => phrasingIndex(`exec|${slot}|${brief.date.epochDay}|${brief.runwayState}`, length);
  const pick = (slot: string, options: readonly string[]) => options[seed(slot, options.length)] ?? options[0]!;

  const kcalLeft = Fmt.kcal(Math.abs(brief.kcalRemaining));
  const proteinLeft = Fmt.grams(brief.proteinRemainingG);
  const proteinLogged = Fmt.grams(brief.proteinLoggedG);
  const kcalTarget = Fmt.kcal(brief.kcalTarget);

  if (brief.protectedPath) {
    if (brief.proteinRemainingG <= 0) {
      return `Protein is at ${proteinLogged} today, meeting your target. Keep that rhythm across your meals.`;
    }
    return `${proteinLeft} of protein left today. A protein food at your next meal covers it.`;
  }

  if (brief.runwayState === 'nothingLogged') {
    const base = pick('empty', [
      `No meals logged today against your ${kcalTarget} budget and ${Fmt.grams(brief.proteinTargetG)} protein target.`,
      `Your day is open: ${kcalTarget} and ${Fmt.grams(brief.proteinTargetG)} protein on the board.`,
    ]);
    if (brief.sevenDay.loggedDays > 0) {
      return `${base} Over the last ${brief.sevenDay.loggedDays} logged days, you hit your protein floor on ${brief.sevenDay.proteinFloorHitDays} and held the calorie band on ${brief.sevenDay.calorieAdherenceDays}.`;
    }
    return `${base} Log your first meal to anchor your protein floor early.`;
  }

  const driver = brief.primaryDriver;
  // The drag named once with its two figures and its fix for the next time that meal is built (MM-684, MM-693).
  const driverClause =
    driver === undefined
      ? ''
      : ` The ${mealLabel(driver.meal).toLowerCase()} ${foodInSentence(driver.foodName)}, ${Fmt.kcal(driver.kcal)} for ${Fmt.grams(driver.proteinG)}, ${foodNameIsPlural(driver.foodName) ? 'are' : 'is'} the drag${driver.move === undefined ? '.' : `: ${briefMoveOrder(driver.move, driver.meal)}.`}`;

  switch (brief.runwayState) {
    case 'proteinUnrecoverable': {
      const lead = pick('unrecoverable', [
        `You have ${kcalLeft} left today but still need ${proteinLeft} of protein. The math doesn't work tonight.`,
        `With ${kcalLeft} left and ${proteinLeft} of protein to go, you cannot close the protein gap inside today's calorie budget.`,
        `${kcalLeft} left against ${proteinLeft} of remaining protein: the numbers cannot meet tonight.`,
      ]);
      const directive = pick('unrecoverableDirective', [
        'Hold your calorie cap tonight, take the loss on protein today, and front-load protein at breakfast in the morning.',
        'Protect your calorie ceiling tonight, write off the protein shortfall for today, and front-load protein first thing in the morning.',
      ]);
      return `${lead}${driverClause} ${directive}`;
    }
    case 'overBudget': {
      const lead = pick('over', [
        `You are ${kcalLeft} over your ${kcalTarget} target today.`,
        `Today is ${kcalLeft} past your ${kcalTarget} budget.`,
      ]);
      const directive =
        brief.proteinRemainingG > 0
          ? `Cap any remaining intake to lean protein and vegetables only, then reset to ${kcalTarget} in the morning.`
          : `Protein is already covered at ${proteinLogged}; stop here for tonight and return to ${kcalTarget} in the morning.`;
      return `${lead}${driverClause} ${directive}`;
    }
    case 'tightRunway': {
      // Tight is lean protein only from here (MM-713): the two figures the order needs, and the order.
      const lead = pick('tight', [`Runway is tight: ${kcalLeft} left for ${proteinLeft} of protein.`, `${kcalLeft} left for ${proteinLeft} of protein: tight.`]);
      const directive = pick('tightDirective', [
        'Lean protein only from here: chicken breast, egg whites, fish or Greek yogurt.',
        'Cut the calorie-dense sides for the rest of today and spend what is left on lean protein.',
      ]);
      return `${lead}${driverClause} ${directive}`;
    }
    case 'targetsLocked': {
      return `Protein is covered today with ${kcalLeft} left. Hold the line through the evening.`;
    }
    case 'onTrack': {
      // Nothing to fix (MM-713): which meals carry the protein, and not a number; the rows under the words hold those.
      switch (brief.lastMeal) {
        case 'breakfast':
          return 'Breakfast is in and the day is on track. Nothing to fix. Build lunch and dinner around protein.';
        case 'lunch':
          return 'On track through lunch. Nothing to fix. Build dinner around protein.';
        case 'dinner':
          return 'On track through dinner with protein still to go. Close it before bed with lean protein.';
        default:
          return 'Only a snack is in and the day is on track. Build your meals around protein.';
      }
    }
  }
}
