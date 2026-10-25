import type { CoachFinding } from '../../engine/analysis/CoachFinding';
import type { CoachFollowUp } from '../../engine/analysis/accountability/CoachFollowUp';
import { Fmt } from '../Fmt';
import { coachFollowUpText } from './coachFollowUpText';
import { coachMealWords } from './coachMealWords';
import { coachPhrase } from './coachPhrase';
import { coachPhraseKey } from './coachPhraseKey';
import { readableFoodName } from './readableFoodName';

type Evidence = readonly (readonly [label: string, value: string])[];

/** The order a follow-up said on its own ends in, so a fix still ends in one. */
function orderOf(f: CoachFinding, u: CoachFollowUp): string {
  const key = coachPhraseKey(f);
  switch (u.kind) {
    case 'saidBefore':
      return coachPhrase('orderSkip', key);
    case 'repeatOver':
      return u.food !== undefined
        ? coachPhrase('orderSkip', key)
        : u.meal !== undefined
          ? coachPhrase('orderBreakRun', key, { meal: coachMealWords(u.meal) })
          : coachPhrase('orderBackToTarget', key);
    case 'repeatFat':
      return coachPhrase('orderHalveFat', key);
    case 'repeatProteinShort':
      return coachPhrase('orderProtein', key);
    case 'adviceTaken':
      return coachPhrase('holdKeep', key);
  }
}

/**
 * A follow-up of the coach's accountability that had no finding to ride
 * on (MM-617): a finding of its own, signal `saidBefore`, `repeatOver` (a
 * repeat of any kind) or `adviceTaken`. A title in numbers, the follow-up's
 * sentence (`coachFollowUpText`), then an order ("Skip it next time.") or,
 * for advice taken, "Keep that.", and the numbers behind it. Never throws:
 * a finding with no follow-up says what its signal is about.
 */
export function followUpFindingText(f: CoachFinding, _fmt: Fmt): readonly [title: string, body: string, evidence: Evidence] {
  const u = f.followUps?.[0];
  const period: readonly [string, string] = ['Period', 'Today so far'];
  const rule: readonly [string, string] = ['Rule', 'The coach keeps the record'];
  if (u === undefined) return ['The coach keeps the record', coachPhrase('orderBackToTarget', coachPhraseKey(f)), [period, rule]];
  const name = u.food === undefined ? undefined : readableFoodName(u.food.name);
  const days = u.days ?? 0;
  const title =
    u.kind === 'saidBefore'
      ? `${name ?? 'A food'} is back`
      : u.kind === 'repeatOver'
        ? `Over by ${Fmt.whole(u.overByKcal ?? 500)} kcal, ${days} days this week`
        : u.kind === 'repeatFat'
          ? `Fat over target, ${days} of ${u.ofDays ?? 7} days`
          : u.kind === 'repeatProteinShort'
            ? `Protein short, ${days} of ${u.ofDays ?? 7} days`
            : `${name ?? 'The advice'}: ${days} days running`;
  const rows: (readonly [string, string])[] = [period];
  if (u.givenOn !== undefined) rows.push(['Said on', Fmt.shortDay(u.givenOn)]);
  if (u.food !== undefined && u.kind !== 'adviceTaken') rows.push(['Today', Fmt.kcal(u.food.kcal)]);
  if (u.days !== undefined) rows.push(['Days', u.ofDays === undefined || u.kind === 'adviceTaken' ? `${u.days}` : `${u.days} of ${u.ofDays}`]);
  if (u.beforeDays !== undefined && u.ofDays !== undefined) rows.push(['Days eaten before the advice', `${u.beforeDays} of ${u.ofDays}`]);
  if (u.savedKcal !== undefined) rows.push(["Calories you didn't eat", Fmt.kcal(u.savedKcal)]);
  rows.push(rule);
  return [title, `${coachFollowUpText(f, u)} ${orderOf(f, u)}`, rows];
}
