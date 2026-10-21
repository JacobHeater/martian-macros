const values = ['onTheMinute', 'notAsked', 'withinAnHour'] as const;

/**
 * How the phone times a reminder (MM-248): `onTheMinute` when exact alarms
 * are allowed (or need no permission); otherwise within an hour of its
 * time, `notAsked` until the person has been asked once, `withinAnHour`
 * after they declined.
 */
export type ReminderTiming = (typeof values)[number];

export const ReminderTiming = { values } as const;
