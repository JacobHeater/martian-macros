import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { CoachFollowUp } from '../../src/engine/analysis/accountability/CoachFollowUp';
import { CoachFollowUpKind } from '../../src/engine/analysis/accountability/CoachFollowUpKind';
import { withCoachFollowUps } from '../../src/engine/analysis/accountability/withCoachFollowUps';
import type { CoachFinding } from '../../src/engine/analysis/CoachFinding';
import { analyseFoodDay } from '../../src/engine/analysis/food/analyseFoodDay';
import { coachFindingText } from '../../src/format/coach/coachFindingText';
import { coachFollowUpText } from '../../src/format/coach/coachFollowUpText';
import { Fmt } from '../../src/format/Fmt';
import { buffetDayInput, buffetDayMinute } from '../engine/support/buffetDay';
import { coachBannedWords } from '../support/coachBannedWords';

/**
 * MM-617's accountability, in words: what the coach told the person
 * before, the repeats it counts, and advice taken, each as a finding of
 * its own when nothing else is about it, or riding on the finding about
 * the same food or meal, right after that finding's lead.
 */
const fmt = new Fmt('metric');
const tuesday = CalendarDate.of(2026, 10, 20);
const thursday = CalendarDate.of(2026, 10, 22);
const saturday = CalendarDate.of(2026, 10, 24);
const gts = { key: "general tso's chicken", name: "General Tso's chicken", kcal: 744, fatG: 33, proteinG: 32 };
const own = (u: CoachFollowUp, today: CalendarDate) => withCoachFollowUps([], [u], today)[0] as CoachFinding;
const text = (f: CoachFinding) => coachFindingText(f, fmt);

describe("the scenarios of MM-617's accountability, line for line", () => {
  it('"Tuesday I told you to skip the General Tso\'s chicken. It\'s back: 744 kcal again."', () => {
    const f = own({ kind: 'saidBefore', food: gts, order: 'skip', givenOn: tuesday, byWeekday: true, givenKcal: 744 }, thursday);
    expect(f.signal).toBe('saidBefore');
    expect(text(f)[0]).toBe("General Tso's chicken is back");
    expect(text(f)[1]).toBe("Tuesday I told you to skip the General Tso's chicken. It's back: 744 kcal again. Leave it out next time.");
  });

  it('past the week, the day is its date', () => {
    const f = own({ kind: 'saidBefore', food: gts, order: 'skip', givenOn: thursday.addDays(-10), byWeekday: false }, thursday);
    expect(text(f)[1]).toMatch(/On Oct 12 I (told you to skip|said skip) the General Tso's chicken\.|I told you on Oct 12 to skip the General Tso's chicken\./);
  });

  it('"Third day this week over by 500 or more." and the meal that keeps doing it', () => {
    const f = own({ kind: 'repeatOver', days: 3, overByKcal: 500, meal: 'lunch', drivenDays: 3 }, saturday);
    expect(text(f)[0]).toBe('Over by 500 kcal, 3 days this week');
    expect(text(f)[1]).toBe('Third day this week over by 500 or more. Lunch keeps doing it. Plan lunch before you get there.');
  });

  it('"Peanut butter again": the food that drove the repeats, and on how many of the days', () => {
    const peanutButter = { key: 'peanut butter', name: 'Peanut butter', kcal: 400, fatG: 34, proteinG: 14 };
    const f = own({ kind: 'repeatOver', days: 3, overByKcal: 500, food: peanutButter, drivenDays: 2 }, saturday);
    expect(text(f)[1]).toBe('Third day over by 500 or more this week. Peanut butter again: 2 of the 3 days. Skip it next time.');
  });

  it('"You skipped the biscuit three days running. That\'s 1,400 kcal you didn\'t eat."', () => {
    const biscuit = { key: 'biscuit', name: 'Biscuit', kcal: 700, fatG: 40, proteinG: 25 };
    const f = own({ kind: 'adviceTaken', food: biscuit, order: 'skip', givenOn: saturday.addDays(-4), days: 3, beforeDays: 10, ofDays: 14, savedKcal: 1400 }, saturday);
    expect(f.kind).toBe('holdingUp');
    expect(text(f)[1]).toBe("You skipped the biscuit three days running. That's 1,400 kcal you didn't eat. Keep that.");
  });

  it('"Fat over target 3 of the last 7 days."', () => {
    const f = own({ kind: 'repeatFat', days: 3, ofDays: 7 }, saturday);
    expect(text(f)[0]).toBe('Fat over target, 3 of 7 days');
    expect(text(f)[1]).toBe('Fat over target 3 of the last 7 days. Halve the added fats: oil, butter, dressing.');
  });

  it('protein short of the minimum, 3 of the last 7 days', () => {
    const f = own({ kind: 'repeatProteinShort', days: 3, ofDays: 7 }, saturday);
    expect(text(f)[1]).toBe('Short on protein 3 of the last 7 days. A pattern. Put protein in every meal.');
  });
});

