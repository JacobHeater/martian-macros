const values = [
  /** Two weekly check-ins running with most answers at the hard end (MM-117). */
  'hardCheckIns',
  /** Sleep averaged under six hours over the last fourteen nights (MM-252). */
  'shortSleep',
] as const;

/** What made the coach offer to ease a deficit (MM-117, MM-252). An offer has at least one. */
export type ReliefSignal = (typeof values)[number];

export const ReliefSignal = { values } as const;
