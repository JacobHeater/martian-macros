import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { EvidenceRegister } from '../../src/domain';
import { itemInsightKinds } from '../../src/engine/itemInsightKinds';
import { FoodInsightRule } from '../../src/engine/FoodInsightRule';
import { StrengthOnFatLossRule } from '../../src/engine/StrengthOnFatLossRule';
import { VolumeJumpRule } from '../../src/engine/VolumeJumpRule';
import { WaistRule } from '../../src/engine/WaistRule';
import { WaterFewDaysRule } from '../../src/engine/WaterFewDaysRule';

/**
 * MM-362: every kind of inline insight has a row in the evidence register
 * (MM-143) before it ships, and so does every figure it turns on.
 */
it('every kind of inline insight and its figures has an evidence row', () => {
  const register = EvidenceRegister.parse(readFileSync('../../docs/evidence.md', 'utf8'));
  const registered = new Set(register.rows.map((row) => row.name));
  const expected = [
    ...itemInsightKinds.map((kind) => kind.id),
    ...Object.keys(VolumeJumpRule).map((name) => `VolumeJumpRule.${name}`),
    ...Object.keys(StrengthOnFatLossRule).map((name) => `StrengthOnFatLossRule.${name}`),
    'deficitStartOn',
    'GapRule.deficitBreakDays',
    'PauseRule.deficitBreakDays',
    'estimatedOneRepMax',
    'buildStrengthTrends.smoothing',
    ...Object.keys(FoodInsightRule).map((name) => `FoodInsightRule.${name}`),
    ...Object.keys(WaistRule).map((name) => `WaistRule.${name}`),
    ...Object.keys(WaterFewDaysRule).map((name) => `WaterFewDaysRule.${name}`),
    'countHardSets',
    'usualServing',
  ];
  expect(itemInsightKinds.length).toBeGreaterThan(0);
  expect(expected.filter((name) => !registered.has(name)), 'Add an evidence row for each.').toEqual([]);
});
