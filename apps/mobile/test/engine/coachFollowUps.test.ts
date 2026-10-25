import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { Caution } from '../../src/domain/Caution';
import type { FoodEntry } from '../../src/domain/FoodEntry';
import type { CoachAdviceGiven } from '../../src/engine/analysis/accountability/CoachAdviceGiven';
import { coachAdviceGivenOf } from '../../src/engine/analysis/accountability/coachAdviceGivenOf';
import type { CoachFollowUp } from '../../src/engine/analysis/accountability/CoachFollowUp';
import { coachFollowUpsOf } from '../../src/engine/analysis/accountability/coachFollowUpsOf';
import { followUpAllowed } from '../../src/engine/analysis/accountability/followUpAllowed';
import { withCoachFollowUps } from '../../src/engine/analysis/accountability/withCoachFollowUps';
import type { CoachFinding } from '../../src/engine/analysis/CoachFinding';
import { analyseFoodDay } from '../../src/engine/analysis/food/analyseFoodDay';
import type { FoodAnalysisInput } from '../../src/engine/analysis/food/FoodAnalysisInput';
import { foodLimitsOf } from '../../src/engine/analysis/food/foodLimitsOf';
import type { InsightSafeguards } from '../../src/engine/InsightSafeguards';
import { buffetDayInput, buffetDayMinute } from './support/buffetDay';
import { type FixtureDay, food, inputOf, plainDay, safeguards, today } from './support/foodAnalysis';

/**
 * MM-617's accountability: the coach follows up on its own advice, counts the repeats, and says when its advice was
 * taken, from its record of what it showed (`CoachAdviceGiven`) and the food log. `today` is Saturday 2026-10-24.
 */
const tuesday = CalendarDate.of(2026, 10, 20);
const thursday = CalendarDate.of(2026, 10, 22);
const tso = "General Tso's chicken";
const tsoKey = "general tso's chicken";

const given = (over: Partial<CoachAdviceGiven> = {}): CoachAdviceGiven => ({
  foodKey: tsoKey,
  foodName: tso,
  kind: 'skip',
  replacementName: undefined,
  kcal: 744,
  on: tuesday,
  ...over,
});

const ofKind = (followUps: readonly CoachFollowUp[], kind: CoachFollowUp['kind']) => followUps.filter((f) => f.kind === kind);

