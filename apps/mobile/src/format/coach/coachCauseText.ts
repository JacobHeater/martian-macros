import type { CoachFinding } from '../../engine/analysis/CoachFinding';
import { Fmt } from '../Fmt';
import { coachMealWords } from './coachMealWords';
import { coachPhrase } from './coachPhrase';
import { coachPhraseKey } from './coachPhraseKey';
import { foodInSentence } from './foodInSentence';

/**
 * The cause of a calorie line (MM-617), from `CoachFinding.cause`: which
 * meal and how much of the day it was. "Lunch was the problem. The Chinese
 * buffet: 2,368 kcal, more than your whole day's 2,175." On a span, the day
 * that drove it: "Tue, Oct 20 did it: lunch came to 2,400 kcal." The worst
 * food is said with its order (`coachAdviceText`). Empty when the finding
 * names no meal.
 */
export function coachCauseText(f: CoachFinding): string[] {
  const cause = f.cause;
  if (cause?.meal === undefined || cause.mealKcal === undefined) return [];
  const key = coachPhraseKey(f);
  const meal = coachMealWords(cause.meal);
  const kcal = Fmt.kcal(cause.mealKcal);
  if (cause.on !== undefined) return [coachPhrase('causeOnDay', key, { day: Fmt.day(cause.on, f.to.addDays(1)), meal, kcal })];
  const target = f.figures['kcalTarget'] ?? f.figures['targetKcal'];
  if (target === undefined || !(target > 0)) return [coachPhrase('causeMeal', key, { meal })];
  const ratio = cause.mealKcal / target;
  const values = { target: Fmt.whole(target), percent: `${Math.round(ratio * 100)}%` };
  const share = coachPhrase(ratio >= 1 ? 'shareWholeDayWords' : ratio >= 0.5 ? 'shareHalfDayWords' : 'sharePartDayWords', key, values, {
    piece: true,
  });
  if (cause.mealName === undefined) return [coachPhrase('causeSlotMeal', key, { meal, kcal, share })];
  return [coachPhrase('causeMeal', key, { meal }), coachPhrase('causeLoggedMeal', key, { name: foodInSentence(cause.mealName), kcal, share })];
}
