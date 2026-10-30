import type { Meal } from '../../domain/Meal';
import type { MealMove } from '../../engine/analysis/moves/MealMove';
import { mealLabel } from '../mealLabel';
import { foodInSentence } from './foodInSentence';
import { foodWithArticle } from './foodWithArticle';
import { mealMoveOrder } from './mealMoveOrder';

/**
 * A meal's fix for next time in the brief's few words (MM-711), after the
 * drag is named: the owner's approved draft (MM-693) closes "is the drag:
 * build lunch around chicken breast next time". The sheet's full order is
 * `mealMoveOrder`.
 */
export function briefMoveOrder(move: MealMove, meal: Meal): string {
  switch (move.kind) {
    case 'cutPortion':
      return move.keepShare === 0.5 ? 'half of it next time' : 'one serving next time';
    case 'addProtein':
      return `build ${mealLabel(meal).toLowerCase()} around ${foodInSentence(move.added.name)} next time`;
    case 'swapSameGroup':
      return `swap it for ${foodWithArticle(move.replacement.name, move.replacement.source === 'table')} next time`;
    case 'nextMeal':
      return mealMoveOrder(move, meal);
  }
}
