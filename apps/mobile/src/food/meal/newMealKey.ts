/**
 * A key no other meal has (MM-587): what groups one meal's foods, and
 * nothing else. 128 random bits from `getRandomValues`, which every page
 * has; `randomUUID` exists only in a secure context, and a live run on the
 * phone is served over plain http (MM-591).
 */
export const newMealKey = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('');
