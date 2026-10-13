import type { CalendarDate } from './CalendarDate';

/**
 * That the person agreed to the terms of use, and to which version of them
 * (MM-242). Kept on the device and nowhere else.
 */
export class TermsAcceptance {
  /** The version of the terms that was agreed to. */
  readonly version: number;

  /** The calendar day it was agreed to. */
  readonly acceptedOn: CalendarDate;

  constructor(init: { version: number; acceptedOn: CalendarDate }) {
    this.version = init.version;
    this.acceptedOn = init.acceptedOn;
  }
}
