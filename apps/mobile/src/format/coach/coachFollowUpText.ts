import type { CoachFinding } from '../../engine/analysis/CoachFinding';
import type { CoachFollowUp } from '../../engine/analysis/accountability/CoachFollowUp';
import { Fmt } from '../Fmt';
import { weekdayLabel } from '../weekdayLabel';
import { coachMealWords } from './coachMealWords';
import { coachPhrase } from './coachPhrase';
import { coachPhraseKey } from './coachPhraseKey';
import { countWord } from './countWord';
import { foodInSentence } from './foodInSentence';

const ordinals = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'] as const;

/**
 * One follow-up of the coach's accountability, said (MM-617):
 *
 * - said before: "Tuesday I told you to skip the General Tso's chicken.
 *   It's back: 744 kcal again." (the weekday within the week, else "On
 *   Oct 14");
 * - over again: "Third day this week over by 500 or more.", then what
 *   drove it: "Peanut butter again: 2 of the 3 days." or "Lunch keeps
 *   doing it.";
 * - fat and protein again: "Fat over target 3 of the last 7 days.";
 * - advice taken: "You skipped the biscuit three days running. That's
 *   1,400 kcal you didn't eat."
 *
 * `part` tells apart two follow-ups on one finding, for the phrasing.
 */
export function coachFollowUpText(f: Pick<CoachFinding, 'id' | 'to'>, u: CoachFollowUp, part = 0): string {
  const key = coachPhraseKey(f, part === 0 ? undefined : `followUp${part}`);
  const food = u.food === undefined ? 'food' : foodInSentence(u.food.name);
  const days = u.days ?? 0;
  switch (u.kind) {
    case 'saidBefore': {
      const given = u.givenOn;
      const day = given === undefined ? 'before' : u.byWeekday === true ? weekdayLabel(given.weekday) : `on ${Fmt.shortDay(given)}`;
      const values = { day, food, kcal: Fmt.kcal(u.food?.kcal ?? u.givenKcal ?? 0) };
      if (u.order === 'swap' && u.replacementName !== undefined) {
        return coachPhrase('followSaidBeforeSwap', key, { ...values, replacement: u.replacementName });
      }
      return coachPhrase(u.order === 'skip' ? 'followSaidBeforeSkip' : 'followSaidBeforeOrder', key, values);
    }
    case 'repeatOver': {
      const nth = ordinals[days] ?? `${days}th`;
      const lead = coachPhrase('followRepeatOver', key, { nth, over: Fmt.whole(u.overByKcal ?? 500) });
      const driven = { driven: `${u.drivenDays ?? days}`, days: `${days}` };
      if (u.food !== undefined) return `${lead} ${coachPhrase('followRepeatFood', key, { ...driven, food })}`;
      if (u.meal !== undefined) return `${lead} ${coachPhrase('followRepeatMeal', key, { ...driven, meal: coachMealWords(u.meal) })}`;
      return lead;
    }
    case 'repeatFat':
      return coachPhrase('followRepeatFat', key, { days: `${days}`, of: `${u.ofDays ?? 7}` });
    case 'repeatProteinShort':
      return coachPhrase('followRepeatProtein', key, { days: `${days}`, of: `${u.ofDays ?? 7}` });
    case 'adviceTaken':
      if (u.food === undefined) return coachPhrase('followAdviceTakenAdd', key, { days: countWord(days) });
      return coachPhrase('followAdviceTaken', key, { food, days: countWord(days), saved: Fmt.kcal(u.savedKcal ?? 0) });
  }
}
