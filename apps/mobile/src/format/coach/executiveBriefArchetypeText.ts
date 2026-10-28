import type { ExecutiveBrief } from '../../engine/analysis/ExecutiveBrief';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { Fmt } from '../Fmt';
import { mealLabel } from '../mealLabel';
import { foodInSentence } from './foodInSentence';
import { phrasingIndex } from './phrasingIndex';

/**
 * Synthesizes a cohesive, whole-situation coaching paragraph from an
 * `ExecutiveBrief` (MM-663).
 *
 * Used immediately in offline mode or when no BYOK key is configured, and as
 * the guaranteed fallback whenever a remote narration fails verification.
 */
export function executiveBriefArchetypeText(brief: ExecutiveBrief): string {
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
  const driverClause =
    driver === undefined
      ? ''
      : driver.replacement !== undefined
        ? ` ${mealLabel(driver.meal)} drove the squeeze (${foodInSentence(driver.foodName)}, ${Fmt.kcal(driver.kcal)}); swap it for ${driver.replacement.name} next time.`
        : ` ${mealLabel(driver.meal)} drove the squeeze (${foodInSentence(driver.foodName)}, ${Fmt.kcal(driver.kcal)}).`;

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
      const densityPct = roundHalfAwayFromZero(brief.requiredProteinDensity * 100) + 0;
      const lead = pick('tight', [
        `Runway is tight with ${kcalLeft} left and ${proteinLeft} of protein still to hit (${densityPct}% of remaining calories from protein).`,
        `You have ${kcalLeft} left to cover ${proteinLeft} of protein (${densityPct}% protein density required).`,
      ]);
      const directive = pick('tightDirective', [
        'Keep the rest of today strictly to lean protein sources like chicken breast, egg whites, fish, or Greek yogurt.',
        'Cut calorie-dense sides for the rest of today and spend your remaining budget on lean protein.',
      ]);
      return `${lead}${driverClause} ${directive}`;
    }
    case 'targetsLocked': {
      return pick('locked', [
        `Protein is locked in at ${proteinLogged} with ${kcalLeft} remaining inside your ${kcalTarget} budget. Hold the line through the evening.`,
        `Numbers are on point today: ${proteinLogged} protein hit with ${kcalLeft} left. Keep that execution steady.`,
      ]);
    }
    case 'onTrack': {
      return pick('onTrack', [
        `${kcalLeft} and ${proteinLeft} of protein left today. Your runway is balanced; anchor your next meal with a solid protein source.`,
        `On pace today with ${kcalLeft} left and ${proteinLeft} of protein to go. Keep protein at the center of your remaining meals.`,
      ]);
    }
  }
}
