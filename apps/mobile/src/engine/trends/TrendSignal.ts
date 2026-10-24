import type { InsightPriority } from '../InsightPriority';
import type { TrendAspect } from './TrendAspect';
import type { TrendDay } from './TrendDay';
import type { TrendDetector } from './TrendDetector';
import type { TrendDirection } from './TrendDirection';
import type { TrendIneligibleReason } from './TrendIneligibleReason';

/**
 * One signal the trend engine reads (MM-605): the stories of MM-606 and
 * MM-609 each define theirs. `Input` is whatever the signal reads its series
 * from.
 */
export interface TrendSignal<Input> {
  /** Stable: with the aspect it is the key of the signal's findings and announcements. */
  readonly id: string;

  /** The daily series, one day per calendar day where known; a missing day is unlogged. Days after `asOf` are never read. */
  readonly series: (input: Input) => readonly TrendDay[];

  /** A further reason this signal does not count a day the series calls eligible, or undefined. */
  readonly eligibility?: ((day: TrendDay, input: Input) => TrendIneligibleReason | undefined) | undefined;

  /** The unit of values, targets and effects, as the format layer names it. */
  readonly unit: string;

  /** The materiality margin δ: no claim is made of a smaller effect, after rounding. */
  readonly delta: number;

  /** σ is never below this. */
  readonly sigmaFloor: number;

  /** Effects are said to the nearest this. */
  readonly roundTo: number;

  /** Correlated signals (MM-606) share a family, and keep their top finding per direction. */
  readonly family?: string | undefined;

  /** The safety class: where the signal's findings rank. */
  readonly priority: InsightPriority;

  /** The direction that is good news, if either is. */
  readonly goodDirection: TrendDirection | undefined;

  /** Whether a trend that ends is said ("resolved"). */
  readonly resolutionIsGoodNews: boolean;

  /** Whether the person can act on a finding, which ranks it higher. */
  readonly actionable: boolean;

  /** The signal's place in the catalog, the last tie-break of the ranking. */
  readonly order: number;

  /** The aspects the signal is read for. */
  readonly aspects: readonly TrendAspect[];

  /** The detectors that apply; one whose aspect is not listed does not run. */
  readonly detectors: readonly TrendDetector[];
}
