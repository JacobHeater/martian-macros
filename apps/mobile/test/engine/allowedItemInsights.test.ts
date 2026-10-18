import { describe, expect, it } from 'vitest';
import { InsightSwitches } from '../../src/domain/InsightSwitches';
import { allowedItemInsights } from '../../src/engine/allowedItemInsights';
import type { InsightSafeguards } from '../../src/engine/InsightSafeguards';
import { ItemAnchor } from '../../src/engine/ItemAnchor';
import type { ItemInsight } from '../../src/engine/ItemInsight';
import type { ItemInsightKind } from '../../src/engine/ItemInsightKind';

/** A catalog to test the filter with: one kind of each sort the safeguards treat differently. */
const kinds: readonly ItemInsightKind[] = [
  { id: 'lightProtein', area: 'food', title: 'Light on protein', example: '', priority: 'pattern' },
  { id: 'mostlyFat', area: 'food', title: 'Mostly fat', example: '', priority: 'pattern', notWithEatingDisorderHistory: true },
  { id: 'weighInTime', area: 'body', title: 'Unusual weigh-in time', example: '', priority: 'dataQuality', aboutWeight: true },
  { id: 'volumeJump', area: 'training', title: 'Volume jump', example: '', priority: 'safety' },
  { id: 'steady', area: 'training', title: 'Steady', example: '', priority: 'pattern' },
];

const adult: InsightSafeguards = { adult: true, eatingDisorderHistory: false, weightHidden: false, paused: false };
const peanutButter = { kind: 'foodEntry', id: '7' } as const;
const bench = ItemAnchor.exercise(3, 'barbell-bench-press');
const weighIn = { kind: 'weighIn', id: '2026-10-17' } as const;
const insight = (kind: string, anchor: ItemAnchor): ItemInsight => ({ kind, anchor, basis: 'item', figures: {} });

const shown = (insights: readonly ItemInsight[], safeguards = adult, switches = InsightSwitches.allOn) =>
  [...allowedItemInsights({ insights, kinds, safeguards, switches }).values()].map((i) => i.kind).sort();

const everyKind = [
  insight('lightProtein', { kind: 'foodEntry', id: '1' }),
  insight('mostlyFat', peanutButter),
  insight('weighInTime', weighIn),
  insight('volumeJump', bench),
];

describe('allowedItemInsights (MM-362, MM-364)', () => {
  it('shows every qualifying item, each its own', () => {
    const three = ['1', '2', '3'].map((id) => insight('mostlyFat', { kind: 'foodEntry', id }));
    expect(allowedItemInsights({ insights: three, kinds, safeguards: adult, switches: InsightSwitches.allOn }).size).toBe(3);
  });

  it('shows one per item: the higher priority wins', () => {
    const map = allowedItemInsights({
      insights: [insight('steady', bench), insight('volumeJump', bench)],
      kinds,
      safeguards: adult,
      switches: InsightSwitches.allOn,
    });
    expect(map.get(ItemAnchor.key(bench))?.kind).toBe('volumeJump');
  });

  it('settles a tie of priority by the catalog order', () => {
    const map = allowedItemInsights({
      insights: [insight('mostlyFat', peanutButter), insight('lightProtein', peanutButter)],
      kinds,
      safeguards: adult,
      switches: InsightSwitches.allOn,
    });
    expect(map.get(ItemAnchor.key(peanutButter))?.kind).toBe('lightProtein');
  });

  it('with an eating-disorder history, leaves out weight and food composition, and keeps protein and training', () => {
    expect(shown(everyKind, { ...adult, eatingDisorderHistory: true })).toEqual(['lightProtein', 'volumeJump']);
  });

  it('shows nothing under 18', () => {
    expect(shown(everyKind, { ...adult, adult: false })).toEqual([]);
  });

  it('with weight hidden, leaves out what mentions weight only', () => {
    expect(shown(everyKind, { ...adult, weightHidden: true })).toEqual(['lightProtein', 'mostlyFat', 'volumeJump']);
  });

  it('shows nothing while coaching is paused', () => {
    expect(shown(everyKind, { ...adult, paused: true })).toEqual([]);
  });

  it('shows nothing with every insight switched off', () => {
    expect(shown(everyKind, adult, { ...InsightSwitches.allOn, all: false })).toEqual([]);
  });

  it('leaves out a kind switched off, and keeps the rest of its area', () => {
    expect(shown(everyKind, adult, { ...InsightSwitches.allOn, offKinds: new Set(['mostlyFat']) })).toEqual([
      'lightProtein',
      'volumeJump',
      'weighInTime',
    ]);
  });

  it('leaves out an area switched off', () => {
    expect(shown(everyKind, adult, { ...InsightSwitches.allOn, offAreas: new Set(['food']) })).toEqual(['volumeJump', 'weighInTime']);
  });

  it('leaves out a kind the catalog does not have', () => {
    expect(shown([insight('retired', bench)])).toEqual([]);
  });
});
