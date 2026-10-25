import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { AnalysisSpan } from '../../src/engine/analysis/AnalysisSpan';
import type { CoachFinding } from '../../src/engine/analysis/CoachFinding';
import type { CoachFindingKind } from '../../src/engine/analysis/CoachFindingKind';
import type { CoachTrade } from '../../src/engine/analysis/CoachTrade';
import { FoodSignalId } from '../../src/engine/analysis/food/FoodSignalId';
import { coachFindingText } from '../../src/format/coach/coachFindingText';
import { coachTradeText } from '../../src/format/coach/coachTradeText';
import { foodFindingText } from '../../src/format/coach/foodFindingText';
import { Fmt } from '../../src/format/Fmt';
import { coachBannedWords } from '../support/coachBannedWords';

/** MM-606 and MM-612's words, in the coach's voice (MM-617): the templates, and the coach's list in every one of them. */
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

describe("the ticket's templates, in the coach's voice (MM-617)", () => {
  it('N5, change: the number, the food that gave it, and what it cost protein', () => {
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
    expect(body).toMatch(/^Fat (averaged 98 g against 70 g|98 g a day, against 70 g)\. /);
    expect(body).toMatch(/Peanut butter (gave|was) 35% of it\./);
    expect(body).toMatch(/20 g under your minimum on average\.$/);
    expect(body).not.toMatch(/9 kcal a gram/);
  });

  it('N4, change: the density against what the targets need', () => {
    const [, body, evidence] = foodFindingText(
      finding('proteinDensity', 'fix', { densityG: 5.1, requiredG: 7.1, targetG: 170, targetKcal: 2400, direction: -1, calorieRoom: 0 }),
      fmt,
    );
    // MM-617: the lead is plain words; the figures are in the numbers behind it.
    expect(body).not.toMatch(/per 100 kcal/);
    expect(JSON.stringify(evidence)).toMatch(/5\.1 g/);
    expect(JSON.stringify(evidence)).toMatch(/7\.1 g/);
  });

  it('N1, holding up: blunt and short', () => {
    const [, body] = foodFindingText(finding('proteinMinimum', 'holdingUp', { minimumG: 140, metDays: 12, judgedDays: 14 }), fmt);
    expect(body).toMatch(/^(Protein minimum hit on 12 of 14 days|140 g of protein or more on 12 of 14 days)\. (Keep that|Keep it there|Same again next time)\.$/);
  });

  it('N15', () => {
    const [, body] = foodFindingText(finding('energyUse', 'fix', { averageKcal: 2650, energyUseKcal: 2700, direction: 1 }), fmt);
    expect(body).toMatch(/2,650 kcal/);
    expect(body).toMatch(/2,700 kcal/);
  });

  it("MM-607's trade as an order, for a food the person logs", () => {
    const text = coachTradeText(granolaForYogurt, { spanDays: 14, today: false });
    expect(text).toMatch(/^(Granola on 6 of 14 days|Granola, 6 of 14 days): 420 kcal, 9 g protein, 18 g fat\./);
    expect(text).toMatch(/calorie-dense for its protein/i);
    expect(text).toMatch(/(Swap it for|Have) Greek yogurt with berries( instead)?, which you log at breakfast: 330 kcal, 28 g protein, 6 g fat\./);
    expect(text).toMatch(/[Aa]bout 8 g more protein a day, at 90 kcal fewer each time\.$/);
  });

  it("and for a catalog food: a food you haven't logged", () => {
    expect(coachTradeText({ ...granolaForYogurt, source: 'catalog' }, { spanDays: 14, today: false })).toMatch(
      /Greek yogurt with berries( instead)?, a food you haven't logged: 330 kcal, 28 g protein, 6 g fat\./,
    );
  });

  it('a trade on 1d speaks of today only', () => {
    const text = coachTradeText({ ...granolaForYogurt, days: 1, gainPerDay: 19, deltaKcal: -90 }, { spanDays: 1, today: true });
    expect(text).toMatch(/[Aa]bout 19 g more protein, at 90 kcal fewer\.$/);
    expect(text).not.toMatch(/days|yesterday|would have/);
  });

  it('a trade names both foods and says the calories in words, more or fewer each time (F6)', () => {
    const more = coachTradeText({ ...granolaForYogurt, deltaKcal: 40 }, { spanDays: 14, today: false });
    expect(more).toContain('Granola');
    expect(more).toContain('Greek yogurt with berries');
    expect(more).toContain('at 40 kcal more each time.');
    expect(coachTradeText({ ...granolaForYogurt, deltaKcal: 0.4 }, { spanDays: 14, today: false })).toContain('at about the same calories.');
    expect(more).not.toMatch(/[−+]\d/);
  });

  it('each side carries its usual portion, as logged or as the catalog serves it (F6)', () => {
    const text = coachTradeText(
      {
        ...granolaForYogurt,
        x: { ...granolaForYogurt.x, portion: { method: 'weighed', basis: 'calculated', quantity: 80, unit: 'gram' } },
        y: { ...granolaForYogurt.y, grams: 170 },
        source: 'catalog',
      },
      { spanDays: 14, today: false },
    );
    expect(text).toMatch(/^Granola \(80 g\)(,| on) 6 of 14 days: /);
    expect(text).toContain("Greek yogurt with berries (170 g)");
  });

  it('the calorie trade: the calories a day, with protein no lower (F2)', () => {
    const calories: CoachTrade = {
      motive: 'calories',
      meal: 'snack',
      x: { name: 'Muffin', kcal: 420, proteinG: 6, fatG: 20 },
      y: { name: 'Banana and yogurt', kcal: 300, proteinG: 12, fatG: 3 },
      source: 'logged',
      days: 7,
      gainPerDay: 60,
      deltaKcal: -120,
    };
    const span = coachTradeText(calories, { spanDays: 14, today: false });
    expect(span).toMatch(/banana and yogurt( instead)?, which you log as a snack: 300 kcal, 12 g protein, 3 g fat\./);
    expect(span).toMatch(/[Aa]bout 60 kcal fewer a day, (with )?protein no lower\.$/);
    expect(coachTradeText({ ...calories, days: 1, gainPerDay: 120 }, { spanDays: 1, today: true })).toMatch(
      /[Aa]bout 120 kcal fewer today, (with )?protein no lower\.$/,
    );
  });

  it('the sodium trade states both foods’ sodium (F3)', () => {
    const sodium: CoachTrade = {
      motive: 'sodium',
      meal: 'lunch',
      x: { name: 'Instant noodles', kcal: 420, proteinG: 9, fatG: 18, sodiumMg: 1400 },
      y: { name: 'Lentil soup, homemade', kcal: 380, proteinG: 20, fatG: 8, sodiumMg: 500 },
      source: 'logged',
      days: 6,
      gainPerDay: (900 * 6) / 14,
      deltaKcal: -40,
    };
    const text = coachTradeText(sodium, { spanDays: 14, today: false });
    expect(text).toContain('420 kcal, 1,400 mg sodium');
    expect(text).toContain('380 kcal, 500 mg sodium');
    expect(text).toMatch(/[Aa]bout 386 mg less sodium a day, at 40 kcal fewer each time\.$/);
  });

  it('the calorie-density line does not say "calorie-dense for its protein" twice (F7)', () => {
    const [, body] = foodFindingText(
      finding('calorieDensity', 'fix', { kcalPerG: 4.8, proteinPer100Kcal: 2.1, direction: 1, tradeDays: 14 }, {
        foods: [{ name: 'Granola', share: 0.18, days: 6, kcal: 420 }],
        trade: granolaForYogurt,
      }),
      fmt,
    );
    expect((body.match(/calorie-dense for its protein/gi) ?? []).length).toBeLessThanOrEqual(1);
  });

  it('a fix ends in its orders; with none, the number alone', () => {
    const base = { metDays: 5, judgedDays: 14, minimumG: 140, averageShortfallG: 25, direction: -1, tradeDays: 14, calorieRoom: 1 };
    const withAdd = foodFindingText(
      { ...finding('proteinMinimum', 'fix', base), advice: [{ kind: 'add', nutrient: 'protein', addFood: 'Greek yogurt' }] },
      fmt,
    )[1];
    expect(withAdd).toMatch(/(Add Greek yogurt: you already log it, and it carries protein|More Greek yogurt\. You already log it)\.$/);
    const none = foodFindingText(finding('proteinMinimum', 'fix', base), fmt)[1];
    expect(none).toMatch(/5 of 14 days/);
    expect(none).toMatch(/25 g short/);
  });
});

