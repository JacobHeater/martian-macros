import type { CalendarDate } from '../../domain/CalendarDate';
import type { TrendDirection } from './TrendDirection';
import type { TrendFigures } from './TrendFigures';
import type { TrendTier } from './TrendTier';
import type { TrendTransition } from './TrendTransition';

/**
 * One entry of the append-only announcement log (MM-605): what was said
 * about a key, and the state changes (held, and the return from it) the
 * state machine reads back. Pending and the exit counts are not stored:
 * they are derived by evaluating as of E, E−1 and E−2.
 */
export interface TrendAnnouncement {
  readonly key: string;
  readonly transition: Exclude<TrendTransition, 'none'>;

  /** The evaluation day (E, yesterday) the entry was made for. */
  readonly on: CalendarDate;
  readonly direction: TrendDirection;
  readonly onsetDate: CalendarDate | undefined;
  readonly figures: TrendFigures;
  readonly tier: TrendTier;
  readonly rulesVersion: number;
}
