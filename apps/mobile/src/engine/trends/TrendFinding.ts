import type { CalendarDate } from '../../domain/CalendarDate';
import type { InsightPriority } from '../InsightPriority';
import type { TrendAspect } from './TrendAspect';
import type { TrendDetector } from './TrendDetector';
import type { TrendDirection } from './TrendDirection';
import type { TrendSpan } from './TrendSpan';
import type { TrendTier } from './TrendTier';

/** What the trend engine found for one key, signal and aspect (MM-605). */
export interface TrendFinding {
  /** `signal:aspect` (`trendKeyOf`). */
  readonly key: string;
  readonly signal: string;
  readonly aspect: TrendAspect;
  readonly detector: TrendDetector;
  readonly direction: TrendDirection;
  readonly tier: TrendTier;

  /** The effect as it is said: rounded to the signal's step, never below δ, never a signed zero. Weeks, for an unlogged weekday. */
  readonly effect: number;
  readonly unit: string;
  readonly delta: number;

  /** The evidence's size and the count that agrees: days, or weeks for a day of the week. */
  readonly n: number;
  readonly k: number;

  readonly span: TrendSpan;
  readonly asOf: CalendarDate;

  /** When the change, run or regime began ("since 12 Oct"). */
  readonly onsetDate: CalendarDate | undefined;

  /** Eligible days over the span's calendar days. */
  readonly coverage: number;

  /** Coverage under 80%: the sentence says "on the days you logged". */
  readonly onLoggedDays: boolean;

  /** Too many estimated days to state a size: the data-quality signal speaks instead. */
  readonly sizeWithheld: boolean;

  /** A shift older than 28 days, which reads as a plain level claim. */
  readonly settled: boolean;

  /** D5's day: Sunday 0 to Saturday 6, or the weekend. */
  readonly weekday: number | 'weekend' | undefined;

  /** Planned Refeeds and Days off (MM-611) among the span's eligible days, named in the evidence. */
  readonly plannedDays: number;

  readonly priority: InsightPriority;
  readonly actionable: boolean;
  readonly order: number;
  readonly family: string | undefined;
  readonly goodDirection: TrendDirection | undefined;

  /** Findings merged into this one: lower-precedence detectors of the key, or a family's others. */
  readonly supporting: readonly TrendFinding[];
}
