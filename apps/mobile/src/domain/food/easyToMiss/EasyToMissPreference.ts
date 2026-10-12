import type { CalendarDate } from '../../CalendarDate';

/**
 * The user's setting for the easy-to-miss line, and when it was last shown
 * (MM-152). Not health data; it lives with the display preferences.
 */
export class EasyToMissPreference {
  /** The line is on unless the user turns it off. */
  readonly enabled: boolean;

  /** The last day the line was shown, or undefined if never. */
  readonly lastShown: CalendarDate | undefined;

  constructor(init: { enabled?: boolean; lastShown?: CalendarDate | undefined } = {}) {
    this.enabled = init.enabled ?? true;
    this.lastShown = init.lastShown;
  }
}
