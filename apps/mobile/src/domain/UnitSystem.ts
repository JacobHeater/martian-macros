const values = ['imperial', 'metric'] as const;

/** Display preference only; never affects stored values. */
export type UnitSystem = (typeof values)[number];

export const UnitSystem = { values } as const;
