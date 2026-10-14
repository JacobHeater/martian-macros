import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { microsDayOf } from '../../src/domain/food/micros/microsDayOf';
import { referenceAmount } from '../../src/domain/food/micros/referenceAmount';
import { ReferenceWithheld } from '../../src/domain/food/micros/ReferenceWithheld';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { Profile } from '../../src/domain/Profile';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { nutrientAmount } from '../../src/format/nutrientAmount';
import { waterAmount } from '../../src/format/waterAmount';

/** MM-310: the reference amounts, when they are withheld, and the day's totals with their coverage. */

// The US DRIs for adults (NASEM, as reproduced by Health Canada's tables), at every band edge.
const table: readonly (readonly [number, number, Record<string, number>, Record<string, number>])[] = [
  // age, (ignored), male, female
  [19, 0, { potassium: 3400, calcium: 1000, iron: 8, magnesium: 400, zinc: 11, vitaminA: 900, vitaminC: 90, vitaminD: 15 }, { potassium: 2600, calcium: 1000, iron: 18, magnesium: 310, zinc: 8, vitaminA: 700, vitaminC: 75, vitaminD: 15 }],
  [30, 0, { magnesium: 400 }, { magnesium: 310, iron: 18 }],
  [31, 0, { magnesium: 420 }, { magnesium: 320 }],
  [50, 0, { calcium: 1000 }, { calcium: 1000, iron: 18 }],
  [51, 0, { calcium: 1000, iron: 8 }, { calcium: 1200, iron: 8 }],
  [70, 0, { calcium: 1000, vitaminD: 15 }, { vitaminD: 15 }],
  [71, 0, { calcium: 1200, vitaminD: 20 }, { calcium: 1200, vitaminD: 20 }],
];

it('the reference amounts match the DRI tables at every band edge', () => {
  for (const [age, , male, female] of table) {
    for (const [n, amount] of Object.entries(male)) {
      expect(referenceAmount(n as never, { sex: 'male', age }), `${n}, man of ${age}`).toBe(amount);
    }
    for (const [n, amount] of Object.entries(female)) {
      expect(referenceAmount(n as never, { sex: 'female', age }), `${n}, woman of ${age}`).toBe(amount);
    }
  }
  expect(referenceAmount('vitaminB12', { sex: 'female', age: 40 })).toBe(2.4);
  expect(referenceAmount('folate', { sex: 'male', age: 40 })).toBe(400);
});

it('sodium, sugars, saturated fat and cholesterol have no reference, and nothing does under 19', () => {
  for (const n of ['sodium', 'sugars', 'saturatedFat', 'cholesterol'] as const) {
    expect(referenceAmount(n, { sex: 'male', age: 40 })).toBeUndefined();
  }
  expect(referenceAmount('iron', { sex: 'female', age: 18 })).toBeUndefined();
});

const today = CalendarDate.of(2026, 10, 14);
const setup = (screening: ConstructorParameters<typeof ScreeningAnswers>[0] = {}, birthYear = 1990) =>
  typicalSetup({ sex: 'female', screening: new ScreeningAnswers(screening) }).copyWith({
    profile: new Profile({ sex: 'female', birthDate: CalendarDate.of(birthYear, 1, 1), heightCm: 165 }),
  });

it('the references are withheld for each reason, pregnancy first', () => {
  expect(ReferenceWithheld.of(setup(), today)).toBeUndefined();
  expect(ReferenceWithheld.of(setup({ pregnant: true }), today)).toBe('careTeam');
  expect(ReferenceWithheld.of(setup({ breastfeeding: true }), today)).toBe('careTeam');
  expect(ReferenceWithheld.of(setup({ chronicKidneyDisease: true }), today)).toBe('kidney');
  expect(ReferenceWithheld.of(setup({ bariatricSurgery: true }), today)).toBe('surgery');
  expect(ReferenceWithheld.of(setup({ pregnant: true, chronicKidneyDisease: true }), today)).toBe('careTeam');
  expect(ReferenceWithheld.of(setup({}, 2008), today)).toBe('young'); // 18
  expect(ReferenceWithheld.of(setup({}, 2007), today)).toBeUndefined(); // 19
});

const entry = (micros: Micronutrients, sodiumMg?: number) =>
  new FoodEntry({ id: 0, date: today, meal: 'lunch', name: 'x', kcal: 100, proteinG: 1, carbsG: 1, fatG: 1, source: 'weighed', sodiumMg, micros });

it('a food stating 0 counts as stating it; a food stating nothing adds nothing and is not counted', () => {
  const totals = microsDayOf([
    entry(new Micronutrients({ potassium: 300, cholesterol: 0 }), 100),
    entry(new Micronutrients({ potassium: 200 })),
    entry(Micronutrients.none),
  ]);
  const of = (n: string) => totals.find((t) => t.nutrient === n);
  expect(of('potassium')).toMatchObject({ known: 500, stated: 2, foods: 3 });
  expect(of('potassium')?.partial).toBe(true);
  expect(of('cholesterol')).toMatchObject({ known: 0, stated: 1 });
  expect(of('cholesterol')?.noData).toBe(false);
  expect(of('iron')?.noData).toBe(true);
  expect(of('sodium')).toMatchObject({ known: 100, stated: 1 });
  expect(of('sodium')?.over(99)).toBe(true);
  expect(of('sodium')?.over(100)).toBe(false);
});

it('an entry keeps sodium in one place, its field winning', () => {
  const e = entry(new Micronutrients({ sodium: 50 }), 80);
  expect(e.sodiumMg).toBe(80);
  expect(e.micros.of('sodium')).toBe(80);
  expect(entry(new Micronutrients({ sodium: 50 })).sodiumMg).toBe(50);
});

it('scaling keeps unknown unknown', () => {
  const m = new Micronutrients({ potassium: 358, folate: 20 }).times(1.5);
  expect(m.of('potassium')).toBe(537);
  expect(m.of('calcium')).toBeUndefined();
  expect(m.count).toBe(2);
});

it('amounts are written in their units, micrograms under 10 with a decimal', () => {
  expect(nutrientAmount('potassium', 2900)).toBe('2,900 mg');
  expect(nutrientAmount('vitaminB12', 2.4)).toBe('2.4 µg');
  expect(nutrientAmount('vitaminD', 15)).toBe('15 µg');
  expect(nutrientAmount('sugars', 49.4)).toBe('49 g');
});

it('water is written in litres or whole fluid ounces (MM-313)', () => {
  expect(waterAmount(250, 'metric')).toBe('0.25 L');
  expect(waterAmount(2500, 'metric')).toBe('2.5 L');
  expect(waterAmount(2000, 'metric')).toBe('2 L');
  expect(waterAmount(500, 'imperial')).toBe('17 fl oz');
});
