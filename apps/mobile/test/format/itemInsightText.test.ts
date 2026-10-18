import { describe, expect, it } from 'vitest';
import { MuscleGroup } from '../../src/domain/training/MuscleGroup';
import { ItemAnchor } from '../../src/engine/ItemAnchor';
import type { ItemInsight } from '../../src/engine/ItemInsight';
import { itemInsightKinds } from '../../src/engine/itemInsightKinds';
import { Fmt } from '../../src/format/Fmt';
import { itemInsightText } from '../../src/format/itemInsightText';

const metric = new Fmt('metric');

/** Representative figures for each kind, so every kind's words are read. */
const examples: Readonly<Record<string, readonly Readonly<Record<string, number>>[]>> = {
  mostlyFat: [
    { kcal: 190, fatG: 16, proteinG: 7, fatShare: 0.76 },
    { kcal: 240, fatG: 27, proteinG: 0, fatShare: 1 },
  ],
  lightOnProtein: [
    { kcal: 520, proteinG: 9, proteinMinimumG: 140 },
    { kcal: 520, proteinG: 9 },
  ],
  portionCheck: [
    { kcal: 690, servings: 3, servingGrams: 55 },
    { kcal: 450, servings: 2 },
    { kcal: 80, servings: 100, servingGrams: 150 },
  ],
  strengthOnFatLoss: [
    { fromKg: 123.3, toKg: 122.2, heldDownToKg: 120.2, weeks: 6, sessions: 7, up: 0, inProgress: 0, startEpochDay: 20740 },
    { fromKg: 123.3, toKg: 132.6, heldDownToKg: 120.2, weeks: 9, sessions: 10, up: 1, inProgress: 0, startEpochDay: 20740 },
    { fromKg: 123.3, toKg: 122.2, heldDownToKg: 120.2, weeks: 6, sessions: 7, up: 0, inProgress: 1, startEpochDay: 20740 },
  ],
  waistWithinNoise: [{ fromCm: 92, toCm: 91.6, thresholdCm: 1.4, latestCm: 91.2, previousCm: 92.4, days: 28, differenceFactor: 1.4 }],
  waterFewDays: [
    { daysWithWater: 5, windowDays: 14, goalMl: 2500, suggested: 1 },
    { daysWithWater: 0, windowDays: 14, goalMl: 1800, suggested: 0 },
  ],
  volumeJump: MuscleGroup.values.flatMap((group, index) => [
    { group: index, weekSets: 14, usualSets: 9, inProgress: 0 },
    { group: index, weekSets: 12.5, usualSets: 6.25, inProgress: 1 },
  ]),
};

/**
 * MM-108 and MM-362: what an inline line may not say. With the panel's
 * additions for training (SA-8, CO-2, CO-4, CO-7): no injury, pain or
 * pushing, no deficit, and no appeal to what others do.
 */
const forbidden = [
  /\bgood\b/i, /\bbad\b/i, /\bclean\b/i, /\bjunk\b/i, /guilt/i, /\bearn/i, /burn off/i,
  /\btoday'?s? total\b/i, /\bover target\b/i, /\bwent over\b/i,
  /\bpain\b/i, /injur/i, /push through/i, /train more/i, /more sets/i, /no excuses/i, /overtrain/i, /\bstop\b/i,
  /maintenance/i, /deficit/i, /\bcut\b/i, /well-run/i, /\bcommon\b/i, /e1rm/i,
];

describe('the words of inline insights (MM-362)', () => {
  it('every kind the app has, has words and examples', () => {
    for (const kind of itemInsightKinds) expect(examples[kind.id], kind.id).toBeDefined();
  });

  for (const kind of itemInsightKinds) {
    it(`${kind.id}: a fact then a direction, about the item, with nothing forbidden`, () => {
      for (const figures of examples[kind.id] ?? []) {
        const insight: ItemInsight = { kind: kind.id, anchor: ItemAnchor.exercise(1, 'x'), subject: 'x', basis: 'pattern', figures };
        const text = itemInsightText(insight, metric);
        expect(text, kind.id).toBeDefined();
        const said = [text?.line ?? '', ...(text?.evidence ?? []).flat()].join(' ');
        for (const word of forbidden) expect(said, `${kind.id} says ${word}`).not.toMatch(word);
      }
    });
  }

  it('strength on fat loss claims nothing about muscle, eating or a figure of calories (MM-377)', () => {
    for (const figures of examples['strengthOnFatLoss'] ?? []) {
      const text = itemInsightText({ kind: 'strengthOnFatLoss', anchor: ItemAnchor.exercise(1, 'x'), subject: 'x', basis: 'pattern', figures }, metric);
      const said = [text?.line ?? '', ...(text?.evidence ?? []).flat()].join(' ');
      for (const word of [/muscle/i, /\bmass\b/i, /body composition/i, /preserved/i, /kept your/i, /\bworking\b/i, /\beating\b/i, /kcal/i, /\bweight\b/i]) {
        expect(said, `says ${word}`).not.toMatch(word);
      }
      expect(text?.line.includes('training is doing')).toBe(figures['inProgress'] !== 1);
    }
  });

  it('says halves as weekly volume does and the usual week in whole sets', () => {
    const text = itemInsightText({ kind: 'volumeJump', anchor: ItemAnchor.exercise(1, 'x'), subject: 'x', basis: 'pattern', figures: { group: 0, weekSets: 12.5, usualSets: 6.25, inProgress: 1 } }, metric);
    expect(text?.line).toMatch(/^12\.5 sets for chest in the 7 days before this workout\. Your usual is about 6 a week\./);
  });

  it('has no words for a kind it does not know, so nothing is shown', () => {
    expect(itemInsightText({ kind: 'retired', anchor: ItemAnchor.exercise(1, 'x'), subject: 'x', basis: 'item', figures: {} }, metric)).toBeUndefined();
  });
});