describe('riding on the finding about the same food', () => {
  const day = analyseFoodDay(buffetDayInput(), saturday, { nowMinute: buffetDayMinute });
  const back: CoachFollowUp = { kind: 'saidBefore', food: gts, order: 'skip', givenOn: thursday, byWeekday: true, givenKcal: 744 };

  it("the buffet day's calorie line says it right after its lead, and still ends as it did", () => {
    const withIt = withCoachFollowUps(day, [back], saturday);
    const host = withIt.find((f) => (f.followUps ?? []).length > 0) as CoachFinding;
    expect(host.signal).toBe('fatAgainstTarget');
    const said = coachFollowUpText(host, back);
    expect(said).toBe("Thursday I said skip the General Tso's chicken. It's back: 744 kcal again.");
    const body = text(host)[1];
    expect(body.startsWith(`Lunch was the problem. ${said} The Chinese buffet: 2,368 kcal`)).toBe(true);
    expect(body).toMatch(/you'd be 310 kcal over, not 1,054\.$/);
  });
});

describe('every kind, riding and on its own, is said and never throws', () => {
  const food = { key: 'fried rice', name: 'Fried rice', kcal: 274, fatG: 11, proteinG: 6 };
  const every: readonly CoachFollowUp[] = [
    { kind: 'saidBefore', food, order: 'skip', givenOn: thursday, byWeekday: true, givenKcal: 274 },
    { kind: 'saidBefore', food, order: 'swap', replacementName: 'a cup of steamed white rice', givenOn: thursday.addDays(-9), byWeekday: false },
    { kind: 'saidBefore', food, order: 'halve', givenOn: thursday },
    { kind: 'saidBefore' },
    { kind: 'repeatOver', days: 2, overByKcal: 500 },
    { kind: 'repeatOver', days: 4, overByKcal: 500, food, drivenDays: 3 },
    { kind: 'repeatOver', days: 3, overByKcal: 500, meal: 'snack', drivenDays: 2 },
    { kind: 'repeatOver', days: 9, overByKcal: 500 },
    { kind: 'repeatFat', days: 4, ofDays: 7 },
    { kind: 'repeatProteinShort', days: 3, ofDays: 7 },
    { kind: 'adviceTaken', food, order: 'skip', days: 5, beforeDays: 6, ofDays: 14, savedKcal: 822 },
    { kind: 'adviceTaken', order: 'add', nutrient: 'protein', days: 3 },
    { kind: 'adviceTaken' },
  ];

  it('covers every kind', () => {
    expect(new Set(every.map((u) => u.kind))).toEqual(new Set(CoachFollowUpKind.values));
  });

  for (const [i, u] of every.entries()) {
    it(`${u.kind} #${i}: on its own`, () => {
      const f = own(u, saturday);
      expect(['saidBefore', 'repeatOver', 'adviceTaken']).toContain(f.signal);
      const [title, body, evidence] = text(f);
      const all = [title, body, ...evidence.flat()].join(' ');
      expect(all).not.toMatch(/undefined|NaN|\{\w+\}|!/);
      expect(title.split(' ').length, title).toBeLessThanOrEqual(8);
      expect(coachBannedWords.filter(([, p]) => p.test(all)).map(([n]) => n)).toEqual([]);
    });

    it(`${u.kind} #${i}: riding on every kind of finding`, () => {
      const day = analyseFoodDay(buffetDayInput(), saturday, { nowMinute: buffetDayMinute });
      for (const host of day) {
        const riding = { ...host, followUps: [u, u] };
        const said = coachFollowUpText(riding, u);
        expect(() => text(riding)).not.toThrow();
        expect(text(riding)[1], host.id).toContain(said);
      }
    });
  }

  it('a finding of its own with no follow-up at all still has words', () => {
    for (const signal of ['saidBefore', 'repeatOver', 'adviceTaken']) {
      const f = { ...own({ kind: 'repeatFat', days: 3, ofDays: 7 }, saturday), signal, followUps: undefined };
      expect(() => text(f)).not.toThrow();
    }
  });
});
