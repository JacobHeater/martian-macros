import { expect, it } from 'vitest';
import { BodyFatEstimate } from '../../src/engine';
import { bodyFatNote, bodyFatRangeText } from '../../src/format';

/** MM-34: body fat is a range and what it rests on, never one number from a formula. */
const estimate = new BodyFatEstimate({ percent: 24, sigmaPercent: 4 });

it('a range, named for what it rests on', () => {
  expect(bodyFatRangeText(estimate, 'formula')).toBe('16–32% (rough estimate)');
  expect(bodyFatRangeText(estimate, 'waist')).toBe('16–32% (from your waist)');
  expect(bodyFatRangeText(estimate, 'yourFigure')).toBe('~24% (your estimate)');
});

it('a rough range says what would narrow it', () => {
  expect(bodyFatNote('formula', { eatingDisorderHistory: false })).toBe('3 waist measurements within 4 weeks narrow this range.');
  expect(bodyFatNote('waist', { eatingDisorderHistory: false })).toMatch(/^From your height, weight and waist\./);
  expect(bodyFatNote('yourFigure', { eatingDisorderHistory: false })).toBeUndefined();
});

it('with an eating-disorder history it never asks for more measuring', () => {
  expect(bodyFatNote('formula', { eatingDisorderHistory: true })).toBeUndefined();
});
