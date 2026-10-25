import type { MeasuredChange } from '../MeasuredChange';

/** The way a finding points (MM-605): a `MeasuredChange` that is a change. */
export type TrendDirection = Exclude<MeasuredChange, 'noClearChange'>;
