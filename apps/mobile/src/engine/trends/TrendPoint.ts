import type { TrendDay } from './TrendDay';

/** An eligible day of a trend series: one whose value is known (MM-605). */
export type TrendPoint = TrendDay & { readonly value: number };
