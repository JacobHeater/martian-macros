import { expect, it } from 'vitest';
import { normalizeBarcode } from '../../src/domain';

const gtin = '00042100005264';

/**
 * The GS1 check digit for a code without one, written independently of the
 * implementation under test.
 */
function check(withoutCheck: string): string {
  let sum = 0;
  const digits = withoutCheck.split('').map(Number);
  digits.forEach((digit, i) => {
    const fromRight = digits.length - i; // 1 is next to the check digit
    sum += digit * (fromRight % 2 === 1 ? 3 : 1);
  });
  return `${(10 - (sum % 10)) % 10}`;
}

it('UPC-A, EAN-13 with a leading zero and UPC-E give one GTIN-14', () => {
  expect(normalizeBarcode('042100005264')).toBe(gtin);
  expect(normalizeBarcode('0042100005264')).toBe(gtin);
  expect(normalizeBarcode('04252614', { symbology: 'upcE' })).toBe(gtin);
  expect(normalizeBarcode('0 42100-005264'), 'non-digits go').toBe(gtin);
});

it('a leading zero lost by the source is restored', () => {
  expect(normalizeBarcode('42100005264')).toBe(gtin);
});

it('a wrong check digit is rejected', () => {
  expect(normalizeBarcode('042100005265')).toBeUndefined();
  expect(normalizeBarcode('04252615', { symbology: 'upcE' })).toBeUndefined();
});

it('eight digits are an EAN-8 unless told they are UPC-E', () => {
  expect(normalizeBarcode('96385074')).toBe('00000096385074');
  expect(normalizeBarcode('96385074', { symbology: 'upcE' })).toBeUndefined();
});

it('every UPC-E expansion pattern gives the UPC-A it should', () => {
  // [UPC-E six digits, the UPC-A's first eleven digits], one per pattern.
  const cases = [
    ['123450', '01200000345'],
    ['123451', '01210000345'],
    ['123453', '01230000045'],
    ['123454', '01234000005'],
    ['123456', '01234500006'],
  ] as const;
  for (const [body, upcA] of cases) {
    const digit = check(upcA);
    expect(normalizeBarcode(`0${body}${digit}`, { symbology: 'upcE' }), `UPC-E 0${body}`).toBe(`00${upcA}${digit}`);
  }
});

it('nonsense is rejected', () => {
  expect(normalizeBarcode('')).toBeUndefined();
  expect(normalizeBarcode('12345')).toBeUndefined();
  expect(normalizeBarcode('123456789012345')).toBeUndefined();
});
