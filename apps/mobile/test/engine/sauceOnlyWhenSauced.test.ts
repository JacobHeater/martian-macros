import { describe, expect, it } from 'vitest';
import type { CoachFinding } from '../../src/engine/analysis/CoachFinding';
import { analyseFoodDay } from '../../src/engine/analysis/food/analyseFoodDay';
import { sauced } from '../../src/engine/analysis/food/sauced';
import { food, inputOf, targets, today } from './support/foodAnalysis';

/**
 * MM-622: the owner's morning of 2026-10-25: biscuits and a breaded chicken fillet, logged as one meal, 2,522 mg of sodium
 * against a 1,800 mg limit by 9:30. Nothing was sauced, so nothing says "sauce on the side"; the biscuits, one of the
 * meal's foods, get the order.
 */
const tag = { key: 'breakfast-biscuits', name: 'Biscuits and chicken' };
const biscuits = 'Plain buttermilk biscuits, including one extra plain biscuit';
const fillet = 'Just Bare lightly breaded chicken breast original fillet';

const morning = () =>
  analyseFoodDay(
    inputOf(
      [
        {
          date: today,
          entries: [
            food(today, 'breakfast', biscuits, 700, 14, 32, { sodiumMg: 1900, loggedMeal: tag }),
            food(today, 'breakfast', fillet, 222, 28, 6, { sodiumMg: 622, loggedMeal: tag }),
          ],
        },
      ],
      {
        history: [targets(today.addDays(-200), { kcal: 2177, mode: 'fatLoss' })],
        sodium: { limitMg: 1800, since: today.addDays(-100) },
      },
    ),
    today,
    { nowMinute: 9 * 60 + 30 },
  );

const sodiumOf = (found: readonly CoachFinding[]) => found.find((f) => f.kind === 'fix' && f.signal === 'sodium');

describe('sauce on the side only for sauced food', () => {
  it('the tagger: sauced dishes are sauced; breaded, fried, or "excluding sauce" are not', () => {
    expect(sauced("General Tso's chicken")).toBe(true);
    expect(sauced('Sweet sesame-style chicken sauce')).toBe(true);
    expect(sauced(fillet)).toBe(false);
    expect(sauced(biscuits)).toBe(false);
    expect(sauced('Battered fried chicken pieces, excluding sauce and sesame garnish')).toBe(false);
  });

  it('the morning: sodium over, nothing sauced: no sauce order', () => {
    const sodium = sodiumOf(morning());
    expect(sodium).toBeDefined();
    expect((sodium?.advice ?? []).map((a) => a.kind)).not.toContain('sauceOnSide');
  });

  it("the morning: the biscuits, one of a meal logged as one, are swapped or halved on their own", () => {
    const order = (sodiumOf(morning())?.advice ?? []).find((a) => a.kind === 'swap' || a.kind === 'halve');
    expect(order?.food?.name).toBe(biscuits);
    expect(order?.mealName).toBe('Biscuits and chicken');
  });
});