describe('the coach follows up on its own advice', () => {
  const tsoOn = (date: CalendarDate) => food(date, 'lunch', tso, 744, 32, 33);
  const days: FixtureDay[] = [
    { date: tuesday, entries: [tsoOn(tuesday), food(tuesday, 'breakfast', 'Oatmeal', 300, 10, 5)] },
    { date: thursday, entries: [tsoOn(thursday), food(thursday, 'breakfast', 'Oatmeal', 300, 10, 5)] },
  ];

  it("Tuesday it said to skip the General Tso's chicken; Thursday it's back, at 744 kcal", () => {
    expect(tuesday.weekday).toBe(2);
    expect(thursday.weekday).toBe(4);
    const followUps = coachFollowUpsOf({ food: inputOf(days), given: [given()], today: thursday });
    expect(ofKind(followUps, 'saidBefore')).toEqual([
      {
        kind: 'saidBefore',
        food: expect.objectContaining({ key: tsoKey, name: tso, kcal: 744, fatG: 33, proteinG: 32 }),
        order: 'skip',
        givenOn: tuesday,
        byWeekday: true,
        givenKcal: 744,
      },
    ]);
  });

  it('a swap is followed up as a swap, with its replacement', () => {
    const followUps = coachFollowUpsOf({ food: inputOf(days), given: [given({ kind: 'swap', replacementName: 'generalTso' })], today: thursday });
    expect(ofKind(followUps, 'saidBefore')).toEqual([expect.objectContaining({ order: 'swap', replacementName: 'generalTso', givenOn: tuesday })]);
  });

  it('the latest order is followed up, a skip before a swap of the same day', () => {
    const monday = tuesday.addDays(-1);
    const record = [given({ on: monday }), given({ kind: 'swap', replacementName: 'generalTso' }), given()];
    const followUps = coachFollowUpsOf({ food: inputOf(days), given: record, today: thursday });
    expect(ofKind(followUps, 'saidBefore')).toEqual([expect.objectContaining({ order: 'skip', givenOn: tuesday })]);
  });

  it('within 6 days the day is said by its weekday; after, by its date; after 14 days, not at all', () => {
    const at = (daysBefore: number) => {
      const on = thursday.addDays(-daysBefore);
      const withDay: FixtureDay[] = [{ date: on, entries: [tsoOn(on)] }, ...days.filter((d) => d.date === thursday)];
      return ofKind(coachFollowUpsOf({ food: inputOf(withDay), given: [given({ on })], today: thursday }), 'saidBefore');
    };
    expect(at(6)[0]?.byWeekday).toBe(true);
    expect(at(7)[0]?.byWeekday).toBe(false);
    expect(at(14)[0]?.givenOn).toBe(thursday.addDays(-14));
    expect(at(15)).toEqual([]);
  });

  it('nothing while the food is not eaten today, and nothing for what was said today', () => {
    const notToday: FixtureDay[] = [days[0] as FixtureDay, { date: thursday, entries: [food(thursday, 'breakfast', 'Oatmeal', 300, 10, 5)] }];
    expect(ofKind(coachFollowUpsOf({ food: inputOf(notToday), given: [given()], today: thursday }), 'saidBefore')).toEqual([]);
    expect(ofKind(coachFollowUpsOf({ food: inputOf(days), given: [given({ on: thursday })], today: thursday }), 'saidBefore')).toEqual([]);
  });

  it('a halve is not followed up as said before', () => {
    expect(ofKind(coachFollowUpsOf({ food: inputOf(days), given: [given({ kind: 'halve' })], today: thursday }), 'saidBefore')).toEqual([]);
  });

  it("on the owner's buffet day it rides on the calorie line that skips the General Tso's chicken", () => {
    const input = buffetDayInput();
    const found = analyseFoodDay(input, today, { nowMinute: buffetDayMinute });
    const followUps = coachFollowUpsOf({ food: input, given: [given({ on: thursday })], today });
    const placed = withCoachFollowUps(found, followUps, today);
    const line = placed.find((f) => f.kind === 'fix' && f.advice?.some((a) => a.kind === 'skip' && a.food?.key === tsoKey));
    expect(line?.signal).toBe('fatAgainstTarget');
    expect(line?.followUps).toEqual([expect.objectContaining({ kind: 'saidBefore', givenOn: thursday, byWeekday: true, food: expect.objectContaining({ kcal: 744 }) })]);
    expect(placed).toHaveLength(found.length);
  });
});

