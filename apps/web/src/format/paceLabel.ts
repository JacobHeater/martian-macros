import { toStringAsFixed } from '../lang/toStringAsFixed';

/** A fat-loss pace as text, such as "0.5% a week" or "0.75% a week". */
export function paceLabel(fraction: number): string {
  const percent = fraction * 100;
  const text = Number.isInteger(percent) ? toStringAsFixed(percent, 0) : toStringAsFixed(percent, 2).replace(/0$/, '');
  return `${text}% a week`;
}
