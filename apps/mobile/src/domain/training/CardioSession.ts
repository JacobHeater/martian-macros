import { CalendarDate } from '../CalendarDate';
import type { CardioActivity } from './CardioActivity';

const minuteMs = 60 * 1000;

interface CardioSessionInit {
  platformId: string;
  sourceName: string;
  activity: CardioActivity;
  start: Date;
  end: Date;
}

/**
 * A cardio session as the wearable recorded it (MM-677): the platform's
 * own id for it, which is how a re-read changes it and never adds a second
 * (MM-71), the app or device that wrote it, its activity and its span. The
 * app never times or edits one: the platform is the only source of truth.
 * It counts toward the local day it started.
 */
export class CardioSession {
  readonly platformId: string;
  readonly sourceName: string;
  readonly activity: CardioActivity;
  readonly start: Date;
  readonly end: Date;

  constructor(init: CardioSessionInit) {
    this.platformId = init.platformId;
    this.sourceName = init.sourceName;
    this.activity = init.activity;
    this.start = init.start;
    this.end = init.end;
  }

  /** The day it counts toward: the local day it started. */
  get date(): CalendarDate {
    return CalendarDate.fromDate(this.start);
  }

  /** Its length in whole minutes, never under zero. */
  get minutes(): number {
    return Math.max(0, Math.round((this.end.getTime() - this.start.getTime()) / minuteMs));
  }

  /** Whether `other` is this session with the same span, activity and source: nothing to save again. */
  sameAs(other: CardioSession): boolean {
    return (
      this.platformId === other.platformId &&
      this.sourceName === other.sourceName &&
      this.activity === other.activity &&
      this.start.getTime() === other.start.getTime() &&
      this.end.getTime() === other.end.getTime()
    );
  }
}
