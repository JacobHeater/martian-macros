import { describe, expect, it } from 'vitest';
import { arrangeCoachFindings } from '../../src/engine/analysis/arrangeCoachFindings';
import type { CoachFinding } from '../../src/engine/analysis/CoachFinding';
import { analyseFoodDay } from '../../src/engine/analysis/food/analyseFoodDay';
import { coachAdviceText } from '../../src/format/coach/coachAdviceText';
import { coachFindingText } from '../../src/format/coach/coachFindingText';
import { coachHeadlineText } from '../../src/format/coach/coachHeadlineText';
import { coachPhrasings } from '../../src/format/coach/coachPhrasings';
import type { CoachPhrasingSlot } from '../../src/format/coach/CoachPhrasingSlot';
import { phrasingIndex } from '../../src/format/coach/phrasingIndex';
import { Fmt } from '../../src/format/Fmt';
import { buffetDayInput, buffetDayMinute } from '../engine/support/buffetDay';
import { today } from '../engine/support/foodAnalysis';

/**
 * MM-617's voice standard, line for line: the owner's buffet day of
 * 2026-10-24 at 7:40 pm, as the coach's grammar words it. Where the
 * standard has a placeholder, the line has the computed figure: the swap's
 * from `swapFor` (two eggs on an English muffin with a slice of cheese:
 * 390 kcal, 24 g protein, 20 g fat, so "less than half the fat"; steamed
 * chicken with mixed vegetables at 265 kcal), and the meal's best protein
 * for its calories (steamed chicken with vegetables, which has its
 * vegetables, so "and steamed vegetables" is not said twice).
 */
const fmt = new Fmt('metric');
const found = analyseFoodDay(buffetDayInput(), today, { nowMinute: buffetDayMinute });
const sections = arrangeCoachFindings(found, { today });
const of = (signal: string, kind: CoachFinding['kind'] = 'fix') => found.find((f) => f.signal === signal && f.kind === kind) as CoachFinding;
const body = (f: CoachFinding) => coachFindingText(f, fmt)[1];
const title = (f: CoachFinding) => coachFindingText(f, fmt)[0];

const calories = of('fatAgainstTarget');
const left = of('left', 'left');
const sodium = of('sodium');
const density = of('proteinDensity');
const fiber = of('fiber');
const protein = of('proteinMinimum', 'holdingUp');
const close = of('backToPlan', 'close');

describe('the phrasings the buffet day picks are pinned', () => {
  // The slot, the finding whose id and day pick it, and the phrasing the owner's standard reads.
  const pinned: readonly (readonly [CoachPhrasingSlot, CoachFinding, number])[] = [
    ['headlineOver', close, 1],
    ['headlineCause', close, 0],
    ['causeMeal', calories, 1],
    ['causeLoggedMeal', calories, 0],
    ['shareWholeDayWords', calories, 0],
    ['worstFood', calories, 1],
    ['orderSkipSpoonful', calories, 0],
    ['orderKeepWithVegetables', calories, 2],
    ['orderSwapIn', calories, 1],
    ['consequenceOver', calories, 1],
    ['orderLimit', left, 2],
    ['orderNoSauce', left, 2],
    ['leadSodiumMultiple', sodium, 2],
    ['causeFoods', sodium, 0],
    ['orderWater', sodium, 0],
    ['orderSauceOnSide', sodium, 2],
    ['leadDensity', density, 0],
    ['swapFoodAtMeal', density, 2],
    ['orderSwap', density, 1],
    ['lowProteinFood', density, 0],
    ['lowProteinVerdict', density, 1],
    ['orderSkipLowProtein', density, 1],
    ['leadFiberDay', fiber, 2],
    ['fiberNoVegetables', fiber, 2],
    ['orderVegetablesAt', fiber, 2],
    ['leadProteinHeld', protein, 1],
    ['holdKeep', protein, 0],
    ['close', close, 1],
  ];
  for (const [slot, f, at] of pinned) {
    it(`${slot} on ${f.id}: phrasing ${at}`, () => {
      expect(phrasingIndex(`${slot}|${f.id}|${f.to.epochDay}`, coachPhrasings[slot].length)).toBe(at);
    });
  }
});

