import { toStringAsFixed } from '../lang/toStringAsFixed';

/** An amount as it is typed back and shown: "2", "1.5", "0.33". */
export function quantityText(value: number): string {
  if (Number.isInteger(value)) return String(value + 0);
  return toStringAsFixed(value, 2).replace(/0+$/, '').replace(/\.$/, '');
}
