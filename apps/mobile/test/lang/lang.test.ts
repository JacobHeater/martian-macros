import { describe, expect, it } from 'vitest';
import { roundHalfAwayFromZero } from '../../src/lang/roundHalfAwayFromZero';
import { tryParseDouble } from '../../src/lang/tryParseDouble';

/**
 * MM-230: the two places JavaScript's own arithmetic differs from Dart's.
 * The expected values are what the Dart VM gives for the same inputs.
 */
describe('rounding as Dart rounds', () => {
  it('sends a half away from zero in both directions', () => {
    expect(roundHalfAwayFromZero(2.5)).toBe(3);
    expect(roundHalfAwayFromZero(-2.5)).toBe(-3);
    expect(roundHalfAwayFromZero(0.5)).toBe(1);
    expect(roundHalfAwayFromZero(-0.5)).toBe(-1);
    expect(roundHalfAwayFromZero(2.4)).toBe(2);
    expect(roundHalfAwayFromZero(-2.4)).toBe(-2);
  });
});

describe('reading a number as Dart reads one', () => {
  it('accepts what Dart accepts', () => {
    expect(tryParseDouble('12.')).toBe(12);
    expect(tryParseDouble('.5')).toBe(0.5);
    expect(tryParseDouble(' 3 ')).toBe(3);
    expect(tryParseDouble('1e3')).toBe(1000);
    expect(tryParseDouble('+2')).toBe(2);
  });

  it('refuses what JavaScript would let through', () => {
    expect(tryParseDouble('')).toBeUndefined();
    expect(tryParseDouble('12abc')).toBeUndefined();
    expect(tryParseDouble('0x10')).toBeUndefined();
    expect(tryParseDouble('1..2')).toBeUndefined();
  });
});
