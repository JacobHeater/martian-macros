import type { TrendAspect } from './TrendAspect';

/** The key of a signal's findings and announcements for one aspect (MM-605). */
export function trendKeyOf(signal: string, aspect: TrendAspect): string {
  return `${signal}:${aspect}`;
}