describe('repeats are counted', () => {
  const monday = CalendarDate.of(2026, 10, 19);
  /** 3,000 kcal against 2,400: 600 over, fried chicken the worst of lunch, the biggest meal; fat 138 g, protein 124 g. */
  const overDay = (date: CalendarDate): FoodEntry[] => [
    food(date, 'breakfast', 'Oatmeal', 400, 14, 8),
    food(date, 'lunch', 'Fried chicken', 1500, 60, 90),
    food(date, 'dinner', `Dinner of ${date.toString()}`, 1100, 50, 40),
  ];
  const week = (over: readonly CalendarDate[], marked: ReadonlyMap<CalendarDate, 'refeed'> = new Map()): FixtureDay[] =>
    Array.from({ length: 6 }, (_, i) => monday.addDays(i)).map((date) => ({
      date,
      entries: over.includes(date) ? overDay(date) : plainDay(date, 2400, 170, 70),
      ...(marked.has(date) ? { kind: 'refeed' as const } : {}),
    }));

  it('the third day this week over by 500 or more, and what drove them: the fried chicken', () => {
    expect(monday.weekday).toBe(1);
    expect(today.weekday).toBe(6);
    const followUps = coachFollowUpsOf({ food: inputOf(week([monday, monday.addDays(2), today])), given: [], today });
    expect(ofKind(followUps, 'repeatOver')).toEqual([
      { kind: 'repeatOver', days: 3, overByKcal: 500, food: expect.objectContaining({ key: 'fried chicken', kcal: 1500 }), drivenDays: 3 },
    ]);
  });

  it('it rides on the calorie line, with the fat over 3 of the last 7 days', () => {
    const input = inputOf(week([monday, monday.addDays(2), today]));
    const placed = withCoachFollowUps(analyseFoodDay(input, today), coachFollowUpsOf({ food: input, given: [], today }), today);
    const fat = placed.find((f) => f.kind === 'fix' && f.signal === 'fatAgainstTarget');
    expect(fat?.followUps?.map((f) => f.kind)).toEqual(['repeatOver', 'repeatFat']);
    expect(fat?.followUps?.[1]).toEqual({ kind: 'repeatFat', days: 3, ofDays: 7 });
  });

  it('two days are said; one is not; and not unless today is one of them', () => {
    const repeat = (over: readonly CalendarDate[]) => ofKind(coachFollowUpsOf({ food: inputOf(week(over)), given: [], today }), 'repeatOver');
    expect(repeat([monday, today])).toEqual([expect.objectContaining({ days: 2, drivenDays: 2 })]);
    expect(repeat([today])).toEqual([]);
    expect(repeat([monday, monday.addDays(2)])).toEqual([]);
  });

  it('only this calendar week counts, from Monday, and a Refeed is never counted', () => {
    const sunday = monday.addDays(-1);
    const days: FixtureDay[] = [{ date: sunday, entries: overDay(sunday) }, ...week([today])];
    expect(ofKind(coachFollowUpsOf({ food: inputOf(days), given: [], today }), 'repeatOver')).toEqual([]);
    const marked = week([monday, monday.addDays(2), today], new Map([[monday, 'refeed' as const]]));
    expect(ofKind(coachFollowUpsOf({ food: inputOf(marked), given: [], today }), 'repeatOver')).toEqual([expect.objectContaining({ days: 2 })]);
  });

  it('with no one food on two of the days, the meal that drove them is named', () => {
    const days = week([monday, today]).map((d) =>
      d.date === monday
        ? { ...d, entries: d.entries.map((e) => (e.name === 'Fried chicken' ? food(monday, 'lunch', 'Lasagne', 1500, 60, 90) : e)) }
        : d,
    );
    expect(ofKind(coachFollowUpsOf({ food: inputOf(days), given: [], today }), 'repeatOver')).toEqual([
      { kind: 'repeatOver', days: 2, overByKcal: 500, meal: 'lunch', drivenDays: 2 },
    ]);
  });

  it('protein short on 4 of the 7 days before today rides on what is left today', () => {
    const days: FixtureDay[] = [
      ...Array.from({ length: 7 }, (_, i) => today.addDays(i - 7)).map((date, i) => ({
        date,
        entries: plainDay(date, 2400, i % 2 === 0 ? 100 : 170, 70),
      })),
      { date: today, entries: [food(today, 'breakfast', 'Eggs', 300, 25, 20)] },
    ];
    const input = inputOf(days);
    const followUps = coachFollowUpsOf({ food: input, given: [], today });
    expect(ofKind(followUps, 'repeatProteinShort')).toEqual([{ kind: 'repeatProteinShort', days: 4, ofDays: 7 }]);
    const placed = withCoachFollowUps(analyseFoodDay(input, today), followUps, today);
    expect(placed.find((f) => f.kind === 'left')?.followUps).toEqual([{ kind: 'repeatProteinShort', days: 4, ofDays: 7 }]);
  });
});

