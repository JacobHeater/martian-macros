import type { CalendarDate } from './CalendarDate';
import type { PauseReason } from './PauseReason';

interface PauseInit {
  from: CalendarDate;
  to: CalendarDate;
  reason: PauseReason;
  extended?: boolean;
}

/**
 * A stretch of days the user has said will not be tracked: a holiday, an
 * illness, an injury (MM-148). A planned break, not a lapse.
 */
export class Pause {
  /** The first and last paused day. */
  readonly from: CalendarDate;
  readonly to: CalendarDate;
  readonly reason: PauseReason;

  /** Whether the end date has been moved later; that is allowed once. */
  readonly extended: boolean;

  constructor(init: PauseInit) {
    this.from = init.from;
    this.to = init.to;
    this.reason = init.reason;
    this.extended = init.extended ?? false;
  }

  get days(): number {
    return this.from.daysUntil(this.to) + 1;
  }

  /** The first day after the pause. */
  get resumesOn(): CalendarDate {
    return this.to.addDays(1);
  }

  covers(date: CalendarDate): boolean {
    return !date.isBefore(this.from) && !date.isAfter(this.to);
  }

  copyWith({ to, extended }: { to?: CalendarDate; extended?: boolean }): Pause {
    return new Pause({
      from: this.from,
      to: to ?? this.to,
      reason: this.reason,
      extended: extended ?? this.extended,
    });
  }
}
