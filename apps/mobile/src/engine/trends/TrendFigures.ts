import type { TrendSpan } from './TrendSpan';

/** The figures an announcement said (MM-605), compared when a continuing trend may be re-announced. */
export interface TrendFigures {
  readonly effect: number;
  readonly unit: string;
  readonly n: number;
  readonly k: number;
  readonly span: TrendSpan;
  readonly coverage: number;
}
