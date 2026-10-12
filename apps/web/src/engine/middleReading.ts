import { ArgumentError } from '../lang/ArgumentError';

/**
 * The measurement three readings stand for (MM-155): the middle one, so a
 * single odd reading does not move it. For one reading, that reading.
 */
export function middleReading(readings: readonly number[]): number {
  if (readings.length !== 1 && readings.length !== 3) {
    throw new ArgumentError(`Invalid readings (${readings.join(', ')}): One reading or three.`);
  }
  const sorted = [...readings].sort((a, b) => a - b);
  return sorted[Math.trunc(readings.length / 2)] as number;
}
