import type { MealMove } from '../../engine/analysis/moves/MealMove';
import { Fmt } from '../Fmt';
import { mealLabel } from '../mealLabel';
import { foodInSentence } from './foodInSentence';

/**
 * The sheet's "Your move" row for a move (MM-684): the move in a few words
 * and its figures on the right.
 */
export function mealMoveRow(move: MealMove): { readonly subtitle: string; readonly trailing: string } {
  switch (move.kind) {
    case 'cutPortion':
      return {
        subtitle: `${move.keepShare === 0.5 ? 'Half the' : 'One serving of'} ${foodInSentence(move.food.name)} next time`,
        trailing: `−${Fmt.kcal(move.kcalSaved)} · −${Fmt.grams(move.proteinLostG)} protein`,
      };
    case 'addProtein':
      return {
        subtitle: `Add ${foodInSentence(move.added.name)} next time`,
        trailing: `+${Fmt.kcal(move.added.kcal)} · +${Fmt.grams(move.added.proteinG)} protein`,
      };
    case 'swapSameGroup':
      return {
        subtitle: `${move.replacement.name} in place of ${foodInSentence(move.food.name)}`,
        trailing: `−${Fmt.kcal(move.kcalSaved)} · +${Fmt.grams(move.proteinGainedG)} protein`,
      };
    case 'nextMeal': {
      const carrier = move.next === undefined ? 'Your next meal' : mealLabel(move.next);
      if (move.kcalLeft <= 0) return { subtitle: 'Stop here; lean protein only', trailing: `${Fmt.kcal(-move.kcalLeft)} over` };
      if (!move.fits) {
        return {
          subtitle: move.food === undefined ? 'Hold the cap; lean protein only' : `Hold the cap; ${foodInSentence(move.food.name)} gets closest`,
          trailing: move.food === undefined ? `${Fmt.kcal(move.kcalLeft)} left` : `${Fmt.kcal(move.food.kcal)} · ${Fmt.grams(move.food.proteinG)} protein`,
        };
      }
      return { subtitle: `${carrier}: ${Fmt.grams(move.proteinToGoG)} of protein in ${Fmt.kcal(move.kcalLeft)}`, trailing: `${Fmt.kcal(move.kcalLeft)} left` };
    }
  }
}
