import { expect, it } from 'vitest';
import { tryParseInt } from '../../src/lang/tryParseInt';

// Added in the move: what Dart's int.tryParse takes and refuses.
it('reads whole numbers as Dart does and refuses everything else', () => {
  expect(tryParseInt('12')).toBe(12);
  expect(tryParseInt(' -3 ')).toBe(-3);
  expect(tryParseInt('+7')).toBe(7);
  expect(tryParseInt('0x1f')).toBe(31);
  expect(tryParseInt('-0x10')).toBe(-16);
  expect(tryParseInt('')).toBeUndefined();
  expect(tryParseInt('12abc')).toBeUndefined();
  expect(tryParseInt('1.9')).toBeUndefined();
  expect(tryParseInt('1e3')).toBeUndefined();
});
