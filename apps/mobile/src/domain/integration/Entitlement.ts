import type { CalendarDate } from '../CalendarDate';
import type { EntitlementStatus } from './EntitlementStatus';

/** The user's current entitlement. */
export class Entitlement {
  readonly status: EntitlementStatus;

  /** The last day of the trial, while `status` is trial. */
  readonly trialEndsOn: CalendarDate | undefined;

  constructor(status: EntitlementStatus, { trialEndsOn }: { trialEndsOn?: CalendarDate | undefined } = {}) {
    this.status = status;
    this.trialEndsOn = trialEndsOn;
  }

  get coachAvailable(): boolean {
    return this.status !== 'free';
  }
}
