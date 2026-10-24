import type { CalendarDate } from '../../domain/CalendarDate';

/**
 * A record that the coach's finding `findingId` (MM-604's `CoachFinding.id`,
 * the trend key or `day:<signal>`) was dismissed on `dismissedOn` (MM-605).
 */
export interface FindingDismissal {
  readonly findingId: string;
  readonly dismissedOn: CalendarDate;
}
