import type { CalendarDate } from './CalendarDate';
import type { ReminderKind } from './ReminderKind';

interface ReminderSettingInit {
  kind: ReminderKind;
  minuteOfDay: number;
  enabled?: boolean;
  countFrom?: CalendarDate | undefined;
}

/** One reminder's setting (MM-146). */
export class ReminderSetting {
  readonly kind: ReminderKind;
  readonly enabled: boolean;

  /** The local time it is sent, in minutes after midnight. */
  readonly minuteOfDay: number;

  /**
   * The day ignored reminders are counted from: the day it was turned on,
   * or the day the user last chose to keep it. Undefined while it has never
   * been on.
   */
  readonly countFrom: CalendarDate | undefined;

  constructor(init: ReminderSettingInit) {
    this.kind = init.kind;
    this.minuteOfDay = init.minuteOfDay;
    this.enabled = init.enabled ?? false;
    this.countFrom = init.countFrom;
  }

  copyWith({
    enabled,
    minuteOfDay,
    countFrom,
  }: {
    enabled?: boolean;
    minuteOfDay?: number;
    countFrom?: CalendarDate;
  }): ReminderSetting {
    return new ReminderSetting({
      kind: this.kind,
      enabled: enabled ?? this.enabled,
      minuteOfDay: minuteOfDay ?? this.minuteOfDay,
      countFrom: countFrom ?? this.countFrom,
    });
  }
}
