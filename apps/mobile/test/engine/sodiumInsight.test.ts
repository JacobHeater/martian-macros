import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { SodiumDay } from '../../src/domain/food/micros/SodiumDay';
import { IntakeDay } from '../../src/domain/IntakeDay';
import { findInsights } from '../../src/engine/findInsights';
import { InsightRule } from '../../src/engine/InsightRule';
import { upTo } from '../support/upTo';

/** MM-312: the coach notices a pattern of days over the sodium limit, and nothing less. */
const through = CalendarDate.of(2026, 3, 14);
const days = upTo(14).map((i) => through.addDays(-i));
const intake = days.map(
  (date) => new IntakeDay({ date, kcal: 2100, proteinG: 150, carbsG: 200, fatG: 70, completeness: 'complete' }),
);

/** Each of the 14 days over (3,000 mg known), under with full coverage, or under with too little coverage. */
type Kind = 'over' | 'under' | 'thin';
const sodiumDays = (kinds: readonly Kind[]) =>
  new Map(
    days.map((date, i) => {
      const kind = kinds[i] ?? 'under';
      return [
        date,
        kind === 'over'
          ? new SodiumDay({ knownMg: 3000, coveredShare: 0.5 })
          : new SodiumDay({ knownMg: 1500, coveredShare: kind === 'thin' ? 0.3 : 0.9 }),
      ] as const;
    }),
  );

const find = (kinds: readonly Kind[], { since = through.addDays(-30), limited = false } = {}) =>
  findInsights({
    through,
    intake,
    weights: [],
    history: [],
    sodium: { limitMg: 2300, since, days: sodiumDays(kinds) },
    limitToProteinAndLogging: limited,
  }).filter((i) => i.rule === 'sodiumOverLimit');

const times = (n: number, kind: Kind): Kind[] => upTo(n).map(() => kind);

it('a pattern: over on most judged days', () => {
  const [found] = find([...times(9, 'over'), ...times(5, 'under')]);
  expect(found?.figures).toEqual({ overDays: 9, judgedDays: 14, leftOutDays: 0, limitMg: 2300 });
});

it('one day is not a pattern', () => {
  expect(find(['over', ...times(13, 'under')])).toEqual([]);
});

it('no limit, no insight', () => {
  const found = findInsights({ through, intake, weights: [], history: [] });
  expect(found.some((i) => i.rule === 'sodiumOverLimit')).toBe(false);
});

it('days under the limit with too little sodium data are left out, and said so', () => {
  const [found] = find([...times(5, 'over'), ...times(3, 'under'), ...times(6, 'thin')]);
  expect(found?.figures['judgedDays']).toBe(8);
  expect(found?.figures['overDays']).toBe(5);
  expect(found?.figures['leftOutDays']).toBe(6);
});

it('never for an eating-disorder history (MM-141, the panel CO-1)', () => {
  expect(find(times(14, 'over'), { limited: true })).toEqual([]);
});

it('a limit set lately judges only the days since (the panel CO-4)', () => {
  expect(find(times(14, 'over'), { since: through.addDays(-3) })).toEqual([]);
});

it('it sits after protein and before protein by meal in the catalog (the panel CO-5)', () => {
  const at = (rule: (typeof InsightRule.values)[number]) => InsightRule.index(rule);
  expect(at('sodiumOverLimit')).toBe(at('proteinShort') + 1);
  expect(at('proteinByMeal')).toBe(at('sodiumOverLimit') + 1);
});

it('a day is over whatever is missing, and under only with enough of it stated', () => {
  expect(new SodiumDay({ knownMg: 2400, coveredShare: 0.1 }).against(2300)).toBe('over');
  expect(new SodiumDay({ knownMg: 2000, coveredShare: 0.7 }).against(2300)).toBe('under');
  expect(new SodiumDay({ knownMg: 2000, coveredShare: 0.69 }).against(2300)).toBe('unknown');
});
