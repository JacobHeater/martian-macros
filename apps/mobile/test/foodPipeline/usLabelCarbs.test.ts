import { expect, it } from 'vitest';
import { usLabelCarbs } from '../../src/foodPipeline/usLabelCarbs';

/** MM-397, the panel's NU-1: an EU label's available carbohydrate is made a US total, so net carbs take fiber once. */
const oats = { kcal: 372, proteinG: 13.5, fatG: 7, fiberG: 10 };

it('keeps a US label total as it is', () => {
  expect(usLabelCarbs({ label: 'us', ...oats, carbsG: 59 })).toBe(59);
});

it('adds fiber back when the calories agree with available carbohydrate', () => {
  // 4 × 13.5 + 4 × 59 + 9 × 7 + 2 × 10 = 373, against 4 × 13.5 + 4 × 59 + 9 × 7 = 353.
  expect(usLabelCarbs({ label: 'unknown', ...oats, carbsG: 59 })).toBe(69);
});

it('keeps the figure when the calories agree with a total', () => {
  // 4 × 13.5 + 4 × 64 + 9 × 7 = 373: already a total.
  expect(usLabelCarbs({ label: 'unknown', ...oats, carbsG: 64 })).toBe(64);
});

it('changes nothing it cannot judge', () => {
  expect(usLabelCarbs({ label: 'unknown', ...oats, carbsG: 59, fiberG: undefined })).toBe(59);
  expect(usLabelCarbs({ label: 'unknown', ...oats, carbsG: 59, kcal: undefined })).toBe(59);
  expect(usLabelCarbs({ label: 'unknown', ...oats, carbsG: undefined })).toBeUndefined();
});
