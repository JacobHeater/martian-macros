import type { weekSpanProgress } from '../engine/analysis/weekSpanProgress';

/**
 * What opens 7d, said while the switcher offers 1d only (MM-620): "7d opens a
 * week after your first entry · 3 days to go", or "7d opens once 5 of the
 * last 7 days are fully logged · 3 so far".
 */
export function weekSpanProgressText(progress: NonNullable<ReturnType<typeof weekSpanProgress>>): string {
  if ('daysToGo' in progress) {
    return `7d opens a week after your first entry · ${progress.daysToGo} ${progress.daysToGo === 1 ? 'day' : 'days'} to go`;
  }
  return `7d opens once ${progress.needed} of the last 7 days are fully logged · ${progress.fullyLogged} so far`;
}
