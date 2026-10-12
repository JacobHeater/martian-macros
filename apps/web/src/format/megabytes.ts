import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { toStringAsFixed } from '../lang/toStringAsFixed';

/**
 * A size in megabytes for people, counted the way the phone's own storage
 * screen counts them (1 MB is a million bytes): "47 MB", "0.8 MB".
 */
export function megabytes(bytes: number): string {
  const mb = bytes / 1000000;
  return mb >= 10 ? `${roundHalfAwayFromZero(mb)} MB` : `${toStringAsFixed(mb, 1)} MB`;
}