describe("the voice standard, sentence by sentence (MM-617's Decisions)", () => {
  it('"1,054 kcal over. The buffet did it."', () => {
    expect(sections.verdict).toBeDefined();
    if (sections.verdict === undefined) return;
    expect(coachHeadlineText(sections.verdict, fmt)).toBe('1,054 kcal over. The buffet did it.');
  });

  it('"Lunch was the problem."', () => expect(body(calories)).toMatch(/^Lunch was the problem\. /));

  it(`"The Chinese buffet: 2,368 kcal, more than your whole day's 2,175."`, () => {
    expect(body(calories)).toContain("Lunch was the problem. The Chinese buffet: 2,368 kcal, more than your whole day's 2,175. ");
  });

  it(`"General Tso's chicken was the worst of it: 744 kcal, 33 g fat."`, () => {
    expect(body(calories)).toContain("General Tso's chicken was the worst of it: 744 kcal, 33 g fat. ");
  });

  it('"Skip it next time, or take one spoonful."', () => expect(body(calories)).toContain(' Skip it next time, or take one spoonful. '));

  it('"Fill the plate with steamed chicken with vegetables first."', () => {
    expect(body(calories)).toContain(' Fill the plate with steamed chicken with vegetables first. ');
  });

  it("the swap from swapFor: steamed chicken with mixed vegetables, sauce on the side, at 265 kcal", () => {
    expect(body(calories)).toContain(' Swap in steamed chicken with mixed vegetables, sauce on the side: about 265 kcal, 35 g protein, 4 g fat. ');
  });

  it(`"Without the General Tso's chicken you'd be 310 kcal over, not 1,054."`, () => {
    expect(body(calories)).toMatch(/ Without the General Tso's chicken you'd be 310 kcal over, not 1,054\.$/);
  });

  it('"You\'re done eating for today. If you\'re hungry, dinner under 400 kcal: lean protein and vegetables. No sauce."', () => {
    expect(body(left)).toBe("You're done eating for today. If you're hungry, dinner under 400 kcal: lean protein and vegetables. No sauce.");
  });

  it('"Sodium 6,923 mg, 3.8× your 1,800 limit."', () => expect(body(sodium)).toMatch(/^Sodium 6,923 mg, 3\.8× your 1,800 limit\. /));

  it(`"General Tso's chicken did it."`, () => expect(body(sodium)).toContain(" General Tso's chicken did it. "));

  it('"Drink water tonight."', () => expect(body(sodium)).toContain(' Drink water tonight. '));

  it('"Next time: sauce on the side."', () => expect(body(sodium)).toMatch(/ Next time: sauce on the side\.$/));

  it('"Breakfast: the sausage egg and cheese biscuit with extra eggs, 691 kcal, 45 g fat."', () => {
    expect(body(density)).toContain(' Breakfast: the sausage egg and cheese biscuit with extra eggs, 691 kcal, 45 g fat. ');
  });

  it('"Swap it for two eggs on an English muffin with a slice of cheese: about 390 kcal, 24 g protein, less than half the fat."', () => {
    expect(body(density)).toContain(
      ' Swap it for two eggs on an English muffin with a slice of cheese: about 390 kcal, 24 g protein, less than half the fat. ',
    );
  });

  it('"Fiber 14 g of 30."', () => expect(body(fiber)).toMatch(/^Fiber 14 g of 30\. /));

  it('"You ate almost no vegetables."', () => expect(body(fiber)).toContain(' You ate almost no vegetables. '));

  it('"Two cups at dinner."', () => expect(body(fiber)).toMatch(/ Two cups at dinner\.$/));

  it('"Cookie butter: 170 kcal, 1 g protein."', () => expect(body(density)).toContain(' Cookie butter: 170 kcal, 1 g protein. '));

  it('"Does nothing for your goal."', () => expect(body(density)).toContain(' Does nothing for your goal. '));

  it('"Skip it."', () => expect(body(density)).toMatch(/ Does nothing for your goal\. Skip it\.$/));

  it('"Protein 155 g. Minimum hit. Keep that."', () => expect(body(protein)).toBe('Protein 155 g. Minimum hit. Keep that.'));

  it('"Tomorrow: back to 2,175. Don\'t skip meals to make up for today."', () => {
    expect(body(close)).toBe("Tomorrow: back to 2,175. Don't skip meals to make up for today.");
  });
});

