import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { AnalysisSpan } from '../../src/engine/analysis/AnalysisSpan';
import type { CoachFinding } from '../../src/engine/analysis/CoachFinding';
import type { CoachFindingKind } from '../../src/engine/analysis/CoachFindingKind';
import type { CoachTrade } from '../../src/engine/analysis/CoachTrade';
import { FoodSignalId } from '../../src/engine/analysis/food/FoodSignalId';
import { coachTradeText } from '../../src/format/coachTradeText';
import { foodFindingText } from '../../src/format/foodFindingText';
import { Fmt } from '../../src/format/Fmt';

/** MM-606 and MM-612's words: the ticket's templates, and no verdict in any of them (MM-108, MM-610). */
const fmt = new Fmt('metric');
const to = CalendarDate.of(2026, 10, 23);

const finding = (
  signal: string,
  kind: CoachFindingKind,
  figures: Record<string, number>,
  { span = 14, foods = [], trade }: { span?: AnalysisSpan; foods?: CoachFinding['foods']; trade?: CoachTrade } = {},
): CoachFinding => ({
  id: `${signal}:level`,
  signal,
  kind,
  span,
  from: span === 1 ? to : to.addDays(1 - span),
  to,
  priority: kind === 'dataQuality' ? 'dataQuality' : 'coaching',
  figures,
  foods,
  trade,
  trend: undefined,
});

const granolaForYogurt: CoachTrade = {
  motive: 'protein',
  meal: 'breakfast',
  x: { name: 'Granola', kcal: 420, proteinG: 9, fatG: 18 },
  y: { name: 'Greek yogurt with berries', kcal: 330, proteinG: 28, fatG: 6 },
  source: 'logged',
  days: 6,
  gainPerDay: 8.1,
  deltaKcal: -90,
};

describe("the ticket's templates", () => {
  it('N5, change', () => {
    const [title, body] = foodFindingText(
      finding(
        'fatAgainstTarget',
        'fix',
        { averageFatG: 98, targetFatG: 70, proteinReference: 0, proteinShortG: 22, direction: 1, calorieRoom: 0, tradeDays: 14 },
        { foods: [{ name: 'Peanut butter', share: 0.35, days: 8, kcal: 190 }] },
      ),
      fmt,
    );
    expect(title).toBe('Fat averaged 98 g against 70 g');
    expect(body).toBe(
      'Fat averaged 98 g against 70 g; Peanut butter supplied 35% of it. Fat carries 9 kcal a gram, so those calories ' +
        'went to fat instead of protein, which averaged 22 g under your minimum.',
    );
  });

  it('N4, change', () => {
    const [, body] = foodFindingText(
      finding('proteinDensity', 'fix', { densityG: 5.1, requiredG: 7.1, targetG: 170, targetKcal: 2400, direction: -1, calorieRoom: 0 }),
      fmt,
    );
    expect(body).toBe(
      'Your days carried 5.1 g of protein per 100 kcal. Reaching 170 g within 2,400 kcal takes about 7.1 g, so some ' +
        'calories went to foods with little protein.',
    );
  });

  it('N1, holding up', () => {
    const [, body] = foodFindingText(finding('proteinMinimum', 'holdingUp', { minimumG: 140, metDays: 12, judgedDays: 14 }), fmt);
    expect(body).toBe('Protein reached 140 g or more on 12 of 14 days.');
  });

  it('N15', () => {
    const [, body] = foodFindingText(finding('energyUse', 'fix', { averageKcal: 2650, energyUseKcal: 2700, direction: 1 }), fmt);
    expect(body).toBe('By your log, intake averaged 2,650 kcal, close to the 2,700 kcal the app estimates you use.');
  });

  it("MM-607's trade sentence, for a food the person logs", () => {
    expect(coachTradeText(granolaForYogurt, { spanDays: 14, today: false })).toBe(
      'Granola on 6 of 14 days: 420 kcal with 9 g protein and 18 g fat. It is calorie-dense for its protein. Greek ' +
        'yogurt with berries, which you log at breakfast, gives 28 g protein in 330 kcal. Trading it on those days ' +
        'would have added about 8 g of protein a day, at −90 kcal a time.',
    );
  });

  it("and for a catalog food: a food you haven't logged", () => {
    expect(coachTradeText({ ...granolaForYogurt, source: 'catalog' }, { spanDays: 14, today: false })).toContain(
      "Greek yogurt with berries, a food you haven't logged, gives 28 g protein in 330 kcal.",
    );
  });

  it('a trade on 1d speaks of today only', () => {
    const text = coachTradeText({ ...granolaForYogurt, days: 1, gainPerDay: 19, deltaKcal: -90 }, { spanDays: 1, today: true });
    expect(text).toContain('Trading it adds about 19 g of protein, at −90 kcal a time.');
    expect(text).not.toMatch(/days|yesterday|would have/);
  });

  it('a finding carries its trade, or the add when there is room, or nothing', () => {
    const base = { metDays: 5, judgedDays: 14, minimumG: 140, averageShortfallG: 25, direction: -1, tradeDays: 14 };
    const withTrade = foodFindingText(finding('proteinMinimum', 'fix', { ...base, calorieRoom: 1 }, { trade: granolaForYogurt }), fmt)[1];
    const withRoom = foodFindingText(finding('proteinMinimum', 'fix', { ...base, calorieRoom: 1 }), fmt)[1];
    const noRoom = foodFindingText(finding('proteinMinimum', 'fix', { ...base, calorieRoom: 0 }), fmt)[1];
    expect(withTrade).toContain('Trading it on those days would have added about 8 g of protein a day');
    expect(withRoom).toContain('Your calories have room for more of a protein food you log.');
    expect(noRoom).toBe('Protein reached your 140 g minimum on 5 of the 14 days you logged in full; on the other days it was about 25 g short.');
  });
});

