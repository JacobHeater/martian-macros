import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InsightSwitches } from '../../src/domain/InsightSwitches';
import { allowedItemInsights } from '../../src/engine/allowedItemInsights';
import type { InsightSafeguards } from '../../src/engine/InsightSafeguards';
import type { InsightSnooze } from '../../src/engine/InsightSnooze';
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
  { id: 'portion', area: 'food', title: 'Portion', example: '', priority: 'dataQuality', notWhileUnderEating: true, notWithCautions: ['underweight'] },
  { id: 'protein', area: 'food', title: 'Protein', example: '', priority: 'pattern', notWithCautions: ['bariatricSurgery', 'chronicKidneyDisease'] },
];

const adult: InsightSafeguards = { adult: true, eatingDisorderHistory: false, weightHidden: false, paused: false, underEating: false, cautions: new Set() };
const peanutButter = { kind: 'foodEntry', id: '7' } as const;
const bench = ItemAnchor.exercise(3, 'barbell-bench-press');
const weighIn = { kind: 'weighIn', id: '2026-10-17' } as const;
const today = CalendarDate.of(2026, 10, 18);
const insight = (kind: string, anchor: ItemAnchor): ItemInsight => ({ kind, anchor, subject: anchor.id, basis: 'item', figures: {} });

const shown = (insights: readonly ItemInsight[], safeguards = adult, switches = InsightSwitches.allOn, snoozes: readonly InsightSnooze[] = []) =>
  [...allowedItemInsights({ insights, kinds, safeguards, switches, snoozes, today }).values()].flat().map((i) => i.kind).sort();

const everyKind = [
  insight('lightProtein', { kind: 'foodEntry', id: '1' }),
  insight('mostlyFat', peanutButter),
  insight('weighInTime', weighIn),
  insight('volumeJump', bench),
];

describe('allowedItemInsights (MM-362, MM-364, MM-393)', () => {
  it('shows every qualifying item, each its own', () => {
    const three = ['1', '2', '3'].map((id) => insight('mostlyFat', { kind: 'foodEntry', id }));
    expect(allowedItemInsights({ insights: three, kinds, safeguards: adult, switches: InsightSwitches.allOn, today }).size).toBe(3);
  });

  // MM-393: one rule never hides another; the owner saw a portion check hide a protein line.
  it('shows every rule that holds on an item, the higher priority first', () => {
    const map = allowedItemInsights({
      insights: [insight('steady', bench), insight('volumeJump', bench)],
      kinds,
      safeguards: adult,
      switches: InsightSwitches.allOn,
      today,
    });
    expect(map.get(ItemAnchor.key(bench))?.map((i) => i.kind)).toEqual(['volumeJump', 'steady']);
  });

  it('orders a tie of priority by the catalog', () => {
    const map = allowedItemInsights({
      insights: [insight('mostlyFat', peanutButter), insight('lightProtein', peanutButter)],
      kinds,
      safeguards: adult,
      switches: InsightSwitches.allOn,
      today,
    });
    expect(map.get(ItemAnchor.key(peanutButter))?.map((i) => i.kind)).toEqual(['lightProtein', 'mostlyFat']);
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

  it('leaves out a kind snoozed on its item, and keeps it on other items (MM-378)', () => {
    const snoozed: InsightSnooze = { kind: 'mostlyFat', subject: peanutButter.id, item: 'Peanut butter', resumesOn: today.addDays(2) };
    const two = [insight('mostlyFat', peanutButter), insight('mostlyFat', { kind: 'foodEntry', id: '8' })];
    expect(shown(two, adult, InsightSwitches.allOn, [snoozed])).toEqual(['mostlyFat']);
    expect(shown([insight('lightProtein', peanutButter)], adult, InsightSwitches.allOn, [snoozed])).toEqual(['lightProtein']);
  });

  it('a snooze that has run out no longer quiets; one for always does (MM-378)', () => {
    const over: InsightSnooze = { kind: 'mostlyFat', subject: peanutButter.id, item: 'Peanut butter', resumesOn: today };
    const always: InsightSnooze = { ...over, resumesOn: undefined };
    expect(shown([insight('mostlyFat', peanutButter)], adult, InsightSwitches.allOn, [over])).toEqual(['mostlyFat']);
    expect(shown([insight('mostlyFat', peanutButter)], adult, InsightSwitches.allOn, [always])).toEqual([]);
  });

  it('while the under-eating finding holds, leaves out what is flagged for it (MM-365)', () => {
    const two = [insight('portion', peanutButter), insight('protein', { kind: 'foodEntry', id: '2' })];
    expect(shown(two, { ...adult, underEating: true })).toEqual(['protein']);
  });

  it('leaves out a kind flagged for one of the person’s cautions (MM-365)', () => {
    const two = [insight('portion', peanutButter), insight('protein', { kind: 'foodEntry', id: '2' })];
    expect(shown(two, { ...adult, cautions: new Set(['chronicKidneyDisease']) })).toEqual(['portion']);
    expect(shown(two, { ...adult, cautions: new Set(['underweight']) })).toEqual(['protein']);
    expect(shown(two, { ...adult, cautions: new Set(['pcos']) })).toEqual(['portion', 'protein']);
  });

  it('leaves out a kind the catalog does not have', () => {
    expect(shown([insight('retired', bench)])).toEqual([]);
  });
});
