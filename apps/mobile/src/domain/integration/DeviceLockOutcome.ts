const values = ['unlocked', 'refused', 'noLock'] as const;

/**
 * What asking for the phone's own lock gave (MM-157): passed; not passed or
 * cancelled; or the phone has no lock set, so there is nothing to ask.
 */
export type DeviceLockOutcome = (typeof values)[number];

export const DeviceLockOutcome = { values } as const;