describe('advice taken is said', () => {
  /** The advice: skip the biscuit, given the last day it was eaten, four days before today. */
  const adviceDay = tuesday;
  const biscuit = 'Sausage biscuit';
  const biscuitOn = (date: CalendarDate) => food(date, 'breakfast', biscuit, 700, 20, 45);
  const skipBiscuit = (on: CalendarDate = adviceDay): CoachAdviceGiven => ({
    foodKey: 'sausage biscuit',
    foodName: biscuit,
    kind: 'skip',
    replacementName: undefined,
    kcal: 700,
    on,
  });
  /** The biscuit on `eatenBefore` of the 14 days before the advice and on the advice day; nothing of it after. */
  const days = (eatenBefore: number, through: CalendarDate = today): FixtureDay[] => {
    const out: FixtureDay[] = [];
    for (let date = adviceDay.addDays(-14); !date.isAfter(through); date = date.addDays(1)) {
      const back = adviceDay.epochDay - date.epochDay;
      const eaten = date === adviceDay || (back >= 1 && back <= eatenBefore);
      out.push({ date, entries: [...(eaten ? [biscuitOn(date)] : []), ...plainDay(date, 1700, 150, 50)] });
    }
    return out;
  };

  it('skipped three days running after 10 of 14 days: 1,400 kcal not eaten', () => {
    const followUps = coachFollowUpsOf({ food: inputOf(days(10)), given: [skipBiscuit()], today });
    expect(ofKind(followUps, 'adviceTaken')).toEqual([
      {
        kind: 'adviceTaken',
        food: expect.objectContaining({ key: 'sausage biscuit', name: biscuit, kcal: 700 }),
        order: 'skip',
        givenOn: adviceDay,
        days: 3,
        beforeDays: 10,
        ofDays: 14,
        savedKcal: 1400,
      },
    ]);
  });

  it("MM-617's scenario: eaten on 5 of the 14 days before, not for 3 days since: 3 days running, its 700 kcal saved", () => {
    const followUps = ofKind(coachFollowUpsOf({ food: inputOf(days(5)), given: [skipBiscuit()], today }), 'adviceTaken');
    expect(followUps).toEqual([expect.objectContaining({ days: 3, beforeDays: 5, savedKcal: 700 })]);
  });

  it('the advice is the first skip on or after the last day it was eaten', () => {
    const record = [skipBiscuit(adviceDay.addDays(-3)), skipBiscuit(), skipBiscuit(adviceDay.addDays(1))];
    expect(ofKind(coachFollowUpsOf({ food: inputOf(days(10)), given: record, today }), 'adviceTaken')).toEqual([
      expect.objectContaining({ givenOn: adviceDay, days: 3 }),
    ]);
  });

  it('not yet after 2 days, not when eaten today, and not when it was eaten on only 2 of the 14 days before', () => {
    const at = (input: FoodAnalysisInput, on: CalendarDate) => ofKind(coachFollowUpsOf({ food: input, given: [skipBiscuit()], today: on }), 'adviceTaken');
    expect(at(inputOf(days(10, today.addDays(-1))), today.addDays(-1))).toEqual([]);
    const eatenToday = days(10).map((d) => (d.date === today ? { ...d, entries: [...d.entries, biscuitOn(today)] } : d));
    expect(at(inputOf(eatenToday), today)).toEqual([]);
    expect(at(inputOf(days(2)), today)).toEqual([]);
  });

  it('said once per piece of advice: not after the record says it was said on an earlier day, still on the day it was said', () => {
    const later = today.addDays(1);
    const input = inputOf(days(10, later));
    const taken = { ...skipBiscuit(today), kind: 'taken' as const, kcal: 1400 };
    expect(ofKind(coachFollowUpsOf({ food: input, given: [skipBiscuit(), taken], today: later }), 'adviceTaken')).toEqual([]);
    expect(ofKind(coachFollowUpsOf({ food: inputOf(days(10)), given: [skipBiscuit(), taken], today }), 'adviceTaken')).toHaveLength(1);
  });

  it('with nothing naming the biscuit today, it is a holding-up finding of its own, and the record keeps that it was said', () => {
    const input = inputOf(days(10));
    const placed = withCoachFollowUps(analyseFoodDay(input, today), coachFollowUpsOf({ food: input, given: [skipBiscuit()], today }), today);
    const own = placed.find((f) => f.signal === 'adviceTaken');
    expect(own).toMatchObject({
      id: `day:${today.epochDay}:adviceTaken:holdingUp:adviceTaken:sausage biscuit`,
      kind: 'holdingUp',
      span: 1,
      priority: 'pattern',
      figures: { kcal: 700, days: 3, savedKcal: 1400, beforeDays: 10, ofDays: 14, daysAgo: 4 },
    });
    expect(coachAdviceGivenOf(placed, today)).toContainEqual({
      foodKey: 'sausage biscuit',
      foodName: biscuit,
      kind: 'taken',
      replacementName: undefined,
      kcal: 1400,
      on: today,
    });
  });
});