/** Every figure any template reads, so every template is filled. */
const everyFigure = (direction: number, extra: Record<string, number> = {}): Record<string, number> => ({
  judgedDays: 14,
  metDays: 10,
  minimumG: 140,
  averageProteinG: 150,
  averageShortfallG: 12,
  shortDays: 9,
  closeDays: 11,
  targetG: 170,
  averageGapG: 20,
  missedDays: 8,
  lowDays: 7,
  meal: 1,
  perMealG: 24,
  spreadDays: 10,
  densityG: 6.1,
  requiredG: 7.1,
  targetKcal: 2400,
  averageKcal: 2500,
  highDays: 9,
  withinDays: 11,
  averageFatG: 95,
  targetFatG: 70,
  minimumFatG: 50,
  floorG: 100,
  averageCarbsG: 90,
  targetCarbsG: 250,
  proteinSharePercent: 20,
  carbsSharePercent: 45,
  fatSharePercent: 35,
  plannedProteinSharePercent: 28,
  plannedCarbsSharePercent: 46,
  plannedFatSharePercent: 26,
  largest: 2,
  largestOff: 9,
  kcalPerG: 5.2,
  proteinPer100Kcal: 1.4,
  waterRichDays: 4,
  countedDays: 10,
  averageG: 12,
  guideG: 34,
  overDays: 9,
  underDays: 12,
  leftOutDays: 2,
  limitMg: 2300,
  averageMg: 2900,
  sodiumMg: 2500,
  aboveDays: 9,
  belowDays: 9,
  averageOverKcal: 300,
  averageUnderKcal: 300,
  energyUseKcal: 2600,
  mealShare: 0.3,
  mealDensityG: 2.5,
  loggedDays: 14,
  partialDays: 6,
  wholeDays: 12,
  estimatedShare: 0.6,
  onsetEpochDay: to.addDays(-5).epochDay,
  kcal: 1800,
  proteinG: 100,
  fatG: 95,
  carbsG: 200,
  kcalTarget: 2400,
  proteinTargetG: 170,
  kcalLeft: 600,
  proteinLeftG: 70,
  proteinOnly: 0,
  proteinShown: 1,
  marked: 0,
  fiberG: 36,
  densityLow: 1,
  proteinReference: 0,
  proteinShortG: 12,
  proteinMissedDays: 8,
  proteinJudgedDays: 14,
  calorieRoom: 1,
  tradeDays: 14,
  direction,
  ...extra,
});

