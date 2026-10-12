const values = ['maintenanceWeek', 'slowerPace', 'carryOn'] as const;

/** What the user can do with the offer to ease a deficit (MM-117). */
export type ReliefChoice = (typeof values)[number];

export const ReliefChoice = { values } as const;
