import { toStringAsFixed } from '../../lang/toStringAsFixed';

/**
 * A multiple of a limit, to one decimal (MM-617's grammar): 3.846 is
 * "3.8×", 2 is "2×".
 */
export function multipleText(multiple: number): string {
  return `${toStringAsFixed(multiple, 1).replace(/\.0$/, '')}×`;
}
