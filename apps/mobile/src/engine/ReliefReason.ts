const values = ['recoverySignals', 'longDeficit'] as const;

/**
 * Why the coach offers to ease a deficit (MM-117, MM-135): the recovery
 * signals have failed, or the deficit has run twelve unbroken weeks.
 */
export type ReliefReason = (typeof values)[number];

export const ReliefReason = { values } as const;
