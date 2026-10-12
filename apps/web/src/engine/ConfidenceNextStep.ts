const values = ['completeFoodLog', 'recordWeight', 'waitForStability', 'reviewFoodLogging', 'keepLogging'] as const;

export type ConfidenceNextStep = (typeof values)[number];

export const ConfidenceNextStep = { values } as const;
