/**
 * The imported sleep that counts for a night (MM-250): the sessions of one
 * source, summed, kept against the day the night ended on.
 */
export interface NightOfSleep {
  /** Midnight, local time, at the start of the day the night ended on. */
  readonly day: Date;

  /** Minutes asleep across the sessions counted. */
  readonly minutes: number;

  /** The source whose sessions were counted, as it names itself, or '' when the platform named none (MM-395). */
  readonly sourceName: string;

  /** How many sessions were summed. */
  readonly sessions: number;
}
