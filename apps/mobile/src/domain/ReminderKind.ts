const values = ['weighIn', 'logFood', 'weeklyMeasurement', 'recoveryCheckIn'] as const;

/** A reminder the user can turn on (MM-146). Each is off until they do. */
export type ReminderKind = (typeof values)[number];

export const ReminderKind = { values } as const;
