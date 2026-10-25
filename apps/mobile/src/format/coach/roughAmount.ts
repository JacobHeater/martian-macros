import { groupThousands } from '../../lang/groupThousands';

/**
 * An estimate as a coach says it (MM-617's grammar): to the nearest 5
 * under 100 and the nearest 10 from 100, so "about 25 g short" never reads
 * as more precise than an average over days is. 23.4 is "25", 132 is
 * "130", 1,054 is "1,050".
 */
export function roughAmount(value: number): string {
  const step = Math.abs(value) < 100 ? 5 : 10;
  return groupThousands(Math.round(value / step) * step + 0);
}
