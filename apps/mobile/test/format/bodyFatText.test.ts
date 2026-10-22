import { expect, it } from 'vitest';
import { BodyFatEstimate } from '../../src/engine';
import { bodyFatNote, bodyFatRangeText } from '../../src/format';

/** MM-34: body fat is a range and what it rests on, never one number from a formula. */
const estimate = new BodyFatEstimate({ percent: 24, sigmaPercent: 4 });

it('a range, named for what it rests on', () => {
  expect(bodyFatRangeText(estimate, 'formula')).toBe('16–32% (rough estimate)');
  expect(bodyFatRangeText(estimate, 'waist')).toBe('16–32% (from your waist)');
  expect(bodyFatRangeText(estimate, 'yourFigure')).toBe('~24% (your estimate)');
  // MM-502: a smart scale's settled readings.
  expect(bodyFatRangeText(estimate, 'scale')).toBe('16–32% (from your scale)');
});

it('a range from the scale says that averaging removes scatter, not a scale’s fixed bias (MM-502)', () => {
  expect(bodyFatNote('scale', { eatingDisorderHistory: false })).toBe(
    'Your scale’s readings over weeks join your height and weight. Averaging removes the day-to-day scatter, not a scale’s fixed bias, so it stays a range.',
  );
});

it('a rough range says what would narrow it', () => {
  expect(bodyFatNote('formula', { eatingDisorderHistory: false })).toBe('3 waist measurements within 4 weeks narrow this range.');
  expect(bodyFatNote('waist', { eatingDisorderHistory: false })).toMatch(/^From your height, weight and waist\./);
  expect(bodyFatNote('yourFigure', { eatingDisorderHistory: false })).toBeUndefined();
});

it('with an eating-disorder history it never asks for more measuring', () => {
  expect(bodyFatNote('formula', { eatingDisorderHistory: true })).toBeUndefined();
});

it('a range with the Navy tape says it rests on the tape, and how (MM-501)', () => {
  expect(bodyFatRangeText(estimate, 'tape')).toBe('16–32% (from your tape)');
  expect(bodyFatNote('tape', { eatingDisorderHistory: false })).toMatch(/^From your height, weight, waist and neck, and hips for women, by the Navy tape method\./);
});