describe('the numbers behind it (MM-610 review, F8 and F10)', () => {
  const rows = (f: CoachFinding) => coachFindingText(f, fmt)[2];
  const labels = (f: CoachFinding) => rows(f).map(([label]) => label);

  it('1d density says its title in plain amounts', () => {
    const [title] = foodFindingText(
      finding('proteinDensity', 'fix', { kcal: 780, proteinG: 18, densityG: 2.3, requiredG: 7.1, targetG: 170, targetKcal: 2400 }, { span: 1 }),
      fmt,
    );
    expect(title).toBe('18 g protein in 780 kcal so far');
  });

  it('the calories findings carry the band, low to high', () => {
    for (const f of [
      finding('calories', 'holdingUp', { withinDays: 11, judgedDays: 14, targetKcal: 2400 }),
      finding('calories', 'fix', { aboveDays: 9, judgedDays: 14, averageKcal: 2700, targetKcal: 2400, averageOverKcal: 300, direction: 1 }),
      finding('calories', 'holdingUp', { kcal: 2350, targetKcal: 2400 }, { span: 1 }),
    ]) {
      expect(new Map(rows(f)).get('Band')).toBe('2,280–2,520 kcal');
    }
  });

  it('a food row says what its share is of', () => {
    const foods = [{ name: 'Peanut butter', share: 0.35, days: 8, kcal: 190 }];
    const fat = finding('fatAgainstTarget', 'fix', { averageFatG: 98, targetFatG: 70, direction: 1, judgedDays: 14 }, { foods });
    const protein = finding('proteinMinimum', 'fix', { metDays: 5, judgedDays: 14, minimumG: 140, averageShortfallG: 25, direction: -1 }, { foods });
    const calories = finding('calories', 'fix', { aboveDays: 9, judgedDays: 14, targetKcal: 2400, direction: 1 }, { foods });
    expect(new Map(rows(fat)).get('Peanut butter, share of fat')).toBe('35% · 8 days');
    expect(labels(protein)).toContain('Peanut butter, share of the gap');
    expect(labels(calories)).toContain('Peanut butter, share of calories');
  });

  it('fiber has its days counted and left out', () => {
    const fiber = new Map(rows(finding('fiber', 'fix', { countedDays: 10, averageG: 12, guideG: 34, direction: -1 })));
    expect(fiber.get('Days counted')).toBe('10');
    expect(fiber.get('Days left out')).toBe('4, not fully logged or without enough fiber data');
  });

  it('sodium says its days left out once, with why', () => {
    const sodium = finding('sodium', 'fix', { overDays: 9, judgedDays: 12, leftOutDays: 2, limitMg: 2300, direction: 1 });
    expect(labels(sodium).filter((label) => label === 'Days left out')).toHaveLength(1);
    expect(new Map(rows(sodium)).get('Days left out')).toBe('2, without sodium data');
    const mixed = finding('sodium', 'holdingUp', { underDays: 9, judgedDays: 10, leftOutDays: 1, limitMg: 2300 });
    expect(labels(mixed).filter((label) => label === 'Days left out')).toHaveLength(1);
    expect(new Map(rows(mixed)).get('Days left out')).toBe('4: 3 not fully logged, 1 without sodium data');
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

describe('words', () => {
  const texts = everyFinding().map((f) => {
    const [title, body, evidence] = foodFindingText(f, fmt);
    return { f, title, body, evidence };
  });

  it("every template passes the coach's list (MM-617)", () => {
    const hits = texts.flatMap(({ f, title, body, evidence }) =>
      coachBannedWords
        .filter(([, pattern]) => pattern.test([title, body, ...evidence.flat()].join(' ')))
        .map(([name]) => `${f.signal}/${f.kind}/${f.span}: ${name}`),
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
    for (const { f, body } of texts.filter(({ f }) => f.span === 1 && f.kind !== 'dataQuality')) {
      expect(`${f.signal} ${body}`).not.toMatch(/yesterday|on those days|would have|since/i);
    }
  });

  it('the eating-disorder version of what is left says nothing of calories', () => {
    const [title, body, evidence] = foodFindingText(finding('left', 'left', everyFigure(1, { proteinOnly: 1 }), { span: 1 }), fmt);
    expect([title, body, ...evidence.flat()].join(' ')).not.toMatch(/kcal|calorie/i);
  });
});
