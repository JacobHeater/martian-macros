import type { CalendarDate } from '../domain/CalendarDate';
import type { DayKind } from '../domain/DayKind';
import type { Clock } from '../domain/integration/Clock';
import type { DayKindWriter } from '../domain/repositories/DayKindWriter';
import { StateError } from '../lang/StateError';

/**
 * Marks a day a Refeed or a Day off, or clears its mark (MM-611). Any day up
 * to today can be marked; a day still to come cannot, since a plan is not a
 * record. The mark changes no calculation.
 */
export class DayKindController {
  private readonly dayKinds: DayKindWriter;
  private readonly clock: Clock;

  constructor({ dayKinds, clock }: { dayKinds: DayKindWriter; clock: Clock }) {
    this.dayKinds = dayKinds;
    this.clock = clock;
  }

  /** Whether `date` can be marked: today or a day before it. */
  canMark(date: CalendarDate): boolean {
    return !date.isAfter(this.clock.today());
  }

  /** Marks `date` as `kind`, or clears its mark with 'none'. A day still to come is refused. */
  async mark(date: CalendarDate, kind: DayKind): Promise<void> {
    if (!this.canMark(date)) throw new StateError(`${date.toString()} is still to come, so it cannot be marked.`);
    await this.dayKinds.setDayKind(date, kind);
  }
}
