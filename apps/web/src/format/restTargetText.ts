import { elapsedText } from './elapsedText';

/** A rest target as the user chose it (MM-191): "2:00", or "None". */
export function restTargetText(targetMs: number | undefined): string {
  return targetMs === undefined ? 'None' : elapsedText(targetMs);
}
