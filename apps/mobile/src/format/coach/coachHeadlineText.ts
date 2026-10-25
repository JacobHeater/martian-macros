import type { CoachVerdict } from '../../engine/analysis/CoachVerdict';
import { Fmt } from '../Fmt';
import { coachCauseWords } from './coachCauseWords';
import { coachFindingText } from './coachFindingText';
import { coachPhrase } from './coachPhrase';
import { coachPhraseKey } from './coachPhraseKey';

/**
 * The headline (MM-617): the day's or the span's verdict about the biggest
 * thing, in one line, from `CoachVerdict`.
 *
 * - **Over**: "1,054 kcal over. The buffet did it."
 * - **A fix**: its title, then what did it: "Fat averaged 90 g against 70
 *   g. Peanut butter did it."
 * - **Holding up**, with no problem: the strength, said bluntly ("Protein
 *   155 g. Minimum hit. Keep that.").
 */
export function coachHeadlineText(verdict: CoachVerdict, fmt: Fmt): string {
  const f = verdict.finding;
  const key = coachPhraseKey(f);
  const cause = coachCauseWords(verdict.cause);
  const did = cause === undefined ? [] : [coachPhrase('headlineCause', key, { cause })];
  switch (verdict.kind) {
    case 'over':
      return [coachPhrase('headlineOver', key, { over: Fmt.kcal(verdict.overKcal ?? 0) }), ...did].join(' ');
    case 'fix':
      return [`${coachFindingText(f, fmt)[0]}.`, ...did].join(' ');
    case 'holdingUp':
      return coachFindingText(f, fmt)[1];
  }
}
