const values = ['food', 'water', 'weight', 'workouts'] as const;

/**
 * What the app can write to the phone's health platform (MM-70, MM-314,
 * MM-513, MM-489): the food logged, the water logged, the weight typed and
 * the workouts finished. Each is turned on by itself in Settings, with a
 * write permission of its own, asked for apart from reading.
 */
export type HealthWriteKind = (typeof values)[number];

export const HealthWriteKind = { values } as const;