describe('a follow-up with nowhere to ride is a finding of its own', () => {
  it("said before is a fix of today's, by its own id", () => {
    const followUp: CoachFollowUp = {
      kind: 'saidBefore',
      food: { key: tsoKey, name: tso, kcal: 744, fatG: 33, proteinG: 32 },
      order: 'skip',
      givenOn: thursday,
      byWeekday: true,
      givenKcal: 744,
    };
    const [own] = withCoachFollowUps([], [followUp], today);
    expect(own).toEqual({
      id: `day:${today.epochDay}:saidBefore:fix:saidBefore:${tsoKey}`,
      signal: 'saidBefore',
      kind: 'fix',
      span: 1,
      from: today,
      to: today,
      priority: 'pattern',
      figures: { kcal: 744, givenKcal: 744, daysAgo: 2 },
      foods: [],
      trade: undefined,
      trend: undefined,
      followUps: [followUp],
    });
  });

  it('a repeat rides on the closing line when nothing else takes it, and is else a fix of signal repeatOver', () => {
    const close = { id: 'close', signal: 'backToPlan', kind: 'close' } as unknown as CoachFinding;
    const over: CoachFollowUp = { kind: 'repeatOver', days: 3, overByKcal: 500, meal: 'lunch', drivenDays: 2 };
    expect(withCoachFollowUps([close], [over], today)).toEqual([{ ...close, followUps: [over] }]);
    const fat: CoachFollowUp = { kind: 'repeatFat', days: 3, ofDays: 7 };
    expect(withCoachFollowUps([close], [fat], today)).toEqual([{ ...close, followUps: [fat] }]);
    const [own] = withCoachFollowUps([], [fat], today);
    expect(own).toMatchObject({ signal: 'repeatOver', kind: 'fix', id: `day:${today.epochDay}:repeatOver:fix:repeatFat`, figures: { days: 3, ofDays: 7 } });
  });
});

describe('the record of advice shown', () => {
  it("keeps each order about a food once: the buffet day's skips and swaps, with the replacement's name", () => {
    const found = analyseFoodDay(buffetDayInput(), today, { nowMinute: buffetDayMinute });
    const record = coachAdviceGivenOf(found, today);
    expect(record).toContainEqual({ foodKey: tsoKey, foodName: tso, kind: 'skip', replacementName: undefined, kcal: 744, on: today });
    expect(record.some((g) => g.kind === 'swap' && g.replacementName !== undefined)).toBe(true);
    const ids = record.map((g) => `${g.kind}:${g.foodKey}`);
    expect(new Set(ids).size).toBe(ids.length);
    expect(record.every((g) => g.kind === 'skip' || g.kind === 'halve' || g.kind === 'swap')).toBe(true);
  });
});

