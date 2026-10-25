import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { analyseTrainingSpan } from '../../src/engine/analysis/analyseTrainingSpan';
import { arrangeCoachFindings } from '../../src/engine/analysis/arrangeCoachFindings';
import type { CoachFinding } from '../../src/engine/analysis/CoachFinding';
import { analyseFoodDay } from '../../src/engine/analysis/food/analyseFoodDay';
import { analyseFoodSpan } from '../../src/engine/analysis/food/analyseFoodSpan';
import { TrendSpan } from '../../src/engine/trends/TrendSpan';
import { coachAdviceText } from '../../src/format/coach/coachAdviceText';
import { coachFindingText } from '../../src/format/coach/coachFindingText';
import { coachHeadlineText } from '../../src/format/coach/coachHeadlineText';
import { coachPhrasings } from '../../src/format/coach/coachPhrasings';
import { Fmt } from '../../src/format/Fmt';
import { buffetDayInput, buffetDayMinute } from '../engine/support/buffetDay';
import { food, inputOf, ownersFatWeek, today, yesterday } from '../engine/support/foodAnalysis';
import { stationaryCoachUser } from '../engine/support/stationaryCoachUser';
import { coachBannedWords } from '../support/coachBannedWords';

/**
 * MM-617: every phrasing of every slot of the coach's grammar, as written,
 * and the text the analysis gives: the coach's list (no profanity, nothing
 * about the person's body or worth, no cheat, sinful, deserve, earn or
 * burn off), no exclamation mark, 2 to 4 phrasings a slot, and every fix's
 * text carrying each of its order sentences.
 */
const fmt = new Fmt('metric');
const slots = Object.entries(coachPhrasings) as [string, readonly string[]][];
const bannedIn = (text: string) => coachBannedWords.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);

describe('every phrasing of every slot', () => {
  it('has 2 to 4 phrasings, each different', () => {
    for (const [slot, variants] of slots) {
      expect(variants.length, slot).toBeGreaterThanOrEqual(2);
      expect(variants.length, slot).toBeLessThanOrEqual(4);
      expect(new Set(variants).size, slot).toBe(variants.length);
    }
  });

  it("passes the coach's list", () => {
    const hits = slots.flatMap(([slot, variants]) => variants.flatMap((v) => bannedIn(v).map((name) => `${slot}: ${name} in "${v}"`)));
    expect(hits).toEqual([]);
  });

  it('has no exclamation mark', () => {
    expect(slots.flatMap(([slot, variants]) => variants.filter((v) => v.includes('!')).map((v) => `${slot}: ${v}`))).toEqual([]);
  });

  it('a sentence ends in a full stop; a piece of one (…Words) does not', () => {
    for (const [slot, variants] of slots) {
      for (const v of variants) {
        if (slot.endsWith('Words')) expect(v, slot).not.toMatch(/[.?]$/);
        else expect(v, slot).toMatch(/[.?]$/);
      }
    }
  });

  it('the list catches what it is for, and lets a verdict on a choice through', () => {
    expect(bannedIn("You're fat.")).toContain('fat, aimed at the person');
    expect(bannedIn('Cheat day.')).toContain('cheat');
    expect(bannedIn('You earned it.')).toContain('earn');
    expect(bannedIn('Burn it off tomorrow.')).toContain('burn off');
    expect(bannedIn("That's lazy.")).toContain('lazy');
    expect(bannedIn('What the hell.')).toContain('profanity');
    expect(bannedIn('General Tso\'s chicken: 744 kcal, 33 g fat. Too much. That was the mistake. Skip it.')).toEqual([]);
  });
});

/** The text of findings across the analysis: the buffet day, the fat week, simulated users on 1d and every span, food and training. */
function everyFinding(): CoachFinding[] {
  const found: CoachFinding[] = [
    ...analyseFoodDay(buffetDayInput(), today, { nowMinute: buffetDayMinute }),
    ...analyseFoodDay(inputOf([...ownersFatWeek(), { date: today, entries: [food(today, 'breakfast', 'Peanut butter', 400, 14, 34)] }]), today),
    ...TrendSpan.values.flatMap((span) => analyseFoodSpan(inputOf(ownersFatWeek()), span, yesterday)),
  ];
  const start = CalendarDate.of(2026, 1, 5);
  for (let user = 0; user < 4; user++) {
    const person = stationaryCoachUser(7200 + user, start, 150);
    for (const i of [110, 140]) {
      const asOf = start.addDays(i);
      found.push(...analyseFoodDay(person.food, asOf.addDays(1), { nowMinute: 20 * 60 }));
      for (const span of TrendSpan.values) {
        found.push(...analyseFoodSpan(person.food, span, asOf), ...analyseTrainingSpan(person.training(asOf), span, asOf));
      }
    }
  }
  return found;
}

describe('the text the analysis gives', () => {
  const found = everyFinding();
  const texts = found.map((f) => ({ f, text: coachFindingText(f, fmt) }));

  it('every fix carries each of its order sentences, and ends in an order or in what the day would have been', () => {
    const fixes = texts.filter(({ f }) => f.kind === 'fix');
    expect(fixes.length).toBeGreaterThan(10);
    const missing: string[] = [];
    for (const { f, text } of fixes) {
      const { orders, sentences } = coachAdviceText(f, fmt);
      if ((f.advice ?? []).length > 0 && orders.length === 0) missing.push(`${f.id}: no order sentence`);
      for (const order of orders) if (!text[1].includes(order)) missing.push(`${f.id}: "${order}"`);
      const last = sentences[sentences.length - 1];
      if (last !== undefined && !text[1].endsWith(last)) missing.push(`${f.id} ends "${text[1].slice(-60)}"`);
    }
    expect(missing).toEqual([]);
  }, 300_000);

  it("passes the coach's list, with no exclamation mark and nothing left unfilled", () => {
    const hits = texts.flatMap(({ f, text }) => {
      const all = [text[0], text[1], ...text[2].flat()].join(' ');
      return [...bannedIn(all), ...(all.includes('!') ? ['!'] : []), ...(/undefined|NaN|\{\w+\}/.test(all) ? ['unfilled'] : [])].map(
        (hit) => `${f.id}: ${hit}`,
      );
    });
    expect(hits).toEqual([]);
  });

  it('every headline is said, and passes the list', () => {
    const verdict = arrangeCoachFindings(found.filter((f) => f.span === 1 && f.to === today), { today }).verdict;
    expect(verdict).toBeDefined();
    if (verdict !== undefined) expect(bannedIn(coachHeadlineText(verdict, fmt))).toEqual([]);
  });

  it('the same finding on the same day reads the same; the phrasing turns on the day', () => {
    const f = found.find((x) => x.kind === 'fix' && x.span === 1) as CoachFinding;
    expect(coachFindingText(f, fmt)).toEqual(coachFindingText({ ...f }, fmt));
    const bodies = new Set(
      Array.from({ length: 12 }, (_, i) => {
        const to = f.to.addDays(i);
        return coachFindingText({ ...f, id: `day:${to.epochDay}:${f.signal}:${f.kind}`, from: to, to }, fmt)[1];
      }),
    );
    expect(bodies.size).toBeGreaterThan(1);
  });
});
