import { roundHalfAwayFromZero } from '../../../lang/roundHalfAwayFromZero';
import type { MealMove } from './MealMove';

const whole = (value: number) => roundHalfAwayFromZero(value) + 0;

/**
 * A move as the model is given it (MM-684, MM-685): its kind, the foods it
 * names and its figures, whole, with the numbers the model may then say.
 */
export function mealMoveFigures(move: MealMove): { readonly figures: Record<string, unknown>; readonly numbers: readonly number[] } {
  switch (move.kind) {
    case 'cutPortion': {
      const figures = {
        kind: 'cutPortion',
        food: move.food.name,
        keep: move.keepShare === 0.5 ? 'half' : 'one serving',
        kcalSaved: whole(move.kcalSaved),
        proteinLostG: whole(move.proteinLostG),
        mealAfterKcal: whole(move.mealAfter.kcal),
        mealAfterProteinG: whole(move.mealAfter.proteinG),
      };
      return { figures, numbers: [figures.kcalSaved, figures.proteinLostG, figures.mealAfterKcal, figures.mealAfterProteinG] };
    }
    case 'addProtein': {
      const figures = {
        kind: 'addProtein',
        food: move.food.name,
        add: move.added.name,
        addKcal: whole(move.added.kcal),
        addProteinG: whole(move.added.proteinG),
        mealAfterKcal: whole(move.mealAfter.kcal),
        mealAfterProteinG: whole(move.mealAfter.proteinG),
      };
      return { figures, numbers: [figures.addKcal, figures.addProteinG, figures.mealAfterKcal, figures.mealAfterProteinG] };
    }
    case 'swapSameGroup': {
      const figures = {
        kind: 'swapSameGroup',
        food: move.food.name,
        replacement: move.replacement.name,
        replacementKcal: whole(move.replacement.kcal),
        replacementProteinG: whole(move.replacement.proteinG),
        kcalSaved: whole(move.kcalSaved),
        proteinGainedG: whole(move.proteinGainedG),
        mealAfterKcal: whole(move.mealAfter.kcal),
        mealAfterProteinG: whole(move.mealAfter.proteinG),
      };
      return {
        figures,
        numbers: [figures.replacementKcal, figures.replacementProteinG, figures.kcalSaved, figures.proteinGainedG, figures.mealAfterKcal, figures.mealAfterProteinG],
      };
    }
    case 'nextMeal': {
      const figures = {
        kind: 'nextMeal',
        next: move.next ?? 'next meal',
        kcalLeft: whole(move.kcalLeft),
        proteinToGoG: whole(move.proteinToGoG),
        fits: move.fits,
        ...(move.food === undefined ? {} : { food: move.food.name, foodKcal: whole(move.food.kcal), foodProteinG: whole(move.food.proteinG) }),
      };
      const numbers = [Math.abs(figures.kcalLeft), figures.proteinToGoG];
      if (move.food !== undefined) numbers.push(whole(move.food.kcal), whole(move.food.proteinG));
      return { figures, numbers };
    }
  }
}