describe('the safeguards', () => {
  /** Every follow-up at once: the Tso's back, the third day over, fat over, protein short, and the biscuit skipped. */
  const everything = (over: Partial<InsightSafeguards> = {}): FoodAnalysisInput => {
    const monday = CalendarDate.of(2026, 10, 19);
    const days: FixtureDay[] = [];
    for (let date = tuesday.addDays(-14); !date.isAfter(today); date = date.addDays(1)) {
      const back = tuesday.epochDay - date.epochDay;
      const heavy = date === monday || date === thursday || date === today;
      const entries: FoodEntry[] = heavy
        ? [food(date, 'breakfast', 'Oatmeal', 400, 14, 8), food(date, 'lunch', tso, 1500, 60, 90), food(date, 'dinner', `Dinner ${date.toString()}`, 1100, 50, 40)]
        : plainDay(date, 2400, 100, 70);
      if (back >= 0 && back <= 10) entries.push(food(date, 'snack', 'Sausage biscuit', 300, 10, 20));
      days.push({ date, entries });
    }
    return inputOf(days, { safeguards: safeguards(over) });
  };
  const record = [given({ on: thursday }), { ...given(), foodKey: 'sausage biscuit', foodName: 'Sausage biscuit', kcal: 300 }];
  const kinds = (input: FoodAnalysisInput) => coachFollowUpsOf({ food: input, given: record, today }).map((f) => f.kind).sort();
  const cautions = (...c: Caution[]) => ({ cautions: new Set<Caution>(c) });

  it('with none, every follow-up is said', () => {
    expect(kinds(everything())).toEqual(['adviceTaken', 'repeatFat', 'repeatOver', 'repeatProteinShort', 'saidBefore']);
  });

  it('none under 18, paused, with an eating-disorder history, under-eating, or after bariatric surgery', () => {
    expect(kinds(everything({ adult: false }))).toEqual([]);
    expect(kinds(everything({ paused: true }))).toEqual([]);
    expect(kinds(everything({ eatingDisorderHistory: true }))).toEqual([]);
    expect(kinds(everything(cautions('eatingDisorderHistory')))).toEqual([]);
    expect(kinds(everything({ underEating: true }))).toEqual([]);
    expect(kinds(everything(cautions('bariatricSurgery')))).toEqual([]);
  });

  it('in pregnancy nothing about eating less, only protein short; with kidney disease nothing for more protein', () => {
    expect(kinds(everything(cautions('pregnancy')))).toEqual(['repeatProteinShort']);
    expect(kinds(everything(cautions('chronicKidneyDisease')))).toEqual(['adviceTaken', 'repeatFat', 'repeatOver', 'saidBefore']);
  });

  it('advice taken may show for a protein add under every safeguard that allows adds', () => {
    const proteinAdd: CoachFollowUp = { kind: 'adviceTaken', order: 'add', nutrient: 'protein', days: 3 };
    const skip: CoachFollowUp = { kind: 'adviceTaken', order: 'skip', days: 3 };
    for (const over of [{ adult: false }, { paused: true }, { eatingDisorderHistory: true }, { underEating: true }, cautions('pregnancy')]) {
      const limits = foodLimitsOf(safeguards(over));
      expect(followUpAllowed(proteinAdd, limits), JSON.stringify(over)).toBe(true);
      expect(followUpAllowed(skip, limits), JSON.stringify(over)).toBe(false);
    }
    expect(followUpAllowed(proteinAdd, foodLimitsOf(safeguards(cautions('chronicKidneyDisease'))))).toBe(false);
    expect(followUpAllowed(proteinAdd, foodLimitsOf(safeguards(cautions('bariatricSurgery'))))).toBe(false);
  });

  it('nothing on a day marked a Refeed', () => {
    const input = everything();
    expect(coachFollowUpsOf({ food: { ...input, markedDays: new Map([[today.epochDay, 'refeed' as const]]) }, given: record, today })).toEqual([]);
  });
});