/** Every finding the words can be asked for. */
function everyFinding(): CoachFinding[] {
  const foods = [
    { name: 'Peanut butter', share: 0.35, days: 8, kcal: 190, proteinG: 7 },
    { name: 'Crackers', share: 0.2, days: 10, kcal: 330, proteinG: 6 },
  ];
  const all: CoachFinding[] = [];
  for (const span of [1, 14] as const) {
    for (const signal of FoodSignalId.values) {
      for (const kind of ['fix', 'holdingUp'] as const) {
        for (const direction of [1, -1]) {
          for (const trade of [undefined, granolaForYogurt, { ...granolaForYogurt, motive: 'fat' as const, source: 'catalog' as const }]) {
            all.push(finding(signal, kind, everyFigure(direction), { span, foods, ...(trade === undefined ? {} : { trade }) }));
          }
        }
      }
    }
    for (const signal of ['partialDays', 'estimatesRising', 'loggingStyle']) all.push(finding(signal, 'dataQuality', everyFigure(1), { span }));
    for (const left of [
      {},
      { proteinOnly: 1 },
      { proteinShown: 0 },
      { kcalLeft: -200 },
      { proteinLeftG: -10 },
      { marked: 1 },
      { marked: 2, proteinOnly: 1 },
    ]) {
      all.push(finding('left', 'left', everyFigure(1, left), { span: 1, foods }));
    }
  }
  return all;
}

/** MM-108's list, and MM-610's verdicts. */
const banned = [
  'good',
  'bad',
  'clean',
  'junk',
  'guilt',
  'cheat',
  'oops',
  'earn',
  'burn off',
  'lbs',
  'sinful',
  'naughty',
  'indulg',
  'deserve',
  'too',
  'too much',
  'unhealthy',
  'fattening',
  'empty calories',
  'avoid',
  'cut out',
  'failed',
  'should',
  'because',
  'burn rate',
  'TDEE',
];

describe('words', () => {
  const texts = everyFinding().map((f) => {
    const [title, body, evidence] = foodFindingText(f, fmt);
    return { f, title, body, evidence };
  });

  it('every template passes the banned-word test, and none says "too", "unhealthy", "fattening" or "avoid"', () => {
    const hits = texts.flatMap(({ f, title, body, evidence }) =>
      banned
        .filter((word) => new RegExp(`\\b${word}\\b`, 'i').test([title, body, ...evidence.flat()].join(' ')))
        .map((word) => `${f.signal}/${f.kind}/${f.span}: "${word}"`),
    );
    expect(hits).toEqual([]);
  });

  it('every title is in numbers, eight words or fewer', () => {
    const long = texts.filter(({ title }) => title.split(/\s+/).length > 8).map(({ title }) => title);
    expect(long).toEqual([]);
  });

  it('every number has its unit after a space, and no figure is left unfilled', () => {
    for (const { body } of texts) {
      expect(body).not.toMatch(/undefined|NaN|\d(kcal|g)\b/);
    }
  });

  it('1d never names another day', () => {
    for (const { f, body } of texts.filter(({ f }) => f.span === 1)) {
      expect(`${f.signal} ${body}`).not.toMatch(/yesterday|on those days|would have|since/i);
    }
  });

  it('the eating-disorder version of what is left says nothing of calories', () => {
    const [title, body, evidence] = foodFindingText(finding('left', 'left', everyFigure(1, { proteinOnly: 1 }), { span: 1 }), fmt);
    expect([title, body, ...evidence.flat()].join(' ')).not.toMatch(/kcal|calorie/i);
  });
});
