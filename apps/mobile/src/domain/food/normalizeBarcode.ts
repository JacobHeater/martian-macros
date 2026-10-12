import type { BarcodeSymbology } from './BarcodeSymbology';

const gtinLength = 14;
const zero = 0x30;

/**
 * The 14-digit GTIN for `raw`, or undefined when it cannot be one (MM-54).
 *
 * Anything that is not a digit is dropped. Give `symbology` when the scanner
 * knows it: a UPC-E is expanded to its UPC-A first. Without it, eight digits
 * are read as an EAN-8 and never as a UPC-E, and shorter or longer codes are
 * padded on the left, which restores a zero that a source lost when it stored
 * the code as a number. The check digit must verify.
 */
export function normalizeBarcode(
  raw: string,
  { symbology }: { symbology?: BarcodeSymbology | undefined } = {},
): string | undefined {
  let digits = raw.replace(/\D/g, '');
  if (symbology === 'upcE') {
    const expanded = expandUpcE(digits);
    if (expanded === undefined) return undefined;
    digits = expanded;
  } else if (digits.length < 8 || digits.length > gtinLength) {
    return undefined;
  }
  const padded = digits.padStart(gtinLength, '0');
  return checkDigitHolds(padded) ? padded : undefined;
}

function checkDigitHolds(gtin14: string): boolean {
  let sum = 0;
  for (let i = 0; i < gtin14.length - 1; i++) {
    const digit = gtin14.charCodeAt(i) - zero;
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  return (10 - (sum % 10)) % 10 === gtin14.charCodeAt(gtin14.length - 1) - zero;
}

/** UPC-E (number system, six digits, check digit) to its 12-digit UPC-A. */
function expandUpcE(digits: string): string | undefined {
  if (digits.length !== 8) return undefined;
  const system = digits.charAt(0);
  if (system !== '0' && system !== '1') return undefined;
  const d = (i: number) => digits.charAt(i + 1);
  const check = digits.charAt(7);
  let body: string;
  switch (d(5)) {
    case '0':
    case '1':
    case '2':
      body = `${d(0)}${d(1)}${d(5)}0000${d(2)}${d(3)}${d(4)}`;
      break;
    case '3':
      body = `${d(0)}${d(1)}${d(2)}00000${d(3)}${d(4)}`;
      break;
    case '4':
      body = `${d(0)}${d(1)}${d(2)}${d(3)}00000${d(4)}`;
      break;
    default:
      body = `${d(0)}${d(1)}${d(2)}${d(3)}${d(4)}0000${d(5)}`;
  }
  return `${system}${body}${check}`;
}
