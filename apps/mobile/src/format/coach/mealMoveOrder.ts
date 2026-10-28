import type { Meal } from '../../domain/Meal';
import type { MealMove } from '../../engine/analysis/moves/MealMove';
import { Fmt } from '../Fmt';
import { mealLabel } from '../mealLabel';
import { foodInSentence } from './foodInSentence';
import { foodWithArticle } from './foodWithArticle';

/**
 * The coach's order for a move (MM-684), in the lines the owner approved
 * (MM-682): on the sheet and in the brief (`place` 'meal'), or under the
 * food itself (`place` 'inline', where "it" is the food).
 */
export function mealMoveOrder(move: MealMove, meal: Meal, place: 'meal' | 'inline' = 'meal'): string {
  switch (move.kind) {
    case 'cutPortion': {
      const cut = move.keepShare === 0.5 ? 'Half of it' : 'One serving';
      return `${cut} next time keeps ${Fmt.kcal(move.kcalSaved)} for protein.`;
    }
    case 'addProtein': {
      const added = `${foodInSentence(move.added.name)}, ${Fmt.kcal(move.added.kcal)} for ${Fmt.grams(move.added.proteinG)}`;
      return place === 'inline'
        ? `Add ${added}, alongside next time.`
        : `Next time build it around protein: add ${added}, and ${mealLabel(meal).toLowerCase()} stands at ${Fmt.grams(move.mealAfter.proteinG)}.`;
    }
    case 'swapSameGroup': {
      const named = `${foodWithArticle(move.replacement.name, move.replacement.source === 'table')}, ${Fmt.kcal(move.replacement.kcal)} for ${Fmt.grams(move.replacement.proteinG)}`;
      if (place === 'inline') return `Swap it for ${named}, next time.`;
      const gains: string[] = [];
      if (move.kcalSaved >= 1) gains.push(`${Fmt.kcal(move.kcalSaved)} back`);
      if (move.proteinGainedG >= 1) gains.push(`${Fmt.grams(move.proteinGainedG)} more protein`);
      const gain = gains.length === 0 ? '' : `: ${gains.join(' and ')}`;
      return `Swap it for ${named}${gain}, same ${mealLabel(meal).toLowerCase()}.`;
    }
    case 'nextMeal': {
      if (move.kcalLeft <= 0) {
        return `You are ${Fmt.kcal(-move.kcalLeft)} over for the day. Stop here; anything more is lean protein only. Protein first tomorrow morning.`;
      }
      if (!move.fits) {
        const closest =
          move.food === undefined
            ? ''
            : `: ${foodInSentence(move.food.name)}, ${Fmt.kcal(move.food.kcal)} for ${Fmt.grams(move.food.proteinG)}, is the closest you get`;
        return `${Fmt.kcal(move.kcalLeft)} left and ${Fmt.grams(move.proteinToGoG)} of protein to go does not fit. Hold the ${Fmt.whole(move.kcalLeft)} and spend every one of them on lean protein${closest}. Protein first tomorrow morning.`;
      }
      const carrier = move.next === undefined ? 'Your next meal' : mealLabel(move.next);
      return `You have ${Fmt.kcal(move.kcalLeft)} left for ${Fmt.grams(move.proteinToGoG)} today. ${carrier} carries it.`;
    }
  }
}