describe('the whole of each line, and its title', () => {
  it('the calorie line', () => {
    expect(title(calories)).toBe('1,054 kcal over today');
    expect(body(calories)).toBe(
      "Lunch was the problem. The Chinese buffet: 2,368 kcal, more than your whole day's 2,175. General Tso's chicken was " +
        'the worst of it: 744 kcal, 33 g fat. Skip it next time, or take one spoonful. Fill the plate with steamed chicken ' +
        'with vegetables first. Swap in steamed chicken with mixed vegetables, sauce on the side: about 265 kcal, 35 g ' +
        "protein, 4 g fat. Without the General Tso's chicken you'd be 310 kcal over, not 1,054.",
    );
  });

  it('what is left', () => expect(title(left)).toBe('No calories left: 1,054 kcal over'));

  it('sodium', () => {
    expect(title(sodium)).toBe('Sodium 6,923 mg so far, over 1,800 mg');
    expect(body(sodium)).toBe(
      "Sodium 6,923 mg, 3.8× your 1,800 limit. General Tso's chicken did it. Drink water tonight. Next time: sauce on the side.",
    );
  });

  it('protein per 100 kcal: the biscuit swapped, the cookie butter skipped', () => {
    expect(title(density)).toBe('155 g protein in 3,229 kcal so far');
    expect(body(density)).toBe(
      '4.8 g protein per 100 kcal. You need 8.6 g. Breakfast: the sausage egg and cheese biscuit with extra eggs, 691 kcal, ' +
        '45 g fat. Swap it for two eggs on an English muffin with a slice of cheese: about 390 kcal, 24 g protein, less than ' +
        'half the fat. Cookie butter: 170 kcal, 1 g protein. Does nothing for your goal. Skip it.',
    );
  });

  it('fiber', () => {
    expect(title(fiber)).toBe('Fiber 14 g of 30 g');
    expect(body(fiber)).toBe('Fiber 14 g of 30. You ate almost no vegetables. Two cups at dinner.');
  });

  it('protein held, and the close', () => {
    expect(title(protein)).toBe('Protein 155 g, minimum hit');
    expect(title(close)).toBe('Tomorrow: back to 2,175 kcal');
  });

  it('no line restates a number without an order: every fix ends in its last order', () => {
    for (const f of found.filter((x) => x.kind === 'fix')) {
      const { orders, sentences } = coachAdviceText(f, fmt);
      expect(orders.length, f.signal).toBeGreaterThan(0);
      const last = sentences[sentences.length - 1] ?? '';
      // The calorie line ends in what the day would have been without the food it ordered skipped.
      expect(body(f).endsWith(last), f.signal).toBe(true);
      for (const order of orders) expect(body(f), f.signal).toContain(order);
    }
  });
});

describe('safety holds: an eating-disorder history on the buffet day', () => {
  const protectedDay = analyseFoodDay(buffetDayInput({ eatingDisorderHistory: true }), today, { nowMinute: buffetDayMinute });

  it('protein lines only, said calmly, and nothing to eat less', () => {
    const texts = protectedDay.map((f) => coachFindingText(f, fmt).flat(2).join(' '));
    expect(protectedDay.map((f) => f.signal).sort()).toEqual(['left', 'proteinMinimum']);
    for (const text of texts) expect(text).not.toMatch(/kcal|calorie|skip|swap|halve|under \d|done eating|no sauce|fat/i);
    const leftText = coachFindingText(protectedDay.find((f) => f.kind === 'left') as CoachFinding, fmt)[1];
    expect(leftText).toMatch(/^32 g (of protein left|protein to go) today\. (A protein food at your next meal covers it|Your next meal can carry it: a protein food)\.$/);
  });
});
